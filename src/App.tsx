import { AppRouting } from '@/routing/app-routing';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { LoadingBarContainer } from 'react-top-loading-bar';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from './auth/providers/local-auth-provider';
import { I18nProvider } from './providers/i18n-provider';
import { QueryProvider } from './providers/query-provider';
import { SettingsProvider } from './providers/settings-provider';
import { ThemeProvider } from './providers/theme-provider';
import { TooltipsProvider } from './providers/tooltips-provider';
import { ConfirmarProvider } from './components/common/confirmar/confirmar-provider';
import { ErrorBoundary } from './components/common/error-boundary';


const { BASE_URL } = import.meta.env;

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <SettingsProvider>
          <ThemeProvider>
            <I18nProvider>
              <HelmetProvider>
                <TooltipsProvider>
                  <LoadingBarContainer>
                    <BrowserRouter basename={BASE_URL}>
                      <Toaster />

                      {/* Avisos: toast (sonner) para "se creo"; ConfirmarProvider
                          para preguntar antes de algo importante */}
                      <ConfirmarProvider>
                        {/* Red de seguridad: si una pantalla revienta, muestra un
                            mensaje en vez de dejar la pagina en blanco */}
                        <ErrorBoundary>
                          <AppRouting />
                        </ErrorBoundary>
                      </ConfirmarProvider>
                    </BrowserRouter>
                  </LoadingBarContainer>
                </TooltipsProvider>
              </HelmetProvider>
            </I18nProvider>
          </ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
