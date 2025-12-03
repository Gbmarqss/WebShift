import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Editor from './Editor'; // A tela principal (Admin)
import Viewer from './Viewer'; // A tela de link público (Membros)

function App() {
  return (
    <Routes>
      {/* Quando acessar a raiz, mostra o Editor */}
      <Route path="/" element={<Editor />} />
      
      {/* Quando acessar /share, mostra o Visualizador */}
      <Route path="/share" element={<Viewer />} />
    </Routes>
  );
}

export default App;