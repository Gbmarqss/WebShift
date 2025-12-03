import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileSpreadsheet, Download, Share2, AlertTriangle, Moon, Sun, Search, Calendar, CheckCircle, XCircle, Lock, Flame, Filter, Menu, Link, Plus, X } from 'lucide-react';
import { lerPlanilha, gerarRascunho, MINISTERIOS_DEFAULT } from './logic';
import { exportarPDF, exportarExcel, exportarICS, copiarWhatsApp } from './exportManager';
import LZString from 'lz-string';
import { APP_VERSION } from './config';

const normalizeText = (text) => {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

function Editor() {
  // ... (Mantenha todos os estados e lógica iguais ao anterior, vou pular para o return)
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ministerios, setMinisterios] = useState(Object.keys(MINISTERIOS_DEFAULT));
  const [theme, setTheme] = useState(() => localStorage.getItem('webshift-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [escala, setEscala] = useState([]);
  const [disponiveis, setDisponiveis] = useState({});
  const [adicionaisManuais, setAdicionaisManuais] = useState([]);
  const [conflitos, setConflitos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState(null);
  const [ministeriosExportacao, setMinisteriosExportacao] = useState(Object.keys(MINISTERIOS_DEFAULT));
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [isEditing, setIsEditing] = useState(true);

  // Efeitos e Funções...
  useEffect(() => { const savedEscala = localStorage.getItem('webshift-escala'); const savedDisponiveis = localStorage.getItem('webshift-disponiveis'); const savedAdicionais = localStorage.getItem('webshift-adicionais'); if (savedEscala) { setEscala(JSON.parse(savedEscala)); setStep(2); } if (savedDisponiveis) setDisponiveis(JSON.parse(savedDisponiveis)); if (savedAdicionais) setAdicionaisManuais(JSON.parse(savedAdicionais)); }, []);
  useEffect(() => { if (escala.length > 0) localStorage.setItem('webshift-escala', JSON.stringify(escala)); if (Object.keys(disponiveis).length > 0) localStorage.setItem('webshift-disponiveis', JSON.stringify(disponiveis)); localStorage.setItem('webshift-adicionais', JSON.stringify(adicionaisManuais)); }, [escala, disponiveis, adicionaisManuais]);
  useEffect(() => { localStorage.setItem('webshift-theme', theme); if (theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }, [theme]);
  const contagemEscalas = useMemo(() => { const counts = {}; escala.forEach(slot => { if (slot.Voluntario !== "Não designado") counts[slot.Voluntario] = (counts[slot.Voluntario] || 0) + 1; }); return counts; }, [escala]);
  const LIMITE_AVISO = 5;
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const showToast = (message, type = 'success') => { setToast({ show: true, message, type }); setTimeout(() => setToast({ ...toast, show: false }), 3000); };
  const handleFileUpload = (e) => { if (e.target.files[0]) setFile(e.target.files[0]); };
  const handleGerar = async () => { if (!file) return showToast("Selecione um arquivo!", "error"); setLoading(true); try { const df = await lerPlanilha(file); const { rascunho, disponiveis: disp, error } = gerarRascunho(df, ministerios); if (error) throw new Error(error); setEscala(rascunho); setDisponiveis(disp); setStep(2); verificarConflitos(rascunho); showToast("Escala gerada!"); } catch (err) { showToast(err.message, "error"); } finally { setLoading(false); } };
  const copyShareLink = () => { if (escala.length === 0) return showToast("Gere uma escala primeiro!", "error"); const jsonString = JSON.stringify(escala); const compressed = LZString.compressToEncodedURIComponent(jsonString); const url = `${window.location.origin}/share?d=${compressed}`; navigator.clipboard.writeText(url).then(() => { showToast("Link copiado!", "success"); }); };
  const openExportModal = (type) => { if (conflitos.length > 0) return showToast("Resolva conflitos!", "error"); setExportType(type); setShowExportModal(true); };
  const confirmExport = () => { const filtrada = escala.filter(slot => { let area = slot.AreaOriginal || 'OUTROS'; if(slot.Funcao.includes('Fotografo')||slot.Funcao.includes('Suporte')) area='TAKE'; if(slot.Funcao.includes('Filmagem')||slot.Funcao.includes('Câmera')) area='FILMAGEM'; if(slot.Funcao.includes('PRODUÇÃO')) area='PRODUÇÃO'; if(slot.Funcao.includes('PROJEÇÃO')) area='PROJEÇÃO'; if(slot.Funcao.includes('ILUMINAÇÃO')) area='ILUMINAÇÃO'; return ministeriosExportacao.includes(area); }); if(filtrada.length===0){ showToast("Nada para exportar.", "error"); setShowExportModal(false); return; } if(exportType==='pdf') exportarPDF(filtrada); if(exportType==='excel') exportarExcel(filtrada); if(exportType==='ics') exportarICS(filtrada); if(exportType==='whatsapp') copiarWhatsApp(filtrada).then(()=>showToast("Copiado!","success")).catch(()=>showToast("Erro","error")); setShowExportModal(false); };
  const adicionarPessoaManual = () => { if(!novoNome.trim()) return; if(adicionaisManuais.includes(novoNome)) { showToast("Já existe!", "error"); return; } setAdicionaisManuais([...adicionaisManuais, novoNome]); setNovoNome(""); setShowManualAddModal(false); showToast("Adicionado!", "success"); };
  const verificarConflitos = (dados) => { const map = {}; const conflitos = []; dados.forEach(slot => { if (slot.Voluntario === "Não designado") return; const key = `${slot.Data}-${slot.Voluntario}`; if (map[key]) conflitos.push(key); else map[key] = true; }); setConflitos(conflitos); };
  const handleChangeVoluntario = (idx, val) => { const nova = [...escala]; nova[idx].Voluntario = val; setEscala(nova); verificarConflitos(nova); };
  const itensFiltrados = escala.filter(item => { const termo = normalizeText(filtro); return normalizeText(item.Data).includes(termo) || normalizeText(item.Voluntario).includes(termo) || normalizeText(item.Funcao).includes(termo); });
  const escalaAgrupada = Object.groupBy ? Object.groupBy(itensFiltrados, ({ Data }) => Data) : itensFiltrados.reduce((acc, item) => { (acc[item.Data] = acc[item.Data] || []).push(item); return acc; }, {});
  
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900';
  const cardClass = isDark ? 'bg-gray-800 border-gray-700 shadow-lg' : 'bg-white border-gray-300 shadow-md';

  return (
    <div className={`w-full min-h-screen flex flex-col transition-colors duration-300 ${bgClass} font-sans`}>
      <header className={`w-full px-4 md:px-8 py-3 shadow-md ${isDark ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-300'} backdrop-blur-md flex justify-between items-center sticky top-0 z-50 border-b`}>
        <div className="flex items-center gap-3">
          {/* MUDANÇA: favicon.jpg */}
          <img src="/favicon.jpg" alt="ChorusApp" className="w-9 h-9 md:w-10 md:h-10 object-contain drop-shadow-sm" />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400">ChorusApp</h1>
        </div>
        {/* ... Resto do Header ... */}
        <div className="flex items-center gap-2"><button onClick={toggleTheme} className={`p-2 rounded-full border transition-all ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>{isDark ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-slate-700"/>}</button></div>
      </header>

      {/* ... Resto do Main e Modais (igual ao anterior) ... */}
      <main className="flex-1 w-full px-3 md:px-8 py-6 max-w-[1920px] mx-auto">
        {step === 1 && (
          <div className="w-full h-full flex justify-center items-start pt-8 md:pt-12 animate-fade-in-up">
            <div className={`w-full max-w-xl p-6 md:p-10 rounded-3xl ${cardClass} transition-all`}>
              <div className="text-center mb-8"><h2 className="text-2xl md:text-3xl font-bold mb-2">Gerar Escala</h2><p className="text-gray-500 text-sm font-medium">Carregue a planilha e deixe a IA organizar</p></div>
              <div className="space-y-6">
                <div className="flex items-center justify-center w-full group"><label className={`flex flex-col items-center justify-center w-full h-40 md:h-52 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ${isDark ? 'border-gray-600 bg-gray-800/50 hover:bg-gray-800 hover:border-blue-500' : 'border-gray-400 bg-gray-50 hover:bg-white hover:border-blue-600 hover:shadow-lg'}`}><div className="flex flex-col items-center justify-center pt-5 pb-6"><div className="p-4 bg-blue-100 dark:bg-gray-700 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-inner"><Upload className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" /></div><p className="mb-1 text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors">Clique para enviar</p><p className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600">.XLSX</p></div><input type="file" className="hidden" accept=".xlsx" onChange={handleFileUpload} /></label></div>
                <button onClick={handleGerar} disabled={loading || !file} className={`w-full py-3.5 rounded-2xl font-bold text-base md:text-lg text-white shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 flex justify-center items-center gap-3 ${loading || !file ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/30'}`}>{loading ? "Processando..." : "Gerar Escala"} {!loading && <FileSpreadsheet size={20} />}</button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-up w-full">
            <div className={`py-3 px-4 -mx-3 md:mx-0 mb-6 border-b shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center transition-colors rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
              <div className="relative w-full md:w-96 flex gap-2">
                <div className="relative flex-1"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Buscar..." value={filtro} onChange={(e) => setFiltro(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm md:text-base ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:bg-white'}`} /></div>
                <button onClick={() => setShowManualAddModal(true)} className="p-2.5 rounded-xl border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors shadow-sm" title="Adicionar Pessoa Avulsa"><Plus size={20} /></button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
                <ExportBtn icon={<Download size={16}/>} label="PDF" onClick={() => openExportModal('pdf')} color="blue" />
                <ExportBtn icon={<Share2 size={16}/>} label="WhatsApp" onClick={() => openExportModal('whatsapp')} color="green" />
                <div className="hidden md:flex gap-2">
                    <ExportBtn icon={<FileSpreadsheet size={16}/>} label="Excel" onClick={() => openExportModal('excel')} color="blue" />
                    <ExportBtn icon={<Calendar size={16}/>} label="ICS" onClick={() => openExportModal('ics')} color="blue" />
                </div>
                <ExportBtn icon={<Link size={16}/>} label="Link" onClick={copyShareLink} color="purple" />
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 hidden md:block"></div>
                <button onClick={() => { if(confirm("Deseja limpar tudo?")) { setStep(1); setFile(null); setEscala([]); localStorage.removeItem('webshift-escala'); }}} className="flex-1 md:flex-none px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-xl transition-colors whitespace-nowrap border border-red-200 dark:border-red-900/50">Nova</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 w-full">
              {Object.keys(escalaAgrupada).map((data) => (
                <div key={data} className={`rounded-3xl transition-all duration-300 overflow-hidden flex flex-col w-full group ${cardClass}`}>
                  <div className="p-3 md:p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white min-h-[56px] flex items-center justify-center text-center relative overflow-hidden shadow-sm">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div><span className="text-sm font-bold break-words leading-tight w-full drop-shadow-md z-10 uppercase tracking-wide">{data}</span>
                  </div>
                  <div className="p-4 space-y-4 flex-1 bg-opacity-50">
                    {escalaAgrupada[data].map((slot) => {
                      const globalIndex = escala.indexOf(slot); 
                      const isConflict = conflitos.includes(`${slot.Data}-${slot.Voluntario}`);
                      const count = contagemEscalas[slot.Voluntario] || 0;
                      const isBurnout = count > LIMITE_AVISO && slot.Voluntario !== "Não designado";

                      let areaKey = slot.AreaOriginal || 'TAKE';
                      if(slot.Funcao.includes('Fotografo')||slot.Funcao.includes('Suporte')) areaKey='TAKE';
                      if(slot.Funcao.includes('Filmagem')||slot.Funcao.includes('Câmera')) areaKey='FILMAGEM';
                      if(slot.Funcao.includes('PRODUÇÃO')) areaKey='PRODUÇÃO'; 
                      
                      const optionsBase = disponiveis[slot.Data]?.[areaKey] || [];
                      const todasOpcoes = [...optionsBase, ...adicionaisManuais, slot.Voluntario, "Não designado"];
                      const dropdownOptions = [...new Set(todasOpcoes)].sort();

                      return (
                        <div key={globalIndex} className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-center pl-2 pr-1">
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{slot.Funcao}</span>
                            {isBurnout && <span className="text-[10px] font-bold text-orange-700 bg-orange-100 border border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800 flex items-center gap-1 px-2 py-0.5 rounded-full animate-pulse shadow-sm"><Flame size={10}/> {count}</span>}
                          </div>
                          <div className="relative w-full group/input">
                            <select value={slot.Voluntario} onChange={(e) => handleChangeVoluntario(globalIndex, e.target.value)} className={`w-full p-3 text-sm rounded-xl border appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/50 truncate pr-8 transition-all font-medium shadow-sm ${isConflict ? 'bg-red-50 border-red-300 text-red-700 ring-2 ring-red-200' : isBurnout ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-700' : isDark ? 'bg-gray-900/50 border-gray-700 text-white hover:bg-gray-900' : 'bg-gray-50 border-gray-300 text-gray-800 hover:border-blue-400 hover:bg-white'}`}>
                              {dropdownOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            {isConflict && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 animate-pulse"><AlertTriangle size={18} /></div>}
                          </div>
                          {isConflict && <span className="text-xs text-red-600 font-bold pl-2 flex items-center gap-1"><Lock size={10}/> Conflito Detectado</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
             {Object.keys(escalaAgrupada).length === 0 && <div className="text-center py-20 flex flex-col items-center opacity-50 animate-pulse"><Search size={48} className="mb-4 text-gray-400"/><p className="text-xl font-medium text-gray-500">Nenhum resultado para "{filtro}"</p></div>}
          </div>
        )}
      </main>

      {showManualAddModal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} animate-bounce-in`}><h3 className="text-xl font-bold mb-4">Adicionar Pessoa</h3><input type="text" placeholder="Nome" className={`w-full p-3 rounded-xl border mb-4 outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`} value={novoNome} onChange={(e) => setNovoNome(e.target.value)}/><div className="flex gap-3"><button onClick={() => setShowManualAddModal(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button><button onClick={adicionarPessoaManual} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700">Adicionar</button></div></div></div>}
      {showExportModal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} animate-bounce-in`}><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Exportar</h3><button onClick={() => setShowExportModal(false)}><X size={24} className="text-gray-400"/></button></div><div className="grid grid-cols-2 gap-3 mb-8">{Object.keys(MINISTERIOS_DEFAULT).map(min => (<label key={min} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${ministeriosExportacao.includes(min) ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700'}`}><input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" checked={ministeriosExportacao.includes(min)} onChange={(e) => {if(e.target.checked) setMinisteriosExportacao([...ministeriosExportacao, min]); else setMinisteriosExportacao(ministeriosExportacao.filter(m => m !== min));}}/><span className="text-sm font-bold">{min}</span></label>))}</div><button onClick={confirmExport} className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30">Confirmar</button></div></div>}
      {toast.show && <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce-in z-[70] flex items-center gap-3 transition-all whitespace-nowrap border ${toast.type === 'error' ? 'bg-red-600 border-red-700 text-white' : 'bg-gray-800 border-gray-900 text-white dark:bg-white dark:border-gray-200 dark:text-gray-900'}`}>{toast.type === 'success' ? <CheckCircle size={20}/> : <Lock size={20}/>}<span className="text-sm">{toast.message}</span></div>}
      <footer className="py-6 text-center text-xs text-gray-400 dark:text-gray-600 font-medium"><p>ChorusApp v{APP_VERSION} • {new Date().getFullYear()}</p></footer>
    </div>
  );
}

const ExportBtn = ({ icon, label, onClick, color = 'blue' }) => {
  const colorClasses = {
    blue: "bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600 border-slate-200 hover:border-blue-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:text-blue-400",
    green: "bg-white text-slate-700 hover:bg-green-50 hover:text-green-600 border-slate-200 hover:border-green-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:border-green-500 dark:hover:text-green-400",
    purple: "bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-600 border-purple-200 hover:border-purple-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:border-purple-500 dark:hover:text-purple-400",
  };
  const selectedClass = colorClasses[color] || colorClasses.blue;
  return <button onClick={onClick} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md border ${selectedClass} whitespace-nowrap`}>{icon} {label}</button>;
};

export default Editor;
