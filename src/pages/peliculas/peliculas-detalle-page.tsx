import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Banknote, CalendarDays, Clock, MapPin } from 'lucide-react';
import { peliculaService } from '@/services/pelicula.service';
import { Pelicula } from '@/types/pelicula';
import { Funcion } from '@/types/cartelera';
import { carteleraService } from '@/services/cartelera.service';
import { Container } from '@/components/common/container';
import { Badge } from '@/components/ui/badge';

function formatearDuracion(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return horas > 0 ? `${horas}h ${resto}m` : `${resto}m`;
}

// Chip del selector de fecha: "mié / 14 / oct". Activo = relleno primary
function DiaChip({ fecha, cantidad, activo, onClick }: {
    fecha: string;
    cantidad: number;
    activo: boolean;
    onClick: () => void;
}) {
    const d = new Date(`${fecha}T00:00:00`);
    const semana = d.toLocaleDateString('es-BO', { weekday: 'short' }).replace('.', '');
    const dia = d.toLocaleDateString('es-BO', { day: '2-digit' });
    const mes = d.toLocaleDateString('es-BO', { month: 'short' }).replace('.', '');
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'flex min-w-16 shrink-0 cursor-pointer flex-col items-center rounded-xl border-2 px-3 py-2.5 text-center transition-colors',
                // Activo: solo el borde azul y un fondo apenas tenido
                activo
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/50',
            ].join(' ')}
            title={`${cantidad} ${cantidad === 1 ? 'función' : 'funciones'}`}
        >
            <span className={`text-xs capitalize ${activo ? 'text-primary' : 'text-muted-foreground'}`}>{semana}</span>
            <span className="text-xl font-semibold leading-tight text-mono">{dia}</span>
            <span className={`text-xs capitalize ${activo ? 'text-primary' : 'text-muted-foreground'}`}>{mes}</span>
        </button>
    );
}

export function PeliculasDellatePage() {
    const { id } = useParams<{ id: string }>();
    const idPelicula = Number(id);
    const [pelicula, setPelicula] = useState<Pelicula | undefined>();
    const [funciones, setFunciones] = useState<Funcion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Dia elegido en el selector de fechas (null = todavia ninguno)
    const [diaSel, setDiaSel] = useState<string | null>(null);

    useEffect(() => {
        setCargando(true);
        Promise.all([
            peliculaService.obtenerPelicula(idPelicula),
            carteleraService.listarFunciones(idPelicula),
        ])
            .then(([peliculaHallada, funcionesHalladas]) => {
                setPelicula(peliculaHallada);
                setFunciones(funcionesHalladas);
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setCargando(false));
    }, [idPelicula]);

    // Horarios agrupados por dia y ordenados, en vez de una lista plana
    const porDia = useMemo(() => {
        const mapa = new Map<string, Funcion[]>();
        for (const f of funciones) {
            const dia = mapa.get(f.fecha) ?? [];
            dia.push(f);
            mapa.set(f.fecha, dia);
        }
        return [...mapa.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([fecha, lista]) => ({
                fecha,
                funciones: lista.sort((x, y) => x.horaInicio.localeCompare(y.horaInicio)),
            }));
    }, [funciones]);

    // Al llegar las funciones, se selecciona el primer dia disponible
    useEffect(() => {
        if (porDia.length > 0) setDiaSel((actual) => actual ?? porDia[0].fecha);
    }, [porDia]);

    // Funciones del dia elegido (ya ordenadas por hora)
    const funcionesDelDia = porDia.find((d) => d.fecha === diaSel)?.funciones ?? [];

    if (cargando) {
        return (
            <Container>
                {/* Esqueleto: ocupa el mismo espacio que el contenido, sin saltos */}
                <div className="grid gap-8 py-10 md:grid-cols-[300px_1fr]">
                    <div className="aspect-[2/3] animate-pulse rounded-xl bg-muted" />
                    <div className="space-y-4">
                        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
                        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                        <div className="h-24 w-full animate-pulse rounded bg-muted" />
                    </div>
                </div>
            </Container>
        );
    }

    if (error || !pelicula) {
        return (
            <Container>
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <p className="text-muted-foreground">{error ?? 'No se encontró esa película.'}</p>
                    <Link to="/peliculas" className="text-sm font-medium text-primary hover:underline">
                        Volver a la cartelera
                    </Link>
                </div>
            </Container>
        );
    }

    const poster = pelicula.imagenes[0];

    return (
        <div className="relative">
            {/* Fondo cinematografico: el poster borroso y oscurecido, fundido con
                el fondo de la pagina. Decorativo, por eso aria-hidden */}
            {poster && (
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
                    <div
                        className="h-full w-full scale-110 bg-cover bg-center opacity-20 blur-2xl dark:opacity-30"
                        style={{ backgroundImage: `url(${peliculaService.urlImagen(poster)})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
                </div>
            )}

            <Container>
                <div className="relative space-y-8 py-8">
                    <Link to="/peliculas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                        <ArrowLeft className="size-4" /> Volver a la cartelera
                    </Link>

                    <div className="grid gap-8 md:grid-cols-[300px_1fr]">
                    {/* Poster, fijo al hacer scroll en pantallas grandes */}
                    <div className="md:sticky md:top-24 md:self-start">
                        <div className="overflow-hidden rounded-xl bg-muted shadow-lg ring-1 ring-border aspect-[2/3]">
                            {poster ? (
                                <img src={peliculaService.urlImagen(poster)} alt={pelicula.titulo} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sin imagen</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight text-mono">{pelicula.titulo}</h1>
                            {/* Metadatos reales con icono, en lugar del "fecha holasas" */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="warning" appearance="light">
                                    <Clock /> {formatearDuracion(pelicula.duracionMinutos)}
                                </Badge>
                                <Badge variant="primary" appearance="light">
                                    <CalendarDays /> Estreno {pelicula.fechaEstreno.slice(0, 10)}
                                </Badge>
                            </div>
                        </div>

                        <p className="leading-relaxed text-secondary-foreground">{pelicula.sinopsis}</p>

                        <div className="space-y-4">
                            <h2 className="flex items-center gap-2 text-sm font-semibold  tracking-wide text-muted-foreground">
                                <CalendarDays className="size-4" /> Selecciona la fecha
                            </h2>

                            {porDia.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                    No hay funciones programadas por ahora.
                                </div>
                            ) : (
                                <>
                                    {/* Selector de dias: fila con scroll horizontal en movil */}
                                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                                        {porDia.map(({ fecha, funciones }) => (
                                            <DiaChip
                                                key={fecha}
                                                fecha={fecha}
                                                cantidad={funciones.length}
                                                activo={fecha === diaSel}
                                                onClick={() => setDiaSel(fecha)}
                                            />
                                        ))}
                                    </div>

                                    {/* Paso 2: guia al usuario a elegir el horario abajo */}
                                    <div className="space-y-3 pt-4">
                                        <p className="text-sm font-medium text-mono">
                                            Elige tu horario
                                            <span className="ms-1 font-normal text-muted-foreground">
                                                y continúa con tus butacas
                                            </span>
                                        </p>

                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {funcionesDelDia.map((funcion) => (
                                                // Toda la tarjeta lleva al mapa de butacas de esa funcion
                                                <Link
                                                    key={funcion.idFuncion}
                                                    to={`/funciones/${funcion.idFuncion}`}
                                                    className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md hover:shadow-primary/5"
                                                >
                                                    <p className="text-2xl font-semibold text-mono group-hover:text-primary">
                                                        {funcion.horaInicio.slice(0, 5)}
                                                        <span className="text-sm font-normal text-muted-foreground"> – {funcion.horaFin.slice(0, 5)}</span>
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                                        <Badge variant="secondary" appearance="light" size="sm">
                                                            <MapPin /> {funcion.sala} · {funcion.tipoSala}
                                                        </Badge>
                                                        <Badge variant="success" appearance="light" size="sm">
                                                            <Banknote /> Bs {funcion.precio}
                                                        </Badge>
                                                    </div>
                                                    {/* Llamado a la accion: aparece con fuerza al pasar el mouse */}
                                                    <span className="mt-auto flex items-center justify-between border-t border-border pt-3 text-sm font-medium text-primary">
                                                        Elegir butacas
                                                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Container>
        </div>
    );
}
