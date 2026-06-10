/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, ShieldCheck, Heart, ArrowRight, User, AlertCircle } from "lucide-react";

interface WelcomeIntakeProps {
  onSubmitIntake: (situation: string, data: {
    fullName: string;
    householdSize: number;
    monthlyIncome: number;
    age: number;
    disabilityStatus: boolean;
    veteranStatus: boolean;
    hasNoticeToQuit: boolean;
  }) => void;
  isSubmitting: boolean;
}

export default function WelcomeIntake({ onSubmitIntake, isSubmitting }: WelcomeIntakeProps) {
  const [situation, setSituation] = useState("");
  const [fullName, setFullName] = useState("");
  const [householdSize, setHouseholdSize] = useState<number>(1);
  const [monthlyIncome, setMonthlyIncome] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [disabilityStatus, setDisabilityStatus] = useState(false);
  const [veteranStatus, setVeteranStatus] = useState(false);
  const [hasNoticeToQuit, setHasNoticeToQuit] = useState(false);
  const [showHelpers, setShowHelpers] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!situation.trim()) return;

    onSubmitIntake(situation, {
      fullName: fullName.trim() || "Anonymous Resident",
      householdSize,
      monthlyIncome: Number(monthlyIncome) || 0,
      age: Number(age) || 35,
      disabilityStatus,
      veteranStatus,
      hasNoticeToQuit
    });
  };

  const handleQuickSituation = (text: string, templateData: any) => {
    setSituation(text);
    if (templateData.fullName) setFullName(templateData.fullName);
    if (templateData.householdSize !== undefined) setHouseholdSize(templateData.householdSize);
    if (templateData.monthlyIncome !== undefined) setMonthlyIncome(templateData.monthlyIncome.toString());
    if (templateData.age !== undefined) setAge(templateData.age.toString());
    if (templateData.disabilityStatus !== undefined) setDisabilityStatus(templateData.disabilityStatus);
    if (templateData.veteranStatus !== undefined) setVeteranStatus(templateData.veteranStatus);
    if (templateData.hasNoticeToQuit !== undefined) setHasNoticeToQuit(templateData.hasNoticeToQuit);
    setShowHelpers(true);
  };

  return (
    <div id="welcome-intake-container" className="max-w-3xl mx-auto px-4 py-8">
      {/* Empathetic Greeting & Explanation */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100 mb-4 font-display">
          <Heart className="w-3.5 h-3.5 fill-current" /> Human-in-the-Loop Housing Navigation
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 tracking-tight">
          Let’s Navigate Public Housing &amp; Grants Together
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Describe what you are facing in simple, everyday language. We compare your situation against 
          municipal grants and compile your checklist. No cold bots or robotic automated denials—real 
          caseworkers authorize every recommendation.
        </p>
      </div>

      {/* Trust & Transparency Banner */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-8 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-emerald-900 font-display">Your narrative is safe and fully governed</h3>
          <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
            All AI-assisted matching acts purely as an assistive advisor. Senior caseworkers manually audit 
            the eligibility logs, review your raw text, and unlock your physical state benefits path.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 space-y-6">
        {/* Step 1: Plain text Situation */}
        <div className="space-y-2">
          <label htmlFor="situation" className="block text-sm font-semibold text-slate-800 font-display">
            1. What challenge or displacement risk are you experiencing?
          </label>
          <span className="block text-xs text-slate-500 leading-normal mb-2">
            Just speak naturally. Write about rent problems, notice warnings, utility arrears, heating issues, veteran status, or elderly household structures. This will direct the search engine.
          </span>
          <textarea
            id="situation"
            required
            rows={5}
            className="w-full rounded-xl border border-slate-300 p-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition h-32 resize-none leading-relaxed text-sm sm:text-base"
            placeholder="For example: My husband lost his work last month and our landlord gave us a written notice to quit in 10 days because we can't afford the ₱30,000 rent this month. I have two children with asthma and I don't know where to turn..."
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
          />
        </div>

        {/* Quick Help Templates Helper */}
        <div className="py-2">
          <span className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider font-display">
            Need an example layout? Choose one to pre-fill:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              id="template-action-erap"
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium transition cursor-pointer"
              onClick={() => handleQuickSituation("I'm sharing a small apartment with my aging mother. We received a written eviction warning from our landlord last week because our rent has accumulated to ₱35,000 in arrears after my illness. Our total monthly household income is limited to my ₱15,000 wage.", {
                fullName: "Maria Hernandez",
                householdSize: 2,
                monthlyIncome: 15000,
                age: 34,
                disabilityStatus: false,
                veteranStatus: false,
                hasNoticeToQuit: true
              })}
            >
              🏠 Threatened Eviction (Parent + Child)
            </button>
            <button
              id="template-action-vssf"
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium transition cursor-pointer"
              onClick={() => handleQuickSituation("I am a 68-year-old Navy veteran. I live alone on pension and am having a tough time keeping up with utility bills this winter. My heating equipment broke down, and my supplier is threatening a disconnection notice for unpaid balances totaling ₱12,000.", {
                fullName: "Raymond Vance",
                householdSize: 1,
                monthlyIncome: 18000,
                age: 68,
                disabilityStatus: true,
                veteranStatus: true,
                hasNoticeToQuit: false
              })}
            >
              🎖️ Elderly Utility and Heat (Disability Veteran)
            </button>
          </div>
        </div>

        {/* Step 2: Demographic verification helper */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <button
              id="toggle-metrics-btn"
              type="button"
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 font-display flex items-center gap-1 cursor-pointer focus:outline-none"
              onClick={() => setShowHelpers(!showHelpers)}
            >
              {showHelpers ? "▼ Hide optional eligibility helpers" : "▶ Show optional eligibility helpers"}
            </button>
            <span className="text-xs text-slate-400 font-mono">Improves AI assessment</span>
          </div>

          {showHelpers && (
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="fullname" className="block text-xs font-semibold text-slate-700 font-display">
                    Full Name (Optional)
                  </label>
                  <input
                    id="fullname"
                    type="text"
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm bg-white focus:ring-2 focus:ring-blue-600/20 text-slate-800"
                    placeholder="e.g. Maria Hernandez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="household" className="block text-xs font-semibold text-slate-700 font-display">
                    Household Size (Number of people)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      id="household-minus"
                      type="button"
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded text-sm font-bold"
                      onClick={() => setHouseholdSize(prev => Math.max(1, prev - 1))}
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-bold font-mono text-slate-800">{householdSize}</span>
                    <button
                      id="household-plus"
                      type="button"
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded text-sm font-bold"
                      onClick={() => setHouseholdSize(prev => Math.min(10, prev + 1))}
                    >
                      +
                    </button>
                    <span className="text-xs text-slate-500 font-display">people total</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="income" className="block text-xs font-semibold text-slate-700 font-display flex justify-between">
                    <span>Monthly Household Income (₱)</span>
                    <span className="text-[10px] text-slate-400">Total gross</span>
                  </label>
                  <input
                    id="income"
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm bg-white focus:ring-2 focus:ring-blue-600/20 font-mono text-slate-800"
                    placeholder="e.g. 25000"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="age" className="block text-xs font-semibold text-slate-700 font-display">
                    Your Age (Years)
                  </label>
                  <input
                    id="age"
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm bg-white focus:ring-2 focus:ring-blue-600/20 font-mono text-slate-800"
                    placeholder="e.g. 64"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
              </div>

              {/* Status checkboxes */}
              <div className="border-t border-slate-200/60 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-100 transition">
                  <input
                    id="disability"
                    type="checkbox"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    checked={disabilityStatus}
                    onChange={(e) => setDisabilityStatus(e.target.checked)}
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-800 font-display">I have a disability</span>
                    <span className="block text-[10px] text-slate-400">Triggers specialized priority</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-100 transition">
                  <input
                    id="veteran"
                    type="checkbox"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    checked={veteranStatus}
                    onChange={(e) => setVeteranStatus(e.target.checked)}
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-800 font-display">Former Military/Veteran</span>
                    <span className="block text-[10px] text-slate-400">Activates Veterans (VSSF) fund</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-100 transition">
                  <input
                    id="noticequit"
                    type="checkbox"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    checked={hasNoticeToQuit}
                    onChange={(e) => setHasNoticeToQuit(e.target.checked)}
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-800 font-display">Eviction / Notice to Quit</span>
                    <span className="block text-[10px] text-slate-400">Flags immediate critical state</span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Action Button & Wait States */}
        <div id="welcome-intake-submit-section" className="pt-4">
          {isSubmitting ? (
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 font-display">Triage Assistant Online</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Analyzing raw text against current municipal budgets, evaluating household income thresholds, and preparing the required document audit log. This takes just a moment...
              </p>
            </div>
          ) : (
            <button
              id="submit-intake-btn"
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl font-display flex items-center justify-center gap-2 transition hover:-translate-y-0.5 cursor-pointer shadow-sm text-sm sm:text-base focus:ring-2 focus:ring-blue-500"
            >
              Generate Assistance Roadmap <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Trust guarantees footer */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-10 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Real-time human adjudication</span>
        </div>
        <div className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span>Polite, supportive guidance</span>
        </div>
        <div className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-blue-500" />
          <span>Accessible high-readability layout</span>
        </div>
      </div>
    </div>
  );
}
