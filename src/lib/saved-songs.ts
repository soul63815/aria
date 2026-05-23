import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Song } from "./songs";

export interface SavedSongRow {
  id: string;
  title: string;
  created_at: string;
  data: Song;
}

export function useSavedSongs(userId: string | undefined) {
  const [rows, setRows] = useState<SavedSongRow[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!userId) { setRows([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("saved_songs").select("id,title,created_at,data")
      .order("created_at", { ascending: false });
    setRows(((data || []) as unknown) as SavedSongRow[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  return { rows, loading, reload };
}

export async function saveSongToCloud(song: Song) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Sign in required");
  const { error } = await supabase.from("saved_songs").insert({
    user_id: u.user.id, title: song.title, data: song as any,
  });
  if (error) throw error;
}

export async function deleteSavedSong(id: string) {
  const { error } = await supabase.from("saved_songs").delete().eq("id", id);
  if (error) throw error;
}

/** Browser-side download of a Song JSON file. */
export function downloadSongJson(song: Song) {
  const blob = new Blob([JSON.stringify(song, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${song.title.replace(/[^a-z0-9]+/gi, "_")}.aria.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}