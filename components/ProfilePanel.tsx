"use client";

import { useEffect, useState } from "react";

type ProfilePanelProps = {
  isDark: boolean;
  displayName: string;
  onSave: (displayName: string) => Promise<void>;
};

export function ProfilePanel({
  isDark,
  displayName,
  onSave,
}: ProfilePanelProps) {
  const [name, setName] = useState(displayName);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(displayName);
  }, [displayName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = name.trim();

    if (cleanName.length < 2 || cleanName.length > 30) {
      setMessage("Le pseudo doit contenir entre 2 et 30 caractères.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    await onSave(cleanName);

    setIsSaving(false);
    setMessage("Pseudo enregistré.");
  }

  return (
    <section
      className={
        isDark
          ? "rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur"
          : "rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur"
      }
    >
      <div>
        <h2
          className={
            isDark ? "text-xl font-bold text-white" : "text-xl font-bold"
          }
        >
          Profil
        </h2>

        <p
          className={
            isDark
              ? "mt-1 text-sm text-slate-300"
              : "mt-1 text-sm text-slate-600"
          }
        >
          Ce pseudo sera utilisé dans l’application. Ton email ne sera pas
          affiché aux autres utilisateurs.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-col gap-3 md:flex-row"
      >
        <input
          type="text"
          required
          minLength={2}
          maxLength={30}
          placeholder="Ton pseudo"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={
            isDark
              ? "flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-pink-400"
              : "flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-pink-400"
          }
        />

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-pink-500 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Enregistrement..." : "Enregistrer le pseudo"}
        </button>
      </form>

      {message && (
        <div
          className={
            isDark
              ? "mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm font-bold text-emerald-200"
              : "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700"
          }
        >
          {message}
        </div>
      )}
    </section>
  );
}