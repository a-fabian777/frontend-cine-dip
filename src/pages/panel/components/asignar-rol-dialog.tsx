import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmar } from '@/components/common/confirmar/confirmar-context';
import { authService } from '@/services/auth.service';
import { Rol } from '@/types/auth';
import { Persona } from '@/types/persona';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/common/modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinners';

/**
 * Modal para asignar un rol a una persona del listado.
 *
 * Se abre cuando `persona` tiene valor y se cierra con onCerrar:
 * asi el listado decide a quien, y el modal solo sabe asignar.
 */
export function AsignarRolDialog({
  persona,
  onCerrar,
}: {
  persona: Persona | null;
  onCerrar: () => void;
}) {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [idRol, setIdRol] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmar = useConfirmar();

  // Los roles no cambian: se piden una sola vez, la primera que se abre
  useEffect(() => {
    if (!persona || roles.length > 0) return;
    authService.listarRoles()
      .then(setRoles)
      .catch((e: Error) => setError(e.message));
  }, [persona, roles.length]);

  // Cada persona empieza con el modal limpio
  useEffect(() => {
    setIdRol('');
    setError(null);
  }, [persona]);

  async function asignar() {
    if (!persona || !idRol) return;
    const rol = roles.find((r) => String(r.id) === idRol);
    const nombre = `${persona.nombres} ${persona.apellidos}`;

    // El backend no permite quitar roles: se pregunta antes. ADMIN en rojo,
    // porque le da acceso a todo
    const seguro = await confirmar({
      titulo: `¿Asignar el rol ${rol?.rol}?`,
      descripcion: `${nombre} tendrá este rol desde su próximo inicio de sesión. No se puede deshacer.`,
      textoConfirmar: 'Sí, asignar',
      peligroso: rol?.rol === 'ADMIN',
    });
    if (!seguro) return;

    try {
      setProcesando(true);
      setError(null);
      await authService.asignarRol({
        idPersona: persona.id,
        idRol: Number(idRol),
      });
      toast.success(`Rol ${rol?.rol} asignado`, { description: nombre });
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo asignar el rol.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Modal
      abierto={persona !== null}
      onCerrar={onCerrar}
      titulo="Asignar rol"
      // Al cerrar, persona pasa a null antes de que termine la animacion
      descripcion={persona && `${persona.nombres} ${persona.apellidos} · Doc. ${persona.documento}`}
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={procesando}>
            Cerrar
          </Button>
          <Button onClick={asignar} disabled={!idRol || procesando}>
            {procesando && <Spinner className="me-2 h-4 w-4 animate-spin" />}
            Asignar rol
          </Button>
        </>
      }
    >
      <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertIcon><AlertCircle className="h-4 w-4" /></AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <Select value={idRol} onValueChange={setIdRol} disabled={procesando}>
            <SelectTrigger>
              <SelectValue placeholder="Elige un rol" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((rol) => (
                <SelectItem key={rol.id} value={String(rol.id)}>
                  {rol.rol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* El backend no dice que roles tiene ya, ni permite quitarlos */}
          <p className="text-xs text-muted-foreground">
            Si ya tiene ese rol, se registra otra vez. Un rol asignado no se puede quitar.
          </p>
      </div>
    </Modal>
  );
}
