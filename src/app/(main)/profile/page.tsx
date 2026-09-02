"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, GraduationCap } from "lucide-react";

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.netId?.slice(0, 2).toUpperCase() || "CF";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Profile</h1>
        <p className="text-xs text-muted-foreground mt-1">Your student profile</p>
      </div>

      {/* Avatar & Name */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-muted-foreground">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold truncate">{user?.name || "Student"}</h2>
              <p className="text-xs text-muted-foreground truncate">{user?.studentId || "Not available"}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <GraduationCap className="h-3 w-3 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">SRM Institute of Science and Technology</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academic</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Program</p>
              <p className="text-sm font-medium">{user?.program || "Not available"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Department</p>
              <p className="text-sm font-medium">{user?.department || "Not available"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Semester</p>
              <p className="text-sm font-medium">{user?.semester ? `${user.semester}` : "Not available"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Section</p>
              <p className="text-sm font-medium">{user?.section || "Not available"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">NetID</span>
              <span className="text-sm font-medium">{user?.studentId || "Not available"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{user?.email || "Not available"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Connection</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">SRM</p>
              <p className="text-[10px] text-muted-foreground">
                {user?.onboarded ? "Connected" : "Pending setup"}
              </p>
            </div>
            <Badge variant={user?.onboarded ? "default" : "secondary"} className="text-[10px]">
              {user?.onboarded ? "Connected" : "Pending"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button variant="outline" className="w-full" onClick={() => signOut()}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>

      <p className="text-center text-[10px] text-muted-foreground">
        CampusFlow is an independent student-built tool and is not an official SRMIST service.
      </p>
    </div>
  );
}
