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
  value: number | null;
};

type SharedMoodRow = {
  owner_id: string;
  owner_display_name: string | null;
  entry_id: string | null;
  created_at: string | null;
  bladder: number | null;
  hunger: number | null;
  energy: number | null;
  fun: number | null;
  social: number | null;
  hygiene: number | null;
};

const defaultNeeds: Need[] = [
  { id: "bladder", label: "Vessie", icon: "🚽", value: null },
  { id: "hunger", label: "Faim", icon: "🍽️", value: null },
  { id: "energy", label: "Énergie", icon: "💤", value: null },
  { id: "fun", label: "Divertissement", icon: "🎮", value: null },
  { id: "social", label: "Social", icon: "💬", value: null },
  { id: "hygiene", label: "Hygiène", icon: "🧼", value: null },
];

function rowToNeeds(row: SharedMoodRow): Need[] {
  return defaultNeeds.map((need) => ({
    ...need,
    value: row[
      need.id as keyof Pick<
        SharedMoodRow,
        "bladder" | "hunger" | "energy" | "fun" | "social" | "hygiene"
      >
    ] as number | null,
  }));
}

function getAverage(needs: Need[]) {
  const visibleNeeds = needs.filter((need) => need.value !== null);

  if (visibleNeeds.length === 0) {
    return null;
  }

  const total = visibleNeeds.reduce((sum, need) => sum + (need.value ?? 0), 0);
  return Math.round(total / visibleNeeds.length);
}

function getLowestNeed(needs: Need[]) {
  const visibleNeeds = needs.filter((need) => need.value !== null);

  if (visibleNeeds.length === 0) {
    return null;
  }

  return [...visibleNeeds].sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0];
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
  const [sharedMoods, setSharedMoods] = useState<SharedMoodRow[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSharedMoods();
  }, [user.id]);

  async function loadSharedMoods() {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("get_shared_latest_moods");

    if (error) {
      setMessage(`Erreur moods partagés : ${error.message}`);
      setIsLoading(false);
      return;
    }

    setSharedMoods((data ?? []) as SharedMoodRow[]);
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
            Ici apparaissent uniquement les jauges que tes contacts ont choisi
            de partager.
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
            if (!sharedMood.entry_id || !sharedMood.created_at) {
              return (
                <article
                  key={sharedMood.owner_id}
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
                    👤 {sharedMood.owner_display_name ?? "Contact sans pseudo"}
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

            const needs = rowToNeeds(sharedMood);
            const average = getAverage(needs);
            const lowestNeed = getLowestNeed(needs);

            return (
              <article
                key={sharedMood.owner_id}
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
                      👤 {sharedMood.owner_display_name ?? "Contact sans pseudo"}
                    </h3>

                    <p
                      className={
                        isDark
                          ? "mt-1 text-sm text-slate-300"
                          : "mt-1 text-sm text-slate-600"
                      }
                    >
                      Dernier mood :{" "}
                      <strong>{formatDateTime(sharedMood.created_at)}</strong>
                    </p>
                  </div>

                  <div className="w-fit rounded-full bg-pink-500 px-4 py-2 text-sm font-black text-white">
                    {average === null ? "Masqué" : `Moyenne ${average}%`}
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
                    {lowestNeed
                      ? `${lowestNeed.icon} ${lowestNeed.label} ${lowestNeed.value}%`
                      : "masqué"}
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
                        {need.value === null ? "Masqué" : `${need.value}%`}
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