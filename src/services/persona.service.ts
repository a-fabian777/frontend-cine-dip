import { http } from "@/lib/http";
import { CrearPersona, FiltroPersona, Persona, PersonaCreada } from "@/types/persona";
import { RespuestaPaginada } from "@/types/pelicula";



// llamadas a la api de personas
export const personaService = {

    // registro publico (sin "rol": el backend pone CLIENTE)
    async registrar(persona: CrearPersona): Promise<PersonaCreada> {
        const {data} = await http.post<PersonaCreada>('/persona', persona);
        return data;
    },

    // listado del panel (ADMIN o GERENTE: el interceptor manda el token)
    async listar(pagina = 1, porPagina = 10): Promise<RespuestaPaginada<Persona>> {
        const {data} = await http.get<RespuestaPaginada<Persona>>('/persona', {
            params: {pagina, porPagina}
        });
        return data;
    },

    // Busca con Y: si van nombres y apellidos, deben coincidir los dos.
    // Los vacios no se mandan; sin ninguno el backend responde error
    async buscar(
        filtro: FiltroPersona,
        pagina = 1,
        porPagina = 10,
    ): Promise<RespuestaPaginada<Persona>> {
        const {data} = await http.get<RespuestaPaginada<Persona>>('/persona/buscar', {
            params: {
                nombres: filtro.nombres?.trim() || undefined,
                apellidos: filtro.apellidos?.trim() || undefined,
                pagina,
                porPagina,
            }
        });
        return data;
    },
}
