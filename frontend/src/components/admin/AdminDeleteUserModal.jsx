import { useState, useEffect } from "react";
import GlassModal, { GlassModalHeader } from "../GlassModal";
import FaIcon from "../FaIcon";

const SOFT_CONSEQUENCES = [
  "Account is immediately locked — user cannot log in.",
  "All profile data, appointments, and medical records are preserved.",
  "User will be hidden from the active users list.",
  "Account can be restored by an admin at any time.",
];

const PERM_CONSEQUENCES = [
  "Account and user profile are permanently erased from the database.",
  "Doctor profile and all associated clinic/slot records are deleted.",
  "Appointment and payment history records are preserved (user reference set to NULL).",
  "This action is completely IRREVERSIBLE — there is no undo.",
];

export default function AdminDeleteUserModal({ user, onClose, onConfirm, loading }) {
  const [mode, setMode] = useState("soft");
  const [confirmEmail, setConfirmEmail] = useState("");

  useEffect(() => {
    if (!user) {
      setMode("soft");
      setConfirmEmail("");
    }
  }, [user]);

  if (!user) return null;

  const isDoctor = user.role_slug === "doctor";
  const name = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email;
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const permEmailMatch = confirmEmail.trim().toLowerCase() === (user.email || "").toLowerCase();
  const canSubmit = mode === "soft" || (mode === "permanent" && permEmailMatch);

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    onConfirm({
      userId: user.id,
      type: mode,
      confirm_email: mode === "permanent" ? confirmEmail.trim() : undefined,
    });
  };

  return (
    <GlassModal
      open={!!user}
      onClose={onClose}
      size="md"
      titleId="admin-delete-user-title"
      closeOnBackdrop={!loading}
    >
      <GlassModalHeader
        titleId="admin-delete-user-title"
        title="Delete Account"
        subtitle="Choose how to remove this user account"
        icon="fa-user-minus"
        accent="danger"
        onClose={onClose}
      />

      <div className="p-5 md:p-6 space-y-5">
        {/* User Identity Card */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
              isDoctor ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"
            }`}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <span
            className={`ml-auto text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${
              isDoctor
                ? "bg-violet-50 text-violet-700 border-violet-200"
                : "bg-sky-50 text-sky-700 border-sky-200"
            }`}
          >
            {user.role_slug?.replace("_", " ")}
          </span>
        </div>

        {/* Mode Selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Select delete type</p>
          <div className="grid gap-2">
            {/* Soft Delete */}
            <button
              type="button"
              onClick={() => setMode("soft")}
              className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                mode === "soft"
                  ? "border-amber-400 bg-amber-50"
                  : "border-slate-200 bg-white hover:border-amber-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    mode === "soft" ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <FaIcon icon="fa-user-lock" className="text-sm" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">
                    Soft Delete{" "}
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                      RECOMMENDED
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Lock account, preserve all data — reversible</p>
                </div>
                <div
                  className={`ml-auto w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    mode === "soft" ? "border-amber-500 bg-amber-500" : "border-slate-300"
                  }`}
                >
                  {mode === "soft" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </button>

            {/* Permanent Delete */}
            <button
              type="button"
              onClick={() => setMode("permanent")}
              className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                mode === "permanent"
                  ? "border-red-400 bg-red-50"
                  : "border-slate-200 bg-white hover:border-red-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    mode === "permanent" ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <FaIcon icon="fa-trash-can" className="text-sm" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">
                    Permanent Delete{" "}
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
                      IRREVERSIBLE
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Erase user from database — cannot be undone</p>
                </div>
                <div
                  className={`ml-auto w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    mode === "permanent" ? "border-red-500 bg-red-500" : "border-slate-300"
                  }`}
                >
                  {mode === "permanent" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Consequences */}
        <div
          className={`rounded-xl border p-3.5 space-y-1.5 ${
            mode === "soft" ? "bg-amber-50/60 border-amber-200" : "bg-red-50/70 border-red-200"
          }`}
        >
          <p className={`text-xs font-bold uppercase tracking-wide ${mode === "soft" ? "text-amber-700" : "text-red-700"}`}>
            <FaIcon icon={mode === "soft" ? "fa-circle-info" : "fa-triangle-exclamation"} className="mr-1" />
            What will happen
          </p>
          {(mode === "soft" ? SOFT_CONSEQUENCES : PERM_CONSEQUENCES).map((c) => (
            <p
              key={c}
              className={`text-xs flex items-start gap-1.5 ${
                mode === "soft" ? "text-amber-800" : "text-red-800"
              }`}
            >
              <FaIcon
                icon={mode === "soft" ? "fa-check" : "fa-circle-xmark"}
                className={`mt-0.5 shrink-0 ${mode === "soft" ? "text-amber-600" : "text-red-500"}`}
              />
              {c}
            </p>
          ))}
        </div>

        {/* Permanent delete email confirmation */}
        {mode === "permanent" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Type the user&apos;s email address to confirm permanent deletion
            </label>
            <input
              type="email"
              id="admin-delete-confirm-email"
              className={`input-field font-mono text-sm ${
                confirmEmail && !permEmailMatch ? "border-red-400 ring-1 ring-red-300" : ""
              }`}
              placeholder={user.email}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              autoFocus
            />
            {confirmEmail && !permEmailMatch && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <FaIcon icon="fa-triangle-exclamation" />
                Email does not match.
              </p>
            )}
            {permEmailMatch && (
              <p className="text-xs text-emerald-700 flex items-center gap-1">
                <FaIcon icon="fa-circle-check" />
                Email confirmed — ready to permanently delete.
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-outline flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            id="admin-delete-confirm-btn"
            disabled={!canSubmit || loading}
            onClick={handleSubmit}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
              mode === "permanent"
                ? "bg-red-600 hover:bg-red-700 text-white disabled:bg-red-200 disabled:text-red-400"
                : "bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
            }`}
          >
            {loading ? (
              <>
                <FaIcon icon="fa-spinner" className="fa-spin" />
                Deleting&hellip;
              </>
            ) : mode === "permanent" ? (
              <>
                <FaIcon icon="fa-trash-can" />
                Permanently Delete
              </>
            ) : (
              <>
                <FaIcon icon="fa-user-lock" />
                Soft Delete Account
              </>
            )}
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
