
export interface CrearPersona {
  nombres: string;
  apellidos: string;
  documento: string;
  telefono: string;
  email: string;
  fechaNacimiento: string;
  usuario: string;
  constrasena: string;
}

// respuesta
export interface PersonaCreada {
 status:string;
 message?:string;
 data: {
   nombres: string;
   apellidos: string;
   telefono: string;
  },
}

// get /persona y get /persona/buscar (ADMIN o GERENTE)
// Los dos vienen paginados igual que /peliculas: se usa RespuestaPaginada<Persona>
export interface Persona {
  id: number;
  nombres: string;   // el backend los guarda en MAYUSCULAS
  apellidos: string;
  documento: string;
  telefono: string;
  email: string;
  // ISO completa ("1995-05-20T04:00:00.000Z"): para mostrar, slice(0, 10)
  fechaNacimiento: string;
}

// Filtros de la busqueda. Filtra con Y, no con O: si van los dos,
// tienen que coincidir ambos. Y sin ninguno el backend responde error
export interface FiltroPersona {
  nombres?: string;
  apellidos?: string;
}
