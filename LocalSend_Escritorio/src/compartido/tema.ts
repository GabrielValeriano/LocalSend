// Paleta de colores de LocalSend (verde azulado, estilo Material 3).
// Debe ser IDÉNTICO en escritorio y móvil: es la ÚNICA fuente de colores.
//
// Los valores están en HSL sin "hsl()" ("174 100% 21%") porque así los usan
// tanto Tailwind/NativeWind (móvil) como el CSS (escritorio): hsl(var(--primary)).

export type ModoTema = 'sistema' | 'claro' | 'oscuro'

const claro = {
  background: '165 20% 98%',
  foreground: '180 6% 11%',
  card: '0 0% 100%',
  'card-foreground': '180 6% 11%',
  popover: '0 0% 100%',
  'popover-foreground': '180 6% 11%',
  primary: '174 100% 21%',
  'primary-foreground': '0 0% 100%',
  secondary: '168 33% 90%',
  'secondary-foreground': '174 60% 15%',
  muted: '170 15% 93%',
  'muted-foreground': '180 5% 40%',
  accent: '168 33% 90%',
  'accent-foreground': '174 60% 15%',
  destructive: '0 72% 51%',
  'destructive-foreground': '0 0% 100%',
  border: '170 12% 85%',
  input: '170 12% 85%',
  ring: '174 100% 21%'
}

type Paleta = typeof claro

const oscuro: Paleta = {
  background: '180 5% 10%',
  foreground: '160 10% 90%',
  card: '180 5% 14%',
  'card-foreground': '160 10% 90%',
  popover: '180 5% 14%',
  'popover-foreground': '160 10% 90%',
  primary: '172 63% 59%',
  'primary-foreground': '174 100% 11%',
  secondary: '175 25% 22%',
  'secondary-foreground': '168 50% 85%',
  muted: '180 5% 18%',
  'muted-foreground': '170 6% 65%',
  accent: '175 25% 22%',
  'accent-foreground': '168 50% 85%',
  destructive: '0 70% 62%',
  'destructive-foreground': '0 0% 100%',
  border: '180 5% 24%',
  input: '180 5% 24%',
  ring: '172 63% 59%'
}

export const PALETAS = { claro, oscuro }

// { '--primary': '174 100% 21%', ... } listo para usar como variables CSS
export function variablesCss(esOscuro: boolean): Record<string, string> {
  const paleta = esOscuro ? oscuro : claro
  return Object.fromEntries(Object.entries(paleta).map(([nombre, valor]) => [`--${nombre}`, valor]))
}

// Color listo para usar donde no llegan las clases (ej: color de un ícono nativo)
export function color(nombre: keyof Paleta, esOscuro: boolean): string {
  return `hsl(${(esOscuro ? oscuro : claro)[nombre].replace(/ /g, ', ')})`
}
