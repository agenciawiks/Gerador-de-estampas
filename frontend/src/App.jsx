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
  RefreshCw
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

  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const fundoContainerRef = useRef(null);
  const nodeRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [abaAtual, setAbaAtual] = useState('fundos'); // fundos | estampas
  const [loadingBatch, setLoadingBatch] = useState(false);

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

  const gerarLote = async () => {
    if (!estampaSel || fundoPaths.length === 0) return alert('Selecione estampa e fundos.');
    setLoadingBatch(true);
    
    try {
      const zip = new JSZip();
      let hasFiles = false;

      for (const fId of fundoPaths) {
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
              const filename = `${baseNameFundo}__${baseNameEstampa}.jpg`;
              zip.file(filename, mergedBlob);
              hasFiles = true;
          }
      }

      if (hasFiles) {
          const zipContent = await zip.generateAsync({ type: "blob" });
          saveAs(zipContent, "Lote_Estampas_Web.zip");
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
    <div className="flex h-screen bg-gray-950 text-gray-200">
      
      {/* SIDEBAR LEFT */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col shadow-xl z-20">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
            <Layers size={24} color="#34d399"/>
            Generator Web
          </h1>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button 
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 ${abaAtual === 'fundos' ? 'border-b-2 border-emerald-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setAbaAtual('fundos')}
          >
            <Shirt size={16}/> Mocks ({fundos.length})
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 ${abaAtual === 'estampas' ? 'border-b-2 border-emerald-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setAbaAtual('estampas')}
          >
            <ImageIcon size={16}/> Logos ({estampas.length})
          </button>
        </div>

        {/* Upload Button */}
        <div className="px-4 py-3 border-b border-gray-800">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2 bg-gray-800 hover:bg-gray-700 transition rounded-lg border border-gray-700 border-dashed text-sm font-medium text-emerald-400"
            >
              <Upload size={16}/> Upload Imagens Pessoais
            </button>
            <input 
              type="file" multiple accept="image/*" 
              className="hidden" ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {abaAtual === 'fundos' && fundos.map(item => (
            <div 
              key={item.id} 
              className={`p-2 rounded-xl border-2 transition-all flex items-center gap-3 relative overflow-hidden group ${fundoPaths.includes(item.id) ? 'border-emerald-500 bg-gray-800/50' : 'border-transparent hover:border-gray-700 bg-gray-800/20'}`}
            >
               <img src={item.dataUrl} onClick={() => toggleFundoPath(item.id, item)} className="w-16 h-16 object-cover cursor-pointer rounded-lg bg-white/5" />
               <div className="flex-1 truncate text-sm font-medium flex flex-col cursor-pointer" onClick={() => toggleFundoPath(item.id, item)}>
                 <span>{item.nome}</span>
                 {fundoConfigs[item.id]?.corHex && !fundoConfigs[item.id]?.usarCorOriginal && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-3 h-3 rounded-full border border-gray-600" style={{backgroundColor: fundoConfigs[item.id].corHex}}></div>
                      <span className="text-xs text-gray-500 truncate">{fundoConfigs[item.id].corHex}</span>
                    </div>
                 )}
               </div>
               <button className="text-gray-500 hover:text-red-400 p-2" onClick={(e) => { e.stopPropagation(); removerItemDb(item.id, true); }}><Trash2 size={16}/></button>
               {fundoPaths.includes(item.id) && <CheckCircle2 size={18} className="text-emerald-500 absolute top-2 right-2 pointer-events-none"/>}
            </div>
          ))}

          {abaAtual === 'estampas' && estampas.map(item => (
            <div 
              key={item.id} 
              className={`p-2 rounded-xl border-2 transition-all flex items-center gap-3 relative ${estampaSel?.id === item.id ? 'border-cyan-500 bg-gray-800/50' : 'border-transparent hover:border-gray-700 bg-gray-800/20'}`}
            >
               <div className="w-16 h-16 p-2 rounded-lg bg-gray-200 cursor-pointer flex items-center justify-center relative overflow-hidden" onClick={() => setEstampaSel(item)}>
                 <img src={item.dataUrl} className="max-w-full max-h-full object-contain" />
               </div>
               <div className="flex-1 cursor-pointer truncate text-sm font-medium" onClick={() => setEstampaSel(item)}>{item.nome}</div>
               <button className="text-gray-500 hover:text-red-400 p-2" onClick={(e) => { e.stopPropagation(); removerItemDb(item.id, false); }}><Trash2 size={16}/></button>
            </div>
          ))}
          
          {(abaAtual === 'fundos' ? fundos : estampas).length === 0 && (
              <div className="text-center text-sm text-gray-500 mt-10">Base local vazia.<br/>Faça seu upload acima.</div>
          )}
        </div>
      </div>

      {/* CANVAS MIDDLE */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-gray-950/50 backdrop-blur-3xl pattern-dots">
        {/* Top bar */}
        <div className="h-14 border-b border-gray-800 flex items-center px-6 justify-between bg-gray-900/50 z-10">
           <div className="text-sm font-medium text-gray-400">
             {fundoPreview && <span className="mr-4 text-emerald-400 border border-emerald-900 bg-emerald-900/20 px-3 py-1 rounded-full">{fundoPreview.nome}</span>}
             {fundoPaths.length} Fundos marcados
           </div>
        </div>
        
        {/* Workspace */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto" ref={fundoContainerRef}>
          {fundoUrl && estampaUrl ? (
            <div className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-white aspect-auto rounded-md overflow-hidden" style={{
                transform: `scale(${canvasScale})`,
                transformOrigin: 'center center',
            }}>
               <img src={fundoUrl} className="block pointer-events-none select-none max-w-none shadow-inner" style={{ height: 'auto' }} onLoad={(e) => {
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
                 <div ref={nodeRef} className="absolute top-0 left-0 cursor-move transition-shadow shadow-[0_0_10px_rgba(0,0,0,0.1)] outline outline-1 outline-emerald-500/50 hover:outline-emerald-500 group bg-white/5" style={{
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
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 transition-opacity">
                      X: {posX} • Y: {posY}
                    </div>
                 </div>
               </Draggable>
            </div>
          ) : (
            <div className="text-gray-600 flex flex-col items-center gap-4">
               <Layers size={48} className="opacity-50"/>
               <p>Faça upload e marque um Mockup e uma Arte para editar.</p>
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR RIGHT (Properties) */}
      {fundoPreview && estampaSel && (
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] p-5">
          <h2 className="text-sm uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-2 mb-6">
            <Settings2 size={16}/> Propriedades Ativas
          </h2>
          
          <div className="mb-4 text-xs text-gray-500 px-3 py-2 bg-gray-800 rounded border border-gray-700 leading-tight">
            Cores aplicam apenas a: <span className="text-emerald-400 font-bold max-w-full truncate block">{fundoPreview.nome}</span>
          </div>

          {/* Colors */}
          <div className="mb-8">
             <label className="text-sm font-medium mb-3 flex items-center gap-2 text-gray-300">
               <Palette size={14}/> Preenchimento Exato
             </label>
             
             <div className="grid grid-cols-6 gap-2 mb-4 drop-shadow-sm">
               {['#008237', '#ecbc2f', '#ef4444', '#3b82f6', '#111827', '#ffffff'].map(c => (
                 <button 
                   key={c} 
                   onClick={() => { setFundoConfig('corHex', c); setFundoConfig('usarCorOriginal', false); }}
                   className={`w-full aspect-square rounded-full border-2 transition-transform hover:scale-110 ${corHex === c && !usarCorOriginal ? 'border-emerald-500 scale-110 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'border-gray-700'}`}
                   style={{ backgroundColor: c }}
                 />
               ))}
             </div>
             
             <div className="flex items-center gap-3">
               <input type="color" value={corHex} onChange={e => { setFundoConfig('corHex', e.target.value); setFundoConfig('usarCorOriginal', false); }} disabled={usarCorOriginal} className="w-10 h-10 rounded overflow-hidden cursor-pointer shrink-0" />
               <input type="text" value={corHex} onChange={e => { setFundoConfig('corHex', e.target.value); setFundoConfig('usarCorOriginal', false); }} disabled={usarCorOriginal} className="bg-gray-800 border-gray-700 text-sm rounded px-3 py-2 uppercase flex-1 font-mono tracking-widest text-emerald-400 disabled:opacity-50 focus:outline-none focus:border-emerald-500 transition-colors" />
             </div>
             
             <label className="flex items-center gap-2 mt-4 cursor-pointer group">
               <div className="relative flex items-center">
                   <input type="checkbox" checked={usarCorOriginal} onChange={e => setFundoConfig('usarCorOriginal', e.target.checked)} className="peer sr-only" />
                   <div className="w-10 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
               </div>
               <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Usar cor original (Apenas Colar)</span>
             </label>
          </div>
          
          <div className="h-px bg-gray-800 w-full mb-8" />
          
          {/* Transform */}
          <div className="mb-6">
             <div className="flex justify-between items-end mb-2">
               <label className="text-sm font-medium text-gray-300">Escala da Estampa</label>
               <span className="text-xs text-emerald-400 font-mono bg-emerald-950 px-2 py-1 rounded">{escala}%</span>
             </div>
             <input 
               type="range" min="10" max="250" value={escala} 
               onChange={e => {
                 if (estampaSel) setEstampaConfig(estampaSel.id, 'escala', Number(e.target.value));
               }}
               className="w-full accent-emerald-500"
             />
          </div>
          
          <button onClick={centralizarEstampa} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2 rounded-lg transition-colors border border-gray-700">
            Centralizar Imagem
          </button>
  
          <div className="mt-auto">
             <button 
               onClick={gerarLote} 
               disabled={loadingBatch || fundoPaths.length === 0}
               className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-gray-900 font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
             >
               {loadingBatch ? <RefreshCw className="animate-spin" size={20}/> : <Download size={20}/>}
               GERAR ZIP CLIENT-SIDE ({fundoPaths.length})
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
