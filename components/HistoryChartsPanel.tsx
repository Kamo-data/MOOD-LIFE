"use client";

import { useMemo, useState } from "react";

type NeedId =
  | "bladder"
  | "hunger"
  | "energy"
  | "fun"
  | "social"
  | "hygiene";

type Need = {
  id: string;
  label: string;
  icon: string;
  value: number;
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

type HistoryChartsPanelProps = {
  isDark: boolean;
  history: HistoryDay[];
};

type ChartView = "day" | "week" | "month";

type NeedConfig = {
  id: NeedId;
  label: string;
  icon: string;
  color: string;
};

type ChartPoint = {
  label: string;
  bladder: number;
  hunger: number;
  energy: number;
  fun: number;
  social: number;
  hygiene: number;
};

const needsConfig: NeedConfig[] = [
  { id: "bladder", label: "Vessie", icon: "🚽", color: "#38bdf8" },
  { id: "hunger", label: "Faim", icon: "🍽️", color: "#f97316" },
  { id: "energy", label: "Énergie", icon: "💤", color: "#a855f7" },
  { id: "fun", label: "Divertissement", icon: "🎮", color: "#ec4899" },
  { id: "social", label: "Social", icon: "💬", color: "#22c55e" },
  { id: "hygiene", label: "Hygiène", icon: "🧼", color: "#eab308" },
];

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRelativeDateLabel(dateKey: string) {
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

function formatShortDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNeedValue(needs: Need[], id: NeedId) {
  return needs.find((need) => need.id === id)?.value ?? 0;
}

function getAverage(needs: Need[]) {
  const total = needs.reduce((sum, need) => sum + need.value, 0);
  return Math.round(total / needs.length);
}

function getLowestNeed(needs: Need[]) {
  return [...needs].sort((a, b) => a.value - b.value)[0];
}

function changeToChartPoint(change: HistoryChange, label: string): ChartPoint {
  return {
    label,
    bladder: getNeedValue(change.needs, "bladder"),
    hunger: getNeedValue(change.needs, "hunger"),
    energy: getNeedValue(change.needs, "energy"),
    fun: getNeedValue(change.needs, "fun"),
    social: getNeedValue(change.needs, "social"),
    hygiene: getNeedValue(change.needs, "hygiene"),
  };
}

function getLatestChange(day: HistoryDay) {
  return [...day.changes].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  )[0];
}

function getSelectedDayPoints(history: HistoryDay[], selectedDate: string) {
  const day = history.find((item) => item.date === selectedDate);

  if (!day) {
    return [];
  }

  return [...day.changes]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((change) => changeToChartPoint(change, formatTime(change.timestamp)));
}

function getPeriodPoints(history: HistoryDay[], daysToShow: number) {
  return [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-daysToShow)
    .map((day) => {
      const latestChange = getLatestChange(day);
      return changeToChartPoint(latestChange, formatShortDate(day.date));
    });
}

function getMostOftenLowestNeed(history: HistoryDay[]) {
  const counts: Record<string, { label: string; icon: string; count: number }> =
    {};

  history.forEach((day) => {
    day.changes.forEach((change) => {
      const lowestNeed = getLowestNeed(change.needs);

      if (!counts[lowestNeed.id]) {
        counts[lowestNeed.id] = {
          label: lowestNeed.label,
          icon: lowestNeed.icon,
          count: 0,
        };
      }

      counts[lowestNeed.id].count += 1;
    });
  });

  return Object.values(counts).sort((a, b) => b.count - a.count)[0] ?? null;
}

export function HistoryChartsPanel({
  isDark,
  history,
}: HistoryChartsPanelProps) {
  const sortedDays = useMemo(
    () => [...history].sort((a, b) => b.date.localeCompare(a.date)),
    [history]
  );

  const [view, setView] = useState<ChartView>("day");
  const [selectedDate, setSelectedDate] = useState(
    sortedDays[0]?.date ?? getDateKey()
  );

  const effectiveSelectedDate = sortedDays.some(
    (day) => day.date === selectedDate
  )
    ? selectedDate
    : sortedDays[0]?.date ?? getDateKey();

  const chartPoints = useMemo(() => {
    if (view === "day") {
      return getSelectedDayPoints(history, effectiveSelectedDate);
    }

    if (view === "week") {
      return getPeriodPoints(history, 7);
    }

    return getPeriodPoints(history, 30);
  }, [history, view, effectiveSelectedDate]);

  const selectedDay = history.find((day) => day.date === effectiveSelectedDate);
  const selectedDayChanges = selectedDay?.changes ?? [];
  const latestSelectedChange = selectedDayChanges
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

  const latestAverage = latestSelectedChange
    ? getAverage(latestSelectedChange.needs)
    : null;

  const lowestNeed = latestSelectedChange
    ? getLowestNeed(latestSelectedChange.needs)
    : null;

  const mostOftenLowestNeed = useMemo(
    () => getMostOftenLowestNeed(history),
    [history]
  );

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
            Graphiques
          </h2>

          <p
            className={
              isDark
                ? "mt-1 text-sm text-slate-300"
                : "mt-1 text-sm text-slate-600"
            }
          >
            Les six besoins sont affichés ensemble avec une couleur différente.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={view}
            onChange={(event) => setView(event.target.value as ChartView)}
            className={
              isDark
                ? "rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-pink-400"
                : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-pink-400"
            }
          >
            <option value="day">Vue par jour</option>
            <option value="week">Vue hebdo</option>
            <option value="month">Vue mensuelle</option>
          </select>

          {view === "day" && (
            <select
              value={effectiveSelectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className={
                isDark
                  ? "rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-pink-400"
                  : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-pink-400"
              }
            >
              {sortedDays.map((day) => (
                <option key={day.date} value={day.date}>
                  {getRelativeDateLabel(day.date)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div
          className={
            isDark
              ? "mt-4 rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-slate-300"
              : "mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-slate-600"
          }
        >
          Aucun graphique disponible pour le moment. Enregistre quelques moods
          pour voir l’évolution.
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {needsConfig.map((need) => (
              <div
                key={need.id}
                className={
                  isDark
                    ? "rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-slate-200"
                    : "rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"
                }
              >
                <span style={{ color: need.color }}>●</span> {need.icon}{" "}
                {need.label}
              </div>
            ))}
          </div>

          <MultiNeedChart
            isDark={isDark}
            points={chartPoints}
            emptyLabel={
              view === "day"
                ? "Aucun mood enregistré pour cette journée."
                : "Pas assez de données pour cette période."
            }
          />

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <StatCard
              isDark={isDark}
              label={
                view === "day"
                  ? "Enregistrements du jour"
                  : "Jours avec données"
              }
              value={`${chartPoints.length}`}
            />

            <StatCard
              isDark={isDark}
              label="Dernière moyenne"
              value={latestAverage === null ? "—" : `${latestAverage}%`}
            />

            <StatCard
              isDark={isDark}
              label="Plus bas récent"
              value={
                lowestNeed
                  ? `${lowestNeed.icon} ${lowestNeed.value}%`
                  : "—"
              }
            />

            <StatCard
              isDark={isDark}
              label="Besoin souvent bas"
              value={
                mostOftenLowestNeed
                  ? `${mostOftenLowestNeed.icon} ${mostOftenLowestNeed.count}x`
                  : "—"
              }
            />
          </div>

          {view === "day" && (
            <div
              className={
                isDark
                  ? "mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200"
                  : "mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
              }
            >
              Journée affichée :{" "}
              <strong className="text-pink-500">
                {getRelativeDateLabel(effectiveSelectedDate)}
              </strong>
              . Le graphique suit tous les changements enregistrés dans cette
              journée.
            </div>
          )}
        </>
      )}
    </section>
  );
}

function MultiNeedChart({
  isDark,
  points,
  emptyLabel,
}: {
  isDark: boolean;
  points: ChartPoint[];
  emptyLabel: string;
}) {
  const width = 720;
  const height = 260;
  const paddingX = 42;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  function getX(index: number) {
    if (points.length === 1) {
      return width / 2;
    }

    return paddingX + (index / (points.length - 1)) * chartWidth;
  }

  function getY(value: number) {
    return paddingY + ((100 - value) / 100) * chartHeight;
  }

  function getPath(needId: NeedId) {
    return points
      .map((point, index) => {
        const x = getX(index);
        const y = getY(point[needId]);

        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(" ");
  }

  if (points.length === 0) {
    return (
      <div
        className={
          isDark
            ? "mt-5 rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-slate-300"
            : "mt-5 rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-slate-600"
        }
      >
        {emptyLabel}
      </div>
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
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[620px]"
          role="img"
          aria-label="Graphique des six besoins"
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

          {needsConfig.map((need) => (
            <path
              key={need.id}
              d={getPath(need.id)}
              fill="none"
              stroke={need.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {points.map((point, index) => (
            <g key={`${point.label}-${index}`}>
              {needsConfig.map((need) => (
                <circle
                  key={need.id}
                  cx={getX(index)}
                  cy={getY(point[need.id])}
                  r="5"
                  fill={need.color}
                  stroke={isDark ? "#0f172a" : "#ffffff"}
                  strokeWidth="2"
                />
              ))}

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

function StatCard({
  isDark,
  label,
  value,
}: {
  isDark: boolean;
  label: string;
  value: string;
}) {
  return (
    <div
      className={
        isDark
          ? "rounded-2xl border border-white/10 bg-white/10 p-4 text-center"
          : "rounded-2xl bg-white p-4 text-center shadow"
      }
    >
      <p
        className={
          isDark
            ? "text-xs font-bold text-slate-300"
            : "text-xs font-bold text-slate-500"
        }
      >
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-pink-500">{value}</p>
    </div>
  );
}