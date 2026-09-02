"use client";

import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon, Monitor, Download, Trash2, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences</p>
      </div>

      {/* Appearance */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Select your preferred theme</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Academic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Attendance Threshold</p>
              <p className="text-xs text-muted-foreground">Set your required attendance percentage</p>
            </div>
            <Select defaultValue={String(user?.attendanceThreshold || 75)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="70">70%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="85">85%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Attendance alerts", description: "Get notified when attendance drops" },
            { label: "Marks updates", description: "When new marks are published" },
            { label: "Timetable changes", description: "When your schedule changes" },
            { label: "Exam reminders", description: "Upcoming exam notifications" },
            { label: "Assignment deadlines", description: "Assignment due date reminders" },
            { label: "Campus events", description: "New events and activities" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* University Integration */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">University Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Connected Account</p>
              <p className="text-xs text-muted-foreground">{user?.universityId.toUpperCase()} — {user?.studentId}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              Reconnect
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Last synced</p>
              <p className="text-xs text-muted-foreground">2 minutes ago</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              Sync now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Download className="h-4 w-4" />
            Export my data
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            Delete my account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
