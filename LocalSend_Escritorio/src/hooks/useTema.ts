import { useEffect, useState } from 'react'
import { variablesCss, type ModoTema } from '../compartido/tema'

const CLAVE = 'localsend:tema'
const consultaOscuro = window.matchMedia('(prefers-color-scheme: dark)')

function leerModo(): ModoTema {
  try {
    return (localStorage.getItem(CLAVE) as ModoTema) || 'sistema'
  } catch {
    return 'sistema'
  }
}

// Aplica la paleta de compartido/tema.ts como variables CSS en <html>.
// Así estilos.css usa hsl(var(--primary)) con LOS MISMOS colores que el celular.
function aplicarPaleta(esOscuro: boolean): void {
  const raiz = document.documentElement
  Object.entries(variablesCss(esOscuro)).forEach(([nombre, valor]) => raiz.style.setProperty(nombre, valor))
  raiz.style.colorScheme = esOscuro ? 'dark' : 'light'
}

// Aplicamos la paleta apenas carga el archivo, para que no "parpadee" el color al abrir
const modoInicial = leerModo()
aplicarPaleta(modoInicial === 'oscuro' || (modoInicial === 'sistema' && consultaOscuro.matches))

export function useTema() {
  const [modo, setModo] = useState<ModoTema>(leerModo)
  const [sistemaOscuro, setSistemaOscuro] = useState(consultaOscuro.matches)
  const esOscuro = modo === 'oscuro' || (modo === 'sistema' && sistemaOscuro)

  // Si el modo es "Sistema", seguimos los cambios del sistema operativo en vivo
  useEffect(() => {
    const alCambiar = (e: MediaQueryListEvent) => setSistemaOscuro(e.matches)
    consultaOscuro.addEventListener('change', alCambiar)
    return () => consultaOscuro.removeEventListener('change', alCambiar)
  }, [])

  useEffect(() => aplicarPaleta(esOscuro), [esOscuro])

  function cambiarModo(nuevo: ModoTema): void {
    setModo(nuevo)
    try {
      localStorage.setItem(CLAVE, nuevo)
    } catch {
      // si no hay almacenamiento, el tema dura hasta cerrar la app
    }
  }

  return { modo, cambiarModo, esOscuro }
}
