"use client";

import { useMemo, useState } from "react";

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

type ChartMode =
  | "average"
  | "bladder"
  | "hunger"
  | "energy"
  | "fun"
  | "social"
  | "hygiene";

type ChartPoint = {
  date: string;
  label: string;
  value: number;
};

const chartOptions: { id: ChartMode; label: string; icon: string }[] = [
  { id: "average", label: "Moyenne", icon: "❤️" },
  { id: "bladder", label: "Vessie", icon: "🚽" },
  { id: "hunger", label: "Faim", icon: "🍽️" },
  { id: "energy", label: "Énergie", icon: "💤" },
  { id: "fun", label: "Divertissement", icon: "🎮" },
  { id: "social", label: "Social", icon: "💬" },
  { id: "hygiene", label: "Hygiène", icon: "🧼" },
];

function getAverage(needs: Need[]) {
  const total = needs.reduce((sum, need) => sum + need.value, 0);
  return Math.round(total / needs.length);
}

function getLatestChange(day: HistoryDay) {
  return [...day.changes].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  )[0];
}

function formatShortDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getNeedValue(needs: Need[], mode: ChartMode) {
  if (mode === "average") {
    return getAverage(needs);
  }

  return needs.find((need) => need.id === mode)?.value ?? 0;
}

function getLowestNeed(needs: Need[]) {
  return [...needs].sort((a, b) => a.value - b.value)[0];
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

  const result = Object.values(counts).sort((a, b) => b.count - a.count)[0];

  return result ?? null;
}

function buildChartPoints(
  history: HistoryDay[],
  mode: ChartMode,
  daysToShow: number
): ChartPoint[] {
  return [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-daysToShow)
    .map((day) => {
      const latestChange = getLatestChange(day);

      return {
        date: day.date,
        label: formatShortDate(day.date),
        value: latestChange ? getNeedValue(latestChange.needs, mode) : 0,
      };
    });
}

export function HistoryChartsPanel({
  isDark,
  history,
}: HistoryChartsPanelProps) {
  const [mode, setMode] = useState<ChartMode>("average");
  const [daysToShow, setDaysToShow] = useState(7);

  const points = useMemo(
    () => buildChartPoints(history, mode, daysToShow),
    [history, mode, daysToShow]
  );

  const mostOftenLowestNeed = useMemo(
    () => getMostOftenLowestNeed(history),
    [history]
  );

  const values = points.map((point) => point.value);
  const latestValue = values.at(-1) ?? null;
  const previousValue = values.at(-2) ?? null;
  const minValue = values.length > 0 ? Math.min(...values) : null;
  const maxValue = values.length > 0 ? Math.max(...values) : null;
  const trend =
    latestValue !== null && previousValue !== null
      ? latestValue - previousValue
      : null;

  const width = 640;
  const height = 220;
  const paddingX = 36;
  const paddingY = 28;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const svgPoints = points.map((point, index) => {
    const x =
      points.length === 1
        ? width / 2
        : paddingX + (index / (points.length - 1)) * chartWidth;

    const y = paddingY + ((100 - point.value) / 100) * chartHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const linePath =
    svgPoints.length > 0
      ? svgPoints
          .map((point, index) =>
            index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
          )
          .join(" ")
      : "";

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
            La courbe utilise le dernier mood enregistré de chaque journée.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as ChartMode)}
            className={
              isDark
                ? "rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-pink-400"
                : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-pink-400"
            }
          >
            {chartOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>

          <select
            value={daysToShow}
            onChange={(event) => setDaysToShow(Number(event.target.value))}
            className={
              isDark
                ? "rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-pink-400"
                : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-pink-400"
            }
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
          </select>
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
                className="min-w-[520px]"
                role="img"
                aria-label="Graphique d'évolution des moods"
              >
                {[0, 25, 50, 75, 100].map((level) => {
                  const y = paddingY + ((100 - level) / 100) * chartHeight;

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

                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {svgPoints.map((point) => (
                  <g key={point.date}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="7"
                      fill="#ec4899"
                      stroke={isDark ? "#0f172a" : "#ffffff"}
                      strokeWidth="3"
                    />
                    <text
                      x={point.x}
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

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <StatCard
              isDark={isDark}
              label="Dernière valeur"
              value={latestValue === null ? "—" : `${latestValue}%`}
            />

            <StatCard
              isDark={isDark}
              label="Minimum"
              value={minValue === null ? "—" : `${minValue}%`}
            />

            <StatCard
              isDark={isDark}
              label="Maximum"
              value={maxValue === null ? "—" : `${maxValue}%`}
            />

            <StatCard
              isDark={isDark}
              label="Tendance"
              value={
                trend === null
                  ? "—"
                  : trend > 0
                    ? `+${trend}%`
                    : `${trend}%`
              }
            />
          </div>

          {mostOftenLowestNeed && (
            <div
              className={
                isDark
                  ? "mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200"
                  : "mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
              }
            >
              Besoin le plus souvent bas :{" "}
              <strong className="text-pink-500">
                {mostOftenLowestNeed.icon} {mostOftenLowestNeed.label}
              </strong>{" "}
              sur {mostOftenLowestNeed.count} enregistrement
              {mostOftenLowestNeed.count > 1 ? "s" : ""}.
            </div>
          )}
        </>
      )}
    </section>
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
          isDark ? "text-xs font-bold text-slate-300" : "text-xs font-bold text-slate-500"
        }
      >
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-pink-500">{value}</p>
    </div>
  );
}