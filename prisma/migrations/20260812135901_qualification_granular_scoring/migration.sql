-- CreateEnum
CREATE TYPE "GateStatus" AS ENUM ('PASS', 'FAIL');

-- AlterTable: Lead Qualification moves from section subtotals + boolean
-- gates to per-item scores/notes (Json, keyed by ref) + tri-state gates
-- (Pass/Fail/unresolved), per Robus_LeadQualificationChecklist_v1_0's own
-- field-type notes. Existing rows: a true gate becomes PASS; an unchecked
-- one becomes unresolved (NULL) rather than a deliberate FAIL, since the
-- old boolean's default-false state never distinguished the two. Section
-- subtotals aren't recoverable at the individual-item level from history,
-- so existing rows start with empty itemScores/itemNotes and are
-- re-entered at the item level going forward.
ALTER TABLE "LeadQualification" ADD COLUMN     "itemNotes" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "itemScores" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "regimeFlag" TEXT,
ADD COLUMN     "vendorRequirement" TEXT;

UPDATE "LeadQualification" SET "regimeFlag" = "complianceFlags" WHERE "complianceFlags" IS NOT NULL;

ALTER TABLE "LeadQualification" DROP COLUMN "complianceFlags",
DROP COLUMN "scoreA",
DROP COLUMN "scoreB",
DROP COLUMN "scoreC",
DROP COLUMN "scoreD",
DROP COLUMN "scoreE";

ALTER TABLE "LeadQualification" ADD COLUMN "gateB1New" "GateStatus";
UPDATE "LeadQualification" SET "gateB1New" = CASE WHEN "gateB1" THEN 'PASS' ELSE NULL END::"GateStatus";
ALTER TABLE "LeadQualification" DROP COLUMN "gateB1";
ALTER TABLE "LeadQualification" RENAME COLUMN "gateB1New" TO "gateB1";

ALTER TABLE "LeadQualification" ADD COLUMN "gateC1New" "GateStatus";
UPDATE "LeadQualification" SET "gateC1New" = CASE WHEN "gateC1" THEN 'PASS' ELSE NULL END::"GateStatus";
ALTER TABLE "LeadQualification" DROP COLUMN "gateC1";
ALTER TABLE "LeadQualification" RENAME COLUMN "gateC1New" TO "gateC1";

ALTER TABLE "LeadQualification" ADD COLUMN "gateD1New" "GateStatus";
UPDATE "LeadQualification" SET "gateD1New" = CASE WHEN "gateD1" THEN 'PASS' ELSE NULL END::"GateStatus";
ALTER TABLE "LeadQualification" DROP COLUMN "gateD1";
ALTER TABLE "LeadQualification" RENAME COLUMN "gateD1New" TO "gateD1";

ALTER TABLE "LeadQualification" ADD COLUMN "gateE1New" "GateStatus";
UPDATE "LeadQualification" SET "gateE1New" = CASE WHEN "gateE1" THEN 'PASS' ELSE NULL END::"GateStatus";
ALTER TABLE "LeadQualification" DROP COLUMN "gateE1";
ALTER TABLE "LeadQualification" RENAME COLUMN "gateE1New" TO "gateE1";

ALTER TABLE "LeadQualification" ADD COLUMN "gateF4New" "GateStatus";
UPDATE "LeadQualification" SET "gateF4New" = CASE WHEN "gateF4" THEN 'PASS' ELSE NULL END::"GateStatus";
ALTER TABLE "LeadQualification" DROP COLUMN "gateF4";
ALTER TABLE "LeadQualification" RENAME COLUMN "gateF4New" TO "gateF4";
