// RideX design system — midnight navy with violet brand accents.

export const Colors = {
  // ── Backgrounds ────────────────────────────────────────────────────────────
  bg: {
    primary:     '#080D19',
    secondary:   '#0D1526',
    tertiary:    '#142039',
    card:        'rgba(20,32,57,0.78)',
    cardHover:   'rgba(29,43,70,0.92)',
    cardBorder:  'rgba(148,163,184,0.18)',
    overlay:     'rgba(8,13,25,0.94)',
    glass:       'rgba(20,32,57,0.72)',
    glassBorder: 'rgba(148,163,184,0.22)',
  },

  // ── Brand Palette (Electric Violet → Royal Blue) ────────────────────────
  brand: {
    start:   '#8B5CF6',   // Electric violet
    mid:     '#6D28D9',   // Violet mid
    end:     '#2563EB',   // Royal blue
    accent:  '#A78BFA',   // Light violet for text/highlights
    glow:    'rgba(139,92,246,0.25)',
    glowStrong: 'rgba(139,92,246,0.45)',
  },

  // ── Text ────────────────────────────────────────────────────────────────
  text: {
    primary:   '#F1F5F9',   // Near-white — 94A3B8-to-F1F5F9 on dark bg
    secondary: '#94A3B8',   // Slate-400 — passes 4.5:1 on #09090F
    muted:     '#A0AEC0',   // Secondary labels remain legible on navy surfaces
    inverse:   '#09090F',
    brand:     '#A78BFA',   // Violet accent text
    success:   '#34D399',
    warning:   '#FBBF24',
    danger:    '#F87171',
  },

  // ── Status ────────────────────────────────────────────────────────────
  status: {
    success:    '#10B981',
    successBg:  'rgba(16,185,129,0.12)',
    successBorder: 'rgba(16,185,129,0.25)',
    warning:    '#F59E0B',
    warningBg:  'rgba(245,158,11,0.12)',
    warningBorder: 'rgba(245,158,11,0.25)',
    danger:     '#EF4444',
    dangerBg:   'rgba(239,68,68,0.12)',
    dangerBorder: 'rgba(239,68,68,0.25)',
    info:       '#3B82F6',
    infoBg:     'rgba(59,130,246,0.12)',
    infoBorder: 'rgba(59,130,246,0.25)',
  },

  white: '#FFFFFF',
  black: '#000000',
  border: 'rgba(148,163,184,0.18)',
  borderLight: 'rgba(148,163,184,0.26)',
};

export const Gradients = {
  // Brand
  brand:       ['#8B5CF6', '#2563EB'] as [string, string],
  brandSoft:   ['rgba(139,92,246,0.75)', 'rgba(37,99,235,0.75)'] as [string, string],
  brandReverse: ['#2563EB', '#8B5CF6'] as [string, string],
  brandTriple: ['#8B5CF6', '#6D28D9', '#2563EB'] as [string, string, string],

  // Dark overlays
  darkOverlay: ['transparent', 'rgba(9,9,15,0.98)'] as [string, string],
  darkCard:    ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)'] as [string, string],
  midnight:    ['#09090F', '#0E0E1C', '#09090F'] as [string, string, string],

  // Status
  success: ['#10B981', '#059669'] as [string, string],
  danger:  ['#EF4444', '#DC2626'] as [string, string],
  warning: ['#F59E0B', '#D97706'] as [string, string],

  // Role-specific
  passenger: ['#8B5CF6', '#6D28D9'] as [string, string],
  driver:    ['#059669', '#047857'] as [string, string],
  admin:     ['#D97706', '#B45309'] as [string, string],

  // Ambient / Glow
  violetGlow:  ['rgba(139,92,246,0.15)', 'transparent'] as [string, string],
  blueGlow:    ['rgba(37,99,235,0.15)', 'transparent'] as [string, string],
};

export const Typography = {
  display: { fontSize: 40, fontWeight: '900' as const, lineHeight: 48, letterSpacing: -1.5 },
  hero:    { fontSize: 32, fontWeight: '800' as const, lineHeight: 40, letterSpacing: -0.8 },
  title:   { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.4 },
  subtitle:{ fontSize: 20, fontWeight: '600' as const, lineHeight: 28, letterSpacing: -0.2 },
  heading: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  body:    { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  small:   { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  tiny:    { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label:   { fontSize: 13, fontWeight: '500' as const, lineHeight: 18, letterSpacing: 0.1 },
  caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  mono:    { fontSize: 13, fontWeight: '600' as const, letterSpacing: 1 },
};

export const Spacing = {
  xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48, xxxxl: 64,
};

export const Radius = {
  xs: 6, sm: 10, md: 14, lg: 18, xl: 24, xxl: 32, full: 9999,
};

export const Elevation = {
  // Simulated depth with shadow + glow
  low:  { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,  elevation: 4 },
  mid:  { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  high: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 32, elevation: 16 },
  glow: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.50, shadowRadius: 24, elevation: 20 },
};

export const Animation = {
  // Durations (ms)
  fast:    150,
  normal:  250,
  slow:    400,
  slower:  600,
  // Spring configs
  spring: { damping: 15, stiffness: 120, mass: 0.8 },
  springBouncy: { damping: 10, stiffness: 100, mass: 0.6 },
  springSnappy: { damping: 20, stiffness: 180, mass: 1 },
};
