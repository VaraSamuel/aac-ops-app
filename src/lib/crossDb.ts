// Read-only bridges into AAC Workspace's and AAC Site's own databases, for
// the members-only monitoring dashboard. Each app keeps its own schema and
// its own Prisma client — this just runs narrow COUNT/aggregate queries
// over a raw connection, the same pattern aac-site already uses to read
// this app's data for its own dashboard.
import { Pool } from "pg";

let workspacePool: Pool | null = null;
let sitePool: Pool | null = null;

function getWorkspacePool(): Pool | null {
  if (!process.env.WORKSPACE_DATABASE_URL) return null;
  if (!workspacePool) workspacePool = new Pool({ connectionString: process.env.WORKSPACE_DATABASE_URL });
  return workspacePool;
}

function getSitePool(): Pool | null {
  if (!process.env.SITE_DATABASE_URL) return null;
  if (!sitePool) sitePool = new Pool({ connectionString: process.env.SITE_DATABASE_URL });
  return sitePool;
}

export type WorkspaceStats = {
  available: boolean;
  activeEngagements: number;
  archivedEngagements: number;
  interviews: number;
  workflowsNamed: number;
  workflowsBelowStandard: number;
  trackerStepsOpen: number;
  trackerStepsComplete: number;
};

export async function getWorkspaceStats(): Promise<WorkspaceStats> {
  const pool = getWorkspacePool();
  const empty: WorkspaceStats = {
    available: false,
    activeEngagements: 0,
    archivedEngagements: 0,
    interviews: 0,
    workflowsNamed: 0,
    workflowsBelowStandard: 0,
    trackerStepsOpen: 0,
    trackerStepsComplete: 0,
  };
  if (!pool) return empty;

  try {
    const [engagements, interviews, workflows, belowStandard, tracker] = await Promise.all([
      pool.query(`SELECT status, count(*)::int AS n FROM "Engagement" GROUP BY status`),
      pool.query(`SELECT count(*)::int AS n FROM "InterviewLogEntry"`),
      pool.query(`SELECT count(*)::int AS n FROM "Workflow"`),
      pool.query(`
        SELECT count(*)::int AS n FROM (
          SELECT i.id, count(w.id) AS wc
          FROM "InterviewLogEntry" i
          LEFT JOIN "Workflow" w ON w."interviewId" = i.id
          GROUP BY i.id
          HAVING count(w.id) < 5
        ) t
      `),
      pool.query(`SELECT status, count(*)::int AS n FROM "ProjectTrackerItem" GROUP BY status`),
    ]);

    const engByStatus: Record<string, number> = {};
    for (const row of engagements.rows) engByStatus[row.status] = row.n;
    const trackerByStatus: Record<string, number> = {};
    for (const row of tracker.rows) trackerByStatus[row.status] = row.n;

    return {
      available: true,
      activeEngagements: engByStatus.ACTIVE ?? 0,
      archivedEngagements: engByStatus.ARCHIVED ?? 0,
      interviews: interviews.rows[0]?.n ?? 0,
      workflowsNamed: workflows.rows[0]?.n ?? 0,
      workflowsBelowStandard: belowStandard.rows[0]?.n ?? 0,
      trackerStepsOpen: (trackerByStatus.NOT_STARTED ?? 0) + (trackerByStatus.IN_PROGRESS ?? 0) + (trackerByStatus.BLOCKED ?? 0),
      trackerStepsComplete: trackerByStatus.COMPLETE ?? 0,
    };
  } catch {
    return empty;
  }
}

export type SiteStats = {
  available: boolean;
  approvedAccounts: number;
  pendingAccounts: number;
};

export async function getSiteStats(): Promise<SiteStats> {
  const pool = getSitePool();
  const empty: SiteStats = { available: false, approvedAccounts: 0, pendingAccounts: 0 };
  if (!pool) return empty;

  try {
    const res = await pool.query(`SELECT status, count(*)::int AS n FROM "ClientAccount" GROUP BY status`);
    const byStatus: Record<string, number> = {};
    for (const row of res.rows) byStatus[row.status] = row.n;
    return {
      available: true,
      approvedAccounts: byStatus.APPROVED ?? 0,
      pendingAccounts: byStatus.PENDING ?? 0,
    };
  } catch {
    return empty;
  }
}
