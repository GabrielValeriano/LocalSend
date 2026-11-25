// Un archivo elegido para enviar: su ruta real en el disco y su peso.
// El peso sale del objeto File que da el navegador (drag & drop o el selector),
// así la lista muestra cuánto pesa cada archivo antes de enviarlo.
export interface ArchivoSeleccionado {
  ruta: string
  tamano: number
}
