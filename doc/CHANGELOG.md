# Changelog

## 2026-04-15 — Template RFID: Cartão de Proximidade

**Plano:** `clever-dazzling-clover.md`

**Commits:** `df89566` → `85dd510` (main)

### O que foi implementado

Nova categoria de template (`templateType: 'rfid'`) que gera propostas com um único item — Cartão de Proximidade RFID — sem serviços de suporte e sem validação de custo vigente.

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/types.ts` | `RFID_CARD` no enum, `defaultUnitPrices`, `templateType`, `mainTableTitle` em `TemplateSettings` e `ProposalInputData` |
| `src/constants.ts` | Item RFID em `PROPOSAL_ITEM_DEFINITIONS`, preço default `0`, `templateType: 'standard'`, `mainTableTitle` |
| `src/services/pdfGenerator.ts` | RFID na ordenação da tabela, `mainTableTitle` configurável via settings |
| `src/components/ProposalView.tsx` | Formulário condicional (só mostra campo RFID quando `templateType === 'rfid'`), bypass da validação de custo, projeção financeira desabilitada para RFID, título da tabela dinâmico no preview |
| `src/components/TemplateEditorView.tsx` | Campo `templateType` (select Padrão/RFID), campo `mainTableTitle` (visível só quando RFID) |

### Fluxo do usuário

1. Templates → Duplicar template padrão
2. Editar → Tipo: "RFID" → Título da tabela: ex. "Cartão de Proximidade RFID" → Preço RFID
3. Salvar
4. Na tela de proposta, selecionar template RFID → só aparece campo de quantidade RFID
5. Gerar PDF → tabela com título configurado, 1 linha RFID
