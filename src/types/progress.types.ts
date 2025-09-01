export type ProgressSession = {
  sessionId: string;
  title: string;
  completed: boolean;
  totalExercises: number;
  completedExercises: number;
};

export type ProgressDay = {
  day: number;
  unlocked: boolean;
  completed: boolean;
  totalExercises: number;
  completedExercises: number;
  sessions: ProgressSession[];
};

export type ProgressWeek = {
  week: number;
  unlocked: boolean;
  completed: boolean;
  days: ProgressDay[];
};

export type ProgressStatus = {
  planId: string,
  planName: string
  weeks: ProgressWeek[];
  currentWeek: number;
  currentDay: number;
  totals: {
    totalExercises: number;
    completedExercises: number;
    totalSessions: number;
    completedSessions: number;
  };
};