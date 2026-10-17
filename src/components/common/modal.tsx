import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ANCHOS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const;

/**
 * Cascaron de modal reutilizable.
 *
 * Solo pone el marco (titulo, descripcion, contenido con scroll y pie);
 * lo de adentro lo decide quien lo usa. Asi el modal de roles, el de
 * nueva pelicula y los que vengan se ven y se comportan igual.
 *
 * Uso:
 *   <Modal abierto={x} onCerrar={() => setX(false)} titulo="..." pie={<Button/>}>
 *     contenido
 *   </Modal>
 */
export function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  pie,
  ancho = 'sm',
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: ReactNode;
  // Botones de abajo. Si es un formulario, el boton de enviar usa
  // form="id-del-form" para enviarlo aunque este fuera del <form>
  pie?: ReactNode;
  ancho?: keyof typeof ANCHOS;
  children: ReactNode;
}) {
  return (
    // onOpenChange avisa tambien al pulsar la X, Escape o fuera del modal
    <Dialog open={abierto} onOpenChange={(abre) => !abre && onCerrar()}>
      <DialogContent className={cn(ANCHOS[ancho], 'max-h-[90vh]')}>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {descripcion && <DialogDescription>{descripcion}</DialogDescription>}
        </DialogHeader>

        {/* Con formularios largos el scroll va aqui: el titulo y el pie quedan fijos */}
        <DialogBody className="-mx-6 overflow-y-auto px-6">{children}</DialogBody>

        {pie && <DialogFooter>{pie}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
