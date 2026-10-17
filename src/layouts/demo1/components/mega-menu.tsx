import { Link, useLocation } from 'react-router-dom';
import { MENU_MEGA } from '@/config/menu.config';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';

/**
 * Menú superior.
 *
 * La versión de la plantilla leía posiciones fijas (MENU_MEGA[0] … MENU_MEGA[5])
 * para armar los desplegables de las páginas demo. Al quedar menos entradas,
 * esos índices devolvían undefined y la aplicación reventaba al montar.
 * Ahora simplemente recorre la lista, así el menú puede crecer o encogerse
 * sin tocar este componente.
 */
export function MegaMenu() {
  const { pathname } = useLocation();
  const { isActive } = useMenu(pathname);

  const linkClass = `
    text-sm text-secondary-foreground font-medium px-3
    hover:text-primary hover:bg-transparent
    focus:text-primary focus:bg-transparent
    data-[active=true]:text-primary data-[active=true]:bg-transparent
  `;

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-0">
        {MENU_MEGA.filter((item) => !item.disabled).map((item, index) => (
          <NavigationMenuItem key={item.path ?? index}>
            <NavigationMenuLink asChild>
              <Link
                to={item.path || '/'}
                className={cn(linkClass, 'flex-row items-center gap-1.5')}
                data-active={isActive(item.path) || undefined}
              >
                {item.icon && <item.icon className="size-4" />}
                {item.title}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
