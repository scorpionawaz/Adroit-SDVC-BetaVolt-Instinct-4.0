"use client";

import { useState } from "react";
import type { Role } from "./main-client";
import { cn } from "@/lib/utils";
import {
  Bell, Globe, Search, User, LogOut, Settings,
  Home, CreditCard, BarChart2, LifeBuoy, Activity, Ticket, Building2, Zap, CheckCheck, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavProps {
  role: Role;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onLogout: () => void;
}

type Notif = {
  id: string; title: string; body: string; time: string;
  type: "info" | "warn" | "success"; read: boolean;
};

const initialNotifs: Notif[] = [
  { id: "n1", title: "Bill Generated", body: "Your bill for January 2026 is ready.", time: "2 hours ago", type: "success", read: false },
  { id: "n2", title: "Low Balance Alert", body: "Balance below ₹500. Recharge soon.", time: "Yesterday", type: "warn", read: false },
  { id: "n3", title: "Ticket Update", body: "Ticket #TKT-8821 changed to In Progress.", time: "Feb 22, 2026", type: "info", read: false },
  { id: "n4", title: "AI Tariff Alert", body: "Peak tariff ₹12.4/kWh. AI recommended turning off AC.", time: "Feb 21, 2026", type: "warn", read: true },
  { id: "n5", title: "Recharge Successful", body: "₹500 added to your wallet.", time: "Feb 18, 2026", type: "success", read: true },
];

const typeColors: Record<string, string> = {
  info: "bg-blue-500", warn: "bg-orange-500", success: "bg-emerald-500",
};

export function TopNav({ role, activeTab, onTabChange, onLogout }: TopNavProps) {
  const [notifs, setNotifs] = useState<Notif[]>(initialNotifs);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));
  const markRead = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const consumerTabs = [
    { id: "my-home", label: "My Home", icon: Home },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "support", label: "Support", icon: LifeBuoy },
  ];

  const adminTabs = [
    { id: "command-center", label: "Command Center", icon: Activity },
    { id: "ticket-desk", label: "Ticket Desk", icon: Ticket },
    { id: "project-hub", label: "Project Hub", icon: Building2 },
  ];

  const tabs = role === "consumer" ? consumerTabs : adminTabs;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-6 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-6">
        <div className="bg-primary/10 p-1.5 rounded-lg">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <span className="font-bold text-foreground text-lg tracking-tight hidden md:inline-block">BetaVolt</span>
      </div>

      {/* Main Nav */}
      <nav className="hidden md:flex flex-1 items-center space-x-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button key={tab.id} variant={isActive ? "secondary" : "ghost"} size="sm"
              onClick={() => onTabChange(tab.id)}
              className={cn("gap-2 text-sm", isActive && "font-semibold")}
            >
              <Icon className="h-4 w-4" />{tab.label}
            </Button>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 ml-auto">
        {/* Search */}
        <form className="hidden lg:block relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="w-[200px] xl:w-[260px] pl-8 bg-muted/50 focus-visible:bg-background" />
        </form>

        {/* Language */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Language / भाषा</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="font-medium bg-muted/50">English</DropdownMenuItem>
            <DropdownMenuItem>हिन्दी</DropdownMenuItem>
            <DropdownMenuItem>ગુજરાતી</DropdownMenuItem>
            <DropdownMenuItem>मराठी</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications — Popover (stays open, fully interactive) */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[340px] p-0 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-sm">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5">{unreadCount}</span>
                )}
              </span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-primary" onClick={markAllRead}>
                  <CheckCheck className="h-3.5 w-3.5" />Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-[380px] overflow-y-auto divide-y">
              {notifs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-10">All caught up! 🎉</p>
              )}
              {notifs.map(n => (
                <div key={n.id}
                  className={cn("flex gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors", !n.read && "bg-primary/5")}
                  onClick={() => markRead(n.id)}
                >
                  <div className="shrink-0 mt-1.5">
                    <span className={cn("block w-2 h-2 rounded-full", typeColors[n.type])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium leading-snug", n.read && "text-muted-foreground")}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            {notifs.length > 0 && (
              <div className="border-t px-4 py-2.5">
                <Button variant="link" size="sm" className="text-xs h-6 px-0 text-primary w-full justify-center">
                  View All Activity →
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-primary/10 hover:bg-primary/20">
              <User className="h-5 w-5 text-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{role === "consumer" ? "Akshay Bhatia" : "Admin User"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{role === "consumer" ? "akshay.b@betavolt.com" : "admin@betavolt.com"}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {role === "consumer" && (
              <>
                <DropdownMenuItem className="cursor-pointer" onClick={() => onTabChange("profile")}>
                  <User className="mr-2 h-4 w-4" /><span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => onTabChange("analytics")}>
                  <BarChart2 className="mr-2 h-4 w-4" /><span>My Patterns</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => onTabChange("settings")}>
                  <Settings className="mr-2 h-4 w-4" /><span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" /><span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
