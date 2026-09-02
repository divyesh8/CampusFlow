"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap } from "lucide-react";
import { UNIVERSES } from "@/config/constants";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isDemo } = useAuth();
  const [mode, setMode] = useState<"university" | "manual">("university");
  const [university, setUniversity] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn(email || studentId, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  };

  const handleManualContinue = async () => {
    setLoading(true);
    const result = await signIn("demo@campusflow.app", "demo");
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-foreground flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-background" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">CampusFlow</h1>
          <p className="text-muted-foreground">Everything about college. One dashboard.</p>
        </div>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex rounded-lg bg-muted p-1 mb-6">
              <button
                onClick={() => setMode("university")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === "university" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                University Login
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === "manual" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                Manual Account
              </button>
            </div>

            {mode === "university" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label>University</Label>
                  <Select value={university} onValueChange={(v) => { if (v) setUniversity(v); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your university" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIVERSES.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Student ID / Net ID</Label>
                  <Input
                    placeholder="e.g. RA2311003010001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="your.email@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="University password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Continue with a manually managed account. You can add your academic data later.
                </p>
                <Button className="w-full" onClick={handleManualContinue} disabled={loading}>
                  {loading ? "Setting up..." : "Continue with Manual Account"}
                </Button>
              </div>
            )}

            {isDemo && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center font-medium">
                  Demo Mode — All data is fictional
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Your academic information belongs to you.
        </p>
      </div>
    </div>
  );
}
