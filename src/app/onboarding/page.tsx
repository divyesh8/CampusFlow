"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, ArrowRight, ArrowLeft } from "lucide-react";
import { UNIVERSES } from "@/config/constants";

const steps = [
  { title: "University", description: "Select your university" },
  { title: "Academic Info", description: "Tell us about your program" },
  { title: "Preferences", description: "Set your preferences" },
];

const departments = [
  "Computer Science and Engineering",
  "Information Technology",
  "Electronics and Communication Engineering",
  "Electrical and Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    university: "",
    campus: "",
    program: "B.Tech",
    department: "",
    year: "2",
    semester: "3",
    section: "",
    attendanceThreshold: "75",
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleComplete = () => {
    localStorage.setItem("campusflow_profile", JSON.stringify({
      ...form,
      onboarded: true,
    }));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-foreground flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-background" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Welcome to CampusFlow</h1>
          <p className="text-sm text-muted-foreground">{steps[step].description}</p>
        </div>

        <div className="flex gap-2 justify-center">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-colors ${
                i <= step ? "bg-foreground w-12" : "bg-muted w-8"
              }`}
            />
          ))}
        </div>

        <Card className="border-border">
          <CardContent className="p-6">
            {step === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>University</Label>
                  <Select value={form.university} onValueChange={(v) => { if (v) update("university", v); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your university" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIVERSES.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Campus</Label>
                  <Input
                    placeholder="e.g. Main Campus"
                    value={form.campus}
                    onChange={(e) => update("campus", e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select value={form.program} onValueChange={(v) => { if (v) update("program", v); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B.Tech">B.Tech</SelectItem>
                      <SelectItem value="M.Tech">M.Tech</SelectItem>
                      <SelectItem value="BCA">BCA</SelectItem>
                      <SelectItem value="MCA">MCA</SelectItem>
                      <SelectItem value="B.Sc">B.Sc</SelectItem>
                      <SelectItem value="M.Sc">M.Sc</SelectItem>
                      <SelectItem value="MBA">MBA</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={form.department} onValueChange={(v) => { if (v) update("department", v); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={form.year} onValueChange={(v) => { if (v) update("year", v); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={form.semester} onValueChange={(v) => { if (v) update("semester", v); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Section (optional)</Label>
                  <Input
                    placeholder="e.g. A"
                    value={form.section}
                    onChange={(e) => update("section", e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Attendance Threshold</Label>
                  <Select value={form.attendanceThreshold} onValueChange={(v) => { if (v) update("attendanceThreshold", v); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="70">70%</SelectItem>
                      <SelectItem value="75">75% (Default)</SelectItem>
                      <SelectItem value="80">80%</SelectItem>
                      <SelectItem value="85">85%</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    University-specific requirement. You can change this later.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm font-medium">You&apos;re all set!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can customize subjects and import data from your university later.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={step === steps.length - 1 ? handleComplete : () => setStep((s) => s + 1)}
          >
            {step === steps.length - 1 ? "Get Started" : "Next"}
            {step < steps.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
