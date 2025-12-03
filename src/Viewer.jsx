import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LZString from 'lz-string';
import { Calendar, Search, Moon, Sun, Download, Filter } from 'lucide-react';
import { exportarPDF } from './exportManager';
import { APP_VERSION } from './config';

export default function Viewer() {
  const [searchParams] = useSearchParams();
  const [escala, setEscala] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroMinisterio, setFiltroMinisterio] = useState("TODOS");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const dataCompressed = searchParams.get('d');
    if (dataCompressed) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(dataCompressed);
        if (decompressed) { setEscala(JSON.parse(decompressed)); } 
        else { setError("Link inválido."); }
      } catch (e) { setError("Erro ao ler link."); }
    } else { setError("Nenhuma escala."); }
    setLoading(false);
  }, [searchParams]);

  const toggleTheme = () => { const newTheme = theme === 'light' ? 'dark' : 'light'; setTheme(newTheme); if (newTheme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); };

  const itensFiltrados = escala.filter(item => {
    const textoMatch = item.Data.toLowerCase().includes(filtroTexto.toLowerCase()) || item.Voluntario.toLowerCase().includes(filtroTexto.toLowerCase()) || item.Funcao.toLowerCase().includes(filtroTexto.toLowerCase());
    let ministerioMatch = true;
    if (filtroMinisterio !== "TODOS") {
      let areaKey = 'OUTROS';
      if(item.Funcao.includes('Fotografo')||item.Funcao.includes('Suporte')) areaKey='TAKE';
      if(item.Funcao.includes('Filmagem')||item.Funcao.includes('Câmera')) areaKey='FILMAGEM';
      if(item.Funcao.includes('PRODUÇÃO')) areaKey='PRODUÇÃO';
      if(item.Funcao.includes('PROJEÇÃO')) areaKey='PROJEÇÃO';
      if(item.Funcao.includes('ILUMINAÇÃO')) areaKey='ILUMINAÇÃO';
      ministerioMatch = areaKey === filtroMinisterio;
    }
    return textoMatch && ministerioMatch;
  });

  const escalaAgrupada = Object.groupBy ? Object.groupBy(itensFiltrados, ({ Data }) => Data) : itensFiltrados.reduce((acc, item) => { (acc[item.Data] = acc[item.Data] || []).push(item); return acc; }, {});

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-gray-900 text-white' : 'bg-slate-50 text-slate-900';
  const cardClass = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm';

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>Carregando ChorusApp...</div>;
  if (error) return <div className={`min-h-screen flex items-center justify-center ${bgClass} text-red-500 font-bold`}>{error}</div>;

  return (
    <div className={`min-h-screen ${bgClass} font-sans transition-colors duration-300 flex flex-col`}>
      <header className={`px-6 py-4 shadow-sm flex justify-between items-center sticky top-0 z-50 backdrop-blur-md ${isDark ? 'bg-gray-900/90 border-b border-gray-800' : 'bg-white/90 border-b border-gray-200'}`}>
        <div className="flex items-center gap-2"><img src="/favicon.png" alt="Logo" className="w-8 h-8" /><div><h1 className="text-lg font-bold tracking-tight">ChorusApp <span className="text-xs font-normal opacity-70 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-1">Viewer</span></h1></div></div>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>
      </header>
      <main className="p-4 md:p-8 max-w-5xl mx-auto w-full flex-1">
        <div className="mb-8 space-y-4">
          <div className="relative"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Filtrar..." value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} /></div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{['TODOS', 'PRODUÇÃO', 'FILMAGEM', 'TAKE', 'PROJEÇÃO', 'ILUMINAÇÃO'].map(min => (<button key={min} onClick={() => setFiltroMinisterio(min)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filtroMinisterio === min ? 'bg-blue-600 text-white shadow-lg' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600 border'}`}>{min}</button>))}</div>
        </div>
        <div className="space-y-6">
          {Object.keys(escalaAgrupada).map(data => (
            <div key={data} className={`rounded-3xl overflow-hidden border ${cardClass}`}>
              <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-bold"><span>{data}</span></div>
              <div className="p-2">
                {escalaAgrupada[data].map((slot, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-3 border-b last:border-0 border-gray-100 dark:border-gray-700 ${slot.Voluntario === "Não designado" ? 'opacity-50' : ''}`}>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 w-1/3">{slot.Funcao}</span>
                    <span className={`font-medium w-2/3 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>{slot.Voluntario}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center pb-10"><button onClick={() => exportarPDF(itensFiltrados)} className="text-blue-500 font-bold hover:underline flex items-center justify-center gap-2 w-full"><Download size={16}/> Baixar PDF</button></div>
      </main>
      <footer className="py-6 text-center text-xs text-gray-400 dark:text-gray-600 font-medium"><p>ChorusApp v{APP_VERSION} • {new Date().getFullYear()}</p></footer>
    </div>
  );
}
