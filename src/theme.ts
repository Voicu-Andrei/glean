export const colors = {
  primary: '#1A6B6B',
  accent: '#D4820A',
  cold: '#5B7FA6',
  background: '#F7F5F2',
  surface: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#6E6E73',
  border: '#E5E5EA',
  hot: '#D4820A',
  warm: '#D4820A',
  hotDot: '#E53935',
  warmDot: '#F2A93B',
  coldDot: '#5B7FA6',
  danger: '#C73E1D',
} as const;

export const radius = {
  card: 12,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  companyList: { fontSize: 17, fontWeight: '600' as const },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: colors.textSecondary,
  },
  body: { fontSize: 15, fontWeight: '400' as const },
  secondary: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  button: { fontSize: 16, fontWeight: '600' as const },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  fab: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
} as const;

export const interestMeta = {
  hot: { label: 'Hot', dot: colors.hotDot },
  warm: { label: 'Warm', dot: colors.warmDot },
  cold: { label: 'Cold', dot: colors.coldDot },
} as const;

export type InterestLevel = 'hot' | 'warm' | 'cold';
