import { createContext, useContext } from 'react';
import { UsuarioSesion } from '@/types/auth';

interface AuthContextValue {
  /** true mientras se comprueba si hay sesion. Hoy nunca tarda, pero la
   *  pantalla de carga ya esta lista para cuando el login sea real. */
  loading: boolean;
  isAuthenticated: boolean;
  user?: UsuarioSesion;
  // Devuelve la sesion para que el formulario decida a donde ir segun el rol
  login: (usuario: string, contrasena: string) => Promise<UsuarioSesion>;
  logout: () => void;
  tieneRol: (...roles: string[]) => boolean;
}

/**
 * Contrato de la sesion.
 *
 * Esta es la pieza que el resto de la aplicacion consume: la cabecera para
 * mostrar el nombre, RequireAuth para bloquear rutas, el formulario para
 * entrar. Ninguno de ellos sabe de donde salen los datos, y esa es la idea:
 * el dia que el login pase a consultar una API de verdad, solo cambia el
 * proveedor y nada mas.
 */
export const AuthContext = createContext<AuthContextValue>({
  loading: false,
  isAuthenticated: false,
  // Solo se usa si alguien queda fuera del proveedor: mejor avisar que fingir
  login: async () => {
    throw new Error('useAuth se uso fuera de AuthProvider');
  },
  logout: () => {},
  tieneRol: () => false,
});

export function useAuth() {
  return useContext(AuthContext);
}
