import { format } from 'date-fns';

export function generatePackingListCode(): string {
  // Format: LOMPL[day][month][year][hour][minute][second]
  const now = new Date();
  return `LOMPL${format(now, 'ddMMyyHHmmss')}`;
}

export function isValidPackingListCode(code: string): boolean {
  return /^LOMPL\d{12}$/.test(code);
}