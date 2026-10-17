import { AuthRouting } from '@/auth/auth-routing';
import { RequireAuth } from '@/auth/require-auth';
import { RequireRole } from '@/auth/require-role';
import { ErrorRouting } from '@/errors/error-routing';
import { Demo1Layout } from '@/layouts/demo1/layout';
import { PublicoLayout } from '@/layouts/publico/layout';
import { FuncionAsientosPage } from '@/pages/funciones/funciones-asientos-page';
import { PeliculasDellatePage } from '@/pages/peliculas/peliculas-detalle-page';

import { PeliculasPage } from '@/pages/peliculas/peliculas-page';
import { PersonasPage } from '@/pages/panel/personas-page';
import { DashboardPage } from '@/pages/panel/dashboard-page';
import { FuncionesPage } from '@/pages/panel/funciones-page';
import { PeliculasPanelPage } from '@/pages/panel/peliculas-panel-page';
import { Navigate, Route, Routes } from 'react-router';


export function AppRoutingSetup() {
  return (
    <Routes>
      {/* La raiz lleva a la cartelera: es la pagina de inicio del cine */}
      <Route path="/" element={<Navigate to="/peliculas" replace />} />

     {/* PUBLICO */}

        <Route element={<PublicoLayout />}>
          <Route path="/peliculas" element={<PeliculasPage />} />
          <Route path="/peliculas/:id" element={<PeliculasDellatePage />} />
          <Route path="/funciones/:id" element={<FuncionAsientosPage />} />
        </Route>
     



      {/* PRIVADO */}
      <Route element={<RequireAuth />}>
        <Route element={<Demo1Layout />}>
          {/* Inicio del panel: destino de ADMIN y GERENTE tras el login */}
          <Route element={<RequireRole roles={['ADMIN', 'GERENTE']} />}>
            <Route path="/panel" element={<DashboardPage />} />
            <Route path="/panel/personas" element={<PersonasPage />} />
            <Route path="/panel/funciones" element={<FuncionesPage />} />
            <Route path="/panel/peliculas" element={<PeliculasPanelPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="error/*" element={<ErrorRouting />} />
      <Route path="auth/*" element={<AuthRouting />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
}
