import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Cada vez que cambie la ruta, hacemos scroll hasta arriba
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}