import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clapperboard } from 'lucide-react';
import { peliculaService } from '@/services/pelicula.service';
import { Pelicula } from '@/types/pelicula';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// 20 llena 5 filas de 4 en pantallas grandes
const POR_PAGINA = 20;

function formatearDuracion(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return horas > 0 ? `${horas}h ${resto}m` : `${resto}m`;
}

export function PeliculasPage() {
    const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // Se vuelve a pedir cada vez que cambia la pagina
    useEffect(() => {
        setCargando(true);
        peliculaService.listarPeliculas(pagina, POR_PAGINA)
            .then((respuesta) => {
                setPeliculas(respuesta.data);
                setTotalPaginas(Math.max(respuesta.totalPaginas, 1));
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setCargando(false));
    }, [pagina]);

    function irAPagina(nueva: number) {
        setPagina(nueva);
        // Al cambiar de pagina se vuelve arriba, si no quedaria al pie de la grilla
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <Container>
            <div className="space-y-8 py-10">
                <div className="space-y-1.5 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-mono">En cartelera</h1>
                    <p className="text-sm text-muted-foreground">
                        Elige una película para ver sus horarios y reservar tus butacas
                    </p>
                </div>

                {error ? (
                    <EstadoVacio icono={<Clapperboard className="size-8" />} titulo="No se pudo cargar la cartelera" detalle={error} />
                ) : cargando ? (
                    <Grilla>
                        {/* Esqueletos: mismo tamano que las tarjetas, sin saltos al cargar */}
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <div className="aspect-[2/3] animate-pulse rounded-xl bg-muted" />
                                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                            </div>
                        ))}
                    </Grilla>
                ) : peliculas.length === 0 ? (
                    <EstadoVacio icono={<Clapperboard className="size-8" />} titulo="No hay películas en cartelera" detalle="Vuelve pronto para ver los próximos estrenos." />
                ) : (
                    <>
                        <Grilla>
                            {peliculas.map((pelicula, i) => (
                                <TarjetaPelicula key={pelicula.id} pelicula={pelicula} indice={i} />
                            ))}
                        </Grilla>

                        {/* Solo hace falta si hay mas de una pagina */}
                        {totalPaginas > 1 && (
                            <div className="flex items-center justify-center gap-4">
                                <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => irAPagina(pagina - 1)}>
                                    Anterior
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Página {pagina} de {totalPaginas}
                                </span>
                                <Button variant="outline" size="sm" disabled={pagina >= totalPaginas} onClick={() => irAPagina(pagina + 1)}>
                                    Siguiente
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Container>
    );
}

// 5 columnas en pantallas grandes: los posters quedan de un tamano parecido al de un cine
function Grilla({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {children}
        </div>
    );
}

function TarjetaPelicula({ pelicula, indice }: { pelicula: Pelicula; indice: number }) {
    const poster = pelicula.imagenes[0];
    // El poster arranca invisible y aparece con fade cuando termina de cargar
    const [imgCargada, setImgCargada] = useState(false);

    return (
        // Entrada escalonada; motion-reduce la desactiva para quien no quiere animaciones.
        // El delay se topa para que en paginas largas no tarde demasiado
        <article
            className="group animate-in fade-in slide-in-from-bottom-3 fill-mode-backwards duration-500 motion-reduce:animate-none"
            style={{ animationDelay: `${Math.min(indice, 11) * 45}ms` }}
        >
            <Link to={`/peliculas/${pelicula.id}`} className="block">
                <div className="relative overflow-hidden rounded-xl bg-muted aspect-[2/3] shadow-sm ring-1 ring-border transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                    {poster ? (
                        <img
                            src={peliculaService.urlImagen(poster)}
                            alt={pelicula.titulo}
                            loading="lazy"
                            onLoad={() => setImgCargada(true)}
                            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imgCargada ? 'opacity-100' : 'opacity-0'}`}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                            Sin imagen
                        </div>
                    )}

                    {/* Duracion sobre el poster */}
                    <Badge variant="mono" appearance="solid" size="sm" className="absolute end-2 top-2 opacity-90">
                        {formatearDuracion(pelicula.duracionMinutos)}
                    </Badge>

                    {/* Overlay que invita al clic: aparece al pasar el mouse */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="flex items-center gap-1 text-sm font-medium text-white">
                            Ver horarios <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </div>
                </div>

                {/* line-clamp-2: titulos largos no descuadran la grilla */}
                <h2 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-mono transition-colors group-hover:text-primary">
                    {pelicula.titulo}
                </h2>
            </Link>
        </article>
    );
}

function EstadoVacio({ icono, titulo, detalle }: { icono: React.ReactNode; titulo: string; detalle: string }) {
    return (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                {icono}
            </span>
            <div className="space-y-1">
                <p className="font-medium text-mono">{titulo}</p>
                <p className="text-sm text-muted-foreground">{detalle}</p>
            </div>
        </div>
    );
}
