import { useEffect, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { carteleraService } from '@/services/cartelera.service';
import { Funcion } from '@/types/cartelera';
import { Pelicula } from '@/types/pelicula';
import { peliculaService } from '@/services/pelicula.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { FuncionNuevaDialog } from './funcion-nueva-dialog';

// "2026-09-17" → "17/09"
const diaMes = (fecha: string) => fecha.slice(5).split('-').reverse().join('/');

/**
 * Panel lateral con el detalle de UNA pelicula y sus funciones, con el
 * boton para agregarle mas. Se abre cuando `pelicula` tiene valor.
 * Es el "detalle" del panel: asi el personal no sale al sitio publico.
 *
 * onCambio avisa a la tabla de peliculas que hay una funcion nueva,
 * para que actualice su conteo.
 */
export function FuncionesPeliculaSheet({
  pelicula,
  onCerrar,
  onCambio,
}: {
  pelicula: Pelicula | null;
  onCerrar: () => void;
  onCambio: () => void;
}) {
  const [funciones, setFunciones] = useState<Funcion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  // Contador que solo sirve para volver a pedir la lista tras crear una
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (!pelicula) return;
    setCargando(true);
    setError(null);
    // El backend ya filtra por pelicula: no hace falta traer todas
    carteleraService.listarFunciones(pelicula.id)
      .then((respuesta) => {
        setFunciones(
          respuesta.sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio)),
        );
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [pelicula, recarga]);

  function alCrear() {
    setRecarga((r) => r + 1);
    onCambio();
  }

  return (
    <>
      <Sheet open={pelicula !== null} onOpenChange={(abre) => !abre && onCerrar()}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{pelicula?.titulo}</SheetTitle>
            <SheetDescription>Detalle y funciones programadas</SheetDescription>
          </SheetHeader>

          {/* grow + overflow: el contenido hace scroll y el boton de abajo queda fijo */}
          <SheetBody className="grow space-y-6 overflow-y-auto">
            {pelicula && (
              <div className="flex gap-4">
                <div className="aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {pelicula.imagenes[0] && (
                    <img
                      src={peliculaService.urlImagen(pelicula.imagenes[0])}
                      alt={pelicula.titulo}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2 text-secondary-foreground">
                    <span>{pelicula.duracionMinutos} min</span>
                    <span>·</span>
                    {/* Viene en ISO completa: solo interesa la fecha */}
                    <span>Estreno {pelicula.fechaEstreno.slice(0, 10)}</span>
                    <Badge variant={pelicula.activo ? 'success' : 'secondary'} appearance="light" size="sm">
                      {pelicula.activo ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{pelicula.sinopsis}</p>
                </div>
              </div>
            )}

            <h3 className="text-sm font-semibold text-mono">
              Funciones ({funciones.length})
            </h3>
            {error && <p className="text-sm text-destructive">{error}</p>}

            {cargando ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : funciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no tiene funciones. Agrega la primera.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {funciones.map((f) => (
                  <li key={f.idFuncion} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-mono">
                        {diaMes(f.fecha)} · {f.horaInicio.slice(0, 5)}–{f.horaFin.slice(0, 5)}
                      </p>
                      <p className="text-xs text-muted-foreground">{f.sala} · {f.tipoSala}</p>
                    </div>
                    <span className="font-medium text-mono">Bs {f.precio}</span>
                  </li>
                ))}
              </ul>
            )}
          </SheetBody>

          <SheetFooter>
            {/* El backend rechaza funciones de peliculas inactivas: mejor avisar aqui */}
            {pelicula && !pelicula.activo ? (
              <p className="w-full text-center text-sm text-muted-foreground">
                La película está inactiva: no se le pueden programar funciones.
              </p>
            ) : (
              <Button className="w-full" onClick={() => setModalAbierto(true)}>
                <CalendarPlus className="size-4" /> Agregar función
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* El modal se abre encima del panel; al cerrarlo, la lista ya esta actualizada */}
      <FuncionNuevaDialog
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onCreada={alCrear}
        idPeliculaFija={pelicula?.id}
      />
    </>
  );
}
