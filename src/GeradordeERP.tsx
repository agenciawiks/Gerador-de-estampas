import { useState } from "react";

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
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((opt) => (
        <span
          key={opt}
          onClick={() => toggle(opt)}
          style={{
            padding: "5px 12px",
            borderRadius: 20,
            border: selected.includes(opt)
              ? "1.5px solid #1a73e8"
              : "1px solid #ccc",
            background: selected.includes(opt) ? "#e8f0fe" : "#fff",
            color: selected.includes(opt) ? "#1a73e8" : "#555",
            cursor: "pointer",
            fontSize: 13,
            userSelect: "none",
          }}
        >
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
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
      <label style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>{label}</label>
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
  const [output, setOutput] = useState("Preencha os campos acima e clique em \"Gerar prompt\".");
  const [copyLabel, setCopyLabel] = useState("Copiar");

  const gerar = () => {
    if (!produto || !marca || !estampa) {
      setOutput("⚠ Preencha pelo menos Produto, Marca e Estampa.");
      return;
    }
    const coresStr = cores.length ? cores.join(", ") : "—";
    const tamStr = tamanhos.length ? tamanhos.join(", ") : "—";
    const matStr = material.length ? material.join(", ") : "—";

    let prompt = `# novo produto:\n`;
    prompt += `- produto: ${produto}\n`;
    prompt += `- marca: ${marca}\n`;
    prompt += `- estampa: ${estampa}\n`;
    prompt += `- cor: ${coresStr}\n`;
    prompt += `- tamanhos: ${tamStr}\n`;
    prompt += `- material: ${matStr}\n`;
    if (obs) prompt += `\n# obs:\n${obs}`;

    setOutput(prompt);
  };

  const copiar = () => {
    if (output.startsWith("Preencha") || output.startsWith("⚠")) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopyLabel("Copiado!");
      setTimeout(() => setCopyLabel("Copiar"), 1500);
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
    setOutput("Preencha os campos acima e clique em \"Gerar prompt\".");
  };

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    fontSize: 14,
    border: "1px solid #ccc",
    borderRadius: 6,
  };

  const btnStyle: React.CSSProperties = {
    padding: "7px 16px",
    fontSize: 13,
    border: "1px solid #ccc",
    borderRadius: 6,
    cursor: "pointer",
    background: "#fff",
  };

  return (
    <div style={{ maxWidth: 720, padding: "1rem 0" }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#999",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 12,
        }}
      >
        produto
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Produto">
          <select value={produto} onChange={(e) => setProduto(e.target.value)} style={inputStyle}>
            <option value="">Selecione...</option>
            <option>Camiseta</option>
            <option>Camiseta Polo</option>
            <option>Caneca</option>
            <option>Boné</option>
            <option>Moletom</option>
            <option>Regata</option>
            <option>Outro</option>
          </select>
        </Field>
        <Field label="Marca">
          <select value={marca} onChange={(e) => setMarca(e.target.value)} style={inputStyle}>
            <option value="">Selecione...</option>
            <option>Timeline</option>
            <option>Auriverde</option>
            <option>Camisetas Opressoras</option>
          </select>
        </Field>
      </div>

      <Field label="Estampa">
        <input
          type="text"
          value={estampa}
          onChange={(e) => setEstampa(e.target.value)}
          placeholder="Ex: Palmeiras Campeão 2024"
          style={inputStyle}
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
          options={["Branco", "Preto", "Verde", "Azul", "Amarelo", "Vermelho", "Cinza", "Marinho"]}
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
          style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
        />
      </Field>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={gerar} style={btnStyle}>Gerar prompt</button>
        <button onClick={copiar} style={btnStyle}>{copyLabel}</button>
        <button onClick={limpar} style={btnStyle}>Limpar</button>
      </div>

      <div
        style={{
          borderTop: "1px solid #e0e0e0",
          marginTop: 20,
          paddingTop: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#999",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 10,
          }}
        >
          prompt gerado
        </div>
        <pre
          style={{
            background: "#f5f5f5",
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 13,
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            color: "#222",
            minHeight: 80,
            margin: 0,
            fontFamily: "monospace",
          }}
        >
          {output}
        </pre>
      </div>
    </div>
  );
}
