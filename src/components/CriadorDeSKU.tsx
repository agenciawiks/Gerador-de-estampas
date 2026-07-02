import { useState, useEffect } from "react";
import { Copy, Hash, Plus, Minus, RotateCcw, Trash2, CheckCircle2, History, RefreshCw, Undo2 } from "lucide-react";
import { appDb } from "../db";

// Predefined Stores from the Guide
const LOJAS_PREDEFINIDAS = [
  { label: "Camisetas Opressoras", value: "OPR" },
  { label: "Auri Verde", value: "AURI" },
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

interface SkuItem {
  id: string;
  sku: string;
  loja: string;
  customLoja?: string;
  categoria: string;
  customCategoria?: string;
  colecao: string;
  idSeq: number;
  padSize: number;
  createdAt: number;
}

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
  const [loja, setLoja] = useState("OPR");
  const [customLoja, setCustomLoja] = useState("");
  
  const [categoria, setCategoria] = useState("CAM");
  const [customCategoria, setCustomCategoria] = useState("");
  
  const [colecao, setColecao] = useState("");
  const [idSeq, setIdSeq] = useState(1);
  const [padSize, setPadSize] = useState(2);
  
  const [skuGerado, setSkuGerado] = useState("");
  const [historico, setHistorico] = useState<SkuItem[]>([]);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "copied_inc">("idle");
  const [skuCopiadoId, setSkuCopiadoId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load history from db on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await appDb.loadSkus();
        setHistorico(saved);
      } catch (e) {
        console.error("Erro ao carregar histórico de SKUs:", e);
      }
    })();
  }, []);

  // Update generated SKU dynamically in real time
  useEffect(() => {
    const finalLoja = (loja === "OUTRA" ? normalizarModelo(customLoja) : loja).trim();
    const finalCat = (categoria === "OUTRA" ? normalizarModelo(customCategoria) : categoria).trim();
    const finalColecao = normalizarModelo(colecao).trim();
    const finalId = String(idSeq).padStart(padSize, "0");

    // Assemble parts
    // FORMATO: LOJA-CAT-COLECAO-ID
    const partes: string[] = [];
    if (finalLoja) partes.push(finalLoja);
    if (finalCat) partes.push(finalCat);
    if (finalColecao) partes.push(finalColecao);
    partes.push(finalId);

    setSkuGerado(partes.join("-"));
  }, [loja, customLoja, categoria, customCategoria, colecao, idSeq, padSize]);

  const copiarSku = (incremental: boolean = false) => {
    if (!skuGerado) return;
    navigator.clipboard.writeText(skuGerado).then(async () => {
      setCopyStatus(incremental ? "copied_inc" : "copied");
      
      const newSkuItem: SkuItem = {
        id: skuGerado, // Usamos o SKU gerado como identificador único
        sku: skuGerado,
        loja,
        customLoja,
        categoria,
        customCategoria,
        colecao,
        idSeq,
        padSize,
        createdAt: Date.now()
      };

      try {
        await appDb.saveSku(newSkuItem);
        const updated = await appDb.loadSkus();
        setHistorico(updated);
      } catch (err) {
        console.error("Erro ao persistir SKU:", err);
      }

      if (incremental) {
        // Increment ID
        setIdSeq((prev) => prev + 1);
      }

      setTimeout(() => setCopyStatus("idle"), 1500);
    });
  };

  const copiarSkuHistorico = (itemSku: string) => {
    navigator.clipboard.writeText(itemSku).then(() => {
      setSkuCopiadoId(itemSku);
      setTimeout(() => setSkuCopiadoId(null), 1500);
    });
  };

  const reutilizarParametros = (item: SkuItem) => {
    setLoja(item.loja);
    if (item.customLoja) setCustomLoja(item.customLoja);
    setCategoria(item.categoria);
    if (item.customCategoria) setCustomCategoria(item.customCategoria);
    setColecao(item.colecao);
    setIdSeq(item.idSeq);
    setPadSize(item.padSize);
  };

  const deletarSku = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      // Cancela a confirmação em 3 segundos se não clicar novamente
      setTimeout(() => {
        setDeleteConfirmId(prev => prev === id ? null : prev);
      }, 3000);
      return;
    }

    try {
      await appDb.deleteSku(id);
      setDeleteConfirmId(null);
      const updated = await appDb.loadSkus();
      setHistorico(updated);
    } catch (err) {
      console.error("Erro ao deletar SKU:", err);
    }
  };

  const resetarForm = () => {
    setLoja("OPR");
    setCustomLoja("");
    setCategoria("CAM");
    setCustomCategoria("");
    setColecao("");
    setIdSeq(1);
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
              {LOJAS_PREDEFINIDAS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
              <option value="OUTRA">Outra (Personalizada)...</option>
            </select>
          </div>
        </div>

        {/* Custom Loja (condicional) */}
        {loja === "OUTRA" && (
          <div className="flex flex-col gap-2 mb-4">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
              Apelido da Loja
            </label>
            <input
              type="text"
              placeholder="Ex: LOJAPROPRIA (Max 5 letras)"
              value={customLoja}
              onChange={(e) => setCustomLoja(e.target.value.substring(0, 10))}
              className={inputClass}
            />
          </div>
        )}

        {/* Categoria */}
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
            Categoria de Produto
          </label>
          <div className="relative">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={selectClass}
            >
              {CATEGORIAS_PREDEFINIDAS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
              <option value="OUTRA">Outra (Personalizada)...</option>
            </select>
          </div>
        </div>

        {/* Custom Categoria (condicional) */}
        {categoria === "OUTRA" && (
          <div className="flex flex-col gap-2 mb-4">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
              Código da Categoria
            </label>
            <input
              type="text"
              placeholder="Ex: MOLETOM -> MOL"
              value={customCategoria}
              onChange={(e) => setCustomCategoria(e.target.value.substring(0, 5))}
              className={inputClass}
            />
          </div>
        )}

        {/* Coleção */}
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
            Nome da Coleção (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ex: PATRIOTAS, INVERNO26"
            value={colecao}
            onChange={(e) => setColecao(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Sequência ID e Pad */}
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
            Número Sequencial ID
          </label>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setIdSeq((prev) => Math.max(1, prev - 1))}
              className={`${btnClass} bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-500`}
            >
              <Minus size={15} />
            </button>
            <input
              type="number"
              min={1}
              value={idSeq}
              onChange={(e) => setIdSeq(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 text-center font-bold px-2 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <button
              onClick={() => setIdSeq((prev) => prev + 1)}
              className={`${btnClass} bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-500`}
            >
              <Plus size={15} />
            </button>

            <select
              value={padSize}
              onChange={(e) => setPadSize(parseInt(e.target.value))}
              title="Quantidade de zeros à esquerda"
              className="ml-2 font-mono text-xs px-2.5 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value={1}>ID (1)</option>
              <option value={2}>ID (01)</option>
              <option value={3}>ID (001)</option>
              <option value={4}>ID (0001)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SKU Live Preview Card */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-orange-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Visualização em Tempo Real
            </h3>
          </div>
          <div>
            <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
              isExceeded 
                ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
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
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <History size={16} className="text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Histórico Permanente de SKUs cadastrados
            </h3>
          </div>
        </div>

        {historico.length > 0 ? (
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {historico.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-orange-500/40 dark:hover:border-orange-500/30 transition-all gap-3"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <code className="font-mono text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider break-all">
                    {item.sku}
                  </code>
                  
                  {/* SKU Details Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-1 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Loja: {item.loja === "OUTRA" ? `${item.customLoja} (Custom)` : item.loja}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Cat: {item.categoria === "OUTRA" ? `${item.customCategoria} (Custom)` : item.categoria}
                    </span>
                    {item.colecao && (
                      <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500">
                        Coleção: {item.colecao}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      ID: {String(item.idSeq).padStart(item.padSize, "0")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Reutilizar */}
                  <button
                    onClick={() => reutilizarParametros(item)}
                    title="Carregar esses valores no formulário acima"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-orange-500/10 hover:text-orange-500 dark:bg-slate-800 dark:hover:bg-orange-500/20 rounded-lg text-xs font-black text-slate-600 dark:text-slate-300 transition-all border border-transparent hover:border-orange-500/20"
                  >
                    <Undo2 size={13} />
                    Reutilizar
                  </button>

                  {/* Copiar */}
                  <button
                    onClick={() => copiarSkuHistorico(item.sku)}
                    title="Copiar novamente"
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white rounded-lg text-slate-500 dark:text-slate-400 transition-all flex items-center justify-center border border-transparent shadow-sm"
                  >
                    {skuCopiadoId === item.sku ? <CheckCircle2 size={13} className="text-green-500" /> : <Copy size={13} />}
                  </button>

                  {/* Deletar (Double-Click Confirm Pattern) */}
                  <button
                    onClick={() => deletarSku(item.id)}
                    title={deleteConfirmId === item.id ? "Clique novamente para confirmar" : "Apagar SKU do histórico"}
                    className={`p-2 rounded-lg transition-all flex items-center justify-center border shadow-sm ${
                      deleteConfirmId === item.id 
                        ? "bg-red-500 border-red-600 text-white font-black text-xs px-3" 
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/20 border-transparent text-slate-400 hover:border-red-500/20"
                    }`}
                  >
                    {deleteConfirmId === item.id ? (
                      <span className="text-[10px] uppercase font-black">Confirmar?</span>
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center bg-slate-100/50 dark:bg-slate-900/30">
            <span className="text-[11px] font-bold text-slate-400">Nenhum SKU gerado neste histórico.</span>
            <span className="text-[10px] text-slate-400/80 mt-1">Ao copiar um SKU, ele será salvo permanentemente aqui.</span>
          </div>
        )}
      </div>

    </div>
  );
}
