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
  Star
} from 'lucide-react';

function App() {
  const [fundos, setFundos] = useState([]);
  const [estampas, setEstampas] = useState([]);
  
  const [fundoPaths, setFundoPaths] = useState([]); // Multiple selection for batch IDs
  const [estampaSel, setEstampaSel] = useState(null);
  const [fundoPreview, setFundoPreview] = useState(null); // Active background for canvas
  
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

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* SIDEBAR LEFT */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm z-20">
        <div className="p-5 border-b border-slate-200 flex flex-col justify-center items-center bg-slate-50">
          <h1 className="text-lg font-black uppercase tracking-wider flex items-center gap-2 text-green-700">
            <Star size={20} className="text-yellow-500 fill-current"/>
            Loja Auriverde
          </h1>
          <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-widest">Mockup Studio Oficial</p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white">
          <button 
            className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${abaAtual === 'fundos' ? 'border-b-4 border-green-600 text-green-800 bg-slate-50' : 'text-slate-500 hover:text-green-700 hover:bg-slate-50'}`}
            onClick={() => setAbaAtual('fundos')}
          >
            <Shirt size={16}/> MOCKUPS ({fundos.length})
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${abaAtual === 'estampas' ? 'border-b-4 border-yellow-500 text-yellow-700 bg-slate-50' : 'text-slate-500 hover:text-yellow-600 hover:bg-slate-50'}`}
            onClick={() => setAbaAtual('estampas')}
          >
            <ImageIcon size={16}/> LOGOS ({estampas.length})
          </button>
        </div>

        {/* Upload Button */}
        <div className="px-4 py-4 border-b border-slate-200 bg-white shadow-sm z-10">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 transition rounded-lg border-2 border-dashed border-slate-300 text-sm font-bold text-slate-600 uppercase"
            >
              <Upload size={18} className="text-blue-600"/> Enviar Imagens
            </button>
            <input 
              type="file" multiple accept="image/*" 
              className="hidden" ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {abaAtual === 'fundos' && fundos.map(item => (
            <div 
              key={item.id} 
              className={`p-2 rounded-xl border-2 transition-all flex items-center gap-3 relative overflow-hidden group bg-white shadow-sm ${fundoPaths.includes(item.id) ? 'border-green-500 ring-2 ring-green-100' : 'border-slate-200 hover:border-green-300'}`}
            >
               <img src={item.dataUrl} onClick={() => toggleFundoPath(item.id, item)} className="w-16 h-16 object-cover cursor-pointer rounded-lg bg-slate-100 border border-slate-200" />
               <div className="flex-1 truncate text-sm font-bold text-slate-700 flex flex-col cursor-pointer" onClick={() => toggleFundoPath(item.id, item)}>
                 <span className="truncate">{item.nome}</span>
                 {fundoConfigs[item.id]?.corHex && !fundoConfigs[item.id]?.usarCorOriginal && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-4 h-4 rounded-full border border-slate-300 shadow-sm" style={{backgroundColor: fundoConfigs[item.id].corHex}}></div>
                      <span className="text-xs text-slate-500 font-medium truncate uppercase">{fundoConfigs[item.id].corHex}</span>
                    </div>
                 )}
               </div>
               <button className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition" onClick={(e) => { e.stopPropagation(); removerItemDb(item.id, true); }}><Trash2 size={18}/></button>
               {fundoPaths.includes(item.id) && <CheckCircle2 size={20} className="text-green-600 absolute top-2 right-2 pointer-events-none drop-shadow-sm bg-white rounded-full"/>}
            </div>
          ))}

          {abaAtual === 'estampas' && estampas.map(item => (
            <div 
              key={item.id} 
              className={`p-2 rounded-xl border-2 transition-all flex items-center gap-3 relative bg-white shadow-sm ${estampaSel?.id === item.id ? 'border-yellow-500 ring-2 ring-yellow-100' : 'border-slate-200 hover:border-yellow-300'}`}
            >
               <div className="w-16 h-16 p-2 rounded-lg bg-slate-100 cursor-pointer flex items-center justify-center relative overflow-hidden border border-slate-200" onClick={() => setEstampaSel(item)}>
                 <img src={item.dataUrl} className="max-w-full max-h-full object-contain drop-shadow-sm" />
               </div>
               <div className="flex-1 cursor-pointer truncate text-sm font-bold text-slate-700" onClick={() => setEstampaSel(item)}>{item.nome}</div>
               <button className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition" onClick={(e) => { e.stopPropagation(); removerItemDb(item.id, false); }}><Trash2 size={18}/></button>
            </div>
          ))}
          
          {(abaAtual === 'fundos' ? fundos : estampas).length === 0 && (
              <div className="text-center text-sm font-medium text-slate-500 mt-10 p-6 bg-white border border-slate-200 border-dashed rounded-xl">Nenhuma arte na memória.<br/>Faça seu upload acima.</div>
          )}
        </div>
      </div>

      {/* CANVAS MIDDLE */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-100">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        {/* Top bar */}
        <div className="h-14 border-b border-slate-200 flex items-center px-6 justify-between bg-white z-10 shadow-sm relative">
           <div className="text-sm font-bold text-slate-500 flex items-center">
             {fundoPreview && <span className="mr-4 text-green-800 border-2 border-green-200 bg-green-50 px-3 py-1 rounded-full">{fundoPreview.nome}</span>}
             <span className="text-blue-600">{fundoPaths.length} Fundos marcados</span>
           </div>
        </div>
        
        {/* Workspace */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto relative z-0" ref={fundoContainerRef}>
          {fundoUrl && estampaUrl ? (
            <div className="relative shadow-2xl bg-white aspect-auto rounded-md overflow-hidden ring-1 ring-slate-900/5" style={{
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
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 font-bold text-white text-xs px-3 py-1.5 rounded shadow-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 transition-all scale-95 group-hover:scale-100">
                      X: {posX} • Y: {posY}
                    </div>
                 </div>
               </Draggable>
            </div>
          ) : (
            <div className="text-slate-400 flex flex-col items-center gap-4 bg-white p-12 rounded-2xl shadow-sm border border-slate-200">
               <Shirt size={64} className="opacity-20 text-slate-800"/>
               <p className="font-bold text-slate-500">Faça upload e marque artes para iniciar.</p>
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR RIGHT (Properties) */}
      {fundoPreview && estampaSel && (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col z-20 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] p-5 overflow-y-auto">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 font-black flex items-center gap-2 mb-4">
            <Settings2 size={16}/> Configurações
          </h2>
          
          <div className="mb-6 text-xs text-slate-600 px-3 py-3 bg-slate-50 rounded-lg border border-slate-200 leading-tight">
            As alterações visuais modificam a estampa no mockup: <span className="text-blue-600 font-bold max-w-full truncate block mt-1">{fundoPreview.nome}</span>
          </div>

          {/* Colors */}
          <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
             <label className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-700">
               <Palette size={14} className="text-green-600"/> Preenchimento Exato
             </label>
             
             <div className="grid grid-cols-6 gap-2 mb-4">
               {['#008237', '#fed800', '#1c3d79', '#000000', '#ffffff', '#ef4444'].map(c => (
                 <button 
                   key={c} 
                   onClick={() => { setFundoConfig('corHex', c); setFundoConfig('usarCorOriginal', false); }}
                   className={`w-full aspect-square rounded-full border-2 transition-transform hover:scale-110 shadow-sm ${corHex === c && !usarCorOriginal ? 'border-green-500 scale-110 ring-2 ring-green-100' : 'border-slate-300'}`}
                   style={{ backgroundColor: c }}
                 />
               ))}
             </div>
             
             <div className="flex items-center gap-3">
               <input type="color" value={corHex} onChange={e => { setFundoConfig('corHex', e.target.value); setFundoConfig('usarCorOriginal', false); }} disabled={usarCorOriginal} className="w-10 h-10 rounded border border-slate-300 overflow-hidden cursor-pointer shrink-0" />
               <input type="text" value={corHex} onChange={e => { setFundoConfig('corHex', e.target.value); setFundoConfig('usarCorOriginal', false); }} disabled={usarCorOriginal} className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 uppercase flex-1 font-mono font-bold tracking-widest text-slate-700 disabled:opacity-50 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" />
             </div>
             
             <label className="flex items-center gap-2 mt-4 cursor-pointer group">
               <div className="relative flex items-center">
                   <input type="checkbox" checked={usarCorOriginal} onChange={e => setFundoConfig('usarCorOriginal', e.target.checked)} className="peer sr-only" />
                   <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
               </div>
               <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Usar cor original da arte</span>
             </label>
          </div>
          
          {/* Transform */}
          <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
             <div className="flex justify-between items-end mb-4">
               <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Tamanho da Arte</label>
               <span className="text-xs text-green-700 font-black font-mono bg-green-100 px-2 py-1 rounded">{escala}%</span>
             </div>
             <input 
               type="range" min="10" max="250" value={escala} 
               onChange={e => {
                 if (estampaSel) setEstampaConfig(estampaSel.id, 'escala', Number(e.target.value));
               }}
               className="w-full accent-green-600"
             />
             <button onClick={centralizarEstampa} className="w-full mt-4 bg-slate-100/50 hover:bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition-colors border border-slate-200 shadow-sm flex justify-center items-center gap-2">
                <Shirt size={14}/> Centralizar no Mockup
             </button>
          </div>

          {/* Export Settings */}
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-slate-700">
               <FileText size={14} className="text-yellow-600"/> Nome do Arquivo
            </label>
            <input 
              type="text" 
              placeholder="Ex: colecao_patria"
              value={nomeExport}
              onChange={e => setNomeExport(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-lg px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
            <p className="text-[10px] text-slate-500 mt-2 font-medium leading-tight">
              Se vazio, usaremos o nome original das imagens. No caso do Lote via ZIP, os números serão sequenciados.
            </p>
          </div>
  
          <div className="mt-auto space-y-3 pt-2">
             <button 
               onClick={baixarImagemUnica} 
               disabled={loadingSingle || !estampaSel || !fundoPreview}
               className="w-full bg-white hover:bg-slate-50 text-blue-700 font-bold py-3.5 rounded-xl border-2 border-blue-100 hover:border-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
             >
               {loadingSingle ? <RefreshCw className="animate-spin" size={18}/> : <FileImage size={18}/>}
               BAIXAR FOTO ATUAL
             </button>

             <button 
               onClick={gerarLote} 
               disabled={loadingBatch || fundoPaths.length === 0}
               className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black uppercase tracking-wider py-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2 border border-green-700/50"
             >
               {loadingBatch ? <RefreshCw className="animate-spin" size={20}/> : <Download size={20}/>}
               GERAR LOTE ZIP ({fundoPaths.length})
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
