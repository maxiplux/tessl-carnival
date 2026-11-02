/**
 * The carnival's colours, fonts and sizes, in the green, yellow, blue and white
 * of Brazil's flag. Games draw with these rather than their own values, so
 * every booth on the midway looks like it belongs.
 */
export const theme = {
  colors: {
    background: '#002776',
    surface: '#0b3c8c',
    text: '#fffdf2',
    muted: '#a9c4e8',
    accent: '#ffdf00',
    danger: '#ff5a5f',
    stripeA: '#009c3b',
    stripeB: '#fffdf2',
    water: '#5ec8f2',
    wood: '#8a5a3b',
  },
  font: {
    family: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
    small: 14,
    body: 18,
    title: 32,
  },
  radius: 12,
  canvas: {
    width: 800,
    height: 500,
  },
} as const;

/** Canvas font string, e.g. canvasFont('title') → 'bold 32px "Trebuchet MS", …'. */
export function canvasFont(size: 'small' | 'body' | 'title', weight: 'normal' | 'bold' = 'normal') {
  return `${weight} ${theme.font[size]}px ${theme.font.family}`;
}

/** Exposes the theme to CSS as custom properties, e.g. --color-accent. */
export function applyTheme(root: HTMLElement = document.documentElement) {
  for (const [name, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--color-${name}`, value);
  }
  root.style.setProperty('--font-family', theme.font.family);
  root.style.setProperty('--radius', `${theme.radius}px`);
}
