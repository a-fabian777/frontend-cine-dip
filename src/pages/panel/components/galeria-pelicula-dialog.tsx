import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { peliculaService } from '@/services/pelicula.service';
import { Pelicula } from '@/types/pelicula';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Galeria con las imagenes de una pelicula, en grande.
 * Se abre cuando `pelicula` tiene valor; reutiliza el Modal comun.
 */
export function GaleriaPeliculaDialog({
  pelicula,
  onCerrar,
}: {
  pelicula: Pelicula | null;
  onCerrar: () => void;
}) {
  const [actual, setActual] = useState(0);
  const imagenes = pelicula?.imagenes ?? [];
  const total = imagenes.length;

  // Cada pelicula se abre en su primera imagen (el poster)
  useEffect(() => {
    setActual(0);
  }, [pelicula]);

  // Con el modulo (%) al pasar de la ultima se vuelve a la primera
  const anterior = () => setActual((i) => (i - 1 + total) % total);
  const siguiente = () => setActual((i) => (i + 1) % total);

  // Flechas del teclado: lo natural en una galeria
  useEffect(() => {
    if (!pelicula || total < 2) return;
    function alPulsar(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') setActual((i) => (i - 1 + total) % total);
      if (e.key === 'ArrowRight') setActual((i) => (i + 1) % total);
    }
    window.addEventListener('keydown', alPulsar);
    // Se quita al cerrar: si no, las flechas seguirian cambiando la imagen
    return () => window.removeEventListener('keydown', alPulsar);
  }, [pelicula, total]);

  return (
    <Modal
      abierto={pelicula !== null}
      onCerrar={onCerrar}
      titulo={pelicula?.titulo ?? ''}
      descripcion={total > 1 ? `Imagen ${actual + 1} de ${total}` : undefined}
      ancho="lg"
    >
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Esta película no tiene imágenes.</p>
      ) : (
        <div className="space-y-4">
          <div className="relative flex items-center justify-center rounded-lg bg-muted">
            {/* object-contain: se ve la imagen entera, sin recortes */}
            <img
              src={peliculaService.urlImagen(imagenes[actual])}
              alt={`${pelicula?.titulo} - imagen ${actual + 1}`}
              className="max-h-[65vh] w-auto rounded-lg object-contain"
            />
            {total > 1 && (
              <>
                <Button
                  variant="outline"
                  mode="icon"
                  size="sm"
                  onClick={anterior}
                  className="absolute start-3 rounded-full bg-background/80"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  mode="icon"
                  size="sm"
                  onClick={siguiente}
                  className="absolute end-3 rounded-full bg-background/80"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight />
                </Button>
              </>
            )}
          </div>

          {/* Miniaturas para saltar directo a una imagen */}
          {total > 1 && (
            <div className="flex justify-center gap-2">
              {imagenes.map((nombre, i) => (
                <button
                  key={nombre}
                  type="button"
                  onClick={() => setActual(i)}
                  className={cn(
                    'aspect-[2/3] w-12 overflow-hidden rounded-md ring-2 transition-opacity',
                    i === actual ? 'ring-primary' : 'opacity-60 ring-transparent hover:opacity-100',
                  )}
                  aria-label={`Ver imagen ${i + 1}`}
                >
                  <img src={peliculaService.urlImagen(nombre)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
