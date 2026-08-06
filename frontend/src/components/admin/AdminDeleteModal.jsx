import { useState, useEffect } from "react";
import GlassModal, { GlassModalHeader, GlassModalBody, GlassModalFooter } from "../GlassModal";
import FaIcon from "../FaIcon";


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

  const getRoleBadgeClasses = (role) => {
    switch (role) {
      case "doctor":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "super_admin":
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200/80";
      case "patient":
      default:
        return "bg-sky-50 text-sky-700 border-sky-200/80";
    }
  };

  return (
    <GlassModal
      open={!!user}
      onClose={onClose}
      size="md"
      preventClose={loading}
      closeOnBackdrop={!loading}
      titleId="admin-delete-user-title"
      panelClassName="max-h-[90vh] sm:max-h-[min(90vh,760px)] overflow-hidden flex flex-col shadow-2xl"
    >
      {/* Fixed Header */}
      <GlassModalHeader
        icon={mode === "permanent" ? "trash-alt" : "user-slash"}
        accent={mode === "permanent" ? "red" : "amber"}
        titleId="admin-delete-user-title"
        title="Delete Account"
        subtitle="Choose how to remove this user account"
        onClose={onClose}
      />

      {/* Smooth Scrollable Content Area (max-height 90vh handled by flex) */}
      <GlassModalBody className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
        {/* User Info Card */}
        <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 shadow-2xs">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm sm:text-base text-white shadow-sm ${
              isDoctor
                ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                : "bg-gradient-to-br from-sky-500 to-blue-600"
            }`}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 truncate text-sm sm:text-base">{name}</p>
            <p className="text-xs text-slate-500 font-mono truncate">{user.email}</p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-semibold capitalize shrink-0 ${getRoleBadgeClasses(
              user.role_slug
            )}`}
          >
            {user.role_slug?.replace("_", " ")}
          </span>
        </div>

        {/* Delete Type Selection */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Delete Type
          </p>
          <div className="grid gap-3">
            {/* Soft Delete Option */}
            <button
              type="button"
              onClick={() => setMode("soft")}
              className={`group relative w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                mode === "soft"
                  ? "bg-amber-50/50 border-amber-500/80 ring-4 ring-amber-500/10 shadow-xs"
                  : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    mode === "soft"
                      ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70"
                  }`}
                >
                  <FaIcon icon="user-lock" className="text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">Soft Delete</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200/60 uppercase tracking-wide">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lock account, preserve all data • reversible
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                    mode === "soft"
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {mode === "soft" && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>

            {/* Permanent Delete Option */}
            <button
              type="button"
              onClick={() => setMode("permanent")}
              className={`group relative w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/30 ${
                mode === "permanent"
                  ? "bg-rose-50/60 border-rose-500/80 ring-4 ring-rose-500/10 shadow-xs"
                  : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    mode === "permanent"
                      ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70"
                  }`}
                >
                  <FaIcon icon="trash-alt" className="text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">Permanent Delete</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200/60 uppercase tracking-wide">
                      Irreversible
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Erase user from database • cannot be undone
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                    mode === "permanent"
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {mode === "permanent" && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          </div>
        </div>


        {/* Permanent Delete Email Confirmation Field */}
        {mode === "permanent" && (
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-2.5 animate-fade-in shadow-2xs">
            <label
              htmlFor="admin-delete-confirm-email"
              className="block text-xs font-semibold text-slate-800 leading-relaxed"
            >
              Type the user's email address to confirm permanent deletion:
              <br />
              <code className="text-xs px-2.5 py-1 mt-1 inline-block bg-white text-rose-700 border border-rose-200 rounded-md font-mono font-bold select-all shadow-2xs">
                {user.email}
              </code>
            </label>

            <div className="relative">
              <input
                type="email"
                id="admin-delete-confirm-email"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition-all outline-none ${
                  confirmEmail && !permEmailMatch
                    ? "border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                    : permEmailMatch
                    ? "border-emerald-500 bg-emerald-50/30 text-emerald-900 focus:ring-2 focus:ring-emerald-500/20"
                    : "border-slate-300 bg-white text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                }`}
                placeholder={user.email}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                autoComplete="off"
              />
              {permEmailMatch && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                  <FaIcon icon="check-circle" className="text-base" />
                </div>
              )}
            </div>

            {confirmEmail && !permEmailMatch && (
              <p className="text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                <FaIcon icon="exclamation-circle" />
                <span>Email does not match. Please enter the exact email above.</span>
              </p>
            )}
            {permEmailMatch && (
              <p className="text-xs text-emerald-700 flex items-center gap-1.5 font-semibold">
                <FaIcon icon="check-circle" />
                <span>Email confirmed - ready to permanently delete.</span>
              </p>
            )}
          </div>
        )}
      </GlassModalBody>

      {/* Fixed Action Buttons Footer */}
      <GlassModalFooter className="p-4 sm:p-5 border-t border-slate-200/80 bg-slate-50/90 backdrop-blur-md flex items-center justify-end gap-3 shrink-0 rounded-b-2xl sm:rounded-b-3xl">
        <button
          type="button"
          className="px-4.5 py-2.5 rounded-xl font-semibold text-sm text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-400/30 active:scale-[0.98] disabled:opacity-50"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>

        <button
          type="button"
          id="admin-delete-confirm-btn"
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100 ${
            mode === "permanent"
              ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 focus:ring-rose-500 shadow-rose-500/20"
              : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:ring-amber-500 shadow-amber-500/20"
          }`}
          disabled={!canSubmit || loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <>
              <FaIcon icon="spinner" className="animate-spin text-sm" />
              <span>Processing...</span>
            </>
          ) : mode === "permanent" ? (
            <>
              <FaIcon icon="trash-alt" className="text-sm" />
              <span>Permanently Delete</span>
            </>
          ) : (
            <>
              <FaIcon icon="user-lock" className="text-sm" />
              <span>Soft Delete Account</span>
            </>
          )}
        </button>
      </GlassModalFooter>
    </GlassModal>
  );
}
