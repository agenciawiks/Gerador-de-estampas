import os
from pathlib import Path
from PIL import Image
import io

EXTENSOES_IMAGEM = {".png", ".jpg", ".jpeg", ".webp"}

def listar_imagens(pasta):
    caminho = Path(pasta)
    if not caminho.exists():
        return []
    return sorted([
        {"nome": arquivo.name, "caminho": str(arquivo.resolve())}
        for arquivo in caminho.iterdir() 
        if arquivo.suffix.lower() in EXTENSOES_IMAGEM
    ], key=lambda x: x["nome"])


def colorir_estampa(estampa, cor_hex):
    if not cor_hex or str(cor_hex).lower() in ["nenhuma", "none", "", "original"]:
        return estampa
    
    # Adicionando tratamento caso a imagem não tenha canal Alpha
    if estampa.mode != "RGBA":
        estampa = estampa.convert("RGBA")
        
    alpha = estampa.getchannel("A")
    estampa_colorida = Image.new("RGBA", estampa.size, color=cor_hex)
    estampa_colorida.putalpha(alpha)
    return estampa_colorida


def aplicar_estampa(caminho_fundo, caminho_estampa, posicao, escala_percentual, cor_hex):
    try:
        fundo = Image.open(caminho_fundo).convert("RGBA")
        estampa = Image.open(caminho_estampa).convert("RGBA")
        
        estampa = colorir_estampa(estampa, cor_hex)

        fator = max(0.05, escala_percentual / 100.0)
        largura = max(1, int(round(estampa.width * fator)))
        altura = max(1, int(round(estampa.height * fator)))
        
        estampa_redimensionada = estampa.resize((largura, altura), Image.Resampling.LANCZOS)

        x, y = int(posicao[0]), int(posicao[1])
        # x = max(0, min(int(posicao[0]), fundo.width - largura))
        # y = max(0, min(int(posicao[1]), fundo.height - altura))
        
        fundo.paste(estampa_redimensionada, (x, y), estampa_redimensionada)
        return fundo
    except Exception as e:
        print(f"Erro em aplicar_estampa: {e}")
        return None

def gerar_preview_bytes(fundo_path, estampa_path, pos_x, pos_y, escala, cor_hex, preview_width=800):
    imagem = aplicar_estampa(fundo_path, estampa_path, (pos_x, pos_y), escala, cor_hex)
    if not imagem:
        return None
        
    # Resize to preview dimension to save bandwidth
    if imagem.width > preview_width:
        ratio = preview_width / imagem.width
        imagem = imagem.resize((int(imagem.width * ratio), int(imagem.height * ratio)), Image.Resampling.LANCZOS)
        
    img_byte_arr = io.BytesIO()
    imagem.save(img_byte_arr, format='WEBP', quality=85)
    img_byte_arr.seek(0)
    return img_byte_arr

def gerar_imagem_final(caminho_fundo, caminho_estampa, pos_x, pos_y, escala, cor_hex, caminho_saida):
    imagem = aplicar_estampa(caminho_fundo, caminho_estampa, (pos_x, pos_y), escala, cor_hex)
    if not imagem:
        return False
        
    Path(caminho_saida).parent.mkdir(parents=True, exist_ok=True)
    sufixo = Path(caminho_saida).suffix.lower()
    if sufixo in {".jpg", ".jpeg"}:
        imagem.convert("RGB").save(caminho_saida, quality=95)
    else:
        imagem.save(caminho_saida)
    
    return True
