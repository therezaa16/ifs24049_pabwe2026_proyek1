const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const formatRupiah = (value) => rupiahFormatter.format(Number(value) || 0).replace(/\u00a0/g, ' ');

export const formatCompactRupiah = (value) => {
  const amount = Number(value) || 0;
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.0', '')} jt`;
  if (Math.abs(amount) >= 1_000) return `${Math.round(amount / 1_000)} rb`;
  return String(amount);
};

export const formatDate = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

export const formatDateKey = (key) => {
  const [, month, day] = key.split('-');
  return `${Number(day)} ${MONTHS[Number(month) - 1]}`;
};

export const formatClock = (totalSeconds) => {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const formatMinutes = (minutes) => {
  const total = Math.round(Number(minutes) || 0);
  if (total < 60) return `${total} mnt`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} jam` : `${hours} jam ${rest} mnt`;
};
