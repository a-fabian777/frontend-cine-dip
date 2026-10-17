import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

/**
 * Boton claro/oscuro reutilizable (mismo que el panel, pero suelto).
 * resolvedTheme y no theme: con "system" dice como se ve de verdad.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  // Hasta montar en el navegador no se conoce el tema real: se evita
  // mostrar el icono equivocado por un instante
  useEffect(() => setMontado(true), []);

  const oscuro = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="sm"
      mode="icon"
      onClick={() => setTheme(oscuro ? 'light' : 'dark')}
      aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={oscuro ? 'Modo claro' : 'Modo oscuro'}
    >
      {montado && (oscuro ? <Sun /> : <Moon />)}
    </Button>
  );
}
