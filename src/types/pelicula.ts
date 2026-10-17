
// get
// catalogo de pelicula
export interface Pelicula {
  id: number;
  titulo: string;
  sinopsis: string;
  duracionMinutos: number;
  fechaEstreno: string;
  activo: boolean;
  // Solo los nombres del archivo, no las imagenes
  // URL se armando con {apiUrl}/files/pelicula/{nombre}
  imagenes: string[];
}

// Es generico es un hueco que rrelena al usarlo
// asi la RespuestaPaginada<Pelicula> sirvir para las peliculas

export interface RespuestaPaginada<T> {
  status: string;
  message?: string;
  data: T[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

// post /peliculas (ADMIN o GERENTE). Va como multipart/form-data
// porque lleva archivos; las imagenes se mandan aparte, en el campo "imagenes"
export interface NuevaPelicula {
  titulo: string;           // el backend lo guarda en MAYUSCULAS
  sinopsis: string;
  duracionMinutos: number;
  fechaEstreno: string;     // "2026-09-12"
  activo: boolean;
}

// Ojo: al responder los nombres cambian (duracion, fecha) y no trae
// las imagenes, aunque Swagger diga que si
export interface PeliculaCreada {
  status: string;
  message?: string;
  data: {
    id: number;
    titulo: string;
    sinopsis: string;
    duracion: number;
    fecha: string;
  };
}
