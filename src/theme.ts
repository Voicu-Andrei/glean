export const colors = {
  primary: '#1A6B6B',
  primarySoft: '#E4EFEF',
  primaryDark: '#125252',
  primaryDeeper: '#0C3C3C',
  accent: '#D4820A',
  accentSoft: '#FEF6E8',
  cold: '#5B7FA6',
  background: '#F7F5F2',
  backgroundSoft: '#EFEDE8',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAF8',
  textPrimary: '#1C1C1E',
  textSecondary: '#6E6E73',
  textTertiary: '#A1A1A6',
  border: '#E5E5EA',
  borderSoft: '#EFEFF1',
  divider: '#F1F0EE',
  hotDot: '#E53935',
  hotTint: '#FDECEC',
  warmDot: '#F2A93B',
  warmTint: '#FEF6E8',
  coldDot: '#5B7FA6',
  coldTint: '#EEF2F7',
  danger: '#C73E1D',
  success: '#2E7D32',
  pulse: '#9DE0AD',
  hotNumeral: '#FBC68B',
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 10,
  card: 14,
  lg: 18,
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
  largeTitle: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.4 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.2 },
  headline: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.1 },
  companyList: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.1 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.7,
    textTransform: 'uppercase' as const,
    color: colors.textSecondary,
  },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  callout: { fontSize: 14, fontWeight: '500' as const },
  secondary: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  tertiary: { fontSize: 12, fontWeight: '400' as const, color: colors.textTertiary },
  caption: { fontSize: 11, fontWeight: '500' as const },
  button: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.2 },
} as const;

export const elevation = {
  flat: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  fab: {
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
} as const;

export const motion = {
  fast: 150,
  medium: 220,
  slow: 320,
} as const;

export const interestMeta = {
  hot: { label: 'Hot', dot: colors.hotDot, tint: colors.hotTint, edge: colors.hotDot },
  warm: { label: 'Warm', dot: colors.warmDot, tint: colors.warmTint, edge: colors.warmDot },
  cold: { label: 'Cold', dot: colors.coldDot, tint: colors.coldTint, edge: colors.coldDot },
} as const;

export type InterestLevel = 'hot' | 'warm' | 'cold';
