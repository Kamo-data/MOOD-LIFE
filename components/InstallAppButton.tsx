"use client";

import { useState } from "react";

type InstallAppButtonProps = {
  isDark: boolean;
};

const androidDownloadUrl =
  "/downloads/MoodLife_Android_installation_utilisateurs.zip";

const windowsDownloadUrl =
  "/downloads/MoodLife_Windows_installation_utilisateurs.zip";

function getDeviceType() {
  if (typeof window === "undefined") {
    return "unknown";
  }

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.includes("android")) {
    return "android";
  }

  if (userAgent.includes("windows")) {
    return "windows";
  }

  if (
    userAgent.includes("iphone") ||
    userAgent.includes("ipad") ||
    userAgent.includes("ipod")
  ) {
    return "ios";
  }

  return "unknown";
}

export function InstallAppButton({ isDark }: InstallAppButtonProps) {
  const [showInstallPanel, setShowInstallPanel] = useState(false);
  const deviceType = getDeviceType();

  return (
    <>
      <button
        type="button"
        onClick={() => setShowInstallPanel(true)}
        className="rounded-full bg-pink-500 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105"
      >
        📲 Installer
      </button>

      {showInstallPanel && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div
            className={
              isDark
                ? "w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-950 p-6 text-left text-slate-200 shadow-2xl"
                : "w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 text-left text-slate-700 shadow-2xl"
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
                  Choisis la version adaptée à ton appareil. Les boutons
                  téléchargent directement les fichiers d’installation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInstallPanel(false)}
                className={
                  isDark
                    ? "rounded-full bg-white/10 px-3 py-1 font-black text-white transition hover:bg-white/20"
                    : "rounded-full bg-slate-100 px-3 py-1 font-black text-slate-700 transition hover:bg-slate-200"
                }
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <a
                href={androidDownloadUrl}
                download
                className={
                  deviceType === "android"
                    ? "rounded-2xl bg-pink-500 px-5 py-4 text-center font-black text-white shadow-lg transition hover:scale-[1.02]"
                    : isDark
                      ? "rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center font-bold text-white transition hover:bg-white/15"
                      : "rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-center font-bold text-slate-800 transition hover:bg-slate-100"
                }
              >
                📱 Télécharger Android APK
              </a>

              <a
                href={windowsDownloadUrl}
                download
                className={
                  deviceType === "windows"
                    ? "rounded-2xl bg-pink-500 px-5 py-4 text-center font-black text-white shadow-lg transition hover:scale-[1.02]"
                    : isDark
                      ? "rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center font-bold text-white transition hover:bg-white/15"
                      : "rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-center font-bold text-slate-800 transition hover:bg-slate-100"
                }
              >
                💻 Télécharger Windows
              </a>
            </div>

            <div
              className={
                isDark
                  ? "mt-5 rounded-2xl bg-white/10 p-4 text-sm text-slate-300"
                  : "mt-5 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600"
              }
            >
              <p className="font-bold">Conseils d’installation :</p>

              <div className="mt-2 space-y-2">
                <p>
                  <strong>Android :</strong> télécharge le ZIP, extrait-le, puis
                  ouvre le fichier APK. Android peut demander d’autoriser
                  l’installation depuis cette source.
                </p>

                <p>
                  <strong>Windows :</strong> télécharge le ZIP, extrait-le, puis
                  lance le fichier d’installation fourni dans le dossier.
                </p>

                <p>
                  <strong>iPhone :</strong> utilise plutôt Safari, bouton de
                  partage, puis “Sur l’écran d’accueil”.
                </p>
              </div>
            </div>

            <div
              className={
                isDark
                  ? "mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100"
                  : "mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
              }
            >
              Ces fichiers sont destinés à une bêta privée. Windows ou Android
              peuvent afficher un avertissement parce que l’application n’est
              pas encore publiée sur les stores officiels.
            </div>

            <button
              type="button"
              onClick={() => setShowInstallPanel(false)}
              className="mt-5 w-full rounded-full bg-pink-500 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}