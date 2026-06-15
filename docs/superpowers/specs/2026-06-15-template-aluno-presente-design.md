# Design — Novo template "Aluno Presente"

**Data:** 2026-06-15
**Branch:** `feat/template-aluno-presente`
**Roda em:** sistema atual (Firebase Firestore + Vercel). Independente da migração Postgres.

## Objetivo

Adicionar um novo `templateType` chamado **"Aluno Presente"** (solução tecnológica
integrada para registro e gestão da frequência de alunos), espelhando o padrão já
existente do template **RFID**, porém trocando a tabela de itens pela **Tabela 2 –
Especificações e valores** (modelo "Kit").

O usuário escolhe um entre **3 kits padrão** (400 / 600 / 800 alunos), **digita a
quantidade** de kits, o **valor unitário** vem do template (padrão editável) e o
**valor total = Qtd × valor unitário** é calculado.

## Escopo

**Dentro do escopo:** proposta **comercial** — cabeçalho/objeto + Tabela 2 + total,
no mesmo espírito dos templates `standard`/`rfid`.

**Fora do escopo:** reproduzir o Termo de Referência completo (qualificação técnica,
condições de fornecimento, especificações técnicas de hardware/software). Esse texto
longo **não** entra no PDF.

## Os 3 kits

| Kit | Equipamentos | Valor unitário padrão (editável) |
|-----|--------------|----------------------------------|
| 400 alunos | 02 (dois) | R$ 33.670,00 |
| 600 alunos | 03 (três) | R$ 48.370,00 |
| 800 alunos | 04 (quatro) | R$ 55.070,00 |

> Valores em reais inteiros (sem centavos): `33670`, `48370`, `55070`. O "." é
> separador de milhar (formato BR).

### Texto-modelo da coluna Descrição

Texto único parametrizado pelo kit selecionado:

> "Aquisição de kit de solução tecnológica integrada para registro e gestão da
> frequência de até **{alunos}** (**{alunosExtenso}**) alunos em 01 (uma) unidade de
> ensino, composto por **{equip}** (**{equipExtenso}**) equipamentos de reconhecimento
> biométrico facial e licença de uso de sistema de gestão em ambiente web,
> contemplando, adicionalmente, os serviços de hospedagem, atualizações e envio de
> alertas pelo período de 12 (doze) meses, pelo valor unitário de R$ {valor}
> (**{valorExtenso}**)."

- `{alunos}`/`{alunosExtenso}`: 400/"quatrocentos", 600/"seiscentos", 800/"oitocentos".
- `{equip}`/`{equipExtenso}`: 2/"dois", 3/"três", 4/"quatro".
- `{valor}`/`{valorExtenso}`: **valor unitário** do kit; extenso em **reais, sem
  centavos** (ex.: "trinta e três mil, seiscentos e setenta reais").

> **A confirmar (1 linha):** o extenso na Descrição é do **valor unitário** (assumido)
> ou do **valor total** (Qtd × unitário)? E a frase final "pelo valor unitário de R$ …"
> está com a redação desejada?

## Modelo de dados (`src/types.ts`)

- `ProposalItemCategory`: adicionar `KIT_ALUNO_PRESENTE = 'KIT_ALUNO_PRESENTE'`.
- `TemplateSettings.templateType`: adicionar `'aluno-presente'` à união
  (`'standard' | 'rfid' | 'aluno-presente'`).
- `TemplateSettings`: adicionar campo opcional
  `kitUnitPrices?: { 400: number; 600: number; 800: number }`.
- `Proposal` + `ProposalInputData`/formData: adicionar `kitSize?: 400 | 600 | 800`.

Todos os campos novos são **opcionais** → retrocompatível com propostas/templates já
salvos no Firestore. Sem migração de dados.

## Constantes (`src/constants.ts`)

- `INITIAL_TEMPLATE_SETTINGS`: adicionar
  `kitUnitPrices: { 400: 33670, 600: 48370, 800: 55070 }`.
- Definir as faixas de kit (alunos → nº de equipamentos): `{400: 2, 600: 3, 800: 4}`.
- Adicionar texto-modelo da Descrição + função que o preenche.
- **Helper `valorPorExtenso(n)`** (reais, sem centavos). Reaproveita
  `numeroPorExtenso`, **estendendo-o** para suportar dezenas/centenas de milhar
  (hoje só vai até 9.999 e cai em `toString()` para ≥ 10.000; precisamos de até ~999.999
  para cobrir 33.670/48.370/55.070).

## UI — `src/components/TemplateEditorView.tsx`

- Adicionar `<option value="aluno-presente">Aluno Presente</option>` no seletor de
  Tipo de Template.
- Bloco condicional `templateType === 'aluno-presente'`: 3 inputs de **valor unitário
  padrão** (kit 400 / 600 / 800), editando `settings.kitUnitPrices`.

## UI/cálculo — `src/components/ProposalView.tsx`

Espelhar o branch do RFID (linhas ~218, ~311, ~558):

- **Formulário** (modo `aluno-presente`): seletor de kit (400/600/800) + input de
  **Qtd** + exibição do **valor unitário** (vindo de `kitUnitPrices`, somente leitura).
  Oculta as categorias de presença/instalação/licenças/detector/suporte.
- **`calculateProposal`**: no modo kit, montar **1 item**:
  - `unitPrice = templateSettings.kitUnitPrices[kitSize]`
  - `quantity = formData.kitSize ? (qtd digitada) : 0`
  - `totalPrice = quantity * unitPrice`
  - `name`/descrição = texto-modelo preenchido (com extenso)
  - `firstYearInvestment = totalPrice` (sem suporte/detector neste modo)
- **Render da Tabela 2**: colunas `Item | Unid. (Kit) | Qtd. | Descrição | Valor
  unitário | Valor total`, 1 linha, total calculado.

## Serviços / persistência

Nenhuma mudança em `templateService`/`proposalService`. `Proposal` e `TemplateSettings`
ganham campos opcionais, gravados/lidos do Firestore como hoje.

## Geração de PDF

Sem mudança de mecanismo (html2canvas + jsPDF). O novo branch só altera o DOM
renderizado da proposta; o pipeline de PDF é o mesmo.

## Critérios de aceite

1. No editor de template, é possível escolher "Aluno Presente" e editar os 3 valores
   unitários padrão.
2. Na nova proposta com esse template, escolho o kit (400/600/800), digito a Qtd e vejo
   a Tabela 2 com Unid=Kit, Descrição correta (com extenso) e Valor total = Qtd ×
   unitário.
3. Trocar o kit atualiza descrição, valor unitário e total.
4. PDF gerado mostra a Tabela 2 corretamente.
5. Templates/propostas antigos (standard/rfid) continuam funcionando sem alteração.
