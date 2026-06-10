/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Intake, EligibleProgram, RequiredDocument, SystemSettings, ProgramTemplate } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "civic_clear_db.json");

// Define real municipal program templates that will govern evaluations
const DEFAULT_PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: "erap",
    name: "Emergency Eviction Rental Assistance (ERAP)",
    category: "housing",
    description: "Urgent rental payment stabilization for low-income residents facing a high risk of eviction.",
    amountText: "Up to ₱120,000 (covers 3 months arrears)",
    guidelines: "Candidate must show hardship, a household size of 1 or more, household monthly income below ₱50,000, and a landlord eviction warning or written notice to quit."
  },
  {
    id: "liheap",
    name: "Low-Income Household Energy & Utility Relief (LIHEAP)",
    category: "utility",
    description: "Critical bill payment subsidies for power, warmth, cooling, or emergency furnace replacement.",
    amountText: "Direct credit up to ₱30,000",
    guidelines: "Open to individuals and small households with combined income below ₱45,000/mo. Elderly citizens (age over 60) or disabled residents receive double processing confidence priority."
  },
  {
    id: "rrhv",
    name: "Rapid Re-Housing Transition Voucher (RRHV)",
    category: "emergency",
    description: "Crisis shelter diversion and structural rental startup assistance for newly displaced families.",
    amountText: "Up to ₱200,000 (deposit + first 6 months)",
    guidelines: "Applicable only to critical-risk profiles showing a pattern of immediate displacement, lack of safe housing alternatives, or active shelter status."
  },
  {
    id: "shsg",
    name: "Senior Home Stabilization Grant (SHSG)",
    category: "specialized",
    description: "Targeted residential improvement funding for seniors to maintain safety or upgrade vital HVAC systems.",
    amountText: "Up to ₱60,000 (non-repayable)",
    guidelines: "Citizen must be aged 60 or above, own their home structure OR possess a written lease agreement, and verify restricted income guidelines."
  },
  {
    id: "vssf",
    name: "Veterans Supportive Services Fund (VSSF)",
    category: "specialized",
    description: "Dedicated re-rental and veteran family stabilization support covering utilities, rent arrears, and security deposits.",
    amountText: "Up to ₱100,000 support voucher",
    guidelines: "Applicant must be a verified former military veteran, active reserve member, or immediate military spouse experiencing secure transition deficits."
  }
];

// Seed realistic Initial Intakes for caseworkers to instantly audit and review
const INITIAL_INTAKES_SEED: Intake[] = [
  {
    id: "case-01",
    plainTextSituation: "I am a 74-year-old military veteran. My electric heaters stopped working last winter, and now my bills have stacked up to ₱25,000. I survive on a fixed senior retirement, and my landlord is threatening to cut off my supply or ask me to leave because I'm behind on payments.",
    userData: {
      fullName: "Arthur Pendelton",
      householdSize: 1,
      monthlyIncome: 18000,
      age: 74,
      disabilityStatus: false,
      veteranStatus: true,
      hasNoticeToQuit: true
    },
    urgencyFlag: "critical",
    urgencyReason: "Senior veteran facing utilities cutoff threat and eviction risk under cold climate terms.",
    confidenceScore: 94,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4h ago
    status: "pending",
    roadmap: {
      eligiblePrograms: [
        {
          id: "vssf",
          name: "Veterans Supportive Services Fund (VSSF)",
          category: "specialized",
          description: "Dedicated re-rental and veteran family stabilization support covering utilities, rent arrears, and security deposits.",
          amountText: "Up to ₱100,000 support voucher",
          confidence: 96,
          eligibilityLogic: "Applicant's veteran status was validated, household income of ₱18,000 lies below the veterans transition threshold.",
          status: "pending"
        },
        {
          id: "liheap",
          name: "Low-Income Household Energy & Utility Relief (LIHEAP)",
          category: "utility",
          description: "Critical bill payment subsidies for power, warmth, cooling, or emergency furnace replacement.",
          amountText: "Direct credit up to ₱30,000",
          confidence: 92,
          eligibilityLogic: "Aged 74, electric utility arrears verified, income is below the ₱45,000/mo cutoff standard.",
          status: "pending"
        }
      ],
      requiredDocuments: [
        {
          id: "doc-vssf-1",
          name: "DD Form 214 Certificate of Release",
          description: "To verify historic honorable service record for the Veterans Fund.",
          category: "identity",
          status: "pending"
        },
        {
          id: "doc-income-1",
          name: "Senior Fixed Pension Statement",
          description: "Official monthly proof of pension earnings.",
          category: "income",
          status: "pending"
        },
        {
          id: "doc-residency-1",
          name: "Lease or Utility Statement with Landlord Notice",
          description: "Required to document active billing liabilities and threat of utility shutoff.",
          category: "residency",
          status: "pending"
        }
      ]
    }
  },
  {
    id: "case-02",
    plainTextSituation: "I lost my job at the local warehouse last week. I have 2 small boys and our landlord gave us a written notice to quit telling us we have to leave in 10 days if we cannot pay the ₱35,000 rent. I have nowhere else to take my babies. I am struggling so much.",
    userData: {
      fullName: "Clara Martinez",
      householdSize: 3,
      monthlyIncome: 0,
      age: 29,
      disabilityStatus: false,
      veteranStatus: false,
      hasNoticeToQuit: true
    },
    urgencyFlag: "critical",
    urgencyReason: "Eviction threat with written Notice to Quit issued to a family containing dependent minors.",
    confidenceScore: 98,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 24h ago
    status: "pending",
    roadmap: {
      eligiblePrograms: [
        {
          id: "erap",
          name: "Emergency Eviction Rental Assistance (ERAP)",
          category: "housing",
          description: "Urgent rental payment stabilization for low-income residents facing a high risk of eviction.",
          amountText: "Up to ₱120,000 (covers 3 months arrears)",
          confidence: 99,
          eligibilityLogic: "Possesses a formal Eviction notice to Quit, household size of 3, with active income at ₱0/mo (below ₱50,000 threshold).",
          status: "pending"
        },
        {
          id: "rrhv",
          name: "Rapid Re-Housing Transition Voucher (RRHV)",
          category: "emergency",
          description: "Crisis shelter diversion and structural rental startup assistance for newly displaced families.",
          amountText: "Up to ₱200,000 (deposit + first 6 months)",
          confidence: 88,
          eligibilityLogic: "Emergency displacement window of 10 days active with no auxiliary shelter resources or second wage earners.",
          status: "pending"
        }
      ],
      requiredDocuments: [
        {
          id: "doc-erap-ea",
          name: "Eviction Notice to Quit (Written)",
          description: "Copy of the landlord eviction letter containing 10-day deadline.",
          category: "hardship",
          status: "pending"
        },
        {
          id: "doc-erap-inc",
          name: "Termination of Employment Notice",
          description: "Required to explain shift from previous wage to ₱0 income.",
          category: "income",
          status: "pending"
        },
        {
          id: "doc-identity-kids",
          name: "Minor Dependents Birth Certificates",
          description: "Required for priority calculations involving the children.",
          category: "identity",
          status: "pending"
        }
      ]
    }
  },
  {
    id: "case-03",
    plainTextSituation: "Greetings. I am an electric wheelchair user and struggle to pay utility heating bills because of my medical oxygen machines running 24/7. My income is only ₱22,000 a month from social security disability payments and I live alone.",
    userData: {
      fullName: "David Chen",
      householdSize: 1,
      monthlyIncome: 22000,
      age: 45,
      disabilityStatus: true,
      veteranStatus: false,
      hasNoticeToQuit: false
    },
    urgencyFlag: "moderate",
    urgencyReason: "Medically fragile resident dependent on power for life-stabilizing equipment but stable from eviction.",
    confidenceScore: 88,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    status: "authorized",
    reviewedAt: new Date(Date.now() - 3600000 * 46).toISOString(),
    reviewedBy: "Caseworker Sarah Conner",
    caseworkerNotes: "Approved LIHEAP grant direct payout. Sent request to utility vendor. Authorized secondary outreach for electric supply audit.",
    roadmap: {
      eligiblePrograms: [
        {
          id: "liheap",
          name: "Low-Income Household Energy & Utility Relief (LIHEAP)",
          category: "utility",
          description: "Critical bill payment subsidies for power, warmth, cooling, or emergency furnace replacement.",
          amountText: "Direct credit up to ₱30,000",
          confidence: 95,
          eligibilityLogic: "Documented disability status + medical device reliance. Low-income verified at ₱22,000/mo.",
          status: "authorized"
        }
      ],
      requiredDocuments: [
        {
          id: "doc-disability-proof",
          name: "Social Security Disability Award Letter",
          description: "Confirms active disability status/funding.",
          category: "income",
          status: "secured",
          feedback: "Verification completed successfully. Disability award letter is authentic and valid."
        },
        {
          id: "doc-utility-bill",
          name: "Past 2 Months Utility Statements",
          description: "Shows electric billing levels of oxygen machine.",
          category: "residency",
          status: "secured",
          feedback: "Statements successfully authenticated. Direct meter ID linked to case."
        }
      ]
    }
  }
];

// Load or initialize Database Setup
function getDBData(): { settings: SystemSettings; intakes: Intake[] } {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      if (parsed.settings && parsed.intakes) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading database file, resetting...", e);
  }

  const defaultData = {
    settings: {
      caseworkerPasscode: "admin123",
      systemPromptPreset: "You are an empathetic social caseworker AI reviewing citizen situations.",
      activePolicies: DEFAULT_PROGRAM_TEMPLATES
    },
    intakes: INITIAL_INTAKES_SEED
  };
  saveDBData(defaultData);
  return defaultData;
}

function saveDBData(data: { settings: SystemSettings; intakes: Intake[] }) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing to database", e);
  }
}

// REST endpoints
app.get("/api/db-state", (req, res) => {
  res.json(getDBData());
});

app.get("/api/intakes", (req, res) => {
  const db = getDBData();
  res.json(db.intakes);
});

app.get("/api/settings", (req, res) => {
  const db = getDBData();
  res.json(db.settings);
});

app.post("/api/settings", (req, res) => {
  const db = getDBData();
  const { caseworkerPasscode, systemPromptPreset, activePolicies } = req.body;
  if (caseworkerPasscode !== undefined) db.settings.caseworkerPasscode = caseworkerPasscode;
  if (systemPromptPreset !== undefined) db.settings.systemPromptPreset = systemPromptPreset;
  if (activePolicies !== undefined) db.settings.activePolicies = activePolicies;
  saveDBData(db);
  res.json({ success: true, settings: db.settings });
});

// Create Intake Route - Uses Gemini API to evaluate plain text securely
app.post("/api/intakes", async (req, res) => {
  const { plainTextSituation, userData } = req.body;
  if (!plainTextSituation) {
    return res.status(400).json({ error: "plainTextSituation is required." });
  }

  const db = getDBData();
  const currentPolicies = db.settings.activePolicies;

  let urgencyFlag: "critical" | "high" | "moderate" | "standard" = "moderate";
  let urgencyReason = "Initial triage assigned.";
  let confidenceScore = 80;
  let suggestedPrograms: any[] = [];
  let suggestedDocuments: any[] = [];

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      const policyContextString = currentPolicies
        .map(p => `Program ID: ${p.id}\nName: ${p.name}\nAmount: ${p.amountText}\nDescription: ${p.description}\nGuidelines: ${p.guidelines}`)
        .join("\n\n");

      const prompt = `
You are the intake assessor AI for CivicClear, a public housing and grant portal.
Analyze this citizen's plain text situation and supplementary data according to the municipal program templates. All financial values and guidelines must be evaluated and outputted in Philippine Peso (₱).

MUNICIPAL PROGRAM INSTRUCTIONS & GUIDE-BENCHMARKS:
${policyContextString}

CITIZEN'S INPUT WRITTEN DESCRIPTION:
"${plainTextSituation}"

SUPPLEMENTARY EXPLICIT CITIZEN DATA:
- Age: ${userData?.age ?? "Not provided"}
- Household Size: ${userData?.householdSize ?? 1}
- Monthly Income: ₱${userData?.monthlyIncome ?? 0} (Philippine Peso)
- Has Landlord Notice to Quit / Eviction: ${userData?.hasNoticeToQuit ? "YES" : "NO"}
- Veteran Status: ${userData?.veteranStatus ? "YES" : "NO"}
- Disability Status: ${userData?.disabilityStatus ? "YES" : "NO"}

Evaluate eligibility for these specific templates strictly based on their Guidelines using Philippine Peso (₱) for all estimated assistance levels (amountText).
Determine appropriate Urgency (critical: immediate lock-out, eviction within 15 days, utilities cutoff; high: senior/disabled utility risk, low-income threat; moderate: low-income but stable; standard: informative query).
Determine Aggregate Confidence score (0 to 100) on how robustly the guidelines match the resident's data metrics.

You MUST respond strictly in valid JSON format matching this schema:
{
  "urgencyFlag": "critical" | "high" | "moderate" | "standard",
  "urgencyReason": "Brief human caseworker readable summary of why this priority level was set",
  "confidenceScore": number (integer 0-100),
  "eligiblePrograms": [
    {
      "id": "program_template_id", // MUST match one of: erap, liheap, rrhv, shsg, vssf
      "name": "Program Name",
      "category": "housing" | "utility" | "emergency" | "food" | "specialized",
      "description": "Program description summary",
      "amountText": "estimated assistance level",
      "confidence": number,
      "eligibilityLogic": "Detail-rich description of which client metrics triggered which guidelines. Be highly precise!"
    }
  ],
  "requiredDocuments": [
    {
      "id": "doc_id_code (e.g. proof_of_income)",
      "name": "Exact Document Title",
      "category": "income" | "identity" | "residency" | "hardship",
      "description": "Explanatory text of exactly what document standard or copy they must submit"
    }
  ]
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          systemInstruction: db.settings.systemPromptPreset
        }
      });

      const responseText = response.text || "{}";
      const resultObj = JSON.parse(responseText.trim());

      urgencyFlag = resultObj.urgencyFlag || "moderate";
      urgencyReason = resultObj.urgencyReason || "Triage set by AI core.";
      confidenceScore = resultObj.confidenceScore ?? 80;
      suggestedPrograms = resultObj.eligiblePrograms || [];
      suggestedDocuments = resultObj.requiredDocuments || [];

    } catch (err) {
      console.error("Gemini AI API Parsing error, executing logic fallback.", err);
      // Fallback rule evaluation engine when API key is unseeded or rate-limited
      urgencyFlag = "moderate";
      urgencyReason = "Offline Rule Engine used. evictions or very low incomes automatically flagged.";
      confidenceScore = 85;

      const inc = userData?.monthlyIncome ?? 20000;
      if (userData?.hasNoticeToQuit) {
        urgencyFlag = "critical";
        urgencyReason = "Immediate landlord eviction warning or Notice to Quit evaluated by system rule fallback.";
      } else if (userData?.monthlyIncome < 20000 && (userData?.age >= 60 || userData?.disabilityStatus)) {
        urgencyFlag = "high";
        urgencyReason = "Elderly or disabled resident with income under fixed security threshold (₱20,000/mo).";
      }

      // Check ERAP rule
      if (userData?.hasNoticeToQuit && inc < 50000) {
        suggestedPrograms.push({
          id: "erap",
          name: "Emergency Eviction Rental Assistance (ERAP)",
          category: "housing",
          description: "Urgent rental payment stabilization for low-income residents facing a high risk of eviction.",
          amountText: "Up to ₱120,000 (covers 3 months arrears)",
          confidence: 95,
          eligibilityLogic: `Offline match: User faces active Notice to Quit, household size of ${userData?.householdSize || 1}, and monthly income is below lower-bound bounds.`
        });
        suggestedDocuments.push({
          id: "doc-evict",
          name: "Landlord Notice to Quit / Court eviction papers",
          category: "hardship",
          description: "Full printed eviction copy clearly stating the balance owed and deadline date."
        });
      }

      // Check LIHEAP rule
      if (inc < 45000 && (userData?.disabilityStatus || userData?.age >= 60 || userData?.householdSize >= 2)) {
        suggestedPrograms.push({
          id: "liheap",
          name: "Low-Income Household Energy & Utility Relief (LIHEAP)",
          category: "utility",
          description: "Critical bill payment subsidies for power, warmth, cooling, or emergency furnace replacement.",
          amountText: "Direct credit up to ₱30,000",
          confidence: 90,
          eligibilityLogic: `Offline match: User income (₱${inc}/mo) is within target criteria and elderly/disability/household multipliers are present.`
        });
        suggestedDocuments.push({
          id: "doc-utility",
          name: "Recent electric, gas, or oil delivery invoices",
          category: "residency",
          description: "Billing statement from past 60 days showing service name and active address mismatch details."
        });
      }

      // Check VSSF
      if (userData?.veteranStatus && inc < 50000) {
        suggestedPrograms.push({
          id: "vssf",
          name: "Veterans Supportive Services Fund (VSSF)",
          category: "specialized",
          description: "Dedicated re-rental and veteran family stabilization support covering utilities, rent arrears, and security deposits.",
          amountText: "Up to ₱100,000 support voucher",
          confidence: 95,
          eligibilityLogic: "Offline match: Veteran status verified with income below standard threshold."
        });
        suggestedDocuments.push({
          id: "doc-dd214",
          name: "DD Form 214 military discharge certificate",
          category: "identity",
          description: "Honorable discharge standard required to activate veteran foundation access."
        });
      }

      // Default ID doc
      suggestedDocuments.push({
        id: "doc-gov-id",
        name: "Government Issued Photo ID Card",
        category: "identity",
        description: "Driver license, passport, or non-driver community identification card."
      });
      // Default Income doc
      suggestedDocuments.push({
        id: "doc-income-st",
        name: "Proof of Household Income",
        category: "income",
        description: "Paystubs from last 30 days, tax filings, or child support statements."
      });
    }
  } else {
    // Offline Engine executes immediately since Gemini API Key isn't configured yet
    const inc = userData?.monthlyIncome ?? 20000;
    if (userData?.hasNoticeToQuit) {
      urgencyFlag = "critical";
      urgencyReason = "Notice to Quit evictions are auto-prioritized (Caseworker Gateway Offline Engine).";
    } else if (inc < 20000 && (userData?.age >= 60 || userData?.disabilityStatus)) {
      urgencyFlag = "high";
      urgencyReason = "Co-pilot triage: High utility/housing asset stress detected in elderly/vulnerable demographic.";
    }

    if (userData?.hasNoticeToQuit && inc < 50000) {
      suggestedPrograms.push({
        id: "erap",
        name: "Emergency Eviction Rental Assistance (ERAP)",
        category: "housing",
        description: "Urgent rental payment stabilization for low-income residents facing a high risk of eviction.",
        amountText: "Up to ₱120,000 (covers 3 months arrears)",
        confidence: 90,
        eligibilityLogic: `Citizen income of ₱${inc}/mo falls cleanly below the ₱50,000 ceiling, and they are facing active eviction hardship.`
      });
      suggestedDocuments.push({
        id: "doc-evict",
        name: "Landlord Eviction Letters / Demands",
        category: "hardship",
        description: "A copy of the written warning with outstanding amounts clearly outlined."
      });
    }

    if (inc < 45000) {
      suggestedPrograms.push({
        id: "liheap",
        name: "Low-Income Household Energy & Utility Relief (LIHEAP)",
        category: "utility",
        description: "Critical bill payment subsidies for power, warmth, cooling, or emergency furnace replacement.",
        amountText: "Direct credit up to ₱30,000",
        confidence: 92,
        eligibilityLogic: `Citizen reports ₱${inc}/mo income with active heating/cooling system costs.`
      });
      suggestedDocuments.push({
        id: "doc-utility",
        name: "Utility statements from current grid provider",
        category: "residency",
        description: "Statements indicating current service delivery failure warnings."
      });
    }

    if (userData?.veteranStatus) {
      suggestedPrograms.push({
        id: "vssf",
        name: "Veterans Supportive Services Fund (VSSF)",
        category: "specialized",
        description: "Dedicated re-rental and veteran family stabilization support covering utilities, rent arrears, and security deposits.",
        amountText: "Up to ₱100,000 support voucher",
        confidence: 95,
        eligibilityLogic: "Case records verify veteran background status, coupled with transition wage deficits."
      });
      suggestedDocuments.push({
        id: "doc-dd214",
        name: "DD Form 214 Certificate or military military credentials",
        category: "identity",
        description: "Official documents confirming service registration credentials."
      });
    }

    // Default id / income
    suggestedDocuments.push({
      id: "doc-gov-id",
      name: "Government Photo Identification",
      category: "identity",
      description: "Any formal passport, state security identification, or license certificate."
    });
    suggestedDocuments.push({
      id: "doc-income-st",
      name: "Primary monthly income/benefits statements",
      category: "income",
      description: "Paycheck receipts, tax reports, or general retirement pension records."
    });
  }

  // Build the unified persistent Intake Record
  const newIntake: Intake = {
    id: `case-${Date.now().toString().slice(-6)}`,
    plainTextSituation,
    userData: {
      fullName: userData?.fullName || "A Citizen",
      householdSize: Number(userData?.householdSize ?? 1),
      monthlyIncome: Number(userData?.monthlyIncome ?? 0),
      age: Number(userData?.age ?? 30),
      disabilityStatus: !!userData?.disabilityStatus,
      veteranStatus: !!userData?.veteranStatus,
      hasNoticeToQuit: !!userData?.hasNoticeToQuit
    },
    urgencyFlag,
    urgencyReason,
    confidenceScore,
    createdAt: new Date().toISOString(),
    status: "pending",
    roadmap: {
      eligiblePrograms: suggestedPrograms.map((p, idx) => ({
        id: p.id || `prog-${idx}`,
        name: p.name,
        category: p.category || "housing",
        description: p.description,
        amountText: p.amountText,
        confidence: p.confidence || 85,
        eligibilityLogic: p.eligibilityLogic || "Standard eligibility verified",
        status: "pending"
      })),
      requiredDocuments: suggestedDocuments.map((d, idx) => ({
        id: d.id || `doc-${idx}`,
        name: d.name,
        description: d.description,
        category: d.category || "identity",
        status: "pending"
      }))
    }
  };

  db.intakes.unshift(newIntake);
  saveDBData(db);

  res.json({ success: true, intake: newIntake });
});

// Audit Review Route
app.post("/api/intakes/:id/review", (req, res) => {
  const { id } = req.params;
  const { caseworkerNotes, action, caseworkerName, programDecisions, documentDecisions, documentFeedback } = req.body;

  const db = getDBData();
  const index = db.intakes.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Intake record not found." });
  }

  const intake = db.intakes[index];

  intake.caseworkerNotes = caseworkerNotes || intake.caseworkerNotes;
  intake.reviewedAt = new Date().toISOString();
  intake.reviewedBy = caseworkerName || "Caseworker";

  if (action === "authorize") {
    intake.status = "authorized";
  } else if (action === "reject") {
    intake.status = "rejected";
  }

  // caseworker can manual update individual programs in the verified assessment
  if (programDecisions && typeof programDecisions === "object") {
    intake.roadmap.eligiblePrograms = intake.roadmap.eligiblePrograms.map(p => {
      if (programDecisions[p.id]) {
        return { ...p, status: programDecisions[p.id] };
      }
      return p;
    });
  }

  // Update document validation status tracking and save caseworker explanation reasoning comments
  if (documentDecisions && typeof documentDecisions === "object") {
    intake.roadmap.requiredDocuments = intake.roadmap.requiredDocuments.map(d => {
      const status = documentDecisions[d.id] || d.status;
      const feedback = (documentFeedback && documentFeedback[d.id] !== undefined)
        ? documentFeedback[d.id]
        : d.feedback;
      return { ...d, status, feedback };
    });
  }

  db.intakes[index] = intake;
  saveDBData(db);

  res.json({ success: true, intake });
});

// Single intake getter (to reload client-side details if needed)
app.get("/api/intakes/:id", (req, res) => {
  const db = getDBData();
  const intake = db.intakes.find(i => i.id === req.params.id);
  if (!intake) {
    return res.status(404).json({ error: "Intake record not found." });
  }
  res.json(intake);
});

// Start the Express custom server with Vite middleware integrated
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CivicClear Host] Server listening on http://localhost:${PORT}`);
  });
}

startServer();
