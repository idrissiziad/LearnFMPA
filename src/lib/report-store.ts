import { createClient } from 'redis';

let redis: ReturnType<typeof createClient> | null = null;

async function getRedis() {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL || process.env.KV_REST_API_URL,
    });
    await redis.connect();
  }
  return redis;
}

export interface Comment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface Report {
  id: string;
  module_id: number;
  question_id: string;
  question_year: string;
  user_id: string;
  user_email: string;
  user_name: string;
  reason: string;
  suggested_correct: number[];
  suggested_incorrect: number[];
  original_correct: number[];
  original_options: string[];
  question_text: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
  votes: { [user_id: string]: 1 | -1 };
  comments: Comment[];
}

export interface ModuleReports {
  [questionId: string]: Report[];
}

function migrateReport(r: Report & { votes?: { [user_id: string]: 1 | -1 }; comments?: Comment[]; question_year?: string }): Report {
  return {
    ...r,
    question_year: r.question_year || '',
    votes: r.votes || {},
    comments: r.comments || [],
  };
}

async function loadModuleReports(moduleId: number): Promise<ModuleReports> {
  try {
    const client = await getRedis();
    const data = await client.get(`reports:module_${moduleId}`);
    if (!data) return {};
    const parsed = JSON.parse(data) as ModuleReports;
    for (const qId of Object.keys(parsed)) {
      parsed[qId] = parsed[qId].map(migrateReport);
    }
    return parsed;
  } catch (error) {
    console.error('Redis load reports error:', error);
    return {};
  }
}

async function saveModuleReports(moduleId: number, reports: ModuleReports): Promise<void> {
  try {
    const client = await getRedis();
    await client.set(`reports:module_${moduleId}`, JSON.stringify(reports));
  } catch (error) {
    console.error('Redis save reports error:', error);
  }
}

export async function createReport(report: Omit<Report, 'id' | 'status' | 'resolved_at' | 'resolved_by' | 'resolution_note' | 'votes' | 'comments'>): Promise<Report> {
  const newReport: Report = {
    ...report,
    id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    status: 'pending',
    resolved_at: null,
    resolved_by: null,
    resolution_note: null,
    votes: {},
    comments: [],
  };

  const moduleReports = await loadModuleReports(report.module_id);
  if (!moduleReports[report.question_id]) {
    moduleReports[report.question_id] = [];
  }
  moduleReports[report.question_id].push(newReport);
  await saveModuleReports(report.module_id, moduleReports);

  return newReport;
}

export async function getReportsByModule(moduleId: number): Promise<ModuleReports> {
  return loadModuleReports(moduleId);
}

export async function getReportById(moduleId: number, questionId: string, reportId: string): Promise<Report | null> {
  const moduleReports = await loadModuleReports(moduleId);
  const reports = moduleReports[questionId];
  if (!reports) return null;
  return reports.find(r => r.id === reportId) || null;
}

export async function updateReportStatus(
  moduleId: number,
  questionId: string,
  reportId: string,
  status: 'resolved' | 'dismissed',
  resolvedBy: string,
  resolutionNote?: string
): Promise<Report | null> {
  const moduleReports = await loadModuleReports(moduleId);
  const reports = moduleReports[questionId];
  if (!reports) return null;

  const report = reports.find(r => r.id === reportId);
  if (!report) return null;

  report.status = status;
  report.resolved_at = new Date().toISOString();
  report.resolved_by = resolvedBy;
  report.resolution_note = resolutionNote || null;

  await saveModuleReports(moduleId, moduleReports);
  return report;
}

export async function deleteReport(moduleId: number, questionId: string, reportId: string): Promise<boolean> {
  const moduleReports = await loadModuleReports(moduleId);
  const reports = moduleReports[questionId];
  if (!reports) return false;

  const index = reports.findIndex(r => r.id === reportId);
  if (index === -1) return false;

  reports.splice(index, 1);
  if (reports.length === 0) {
    delete moduleReports[questionId];
  }

  await saveModuleReports(moduleId, moduleReports);
  return true;
}

export async function deleteAllReportsForModule(moduleId: number): Promise<boolean> {
  try {
    const client = await getRedis();
    await client.del(`reports:module_${moduleId}`);
    return true;
  } catch (error) {
    console.error('Redis delete reports error:', error);
    return false;
  }
}

export async function voteReport(
  moduleId: number,
  questionId: string,
  reportId: string,
  userId: string,
  value: 1 | -1 | 0
): Promise<Report | null> {
  const moduleReports = await loadModuleReports(moduleId);
  const reports = moduleReports[questionId];
  if (!reports) return null;

  const report = reports.find(r => r.id === reportId);
  if (!report) return null;

  if (value === 0) {
    delete report.votes[userId];
  } else {
    report.votes[userId] = value;
  }

  await saveModuleReports(moduleId, moduleReports);
  return report;
}

export async function addComment(
  moduleId: number,
  questionId: string,
  reportId: string,
  userId: string,
  text: string
): Promise<Report | null> {
  const moduleReports = await loadModuleReports(moduleId);
  const reports = moduleReports[questionId];
  if (!reports) return null;

  const report = reports.find(r => r.id === reportId);
  if (!report) return null;

  report.comments.push({
    id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    user_id: userId,
    text,
    created_at: new Date().toISOString(),
  });

  await saveModuleReports(moduleId, moduleReports);
  return report;
}

export async function getAllReports(): Promise<{ moduleId: number; reports: ModuleReports }[]> {
  const moduleIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const results = await Promise.all(
    moduleIds.map(async (moduleId) => {
      const reports = await loadModuleReports(moduleId);
      if (Object.keys(reports).length > 0) {
        return { moduleId, reports };
      }
      return null;
    })
  );
  return results.filter((r): r is { moduleId: number; reports: ModuleReports } => r !== null);
}