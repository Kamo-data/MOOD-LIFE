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
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
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
      } else {
        setShowHelp(true);
      }

      setInstallPrompt(null);
      return;
    }

    setShowHelp(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={
          isInstalled
            ? isDark
              ? "rounded-full border border-emerald-300/20 bg-emerald-400/10 px-5 py-3 font-bold text-emerald-100 shadow-lg transition hover:scale-105"
              : "rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 font-bold text-emerald-700 shadow-lg transition hover:scale-105"
            : "rounded-full bg-pink-500 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105"
        }
      >
        {isInstalled ? "✅ Installée" : "📲 Installer"}
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div
            className={
              isDark
                ? "w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950 p-6 text-left text-slate-200 shadow-2xl"
                : "w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 text-left text-slate-700 shadow-2xl"
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  className={
                    isDark
                      ? "text-xl font-black text-white"
                      : "text-xl font-black text-slate-900"
                  }
                >
                  Installer Mood Life
                </h3>

                <p
                  className={
                    isDark
                      ? "mt-2 text-sm text-slate-300"
                      : "mt-2 text-sm text-slate-600"
                  }
                >
                  Si la fenêtre d’installation ne s’ouvre pas, utilise la
                  méthode adaptée à ton appareil.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className={
                  isDark
                    ? "rounded-full bg-white/10 px-3 py-1 font-black text-white transition hover:bg-white/20"
                    : "rounded-full bg-slate-100 px-3 py-1 font-black text-slate-700 transition hover:bg-slate-200"
                }
              >
                ✕
              </button>
            </div>

            {isIos ? (
              <div className="mt-5 space-y-3 text-sm">
                <p className="font-bold">Sur iPhone ou iPad :</p>
                <p>1. Ouvre Mood Life avec Safari.</p>
                <p>2. Appuie sur le bouton de partage.</p>
                <p>3. Choisis “Sur l’écran d’accueil”.</p>
                <p>
                  iOS ne permet pas toujours de déclencher l’installation
                  directement avec un bouton dans la page.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3 text-sm">
                <p className="font-bold">Sur PC ou Android :</p>
                <p>1. Ouvre Mood Life avec Chrome ou Edge.</p>
                <p>2. Clique sur le menu du navigateur.</p>
                <p>3. Choisis “Installer l’application”.</p>
                <p>4. Sur mobile, cherche “Ajouter à l’écran d’accueil”.</p>
              </div>
            )}

            <div
              className={
                isDark
                  ? "mt-5 rounded-2xl bg-white/10 p-4 text-sm text-slate-300"
                  : "mt-5 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600"
              }
            >
              La fenêtre native peut ne plus réapparaître immédiatement si tu
              l’as déjà fermée ou si l’application est déjà installée.
            </div>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full rounded-full bg-pink-500 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}