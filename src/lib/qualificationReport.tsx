import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
  SECTION_A,
  SECTION_B,
  SECTION_C,
  SECTION_D,
  SECTION_E,
  F4_GATE,
  SECTION_META,
  type ChecklistItem,
} from "@/lib/qualificationChecklist";
import {
  qualificationTotal,
  workflowFloor,
  qualificationOutcome,
  sectionScore,
  verticalDepth,
  QUALIFICATION_OUTCOME_LABELS,
  type GateStatus,
  type ItemScores,
} from "@/lib/pipeline";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#262626" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#737373", marginBottom: 12 },
  outcomeBar: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8, backgroundColor: "#f5f5f5", borderRadius: 4, marginBottom: 16 },
  badge: { fontSize: 10, fontWeight: 700, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 2 },
  sectionDesc: { fontSize: 9, color: "#737373", marginBottom: 6 },
  table: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 4, overflow: "hidden" },
  headerRow: { flexDirection: "row", backgroundColor: "#fafafa", borderBottomWidth: 1, borderBottomColor: "#e5e5e5" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f0f0f0", paddingVertical: 5 },
  headerCell: { fontSize: 8, fontWeight: 700, color: "#737373", textTransform: "uppercase", paddingHorizontal: 6, paddingVertical: 5 },
  refCell: { width: 42, fontWeight: 700, paddingHorizontal: 6 },
  findingCell: { flex: 1, paddingHorizontal: 6, color: "#404040" },
  scoreCell: { width: 40, textAlign: "right", fontWeight: 700, paddingHorizontal: 6 },
  totalsRow: { flexDirection: "row", backgroundColor: "#fafafa", paddingVertical: 6 },
  overlayBox: { marginTop: 6, padding: 8, backgroundColor: "#eff6ff", borderRadius: 4 },
  overlayLabel: { fontSize: 8, fontWeight: 700, color: "#1e3a8a" },
  overlayText: { fontSize: 8.5, color: "#1e40af", marginTop: 2 },
  outcomeBox: { marginTop: 16, padding: 10, borderRadius: 4 },
  outcomeTitle: { fontSize: 10, fontWeight: 700 },
  outcomeText: { fontSize: 9, marginTop: 3, lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 7.5, color: "#a3a3a3", textAlign: "center" },
});

const OUTCOME_COLOR: Record<string, { bg: string; fg: string }> = {
  QUALIFIED: { bg: "#ecfdf5", fg: "#047857" },
  CONDITIONALLY_QUALIFIED: { bg: "#eff6ff", fg: "#1d4ed8" },
  NURTURE: { bg: "#fffbeb", fg: "#b45309" },
  NOT_QUALIFIED: { bg: "#fef2f2", fg: "#b91c1c" },
};

export type QualificationReportData = {
  prospectName: string;
  clientName: string;
  source: string;
  dateRun: Date;
  runBy: string;
  gates: Record<string, GateStatus>;
  itemScores: ItemScores;
  itemNotes: Record<string, string>;
  regimeFlag: string | null;
  vendorRequirement: string | null;
  verticalOverlayId: string | null;
  overlayName: string | null;
  overrideApplied: boolean;
  followUpDate: Date | null;
  declineReason: string | null;
  referredTo: string | null;
};

function findingFor(item: ChecklistItem, data: QualificationReportData): string {
  if (item.type === "FLAG") {
    const text = item.ref === "E2" ? data.regimeFlag : data.vendorRequirement;
    return text?.trim() || "Not recorded.";
  }
  return data.itemNotes[item.ref]?.trim() || "No notes recorded.";
}

function scoreFor(item: ChecklistItem, data: QualificationReportData, gateKey?: string): string {
  if (item.type === "GATE") {
    const v = gateKey ? data.gates[gateKey] : null;
    return v === "PASS" ? "PASS" : v === "FAIL" ? "FAIL" : "—";
  }
  if (item.type === "FLAG") return "—";
  const v = data.itemScores[item.ref];
  return v === undefined ? "—" : String(v);
}

function SectionTable({
  letter,
  items,
  max,
  data,
}: {
  letter: "A" | "B" | "C" | "D" | "E";
  items: ChecklistItem[];
  max: number;
  data: QualificationReportData;
}) {
  const meta = SECTION_META[letter];
  const gateKey = `gate${letter}1`;
  const score = sectionScore(data.itemScores, letter);

  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>
        {letter} · {meta.title} — {score}/{max}
      </Text>
      <Text style={styles.sectionDesc}>{meta.description}</Text>
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, { width: 42 }]}>Ref</Text>
          <Text style={[styles.headerCell, { flex: 1 }]}>What was found</Text>
          <Text style={[styles.headerCell, { width: 40, textAlign: "right" }]}>Score</Text>
        </View>
        {items.map((item) => (
          <View style={styles.row} key={item.ref}>
            <Text style={styles.refCell}>{item.ref}</Text>
            <Text style={styles.findingCell}>{findingFor(item, data)}</Text>
            <Text style={styles.scoreCell}>{scoreFor(item, data, item.type === "GATE" ? gateKey : undefined)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.overlayBox}>
        <Text style={styles.overlayLabel}>{meta.overlaySlot}</Text>
        <Text style={styles.overlayText}>{meta.overlayNote}</Text>
      </View>
    </View>
  );
}

export function QualificationReportDocument({ data }: { data: QualificationReportData }) {
  const total = qualificationTotal(data.itemScores);
  const floor = workflowFloor(data.itemScores);
  const outcome = qualificationOutcome(
    { gateB1: data.gates.gateB1, gateC1: data.gates.gateC1, gateD1: data.gates.gateD1, gateE1: data.gates.gateE1, gateF4: data.gates.gateF4 },
    data.itemScores,
    data.overrideApplied
  );
  const depth = verticalDepth(!!data.verticalOverlayId);
  const colors = OUTCOME_COLOR[outcome];

  return (
    <Document title={`${data.prospectName} — Lead Qualification Checklist`}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{data.prospectName}</Text>
        <Text style={styles.subtitle}>
          Lead Qualification Checklist · {data.clientName} · Run by {data.runBy} · {data.dateRun.toLocaleDateString("en-US", { timeZone: "UTC" })} · Source: {data.source.replace(/_/g, " ")}
        </Text>

        <View style={styles.outcomeBar}>
          <Text style={[styles.badge, { backgroundColor: colors.bg, color: colors.fg }]}>
            {QUALIFICATION_OUTCOME_LABELS[outcome]}
          </Text>
          <Text>Total {total}/30</Text>
          <Text>Workflow floor {floor}/14 (needs 8)</Text>
          <Text>{depth}</Text>
          {data.overrideApplied && <Text>Buying-readiness override applied</Text>}
        </View>

        <SectionTable letter="A" items={SECTION_A} max={8} data={data} />
        <SectionTable letter="B" items={SECTION_B} max={8} data={data} />
        <SectionTable letter="C" items={SECTION_C} max={6} data={data} />
        <SectionTable letter="D" items={SECTION_D} max={6} data={data} />
        <SectionTable letter="E" items={SECTION_E} max={2} data={data} />

        <View wrap={false}>
          <Text style={styles.sectionTitle}>F4 · {F4_GATE.question}</Text>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.refCell}>F4</Text>
              <Text style={styles.findingCell}>{findingFor(F4_GATE, data)}</Text>
              <Text style={styles.scoreCell}>{scoreFor(F4_GATE, data, "gateF4")}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.outcomeBox, { backgroundColor: colors.bg }]} wrap={false}>
          <Text style={[styles.outcomeTitle, { color: colors.fg }]}>
            OUTCOME — {QUALIFICATION_OUTCOME_LABELS[outcome]}
          </Text>
          <Text style={[styles.outcomeText, { color: colors.fg }]}>
            Total {total} of 30. Workflow floor (Section B + C) {floor} of 14 — {floor >= 8 ? "cleared" : "not cleared"}.{" "}
            {data.overrideApplied && "Buying-readiness override applied — forces Nurture regardless of total. "}
            {depth === "MISSING - universal criteria only"
              ? "No vertical overlay was applied — A2 and C2 were scored conservatively and this qualification runs on universal criteria only."
              : "A vertical overlay was applied for this qualification."}
          </Text>
          {outcome === "NURTURE" && data.followUpDate && (
            <Text style={[styles.outcomeText, { color: colors.fg }]}>
              Follow-up date: {data.followUpDate.toLocaleDateString("en-US", { timeZone: "UTC" })}
            </Text>
          )}
          {outcome === "NOT_QUALIFIED" && (
            <Text style={[styles.outcomeText, { color: colors.fg }]}>
              Decline reason: {data.declineReason || "not recorded"}
              {data.referredTo ? ` · Referred to ${data.referredTo}` : ""}
            </Text>
          )}
        </View>

        <Text style={styles.footer}>
          Robus Works AI LLC · Lead Qualification Checklist · Generated {new Date().toLocaleDateString("en-US", { timeZone: "UTC" })} · Internal — Confidential
        </Text>
      </Page>
    </Document>
  );
}
