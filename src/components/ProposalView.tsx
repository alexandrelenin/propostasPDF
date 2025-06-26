import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Proposal, TemplateSettings, ProposalItem, ProposalItemCategory, ProposalInputData, ProposalItemConfigEntry } from '../types';
import { PROPOSAL_ITEM_DEFINITIONS, SUPPORT_ITEM_CATEGORY, SUPPORT_SERVICE_DESCRIPTION_TEMPLATE } from '../constants';
import { formatCurrency, formatDateForDisplay, getCurrentDateISO } from '../utils/formatters';
// import { generatePdfFromElement } from '../services/pdfGenerator'; // Old way
import { generateProposalPdf } from '../services/pdfGenerator'; // New programmatic way

interface ProposalViewProps {
  templateSettings: TemplateSettings;
  onSaveProposal: (proposal: Proposal) => void;
  existingProposal?: Proposal | null;
  onNavigateToSaved: () => void;
  onShowMessage: (msg: string, type: 'success' | 'error') => void;
}

const ProposalView: React.FC<ProposalViewProps> = ({ templateSettings, onSaveProposal, existingProposal, onNavigateToSaved, onShowMessage }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [formData, setFormData] = useState<ProposalInputData>({
    clientName: '',
    proposalLocation: 'Uberlândia', 
    proposalDate: getCurrentDateISO(),
    itemQuantities: {
      [ProposalItemCategory.ELECTRONIC_DEVICE]: 0,
      [ProposalItemCategory.INSTALLATION_SERVICES]: 0,
      [ProposalItemCategory.STUDENT_LICENSE]: 0,
      [ProposalItemCategory.SERVER_LICENSE]: 0,
    },
    includeSupportServices: true,
    supportNumSchools: 0, 
  });

  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const resetForm = useCallback(() => {
    setFormData({
      clientName: '',
      proposalLocation: 'Uberlândia',
      proposalDate: getCurrentDateISO(),
      itemQuantities: {
        [ProposalItemCategory.ELECTRONIC_DEVICE]: 0,
        [ProposalItemCategory.INSTALLATION_SERVICES]: 0,
        [ProposalItemCategory.STUDENT_LICENSE]: 0,
        [ProposalItemCategory.SERVER_LICENSE]: 0,
      },
      includeSupportServices: true,
      supportNumSchools: 0,
    });
    setCurrentProposal(null);
    setIsEditing(false);
    setActiveTab('form'); 
  }, []);
  
  useEffect(() => {
    if (existingProposal) {
      setFormData({
        clientName: existingProposal.clientName,
        proposalLocation: existingProposal.proposalLocation,
        proposalDate: existingProposal.proposalDate,
        itemQuantities: {
          [ProposalItemCategory.ELECTRONIC_DEVICE]: existingProposal.items.find(item => item.category === ProposalItemCategory.ELECTRONIC_DEVICE)?.quantity || 0,
          [ProposalItemCategory.INSTALLATION_SERVICES]: existingProposal.items.find(item => item.category === ProposalItemCategory.INSTALLATION_SERVICES)?.quantity || 0,
          [ProposalItemCategory.STUDENT_LICENSE]: existingProposal.items.find(item => item.category === ProposalItemCategory.STUDENT_LICENSE)?.quantity || 0,
          [ProposalItemCategory.SERVER_LICENSE]: existingProposal.items.find(item => item.category === ProposalItemCategory.SERVER_LICENSE)?.quantity || 0,
        },
        includeSupportServices: existingProposal.includeSupportServices,
        supportNumSchools: existingProposal.supportNumSchools,
      });
      setIsEditing(true);
      setActiveTab('form'); 
    } else {
      resetForm();
    }
  }, [existingProposal, resetForm]);

  const calculateProposal = useCallback(() => {
    const items: ProposalItem[] = PROPOSAL_ITEM_DEFINITIONS.map((itemConfig: ProposalItemConfigEntry) => {
      const quantity = formData.itemQuantities[itemConfig.category as keyof typeof formData.itemQuantities] || 0;
      const unitPrice = templateSettings.defaultUnitPrices[itemConfig.category as ProposalItemCategory];
      return {
        id: itemConfig.id,
        itemNumber: itemConfig.itemNumber,
        name: itemConfig.name, 
        category: itemConfig.category,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: quantity * unitPrice,
        unitType: 'UN',
      };
    });

    const firstYearInvestment = items.reduce((sum: number, item: ProposalItem) => sum + item.totalPrice, 0);
    let supportMonthlyTotal: number | undefined = undefined;
    let supportAnnualTotal: number | undefined = undefined;

    if (formData.includeSupportServices && formData.supportNumSchools > 0) {
      const supportMonthlyUnitPrice = templateSettings.defaultUnitPrices[SUPPORT_ITEM_CATEGORY];
      supportMonthlyTotal = formData.supportNumSchools * supportMonthlyUnitPrice;
      supportAnnualTotal = supportMonthlyTotal * 12;
    }
    
    const newProposal: Proposal = {
      id: isEditing && existingProposal ? existingProposal.id : uuidv4(),
      clientName: formData.clientName.toUpperCase(), // Client name should be what user types
      proposalLocation: formData.proposalLocation,
      proposalDate: formData.proposalDate,
      items: items,
      includeSupportServices: formData.includeSupportServices,
      supportNumSchools: formData.supportNumSchools,
      firstYearInvestment: firstYearInvestment,
      supportMonthlyTotal: supportMonthlyTotal,
      supportAnnualTotal: supportAnnualTotal,
      createdAt: isEditing && existingProposal ? existingProposal.createdAt : new Date().toISOString(),
    };
    setCurrentProposal(newProposal);

  }, [formData, templateSettings, isEditing, existingProposal]);

  useEffect(() => {
    calculateProposal();
  }, [calculateProposal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev: ProposalInputData) => ({ ...prev, [name]: checked }));
    } else if (name.startsWith('itemQuantities.')) {
      const itemCat = name.split('.')[1] as ProposalItemCategory;
      setFormData((prev: ProposalInputData) => ({
        ...prev,
        itemQuantities: {
          ...prev.itemQuantities,
          [itemCat]: parseInt(value, 10) || 0,
        }
      }));
    } else {
      setFormData((prev: ProposalInputData) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleNumberInputChange = (name: keyof Pick<ProposalInputData, 'supportNumSchools'>, value: string) => {
    setFormData((prev: ProposalInputData) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSave = () => {
    if (!currentProposal) return;
    if (!currentProposal.clientName.trim()) {
      onShowMessage("O nome do cliente (Ex: NOME DA CIDADE - UF) é obrigatório.", "error");
      setActiveTab('form');
      return;
    }
    
    const totalItemQuantities = currentProposal.items.reduce((sum: number, item: ProposalItem) => sum + item.quantity, 0);
    if (totalItemQuantities === 0 && (!currentProposal.includeSupportServices || currentProposal.supportNumSchools === 0)) {
        onShowMessage("Pelo menos um item da proposta (Equipamentos/Licenças ou Suporte) deve ter quantidade maior que zero.", "error");
        setActiveTab('form');
        return;
    }

    onSaveProposal(currentProposal);
    // Não chamar resetForm() - manter os dados na tela
    // Não chamar onNavigateToSaved() - permanecer na tela de edição
  };

  const handleGeneratePdf = async () => {
    if (!currentProposal) {
      onShowMessage("Não há dados na proposta para gerar o PDF. Por favor, preencha o formulário.", "error");
      setActiveTab('form');
      return;
    }
    if (!currentProposal.clientName.trim()) {
        onShowMessage("O nome do cliente é obrigatório para gerar o PDF.", "error");
        setActiveTab('form');
        return;
    }
    
    const fileName = `Proposta-${currentProposal.clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${currentProposal.proposalDate}`;
    try {
      await generateProposalPdf(currentProposal, templateSettings, fileName);
      onShowMessage(`PDF "${fileName}.pdf" gerado com sucesso!`, "success");
    } catch (error) {
       console.error("Erro ao gerar PDF programático:", error);
       onShowMessage(`Ocorreu um erro ao gerar o PDF: ${error instanceof Error ? error.message : String(error)}`, "error");
    }
  };
  
  const renderForm = () => (
    <div className="lg:w-full bg-white p-4 sm:p-6 shadow-lg rounded-lg overflow-y-auto">
      <h2 className="text-2xl font-bold text-sky-700 mb-6">{isEditing ? "Editar Proposta" : "Criar Nova Proposta"}</h2>
      <form className="space-y-4">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Nome do Cliente (Ex: PORTO NACIONAL - TO)</label>
          <input type="text" name="clientName" id="clientName" value={formData.clientName} onChange={handleInputChange} required
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                 placeholder="Ex: PORTO NACIONAL - TO" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="proposalLocation" className="block text-sm font-medium text-gray-700">Local da Proposta (Cidade)</label>
            <input type="text" name="proposalLocation" id="proposalLocation" value={formData.proposalLocation} onChange={handleInputChange}
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                   placeholder="Ex: Uberlândia" />
          </div>
          <div>
            <label htmlFor="proposalDate" className="block text-sm font-medium text-gray-700">Data da Proposta</label>
            <input type="date" name="proposalDate" id="proposalDate" value={formData.proposalDate} onChange={handleInputChange} required
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 pt-4 border-t mt-6">Itens da Proposta (Equipamentos, Instalações e Licenças)</h3>
        {PROPOSAL_ITEM_DEFINITIONS.map((itemConfig: ProposalItemConfigEntry) => (
          <div key={itemConfig.id}>
            <label htmlFor={`itemQuantities.${itemConfig.category}`} className="block text-sm font-medium text-gray-700">
              {`Qtde. - ${itemConfig.defaultQuantityLabel}`}
            </label>
            <p className="text-xs text-gray-500 mb-1">{itemConfig.name}</p>
            <input
              type="number"
              name={`itemQuantities.${itemConfig.category}`}
              id={`itemQuantities.${itemConfig.category}`}
              value={formData.itemQuantities[itemConfig.category as keyof typeof formData.itemQuantities] || 0}
              min="0"
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
        ))}

        <h3 className="text-lg font-semibold text-gray-800 pt-4 border-t mt-6">Serviços de Suporte</h3>
         <div className="flex items-center">
            <input type="checkbox" name="includeSupportServices" id="includeSupportServices" checked={formData.includeSupportServices} onChange={handleInputChange}
                   className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
            <label htmlFor="includeSupportServices" className="ml-2 block text-sm text-gray-900">Incluir Serviços de Suporte</label>
          </div>
          {formData.includeSupportServices && (
             <div>
              <label htmlFor="supportNumSchools" className="block text-sm font-medium text-gray-700">Qtd. Unidades da Secretaria (para Suporte)</label>
              <input type="number" name="supportNumSchools" id="supportNumSchools" value={formData.supportNumSchools} min="0"
                     onChange={(e) => handleNumberInputChange('supportNumSchools', e.target.value)}
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
          )}
      </form>
    </div>
  );

  const renderProposalPreview = () => {
    if (!currentProposal) return <div className="text-center p-8 text-gray-500">Preencha os dados na aba "Editar Dados" para visualizar a proposta.</div>;

    const { clientName, proposalLocation, proposalDate, items, includeSupportServices, supportNumSchools, supportMonthlyTotal, supportAnnualTotal, firstYearInvestment } = currentProposal;
    const { companyLogoUrl, introductoryText, contactInfo } = templateSettings;
    
    const cellBasePadding = "px-1"; // Base horizontal padding
    const descriptionCellPadding = `${cellBasePadding} py-1.5`; // Increased vertical padding for descriptions
    const regularCellPadding = `${cellBasePadding} py-1`; // Regular vertical padding - Increased
    const tableFooterCellPadding = `${cellBasePadding} py-1.5`; // Increased vertical padding for table footers

    const headerCellPadding = "px-1 py-1.5"; // Increased
    const borderColor = "border-slate-500"; 
    const commonCellStyles = `border ${borderColor} text-xs align-middle`; 
    const dataHeaderCellStyles = `${commonCellStyles} ${headerCellPadding} bg-slate-200 text-gray-700 font-semibold text-center`;
    
    // Body cell styles now differentiate padding
    const bodyCellStylesRegular = `${commonCellStyles} ${regularCellPadding} text-gray-800`;
    const bodyCellStylesDesc = `${commonCellStyles} ${descriptionCellPadding} text-gray-800`;


    const centeredNumericColumn = `${bodyCellStylesRegular} text-center`;
    const leftAlignedTextColumn = `${bodyCellStylesDesc} text-left break-words`; // Uses bodyCellStylesDesc for increased padding
    const rightAlignedTextColumn = `${bodyCellStylesRegular} text-right`;

    const tableTitleCellStyles = "text-xs font-bold text-gray-800 py-1.5 text-center uppercase tracking-wide bg-slate-300";

    const showSupportTable = includeSupportServices && supportNumSchools > 0 && supportAnnualTotal !== undefined && supportMonthlyTotal !== undefined;
    const equipTableMarginBottom = showSupportTable ? 'mb-6' : 'mb-8'; // Increased space between tables


    return (
      <div id="pdf-preview-area" className="a4-preview-container bg-white text-black print:shadow-none print:m-0 print:p-0 font-sans flex flex-col justify-between">
        {/* Main Content Wrapper (allows footer to be pushed down) */}
        <div className="flex-grow">
          {/* Header Section - Logo aligned left, title centered */}
          <header className="mb-3">
            <div className="flex items-center mt-2 mb-6"> {/* Increased mb-3 to mb-6 for space below logo */}
              {companyLogoUrl && (
                <img 
                  src={companyLogoUrl} 
                  alt="Logo da Empresa" 
                  className="h-12 object-contain mr-4" 
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none'; 
                    const parent = target.parentNode;
                    if (parent) {
                        const altText = document.createElement('p');
                        altText.textContent = 'T SMART TEC SCHOOL'; 
                        altText.className = 'font-bold text-lg text-gray-700 py-3'; 
                        parent.insertBefore(altText, target); 
                    }
                  }}
                />
              )}
            </div>
            <h1 className="text-sm font-bold uppercase text-center mt-6 mb-6">SECRETARIA MUNICIPAL DE EDUCAÇÃO {clientName}</h1>
          </header>

          <section className="mb-3">
            <p className="text-xs whitespace-pre-line text-justify leading-relaxed">{introductoryText}</p>
          </section>

          <section className={equipTableMarginBottom}>
            <table className={`min-w-full border-collapse border ${borderColor} text-xs`}>
              <thead>
                <tr>
                  <th colSpan={6} className={`${tableTitleCellStyles} border ${borderColor}`}>Equipamentos, Instalações e Licenças</th>
                </tr>
                <tr>
                  <th className={`${dataHeaderCellStyles} w-[4%]`}>Item</th>
                  <th className={`${dataHeaderCellStyles} w-[4%]`}>Unid.</th>
                  <th className={`${dataHeaderCellStyles} w-[6%]`}>Qtde.</th>
                  <th className={`${dataHeaderCellStyles} w-[50%] text-left`}>Descrição</th>
                  <th className={`${dataHeaderCellStyles} w-[18%]`}>Valor Unitário</th>
                  <th className={`${dataHeaderCellStyles} w-[18%]`}>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: ProposalItem) => (
                  <tr key={item.id} className="bg-white even:bg-slate-50">
                    <td className={centeredNumericColumn}>{item.itemNumber}</td>
                    <td className={centeredNumericColumn}>{item.unitType}</td>
                    <td className={centeredNumericColumn}>{item.quantity}</td>
                    <td className={leftAlignedTextColumn}>{item.name}</td>
                    <td className={rightAlignedTextColumn}>{formatCurrency(item.unitPrice)}</td>
                    <td className={rightAlignedTextColumn}>{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-semibold bg-slate-100">
                <tr>
                  <td colSpan={5} className={`${rightAlignedTextColumn} font-bold ${tableFooterCellPadding}`}>Investimento primeiro ano:</td>
                  <td className={`${rightAlignedTextColumn} font-bold ${tableFooterCellPadding}`}>{formatCurrency(firstYearInvestment)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          {showSupportTable && (
            <section className="mb-8"> 
              <table className={`min-w-full border-collapse border ${borderColor} text-xs`}>
                <thead>
                  <tr>
                    <th colSpan={7} className={`${tableTitleCellStyles} border ${borderColor}`}>Serviços de Suporte</th>
                  </tr>
                  <tr>
                    <th className={`${dataHeaderCellStyles} w-[4%]`}>Item</th>
                    <th className={`${dataHeaderCellStyles} w-[4%]`}>Unid.</th>
                    <th className={`${dataHeaderCellStyles} w-[6%]`}>Qtde.</th>
                    <th className={`${dataHeaderCellStyles} w-[42%] text-left`}>Descrição</th>
                    <th className={`${dataHeaderCellStyles} w-[14%]`}>Valor Unitário Mensal</th>
                    <th className={`${dataHeaderCellStyles} w-[15%]`}>Valor Total Mensal</th>
                    <th className={`${dataHeaderCellStyles} w-[15%]`}>Valor Total Anual</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className={centeredNumericColumn}>5</td>
                    <td className={centeredNumericColumn}>UN</td>
                    <td className={centeredNumericColumn}>{supportNumSchools}</td>
                    <td className={leftAlignedTextColumn}>{SUPPORT_SERVICE_DESCRIPTION_TEMPLATE(supportNumSchools)}</td>
                    <td className={rightAlignedTextColumn}>{formatCurrency(templateSettings.defaultUnitPrices[SUPPORT_ITEM_CATEGORY])}</td>
                    <td className={rightAlignedTextColumn}>{formatCurrency(supportMonthlyTotal!)}</td>
                    <td className={rightAlignedTextColumn}>{formatCurrency(supportAnnualTotal!)}</td>
                  </tr>
                </tbody>
                <tfoot className="font-semibold bg-slate-100">
                  <tr>
                    <td colSpan={6} className={`${rightAlignedTextColumn} font-bold ${tableFooterCellPadding}`}>Total Anual (Serviços de Suporte):</td>
                    <td className={`${rightAlignedTextColumn} font-bold ${tableFooterCellPadding}`}>{formatCurrency(supportAnnualTotal!)}</td>
                  </tr>
                </tfoot>
              </table>
            </section>
          )}

          {/* Bloco de local/data e rodapé */}
          <section className="mb-6 mt-8">
            <p className="text-xs whitespace-pre-line text-left leading-relaxed">
              {formatDateForDisplay(proposalDate, proposalLocation)}
            </p>
          </section>

          <footer className="mt-auto pt-4 pb-2 text-[9px] text-gray-700">
            <p className="text-center text-[8.5px] leading-tight">{contactInfo.address}</p>
            <p className="text-center text-[8.5px] leading-tight mt-0.5">
              Telefone: {contactInfo.phone} – CNPJ: {contactInfo.cnpj}
            </p>
          </footer>
        </div>
      </div>
    );
  };

  const tabButtonClass = (tab: string) => `px-4 py-2 bg-slate-200 text-gray-700 rounded-md ${activeTab === tab ? 'bg-sky-100' : ''}`;

  return (
    <div className="flex flex-col h-[calc(100vh-theme(space.12))]">
      <div className="px-4 md:px-6 pt-3 border-b border-gray-200 bg-slate-50 no-print">
        <nav className="flex space-x-1 sm:space-x-4" aria-label="Tabs">
          <button onClick={() => setActiveTab('form')} className={tabButtonClass('form')}>
            Editar Dados
          </button>
          <button onClick={() => setActiveTab('preview')} className={tabButtonClass('preview')}>
            Visualizar Proposta (HTML)
          </button>
        </nav>
      </div>

      <div className={`flex-grow overflow-y-auto p-1 md:p-2 ${activeTab === 'preview' ? 'bg-slate-300' : 'bg-slate-100'}`}> 
        {activeTab === 'form' && renderForm()}
        {activeTab === 'preview' && renderProposalPreview()}
      </div>
      
      <div className="p-3 bg-white border-t border-gray-200 shadow-md no-print">
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <button type="button" onClick={handleSave} className="w-full sm:w-auto order-1 px-5 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition duration-150 text-sm">
              {isEditing ? "Atualizar Proposta" : "Salvar Proposta"}
            </button>
            <button type="button" onClick={handleGeneratePdf} className="w-full sm:w-auto order-2 px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 text-sm">
              Gerar PDF (Programático)
            </button>
            {isEditing ? (
                 <button type="button" onClick={() => { resetForm(); onNavigateToSaved(); }} className="w-full sm:w-auto order-last sm:order-3 px-5 py-2 bg-gray-500 text-white font-semibold rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-150 text-sm">
                    Cancelar Edição
                 </button>
            ) : (
                 <button type="button" onClick={resetForm} className="w-full sm:w-auto order-last sm:order-3 px-5 py-2 bg-amber-600 text-white font-semibold rounded-md shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition duration-150 text-sm">
                    Limpar Formulário
                 </button>
            )}
          </div>
      </div>
    </div>
  );
};

export default ProposalView;