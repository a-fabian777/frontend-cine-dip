import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { rutaInterna } from '@/lib/rutas';
import { useAuth } from '@/auth/context/auth-context';
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
import { Spinner } from '@/components/ui/spinners';
import { personaService } from '@/services/persona.service';
import { getSignupSchema, SignupSchemaType } from '../forms/signup-shema';

// Campos de texto simples. Las contrasenas van aparte por el boton de ver
const CAMPOS: {
  name: keyof SignupSchemaType;
  label: string;
  type?: string;
  placeholder?: string;
}[] = [
  { name: 'nombres', label: 'Nombres', placeholder: 'Sergio Luis' },
  { name: 'apellidos', label: 'Apellidos', placeholder: 'Pérez López' },
  { name: 'documento', label: 'Documento', placeholder: '12345678' },
  { name: 'telefono', label: 'Teléfono', type: 'tel', placeholder: '70123456' },
  { name: 'email', label: 'Correo', type: 'email', placeholder: 'ana@correo.com' },
  // type date entrega "1995-05-20", el formato que pide el backend
  { name: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date' },
  { name: 'usuario', label: 'Usuario', placeholder: 'ana.perez' },
];

export function SignUpPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  // Si venia de reservar, el login le paso a donde volver
  const [searchParams] = useSearchParams();
  // Solo rutas internas: un ?next=//otro-sitio.com redirigiria afuera
  const next = rutaInterna(searchParams.get('next'));

  const [verContrasena, setVerContrasena] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignupSchemaType>({
    resolver: zodResolver(getSignupSchema()),
    defaultValues: {
      nombres: '',
      apellidos: '',
      documento: '',
      telefono: '',
      email: '',
      fechaNacimiento: '',
      usuario: '',
      constrasena: '',
      confirmar: '',
    },
  });

  async function onSubmit(values: SignupSchemaType) {
    try {
      setProcesando(true);
      setError(null);

      // confirmar solo sirve aqui: el backend rechaza campos que no conoce.
      // Y nunca se manda "rol": el backend pone CLIENTE por defecto
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmar, ...datos } = values;

      await personaService.registrar(datos);

      // Entra solo con lo que acaba de escribir: no se le piden los datos dos veces.
      // Una cuenta nueva siempre es CLIENTE, por eso el destino es /peliculas
      await login(datos.usuario, datos.constrasena);
      toast.success('¡Cuenta creada!', { description: `Bienvenido, ${datos.nombres}` });
      navigate(next || '/peliculas');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo crear la cuenta. Intenta de nuevo.',
      );
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Regístrate para reservar tus butacas
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle className="h-4 w-4" />
          </AlertIcon>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {CAMPOS.map((campo) => (
            <FormField
              key={campo.name}
              control={form.control}
              name={campo.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{campo.label}</FormLabel>
                  <FormControl>
                    <Input
                      type={campo.type ?? 'text'}
                      placeholder={campo.placeholder}
                      disabled={procesando}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <FormField
            control={form.control}
            name="constrasena"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={verContrasena ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                      disabled={procesando}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setVerContrasena((v) => !v)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        verContrasena
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                    >
                      {verContrasena ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repite la contraseña</FormLabel>
                <FormControl>
                  <Input
                    type={verContrasena ? 'text' : 'password'}
                    autoComplete="new-password"
                    disabled={procesando}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={procesando}>
            {procesando && <Spinner className="me-2 h-4 w-4 animate-spin" />}
            {procesando ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link
          to={`/auth/signin${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-medium text-primary hover:underline"
        >
          Ingresa
        </Link>
      </p>
    </div>
  );
}
