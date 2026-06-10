/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Intake, EligibleProgram, RequiredDocument, SystemSettings, ProgramTemplate } from "../types";
import { 
  Users, Landmark, ClipboardList, PenTool, CheckCircle, XCircle, AlertTriangle, 
  Search, ShieldAlert, ArrowUpDown, ChevronRight, Save, ShieldCheck, FileText, Lock, Sparkles, HelpCircle 
} from "lucide-react";

interface WorkerWorkspaceProps {
  initialIntakes: Intake[];
  settings: SystemSettings;
  onRefreshDB: () => Promise<void>;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => Promise<boolean>;
  onAuthorizeIntake: (id: string, action: "authorize" | "reject", notes: string, programDecisions: Record<string, "authorized" | "rejected" | "pending">, documentDecisions: Record<string, "pending" | "secured" | "not_needed" | "declined">, documentFeedback: Record<string, string>, reviewerName: string) => Promise<boolean>;
  onLogout: () => void;
}

export default function WorkerWorkspace({ 
  initialIntakes, 
  settings, 
  onRefreshDB, 
  onUpdateSettings, 
  onAuthorizeIntake,
  onLogout
}: WorkerWorkspaceProps) {
  
  // Tab layout: 'cases' (Queue & Audit) | 'policies' (Prompt & Guidelines adjustments)
  const [activeTab, setActiveTab] = useState<"cases" | "policies">("cases");
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "authorized" | "rejected">("pending");
  const [sortBy, setSortBy] = useState<"urgency" | "confidence" | "date">("urgency");

  // Selected intake for side-by-side auditing
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(initialIntakes[0]?.id || null);

  // Active review notes state (reset on selected change)
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewerName, setReviewerName] = useState("Caseworker Sarah Conner");
  
  // Caseworker fine-grained decisions for individual programs & documents in selected intake
  const [programDecisions, setProgramDecisions] = useState<Record<string, "authorized" | "rejected" | "pending">>({});
  const [documentDecisions, setDocumentDecisions] = useState<Record<string, "pending" | "secured" | "not_needed" | "declined">>({});
  const [documentFeedback, setDocumentFeedback] = useState<Record<string, string>>({});
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Policy adjustment state inputs
  const [passcode, setPasscode] = useState(settings.caseworkerPasscode);
  const [promptPreset, setPromptPreset] = useState(settings.systemPromptPreset);
  const [policies, setPolicies] = useState<ProgramTemplate[]>(settings.activePolicies);
  const [isSavingPolicies, setIsSavingPolicies] = useState(false);
  const [policyNotification, setPolicyNotification] = useState<string | null>(null);

  // Sync internal state when template/selected case shifts
  const selectedCase = initialIntakes.find(i => i.id === selectedCaseId);

  useEffect(() => {
    if (selectedCase) {
      setReviewNotes(selectedCase.caseworkerNotes || "");
      
      const progs: Record<string, "authorized" | "rejected" | "pending"> = {};
      selectedCase.roadmap.eligiblePrograms.forEach(p => {
        progs[p.id] = p.status;
      });
      setProgramDecisions(progs);

      const docs: Record<string, "pending" | "secured" | "not_needed" | "declined"> = {};
      const feedbackNotes: Record<string, string> = {};
      selectedCase.roadmap.requiredDocuments.forEach(d => {
        docs[d.id] = d.status;
        feedbackNotes[d.id] = d.feedback || "";
      });
      setDocumentDecisions(docs);
      setDocumentFeedback(feedbackNotes);
    }
  }, [selectedCaseId, initialIntakes]);

  // Handle case authorization submit
  const handleReviewSubmit = async (action: "authorize" | "reject") => {
    if (!selectedCaseId) return;
    setIsSubmittingReview(true);
    
    const success = await onAuthorizeIntake(
      selectedCaseId, 
      action, 
      reviewNotes, 
      programDecisions, 
      documentDecisions, 
      documentFeedback,
      reviewerName
    );

    if (success) {
      // Stay on selected unless it falls out of pending filters or has changed
      await onRefreshDB();
    }
    setIsSubmittingReview(false);
  };

  // Handle systemic prompt & policy guidelines submit
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicies(true);
    setPolicyNotification(null);

    const success = await onUpdateSettings({
      caseworkerPasscode: passcode,
      systemPromptPreset: promptPreset,
      activePolicies: policies
    });

    if (success) {
      setPolicyNotification("Municipal policy directives and caseworker passcode updated in data registry.");
      await onRefreshDB();
      setTimeout(() => setPolicyNotification(null), 5000);
    }
    setIsSavingPolicies(false);
  };

  const handlePolicyChange = (index: number, field: keyof ProgramTemplate, value: string) => {
    const updated = [...policies];
    updated[index] = { ...updated[index], [field]: value };
    setPolicies(updated);
  };

  // Urgency prioritization metric weights for sorting
  const urgencyWeight = (flag: string) => {
    if (flag === "critical") return 4;
    if (flag === "high") return 3;
    if (flag === "moderate") return 2;
    return 1;
  };

  // Filter & triage sorting
  const triagedCases = initialIntakes
    .filter(c => {
      // Tab search
      const matchesSearch = 
        c.userData.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.plainTextSituation.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "urgency") {
        return urgencyWeight(b.urgencyFlag) - urgencyWeight(a.urgencyFlag) || b.confidenceScore - a.confidenceScore;
      }
      if (sortBy === "confidence") {
        return b.confidenceScore - a.confidenceScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div id="worker-workspace-parent" className="max-w-7xl mx-auto px-4 py-6">
      {/* Workspace Sub Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-slate-700" /> CivicClear Casework Control-Room
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational dashboard with manual policy authorizer logic — Human-in-the-Loop Governance
          </p>
        </div>
        
        {/* Workspace Navigation tab selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              id="tab-open-cases"
              className={`px-4 py-1.5 rounded-md text-xs font-semibold font-display transition cursor-pointer flex items-center gap-1.5
                ${activeTab === 'cases' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}
              `}
              onClick={() => setActiveTab("cases")}
            >
              <ClipboardList className="w-3.5 h-3.5" /> Client Queue &amp; Audit
            </button>
            <button
              id="tab-open-policies"
              className={`px-4 py-1.5 rounded-md text-xs font-semibold font-display transition cursor-pointer flex items-center gap-1.5
                ${activeTab === 'policies' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}
              `}
              onClick={() => setActiveTab("policies")}
            >
              <PenTool className="w-3.5 h-3.5" /> System Policies &amp; Prompt
            </button>
          </div>
          <button
            id="caseworker-logout-btn"
            className="px-4 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold font-display flex items-center gap-1.5 transition cursor-pointer"
            onClick={onLogout}
          >
            <Lock className="w-3.5 h-3.5" /> Lock &amp; Logout
          </button>
        </div>
      </div>

      {activeTab === "cases" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMN 1: Triaged Queue List (5/12 width) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-display text-slate-900">
                  Citizen Intake Queue ({triagedCases.length} cases)
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Triage Matrix Active</span>
              </div>

              {/* Live Search & filters block */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="queue-search-input"
                    type="text"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    placeholder="Search by ID, name, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Status buttons */}
                  <button
                    id="filter-pending-btn"
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer
                      ${statusFilter === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'}
                    `}
                    onClick={() => setStatusFilter("pending")}
                  >
                    Pending Assessment
                  </button>
                  <button
                    id="filter-authorized-btn"
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer
                      ${statusFilter === 'authorized' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'}
                    `}
                    onClick={() => setStatusFilter("authorized")}
                  >
                    Authorized
                  </button>
                  <button
                    id="filter-all-btn"
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer
                      ${statusFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'}
                    `}
                    onClick={() => setStatusFilter("all")}
                  >
                    All Cases
                  </button>
                </div>

                {/* Sort selector */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1"><ArrowUpDown className="w-3.5 h-3.5" /> Sort priority:</span>
                  <div className="flex bg-slate-100 rounded p-0.5">
                    <button
                      id="sort-btn-urgency"
                      className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer ${sortBy === 'urgency' ? 'bg-white text-slate-900 font-bold' : 'text-slate-500'}`}
                      onClick={() => setSortBy("urgency")}
                    >
                      Risk Urgency
                    </button>
                    <button
                      id="sort-btn-confidence"
                      className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer ${sortBy === 'confidence' ? 'bg-white text-slate-900 font-bold' : 'text-slate-500'}`}
                      onClick={() => setSortBy("confidence")}
                    >
                      AI Confidence
                    </button>
                    <button
                      id="sort-btn-date"
                      className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer ${sortBy === 'date' ? 'bg-white text-slate-900 font-bold' : 'text-slate-500'}`}
                      onClick={() => setSortBy("date")}
                    >
                      Submitted
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Queue items mapping */}
            <div className="max-h-[580px] overflow-y-auto space-y-2 pr-1.5" id="queue-items-flow">
              {triagedCases.length === 0 ? (
                <div className="bg-white rounded-xl py-12 px-4 border border-slate-200 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-400">NO COMPATIBLE CASES FOUND</p>
                  <p className="text-[11px] text-slate-500 leading-normal max-w-xs mx-auto">No cases match the keyword, filter, or triage status selected.</p>
                </div>
              ) : (
                triagedCases.map((c) => {
                  const isSelected = c.id === selectedCaseId;
                  const isPending = c.status === "pending";
                  return (
                    <div
                      id={`queue-card-${c.id}`}
                      key={c.id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none text-left relative overflow-hidden
                        ${isSelected ? 'bg-slate-950 border-slate-950 text-white shadow-sm ring-1 ring-slate-950' : 'bg-white border-slate-200/80 text-slate-800 hover:border-slate-400 hover:bg-slate-50/50'}
                      `}
                      onClick={() => setSelectedCaseId(c.id)}
                    >
                      {/* Left vertical urgency bar indicators */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5
                        ${c.urgencyFlag === 'critical' ? 'bg-red-600' : ''}
                        ${c.urgencyFlag === 'high' ? 'bg-amber-500' : ''}
                        ${c.urgencyFlag === 'moderate' ? 'bg-blue-500' : ''}
                        ${c.urgencyFlag === 'standard' ? 'bg-slate-400' : ''}
                      `} />

                      <div className="pl-2 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-mono font-semibold ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                            Ref ID: {c.id}
                          </span>
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase border
                            ${c.status === 'authorized' ? 'bg-emerald-50/10 text-emerald-400 border-emerald-500/20' : ''}
                            ${c.status === 'rejected' ? 'bg-red-50/10 text-red-400 border-red-500/20' : ''}
                            ${c.status === 'pending' ? 'bg-amber-50/10 text-amber-500 border-amber-500/20' : ''}
                          `}>
                            {c.status}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold font-display truncate leading-tight">
                          {c.userData.fullName || "Anonymous Resident"}
                        </h4>

                        <p className={`text-[11px] line-clamp-2 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {c.plainTextSituation}
                        </p>

                        <div className="pt-2 flex items-center justify-between text-[10px] font-mono border-t border-slate-100/10">
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full
                              ${c.urgencyFlag === 'critical' ? 'bg-red-500 animate-pulse' : ''}
                              ${c.urgencyFlag === 'high' ? 'bg-amber-500' : ''}
                              ${c.urgencyFlag === 'moderate' ? 'bg-blue-500' : ''}
                              ${c.urgencyFlag === 'standard' ? 'bg-slate-400' : ''}
                            `} />
                            <span className="capitalize">{c.urgencyFlag} Risk</span>
                          </div>
                          <span>Match Score: <strong className="font-bold">{c.confidenceScore}%</strong></span>
                          <span>{new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: Detailed Case Side-By-Side Audit Workspace (7/12 width) */}
          <div className="lg:col-span-7">
            {selectedCase ? (
              <div id="casework-audit-workspace" className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6 relative">
                {/* Visual Lock header overlay */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900 font-display">Manual Audit Verification Panel</h2>
                      <p className="text-[10px] text-slate-500 leading-normal">Operational verification and systemic checklist authority</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Review Queue Reference</span>
                    <strong className="text-xs font-mono text-slate-800">{selectedCase.id}</strong>
                  </div>
                </div>

                {/* Patient / client physical summary matrix */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-display">Client Supplementary Metrics</span>
                    <span className="text-[10px] font-mono text-slate-400">Supplied via form verification</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-center">
                      <span className="text-[10px] text-slate-400 block mb-0.5">AGE</span>
                      <strong className="text-slate-800 text-sm">{selectedCase.userData.age} yrs</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-center">
                      <span className="text-[10px] text-slate-400 block mb-0.5">HOUSEHOLD</span>
                      <strong className="text-slate-800 text-sm">{selectedCase.userData.householdSize} people</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-center">
                      <span className="text-[10px] text-slate-400 block mb-0.5">INCOME</span>
                      <strong className="text-emerald-700 text-sm">₱{selectedCase.userData.monthlyIncome}/mo</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-center">
                      <span className="text-[10px] text-slate-400 block mb-0.5">EVICT WARNING</span>
                      <strong className={selectedCase.userData.hasNoticeToQuit ? "text-red-600 text-sm font-bold" : "text-slate-600 text-sm"}>
                        {selectedCase.userData.hasNoticeToQuit ? "YES" : "NO"}
                      </strong>
                    </div>
                  </div>

                  {/* Veterans/Disability quick tags */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase
                      ${selectedCase.userData.veteranStatus ? 'bg-indigo-100 text-indigo-800 border-indigo-200 border' : 'bg-slate-100 text-slate-400'}
                    `}>
                      {selectedCase.userData.veteranStatus ? "🎖️ Veteran Card" : "No Veteran Status"}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase
                      ${selectedCase.userData.disabilityStatus ? 'bg-purple-100 text-purple-800 border-purple-200 border' : 'bg-slate-100 text-slate-400'}
                    `}>
                      {selectedCase.userData.disabilityStatus ? "♿ Disability Card" : "No Disability"}
                    </span>
                  </div>
                </div>

                {/* SIDE-BY-SIDE: Raw Input (Left) & AI Verification Block (Right) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Citizen Raw plain text */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-100/40 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase font-display tracking-wider">Citizen Narrative</span>
                      <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.2 rounded border border-slate-200">Raw Input Log</span>
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed font-sans max-h-48 overflow-y-auto whitespace-pre-wrap">
                      "{selectedCase.plainTextSituation}"
                    </div>
                  </div>

                  {/* AI Verification Assessment */}
                  <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/20 relative">
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px] font-bold font-display border border-blue-200">
                      <Sparkles className="w-2.5 h-2.5" /> AI Triage co-pilot
                    </div>
                    <span className="text-xs font-bold text-blue-900 uppercase font-display tracking-wider">Verification Block</span>
                    
                    <div className="mt-4 space-y-3.5 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 block">TRIAGE EXPLANATION LOGIC</span>
                        <p className="text-slate-700 mt-1 leading-normal">
                          {selectedCase.urgencyReason}
                        </p>
                      </div>

                      <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-2">
                        <span className="text-[10px] text-slate-400">POLICIES MATCH PROBABILITY:</span>
                        <strong className="text-blue-700 font-mono text-sm">{selectedCase.confidenceScore}%</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fine Grained Decisions on Identified Lines (Caseworker can modify individual programs) */}
                <div className="space-y-3 pt-2">
                  <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                    Individual Grant Sub-Authorizations:
                  </span>
                  
                  {selectedCase.roadmap.eligiblePrograms.map((program) => (
                    <div 
                      key={program.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <strong className="text-slate-800 font-display font-bold block">{program.name}</strong>
                        <span className="text-[10px] text-slate-400 block font-mono">Matched: {program.confidence}% confidence</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          id={`auth-program-${program.id}-ok`}
                          type="button"
                          className={`px-3 py-1 rounded text-[10px] font-semibold border cursor-pointer transition
                            ${programDecisions[program.id] === 'authorized' 
                              ? 'bg-emerald-600 border-emerald-600 text-white font-bold' 
                              : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-600'}
                          `}
                          onClick={() => setProgramDecisions(prev => ({ ...prev, [program.id]: "authorized" }))}
                        >
                          Approve
                        </button>
                        <button
                          id={`auth-program-${program.id}-no`}
                          type="button"
                          className={`px-3 py-1 rounded text-[10px] font-semibold border cursor-pointer transition
                            ${programDecisions[program.id] === 'rejected' 
                              ? 'bg-red-600 border-red-600 text-white font-bold' 
                              : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-600'}
                          `}
                          onClick={() => setProgramDecisions(prev => ({ ...prev, [program.id]: "rejected" }))}
                        >
                          Decline
                        </button>
                        <button
                          id={`auth-program-${program.id}-pend`}
                          type="button"
                          className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer transition
                            ${programDecisions[program.id] === 'pending' 
                              ? 'bg-amber-100 border-amber-300 text-amber-800 font-bold' 
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-400'}
                          `}
                          onClick={() => setProgramDecisions(prev => ({ ...prev, [program.id]: "pending" }))}
                        >
                          Hold
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fine Grained Decisions on Document Verification */}
                <div className="space-y-3 pt-2">
                  <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                    Document Physical Verification Checklist:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {selectedCase.roadmap.requiredDocuments.map((doc) => (
                      <div 
                        key={doc.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 capitalize block">{doc.category}</span>
                            <strong className="text-slate-800 font-display block leading-tight">{doc.name}</strong>
                          </div>
                          <div className="flex bg-white rounded border border-slate-300 p-0.5 text-[10px] font-mono justify-between mt-2">
                            <button
                              id={`doccheck-${doc.id}-secured`}
                              type="button"
                              className={`px-1.5 py-0.5 rounded cursor-pointer ${documentDecisions[doc.id] === 'secured' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                              onClick={() => setDocumentDecisions(prev => ({ ...prev, [doc.id]: "secured" }))}
                            >
                              Secured
                            </button>
                            <button
                              id={`doccheck-${doc.id}-declined`}
                              type="button"
                              className={`px-1.5 py-0.5 rounded cursor-pointer ${documentDecisions[doc.id] === 'declined' ? 'bg-red-600 text-white font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                              onClick={() => setDocumentDecisions(prev => ({ ...prev, [doc.id]: "declined" }))}
                            >
                              Declined
                            </button>
                            <button
                              id={`doccheck-${doc.id}-pending`}
                              type="button"
                              className={`px-1.5 py-0.5 rounded cursor-pointer ${documentDecisions[doc.id] === 'pending' ? 'bg-amber-100 text-amber-800 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                              onClick={() => setDocumentDecisions(prev => ({ ...prev, [doc.id]: "pending" }))}
                            >
                              Pending
                            </button>
                            <button
                              id={`doccheck-${doc.id}-not_needed`}
                              type="button"
                              className={`px-1.5 py-0.5 rounded cursor-pointer ${documentDecisions[doc.id] === 'not_needed' ? 'bg-slate-200 text-slate-700 font-bold' : 'text-slate-400 hover:text-slate-800'}`}
                              onClick={() => setDocumentDecisions(prev => ({ ...prev, [doc.id]: "not_needed" }))}
                            >
                              Waived
                            </button>
                          </div>
                        </div>

                        {/* Document verification reason and preset snippets */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                          <label htmlFor={`doc-feedback-${doc.id}`} className="block text-[9px] font-bold text-slate-500">
                            Verification Note / Reason:
                          </label>
                          <textarea
                            id={`doc-feedback-${doc.id}`}
                            rows={2}
                            placeholder="State why this document was approved, declined, pending, or waived..."
                            className="w-full text-xs p-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 resize-none font-sans leading-normal"
                            value={documentFeedback[doc.id] || ""}
                            onChange={(e) => setDocumentFeedback(prev => ({ ...prev, [doc.id]: e.target.value }))}
                          />
                          <div className="flex flex-wrap gap-1">
                            <button
                              id={`preset-verified-${doc.id}`}
                              type="button"
                              className="px-1.5 py-0.5 text-[8px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded cursor-pointer"
                              onClick={() => setDocumentFeedback(prev => ({ ...prev, [doc.id]: "Verification completed successfully. Document is authentic and valid." }))}
                            >
                              Verified OK
                            </button>
                            <button
                              id={`preset-illegible-${doc.id}`}
                              type="button"
                              className="px-1.5 py-0.5 text-[8px] bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded cursor-pointer"
                              onClick={() => setDocumentFeedback(prev => ({ ...prev, [doc.id]: "The submitted image is fuzzy / illegible. Please upload a high-resolution, clear photo." }))}
                            >
                              Illegible Copy
                            </button>
                            <button
                              id={`preset-expired-${doc.id}`}
                              type="button"
                              className="px-1.5 py-0.5 text-[8px] bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded cursor-pointer"
                              onClick={() => setDocumentFeedback(prev => ({ ...prev, [doc.id]: "This document was assessed as expired. Please submit an active, valid credential or dated statement." }))}
                            >
                              Expired
                            </button>
                            <button
                              id={`preset-mismatch-${doc.id}`}
                              type="button"
                              className="px-1.5 py-0.5 text-[8px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded cursor-pointer font-medium"
                              onClick={() => setDocumentFeedback(prev => ({ ...prev, [doc.id]: "The name or residential address on this paper does not match the applicant's record." }))}
                            >
                              Mismatched Data
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Worker memo fields & final approval actions */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="reviewer-name" className="block text-xs font-semibold text-slate-800 font-display">
                        Signed-off Reviewer (Caseworker Name)
                      </label>
                      <input
                        id="reviewer-name"
                        type="text"
                        className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-slate-50 text-slate-800 font-medium"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="review-memo" className="block text-xs font-semibold text-slate-800 font-display">
                        Caseworker Assessment Memo (Public)
                      </label>
                      <textarea
                        id="review-memo"
                        rows={2}
                        className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        placeholder="Write details e.g. Met on 10th June, audited income statements..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Active review state indicators */}
                  {selectedCase.reviewedBy && (
                    <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 leading-normal border border-slate-200 flex items-start gap-1.5">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        Last Action: <strong className="text-slate-800">Review completed</strong> by <span className="font-semibold text-slate-700">{selectedCase.reviewedBy}</span> on {new Date(selectedCase.reviewedAt || "").toLocaleDateString()} at {new Date(selectedCase.reviewedAt || "").toLocaleTimeString()}.
                      </div>
                    </div>
                  )}

                  {/* Decision triggers */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      id="action-btn-authorize-global"
                      type="button"
                      disabled={isSubmittingReview}
                      className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-xl font-display flex items-center justify-center gap-1.5 transition cursor-pointer text-xs focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                      onClick={() => handleReviewSubmit("authorize")}
                    >
                      <CheckCircle className="w-4 h-4" /> Authorize &amp; Allocate Funds
                    </button>
                    <button
                      id="action-btn-deny-global"
                      type="button"
                      disabled={isSubmittingReview}
                      className="flex-1 bg-red-700 hover:bg-red-800 text-white font-semibold py-2.5 px-4 rounded-xl font-display flex items-center justify-center gap-1.5 transition cursor-pointer text-xs focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      onClick={() => handleReviewSubmit("reject")}
                    >
                      <XCircle className="w-4 h-4" /> Decline &amp; Audit Alert
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 py-24 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 font-display">No case selected for manual review</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Click on any client narrative from the left triage list to load live documents, confidence matrices, and authorizer sliders.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* TAB 2: System Policy Guidelines Adjustment console (Settings Face) */
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-8 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-800 hover:rotate-12 transition-transform" />
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">Senior Staff Policy Adjuster Panel</h2>
                <p className="text-xs text-slate-500">Amend the active criteria matching rules for mathematical co-pilot parsing</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="caseworker-passcode-update" className="block text-xs font-semibold text-slate-800 font-display flex items-center gap-1">
                  Update Caseworker Passcode
                </label>
                <input
                  id="caseworker-passcode-update"
                  type="text"
                  required
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-slate-50 text-slate-800 font-mono tracking-wider focus:outline-none"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                />
                <span className="block text-[10px] text-slate-400">Controls gateway lock validation tests</span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ai-caseworker-preset" className="block text-xs font-semibold text-slate-800 font-display flex items-center gap-1">
                  Assessor AI System Preset Prompt
                </label>
                <input
                  id="ai-caseworker-preset"
                  type="text"
                  required
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-slate-50 text-slate-800 focus:outline-none"
                  value={promptPreset}
                  onChange={(e) => setPromptPreset(e.target.value)}
                />
                <span className="block text-[10px] text-slate-400">Influences Gemini character, tone, and logical strictness</span>
              </div>
            </div>

            {/* Program Templates lists */}
            <div className="space-y-4">
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold font-display text-slate-900 mb-1">
                  Active Municipal Grant Rules Guidelines
                </h3>
                <p className="text-[11px] text-slate-500">
                  Update the mathematical constraints and program rules. The AI parser scans these exact instructions to issue eligibility suggestions.
                </p>
              </div>

              <div id="policies-editor-fields" className="space-y-6">
                {policies.map((p, idx) => (
                  <div key={p.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs font-bold font-display border-b border-slate-200/60 pb-2">
                      <span className="text-blue-800 capitalize">{p.category} Template Ref: {p.id}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Index {idx + 1}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                      <div className="space-y-1">
                        <label htmlFor={`policy-name-${p.id}`} className="font-semibold text-slate-700 block text-[10px]">PROGRAM TITLE</label>
                        <input
                          id={`policy-name-${p.id}`}
                          type="text"
                          className="w-full p-2 rounded bg-white border border-slate-300 text-slate-800 text-[11px]"
                          value={p.name}
                          onChange={(e) => handlePolicyChange(idx, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={`policy-amount-${p.id}`} className="font-semibold text-slate-700 block text-[10px]">AUTHORIZED MAXIMUM VALUE TEXT</label>
                        <input
                          id={`policy-amount-${p.id}`}
                          type="text"
                          className="w-full p-2 rounded bg-white border border-slate-300 text-slate-800 text-[11px] font-mono"
                          value={p.amountText}
                          onChange={(e) => handlePolicyChange(idx, "amountText", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label htmlFor={`policy-desc-${p.id}`} className="font-semibold text-slate-700 block text-[10px]">SUMMARY DESCRIPTION</label>
                        <input
                          id={`policy-desc-${p.id}`}
                          type="text"
                          className="w-full p-2 rounded bg-white border border-slate-300 text-slate-800 text-[11px]"
                          value={p.description}
                          onChange={(e) => handlePolicyChange(idx, "description", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label htmlFor={`policy-guide-${p.id}`} className="font-semibold text-slate-700 block text-[10px] flex items-center gap-1">
                          CRITICAL POLICY MATCHING GUIDELINES DIRECTIONS (MUST CONTAIN EXPLICIT LOGIC RULES FOR AI MODEL)
                        </label>
                        <textarea
                          id={`policy-guide-${p.id}`}
                          rows={2}
                          className="w-full p-2 rounded bg-white border border-slate-300 text-slate-800 text-[11px] leading-relaxed"
                          value={p.guidelines}
                          onChange={(e) => handlePolicyChange(idx, "guidelines", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications and savings buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                {policyNotification && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border-emerald-250 border rounded-lg text-xs font-semibold leading-normal font-display">
                    {policyNotification}
                  </div>
                )}
              </div>
              
              <button
                id="save-policies-submit-btn"
                type="submit"
                disabled={isSavingPolicies}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-xl font-display flex items-center justify-center gap-2 transition cursor-pointer text-xs focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {isSavingPolicies ? "Writing State Changes..." : "Commit Policy Guidelines"}
              </button>
            </div>

          </form>

        </div>
      )}
    </div>
  );
}
