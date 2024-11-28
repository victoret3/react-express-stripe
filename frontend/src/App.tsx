import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import TiendaOnline from './pages/TiendaOnline';
import Layout from './components/Layout';
import SobreMi from './pages/SobreMi';
import MiObra from './pages/MiObra';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tienda-online" element={<TiendaOnline />} />
          <Route path="/sobre-mi" element={<SobreMi />} />
          <Route path="/mi-obra" element={<MiObra />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
