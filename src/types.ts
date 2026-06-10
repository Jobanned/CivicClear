/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProgramTemplate {
  id: string;
  name: string;
  category: "housing" | "utility" | "emergency" | "food" | "specialized";
  description: string;
  amountText: string;
  guidelines: string;
}

export interface EligibleProgram {
  id: string;
  name: string;
  category: "housing" | "utility" | "emergency" | "food" | "specialized";
  description: string;
  amountText: string;
  confidence: number; // 0 to 100
  eligibilityLogic: string; // Detailed reason pointing to policy guidelines
  status: "pending" | "authorized" | "rejected";
}

export interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  category: "income" | "identity" | "residency" | "hardship";
  status: "pending" | "secured" | "not_needed" | "declined";
  feedback?: string;
}

export interface Intake {
  id: string;
  plainTextSituation: string;
  userData: {
    fullName?: string;
    householdSize: number;
    monthlyIncome: number;
    age: number;
    disabilityStatus: boolean;
    veteranStatus: boolean;
    hasNoticeToQuit: boolean;
  };
  urgencyFlag: "critical" | "high" | "moderate" | "standard";
  urgencyReason: string;
  confidenceScore: number; // Aggregate match score 0-100
  createdAt: string;
  status: "pending" | "authorized" | "rejected";
  reviewedAt?: string;
  reviewedBy?: string;
  caseworkerNotes?: string;
  roadmap: {
    eligiblePrograms: EligibleProgram[];
    requiredDocuments: RequiredDocument[];
  };
}

export interface SystemSettings {
  caseworkerPasscode: string;
  systemPromptPreset: string;
  activePolicies: ProgramTemplate[];
}
