import { formatDistanceToNow, format } from 'date-fns';

export function formatRelativeTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export function formatDateTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'MMM dd, yyyy HH:mm');
  } catch {
    return 'Unknown';
  }
}

export function formatTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'HH:mm:ss');
  } catch {
    return 'Unknown';
  }
}

export function formatDate(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'MMM dd, yyyy');
  } catch {
    return 'Unknown';
  }
}
