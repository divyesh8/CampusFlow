"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CampusFlowLogo } from "@/components/brand/campusflow-logo";
import { Loader2, Shield } from "lucide-react";

type Status = "disconnected" | "loading" | "ready" | "authenticating" | "syncing";
export default function LoginPage() {
  const router = useRouter();
  const { connect, loading } = useAuth();
  const [status, setStatus] = useState<Status>("disconnected");
  const [challenge, setChallenge] = useState<{ sessionId: string; captcha: string } | null>(null);
  const [netId, setNetId] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [error, setError] = useState("");
  const busy = loading || status === "loading" || status === "authenticating" || status === "syncing";
  async function loadCaptcha() {
    setStatus("loading"); setError(""); setPassword(""); setCaptcha(""); setChallenge(null);
    try {
      const response = await fetch("/api/srm/session", { method: "POST", signal: AbortSignal.timeout(60_000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load SRM Student Portal.");
      setChallenge(data); setStatus("ready");
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "SRM took too long to respond. Try again.");
      setStatus("disconnected");
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge || busy) return;
    setStatus("authenticating"); setError("");
    const pending = connect({ sessionId: challenge.sessionId, netId: netId.trim(), password, captcha: captcha.trim() });
    setPassword(""); setCaptcha("");
    const result = await pending;
    setChallenge(null);
    if (result.error) { setError(result.error); setStatus("disconnected"); return; }
    setStatus("syncing");
    router.replace("/dashboard");
  }
  return <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="w-full max-w-sm space-y-6 py-8">
      <div className="text-center space-y-2">
        <div className="flex justify-center"><CampusFlowLogo size={48} /></div>
        <h1 className="text-2xl font-bold tracking-tight">CampusFlow</h1>
        <p className="text-sm text-muted-foreground">Your SRM academics, simplified.</p>
      </div>
      <Card className="border-border"><CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium"><Shield className="h-4 w-4" />Connect SRM Student Portal</div>
        <p className="text-xs text-muted-foreground">Load the official CAPTCHA, then enter your own NetID and password. Your password is used only for this login and is never saved by CampusFlow.</p>
        {challenge && <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="netid">SRM NetID</Label>
            <Input id="netid" value={netId} onChange={e => setNetId(e.target.value)} placeholder="Without @srmist.edu.in" maxLength={6} autoComplete="username" required disabled={busy} /></div>
          <div className="space-y-1.5"><Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} maxLength={256} autoComplete="off" required disabled={busy} /></div>
          <div className="space-y-2"><Label htmlFor="captcha">CAPTCHA</Label>
            {/* Official image is an ephemeral data URL, never sent to the image optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={challenge.captcha} alt="Official SRM CAPTCHA — enter the characters shown" width={175} height={45} className="border rounded bg-white" />
            <Input id="captcha" value={captcha} onChange={e => setCaptcha(e.target.value)} maxLength={8} autoComplete="off" required disabled={busy} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{status === "syncing" ? "Syncing academics…" : "Authenticating…"}</> : "Connect SRM"}</Button>
        </form>}
        <Button type="button" variant={challenge ? "outline" : "default"} className="w-full" onClick={loadCaptcha} disabled={busy}>
          {status === "loading" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading SRM Portal…</> : challenge ? "Load a new CAPTCHA" : "Load SRM CAPTCHA"}
        </Button>
        {error && <p role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
        <p aria-live="polite" className="text-xs text-muted-foreground">{status === "ready" ? "CAPTCHA ready. Sessions expire after 15 minutes of inactivity." : ""}</p>
      </CardContent></Card>
      <p className="text-center text-[10px] text-muted-foreground leading-relaxed">CampusFlow is an independent, unofficial student project, not affiliated with or endorsed by SRMIST.</p>
    </div>
  </div>;
}
