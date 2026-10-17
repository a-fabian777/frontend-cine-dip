
export interface Credenciales {
    usuario: string;
    contrasena: string;
}

export interface RespuestaLogin {
  status: string;
  message?: string;
  data: { 
    token: string
  };
}

export interface PayloadToken {
        id: number;
        usuario: string;
        roles:string[];
        iat: number;
        exp: number;
}

// no viene de ningun lado 
export interface UsuarioSesion {
    id: number;
    usuario: string;
    roles: string[];
}

// get /auth/roles (ADMIN o GERENTE): 1 ADMIN, 2 GERENTE, 3 CLIENTE
export interface Rol {
    id: number;
    rol: string;
}

export interface RespuestaRoles {
    status: string;
    message?: string;
    data: Rol[];
}

// post /auth/rol-usuario (solo ADMIN). idPersona es tambien el id
// del usuario: en el backend comparten el mismo numero
export interface AsignarRol {
    idPersona: number;
    idRol: number;
}

export interface RolAsignado {
    status: string;
    message?: string;
    data: {
        idRolUsuario: number;
        idUsuario: number;
        idRol: number;
        estado: boolean;
        fechaInicio: string;
    };
}
