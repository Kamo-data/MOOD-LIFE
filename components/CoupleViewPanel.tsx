"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type CoupleViewPanelProps = {
  isDark: boolean;
  user: User;
  currentNeeds: OwnNeed[];
  currentDisplayName: string;
};

type OwnNeed = {
  id: string;
  label: string;
  icon: string;
  value: number;
};

type SharedNeed = {
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

const defaultNeeds: SharedNeed[] = [
  { id: "bladder", label: "Vessie", icon: "🚽", value: null },
  { id: "hunger", label: "Faim", icon: "🍽️", value: null },
  { id: "energy", label: "Énergie", icon: "💤", value: null },
  { id: "fun", label: "Divertissement", icon: "🎮", value: null },
  { id: "social", label: "Social", icon: "💬", value: null },
  { id: "hygiene", label: "Hygiène", icon: "🧼", value: null },
];

function rowToNeeds(row: SharedMoodRow): SharedNeed[] {
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

function getAverage(needs: Array<OwnNeed | SharedNeed>) {
  const visibleNeeds = needs.filter((need) => need.value !== null);

  if (visibleNeeds.length === 0) {
    return null;
  }

  const total = visibleNeeds.reduce((sum, need) => sum + (need.value ?? 0), 0);
  return Math.round(total / visibleNeeds.length);
}

function getLowestNeed(needs: Array<OwnNeed | SharedNeed>) {
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
  const [contacts, setContacts] = useState<SharedMoodRow[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedContact =
    contacts.find((contact) => contact.owner_id === selectedContactId) ?? null;

  useEffect(() => {
    loadContactsWhoShareWithMe();
  }, [user.id]);

  async function loadContactsWhoShareWithMe() {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("get_shared_latest_moods");

    if (error) {
      setMessage(`Erreur moods partagés : ${error.message}`);
      setIsLoading(false);
      return;
    }

    const nextContacts = (data ?? []) as SharedMoodRow[];

    setContacts(nextContacts);

    if (!selectedContactId && nextContacts.length > 0) {
      setSelectedContactId(nextContacts[0].owner_id);
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
            Compare tes besoins actuels avec les jauges que ton contact a choisi
            de partager.
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
              <option key={contact.owner_id} value={contact.owner_id}>
                {contact.owner_display_name ?? "Contact sans pseudo"}
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
      ) : selectedContact?.entry_id && selectedContact.created_at ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <MoodCard
            isDark={isDark}
            title={currentDisplayName || "Moi"}
            subtitle="Maintenant"
            needs={currentNeeds}
          />

          <MoodCard
            isDark={isDark}
            title={selectedContact.owner_display_name ?? "Contact sans pseudo"}
            subtitle={`Dernier mood · ${formatDateTime(
              selectedContact.created_at
            )}`}
            needs={rowToNeeds(selectedContact)}
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
              👤 {selectedContact?.owner_display_name ?? "Contact sans pseudo"}
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
  needs: Array<OwnNeed | SharedNeed>;
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
              isDark
                ? "mt-1 text-sm text-slate-300"
                : "mt-1 text-sm text-slate-600"
            }
          >
            {subtitle}
          </p>
        </div>

        <div className="w-fit rounded-full bg-pink-500 px-4 py-2 text-sm font-black text-white">
          {average === null ? "Masqué" : `${average}%`}
        </div>
      </div>

      <p
        className={
          isDark ? "mt-3 text-sm text-slate-300" : "mt-3 text-sm text-slate-600"
        }
      >
        Plus bas :{" "}
        <span className="font-black text-pink-500">
          {lowestNeed
            ? `${lowestNeed.icon} ${lowestNeed.label} ${lowestNeed.value}%`
            : "masqué"}
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

              <span className="font-black text-pink-500">
                {need.value === null ? "Masqué" : `${need.value}%`}
              </span>
            </div>

            <div
              className={
                isDark
                  ? "mt-2 h-2 overflow-hidden rounded-full bg-white/10"
                  : "mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
              }
            >
              {need.value !== null && (
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-300 to-green-400"
                  style={{ width: `${need.value}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}