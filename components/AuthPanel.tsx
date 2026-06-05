"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthPanelProps = {
  isDark: boolean;
  onAuthSuccess: (user: User | null) => void;
};

export function AuthPanel({ isDark, onAuthSuccess }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    if (password.length < 6) {
      setMessage("Le mot de passe doit contenir au moins 6 caractères.");
      setIsLoading(false);
      return;
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else if (data.user && !data.session) {
        setMessage(
          "Compte créé. Vérifie tes emails pour confirmer ton inscription."
        );
      } else {
        setMessage("Compte créé, tu es connecté.");
        onAuthSuccess(data.user ?? null);
      }
    }

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Connexion réussie.");
        onAuthSuccess(data.user ?? null);
      }
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
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className={isDark ? "text-xl font-bold text-white" : "text-xl font-bold"}>
            {mode === "login" ? "Connexion" : "Créer un compte"}
          </h2>

          <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>
            Connecte-toi pour préparer la sauvegarde en ligne et le partage.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
          className={
            isDark
              ? "rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
              : "rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          }
        >
          {mode === "login" ? "Créer un compte" : "J’ai déjà un compte"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input
          type="email"
          required
          placeholder="Adresse email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={
            isDark
              ? "rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-pink-400"
              : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-pink-400"
          }
        />

        <input
          type="password"
          required
          placeholder="Mot de passe"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={
            isDark
              ? "rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-pink-400"
              : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-pink-400"
          }
        />

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-full bg-pink-500 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? "Patiente..."
            : mode === "login"
              ? "Se connecter"
              : "S’inscrire"}
        </button>
      </form>

      {message && (
        <div
          className={
            isDark
              ? "mt-4 rounded-2xl border border-white/10 bg-white/10 p-3 text-sm font-bold text-slate-200"
              : "mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700"
          }
        >
          {message}
        </div>
      )}
    </section>
  );
}