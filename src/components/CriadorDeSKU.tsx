import { useState, useEffect } from "react";
import { Copy, Hash, Plus, Minus, RotateCcw, Trash2, CheckCircle2, History } from "lucide-react";

// Predefined Stores from the Guide
const LOJAS_PREDEFINIDAS = [
  { label: "Camisetas Opressoras", value: "OPRESSORAS" },
  { label: "Auriverde", value: "AURI" },
  { label: "Timeline", value: "TIME" },
];

// Predefined Categories from the Guide
const CATEGORIAS_PREDEFINIDAS = [
  { label: "Camisetas e camisas", value: "CAM" },
  { label: "Canecas", value: "CAN" },
  { label: "Adesivos", value: "ADE" },
  { label: "Bottons", value: "BTN" },
  { label: "Boné", value: "BON" },
  { label: "Chinelos", value: "CHI" },
  { label: "Bandeiras", value: "BAN" },
  { label: "MDF", value: "MDF" },
  { label: "Mousepad", value: "MP" },
  { label: "Caderno", value: "CAD" },
  { label: "Quadros", value: "QUA" },
];

// Accent and special character removal utility
const normalizarModelo = (texto: string): string => {
  return texto
    .normalize("NFD") // split accent characters
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9\s-]/g, "") // remove special characters except spaces/hyphens
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .toUpperCase();
};

export default function CriadorDeSKU() {
  const [loja, setLoja] = useState("OPRESSORAS");
  const [customLoja, setCustomLoja] = useState("");
  
  const [categoria, setCategoria] = useState("CAM");
  const [customCategoria, setCustomCategoria] = useState("");
  
  const [colecao, setColecao] = useState("");
  const [idSeq, setIdSeq] = useState(1);
  const [padSize, setPadSize] = useState(2);
  const [modelo, setModelo] = useState("");
  
  const [skuGerado, setSkuGerado] = useState("");
  const [historico, setHistorico] = useState<string[]>([]);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "copied_inc">("idle");

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sku_history");
      if (saved) {
        setHistorico(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Erro ao carregar histórico de SKUs:", e);
    }
  }, []);

  // Update generated SKU dynamically in real time
  useEffect(() => {
    const finalLoja = (loja === "OUTRA" ? normalizarModelo(customLoja) : loja).trim();
    const finalCat = (categoria === "OUTRA" ? normalizarModelo(customCategoria) : categoria).trim();
    const finalColecao = normalizarModelo(colecao).trim();
    const finalId = String(idSeq).padStart(padSize, "0");
    const finalModelo = normalizarModelo(modelo).trim();

    // Assemble parts
    // FORMATO: LOJA-CAT-COLECAO-ID-MODELO
    // (campos opcionais como COLECAO não utilizados devem ser omitidos)
    const partes: string[] = [];
    if (finalLoja) partes.push(finalLoja);
    if (finalCat) partes.push(finalCat);
    if (finalColecao) partes.push(finalColecao);
    partes.push(finalId);
    if (finalModelo) partes.push(finalModelo);

    setSkuGerado(partes.join("-"));
  }, [loja, customLoja, categoria, customCategoria, colecao, idSeq, padSize, modelo]);

  const copiarSku = (incremental: boolean = false) => {
    if (!skuGerado) return;
    navigator.clipboard.writeText(skuGerado).then(() => {
      setCopyStatus(incremental ? "copied_inc" : "copied");
      
      // Add to history if not already present in the last position
      setHistorico((prev) => {
        const novoHist = [skuGerado, ...prev.filter((x) => x !== skuGerado)].slice(0, 15);
        localStorage.setItem("sku_history", JSON.stringify(novoHist));
        return novoHist;
      });

      if (incremental) {
        // Increment ID
        setIdSeq((prev) => prev + 1);
      }

      setTimeout(() => setCopyStatus("idle"), 1500);
    });
  };

  const limparHistorico = () => {
    setHistorico([]);
    localStorage.removeItem("sku_history");
  };

  const resetarForm = () => {
    setLoja("OPRESSORAS");
    setCustomLoja("");
    setCategoria("CAM");
    setCustomCategoria("");
    setColecao("");
    setIdSeq(1);
    setModelo("");
  };

  const inputClass =
    "w-full px-4 py-3 text-sm lg:text-base font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm";

  const selectClass = `${inputClass} appearance-none cursor-pointer`;
  const btnClass = "px-3.5 py-3 rounded-lg border text-sm font-black transition-all flex items-center justify-center cursor-pointer";

  const isExceeded = skuGerado.length > 50;

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 my-4 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-5 mb-8">
        <div className="p-3 bg-orange-500 text-white rounded-xl shadow-lg">
          <Hash size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Criador Automático de SKU
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Gere SKUs padronizados seguindo estritamente as diretrizes do guia integrado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        {/* Loja */}
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
            Loja / Marca
          </label>
          <div className="relative">
            <select
              value={loja}
              onChange={(e) => setLoja(e.target.value)}
              className={selectClass}
            >
              {LOJAS_PREDEFINIDAS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label} ({l.value})
                </option>
              ))}
              <option value="OUTRA">Outra Loja...</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          {loja === "OUTRA" && (
            <input
              type="text"
              placeholder="Digite a sigla da loja (Ex: TIME)"
              value={customLoja}
              onChange={(e) => setCustomLoja(e.target.value)}
              className={`${inputClass} mt-2`}
            />
          )}
        </div>

        {/* Categoria */}
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
            Categoria
          </label>
          <div className="relative">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={selectClass}
            >
              {CATEGORIAS_PREDEFINIDAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} ({c.value})
                </option>
              ))}
              <option value="OUTRA">Outra Categoria...</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          {categoria === "OUTRA" && (
            <input
              type="text"
              placeholder="Digite a sigla da categoria (Ex: BON)"
              value={customCategoria}
              onChange={(e) => setCustomCategoria(e.target.value)}
              className={`${inputClass} mt-2`}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        {/* Coleção (Opcional) */}
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
            Coleção / Ano (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ex: 2026, VERAO, COPA"
            value={colecao}
            onChange={(e) => setColecao(e.target.value)}
            className={inputClass}
          />
          <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
            Ano, estação ou nome especial. Deixe em branco se não houver.
          </span>
        </div>

        {/* Sequência / ID */}
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
            Identificador (ID Numérico)
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIdSeq((prev) => Math.max(1, prev - 1))}
              className={`${btnClass} bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-300`}
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              min="1"
              value={idSeq}
              onChange={(e) => setIdSeq(Math.max(1, parseInt(e.target.value) || 1))}
              className={`${inputClass} text-center font-mono`}
            />
            <button
              onClick={() => setIdSeq((prev) => prev + 1)}
              className={`${btnClass} bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-300`}
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Digito incremental para unicidade do produto.
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Casas decimais:</span>
              <select
                value={padSize}
                onChange={(e) => setPadSize(parseInt(e.target.value))}
                className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 focus:outline-none"
              >
                <option value="1">1 (1)</option>
                <option value="2">2 (01)</option>
                <option value="3">3 (001)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Modelo */}
      <div className="flex flex-col gap-2 mb-6">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
          Modelo / Nome da Estampa
        </label>
        <input
          type="text"
          placeholder="Ex: BOLSONARO, LULA, COPA BRASIL, CAVEIRA"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          className={inputClass}
        />
        <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
          O texto será formatado automaticamente: <strong>sem acentos</strong>, letras <strong>MAIÚSCULAS</strong> e espaços trocados por <strong>hífens (-)</strong>.
        </span>
      </div>

      {/* SKU Live Preview Card */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
              <span className="text-orange-600 dark:text-orange-400 font-bold mb-1">↳</span>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Visualização em tempo real do SKU
            </p>
          </div>
          
          {/* Character counter */}
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
              isExceeded
                ? "bg-red-500/10 border-red-500 text-red-500 dark:text-red-400 animate-pulse"
                : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"
            }`}>
              {skuGerado.length} / 50 caracteres
            </span>
          </div>
        </div>

        <div className="relative group">
          <div className={`w-full flex items-center justify-center p-6 border-2 border-dashed rounded-2xl min-h-[100px] transition-all bg-white dark:bg-black/20 ${
            isExceeded 
              ? "border-red-500/50 shadow-lg shadow-red-500/5" 
              : "border-slate-300 dark:border-slate-800 hover:border-orange-500/50"
          }`}>
            <span className={`font-mono text-xl sm:text-2xl font-black uppercase tracking-wider select-all break-all text-center ${
              isExceeded ? "text-red-500 dark:text-red-400" : "text-orange-600 dark:text-orange-400"
            }`}>
              {skuGerado || "SKU-PADRAO-AQUI"}
            </span>
          </div>
          {isExceeded && (
            <p className="text-xs font-bold text-red-500 dark:text-red-400 mt-2 flex items-center gap-1.5">
              ⚠️ O SKU excede o limite máximo recomendado de 50 caracteres para marketplaces! Tente encurtar o modelo ou a coleção.
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-6">
        <button
          onClick={() => copiarSku(false)}
          disabled={!skuGerado}
          className="flex-1 flex justify-center items-center gap-2 px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Copy size={18} />
          {copyStatus === "copied" ? "Copiado!" : "Copiar SKU"}
        </button>

        <button
          onClick={() => copiarSku(true)}
          disabled={!skuGerado}
          title="Copia o SKU e incrementa o ID numérico em +1 para o próximo cadastro"
          className="flex-1 flex justify-center items-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          {copyStatus === "copied_inc" ? "Copiado e +1!" : "Copiar & Somar +1"}
        </button>

        <button
          onClick={resetarForm}
          className="px-6 py-4 flex justify-center items-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-black uppercase tracking-wider rounded-xl transition-all"
        >
          <RotateCcw size={18} />
          Resetar
        </button>
      </div>

      {/* History Log */}
      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History size={16} className="text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Histórico de SKUs Recentes
            </h3>
          </div>
          {historico.length > 0 && (
            <button
              onClick={limparHistorico}
              className="text-[10px] font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 transition-all"
            >
              <Trash2 size={12} /> Limpar
            </button>
          )}
        </div>

        {historico.length > 0 ? (
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {historico.map((sku, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-orange-500/40 dark:hover:border-orange-500/30 transition-all group"
              >
                <code className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80%] uppercase tracking-wider">
                  {sku}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sku);
                  }}
                  title="Copiar novamente"
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white rounded-lg text-slate-500 dark:text-slate-400 shadow-sm opacity-60 group-hover:opacity-100 transition-all flex items-center justify-center"
                >
                  <Copy size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center bg-slate-100/50 dark:bg-slate-900/30">
            <span className="text-[11px] font-bold text-slate-400">Nenhum SKU gerado neste histórico.</span>
            <span className="text-[10px] text-slate-400/80 mt-1">Ao copiar um SKU, ele aparecerá aqui para fácil referência.</span>
          </div>
        )}
      </div>

    </div>
  );
}
