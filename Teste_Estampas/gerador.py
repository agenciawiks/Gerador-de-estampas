from pathlib import Path
from PIL import Image, ImageTk
import tkinter as tk
from tkinter import filedialog, messagebox


EXTENSOES_IMAGEM = {".png", ".jpg", ".jpeg", ".webp"}
COR_VERDE = "#008237"
COR_AMARELA = "#ecbc2f"


def listar_imagens(pasta):
    caminho = Path(pasta)
    if not caminho.exists():
        return []
    return sorted([arquivo for arquivo in caminho.iterdir() if arquivo.suffix.lower() in EXTENSOES_IMAGEM])


def colorir_estampa(estampa, cor_hex):
    alpha = estampa.getchannel("A")
    estampa_colorida = Image.new("RGBA", estampa.size, color=cor_hex)
    estampa_colorida.putalpha(alpha)
    return estampa_colorida


def aplicar_estampa(caminho_fundo, caminho_estampa, caminho_saida, posicao, escala_percentual, cor_hex):
    fundo = Image.open(caminho_fundo).convert("RGBA")
    estampa = Image.open(caminho_estampa).convert("RGBA")
    estampa = colorir_estampa(estampa, cor_hex)

    fator = max(0.05, escala_percentual / 100.0)
    largura = max(1, int(round(estampa.width * fator)))
    altura = max(1, int(round(estampa.height * fator)))
    estampa_redimensionada = estampa.resize((largura, altura), Image.Resampling.LANCZOS)

    x = max(0, min(posicao[0], fundo.width - estampa_redimensionada.width))
    y = max(0, min(posicao[1], fundo.height - estampa_redimensionada.height))
    fundo.paste(estampa_redimensionada, (x, y), estampa_redimensionada)

    sufixo = Path(caminho_saida).suffix.lower()
    if sufixo in {".jpg", ".jpeg"}:
        fundo.convert("RGB").save(caminho_saida)
    else:
        fundo.save(caminho_saida)


class AppEstampas:
    def __init__(self, root):
        self.root = root
        self.root.title("Gerador de Estampas - Editor Visual")

        self.pasta_estampas = ""
        self.pasta_fundos = ""
        self.pasta_saida = ""

        self.estampas = []
        self.fundos = []
        self.cor_por_fundo = {}

        self.escala_fundo_preview = 1.0
        self.pos_x = 0
        self.pos_y = 0
        self.arrastando = False
        self.offset_drag_x = 0
        self.offset_drag_y = 0

        self.img_fundo_tk = None
        self.img_estampa_tk = None
        self.estampa_w_original = 0
        self.estampa_h_original = 0
        self.estampa_w_preview = 0
        self.estampa_h_preview = 0

        self._montar_ui()

    def _montar_ui(self):
        topo = tk.Frame(self.root)
        topo.pack(fill="x", padx=10, pady=8)

        self.lbl_estampas = tk.Label(topo, text="Pasta de estampas: não selecionada", anchor="w")
        self.lbl_estampas.pack(fill="x")
        tk.Button(topo, text="Selecionar pasta de estampas", command=self.selecionar_pasta_estampas).pack(
            anchor="w", pady=(2, 8)
        )

        self.lbl_fundos = tk.Label(topo, text="Pasta de fundos: não selecionada", anchor="w")
        self.lbl_fundos.pack(fill="x")
        tk.Button(topo, text="Selecionar pasta de fundos", command=self.selecionar_pasta_fundos).pack(
            anchor="w", pady=(2, 8)
        )

        self.lbl_saida = tk.Label(topo, text="Pasta de saída: não selecionada", anchor="w")
        self.lbl_saida.pack(fill="x")
        tk.Button(topo, text="Selecionar pasta de saída", command=self.selecionar_pasta_saida).pack(
            anchor="w", pady=(2, 4)
        )

        meio = tk.Frame(self.root)
        meio.pack(fill="both", expand=True, padx=10, pady=6)

        esquerda = tk.Frame(meio)
        esquerda.pack(side="left", fill="y")

        tk.Label(esquerda, text="Estampas").pack(anchor="w")
        self.lista_estampas = tk.Listbox(esquerda, width=34, height=10, exportselection=False)
        self.lista_estampas.pack(pady=(2, 8))
        self.lista_estampas.bind("<<ListboxSelect>>", self.ao_mudar_estampa)

        tk.Label(esquerda, text="Fundos (selecione um ou mais)").pack(anchor="w")
        self.lista_fundos = tk.Listbox(esquerda, width=34, height=12, selectmode=tk.EXTENDED, exportselection=False)
        self.lista_fundos.pack(pady=(2, 8))
        self.lista_fundos.bind("<<ListboxSelect>>", self.ao_mudar_fundo)

        cores_frame = tk.Frame(esquerda)
        cores_frame.pack(fill="x", pady=(0, 8))
        tk.Label(cores_frame, text="Cor da estampa para fundo(s) selecionado(s)").pack(anchor="w")
        tk.Button(
            cores_frame, text="Aplicar VERDE", command=lambda: self.definir_cor_para_fundos_selecionados("verde")
        ).pack(fill="x", pady=(2, 2))
        tk.Button(
            cores_frame, text="Aplicar AMARELO", command=lambda: self.definir_cor_para_fundos_selecionados("amarelo")
        ).pack(fill="x")

        controle = tk.Frame(esquerda)
        controle.pack(fill="x", pady=(4, 0))
        tk.Label(controle, text="Escala da estampa (%)").pack(anchor="w")
        self.escala_var = tk.DoubleVar(value=100.0)
        self.slider_escala = tk.Scale(
            controle,
            from_=10,
            to=250,
            orient="horizontal",
            resolution=1,
            variable=self.escala_var,
            command=lambda _valor: self.renderizar_preview(),
        )
        self.slider_escala.pack(fill="x")
        tk.Button(controle, text="Centralizar estampa", command=self.centralizar_estampa).pack(fill="x", pady=(6, 0))

        direita = tk.Frame(meio)
        direita.pack(side="left", fill="both", expand=True, padx=(12, 0))

        self.canvas = tk.Canvas(direita, width=900, height=650, bg="#f0f0f0", highlightthickness=1)
        self.canvas.pack(fill="both", expand=True)
        self.canvas.bind("<Button-1>", self.iniciar_arraste)
        self.canvas.bind("<B1-Motion>", self.arrastar_estampa)
        self.canvas.bind("<ButtonRelease-1>", self.finalizar_arraste)

        rodape = tk.Frame(self.root)
        rodape.pack(fill="x", padx=10, pady=(4, 10))

        self.lbl_status = tk.Label(rodape, text="Selecione as pastas para começar.", anchor="w")
        self.lbl_status.pack(fill="x")

        botoes = tk.Frame(rodape)
        botoes.pack(fill="x", pady=(6, 0))
        tk.Button(botoes, text="Gerar imagens", command=self.gerar_imagens, width=20).pack(side="left")

    def selecionar_pasta_estampas(self):
        pasta = filedialog.askdirectory(title="Selecione a pasta de estampas")
        if not pasta:
            return
        self.pasta_estampas = pasta
        self.lbl_estampas.config(text=f"Pasta de estampas: {pasta}")
        self.estampas = listar_imagens(pasta)
        self.lista_estampas.delete(0, tk.END)
        for arquivo in self.estampas:
            self.lista_estampas.insert(tk.END, arquivo.name)
        if self.estampas:
            self.lista_estampas.selection_set(0)
        self.renderizar_preview()

    def selecionar_pasta_fundos(self):
        pasta = filedialog.askdirectory(title="Selecione a pasta de fundos")
        if not pasta:
            return
        self.pasta_fundos = pasta
        self.lbl_fundos.config(text=f"Pasta de fundos: {pasta}")
        self.fundos = listar_imagens(pasta)
        self.cor_por_fundo = {str(fundo): "verde" for fundo in self.fundos}
        self.lista_fundos.delete(0, tk.END)
        self.atualizar_lista_fundos()
        if self.fundos:
            self.lista_fundos.selection_set(0)
        self.renderizar_preview()

    def selecionar_pasta_saida(self):
        pasta = filedialog.askdirectory(title="Selecione a pasta de saída")
        if not pasta:
            return
        self.pasta_saida = pasta
        self.lbl_saida.config(text=f"Pasta de saída: {pasta}")

    def obter_estampa_selecionada(self):
        selecionado = self.lista_estampas.curselection()
        if not selecionado:
            return None
        return self.estampas[selecionado[0]]

    def obter_fundo_para_preview(self):
        selecionados = self.lista_fundos.curselection()
        if not selecionados:
            return None
        return self.fundos[selecionados[0]]

    def obter_fundos_selecionados(self):
        selecionados = self.lista_fundos.curselection()
        if not selecionados:
            return []
        return [self.fundos[i] for i in selecionados]

    def atualizar_lista_fundos(self):
        selecionados_antes = set(self.lista_fundos.curselection())
        self.lista_fundos.delete(0, tk.END)
        for i, arquivo in enumerate(self.fundos):
            cor = self.cor_por_fundo.get(str(arquivo), "verde").upper()
            self.lista_fundos.insert(tk.END, f"[{cor}] {arquivo.name}")
            if i in selecionados_antes:
                self.lista_fundos.selection_set(i)

    def obter_cor_fundo(self, fundo_path):
        return self.cor_por_fundo.get(str(fundo_path), "verde")

    def obter_cor_hex_fundo(self, fundo_path):
        return COR_VERDE if self.obter_cor_fundo(fundo_path) == "verde" else COR_AMARELA

    def definir_cor_para_fundos_selecionados(self, cor):
        fundos = self.obter_fundos_selecionados()
        if not fundos:
            messagebox.showwarning("Atenção", "Selecione ao menos um fundo para definir a cor.")
            return
        for fundo in fundos:
            self.cor_por_fundo[str(fundo)] = cor
        self.atualizar_lista_fundos()
        self.renderizar_preview()

    def ao_mudar_estampa(self, _event=None):
        self.pos_x = 0
        self.pos_y = 0
        self.renderizar_preview()

    def ao_mudar_fundo(self, _event=None):
        self.pos_x = 0
        self.pos_y = 0
        self.renderizar_preview()

    def centralizar_estampa(self):
        fundo_path = self.obter_fundo_para_preview()
        estampa_path = self.obter_estampa_selecionada()
        if not fundo_path or not estampa_path:
            return
        fundo = Image.open(fundo_path).convert("RGBA")
        estampa = Image.open(estampa_path).convert("RGBA")
        estampa = colorir_estampa(estampa, self.obter_cor_hex_fundo(fundo_path))
        fator = max(0.05, self.escala_var.get() / 100.0)
        largura = max(1, int(round(estampa.width * fator)))
        altura = max(1, int(round(estampa.height * fator)))
        self.pos_x = max(0, (fundo.width - largura) // 2)
        self.pos_y = max(0, (fundo.height - altura) // 2)
        self.renderizar_preview()

    def renderizar_preview(self):
        fundo_path = self.obter_fundo_para_preview()
        estampa_path = self.obter_estampa_selecionada()

        self.canvas.delete("all")
        if not fundo_path or not estampa_path:
            self.lbl_status.config(text="Selecione ao menos 1 estampa e 1 fundo para visualizar.")
            return

        fundo = Image.open(fundo_path).convert("RGBA")
        estampa = Image.open(estampa_path).convert("RGBA")

        canvas_w = max(1, self.canvas.winfo_width())
        canvas_h = max(1, self.canvas.winfo_height())
        self.escala_fundo_preview = min(canvas_w / fundo.width, canvas_h / fundo.height, 1.0)

        fundo_preview = fundo.resize(
            (int(fundo.width * self.escala_fundo_preview), int(fundo.height * self.escala_fundo_preview)),
            Image.Resampling.LANCZOS,
        )

        fator = max(0.05, self.escala_var.get() / 100.0)
        self.estampa_w_original = max(1, int(round(estampa.width * fator)))
        self.estampa_h_original = max(1, int(round(estampa.height * fator)))
        estampa_redimensionada = estampa.resize(
            (self.estampa_w_original, self.estampa_h_original), Image.Resampling.LANCZOS
        )

        self.estampa_w_preview = max(1, int(round(self.estampa_w_original * self.escala_fundo_preview)))
        self.estampa_h_preview = max(1, int(round(self.estampa_h_original * self.escala_fundo_preview)))
        estampa_preview = estampa_redimensionada.resize(
            (self.estampa_w_preview, self.estampa_h_preview), Image.Resampling.LANCZOS
        )

        max_x = max(0, fundo.width - self.estampa_w_original)
        max_y = max(0, fundo.height - self.estampa_h_original)
        self.pos_x = max(0, min(self.pos_x, max_x))
        self.pos_y = max(0, min(self.pos_y, max_y))

        px = int(round(self.pos_x * self.escala_fundo_preview))
        py = int(round(self.pos_y * self.escala_fundo_preview))

        self.img_fundo_tk = ImageTk.PhotoImage(fundo_preview)
        self.img_estampa_tk = ImageTk.PhotoImage(estampa_preview)

        self.canvas.create_image(0, 0, anchor="nw", image=self.img_fundo_tk, tags="fundo")
        self.canvas.create_image(px, py, anchor="nw", image=self.img_estampa_tk, tags="estampa")

        self.lbl_status.config(
            text=(
                f"Posição: ({self.pos_x}, {self.pos_y}) | Escala: {self.escala_var.get():.0f}% | "
                f"Cor: {self.obter_cor_fundo(fundo_path).upper()}"
            )
        )

    def iniciar_arraste(self, event):
        bbox = self.canvas.bbox("estampa")
        if not bbox:
            return
        x1, y1, x2, y2 = bbox
        if x1 <= event.x <= x2 and y1 <= event.y <= y2:
            self.arrastando = True
            self.offset_drag_x = event.x - x1
            self.offset_drag_y = event.y - y1

    def arrastar_estampa(self, event):
        if not self.arrastando:
            return
        fundo_path = self.obter_fundo_para_preview()
        if not fundo_path:
            return
        fundo = Image.open(fundo_path).convert("RGBA")

        novo_x_preview = event.x - self.offset_drag_x
        novo_y_preview = event.y - self.offset_drag_y

        max_x_preview = max(0, int(round((fundo.width - self.estampa_w_original) * self.escala_fundo_preview)))
        max_y_preview = max(0, int(round((fundo.height - self.estampa_h_original) * self.escala_fundo_preview)))
        novo_x_preview = max(0, min(novo_x_preview, max_x_preview))
        novo_y_preview = max(0, min(novo_y_preview, max_y_preview))

        self.canvas.coords("estampa", novo_x_preview, novo_y_preview)
        self.pos_x = int(round(novo_x_preview / self.escala_fundo_preview))
        self.pos_y = int(round(novo_y_preview / self.escala_fundo_preview))

        self.lbl_status.config(
            text=(
                f"Posição: ({self.pos_x}, {self.pos_y}) | Escala: {self.escala_var.get():.0f}% | "
                f"Cor: {self.obter_cor_fundo(fundo_path).upper()}"
            )
        )

    def finalizar_arraste(self, _event):
        self.arrastando = False

    def gerar_imagens(self):
        estampa = self.obter_estampa_selecionada()
        fundos = self.obter_fundos_selecionados()

        if not estampa:
            messagebox.showwarning("Atenção", "Selecione uma estampa.")
            return
        if not fundos:
            messagebox.showwarning("Atenção", "Selecione ao menos um fundo.")
            return
        if not self.pasta_saida:
            messagebox.showwarning("Atenção", "Selecione a pasta de saída.")
            return

        Path(self.pasta_saida).mkdir(parents=True, exist_ok=True)
        total = 0
        for fundo in fundos:
            saida = Path(self.pasta_saida) / f"{fundo.stem}__{estampa.stem}{fundo.suffix.lower()}"
            aplicar_estampa(
                caminho_fundo=str(fundo),
                caminho_estampa=str(estampa),
                caminho_saida=str(saida),
                posicao=(self.pos_x, self.pos_y),
                escala_percentual=self.escala_var.get(),
                cor_hex=self.obter_cor_hex_fundo(fundo),
            )
            total += 1

        messagebox.showinfo("Concluído", f"{total} imagem(ns) gerada(s) em:\n{self.pasta_saida}")


if __name__ == "__main__":
    root = tk.Tk()
    app = AppEstampas(root)
    root.minsize(1100, 760)
    root.mainloop()