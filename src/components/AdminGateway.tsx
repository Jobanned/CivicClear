/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Lock, FileKey2, ShieldAlert, ArrowRight, CornerDownRight } from "lucide-react";

interface AdminGatewayProps {
  onAuthenticate: (passcode: string) => Promise<boolean>;
  isLoading: boolean;
}

export default function AdminGateway({ onAuthenticate, isLoading }: AdminGatewayProps) {
  const [passcode, setPasscode] = useState("");
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) return;
    setErrorStatus(null);

    const success = await onAuthenticate(passcode);
    if (!success) {
      setErrorStatus("Incorrect systemic caseworker login passcode. Please check credentials or contact system seniors.");
    }
  };

  return (
    <div id="admin-gateway-interface" className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-900" />

        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 mx-auto border border-slate-200">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900">
            Caseworker Gateway
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Authorized municipal staff only. Unauthorized entry attempts are logged locally for audit review.
          </p>
        </div>

        {/* Security Alert Block */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-display">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" /> Quick Sandbox Access
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Caseworker passcode: <strong className="font-mono text-slate-800">admin123</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="caseworker-passcode" className="block text-xs font-semibold text-slate-800 font-display">
              Administrative Passcode
            </label>
            <input
              id="caseworker-passcode"
              type="password"
              required
              className="w-full rounded-xl border border-slate-300 p-3 text-sm bg-white focus:ring-2 focus:ring-slate-900/20 text-slate-800 placeholder:text-slate-400 font-mono tracking-widest text-center"
              placeholder="••••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          </div>

          {errorStatus && (
            <p className="text-xs text-red-600 font-medium leading-relaxed bg-red-50 p-2.5 rounded-lg border border-red-100">
              {errorStatus}
            </p>
          )}

          <button
            id="authenticate-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-950 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl font-display flex items-center justify-center gap-2 transition cursor-pointer text-sm whitespace-nowrap disabled:opacity-75 focus:ring-2 focus:ring-slate-500"
          >
            {isLoading ? "Validating Authorization..." : "Authorize Workspace Access"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-4 flex items-start gap-1 justify-center leading-normal">
          <CornerDownRight className="w-3.5 h-3.5 text-slate-300 mr-0.5" />
          <span>Fulfills strict state guidelines for credential governance.</span>
        </div>
      </div>
    </div>
  );
}
