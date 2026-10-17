import { ReactNode } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Moon, PanelLeft } from 'lucide-react';
import { lanzarTourPanel } from '@/lib/tour';
import { useTheme } from 'next-themes';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

/**
 * Menú de la esquina superior derecha.
 *
 * Se quitaron los enlaces de la plantilla (perfil, facturación, equipos…)
 * porque apuntaban a páginas demo que ya no existen. Quedan las opciones que
 * sí funcionan: idioma, tema oscuro y cerrar sesión.
 */
export function UserDropdownMenu({ trigger }: { trigger: ReactNode }) {
  const { logout, user, tieneRol } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { settings, storeOption } = useSettings();
  const menuOscuro = settings.layouts.demo1.sidebarTheme === 'dark';

  const nombre = user?.usuario ?? 'Usuario';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" side="bottom" align="end">
        {/* Identidad */}
        <div className="flex flex-col gap-1 p-3">
          <span className="text-sm font-semibold text-mono">{nombre}</span>
          <span className="text-xs text-muted-foreground">
            Sesion de prueba
          </span>
        </div>

        <DropdownMenuSeparator />

        {/* Tema oscuro */}
        <DropdownMenuItem
          className="flex items-center justify-between"
          onSelect={(e) => e.preventDefault()}
        >
          <span className="flex items-center">
            <Moon className="size-4 me-2" />
            Modo oscuro
          </span>
          <Switch
            size="sm"
            // resolvedTheme y no theme: con "system" (el valor por defecto),
            // theme no dice si de verdad se ve oscuro
            checked={resolvedTheme === 'dark'}
            onCheckedChange={(activo) => setTheme(activo ? 'dark' : 'light')}
          />
        </DropdownMenuItem>

        {/* Solo el menu lateral en oscuro, con el contenido claro. La plantilla
            ya lo soportaba (sidebar.tsx le pone la clase "dark"); faltaba el control */}
        <DropdownMenuItem
          className="flex items-center justify-between"
          onSelect={(e) => e.preventDefault()}
        >
          <span className="flex items-center">
            <PanelLeft className="size-4 me-2" />
            Menú lateral oscuro
          </span>
          <Switch
            size="sm"
            // Con todo en modo oscuro el menu ya es oscuro: el control no aplica
            disabled={resolvedTheme === 'dark'}
            checked={resolvedTheme === 'dark' || menuOscuro}
            // storeOption lo guarda en localStorage: sobrevive al F5
            onCheckedChange={(activo) =>
              storeOption('layouts.demo1.sidebarTheme', activo ? 'dark' : 'light')
            }
          />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Repite el recorrido guiado del panel cuando el usuario quiera */}
        <DropdownMenuItem onClick={() => lanzarTourPanel(tieneRol('ADMIN'), navigate)}>
          <HelpCircle className="size-4 me-2" />
          Ver guía del panel
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="p-2">
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
