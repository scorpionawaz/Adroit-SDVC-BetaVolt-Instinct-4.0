"use client";

import { useState, useEffect } from "react";
import { LoginScreen } from "./login-screen";
import { AppShell } from "./app-shell";
import { LandingPage } from "./landing-page";

export type Role = "consumer" | "admin" | null;
export type ViewState = "landing" | "login" | "app";

const STORAGE_KEY = "instinct_user_role";

export function MainClient() {
  const [role, setRole] = useState<Role>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [view, setView] = useState<ViewState>("landing");

  // On mount, read persisted role from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Role;
    if (stored === "admin") {
      // Admin should be on /admin page, redirect there
      window.location.href = "/admin";
      return;
    }
    if (stored === "consumer") {
      setRole("consumer");
      setView("app");
    }
    setIsHydrated(true);
  }, []);

  const handleLogin = (newRole: Role) => {
    if (newRole === "admin") {
      localStorage.setItem(STORAGE_KEY, "admin");
      window.location.href = "/admin";
      return;
    }
    localStorage.setItem(STORAGE_KEY, newRole ?? "");
    setRole(newRole);
    setView("app");
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRole(null);
    setView("landing");
  };

  // Don't flash login screen while checking localStorage
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (view === "landing" && !role) {
    return <LandingPage onLoginClick={() => setView("login")} />;
  }

  if (view === "login" && !role) {
    return <LoginScreen onLogin={handleLogin} onBack={() => setView("landing")} />;
  }

  return <AppShell role={role} onLogout={handleLogout} />;
}
