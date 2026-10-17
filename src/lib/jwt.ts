import { PayloadToken } from "@/types/auth"; 

export function leerToken(token: string): PayloadToken | null {
    try {
        // [0] cabezera, [1] contenido, [2] firma
        const contenido = token.split('.')[1];
        if (!contenido)  return null;

        // El JWT viene en base64url (usa - y _ en vez de + y /)
        // atob solo entiende base64 normal, por eso se revierte
        const base64 = contenido.replace(/-/g, '+').replace(/_/g, '/');

        // atob devuelve bytes sueltos; TextDecoder los une como UTF-8
        // para que una ñ o tilde en el usuario no salga rota
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const json = new TextDecoder().decode(bytes);

        const payload = JSON.parse(json) as PayloadToken;
        return payload;
    } catch {
        // Token mal formado: se trata igual que no tener sesion
        return null;
    }
}

export function estaVencido(payload: PayloadToken | null): boolean {
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
}