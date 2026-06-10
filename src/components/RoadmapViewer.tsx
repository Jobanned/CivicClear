/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Intake, RequiredDocument, EligibleProgram } from "../types";
import { CheckSquare, Square, Printer, Landmark, FileCheck, ArrowLeft, AlertCircle, Clock, Check, FileText } from "lucide-react";

interface RoadmapViewerProps {
  intake: Intake;
  onBackToForm: () => void;
}

export default function RoadmapViewer({ intake, onBackToForm }: RoadmapViewerProps) {
  // Local document state checkbox overrides so citizens can check off what they have gathered
  const [gatheredDocIds, setGatheredDocIds] = useState<Record<string, boolean>>({});

  const toggleDocGathered = (docId: string) => {
    setGatheredDocIds(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const pendingProgramsCount = intake.roadmap.eligiblePrograms.length;
  const pendingDocsCount = intake.roadmap.requiredDocuments.length;

  return (
    <div id="roadmap-viewer-page" className="max-w-4xl mx-auto px-4 py-8 space-y-8 print:p-0">
      {/* Back to Intake navigation */}
      <div className="flex items-center justify-between print:hidden">
        <button
          id="back-to-intake-btn"
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-950 transition cursor-pointer font-display"
          onClick={onBackToForm}
        >
          <ArrowLeft className="w-4 h-4" /> Start another intake
        </button>
        <button
          id="print-roadmap-btn"
          className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 hover:text-slate-950 transition cursor-pointer font-display"
          onClick={handlePrint}
        >
          <Printer className="w-3.5 h-3.5" /> Print this roadmap
        </button>
      </div>

      {/* Case Header & Caseworker Advisory Shield */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-500 font-medium">
              Case Ref: #{intake.id}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 mt-2">
              Welcome, {intake.userData.fullName || "Resident"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Submitted on {new Date(intake.createdAt).toLocaleDateString()} at {new Date(intake.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">Triage Urgency</span>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-display border
                ${intake.urgencyFlag === 'critical' ? 'bg-red-50 text-red-700 border-red-100' : ''}
                ${intake.urgencyFlag === 'high' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                ${intake.urgencyFlag === 'moderate' ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                ${intake.urgencyFlag === 'standard' ? 'bg-slate-50 text-slate-700 border-slate-100' : ''}
              `}>
                ● {intake.urgencyFlag} Priority
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Status Alert Strip */}
        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-900 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold font-display">Awaiting Caseworker Review &amp; Official Approval</h4>
            <p className="text-xs leading-relaxed text-amber-800">
              Your plain text statement has been analyzed. There are <strong className="font-semibold text-amber-950">{pendingProgramsCount} programs flagged as highly compatible</strong>. Your files are active in the caseworker queue for validation. Print this list and bring the items checked below to prevent processing delays.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recommended Programs Column - 7/12 */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-blue-700" /> Match Summary: Programs Identified
            </h2>
            <p className="text-xs text-slate-500">
              The AI Co-pilot identified these assistance pathways representing maximum estimated grant potential.
            </p>
          </div>

          {intake.roadmap.eligiblePrograms.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-600 mt-2">No programs currently matched. A caseworker will review your file manually.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {intake.roadmap.eligiblePrograms.map((program) => (
                <div
                  id={`program-card-${program.id}`}
                  key={program.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-5 relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-display">
                          {program.category} relief
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1.5 font-display leading-tight">
                          {program.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs text-slate-400 font-display">Grant Level</span>
                        <span className="block text-base font-bold text-emerald-700 font-mono">
                          {program.amountText}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                      {program.description}
                    </p>

                    {/* Eligibility breakdown strip */}
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs leading-relaxed text-slate-700 border border-slate-100">
                      <strong className="font-semibold text-slate-950 block mb-0.5 font-display">Match Logic triggered:</strong>
                      {program.eligibilityLogic}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-100/30 px-3 py-1.5 rounded-lg">
                    <span className="text-xs font-medium text-slate-500">Official Decision Profile:</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase font-display px-2 py-0.5 rounded-full border
                      ${program.status === 'authorized' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                      ${program.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : ''}
                      ${program.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                    `}>
                      {program.status === 'authorized' && <Check className="w-3 h-3 text-emerald-600" />}
                      {program.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Steps what to expect FAQ card */}
          <div className="bg-slate-100/40 rounded-xl border border-slate-200 p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">How does verification work?</h4>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white font-mono flex items-center justify-center font-bold shrink-0 text-[10px]">1</span>
                <p>
                  <strong>Case Assigned to Caseworker:</strong> Security systems queue your files based on urgency and risk flags automatically.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white font-mono flex items-center justify-center font-bold shrink-0 text-[10px]">2</span>
                <p>
                  <strong>Physical Document Audit:</strong> Gather the documents and upload or deliver them to your assigned Caseworker listed inside the internal workspace.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white font-mono flex items-center justify-center font-bold shrink-0 text-[10px]">3</span>
                <p>
                  <strong>Manual Grant Authorization:</strong> Once documents are confirmed, caseworkers authorize payouts or direct housing placement schedules.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Required Documents Checklist - 5/12 */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-700" /> Document Checklist
            </h2>
            <p className="text-xs text-slate-500">
              Caseworkers require these physical paper files to verify the matching conditions. Check them off as you prepare.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-800 text-white p-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase font-display tracking-widest">Interactive Wallet Builder</span>
                <span className="text-[11px] font-mono bg-emerald-900 text-emerald-100 px-2 py-0.5 rounded">
                  {Object.values(gatheredDocIds).filter(Boolean).length} of {pendingDocsCount} ready
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {intake.roadmap.requiredDocuments.map((doc) => {
                const isGathered = !!gatheredDocIds[doc.id];
                return (
                  <div
                    id={`document-checked-${doc.id}`}
                    key={doc.id}
                    className={`p-4 flex gap-3 transition-colors duration-150 select-none cursor-pointer hover:bg-slate-50/60
                      ${isGathered ? 'bg-emerald-50/20' : ''}
                    `}
                    onClick={() => toggleDocGathered(doc.id)}
                  >
                    <div className="mt-0.5 text-slate-400 shrink-0">
                      {isGathered ? (
                        <CheckSquare className="w-5 h-5 text-emerald-700 fill-emerald-100" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex items-center gap-2 flex-wrap font-display">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.2 rounded
                          ${doc.category === 'income' ? 'bg-amber-50 text-amber-700 border border-amber-100' : ''}
                          ${doc.category === 'identity' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : ''}
                          ${doc.category === 'residency' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' : ''}
                          ${doc.category === 'hardship' ? 'bg-rose-50 text-rose-700 border border-rose-100' : ''}
                        `}>
                          {doc.category}
                        </span>
                        {isGathered && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded font-display uppercase tracking-wider">
                            In Wallet Checklist
                          </span>
                        )}

                        {/* Official Document Verification Status */}
                        <span className={`text-[10px] font-bold font-display uppercase tracking-wider px-2 py-0.2 rounded border
                          ${doc.status === 'secured' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                          ${doc.status === 'declined' ? 'bg-red-50 text-red-600 border-red-200' : ''}
                          ${doc.status === 'not_needed' ? 'bg-slate-100 text-slate-600 border-slate-200' : ''}
                          ${doc.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : ''}
                        `}>
                          ● {doc.status === 'secured' ? 'Approved (Secured)' : doc.status === 'declined' ? 'Declined / Action Required' : doc.status === 'not_needed' ? 'Waived (Not Needed)' : 'Pending Verification'}
                        </span>
                      </div>

                      <h4 className={`text-sm font-semibold font-display transition-all
                        ${isGathered ? 'text-slate-500 line-through' : 'text-slate-800'}
                      `}>
                        {doc.name}
                      </h4>
                      <p className="text-xs text-slate-500 leading-normal">
                        {doc.description}
                      </p>

                      {/* Caseworker Verification Reason or feedback text */}
                      {doc.feedback && (
                        <div className={`mt-2 p-2.5 rounded-lg text-xs leading-normal font-sans border flex gap-1.5 items-start
                          ${doc.status === 'secured' ? 'bg-emerald-50/40 border-emerald-100 text-emerald-800' : ''}
                          ${doc.status === 'declined' ? 'bg-red-50/40 border-red-100 text-red-800' : ''}
                          ${doc.status === 'not_needed' ? 'bg-slate-50 border-slate-200 text-slate-600' : ''}
                          ${doc.status === 'pending' ? 'bg-amber-50/40 border-amber-100 text-amber-800' : ''}
                        `}>
                          <span className="font-bold shrink-0">Caseworker Reason:</span>
                          <span>{doc.feedback}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Document summary strip */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-start gap-2 text-slate-500 text-[11px] leading-relaxed">
              <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span>
                Please gather clear printed photocopies of all applicable documents before your casework interview. Clear records reduce approval timelines from weeks to hours.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
