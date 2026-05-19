import { useState, useEffect } from "react";
import { Copy, FileText, Eraser, CheckCircle2, AlertTriangle, Tag, Sparkles, CheckCircle } from "lucide-react";

type ChipGroupProps = {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

function ChipGroup({ options, selected, onChange }: ChipGroupProps) {
  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter((s) => s !== val)
        : [...selected, val]
    );
  };
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => (
        <span
          key={opt}
          onClick={() => toggle(opt)}
          className={`px-4 py-2 flex items-center gap-2 rounded-xl text-sm font-semibold cursor-pointer select-none transition-all shadow-sm ${
            selected.includes(opt)
              ? "bg-indigo-600 border border-indigo-500 text-white shadow-indigo-500/30"
              : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
        >
          {selected.includes(opt) && <CheckCircle2 size={16} />}
          {opt}
        </span>
      ))}
    </div>
  );
}

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function GeradordeERP() {
  const [produto, setProduto] = useState("");
  const [marca, setMarca] = useState("");
  const [estampa, setEstampa] = useState("");
  const [material, setMaterial] = useState<string[]>([]);
  const [cores, setCores] = useState<string[]>([]);
  const [customCor, setCustomCor] = useState("");
  const [tamanhos, setTamanhos] = useState<string[]>([]);
  const [obs, setObs] = useState("");
  const [output, setOutput] = useState('Preencha os campos acima e clique em "Gerar formato ERP".');
  const [copyLabel, setCopyLabel] = useState("Copiar Resultado");
  const [copiedTag, setCopiedTag] = useState(false);

  // Checks if the selected product is a clothing item
  const isVestuario = ["Camiseta", "Camiseta Polo", "Moletom", "Regata"].includes(produto);

  // Recommendations and checks based on brand
  const getRecomendacaoTag = () => {
    if (marca === "Timeline") return "timeline";
    if (marca === "Auriverde") return "auriverde";
    if (marca === "Camisetas Opressoras") return "opressoras";
    return "";
  };

  const getTagColor = () => {
    if (marca === "Timeline") return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
    if (marca === "Auriverde") return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
    if (marca === "Camisetas Opressoras") return "bg-orange-500/10 text-orange-500 border border-orange-500/20";
    return "bg-slate-500/10 text-slate-500 border border-slate-500/20";
  };

  const isPolitical =
    marca === "Camisetas Opressoras" ||
    estampa.toLowerCase().includes("bolsonaro") ||
    estampa.toLowerCase().includes("lula") ||
    estampa.toLowerCase().includes("direita") ||
    estampa.toLowerCase().includes("esquerda") ||
    estampa.toLowerCase().includes("politica") ||
    estampa.toLowerCase().includes("política");

  // Fix custom color input to ensure masculine gender as requested by the guide
  const normalizarCor = (cor: string): string => {
    const femininas: { [key: string]: string } = {
      "branca": "Branco",
      "preta": "Preto",
      "vermelha": "Vermelho",
      "amarela": "Amarelo",
      "cinza": "Cinza",
      "azul": "Azul",
      "verde": "Verde",
    };
    const corLower = cor.trim().toLowerCase();
    if (femininas[corLower]) {
      return femininas[corLower];
    }
    // Capitalize first letter
    return cor.charAt(0).toUpperCase() + cor.slice(1);
  };

  const adicionarCorPersonalizada = () => {
    if (!customCor.trim()) return;
    const corCorrigida = normalizarCor(customCor);
    if (!cores.includes(corCorrigida)) {
      setCores([...cores, corCorrigida]);
    }
    setCustomCor("");
  };

  const copiarTag = () => {
    const tag = getRecomendacaoTag();
    if (!tag) return;
    navigator.clipboard.writeText(tag).then(() => {
      setCopiedTag(true);
      setTimeout(() => setCopiedTag(false), 1500);
    });
  };

  const gerar = () => {
    if (!produto || !marca || !estampa) {
      setOutput("⚠ Preencha pelo menos Produto, Marca e Estampa.");
      return;
    }
    const coresStr = cores.length ? cores.join(", ") : "—";
    const tamStr = tamanhos.length ? tamanhos.join(", ") : "—";
    const matStr = material.length ? material.join(", ") : "—";

    let prompt = `# NOVO PRODUTO:\n`;
    prompt += `- PRODUTO: ${produto}\n`;
    prompt += `- MARCA: ${marca}\n`;
    prompt += `- ESTAMPA: ${estampa}\n`;
    prompt += `- COR: ${coresStr}\n`;
    prompt += `- TAMANHOS: ${tamStr}\n`;
    prompt += `- MATERIAL: ${matStr}\n`;

    // Vestuary clause: Always end with the mandatory phrase
    let observacoesFinais = obs.trim();
    if (isVestuario) {
      const fraseObrigatoria = "Recomendamos verificar atentamente as medidas do produto antes da compra para garantir o tamanho ideal.";
      if (observacoesFinais) {
        if (!observacoesFinais.includes(fraseObrigatoria)) {
          observacoesFinais += `\n\n${fraseObrigatoria}`;
        }
      } else {
        observacoesFinais = fraseObrigatoria;
      }
    }

    if (observacoesFinais) {
      prompt += `\n# OBSERVAÇÕES:\n${observacoesFinais}`;
    }

    setOutput(prompt);
  };

  const copiar = () => {
    if (output.startsWith("Preencha") || output.startsWith("⚠")) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopyLabel("Copiado!");
      setTimeout(() => setCopyLabel("Copiar Resultado"), 1500);
    });
  };

  const limpar = () => {
    setProduto("");
    setMarca("");
    setEstampa("");
    setMaterial([]);
    setCores([]);
    setCustomCor("");
    setTamanhos([]);
    setObs("");
    setOutput('Preencha os campos acima e clique em "Gerar formato ERP".');
  };

  const inputClass =
    "w-full px-4 py-3 text-sm lg:text-base font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm";

  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 my-4 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
      
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-5 mb-8">
        <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg">
          <FileText size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Gerador de ERP
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Preencha os detalhes para formatar o cadastro do produto com suporte a IA e validações integradas.
          </p>
        </div>
      </div>

      {/* Political Warnings Banner */}
      {isPolitical && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex gap-3 items-start shadow-sm">
          <AlertTriangle size={18} className="shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider block">Aviso de Conteúdo Político</span>
            <p className="leading-relaxed font-medium">
              A marca selecionada ou o título da estampa possui cunho político. Lembre-se que algumas plataformas de marketplace (como o TikTok Shop) têm regras rígidas sobre esse conteúdo. Revise tudo com atenção antes de postar para evitar suspensões!
            </p>
          </div>
        </div>
      )}

      {/* Brand Tag Suggestion Banner */}
      {marca && getRecomendacaoTag() && (
        <div className="mb-6 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-slate-700 dark:text-slate-300 text-xs flex justify-between items-center shadow-sm">
          <div className="flex gap-3 items-center">
            <Tag size={16} className="text-indigo-500" />
            <div>
              <span className="font-black uppercase tracking-wider block">Tag recomendada para filtragem (Tiny ERP)</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Ao cadastrar, insira esta tag para ajudar na filtragem interna do ERP.</span>
            </div>
          </div>
          <button
            onClick={copiarTag}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              copiedTag 
                ? "bg-emerald-600 text-white border border-emerald-500" 
                : getTagColor() + " hover:scale-105"
            }`}
          >
            {copiedTag ? "Copiado!" : `Tag: ${getRecomendacaoTag()}`}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <Field label="Produto">
          <div className="relative">
            <select
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled className="text-slate-400">Selecione o produto...</option>
              <option value="Camiseta">Camiseta (Vestuário)</option>
              <option value="Camiseta Polo">Camiseta Polo (Vestuário)</option>
              <option value="Moletom">Moletom (Vestuário)</option>
              <option value="Regata">Regata (Vestuário)</option>
              <option value="Caneca">Caneca</option>
              <option value="Boné">Boné</option>
              <option value="MDF">MDF</option>
              <option value="Mousepad">Mousepad</option>
              <option value="Adesivos">Adesivos</option>
              <option value="Bottons">Bottons</option>
              <option value="Chinelos">Chinelos</option>
              <option value="Bandeiras">Bandeiras</option>
              <option value="Outro">Outro</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </Field>

        <Field label="Marca / Loja">
          <div className="relative">
            <select
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled className="text-slate-400">Selecione a marca...</option>
              <option value="Camisetas Opressoras">Camisetas Opressoras</option>
              <option value="Auriverde">Auriverde</option>
              <option value="Timeline">Timeline</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </Field>
      </div>

      <Field label="Estampa / Design">
        <input
          type="text"
          value={estampa}
          onChange={(e) => setEstampa(e.target.value)}
          placeholder="Ex: Bolsonaro Patriota 2026"
          className={inputClass}
        />
      </Field>

      <Field label="Material">
        <ChipGroup
          options={["PV Premium", "Algodão", "Dry Fit", "Malha PV", "Cerâmica", "Poliester"]}
          selected={material}
          onChange={setMaterial}
        />
      </Field>

      <Field label="Cor(es) (Nomes no Masculino - Ex: Branco, Preto)">
        <ChipGroup
          options={["Branco", "Preto", "Verde", "Azul", "Amarelo", "Vermelho", "Cinza", "Marinho", "Bicolor"]}
          selected={cores}
          onChange={setCores}
        />
        
        {/* Custom Color Input for compliance validation */}
        <div className="flex gap-2.5 mt-3 max-w-sm">
          <input
            type="text"
            placeholder="Adicionar outra cor (ex: cáqui, oliva)"
            value={customCor}
            onChange={(e) => setCustomCor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                adicionarCorPersonalizada();
              }
            }}
            className={`${inputClass} !py-2 !px-3.5 text-xs`}
          />
          <button
            onClick={adicionarCorPersonalizada}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
          >
            Adicionar
          </button>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug block mt-1">
          * O guia exige nomes de cores no masculino (Ex: use "Preto" ou "Branco", nunca "Preta" ou "Branca"). O sistema corrigirá automaticamente entradas femininas.
        </span>
      </Field>

      <Field label="Tamanho(s) Padronizado(s) (Tiny ERP)">
        <ChipGroup
          options={["P", "M", "G", "GG", "XG", "EXG", "Único"]}
          selected={tamanhos}
          onChange={setTamanhos}
        />
      </Field>

      <Field label="Observações adicionais">
        <textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Ex: produto comemorativo, edição limitada, coleção Copa..."
          className={`${inputClass} resize-y min-h-[100px]`}
        />
      </Field>

      {/* Vestuary Clause Active Banner */}
      {isVestuario && (
        <div className="mb-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs flex gap-3 items-center shadow-sm">
          <Sparkles size={16} className="text-emerald-500 shrink-0" />
          <div className="leading-relaxed">
            <span className="font-black uppercase tracking-wider block">Cláusula de Vestuário Ativa</span>
            Aviso de medidas obrigatório será adicionado automaticamente ao fim da descrição: 
            <strong className="block dark:text-white mt-0.5">"Recomendamos verificar atentamente as medidas do produto antes da compra para garantir o tamanho ideal."</strong>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mt-8">
        <button
          onClick={gerar}
          className="flex-1 flex justify-center items-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
        >
          <FileText size={18} />
          Gerar Formato ERP
        </button>
        <button
          onClick={copiar}
          disabled={output.startsWith("Preencha") || output.startsWith("⚠")}
          className="flex-1 flex justify-center items-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Copy size={18} />
          {copyLabel}
        </button>
        <button
          onClick={limpar}
          className="px-6 py-4 flex justify-center items-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
        >
          <Eraser size={18} />
          Limpar
        </button>
      </div>

      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold mb-1">↳</span>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Resultado Formatado para o Gemini ERP
          </p>
        </div>
        <div className="relative group">
          <pre className="bg-slate-100 dark:bg-black/50 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-6 py-5 text-[15px] leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200 min-h-[140px] font-mono shadow-inner overflow-x-auto">
            {output}
          </pre>
          {(output !== 'Preencha os campos acima e clique em "Gerar formato ERP".' && !output.startsWith("⚠")) && (
             <button onClick={copiar} title="Copiar Resultado" className="absolute top-4 right-4 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
               <Copy size={16} />
             </button>
          )}
        </div>
      </div>
    </div>
  );
}
