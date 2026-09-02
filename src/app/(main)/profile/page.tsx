"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, GraduationCap, Building, BookOpen, Calendar, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Your student profile</p>
      </div>

      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.studentId}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{user.email}</p>
              </div>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm">{user.phone}</p>
                </div>
              </div>
            )}
            <Separator />
            <div className="flex items-center gap-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Program</p>
                <p className="text-sm">{user.program}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm">{user.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Semester / Section</p>
                <p className="text-sm">Semester {user.semester}{user.section ? ` / Section ${user.section}` : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Attendance Threshold</p>
                <p className="text-sm">{user.attendanceThreshold}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">University Integration</p>
              <p className="text-xs text-muted-foreground">Connected to {user.universityId.toUpperCase()}</p>
            </div>
            <Badge variant="outline" className="text-xs">Connected</Badge>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full gap-2" onClick={signOut}>
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
