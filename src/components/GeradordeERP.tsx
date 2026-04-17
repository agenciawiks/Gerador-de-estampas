import { useState } from "react";
import { Copy, FileText, Eraser, CheckCircle2 } from "lucide-react";

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
  const [tamanhos, setTamanhos] = useState<string[]>([]);
  const [obs, setObs] = useState("");
  const [output, setOutput] = useState('Preencha os campos acima e clique em "Gerar formato ERP".');
  const [copyLabel, setCopyLabel] = useState("Copiar Resultado");

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
    if (obs) prompt += `\n# OBSERVAÇÕES:\n${obs}`;

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
    setTamanhos([]);
    setObs("");
    setOutput('Preencha os campos acima e clique em "Gerar formato ERP".');
  };

  const inputClass =
    "w-full px-4 py-3 text-sm lg:text-base font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm";

  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 my-10 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
      
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-5 mb-8">
        <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg">
          <FileText size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Gerador de ERP
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Preencha os detalhes para formatar o cadastro do produto.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <Field label="Produto">
          <div className="relative">
            <select
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled className="text-slate-400">Selecione o produto...</option>
              <option value="Camiseta">Camiseta</option>
              <option value="Camiseta Polo">Camiseta Polo</option>
              <option value="Caneca">Caneca</option>
              <option value="Boné">Boné</option>
              <option value="Moletom">Moletom</option>
              <option value="Regata">Regata</option>
              <option value="Outro">Outro</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </Field>

        <Field label="Marca">
          <div className="relative">
            <select
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled className="text-slate-400">Selecione a marca...</option>
              <option value="Timeline">Timeline</option>
              <option value="Auriverde">Auriverde</option>
              <option value="Camisetas Opressoras">Camisetas Opressoras</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </Field>
      </div>

      <Field label="Estampa">
        <input
          type="text"
          value={estampa}
          onChange={(e) => setEstampa(e.target.value)}
          placeholder="Ex: Palmeiras Campeão 2024"
          className={inputClass}
        />
      </Field>

      <Field label="Material">
        <ChipGroup
          options={["PV Premium", "Cerâmica", "Algodão", "Dry Fit", "Malha PV"]}
          selected={material}
          onChange={setMaterial}
        />
      </Field>

      <Field label="Cor(es)">
        <ChipGroup
          options={["Branco", "Preto", "Verde", "Azul", "Amarelo", "Vermelho", "Cinza", "Marinho", "Bicolor"]}
          selected={cores}
          onChange={setCores}
        />
      </Field>

      <Field label="Tamanho(s)">
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

      <div className="flex flex-wrap gap-4 mt-8">
        <button
          onClick={gerar}
          className="flex-1 flex justify-center items-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/30"
        >
          <FileText size={18} />
          Gerar Formato ERP
        </button>
        <button
          onClick={copiar}
          className="flex-1 flex justify-center items-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/30"
        >
          <Copy size={18} />
          {copyLabel}
        </button>
        <button
          onClick={limpar}
          className="px-6 py-4 flex justify-center items-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-black uppercase tracking-wider rounded-xl transition-all"
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
            Resultado do ERP
          </p>
        </div>
        <div className="relative group">
          <pre className="bg-slate-100 dark:bg-black/50 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-6 py-5 text-[15px] leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200 min-h-[140px] font-mono shadow-inner overflow-x-auto">
            {output}
          </pre>
          {(output !== 'Preencha os campos acima e clique em "Gerar formato ERP".' && !output.startsWith("⚠")) && (
             <button onClick={copiar} title="Copiar Resultado" className="absolute top-4 right-4 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
               <Copy size={16} />
             </button>
          )}
        </div>
      </div>
    </div>
  );
}
