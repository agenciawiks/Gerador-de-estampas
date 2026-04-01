# 👕 Generator Pro - Mockup Studio Web

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

Uma aplicação web profissional e **100% Client-Side** para criação de mockups de produtos (camisetas, brindes, etc) com geração de arquivos em lote. O sistema processa tudo diretamente no navegador do usuário, garantindo privacidade, velocidade e custo zero de servidor.

---

## ✨ Funcionalidades Principais

*   **⚡ Processamento Local (Zero Server):** A manipulação de imagens, troca de cores e geração de arquivos ocorre inteiramente via HTML5 Canvas no navegador.
*   **🖱️ Editor Interativo:** Arraste e solte (Drag & Drop) as estampas sobre os mockups com precisão cirúrgica.
*   **🎨 Colorização Inteligente (Tint):** Altere a cor de logos PNG monocromáticos em tempo real usando seletores HEX ou paletas pré-definidas.
*   **💾 Persistência Local:** Utiliza **IndexedDB** (via LocalForage) para salvar seus uploads de mockups e logos. Seus arquivos permanecem salvos mesmo após fechar o navegador.
*   **📦 Exportação em Lote:** Selecione múltiplos fundos e gere todas as combinações de uma só vez. O sistema cria um arquivo `.zip` processado localmente com JSZip.
*   **🧠 Memória de Configuração:** O sistema lembra a posição, escala e cor personalizada para cada estampa e fundo individualmente.
*   **🌑 Design Premium:** Interface moderna, intuitiva e em Dark Mode construída com TailwindCSS.

---

## 🚀 Como Rodar Localmente

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

1.  **Acesse a pasta do projeto:**
    ```bash
    cd frontend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    O sistema estará disponível em `http://localhost:5173`.

---

## ☁️ Deploy na Vercel

Este projeto foi otimizado para a **Vercel**. Como não possui backend (API), o custo de hospedagem é **zero** no plano hobby.

1.  Conecte seu repositório GitHub à Vercel.
2.  No painel da Vercel, selecione o projeto.
3.  Configure o **Framework Preset** como `Vite`.
4.  O diretório de saída será `dist`.
5.  Clique em **Deploy** e pronto!

---

## 🛠️ Tecnologias Utilizadas

*   [React](https://reactjs.org/) - Framework UI.
*   [Vite](https://vitejs.dev/) - Tooling de build ultra-rápido.
*   [Tailwind CSS](https://tailwindcss.com/) - Estilização moderna.
*   [LocalForage](https://localforage.github.io/localforage/) - Gerenciamento de IndexedDB.
*   [JSZip](https://stuk.github.io/jszip/) e [FileSaver](https://github.com/eligrey/FileSaver.js/) - Geração e download de arquivos ZIP.
*   [React Draggable](https://github.com/react-grid-layout/react-draggable) - Sistema de movimentação de elementos.
*   [Lucide React](https://lucide.dev/) - Pacote de ícones.

---
*Desenvolvido para facilitar a criação de produtos personalizados de forma rápida e segura.*
