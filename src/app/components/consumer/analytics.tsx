"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Zap, AlertTriangle, Calendar, User, Users, Plus, Trash2, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area
} from "recharts";

const weeklyData = [
  { day: "Mon", units: 12.4, cost: 80.6 },
  { day: "Tue", units: 14.1, cost: 91.7 },
  { day: "Wed", units: 11.2, cost: 72.8 },
  { day: "Thu", units: 15.6, cost: 101.4 },
  { day: "Fri", units: 13.8, cost: 89.7 },
  { day: "Sat", units: 18.2, cost: 118.3 },
  { day: "Sun", units: 19.5, cost: 126.8 },
];

const monthlyData = [
  { week: "Week 1", thisMonth: 85, lastMonth: 92 },
  { week: "Week 2", thisMonth: 90, lastMonth: 88 },
  { week: "Week 3", thisMonth: 95, lastMonth: 105 },
  { week: "Week 4", thisMonth: 102, lastMonth: 110 },
];

const hourlyData = [
  { h: "12a", w: 0.4 }, { h: "2a", w: 0.3 }, { h: "4a", w: 0.2 }, { h: "6a", w: 1.1 },
  { h: "8a", w: 2.8 }, { h: "10a", w: 3.2 }, { h: "12p", w: 2.9 }, { h: "2p", w: 2.6 },
  { h: "4p", w: 3.4 }, { h: "6p", w: 4.8 }, { h: "8p", w: 5.2 }, { h: "10p", w: 3.1 },
];

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type Routine = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  label: string;
};

type Member = {
  id: string;
  name: string;
  relation: string;
  email: string;
};

const defaultRoutines: Routine[] = [
  { id: "r1", day: "Monday", startTime: "06:00", endTime: "09:00", label: "Morning Routine (AC, Geyser, Lights)" },
  { id: "r2", day: "Monday", startTime: "18:00", endTime: "22:00", label: "Evening Peak (AC, TV, Kitchen)" },
  { id: "r3", day: "Saturday", startTime: "10:00", endTime: "14:00", label: "Weekend Washing Machine" },
];

const defaultMembers: Member[] = [
  { id: "m1", name: "Akshay Bhatia", relation: "Primary Account Holder", email: "akshay.b@betavolt.com" },
  { id: "m2", name: "Rashid Khatun", relation: "Spouse", email: "rashid.k@example.com" },
];

export function ConsumerAnalytics() {
  const [routines, setRoutines] = useState<Routine[]>(defaultRoutines);
  const [members, setMembers] = useState<Member[]>(defaultMembers);

  // Routine form
  const [newDay, setNewDay] = useState("Monday");
  const [newStart, setNewStart] = useState("08:00");
  const [newEnd, setNewEnd] = useState("10:00");
  const [newLabel, setNewLabel] = useState("");
  const [routineOpen, setRoutineOpen] = useState(false);

  // Member form
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("Family Member");
  const [newEmail, setNewEmail] = useState("");
  const [memberOpen, setMemberOpen] = useState(false);

  const addRoutine = () => {
    if (!newLabel.trim()) return;
    setRoutines(prev => [...prev, { id: `r-${Date.now()}`, day: newDay, startTime: newStart, endTime: newEnd, label: newLabel }]);
    setNewLabel("");
    setRoutineOpen(false);
  };

  const removeRoutine = (id: string) => setRoutines(prev => prev.filter(r => r.id !== id));

  const addMember = () => {
    if (!newName.trim()) return;
    setMembers(prev => [...prev, { id: `m-${Date.now()}`, name: newName, relation: newRelation, email: newEmail }]);
    setNewName(""); setNewEmail(""); setMemberOpen(false);
  };

  const removeMember = (id: string) => setMembers(prev => prev.filter(m => m.id !== id));

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Patterns</h1>
        <p className="text-muted-foreground mt-1">Usage insights, your habits, and family management.</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14.9 kWh</div>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><TrendingUp className="h-3 w-3" />-4% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Cost</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹96.76</div>
            <p className="text-xs text-muted-foreground mt-1">Est. monthly: ₹2,903</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
            <CardTitle className="text-sm font-semibold text-orange-800 dark:text-orange-400">Peak Load Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-900 dark:text-orange-300"><span className="font-bold">6 PM – 10 PM</span> uses 40% more energy. Shift heavy loads outside peak hours.</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Consumption</CardTitle>
            <CardDescription>Units used (kWh) and cost (₹) per day</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
                <Bar dataKey="units" name="kWh" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="cost" name="₹ Cost" fill="hsl(var(--primary)/0.4)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
            <CardDescription>This month vs last month (kWh)</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="thisMonth" name="This Month" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="lastMonth" name="Last Month" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Hourly Load Profile</CardTitle>
            <CardDescription>Power draw (kW) throughout the day</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorW" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="h" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} formatter={(v: number) => [`${v} kW`, "Load"]} />
                <Area type="monotone" dataKey="w" name="Load (kW)" stroke="hsl(var(--primary))" fill="url(#colorW)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* My Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />My Patterns</CardTitle>
              <CardDescription>Set your weekly schedule and energy routines.</CardDescription>
            </div>
            <Dialog open={routineOpen} onOpenChange={setRoutineOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Routine</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Energy Routine</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label>Day of Week</Label>
                    <Select value={newDay} onValueChange={setNewDay}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{weekDays.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Start Time</Label>
                      <Input type="time" className="mt-1" value={newStart} onChange={e => setNewStart(e.target.value)} />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input type="time" className="mt-1" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Label / Description</Label>
                    <Input className="mt-1" placeholder="e.g. Morning shower, AC on" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
                  </div>
                  <Button className="w-full" onClick={addRoutine}>Save Routine</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {routines.length === 0 && <p className="text-sm text-muted-foreground">No routines added yet.</p>}
            <div className="space-y-2">
              {routines.map(r => (
                <div key={r.id} className="flex items-start justify-between border rounded-lg p-3 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium">{r.day}</span>
                      <span className="text-xs text-muted-foreground">{r.startTime} – {r.endTime}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-5">{r.label}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeRoutine(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Family Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Family Members</CardTitle>
              <CardDescription>Manage household members linked to this account.</CardDescription>
            </div>
            <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Member</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Family Member</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label>Full Name</Label>
                    <Input className="mt-1" placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Select value={newRelation} onValueChange={setNewRelation}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Spouse", "Child", "Parent", "Sibling", "Family Member", "Tenant"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Email (optional)</Label>
                    <Input type="email" className="mt-1" placeholder="email@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                  </div>
                  <Button className="w-full" onClick={addMember}>Add Member</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.relation}{m.email ? ` · ${m.email}` : ""}</p>
                  </div>
                </div>
                {m.id !== "m1" && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeMember(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
