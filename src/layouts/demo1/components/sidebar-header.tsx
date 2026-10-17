import { ChevronFirst } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';

export function SidebarHeader() {
  const { settings, storeOption } = useSettings();

  const handleToggleClick = () => {
    storeOption(
      'layouts.demo1.sidebarCollapse',
      !settings.layouts.demo1.sidebarCollapse,
    );
  };

  return (
    <div className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0">
      {/* El mismo logo sirve en claro y oscuro: el azul/amarillo se lee sobre
          ambos fondos. default-logo = menu expandido; small-logo = colapsado */}
      <Link to="/panel">
        <img
          src={toAbsoluteUrl('/media/app/descarga.png')}
          className="default-logo h-9 max-w-none"
          alt="Posgrado Cine"
        />
        {/* Colapsado solo cabe un icono: el logo completo con texto se veria cortado */}
        <img
          src={toAbsoluteUrl('/media/app/mini-logo.svg')}
          className="small-logo h-[22px] max-w-none"
          alt="Posgrado Cine"
        />
      </Link>
      <Button
        onClick={handleToggleClick}
        size="sm"
        mode="icon"
        variant="outline"
        className={cn(
          'size-7 absolute start-full top-2/4 rtl:translate-x-2/4 -translate-x-2/4 -translate-y-2/4',
          settings.layouts.demo1.sidebarCollapse
            ? 'ltr:rotate-180'
            : 'rtl:rotate-180',
        )}
      >
        <ChevronFirst className="size-4!" />
      </Button>
    </div>
  );
}
