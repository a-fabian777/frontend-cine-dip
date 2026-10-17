import axios from 'axios';
import { env } from "@/config/env";
import { authService } from '@/services/auth.service';

// cliente http 

export const http = axios.create({
    // axios va http://localhost:3000/api/v1/peliculas
    baseURL: env.apiUrl,
    timeout:  10000, // 10 seg
});



// request: corre ANTES de que salga la peticion, por eso aqui se pega el token
http.interceptors.request.use((config) => {
    const token = authService.obtenerToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config;
})



// Quien maneja la sesion (el proveedor) se anota aqui para enterarse de un 401.
// http.ts no puede usar el contexto de React: asi se avisan sin acoplarse
let alVencerSesion: (() => void) | null = null;

// Un solo texto para el aviso del proveedor y el error de la pantalla:
// usado como id del toast, sonner muestra uno y no dos iguales
export const MENSAJE_SESION_VENCIDA = 'Tu sesión venció. Vuelve a iniciar sesión.';

export function registrarSesionVencida(funcion: (() => void) | null) {
    alVencerSesion = funcion;
}

http.interceptors.response.use(
    // si sale bien
    (respuesta) => respuesta,
    // si sale mal
    (error) => {
        const estado = error.response?.status;
        const datos = error.response?.data;

        // 401 fuera del login = token vencido o invalido: se cierra la sesion.
        // En el login, 401 solo significa usuario o clave equivocados
        const esLogin = error.config?.url === '/auth/login';
        if (estado === 401 && !esLogin) {
            alVencerSesion?.();
            return Promise.reject(new Error(MENSAJE_SESION_VENCIDA));
        }

        // Los guardias del backend responden en ingles ("Forbidden resource")
        if (estado === 403) {
            return Promise.reject(new Error('No tienes permiso para realizar esta acción.'));
        }

        // backend responde {status, message, timestamp}, pero los errores de
        // validacion traen message como arreglo (uno por campo)
        const mensaje = Array.isArray(datos?.message)
            ? datos.message.join('. ')
            : datos?.message ?? 'No se puede conectar con el servidor';
        return Promise.reject(new Error(mensaje));
    },
)



