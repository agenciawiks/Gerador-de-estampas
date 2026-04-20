import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  genero: string;
  idade: string;
  etnia: string;
  porte: string;
  cabeloCor: string;
  cabeloEstilo: string;
  detalhesExtra: string;
  roupaTipo: string;
  roupaCor: string;
  roupaDesc: string;
  expressao: string;
  postura: string;
  fundo: string;
  enquadramento: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const GENEROS = [
  { label: "Homem", value: "homem" },
  { label: "Mulher", value: "mulher" },
  { label: "Menino", value: "criança menino" },
  { label: "Menina", value: "criança menina" },
];

const EXPRESSOES = [
  { label: "Neutra", value: "expressão neutra e profissional" },
  { label: "Sorriso leve", value: "sorriso leve e amigável" },
  { label: "Sorriso amplo", value: "sorriso amplo e aberto" },
  { label: "Séria", value: "expressão séria" },
];

const POSTURAS = [
  { label: "Frente", value: "postura ereta, olhando para frente" },
  { label: "De lado", value: "levemente inclinado para o lado" },
  { label: "Relaxada", value: "postura relaxada, casual" },
];

const FUNDOS = [
  { label: "Branco puro", value: "fundo branco puro, sem sombras" },
  { label: "Branco suave", value: "fundo branco acinzentado, levemente gradiente" },
  { label: "Transparente", value: "fundo transparente (sem fundo)" },
  { label: "Cinza neutro", value: "fundo cinza claro neutro" },
];

const ENQUADRAMENTOS = [
  { label: "Corpo inteiro", value: "retrato corpo inteiro, da cabeça aos pés" },
  { label: "Meio corpo", value: "retrato até a cintura" },
  { label: "Close rosto", value: "retrato close no rosto e ombros" },
];

const ETNIAS = [
  { label: "— selecione —", value: "" },
  { label: "Branca / Europeia", value: "pele clara, feições europeias" },
  { label: "Latina / Morena clara", value: "pele morena clara, feições latinas" },
  { label: "Afro-latina / Morena", value: "pele morena, feições afro-latinas" },
  { label: "Negra / Africana", value: "pele negra, feições africanas" },
  { label: "Asiática", value: "pele asiática, feições asiáticas" },
  { label: "Oriente Médio", value: "pele mediterrânea, feições do oriente médio" },
  { label: "Indígena", value: "pele indígena, feições nativas" },
];

const PORTES = [
  { label: "— selecione —", value: "" },
  { label: "Baixo / pequeno", value: "baixo porte, corpo pequeno" },
  { label: "Médio", value: "porte médio, altura mediana" },
  { label: "Alto e esguio", value: "alto, corpo esguio" },
  { label: "Alto e atlético", value: "alto, corpo atlético" },
  { label: "Robusto / forte", value: "corpo robusto e forte" },
  { label: "Plus size", value: "corpo plus size" },
];

const CABELO_COR = [
  { label: "— selecione —", value: "" },
  { label: "Preto", value: "cabelo preto" },
  { label: "Castanho escuro", value: "cabelo castanho escuro" },
  { label: "Castanho claro", value: "cabelo castanho claro" },
  { label: "Loiro", value: "cabelo loiro" },
  { label: "Ruivo", value: "cabelo ruivo" },
  { label: "Grisalho", value: "cabelo grisalho" },
  { label: "Branco", value: "cabelo branco" },
  { label: "Tingido / colorido", value: "cabelo tingido colorido" },
];

const CABELO_ESTILO = [
  { label: "— selecione —", value: "" },
  { label: "Curto", value: "cabelo curto" },
  { label: "Médio", value: "cabelo médio" },
  { label: "Longo", value: "cabelo longo" },
  { label: "Liso", value: "cabelo liso" },
  { label: "Ondulado", value: "cabelo ondulado" },
  { label: "Cacheado", value: "cabelo cacheado" },
  { label: "Crespo", value: "cabelo crespo" },
  { label: "Careca", value: "careca" },
  { label: "Coque", value: "cabelo preso em coque" },
  { label: "Rabo de cavalo", value: "rabo de cavalo" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPrompt(f: FormState): string {
  const parts: string[] = [];

  let pessoa = `Foto fotorrealista de ${f.genero}`;
  if (f.idade) pessoa += `, de aproximadamente ${f.idade}`;
  if (f.etnia) pessoa += `, ${f.etnia}`;
  if (f.porte) pessoa += `, ${f.porte}`;
  parts.push(pessoa);

  const cabelo = [f.cabeloCor, f.cabeloEstilo].filter(Boolean).join(", ");
  if (cabelo) parts.push(`com ${cabelo}`);
  if (f.detalhesExtra) parts.push(f.detalhesExtra);

  const roupa = f.roupaDesc
    ? `vestindo ${f.roupaDesc}`
    : [f.roupaCor, f.roupaTipo].filter(Boolean).join(" ")
    ? `vestindo ${[f.roupaCor, f.roupaTipo].filter(Boolean).join(" ")}`
    : "";
  if (roupa) parts.push(roupa);

  parts.push(`${f.expressao}, ${f.postura}`);
  parts.push(f.enquadramento);
  parts.push(f.fundo);
  parts.push("iluminação de estúdio suave e uniforme");
  parts.push("estilo de foto de catálogo profissional, alta qualidade, realista");
  parts.push(
    "use a imagem de referência como base para o estilo de roupa, postura e enquadramento, variando apenas as características físicas descritas acima"
  );

  return parts.join(", ") + ".";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ChipGroupProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
}

function ChipGroup({ options, value, onChange }: ChipGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold cursor-pointer select-none transition-all shadow-sm ${
            value === opt.value
              ? "bg-indigo-600 border border-indigo-500 text-white shadow-indigo-500/30"
              : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none m-0">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

const selectClass =
  "w-full px-4 py-3 text-sm lg:text-base font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm appearance-none cursor-pointer";

const inputClass =
  "w-full px-4 py-3 text-sm lg:text-base font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm";

const labelClass = "text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GeminiPromptGenerator() {
  const [form, setForm] = useState<FormState>({
    genero: "homem",
    idade: "",
    etnia: "",
    porte: "",
    cabeloCor: "",
    cabeloEstilo: "",
    detalhesExtra: "",
    roupaTipo: "",
    roupaCor: "",
    roupaDesc: "",
    expressao: "expressão neutra e profissional",
    postura: "postura ereta, olhando para frente",
    fundo: "fundo branco puro, sem sombras",
    enquadramento: "retrato corpo inteiro, da cabeça aos pés",
  });

  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const set = (key: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleGenerate = () => setPrompt(buildPrompt(form));

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="max-w-3xl w-full mx-auto py-10 px-6 my-4 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-5 mb-8">
          <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
              Gerador de Prompt — Gemini
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Preencha as características e gere um prompt para variação de modelo com foto de referência.
            </p>
          </div>
        </div>

        {/* Gênero */}
        <Section title="Gênero">
          <ChipGroup options={GENEROS} value={form.genero} onChange={set("genero")} />
        </Section>

        {/* Aparência */}
        <Section title="Aparência física">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelClass}>Idade aproximada</label>
              <input
                className={inputClass}
                type="text"
                placeholder="ex: 30 anos, jovem, idoso..."
                value={form.idade}
                onChange={(e) => set("idade")(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Etnia / Tom de pele</label>
              <select
                className={selectClass}
                value={form.etnia}
                onChange={(e) => set("etnia")(e.target.value)}
              >
                {ETNIAS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className={labelClass}>Altura / Porte</label>
              <select
                className={selectClass}
                value={form.porte}
                onChange={(e) => set("porte")(e.target.value)}
              >
                {PORTES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Cabelo (cor)</label>
              <select
                className={selectClass}
                value={form.cabeloCor}
                onChange={(e) => set("cabeloCor")(e.target.value)}
              >
                {CABELO_COR.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Cabelo (estilo)</label>
              <select
                className={selectClass}
                value={form.cabeloEstilo}
                onChange={(e) => set("cabeloEstilo")(e.target.value)}
              >
                {CABELO_ESTILO.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Detalhes adicionais (barba, óculos, sardas, etc.)
            </label>
            <input
              className={inputClass}
              type="text"
              placeholder="ex: barba curta, óculos redondos, sardas..."
              value={form.detalhesExtra}
              onChange={(e) => set("detalhesExtra")(e.target.value)}
            />
          </div>
        </Section>

        {/* Roupa */}
        <Section title="Roupa / Uniforme">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelClass}>Tipo de roupa</label>
              <input
                className={inputClass}
                type="text"
                placeholder="ex: uniforme azul, avental branco..."
                value={form.roupaTipo}
                onChange={(e) => set("roupaTipo")(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Cor principal</label>
              <input
                className={inputClass}
                type="text"
                placeholder="ex: azul marinho, branco..."
                value={form.roupaCor}
                onChange={(e) => set("roupaCor")(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>
              Descrição da roupa da foto de referência
            </label>
            <textarea
              className={`${inputClass} resize-y min-h-[72px] leading-relaxed`}
              placeholder="Descreva a roupa do modelo base que será mantida em todas as variações..."
              value={form.roupaDesc}
              onChange={(e) => set("roupaDesc")(e.target.value)}
            />
          </div>
        </Section>

        {/* Expressão e postura */}
        <Section title="Expressão e postura">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={`${labelClass} mb-2`}>Expressão facial</label>
              <ChipGroup
                options={EXPRESSOES}
                value={form.expressao}
                onChange={set("expressao")}
              />
            </div>
            <div>
              <label className={`${labelClass} mb-2`}>Postura</label>
              <ChipGroup
                options={POSTURAS}
                value={form.postura}
                onChange={set("postura")}
              />
            </div>
          </div>
        </Section>

        {/* Fundo e enquadramento */}
        <Section title="Fundo e enquadramento">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={`${labelClass} mb-2`}>Tipo de fundo</label>
              <ChipGroup
                options={FUNDOS}
                value={form.fundo}
                onChange={set("fundo")}
              />
            </div>
            <div>
              <label className={`${labelClass} mb-2`}>Enquadramento</label>
              <ChipGroup
                options={ENQUADRAMENTOS}
                value={form.enquadramento}
                onChange={set("enquadramento")}
              />
            </div>
          </div>
        </Section>

        {/* Botão gerar */}
        <button
          onClick={handleGenerate}
          className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/30 mt-8 mb-4"
        >
          Gerar prompt para o Gemini
        </button>

        {/* Output */}
        {prompt && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold mb-1">↳</span>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Prompt gerado
              </p>
            </div>
            <div className="relative group">
              <p className="bg-slate-100 dark:bg-black/50 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-6 py-5 text-[15px] leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200 min-h-[140px] font-mono shadow-inner overflow-x-auto">
                {prompt}
              </p>
              <button
                onClick={handleCopy}
                title="Copiar Prompt"
                className={`absolute top-4 right-4 px-4 py-2 flex items-center justify-center gap-2 text-white text-xs font-bold rounded-lg shadow-md transition-all ${
                  copied 
                    ? "bg-emerald-600 shadow-emerald-600/30 opacity-100" 
                    : "bg-indigo-600 hover:bg-indigo-500 opacity-0 group-hover:opacity-100"
                }`}
              >
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
