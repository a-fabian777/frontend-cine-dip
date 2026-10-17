import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Banknote, CalendarDays, Clapperboard, Users } from 'lucide-react';
import { useAuth } from '@/auth/context/auth-context';
import { carteleraService } from '@/services/cartelera.service';
import { peliculaService } from '@/services/pelicula.service';
import { personaService } from '@/services/persona.service';
import { Funcion } from '@/types/cartelera';
import { Pelicula } from '@/types/pelicula';
import { Container } from '@/components/common/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toAbsoluteUrl } from '@/lib/helpers';

interface Datos {
  peliculas: Pelicula[];
  totalPersonas: number;
  funciones: Funcion[];
}

const bs = (n: number) => `Bs ${n.toLocaleString('es-BO')}`;

// Solo 3 peticiones (peliculas, personas, funciones). No se consultan las
// butacas de cada funcion: eso eran ~1 peticion por funcion y chocaba con
// el limite del backend (100/min). Todo lo de abajo sale de esas 3
let cache: { datos: Datos; momento: number } | null = null;
const CACHE_MS = 60_000;

export function DashboardPage() {
  const { user } = useAuth();
  const [datos, setDatos] = useState<Datos | null>(cache?.datos ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Caché fresca: se reusa sin volver a pedir nada
    if (cache && Date.now() - cache.momento < CACHE_MS) {
      setDatos(cache.datos);
      return;
    }

    async function cargar() {
      const [peliculas, personas, funciones] = await Promise.all([
        peliculaService.listarPeliculas(1, 100),
        // Solo interesa el total: con 1 por pagina la respuesta es minima
        personaService.listar(1, 1),
        carteleraService.listarFunciones(),
      ]);

      const nuevos = { peliculas: peliculas.data, totalPersonas: personas.total, funciones };
      cache = { datos: nuevos, momento: Date.now() };
      setDatos(nuevos);
    }
    cargar().catch((e: Error) => setError(e.message));
  }, []);

  // Todas las cuentas salen de los mismos datos: se calculan una sola vez
  const resumen = useMemo(() => {
    if (!datos) return null;
    const { funciones, peliculas } = datos;

    // Agrupa las funciones por una clave (dia, sala, pelicula) y las cuenta
    const agrupar = (clave: (f: Funcion) => string) => {
      const mapa = new Map<string, number>();
      for (const f of funciones) mapa.set(clave(f), (mapa.get(clave(f)) ?? 0) + 1);
      return [...mapa.entries()].map(([nombre, funciones]) => ({ nombre, funciones }));
    };

    const precios = funciones.map((f) => f.precio);
    const precioPromedio = precios.length
      ? Math.round(precios.reduce((s, p) => s + p, 0) / precios.length)
      : 0;

    return {
      peliculasActivas: peliculas.filter((p) => p.activo).length,
      totalPeliculas: peliculas.length,
      precioPromedio,
      precioMin: precios.length ? Math.min(...precios) : 0,
      precioMax: precios.length ? Math.max(...precios) : 0,
      porDia: agrupar((f) => f.fecha).sort((a, b) => a.nombre.localeCompare(b.nombre)),
      porSala: agrupar((f) => `${f.sala} · ${f.tipoSala}`).sort((a, b) => b.funciones - a.funciones),
      topPeliculas: agrupar((f) => f.pelicula)
        .sort((a, b) => b.funciones - a.funciones)
        .slice(0, 5),
    };
  }, [datos]);

  return (
    <Container>
      <div className="space-y-6 py-6">
        {/* Banner de bienvenida: la ilustracion de la plantilla luce como
            decoracion (no como icono). Cambia el numero del archivo para otra */}
        <Card className="overflow-hidden border-0 bg-primary text-primary-foreground">
          <CardContent className="flex items-center justify-between gap-4 p-7">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Hola, {user?.usuario}</h1>
              <p className="text-sm text-primary-foreground/80">
                Este es el resumen de la cartelera de hoy.
              </p>
            </div>
            {/* La misma ilustracion sirve en claro y oscuro; se oculta en movil */}
            <img
              src={toAbsoluteUrl('/media/illustrations/21.svg')}
              alt=""
              className="hidden h-28 w-auto sm:block"
            />
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!resumen ? (
          !error && <p className="text-sm text-muted-foreground">Cargando datos…</p>
        ) : (
          <>
            {/* Fila 1: cuatro numeros con color */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Tile color="azul" icono={<Clapperboard className="size-6" />} valor={resumen.peliculasActivas}
                texto={`Películas activas de ${resumen.totalPeliculas}`} />
              <Tile color="verde" icono={<CalendarDays className="size-6" />} valor={datos!.funciones.length}
                texto="Funciones programadas" />
              <Tile color="amarillo" icono={<Banknote className="size-6" />} valor={resumen.precioPromedio}
                texto={`Precio promedio · de ${bs(resumen.precioMin)} a ${bs(resumen.precioMax)}`} prefijo="Bs " />
              <Tile color="rojo" icono={<Users className="size-6" />} valor={datos!.totalPersonas}
                texto="Personas registradas" />
            </div>

            {/* Fila 2: funciones por sala + funciones por dia */}
            <div className="grid gap-5 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Funciones por sala</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resumen.porSala.map((sala, i) => (
                    <div key={sala.nombre} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium text-mono">
                          {/* Puntito del mismo color que la barra */}
                          <span className={`size-2.5 rounded-full ${COLORES_BARRA[i % COLORES_BARRA.length]}`} />
                          {sala.nombre}
                        </span>
                        {/* El numero como pastilla, no texto suelto */}
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-mono">
                          {sala.funciones}
                        </span>
                      </div>
                      {/* Cada sala un color distinto, en orden fijo */}
                      <Barra valor={sala.funciones} maximo={resumen.porSala[0].funciones}
                        color={COLORES_BARRA[i % COLORES_BARRA.length]} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Funciones por día</CardTitle>
                </CardHeader>
                <CardContent>
                  <Columnas
                    datos={resumen.porDia.map((d) => ({
                      etiqueta: d.nombre.slice(5).split('-').reverse().join('/'), // "09-17" → "17/09"
                      valor: d.funciones,
                      detalle: `${d.funciones} ${d.funciones === 1 ? 'función' : 'funciones'}`,
                    }))}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Fila 3: peliculas con mas funciones */}
            <Card>
              <CardHeader>
                <CardTitle>Películas con más funciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumen.topPeliculas.map((p, i) => (
                  <div key={p.nombre} className="grid grid-cols-[1.75rem_minmax(0,13rem)_1fr_auto] items-center gap-4 text-sm">
                    {/* Posicion: el 1ro resalta en azul, el resto en gris */}
                    <span className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                      i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-secondary-foreground'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="truncate font-medium text-mono" title={p.nombre}>{p.nombre}</span>
                    <Barra valor={p.funciones} maximo={resumen.topPeliculas[0].funciones || 1} />
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-mono">
                      {p.funciones}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Container>
  );
}

// Tokens de la plantilla (los mismos que usan los Badge). Definidos en
// config.reui.css: primary, success, warning, destructive, info
const COLORES_TILE = {
  azul: 'bg-primary/10 text-primary',
  verde: 'bg-success/10 text-success',
  amarillo: 'bg-warning/10 text-warning',
  rojo: 'bg-destructive/10 text-destructive',
} as const;

// Colores de barra, en orden fijo: cada sala siempre del mismo color
const COLORES_BARRA = ['bg-primary', 'bg-success', 'bg-warning', 'bg-destructive', 'bg-info'];

// Numero suelto con icono: para un solo dato no hace falta grafico
function Tile({
  icono,
  valor,
  texto,
  color,
  prefijo,
}: {
  icono: ReactNode;
  valor: number;
  texto: string;
  color: keyof typeof COLORES_TILE;
  prefijo?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        {/* size-11 e icono mas grande: el color se nota mas */}
        <span className={`flex size-11 items-center justify-center rounded-lg ${COLORES_TILE[color]}`}>
          {icono}
        </span>
        <div>
          <p className="text-3xl font-semibold text-mono">
            {prefijo}{valor.toLocaleString('es-BO')}
          </p>
          <p className="text-sm text-secondary-foreground">{texto}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Barra horizontal: el fondo es el total, el relleno el valor. color opcional
function Barra({ valor, maximo, color = 'bg-primary' }: { valor: number; maximo: number; color?: string }) {
  const ancho = maximo === 0 ? 0 : (valor / maximo) * 100;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      {/* Minimo visible si hay al menos uno, si no un 1% seria invisible */}
      <div
        className={`h-full rounded-full transition-[width] ${color}`}
        style={{ width: valor > 0 ? `max(${ancho}%, 4px)` : '0' }}
      />
    </div>
  );
}

// Columnas verticales con su valor encima y detalle al pasar el mouse
function Columnas({ datos }: { datos: { etiqueta: string; valor: number; detalle: string }[] }) {
  const maximo = Math.max(...datos.map((d) => d.valor), 1);
  return (
    <div className="flex h-56 items-end gap-4 border-b border-border">
      {datos.map((d) => (
        <div key={d.etiqueta} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          {/* Tooltip: aparece al pasar el mouse por toda la columna, no solo la barra */}
          <div className="pointer-events-none absolute -top-2 z-10 hidden whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-sm group-hover:block">
            {d.detalle}
          </div>
          <span className="text-sm font-medium text-mono">{d.valor}</span>
          {/* Verde (success) para diferenciarse de las barras de sala (azules) */}
          <div
            className="w-full max-w-16 rounded-t bg-success transition-colors group-hover:bg-success/80"
            style={{ height: `${(d.valor / maximo) * 80}%`, minHeight: d.valor > 0 ? 4 : 0 }}
          />
          <span className="absolute -bottom-6 text-xs text-muted-foreground">{d.etiqueta}</span>
        </div>
      ))}
    </div>
  );
}
