import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import TiendaOnline from './pages/TiendaOnline';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tienda-online" element={<TiendaOnline />} />
      </Routes>
    </Router>
  );
};

export default App;
