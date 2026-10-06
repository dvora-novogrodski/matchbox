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

export const ATS_DETECTION_STATUSES = [
  'pending',
  'detected',
  'needs_confirmation', // low-confidence AI fallback (A7)
  'not_found',
  'failed',
] as const;
export type AtsDetectionStatus = (typeof ATS_DETECTION_STATUSES)[number];

export const JOB_SOURCES = ['manual', ...ATS_PROVIDERS] as const;
export type JobSource = (typeof JOB_SOURCES)[number];

export const WORK_MODES = ['onsite', 'hybrid', 'remote'] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const EVENT_TYPES = [
  'created',
  'status_changed',
  'note',
  'email',
  'follow_up',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const DEFAULT_CV_TEMPLATE_ID = 'default';
