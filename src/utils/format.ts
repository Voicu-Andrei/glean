export function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  const s = new Date(start);
  if (!end || end === start) return formatDate(s);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `${monthShort(s)} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${formatDate(s)} – ${formatDate(e)}`;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${monthShort(date)} ${date.getDate()}, ${date.getFullYear()}`;
}

function monthShort(d: Date): string {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
}

export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isPastDate(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getTime() < new Date().getTime();
}

export function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  return Math.floor((Date.now() - t) / 86_400_000);
}
