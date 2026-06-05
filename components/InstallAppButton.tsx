"use client";

import { useEffect, useState } from "react";

type InstallAppButtonProps = {
  isDark: boolean;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function isIosDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallAppButton({ isDark }: InstallAppButtonProps) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());
    setIsIos(isIosDevice());

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowHelp(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (isInstalled) {
      setShowHelp(true);
      return;
    }

    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }

      setInstallPrompt(null);
      return;
    }

    setShowHelp((currentValue) => !currentValue);
  }

  if (isInstalled) {
    return (
      <button
        type="button"
        onClick={() => setShowHelp((currentValue) => !currentValue)}
        className={
          isDark
            ? "rounded-full border border-emerald-300/20 bg-emerald-400/10 px-5 py-3 font-bold text-emerald-100 shadow-lg transition hover:scale-105"
            : "rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 font-bold text-emerald-700 shadow-lg transition hover:scale-105"
        }
      >
        ✅ Installée
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleInstallClick}
        className="rounded-full bg-pink-500 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105"
      >
        📲 Installer
      </button>

      {showHelp && (
        <div
          className={
            isDark
              ? "absolute right-0 z-50 mt-3 w-80 rounded-3xl border border-white/10 bg-slate-950 p-5 text-left text-sm text-slate-200 shadow-2xl"
              : "absolute right-0 z-50 mt-3 w-80 rounded-3xl border border-slate-200 bg-white p-5 text-left text-sm text-slate-700 shadow-2xl"
          }
        >
          <h3
            className={
              isDark
                ? "text-base font-black text-white"
                : "text-base font-black text-slate-900"
            }
          >
            Installer Mood Life
          </h3>

          {isIos ? (
            <div className="mt-3 space-y-2">
              <p>Sur iPhone ou iPad :</p>
              <p>1. Ouvre Mood Life avec Safari.</p>
              <p>2. Appuie sur le bouton de partage.</p>
              <p>3. Choisis “Sur l’écran d’accueil”.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <p>Si la fenêtre d’installation ne s’ouvre pas :</p>
              <p>1. Ouvre le menu du navigateur.</p>
              <p>2. Choisis “Installer l’application”.</p>
              <p>3. Ou “Ajouter à l’écran d’accueil” sur mobile.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}