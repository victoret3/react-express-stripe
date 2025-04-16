import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import TiendaOnline from "./pages/TiendaOnline";
import Layout from "./components/Layout";
import SobreMi from "./pages/SobreMi";
import MiObra from "./pages/MiObra";
import CollectionPage from "./pages/CollectionPage";
import Cart from "./Cart";
import NftSuccess from "./pages/NftSuccess";
import Collections from "./pages/Collections";
import { CartProvider } from "./CartContext";
import ScrollToTop from "./components/ScrollToTop";
import Success from "./pages/Success";
import Footer from "./components/Footer";
import TerminosYCondiciones from "./pages/TerminosYCondiciones";
import PoliticaDeReembolso from "./pages/PoliticaDeReembolso";
import PoliticaDeEnvio from "./pages/PoliticaDeEnvio";
import AvisoLegal from "./pages/AvisoLegal";
import Contacto from "./pages/Contacto";
import NFTDetailPage from './pages/NFTDetailPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import LazyMintPage from './pages/LazyMintPage';
import NFTSuccessPage from './pages/NFTSuccessPage';
import { useToast } from '@chakra-ui/react';
import { switchToCorrectNetwork } from './config/network';

const App: React.FC = () => {
  const toast = useToast();

  useEffect(() => {
    // Manejador para el evento connect-wallet-required
    const handleConnectWalletRequired = () => {
      console.log("Evento connect-wallet-required recibido");
      
      // Intentar conectar la wallet
      const connectWallet = async () => {
        try {
          const { ethereum } = window as any;
          if (!ethereum) {
            toast({
              title: "MetaMask no detectado",
              description: "Por favor instala MetaMask para continuar.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            return;
          }
          
          // Cambiar a la red correcta
          await switchToCorrectNetwork();
          
          // Solicitar cuentas
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          
          toast({
            title: "Wallet conectada",
            description: "Tu wallet se ha conectado correctamente.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "No se pudo conectar la wallet.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      };
      
      connectWallet();
    };

    // Registrar el manejador del evento
    window.addEventListener('connect-wallet-required', handleConnectWalletRequired);
    
    // Limpieza al desmontar
    return () => {
      window.removeEventListener('connect-wallet-required', handleConnectWalletRequired);
    };
  }, [toast]);

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
            <Route path="/collections" element={<Collections />} />
            <Route path="/nft-success" element={<NftSuccess />} />
            <Route path="/success" element={<Success />} />
            <Route path="/lazy-mint" element={<LazyMintPage />} />
            <Route path="/nft-cancel" element={<Home />} />

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

            {/* Rutas de colecciones */}
            <Route path="/collection/:collectionId" element={<CollectionDetailPage />} />
            <Route path="/collection/:collectionAddress/nft/:tokenId" element={<NFTDetailPage />} />
          </Routes>
        </Layout>
      </Router>
    </CartProvider>
  );
};

export default App;