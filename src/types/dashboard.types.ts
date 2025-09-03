// src/types/dashboard.ts

export type UserWithAnalytics = {
  _id: string;
  username: string;
  plan: string;
  analytics: {
    complianceRate?: number;   // %
    irritability?: number;     // 0-10 (if you later need it per user)
    resilience?: number;       // 1-5  (if you later need it per user)
    engagementScore?: number;  // 0-100
  };
};

export type DashboardKPI = {
  totalUsers: number;
  activeUsers: number;
  highestIrritability: { user: string; value: number };
  lowestResilience: { user: string; value: number };
  leastCompliant: { user: string; value: number };
};

export type DashboardCharts = {
  userGrowth: { month: string; users: number }[];
  sessionCompletion: { day: string; completed: number; missed: number }[];
};

export type DashboardTables = {
  leastCompliantUsers: UserWithAnalytics[];
  topUsersByEngagement: UserWithAnalytics[];
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
