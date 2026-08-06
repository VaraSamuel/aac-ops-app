"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/requireAuth";

const VERTICALS = ["CPA", "LAW", "REAL_ESTATE", "RESTAURANT", "NAIL_SALON", "ARCHITECTURE", "HOSPITALITY", "OTHER"] as const;
const LEAD_SOURCES = [
  "REFERRAL",
  "CHAMBER_OR_ASSOCIATION",
  "LINKEDIN",
  "EMAIL_INBOUND",
  "PRIOR_CLIENT",
  "WEBSITE",
  "OTHER",
] as const;
const PIPELINE_STATUSES = [
  "INBOUND",
  "QUALIFIED",
  "NURTURE",
  "NOT_QUALIFIED",
  "DISCOVERY_HELD",
  "PROPOSAL_SENT",
  "CONVERTED",
  "DEFERRED",
  "DECLINED",
] as const;
const OVERLAY_STATUSES = ["FULL_PACK", "LIGHTWEIGHT", "DRAFT"] as const;
const CHECKIN_TYPES = [
  "POST_ASSESSMENT_30_DAY",
  "POST_SPRINT_30_DAY",
  "TOOL_ADVISORY_60_DAY",
  "ANNUAL_POLICY_REVIEW",
  "QUARTERLY_REVIEW",
] as const;
const SCRIPT_VARIANTS = ["ASSESSMENT", "TOOL_ADVISORY", "POLICY"] as const;
const RECORDED_STATUSES = ["YES_CONSENT_LOGGED", "NO_DECLINED", "NO_REGIME_FLAG"] as const;
const BUDGET_SIGNALS = ["BUYS_OUTSIDE_SERVICES", "SOFTWARE_SPEND_ONLY", "NOT_OBTAINED"] as const;

// ── Lead intake ───────────────────────────────────────────────────────────
const createLeadSchema = z.object({
  name: z.string().trim().min(1),
  vertical: z.enum(VERTICALS),
  source: z.enum(LEAD_SOURCES),
  referredBy: z.string().optional(),
});

export async function createLead(formData: FormData) {
  await requireSession();
  const parsed = createLeadSchema.parse({
    name: formData.get("name"),
    vertical: formData.get("vertical"),
    source: formData.get("source"),
    referredBy: formData.get("referredBy") || undefined,
  });
  const client = await prisma.robusClient.create({
    data: {
      name: parsed.name,
      vertical: parsed.vertical,
      source: parsed.source,
      referredBy: parsed.referredBy || null,
      pipelineStatus: "INBOUND",
      statusChangedAt: new Date(),
    },
  });
  revalidatePath("/pipeline");
  redirect(`/pipeline/${client.id}`);
}

const updateLeadIdentitySchema = z.object({
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  referredBy: z.string().optional(),
});

export async function updateLeadIdentity(clientId: string, formData: FormData) {
  await requireSession();
  const parsed = updateLeadIdentitySchema.parse({
    contactName: formData.get("contactName") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    source: formData.get("source") || undefined,
    referredBy: formData.get("referredBy") || undefined,
  });
  await prisma.robusClient.update({
    where: { id: clientId },
    data: {
      contactName: parsed.contactName || null,
      contactEmail: parsed.contactEmail || null,
      contactPhone: parsed.contactPhone || null,
      source: parsed.source,
      referredBy: parsed.referredBy || null,
    },
  });
  revalidatePath(`/pipeline/${clientId}`);
}

export async function updatePipelineStatus(clientId: string, status: (typeof PIPELINE_STATUSES)[number]) {
  await requireSession();
  const parsedStatus = z.enum(PIPELINE_STATUSES).parse(status);
  await prisma.robusClient.update({
    where: { id: clientId },
    data: { pipelineStatus: parsedStatus, statusChangedAt: new Date() },
  });
  revalidatePath("/pipeline");
  revalidatePath(`/pipeline/${clientId}`);
}

const convertLeadSchema = z.object({
  engagementValue: z.string().optional(),
  retainerValue: z.string().optional(),
  sowSignedDate: z.string().optional(),
  engagementStartDate: z.string().optional(),
  sowLink: z.string().optional(),
  clientWorkspaceUrl: z.string().optional(),
});

// Marks a lead Converted — the moment it becomes a real, billable engagement.
export async function convertLead(clientId: string, formData: FormData) {
  await requireSession();
  const parsed = convertLeadSchema.parse(Object.fromEntries(formData.entries()));
  await prisma.robusClient.update({
    where: { id: clientId },
    data: {
      pipelineStatus: "CONVERTED",
      statusChangedAt: new Date(),
      engagementValue: parsed.engagementValue ? Number(parsed.engagementValue) : null,
      retainerValue: parsed.retainerValue ? Number(parsed.retainerValue) : null,
      sowSignedDate: parsed.sowSignedDate ? new Date(parsed.sowSignedDate) : null,
      engagementStartDate: parsed.engagementStartDate ? new Date(parsed.engagementStartDate) : null,
      sowLink: parsed.sowLink || null,
      clientWorkspaceUrl: parsed.clientWorkspaceUrl || null,
    },
  });
  revalidatePath("/pipeline");
  revalidatePath("/clients");
  revalidatePath(`/pipeline/${clientId}`);
}

// No cascade at the schema level for these relations (Workflow/AssessmentNote
// in particular are real delivery data, so cascading them from the schema
// felt like the wrong default) — delete children explicitly instead.
export async function deleteLead(clientId: string) {
  await requireSession();
  await prisma.$transaction([
    prisma.discoveryCall.deleteMany({ where: { clientId } }),
    prisma.leadQualification.deleteMany({ where: { clientId } }),
    prisma.checkIn.deleteMany({ where: { clientId } }),
    prisma.assessmentNote.deleteMany({ where: { clientId } }),
    prisma.workflow.deleteMany({ where: { clientId } }),
    prisma.robusClient.delete({ where: { id: clientId } }),
  ]);
  revalidatePath("/pipeline");
  revalidatePath("/clients");
}

// ── Lead Qualification ───────────────────────────────────────────────────
const qualificationSchema = z.object({
  prospectName: z.string().trim().min(1),
  source: z.enum(LEAD_SOURCES),
  runBy: z.string().trim().min(1),
  gateB1: z.string().optional(),
  gateC1: z.string().optional(),
  gateD1: z.string().optional(),
  gateE1: z.string().optional(),
  gateF4: z.string().optional(),
  scoreA: z.string().optional(),
  scoreB: z.string().optional(),
  scoreC: z.string().optional(),
  scoreD: z.string().optional(),
  scoreE: z.string().optional(),
  complianceFlags: z.string().optional(),
  verticalOverlayId: z.string().optional(),
  overrideApplied: z.string().optional(),
  followUpDate: z.string().optional(),
  declineReason: z.string().optional(),
  referredTo: z.string().optional(),
});

function parseQualificationForm(formData: FormData) {
  const parsed = qualificationSchema.parse(Object.fromEntries(formData.entries()));
  return {
    prospectName: parsed.prospectName,
    source: parsed.source,
    runBy: parsed.runBy,
    gateB1: parsed.gateB1 === "on",
    gateC1: parsed.gateC1 === "on",
    gateD1: parsed.gateD1 === "on",
    gateE1: parsed.gateE1 === "on",
    gateF4: parsed.gateF4 === "on",
    scoreA: Number(parsed.scoreA ?? 0),
    scoreB: Number(parsed.scoreB ?? 0),
    scoreC: Number(parsed.scoreC ?? 0),
    scoreD: Number(parsed.scoreD ?? 0),
    scoreE: Number(parsed.scoreE ?? 0),
    complianceFlags: parsed.complianceFlags || null,
    verticalOverlayId: parsed.verticalOverlayId || null,
    overrideApplied: parsed.overrideApplied === "on",
    followUpDate: parsed.followUpDate ? new Date(parsed.followUpDate) : null,
    declineReason: parsed.declineReason || null,
    referredTo: parsed.referredTo || null,
  };
}

export async function addQualification(clientId: string, formData: FormData) {
  await requireSession();
  const data = parseQualificationForm(formData);
  await prisma.leadQualification.create({ data: { clientId, ...data } });
  revalidatePath(`/pipeline/${clientId}`);
}

export async function updateQualification(qualificationId: string, clientId: string, formData: FormData) {
  await requireSession();
  const data = parseQualificationForm(formData);
  await prisma.leadQualification.update({ where: { id: qualificationId }, data });
  revalidatePath(`/pipeline/${clientId}`);
}

export async function updateChecklistComplete(qualificationId: string, clientId: string, complete: boolean) {
  await requireSession();
  await prisma.leadQualification.update({ where: { id: qualificationId }, data: { checklistComplete: complete } });
  revalidatePath(`/pipeline/${clientId}`);
}

export async function deleteQualification(qualificationId: string, clientId: string) {
  await requireSession();
  await prisma.leadQualification.delete({ where: { id: qualificationId } });
  revalidatePath(`/pipeline/${clientId}`);
}

// ── Discovery Calls ───────────────────────────────────────────────────────
const discoveryCallSchema = z.object({
  leadQualificationId: z.string().trim().min(1),
  prospectName: z.string().trim().min(1),
  scriptVariant: z.enum(SCRIPT_VARIANTS),
  callDate: z.string().optional(),
  runBy: z.string().trim().min(1),
  recorded: z.enum(RECORDED_STATUSES),
  consentCapturedOnRecording: z.string().optional(),
  namedWorkflows: z.string().optional(),
  workflowDetail: z.string().optional(),
  toolInventory: z.string().optional(),
  utilisationFinding: z.string().optional(),
  decisionPath: z.string().optional(),
  trigger: z.string().optional(),
  budgetSignal: z.enum(BUDGET_SIGNALS).optional(),
  budgetSignalDetail: z.string().optional(),
  regimeFlagNew: z.string().optional(),
  clientLanguage: z.string().optional(),
  declineReason: z.string().optional(),
  referredTo: z.string().optional(),
  followUpDate: z.string().optional(),
  proposalSent: z.string().optional(),
  openQuestions: z.string().optional(),
});

function parseDiscoveryCallForm(formData: FormData) {
  const parsed = discoveryCallSchema.parse(Object.fromEntries(formData.entries()));
  return {
    leadQualificationId: parsed.leadQualificationId,
    prospectName: parsed.prospectName,
    scriptVariant: parsed.scriptVariant,
    callDate: parsed.callDate ? new Date(parsed.callDate) : new Date(),
    runBy: parsed.runBy,
    recorded: parsed.recorded,
    consentCapturedOnRecording: parsed.consentCapturedOnRecording === "on",
    namedWorkflows: Number(parsed.namedWorkflows ?? 0),
    workflowDetail: parsed.workflowDetail || null,
    toolInventory: parsed.toolInventory || null,
    utilisationFinding: parsed.utilisationFinding || null,
    decisionPath: parsed.decisionPath || null,
    trigger: parsed.trigger || null,
    budgetSignal: parsed.budgetSignal ?? null,
    budgetSignalDetail: parsed.budgetSignalDetail || null,
    regimeFlagNew: parsed.regimeFlagNew || null,
    clientLanguage: parsed.clientLanguage || null,
    declineReason: parsed.declineReason || null,
    referredTo: parsed.referredTo || null,
    followUpDate: parsed.followUpDate ? new Date(parsed.followUpDate) : null,
    proposalSent: parsed.proposalSent ? new Date(parsed.proposalSent) : null,
    openQuestions: parsed.openQuestions || null,
  };
}

export async function addDiscoveryCall(clientId: string, formData: FormData) {
  await requireSession();
  const data = parseDiscoveryCallForm(formData);
  await prisma.discoveryCall.create({ data: { clientId, ...data } });
  revalidatePath(`/pipeline/${clientId}`);
}

export async function updateDiscoveryCall(callId: string, clientId: string, formData: FormData) {
  await requireSession();
  const data = parseDiscoveryCallForm(formData);
  await prisma.discoveryCall.update({ where: { id: callId }, data });
  revalidatePath(`/pipeline/${clientId}`);
}

export async function deleteDiscoveryCall(callId: string, clientId: string) {
  await requireSession();
  await prisma.discoveryCall.delete({ where: { id: callId } });
  revalidatePath(`/pipeline/${clientId}`);
}

// ── Check-ins ─────────────────────────────────────────────────────────────
const checkInSchema = z.object({
  checkInType: z.enum(CHECKIN_TYPES),
  outcomeNote: z.string().trim().min(1),
  sentimentScore: z.string().optional(),
});

export async function addCheckIn(clientId: string, formData: FormData) {
  await requireSession();
  const parsed = checkInSchema.parse({
    checkInType: formData.get("checkInType"),
    outcomeNote: formData.get("outcomeNote"),
    sentimentScore: formData.get("sentimentScore") || undefined,
  });
  await prisma.checkIn.create({
    data: {
      clientId,
      checkInType: parsed.checkInType,
      outcomeNote: parsed.outcomeNote,
      sentimentScore: parsed.sentimentScore ? Number(parsed.sentimentScore) : null,
    },
  });
  revalidatePath(`/pipeline/${clientId}`);
}

export async function deleteCheckIn(checkInId: string, clientId: string) {
  await requireSession();
  await prisma.checkIn.delete({ where: { id: checkInId } });
  revalidatePath(`/pipeline/${clientId}`);
}

// ── Vertical Overlays ─────────────────────────────────────────────────────
const overlaySchema = z.object({
  vertical: z.string().trim().min(1),
  status: z.enum(OVERLAY_STATUSES),
  slotASizeBand: z.string().optional(),
  slotBTypicalWorkflows: z.string().optional(),
  slotCToolLandscape: z.string().optional(),
  slotDBuyingStructure: z.string().optional(),
  slotERegulatoryContext: z.string().optional(),
  extraDisqualifiers: z.string().optional(),
  sourcePack: z.string().optional(),
});

function parseOverlayForm(formData: FormData) {
  const parsed = overlaySchema.parse(Object.fromEntries(formData.entries()));
  return {
    vertical: parsed.vertical,
    status: parsed.status,
    slotASizeBand: parsed.slotASizeBand || null,
    slotBTypicalWorkflows: parsed.slotBTypicalWorkflows || null,
    slotCToolLandscape: parsed.slotCToolLandscape || null,
    slotDBuyingStructure: parsed.slotDBuyingStructure || null,
    slotERegulatoryContext: parsed.slotERegulatoryContext || null,
    extraDisqualifiers: parsed.extraDisqualifiers || null,
    sourcePack: parsed.sourcePack || null,
    lastReviewed: new Date(),
  };
}

export async function addVerticalOverlay(formData: FormData) {
  await requireSession();
  const data = parseOverlayForm(formData);
  await prisma.verticalOverlay.create({ data });
  revalidatePath("/pipeline/overlays");
}

export async function updateVerticalOverlay(overlayId: string, formData: FormData) {
  await requireSession();
  const data = parseOverlayForm(formData);
  await prisma.verticalOverlay.update({ where: { id: overlayId }, data });
  revalidatePath("/pipeline/overlays");
}

export async function deleteVerticalOverlay(overlayId: string) {
  await requireSession();
  await prisma.verticalOverlay.delete({ where: { id: overlayId } });
  revalidatePath("/pipeline/overlays");
}
