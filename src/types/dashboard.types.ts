// src/services/dashboard.service.ts
import mongoose from 'mongoose';
import UserModel from '../models/user.model';
import UserProgressModel from '../models/userProgress.model';
import WeeklyPsychologicalCheckInModel from '../models/WeeklyPsychologicalCheckIn.model';
import RehabPlanModel from '../models/rehabPlan.model';
import { DashboardAnalytics, UserWithAnalytics } from '../types/dashboard.types';

// ------------------------------
// Tiny in-memory cache (per process)
// ------------------------------
type CacheEntry<T> = { expiresAt: number; payload: T };
const CACHE = new Map<string, CacheEntry<DashboardAnalytics>>();
const DEFAULT_TTL_MS = 120_000; // 2 minutes

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

// Normalize to UTC midnight (so “days” are consistent)
const utc0 = (d: Date) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const daysBetweenInclusive = (start: Date, end: Date) => {
  const s = utc0(start).getTime();
  const e = utc0(end).getTime();
  if (e < s) return 0;
  return Math.floor((e - s) / 86400000) + 1;
};

const toISODate = (d: Date) => {
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const monthKey = (d: Date) => `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en', { month: 'short' });
};

const getCache = (key: string) => {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    CACHE.delete(key);
    return null;
  }
  return hit.payload;
};

const setCache = (key: string, payload: DashboardAnalytics, ttlMs = DEFAULT_TTL_MS) => {
  CACHE.set(key, { expiresAt: Date.now() + ttlMs, payload });
};

// --- Helpers to keep types strict ---
const planName = (planId?: mongoose.Types.ObjectId | string, planMap?: Map<string, string>): string => {
  if (!planId || !planMap) return '—';
  const name = planMap.get(String(planId));
  return typeof name === 'string' && name.trim().length > 0 ? name : '—';
};

const EMPTY_USER_WITH_ANALYTICS: UserWithAnalytics = {
  _id: 'na',
  username: '—',
  plan: '—',
  analytics: { missedDays: 0, complianceRate: 0 },
};

// ------------------------------
// Main service
// ------------------------------
export async function getDashboardAnalyticsService(
  windowDays = 7,
  irritabilityDays = 30,
  growthMonths = 12
): Promise<DashboardAnalytics> {
  // clamp inputs
  windowDays = clamp(windowDays || 7, 1, 60);
  irritabilityDays = clamp(irritabilityDays || 30, 7, 180);
  growthMonths = clamp(growthMonths || 12, 3, 36);

  const cacheKey = `dash:${windowDays}:${irritabilityDays}:${growthMonths}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const now0 = utc0(now);
  const fromWindow = daysAgo(windowDays);
  const fromIrr = daysAgo(irritabilityDays);
  const fromGrowthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (growthMonths - 1), 1));

  // Prebuild last N ISO days for chart
  const lastNDaysIso: string[] = Array.from({ length: windowDays }).map((_, i) => {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - (windowDays - 1 - i));
    d.setUTCHours(0, 0, 0, 0);
    return toISODate(d);
  });

  // --------- Aggregations ----------
  // Counts (all users)
  const [totalUsers, activeUsers] = await Promise.all([
    UserModel.countDocuments({}),
    UserModel.countDocuments({ status: 'active', lastLogin: { $gte: daysAgo(7) } }),
  ]);

  // Highest irritability (avg last irritabilityDays)
  const highestIrrAgg = await UserProgressModel.aggregate([
    { $unwind: '$completedExercises' },
    {
      $match: {
        'completedExercises.irritabilityScore': { $ne: null },
        'completedExercises.completedAtUTC': { $gte: fromIrr },
      },
    },
    { $group: { _id: '$userId', avgIrr: { $avg: '$completedExercises.irritabilityScore' } } },
    { $sort: { avgIrr: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: UserModel.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $project: { _id: 0, user: '$user.name', value: { $round: ['$avgIrr', 1] } } },
  ]);

  // Lowest resilience (avg over recent check-ins; last ~120 days)
  const lowestResAgg = await WeeklyPsychologicalCheckInModel.aggregate([
    { $match: { createdAt: { $gte: daysAgo(120) } } },
    { $group: { _id: '$userId', avgRes: { $avg: '$resilienceScore' } } },
    { $sort: { avgRes: 1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: UserModel.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $project: { _id: 0, user: '$user.name', value: { $round: ['$avgRes', 1] } } },
  ]);

  // Distinct completed days/user in window
  const completedDaysAgg = await UserProgressModel.aggregate([
    { $unwind: '$completedSessions' },
    { $match: { 'completedSessions.completedAtUTC': { $gte: fromWindow } } },
    { $group: { _id: { userId: '$userId', day: '$completedSessions.dayKey' } } },
    { $group: { _id: '$_id.userId', completedDays: { $sum: 1 } } }, // # of distinct days
  ]);

  // Distinct completed days/user in 30 days (for engagement)
  const completedDays30Agg = await UserProgressModel.aggregate([
    { $unwind: '$completedSessions' },
    { $match: { 'completedSessions.completedAtUTC': { $gte: daysAgo(30) } } },
    { $group: { _id: { userId: '$userId', day: '$completedSessions.dayKey' } } },
    { $group: { _id: '$_id.userId', completedDays30: { $sum: 1 } } },
  ]);

  // Latest progress doc per user (for streaks/progress/plan)
  const latestProgressAgg = await UserProgressModel.aggregate([
    { $sort: { updatedAt: -1 } },
    {
      $group: {
        _id: '$userId',
        rehabPlanId: { $first: '$rehabPlanId' },
        progressPercent: { $first: '$progressPercent' },
        streakCountWeekly: { $first: '$streakCountWeekly' },
        streakCountMonthly: { $first: '$streakCountMonthly' },
        updatedAt: { $first: '$updatedAt' },
      },
    },
  ]);

  // Last completed session UTC per user (for engagement recency)
  const lastCompletedAgg = await UserProgressModel.aggregate([
    { $unwind: '$completedSessions' },
    { $group: { _id: '$userId', lastCompleted: { $max: '$completedSessions.completedAtUTC' } } },
  ]);

  // Completed sessions by day for chart
  const sessionByDayAgg = await UserProgressModel.aggregate([
    { $unwind: '$completedSessions' },
    { $match: { 'completedSessions.completedAtUTC': { $gte: fromWindow } } },
    { $group: { _id: '$completedSessions.dayKey', completed: { $sum: 1 } } },
    { $project: { _id: 0, day: '$_id', completed: 1 } },
  ]);

  // User growth by month
  const userGrowthAgg = await UserModel.aggregate([
    { $match: { createdAt: { $gte: fromGrowthStart } } },
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        users: { $sum: 1 },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
    {
      $project: {
        _id: 0,
        ym: {
          $concat: [
            { $toString: '$_id.y' },
            '-',
            {
              $cond: [
                { $lt: ['$_id.m', 10] },
                { $concat: ['0', { $toString: '$_id.m' }] },
                { $toString: '$_id.m' },
              ],
            },
          ],
        },
        users: 1,
      },
    },
  ]);

  // --------- Node-side joins / shaping ----------
  const completedDaysMap = new Map<string, number>();
  for (const row of completedDaysAgg) {
    completedDaysMap.set(String(row._id), row.completedDays as number);
  }

  const completedDays30Map = new Map<string, number>();
  for (const row of completedDays30Agg) {
    completedDays30Map.set(String(row._id), row.completedDays30 as number);
  }

  const lastCompletedMap = new Map<string, Date>();
  for (const row of lastCompletedAgg) {
    lastCompletedMap.set(String(row._id), row.lastCompleted as Date);
  }

  const latestProgressMap = new Map<
    string,
    {
      rehabPlanId?: mongoose.Types.ObjectId;
      progressPercent?: number;
      streakCountWeekly?: number;
      streakCountMonthly?: number;
    }
  >();

  const rehabPlanIds = new Set<string>();
  for (const row of latestProgressAgg) {
    const uid = String(row._id);
    latestProgressMap.set(uid, {
      rehabPlanId: row.rehabPlanId,
      progressPercent: row.progressPercent ?? 0,
      streakCountWeekly: row.streakCountWeekly ?? 0,
      streakCountMonthly: row.streakCountMonthly ?? 0,
    });
    if (row.rehabPlanId) rehabPlanIds.add(String(row.rehabPlanId));
  }

  // Active *patients* only (exclude admins)
  const userDocs = await UserModel.find(
    { status: 'active', role: 'user' },
    { _id: 1, name: 1, lastLogin: 1, startDate: 1 }
  ).lean();

  // Only users that actually have a plan/progress
  const activeUserIds = userDocs
    .map(u => String(u._id))
    .filter(uid => latestProgressMap.has(uid));

  const userMap = new Map(userDocs.map(u => [String(u._id), u]));

  // Plan names
  const rehabPlans = await RehabPlanModel
    .find(
      { _id: { $in: Array.from(rehabPlanIds).map(id => new mongoose.Types.ObjectId(id)) } },
      { _id: 1, name: 1 }
    )
    .lean<{ _id: mongoose.Types.ObjectId; name: string }[]>();

  const planMap: Map<string, string> = new Map(
    rehabPlans.map(p => [String(p._id), p.name])
  );

  // Compliance (missed days) table
  const complianceRows: UserWithAnalytics[] = [];
  for (const uid of activeUserIds) {
    const userDoc = userMap.get(uid);
    const startDate = userDoc?.startDate ? utc0(new Date(userDoc.startDate)) : fromWindow;

    // Eligible days = from max(user.startDate, windowStart) to today (inclusive)
    const effectiveStart = startDate > fromWindow ? startDate : fromWindow;
    const eligibleDays = daysBetweenInclusive(effectiveStart, now0);
    if (eligibleDays <= 0) continue;

    const completedDays = completedDaysMap.get(uid) ?? 0;
    const missedDays = Math.max(0, eligibleDays - completedDays);
    const complianceRate = round1((completedDays / Math.max(1, eligibleDays)) * 100);

    const lp = latestProgressMap.get(uid);
    const plan = planName(lp?.rehabPlanId, planMap);
    const username = userDoc?.name ?? 'Unknown';

    // Only show people who actually missed something
    if (missedDays > 0) {
      complianceRows.push({
        _id: uid,
        username,
        plan,
        analytics: { missedDays, complianceRate },
      });
    }
  }
  complianceRows.sort((a, b) => (b.analytics.missedDays! - a.analytics.missedDays!));
  const leastCompliantUsers = complianceRows.slice(0, 5);
  const leastCompliantKpi: UserWithAnalytics = leastCompliantUsers[0] ?? EMPTY_USER_WITH_ANALYTICS;

  // Engagement table (uses last-completed recency instead of login)
  const engagementRows: UserWithAnalytics[] = [];
  for (const uid of activeUserIds) {
    const completed30 = completedDays30Map.get(uid) ?? 0;
    const completionRate = clamp((completed30 / 30) * 100, 0, 100);

    const lp = latestProgressMap.get(uid);
    const weekly = lp?.streakCountWeekly ?? 0;
    const monthly = lp?.streakCountMonthly ?? 0;
    const streakNorm = Math.max(
      clamp((weekly / 7) * 100, 0, 100),
      clamp((monthly / 30) * 100, 0, 100)
    );

    const progress = clamp(lp?.progressPercent ?? 0, 0, 100);

    const lastCompleted = lastCompletedMap.get(uid);
    const daysSinceLastCompletion = lastCompleted
      ? Math.max(0, Math.floor((now0.getTime() - utc0(lastCompleted).getTime()) / 86400000))
      : 30;
    // 0 days ago = 100, 5 days ago = 75, 20 days ago ≈ 0
    const recency = clamp(100 - daysSinceLastCompletion * 5, 0, 100);

    const engagementScore = Math.round(
      0.5 * completionRate +
      0.2 * streakNorm +
      0.2 * progress +
      0.1 * recency
    );

    const plan = planName(lp?.rehabPlanId, planMap);
    const username = userMap.get(uid)?.name ?? 'Unknown';

    engagementRows.push({
      _id: uid,
      username,
      plan,
      analytics: { engagementScore },
    });
  }
  engagementRows.sort((a, b) => (b.analytics.engagementScore! - a.analytics.engagementScore!));
  const topUsersByEngagement = engagementRows.slice(0, 5);

  // Session completion chart
  const byDayMap = new Map<string, number>();
  for (const row of sessionByDayAgg) {
    byDayMap.set(String(row.day), row.completed as number);
  }
  const expectedUsersForChart = activeUserIds.length; // only users with a plan
  const sessionCompletion = lastNDaysIso.map(day => {
    const completed = byDayMap.get(day) ?? 0;
    const missed = Math.max(0, expectedUsersForChart - completed);
    return { day, completed, missed };
  });

  // User growth (fill missing months)
  const months: string[] = [];
  for (let i = growthMonths - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(monthKey(d));
  }
  const growthMap = new Map<string, number>((userGrowthAgg as any[]).map(r => [r.ym as string, r.users as number]));
  const userGrowth = months.map(ym => ({ month: monthLabel(ym), users: growthMap.get(ym) ?? 0 }));

  // KPIs
  const highestIrritability = highestIrrAgg[0] ?? { user: '—', value: 0 };
  const lowestResilience = lowestResAgg[0] ?? { user: '—', value: 0 };
  const leastCompliant = {
    user: leastCompliantKpi.username,
    value: leastCompliantKpi.analytics.missedDays ?? 0,
  };

  const payload: DashboardAnalytics = {
    kpi: {
      totalUsers,
      activeUsers,
      highestIrritability,
      lowestResilience,
      leastCompliant,
    },
    charts: {
      userGrowth,
      sessionCompletion,
    },
    tables: {
      leastCompliantUsers,
      topUsersByEngagement,
    },
    meta: {
      windowDays,
      irritabilityDays,
      growthMonths,
      generatedAt: new Date().toISOString(),
    },
  };

  setCache(cacheKey, payload);
  return payload;
}
