import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/auth-context';

/**
 * Bloquea rutas segun el rol.
 *
 * Va siempre DENTRO de RequireAuth: ese ya resolvio la carga y la sesion,
 * aqui solo se pregunta "quien eres". No es seguridad: el backend igual
 * respondera 403; esto solo evita mostrar pantallas que no puede usar.
 */
export const RequireRole = ({ roles }: { roles: string[] }) => {
  const { tieneRol } = useAuth();

  if (!tieneRol(...roles)) {
    // Con sesion pero sin permiso: de vuelta a la zona publica
    return <Navigate to="/peliculas" replace />;
  }

  return <Outlet />;
};
