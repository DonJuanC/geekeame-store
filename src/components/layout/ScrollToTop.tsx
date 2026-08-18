import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// <BrowserRouter> + <Routes> (router declarativo, no createBrowserRouter)
// no trae scroll restoration de fábrica -- es SPA, cambiar de ruta no
// dispara una carga de página real que resetee scrollY. Sin esto,
// navegar a cualquier ruta nueva (no solo Home) dejaba la ventana en el
// mismo scroll de la página anterior, lo que con Home ahora más largo
// (hero + tiles + destacados + catálogo) hacía parecer que el click en
// el logo "no hacía nada". Se monta una vez arriba de <Routes> en App.tsx
// y dispara en cada cambio de pathname.
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
