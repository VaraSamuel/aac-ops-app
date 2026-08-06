-- CreateEnum
CREATE TYPE "ServiceLine" AS ENUM ('AI_READINESS_ASSESSMENT', 'AUTOMATION_SPRINT', 'TOOL_SELECTION_ADVISORY', 'AI_POLICY_GOVERNANCE_KIT', 'QUARTERLY_REVIEW');

-- CreateEnum
CREATE TYPE "DeliveryStage" AS ENUM ('KICKOFF', 'DELIVERY', 'HANDOFF', 'FOLLOW_ON', 'CLOSED');

-- AlterTable: source becomes required per the CRM spec — backfill any
-- existing NULL rows (pre-dates this field) to OTHER before the constraint.
ALTER TABLE "RobusClient" ADD COLUMN     "buildLead" TEXT,
ADD COLUMN     "deliveryStage" "DeliveryStage",
ADD COLUMN     "relationshipLead" TEXT,
ADD COLUMN     "serviceLine" "ServiceLine";

UPDATE "RobusClient" SET "source" = 'OTHER' WHERE "source" IS NULL;

ALTER TABLE "RobusClient" ALTER COLUMN "source" SET NOT NULL,
ALTER COLUMN "source" SET DEFAULT 'OTHER';

-- AlterTable: Status must be chosen explicitly (no silent Draft default);
-- lastReviewed is date-only per spec, existing timestamps truncate cleanly.
ALTER TABLE "VerticalOverlay" ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "lastReviewed" SET DATA TYPE DATE;
