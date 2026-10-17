import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { peliculaService } from '@/services/pelicula.service';
import { Modal } from '@/components/common/modal';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinners';
import { Textarea } from '@/components/ui/textarea';
import { getPeliculaSchema, PeliculaSchemaType } from '../forms/pelicula-schema';

// Mismos limites que el backend (multer): avisar aqui evita subir para nada
const MAX_IMAGENES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

// El boton "Crear" vive en el pie del modal, fuera del <form>: se enlaza por id
const ID_FORM = 'form-nueva-pelicula';

const VACIO: PeliculaSchemaType = {
  titulo: '',
  sinopsis: '',
  duracionMinutos: '',
  fechaEstreno: '',
  activo: true,
};

/**
 * Modal de "nueva pelicula". Quien lo abre decide que hacer al crearla
 * (onCreada): la tabla del panel, por ejemplo, se recarga.
 */
export function PeliculaNuevaDialog({
  abierto,
  onCerrar,
  onCreada,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onCreada: () => void;
}) {
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [errorImagenes, setErrorImagenes] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PeliculaSchemaType>({
    resolver: zodResolver(getPeliculaSchema()),
    defaultValues: VACIO,
  });

  // Cada vez que se abre, empieza limpio (no quedan datos de la vez anterior)
  useEffect(() => {
    if (!abierto) return;
    form.reset(VACIO);
    setImagenes([]);
    setErrorImagenes(null);
    setError(null);
  }, [abierto, form]);

  // Vista previa sin subir nada: el navegador crea una URL local por archivo
  const previas = useMemo(() => imagenes.map((img) => URL.createObjectURL(img)), [imagenes]);

  // Esas URL ocupan memoria hasta que se liberan: al cambiar o salir, se sueltan
  useEffect(() => {
    return () => previas.forEach((url) => URL.revokeObjectURL(url));
  }, [previas]);

  function elegirImagenes(e: ChangeEvent<HTMLInputElement>) {
    const nuevas = Array.from(e.target.files ?? []);
    // Se vacia el input para poder volver a elegir el mismo archivo
    e.target.value = '';
    setErrorImagenes(null);

    const invalida = nuevas.find((img) => !TIPOS.includes(img.type));
    if (invalida) {
      setErrorImagenes(`"${invalida.name}" no es jpg, png ni webp`);
      return;
    }
    const pesada = nuevas.find((img) => img.size > MAX_BYTES);
    if (pesada) {
      setErrorImagenes(`"${pesada.name}" pesa más de 5 MB`);
      return;
    }
    const todas = [...imagenes, ...nuevas];
    if (todas.length > MAX_IMAGENES) {
      setErrorImagenes(`Máximo ${MAX_IMAGENES} imágenes`);
      return;
    }
    setImagenes(todas);
  }

  function quitarImagen(indice: number) {
    setImagenes(imagenes.filter((_, i) => i !== indice));
  }

  async function onSubmit(values: PeliculaSchemaType) {
    try {
      setProcesando(true);
      setError(null);

      const nueva = { ...values, duracionMinutos: Number(values.duracionMinutos) };

      const respuesta = await peliculaService.crearPelicula(nueva, imagenes);

      // El backend la guarda en MAYUSCULAS: se muestra como quedo de verdad
      toast.success('Película creada', { description: respuesta.data.titulo });
      onCreada();
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la película.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      // Mientras sube no se cierra: cortaria la subida a medias
      onCerrar={() => !procesando && onCerrar()}
      titulo="Nueva película"
      ancho="lg"
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={procesando}>
            Cancelar
          </Button>
          <Button type="submit" form={ID_FORM} disabled={procesando}>
            {procesando && <Spinner className="me-2 h-4 w-4 animate-spin" />}
            {procesando ? 'Subiendo…' : 'Crear película'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertIcon>
              <AlertCircle className="h-4 w-4" />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <Form {...form}>
          <form id={ID_FORM} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Paw Patrol: la dino película" disabled={procesando} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sinopsis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sinopsis</FormLabel>
                  <FormControl>
                    <Textarea rows={3} disabled={procesando} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duracionMinutos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración (min)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" step="1" placeholder="100" disabled={procesando} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fechaEstreno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estreno</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={procesando} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                // flex-row: FormItem trae flex-col y dejaba la casilla encima del texto
                <FormItem className="flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                      disabled={procesando}
                    />
                  </FormControl>
                  {/* Solo las activas se pueden programar en funciones */}
                  <FormLabel>Activa (se puede programar)</FormLabel>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Imágenes ({imagenes.length}/{MAX_IMAGENES}) — la primera será el póster
              </p>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={procesando || imagenes.length >= MAX_IMAGENES}
                onChange={elegirImagenes}
              />
              {errorImagenes && <p className="text-sm text-destructive">{errorImagenes}</p>}

              {previas.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {previas.map((url, i) => (
                    <div key={url} className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted">
                      <img src={url} alt={imagenes[i].name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => quitarImagen(i)}
                        disabled={procesando}
                        className="absolute end-1 top-1 rounded-full bg-background/80 p-0.5 hover:bg-background"
                        aria-label="Quitar imagen"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </Form>
      </div>
    </Modal>
  );
}
