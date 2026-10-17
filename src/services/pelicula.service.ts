import { env } from "@/config/env";
import { http } from "@/lib/http";
import { NuevaPelicula, Pelicula, PeliculaCreada, RespuestaPaginada } from "@/types/pelicula";

export const peliculaService = {
    async listarPeliculas(
         pagina = 1,
         porPagina = 20,
        ): Promise<RespuestaPaginada<Pelicula>  > {
        const {data} = await http.get<RespuestaPaginada<Pelicula>>('/peliculas' , {
            params: {pagina, porPagina}
          });
        return data;
    },

    // detalles de pelicula
    async obtenerPelicula(id:number): Promise<Pelicula | undefined> {
        const respuesta = await this.listarPeliculas(1, 100);
        return respuesta.data.find((p) => p.id === id)
    },

    // url para porter
    urlImagen(nombreArchivo : string) : string {
        return `${env.apiUrl}/files/pelicula/${nombreArchivo}`
    },

    // crear pelicula (ADMIN o GERENTE). Lleva archivos, asi que no va
    // como JSON sino como FormData: todo viaja como texto y el backend
    // convierte duracion y activo con sus @Transform
    async crearPelicula(pelicula: NuevaPelicula, imagenes: File[]): Promise<PeliculaCreada> {
        const formulario = new FormData();
        formulario.append('titulo', pelicula.titulo);
        formulario.append('sinopsis', pelicula.sinopsis);
        formulario.append('duracionMinutos', String(pelicula.duracionMinutos));
        formulario.append('fechaEstreno', pelicula.fechaEstreno);
        formulario.append('activo', String(pelicula.activo));
        // Mismo nombre de campo repetido: asi el backend recibe un arreglo
        imagenes.forEach((imagen) => formulario.append('imagenes', imagen));

        // Sin Content-Type a mano: axios pone multipart con su "boundary"
        const {data} = await http.post<PeliculaCreada>('/peliculas', formulario);
        return data;
    },

}