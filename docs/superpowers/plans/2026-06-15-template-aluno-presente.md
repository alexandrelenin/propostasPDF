# Template "Aluno Presente" — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um novo `templateType: 'aluno-presente'` que gera a proposta comercial em formato "Kit" (400/600/800 alunos), espelhando o padrão do template RFID.

**Architecture:** O kit é modelado como um único `ProposalItem` (categoria `KIT_ALUNO_PRESENTE`, `unitType: 'Kit'`) que flui pelo pipeline de itens já existente — assim a tabela de preview (`ProposalView`) e o PDF (`pdfGenerator`) renderizam o kit com pouca ramificação. O usuário escolhe o kit + digita Qtd; o valor unitário vem de `templateSettings.kitUnitPrices` (editável); total = Qtd × unitário.

**Tech Stack:** React 19 + TypeScript + Vite; Firebase Firestore (persistência atual); jsPDF + jspdf-autotable (PDF). Sem dependência da migração Postgres.

**Nota sobre testes:** o repositório não possui framework de testes (sem script de teste no `package.json`); adicionar um está fora do escopo. A verificação de cada task é **`npx tsc --noEmit`** (typecheck), **`npm run build`** e **checagem manual no browser** (Task 8).

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Mudança |
|---|---|---|
| `src/types.ts` | Tipos de domínio | Modificar: enum, `unitType`, `templateType`, `kitUnitPrices`, `kitSize` |
| `src/constants.ts` | Config e textos padrão | Modificar: `KIT_DEFINITIONS`, `buildKitDescription`, `kitUnitPrices` em `INITIAL_TEMPLATE_SETTINGS` |
| `src/components/TemplateEditorView.tsx` | Editor de template | Modificar: opção "Aluno Presente" + 3 inputs de preço de kit |
| `src/components/ProposalView.tsx` | Form + cálculo + preview | Modificar: branch de form, `calculateProposal`, título efetivo, guarda da projeção financeira |
| `src/services/pdfGenerator.ts` | Geração de PDF | Modificar: título efetivo + ordem de itens |

---

### Task 1: Tipos do kit em `types.ts`

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Adicionar a categoria do kit ao enum**

Em `src/types.ts:8`, após a linha `RFID_CARD = 'RFID_CARD', // Cartão de proximidade RFID`, adicionar dentro do enum:

```ts
  KIT_ALUNO_PRESENTE = 'KIT_ALUNO_PRESENTE', // Kit Aluno Presente (400/600/800 alunos)
```

- [ ] **Step 2: Permitir `unitType` "Kit"**

Em `src/types.ts:27`, trocar:

```ts
  unitType: 'UN'; // Fixed as 'UN' from PDF for main items
```

por:

```ts
  unitType: 'UN' | 'Kit'; // 'UN' para itens padrão; 'Kit' para o template Aluno Presente
```

- [ ] **Step 3: Adicionar `kitSize` ao `Proposal`**

Em `src/types.ts`, dentro de `interface Proposal` (após a linha `metalDetectorDeviceQuantity: number;` em `:44`), adicionar:

```ts
  kitSize?: 400 | 600 | 800; // preenchido apenas no template 'aluno-presente'
```

- [ ] **Step 4: Estender `templateType` e adicionar `kitUnitPrices`**

Em `src/types.ts:70`, trocar:

```ts
  templateType?: 'standard' | 'rfid';
  mainTableTitle?: string;
```

por:

```ts
  templateType?: 'standard' | 'rfid' | 'aluno-presente';
  mainTableTitle?: string;
  kitUnitPrices?: { 400: number; 600: number; 800: number }; // valores unitários padrão por kit
```

- [ ] **Step 5: Adicionar `kitSize`/`kitQuantity` ao `ProposalInputData`**

Em `src/types.ts:83`, dentro da interseção do `ProposalInputData`, trocar:

```ts
  costVigencia?: string;
};
```

por:

```ts
  costVigencia?: string;
  kitSize?: 400 | 600 | 800;
  kitQuantity?: number;
};
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (sem erros novos relacionados a `types.ts`). Pode haver erros temporários em `constants.ts`/componentes que serão resolvidos nas próximas tasks — confirme que nenhum erro aponta para tipos malformados em `types.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts
git commit -m "feat(types): tipos do template Aluno Presente (kit + kitUnitPrices)"
```

---

### Task 2: Config e descrição dos kits em `constants.ts`

**Files:**
- Modify: `src/constants.ts`

- [ ] **Step 1: Adicionar `kitUnitPrices` aos settings iniciais**

Em `src/constants.ts:29`, dentro de `INITIAL_TEMPLATE_SETTINGS`, após a linha `mainTableTitle: 'Equipamentos, Instalações e Licenças',` adicionar (antes do `};` que fecha o objeto):

```ts
  kitUnitPrices: { 400: 33670, 600: 48370, 800: 55070 },
```

- [ ] **Step 2: Adicionar definição dos kits e o builder da descrição**

Em `src/constants.ts`, logo após o objeto `INITIAL_TEMPLATE_SETTINGS` (após o `};` da linha ~30), adicionar:

```ts
export interface KitDefinition {
  alunos: number;
  alunosExtenso: string;
  equip: number;       // nº de equipamentos
  equipExtenso: string;
}

export const KIT_DEFINITIONS: Record<400 | 600 | 800, KitDefinition> = {
  400: { alunos: 400, alunosExtenso: 'quatrocentos', equip: 2, equipExtenso: 'dois' },
  600: { alunos: 600, alunosExtenso: 'seiscentos', equip: 3, equipExtenso: 'três' },
  800: { alunos: 800, alunosExtenso: 'oitocentos', equip: 4, equipExtenso: 'quatro' },
};

// Descrição da coluna "Descrição" da Tabela 2, parametrizada pelo kit.
// Os "extensos" (alunos/equipamentos) são fixos por kit — sem cálculo de extenso.
export const buildKitDescription = (size: 400 | 600 | 800): string => {
  const k = KIT_DEFINITIONS[size];
  const equipStr = String(k.equip).padStart(2, '0'); // "02", "03", "04"
  return `Aquisição de kit de solução tecnológica integrada para registro e gestão da frequência de até ${k.alunos} (${k.alunosExtenso}) alunos em 01 (uma) unidade de ensino, composto por ${equipStr} (${k.equipExtenso}) equipamentos de reconhecimento biométrico facial e licença de uso de sistema de gestão em ambiente web, contemplando, adicionalmente, os serviços de hospedagem, atualizações e envio de alertas pelo período de 12 (doze) meses.`;
};
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS para `constants.ts` (o `kitUnitPrices` agora satisfaz o tipo de `TemplateSettings`).

- [ ] **Step 4: Commit**

```bash
git add src/constants.ts
git commit -m "feat(constants): KIT_DEFINITIONS, buildKitDescription e kitUnitPrices padrão"
```

---

### Task 3: Opção e preços do kit no `TemplateEditorView`

**Files:**
- Modify: `src/components/TemplateEditorView.tsx`

- [ ] **Step 1: Adicionar handler de preço de kit**

Em `src/components/TemplateEditorView.tsx`, após `handleUnitPriceChange` (termina em `:87`), adicionar:

```ts
  const handleKitPriceChange = (size: 400 | 600 | 800, value: number) => {
    setSettings(prev => ({
      ...prev,
      kitUnitPrices: {
        ...(prev.kitUnitPrices ?? { 400: 0, 600: 0, 800: 0 }),
        [size]: value,
      },
    }));
  };
```

- [ ] **Step 2: Adicionar a opção "Aluno Presente" no seletor de tipo**

Em `src/components/TemplateEditorView.tsx:193`, após a linha `<option value="rfid">RFID</option>`, adicionar:

```tsx
            <option value="aluno-presente">Aluno Presente</option>
```

- [ ] **Step 3: Renderizar os 3 inputs de preço quando for "aluno-presente"**

Em `src/components/TemplateEditorView.tsx`, logo após o fechamento do bloco condicional do rfid (o `)}` que encerra `{(settings.templateType === 'rfid') && ( ... )}`, em `:209`), adicionar:

```tsx
        {(settings.templateType === 'aluno-presente') && (
          <div className="mb-4 border border-gray-200 rounded-md p-3 bg-slate-50">
            <p className="text-sm font-medium text-gray-700 mb-2">Valores unitários padrão dos Kits (R$)</p>
            <NumberInputField label="Kit 400 alunos" step="1" value={settings.kitUnitPrices?.[400] ?? 0} onChange={v => handleKitPriceChange(400, v)} />
            <NumberInputField label="Kit 600 alunos" step="1" value={settings.kitUnitPrices?.[600] ?? 0} onChange={v => handleKitPriceChange(600, v)} />
            <NumberInputField label="Kit 800 alunos" step="1" value={settings.kitUnitPrices?.[800] ?? 0} onChange={v => handleKitPriceChange(800, v)} />
          </div>
        )}
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS. `NumberInputField` já está definido no arquivo (`:40`) e aceita `step`.

- [ ] **Step 5: Commit**

```bash
git add src/components/TemplateEditorView.tsx
git commit -m "feat(editor): opção Aluno Presente + edição dos 3 preços de kit"
```

---

### Task 4: Branch do formulário no `ProposalView` (seleção de kit + Qtd)

**Files:**
- Modify: `src/components/ProposalView.tsx`

- [ ] **Step 1: Inicializar `kitSize`/`kitQuantity` no `useState` inicial**

Em `src/components/ProposalView.tsx`, no objeto inicial do `useState` (`:42-43`), trocar:

```ts
      includeMetalDetectorDevice: false,
      metalDetectorDeviceQuantity: 0,
    });
```

por:

```ts
      includeMetalDetectorDevice: false,
      metalDetectorDeviceQuantity: 0,
      kitSize: undefined,
      kitQuantity: 0,
    });
```

- [ ] **Step 2: Inicializar `kitSize`/`kitQuantity` no `resetForm`**

Em `src/components/ProposalView.tsx`, dentro de `resetForm` (`:66-67`), trocar:

```ts
      includeMetalDetectorDevice: false,
      metalDetectorDeviceQuantity: 0,
    });
    setCurrentProposal(null);
```

por:

```ts
      includeMetalDetectorDevice: false,
      metalDetectorDeviceQuantity: 0,
      kitSize: undefined,
      kitQuantity: 0,
    });
    setCurrentProposal(null);
```

- [ ] **Step 3: Reconstruir `kitSize`/`kitQuantity` ao editar proposta existente**

Em `src/components/ProposalView.tsx`, no bloco `else if (existingProposal)` (`:110-112`), trocar:

```ts
        includeMetalDetectorDevice: existingProposal.includeMetalDetectorDevice,
        metalDetectorDeviceQuantity: existingProposal.metalDetectorDeviceQuantity,
      });
```

por:

```ts
        includeMetalDetectorDevice: existingProposal.includeMetalDetectorDevice,
        metalDetectorDeviceQuantity: existingProposal.metalDetectorDeviceQuantity,
        kitSize: existingProposal.kitSize,
        kitQuantity: existingProposal.items.find(i => i.category === ProposalItemCategory.KIT_ALUNO_PRESENTE)?.quantity || 0,
      });
```

- [ ] **Step 4: Adicionar o branch de form do kit**

Em `src/components/ProposalView.tsx:311`, trocar a abertura do ternário:

```tsx
        {templateSettings.templateType === 'rfid' ? (
```

por:

```tsx
        {templateSettings.templateType === 'aluno-presente' ? (
          <>
            <h3 className="text-lg font-semibold text-gray-800 pt-4 border-t mt-6">Kit Aluno Presente</h3>
            <div>
              <label htmlFor="kitSize" className="block text-sm font-medium text-gray-700">Kit</label>
              <select
                id="kitSize"
                value={formData.kitSize ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, kitSize: (e.target.value ? Number(e.target.value) : undefined) as 400 | 600 | 800 | undefined }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              >
                <option value="">Selecione o kit...</option>
                <option value="400">Kit 400 alunos (2 equipamentos)</option>
                <option value="600">Kit 600 alunos (3 equipamentos)</option>
                <option value="800">Kit 800 alunos (4 equipamentos)</option>
              </select>
            </div>
            <div>
              <label htmlFor="kitQuantity" className="block text-sm font-medium text-gray-700">Qtde. de Kits</label>
              <input
                type="number"
                id="kitQuantity"
                min="0"
                value={formData.kitQuantity || 0}
                onChange={e => setFormData(prev => ({ ...prev, kitQuantity: parseInt(e.target.value, 10) || 0 }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>
            {formData.kitSize && (
              <p className="text-xs text-gray-600 mt-1">
                Valor unitário: {formatCurrency(templateSettings.kitUnitPrices?.[formData.kitSize] ?? 0)}
              </p>
            )}
          </>
        ) : templateSettings.templateType === 'rfid' ? (
```

> Observação: isto transforma o `if/else` (rfid vs. padrão) em `aluno-presente` → `rfid` → padrão. O restante do ternário (blocos rfid e padrão) permanece inalterado.

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS. `formatCurrency` já está importado (`:5`).

- [ ] **Step 6: Commit**

```bash
git add src/components/ProposalView.tsx
git commit -m "feat(proposal): formulário do kit (seleção 400/600/800 + Qtd) no modo Aluno Presente"
```

---

### Task 5: Cálculo do kit em `calculateProposal`

**Files:**
- Modify: `src/components/ProposalView.tsx`

- [ ] **Step 1: Adicionar o branch do kit no topo de `calculateProposal`**

Em `src/components/ProposalView.tsx:128`, logo após a linha `const calculateProposal = useCallback(() => {`, inserir (antes da linha `const items: ProposalItem[] = PROPOSAL_ITEM_DEFINITIONS.map(...)`):

```ts
    if (templateSettings.templateType === 'aluno-presente') {
      const size = formData.kitSize;
      const qty = formData.kitQuantity || 0;
      const unitPrice = size ? (templateSettings.kitUnitPrices?.[size] ?? 0) : 0;
      const kitItem: ProposalItem = {
        id: 'kit-aluno-presente',
        itemNumber: '1',
        name: size ? buildKitDescription(size) : '',
        category: ProposalItemCategory.KIT_ALUNO_PRESENTE,
        quantity: qty,
        unitPrice,
        totalPrice: qty * unitPrice,
        unitType: 'Kit',
      };
      const kitProposal: Proposal = {
        id: isEditing && existingProposal ? existingProposal.id : uuidv4(),
        clientName: formData.clientName.toUpperCase(),
        proposalLocation: formData.proposalLocation,
        proposalDate: formData.proposalDate,
        items: [kitItem],
        includeSupportServices: false,
        supportNumSchools: 0,
        firstYearInvestment: kitItem.totalPrice,
        createdAt: isEditing && existingProposal ? existingProposal.createdAt : new Date().toISOString(),
        costVigencia: formData.costVigencia || '',
        includeMetalDetectorDevice: false,
        metalDetectorDeviceQuantity: 0,
        ...(size ? { kitSize: size } : {}),
      };
      setCurrentProposal(kitProposal);
      return;
    }

```

> `supportMonthlyTotal`/`supportAnnualTotal` são omitidos de propósito (campos opcionais) para não gravar `undefined` no Firestore. `kitSize` é incluído via spread só quando definido, pela mesma razão.

- [ ] **Step 2: Importar `buildKitDescription`**

Em `src/components/ProposalView.tsx:4`, trocar:

```ts
import { PROPOSAL_ITEM_DEFINITIONS, SUPPORT_ITEM_CATEGORY, SUPPORT_SERVICE_DESCRIPTION_TEMPLATE } from '../constants';
```

por:

```ts
import { PROPOSAL_ITEM_DEFINITIONS, SUPPORT_ITEM_CATEGORY, SUPPORT_SERVICE_DESCRIPTION_TEMPLATE, buildKitDescription } from '../constants';
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS. O `useCallback` de `calculateProposal` já depende de `[formData, templateSettings, isEditing, existingProposal]` (`:175`), cobrindo `formData.kitSize`/`kitQuantity` e `templateSettings.kitUnitPrices`.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProposalView.tsx
git commit -m "feat(proposal): cálculo do kit (item único, total = Qtd x unitário) no modo Aluno Presente"
```

---

### Task 6: Preview, título efetivo e guarda da projeção em `ProposalView`

**Files:**
- Modify: `src/components/ProposalView.tsx`

- [ ] **Step 1: Título efetivo da tabela principal no preview**

Em `src/components/ProposalView.tsx:468`, trocar:

```tsx
                  <th colSpan={6} className={`${tableTitleCellStyles} border ${borderColor}`}>{templateSettings.mainTableTitle || 'Equipamentos, Instalações e Licenças'}</th>
```

por:

```tsx
                  <th colSpan={6} className={`${tableTitleCellStyles} border ${borderColor}`}>{templateSettings.mainTableTitle || (templateSettings.templateType === 'aluno-presente' ? 'Especificações e valores' : 'Equipamentos, Instalações e Licenças')}</th>
```

> O kit renderiza automaticamente na tabela de preview: `orderedItems.filter(item => item.quantity > 0)` (`:480`) inclui o item do kit (categoria não listada no `sort` → vai para o início; com 1 item é indiferente), e a coluna "Unid." mostra `item.unitType` = "Kit".

- [ ] **Step 2: Guardar a projeção financeira no modo kit**

Em `src/components/ProposalView.tsx:558`, trocar:

```ts
    if (templateSettings.templateType === 'rfid') {
      return <div className="p-6 text-gray-500">Projeção financeira não disponível para este template.</div>;
    }
```

por:

```ts
    if (templateSettings.templateType === 'rfid' || templateSettings.templateType === 'aluno-presente') {
      return <div className="p-6 text-gray-500">Projeção financeira não disponível para este template.</div>;
    }
```

> Isso evita a lógica de 6 custos vigentes (`:570`), que não se aplica ao kit.

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProposalView.tsx
git commit -m "feat(proposal): preview do kit (título 'Especificações e valores') + guarda da projeção financeira"
```

---

### Task 7: Título efetivo no PDF (`pdfGenerator`)

**Files:**
- Modify: `src/services/pdfGenerator.ts`

- [ ] **Step 1: Título efetivo da tabela principal no PDF**

Em `src/services/pdfGenerator.ts:177`, trocar:

```ts
  const mainItemsTableTitle = settings.mainTableTitle || 'Equipamentos, Instalações e Licenças';
```

por:

```ts
  const mainItemsTableTitle = settings.mainTableTitle || (settings.templateType === 'aluno-presente' ? 'Especificações e valores' : 'Equipamentos, Instalações e Licenças');
```

- [ ] **Step 2: Incluir o kit na ordenação de itens do PDF**

Em `src/services/pdfGenerator.ts:191`, dentro do array `order` do `orderedItems.sort`, após a linha `ProposalItemCategory.RFID_CARD,` adicionar:

```ts
      ProposalItemCategory.KIT_ALUNO_PRESENTE,
```

> O corpo da tabela (`mainItemsBody`, `:195`) já lê `item.unitType`, então a coluna "Unid." mostra "Kit". O rodapé "Investimento primeiro ano:" é mantido (ajuste de label fica para depois, se o cliente pedir).

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/services/pdfGenerator.ts
git commit -m "feat(pdf): título 'Especificações e valores' e ordenação do kit no template Aluno Presente"
```

---

### Task 8: Verificação manual ponta a ponta

**Files:** nenhum (verificação)

- [ ] **Step 1: Subir o app**

Run: `npm run dev`
Abrir a URL local exibida (Vite, normalmente `http://localhost:5173`).

- [ ] **Step 2: Criar o template "Aluno Presente"**

Na tela de Templates: criar/editar um template, selecionar **Tipo de Template = "Aluno Presente"**. Confirmar que aparecem os 3 campos de preço com defaults **33670 / 48370 / 55070**. Salvar.

- [ ] **Step 3: Criar uma proposta com esse template**

Em Nova Proposta com o template "Aluno Presente": confirmar que o formulário mostra **seletor de Kit** (400/600/800) + **Qtde. de Kits**, e NÃO mostra as categorias de presença/detector/suporte. Escolher "Kit 400 alunos", digitar Qtde = 2.

- [ ] **Step 4: Conferir o preview**

Aba de preview: a tabela tem título **"Especificações e valores"**, 1 linha com **Unid. = Kit**, **Qtde. = 2**, Descrição do kit 400 (com "quatrocentos" e "02 (dois)"), **Valor Unitário = R$ 33.670,00**, **Valor Total = R$ 67.340,00**, e rodapé com o total.

- [ ] **Step 5: Trocar o kit e revalidar**

Trocar para "Kit 800 alunos": a descrição passa a "oitocentos"/"04 (quatro)", valor unitário **R$ 55.070,00**, total recalculado.

- [ ] **Step 6: Gerar o PDF**

Gerar o PDF e abrir: a Tabela 2 aparece com as mesmas colunas/valores do preview.

- [ ] **Step 7: Não-regressão dos templates existentes**

Criar/abrir uma proposta com um template **standard** e um **rfid** e confirmar que continuam funcionando como antes (tabelas, suporte, projeção financeira no standard).

- [ ] **Step 8: Commit final (se houver ajustes manuais)**

Se algum ajuste foi necessário durante a verificação, commitar. Caso contrário, a feature está pronta no branch `feat/template-aluno-presente`.

---

## Self-review (cobertura × spec)

- **Escopo só comercial** → Tasks 5–7 (item único + tabela; sem TR longo). ✓
- **3 kits 400/600/800 (2/3/4 equip), preços editáveis** → Task 2 (`KIT_DEFINITIONS`, `kitUnitPrices`) + Task 3 (edição). ✓
- **Escolhe kit + digita Qtd; unitário do sistema; total calculado** → Task 4 (form) + Task 5 (cálculo). ✓
- **Tabela 2 (Item|Unid.|Qtd.|Descrição|Valor unit.|Valor total), Unid=Kit** → Tasks 6–7 (preview + PDF; `unitType: 'Kit'`). ✓
- **Descrição com extensos fixos (alunos/equip), sem extenso monetário** → Task 2 (`buildKitDescription`). ✓
- **Roda no Firebase/Vercel atual, sem migração; retrocompatível** → campos opcionais (Task 1); sem `undefined` no Firestore (Task 5). ✓
- **Critério: templates standard/rfid intactos** → Task 8 Step 7. ✓
