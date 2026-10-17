import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context/auth-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { lanzarTourPanel, tourYaVisto } from '@/lib/tour';

/**
 * Dispara el recorrido guiado del panel la PRIMERA vez que entra un
 * ADMIN o GERENTE. Va dentro del layout del panel (ahi existe el menu que
 * el tour resalta). No pinta nada; solo ejecuta el efecto.
 */
export function TourPanel() {
  const { tieneRol } = useAuth();
  const esMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    // En movil el menu lateral no esta en el DOM: el tour no tendria a que apuntar
    if (esMobile) return;
    if (!tieneRol('ADMIN', 'GERENTE')) return;
    if (tourYaVisto()) return;

    // Pequena espera para que el menu este pintado antes de resaltarlo
    const t = setTimeout(() => lanzarTourPanel(tieneRol('ADMIN'), navigate), 600);
    return () => clearTimeout(t);
  }, [esMobile, tieneRol, navigate]);

  return null;
}
