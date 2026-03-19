"use client";

import { useState } from "react";
import type { Role } from "./main-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";

interface LoginScreenProps {
  onLogin: (role: Role) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Fake auth delay to simulate network request
    setTimeout(() => {
      // Simple logic to determine role based on email for the "fake" auth
      if (email.toLowerCase().includes("admin")) {
        onLogin("admin");
      } else {
        localStorage.setItem("instinct_customer_id", "1002");
        onLogin("consumer");
      }
      setIsLoading(false);
    }, 1500);
  };

  const autofillConsumer = () => {
    setEmail("consumer@betavolt.com");
    setPassword("password123");
  };

  const autofillAdmin = () => {
    setEmail("admin@betavolt.com");
    setPassword("admin123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl border-none ring-1 ring-border/50 relative z-10 backdrop-blur-xl bg-card/80 p-0 overflow-hidden">
        <form onSubmit={handleLogin}>
          <CardHeader className="space-y-3 text-center pb-6 pt-10">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-2 ring-1 ring-primary/20">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
              BetaVolt <span className="text-primary font-black">Instinct</span>
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-6 space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  className="pl-9 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-primary hover:underline hover:text-primary/80" onClick={(e) => e.preventDefault()}>
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-9 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-4 text-md font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/25 transition-all"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex flex-col border-t border-border/50 bg-muted/20 px-8 py-6 gap-4">
          <div className="w-full text-center">
             <p className="text-sm text-muted-foreground font-medium mb-3">Test Credentials (Click to fill)</p>
             <div className="grid grid-cols-2 gap-3">
               <Button variant="outline" size="sm" onClick={autofillConsumer} className="text-xs h-9 hover:bg-background" type="button">
                 <Zap className="mr-1.5 h-3 w-3 text-primary" /> Consumer
               </Button>
               <Button variant="outline" size="sm" onClick={autofillAdmin} className="text-xs h-9 hover:bg-background" type="button">
                 <ShieldCheck className="mr-1.5 h-3 w-3 text-secondary" /> Admin
               </Button>
             </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
