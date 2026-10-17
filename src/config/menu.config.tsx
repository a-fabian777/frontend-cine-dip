import {
  CalendarDays,
  Clapperboard,
  Globe,
  Home,
  Users,
} from 'lucide-react';
import { type MenuConfig } from './types';

/**
 * Menú de la aplicación de cine.
 *
 * Las rutas que aún no existen quedan con `disabled: true` para que se vean
 * en la barra lateral pero no lleven a un 404. Al construir cada pantalla, se
 * quita esa bandera y se agrega la ruta en `app-routing-setup.tsx`.
 *
 */
export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Inicio',
    icon: Home,
    path: '/panel',
  },
  { heading: 'Cartelera' },
  {
    title: 'Funciones',
    icon: CalendarDays,
    path: '/panel/funciones',
  },
  {
    title: 'Películas',
    icon: Clapperboard,
    // La tabla del panel; desde ahi esta el boton "Nueva pelicula"
    path: '/panel/peliculas',
  },
  // Sin seccion "Ventas": se reserva desde la zona publica y el backend
  // no tiene endpoint para listar reservas (solo POST /reservas)
  { heading: 'Administración' },
  {
    title: 'Personas',
    icon: Users,
    path: '/panel/personas',
  },
];

/**
 * Menu superior del panel. No repite el lateral: solo lleva de vuelta al
 * sitio publico, la contraparte del boton "Panel" de la cabecera publica.
 */
export const MENU_MEGA: MenuConfig = [
  { title: 'Ver sitio público', icon: Globe, path: '/peliculas' },
];

export const MENU_MEGA_MOBILE: MenuConfig = MENU_MEGA;
