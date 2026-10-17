import { z } from 'zod';

/**
 * Validacion de "programar funcion".
 *
 * Los selects e inputs entregan texto: los ids y el precio se validan
 * como texto aqui y se convierten a numero al enviar.
 */
export const getFuncionSchema = () =>
  z
    .object({
      idPelicula: z.string().min(1, { message: 'Elige una película' }),
      idSala: z.string().min(1, { message: 'Elige una sala' }),
      fecha: z.string().min(1, { message: 'Elige la fecha' }),
      horaInicio: z.string().min(1, { message: 'Hora de inicio' }),
      horaFin: z.string().min(1, { message: 'Hora de fin' }),
      precio: z
        .string()
        .min(1, { message: 'Ingresa el precio' })
        .refine((v) => Number(v) > 0, { message: 'Debe ser mayor a 0' }),
    })
    // Misma regla que el backend: avisar aqui evita un viaje inutil
    .refine((d) => !d.horaInicio || !d.horaFin || d.horaFin > d.horaInicio, {
      message: 'Debe ser posterior al inicio',
      path: ['horaFin'],
    });

export type FuncionSchemaType = z.infer<ReturnType<typeof getFuncionSchema>>;
