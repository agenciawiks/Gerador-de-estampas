import os
import zipfile
import io
from pathlib import Path
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS

import image_service

app = Flask(__name__)
# Permitir chamadas do Vite local
CORS(app)

# Pastas de configuração baseadas no repositório
BASE_DIR = Path(__file__).resolve().parent.parent
PASTAS = {
    "estampas": BASE_DIR / "estampas",
    "fundos": BASE_DIR / "fundos",
    "saida": BASE_DIR / "out",
}

for pasta in PASTAS.values():
    pasta.mkdir(parents=True, exist_ok=True)


@app.route('/api/fundos', methods=['GET'])
def get_fundos():
    itens = image_service.listar_imagens(PASTAS['fundos'])
    return jsonify(itens)

@app.route('/api/estampas', methods=['GET'])
def get_estampas():
    itens = image_service.listar_imagens(PASTAS['estampas'])
    return jsonify(itens)

@app.route('/api/imagem_url', methods=['GET'])
def get_imagem_url():
    caminho = request.args.get('caminho')
    if not caminho or not Path(caminho).exists():
        return jsonify({"error": "Imagem não encontrada"}), 404
    
    path_obj = Path(caminho)
    # Servir o arquivo estático diretamente para renderizar as <img src>
    return send_file(str(path_obj))

@app.route('/api/preview', methods=['POST'])
def preview():
    dados = request.json
    fundo_path = dados.get('fundo_path')
    estampa_path = dados.get('estampa_path')
    pos_x = float(dados.get('pos_x', 0))
    pos_y = float(dados.get('pos_y', 0))
    escala = float(dados.get('escala', 100))
    cor_hex = dados.get('cor_hex', '')

    if not fundo_path or not estampa_path:
        return jsonify({"error": "Faltando caminhos das imagens"}), 400

    img_io = image_service.gerar_preview_bytes(
        fundo_path, estampa_path, pos_x, pos_y, escala, cor_hex
    )

    if not img_io:
        return jsonify({"error": "Erro ao gerar preview"}), 500

    return send_file(img_io, mimetype='image/webp')

@app.route('/api/gerar_lote', methods=['POST'])
def gerar_lote():
    dados = request.json
    tarefas = dados.get('tarefas', [])
    if not tarefas:
        return jsonify({"error": "Nenhuma tarefa enviada"}), 400

    # Cria arquivo ZIP em memória para retornar pro frontend baixar
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        for idx, tarefa in enumerate(tarefas):
            fundo_path = tarefa.get('fundo_path')
            estampa_path = tarefa.get('estampa_path')
            pos_x = float(tarefa.get('pos_x', 0))
            pos_y = float(tarefa.get('pos_y', 0))
            escala = float(tarefa.get('escala', 100))
            cor_hex = tarefa.get('cor_hex', '')
            
            p_fundo = Path(fundo_path)
            p_estampa = Path(estampa_path)
            
            nome_arquivo = f"{p_fundo.stem}_{p_estampa.stem}_{idx}{p_fundo.suffix.lower()}"
            caminho_temp = PASTAS['saida'] / nome_arquivo
            
            sucesso = image_service.gerar_imagem_final(
                fundo_path, estampa_path, pos_x, pos_y, escala, cor_hex, str(caminho_temp)
            )
            
            if sucesso:
                zip_file.write(caminho_temp, nome_arquivo)
                # Opcional: deletar arquivo temporário se não quiser salvar na pasta out
                # os.remove(str(caminho_temp))

    zip_buffer.seek(0)
    return send_file(
        zip_buffer,
        mimetype="application/zip",
        as_attachment=True,
        download_name="estampas_geradas.zip"
    )

if __name__ == '__main__':
    print("Iniciando servidor de Estampas API em http://localhost:5000")
    app.run(debug=True, port=5000)
