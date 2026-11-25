// Genera nombres amigables tipo "Naranja Alegre" en lugar de mostrar una IP.
// Debe ser IDÉNTICO en escritorio y móvil.

const SUSTANTIVOS = [
  'Naranja', 'Manzana', 'Frutilla', 'Banana', 'Kiwi', 'Cereza',
  'Durazno', 'Limón', 'Mango', 'Pera', 'Uva', 'Sandía'
]

const ADJETIVOS = [
  'Alegre', 'Veloz', 'Tranquila', 'Brillante', 'Valiente', 'Curiosa',
  'Amable', 'Genial', 'Simpática', 'Audaz', 'Feliz', 'Serena'
]

function elegirAlAzar<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)]
}

export function generarAlias(): string {
  return `${elegirAlAzar(SUSTANTIVOS)} ${elegirAlAzar(ADJETIVOS)}`
}

export function generarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// "10.56.5.72" -> true. Sirve para validar lo que escriben en "Agregar por IP".
export function esIpValida(texto: string): boolean {
  const partes = texto.trim().split('.')
  return partes.length === 4 && partes.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255)
}
