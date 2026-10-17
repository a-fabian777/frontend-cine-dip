import { FormEvent, useEffect, useState } from 'react';
import { personaService } from '@/services/persona.service';
import { FiltroPersona, Persona } from '@/types/persona';
import { Container } from '@/components/common/container';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/auth/context/auth-context';
import { AsignarRolDialog } from './components/asignar-rol-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const POR_PAGINA = 10;

export function PersonasPage() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Asignar roles es solo de ADMIN: el GERENTE ve el listado sin el boton
    const { tieneRol } = useAuth();
    const esAdmin = tieneRol('ADMIN');
    const columnas = esAdmin ? 6 : 5;
    // La persona a la que se le asigna rol; null = modal cerrado
    const [paraRol, setParaRol] = useState<Persona | null>(null);

    // Lo que se escribe en los inputs, y lo que de verdad se busco.
    // Separados para no pedir a la API en cada tecla
    const [filtro, setFiltro] = useState<FiltroPersona>({ nombres: '', apellidos: '' });
    const [aplicado, setAplicado] = useState<FiltroPersona>({});

    const hayFiltro = Boolean(aplicado.nombres?.trim() || aplicado.apellidos?.trim());

    useEffect(() => {
        setCargando(true);
        setError(null);

        // Sin filtro se lista todo: /persona/buscar sin filtros responde error
        const peticion = hayFiltro
            ? personaService.buscar(aplicado, pagina, POR_PAGINA)
            : personaService.listar(pagina, POR_PAGINA);

        peticion
            .then((respuesta) => {
                setPersonas(respuesta.data);
                setTotal(respuesta.total);
                // Con 0 resultados el backend da 0 paginas; se deja en 1 para la paginacion
                setTotalPaginas(Math.max(respuesta.totalPaginas, 1));
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setCargando(false));
    }, [pagina, aplicado, hayFiltro]);

    function buscar(e: FormEvent) {
        e.preventDefault();
        // Cada busqueda nueva empieza en la primera pagina
        setPagina(1);
        setAplicado({ ...filtro });
    }

    function limpiar() {
        setFiltro({ nombres: '', apellidos: '' });
        setPagina(1);
        setAplicado({});
    }

    return (
        <Container>
            <div className="space-y-6 py-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-mono">Personas</h1>
                    <p className="text-sm text-muted-foreground">
                        {total} {hayFiltro ? 'coincidencias' : 'registradas'}
                    </p>
                </div>

                {/* Dos campos y no uno: el backend filtra con Y, asi que
                    un solo texto en los dos campos casi nunca coincide */}
                <form onSubmit={buscar} className="flex flex-wrap items-end gap-3">
                    <Input
                        className="w-56"
                        placeholder="Nombres"
                        value={filtro.nombres}
                        onChange={(e) => setFiltro({ ...filtro, nombres: e.target.value })}
                    />
                    <Input
                        className="w-56"
                        placeholder="Apellidos"
                        value={filtro.apellidos}
                        onChange={(e) => setFiltro({ ...filtro, apellidos: e.target.value })}
                    />
                    <Button
                        type="submit"
                        disabled={!filtro.nombres?.trim() && !filtro.apellidos?.trim()}
                    >
                        Buscar
                    </Button>
                    {hayFiltro && (
                        <Button type="button" variant="outline" onClick={limpiar}>
                            Limpiar
                        </Button>
                    )}
                </form>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="rounded-xl border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Documento</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Correo</TableHead>
                                <TableHead>Nacimiento</TableHead>
                                {esAdmin && <TableHead className="text-end">Acciones</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cargando ? (
                                <TableRow>
                                    <TableCell colSpan={columnas} className="text-center text-muted-foreground">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : personas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columnas} className="text-center text-muted-foreground">
                                        No se encontraron personas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                personas.map((persona) => (
                                    <TableRow key={persona.id}>
                                        <TableCell className="font-medium text-mono">
                                            <span className="flex items-center gap-3">
                                                <Avatar className="size-9">
                                                    {/* El backend no guarda fotos: avatar generico de la plantilla */}
                                                    <AvatarImage src={toAbsoluteUrl('/media/avatars/blank.png')} alt="" />
                                                </Avatar>
                                                {persona.nombres} {persona.apellidos}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {/* appearance="light": el mismo estilo suave del badge "Activa" */}
                                            <Badge variant="warning" appearance="light">{persona.documento}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="primary" appearance="light">{persona.telefono}</Badge>
                                        </TableCell>
                                        <TableCell>{persona.email}</TableCell>
                                        {/* Viene en ISO completa: solo interesa la fecha */}
                                        <TableCell>{persona.fechaNacimiento.slice(0, 10)}</TableCell>
                                        {esAdmin && (
                                            <TableCell className="text-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setParaRol(persona)}
                                                >
                                                    Asignar rol
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
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

            {/* Fuera de la tabla: hay un solo modal, y cambia segun la persona elegida */}
            <AsignarRolDialog persona={paraRol} onCerrar={() => setParaRol(null)} />
        </Container>
    );
}
