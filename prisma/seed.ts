import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const HIGH = { frequencyScore: 4, timeBurdenScore: 4, errorRiskScore: 3, automationReadinessScore: 4 }; // severity 3.75
const MED = { frequencyScore: 3, timeBurdenScore: 3, errorRiskScore: 3, automationReadinessScore: 3 }; // severity 3.0
const LOW = { frequencyScore: 2, timeBurdenScore: 2, errorRiskScore: 2, automationReadinessScore: 2 }; // severity 2.0

const PLAYBOOKS = [
  {
    capabilityTag: "BOOKKEEPING_CATEGORIZATION",
    title: "Automated Bookkeeping Categorization",
    commonTools: "QuickBooks Online + Intuit Assist (existing subscription)",
    steps: [
      "Audit current categorization rules and chart of accounts",
      "Enable and tune Intuit Assist AI categorization",
      "Set up exception-review queue for low-confidence transactions",
      "Train bookkeeper on reviewing flagged items instead of re-keying everything",
      "Measure hours/week before vs. after at 30-day check-in",
    ].join("\n"),
    estimatedHoursWithout: 10.5,
    estimatedHoursWith: 3.5,
  },
  {
    capabilityTag: "CLIENT_REPORTING",
    title: "Owner / Client Statement Automation",
    commonTools: "Buildium / TaxDome (existing subscription)",
    steps: [
      "Identify recurring report types and current manual assembly steps",
      "Configure automated statement templates in existing platform",
      "Set up scheduled delivery to clients/owners",
      "Spot-check first automated cycle against manual baseline",
    ].join("\n"),
    estimatedHoursWithout: 6,
    estimatedHoursWith: 2,
  },
  {
    capabilityTag: "INTAKE_AUTOMATION",
    title: "Structured Intake & Auto-Acknowledgment",
    commonTools: "Google Workspace + OpenTable / Clio Grow (existing subscription)",
    steps: [
      "Replace open contact form with structured intake form",
      "Wire form submissions into a tracked pipeline (not a shared inbox)",
      "Enable automated guest/client acknowledgment within minutes",
      "Add auto-generated draft proposal or intake summary",
      "Set timed follow-ups for non-responders",
    ].join("\n"),
    estimatedHoursWithout: 8,
    estimatedHoursWith: 3,
  },
  {
    capabilityTag: "CASE_MATTER_TRACKING",
    title: "Matter & Deadline Tracking",
    commonTools: "Clio Matter Plans (existing subscription)",
    steps: [
      "Map current manual deadline-tracking method (spreadsheet, calendar, memory)",
      "Configure Matter Plans templates for the firm's most common matter types",
      "Migrate active matters into tracked plans",
      "Set automated deadline reminders for staff",
    ].join("\n"),
    estimatedHoursWithout: 5,
    estimatedHoursWith: 1.5,
  },
  {
    capabilityTag: "DOCUMENT_AUTOMATION",
    title: "Document Drafting & Assembly",
    commonTools: "HotDocs / Clio document templates",
    steps: [
      "Identify highest-volume recurring document types",
      "Build reusable templates with conditional/variable fields",
      "Pilot on next 5 real matters before full rollout",
      "Track drafting time before vs. after",
    ].join("\n"),
    estimatedHoursWithout: 6,
    estimatedHoursWith: 2,
  },
  {
    capabilityTag: "LEASING_AGENT_AUTOMATION",
    title: "AI Leasing Agent",
    commonTools: "Buildium Lumina AI Leasing Agent (existing subscription)",
    steps: [
      "Enable Lumina AI Leasing Agent on active listings",
      "Configure showing-request auto-scheduling",
      "Route qualified leads to the right property manager automatically",
      "Compare leasing-agent hours before vs. after at 30-day check-in",
    ].join("\n"),
    estimatedHoursWithout: 8,
    estimatedHoursWith: 2.5,
  },
  {
    capabilityTag: "RESERVATION_NOSHOW_HANDLING",
    title: "No-Show & Deposit Control",
    commonTools: "OpenTable / Vagaro / Square Appointments (existing subscription)",
    steps: [
      "Enable automated reservation/appointment confirmations",
      "Turn on waitlist text notifications",
      "Configure deposit-required rules for repeat no-show risk",
      "Enable automated no-show win-back messaging",
    ].join("\n"),
    estimatedHoursWithout: 6,
    estimatedHoursWith: 2,
  },
  {
    capabilityTag: "SALES_RECONCILIATION",
    title: "Daily Sales Reconciliation",
    commonTools: "POS → QuickBooks sync (existing subscription)",
    steps: [
      "Enable direct POS-to-QuickBooks daily sync",
      "Configure automated end-of-day summary report",
      "Set exception alerts for mismatches instead of manual matching",
    ].join("\n"),
    estimatedHoursWithout: 5,
    estimatedHoursWith: 1.5,
  },
  {
    capabilityTag: "MISSED_CALL_HANDLING",
    title: "Missed-Call AI Text-Back",
    commonTools: "AgentZap / Twilio",
    steps: [
      "Connect business line to missed-call detection",
      "Configure automated text-back within 60 seconds",
      "Route replies into a tracked follow-up queue",
    ].join("\n"),
    estimatedHoursWithout: 4,
    estimatedHoursWith: 1,
  },
  {
    capabilityTag: "REBOOKING_FOLLOWUP",
    title: "Rebooking & Win-Back Reminders",
    commonTools: "SMS automation on existing scheduling platform",
    steps: [
      "Define the rebooking window per service type",
      "Configure automated reminder texts at the window threshold",
      "Track reminder-to-rebook conversion",
    ].join("\n"),
    estimatedHoursWithout: 3,
    estimatedHoursWith: 1,
  },
  {
    capabilityTag: "PROPOSAL_BID_ASSEMBLY",
    title: "Proposal / RFP Assembly from a Content Library",
    commonTools: "Microsoft 365 SharePoint + Copilot + Power Automate (existing subscription)",
    steps: [
      "Build a tagged content library of reusable cut-sheets, resumes, and fee tables",
      "Configure a Power Automate assembly flow to pull matching content by sector/RFP type",
      "Use Copilot to draft narrative sections from the brief",
      "Route through partner review before submission",
    ].join("\n"),
    estimatedHoursWithout: 7,
    estimatedHoursWith: 3,
  },
  {
    capabilityTag: "SHUTTLE_TRANSPORT_COORDINATION",
    title: "Shuttle & Pickup Dispatch Coordination",
    commonTools: "Microsoft Bookings + shared Lists run-sheet",
    steps: [
      "Replace the paper run-sheet with a shared digital Lists board",
      "Enable Bookings for guest pickup requests",
      "Add automatic conflict alerts for double-booked pickups",
      "Track on-time pickup rate before vs. after",
    ].join("\n"),
    estimatedHoursWithout: 4,
    estimatedHoursWith: 1.5,
  },
  {
    capabilityTag: "GROUP_EVENT_SALES_INQUIRY",
    title: "Group & Event Inquiry Automation",
    commonTools: "Shared mailbox + Power Automate + Microsoft Lists + Bookings",
    steps: [
      "Route the shared sales mailbox into a tracked lead list instead of an inbox",
      "Enable automated acknowledgment within 5 minutes of inquiry",
      "Configure Day 1 / 3 / 7 follow-up reminders for non-responders",
      "Enable self-service site-visit scheduling via Bookings",
    ].join("\n"),
    estimatedHoursWithout: 6,
    estimatedHoursWith: 2,
  },
  {
    capabilityTag: "REVIEW_REPUTATION_MANAGEMENT",
    title: "Online Review Monitoring & Response",
    commonTools: "Power Automate + Teams alerts + approved response-template library",
    steps: [
      "Connect Google/Tripadvisor review feeds into an automated aggregator",
      "Route new reviews into a Teams alert channel",
      "Build an approved response-template library by review type/sentiment",
      "Track response time before vs. after",
    ].join("\n"),
    estimatedHoursWithout: 3,
    estimatedHoursWith: 1,
  },
] as const;

async function main() {
  console.log("Seeding AAC Ops database...");

  await prisma.workflow.deleteMany();
  await prisma.assessmentNote.deleteMany();
  await prisma.robusClient.deleteMany();
  await prisma.playbook.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.create({
    data: { email: "admin@aianalyticsconsole.com", passwordHash, name: "Admin", role: "OWNER" },
  });

  for (const p of PLAYBOOKS) {
    await prisma.playbook.create({ data: { ...p, capabilityTag: p.capabilityTag as never } });
  }

  // CPA — synthetic demo clients
  const cpaClients = await Promise.all(
    ["Fernbrook CPA Group", "Larkspur CPAs", "Riverside Tax & Advisory", "Keystone Bookkeeping Partners", "Wharton Square CPA"].map(
      (name, i) =>
        prisma.robusClient.create({
          data: { name, vertical: "CPA", stage: i < 2 ? "RETAINER" : "ASSESSMENT" },
        })
    )
  );
  for (const [i, client] of cpaClients.entries()) {
    await prisma.workflow.create({
      data: { clientId: client.id, capabilityTag: "BOOKKEEPING_CATEGORIZATION", name: "Bookkeeping categorization / bank reconciliation", ...HIGH },
    });
    await prisma.workflow.create({
      data: {
        clientId: client.id,
        capabilityTag: "CLIENT_REPORTING",
        name: "Client reporting",
        ...(i < 3 ? HIGH : LOW),
      },
    });
  }

  // LAW — synthetic demo clients
  const lawClients = await Promise.all(
    ["Ashcombe Law", "Brennan & Voss Family Law Group", "Whitmore Estate Law", "Delaware Valley Family Law", "Brightline Legal Group"].map(
      (name, i) =>
        prisma.robusClient.create({ data: { name, vertical: "LAW", stage: i < 2 ? "SPRINT" : "ASSESSMENT" } })
    )
  );
  for (const [i, client] of lawClients.entries()) {
    await prisma.workflow.create({
      data: { clientId: client.id, capabilityTag: "INTAKE_AUTOMATION", name: "Client intake", ...HIGH },
    });
    await prisma.workflow.create({
      data: {
        clientId: client.id,
        capabilityTag: "CASE_MATTER_TRACKING",
        name: "Matter/deadline tracking",
        ...(i < 4 ? HIGH : LOW),
      },
    });
    await prisma.workflow.create({
      data: {
        clientId: client.id,
        capabilityTag: "DOCUMENT_AUTOMATION",
        name: "Document drafting",
        ...(i < 3 ? HIGH : LOW),
      },
    });
  }

  // REAL_ESTATE — synthetic demo clients
  const reClients = await Promise.all(
    ["Crestpoint Real Estate Management", "Overlook Property Group", "Harborview Rentals", "Cobblestone Management Co."].map(
      (name, i) => prisma.robusClient.create({ data: { name, vertical: "REAL_ESTATE", stage: i === 0 ? "SPRINT" : "ASSESSMENT" } })
    )
  );
  for (const [i, client] of reClients.entries()) {
    await prisma.workflow.create({
      data: { clientId: client.id, capabilityTag: "LEASING_AGENT_AUTOMATION", name: "AI leasing agent", ...HIGH },
    });
    await prisma.workflow.create({
      data: {
        clientId: client.id,
        capabilityTag: "CLIENT_REPORTING",
        name: "Owner statement automation",
        ...(i < 3 ? HIGH : LOW),
      },
    });
  }

  // RESTAURANT — synthetic demo clients
  const restaurantClients = await Promise.all(
    ["Saltmarsh Kitchen & Bar", "The Merchant's Table", "Corner Bistro", "Saffron Kitchen"].map((name, i) =>
      prisma.robusClient.create({ data: { name, vertical: "RESTAURANT", stage: i === 0 ? "SPRINT" : "ASSESSMENT" } })
    )
  );
  for (const [i, client] of restaurantClients.entries()) {
    await prisma.workflow.create({
      data: { clientId: client.id, capabilityTag: "RESERVATION_NOSHOW_HANDLING", name: "Reservation & no-show handling", ...HIGH },
    });
    await prisma.workflow.create({
      data: { clientId: client.id, capabilityTag: "SALES_RECONCILIATION", name: "Daily sales reconciliation", ...HIGH },
    });
    await prisma.workflow.create({
      data: {
        clientId: client.id,
        capabilityTag: "INTAKE_AUTOMATION",
        name: "Private-event intake",
        ...(i < 3 ? HIGH : LOW),
      },
    });
  }

  // NAIL_SALON — synthetic demo clients
  const nailClients = await Promise.all(
    ["Polished Studio", "Bloom Nail Bar", "Lush & Lacquer", "The Nail Loft"].map((name, i) =>
      prisma.robusClient.create({ data: { name, vertical: "NAIL_SALON", stage: i === 0 ? "SPRINT" : "ASSESSMENT" } })
    )
  );
  for (const [i, client] of nailClients.entries()) {
    await prisma.workflow.create({
      data: { clientId: client.id, capabilityTag: "RESERVATION_NOSHOW_HANDLING", name: "No-show & deposit control", ...HIGH },
    });
    await prisma.workflow.create({
      data: {
        clientId: client.id,
        capabilityTag: "MISSED_CALL_HANDLING",
        name: "Missed-call handling",
        ...(i < 3 ? HIGH : LOW),
      },
    });
    await prisma.workflow.create({
      data: {
        clientId: client.id,
        capabilityTag: "REBOOKING_FOLLOWUP",
        name: "Rebooking follow-up",
        ...(i < 2 ? HIGH : LOW),
      },
    });
  }

  // ARCHITECTURE — synthetic demo clients
  const architectureClients = await Promise.all(
    ["Calder McCray Architecture", "Renwick Architects", "Hendrick & Pace Architecture", "Meridian Design Group"].map(
      (name, i) => prisma.robusClient.create({ data: { name, vertical: "ARCHITECTURE", stage: i < 2 ? "SPRINT" : "ASSESSMENT" } })
    )
  );
  for (const [i, client] of architectureClients.entries()) {
    await prisma.workflow.create({
      data: { clientId: client.id, capabilityTag: "PROPOSAL_BID_ASSEMBLY", name: "RFP / proposal assembly from content library", ...HIGH },
    });
    await prisma.workflow.create({
      data: {
        clientId: client.id,
        capabilityTag: "CASE_MATTER_TRACKING",
        name: "Submittal / RFI & deadline tracking",
        ...(i < 3 ? HIGH : LOW),
      },
    });
    await prisma.workflow.create({
      data: {
        clientId: client.id,
        capabilityTag: "INTAKE_AUTOMATION",
        name: "New-project intake & setup",
        ...(i < 2 ? HIGH : LOW),
      },
    });
  }

  // HOSPITALITY — synthetic demo clients
  const hospitalityClients = await Promise.all(
    ["Bayfront Airport Suites", "Coastal Grand Suites", "Riverside Inn & Conference Center", "The Palmetto Boutique Hotel"].map(
      (name, i) => prisma.robusClient.create({ data: { name, vertical: "HOSPITALITY", stage: i === 0 ? "SPRINT" : "ASSESSMENT" } })
    )
  );
  for (const [i, client] of hospitalityClients.entries()) {
    await prisma.workflow.create({
      data: { clientId: client.id, capabilityTag: "GROUP_EVENT_SALES_INQUIRY", name: "Group & event inquiry automation", ...HIGH },
    });
    await prisma.workflow.create({
      data: {
        clientId: client.id,
        capabilityTag: "SHUTTLE_TRANSPORT_COORDINATION",
        name: "Airport & convention shuttle coordination",
        ...(i < 3 ? HIGH : LOW),
      },
    });
    await prisma.workflow.create({
      data: {
        clientId: client.id,
        capabilityTag: "REVIEW_REPUTATION_MANAGEMENT",
        name: "Online review monitoring & response",
        ...(i < 2 ? HIGH : LOW),
      },
    });
  }

  console.log("Seed complete.");
  console.log("Login: admin@aianalyticsconsole.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
