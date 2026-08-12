import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/requireAuth";
import { QualificationReportDocument, type QualificationReportData } from "@/lib/qualificationReport";
import type { GateStatus, ItemScores } from "@/lib/pipeline";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; qualificationId: string }> }
) {
  await requireSession();
  const { id, qualificationId } = await params;

  const qualification = await prisma.leadQualification.findUnique({
    where: { id: qualificationId },
    include: { client: { select: { id: true, name: true } }, verticalOverlay: { select: { vertical: true } } },
  });
  if (!qualification || qualification.clientId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: QualificationReportData = {
    prospectName: qualification.prospectName,
    clientName: qualification.client.name,
    source: qualification.source,
    dateRun: qualification.dateRun,
    runBy: qualification.runBy,
    gates: {
      gateB1: qualification.gateB1 as GateStatus,
      gateC1: qualification.gateC1 as GateStatus,
      gateD1: qualification.gateD1 as GateStatus,
      gateE1: qualification.gateE1 as GateStatus,
      gateF4: qualification.gateF4 as GateStatus,
    },
    itemScores: (qualification.itemScores ?? {}) as ItemScores,
    itemNotes: (qualification.itemNotes ?? {}) as Record<string, string>,
    regimeFlag: qualification.regimeFlag,
    vendorRequirement: qualification.vendorRequirement,
    verticalOverlayId: qualification.verticalOverlayId,
    overlayName: qualification.verticalOverlay?.vertical ?? null,
    overrideApplied: qualification.overrideApplied,
    followUpDate: qualification.followUpDate,
    declineReason: qualification.declineReason,
    referredTo: qualification.referredTo,
  };

  const buffer = await renderToBuffer(QualificationReportDocument({ data }));
  const fileName = `Lead_Qualification_${qualification.prospectName.replace(/[^a-z0-9]+/gi, "_")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
