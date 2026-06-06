"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type CoupleViewPanelProps = {
  isDark: boolean;
  user: User;
  currentNeeds: OwnNeed[];
  currentDisplayName: string;
  history: OwnHistoryDay[];
};

type NeedId =
  | "bladder"
  | "hunger"
  | "energy"
  | "fun"
  | "social"
  | "hygiene";

type OwnNeed = {
  id: string;
  label: string;
  icon: string;
  value: number;
};

type SharedNeed = {
  id: NeedId;
  label: string;
  icon: string;
  value: number | null;
};

type OwnHistoryChange = {
  id: string;
  timestamp: string;
  needs: OwnNeed[];
};

type OwnHistoryDay = {
  date: string;
  changes: OwnHistoryChange[];
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
  can_view_history?: boolean;
};

type SharedHistoryRow = {
  owner_id: string;
  owner_display_name: string | null;
  entry_id: string;
  created_at: string;
  bladder: number | null;
  hunger: number | null;
  energy: number | null;
  fun: number | null;
  social: number | null;
  hygiene: number | null;
};

type DuoChartPoint = {
  label: string;
  mine: number | null;
  contact: number | null;
};

const needsConfig: SharedNeed[] = [
  { id: "bladder", label: "Vessie", icon: "🚽", value: null },
  { id: "hunger", label: "Faim", icon: "🍽️", value: null },
  { id: "energy", label: "Énergie", icon: "💤", value: null },
  { id: "fun", label: "Divertissement", icon: "🎮", value: null },
  { id: "social", label: "Social", icon: "💬", value: null },
  { id: "hygiene", label: "Hygiène", icon: "🧼", value: null },
];

const suggestionByNeed: Record<NeedId, string> = {
  bladder: "Vous avez tous les deux besoin d’une petite pause. Rien de glamour, mais parfois ça sauve l’ambiance.",
  hunger: "Vous avez tous les deux faim. Pourquoi ne pas préparer ou commander quelque chose ensemble ?",
  energy: "Vous manquez tous les deux d’énergie. Une soirée calme, un plaid et zéro pression semblent être une bonne idée.",
  fun: "Vous avez tous les deux besoin de divertissement. Pourquoi ne pas lancer un jeu, une série ou une activité légère ensemble ?",
  social: "Vous avez tous les deux besoin de social. Un vrai moment de discussion, sans téléphone, pourrait vous faire du bien.",
  hygiene: "Vous avez tous les deux besoin de confort et de fraîcheur. Une douche, un bain ou une petite routine cocooning peut relancer la soirée.",
};

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(dateKey: string) {
  const today = new Date();
  const yesterday = new Date();
  const beforeYesterday = new Date();

  yesterday.setDate(today.getDate() - 1);
  beforeYesterday.setDate(today.getDate() - 2);

  if (dateKey === getDateKey(today)) {
    return "Aujourd’hui";
  }

  if (dateKey === getDateKey(yesterday)) {
    return "Hier";
  }

  if (dateKey === getDateKey(beforeYesterday)) {
    return "Avant-hier";
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function getOwnNeedValue(needs: OwnNeed[], needId: NeedId) {
  return needs.find((need) => need.id === needId)?.value ?? null;
}

function getSharedNeedValue(
  row: SharedMoodRow | SharedHistoryRow,
  needId: NeedId
) {
  return row[needId];
}

function rowToNeeds(row: SharedMoodRow | SharedHistoryRow): SharedNeed[] {
  return needsConfig.map((need) => ({
    ...need,
    value: getSharedNeedValue(row, need.id),
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

function buildAvailableDates(
  ownHistory: OwnHistoryDay[],
  sharedHistory: SharedHistoryRow[]
) {
  const dates = new Set<string>();

  ownHistory.forEach((day) => dates.add(day.date));
  sharedHistory.forEach((entry) => dates.add(getDateKey(new Date(entry.created_at))));

  dates.add(getDateKey());

  return Array.from(dates).sort((a, b) => b.localeCompare(a));
}

function buildDuoChartPoints({
  ownHistory,
  sharedHistory,
  selectedDate,
  selectedNeed,
}: {
  ownHistory: OwnHistoryDay[];
  sharedHistory: SharedHistoryRow[];
  selectedDate: string;
  selectedNeed: NeedId;
}): DuoChartPoint[] {
  const pointsByLabel: Record<string, DuoChartPoint> = {};

  const ownDay = ownHistory.find((day) => day.date === selectedDate);

  if (ownDay) {
    ownDay.changes
      .slice()
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .forEach((change) => {
        const label = formatTime(change.timestamp);

        pointsByLabel[label] = {
          label,
          mine: getOwnNeedValue(change.needs, selectedNeed),
          contact: pointsByLabel[label]?.contact ?? null,
        };
      });
  }

  sharedHistory
    .filter((entry) => getDateKey(new Date(entry.created_at)) === selectedDate)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .forEach((entry) => {
      const label = formatTime(entry.created_at);

      pointsByLabel[label] = {
        label,
        mine: pointsByLabel[label]?.mine ?? null,
        contact: getSharedNeedValue(entry, selectedNeed),
      };
    });

  return Object.values(pointsByLabel).sort((a, b) => a.label.localeCompare(b.label));
}

function getLatestOwnChangeForDate(history: OwnHistoryDay[], selectedDate: string) {
  const day = history.find((item) => item.date === selectedDate);

  return (
    day?.changes
      .slice()
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0] ?? null
  );
}

function getLatestSharedEntryForDate(
  sharedHistory: SharedHistoryRow[],
  selectedDate: string
) {
  return (
    sharedHistory
      .filter((entry) => getDateKey(new Date(entry.created_at)) === selectedDate)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
  );
}

function getSharedSuggestion(
  ownNeeds: OwnNeed[] | null,
  sharedNeeds: SharedNeed[] | null
) {
  if (!ownNeeds || !sharedNeeds) {
    return null;
  }

  const commonLowNeeds = needsConfig
    .map((need) => {
      const mine = getOwnNeedValue(ownNeeds, need.id);
      const contact = sharedNeeds.find((item) => item.id === need.id)?.value ?? null;

      return {
        ...need,
        mine,
        contact,
      };
    })
    .filter(
      (need) =>
        need.mine !== null &&
        need.contact !== null &&
        need.mine <= 55 &&
        need.contact <= 55
    )
    .sort((a, b) => (a.mine ?? 0) + (a.contact ?? 0) - ((b.mine ?? 0) + (b.contact ?? 0)));

  const bestMatch = commonLowNeeds[0];

  if (!bestMatch) {
    return null;
  }

  return suggestionByNeed[bestMatch.id];
}

export function CoupleViewPanel({
  isDark,
  user,
  currentNeeds,
  currentDisplayName,
  history,
}: CoupleViewPanelProps) {
  const [contacts, setContacts] = useState<SharedMoodRow[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedNeed, setSelectedNeed] = useState<NeedId>("fun");
  const [selectedDate, setSelectedDate] = useState(getDateKey());
  const [sharedHistory, setSharedHistory] = useState<SharedHistoryRow[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const selectedContact =
    contacts.find((contact) => contact.owner_id === selectedContactId) ?? null;

  const availableDates = useMemo(
    () => buildAvailableDates(history, sharedHistory),
    [history, sharedHistory]
  );

  const effectiveSelectedDate = availableDates.includes(selectedDate)
    ? selectedDate
    : availableDates[0] ?? getDateKey();

  const chartPoints = useMemo(
    () =>
      buildDuoChartPoints({
        ownHistory: history,
        sharedHistory,
        selectedDate: effectiveSelectedDate,
        selectedNeed,
      }),
    [history, sharedHistory, effectiveSelectedDate, selectedNeed]
  );

  const latestOwnChange = getLatestOwnChangeForDate(history, effectiveSelectedDate);
  const latestSharedEntry = getLatestSharedEntryForDate(
    sharedHistory,
    effectiveSelectedDate
  );

  const suggestion = getSharedSuggestion(
    latestOwnChange?.needs ?? currentNeeds,
    latestSharedEntry ? rowToNeeds(latestSharedEntry) : selectedContact ? rowToNeeds(selectedContact) : null
  );

  useEffect(() => {
    loadContactsWhoShareWithMe();
  }, [user.id]);

  useEffect(() => {
    if (selectedContactId) {
      loadSharedHistory(selectedContactId);
    }
  }, [selectedContactId]);

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

  async function loadSharedHistory(ownerId: string) {
    setIsLoadingHistory(true);
    setMessage("");

    const { data, error } = await supabase.rpc("get_shared_history_moods", {
      shared_owner_id: ownerId,
    });

    if (error) {
      setSharedHistory([]);
      setMessage(
        "Historique partagé indisponible. Le contact doit autoriser “Voir mon historique” dans ses réglages de partage."
      );
      setIsLoadingHistory(false);
      return;
    }

    setSharedHistory((data ?? []) as SharedHistoryRow[]);
    setIsLoadingHistory(false);
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
            Compare tes besoins avec ceux qu’un contact a choisi de partager.
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

      {contacts.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label
              className={
                isDark
                  ? "text-sm font-bold text-slate-200"
                  : "text-sm font-bold text-slate-700"
              }
            >
              Contact
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

          <div>
            <label
              className={
                isDark
                  ? "text-sm font-bold text-slate-200"
                  : "text-sm font-bold text-slate-700"
              }
            >
              Besoin
            </label>

            <select
              value={selectedNeed}
              onChange={(event) => setSelectedNeed(event.target.value as NeedId)}
              className={
                isDark
                  ? "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-pink-400"
                  : "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-pink-400"
              }
            >
              {needsConfig.map((need) => (
                <option key={need.id} value={need.id}>
                  {need.icon} {need.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className={
                isDark
                  ? "text-sm font-bold text-slate-200"
                  : "text-sm font-bold text-slate-700"
              }
            >
              Journée
            </label>

            <select
              value={effectiveSelectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className={
                isDark
                  ? "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-pink-400"
                  : "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-pink-400"
              }
            >
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {formatDateLabel(date)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {message && (
        <div
          className={
            isDark
              ? "mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3 text-sm font-bold text-amber-100"
              : "mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700"
          }
        >
          {message}
        </div>
      )}

      {isLoading ? (
        <EmptyState isDark={isDark} label="Chargement de la vue duo..." />
      ) : contacts.length === 0 ? (
        <EmptyState
          isDark={isDark}
          label="Aucun contact ne partage encore ses moods avec toi."
        />
      ) : (
        <>
          {suggestion && (
            <div
              className={
                isDark
                  ? "mt-5 rounded-3xl border border-pink-300/20 bg-pink-400/10 p-5 text-pink-100"
                  : "mt-5 rounded-3xl border border-pink-200 bg-pink-50 p-5 text-pink-800"
              }
            >
              <p className="text-lg font-black">💡 Petite idée duo</p>
              <p className="mt-2 text-sm font-bold">{suggestion}</p>
            </div>
          )}

          <DuoLineChart
            isDark={isDark}
            points={chartPoints}
            selectedNeed={needsConfig.find((need) => need.id === selectedNeed)}
            isLoadingHistory={isLoadingHistory}
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <MoodCard
              isDark={isDark}
              title={currentDisplayName || "Moi"}
              subtitle="Maintenant"
              needs={currentNeeds}
            />

            {selectedContact?.entry_id && selectedContact.created_at ? (
              <MoodCard
                isDark={isDark}
                title={selectedContact.owner_display_name ?? "Contact sans pseudo"}
                subtitle={`Dernier mood · ${formatTime(
                  selectedContact.created_at
                )}`}
                needs={rowToNeeds(selectedContact)}
              />
            ) : (
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
            )}
          </div>
        </>
      )}
    </section>
  );
}

function DuoLineChart({
  isDark,
  points,
  selectedNeed,
  isLoadingHistory,
}: {
  isDark: boolean;
  points: DuoChartPoint[];
  selectedNeed?: SharedNeed;
  isLoadingHistory: boolean;
}) {
  const width = 720;
  const height = 260;
  const paddingX = 42;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const hasMine = points.some((point) => point.mine !== null);
  const hasContact = points.some((point) => point.contact !== null);

  function getX(index: number) {
    if (points.length === 1) {
      return width / 2;
    }

    return paddingX + (index / (points.length - 1)) * chartWidth;
  }

  function getY(value: number) {
    return paddingY + ((100 - value) / 100) * chartHeight;
  }

  function getPath(key: "mine" | "contact") {
    const validPoints = points
      .map((point, index) => ({
        ...point,
        index,
      }))
      .filter((point) => point[key] !== null);

    return validPoints
      .map((point, index) => {
        const x = getX(point.index);
        const y = getY(point[key] ?? 0);

        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(" ");
  }

  if (isLoadingHistory) {
    return <EmptyState isDark={isDark} label="Chargement du graphique duo..." />;
  }

  if (points.length === 0 || (!hasMine && !hasContact)) {
    return (
      <EmptyState
        isDark={isDark}
        label="Aucune donnée comparable pour cette journée. Pour comparer l’historique, le contact doit autoriser le partage de son historique."
      />
    );
  }

  return (
    <div
      className={
        isDark
          ? "mt-5 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/45 p-4"
          : "mt-5 overflow-hidden rounded-3xl border border-white bg-white p-4 shadow"
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={
            isDark
              ? "text-sm font-black text-white"
              : "text-sm font-black text-slate-900"
          }
        >
          {selectedNeed?.icon} {selectedNeed?.label}
        </span>

        <span className="rounded-full bg-pink-500 px-3 py-1 text-xs font-black text-white">
          ● Moi
        </span>

        <span className="rounded-full bg-cyan-500 px-3 py-1 text-xs font-black text-white">
          ● Contact
        </span>
      </div>

      <div className="mt-4 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[620px]"
          role="img"
          aria-label="Graphique comparatif duo"
        >
          {[0, 25, 50, 75, 100].map((level) => {
            const y = getY(level);

            return (
              <g key={level}>
                <line
                  x1={paddingX}
                  x2={width - paddingX}
                  y1={y}
                  y2={y}
                  stroke={isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0"}
                  strokeWidth="1"
                />
                <text
                  x={8}
                  y={y + 4}
                  fontSize="11"
                  fill={isDark ? "#cbd5e1" : "#64748b"}
                >
                  {level}
                </text>
              </g>
            );
          })}

          {hasMine && (
            <path
              d={getPath("mine")}
              fill="none"
              stroke="#ec4899"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {hasContact && (
            <path
              d={getPath("contact")}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((point, index) => (
            <g key={`${point.label}-${index}`}>
              {point.mine !== null && (
                <circle
                  cx={getX(index)}
                  cy={getY(point.mine)}
                  r="6"
                  fill="#ec4899"
                  stroke={isDark ? "#0f172a" : "#ffffff"}
                  strokeWidth="2"
                />
              )}

              {point.contact !== null && (
                <circle
                  cx={getX(index)}
                  cy={getY(point.contact)}
                  r="6"
                  fill="#06b6d4"
                  stroke={isDark ? "#0f172a" : "#ffffff"}
                  strokeWidth="2"
                />
              )}

              <text
                x={getX(index)}
                y={height - 8}
                textAnchor="middle"
                fontSize="11"
                fill={isDark ? "#cbd5e1" : "#64748b"}
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
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

function EmptyState({ isDark, label }: { isDark: boolean; label: string }) {
  return (
    <div
      className={
        isDark
          ? "mt-5 rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-slate-300"
          : "mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-slate-600"
      }
    >
      {label}
    </div>
  );
}