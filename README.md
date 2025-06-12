# Gerador de Propostas PDF

## Visão Geral do Projeto

O "Gerador de Propostas PDF" é uma aplicação web frontend desenvolvida para simplificar a criação, gerenciamento e geração de propostas comerciais personalizadas em formato PDF. O foco inicial é atender às necessidades de propostas para soluções educacionais, oferecendo templates customizáveis e cálculos automáticos de valores.

A aplicação permite que o usuário:
1.  Configure um template padrão com informações da empresa (logo, texto introdutório, contatos).
2.  Defina preços unitários padrão para diferentes categorias de itens de proposta.
3.  Crie novas propostas inserindo dados do cliente, local, data e quantidades de itens.
4.  Visualize uma prévia da proposta em um formato A4.
5.  Gere e baixe a proposta formatada como um arquivo PDF.
6.  Salve propostas para visualização ou edição futura.
7.  Gerencie propostas salvas (visualizar, editar, excluir).

A aplicação é construída como um Single Page Application (SPA) utilizando React e TypeScript, com estilização via Tailwind CSS. Todos os dados (configurações de template e propostas salvas) são persistidos localmente no navegador usando `localStorage`.

## Funcionalidades Principais

*   **Editor de Template:**
    *   Upload de logo da empresa (com preview e limite de tamanho).
    *   Edição de texto introdutório.
    *   Configuração de informações de contato (endereço, telefone, CNPJ, e-mail) para o rodapé.
    *   Definição de preços unitários padrão para itens como dispositivos eletrônicos, serviços de instalação, licenças de aluno/servidor e serviços de suporte.
    *   Configuração de e-mail de contato para serviços de suporte.
*   **Criação e Edição de Propostas:**
    *   Formulário para inserir nome do cliente, local e data da proposta.
    *   Campos para especificar quantidades para cada item principal da proposta (dispositivos, instalações, licenças).
    *   Opção para incluir serviços de suporte, com campo para quantidade de escolas/unidades.
    *   Cálculo automático de totais (investimento de primeiro ano, totais mensais e anuais de suporte).
*   **Visualização da Proposta:**
    *   Preview em tempo real da proposta em um container com dimensões A4.
    *   Layout profissional com cabeçalho (logo, título), corpo (texto introdutório, tabelas de itens) e rodapé (informações de contato).
    *   Tabelas separadas para "Equipamentos, Instalações e Licenças" e "Serviços de Suporte" (se aplicável).
*   **Geração de PDF:**
    *   Geração programática de PDF utilizando `jsPDF` e `jspdf-autotable`, permitindo texto selecionável e alta qualidade.
    *   Layout da proposta replicado no PDF com tabelas e formatação de texto.
*   **Gerenciamento de Propostas Salvas:**
    *   Listagem de propostas salvas com informações chave (cliente, data, valor total, data de criação).
    *   Opções para visualizar/editar ou excluir propostas salvas.
*   **Persistência Local:**
    *   Configurações do template e propostas são salvas no `localStorage` do navegador, permitindo que os dados persistam entre sessões.
*   **Navegação:**
    *   Uso de `react-router-dom` para navegação entre as seções: Nova Proposta, Propostas Salvas e Configurar Template.

## Tecnologias Utilizadas

*   **Frontend:**
    *   React 19 (via `esm.sh`)
    *   TypeScript
    *   React Router DOM (v7.6.1, via `esm.sh`)
    *   Tailwind CSS (via CDN)
    *   Fontes padrão do navegador (ex: Helvetica, Arial, sans-serif)
*   **Geração de PDF:**
    *   jsPDF (v3.0.1, via `esm.sh`)
    *   jspdf-autotable (v3.8.2, via `esm.sh`)
*   **Outras:**
    *   uuid (v11.1.0, via `esm.sh`) para IDs únicos.
    *   ES Modules (importmap no `index.html` para gerenciamento de dependências sem um bundler tradicional em tempo de desenvolvimento/prototipagem).

## Estrutura dos Componentes e Arquivos Core

*   **`index.html`**: Ponto de entrada da aplicação. Carrega o Tailwind CSS, define o `importmap` para as dependências e monta o app React. Define as fontes padrão.
*   **`index.tsx`**: Monta o componente principal `App` no DOM.
*   **`App.tsx`**: Componente raiz que gerencia o estado global (configurações do template, metadados de propostas salvas, proposta em edição), o roteamento e a estrutura principal da página (Navbar, Main, Footer).
*   **`components/`**:
    *   **`ProposalView.tsx`**: Responsável pela UI de criação, edição e visualização de uma proposta individual. Contém a lógica do formulário, cálculo da proposta e o layout de preview.
    *   **`TemplateEditorView.tsx`**: UI para editar as configurações do template da proposta.
    *   **`SavedProposalsView.tsx`**: UI para listar e gerenciar as propostas salvas.
*   **`services/`**:
    *   **`storageManager.ts`**: Lida com o salvamento e carregamento de dados (configurações do template, propostas) do `localStorage`.
    *   **`pdfGenerator.ts`**: Contém a lógica para gerar o PDF programaticamente com `jsPDF` e `jspdf-autotable`.
*   **`utils/`**:
    *   **`formatters.ts`**: Funções utilitárias para formatação de moeda e datas.
*   **`types.ts`**: Define as interfaces e tipos TypeScript usados em toda a aplicação.
*   **`constants.ts`**: Define constantes como configurações iniciais, definições de itens de proposta e chaves de `localStorage`.
*   **`metadata.json`**: Metadados da aplicação.

## Detalhes da Geração do PDF (`services/pdfGenerator.ts`)

A geração de PDF é feita programaticamente usando `jsPDF` e o plugin `jspdf-autotable`. Este método substitui a abordagem anterior de `html2canvas` para produzir PDFs de maior qualidade com texto selecionável.

1.  **Inicialização do Documento:**
    *   Uma instância de `jsPDF` é criada (formato A4, retrato, unidades em mm).
    *   Uma fonte padrão (Helvetica) é definida para o documento.
    *   Margens e a largura do conteúdo são estabelecidas.
    *   Uma variável `currentY` rastreia a posição vertical atual na página.

2.  **Adição de Conteúdo:**
    *   **Logo:** Se um logo estiver configurado e for uma imagem válida, ele é adicionado ao topo do PDF. Caso contrário, um texto substituto é usado.
    *   **Cabeçalho e Texto Introdutório:** Textos como o título da secretaria e o parágrafo introdutório são adicionados usando `doc.text()`. O texto introdutório é quebrado em linhas automaticamente para caber na largura do conteúdo.
    *   **Tabelas de Itens:**
        *   Os dados dos itens da proposta (principais e de suporte, se aplicável) são formatados.
        *   A função `autoTable` do `jspdf-autotable` é usada para renderizar as tabelas. Isso inclui cabeçalhos, corpo da tabela, estilização básica (cores, alinhamento) e quebra de página automática para tabelas longas.
        *   As colunas são configuradas para diferentes alinhamentos e larguras.
    *   **Resumos:** Após cada tabela, um resumo do valor total (investimento de primeiro ano, total anual de suporte) é adicionado.
    *   **Data e Local:** A data e o local da proposta são adicionados.
    *   **Rodapé:** Uma função auxiliar adiciona um rodapé a cada página do PDF, contendo informações de contato da empresa e o número da página.

3.  **Salvamento do PDF:**
    *   Após todo o conteúdo ser adicionado, `doc.save('nome-do-arquivo.pdf')` é chamado para que o usuário possa baixar o arquivo.
    *   Mensagens de sucesso ou erro são exibidas.

Esta abordagem programática garante que o PDF seja leve, com texto nítido e selecionável, e permite um controle mais preciso sobre o layout final, assemelhando-se mais à qualidade de exportação de documentos de aplicativos de escritório.

## Deploy

O projeto foi configurado e testado para deploy nas seguintes plataformas:

1.  **GitHub:** O código fonte é versionado e hospedado em um repositório GitHub.
2.  **Vercel:** A aplicação é implantada na Vercel, conectada diretamente ao repositório GitHub.
    *   O Vercel lida com o build (se aplicável para frameworks) e o deploy.
    *   Para esta aplicação específica, que utiliza `importmap` e não possui um passo de build tradicional (como `npm run build` de Vite ou CRA), o Vercel é configurado para servir os arquivos estáticos (`index.html`, `index.tsx`, etc.) diretamente. O navegador do cliente, então, resolve as importações via `esm.sh`.
    *   O deploy é automático a cada `push` para a branch principal no GitHub.

## Possíveis Evoluções e Melhorias Futuras

*   **Autenticação de Usuário e Armazenamento em Nuvem:**
    *   Implementar um sistema de login para que múltiplos usuários possam usar a aplicação com seus próprios dados.
    *   Mover o armazenamento de templates e propostas do `localStorage` para um banco de dados em nuvem (ex: Firebase Firestore, Supabase) para persistência real e acesso de qualquer lugar.
*   **Integração com API Gemini (ou similar):**
    *   **Sugestão de Textos:** Usar a API para sugerir textos introdutórios, descrições de itens ou e-mails de acompanhamento com base em inputs do usuário.
    *   **Análise de Propostas:** Potencialmente analisar propostas existentes para sugerir melhorias ou identificar padrões.
    *   **Geração Dinâmica de Conteúdo:** Para campos mais complexos ou personalizados.
    *   **Importante:** A chave da API Gemini deverá ser gerenciada de forma segura no backend (ex: Vercel Serverless Functions) e não exposta no frontend.
*   **Melhorias no Editor de Template:**
    *   Opções de formatação mais ricas para o texto introdutório (negrito, itálico, listas).
    *   Mais opções de layout para a proposta (ex: diferentes posições de logo, escolha de fontes).
    *   Pré-visualização do template diretamente na tela de edição.
*   **Biblioteca de Itens:**
    *   Permitir que o usuário adicione, edite e remova itens da proposta que não sejam os 4 padrões, criando uma biblioteca de itens reutilizáveis.
*   **Internacionalização (i18n):**
    *   Suporte para múltiplos idiomas na interface e nos templates de proposta.
*   **Cálculos Mais Complexos:**
    *   Adicionar suporte para descontos (percentuais ou fixos).
    *   Impostos e taxas configuráveis.
    *   Diferentes moedas.
*   **Melhorias na Geração de PDF (com `jsPDF` programático):**
    *   Opções de exportação (ex: escolher quais seções incluir).
    *   Controle mais granular sobre fontes (investigar embutimento de fontes personalizadas se necessário no futuro) e estilos.
    *   Suporte para imagens/gráficos mais complexos dentro do PDF.
*   **Colaboração:**
    *   Permitir que múltiplos usuários colaborem na mesma proposta (requer backend e autenticação).
*   **Analytics:**
    *   Dashboard simples para mostrar o número de propostas criadas, valor total, etc.
*   **Testes:**
    *   Adicionar testes unitários e de integração para garantir a robustez da aplicação.
*   **Otimização de Performance:**
    *   Para aplicações maiores ou com muitos dados, otimizar o carregamento e a renderização.
    *   Considerar um passo de build com ferramentas como Vite ou Parcel para otimizar os assets para produção, em vez de depender exclusivamente do `esm.sh` para todas as dependências em produção.
*   **Melhorias de UX/UI:**
    *   Feedback visual mais interativo.
    *   Drag and drop para reordenar itens da proposta (se a biblioteca de itens for implementada).
    *   Temas de cores para a interface.

Este resumo representa o estado atual do projeto e oferece um roteiro para seu crescimento e aprimoramento contínuos.

This change is to trigger a new commit with the correct Git author email.