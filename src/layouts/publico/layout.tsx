import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Outlet, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, LogOut } from "lucide-react";
import { toAbsoluteUrl } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/common/container";
import { AnuncioFuncion } from "@/components/common/anuncio-funcion";
import { CieloEstrellas } from "@/components/common/cielo-estrellas";
import { useAuth } from "@/auth/context/auth-context";

const ENLACES = [
    { titulo: 'Cartelera', ruta: '/peliculas' }
]

export function PublicoLayout() {
    const { isAuthenticated, user, logout, tieneRol } = useAuth();

    // Telon azul en la cartelera (/peliculas) y en el mapa de butacas
    // (/funciones/:id). El detalle de pelicula NO lo lleva: ya tiene su propio
    // fondo (el poster borroso). Al ponerlo en el contenedor (no dentro de la
    // pagina) el azul sube por detras del header transparente, como en EDteam
    const { pathname } = useLocation();
    const conTelon = pathname === '/peliculas' || pathname.startsWith('/funciones/');

    // Header "al estilo cine": arranca transparente (se mezcla con el fondo) y
    // recien se pinta de oscuro cuando el usuario baja un poco
    const [conScroll, setConScroll] = useState(false);
    useEffect(() => {
        const alScroll = () => setConScroll(window.scrollY > 8);
        alScroll(); // por si se entra con la pagina ya desplazada (F5 a media altura)
        window.addEventListener('scroll', alScroll, { passive: true });
        return () => window.removeEventListener('scroll', alScroll);
    }, []);

    return (
        // "dark" fijo: la zona publica se ve SIEMPRE oscura, sin importar el
        // tema global (el panel es el unico que cambia claro/oscuro). Como el
        // modo oscuro es por clase, esto tine todo el subarbol de negro.
        // Con telon azul en cartelera y butacas; en el resto, negro liso.
        // relative/isolate: para que la capa de estrellas (-z-10) quede detras
        // del contenido pero por delante del degradado del fondo.
        <div className={`relative isolate flex min-h-screen grow flex-col text-foreground dark ${conTelon ? 'fondo-peliculas' : 'bg-background'}`}>
            <Helmet><title>Cine</title></Helmet>

            {/* Lucecitas que titilan sobre el degradado (solo donde hay telon) */}
            {conTelon && <CieloEstrellas />}

            {/* Barra de anuncio con la proxima funcion (se puede cerrar) */}
            <AnuncioFuncion />

            {/* sticky: la cabecera se queda arriba al hacer scroll.
                Arriba del todo va transparente; al bajar se vuelve oscura con
                desenfoque y borde. transition-colors hace el cambio suave */}
            <header
                className={`sticky top-0 z-10 border-b transition-colors duration-300 ${
                    conScroll
                        ? 'border-border bg-background/90 backdrop-blur'
                        : 'border-transparent bg-transparent'
                }`}
            >
                <Container className="flex h-16 items-center gap-8">
                    {/* Nombre: siempre lleva al inicio de la zona publica */}
                    {/* El logo ya trae el nombre: no hace falta texto al lado.
                        h-10 = 40px, entra en la cabecera de 64px; w-auto mantiene la proporcion */}
                    <Link to="/peliculas" className="shrink-0">
                        <img
                            src={toAbsoluteUrl('/media/app/descarga.png')}
                            alt="Posgrado Cine"
                            className="h-10 w-auto"
                        />
                    </Link>

                    <nav className="flex items-center gap-6">
                        {ENLACES.map((enlace) => (
                            <NavLink
                                key={enlace.ruta}
                                to={enlace.ruta}
                                className={({ isActive }) =>
                                    isActive ? 'text-sm font-medium text-primary' : 'text-sm font-medium text-secondary-foreground hover:text-primary'
                                }
                            >
                                {enlace.titulo}
                            </NavLink>
                        ))}
                    </nav>

                    {/* ms-auto empuja todo este bloque al extremo derecho */}
                    <div className="ms-auto flex items-center gap-3">
                        {/* La cabecera cambia segun haya sesion: asi el cliente sabe
                            que esta dentro y tiene a mano como salir */}
                        {isAuthenticated ? (
                            <>
                                <div className="hidden items-center gap-2 sm:flex">
                                    {/* Inicial como avatar: no hay foto de perfil en el backend */}
                                    <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
                                        {user?.usuario.charAt(0)}
                                    </span>
                                    <span className="text-sm font-medium text-mono">{user?.usuario}</span>
                                </div>
                                {/* Solo el personal ve el atajo al panel */}
                                {tieneRol('ADMIN', 'GERENTE') && (
                                    <Button variant="outline" size="sm" asChild>
                                        <Link to="/panel">
                                            <LayoutDashboard className="size-4" /> Panel
                                        </Link>
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={logout}>
                                    <LogOut className="size-4" /> Salir
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link to="/auth/signup">Crear cuenta</Link>
                                </Button>
                                <Button size="sm" asChild>
                                    <Link to="/auth/signin">Ingresar</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </Container>
            </header>

            {/* Outlet: aqui React Router inserta la pantalla de la ruta actual */}
            <main className="grow">
                <Outlet />
            </main>

            <footer className="border-t border-border py-6">
                <Container>
                    <p className="text-center text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Cine · Diplomado Full Stack
                    </p>
                </Container>
            </footer>
        </div>
    )
}
