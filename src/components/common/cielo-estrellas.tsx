import { useMemo } from 'react';

// Cuantas luces pintar: suficientes para dar vida sin recargar el render
const CANTIDAD = 50;

type Estrella = {
    top: string;
    left: string;
    tam: number; // px
    retraso: string; // s, para que no titilen todas a la vez
    duracion: string; // s
};

/**
 * Capa decorativa de "estrellas" que titilan (aparecen y se desvanecen)
 * sobre el fondo degradado. Va DETRAS del contenido (-z-10) y no recibe
 * clics (pointer-events-none). Al ser decorativa, lleva aria-hidden.
 *
 * Las posiciones se calculan una sola vez (useMemo) para que no salten en
 * cada re-render. El parpadeo lo hace la clase .estrella (css/cine/estrellas.css).
 */
export function CieloEstrellas() {
    const estrellas = useMemo<Estrella[]>(
        () =>
            Array.from({ length: CANTIDAD }, () => ({
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                tam: Math.random() * 2 + 1, // 1 a 3 px
                retraso: `${Math.random() * 6}s`, // arrancan desfasadas
                duracion: `${Math.random() * 3 + 3}s`, // entre 3 y 6 s
            })),
        [],
    );

    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            {estrellas.map((e, i) => (
                <span
                    key={i}
                    className="estrella"
                    style={{
                        top: e.top,
                        left: e.left,
                        width: `${e.tam}px`,
                        height: `${e.tam}px`,
                        animationDelay: e.retraso,
                        animationDuration: e.duracion,
                    }}
                />
            ))}
        </div>
    );
}
