export const formatNotification = (notification: any[]) => {
  if (!notification || notification.length === 0) return [];
  const formatted = new Map();
  for (const n of notification) {
    const year = n.created_at.getFullYear();
    const month = String(n.created_at.getMonth() + 1).padStart(2, '0');
    const day = String(n.created_at.getDate()).padStart(2, '0');

    const date = `${day}-${month}-${year}`;
    // formatted.set(date, {...formatted.get(date) || {}, ...n});
    formatted[date] = [...(formatted[date] || []), n];
  }
  return formatted;
};
