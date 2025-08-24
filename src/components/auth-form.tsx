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
  // Extra signup fields
  const [travelMode, setTravelMode] = useState("");
  const [travelModeOther, setTravelModeOther] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const [userType, setUserType] = useState("");
  const [userTypeOther, setUserTypeOther] = useState("");

  const handleAuth = async () => {
    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return alert(error.message);
      if (data.session) {
        window.location.href = "/dashboard";
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) return alert(error.message);
      // After signUp, data.session may be null if email confirmations are enabled
      if (data.user) {
        // Insert extra info into user_profiles table
        const travel_mode_final = travelMode === "other" ? travelModeOther : travelMode;
        const user_type_final = userType === "other" ? userTypeOther : userType;
        const { error: profileError } = await supabase.from("user_profiles").insert([
          {
            user_id: data.user.id,
            travel_mode: travel_mode_final,
            group_size: groupSize,
            user_type: user_type_final,
          },
        ]);
        if (profileError) {
          alert("Signup succeeded, but failed to save profile: " + profileError.message);
        }
      }
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
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">How do you primarily travel?</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={travelMode}
                  onChange={e => setTravelMode(e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="bus">Bus</option>
                  <option value="metro">Metro</option>
                  <option value="taxi">Taxi</option>
                  <option value="other">Other (please specify)</option>
                </select>
                {travelMode === "other" && (
                  <Input
                    className="mt-2"
                    placeholder="Please specify"
                    value={travelModeOther}
                    onChange={e => setTravelModeOther(e.target.value)}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">How many people do you travel with?</label>
                <Input
                  placeholder="e.g. 1, 2, 3..."
                  value={groupSize}
                  onChange={e => setGroupSize(e.target.value)}
                  type="number"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">What describes you best?</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={userType}
                  onChange={e => setUserType(e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="student">Student</option>
                  <option value="tourist">Tourist</option>
                  <option value="other">Other (please specify)</option>
                </select>
                {userType === "other" && (
                  <Input
                    className="mt-2"
                    placeholder="Please specify"
                    value={userTypeOther}
                    onChange={e => setUserTypeOther(e.target.value)}
                  />
                )}
              </div>
            </>
          )}
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
// ...existing code...
