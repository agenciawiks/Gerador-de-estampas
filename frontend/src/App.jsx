import React, { useState, useEffect, useRef, useCallback } from 'react';
import Draggable from 'react-draggable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import {
  Image as ImageIcon, Shirt, Download, Settings2, Palette, Layers,
  CheckCircle2, Trash2, Upload, RefreshCw, FileText, FileImage,
  Sun, Moon, Zap, ChevronRight, AlertCircle, CheckCircle,
  X, Info, ImagePlus, MousePointer2, Crosshair, Search, Copy,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Eraser, Keyboard,
  AlertTriangle
} from 'lucide-react';
import './App.css';

// ─── Toast hook ─────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type = 'info') => {
    const id = uuidv4();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4200);
  }, []);
  const dismiss = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, toast, dismiss };
}

function ToastContainer({ toasts, dismiss }) {
  const icon = { success: <CheckCircle size={15}/>, error: <AlertCircle size={15}/>, warning: <AlertCircle size={15}/>, info: <Info size={15}/> };
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{icon[t.type]}</span>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" onClick={() => dismiss(t.id)}><X size={13}/></button>
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Modal ───────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, danger, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-xl shrink-0 ${danger ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
            <AlertTriangle size={18}/>
          </div>
          <div className="min-w-0">
            <p className="font-black text-sm text-slate-100 dark:text-slate-100 leading-tight" style={{color:'inherit'}}>{title}</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-yellow-500 hover:bg-yellow-400 text-black'
            }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Brasil political palette ────────────────────────────────────────────────
const BRASIL_COLORS = [
  { hex: '#009C3B', label: 'Verde Brasil'   },
  { hex: '#FFDF00', label: 'Amarelo Ouro'   },
  { hex: '#002776', label: 'Azul Marinho'   },
  { hex: '#000000', label: 'Preto'          },
  { hex: '#FFFFFF', label: 'Branco'         },
  { hex: '#CC1414', label: 'Vermelho'       },
  { hex: '#1B5E20', label: 'Verde Militar'  },
  { hex: '#D4A017', label: 'Dourado'        },
  { hex: '#1565C0', label: 'Azul Real'      },
  { hex: '#8B4513', label: 'Marrom Terra'   },
  { hex: '#D2B48C', label: 'Cáqui'          },
  { hex: '#F5F5DC', label: 'Creme Pátria'  },
];

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [fundos,    setFundos]    = useState([]);
  const [estampas,  setEstampas]  = useState([]);
  const [fundoPaths,    setFundoPaths]    = useState([]);
  const [estampaSel,    setEstampaSel]    = useState(null);
  const [fundoPreview,  setFundoPreview]  = useState(null);
  const [isDarkMode,    setIsDarkMode]    = useState(true);
  const [estampaConfigs, setEstampaConfigs] = useState({});
  const [fundoConfigs,   setFundoConfigs]   = useState({});
  const [nomeExport,    setNomeExport]    = useState('');
  const [naturalSize,   setNaturalSize]   = useState({ w: 0, h: 0 });
  const [canvasScale,   setCanvasScale]   = useState(1);
  const [abaAtual,      setAbaAtual]      = useState('fundos');
  const [batchProgress, setBatchProgress] = useState(null); // { current, total, name }
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [isDragOver,    setIsDragOver]    = useState(false);
  const [busca,         setBusca]         = useState('');
  const [confirmModal,  setConfirmModal]  = useState(null); // { title, message, danger, onConfirm }
  const [showKbdHints,  setShowKbdHints]  = useState(false);
  const [escalaRascunho, setEscalaRascunho] = useState('100'); // string local do input

  const fundoContainerRef = useRef(null);
  const nodeRef           = useRef(null);
  const fileInputRef      = useRef(null);
  const { toasts, toast, dismiss } = useToast();

  // ── Getters ──────────────────────────────────────────────────────────────
  const getCfgFundo  = (key, def) => fundoPreview  ? (fundoConfigs[fundoPreview.id]?.[key]  ?? def) : def;
  const getCfgEstamp = (key, def) => estampaSel    ? (estampaConfigs[estampaSel.id]?.[key]  ?? def) : def;
  const corHex        = getCfgFundo('corHex', '#009C3B');
  const usarCorOrig   = getCfgFundo('usarCorOriginal', false);
  const posX          = getCfgEstamp('posX', 0);
  const posY          = getCfgEstamp('posY', 0);
  const escala        = getCfgEstamp('escala', 100);

  // Sincroniza o rascunho quando o logo selecionado muda
  useEffect(() => {
    setEscalaRascunho(String(escala));
  }, [estampaSel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setFundoConfig = (key, val) => {
    if (!fundoPreview) return;
    setFundoConfigs(p => ({
      ...p,
      [fundoPreview.id]: { ...(p[fundoPreview.id] || { corHex: '#009C3B', usarCorOriginal: false }), [key]: val },
    }));
  };
  const setEstampaConfig = (id, key, val) => {
    setEstampaConfigs(p => ({
      ...p,
      [id]: { ...(p[id] || { posX: 0, posY: 0, escala: 100 }), [key]: val },
    }));
  };

  // ── Keyboard Controls ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!estampaSel || document.activeElement.tagName === 'INPUT') return;
      
      // Move controls
      const stepPos = e.shiftKey ? 10 : 1;
      let newX = posX;
      let newY = posY;

      if (e.key === 'ArrowUp')    { e.preventDefault(); newY -= stepPos; }
      if (e.key === 'ArrowDown')  { e.preventDefault(); newY += stepPos; }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); newX -= stepPos; }
      if (e.key === 'ArrowRight') { e.preventDefault(); newX += stepPos; }

      if (newX !== posX || newY !== posY) {
        setEstampaConfig(estampaSel.id, 'posX', Math.max(0, newX));
        setEstampaConfig(estampaSel.id, 'posY', Math.max(0, newY));
      }

      // Scale controls (+ and -)
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setEstampaConfig(estampaSel.id, 'escala', Math.min(500, escala + (e.shiftKey ? 10 : 1)));
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setEstampaConfig(estampaSel.id, 'escala', Math.max(5, escala - (e.shiftKey ? 10 : 1)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [estampaSel, posX, posY, escala]);

  // ── Load DB ───────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const dbF  = await localforage.getItem('db_fundos')     || [];
        const dbE  = await localforage.getItem('db_estampas')   || [];
        const dbTh = await localforage.getItem('db_theme_mode');
        if (dbTh !== null) setIsDarkMode(dbTh);
        setFundos(dbF);
        setEstampas(dbE);
        if (dbF.length > 0) { setFundoPreview(dbF[0]); setFundoPaths([dbF[0].id]); }
        if (dbE.length > 0)   setEstampaSel(dbE[0]);
      } catch (e) { console.error('DB load error:', e); }
    })();
  }, []);

  const toggleTheme = () => {
    const v = !isDarkMode;
    setIsDarkMode(v);
    localforage.setItem('db_theme_mode', v);
  };

  // ── Prevent close during batch ─────────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (batchProgress !== null) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [batchProgress]);

  // ── Natural size of stamp ─────────────────────────────────────────────────
  useEffect(() => {
    if (!estampaSel) return;
    const img = new Image();
    img.onload  = () => setNaturalSize({ w: img.naturalWidth || 300, h: img.naturalHeight || 300 });
    img.onerror = () => setNaturalSize({ w: 300, h: 300 });
    img.src = estampaSel.dataUrl;
  }, [estampaSel]);

  // ── Canvas scale ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fundoContainerRef.current || !fundoPreview) return;
    const img = new Image();
    img.onload = () => {
      const { clientWidth: cW, clientHeight: cH } = fundoContainerRef.current;
      setCanvasScale(Math.min(cW / img.naturalWidth, cH / img.naturalHeight, 1));
    };
    img.src = fundoPreview.dataUrl;
  }, [fundoPreview]);

  // ── File processing ───────────────────────────────────────────────────────
  const processFiles = useCallback(async (files) => {
    if (!files?.length) return;
    const isFundo = abaAtual === 'fundos';
    const novos = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      await new Promise(res => {
        const r = new FileReader();
        r.onload = ev => { novos.push({ id: uuidv4(), nome: file.name, dataUrl: ev.target.result }); res(); };
        r.readAsDataURL(file);
      });
    }
    if (!novos.length) return;
    if (isFundo) {
      const list = [...fundos, ...novos];
      setFundos(list);
      await localforage.setItem('db_fundos', list);
      if (!fundoPreview) { setFundoPreview(novos[0]); setFundoPaths([novos[0].id]); }
      toast(`${novos.length} mockup(s) adicionado(s)!`, 'success');
    } else {
      const list = [...estampas, ...novos];
      setEstampas(list);
      await localforage.setItem('db_estampas', list);
      if (!estampaSel) setEstampaSel(novos[0]);
      toast(`${novos.length} logo(s) adicionado(s)!`, 'success');
    }
  }, [abaAtual, fundos, estampas, fundoPreview, estampaSel, toast]);

  const handleFileUpload = e => processFiles(e.target.files);
  const handleDragOver   = e => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave  = ()  => setIsDragOver(false);
  const handleDrop       = e  => { e.preventDefault(); setIsDragOver(false); processFiles(e.dataTransfer.files); };

  const removerItemDb = async (id, isFundo) => {
    if (isFundo) {
      const list = fundos.filter(f => f.id !== id);
      setFundos(list);
      await localforage.setItem('db_fundos', list);
      if (fundoPreview?.id === id) setFundoPreview(list[0] || null);
      setFundoPaths(p => p.filter(fid => fid !== id));
    } else {
      const list = estampas.filter(e => e.id !== id);
      setEstampas(list);
      await localforage.setItem('db_estampas', list);
      if (estampaSel?.id === id) setEstampaSel(list[0] || null);
    }
    toast('Item removido.', 'warning');
  };

  const limparTudo = (isFundo) => {
    const listName = isFundo ? 'Todos os Mockups' : 'Todos os Logos';
    const msg = isFundo ? 'Todos os mockups foram removidos.' : 'Todos os logos foram removidos.';
    setConfirmModal({
      title: `Limpar ${listName}?`,
      message: `Esta ação é irreversível. Os arquivos serão removidos permanentemente da biblioteca.`,
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        if (isFundo) {
          setFundos([]);
          setFundoPaths([]);
          setFundoPreview(null);
          await localforage.setItem('db_fundos', []);
        } else {
          setEstampas([]);
          setEstampaSel(null);
          await localforage.setItem('db_estampas', []);
        }
        toast(msg, 'error');
      },
    });
  };

  const toggleFundoPath = (id, item) => {
    if (fundoPaths.includes(id)) {
      const rem = fundoPaths.filter(f => f !== id);
      setFundoPaths(rem);
      if (fundoPreview?.id === id)
        setFundoPreview(rem.length > 0 ? fundos.find(f => f.id === rem[0]) : null);
    } else {
      setFundoPaths(p => [...p, id]);
      setFundoPreview(item);
    }
  };

  const handleDrag = (_, ui) => {
    if (!estampaSel) return;
    setEstampaConfig(estampaSel.id, 'posX', Math.max(0, Math.round(ui.x)));
    setEstampaConfig(estampaSel.id, 'posY', Math.max(0, Math.round(ui.y)));
  };

  const centralizarEstampa = () => {
    if (!fundoPreview || !estampaSel || naturalSize.w <= 0) return;
    const fator = Math.max(0.05, escala / 100);
    const img = new Image();
    img.onload = () => {
      setEstampaConfig(estampaSel.id, 'posX', Math.round(Math.max(0, (img.naturalWidth  - naturalSize.w * fator) / 2)));
      setEstampaConfig(estampaSel.id, 'posY', Math.round(Math.max(0, (img.naturalHeight - naturalSize.h * fator) / 2)));
    };
    img.src = fundoPreview.dataUrl;
  };

  // ── Image generation (canvas) ─────────────────────────────────────────────
  const gerarImagemFinal = (fundoItem, estampaItem, cfg) =>
    new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx    = canvas.getContext('2d');
      const iF = new Image(); iF.crossOrigin = 'anonymous';
      const iE = new Image(); iE.crossOrigin = 'anonymous';
      iF.onload = () => {
        canvas.width  = iF.naturalWidth;
        canvas.height = iF.naturalHeight;
        ctx.drawImage(iF, 0, 0, canvas.width, canvas.height);
        iE.onload = () => {
          const fator = Math.max(0.05, cfg.escala / 100);
          const fW = Math.max(1, iE.naturalWidth  * fator);
          const fH = Math.max(1, iE.naturalHeight * fator);
          if (!cfg.usarCorOriginal && cfg.corHex) {
            const oc = document.createElement('canvas');
            const ox = oc.getContext('2d');
            oc.width = fW; oc.height = fH;
            ox.drawImage(iE, 0, 0, fW, fH);
            ox.globalCompositeOperation = 'source-in';
            ox.fillStyle = cfg.corHex;
            ox.fillRect(0, 0, fW, fH);
            ctx.drawImage(oc, cfg.posX, cfg.posY, fW, fH);
          } else {
            ctx.drawImage(iE, cfg.posX, cfg.posY, fW, fH);
          }
          canvas.toBlob(resolve, 'image/jpeg', 0.95);
        };
        iE.onerror = reject;
        iE.src = estampaItem.dataUrl;
      };
      iF.onerror = reject;
      iF.src = fundoItem.dataUrl;
    });

  // ── Export single ─────────────────────────────────────────────────────────
  const baixarImagemUnica = async () => {
    if (!estampaSel || !fundoPreview) { toast('Selecione um mockup e um logo.', 'warning'); return; }
    setLoadingSingle(true);
    try {
      const fConf = fundoConfigs[fundoPreview.id]  || { corHex: '#009C3B', usarCorOriginal: false };
      const eConf = estampaConfigs[estampaSel.id]  || { posX: 0, posY: 0, escala: 100 };
      const blob  = await gerarImagemFinal(fundoPreview, estampaSel, { ...eConf, ...fConf });
      if (blob) {
        const name = nomeExport.trim()
          ? `${nomeExport}.jpg`
          : `${fundoPreview.nome.replace(/\.[^/.]+$/, '')}__${estampaSel.nome.replace(/\.[^/.]+$/, '')}.jpg`;
        saveAs(blob, name);
        toast('Imagem exportada com sucesso!', 'success');
      }
    } catch (e) { toast('Erro ao gerar imagem.', 'error'); console.error(e); }
    setLoadingSingle(false);
  };

  // ── Export batch ──────────────────────────────────────────────────────────
  const gerarLote = async () => {
    if (!estampaSel || fundoPaths.length === 0) { toast('Selecione um logo e ao menos um mockup.', 'warning'); return; }
    setBatchProgress({ current: 0, total: fundoPaths.length });
    try {
      const zip = new JSZip(); let hasFiles = false;
      for (let i = 0; i < fundoPaths.length; i++) {
        const fItem = fundos.find(f => f.id === fundoPaths[i]);
        if (!fItem) continue;
        const fConf = fundoConfigs[fundoPaths[i]]  || { corHex: '#009C3B', usarCorOriginal: false };
        const eConf = estampaConfigs[estampaSel.id] || { posX: 0, posY: 0, escala: 100 };
        const blob  = await gerarImagemFinal(fItem, estampaSel, { ...eConf, ...fConf });
        if (blob) {
        const fname = nomeExport.trim()
            ? `${nomeExport}_${i + 1}.jpg`
            : `${fItem.nome.replace(/\.[^/.]+$/, '')}__${estampaSel.nome.replace(/\.[^/.]+$/, '')}.jpg`;
          zip.file(fname, blob);
          hasFiles = true;
        }
        setBatchProgress({ current: i + 1, total: fundoPaths.length, name: fundos.find(f => f.id === fundoPaths[i])?.nome || '...' });
      }
      if (hasFiles) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, nomeExport.trim() ? `${nomeExport}.zip` : 'Lote_Estampas.zip');
        toast(`Lote de ${fundoPaths.length} imagens gerado!`, 'success');
      } else {
        toast('Nenhuma imagem gerada no lote.', 'error');
      }
    } catch (e) { toast('Erro crítico ao gerar ZIP.', 'error'); console.error(e); }
    setBatchProgress(null);
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const estampaUrl  = estampaSel?.dataUrl  ?? null;
  const fundoUrl    = fundoPreview?.dataUrl ?? null;
  const isBatch     = batchProgress !== null;
  const batchPct    = isBatch ? Math.round((batchProgress.current / batchProgress.total) * 100) : 0;
  const hasSelection = !!fundoPreview && !!estampaSel;

  const itensFiltrados = (abaAtual === 'fundos' ? fundos : estampas).filter(i => 
    i.nome.toLowerCase().includes(busca.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      data-theme={isDarkMode ? 'dark' : 'light'}
      className="flex h-screen font-sans overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      <ConfirmModal
        isOpen={!!confirmModal}
        title={confirmModal?.title}
        message={confirmModal?.message}
        danger={confirmModal?.danger}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />

      {/* ══════════════ SIDEBAR LEFT ══════════════ */}
      <aside
        className={`w-72 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 shadow-xl shrink-0 transition-all ${isDragOver ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* ── Header / Branding ── */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="brand-gradient text-sm font-black uppercase tracking-tight leading-tight">
                Camisetas Opressoras
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                <Zap size={9} className="text-yellow-500 fill-yellow-500" />
                Gerador de Mockups
              </p>
            </div>
            <button
              onClick={toggleTheme}
              title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-yellow-400 border border-slate-200 dark:border-slate-700 transition-all shrink-0 shadow-sm"
            >
              {isDarkMode ? <Sun size={13}/> : <Moon size={13}/>}
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {[
            { key: 'fundos',   icon: <Shirt size={13}/>,     label: 'MOCKUPS', count: fundos.length,   color: 'green'  },
            { key: 'estampas', icon: <ImageIcon size={13}/>, label: 'LOGOS',   count: estampas.length, color: 'yellow' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setAbaAtual(tab.key)}
              className={`flex-1 py-2.5 text-[11px] font-bold flex justify-center items-center gap-1.5 border-b-2 transition-all ${
                abaAtual === tab.key
                  ? tab.color === 'green'
                    ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50/60 dark:bg-green-900/20'
                    : 'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-50/60 dark:bg-yellow-900/20'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {tab.icon} {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* ── Upload button ── */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-xs font-bold uppercase transition-all ${
              isDragOver
                ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-green-400 dark:hover:border-green-600 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50/40 dark:hover:bg-green-900/10'
            }`}
          >
            {isDragOver ? <ImagePlus size={15} className="text-green-500"/> : <Upload size={15}/>}
            {isDragOver ? 'Solte para adicionar' : 'Enviar Imagens'}
          </button>
          <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload}/>
        </div>

        {/* ── Search & Actions ── */}
        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input 
              type="text" 
              placeholder={`Buscar ${abaAtual === 'fundos' ? 'mockup' : 'logo'}...`}
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            {busca && (
              <button 
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Limpar busca"
              >
                <X size={12}/>
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1.5 px-1">
             <div className="flex justify-between items-center">
               <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                 {itensFiltrados.length} resultados
               </span>
               <button 
                 onClick={() => limparTudo(abaAtual === 'fundos')}
                 className="text-[10px] font-bold text-red-500 hover:text-red-600 dark:text-red-400/70 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
               >
                 <Eraser size={11}/> {abaAtual === 'fundos' ? 'Limpar Mockups' : 'Limpar Logos'}
               </button>
             </div>
             {abaAtual === 'fundos' && fundos.length > 0 && (
               <div className="flex gap-2">
                 <button 
                  onClick={() => { setFundoPaths(fundos.map(f => f.id)); if (fundos.length > 0) setFundoPreview(fundos[0]); }}
                  className="flex-1 text-[9px] font-bold uppercase py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                 >
                   Selecionar Todos
                 </button>
                 <button 
                  onClick={() => setFundoPaths([])}
                  className="flex-1 text-[9px] font-bold uppercase py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                 >
                   Desmarcar
                 </button>
               </div>
             )}
          </div>
        </div>

        {/* ── List ── */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/80 dark:bg-[#020617]">
          {/* Mockups list */}
          {abaAtual === 'fundos' && itensFiltrados.map(item => {
            const selected = fundoPaths.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleFundoPath(item.id, item)}
                className={`p-2 rounded-xl border-2 transition-all flex items-center gap-2.5 relative overflow-hidden group cursor-pointer ${
                  selected
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/40 shadow-green-500/10 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-green-300 dark:hover:border-green-800'
                }`}
              >
                <img src={item.dataUrl} alt={item.nome} className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"/>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate block">{item.nome}</span>
                  {fundoConfigs[item.id]?.corHex && !fundoConfigs[item.id]?.usarCorOriginal && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" style={{ backgroundColor: fundoConfigs[item.id].corHex }}/>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">{fundoConfigs[item.id].corHex}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  {selected && <CheckCircle2 size={15} className="text-green-500"/>}
                  <button
                    onClick={e => { e.stopPropagation(); removerItemDb(item.id, true); }}
                    className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                    title="Remover"
                  >
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Logos list */}
          {abaAtual === 'estampas' && itensFiltrados.map(item => {
            const selected = estampaSel?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setEstampaSel(item)}
                className={`p-2 rounded-xl border-2 transition-all flex items-center gap-2.5 relative group cursor-pointer ${
                  selected
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 shadow-yellow-500/10 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-yellow-300 dark:hover:border-yellow-800'
                }`}
              >
                <div className="w-14 h-14 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800 shrink-0">
                  <img src={item.dataUrl} alt={item.nome} className="max-w-full max-h-full object-contain drop-shadow-sm"/>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate block">{item.nome}</span>
                  {selected && <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 mt-0.5 block">Selecionado</span>}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); removerItemDb(item.id, false); }}
                  className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                  title="Remover"
                >
                  <Trash2 size={13}/>
                </button>
              </div>
            );
          })}

          {/* Empty state */}
          {(abaAtual === 'fundos' ? fundos : estampas).length === 0 && (
            <div className="flex flex-col items-center text-center gap-3 mt-6 px-4 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
                {abaAtual === 'fundos' ? <Shirt size={20} className="text-slate-400"/> : <ImageIcon size={20} className="text-slate-400"/>}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {abaAtual === 'fundos' ? 'Nenhum mockup ainda' : 'Nenhum logo ainda'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                  Clique em "Enviar Imagens"<br/>ou arraste arquivos aqui.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ══════════════ CANVAS MIDDLE ══════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-[#020617] relative min-w-0">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #94a3b820 1px, transparent 0)', backgroundSize: '22px 22px' }}
        />

        {/* Top info bar */}
        <div className="relative z-10 h-11 border-b border-slate-200 dark:border-slate-800 flex items-center px-5 gap-3 bg-white dark:bg-slate-900 shadow-sm shrink-0">
          {fundoPreview ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 truncate max-w-[200px]">
              {fundoPreview.nome}
            </span>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Nenhum mockup ativo</span>
          )}
          <ChevronRight size={13} className="text-slate-300 dark:text-slate-600 shrink-0"/>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            {fundoPaths.length} mockup(s) no lote
          </span>
          {estampaSel && (
            <>
              <ChevronRight size={13} className="text-slate-300 dark:text-slate-600 shrink-0"/>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 truncate max-w-[160px]">
                {estampaSel.nome}
              </span>
            </>
          )}
          <div className="ml-auto shrink-0">
            <button
              onClick={() => setShowKbdHints(v => !v)}
              title="Atalhos de teclado"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                showKbdHints
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent'
              }`}
            >
              <Keyboard size={11}/> Atalhos
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto relative z-0" ref={fundoContainerRef}>
          {fundoUrl && estampaUrl ? (
            <div
              className="relative shadow-2xl rounded-md overflow-hidden ring-1 ring-black/10 dark:ring-white/5 bg-white dark:bg-black"
              style={{ transform: `scale(${canvasScale})`, transformOrigin: 'center center' }}
            >
              <img
                src={fundoUrl}
                alt="Mockup"
                className="block pointer-events-none select-none max-w-none"
                onLoad={e => {
                  const c = fundoContainerRef.current;
                  if (c) setCanvasScale(Math.min(c.clientWidth / e.target.naturalWidth, c.clientHeight / e.target.naturalHeight, 1));
                }}
              />
              <Draggable
                nodeRef={nodeRef}
                position={{ x: posX, y: posY }}
                scale={canvasScale}
                onDrag={handleDrag}
                bounds="parent"
              >
                <div
                  ref={nodeRef}
                  className="absolute top-0 left-0 cursor-move outline outline-2 outline-blue-500/60 hover:outline-blue-600 group rounded-sm bg-slate-900/0"
                  style={{
                    width:    naturalSize.w > 0 ? naturalSize.w * Math.max(0.05, escala / 100) : 200,
                    height:   naturalSize.h > 0 ? naturalSize.h * Math.max(0.05, escala / 100) : 200,
                    minWidth: '30px', minHeight: '30px',
                  }}
                >
                  {/* Color tint overlay */}
                  {!usarCorOrig && (
                    <div className="absolute inset-0 pointer-events-none z-10 mix-blend-multiply" style={{
                      backgroundColor: corHex,
                      WebkitMaskImage: `url(${JSON.stringify(estampaUrl)})`,
                      WebkitMaskSize: '100% 100%', WebkitMaskPosition: 'center', WebkitMaskRepeat: 'no-repeat',
                      maskImage: `url(${JSON.stringify(estampaUrl)})`,
                      maskSize: '100% 100%', maskPosition: 'center', maskRepeat: 'no-repeat',
                    }}/>
                  )}
                  <img src={estampaUrl} alt="Estampa" className={`w-full h-full object-contain pointer-events-none drop-shadow-md ${!usarCorOrig ? 'opacity-10 grayscale' : ''}`}/>

                  {/* Position tooltip */}
                  <div className={`absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 transition-all pointer-events-none ${isDarkMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white'}`}>
                    X:{posX} Y:{posY}
                  </div>
                </div>
              </Draggable>
            </div>
          ) : (
            /* Empty canvas state */
            <div className={`flex flex-col items-center gap-4 p-12 rounded-2xl border-2 border-dashed ${isDarkMode ? 'border-slate-800 bg-slate-900/50 text-slate-500' : 'border-slate-200 bg-white text-slate-400'}`}>
              <Layers size={52} className="opacity-20"/>
              <div className="text-center">
                <p className="font-bold text-sm mb-1">Canvas aguardando</p>
                <p className="text-xs leading-relaxed opacity-70">
                  Envie um <span className="font-bold text-green-500">mockup</span> e um <span className="font-bold text-yellow-500">logo</span><br/>
                  pelo painel esquerdo para começar.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest opacity-40">
                <MousePointer2 size={12}/> Arraste para posicionar
              </div>
            </div>
          )}

          {/* Keyboard shortcuts panel */}
          {showKbdHints && (
            <div className="absolute top-3 right-3 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 w-64">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Atalhos de Teclado</span>
                <button onClick={() => setShowKbdHints(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={12}/></button>
              </div>
              <div className="space-y-2">
                {[
                  { keys: ['↑','↓','←','→'], desc: 'Mover 1px' },
                  { keys: ['⇧','↑↓←→'], desc: 'Mover 10px' },
                  { keys: ['+','='], desc: 'Aumentar escala' },
                  { keys: ['-'], desc: 'Diminuir escala' },
                  { keys: ['⇧','+/-'], desc: 'Escala ±10%' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, ki) => <span key={ki} className="kbd">{k}</span>)}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 leading-relaxed">Atalhos funcionam quando um campo de texto <strong>não</strong> está focado.</p>
            </div>
          )}
        </div>
      </main>

      {/* ══════════════ SIDEBAR RIGHT ══════════════ */}
      <aside className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-20 shadow-[-4px_0_20px_rgba(0,0,0,0.04)] shrink-0 overflow-y-auto">

        {/* Panel header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Settings2 size={14} className="text-slate-400 dark:text-slate-500"/>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Configurações</h2>
        </div>

        {hasSelection ? (
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Active mockup info */}
            <div className="text-xs px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 leading-snug space-y-2">
              <span className="block">Editando:</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                   <img src={estampaSel.dataUrl} className="max-w-full max-h-full object-contain" />
                </div>
                <span className="font-bold text-blue-600 dark:text-blue-400 truncate flex-1">{fundoPreview.nome}</span>
              </div>
            </div>

            {/* ── Color fill ── */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950/60 space-y-3">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Palette size={13} className="text-green-500"/>
                Preenchimento
              </label>

              {/* Palette grid */}
              <div className="grid grid-cols-6 gap-1.5">
                {BRASIL_COLORS.map(c => (
                  <div key={c.hex} className="swatch-wrap">
                    <button
                      onClick={() => { setFundoConfig('corHex', c.hex); setFundoConfig('usarCorOriginal', false); }}
                      title={c.label}
                      className={`w-full aspect-square rounded-full border-2 transition-all hover:scale-110 shadow-sm ${
                        corHex === c.hex && !usarCorOrig
                          ? 'border-blue-500 scale-110 ring-2 ring-blue-500/30'
                          : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="swatch-tip">{c.label}</span>
                  </div>
                ))}
              </div>

              {/* Custom color row */}
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={corHex}
                  onChange={e => { setFundoConfig('corHex', e.target.value); setFundoConfig('usarCorOriginal', false); }}
                  disabled={usarCorOrig}
                  className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden cursor-pointer shrink-0 disabled:opacity-40"
                />
                <input
                  type="text"
                  value={corHex}
                  onChange={e => { setFundoConfig('corHex', e.target.value); setFundoConfig('usarCorOriginal', false); }}
                  disabled={usarCorOrig}
                  className="flex-1 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-3 py-2 uppercase font-mono font-bold tracking-widest focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-40"
                />
                <button 
                  onClick={() => { navigator.clipboard.writeText(corHex); toast('HEX Copiado!', 'success'); }}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                  title="Copiar cor"
                >
                  <Copy size={14}/>
                </button>
              </div>

              {/* Toggle original color */}
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={usarCorOrig}
                    onChange={e => setFundoConfig('usarCorOriginal', e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 bg-slate-300 dark:bg-slate-700 after:border-slate-300 dark:after:border-slate-600"/>
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                  Cor original (sem tint)
                </span>
              </label>
            </div>

            {/* ── Scale & position ── */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950/60 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Escala de Logo</label>
                <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/40 rounded px-1.5 py-0.5 border border-green-200 dark:border-green-800/50">
                  <input
                    type="number"
                    value={escalaRascunho}
                    onChange={e => setEscalaRascunho(e.target.value)}
                    onBlur={e => {
                      const v = Math.max(5, Math.min(500, Number(e.target.value) || 5));
                      setEscalaRascunho(String(v));
                      if (estampaSel) setEstampaConfig(estampaSel.id, 'escala', v);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') e.target.blur();
                    }}
                    className="w-12 bg-transparent text-[13px] font-black font-mono text-center text-green-700 dark:text-green-400 focus:outline-none"
                  />
                  <span className="text-[11px] font-black font-mono text-green-700 dark:text-green-400">%</span>
                </div>
              </div>
              
              <div className="flex gap-1">
                {[50, 100, 150, 200].map(val => (
                  <button
                    key={val}
                    onClick={() => estampaSel && setEstampaConfig(estampaSel.id, 'escala', val)}
                    className={`flex-1 text-[10px] font-bold py-1 rounded transition-all ${
                      escala === val 
                        ? 'bg-green-500 text-white shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>

              <input
                type="range" min="5" max="300" step="1" value={escala}
                onChange={e => estampaSel && setEstampaConfig(estampaSel.id, 'escala', Number(e.target.value))}
                className="w-full accent-green-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">Posição (px)</label>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500"><span className="kbd">⇧</span> = ±10px</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400">X</span>
                      <input
                        type="number"
                        value={posX}
                        onChange={e => estampaSel && setEstampaConfig(estampaSel.id, 'posX', Number(e.target.value))}
                        className="w-12 bg-transparent text-xs font-mono text-right font-bold focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={e => estampaSel && setEstampaConfig(estampaSel.id, 'posX', posX - (e.shiftKey ? 10 : 1))}
                        title="-1px (Shift: -10px)"
                        className="flex-1 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
                      >−1</button>
                      <button
                        onClick={e => estampaSel && setEstampaConfig(estampaSel.id, 'posX', posX + (e.shiftKey ? 10 : 1))}
                        title="+1px (Shift: +10px)"
                        className="flex-1 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-all"
                      >+1</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400">Y</span>
                      <input
                        type="number"
                        value={posY}
                        onChange={e => estampaSel && setEstampaConfig(estampaSel.id, 'posY', Number(e.target.value))}
                        className="w-12 bg-transparent text-xs font-mono text-right font-bold focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={e => estampaSel && setEstampaConfig(estampaSel.id, 'posY', posY - (e.shiftKey ? 10 : 1))}
                        title="-1px (Shift: -10px)"
                        className="flex-1 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
                      >−1</button>
                      <button
                        onClick={e => estampaSel && setEstampaConfig(estampaSel.id, 'posY', posY + (e.shiftKey ? 10 : 1))}
                        title="+1px (Shift: +10px)"
                        className="flex-1 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-all"
                      >+1</button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { if (estampaSel) { setEstampaConfig(estampaSel.id, 'posX', 0); setEstampaConfig(estampaSel.id, 'posY', 0); } }}
                  className="w-full text-[9px] font-bold text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 uppercase tracking-tighter transition-colors flex items-center justify-center gap-1"
                >
                  <X size={9}/> Zerar Coordenadas
                </button>
              </div>
              <button
                onClick={centralizarEstampa}
                className="w-full text-[11px] font-bold uppercase tracking-wide py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Crosshair size={12}/> Centralizar automaticamente
              </button>
            </div>

            {/* ── Export name ── */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950/60 space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <FileText size={13} className="text-yellow-500"/>
                Prefixo do arquivo
              </label>
              <input
                type="text"
                placeholder="Ex: colecao_7_setembro"
                value={nomeExport}
                onChange={e => setNomeExport(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                Vazio: usa <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">mockup__logo.jpg</code>.
                Lote: adiciona <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">_1, _2…</code>
              </p>
            </div>
          </div>
        ) : (
          /* Empty properties state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800/60">
              <Settings2 size={24} className="text-slate-300 dark:text-slate-600"/>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Painel de Propriedades</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                Selecione um <span className="font-bold text-green-500">mockup</span> e um <span className="font-bold text-yellow-500">logo</span> para editar as configurações de composição.
              </p>
            </div>
          </div>
        )}

        {/* ── Export buttons ── */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
          {/* Batch progress bar */}
          {isBatch && (
            <div className="mb-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 overflow-hidden">
                <span className="truncate flex-1 mr-2">{batchProgress.name || 'Gerando...'}</span>
                <span className="font-mono shrink-0">{batchProgress.current}/{batchProgress.total}</span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-300 progress-bar-inner"
                  style={{ width: `${batchPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Single export */}
          <button
            onClick={baixarImagemUnica}
            disabled={loadingSingle || !hasSelection}
            className="w-full font-bold text-xs py-3 rounded-xl border-2 border-blue-100 dark:border-blue-900/40 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-400 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {loadingSingle ? <RefreshCw size={14} className="animate-spin"/> : <FileImage size={14}/>}
            EXPORTAR FOTO ATUAL
          </button>

          {/* Batch export */}
          <button
            onClick={gerarLote}
            disabled={isBatch || !estampaSel || fundoPaths.length === 0}
            className="w-full font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-[0_0_20px_rgba(0,156,59,0.25)] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white border border-green-700/30"
          >
            {isBatch
              ? <><RefreshCw size={15} className="animate-spin"/> {batchPct}%</>
              : <><Download size={15}/> GERAR LOTE ({fundoPaths.length})</>
            }
          </button>
        </div>
      </aside>
    </div>
  );
}

export default App;
