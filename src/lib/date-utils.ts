export function formatDate(dateString: string): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);

    // Format: "Jan 15, 2024"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateWithTime(dateString: string): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);

    // Format: "Jan 15, 2024 at 3:45 PM"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return formatDate(dateString);
  } catch {
    return dateString;
  }
}
