import { Component, ReactNode } from 'react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Red de seguridad para errores de CODIGO (un undefined.algo, etc.), no de red.
 * Sin esto, un fallo al dibujar deja la pagina en blanco; aqui se muestra un
 * mensaje y un boton para recargar. Debe ser clase: React no tiene hook equivalente.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  // React llama esto cuando un hijo revienta al dibujarse
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Queda en consola para depurar; en produccion iria a un servicio de logs
    console.error('>>> Error no controlado:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-8 text-center">
        <img
          src={toAbsoluteUrl('/media/illustrations/20.svg')}
          alt=""
          className="h-40 w-auto dark:hidden"
        />
        <img
          src={toAbsoluteUrl('/media/illustrations/20-dark.svg')}
          alt=""
          className="hidden h-40 w-auto dark:block"
        />
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold text-mono">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground">
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()}>Recargar página</Button>
          {/* a y no Link: el boundary puede estar fuera del Router */}
          <Button variant="outline" asChild>
            <a href="/">Ir al inicio</a>
          </Button>
        </div>
      </div>
    );
  }
}
