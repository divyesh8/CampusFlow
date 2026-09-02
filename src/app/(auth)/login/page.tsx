"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CampusFlowLogo } from "@/components/brand/campusflow-logo";
import { Loader2, AlertTriangle, Shield } from "lucide-react";

type LoginStatus =
  | "idle"
  | "connecting"
  | "authenticating"
  | "loading_profile"
  | "captcha_required"
  | "error";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithCaptcha } = useAuth();
  const [netId, setNetId] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [error, setError] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaDigest, setCaptchaDigest] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const getStatusText = () => {
    switch (status) {
      case "connecting":
        return "Connecting to SRM\u2026";
      case "authenticating":
        return "Authenticating\u2026";
      case "loading_profile":
        return "Loading your profile\u2026";
      case "captcha_required":
        return "Enter the CAPTCHA below";
      default:
        return "Connect SRM";
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!netId.trim() || !password.trim()) {
      setError("Please enter both NetID and password.");
      return;
    }

    setStatus("connecting");
    setError("");

    await new Promise((r) => setTimeout(r, 500));
    setStatus("authenticating");

    const result = await signIn(netId.trim(), password);

    if (result.requiresCaptcha) {
      setStatus("captcha_required");
      setCaptchaImage(result.captchaImage || "");
      setCaptchaDigest(result.captchaDigest || "");
      return;
    }

    if (result.error) {
      setStatus("error");
      setError(result.error);
      return;
    }

    setStatus("loading_profile");
    router.push("/dashboard");
  };

  const handleCaptchaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaAnswer.trim()) {
      setError("Please enter the CAPTCHA answer.");
      return;
    }

    setStatus("authenticating");
    setError("");

    const result = await signInWithCaptcha(
      netId.trim(),
      password,
      captchaDigest,
      captchaAnswer.trim()
    );

    if (result.error) {
      setStatus("error");
      setError(result.error);
      return;
    }

    setStatus("loading_profile");
    router.push("/dashboard");
  };

  const isLoading = status === "connecting" || status === "authenticating" || status === "loading_profile";

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
            {status === "captcha_required" ? (
              <form onSubmit={handleCaptchaSubmit} className="space-y-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Shield className="h-4 w-4" />
                  <p className="text-sm font-medium">Verification Required</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  SRM requires CAPTCHA verification. Please enter the text from the image below.
                </p>

                {captchaImage && (
                  <div className="flex justify-center">
                    <img
                      src={captchaImage}
                      alt="CAPTCHA verification"
                      className="border rounded-lg max-h-24"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">CAPTCHA Answer</Label>
                  <Input
                    placeholder="Enter the text you see"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    autoComplete="off"
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying\u2026
                    </span>
                  ) : (
                    "Verify & Connect"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStatus("idle");
                    setError("");
                    setCaptchaImage("");
                    setCaptchaDigest("");
                    setCaptchaAnswer("");
                  }}
                >
                  Cancel
                </Button>
              </form>
            ) : (
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>

                {status === "idle" && error && (
                  <div className="flex items-start gap-2 text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {getStatusText()}
                    </span>
                  ) : (
                    "Connect SRM"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
          CampusFlow uses your credentials only to authenticate with SRM.
          <br />
          Your password is never stored.
        </p>
      </div>
    </div>
  );
}
