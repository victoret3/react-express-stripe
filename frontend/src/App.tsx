import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import TiendaOnline from './pages/TiendaOnline';
import Layout from './components/Layout';
import SobreMi from './pages/SobreMi';
import MiObra from './pages/MiObra';
import CollectionPage from './pages/CollectionPage';
import Cart from './Cart';
import { CartProvider } from './CartContext'; // Importa el CartProvider

const App: React.FC = () => {
  return (
    // Envuelve toda la aplicación con CartProvider
    <CartProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tienda-online" element={<TiendaOnline />} />
            <Route path="/sobre-mi" element={<SobreMi />} />
            <Route path="/mi-obra" element={<MiObra />} />
            <Route path="/coleccion/:slug" element={<CollectionPage />} />
            <Route path="/carrito" element={<Cart />} />
          </Routes>
        </Layout>
      </Router>
    </CartProvider>
  );
};

export default App;
