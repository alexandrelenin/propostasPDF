# 🚀 PLANO DE EVOLUÇÃO - CRM PARA PREFEITURAS
## Arquitetura Separada - MVP Fase 1

### 📋 ESTRATÉGIA DE IMPLEMENTAÇÃO

**Objetivo:** Implementar o MVP do CRM mantendo o sistema atual de propostas PDF 100% funcional e independente.

**Decisão:** Arquitetura Separada (Opção 1) - Nova aplicação independente

---

### 🏗️ ARQUITETURA PROPOSTA

```
propostasPDF/          # Sistema atual (mantido intacto)
├── ... (todos os arquivos atuais)
├── README.md
└── crm_prefeituras_requisitos.md

crm-prefeituras/       # Nova aplicação CRM
├── frontend/          # React + TypeScript
├── backend/           # Node.js + Express + PostgreSQL
└── shared/            # Bibliotecas compartilhadas
```

**Vantagens da Arquitetura Separada:**
- ✅ Sistema atual permanece 100% funcional
- ✅ Desenvolvimento independente e paralelo
- ✅ Deploy separado (menor risco)
- ✅ Tecnologias otimizadas para cada propósito
- ✅ Facilita manutenção e escalabilidade

---

### 🎯 MVP - FASE 1 (3 meses)

#### **1.1 Estrutura Base**
- [ ] **Nova aplicação React** com TypeScript
- [ ] **Sistema de roteamento** com React Router
- [ ] **Design system** consistente com o sistema atual
- [ ] **Autenticação** básica (sem Gov.br inicialmente)
- [ ] **Backend Node.js** com Express e PostgreSQL

#### **1.2 Módulos Essenciais**

**A. Base de Dados de Prefeituras**
```typescript
interface Prefeitura {
  id: string;
  nome: string;
  estado: string;
  populacao: number;
  orcamentoEducacao: number;
  escolasMunicipais: number;
  alunosMatriculados: number;
  prefeito: string;
  secretarioEducacao: string;
  contatos: Contato[];
  coordenadas: { lat: number; lng: number };
  createdAt: Date;
  updatedAt: Date;
}
```

**B. CRM Core - Pipeline de Vendas**
```typescript
interface Lead {
  id: string;
  prefeituraId: string;
  vendedorId: string;
  status: 'prospeccao' | 'primeiro_contato' | 'apresentacao' | 'proposta' | 'negociacao' | 'licitacao' | 'fechamento';
  probabilidade: number; // 0-100
  valorEstimado: number;
  proximaAcao: Date;
  historico: Interacao[];
  createdAt: Date;
  updatedAt: Date;
}

interface Interacao {
  id: string;
  leadId: string;
  tipo: 'email' | 'telefone' | 'visita' | 'proposta' | 'outro';
  descricao: string;
  data: Date;
  proximaAcao?: Date;
  vendedorId: string;
}
```

**C. Gestão de Contatos**
```typescript
interface Contato {
  id: string;
  prefeituraId: string;
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
  tipo: 'decisor' | 'influenciador' | 'operacional';
  preferencias: string[];
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**D. Usuários e Vendedores**
```typescript
interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'admin' | 'vendedor' | 'gerente';
  regiao: string[];
  ativo: boolean;
  createdAt: Date;
}
```

#### **1.3 Telas do MVP**

**A. Dashboard Principal**
- Visão geral de leads por status
- KPIs básicos (conversão, pipeline value)
- Próximas ações pendentes
- Mapa de prefeituras com leads
- Gráficos de performance

**B. Gestão de Prefeituras**
- Lista de prefeituras com filtros
- Detalhes completos de cada prefeitura
- Formulário de cadastro/edição
- Importação em lote via CSV
- Busca e filtros avançados

**C. Pipeline de Vendas**
- Kanban board com leads
- Drag & drop entre estágios
- Formulário de criação de lead
- Histórico de interações
- Filtros por vendedor/região

**D. Gestão de Contatos**
- Lista de contatos por prefeitura
- Formulário de cadastro
- Histórico de comunicações
- Categorização por influência
- Exportação de dados

**E. Integração com Sistema Atual**
- Botão "Gerar Proposta" no lead
- Abertura do sistema de propostas em nova aba
- Retorno automático do status da proposta
- Sincronização de dados

---

### 🔧 IMPLEMENTAÇÃO TÉCNICA

#### **1.4 Estrutura de Pastas Proposta**
```
crm-prefeituras/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Componentes reutilizáveis
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Table.tsx
│   │   │   ├── dashboard/        # Componentes do dashboard
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── PipelineChart.tsx
│   │   │   │   └── MapView.tsx
│   │   │   ├── prefeituras/      # Gestão de prefeituras
│   │   │   │   ├── PrefeituraList.tsx
│   │   │   │   ├── PrefeituraForm.tsx
│   │   │   │   └── PrefeituraDetail.tsx
│   │   │   ├── leads/           # Pipeline de vendas
│   │   │   │   ├── LeadBoard.tsx
│   │   │   │   ├── LeadForm.tsx
│   │   │   │   └── LeadDetail.tsx
│   │   │   └── contatos/        # Gestão de contatos
│   │   │       ├── ContatoList.tsx
│   │   │       ├── ContatoForm.tsx
│   │   │       └── ContatoDetail.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Prefeituras.tsx
│   │   │   ├── Leads.tsx
│   │   │   ├── Contatos.tsx
│   │   │   └── Login.tsx
│   │   ├── services/
│   │   │   ├── api/             # Chamadas para backend
│   │   │   │   ├── prefeituras.ts
│   │   │   │   ├── leads.ts
│   │   │   │   ├── contatos.ts
│   │   │   │   └── auth.ts
│   │   │   ├── storage.ts       # Gerenciamento local
│   │   │   └── utils.ts         # Utilitários
│   │   ├── types/
│   │   │   └── index.ts         # Definições de tipos
│   │   ├── utils/
│   │   │   ├── formatters.ts    # Formatação de dados
│   │   │   └── constants.ts     # Constantes
│   │   └── styles/
│   │       └── globals.css      # Estilos globais
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── controllers/         # Controladores da API
│   │   ├── models/             # Modelos do banco
│   │   ├── routes/             # Rotas da API
│   │   ├── middleware/         # Middlewares
│   │   ├── services/           # Lógica de negócio
│   │   ├── utils/              # Utilitários
│   │   └── app.ts              # Aplicação principal
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
└── shared/
    ├── types/                  # Tipos compartilhados
    └── utils/                  # Utilitários compartilhados
```

#### **1.5 Integração com Sistema Atual**

**A. Compartilhamento de Dados**
```typescript
// shared/types/proposal.ts
export interface Proposal {
  // Tipos compartilhados entre sistemas
  id: string;
  clientName: string;
  proposalLocation: string;
  proposalDate: string;
  items: ProposalItem[];
  // ... outros campos
}

// shared/services/pdfGenerator.ts
export { generateProposalPdf } from '../propostasPDF/services/pdfGenerator';
```

**B. Navegação Cruzada**
```typescript
// No CRM, botão para gerar proposta
const handleGenerateProposal = (leadId: string) => {
  const lead = leads.find(l => l.id === leadId);
  const proposalData = {
    clientName: lead.prefeitura.nome,
    proposalLocation: lead.prefeitura.nome,
    proposalDate: new Date().toISOString().split('T')[0],
    // ... outros dados mapeados
  };
  
  // Abrir sistema de propostas em nova aba
  const url = `${process.env.REACT_APP_PROPOSALS_URL}?data=${encodeURIComponent(JSON.stringify(proposalData))}`;
  window.open(url, '_blank');
};
```

**C. Comunicação entre Sistemas**
```typescript
// No sistema de propostas, receber dados do CRM
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');
  
  if (dataParam) {
    try {
      const proposalData = JSON.parse(decodeURIComponent(dataParam));
      setFormData(proposalData);
      setActiveTab('preview');
    } catch (error) {
      console.error('Erro ao processar dados do CRM:', error);
    }
  }
}, []);
```

---

### 📊 DADOS INICIAIS

#### **1.6 Base de Dados de Prefeituras**
- **Fonte:** IBGE + dados públicos
- **Quantidade:** ~5.570 prefeituras brasileiras
- **Campos essenciais:**
  - Dados básicos (nome, estado, população)
  - Informações educacionais (escolas, alunos)
  - Contatos principais (prefeito, secretário)
  - Coordenadas geográficas

#### **1.7 Estrutura de Dados (PostgreSQL)**
```sql
-- Tabelas principais
CREATE TABLE prefeituras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  populacao INTEGER,
  orcamento_educacao DECIMAL(15,2),
  escolas_municipais INTEGER,
  alunos_matriculados INTEGER,
  prefeito VARCHAR(255),
  secretario_educacao VARCHAR(255),
  coordenadas_lat DECIMAL(10,8),
  coordenadas_lng DECIMAL(11,8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefeitura_id UUID REFERENCES prefeituras(id),
  vendedor_id UUID REFERENCES usuarios(id),
  status VARCHAR(50) NOT NULL,
  probabilidade INTEGER CHECK (probabilidade >= 0 AND probabilidade <= 100),
  valor_estimado DECIMAL(15,2),
  proxima_acao TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefeitura_id UUID REFERENCES prefeituras(id),
  nome VARCHAR(255) NOT NULL,
  cargo VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(20),
  tipo VARCHAR(50),
  preferencias TEXT[],
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE interacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  tipo VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  data TIMESTAMP NOT NULL,
  proxima_acao TIMESTAMP,
  vendedor_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(50) NOT NULL,
  regiao TEXT[],
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 🎨 INTERFACE E UX

#### **1.8 Design System**
- **Cores:** Manter paleta azul (sky) do sistema atual
- **Componentes:** Reutilizar base visual existente
- **Responsividade:** Mobile-first para uso em campo
- **Navegação:** Intuitiva e rápida

#### **1.9 Telas Principais**

**Dashboard:**
```
┌─────────────────────────────────────┐
│ 📊 Dashboard CRM                    │
├─────────────────────────────────────┤
│ [KPIs] [Pipeline] [Mapa] [Ações]   │
│                                     │
│ Leads por Status:                   │
│ 🟢 Prospecção: 45                   │
│ 🟡 Negociação: 12                   │
│ 🔴 Fechamento: 3                    │
│                                     │
│ Próximas Ações:                     │
│ • Uberlândia - Follow-up (hoje)     │
│ • Belo Horizonte - Apresentação     │
└─────────────────────────────────────┘
```

**Pipeline de Vendas:**
```
┌─────────────────────────────────────┐
│ 🎯 Pipeline de Vendas               │
├─────────────────────────────────────┤
│ Prospecção │ Primeiro │ Apresent. │ │
│            │ Contato  │           │ │
│ [Lead 1]   │ [Lead 2] │ [Lead 3]  │ │
│ [Lead 4]   │ [Lead 5] │ [Lead 6]  │ │
│            │          │           │ │
└─────────────────────────────────────┘
```

---

### 🔄 FLUXO DE TRABALHO

#### **1.10 Processo de Vendas**
1. **Prospecção:** Identificar prefeitura com potencial
2. **Primeiro Contato:** Estabelecer relacionamento
3. **Apresentação:** Demonstrar solução
4. **Proposta:** Gerar proposta técnica/comercial
5. **Negociação:** Ajustar termos e valores
6. **Licitação:** Acompanhar processo licitatório
7. **Fechamento:** Assinar contrato

#### **1.11 Integração com Sistema Atual**
```
CRM → Identifica oportunidade
  ↓
CRM → Cria lead com dados da prefeitura
  ↓
CRM → Botão "Gerar Proposta" 
  ↓
Sistema Atual → Abre com dados pré-preenchidos
  ↓
Sistema Atual → Gera PDF da proposta
  ↓
CRM → Atualiza status do lead
```

---

### 📈 PRÓXIMAS FASES

#### **Fase 2 (4-6 meses)**
- [ ] Integração Gov.br (autenticação)
- [ ] Email marketing integrado
- [ ] Planejamento de rotas básico
- [ ] Relatórios avançados
- [ ] Notificações automáticas

#### **Fase 3 (7-12 meses)**
- [ ] Assinatura digital completa via Gov.br
- [ ] IA para scoring de leads
- [ ] Automação de workflows
- [ ] Analytics avançado
- [ ] Integração com sistemas externos

---

### 🛠️ TECNOLOGIAS

#### **Frontend**
- React 19.1.0 + TypeScript
- Vite (build tool)
- React Router DOM 7.6.1
- Tailwind CSS
- React Query (TanStack Query)
- React Hook Form
- React Hot Toast (notificações)

#### **Backend**
- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma (ORM)
- JWT (autenticação)
- bcrypt (hash de senhas)
- CORS

#### **Deploy**
- Frontend: Vercel
- Backend: Railway ou Heroku
- Banco: PostgreSQL (Railway/Heroku)

---

### 📋 CHECKLIST DE IMPLEMENTAÇÃO

#### **Semana 1-2: Setup Inicial**
- [ ] Criar estrutura do projeto frontend
- [ ] Configurar TypeScript e Vite
- [ ] Implementar design system básico
- [ ] Configurar roteamento
- [ ] Criar estrutura do projeto backend
- [ ] Configurar PostgreSQL e Prisma

#### **Semana 3-4: Autenticação e Base**
- [ ] Implementar sistema de login
- [ ] Criar CRUD de usuários
- [ ] Implementar middleware de autenticação
- [ ] Configurar CORS e segurança

#### **Semana 5-6: Gestão de Prefeituras**
- [ ] Criar CRUD de prefeituras
- [ ] Implementar listagem com filtros
- [ ] Criar formulário de cadastro/edição
- [ ] Implementar importação CSV

#### **Semana 7-8: Pipeline de Vendas**
- [ ] Criar CRUD de leads
- [ ] Implementar Kanban board
- [ ] Criar sistema de interações
- [ ] Implementar drag & drop

#### **Semana 9-10: Gestão de Contatos**
- [ ] Criar CRUD de contatos
- [ ] Implementar relacionamento com prefeituras
- [ ] Criar histórico de comunicações
- [ ] Implementar categorização

#### **Semana 11-12: Dashboard e Integração**
- [ ] Criar dashboard principal
- [ ] Implementar KPIs e gráficos
- [ ] Criar integração com sistema de propostas
- [ ] Implementar navegação cruzada

#### **Semana 13: Testes e Deploy**
- [ ] Testes de funcionalidade
- [ ] Testes de integração
- [ ] Deploy em ambiente de produção
- [ ] Treinamento da equipe

---

### 🎯 MÉTRICAS DE SUCESSO

#### **Métricas Técnicas**
- [ ] 95% de disponibilidade do sistema
- [ ] Tempo de resposta < 2 segundos
- [ ] 100% de funcionalidades do MVP implementadas
- [ ] Zero conflitos com sistema atual

#### **Métricas de Negócio**
- [ ] Cadastro de 100+ prefeituras
- [ ] Criação de 50+ leads
- [ ] 80% de leads com pelo menos uma interação
- [ ] 90% de satisfação da equipe comercial

---

### 📝 PRÓXIMOS PASSOS

1. **Aprovação do plano** pela equipe
2. **Setup do ambiente** de desenvolvimento
3. **Criação da estrutura base** do projeto
4. **Implementação do primeiro módulo** (autenticação)
5. **Desenvolvimento iterativo** dos demais módulos
6. **Testes e validação** de cada funcionalidade
7. **Deploy e treinamento** da equipe

---

**Status:** 📋 Plano Aprovado - Pronto para Implementação
**Versão:** 1.0
**Data:** Dezembro 2024
**Responsável:** Equipe de Desenvolvimento 