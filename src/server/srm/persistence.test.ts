import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const db = new PGlite();
const first = "10000000-0000-4000-8000-000000000001";
const second = "10000000-0000-4000-8000-000000000002";
async function save(user: string, component: string, data: unknown) {
  return db.query("SELECT persist_srm_component($1,$2,$3::jsonb)", [user, component, JSON.stringify(data)]);
}
beforeAll(async () => {
  await db.exec(`CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
    CREATE FUNCTION uuid_generate_v4() RETURNS uuid LANGUAGE sql AS 'SELECT gen_random_uuid()';`);
  for (const name of ["001_initial_schema.sql", "002_rls_policies.sql", "003_srm_sessions.sql", "004_srm_pipeline.sql"]) {
    const sql = readFileSync(`supabase/migrations/${name}`, "utf8").replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', "");
    await db.exec(sql);
  }
  await db.query("INSERT INTO auth.users VALUES($1),($2)", [first, second]);
  await db.query(`INSERT INTO profiles(id,university_id,student_id,net_id,name,email,semester)
    SELECT $1,id,'RA2000000000001','fixture1','Fixture One','one@example.invalid',3 FROM universities WHERE short_name='SRM'`, [first]);
  await db.query(`INSERT INTO profiles(id,university_id,student_id,net_id,name,email,semester)
    SELECT $1,id,'RA2000000000002','fixture2','Fixture Two','two@example.invalid',3 FROM universities WHERE short_name='SRM'`, [second]);
}, 30000);
afterAll(async () => { await db.close(); });

describe("real PostgreSQL migration and transaction behavior (PGlite)", () => {
  it("repeated sync updates counters without duplicates and isolates users", async () => {
    await save(first, "attendance", [{ code: "TEST101", name: "Fixture Course", attended: 8, conducted: 10 }]);
    await save(first, "attendance", [{ code: "TEST101", name: "Fixture Course", attended: 9, conducted: 11 }]);
    await save(second, "attendance", [{ code: "TEST101", name: "Fixture Course", attended: 2, conducted: 10 }]);
    const { rows } = await db.query<{ attended: number; user_id: string }>("SELECT attended,user_id FROM attendance_snapshots ORDER BY user_id");
    expect(rows).toEqual([{ attended: 9, user_id: first }, { attended: 2, user_id: second }]);
  });
  it("rolls back an entire component and preserves its last success on malformed data", async () => {
    await expect(save(first, "attendance", [{ code: "TEST101", name: "Fixture Course", attended: 10, conducted: 11 },
      { code: "TEST102", name: "Bad Course", attended: 20, conducted: 10 }])).rejects.toThrow();
    const { rows } = await db.query<{ attended: number }>("SELECT attended FROM attendance_snapshots WHERE user_id=$1", [first]);
    expect(rows[0].attended).toBe(9);
    expect((await db.query("SELECT id FROM subjects WHERE code='TEST102'")).rows).toHaveLength(0);
  });
  it("preserves decimal/absent marks and idempotent assessment IDs", async () => {
    const row = { code: "TEST101", name: "Fixture Course", assessment: "Test A", scored: 7.5, total: 10, absent: false };
    await save(first, "marks", [row]);
    await save(first, "marks", [{ ...row, scored: null, absent: true }]);
    const { rows } = await db.query<{ marks_obtained: number | null; absent: boolean }>("SELECT marks_obtained,absent FROM marks WHERE user_id=$1", [first]);
    expect(rows).toEqual([{ marks_obtained: null, absent: true }]);
  });
  it("records explicit empty data without deleting history", async () => {
    await save(first, "marks", []);
    const { rows } = await db.query<{ record_ids: string[] }>("SELECT record_ids FROM srm_sync_components WHERE user_id=$1 AND component='marks'", [first]);
    expect(rows[0].record_ids).toEqual([]);
    expect((await db.query("SELECT id FROM marks WHERE user_id=$1", [first])).rows).toHaveLength(1);
  });
  it("prevents overlapping sync and shares rate limits", async () => {
    const a = await db.query<{ begin_srm_sync: string }>("SELECT begin_srm_sync($1)", [first]);
    const b = await db.query<{ begin_srm_sync: string | null }>("SELECT begin_srm_sync($1)", [first]);
    expect(a.rows[0].begin_srm_sync).toBeTruthy();
    expect(b.rows[0].begin_srm_sync).toBeNull();
    await db.query("SELECT consume_srm_rate_limit('fixture',1,300)");
    const { rows } = await db.query<{ consume_srm_rate_limit: boolean }>("SELECT consume_srm_rate_limit('fixture',1,300)");
    expect(rows[0].consume_srm_rate_limit).toBe(false);
  });
  it("denies RPC execution and cross-student SRM subjects to ordinary users", async () => {
    await db.exec("GRANT USAGE ON SCHEMA public,auth TO authenticated; GRANT SELECT ON profiles,subjects TO authenticated;");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [first]);
    await db.exec("SET ROLE authenticated");
    try {
      const { rows } = await db.query<{ srm_owner_id: string }>("SELECT srm_owner_id FROM subjects");
      expect(rows.every((row) => row.srm_owner_id === first)).toBe(true);
      expect(rows.length).toBeGreaterThan(0);
      await expect(db.query("SELECT persist_srm_component($1,'marks','[]')", [second])).rejects.toThrow(/permission denied/);
    } finally { await db.exec("RESET ROLE"); }
  });
});
