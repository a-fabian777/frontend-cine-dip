import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { AuthContext } from '@/auth/context/auth-context';
import { UsuarioSesion } from '@/types/auth';
import { authService } from '@/services/auth.service';
import { estaVencido, leerToken } from '@/lib/jwt';
import { MENSAJE_SESION_VENCIDA, registrarSesionVencida } from '@/lib/http';
import { toast } from 'sonner';

export function AuthProvider({ children }: PropsWithChildren) {
  // Empieza en true: hasta revisar el token no se sabe si hay sesion,
  // y asi RequireAuth espera en vez de mandar al login antes de tiempo
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UsuarioSesion | undefined>();

  const login = useCallback(async (usuario: string, contrasena: string) => {
    
    const token = await authService.login({usuario, contrasena});

    const payload = leerToken(token);

    if (!payload) {
      throw new Error('El token recibido no se puedo leer.');
    }

    authService.guardarToken(token);

    const sesion: UsuarioSesion = {
      id: payload.id,
      usuario: payload.usuario,
      roles: payload.roles,
    }

    setUser(sesion);
    return sesion;
  }, []);

  const logout = useCallback(() => {
    // Sin esto el token queda guardado y el F5 vuelve a abrir la sesion
    authService.borrarToken();
    setUser(undefined);
  }, []);

  // Cierre que NO pidio el usuario: hay que explicarle por que salio
  const cerrarPorVencimiento = useCallback(() => {
    // Si ya no hay token, ya se cerro: el dashboard lanza 20+ peticiones a la
    // vez y todas pueden volver con 401; asi solo la primera hace algo
    if (!authService.obtenerToken()) return;
    logout();
    toast.warning(MENSAJE_SESION_VENCIDA, { id: MENSAJE_SESION_VENCIDA });
  }, [logout]);

  // http.ts no conoce React: se le pasa la funcion a la que debe avisar
  // cuando el backend responda 401 (token vencido o invalido)
  useEffect(() => {
    registrarSesionVencida(cerrarPorVencimiento);
    return () => registrarSesionVencida(null);
  }, [cerrarPorVencimiento]);

  // Temporizador hasta el "exp" del token: la sesion se cierra a su hora,
  // sin esperar a que falle una peticion. El 401 queda como respaldo
  useEffect(() => {
    if (!user) return;
    const token = authService.obtenerToken();
    const payload = token ? leerToken(token) : null;
    if (!payload?.exp) return;

    const restante = payload.exp * 1000 - Date.now();
    const temporizador = setTimeout(cerrarPorVencimiento, Math.max(restante, 0));
    // Si cierra sesion antes (o cambia de usuario), el temporizador viejo se cancela
    return () => clearTimeout(temporizador);
  }, [user, cerrarPorVencimiento]);


  const tieneRol = useCallback(
    (...roles: string[])  => roles.some((rol) => user?.roles.includes(rol)),
    [user]
  )

  // Al recargar (F5) React pierde el estado, pero el token sigue en
  // localStorage: se lee de ahi para reconstruir la sesion
  useEffect(() => {
    const token = authService.obtenerToken();
    const payload = token ? leerToken(token) : null;

    if (payload && !estaVencido(payload)) {
      setUser({
        id: payload.id,
        usuario: payload.usuario,
        roles: payload.roles,
      });
    } else if (token) {
      // Token roto o vencido: ya no sirve, mejor no dejarlo guardado
      authService.borrarToken();
    }

    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loading,
        isAuthenticated: user !== undefined,
        user,
        login,
        logout,
        tieneRol,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
