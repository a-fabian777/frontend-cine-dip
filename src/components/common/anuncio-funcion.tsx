import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, X } from 'lucide-react';
import { carteleraService } from '@/services/cartelera.service';
import { Funcion } from '@/types/cartelera';
import { Container } from '@/components/common/container';

const CLAVE_CERRADO = 'anuncio_funcion_cerrado';

// "2026-10-18" + "19:00:00" → objeto Date local
const fechaHora = (f: Funcion) => new Date(`${f.fecha}T${f.horaInicio}`);

/**
 * Barra superior con la PROXIMA funcion y una cuenta regresiva.
 * Usa datos reales de la cartelera. Se puede cerrar (recuerda en la sesion).
 * Si no hay funciones futuras, no se muestra.
 */
export function AnuncioFuncion() {
    const [funciones, setFunciones] = useState<Funcion[]>([]);
    const [ahora, setAhora] = useState(() => Date.now());
    const [cerrado, setCerrado] = useState(() => {
        try {
            return sessionStorage.getItem(CLAVE_CERRADO) === '1';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        if (cerrado) return;
        carteleraService.listarFunciones()
            .then(setFunciones)
            .catch(() => setFunciones([])); // si falla, simplemente no se muestra
    }, [cerrado]);

    // La proxima funcion que aun no empieza, la mas cercana
    const proxima = useMemo(() => {
        return funciones
            .filter((f) => fechaHora(f).getTime() > ahora)
            .sort((a, b) => fechaHora(a).getTime() - fechaHora(b).getTime())[0];
    }, [funciones, ahora]);

    // Reloj: solo corre si hay una funcion que mostrar
    useEffect(() => {
        if (!proxima || cerrado) return;
        const timer = setInterval(() => setAhora(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [proxima, cerrado]);

    if (cerrado || !proxima) return null;

    const restante = fechaHora(proxima).getTime() - ahora;
    const dias = Math.floor(restante / 86400000);
    const horas = Math.floor((restante % 86400000) / 3600000);
    const min = Math.floor((restante % 3600000) / 60000);
    const seg = Math.floor((restante % 60000) / 1000);

    function cerrar() {
        setCerrado(true);
        try { sessionStorage.setItem(CLAVE_CERRADO, '1'); } catch { /* sin storage */ }
    }

    return (
        // Azul marino FIJO en los dos temas (no usa tokens que cambian con el modo)
        <div className="bg-[#0f1b2e] text-white">
            <Container className="flex h-11 items-center gap-3 text-sm">
                <Ticket className="hidden size-4 shrink-0 text-warning sm:block" />
                {/* El titulo se corta en movil para que quepa la cuenta regresiva */}
                <span className="truncate">
                    Próxima función:{' '}
                    <span className="font-semibold">{proxima.pelicula}</span>
                    <span className="hidden text-white/70 md:inline"> · {proxima.sala}</span>
                </span>

                {/* Cuenta regresiva */}
                <span className="ms-auto flex shrink-0 items-center gap-3 font-mono text-xs">
                    {dias > 0 && <Cuadro valor={dias} unidad="D" />}
                    <Cuadro valor={horas} unidad="H" />
                    <Cuadro valor={min} unidad="M" />
                    <Cuadro valor={seg} unidad="S" />
                </span>

                <Link
                    to={`/funciones/${proxima.idFuncion}`}
                    className="shrink-0 rounded-md bg-warning px-3 py-1.5 text-xs font-semibold text-warning-foreground transition-opacity hover:opacity-90"
                >
                    Reservar
                </Link>

                <button
                    type="button"
                    onClick={cerrar}
                    className="shrink-0 text-white/60 hover:text-white"
                    aria-label="Cerrar anuncio"
                >
                    <X className="size-4" />
                </button>
            </Container>
        </div>
    );
}

// Numero + unidad de la cuenta regresiva (02 D, 13 H...)
function Cuadro({ valor, unidad }: { valor: number; unidad: string }) {
    return (
        <span className="flex items-center gap-1 tabular-nums">
            {/* El numero en una pastilla, la letra separada */}
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-semibold">
                {String(valor).padStart(2, '0')}
            </span>
            <span className="text-white/60">{unidad}</span>
        </span>
    );
}
