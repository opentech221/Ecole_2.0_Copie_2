/**
 * useProfile — profile CRUD + file upload hook.
 *
 * Provides updateProfile() and uploadFile() on top of the authenticated
 * user's profile. Always calls refreshProfile() after mutations so
 * AuthContext stays in sync.
 */

import { useState }          from "react";
import { supabase }          from "../lib/supabase";
import { useAuthContext }    from "../app/contexts/AuthContext";

export interface ProfileFormData {
  full_name?:     string;
  ecole_nom?:     string;
  ief?:           string;
  telephone?:     string;
  adresse?:       string;
  classe_active?: string;
  // `role` is intentionally absent: changes require a server-side admin flow.
  // The DB trigger (migration 004) silently discards any role value sent by
  // an authenticated client even if it were to slip through.
  signature_url?: string;
  logo_url?:      string;
  role?:          string;
}

export function useProfile() {
  const { user, profile, refreshProfile } = useAuthContext();
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function updateProfile(data: ProfileFormData): Promise<void> {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);
      if (err) throw new Error(err.message);
      await refreshProfile();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la sauvegarde";
      setError(msg);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function uploadFile(file: File, type: "signature" | "logo"): Promise<string> {
    if (!user) throw new Error("Non connecté");
    setUploading(true);
    try {
      const ext  = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${type}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("school-assets")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw new Error(uploadErr.message);

      const { data } = supabase.storage.from("school-assets").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      const field = type === "signature" ? "signature_url" : "logo_url";
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ [field]: publicUrl })
        .eq("id", user.id);
      if (updateErr) throw new Error(updateErr.message);

      await refreshProfile();
      return publicUrl;
    } finally {
      setUploading(false);
    }
  }

  async function updateEmail(newEmail: string): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.updateUser({ email: newEmail });
      if (err) throw new Error(err.message);
      await refreshProfile();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la mise à jour de l'email";
      setError(msg);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  return { profile, saving, uploading, error, updateProfile, uploadFile, updateEmail };
}
