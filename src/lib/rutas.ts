/**
 * Devuelve `valor` solo si es una ruta interna de la app ("/funciones/17").
 *
 * El ?next= del login viene de la URL y cualquiera puede armar ese enlace.
 * Con "//sitio-malo.com", React Router intenta un pushState a otro dominio,
 * el navegador lo bloquea y React Router cae en window.location.assign():
 * el usuario terminaria en otro sitio justo despues de iniciar sesion.
 */
export function rutaInterna(valor: string | null): string | null {
  if (!valor || !valor.startsWith('/')) return null;
  // "//x" y "/\x": el navegador los lee como "otro dominio", no como ruta
  if (valor.startsWith('//') || valor.startsWith('/\\')) return null;
  return valor;
}
