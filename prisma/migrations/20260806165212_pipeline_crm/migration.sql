
-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('CLIENT', 'OPPORTUNITY');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('REFERRAL', 'CHAMBER_OR_ASSOCIATION', 'LINKEDIN', 'EMAIL_INBOUND', 'PRIOR_CLIENT', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('INBOUND', 'QUALIFIED', 'NURTURE', 'NOT_QUALIFIED', 'DISCOVERY_HELD', 'PROPOSAL_SENT', 'CONVERTED', 'DEFERRED', 'DECLINED');

-- CreateEnum
CREATE TYPE "OverlayStatus" AS ENUM ('FULL_PACK', 'LIGHTWEIGHT', 'DRAFT');

-- CreateEnum
CREATE TYPE "CheckInType" AS ENUM ('POST_ASSESSMENT_30_DAY', 'POST_SPRINT_30_DAY', 'TOOL_ADVISORY_60_DAY', 'ANNUAL_POLICY_REVIEW', 'QUARTERLY_REVIEW');

-- CreateEnum
CREATE TYPE "ScriptVariant" AS ENUM ('ASSESSMENT', 'TOOL_ADVISORY', 'POLICY');

-- CreateEnum
CREATE TYPE "RecordedStatus" AS ENUM ('YES_CONSENT_LOGGED', 'NO_DECLINED', 'NO_REGIME_FLAG');

-- CreateEnum
CREATE TYPE "BudgetSignal" AS ENUM ('BUYS_OUTSIDE_SERVICES', 'SOFTWARE_SPEND_ONLY', 'NOT_OBTAINED');

-- AlterTable
ALTER TABLE "RobusClient" ADD COLUMN     "clientWorkspaceUrl" TEXT,
ADD COLUMN     "closeReason" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "engagementStartDate" TIMESTAMP(3),
ADD COLUMN     "engagementValue" DOUBLE PRECISION,
ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "parentClientId" TEXT,
ADD COLUMN     "pipelineStatus" "PipelineStatus" NOT NULL DEFAULT 'INBOUND',
ADD COLUMN     "recordType" "RecordType" NOT NULL DEFAULT 'CLIENT',
ADD COLUMN     "referredBy" TEXT,
ADD COLUMN     "retainerValue" DOUBLE PRECISION,
ADD COLUMN     "source" "LeadSource",
ADD COLUMN     "sowLink" TEXT,
ADD COLUMN     "sowSignedDate" TIMESTAMP(3),
ADD COLUMN     "statusChangedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "checkInType" "CheckInType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcomeNote" TEXT NOT NULL,
    "sentimentScore" INTEGER,
    "opportunityRaisedId" TEXT,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerticalOverlay" (
    "id" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "status" "OverlayStatus" NOT NULL DEFAULT 'DRAFT',
    "slotASizeBand" TEXT,
    "slotBTypicalWorkflows" TEXT,
    "slotCToolLandscape" TEXT,
    "slotDBuyingStructure" TEXT,
    "slotERegulatoryContext" TEXT,
    "extraDisqualifiers" TEXT,
    "sourcePack" TEXT,
    "lastReviewed" TIMESTAMP(3),

    CONSTRAINT "VerticalOverlay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadQualification" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "prospectName" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL,
    "dateRun" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runBy" TEXT NOT NULL,
    "gateB1" BOOLEAN NOT NULL DEFAULT false,
    "gateC1" BOOLEAN NOT NULL DEFAULT false,
    "gateD1" BOOLEAN NOT NULL DEFAULT false,
    "gateE1" BOOLEAN NOT NULL DEFAULT false,
    "gateF4" BOOLEAN NOT NULL DEFAULT false,
    "scoreA" INTEGER NOT NULL DEFAULT 0,
    "scoreB" INTEGER NOT NULL DEFAULT 0,
    "scoreC" INTEGER NOT NULL DEFAULT 0,
    "scoreD" INTEGER NOT NULL DEFAULT 0,
    "scoreE" INTEGER NOT NULL DEFAULT 0,
    "complianceFlags" TEXT,
    "verticalOverlayId" TEXT,
    "overrideApplied" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "declineReason" TEXT,
    "referredTo" TEXT,
    "discoveryBooked" TIMESTAMP(3),
    "checklistComplete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LeadQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveryCall" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "leadQualificationId" TEXT NOT NULL,
    "prospectName" TEXT NOT NULL,
    "scriptVariant" "ScriptVariant" NOT NULL DEFAULT 'ASSESSMENT',
    "callDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runBy" TEXT NOT NULL,
    "recorded" "RecordedStatus" NOT NULL DEFAULT 'NO_DECLINED',
    "consentCapturedOnRecording" BOOLEAN NOT NULL DEFAULT false,
    "namedWorkflows" INTEGER NOT NULL DEFAULT 0,
    "workflowDetail" TEXT,
    "toolInventory" TEXT,
    "utilisationFinding" TEXT,
    "decisionPath" TEXT,
    "trigger" TEXT,
    "budgetSignal" "BudgetSignal",
    "budgetSignalDetail" TEXT,
    "regimeFlagNew" TEXT,
    "clientLanguage" TEXT,
    "declineReason" TEXT,
    "referredTo" TEXT,
    "followUpDate" TIMESTAMP(3),
    "proposalSent" TIMESTAMP(3),
    "openQuestions" TEXT,

    CONSTRAINT "DiscoveryCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_opportunityRaisedId_key" ON "CheckIn"("opportunityRaisedId");

-- CreateIndex
CREATE INDEX "CheckIn_clientId_idx" ON "CheckIn"("clientId");

-- CreateIndex
CREATE INDEX "LeadQualification_clientId_idx" ON "LeadQualification"("clientId");

-- CreateIndex
CREATE INDEX "DiscoveryCall_clientId_idx" ON "DiscoveryCall"("clientId");

-- CreateIndex
CREATE INDEX "DiscoveryCall_leadQualificationId_idx" ON "DiscoveryCall"("leadQualificationId");

-- CreateIndex
CREATE INDEX "RobusClient_pipelineStatus_idx" ON "RobusClient"("pipelineStatus");

-- AddForeignKey
ALTER TABLE "RobusClient" ADD CONSTRAINT "RobusClient_parentClientId_fkey" FOREIGN KEY ("parentClientId") REFERENCES "RobusClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "RobusClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_opportunityRaisedId_fkey" FOREIGN KEY ("opportunityRaisedId") REFERENCES "RobusClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadQualification" ADD CONSTRAINT "LeadQualification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "RobusClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadQualification" ADD CONSTRAINT "LeadQualification_verticalOverlayId_fkey" FOREIGN KEY ("verticalOverlayId") REFERENCES "VerticalOverlay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryCall" ADD CONSTRAINT "DiscoveryCall_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "RobusClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryCall" ADD CONSTRAINT "DiscoveryCall_leadQualificationId_fkey" FOREIGN KEY ("leadQualificationId") REFERENCES "LeadQualification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

