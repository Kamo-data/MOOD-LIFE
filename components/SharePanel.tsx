"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type SharePanelProps = {
  isDark: boolean;
  user: User;
};

type MoodShare = {
  id: string;
  owner_id: string;
  viewer_id: string;
  status: string;
  created_at: string;
  can_view_current: boolean;
  can_view_history: boolean;
  can_view_bladder: boolean;
  can_view_hunger: boolean;
  can_view_energy: boolean;
  can_view_fun: boolean;
  can_view_social: boolean;
  can_view_hygiene: boolean;
};

type Profile = {
  id: string;
  display_name: string;
};

type Contact = {
  shareId: string;
  userId: string;
  displayName: string;
  relation: "owner" | "viewer";
  share: MoodShare;
};

type PermissionKey =
  | "can_view_current"
  | "can_view_history"
  | "can_view_bladder"
  | "can_view_hunger"
  | "can_view_energy"
  | "can_view_fun"
  | "can_view_social"
  | "can_view_hygiene";

const permissionLabels: { key: PermissionKey; label: string }[] = [
  { key: "can_view_current", label: "Voir mon dernier mood" },
  { key: "can_view_history", label: "Voir mon historique" },
  { key: "can_view_bladder", label: "Vessie" },
  { key: "can_view_hunger", label: "Faim" },
  { key: "can_view_energy", label: "Énergie" },
  { key: "can_view_fun", label: "Divertissement" },
  { key: "can_view_social", label: "Social" },
  { key: "can_view_hygiene", label: "Hygiène" },
];

export function SharePanel({ isDark, user }: SharePanelProps) {
  const [inviteLink, setInviteLink] = useState("");
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [inviteTokenFromUrl, setInviteTokenFromUrl] = useState<string | null>(
    null
  );
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);

  useEffect(() => {
    loadContacts();

    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get("invite");

    if (inviteToken) {
      setInviteTokenFromUrl(inviteToken);
    }
  }, []);

  async function loadContacts() {
    setIsLoadingContacts(true);

    const { data: shares, error: sharesError } = await supabase
      .from("mood_shares")
      .select("*")
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    if (sharesError) {
      setMessage(`Erreur contacts : ${sharesError.message}`);
      setIsLoadingContacts(false);
      return;
    }

    const moodShares = (shares ?? []) as MoodShare[];

    const contactIds = moodShares.map((share) =>
      share.owner_id === user.id ? share.viewer_id : share.owner_id
    );

    const uniqueContactIds = Array.from(new Set(contactIds));

    if (uniqueContactIds.length === 0) {
      setContacts([]);
      setIsLoadingContacts(false);
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", uniqueContactIds);

    if (profilesError) {
      setMessage(`Erreur profils : ${profilesError.message}`);
      setIsLoadingContacts(false);
      return;
    }

    const profileList = (profiles ?? []) as Profile[];

    const nextContacts = moodShares.map((share) => {
      const contactId =
        share.owner_id === user.id ? share.viewer_id : share.owner_id;

      const contactProfile = profileList.find(
        (profile) => profile.id === contactId
      );

      return {
        shareId: share.id,
        userId: contactId,
        displayName: contactProfile?.display_name ?? "Contact sans pseudo",
        relation: share.owner_id === user.id ? "viewer" : "owner",
        share,
      } satisfies Contact;
    });

    setContacts(nextContacts);
    setIsLoadingContacts(false);
  }

  async function createInviteLink() {
    setIsCreatingInvite(true);
    setMessage("");

    const token = crypto.randomUUID();

    const { error } = await supabase.from("share_invites").insert({
      owner_id: user.id,
      token,
    });

    if (error) {
      setMessage(`Erreur invitation : ${error.message}`);
      setIsCreatingInvite(false);
      return;
    }

    const link = `${window.location.origin}?invite=${token}`;
    setInviteLink(link);
    setMessage("Lien d’invitation créé.");
    setIsCreatingInvite(false);
  }

  async function copyInviteLink() {
    if (!inviteLink) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink);
    setMessage("Lien copié dans le presse-papiers.");
  }

  async function acceptInvite() {
    if (!inviteTokenFromUrl) {
      return;
    }

    setIsAcceptingInvite(true);
    setMessage("");

    const { error } = await supabase.rpc("accept_share_invite", {
      invite_token: inviteTokenFromUrl,
    });

    if (error) {
      setMessage(`Erreur invitation : ${error.message}`);
      setIsAcceptingInvite(false);
      return;
    }

    setMessage("Invitation acceptée. Le contact a été ajouté.");
    setInviteTokenFromUrl(null);
    window.history.replaceState({}, "", window.location.pathname);
    await loadContacts();
    setIsAcceptingInvite(false);
  }

  async function removeContact(contact: Contact) {
    const confirmed = window.confirm(
      `Supprimer le contact "${contact.displayName}" ?`
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("mood_shares")
      .delete()
      .eq("id", contact.shareId);

    if (error) {
      setMessage(`Erreur suppression : ${error.message}`);
      return;
    }

    setMessage("Contact supprimé.");
    await loadContacts();
  }

  async function updatePermission(
    contact: Contact,
    key: PermissionKey,
    value: boolean
  ) {
    if (contact.relation !== "viewer") {
      return;
    }

    const { error } = await supabase
      .from("mood_shares")
      .update({ [key]: value })
      .eq("id", contact.shareId);

    if (error) {
      setMessage(`Erreur confidentialité : ${error.message}`);
      return;
    }

    setContacts((currentContacts) =>
      currentContacts.map((item) =>
        item.shareId === contact.shareId
          ? {
              ...item,
              share: {
                ...item.share,
                [key]: value,
              },
            }
          : item
      )
    );

    setMessage("Préférences de partage mises à jour.");
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
            Partage et contacts
          </h2>

          <p
            className={
              isDark
                ? "mt-1 text-sm text-slate-300"
                : "mt-1 text-sm text-slate-600"
            }
          >
            Crée un lien pour autoriser une personne à voir tes moods. Ton email
            ne sera pas partagé.
          </p>
        </div>

        <button
          onClick={createInviteLink}
          disabled={isCreatingInvite}
          className="rounded-full bg-pink-500 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreatingInvite ? "Création..." : "Créer un lien"}
        </button>
      </div>

      {inviteTokenFromUrl && (
        <div
          className={
            isDark
              ? "mt-4 rounded-2xl border border-pink-300/20 bg-pink-400/10 p-4"
              : "mt-4 rounded-2xl border border-pink-200 bg-pink-50 p-4"
          }
        >
          <h3
            className={
              isDark
                ? "font-black text-pink-100"
                : "font-black text-pink-800"
            }
          >
            Invitation détectée
          </h3>

          <p
            className={
              isDark
                ? "mt-1 text-sm text-pink-100/80"
                : "mt-1 text-sm text-pink-700"
            }
          >
            Tu peux accepter cette invitation pour devenir contact avec la
            personne qui a créé le lien.
          </p>

          <button
            onClick={acceptInvite}
            disabled={isAcceptingInvite}
            className="mt-3 rounded-full bg-pink-500 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAcceptingInvite ? "Acceptation..." : "Accepter l’invitation"}
          </button>
        </div>
      )}

      {inviteLink && (
        <div
          className={
            isDark
              ? "mt-4 rounded-2xl border border-white/10 bg-white/10 p-4"
              : "mt-4 rounded-2xl border border-slate-200 bg-white p-4"
          }
        >
          <p
            className={
              isDark
                ? "text-sm font-bold text-slate-200"
                : "text-sm font-bold text-slate-700"
            }
          >
            Ton lien d’invitation :
          </p>

          <div
            className={
              isDark
                ? "mt-2 break-all rounded-2xl bg-slate-950/60 p-3 text-sm text-slate-200"
                : "mt-2 break-all rounded-2xl bg-slate-100 p-3 text-sm text-slate-700"
            }
          >
            {inviteLink}
          </div>

          <button
            onClick={copyInviteLink}
            className={
              isDark
                ? "mt-3 rounded-full bg-white px-5 py-3 font-bold text-slate-950 shadow-lg transition hover:scale-105"
                : "mt-3 rounded-full bg-slate-900 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-105"
            }
          >
            Copier le lien
          </button>
        </div>
      )}

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

      <div className="mt-5">
        <h3
          className={
            isDark ? "font-black text-white" : "font-black text-slate-900"
          }
        >
          Mes contacts
        </h3>

        {isLoadingContacts ? (
          <p
            className={
              isDark
                ? "mt-2 text-sm text-slate-300"
                : "mt-2 text-sm text-slate-600"
            }
          >
            Chargement des contacts...
          </p>
        ) : contacts.length === 0 ? (
          <div
            className={
              isDark
                ? "mt-3 rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-center text-slate-300"
                : "mt-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 text-center text-slate-600"
            }
          >
            Aucun contact pour le moment.
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            {contacts.map((contact) => (
              <div
                key={contact.shareId}
                className={
                  isDark
                    ? "rounded-2xl border border-white/10 bg-white/10 p-4"
                    : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                }
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p
                      className={
                        isDark
                          ? "font-black text-white"
                          : "font-black text-slate-900"
                      }
                    >
                      👤 {contact.displayName}
                    </p>

                    <p
                      className={
                        isDark
                          ? "mt-1 text-xs text-slate-300"
                          : "mt-1 text-xs text-slate-600"
                      }
                    >
                      {contact.relation === "viewer"
                        ? "Cette personne peut voir ce que tu autorises."
                        : "Cette personne partage ses moods avec toi."}
                    </p>
                  </div>

                  <button
                    onClick={() => removeContact(contact)}
                    className={
                      isDark
                        ? "w-fit rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10"
                        : "w-fit rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                    }
                  >
                    Retirer
                  </button>
                </div>

                {contact.relation === "viewer" ? (
                  <div
                    className={
                      isDark
                        ? "mt-4 rounded-2xl bg-slate-950/40 p-4"
                        : "mt-4 rounded-2xl bg-slate-50 p-4"
                    }
                  >
                    <p
                      className={
                        isDark
                          ? "text-sm font-black text-white"
                          : "text-sm font-black text-slate-900"
                      }
                    >
                      Confidentialité pour ce contact
                    </p>

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {permissionLabels.map((permission) => (
                        <label
                          key={permission.key}
                          className={
                            isDark
                              ? "flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm font-bold text-slate-200"
                              : "flex items-center gap-3 rounded-xl bg-white p-3 text-sm font-bold text-slate-700"
                          }
                        >
                          <input
                            type="checkbox"
                            checked={contact.share[permission.key]}
                            onChange={(event) =>
                              updatePermission(
                                contact,
                                permission.key,
                                event.target.checked
                              )
                            }
                            className="h-5 w-5 accent-pink-500"
                          />

                          {permission.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className={
                      isDark
                        ? "mt-4 rounded-2xl bg-slate-950/40 p-4 text-sm text-slate-300"
                        : "mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"
                    }
                  >
                    Ce contact contrôle lui-même ce qu’il partage avec toi.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}