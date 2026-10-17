import { z } from 'zod';

/**
 * Validacion de "nueva pelicula".
 *
 * Las imagenes no van aqui: un input file no encaja bien en zod y se
 * validan aparte en la pantalla (cantidad, tipo y tamano).
 */
export const getPeliculaSchema = () =>
  z.object({
    titulo: z.string().trim().min(1, { message: 'Ingresa el título' }),
    sinopsis: z.string().trim().min(1, { message: 'Ingresa la sinopsis' }),
    duracionMinutos: z
      .string()
      .min(1, { message: 'Ingresa la duración' })
      // El backend exige entero mayor a 0
      .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, {
        message: 'Minutos enteros, mayor a 0',
      }),
    fechaEstreno: z.string().min(1, { message: 'Elige la fecha de estreno' }),
    activo: z.boolean(),
  });

export type PeliculaSchemaType = z.infer<ReturnType<typeof getPeliculaSchema>>;
