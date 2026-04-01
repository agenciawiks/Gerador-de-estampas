# Planejamento de Melhorias - Gerador de Mockups

Este documento estabelece o plano para a implementação das próximas funcionalidades e melhorias de UI/UX no sistema.

## 1. Gerenciamento de Arquivos ✅
- **Botões de Limpeza Explosiva**: Implementado com dois botões distintos por contexto de aba:
  - **Limpar Todos os Mockups**: Remove todos os arquivos da base de "Mockups".
  - **Limpar Todos os Logos (PNGs)**: Remove todos os arquivos da base de "Logos".
  - **Modal de Confirmação Customizado**: Substituiu o `window.confirm` nativo por um modal premium com animação de entrada, ícone de alerta, e botões "Cancelar" / "Confirmar".

## 2. Controle de Escala e Precisão ✅
- **Input Numérico Aprimorado**: Campo maior (w-12), fonte maior (text-[13px]), com limites de segurança (5%–500%).
- **Botões de Escala Rápida**: Presets **50%, 100%, 150%, 200%** com highlight visual na preset ativa.
- **Slider aprimorado**: `accent-green-500`, step=1, max=300.

## 3. Melhorias Úteis de UX (Adicionais) ✅

### A. Seleção em Lote Inteligente ✅
- Botões **"Selecionar Todos"** e **"Desmarcar"** na aba de mockups.

### B. Ajustes de Posição de Alta Precisão ✅
- Inputs numéricos diretos para X e Y.
- Botões **±1px** com hover colorido (vermelho para −, verde para +).
- **Suporte a Shift nos botões**: segurar Shift ao clicar em ±1 aplica ±10px.
- Botão **"Zerar Coordenadas"** em vermelho com ícone X.
- Dica visual `⇧ = ±10px` ao lado do label "Posição".

### C. Feedback Visual de Exportação ✅
- Barra de progresso mostra o nome do arquivo sendo processado (truncado com flex).
- Contador `atual/total` sempre visível.

### D. Segurança de Dados ✅
- `beforeunload` impede fechar a aba durante lote ativo.

### E. Extras Implementados ✅
- **Painel de Atalhos de Teclado**: Botão "Atalhos" na topbar do canvas que abre um painel flutuante listando todos os atalhos disponíveis.
- **Campo de Busca com Botão X**: Limpa o filtro de pesquisa com um clique.
- **Atalhos de Escala via Teclado**: `+`/`=` aumenta, `−` diminui; Shift multiplica por 10.
- **Confirmação visual da cor**: Swatch ativa com ring e scale-110.

---
**Status:** ✅ Todas as melhorias implementadas com maestria.
