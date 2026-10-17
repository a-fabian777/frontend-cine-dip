import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

// Marca en localStorage: el tour se muestra solo la primera vez
const CLAVE_TOUR = 'tour_panel_visto';

export function tourYaVisto(): boolean {
  try {
    return localStorage.getItem(CLAVE_TOUR) === '1';
  } catch {
    return false;
  }
}

function marcarVisto() {
  try {
    localStorage.setItem(CLAVE_TOUR, '1');
  } catch {
    // modo privado: no pasa nada, se volvera a mostrar
  }
}

// Espera a que un elemento exista en el DOM (tras cambiar de pagina),
// sondeando cada 100ms. Si no aparece en el tiempo dado, sigue igual
function esperarElemento(selector: string, ms = 2500): Promise<void> {
  return new Promise((resolve) => {
    const inicio = Date.now();
    const timer = setInterval(() => {
      if (document.querySelector(selector) || Date.now() - inicio > ms) {
        clearInterval(timer);
        resolve();
      }
    }, 100);
  });
}

// Un paso del tour; "navegar" + "esperar" marcan los que cambian de pagina
type PasoTour = DriveStep & { navegar?: string; esperar?: string };

/**
 * Recorrido guiado del panel (Driver.js). Ademas de resaltar el menu, NAVEGA:
 * al pasar por "Peliculas" lleva a esa pagina y resalta "Nueva pelicula";
 * igual con "Funciones" y "Programar funcion".
 *
 * navegar: funcion de react-router (useNavigate) para cambiar de ruta.
 * soloAdmin: ajusta el texto del paso de Personas (roles es solo de ADMIN).
 */
export function lanzarTourPanel(soloAdmin: boolean, navegar: (ruta: string) => void) {
  const pasos: PasoTour[] = [
    {
      popover: {
        title: '¡Bienvenido al panel! 🎬',
        description: 'Te muestro cómo administrar el cine paso a paso. Puedes salir cuando quieras.',
      },
    },
    {
      element: 'a[href$="/panel"]',
      popover: {
        title: '1. Inicio',
        description: 'Aquí ves el resumen: películas, funciones y personas.',
        side: 'right',
      },
    },
    {
      // Al dar Siguiente, navega a /panel/peliculas y espera el boton
      element: 'a[href$="/panel/peliculas"]',
      popover: {
        title: '2. Películas',
        description: 'Empieza por aquí. Vamos a verlo…',
        side: 'right',
      },
      navegar: '/panel/peliculas',
      esperar: '[data-tour="nueva-pelicula"]',
    },
    {
      element: '[data-tour="nueva-pelicula"]',
      popover: {
        title: 'Crear una película',
        description: 'Con este botón agregas una película nueva con su póster y sus imágenes.',
        side: 'bottom',
      },
    },
    {
      // Siguiente navega a /panel/funciones y espera su boton
      element: 'a[href$="/panel/funciones"]',
      popover: {
        title: '3. Funciones',
        description: 'Una vez tienes películas, programa sus funciones. Vamos…',
        side: 'right',
      },
      navegar: '/panel/funciones',
      esperar: '[data-tour="programar-funcion"]',
    },
    {
      element: '[data-tour="programar-funcion"]',
      popover: {
        title: 'Programar una función',
        description: 'Aquí eliges película, sala, fecha, hora y precio de cada función.',
        side: 'bottom',
      },
    },
    {
      // Siguiente navega a /panel/personas
      element: 'a[href$="/panel/personas"]',
      popover: {
        title: '4. Personas',
        description: soloAdmin
          ? 'Por último, las personas registradas. Como ADMIN, puedes asignarles roles.'
          : 'Por último, consulta las personas registradas del cine.',
        side: 'right',
      },
      navegar: '/panel/personas',
      esperar: 'table',
    },
    {
      popover: {
        title: '¡Listo! 🍿',
        description: 'Ese es el flujo: películas → funciones → reservas. Vuelve a ver esta guía desde tu usuario.',
      },
    },
  ];

  const recorrido = driver({
    showProgress: true,
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    doneBtnText: 'Entendido',
    progressText: '{{current}} de {{total}}',
    onDestroyed: marcarVisto, // al terminar o cerrar, no se repite
    // Se sobreescribe el "Siguiente": si el paso navega, cambia de pagina,
    // espera el elemento y recien avanza. Si no, avanza normal
    onNextClick: async () => {
      const paso = pasos[recorrido.getActiveIndex() ?? 0];
      if (paso?.navegar) {
        navegar(paso.navegar);
        if (paso.esperar) await esperarElemento(paso.esperar);
      }
      recorrido.moveNext();
    },
  });

  recorrido.setSteps(pasos);
  recorrido.drive();
}
