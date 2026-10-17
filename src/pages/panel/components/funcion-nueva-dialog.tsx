import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { carteleraService } from '@/services/cartelera.service';
import { peliculaService } from '@/services/pelicula.service';
import { Sala } from '@/types/cartelera';
import { Pelicula } from '@/types/pelicula';
import { Modal } from '@/components/common/modal';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinners';
import { FuncionSchemaType, getFuncionSchema } from '../forms/funcion-schema';

// El boton "Programar" vive en el pie del modal, fuera del <form>: se enlaza por id
const ID_FORM = 'form-nueva-funcion';

const VACIO: FuncionSchemaType = {
  idPelicula: '',
  idSala: '',
  fecha: '',
  horaInicio: '',
  horaFin: '',
  precio: '',
};

// El input time da "19:00" y el backend exige "19:00:00"
function conSegundos(hora: string): string {
  return hora.length === 5 ? `${hora}:00` : hora;
}

// "14:00" + 100 min = "15:40". Si pasa de medianoche devuelve '':
// el backend exige que inicio y fin sean del mismo dia
function sumarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  if (total >= 24 * 60) return '';
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Modal de "programar funcion". Quien lo abre decide que hacer al crearla
 * (onCreada): la tabla de funciones, por ejemplo, se recarga.
 *
 * Con idPeliculaFija la pelicula llega elegida y no se puede cambiar:
 * asi se usa desde el panel de funciones de una pelicula.
 */
export function FuncionNuevaDialog({
  abierto,
  onCerrar,
  onCreada,
  idPeliculaFija,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onCreada: () => void;
  idPeliculaFija?: number;
}) {
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FuncionSchemaType>({
    resolver: zodResolver(getFuncionSchema()),
    defaultValues: VACIO,
  });

  // Cada vez que se abre, empieza limpio (no quedan datos de la vez anterior)
  useEffect(() => {
    if (!abierto) return;
    form.reset({ ...VACIO, idPelicula: idPeliculaFija ? String(idPeliculaFija) : '' });
    setError(null);
  }, [abierto, form, idPeliculaFija]);

  // Peliculas y salas se piden la primera vez que se abre, no al entrar a la
  // tabla: quien solo mira el listado no gasta esas peticiones
  useEffect(() => {
    if (!abierto || salas.length > 0) return;
    Promise.all([
      peliculaService.listarPeliculas(1, 100),
      carteleraService.listarSalas(),
    ])
      .then(([respuesta, salasHalladas]) => {
        // Solo lo activo: el backend rechaza peliculas y salas inactivas
        setPeliculas(respuesta.data.filter((p) => p.activo));
        setSalas(salasHalladas.filter((s) => s.activa));
      })
      .catch((e: Error) => setError(e.message));
  }, [abierto, salas.length]);

  // Sugiere la hora de fin con la duracion de la pelicula; se puede corregir
  function sugerirFin(idPelicula: string, horaInicio: string) {
    const pelicula = peliculas.find((p) => String(p.id) === idPelicula);
    if (!pelicula || !horaInicio) return;
    form.setValue('horaFin', sumarMinutos(horaInicio, pelicula.duracionMinutos));
  }

  async function onSubmit(values: FuncionSchemaType) {
    try {
      setProcesando(true);
      setError(null);

      const nueva = {
        idPelicula: Number(values.idPelicula),
        idSala: Number(values.idSala),
        fecha: values.fecha,
        horaInicio: conSegundos(values.horaInicio),
        horaFin: conSegundos(values.horaFin),
        precio: Number(values.precio),
      };

      await carteleraService.crearFuncion(nueva);

      // La respuesta no trae el titulo: se toma de la lista del desplegable
      const pelicula = peliculas.find((p) => p.id === nueva.idPelicula);
      toast.success('Función programada', {
        description: `${pelicula?.titulo ?? ''} · ${nueva.fecha} a las ${nueva.horaInicio.slice(0, 5)}`,
      });
      onCreada();
      onCerrar();
    } catch (err) {
      // El 409 llega aqui con su mensaje: "La sala ya tiene una funcion en ese horario"
      setError(err instanceof Error ? err.message : 'No se pudo programar la función.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      // Mientras guarda no se cierra: el usuario no sabria si se creo o no
      onCerrar={() => !procesando && onCerrar()}
      titulo="Programar función"
      ancho="md"
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={procesando}>
            Cancelar
          </Button>
          <Button type="submit" form={ID_FORM} disabled={procesando}>
            {procesando && <Spinner className="me-2 h-4 w-4 animate-spin" />}
            {procesando ? 'Guardando…' : 'Programar función'}
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
              name="idPelicula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Película</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(valor) => {
                      field.onChange(valor);
                      sugerirFin(valor, form.getValues('horaInicio'));
                    }}
                    disabled={procesando || Boolean(idPeliculaFija)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Elige una película" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {peliculas.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.titulo} ({p.duracionMinutos} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idSala"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sala</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={procesando}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Elige una sala" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {salas.map((s) => (
                        <SelectItem key={s.idSala} value={String(s.idSala)}>
                          {s.nombre} · {s.tipo} · {s.capacidad} butacas
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" disabled={procesando} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="horaInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inicio</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        disabled={procesando}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          sugerirFin(form.getValues('idPelicula'), e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="horaFin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin</FormLabel>
                    <FormControl>
                      <Input type="time" disabled={procesando} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="precio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio (Bs)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0.01" step="0.01" placeholder="40" disabled={procesando} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </Modal>
  );
}
