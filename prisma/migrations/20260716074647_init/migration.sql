-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'PARTNER');

-- CreateEnum
CREATE TYPE "Vertical" AS ENUM ('CPA', 'LAW', 'REAL_ESTATE', 'RESTAURANT', 'NAIL_SALON', 'ARCHITECTURE', 'HOSPITALITY', 'OTHER');

-- CreateEnum
CREATE TYPE "EngagementStage" AS ENUM ('ASSESSMENT', 'SPRINT', 'RETAINER', 'COMPLETE');

-- CreateEnum
CREATE TYPE "CapabilityTag" AS ENUM ('INTAKE_AUTOMATION', 'RESERVATION_NOSHOW_HANDLING', 'SALES_RECONCILIATION', 'MISSED_CALL_HANDLING', 'REBOOKING_FOLLOWUP', 'DOCUMENT_AUTOMATION', 'CASE_MATTER_TRACKING', 'CLIENT_REPORTING', 'LEASING_AGENT_AUTOMATION', 'BOOKKEEPING_CATEGORIZATION', 'PROPOSAL_BID_ASSEMBLY', 'SHUTTLE_TRANSPORT_COORDINATION', 'GROUP_EVENT_SALES_INQUIRY', 'REVIEW_REPUTATION_MANAGEMENT');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('IDENTIFIED', 'IN_SPRINT', 'SHIPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARTNER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RobusClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vertical" "Vertical" NOT NULL,
    "stage" "EngagementStage" NOT NULL DEFAULT 'ASSESSMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RobusClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentNote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "capabilityTag" "CapabilityTag" NOT NULL,
    "name" TEXT NOT NULL,
    "frequencyScore" INTEGER NOT NULL,
    "timeBurdenScore" INTEGER NOT NULL,
    "errorRiskScore" INTEGER NOT NULL,
    "automationReadinessScore" INTEGER NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "sourceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL,
    "capabilityTag" "CapabilityTag" NOT NULL,
    "title" TEXT NOT NULL,
    "commonTools" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "estimatedHoursWithout" DOUBLE PRECISION NOT NULL,
    "estimatedHoursWith" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Workflow_capabilityTag_idx" ON "Workflow"("capabilityTag");

-- CreateIndex
CREATE INDEX "Workflow_clientId_idx" ON "Workflow"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Playbook_capabilityTag_key" ON "Playbook"("capabilityTag");

-- AddForeignKey
ALTER TABLE "AssessmentNote" ADD CONSTRAINT "AssessmentNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "RobusClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "RobusClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
