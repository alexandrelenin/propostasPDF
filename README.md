# Gerador de Propostas PDF

Sistema completo para geração de propostas comerciais em PDF, desenvolvido com React, TypeScript e jsPDF. Permite criar, editar, visualizar e salvar propostas com template personalizável, incluindo logo da empresa e informações de contato.

## 🚀 Funcionalidades

### ✨ Principais Recursos
- **Criação de Propostas**: Interface intuitiva para inserir dados do cliente e quantidades
- **Template Personalizável**: Configuração de logo, textos introdutórios e informações de contato
- **Visualização em Tempo Real**: Preview da proposta antes de gerar o PDF
- **Sistema de Salvamento**: Armazenamento local de propostas para edição posterior
- **Geração de PDF**: Exportação profissional com formatação adequada
- **Responsividade**: Interface adaptável para diferentes tamanhos de tela

### 📋 Itens da Proposta
1. **Dispositivos Eletrônicos**: Equipamentos para registro de presença por autenticação facial
2. **Serviços de Instalação**: Cabeamento elétrico, rede de dados e configuração
3. **Licenças por Aluno**: Sistema informatizado perpétuo por aluno
4. **Licenças por Servidor**: Sistema informatizado perpétuo por servidor
5. **Serviços de Suporte**: Treinamento, suporte técnico, atualizações e manutenção

### 🎨 Personalização
- **Logo da Empresa**: Upload para Cloudinary com integração automática no PDF
- **Textos Introdutórios**: Configuração de textos personalizados
- **Informações de Contato**: Endereço, telefone, CNPJ e e-mail
- **Preços Padrão**: Definição de valores unitários para cada item

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19.1.0, TypeScript, Vite
- **PDF**: jsPDF 3.0.1, jsPDF-AutoTable 3.8.2, html2canvas 1.4.1
- **Estilização**: Tailwind CSS
- **Upload de Imagens**: Cloudinary
- **Roteamento**: React Router DOM 7.6.1
- **Deploy**: Vercel

## 📦 Instalação e Uso

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação
```bash
# Clone o repositório
git clone https://github.com/alexandrelenin/propostasPDF.git
cd propostasPDF

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev
```

### Build para Produção
```bash
npm run build
```

## 🎯 Como Usar

### 1. Configurar Template
- Acesse "Configurar Template"
- Faça upload da logo da empresa (será salva no Cloudinary)
- Configure textos introdutórios e informações de contato
- Defina preços padrão para cada item
- Salve as configurações

### 2. Criar Nova Proposta
- Acesse "Nova Proposta"
- Preencha o nome do cliente (formato: CIDADE - UF)
- Insira quantidades para cada item
- Configure serviços de suporte (opcional)
- Visualize a proposta na aba "Visualizar"
- Salve a proposta

### 3. Gerenciar Propostas
- Acesse "Propostas Salvas" para ver todas as propostas
- Visualize, edite ou exclua propostas existentes
- Gere PDF de qualquer proposta salva

### 4. Gerar PDF
- Na visualização da proposta, clique em "Gerar PDF"
- O PDF será baixado automaticamente com:
  - Logo da empresa
  - Informações completas da proposta
  - Tabelas formatadas
  - Rodapé com dados da empresa

## 🔧 Configuração do Cloudinary

Para usar o upload de logo, configure suas credenciais no arquivo `components/TemplateEditorView.tsx`:

```typescript
const CLOUDINARY_CLOUD_NAME = "seu-cloud-name";
const CLOUDINARY_UPLOAD_PRESET = "seu-upload-preset";
```

## 📱 Responsividade

O sistema é totalmente responsivo:
- **Desktop**: Layout completo com todas as funcionalidades
- **Tablet**: Interface adaptada com navegação otimizada
- **Mobile**: Cards responsivos para propostas salvas, botões acessíveis

## 🎨 Interface

### Design System
- **Cores**: Paleta azul (sky) para elementos principais
- **Tipografia**: Hierarquia clara com diferentes tamanhos
- **Espaçamento**: Sistema consistente de padding e margin
- **Componentes**: Reutilizáveis e bem estruturados

### Navegação
- **Navbar**: Navegação principal com links para todas as seções
- **Mensagens**: Sistema de notificações para feedback do usuário
- **Breadcrumbs**: Indicação clara da localização atual

## 📊 Estrutura do Projeto

```
propostasPDF/
├── components/           # Componentes React
│   ├── ProposalView.tsx      # Criação e edição de propostas
│   ├── SavedProposalsView.tsx # Listagem de propostas salvas
│   └── TemplateEditorView.tsx # Configuração do template
├── services/            # Serviços e utilitários
│   ├── pdfGenerator.ts      # Geração de PDF
│   └── storageManager.ts    # Gerenciamento de dados locais
├── utils/              # Utilitários
│   └── formatters.ts       # Formatação de dados
├── types.ts            # Definições de tipos TypeScript
├── constants.ts        # Constantes e configurações
└── App.tsx            # Componente principal
```

## 🔄 Fluxo de Dados

1. **Entrada**: Usuário preenche formulário de proposta
2. **Validação**: Verificação de dados obrigatórios
3. **Processamento**: Cálculo automático de valores
4. **Armazenamento**: Salvamento no localStorage
5. **Saída**: Geração de PDF formatado

## 🚀 Deploy

O projeto está configurado para deploy automático no Vercel:
- Push para `main` dispara deploy automático
- Build otimizado para produção
- CDN global para melhor performance

## 📝 Changelog

### Versão Atual (Dezembro 2024)
- ✅ **Correções Completas de Tipagem TypeScript**: Projeto 100% limpo sem erros
- ✅ **Integração Cloudinary**: Upload e integração automática de logo no PDF
- ✅ **Sistema Responsivo Completo**: Interface adaptável para todos os dispositivos
- ✅ **PDF Profissional**: Geração com logo, formatação e rodapé personalizados
- ✅ **Fluxo de Salvamento Otimizado**: Mensagens centralizadas e persistência de dados
- ✅ **Interface Moderna**: Design intuitivo com navegação clara

### Melhorias Técnicas Implementadas
- **TypeScript**: Tipagem rigorosa em todos os componentes e serviços
- **Performance**: Otimizações de build e carregamento
- **UX/UI**: Sistema de mensagens, responsividade e acessibilidade
- **Integração**: Cloudinary para armazenamento de imagens
- **Deploy**: Pipeline automatizado no Vercel

### Funcionalidades Principais
- Criação e edição de propostas comerciais
- Template personalizável com logo da empresa
- Sistema de salvamento e gerenciamento de propostas
- Geração de PDF profissional
- Interface responsiva e moderna

## 🚀 Status do Projeto

**✅ PRODUÇÃO** - Sistema completo, funcional e sem erros
- Deploy automático no Vercel
- Código limpo e documentado
- Testado e validado
- Pronto para uso em produção

**Última Atualização**: Dezembro 2024
**Versão**: 1.0.0 - Estável

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Alexandre Lenin**
- GitHub: [@alexandrelenin](https://github.com/alexandrelenin)

## 🙏 Agradecimentos

- Comunidade React e TypeScript
- Biblioteca jsPDF e jsPDF-AutoTable
- Cloudinary para hospedagem de imagens
- Vercel para hospedagem e deploy

---

**Status**: ✅ Produção - Sistema completo e funcional
**Última Atualização**: Dezembro 2024