/** Plan limits (HLD section 4.4). Defaults here; overridable via env at runtime. */
export interface PlanLimits {
  'discover.dayIntervalHours': number;
  'discover.nightIntervalHours': number;
  'discover.quietHours': string;
  'discover.maxCompanies': number | null; // null = unlimited
  'ai.dailyCallBudget': number;
  'followUp.afterDays': number;
  features: string[]; // enabled P2 features
}

export const PLANS: Record<string, PlanLimits> = {
  owner: {
    'discover.dayIntervalHours': 2,
    'discover.nightIntervalHours': 6,
    'discover.quietHours': '00:00-07:00',
    'discover.maxCompanies': null,
    'ai.dailyCallBudget': 200,
    'followUp.afterDays': 7,
    features: [],
  },
};
