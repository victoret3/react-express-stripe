import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import TiendaOnline from "./pages/TiendaOnline";
import Layout from "./components/Layout";
import SobreMi from "./pages/SobreMi";
import MiObra from "./pages/MiObra";
import CollectionPage from "./pages/CollectionPage";
import Cart from "./Cart";
import Nfts from "./pages/Nfts"; 
import { CartProvider } from "./CartContext";
import ScrollToTop from "./components/ScrollToTop";
import Success from "./pages/Success";
import Footer from "./components/Footer";
import TerminosYCondiciones from "./pages/TerminosYCondiciones";
import PoliticaDeReembolso from "./pages/PoliticaDeReembolso";
import PoliticaDeEnvio from "./pages/PoliticaDeEnvio";
import AvisoLegal from "./pages/AvisoLegal";
import Contacto from "./pages/Contacto";

const App: React.FC = () => {
  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tienda-online" element={<TiendaOnline />} />
            <Route path="/sobre-mi" element={<SobreMi />} />
            <Route path="/mi-obra" element={<MiObra />} />
            <Route path="/coleccion/:slug" element={<CollectionPage />} />
            <Route path="/carrito" element={<Cart />} />
            <Route path="/nfts" element={<Nfts />} />
            <Route path="/success" element={<Success />} />

            {/* Rutas legales */}
            <Route
              path="/terminos-y-condiciones"
              element={<TerminosYCondiciones />}
            />
            <Route
              path="/politica-de-reembolso"
              element={<PoliticaDeReembolso />}
            />
            <Route path="/politica-de-envio" element={<PoliticaDeEnvio />} />
            <Route path="/aviso-legal" element={<AvisoLegal />} />
            <Route path="/contacto" element={<Contacto />} />
          </Routes>
          <Footer />
        </Layout>
      </Router>
    </CartProvider>
  );
};

export default App;