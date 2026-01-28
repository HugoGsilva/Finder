export function formatXp(xp: string | number): string {
  const num = typeof xp === 'string' ? BigInt(xp) : BigInt(xp);
  return num.toLocaleString('en-US');
}

export function formatXpPerHour(xpPerHour: string | number): string {
  const num = typeof xpPerHour === 'string' ? parseFloat(xpPerHour) : xpPerHour;
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M/h`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k/h`;
  }
  return `${num.toFixed(0)}/h`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  return `${hours}h ${mins}m`;
}

export function getVocationColor(vocation: string): string {
  const normalized = vocation.toLowerCase();
  
  if (normalized.includes('knight')) return 'text-red-400';
  if (normalized.includes('paladin')) return 'text-green-400';
  if (normalized.includes('druid')) return 'text-blue-400';
  if (normalized.includes('sorcerer')) return 'text-purple-400';
  
  return 'text-gray-400';
}

export function getClassificationColor(classification: string): string {
  switch (classification) {
    case 'ally':
      return 'text-green-500';
    case 'enemy':
      return 'text-red-500';
    default:
      return 'text-yellow-500';
  }
}

export function getClassificationBg(classification: string): string {
  switch (classification) {
    case 'ally':
      return 'bg-green-500/10 border-green-500/20';
    case 'enemy':
      return 'bg-red-500/10 border-red-500/20';
    default:
      return 'bg-yellow-500/10 border-yellow-500/20';
  }
}

export function getStatusColor(isOnline: boolean): string {
  return isOnline ? 'text-green-500' : 'text-gray-500';
}

export function getStatusBadge(isOnline: boolean): string {
  return isOnline ? 'bg-green-500' : 'bg-gray-500';
}
