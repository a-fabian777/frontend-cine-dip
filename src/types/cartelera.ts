
export interface Funcion {
    idFuncion: number;
    idPelicula: number;
    pelicula: string;
    idSala: number;
    sala: string,
    tipoSala: string,
    fecha: string;
    horaInicio: string;
    horaFin: string;
    precio: number;
    estado: string;
}

// espera
export interface Sala {
    idSala: number;
    nombre: string;
    capacidad: number;
    tipo: string;
    activa: boolean;
}
 
//  Asiento

export interface Asiento {
    idAsiento: number;
    idSala: number;
    sala: string;
    fila: string; // A,B,C
    numero: number;
    asiento: string; // A1
    tipo: string; // NORMAL, VIP, etc.
    activo: boolean;
    disponible: boolean;
}

// post /cartelera/funciones (ADMIN o GERENTE)
// Las horas van CON segundos ("19:00:00"): el input time da "19:00"
// y el backend lo rechaza. La fecha va "2026-09-17"
export interface NuevaFuncion {
    idPelicula: number;
    idSala: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;   // debe ser posterior al inicio, el mismo dia
    precio: number;
    // estado se omite: el backend pone PROGRAMADA
}

// Responde lo mismo que se envio, con su idFuncion
export interface FuncionCreada {
    status: string;
    message?: string;
    data: NuevaFuncion & { idFuncion: number; estado: string };
}
