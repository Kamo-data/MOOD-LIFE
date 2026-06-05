"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthPanel } from "../components/AuthPanel";
import { ProfilePanel } from "../components/ProfilePanel";
import { SharePanel } from "../components/SharePanel";
import { SharedMoodsPanel } from "../components/SharedMoodsPanel";
import { CoupleViewPanel } from "../components/CoupleViewPanel";

type Need = {
  id: string;
  label: string;
  icon: string;
  value: number;
};

type Theme = "light" | "dark";

type Tab = "needs" | "duo" | "share" | "history";

type Profile = {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
};

type HistoryChange = {
  id: string;
  timestamp: string;
  needs: Need[];
};

type HistoryDay = {
  date: string;
  changes: HistoryChange[];
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

const defaultNeeds: Need[] = [
  { id: "bladder", label: "Vessie", icon: "🚽", value: 85 },
  { id: "hunger", label: "Faim", icon: "🍽️", value: 45 },
  { id: "energy", label: "Énergie", icon: "💤", value: 50 },
  { id: "fun", label: "Divertissement", icon: "🎮", value: 75 },
  { id: "social", label: "Social", icon: "💬", value: 70 },
  { id: "hygiene", label: "Hygiène", icon: "🧼", value: 80 },
];

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAverage(needs: Need[]) {
  const total = needs.reduce((sum, need) => sum + need.value, 0);
  return Math.round(total / needs.length);
}

function getLowestNeed(needs: Need[]) {
  return [...needs].sort((a, b) => a.value - b.value)[0];
}

function getNeedValue(needs: Need[], id: string) {
  return needs.find((need) => need.id === id)?.value ?? 0;
}

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

function rowsToHistory(rows: MoodEntryRow[]): HistoryDay[] {
  const grouped = rows.reduce<Record<string, HistoryChange[]>>((acc, row) => {
    const dateKey = getDateKey(new Date(row.created_at));

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }

    acc[dateKey].push({
      id: row.id,
      timestamp: row.created_at,
      needs: rowToNeeds(row),
    });

    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([date, changes]) => ({
      date,
      changes: changes.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function normalizeHistory(rawHistory: unknown): HistoryDay[] {
  if (!Array.isArray(rawHistory)) {
    return [];
  }

  return rawHistory
    .map((item) => {
      if (
        item &&
        typeof item === "object" &&
        "date" in item &&
        "changes" in item &&
        Array.isArray((item as HistoryDay).changes)
      ) {
        return item as HistoryDay;
      }

      if (
        item &&
        typeof item === "object" &&
        "date" in item &&
        "needs" in item &&
        Array.isArray((item as { needs: Need[] }).needs)
      ) {
        const oldEntry = item as { date: string; needs: Need[] };

        return {
          date: oldEntry.date,
          changes: [
            {
              id: `${oldEntry.date}-old-entry`,
              timestamp: `${oldEntry.date}T12:00:00`,
              needs: oldEntry.needs,
            },
          ],
        };
      }

      return null;
    })
    .filter((item): item is HistoryDay => item !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export default function Home() {
  const [needs, setNeeds] = useState<Need[]>(defaultNeeds);
  const [theme, setTheme] = useState<Theme>("light");
  const [activeTab, setActiveTab] = useState<Tab>("needs");
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isDark = theme === "dark";
  const todayKey = getDateKey();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const savedNeeds = localStorage.getItem("mood-life-needs");
    const savedTheme = localStorage.getItem("mood-life-theme");
    const savedHistory = localStorage.getItem("mood-life-history");

    if (savedNeeds) {
      setNeeds(JSON.parse(savedNeeds));
    }

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

    if (savedHistory) {
      setHistory(normalizeHistory(JSON.parse(savedHistory)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("mood-life-needs", JSON.stringify(needs));
  }, [needs]);

  useEffect(() => {
    localStorage.setItem("mood-life-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("mood-life-history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (user) {
      loadOnlineHistory();
      loadProfile(user);
    } else {
      setProfile(null);
    }
  }, [user]);

  async function loadProfile(currentUser: User) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      setSaveMessage(`Erreur profil : ${error.message}`);
      return;
    }

    if (data) {
      setProfile(data as Profile);
      return;
    }

    const defaultDisplayName =
      currentUser.email?.split("@")[0]?.slice(0, 30) || "Nouveau Sim";

    const { data: createdProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: currentUser.id,
        display_name: defaultDisplayName,
      })
      .select()
      .single();

    if (createError) {
      setSaveMessage(`Erreur création profil : ${createError.message}`);
      return;
    }

    setProfile(createdProfile as Profile);
  }

  async function saveProfile(displayName: string) {
    if (!user) {
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      setSaveMessage(`Erreur pseudo : ${error.message}`);
      return;
    }

    setProfile(data as Profile);
  }

  async function loadOnlineHistory() {
    setHistoryLoading(true);

    const { data, error } = await supabase
      .from("mood_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      setSaveMessage(`Erreur de chargement : ${error.message}`);
    } else {
      setHistory(rowsToHistory((data ?? []) as MoodEntryRow[]));
    }

    setHistoryLoading(false);
  }

  function updateNeed(id: string, value: number) {
    setNeeds((currentNeeds) =>
      currentNeeds.map((need) => (need.id === id ? { ...need, value } : need))
    );
  }

  function resetNeeds() {
    setNeeds(defaultNeeds);
  }

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setActiveTab("needs");
  }

  async function saveMoodChange() {
    const now = new Date();
    const timestamp = now.toISOString();

    setIsSaving(true);

    if (user) {
      const { data, error } = await supabase
        .from("mood_entries")
        .insert({
          user_id: user.id,
          bladder: getNeedValue(needs, "bladder"),
          hunger: getNeedValue(needs, "hunger"),
          energy: getNeedValue(needs, "energy"),
          fun: getNeedValue(needs, "fun"),
          social: getNeedValue(needs, "social"),
          hygiene: getNeedValue(needs, "hygiene"),
        })
        .select()
        .single();

      if (error) {
        setSaveMessage(`Erreur : ${error.message}`);
        setIsSaving(false);
        return;
      }

      if (data) {
        const row = data as MoodEntryRow;
        addChangeToHistory({
          id: row.id,
          timestamp: row.created_at,
          needs: rowToNeeds(row),
        });
        setSaveMessage(`Enregistré en ligne à ${formatTime(row.created_at)}`);
      }
    } else {
      addChangeToHistory({
        id: crypto.randomUUID(),
        timestamp,
        needs,
      });
      setSaveMessage(`Enregistré localement à ${formatTime(timestamp)}`);
    }

    setIsSaving(false);

    window.setTimeout(() => {
      setSaveMessage("");
    }, 2200);
  }

  function addChangeToHistory(newChange: HistoryChange) {
    const dateKey = getDateKey(new Date(newChange.timestamp));

    setHistory((currentHistory) => {
      const existingDay = currentHistory.find((day) => day.date === dateKey);
      const otherDays = currentHistory.filter((day) => day.date !== dateKey);

      const updatedDay: HistoryDay = existingDay
        ? {
            ...existingDay,
            changes: [newChange, ...existingDay.changes],
          }
        : {
            date: dateKey,
            changes: [newChange],
          };

      return [updatedDay, ...otherDays].sort((a, b) =>
        b.date.localeCompare(a.date)
      );
    });
  }

  async function deleteHistory() {
    const confirmed = window.confirm(
      "Supprimer tout l'historique ? Cette action est définitive."
    );

    if (!confirmed) {
      return;
    }

    if (user) {
      const { error } = await supabase
        .from("mood_entries")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        setSaveMessage(`Erreur de suppression : ${error.message}`);
        return;
      }
    }

    setHistory([]);
  }

  async function deleteChange(dayDate: string, changeId: string) {
    if (user) {
      const { error } = await supabase
        .from("mood_entries")
        .delete()
        .eq("id", changeId);

      if (error) {
        setSaveMessage(`Erreur de suppression : ${error.message}`);
        return;
      }
    }

    setHistory((currentHistory) =>
      currentHistory
        .map((day) => {
          if (day.date !== dayDate) {
            return day;
          }

          return {
            ...day,
            changes: day.changes.filter((change) => change.id !== changeId),
          };
        })
        .filter((day) => day.changes.length > 0)
    );
  }

  function renderTabButton(tab: Tab, label: string, icon: string) {
    const isActive = activeTab === tab;

    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={
          isActive
            ? "rounded-full bg-pink-500 px-4 py-3 text-sm font-black text-white shadow-lg transition hover:scale-105"
            : isDark
              ? "rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
              : "rounded-full border border-slate-200 bg-white/80 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-white"
        }
      >
        {icon} {label}
      </button>
    );
  }

  return (
    <main className={`app-shell theme-${theme} min-h-screen px-4 py-6`}>
      <div className="background-pattern" />

      <div
        className={
          isDark
            ? "pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-fuchsia-500/35 blur-3xl"
            : "pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-pink-400/60 blur-3xl"
        }
      />

      <div
        className={
          isDark
            ? "pointer-events-none absolute right-0 top-32 h-96 w-96 rounded-full bg-cyan-400/25 blur-3xl"
            : "pointer-events-none absolute right-0 top-32 h-96 w-96 rounded-full bg-sky-300/55 blur-3xl"
        }
      />

      <div
        className={
          isDark
            ? "pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl"
            : "pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-yellow-200/45 blur-3xl"
        }
      />

      <section className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6">
        <header
          className={
            isDark
              ? "rounded-[2rem] border border-white/10 bg-slate-950/65 p-6 text-center shadow-2xl backdrop-blur"
              : "rounded-[2rem] border border-white/70 bg-white/75 p-6 text-center shadow-xl backdrop-blur"
          }
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="hidden md:block md:w-40" />

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-pink-500">
                Mood Life
              </p>

              <h1
                className={
                  isDark
                    ? "mt-3 text-4xl font-black text-white md:text-5xl"
                    : "mt-3 text-4xl font-black text-slate-900 md:text-5xl"
                }
              >
                Mes besoins du jour
              </h1>

              <p
                className={
                  isDark ? "mt-3 text-slate-300" : "mt-3 text-slate-600"
                }
              >
                Déplace les cœurs pour indiquer ton état actuel.
              </p>
            </div>

            <div className="md:w-40 md:text-right">
              <button
                onClick={toggleTheme}
                className={
                  isDark
                    ? "rounded-full bg-white px-5 py-3 font-bold text-slate-950 shadow-lg transition hover:scale-105"
                    : "rounded-full bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105"
                }
              >
                {isDark ? "☀️ Mode clair" : "🌙 Mode sombre"}
              </button>
            </div>
          </div>
        </header>

        {authLoading ? (
          <section
            className={
              isDark
                ? "rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 text-center font-bold text-slate-200 shadow-2xl backdrop-blur"
                : "rounded-[2rem] border border-white/70 bg-white/75 p-5 text-center font-bold text-slate-700 shadow-xl backdrop-blur"
            }
          >
            Vérification de la connexion...
          </section>
        ) : user ? (
          <section
            className={
              isDark
                ? "rounded-[2rem] border border-emerald-300/20 bg-emerald-400/10 p-5 shadow-2xl backdrop-blur"
                : "rounded-[2rem] border border-emerald-200 bg-emerald-50/90 p-5 shadow-xl backdrop-blur"
            }
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2
                  className={
                    isDark
                      ? "text-xl font-bold text-emerald-100"
                      : "text-xl font-bold text-emerald-800"
                  }
                >
                  Connecté
                </h2>

                <p
                  className={
                    isDark
                      ? "mt-1 text-sm text-emerald-100/80"
                      : "mt-1 text-sm text-emerald-700"
                  }
                >
                  Compte actif :{" "}
                  <strong>{profile?.display_name ?? "Pseudo non défini"}</strong>
                </p>

                <p
                  className={
                    isDark
                      ? "mt-1 text-xs text-emerald-100/60"
                      : "mt-1 text-xs text-emerald-700/80"
                  }
                >
                  Ton email sert uniquement à te connecter. Il ne sera pas
                  affiché aux autres utilisateurs.
                </p>
              </div>

              <button
                onClick={logout}
                className={
                  isDark
                    ? "rounded-full bg-white px-5 py-3 font-bold text-slate-950 shadow-lg transition hover:scale-105"
                    : "rounded-full bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105"
                }
              >
                Se déconnecter
              </button>
            </div>
          </section>
        ) : (
          <AuthPanel isDark={isDark} onAuthSuccess={setUser} />
        )}

        {user && (
          <ProfilePanel
            isDark={isDark}
            displayName={profile?.display_name ?? ""}
            onSave={saveProfile}
          />
        )}

        {user && (
          <nav
            className={
              isDark
                ? "sticky top-3 z-30 rounded-[2rem] border border-white/10 bg-slate-950/80 p-3 shadow-2xl backdrop-blur"
                : "sticky top-3 z-30 rounded-[2rem] border border-white/70 bg-white/80 p-3 shadow-xl backdrop-blur"
            }
          >
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {renderTabButton("needs", "Besoins", "❤️")}
              {renderTabButton("duo", "Duo", "👥")}
              {renderTabButton("share", "Partage", "🔗")}
              {renderTabButton("history", "Historique", "🕒")}
            </div>
          </nav>
        )}

        {user && activeTab === "share" && (
          <>
            <SharePanel isDark={isDark} user={user} />
            <SharedMoodsPanel isDark={isDark} user={user} />
          </>
        )}

        {user && activeTab === "duo" && (
          <CoupleViewPanel
            isDark={isDark}
            user={user}
            currentNeeds={needs}
            currentDisplayName={profile?.display_name ?? "Moi"}
          />
        )}

        {activeTab === "needs" && (
          <section className="grid gap-4 md:grid-cols-2">
            {needs.map((need) => (
              <NeedSlider
                key={need.id}
                need={need}
                isDark={isDark}
                onChange={(value) => updateNeed(need.id, value)}
              />
            ))}
          </section>
        )}

        {activeTab === "needs" && (
          <section
            className={
              isDark
                ? "rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur"
                : "rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur"
            }
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2
                  className={
                    isDark ? "text-xl font-bold text-white" : "text-xl font-bold"
                  }
                >
                  Résumé
                </h2>

                <p
                  className={
                    isDark
                      ? "mt-1 text-sm text-slate-300"
                      : "mt-1 text-sm text-slate-600"
                  }
                >
                  Moyenne actuelle :{" "}
                  <span className="font-black text-pink-500">
                    {getAverage(needs)}%
                  </span>
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={saveMoodChange}
                  disabled={isSaving}
                  className="rounded-full bg-pink-500 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Enregistrement..." : "💾 Enregistrer"}
                </button>

                <button
                  onClick={resetNeeds}
                  className={
                    isDark
                      ? "rounded-full bg-white px-5 py-3 font-bold text-slate-950 shadow-lg transition hover:scale-105"
                      : "rounded-full bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105"
                  }
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            {saveMessage && (
              <div
                className={
                  isDark
                    ? "mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-center font-bold text-emerald-200"
                    : "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center font-bold text-emerald-700"
                }
              >
                {saveMessage}
              </div>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {needs.map((need) => (
                <div
                  key={need.id}
                  className={
                    isDark
                      ? "rounded-2xl border border-white/10 bg-white/10 p-4 text-center shadow"
                      : "rounded-2xl bg-white p-4 text-center shadow"
                  }
                >
                  <div className="text-3xl">{need.icon}</div>
                  <div
                    className={
                      isDark ? "mt-2 font-bold text-white" : "mt-2 font-bold"
                    }
                  >
                    {need.label}
                  </div>
                  <div className="text-2xl font-black text-pink-500">
                    {need.value}%
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "history" && (
          <section
            className={
              isDark
                ? "rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur"
                : "rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur"
            }
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2
                  className={
                    isDark ? "text-xl font-bold text-white" : "text-xl font-bold"
                  }
                >
                  Historique
                </h2>

                <p
                  className={
                    isDark
                      ? "mt-1 text-sm text-slate-300"
                      : "mt-1 text-sm text-slate-600"
                  }
                >
                  Les changements sont regroupés par jour, puis par heure.
                </p>

                {historyLoading && (
                  <p
                    className={
                      isDark
                        ? "mt-1 text-sm font-bold text-pink-200"
                        : "mt-1 text-sm font-bold text-pink-600"
                    }
                  >
                    Chargement de l’historique en ligne...
                  </p>
                )}
              </div>

              {history.length > 0 && (
                <button
                  onClick={deleteHistory}
                  className={
                    isDark
                      ? "rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
                      : "rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                  }
                >
                  Supprimer l’historique
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div
                className={
                  isDark
                    ? "mt-4 rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-slate-300"
                    : "mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-slate-600"
                }
              >
                Aucun historique pour le moment. Clique sur{" "}
                <strong>“Enregistrer”</strong> pour créer la première entrée.
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-5">
                {history.map((day) => (
                  <article
                    key={day.date}
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
                              ? "text-lg font-black capitalize text-white"
                              : "text-lg font-black capitalize text-slate-900"
                          }
                        >
                          {formatDate(day.date)}
                        </h3>

                        <p
                          className={
                            isDark
                              ? "text-sm text-slate-300"
                              : "text-sm text-slate-600"
                          }
                        >
                          {day.changes.length} changement
                          {day.changes.length > 1 ? "s" : ""} enregistré
                          {day.changes.length > 1 ? "s" : ""}
                        </p>
                      </div>

                      {day.date === todayKey && (
                        <span className="w-fit rounded-full bg-pink-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                          Aujourd’hui
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                      {day.changes.map((change) => {
                        const average = getAverage(change.needs);
                        const lowestNeed = getLowestNeed(change.needs);

                        return (
                          <div
                            key={change.id}
                            className={
                              isDark
                                ? "rounded-2xl bg-slate-950/45 p-4"
                                : "rounded-2xl bg-slate-50 p-4"
                            }
                          >
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <h4
                                  className={
                                    isDark
                                      ? "font-black text-white"
                                      : "font-black text-slate-900"
                                  }
                                >
                                  🕒 {formatTime(change.timestamp)}
                                </h4>

                                <p
                                  className={
                                    isDark
                                      ? "text-sm text-slate-300"
                                      : "text-sm text-slate-600"
                                  }
                                >
                                  Moyenne :{" "}
                                  <span className="font-black text-pink-500">
                                    {average}%
                                  </span>{" "}
                                  · Plus bas :{" "}
                                  <span className="font-black text-pink-500">
                                    {lowestNeed.icon} {lowestNeed.label}{" "}
                                    {lowestNeed.value}%
                                  </span>
                                </p>
                              </div>

                              <button
                                onClick={() =>
                                  deleteChange(day.date, change.id)
                                }
                                className={
                                  isDark
                                    ? "w-fit rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10"
                                    : "w-fit rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-white"
                                }
                              >
                                Supprimer
                              </button>
                            </div>

                            <div className="mt-3 grid gap-2 md:grid-cols-6">
                              {change.needs.map((need) => (
                                <div
                                  key={need.id}
                                  className={
                                    isDark
                                      ? "rounded-2xl bg-white/5 p-3 text-center"
                                      : "rounded-2xl bg-white p-3 text-center shadow-sm"
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
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer
          className={
            isDark
              ? "flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between"
              : "flex flex-col gap-3 rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-xl backdrop-blur md:flex-row md:items-center md:justify-between"
          }
        >
          <p
            className={
              isDark ? "text-sm text-slate-300" : "text-sm text-slate-600"
            }
          >
            {user
              ? "Les nouveaux enregistrements sont sauvegardés en ligne."
              : "Sans connexion, les valeurs restent sauvegardées localement sur cet appareil."}
          </p>

          <p
            className={
              isDark ? "text-sm text-slate-400" : "text-sm text-slate-500"
            }
          >
            Prochaine étape : application installable sur téléphone.
          </p>
        </footer>
      </section>
    </main>
  );
}

function NeedSlider({
  need,
  isDark,
  onChange,
}: {
  need: Need;
  isDark: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <article
      className={
        isDark
          ? "rounded-[2rem] border-4 border-white/15 bg-slate-950/70 p-4 shadow-2xl backdrop-blur"
          : "rounded-[2rem] border-4 border-slate-800 bg-white/90 p-4 shadow-xl backdrop-blur"
      }
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className={
            isDark
              ? "flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl"
              : "flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-3xl"
          }
        >
          {need.icon}
        </div>

        <div>
          <h2
            className={
              isDark
                ? "text-2xl font-black text-white"
                : "text-2xl font-black text-slate-900"
            }
          >
            {need.label}
          </h2>

          <p
            className={
              isDark
                ? "text-sm font-semibold text-slate-300"
                : "text-sm font-semibold text-slate-500"
            }
          >
            Niveau actuel : {need.value}%
          </p>
        </div>
      </div>

      <div
        className={
          isDark
            ? "rounded-2xl border-4 border-white/15 bg-slate-900/60 p-4 shadow-inner"
            : "rounded-2xl border-4 border-slate-800 bg-white/80 p-4 shadow-inner"
        }
      >
        <div className="relative h-8">
          <div
            className={
              isDark
                ? "absolute inset-0 rounded-full bg-gradient-to-r from-rose-500 via-amber-300 to-emerald-400"
                : "absolute inset-0 rounded-full bg-gradient-to-r from-red-400 via-yellow-300 to-green-400"
            }
          />

          <div
            className={
              isDark
                ? "absolute inset-0 rounded-full border-4 border-white/25 bg-slate-950/30"
                : "absolute inset-0 rounded-full border-4 border-slate-800/80 bg-white/20"
            }
          />

          <input
            type="range"
            min="0"
            max="100"
            value={need.value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="mood-slider absolute inset-0 z-10 h-full w-full opacity-0"
            aria-label={need.label}
          />

          <div
            className="pointer-events-none absolute top-1/2 z-20 -translate-y-1/2 text-4xl drop-shadow"
            style={{
              left: `calc(${need.value}% - 18px)`,
            }}
          >
            ❤️
          </div>
        </div>
      </div>
    </article>
  );
}