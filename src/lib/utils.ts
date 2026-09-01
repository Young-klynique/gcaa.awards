import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(pesewas: number): string {
  const cedis = pesewas / 100;
  return `GH₵ ${cedis.toFixed(2)}`;
}

export function generateNomineeCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getTimeRemaining(endDate: string | null): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isExpired: boolean;
} {
  if (!endDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isExpired: true };

  const total = new Date(endDate).getTime() - Date.now();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isExpired: true };
  }

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
    isExpired: false,
  };
}

export function isNominationOpen(settings: { nomination_start: string | null; nomination_end: string | null } | null): boolean {
  if (!settings?.nomination_start || !settings?.nomination_end) return false;
  const now = Date.now();
  return now >= new Date(settings.nomination_start).getTime() && now <= new Date(settings.nomination_end).getTime();
}

export function isVotingOpen(settings: { voting_start: string | null; voting_end: string | null } | null): boolean {
  if (!settings?.voting_start || !settings?.voting_end) return false;
  const now = Date.now();
  return now >= new Date(settings.voting_start).getTime() && now <= new Date(settings.voting_end).getTime();
}
