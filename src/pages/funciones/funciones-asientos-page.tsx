import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Banknote, CalendarDays, Clock, MapPin } from "lucide-react";
import { Container } from "@/components/common/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Asiento, Funcion } from "@/types/cartelera";
import { Link, useParams, useNavigate } from "react-router";
import { carteleraService } from "@/services/cartelera.service";
import { useAuth } from "@/auth/context/auth-context";
import { reservaService } from "@/services/reserva.service";
import { useConfirmar } from "@/components/common/confirmar/confirmar-context";
import { toast } from "sonner";


// Las butacas elegidas se guardan por funcion, para no perderlas al pasar
// por el login. sessionStorage y no local: se limpia al cerrar la pestana
const claveButacas = (idFuncion: number) => `butacas_funcion_${idFuncion}`;

function leerGuardadas(idFuncion: number): number[] {
    try {
        return JSON.parse(sessionStorage.getItem(claveButacas(idFuncion)) ?? '[]');
    } catch {
        return [];
    }
}

export function FuncionAsientosPage() {
    const { id } = useParams<{ id: string }>();
    const idFuncion = Number(id);
    const [asientos, setAsientos] = useState<Asiento[]>([]);
    const [funcion, setFuncion] = useState<Funcion | undefined>();
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Los id de butacas que el usuario eligio. Se recuperan de la sesion por si
    // venia del login: asi no tiene que volver a elegirlas
    const [elegidos, setElegidos] = useState<number[]>(() => leerGuardadas(idFuncion));

    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [reservado, setReservado] = useState(false);
    // Arriba, con los demas hooks: abajo hay returns tempranos (cargando, error)
    const confirmar = useConfirmar();


    useEffect(() => {
        setCargando(true);
        Promise.all([
            carteleraService.asientosDeFuncion(idFuncion),
            carteleraService.listarFunciones(),
        ])
            .then(([butacas, funciones]) => {
                setAsientos(butacas);
                setFuncion(funciones.find((f) => f.idFuncion === idFuncion));
                // Si alguna butaca guardada ya la tomo otro mientras no estaba, se descarta
                const disponibles = new Set(butacas.filter((b) => b.disponible).map((b) => b.idAsiento));
                setElegidos((previos) => previos.filter((id) => disponibles.has(id)));
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setCargando(false))
    }, [idFuncion])

    // Guarda la seleccion en cada cambio: si va al login y vuelve, sigue ahi
    useEffect(() => {
        try {
            sessionStorage.setItem(claveButacas(idFuncion), JSON.stringify(elegidos));
        } catch {
            // modo privado sin storage: no es grave, solo no se recuerdan
        }
    }, [elegidos, idFuncion])

    // agruparlo por fila
    const porFila = useMemo(() => {
        const mapa = new Map<string, Asiento[]>();
        for (const asiento of asientos) {
            const fila = mapa.get(asiento.fila) ?? [];
            fila.push(asiento);
            mapa.set(asiento.fila, fila);
        }

        return [...mapa.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([fila, butacas]) => ({
                fila,
                butacas: butacas.sort((x, y) => x.numero - y.numero),
            })
            )


    }, [asientos])

    function alternar(idAsiento: number) {
        setElegidos((previos) =>
            previos.includes(idAsiento)
                ? previos.filter((x) => x !== idAsiento) : [...previos, idAsiento],
        )
    }

    const total = elegidos.length * (funcion?.precio ?? 0)

    const nombresElegidos = asientos
        .filter((a) => elegidos.includes(a.idAsiento))
        .map((a) => a.asiento)
        .join(', ');


    if (cargando) {
        return (
            <Container>
                <p>Cargando pelicula....</p>
            </Container>
        )
    }

    if (error) {
        return (
            <Container>
                <p>{error}</p>
            </Container>
        )
    }

    async function reservar() {
        if (!isAuthenticated || !user) {
            navigate(`/auth/signin?next=/funciones/${idFuncion}`);
            return;
        }
        if (!funcion) return;

        // Es una compra: se muestra el resumen antes de enviarla
        const seguro = await confirmar({
            titulo: '¿Confirmar la reserva?',
            descripcion: `${funcion.pelicula} · ${elegidos.length} ${elegidos.length === 1 ? 'butaca' : 'butacas'} (${nombresElegidos}) · Total Bs ${total}`,
            textoConfirmar: 'Sí, reservar',
        });
        if (!seguro) return;

        try {
            setReservado(true);

            const respuesta = await reservaService.crear({
                idCliente: user.id,
                idFuncion: funcion.idFuncion,
                fechaReserva: new Date().toISOString(),
                codigoReserva: reservaService.generarCodigo(funcion.idFuncion),
                estado: 'PENDIENTE',
                total,
                detalles: elegidos.map((idAsiento) => ({
                    idAsiento,
                    precio: funcion.precio,
                })),
            });

            // Ya se reservo: se olvidan las butacas guardadas de esta funcion
            try { sessionStorage.removeItem(claveButacas(idFuncion)); } catch { /* sin storage */ }

            // 10 segundos y no los 4 de siempre: el codigo hay que poder anotarlo
            toast.success('¡Reserva creada!', {
                description: `Tu código es ${respuesta.data.reserva.codigo}. Preséntalo en el cine.`,
                duration: 10000,
            });
            navigate('/peliculas')
        } catch (e) {
            // toast y no setError: setError cambia TODO el mapa de butacas por el
            // mensaje. Con el texto como id, si la sesion vencio sale un solo aviso
            const mensaje = e instanceof Error ? e.message : 'No se pudo crear la reserva.';
            toast.error(mensaje, { id: mensaje });
        } finally {
            setReservado(false);
        }
    }





    return (
        <Container>
            <div className="py-8">
                {funcion && (
                    <Link
                        to={`/peliculas/${funcion.idPelicula}`}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
                    >
                        <ArrowLeft className="size-4" /> Volver a {funcion.pelicula}
                    </Link>
                )}

                <div className="mt-4 space-y-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-mono">{funcion?.pelicula ?? 'Función'}</h1>
                    {/* Contexto de la funcion: asi el usuario sabe que esta reservando */}
                    {funcion && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="primary" appearance="light">
                                <CalendarDays /> {funcion.fecha}
                            </Badge>
                            <Badge variant="warning" appearance="light">
                                <Clock /> {funcion.horaInicio.slice(0, 5)} – {funcion.horaFin.slice(0, 5)}
                            </Badge>
                            <Badge variant="secondary" appearance="light">
                                <MapPin /> {funcion.sala} · {funcion.tipoSala}
                            </Badge>
                            <Badge variant="success" appearance="light">
                                <Banknote /> Bs {funcion.precio}
                            </Badge>
                        </div>
                    )}
                </div>


                <div className="mt-10 flex justify-center">
                    <div className="w-full max-w-2xl">
                        <div className="rounded-t-[50%] border-t-4 border-primary/40 
            pb-2 pt-3 text-center text-xs uppercase tracking-widest text-muted-foreground">
                            Pantalla
                        </div>

                        {/* las filas */}
                        <div className="mt-8 space-y-3">
                            {porFila.map(({ fila, butacas }) => (
                                <div key={fila} className="flex items-center justify-center gap-2">
                                    <span className="w-5 text-xs text-muted-foreground"> {fila} </span>
                                    <div className="flex gap-1.5">
                                        {butacas.map((butaca) => {
                                            const elegido = elegidos.includes(butaca.idAsiento);
                                            return (
                                                // BOTON MEJORADOCON ESTILOS
                                                <button
                                                    key={butaca.idAsiento}
                                                    type="button"
                                                    // Las ocupadas no se pueden pulsar
                                                    disabled={!butaca.disponible}
                                                    onClick={() => alternar(butaca.idAsiento)}
                                                    title={butaca.asiento}
                                                    className={[
                                                        'size-7 rounded text-[10px] transition-colors',
                                                        !butaca.disponible
                                                            ? 'cursor-not-allowed bg-muted text-muted-foreground/40'
                                                            : elegido
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-secondary hover:bg-primary/30',
                                                    ].join(' ')}
                                                >
                                                    {butaca.numero}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                        </div>
                        {/* ── Leyenda ── */}
                        <div className="mt-8 flex justify-center gap-6 text-xs text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <span className="size-4 rounded bg-secondary" /> Libre
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="size-4 rounded bg-primary" /> Elegido
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="size-4 rounded bg-muted" /> Ocupado
                            </span>
                        </div>
                    </div>
                </div>
                {/* ── Resumen ── */}
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-5">
                    <div>
                        <p className="text-sm text-mono">
                            {elegidos.length === 0 ? 'Ninguna butaca elegida' : `${elegidos.length} Butacas: ${nombresElegidos}`

                            }
                        </p>
                        <p className="mt-1 text-xl font-semibold text-mono">Bs {total}</p>
                    </div>
                    <Button onClick={reservar} disabled={elegidos.length === 0 || reservado}>
                        {reservado ? 'Reservando…' : 'Reservar'}
                    </Button>
                </div>
            </div>
        </Container>
    )
}