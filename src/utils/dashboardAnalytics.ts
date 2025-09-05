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

  const daysAgo = (n: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - n);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  };

  const toISODate = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
    const dd = `${d.getUTCDate()}`.padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const monthKey = (d: Date) =>
    `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;

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

  const planName = (
    planId?: mongoose.Types.ObjectId | string,
    planMap?: Map<string, string>
  ): string => {
    if (!planId || !planMap) return '—';
    const name = planMap.get(String(planId));
    return typeof name === 'string' && name.trim().length > 0 ? name : '—';
  };

  const EMPTY_USER_WITH_ANALYTICS: UserWithAnalytics = {
    _id: 'na',
    username: '—',
    plan: '—',
    analytics: { complianceRate: 0, missedDays: 0 },
  };

  // ------------------------------
  // Date helpers (local-day based)
  // ------------------------------
  function startOfLocalDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function diffDaysLocal(a: Date, b: Date): number {
    // returns whole calendar-day difference: b - a
    const A = startOfLocalDay(a).getTime();
    const B = startOfLocalDay(b).getTime();
    const MS = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.floor((B - A) / MS));
  }

  // ------------------------------
  // Simplified compliance: gap-based missed days
  // ------------------------------
  type ComplianceResult = {
    userId: string;
    rehabPlanId: string;
    planName: string;
    missedInWindow: number;      // min(daysGap, remainingTotal, windowDays)
    availableInWindow: number;   // missed + (completed today ? 1 : 0)
    complianceRate: number;      // (completedToday ? 1 : 0) / availableInWindow
    remainingTotal: number;
    isPlanComplete: boolean;
  };

  async function computeUserComplianceGapBased(
    userId: string,
    windowDays: number,
    todayLocal: Date
  ): Promise<ComplianceResult | null> {
    const progress = await UserProgressModel
      .findOne({ userId })
      .sort({ updatedAt: -1 })
      .lean<any>();
    if (!progress) return null;

    const plan = await RehabPlanModel
      .findById(progress.rehabPlanId)
      .select('name schedule')
      .lean<any>();
    if (!plan) return null;

    // total assigned sessions ("days") from schedule
    const totalAssignedDays = (plan.schedule ?? []).reduce((acc: number, sched: any) => {
      return acc + (Array.isArray(sched.sessions) ? sched.sessions.length : 0);
    }, 0);

    const completedSessions = Array.isArray(progress.completedSessions) ? progress.completedSessions : [];
    const completedTotal = completedSessions.length;
    const remainingTotal = Math.max(0, totalAssignedDays - completedTotal);
    const isPlanComplete = remainingTotal === 0;

    if (isPlanComplete) {
      return {
        userId: String(progress.userId),
        rehabPlanId: String(progress.rehabPlanId),
        planName: plan.name ?? '—',
        missedInWindow: 0,
        availableInWindow: 0,
        complianceRate: 100,
        remainingTotal,
        isPlanComplete: true,
      };
    }

    // detect completion today
    const today = startOfLocalDay(todayLocal);
    const completedToday = completedSessions.some((cs: any) => {
      if (cs?.dayKey) {
        const [y, m, d] = cs.dayKey.split('-').map(Number);
        const c = new Date(y, (m - 1), d);
        return c.getTime() === today.getTime();
      }
      const c = startOfLocalDay(new Date(cs.completedAtLocal ?? cs.completedAtUTC));
      return c.getTime() === today.getTime();
    });

    // last completed session date (local)
    let lastCompletedAtLocal: Date | null = null;
    if (completedSessions.length > 0) {
      const last = completedSessions.reduce((max: any, cur: any) =>
        (!max || new Date(cur.completedAtUTC) > new Date(max.completedAtUTC)) ? cur : max, null);
      lastCompletedAtLocal = last ? new Date(last.completedAtLocal ?? last.completedAtUTC) : null;
    }

    // days gap since last completion (or since startDate if never completed)
    let daysGap = 0;
    if (lastCompletedAtLocal) {
      daysGap = diffDaysLocal(lastCompletedAtLocal, today);
    } else {
      const userDoc = await UserModel.findById(userId).select('startDate').lean<any>();
      if (userDoc?.startDate) daysGap = diffDaysLocal(new Date(userDoc.startDate), today);
      else daysGap = 0; // brand-new users aren't penalized pre-enrollment
    }

    // Missed = gap, capped by remaining sessions and window
    const missedInWindow = Math.max(0, Math.min(daysGap, remainingTotal, windowDays));

    // Available = missed + (if completed today, count that as an available day with completion)
    const completedContribution = completedToday ? 1 : 0;
    const availableInWindow = missedInWindow + completedContribution;

    const complianceRate = availableInWindow > 0
      ? round1((completedContribution / availableInWindow) * 100)
      : 100;

    return {
      userId: String(progress.userId),
      rehabPlanId: String(progress.rehabPlanId),
      planName: plan.name ?? '—',
      missedInWindow,
      availableInWindow,
      complianceRate,
      remainingTotal,
      isPlanComplete: false,
    };
  }

  // ------------------------------
  // Main service
  // ------------------------------
  export async function getDashboardAnalyticsService(
    windowDays = 7,   // used for "Least compliant" + session chart
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
    const fromWindow = daysAgo(windowDays);
    const fromIrr = daysAgo(irritabilityDays);
    const fromGrowthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (growthMonths - 1), 1)
    );

    // Prebuild last N ISO days for chart
    const lastNDaysIso: string[] = Array.from({ length: windowDays }).map((_, i) => {
      const d = new Date(now);
      d.setUTCDate(now.getUTCDate() - (windowDays - 1 - i));
      d.setUTCHours(0, 0, 0, 0);
      return toISODate(d);
    });

    // --------- Aggregations ----------
    // Counts
    const [totalUsers, activeUsers] = await Promise.all([
      UserModel.countDocuments({}), // includes admins
      UserModel.countDocuments({
        status: 'active',
        role: 'user',               // exclude admins from "active users"
        lastLogin: { $gte: daysAgo(7) },
      }),
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

    // Distinct completed days/user in window (for engagement & charts)
    const completedDaysAgg = await UserProgressModel.aggregate([
      { $unwind: '$completedSessions' },
      { $match: { 'completedSessions.completedAtUTC': { $gte: fromWindow } } },
      { $group: { _id: { userId: '$userId', day: '$completedSessions.dayKey' } } },
      { $group: { _id: '$_id.userId', completedDays: { $sum: 1 } } },
    ]);

    // Distinct completed days/user in last 30 days (for engagement active-days% component)
    const completedDays30Agg = await UserProgressModel.aggregate([
      { $unwind: '$completedSessions' },
      { $match: { 'completedSessions.completedAtUTC': { $gte: daysAgo(30) } } },
      { $group: { _id: { userId: '$userId', day: '$completedSessions.dayKey' } } },
      { $group: { _id: '$_id.userId', completedDays30: { $sum: 1 } } },
    ]);

    // Latest completion per user (for engagement recency component)
    const lastCompletionAgg = await UserProgressModel.aggregate([
      { $unwind: '$completedSessions' },
      { $group: { _id: '$userId', lastCompletedAt: { $max: '$completedSessions.completedAtUTC' } } },
    ]);

    // Latest progress doc per user (for plan name)
    const latestProgressAgg = await UserProgressModel.aggregate([
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: '$userId',
          rehabPlanId: { $first: '$rehabPlanId' },
          updatedAt: { $first: '$updatedAt' },
        },
      },
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
    for (const row of lastCompletionAgg) {
      if (row.lastCompletedAt) lastCompletedMap.set(String(row._id), new Date(row.lastCompletedAt));
    }

    const latestProgressMap = new Map<string, { rehabPlanId?: mongoose.Types.ObjectId }>();
    const rehabPlanIds = new Set<string>();
    for (const row of latestProgressAgg) {
      const uid = String(row._id);
      latestProgressMap.set(uid, { rehabPlanId: row.rehabPlanId });
      if (row.rehabPlanId) rehabPlanIds.add(String(row.rehabPlanId));
    }

    // Active end-users (exclude admins)
    const activeUserDocs = await UserModel.find(
      { status: 'active', role: 'user' },
      { _id: 1, name: 1, lastLogin: 1, startDate: 1 }
    ).lean();

    const activeUsersCount = activeUserDocs.length;
    const activeUserIds = activeUserDocs.map((u) => String(u._id));
    const userMap = new Map(activeUserDocs.map((u) => [String(u._id), u]));

    // Plan names (for engagement table)
    const rehabPlans = await RehabPlanModel.find(
      { _id: { $in: Array.from(rehabPlanIds).map((id) => new mongoose.Types.ObjectId(id)) } },
      { _id: 1, name: 1 }
    ).lean<{ _id: mongoose.Types.ObjectId; name: string }[]>();

    const planMap: Map<string, string> = new Map(rehabPlans.map((p) => [String(p._id), p.name]));

    // --------------------------
    // Least compliance (gap-based missed days) + FILTER OUT ZERO MISSES
    // --------------------------
    const complianceRows: UserWithAnalytics[] = [];
    const todayLocal = new Date();

    for (const uid of activeUserIds) {
      const result = await computeUserComplianceGapBased(uid, windowDays, todayLocal);
      if (!result) continue;
      if (result.isPlanComplete) continue; // exclude fully completed

      const userDoc = userMap.get(uid);
      complianceRows.push({
        _id: uid,
        username: userDoc?.name ?? 'Unknown',
        plan: result.planName ?? '—',
        analytics: {
          complianceRate: round1(result.complianceRate),
          missedDays: result.missedInWindow,
        },
      });
    }

    // >>> filter out 0-miss users <<<
    const leastCompliancePool = complianceRows.filter(
      (r) => (r.analytics.missedDays ?? 0) > 0
    );

    // Sort: most missed first; tie-breaker lower compliance, then name
    leastCompliancePool.sort((a, b) => {
      const md = (b.analytics.missedDays ?? 0) - (a.analytics.missedDays ?? 0);
      if (md !== 0) return md;
      const cr = (a.analytics.complianceRate ?? 0) - (b.analytics.complianceRate ?? 0);
      if (cr !== 0) return cr;
      return a.username.localeCompare(b.username);
    });

    const leastCompliantUsers = leastCompliancePool.slice(0, 5);
    const leastCompliantKpi: UserWithAnalytics = leastCompliantUsers[0] ?? EMPTY_USER_WITH_ANALYTICS;

    // --------------------------
    // Engagement (v1): 85% active days (30d) + 15% recency of last completion
    // --------------------------
    const engagementRows: UserWithAnalytics[] = [];
    for (const uid of activeUserIds) {
      const completed30 = completedDays30Map.get(uid) ?? 0;
      const activeDaysPct = clamp((completed30 / 30) * 100, 0, 100);

      // recency by days since last completed session
      const last = lastCompletedMap.get(uid);
      const daysSinceLast =
        last ? Math.max(0, Math.floor((Date.now() - last.getTime()) / 86400000)) : 30;
      const recency = clamp(100 - daysSinceLast * 5, 0, 100);

      const engagementScore = Math.round(0.85 * activeDaysPct + 0.15 * recency);

      const lp = latestProgressMap.get(uid);
      const plan = planName(lp?.rehabPlanId, planMap);
      const username = userMap.get(uid)?.name ?? 'Unknown';

      engagementRows.push({ _id: uid, username, plan, analytics: { engagementScore } });
    }
    engagementRows.sort((a, b) => (b.analytics.engagementScore! - a.analytics.engagementScore!));
    const topUsersByEngagement = engagementRows.slice(0, 5);

    // --------------------------
    // Session completion chart
    // --------------------------
    const byDayMap = new Map<string, number>();
    for (const row of sessionByDayAgg) {
      byDayMap.set(String(row.day), row.completed as number);
    }
    const sessionCompletion = lastNDaysIso.map((day) => {
      const completed = byDayMap.get(day) ?? 0;
      const expected = activeUsersCount; // 1 expected per active user per day (v1)
      const missed = Math.max(0, expected - completed);
      return { day, completed, missed };
    });

    // --------------------------
    // User growth (fill missing months)
    // --------------------------
    const months: string[] = [];
    for (let i = growthMonths - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      months.push(monthKey(d));
    }
    const growthMap = new Map<string, number>(
      (userGrowthAgg as any[]).map((r) => [r.ym as string, r.users as number])
    );
    const userGrowth = months.map((ym) => ({ month: monthLabel(ym), users: growthMap.get(ym) ?? 0 }));

    // --------------------------
    // KPIs
    // --------------------------
    const highestIrritability = highestIrrAgg[0] ?? { user: '—', value: 0 };
    const lowestResilience = lowestResAgg[0] ?? { user: '—', value: 0 };
    const leastCompliant = {
      user: leastCompliantKpi.username,
      value: leastCompliantKpi.analytics.missedDays ?? 0,
    };

    const payload: DashboardAnalytics = {
      kpi: { totalUsers, activeUsers, highestIrritability, lowestResilience, leastCompliant },
      charts: { userGrowth, sessionCompletion },
      tables: { leastCompliantUsers, topUsersByEngagement },
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