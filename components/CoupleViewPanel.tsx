"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type CoupleViewPanelProps = {
  isDark: boolean;
  user: User;
  currentNeeds: Need[];
  currentDisplayName: string;
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

type SharedContact = {
  id: string;
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
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CoupleViewPanel({
  isDark,
  user,
  currentNeeds,
  currentDisplayName,
}: CoupleViewPanelProps) {
  const [contacts, setContacts] = useState<SharedContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedContact =
    contacts.find((contact) => contact.id === selectedContactId) ?? null;

  useEffect(() => {
    loadContactsWhoShareWithMe();
  }, []);

  async function loadContactsWhoShareWithMe() {
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
      setContacts([]);
      setSelectedContactId("");
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
      setMessage(`Erreur moods : ${entriesError.message}`);
      setIsLoading(false);
      return;
    }

    const profileList = (profiles ?? []) as Profile[];
    const entryList = (entries ?? []) as MoodEntryRow[];

    const nextContacts = ownerIds.map((ownerId) => {
      const profile = profileList.find((item) => item.id === ownerId);
      const latestEntry =
        entryList.find((entry) => entry.user_id === ownerId) ?? null;

      return {
        id: ownerId,
        displayName: profile?.display_name ?? "Contact sans pseudo",
        latestEntry,
      };
    });

    setContacts(nextContacts);

    if (!selectedContactId && nextContacts.length > 0) {
      setSelectedContactId(nextContacts[0].id);
    }

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
            Vue duo
          </h2>

          <p
            className={
              isDark
                ? "mt-1 text-sm text-slate-300"
                : "mt-1 text-sm text-slate-600"
            }
          >
            Compare tes besoins actuels avec le dernier mood partagé par un
            contact.
          </p>
        </div>

        <button
          onClick={loadContactsWhoShareWithMe}
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

      {contacts.length > 0 && (
        <div className="mt-4">
          <label
            className={
              isDark
                ? "text-sm font-bold text-slate-200"
                : "text-sm font-bold text-slate-700"
            }
          >
            Contact à comparer
          </label>

          <select
            value={selectedContactId}
            onChange={(event) => setSelectedContactId(event.target.value)}
            className={
              isDark
                ? "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-pink-400"
                : "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-pink-400"
            }
          >
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.displayName}
              </option>
            ))}
          </select>
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
          Chargement de la vue duo...
        </div>
      ) : contacts.length === 0 ? (
        <div
          className={
            isDark
              ? "mt-4 rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-slate-300"
              : "mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-slate-600"
          }
        >
          Aucun contact ne partage encore ses moods avec toi.
        </div>
      ) : selectedContact?.latestEntry ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <MoodCard
            isDark={isDark}
            title={currentDisplayName || "Moi"}
            subtitle="Maintenant"
            needs={currentNeeds}
          />

          <MoodCard
            isDark={isDark}
            title={selectedContact.displayName}
            subtitle={`Dernier mood · ${formatDateTime(
              selectedContact.latestEntry.created_at
            )}`}
            needs={rowToNeeds(selectedContact.latestEntry)}
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <MoodCard
            isDark={isDark}
            title={currentDisplayName || "Moi"}
            subtitle="Maintenant"
            needs={currentNeeds}
          />

          <div
            className={
              isDark
                ? "rounded-3xl border border-white/10 bg-white/10 p-5 text-center text-slate-300"
                : "rounded-3xl border border-white bg-white p-5 text-center text-slate-600 shadow"
            }
          >
            <h3
              className={
                isDark
                  ? "text-lg font-black text-white"
                  : "text-lg font-black text-slate-900"
              }
            >
              👤 {selectedContact?.displayName}
            </h3>

            <p className="mt-3">
              Ce contact n’a pas encore enregistré de mood.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function MoodCard({
  isDark,
  title,
  subtitle,
  needs,
}: {
  isDark: boolean;
  title: string;
  subtitle: string;
  needs: Need[];
}) {
  const average = getAverage(needs);
  const lowestNeed = getLowestNeed(needs);

  return (
    <article
      className={
        isDark
          ? "rounded-3xl border border-white/10 bg-white/10 p-5"
          : "rounded-3xl border border-white bg-white p-5 shadow"
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
            {title}
          </h3>

          <p
            className={
              isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"
            }
          >
            {subtitle}
          </p>
        </div>

        <div className="w-fit rounded-full bg-pink-500 px-4 py-2 text-sm font-black text-white">
          {average}%
        </div>
      </div>

      <p
        className={
          isDark ? "mt-3 text-sm text-slate-300" : "mt-3 text-sm text-slate-600"
        }
      >
        Plus bas :{" "}
        <span className="font-black text-pink-500">
          {lowestNeed.icon} {lowestNeed.label} {lowestNeed.value}%
        </span>
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {needs.map((need) => (
          <div
            key={need.id}
            className={
              isDark
                ? "rounded-2xl bg-slate-950/45 p-3"
                : "rounded-2xl bg-slate-50 p-3"
            }
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={
                  isDark
                    ? "text-sm font-bold text-slate-200"
                    : "text-sm font-bold text-slate-700"
                }
              >
                {need.icon} {need.label}
              </span>

              <span className="font-black text-pink-500">{need.value}%</span>
            </div>

            <div
              className={
                isDark
                  ? "mt-2 h-2 overflow-hidden rounded-full bg-white/10"
                  : "mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
              }
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-300 to-green-400"
                style={{ width: `${need.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}