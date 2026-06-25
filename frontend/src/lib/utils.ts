import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(value?: number | string) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(
    Number(value || 0)
  );
}

export function dateOnly(value?: string) {
  return value ? new Date(value).toLocaleDateString('th-TH', { dateStyle: 'medium' }) : '-';
}
