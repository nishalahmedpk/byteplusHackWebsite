"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SettingsComponent = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    travel_mode: "",
    travel_mode_other: "",
    group_size: "",
    user_type: "",
    user_type_other: "",
  });
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("user_profiles")
        .select("travel_mode, travel_mode_other, group_size, user_type, user_type_other")
        .eq("user_id", user.id)
        .single();
      if (data) setProfile({
        travel_mode: data.travel_mode || "",
        travel_mode_other: data.travel_mode_other || "",
        group_size: data.group_size?.toString() || "",
        user_type: data.user_type || "",
        user_type_other: data.user_type_other || "",
      });
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: user.id,
        travel_mode: profile.travel_mode,
        travel_mode_other: profile.travel_mode === "other" ? profile.travel_mode_other : null,
        group_size: Number(profile.group_size),
        user_type: profile.user_type,
        user_type_other: profile.user_type === "other" ? profile.user_type_other : null,
      });
    if (!error) setEdit(false);
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto mt-8 p-4">
      <h2 className="text-xl font-bold mb-4">Profile Settings</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">How do you primarily travel?</label>
        <select
          className="w-full border rounded px-2 py-1"
          value={profile.travel_mode}
          disabled={!edit}
          onChange={e => setProfile(p => ({ ...p, travel_mode: e.target.value }))}
        >
          <option value="">Select...</option>
          <option value="bus">Bus</option>
          <option value="metro">Metro</option>
          <option value="taxi">Taxi</option>
          <option value="other">Other (please specify)</option>
        </select>
        {profile.travel_mode === "other" && edit && (
          <Input
            className="mt-2"
            placeholder="Please specify"
            value={profile.travel_mode_other}
            onChange={e => setProfile(p => ({ ...p, travel_mode_other: e.target.value }))}
          />
        )}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">How many people do you travel with?</label>
        <Input
          placeholder="e.g. 1, 2, 3..."
          value={profile.group_size}
          disabled={!edit}
          onChange={e => setProfile(p => ({ ...p, group_size: e.target.value }))}
          type="number"
          min="1"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">What describes you best?</label>
        <select
          className="w-full border rounded px-2 py-1"
          value={profile.user_type}
          disabled={!edit}
          onChange={e => setProfile(p => ({ ...p, user_type: e.target.value }))}
        >
          <option value="">Select...</option>
          <option value="student">Student</option>
          <option value="tourist">Tourist</option>
          <option value="other">Other (please specify)</option>
        </select>
        {profile.user_type === "other" && edit && (
          <Input
            className="mt-2"
            placeholder="Please specify"
            value={profile.user_type_other}
            onChange={e => setProfile(p => ({ ...p, user_type_other: e.target.value }))}
          />
        )}
      </div>
      {edit ? (
        <Button className="w-full" onClick={handleSave} disabled={loading}>
          Save
        </Button>
      ) : (
        <Button className="w-full" onClick={() => setEdit(true)}>
          Edit
        </Button>
      )}
    </div>
  );
};

export default SettingsComponent;
