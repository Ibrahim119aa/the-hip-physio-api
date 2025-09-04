// utils/computeCompliance.ts
import RehabPlanModel from '../models/rehabPlan.model';
import UserProgressModel from '../models/userProgress.model';
import { addDays, toDayKeyLocal } from './dateKeys';


type ComplianceResult = {
  userId: string;
  rehabPlanId: string;
  planName: string;
  completedInWindow: number;
  missedInWindow: number;
  availableInWindow: number;  // completed + missed
  complianceRate: number;     // completed / available * 100
  remainingTotal: number;     // remaining overall (not just window)
  isPlanComplete: boolean;
};

export async function computeUserCompliance(
  userId: string,
  windowDays: number,         // e.g., 30
  todayLocal: Date = new Date()
): Promise<ComplianceResult | null> {
  // 1) Get the latest (active) progress per user (you may adapt to your multi-plan rules)
  const progress = await UserProgressModel
    .findOne({ userId })
    .sort({ updatedAt: -1 })
    .lean<any>();

  if (!progress) return null;

  // 2) Load the plan and count total assigned "days" (sessions)
  const plan = await RehabPlanModel
    .findById(progress.rehabPlanId)
    .select('name schedule')
    .lean<any>();
  if (!plan) return null;

  const totalAssignedDays = (plan.schedule ?? []).reduce((acc: number, sched: any) => {
    // each session is a "day"
    return acc + (Array.isArray(sched.sessions) ? sched.sessions.length : 0);
  }, 0);

  const completedSessions = progress.completedSessions ?? [];
  const completedTotal = completedSessions.length;
  const remainingTotal = Math.max(0, totalAssignedDays - completedTotal);
  const isPlanComplete = remainingTotal === 0;

  // If the plan is fully completed, we **do not** count missed days and can exclude from "least compliance"
  if (isPlanComplete) {
    return {
      userId: String(progress.userId),
      rehabPlanId: String(progress.rehabPlanId),
      planName: plan.name,
      completedInWindow: 0,
      missedInWindow: 0,
      availableInWindow: 0,
      complianceRate: 100,
      remainingTotal,
      isPlanComplete: true,
    };
  }

  // 3) Build a set of completed dayKeys for quick lookup (in the window only)
  const todayKey = toDayKeyLocal(todayLocal);
  const windowStartLocal = addDays(todayLocal, -(windowDays - 1));
  const windowStartKey = toDayKeyLocal(windowStartLocal);

  const completedSet = new Set<string>();
  let completedInWindow = 0;

  for (const cs of completedSessions) {
    if (!cs?.dayKey) continue;
    // count only completions inside the window [windowStart .. today]
    if (cs.dayKey >= windowStartKey && cs.dayKey <= todayKey) {
      completedSet.add(cs.dayKey);
      completedInWindow++;
    }
  }

  // 4) We need to simulate expectations **only** until the plan finishes.
  //    remainingPrior tracks "how many sessions still owed up to (and including) that day".
  //    At start of the window, remainingPrior = remaining sessions as of **before** windowStart.
  //    We can compute "completed before window" count and derive remainingPrior.

  const completedBeforeWindow = completedSessions.filter(
    (cs: any) => cs.dayKey < windowStartKey
  ).length;

  let remainingPrior = Math.max(0, totalAssignedDays - completedBeforeWindow);

  // 5) Walk each day in the window up to today (inclusive), expecting one session per day **until** remaining goes to 0.
  let missedInWindow = 0;
  let availableInWindow = 0;

  // Calendar loop
  let cursor = new Date(windowStartLocal.getFullYear(), windowStartLocal.getMonth(), windowStartLocal.getDate());
  while (true) {
    const cursorKey = toDayKeyLocal(cursor);
    if (cursorKey > todayKey) break; // never go into the future

    if (remainingPrior > 0) {
      // We still owe sessions as of this day → today is "available"
      availableInWindow++;

      if (completedSet.has(cursorKey)) {
        // done one, reduce remaining owed
        remainingPrior = Math.max(0, remainingPrior - 1);
      } else {
        // not completed → missed
        missedInWindow++;
        // Still reduce the remaining owed, because a day passed where the user could've progressed
        remainingPrior = Math.max(0, remainingPrior - 1);
      }
    } else {
      // Plan already fully completed before this day → no expectation, no miss, no availability
      // Do nothing.
    }

    // next day
    cursor = addDays(cursor, 1);
  }

  // 6) Compliance rate = completed / available * 100
  //    completedInWindow must be trimmed to those days where we actually had availability;
  //    However, the loop above tells us exactly how many were available vs missed.
  //    The number of days completed among available is: availableInWindow - missedInWindow
  const actuallyCompletedAmongAvailable = Math.max(0, availableInWindow - missedInWindow);
  const complianceRate = availableInWindow > 0
    ? Math.round((actuallyCompletedAmongAvailable / availableInWindow) * 1000) / 10
    : 100;

  return {
    userId: String(progress.userId),
    rehabPlanId: String(progress.rehabPlanId),
    planName: plan.name,
    completedInWindow: actuallyCompletedAmongAvailable,
    missedInWindow,
    availableInWindow,
    complianceRate,
    remainingTotal,
    isPlanComplete: false,
  };
}
