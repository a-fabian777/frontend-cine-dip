import { useEffect, useState } from 'react';
import { peliculaService } from '@/services/pelicula.service';
import { Pelicula } from '@/types/pelicula';
import { Container } from '@/components/common/container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PeliculaNuevaDialog } from './components/pelicula-nueva-dialog';
import { FuncionesPeliculaSheet } from './components/funciones-pelicula-sheet';
import { GaleriaPeliculaDialog } from './components/galeria-pelicula-dialog';
import { carteleraService } from '@/services/cartelera.service';
import { ChevronRight, Clock } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const POR_PAGINA = 10;

// Mismo listado que el catalogo publico, pero en tabla: al personal le
// sirve mas ver datos juntos (estado, imagenes) que posters grandes
export function PeliculasPanelPage() {
    const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    // Contador que solo sirve para volver a pedir la misma pagina
    const [recarga, setRecarga] = useState(0);

    // Funciones por pelicula (idPelicula → cantidad). Una sola peticion con
    // todas y se cuentan aqui, en vez de una peticion por fila
    const [conteo, setConteo] = useState<Map<number, number>>(new Map());
    const [recargaConteo, setRecargaConteo] = useState(0);
    // La pelicula cuyo panel lateral esta abierto; null = cerrado
    const [elegida, setElegida] = useState<Pelicula | null>(null);
    // La pelicula cuyas imagenes se ven en grande; null = galeria cerrada
    const [enGaleria, setEnGaleria] = useState<Pelicula | null>(null);

    useEffect(() => {
        carteleraService.listarFunciones()
            .then((funciones) => {
                const mapa = new Map<number, number>();
                funciones.forEach((f) => mapa.set(f.idPelicula, (mapa.get(f.idPelicula) ?? 0) + 1));
                setConteo(mapa);
            })
            .catch((e: Error) => setError(e.message));
    }, [recargaConteo]);

    useEffect(() => {
        setCargando(true);
        setError(null);
        peliculaService.listarPeliculas(pagina, POR_PAGINA)
            .then((respuesta) => {
                setPeliculas(respuesta.data);
                setTotal(respuesta.total);
                setTotalPaginas(Math.max(respuesta.totalPaginas, 1));
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setCargando(false));
    }, [pagina, recarga]);

    // La API las ordena por id, asi que la nueva queda al final: se salta a
    // la ultima pagina para verla. Si ya estaba ahi, solo se vuelve a pedir
    function alCrear() {
        const ultima = Math.ceil((total + 1) / POR_PAGINA);
        if (ultima === pagina) setRecarga((r) => r + 1);
        else setPagina(ultima);
    }

    return (
        <Container>
            <div className="space-y-6 py-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-mono">Películas</h1>
                        <p className="text-sm text-muted-foreground">{total} registradas</p>
                    </div>
                    <Button data-tour="nueva-pelicula" onClick={() => setModalAbierto(true)}>Nueva película</Button>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="rounded-xl border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-14">Póster</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Duración</TableHead>
                                <TableHead>Estreno</TableHead>
                                <TableHead>Imágenes</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-end">Funciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cargando ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : peliculas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        No hay películas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                peliculas.map((pelicula) => {
                                    const poster = pelicula.imagenes[0];
                                    return (
                                        <TableRow key={pelicula.id}>
                                            <TableCell>
                                                {/* button y no div: se puede abrir con teclado y el lector de pantalla lo anuncia */}
                                                <button
                                                    type="button"
                                                    onClick={() => setEnGaleria(pelicula)}
                                                    disabled={!poster}
                                                    title={poster ? 'Ver imágenes' : 'Sin imágenes'}
                                                    className="block aspect-[2/3] w-10 overflow-hidden rounded bg-muted ring-primary transition hover:ring-2 enabled:cursor-zoom-in"
                                                >
                                                    {poster && (
                                                        <img
                                                            src={peliculaService.urlImagen(poster)}
                                                            alt={pelicula.titulo}
                                                            loading="lazy"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell className="font-medium text-mono">
                                                {/* Abre el detalle en el panel lateral, sin salir del panel.
                                                    Para verla como el cliente esta "Ver sitio publico" arriba */}
                                                <button
                                                    type="button"
                                                    onClick={() => setElegida(pelicula)}
                                                    className="cursor-pointer text-start hover:text-primary hover:underline"
                                                >
                                                    {pelicula.titulo}
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                {/* appearance="light": el mismo estilo suave del badge "Activa" */}
                                                <Badge variant="warning" appearance="light">
                                                    <Clock /> {pelicula.duracionMinutos} min
                                                </Badge>
                                            </TableCell>
                                            {/* Viene en ISO completa: solo interesa la fecha */}
                                            <TableCell>
                                                <Badge variant="primary" appearance="light">{pelicula.fechaEstreno.slice(0, 10)}</Badge>
                                            </TableCell>
                                            <TableCell>{pelicula.imagenes.length}</TableCell>
                                            <TableCell>
                                                <Badge variant={pelicula.activo ? 'success' : 'secondary'} appearance="light">
                                                    {pelicula.activo ? 'Activa' : 'Inactiva'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-end">
                                                <Button variant="outline" size="sm" onClick={() => setElegida(pelicula)}>
                                                    {conteo.get(pelicula.id) ?? 0}
                                                    <span className="text-muted-foreground">· Ver</span>
                                                    <ChevronRight className="size-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Página {pagina} de {totalPaginas}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagina <= 1 || cargando}
                            onClick={() => setPagina(pagina - 1)}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagina >= totalPaginas || cargando}
                            onClick={() => setPagina(pagina + 1)}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            </div>

            <PeliculaNuevaDialog
                abierto={modalAbierto}
                onCerrar={() => setModalAbierto(false)}
                onCreada={alCrear}
            />

            <GaleriaPeliculaDialog pelicula={enGaleria} onCerrar={() => setEnGaleria(null)} />

            <FuncionesPeliculaSheet
                pelicula={elegida}
                onCerrar={() => setElegida(null)}
                // Al agregar una funcion en el panel, se recuenta la columna
                onCambio={() => setRecargaConteo((r) => r + 1)}
            />
        </Container>
    );
}
