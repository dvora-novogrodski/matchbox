/** Status model (HLD F4). Every status belongs to a category. */
export const STATUS_CATEGORIES = [
  'open',
  'active',
  'interviewing',
  'offer',
  'closed',
] as const;
export type StatusCategory = (typeof STATUS_CATEGORIES)[number];

export interface SystemStatus {
  key: string;
  name: string;
  category: StatusCategory;
}

export const SYSTEM_STATUSES: readonly SystemStatus[] = [
  { key: 'saved', name: 'Saved', category: 'open' },
  { key: 'applied', name: 'Applied', category: 'active' },
  { key: 'screening', name: 'Screening', category: 'interviewing' },
  { key: 'technical', name: 'Technical', category: 'interviewing' },
  { key: 'hr', name: 'HR', category: 'interviewing' },
  { key: 'offer', name: 'Offer', category: 'offer' },
  { key: 'rejected', name: 'Rejected', category: 'closed' },
  { key: 'withdrawn', name: 'Withdrawn', category: 'closed' },
];
