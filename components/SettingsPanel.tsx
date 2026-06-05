"use client";

import type { User } from "@supabase/supabase-js";
import { InstallAppButton } from "./InstallAppButton";
import { ProfilePanel } from "./ProfilePanel";

type SettingsPanelProps = {
  isDark: boolean;
  user: User;
  displayName: string;
  onSaveProfile: (displayName: string) => Promise<void>;
  onToggleTheme: () => void;
  onLogout: () => Promise<void>;
};

export function SettingsPanel({
  isDark,
  user,
  displayName,
  onSaveProfile,
  onToggleTheme,
  onLogout,
}: SettingsPanelProps) {
  return (
    <section className="flex flex-col gap-5">
      <section
        className={
          isDark
            ? "rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur"
            : "rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur"
        }
      >
        <h2
          className={
            isDark ? "text-xl font-bold text-white" : "text-xl font-bold"
          }
        >
          Réglages
        </h2>

        <p
          className={
            isDark
              ? "mt-1 text-sm text-slate-300"
              : "mt-1 text-sm text-slate-600"
          }
        >
          Gère ton profil, l’installation de l’application, l’apparence et ta
          session.
        </p>

        <div
          className={
            isDark
              ? "mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4"
              : "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
          }
        >
          <p
            className={
              isDark
                ? "text-sm font-bold text-emerald-100"
                : "text-sm font-bold text-emerald-800"
            }
          >
            Compte connecté
          </p>

          <p
            className={
              isDark
                ? "mt-1 text-sm text-emerald-100/80"
                : "mt-1 text-sm text-emerald-700"
            }
          >
            Pseudo : <strong>{displayName || "Pseudo non défini"}</strong>
          </p>

          <p
            className={
              isDark
                ? "mt-1 text-xs text-emerald-100/60"
                : "mt-1 text-xs text-emerald-700/80"
            }
          >
            Email de connexion : <strong>{user.email}</strong>
          </p>

          <p
            className={
              isDark
                ? "mt-2 text-xs text-emerald-100/60"
                : "mt-2 text-xs text-emerald-700/80"
            }
          >
            Ton email sert uniquement à te connecter. Les autres utilisateurs ne
            voient que ton pseudo et uniquement les moods que tu choisis de
            partager.
          </p>
        </div>
      </section>

      <ProfilePanel
        isDark={isDark}
        displayName={displayName}
        onSave={onSaveProfile}
      />

      <section
        className={
          isDark
            ? "rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur"
            : "rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur"
        }
      >
        <h2
          className={
            isDark ? "text-xl font-bold text-white" : "text-xl font-bold"
          }
        >
          Application
        </h2>

        <p
          className={
            isDark
              ? "mt-1 text-sm text-slate-300"
              : "mt-1 text-sm text-slate-600"
          }
        >
          Installe Mood Life sur ton téléphone ou ton ordinateur pour l’utiliser
          comme une vraie application.
        </p>

        <div className="mt-4">
          <InstallAppButton isDark={isDark} />
        </div>
      </section>

      <section
        className={
          isDark
            ? "rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur"
            : "rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur"
        }
      >
        <h2
          className={
            isDark ? "text-xl font-bold text-white" : "text-xl font-bold"
          }
        >
          Apparence
        </h2>

        <p
          className={
            isDark
              ? "mt-1 text-sm text-slate-300"
              : "mt-1 text-sm text-slate-600"
          }
        >
          Change l’ambiance visuelle de l’application.
        </p>

        <button
          onClick={onToggleTheme}
          className={
            isDark
              ? "mt-4 rounded-full bg-white px-5 py-3 font-bold text-slate-950 shadow-lg transition hover:scale-105"
              : "mt-4 rounded-full bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105"
          }
        >
          {isDark ? "☀️ Passer en mode clair" : "🌙 Passer en mode sombre"}
        </button>
      </section>

      <section
        className={
          isDark
            ? "rounded-[2rem] border border-red-300/20 bg-red-400/10 p-5 shadow-2xl backdrop-blur"
            : "rounded-[2rem] border border-red-200 bg-red-50/90 p-5 shadow-xl backdrop-blur"
        }
      >
        <h2
          className={
            isDark ? "text-xl font-bold text-red-100" : "text-xl font-bold text-red-800"
          }
        >
          Session
        </h2>

        <p
          className={
            isDark
              ? "mt-1 text-sm text-red-100/80"
              : "mt-1 text-sm text-red-700"
          }
        >
          Tu peux te déconnecter de cet appareil.
        </p>

        <button
          onClick={onLogout}
          className={
            isDark
              ? "mt-4 rounded-full bg-white px-5 py-3 font-bold text-slate-950 shadow-lg transition hover:scale-105"
              : "mt-4 rounded-full bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105"
          }
        >
          Se déconnecter
        </button>
      </section>
    </section>
  );
}