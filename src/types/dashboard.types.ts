// src/types/dashboard.types.ts

export type UserWithAnalytics = {
  _id: string;
  username: string;
  plan: string;
  analytics: {
    // used by "Least Compliant Users"
    missedDays?: number;           // integer count (last N eligible days)
    complianceRate?: number;       // % within eligible window

    // used by "Top Users by Engagement"
    engagementScore?: number;      // 0–100
    // optional fields if you add more widgets later
    irritability?: number;
    resilience?: number;
  };
};

export type DashboardKPI = {
  totalUsers: number;
  activeUsers: number;
  highestIrritability: { user: string; value: number };
  lowestResilience: { user: string; value: number };
  // here "value" is a **count of missed days** for the worst user
  leastCompliant: { user: string; value: number };
};

export type DashboardCharts = {
  userGrowth: { month: string; users: number }[];
  sessionCompletion: { day: string; completed: number; missed: number }[];
};

export type DashboardTables = {
  leastCompliantUsers: UserWithAnalytics[];   // sorted by missedDays desc
  topUsersByEngagement: UserWithAnalytics[];  // sorted by engagementScore desc
};

export type DashboardAnalytics = {
  kpi: DashboardKPI;
  charts: DashboardCharts;
  tables: DashboardTables;
  meta: {
    windowDays: number;
    irritabilityDays: number;
    growthMonths: number;
    generatedAt: string;
  };
};
