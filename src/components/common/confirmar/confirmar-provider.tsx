import { PropsWithChildren, useCallback, useRef, useState } from 'react';
import { CircleHelp, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Confirmar, ConfirmarContext, OpcionesConfirmar } from './confirmar-context';

/**
 * Una sola ventana de confirmacion para toda la app (AlertDialog de la
 * plantilla). Va en App.tsx; las pantallas solo usan useConfirmar().
 */
export function ConfirmarProvider({ children }: PropsWithChildren) {
  const [opciones, setOpciones] = useState<OpcionesConfirmar | null>(null);
  // Guarda el "resolve" de la promesa pendiente: lo llama el boton que se pulse
  const resolver = useRef<((respuesta: boolean) => void) | null>(null);

  const confirmar = useCallback<Confirmar>((nuevas) => {
    setOpciones(nuevas);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function responder(respuesta: boolean) {
    // Se limpia al responder: al cerrarse, la ventana avisa otra vez
    // (onOpenChange) y esa segunda llamada ya no hace nada
    resolver.current?.(respuesta);
    resolver.current = null;
    setOpciones(null);
  }

  const Icono = opciones?.peligroso ? TriangleAlert : CircleHelp;

  return (
    <ConfirmarContext.Provider value={confirmar}>
      {children}

      {/* Escape o clic afuera = cancelar */}
      <AlertDialog open={opciones !== null} onOpenChange={(abierto) => !abierto && responder(false)}>
        <AlertDialogContent className="max-w-sm">
          {/* Centrado y con icono grande, al estilo de las alertas clasicas */}
          <AlertDialogHeader className="items-center sm:text-center">
            <span
              className={cn(
                'mb-2 flex size-14 items-center justify-center rounded-full',
                opciones?.peligroso ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
              )}
            >
              <Icono className="size-7" />
            </span>
            <AlertDialogTitle>{opciones?.titulo}</AlertDialogTitle>
            {opciones?.descripcion && (
              <AlertDialogDescription>{opciones.descripcion}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-center">
            <AlertDialogCancel onClick={() => responder(false)}>
              {opciones?.textoCancelar ?? 'Cancelar'}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={opciones?.peligroso ? 'destructive' : 'primary'}
              onClick={() => responder(true)}
            >
              {opciones?.textoConfirmar ?? 'Aceptar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmarContext.Provider>
  );
}
