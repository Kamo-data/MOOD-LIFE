"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type SharedMoodsPanelProps = {
  isDark: boolean;
  user: User;
};

type Need = {
  id: string;
  label: string;
  icon: string;
  value: number;
};

type MoodShare = {
  id: string;
  owner_id: string;
  viewer_id: string;
  status: string;
};

type Profile = {
  id: string;
  display_name: string;
};

type MoodEntryRow = {
  id: string;
  user_id: string;
  created_at: string;
  bladder: number;
  hunger: number;
  energy: number;
  fun: number;
  social: number;
  hygiene: number;
};

type SharedMood = {
  ownerId: string;
  displayName: string;
  latestEntry: MoodEntryRow | null;
};

const defaultNeeds: Need[] = [
  { id: "bladder", label: "Vessie", icon: "🚽", value: 85 },
  { id: "hunger", label: "Faim", icon: "🍽️", value: 45 },
  { id: "energy", label: "Énergie", icon: "💤", value: 50 },
  { id: "fun", label: "Divertissement", icon: "🎮", value: 75 },
  { id: "social", label: "Social", icon: "💬", value: 70 },
  { id: "hygiene", label: "Hygiène", icon: "🧼", value: 80 },
];

function rowToNeeds(row: MoodEntryRow): Need[] {
  return defaultNeeds.map((need) => ({
    ...need,
    value: row[
      need.id as keyof Pick<
        MoodEntryRow,
        "bladder" | "hunger" | "energy" | "fun" | "social" | "hygiene"
      >
    ] as number,
  }));
}

function getAverage(needs: Need[]) {
  const total = needs.reduce((sum, need) => sum + need.value, 0);
  return Math.round(total / needs.length);
}

function getLowestNeed(needs: Need[]) {
  return [...needs].sort((a, b) => a.value - b.value)[0];
}

function formatDateTime(timestamp: string) {
  return new Date(timestamp).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SharedMoodsPanel({ isDark, user }: SharedMoodsPanelProps) {
  const [sharedMoods, setSharedMoods] = useState<SharedMood[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSharedMoods();
  }, []);

  async function loadSharedMoods() {
    setIsLoading(true);
    setMessage("");

    const { data: shares, error: sharesError } = await supabase
      .from("mood_shares")
      .select("*")
      .eq("viewer_id", user.id)
      .eq("status", "accepted");

    if (sharesError) {
      setMessage(`Erreur partages : ${sharesError.message}`);
      setIsLoading(false);
      return;
    }

    const moodShares = (shares ?? []) as MoodShare[];
    const ownerIds = moodShares.map((share) => share.owner_id);

    if (ownerIds.length === 0) {
      setSharedMoods([]);
      setIsLoading(false);
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", ownerIds);

    if (profilesError) {
      setMessage(`Erreur profils : ${profilesError.message}`);
      setIsLoading(false);
      return;
    }

    const { data: entries, error: entriesError } = await supabase
      .from("mood_entries")
      .select("*")
      .in("user_id", ownerIds)
      .order("created_at", { ascending: false })
      .limit(100);

    if (entriesError) {
      setMessage(`Erreur moods partagés : ${entriesError.message}`);
      setIsLoading(false);
      return;
    }

    const profileList = (profiles ?? []) as Profile[];
    const entryList = (entries ?? []) as MoodEntryRow[];

    const nextSharedMoods = ownerIds.map((ownerId) => {
      const profile = profileList.find((item) => item.id === ownerId);
      const latestEntry =
        entryList.find((entry) => entry.user_id === ownerId) ?? null;

      return {
        ownerId,
        displayName: profile?.display_name ?? "Contact sans pseudo",
        latestEntry,
      };
    });

    setSharedMoods(nextSharedMoods);
    setIsLoading(false);
  }

  return (
    <section
      className={
        isDark
          ? "rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur"
          : "rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur"
      }
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2
            className={
              isDark ? "text-xl font-bold text-white" : "text-xl font-bold"
            }
          >
            Moods partagés avec moi
          </h2>

          <p
            className={
              isDark
                ? "mt-1 text-sm text-slate-300"
                : "mt-1 text-sm text-slate-600"
            }
          >
            Ici apparaissent les contacts qui t’autorisent à voir leurs moods.
          </p>
        </div>

        <button
          onClick={loadSharedMoods}
          disabled={isLoading}
          className={
            isDark
              ? "rounded-full bg-white px-5 py-3 font-bold text-slate-950 shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
              : "rounded-full bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          }
        >
          {isLoading ? "Actualisation..." : "Actualiser"}
        </button>
      </div>

      {message && (
        <div
          className={
            isDark
              ? "mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-3 text-sm font-bold text-red-200"
              : "mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700"
          }
        >
          {message}
        </div>
      )}

      {isLoading ? (
        <div
          className={
            isDark
              ? "mt-4 rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-slate-300"
              : "mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-slate-600"
          }
        >
          Chargement des moods partagés...
        </div>
      ) : sharedMoods.length === 0 ? (
        <div
          className={
            isDark
              ? "mt-4 rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-slate-300"
              : "mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-slate-600"
          }
        >
          Aucun mood partagé avec toi pour le moment.
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {sharedMoods.map((sharedMood) => {
            if (!sharedMood.latestEntry) {
              return (
                <article
                  key={sharedMood.ownerId}
                  className={
                    isDark
                      ? "rounded-3xl border border-white/10 bg-white/10 p-4"
                      : "rounded-3xl border border-white bg-white p-4 shadow"
                  }
                >
                  <h3
                    className={
                      isDark
                        ? "text-lg font-black text-white"
                        : "text-lg font-black text-slate-900"
                    }
                  >
                    👤 {sharedMood.displayName}
                  </h3>

                  <p
                    className={
                      isDark
                        ? "mt-2 text-sm text-slate-300"
                        : "mt-2 text-sm text-slate-600"
                    }
                  >
                    Cette personne n’a pas encore enregistré de mood.
                  </p>
                </article>
              );
            }

            const needs = rowToNeeds(sharedMood.latestEntry);
            const average = getAverage(needs);
            const lowestNeed = getLowestNeed(needs);

            return (
              <article
                key={sharedMood.ownerId}
                className={
                  isDark
                    ? "rounded-3xl border border-white/10 bg-white/10 p-4"
                    : "rounded-3xl border border-white bg-white p-4 shadow"
                }
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3
                      className={
                        isDark
                          ? "text-lg font-black text-white"
                          : "text-lg font-black text-slate-900"
                      }
                    >
                      👤 {sharedMood.displayName}
                    </h3>

                    <p
                      className={
                        isDark
                          ? "mt-1 text-sm text-slate-300"
                          : "mt-1 text-sm text-slate-600"
                      }
                    >
                      Dernier mood :{" "}
                      <strong>
                        {formatDateTime(sharedMood.latestEntry.created_at)}
                      </strong>
                    </p>
                  </div>

                  <div className="w-fit rounded-full bg-pink-500 px-4 py-2 text-sm font-black text-white">
                    Moyenne {average}%
                  </div>
                </div>

                <p
                  className={
                    isDark
                      ? "mt-3 text-sm text-slate-300"
                      : "mt-3 text-sm text-slate-600"
                  }
                >
                  Besoin le plus bas :{" "}
                  <span className="font-black text-pink-500">
                    {lowestNeed.icon} {lowestNeed.label} {lowestNeed.value}%
                  </span>
                </p>

                <div className="mt-4 grid gap-2 md:grid-cols-6">
                  {needs.map((need) => (
                    <div
                      key={need.id}
                      className={
                        isDark
                          ? "rounded-2xl bg-slate-950/45 p-3 text-center"
                          : "rounded-2xl bg-slate-50 p-3 text-center"
                      }
                    >
                      <div className="text-2xl">{need.icon}</div>
                      <div
                        className={
                          isDark
                            ? "mt-1 text-xs font-bold text-slate-200"
                            : "mt-1 text-xs font-bold text-slate-700"
                        }
                      >
                        {need.label}
                      </div>
                      <div className="text-lg font-black text-pink-500">
                        {need.value}%
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}