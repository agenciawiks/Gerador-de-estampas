# 👕 Camisetas Opressoras - Frontend Mockup Studio (Vite + React)

A interface do usuário (UI) para o **Gerador de Mockups** da Camisetas Opressoras. 

Online em: [gerador-de-estampas.vercel.app](https://gerador-de-estampas.vercel.app)

## ⚡ Desenvolvimento

Para rodar localmente e modificar a interface:

1.  **Acesse a pasta:**
    ```bash
    cd frontend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie o servidor localmente:**
    ```bash
    npm run dev
    ```

## 🛠️ Tecnologias Principais

*   **Tailwind CSS 4** - Estilização dinâmica por meio de `@theme` e `@utility`.
*   **React Draggable** - Para o controle de posições das estampas.
*   **JSZip & FileSaver** - Para geração de arquivos em lote sem API no servidor.
*   **LocalForage** - Persistência das imagens enviadas no IndexedDB do navegador.

## 📁 Estrutura de Arquivos

*   `src/App.jsx` - Arquivo principal contendo a lógica central, sistema de toasts e UI.
*   `src/index.css` - Estilos globais e componentes personalizados do sistema.
*   `public/icons.svg` - Conjunto de ícones SVGs compactados.

---
*Veja o [README principal](../README.md) na raiz do projeto para mais informações sobre o funcionamento do sistema completo.*
