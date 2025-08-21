"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        });

        if (error) return alert(error.message);

        if (data.session) {
        // store session in localStorage (Supabase does this automatically)
        window.location.href = "/dashboard";
        }
    } else {
        const { data, error } = await supabase.auth.signUp({
        email,
        password,
        });

        if (error) return alert(error.message);

        // After signUp, data.session may be null if email confirmations are enabled
        if (data.session) {
        window.location.href = "/dashboard";
        } else {
        alert("Check your email to confirm account.");
        }
    }
    };



  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{isLogin ? "Sign In" : "Sign Up"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="w-full" onClick={handleAuth}>
            {isLogin ? "Login" : "Create Account"}
          </Button>
          <p
            className="text-sm text-center mt-2 cursor-pointer underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Sign In"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
