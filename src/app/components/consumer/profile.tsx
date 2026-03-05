"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Bell, Shield, Zap, Sparkles } from "lucide-react";

export function ConsumerProfile() {
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Toggle dark mode by adding/removing 'dark' class on html element
  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile & Preferences</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and AI agent preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Personal Details</CardTitle>
            </div>
            <CardDescription>Your registered consumer information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Full Name</Label>
                <p className="font-medium">Akshay Bhatia</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Consumer ID</Label>
                <p className="font-medium text-muted-foreground">#M-992104</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Email</Label>
                <p className="font-medium">akshay.b@example.com</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Phone</Label>
                <p className="font-medium">+91 98765 43210</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-2">Edit Details</Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
