export const FESTIVAL_ID = 'UNIFEST_2026';

export const COLLEGE_PALETTE = [
  { code: 'PCE', color: '#2563EB', bg: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-500' },
  { code: 'LPU', color: '#7C3AED', bg: 'bg-purple-600', text: 'text-purple-100', border: 'border-purple-500' },
  { code: 'IITD', color: '#059669', bg: 'bg-emerald-600', text: 'text-emerald-100', border: 'border-emerald-500' },
  { code: 'DU', color: '#D97706', bg: 'bg-amber-600', text: 'text-amber-100', border: 'border-amber-500' },
  { code: 'BITS', color: '#DC2626', bg: 'bg-rose-600', text: 'text-rose-100', border: 'border-rose-500' },
  { code: 'DTU', color: '#0891B2', bg: 'bg-cyan-600', text: 'text-cyan-100', border: 'border-cyan-500' },
  { code: 'TIET', color: '#4F46E5', bg: 'bg-indigo-600', text: 'text-indigo-100', border: 'border-indigo-500' },
  { code: 'PEC', color: '#EA580C', bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-500' },
];

export const ERROR_MESSAGES = {
  QR_INVALID: 'Invalid or forged QR token.',
  QR_EXPIRED: 'QR token has expired or is revoked.',
  NO_ALLOCATION: 'No hostel room allocated yet. Please visit the help desk.',
  ALREADY_CHECKED_IN: 'Student is already checked in.',
  NOT_CHECKED_IN: 'Student is not checked in. Cannot check out.',
  MEAL_ALREADY_USED: 'Meal already redeemed for this slot.',
  MEAL_WRONG_BATCH: 'Current time is outside your assigned college/gender batch window.',
  MEAL_OUTSIDE_WINDOW: 'Meal mess is currently closed for this slot.',
  ALLOCATION_RULE_VIOLATION: 'Move violates safety constraints (mixed gender, mixed college, or capacity exceeded).',
  CAPACITY_EXCEEDED: 'Room capacity reached.',
  UNAUTHORIZED: 'You do not have permission for this action.',
};
