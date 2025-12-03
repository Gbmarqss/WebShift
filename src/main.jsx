import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Importa o Roteador
import './index.css'
import { BrowserRouter } from 'react-router-dom' // Habilita a troca de páginas

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
