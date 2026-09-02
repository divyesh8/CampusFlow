"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CampusFlowLogo } from "@/components/brand/campusflow-logo";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [netId, setNetId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!netId.trim() || !password.trim()) {
      setError("Please enter both NetID and password.");
      return;
    }
    setLoading(true);
    setError("");

    const result = await signIn(netId.trim(), password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <CampusFlowLogo size={48} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CampusFlow</h1>
          <p className="text-sm text-muted-foreground">Your SRM academics, simplified.</p>
        </div>

        <Card className="border-border">
          <CardContent className="p-5">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Net ID</Label>
                <Input
                  placeholder="e.g. dk6154"
                  value={netId}
                  onChange={(e) => setNetId(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Password</Label>
                <Input
                  type="password"
                  placeholder="SRM portal password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting\u2026
                  </span>
                ) : (
                  "Connect SRM"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
          CampusFlow uses your credentials only to authenticate with SRM.
        </p>
      </div>
    </div>
  );
}
