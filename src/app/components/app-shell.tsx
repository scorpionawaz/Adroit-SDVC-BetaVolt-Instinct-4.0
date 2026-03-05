"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import type { Role } from "./main-client";
import { DashboardClient } from "./dashboard-client";
import { ConsumerBilling } from "./consumer/billing";
import { ConsumerAnalytics } from "./consumer/analytics";
import { ConsumerSupport } from "./consumer/support";
import { ConsumerProfile } from "./consumer/profile";
import { ConsumerSettings } from "./consumer/settings";
import { cn } from "@/lib/utils";
import {
  Home, CreditCard, BarChart2, LifeBuoy, User, Settings,
  Zap, LogOut, Bell, Search, CheckCheck, X, Menu, ChevronLeft,
  Sun, Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppShellProps {
  role: Role;
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

const consumerTabs = [
  { id: "my-home", label: "My Home", icon: Home, path: "/" },
  { id: "billing", label: "Billing", icon: CreditCard, path: "/billing" },
  { id: "analytics", label: "Analytics", icon: BarChart2, path: "/analytics" },
  { id: "support", label: "Support", icon: LifeBuoy, path: "/support" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export function AppShell({ role, onLogout }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Derive active tab from current URL
  const activeTab = (() => {
    const match = consumerTabs.find(t => t.path === pathname);
    return match ? match.id : "my-home";
  })();

  const navigateTo = (tabId: string) => {
    const tab = consumerTabs.find(t => t.id === tabId);
    if (tab) router.push(tab.path);
  };

  const [notifs, setNotifs] = useState<Notif[]>(initialNotifs);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [agentModeActive, setAgentModeActive] = useState(false);
  const { theme, setTheme } = useTheme();

  const unreadCount = notifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));
  const markRead = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const activeLabel = consumerTabs.find(t => t.id === activeTab)?.label ?? "Dashboard";

  const renderContent = () => {
    switch (activeTab) {
      case "my-home": return <DashboardClient onAgentModeChange={(active) => {
        setAgentModeActive(active);
        if (active) setSidebarCollapsed(true);
        else setTimeout(() => setSidebarCollapsed(false), 800);
      }} />;
      case "billing": return <ConsumerBilling />;
      case "analytics": return <ConsumerAnalytics />;
      case "support": return <ConsumerSupport />;
      case "profile": return <ConsumerProfile />;
      case "settings": return <ConsumerSettings />;
      default: return <DashboardClient />;
    }
  };


  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden font-sans">
        {/* ── Mobile Overlay ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity animate-in fade-in duration-200"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── (hidden during Agent Mode) */}
        <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 flex flex-col flex-shrink-0",
          "bg-slate-950 text-slate-300 shadow-2xl border-r border-slate-800/50",
          "transition-all duration-500 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          agentModeActive ? "lg:w-0 opacity-0 overflow-hidden" : sidebarCollapsed ? "lg:w-[68px] w-[260px]" : "w-[260px]"
        )}>
          {/* Brand */}
          <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
            <div className={cn("flex items-center gap-2.5 transition-all duration-300", sidebarCollapsed && "lg:justify-center lg:w-full")}>
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className={cn("transition-opacity duration-200", sidebarCollapsed && "lg:hidden")}>
                <h1 className="text-lg font-black tracking-tight text-white leading-none">BetaVolt</h1>
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-semibold mt-0.5">Smart Energy</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 transition-colors"
            >
              <ChevronLeft className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", sidebarCollapsed && "rotate-180")} />
            </button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <nav className="px-2.5 py-4 space-y-0.5">
              {consumerTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                const navButton = (
                  <button
                    key={tab.id}
                    onClick={() => { navigateTo(tab.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg transition-all duration-200 group relative",
                      sidebarCollapsed ? "lg:justify-center lg:px-0 px-3.5 py-2.5" : "px-3.5 py-2.5",
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-medium"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-400 rounded-r-full transition-all duration-300" />
                    )}
                    <Icon className={cn(
                      "w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200",
                      isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                    )} />
                    <span className={cn("text-sm transition-opacity duration-200", sidebarCollapsed && "lg:hidden")}>{tab.label}</span>
                  </button>
                );

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={tab.id}>
                      <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                      <TooltipContent side="right" className="hidden lg:block">
                        {tab.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return navButton;
              })}
            </nav>
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className={cn("px-2.5 py-3 border-t border-slate-800/60")}>
            <div className={cn("flex items-center gap-3 px-3 py-2 mb-1", sidebarCollapsed && "lg:justify-center lg:px-0")}>
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">AB</AvatarFallback>
              </Avatar>
              <div className={cn("flex-1 min-w-0 transition-opacity duration-200", sidebarCollapsed && "lg:hidden")}>
                <p className="text-sm font-medium text-slate-200 truncate">Akshay Bhatia</p>
                <p className="text-[10px] text-slate-500 truncate">Consumer</p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onLogout}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-sm font-medium",
                    sidebarCollapsed && "lg:justify-center lg:px-0"
                  )}
                >
                  <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className={cn(sidebarCollapsed && "lg:hidden")}>Log Out</span>
                </button>
              </TooltipTrigger>
              {sidebarCollapsed && <TooltipContent side="right" className="hidden lg:block">Log Out</TooltipContent>}
            </Tooltip>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-900">
          {/* Header Bar (shrinks and fades during Agent Mode) */}
          <header className={cn(
            "bg-white dark:bg-slate-800 px-4 sm:px-6 lg:px-8 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center z-10 flex-shrink-0",
            "transition-all duration-500 ease-in-out",
            agentModeActive ? "opacity-0 h-0 py-0 overflow-hidden" : "opacity-100"
          )}>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden h-9 w-9"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">{activeLabel}</h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-[200px] xl:w-[240px] pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Theme Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0 text-slate-500" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100 text-slate-400" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle theme</TooltipContent>
              </Tooltip>

              {/* Notifications */}
              <Popover open={notifOpen} onOpenChange={setNotifOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
                    <Bell className="h-5 w-5 text-slate-500" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[10px] bg-red-500 hover:bg-red-500 text-white border-2 border-white dark:border-slate-800">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[360px] p-0 shadow-xl rounded-xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b dark:border-slate-700">
                    <span className="font-bold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-emerald-600 hover:text-emerald-700" onClick={markAllRead}>
                        <CheckCheck className="h-3.5 w-3.5" />Mark all read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="max-h-[380px]">
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {notifs.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-10">All caught up! 🎉</p>
                      )}
                      {notifs.map(n => (
                        <div key={n.id}
                          className={cn(
                            "flex gap-3 p-3.5 cursor-pointer transition-colors duration-150",
                            !n.read ? "bg-emerald-50/40 dark:bg-emerald-900/20 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/30" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                          onClick={() => markRead(n.id)}
                        >
                          <div className="shrink-0 mt-1.5">
                            <span className={cn("block w-2 h-2 rounded-full", typeColors[n.type])} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium leading-snug", n.read ? "text-slate-400" : "text-slate-800 dark:text-slate-200")}>{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                            onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <Separator orientation="vertical" className="h-6 hidden sm:block" />

              {/* User Avatar with Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-emerald-500/30 transition-all duration-200">
                    <AvatarFallback className="bg-emerald-600 text-white text-sm font-bold">AB</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px] mt-1 p-2 rounded-xl">
                  <DropdownMenuLabel className="font-bold flex flex-col gap-1">
                    <span>Akshay Bhatia</span>
                    <span className="text-xs text-slate-500 font-normal">Consumer</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigateTo("profile")} className="cursor-pointer gap-3 rounded-lg py-2 my-0.5">
                    <User className="h-4 w-4 text-slate-500" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigateTo("settings")} className="cursor-pointer gap-3 rounded-lg py-2 my-0.5">
                    <Settings className="h-4 w-4 text-slate-500" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigateTo("analytics")} className="cursor-pointer gap-3 rounded-lg py-2 my-0.5">
                    <Zap className="h-4 w-4 text-slate-500" />
                    <span>My Patterns</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="cursor-pointer gap-3 rounded-lg py-2 my-0.5 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950 focus:text-red-600 dark:focus:text-red-400">
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100 dark:bg-slate-900">
            {renderContent()}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
