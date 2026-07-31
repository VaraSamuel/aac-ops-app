-- AI Opportunity Scoring Matrix v1.0 — additive migration for Workflow.
-- Workflow never had a stored priority tier, so no drops are needed here
-- (contrast with robus-workspace-app's ScoringMatrixEntry migration).

-- CreateEnum
CREATE TYPE "CompliantToolStatus" AS ENUM ('YES', 'NO', 'UNANSWERED');

-- CreateEnum
CREATE TYPE "RevenueBasis" AS ENUM ('MEASURED', 'ESTIMATED', 'UNMEASURED');

-- AlterTable
ALTER TABLE "Workflow"
  ADD COLUMN "confirmedCompliantTool" "CompliantToolStatus" NOT NULL DEFAULT 'UNANSWERED',
  ADD COLUMN "creativeAdjacent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "creativeAdjacentNote" TEXT,
  ADD COLUMN "timeCostHoursPerMonth" DOUBLE PRECISION,
  ADD COLUMN "revenueOpportunity" DOUBLE PRECISION,
  ADD COLUMN "revenueBasis" "RevenueBasis",
  ADD COLUMN "rationale" TEXT;
