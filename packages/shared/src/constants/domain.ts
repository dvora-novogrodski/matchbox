export const CAREER_ITEM_KINDS = [
  'experience',
  'project',
  'achievement',
  'skill',
  'education',
] as const;
export type CareerItemKind = (typeof CAREER_ITEM_KINDS)[number];

export const CV_SECTIONS = [
  'header',
  'summary',
  'experience',
  'projects',
  'skills',
  'education',
] as const;
export type CvSection = (typeof CV_SECTIONS)[number];

export const CV_CHANGE_STATES = [
  'proposed',
  'accepted',
  'rejected',
  'blocked', // no evidence: cannot be accepted
] as const;
export type CvChangeState = (typeof CV_CHANGE_STATES)[number];

export const MATCH_DECISIONS = ['pending', 'saved', 'skipped'] as const;
export type MatchDecision = (typeof MATCH_DECISIONS)[number];

export const ATS_PROVIDERS = [
  'comeet',
  'greenhouse',
  'lever',
  'ashby',
  'workable',
  'smartrecruiters',
] as const;
export type AtsProvider = (typeof ATS_PROVIDERS)[number];

export const DEFAULT_CV_TEMPLATE_ID = 'default';
