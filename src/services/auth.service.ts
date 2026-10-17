import { http } from "@/lib/http";
import { RespuestaLogin, Credenciales, Rol, RespuestaRoles, AsignarRol, RolAsignado } from "@/types/auth"


const CLAVE_TOKEN = 'cine_token';
export const authService = {
    async login(credenciales: Credenciales): Promise<string> {
        const {data} = await http.post<RespuestaLogin>('/auth/login', credenciales);
        const token = data?.data?.token;
        if (!token) { throw new Error ('El servidor no devolvio un token'); }
        return token;
    },

    // guardar el token
    // el token en el navegador
    guardarToken(token: string) {
        try {
            localStorage.setItem(CLAVE_TOKEN, token)
        } catch {
            // modo privado sin storage: no se puede recordar la sesion
        }
    },
    obtenerToken(): string | null {
        try {
               return localStorage.getItem(CLAVE_TOKEN);
        } catch {
                return null;
        }
    },
    borrarToken() {
        try {
            localStorage.removeItem(CLAVE_TOKEN);
        } catch  {
            // /no se hace nada/
        }
    },

    // roles que existen (ADMIN o GERENTE)
    async listarRoles(): Promise<Rol[]> {
        const {data} = await http.get<RespuestaRoles>('/auth/roles');
        return data.data;
    },

    // Solo ADMIN. El backend no evita duplicados: si ya lo tenia, crea otra fila
    async asignarRol(datos: AsignarRol): Promise<RolAsignado> {
        const {data} = await http.post<RolAsignado>('/auth/rol-usuario', datos);
        return data;
    },
}