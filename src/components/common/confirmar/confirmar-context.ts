import { createContext, ReactNode, useContext } from 'react';

export interface OpcionesConfirmar {
  titulo: string;
  descripcion?: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  // Boton rojo e icono de advertencia: para lo que no se puede deshacer
  peligroso?: boolean;
}

/** Abre la ventana y espera la respuesta: true = confirmo, false = cancelo. */
export type Confirmar = (opciones: OpcionesConfirmar) => Promise<boolean>;

export const ConfirmarContext = createContext<Confirmar | null>(null);

/**
 * Pregunta antes de hacer algo importante, en una sola linea:
 *
 *   const confirmar = useConfirmar();
 *   if (!(await confirmar({ titulo: '¿Asignar el rol ADMIN?' }))) return;
 *
 * Es como el confirm() del navegador, pero con el estilo de la plantilla.
 */
export function useConfirmar(): Confirmar {
  const confirmar = useContext(ConfirmarContext);
  if (!confirmar) throw new Error('useConfirmar se uso fuera de ConfirmarProvider');
  return confirmar;
}
