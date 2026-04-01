import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import { 
  Image as ImageIcon, 
  Shirt, 
  Download, 
  Settings2, 
  Palette, 
  Layers,
  CheckCircle2,
  Trash2,
  Upload,
  RefreshCw,
  FileText,
  FileImage,
  Sun,
  Moon,
  Zap,
  ChevronRight,
  Focus
} from 'lucide-react';

function App() {
  const [fundos, setFundos] = useState([]);
  const [estampas, setEstampas] = useState([]);
  
  const [fundoPaths, setFundoPaths] = useState([]); // Multiple selection for batch IDs
  const [estampaSel, setEstampaSel] = useState(null);
  const [fundoPreview, setFundoPreview] = useState(null); // Active background for canvas
  
  // Theme Toggle
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // States by ID/Path
  const [estampaConfigs, setEstampaConfigs] = useState({});
  const [fundoConfigs, setFundoConfigs] = useState({});

  const [nomeExport, setNomeExport] = useState(''); // Custom naming prefix

  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const fundoContainerRef = useRef(null);
  const nodeRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [abaAtual, setAbaAtual] = useState('fundos'); // fundos | estampas
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingSingle, setLoadingSingle] = useState(false);

  // Helper getters
  const getCorHex = () => fundoPreview ? (fundoConfigs[fundoPreview.id]?.corHex ?? '#008237') : '#008237';
  const getUsarCorOriginal = () => fundoPreview ? (fundoConfigs[fundoPreview.id]?.usarCorOriginal ?? false) : false;
  
  const getPosX = () => estampaSel ? (estampaConfigs[estampaSel.id]?.posX ?? 0) : 0;
  const getPosY = () => estampaSel ? (estampaConfigs[estampaSel.id]?.posY ?? 0) : 0;
  const getEscala = () => estampaSel ? (estampaConfigs[estampaSel.id]?.escala ?? 100) : 100;

  const setFundoConfig = (key, val) => {
    if (!fundoPreview) return;
    setFundoConfigs(prev => ({
      ...prev,
      [fundoPreview.id]: { 
        ...(prev[fundoPreview.id] || { corHex: '#008237', usarCorOriginal: false }), 
        [key]: val 
      }
    }));
  };

  const setEstampaConfig = (id, key, val) => {
    setEstampaConfigs(prev => ({
      ...prev,
      [id]: { 
        ...(prev[id] || { posX: 0, posY: 0, escala: 100 }), 
        [key]: val 
      }
    }));
  };

  // Carregar dados salvos no navegador (IndexedDB)
  const loadDataFromDB = async () => {
    try {
      const dbFundos = await localforage.getItem('db_fundos') || [];
      const dbEstampas = await localforage.getItem('db_estampas') || [];
      const dbThemeMode = await localforage.getItem('db_theme_mode');
      
      if (dbThemeMode !== null) setIsDarkMode(dbThemeMode);

      setFundos(dbFundos);
      setEstampas(dbEstampas);
      
      if (dbFundos.length > 0 && !fundoPreview) {
        setFundoPreview(dbFundos[0]);
        setFundoPaths([dbFundos[0].id]);
      }
      if (dbEstampas.length > 0 && !estampaSel) {
        setEstampaSel(dbEstampas[0]);
      }
    } catch (err) {
      console.error('Erro ao ler DB Local:', err);
    }
  };

  useEffect(() => {
    loadDataFromDB();
  }, []);

  const toggleTheme = () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    localforage.setItem('db_theme_mode', newVal);
  };

  // Update natural size when print changes
  useEffect(() => {
    if (estampaSel) {
      const img = new Image();
      img.onload = () => setNaturalSize({ w: img.naturalWidth || 300, h: img.naturalHeight || 300 });
      img.onerror = () => setNaturalSize({ w: 300, h: 300 });
      img.src = estampaSel.dataUrl;
    }
  }, [estampaSel]);

  // Adjust canvas scale for editing visually
  useEffect(() => {
    if (fundoContainerRef.current && fundoPreview) {
      const img = new Image();
      img.onload = () => {
        const containerW = fundoContainerRef.current.clientWidth;
        const containerH = fundoContainerRef.current.clientHeight;
        const s = Math.min(containerW / img.naturalWidth, containerH / img.naturalHeight, 1);
        setCanvasScale(s);
      };
      img.src = fundoPreview.dataUrl;
    }
  }, [fundoPreview]);

  // Upload handler via HTML5 FileReader (Base64)
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    let isFundo = abaAtual === 'fundos';
    const novosItens = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        
        await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                novosItens.push({
                    id: uuidv4(),
                    nome: file.name,
                    dataUrl: event.target.result // base64 string
                });
                resolve();
            };
            reader.readAsDataURL(file);
        });
    }

    if (novosItens.length > 0) {
        if (isFundo) {
            const newList = [...fundos, ...novosItens];
            setFundos(newList);
            await localforage.setItem('db_fundos', newList);
            if (!fundoPreview) {
                setFundoPreview(novosItens[0]);
                setFundoPaths([novosItens[0].id]);
            }
        } else {
            const newList = [...estampas, ...novosItens];
            setEstampas(newList);
            await localforage.setItem('db_estampas', newList);
            if (!estampaSel) setEstampaSel(novosItens[0]);
        }
    }
  };
  
  const removerItemDb = async (id, isFundo) => {
      if (isFundo) {
          const newList = fundos.filter(f => f.id !== id);
          setFundos(newList);
          await localforage.setItem('db_fundos', newList);
          if (fundoPreview?.id === id) setFundoPreview(newList[0] || null);
          setFundoPaths(fundoPaths.filter(fid => fid !== id));
      } else {
          const newList = estampas.filter(e => e.id !== id);
          setEstampas(newList);
          await localforage.setItem('db_estampas', newList);
          if (estampaSel?.id === id) setEstampaSel(newList[0] || null);
      }
  };

  const toggleFundoPath = (id, item) => {
    if (fundoPaths.includes(id)) {
      setFundoPaths(fundoPaths.filter(f => f !== id));
      if (fundoPreview?.id === id) {
        const remaining = fundoPaths.filter(f => f !== id);
        if (remaining.length > 0) {
          setFundoPreview(fundos.find(f => f.id === remaining[0]));
        } else {
          setFundoPreview(null);
        }
      }
    } else {
      setFundoPaths([...fundoPaths, id]);
      setFundoPreview(item);
    }
  };

  const handleDrag = (e, ui) => {
    if (!estampaSel) return;
    const px = Math.max(0, Math.round(ui.x));
    const py = Math.max(0, Math.round(ui.y));
    setEstampaConfig(estampaSel.id, 'posX', px);
    setEstampaConfig(estampaSel.id, 'posY', py);
  };

  const centralizarEstampa = () => {
    if (fundoPreview && estampaSel && naturalSize.w > 0) {
      const escalaH = getEscala();
      const estampaW = naturalSize.w * Math.max(0.05, escalaH / 100);
      const estampaH = naturalSize.h * Math.max(0.05, escalaH / 100);
      
      const img = new Image();
      img.onload = () => {
        const bgW = img.naturalWidth;
        const bgH = img.naturalHeight;
        const cx = Math.round(Math.max(0, (bgW - estampaW) / 2));
        const cy = Math.round(Math.max(0, (bgH - estampaH) / 2));
        setEstampaConfig(estampaSel.id, 'posX', cx);
        setEstampaConfig(estampaSel.id, 'posY', cy);
      };
      img.src = fundoPreview.dataUrl;
    }
  };

  // Image Processing Core - Zero Server Canvas Rendering
  const gerarImagemFinal = (fundoItem, estampaItem, configs) => {
      return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const imgFundo = new Image();
          const imgEstampa = new Image();
          
          imgFundo.crossOrigin = "anonymous";
          imgEstampa.crossOrigin = "anonymous";

          imgFundo.onload = () => {
              canvas.width = imgFundo.naturalWidth;
              canvas.height = imgFundo.naturalHeight;
              
              // 1. Draw Background
              ctx.drawImage(imgFundo, 0, 0, canvas.width, canvas.height);
              
              imgEstampa.onload = () => {
                  const fator = Math.max(0.05, configs.escala / 100);
                  const fEstampaW = Math.max(1, imgEstampa.naturalWidth * fator);
                  const fEstampaH = Math.max(1, imgEstampa.naturalHeight * fator);
                  
                  const px = configs.posX;
                  const py = configs.posY;
                  
                  // Se deve colorir, usamos um canvas offscreen pra aplicar TINT via globalComposite
                  if (!configs.usarCorOriginal && configs.corHex) {
                      const oc = document.createElement('canvas');
                      const octx = oc.getContext('2d');
                      oc.width = fEstampaW;
                      oc.height = fEstampaH;
                      
                      // Draw logo
                      octx.drawImage(imgEstampa, 0, 0, fEstampaW, fEstampaH);
                      // Fill with color keeping alpha shape
                      octx.globalCompositeOperation = 'source-in';
                      octx.fillStyle = configs.corHex;
                      octx.fillRect(0, 0, fEstampaW, fEstampaH);
                      
                      // Paste tinted logo
                      ctx.drawImage(oc, px, py, fEstampaW, fEstampaH);
                  } else {
                      // Paste raw logic
                      ctx.drawImage(imgEstampa, px, py, fEstampaW, fEstampaH);
                  }
                  
                  // Export as Blob jpg
                  canvas.toBlob((blob) => {
                      resolve(blob);
                  }, 'image/jpeg', 0.95);
              };
              imgEstampa.onerror = reject;
              imgEstampa.src = estampaItem.dataUrl;
          };
          imgFundo.onerror = reject;
          imgFundo.src = fundoItem.dataUrl;
      });
  };

  const baixarImagemUnica = async () => {
    if (!estampaSel || !fundoPreview) return alert('Selecione estampa e um mockup.');
    setLoadingSingle(true);
    try {
      const fConf = fundoConfigs[fundoPreview.id] || { corHex: '#008237', usarCorOriginal: false };
      const eConf = estampaConfigs[estampaSel.id] || { posX: 0, posY: 0, escala: 100 };
      
      const blob = await gerarImagemFinal(fundoPreview, estampaSel, { ...eConf, ...fConf });
      if (blob) {
        const finalName = nomeExport.trim() !== '' 
          ? `${nomeExport}.jpg` 
          : `${fundoPreview.nome.replace(/\.[^/.]+$/, "")}__${estampaSel.nome.replace(/\.[^/.]+$/, "")}.jpg`;
        saveAs(blob, finalName);
      }
    } catch (e) {
      alert('Erro ao baixar imagem única.');
      console.error(e);
    }
    setLoadingSingle(false);
  };

  const gerarLote = async () => {
    if (!estampaSel || fundoPaths.length === 0) return alert('Selecione estampa e fundos.');
    setLoadingBatch(true);
    
    try {
      const zip = new JSZip();
      let hasFiles = false;

      for (let i = 0; i < fundoPaths.length; i++) {
          const fId = fundoPaths[i];
          const fundoItem = fundos.find(f => f.id === fId);
          if (!fundoItem) continue;
          
          const fConf = fundoConfigs[fId] || { corHex: '#008237', usarCorOriginal: false };
          const eConf = estampaConfigs[estampaSel.id] || { posX: 0, posY: 0, escala: 100 };
          
          const mergedBlob = await gerarImagemFinal(fundoItem, estampaSel, {
              ...eConf,
              ...fConf
          });
          
          if (mergedBlob) {
              const baseNameFundo = fundoItem.nome.replace(/\.[^/.]+$/, "");
              const baseNameEstampa = estampaSel.nome.replace(/\.[^/.]+$/, "");
              
              const filename = nomeExport.trim() !== '' 
                ? `${nomeExport}_${i + 1}.jpg` 
                : `${baseNameFundo}__${baseNameEstampa}.jpg`;
                
              zip.file(filename, mergedBlob);
              hasFiles = true;
          }
      }

      if (hasFiles) {
          const zipContent = await zip.generateAsync({ type: "blob" });
          saveAs(zipContent, nomeExport.trim() !== '' ? `${nomeExport}.zip` : "Lote_Estampas_Web.zip");
      } else {
          alert('Nenhuma imagem gerada com sucesso.');
      }
      
    } catch (e) {
      alert('Erro crítico ao gerar zip local');
      console.error(e);
    }
    setLoadingBatch(false);
  };

  const estampaUrl = estampaSel ? estampaSel.dataUrl : null;
  const fundoUrl = fundoPreview ? fundoPreview.dataUrl : null;

  const posX = getPosX();
  const posY = getPosY();
  const escala = getEscala();
  const corHex = getCorHex();
  const usarCorOriginal = getUsarCorOriginal();

  // Cores dinâmicas Dark/Light mode
  const bgMain = isDarkMode ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-900";
  const bgSidebar = isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const bgHeader = isDarkMode ? "bg-slate-900" : "bg-slate-50";
  const bgTabActive1 = isDarkMode ? "border-green-500 text-green-400 bg-slate-800/50" : "border-green-600 text-green-800 bg-slate-50";
  const bgTabActive2 = isDarkMode ? "border-yellow-500 text-yellow-400 bg-slate-800/50" : "border-yellow-500 text-yellow-700 bg-slate-50";
  const bgTabIdle = isDarkMode ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50" : "text-slate-500 hover:text-green-700 hover:bg-slate-50";
  const borderList = isDarkMode ? "border-slate-800" : "border-slate-200";
  const listBgIdle = isDarkMode ? "bg-slate-800/30 border-transparent hover:border-slate-700" : "bg-white border-slate-200 hover:border-green-300";
  const listBgInner = isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200";
  const textInfo = isDarkMode ? "text-slate-300" : "text-slate-700";
  const inputBg = isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800";
  const btnSecondary = isDarkMode ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300" : "bg-white hover:bg-slate-50 text-blue-700 border-blue-100";
  const panelTitle = isDarkMode ? "text-slate-400" : "text-slate-500";
  const iconMuted = isDarkMode ? "text-slate-500" : "text-slate-400";
  const trashBtn = isDarkMode ? "text-slate-600 hover:text-red-400 hover:bg-red-400/10" : "text-slate-400 hover:text-red-500 hover:bg-red-50";
  const uploadBtn = isDarkMode ? "bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300" : "bg-white hover:bg-slate-50 border-slate-300 text-slate-600";

  return (
    <div className={`flex h-screen font-sans transition-colors duration-200 ${bgMain}`}>
      
      {/* SIDEBAR LEFT */}
      <div className={`w-80 border-r flex flex-col shadow-xl z-20 transition-colors duration-200 ${bgSidebar}`}>
        <div className={`p-5 border-b flex flex-col justify-center items-center transition-colors duration-200 ${bgHeader} ${borderList} relative`}>
          {/* Título Principal - Marca Opressora */}
          <h1 className="text-xl font-black uppercase tracking-wider flex items-center gap-2 text-green-700">
            <Zap size={22} className="text-yellow-500 fill-current"/>
            CAMISETAS OPRESSORA
          </h1>
          <p className={`text-[10px] uppercase font-bold mt-1 tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            MOCKUP STUDIO OFICIAL
          </p>
          
          {/* Botão de Toggle DarkMode */}
          <button 
            onClick={toggleTheme} 
            className={`absolute right-4 top-4 p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-white hover:bg-slate-100 text-slate-500 shadow-sm border border-slate-200'} `}
            title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
          >
            {isDarkMode ? <Sun size={14}/> : <Moon size={14}/>}
          </button>
        </div>
        
        {/* Tabs */}
        <div className={`flex border-b transition-colors duration-200 ${bgSidebar}`}>
          <button 
            className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${abaAtual === 'fundos' ? `border-b-4 ${bgTabActive1}` : bgTabIdle}`}
            onClick={() => setAbaAtual('fundos')}
          >
            <Shirt size={16}/> MOCKUPS ({fundos.length})
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${abaAtual === 'estampas' ? `border-b-4 ${bgTabActive2}` : bgTabIdle}`}
            onClick={() => setAbaAtual('estampas')}
          >
            <ImageIcon size={16}/> LOGOS ({estampas.length})
          </button>
        </div>

        {/* Upload Button */}
        <div className={`px-4 py-4 border-b transition-colors duration-200 shadow-sm z-10 ${bgSidebar}`}>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full flex items-center justify-center gap-2 py-3 transition rounded-lg border-2 border-dashed font-bold uppercase ${uploadBtn}`}
            >
              <Upload size={18} className={isDarkMode ? "text-green-400" : "text-blue-600"}/> <span>Enviar Imagens</span>
            </button>
            <input 
              type="file" multiple accept="image/*" 
              className="hidden" ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
        </div>

        {/* List */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-slate-50/50'}`}>
          {abaAtual === 'fundos' && fundos.map(item => (
            <div 
              key={item.id} 
              className={`p-2 rounded-xl border-2 transition-all flex items-center gap-3 relative overflow-hidden group shadow-sm ${fundoPaths.includes(item.id) ? `border-green-500 ring-2 ${isDarkMode?'ring-green-900/50 bg-green-900/20':'ring-green-100'}` : listBgIdle}`}
            >
               <img src={item.dataUrl} onClick={() => toggleFundoPath(item.id, item)} className={`w-16 h-16 object-cover cursor-pointer rounded-lg border ${listBgInner}`} />
               <div className={`flex-1 truncate text-sm font-bold flex flex-col cursor-pointer ${textInfo}`} onClick={() => toggleFundoPath(item.id, item)}>
                 <span className="truncate">{item.nome}</span>
                 {fundoConfigs[item.id]?.corHex && !fundoConfigs[item.id]?.usarCorOriginal && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className={`w-4 h-4 rounded-full border shadow-sm ${borderList}`} style={{backgroundColor: fundoConfigs[item.id].corHex}}></div>
                      <span className={`text-xs font-medium truncate uppercase ${isDarkMode?'text-slate-400':'text-slate-500'}`}>{fundoConfigs[item.id].corHex}</span>
                    </div>
                 )}
               </div>
               <button className={`p-2 rounded-lg transition ${trashBtn}`} onClick={(e) => { e.stopPropagation(); removerItemDb(item.id, true); }}><Trash2 size={18}/></button>
               {fundoPaths.includes(item.id) && <CheckCircle2 size={20} className={`absolute top-2 right-2 pointer-events-none drop-shadow-sm rounded-full ${isDarkMode?'text-green-400 bg-slate-900':'text-green-600 bg-white'}`}/>}
            </div>
          ))}

          {abaAtual === 'estampas' && estampas.map(item => (
            <div 
              key={item.id} 
              className={`p-2 rounded-xl border-2 transition-all flex items-center gap-3 relative shadow-sm ${estampaSel?.id === item.id ? `border-yellow-500 ring-2 ${isDarkMode?'ring-yellow-900/50 bg-yellow-900/10':'ring-yellow-100'}` : listBgIdle}`}
            >
               <div className={`w-16 h-16 p-2 rounded-lg cursor-pointer flex items-center justify-center relative overflow-hidden border ${listBgInner}`} onClick={() => setEstampaSel(item)}>
                 <img src={item.dataUrl} className="max-w-full max-h-full object-contain drop-shadow-sm" />
               </div>
               <div className={`flex-1 cursor-pointer truncate text-sm font-bold ${textInfo}`} onClick={() => setEstampaSel(item)}>{item.nome}</div>
               <button className={`p-2 rounded-lg transition ${trashBtn}`} onClick={(e) => { e.stopPropagation(); removerItemDb(item.id, false); }}><Trash2 size={18}/></button>
            </div>
          ))}
          
          {(abaAtual === 'fundos' ? fundos : estampas).length === 0 && (
              <div className={`text-center text-sm font-medium mt-10 p-6 border border-dashed rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>Nenhuma arte na memória.<br/>Faça seu upload na nuvem.</div>
          )}
        </div>
      </div>

      {/* CANVAS MIDDLE */}
      <div className={`flex-1 flex flex-col relative overflow-hidden transition-colors duration-200 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-slate-100'}`}>
        <div className={`absolute inset-0 opacity-5 pointer-events-none ${isDarkMode?'invert':''}`} style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        {/* Top bar */}
        <div className={`h-14 border-b flex items-center px-6 justify-between z-10 shadow-sm relative transition-colors duration-200 ${bgSidebar}`}>
           <div className={`text-sm font-bold flex items-center ${isDarkMode?'text-slate-400':'text-slate-500'}`}>
             {fundoPreview && <span className={`mr-4 border-2 px-3 py-1 rounded-full ${isDarkMode ? 'text-green-400 border-green-900 bg-green-900/20' : 'text-green-800 border-green-200 bg-green-50'}`}>{fundoPreview.nome}</span>}
             <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}> <ChevronRight size={16} className="inline mr-1" />{fundoPaths.length} Mockups selecionados para produção</span>
           </div>
        </div>
        
        {/* Workspace */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto relative z-0" ref={fundoContainerRef}>
          {fundoUrl && estampaUrl ? (
            <div className={`relative shadow-2xl aspect-auto rounded-md overflow-hidden ring-1 ${isDarkMode ? 'bg-black ring-slate-800 shadow-emerald-900/20' : 'bg-white ring-slate-900/5'}`} style={{
                transform: `scale(${canvasScale})`,
                transformOrigin: 'center center',
            }}>
               <img src={fundoUrl} className="block pointer-events-none select-none max-w-none" style={{ height: 'auto' }} onLoad={(e) => {
                 const container = fundoContainerRef.current;
                 const s = Math.min(container.clientWidth / e.target.naturalWidth, container.clientHeight / e.target.naturalHeight, 1);
                 setCanvasScale(s);
               }} />

               <Draggable 
                 nodeRef={nodeRef}
                 position={{ x: posX, y: posY }} 
                 scale={canvasScale}
                 onDrag={handleDrag}
                 bounds="parent"
               >
                 <div ref={nodeRef} className="absolute top-0 left-0 cursor-move transition-shadow shadow-md outline outline-2 outline-blue-500/50 hover:outline-blue-600 group bg-slate-900/5 hover:bg-transparent rounded-sm" style={{
                   width: naturalSize.w > 0 ? (naturalSize.w * Math.max(0.05, escala / 100)) : 200,
                   height: naturalSize.h > 0 ? (naturalSize.h * Math.max(0.05, escala / 100)) : 200,
                   minWidth: '50px',
                   minHeight: '50px'
                 }}>
                    {!usarCorOriginal && (
                      <div className="absolute inset-0 pointer-events-none z-10 mix-blend-multiply" style={{
                        backgroundColor: corHex,
                        WebkitMaskImage: `url(${JSON.stringify(estampaUrl)})`,
                        WebkitMaskSize: '100% 100%',
                        WebkitMaskPosition: 'center',
                        WebkitMaskRepeat: 'no-repeat',
                        maskImage: `url(${JSON.stringify(estampaUrl)})`,
                        maskSize: '100% 100%',
                        maskPosition: 'center',
                        maskRepeat: 'no-repeat'
                      }} />
                    )}
                    
                    <img src={estampaUrl} className={`w-full h-full object-contain pointer-events-none drop-shadow-md ${!usarCorOriginal ? 'opacity-10 grayscale' : ''}`} />
                    
                    {/* Position Tooltip */}
                    <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 font-bold text-xs px-3 py-1.5 rounded shadow-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 transition-all scale-95 group-hover:scale-100 ${isDarkMode?'bg-slate-200 text-slate-900 border border-slate-300':'bg-slate-900 text-white'}`}>
                      X: {posX} • Y: {posY}
                    </div>
                 </div>
               </Draggable>
            </div>
          ) : (
            <div className={`flex flex-col items-center gap-4 p-12 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
               <Layers size={64} className={`opacity-20 ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}/>
               <p className={`font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Carregue suas artes para moldar sua coleção.</p>
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR RIGHT (Properties) */}
      {fundoPreview && estampaSel && (
        <div className={`w-80 border-l flex flex-col z-20 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] p-5 overflow-y-auto transition-colors duration-200 ${bgSidebar}`}>
          <h2 className={`text-xs uppercase tracking-widest font-black flex items-center gap-2 mb-4 ${panelTitle}`}>
            <Settings2 size={16}/> Configurações Visuais
          </h2>
          
          <div className={`mb-6 text-xs px-3 py-3 rounded-lg border leading-tight ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            As alterações modificam a estampa base no mockup: <span className={`font-bold max-w-full truncate block mt-1 ${isDarkMode?'text-blue-400':'text-blue-600'}`}>{fundoPreview.nome}</span>
          </div>

          {/* Colors */}
          <div className={`mb-6 border rounded-xl p-4 shadow-sm ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'}`}>
             <label className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${textInfo}`}>
               <Palette size={14} className={isDarkMode ? 'text-green-400' : 'text-green-600'}/> Preenchimento Hex
             </label>
             
             <div className="grid grid-cols-6 gap-2 mb-4">
               {['#008237', '#fed800', '#1c3d79', '#000000', '#ffffff', '#ef4444'].map(c => (
                 <button 
                   key={c} 
                   onClick={() => { setFundoConfig('corHex', c); setFundoConfig('usarCorOriginal', false); }}
                   className={`w-full aspect-square rounded-full border-2 transition-transform hover:scale-110 shadow-sm ${corHex === c && !usarCorOriginal ? `border-green-500 scale-110 ring-2 ${isDarkMode?'ring-green-900/50':'ring-green-100'}` : (isDarkMode?'border-slate-700':'border-slate-300')}`}
                   style={{ backgroundColor: c }}
                 />
               ))}
             </div>
             
             <div className="flex items-center gap-3">
               <input type="color" value={corHex} onChange={e => { setFundoConfig('corHex', e.target.value); setFundoConfig('usarCorOriginal', false); }} disabled={usarCorOriginal} className={`w-10 h-10 rounded border overflow-hidden cursor-pointer shrink-0 ${isDarkMode?'border-slate-700 bg-slate-800':'border-slate-300'}`} />
               <input type="text" value={corHex} onChange={e => { setFundoConfig('corHex', e.target.value); setFundoConfig('usarCorOriginal', false); }} disabled={usarCorOriginal} className={`border text-sm rounded-lg px-3 py-2 uppercase flex-1 font-mono font-bold tracking-widest disabled:opacity-50 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all ${inputBg}`} />
             </div>
             
             <label className="flex items-center gap-2 mt-4 cursor-pointer group">
               <div className="relative flex items-center">
                   <input type="checkbox" checked={usarCorOriginal} onChange={e => setFundoConfig('usarCorOriginal', e.target.checked)} className="peer sr-only" />
                   <div className={`w-10 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${isDarkMode ? 'bg-slate-700 after:border-slate-600' : 'bg-slate-300 after:border-slate-300'}`}></div>
               </div>
               <span className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-900'}`}>Desativar Colorização (Original)</span>
             </label>
          </div>
          
          {/* Transform */}
          <div className={`mb-6 border rounded-xl p-4 shadow-sm ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'}`}>
             <div className="flex justify-between items-end mb-4">
               <label className={`text-xs font-bold uppercase tracking-wider ${textInfo}`}>Tamanho Padrão</label>
               <span className={`text-xs font-black font-mono px-2 py-1 rounded ${isDarkMode ? 'text-green-400 bg-green-900/30' : 'text-green-700 bg-green-100'}`}>{escala}%</span>
             </div>
             <input 
               type="range" min="10" max="250" value={escala} 
               onChange={e => {
                 if (estampaSel) setEstampaConfig(estampaSel.id, 'escala', Number(e.target.value));
               }}
               className="w-full accent-green-600"
             />
             <button onClick={centralizarEstampa} className={`w-full mt-4 text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition-colors border shadow-sm flex justify-center items-center gap-2 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100/50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}>
                <Focus size={14}/> Auto-Center (Alvo)
             </button>
          </div>

          {/* Export Settings */}
          <div className={`mb-6 p-4 rounded-xl border ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-transparent border-transparent'}`}>
            <label className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${textInfo}`}>
               <FileText size={14} className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}/> Prefixo Customizado
            </label>
            <input 
              type="text" 
              placeholder="Ex: nova_colecao_patria"
              value={nomeExport}
              onChange={e => setNomeExport(e.target.value)}
              className={`w-full border text-sm font-medium rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm ${inputBg}`}
            />
            <p className={`text-[10px] mt-2 font-medium leading-tight ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              Vazio = Usará o nome puro `<mockup> + <logo>`. No lote ZIP, adicionaremos a trilha _1, _2...
            </p>
          </div>
  
          <div className="mt-auto space-y-3 pt-2">
             <button 
               onClick={baixarImagemUnica} 
               disabled={loadingSingle || !estampaSel || !fundoPreview}
               className={`w-full font-bold py-3.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700' : 'bg-white hover:bg-slate-50 text-blue-700 border-blue-100 hover:border-blue-200'}`}
             >
               {loadingSingle ? <RefreshCw className="animate-spin" size={18}/> : <FileImage size={18}/>}
               BAIXAR FOTO ATUAL
             </button>

             <button 
               onClick={gerarLote} 
               disabled={loadingBatch || fundoPaths.length === 0}
               className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black uppercase tracking-wider py-4 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 border border-green-700/50"
             >
               {loadingBatch ? <RefreshCw className="animate-spin" size={20}/> : <Download size={20}/>}
               ESCALONAR LOTE ({fundoPaths.length})
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
