import { useEffect, useMemo, useState } from 'react';
import { carteleraService } from '@/services/cartelera.service';
import { Funcion } from '@/types/cartelera';
import { Banknote, CalendarDays, Clock } from 'lucide-react';
import { Container } from '@/components/common/container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FuncionNuevaDialog } from './components/funcion-nueva-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

// Color del badge de estado. default = por si el backend trae uno nuevo
function colorEstado(estado: string): 'primary' | 'destructive' | 'secondary' {
    if (estado === 'CANCELADA') return 'destructive';
    if (estado === 'FINALIZADA') return 'secondary';
    return 'primary'; // PROGRAMADA
}

export function FuncionesPage() {
    const [funciones, setFunciones] = useState<Funcion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [texto, setTexto] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    // Contador que solo sirve para volver a pedir la lista tras crear una
    const [recarga, setRecarga] = useState(0);

    useEffect(() => {
        carteleraService.listarFunciones()
            .then((respuesta) => {
                setFunciones(respuesta);
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setCargando(false));
    }, [recarga]);

    // El endpoint no pagina ni filtra por texto: con ~20 funciones
    // basta con ordenar y filtrar aqui, sin volver a pedir a la API
    const visibles = useMemo(() => {
        const busqueda = texto.trim().toLowerCase();
        return funciones
            .filter((f) => f.pelicula.toLowerCase().includes(busqueda))
            // "2026-09-17" + "14:00:00" se ordenan bien como texto
            .sort((a, b) =>
                (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio),
            );
    }, [funciones, texto]);

    return (
        <Container>
            <div className="space-y-6 py-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-mono">Funciones</h1>
                        <p className="text-sm text-muted-foreground">
                            {visibles.length} de {funciones.length} programadas
                        </p>
                    </div>
                    <Button data-tour="programar-funcion" onClick={() => setModalAbierto(true)}>Programar función</Button>
                </div>

                <Input
                    className="w-72"
                    placeholder="Filtrar por película"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                />

                {error && <p className="text-sm text-destructive">{error}</p>}

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="rounded-xl border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Horario</TableHead>
                                <TableHead>Película</TableHead>
                                <TableHead>Sala</TableHead>
                                <TableHead>Precio</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cargando ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : visibles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No hay funciones
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visibles.map((funcion) => (
                                    <TableRow key={funcion.idFuncion}>
                                        <TableCell>
                                            <Badge variant="primary" appearance="light">
                                                <CalendarDays /> {funcion.fecha}
                                            </Badge>
                                        </TableCell>
                                        {/* Llegan con segundos ("14:00:00"): se muestran sin ellos */}
                                        <TableCell>
                                            <Badge variant="warning" appearance="light">
                                                <Clock /> {funcion.horaInicio.slice(0, 5)} – {funcion.horaFin.slice(0, 5)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-mono">{funcion.pelicula}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" appearance="light">
                                                {funcion.sala} · {funcion.tipoSala}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="success" appearance="light">
                                                <Banknote /> Bs {funcion.precio}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {/* El color depende del estado: programada azul, cancelada roja, finalizada gris */}
                                            <Badge variant={colorEstado(funcion.estado)} appearance="light">
                                                {funcion.estado}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <FuncionNuevaDialog
                abierto={modalAbierto}
                onCerrar={() => setModalAbierto(false)}
                onCreada={() => setRecarga((r) => r + 1)}
            />
        </Container>
    );
}
