import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Proposal, Template, ProposalItem, ProposalItemCategory, ProposalInputData, ProposalItemConfigEntry, Cost, SavedProposalMeta } from '../types';
import { PROPOSAL_ITEM_DEFINITIONS, SUPPORT_ITEM_CATEGORY, SUPPORT_SERVICE_DESCRIPTION_TEMPLATE } from '../constants';
import { formatCurrency, formatDateForDisplay, getCurrentDateISO } from '../utils/formatters';
// import { generatePdfFromElement } from '../services/pdfGenerator'; // Old way
import { generateProposalPdf } from '../services/pdfGenerator'; // New programmatic way
import { getAllCosts } from '../services/costService';
import { saveProposal } from '../services/proposalService';
import SavedProposalsView from './SavedProposalsView';
import AudioUpload from './AudioUpload';

interface ProposalViewProps {
  templateSettings: Template;
  allTemplates: Template[];
  onTemplateChange: (templateId: string) => Promise<void>;
  onSaveProposal: (proposal: Proposal) => void;
  existingProposal?: Proposal | null;
  onNavigateToSaved: () => void;
  onShowMessage: (message: string, type?: 'success' | 'error' | 'info') => void;
  savedProposalsMeta: SavedProposalMeta[];
  onViewProposal: (id: string) => void;
  onDeleteProposal: (id: string) => void;
}

const ProposalView: React.FC<ProposalViewProps> = ({ templateSettings, allTemplates, onTemplateChange, onSaveProposal, existingProposal, onNavigateToSaved, onShowMessage, savedProposalsMeta, onViewProposal, onDeleteProposal }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'finance'>('form');
  const [formData, setFormData] = useState<ProposalInputData>({
    clientName: '',
    proposalLocation: 'Uberlândia', 
    proposalDate: getCurrentDateISO(),
    itemQuantities: {
      [ProposalItemCategory.ELECTRONIC_DEVICE]: 0,
      [ProposalItemCategory.INSTALLATION_SERVICES]: 0,
      [ProposalItemCategory.STUDENT_LICENSE]: 0,
      [ProposalItemCategory.SERVER_LICENSE]: 0,
      [ProposalItemCategory.METAL_DETECTOR_DEVICE]: 0,
      [ProposalItemCategory.RFID_CARD]: 0,
    },
    includeSupportServices: true,
    supportNumSchools: 0,
    includeMetalDetectorDevice: false,
    metalDetectorDeviceQuantity: 0,
  });

  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [internalTab, setInternalTab] = useState<'atuais' | 'salvas' | 'audio'>('atuais');

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
        [ProposalItemCategory.METAL_DETECTOR_DEVICE]: 0,
        [ProposalItemCategory.RFID_CARD]: 0,
      },
      includeSupportServices: true,
      supportNumSchools: 0,
      includeMetalDetectorDevice: false,
      metalDetectorDeviceQuantity: 0,
    });
    setCurrentProposal(null);
    setIsEditing(false);
    setActiveTab('form'); 
  }, []);
  
  useEffect(() => {
    // Preenchimento automático a partir do áudio
    const audioData = localStorage.getItem('proposta_audio');
    if (audioData) {
      try {
        const parsed = JSON.parse(audioData);
        setFormData(prev => ({
          ...prev,
          clientName: parsed.cidade || '',
          proposalLocation: templateSettings.cidadeUf || '',
          itemQuantities: {
            [ProposalItemCategory.ELECTRONIC_DEVICE]: parsed.numeros[0] || 0,
            [ProposalItemCategory.INSTALLATION_SERVICES]: parsed.numeros[1] || 0,
            [ProposalItemCategory.STUDENT_LICENSE]: parsed.numeros[2] || 0,
            [ProposalItemCategory.SERVER_LICENSE]: parsed.numeros[3] || 0,
          },
          includeSupportServices: true,
          supportNumSchools: parsed.numeros[4] || 0,
        }));
      } catch {}
      localStorage.removeItem('proposta_audio');
    } else if (existingProposal) {
      setFormData({
        clientName: existingProposal.clientName,
        proposalLocation: existingProposal.proposalLocation,
        proposalDate: existingProposal.proposalDate,
        itemQuantities: {
          [ProposalItemCategory.ELECTRONIC_DEVICE]: existingProposal.items.find(item => item.category === ProposalItemCategory.ELECTRONIC_DEVICE)?.quantity || 0,
          [ProposalItemCategory.INSTALLATION_SERVICES]: existingProposal.items.find(item => item.category === ProposalItemCategory.INSTALLATION_SERVICES)?.quantity || 0,
          [ProposalItemCategory.STUDENT_LICENSE]: existingProposal.items.find(item => item.category === ProposalItemCategory.STUDENT_LICENSE)?.quantity || 0,
          [ProposalItemCategory.SERVER_LICENSE]: existingProposal.items.find(item => item.category === ProposalItemCategory.SERVER_LICENSE)?.quantity || 0,
          [ProposalItemCategory.METAL_DETECTOR_DEVICE]: existingProposal.items.find(item => item.category === ProposalItemCategory.METAL_DETECTOR_DEVICE)?.quantity || 0,
          [ProposalItemCategory.RFID_CARD]: existingProposal.items.find(item => item.category === ProposalItemCategory.RFID_CARD)?.quantity || 0,
        },
        includeSupportServices: existingProposal.includeSupportServices,
        supportNumSchools: existingProposal.supportNumSchools,
        includeMetalDetectorDevice: existingProposal.includeMetalDetectorDevice,
        metalDetectorDeviceQuantity: existingProposal.metalDetectorDeviceQuantity,
      });
      setIsEditing(true);
      setActiveTab('form'); 
    } else {
      resetForm();
    }
  }, [existingProposal, resetForm, templateSettings]);

  useEffect(() => {
    async function fetchCosts() {
      const all = await getAllCosts();
      setCosts(all);
    }
    fetchCosts();
  }, []);

  const calculateProposal = useCallback(() => {
    const items: ProposalItem[] = PROPOSAL_ITEM_DEFINITIONS.map((itemConfig: ProposalItemConfigEntry) => {
      let quantity = formData.itemQuantities[itemConfig.category as keyof typeof formData.itemQuantities] || 0;
      if (itemConfig.category === ProposalItemCategory.METAL_DETECTOR_DEVICE) {
        quantity = formData.includeMetalDetectorDevice ? formData.metalDetectorDeviceQuantity : 0;
      }
      const unitPrice = templateSettings.defaultUnitPrices[itemConfig.category as ProposalItemCategory] ?? 0;
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
      costVigencia: formData.costVigencia || '',
      includeMetalDetectorDevice: formData.includeMetalDetectorDevice,
      metalDetectorDeviceQuantity: formData.metalDetectorDeviceQuantity,
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
    // Para template RFID, salvar sem validação de custo vigente
    if (templateSettings.templateType === 'rfid') {
      onSaveProposal({ ...currentProposal, costVigencia: '' });
      return;
    }
    // Buscar vigência de custo vigente para a data da proposta
    const vigente = costs
      .filter(c => c.vigenciaInicio <= currentProposal.proposalDate)
      .sort((a, b) => b.vigenciaInicio.localeCompare(a.vigenciaInicio))[0];
    if (!vigente) {
      onShowMessage("Não há custo vigente cadastrado para a data da proposta.", "error");
      return;
    }
    const custosVigentes = costs.filter(c => c.vigenciaInicio === vigente.vigenciaInicio && c.id.endsWith(`-${vigente.vigenciaInicio}`));
    if (custosVigentes.length !== 6) {
      onShowMessage("Não foi possível encontrar todos os custos da vigência associada.", "error");
      return;
    }
    const proposalWithCost = { ...currentProposal, costVigencia: vigente.vigenciaInicio };
    onSaveProposal(proposalWithCost);
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
      
      {/* Seletor de Template */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <label htmlFor="templateSelect" className="block text-sm font-medium text-gray-700 mb-2">
          Template da Proposta
        </label>
        <select
          id="templateSelect"
          value={templateSettings.id}
          onChange={(e) => onTemplateChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          {allTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} {template.isDefault ? '(Padrão)' : ''}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Template selecionado: <span className="font-medium">{templateSettings.name}</span>
          {templateSettings.isDefault && <span className="text-sky-600 ml-1">(Padrão)</span>}
        </p>
      </div>
      
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

        {templateSettings.templateType === 'rfid' ? (
          <>
            <h3 className="text-lg font-semibold text-gray-800 pt-4 border-t mt-6">Cartão de Proximidade RFID</h3>
            {PROPOSAL_ITEM_DEFINITIONS.filter(item => item.category === ProposalItemCategory.RFID_CARD).map((itemConfig: ProposalItemConfigEntry) => (
              <div key={itemConfig.id}>
                <label htmlFor={`itemQuantities.${itemConfig.category}`} className="block text-sm font-medium text-gray-700">
                  {`Qtde. - ${itemConfig.defaultQuantityLabel}`}
                </label>
                <p className="text-xs text-gray-500 mb-1">{itemConfig.name}</p>
                <input
                  type="number"
                  name={`itemQuantities.${itemConfig.category}`}
                  id={`itemQuantities.${itemConfig.category}`}
                  value={formData.itemQuantities[ProposalItemCategory.RFID_CARD] || 0}
                  min="0"
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
            ))}
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-gray-800 pt-4 border-t mt-6">Itens da Proposta (Equipamentos, Instalações e Licenças)</h3>
            {PROPOSAL_ITEM_DEFINITIONS.filter(item => item.category !== ProposalItemCategory.METAL_DETECTOR_DEVICE && item.category !== ProposalItemCategory.RFID_CARD).map((itemConfig: ProposalItemConfigEntry) => (
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

            <h3 className="text-lg font-semibold text-gray-800 pt-4 border-t mt-6">Dispositivo Eletrônico Detector de Metal</h3>
            <div className="flex items-center">
              <input type="checkbox" name="includeMetalDetectorDevice" id="includeMetalDetectorDevice" checked={formData.includeMetalDetectorDevice} onChange={handleInputChange}
                      className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
              <label htmlFor="includeMetalDetectorDevice" className="ml-2 block text-sm text-gray-900">Incluir Dispositivo Eletrônico Detector de Metal</label>
            </div>
            {formData.includeMetalDetectorDevice && (
                <div>
                <label htmlFor="metalDetectorDeviceQuantity" className="block text-sm font-medium text-gray-700">Qtd. Dispositivos Detectores de Metal</label>
                <p className="text-xs text-gray-500 mb-1">Dispositivo eletrônico detector de metal, em formato pórtico, com 06 (seis) zonas de detecção e sistema web integrado.</p>
                <input type="number" name="metalDetectorDeviceQuantity" id="metalDetectorDeviceQuantity" value={formData.metalDetectorDeviceQuantity} min="0"
                        onChange={(e) => setFormData(prev => ({...prev, metalDetectorDeviceQuantity: parseInt(e.target.value, 10) || 0}))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                </div>
            )}

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
          </>
        )}
      </form>
    </div>
  );

  const renderProposalPreview = () => {
    if (!currentProposal) return <div className="text-center p-8 text-gray-500">Preencha os dados na aba "Editar Dados" para visualizar a proposta.</div>;

    const { clientName, proposalLocation, proposalDate, items, includeSupportServices, supportNumSchools, supportMonthlyTotal, supportAnnualTotal, firstYearInvestment } = currentProposal;
    const { companyLogoUrl, titleText, introductoryText, contactInfo } = templateSettings;

    const orderedItems = [...items].sort((a, b) => {
      const order = [
        ProposalItemCategory.ELECTRONIC_DEVICE,
        ProposalItemCategory.INSTALLATION_SERVICES,
        ProposalItemCategory.METAL_DETECTOR_DEVICE,
        ProposalItemCategory.STUDENT_LICENSE,
        ProposalItemCategory.SERVER_LICENSE,
      ];
      return order.indexOf(a.category) - order.indexOf(b.category);
    });
    
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
            <h1 className="text-sm font-bold uppercase text-center mt-6 mb-6">{titleText} {clientName}</h1>
          </header>

          <section className="mb-3">
            <p className="text-xs whitespace-pre-line text-justify leading-relaxed">{introductoryText}</p>
          </section>

          <section className={equipTableMarginBottom}>
            <table className={`min-w-full border-collapse border ${borderColor} text-xs`}>
              <thead>
                <tr>
                  <th colSpan={6} className={`${tableTitleCellStyles} border ${borderColor}`}>{templateSettings.mainTableTitle || 'Equipamentos, Instalações e Licenças'}</th>
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
                {orderedItems.filter(item => item.quantity > 0).map((item: ProposalItem, index: number) => (
                  <tr key={item.id} className="bg-white even:bg-slate-50">
                    <td className={centeredNumericColumn}>{index + 1}</td>
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
                    <td className={centeredNumericColumn}>{orderedItems.filter(item => item.quantity > 0).length + 1}</td>
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
                    <td colSpan={6} className={`${rightAlignedTextColumn} font-bold ${tableFooterCellPadding}`}>Custeio da manutenção:</td>
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

  // Função para renderizar a aba de projeção financeira
  const renderFinanceProjection = () => {
    if (templateSettings.templateType === 'rfid') {
      return <div className="p-6 text-gray-500">Projeção financeira não disponível para este template.</div>;
    }
    // Buscar vigência de custo vigente para a data do formulário
    const dataRef = formData.proposalDate || getCurrentDateISO();
    const vigente = costs
      .filter(c => c.vigenciaInicio <= dataRef)
      .sort((a, b) => b.vigenciaInicio.localeCompare(a.vigenciaInicio))[0];
    if (!vigente) {
      return <div className="p-6 text-red-600">Não há custo vigente cadastrado para a data da proposta.</div>;
    }
    const custosVigentes = costs.filter(c => c.vigenciaInicio === vigente.vigenciaInicio && c.id.endsWith(`-${vigente.vigenciaInicio}`));
    if (custosVigentes.length !== 6) {
      return <div className="p-6 text-red-600">Não foi possível encontrar todos os custos da vigência associada.</div>;
    }
    // Mapear itens da proposta para custos
    const itens = [
      { id: '1', label: 'Equipamento Facial iD', categoria: 'ELECTRONIC_DEVICE' },
      { id: '2', label: 'Configuração e ativação', categoria: 'INSTALLATION_SERVICES' },
      { id: '3', label: 'Software gestão escolar', categoria: 'STUDENT_LICENSE' },
      { id: '4', label: 'Software ponto e modulação', categoria: 'SERVER_LICENSE' },
      { id: '5', label: 'Suporte', categoria: 'SUPPORT_SERVICES' },
      { id: '6', label: 'Detector de Metal', categoria: 'METAL_DETECTOR_DEVICE' },
    ];
    const getItemQuantity = (cat: string) => {
      if (cat === 'SUPPORT_SERVICES') return formData.supportNumSchools;
      const found = currentProposal?.items.find(i => i.category === cat);
      return found ? found.quantity : 0;
    };
    const getItemUnitPrice = (cat: string) => {
      if (cat === 'SUPPORT_SERVICES') {
        // Buscar do custo vigente (valorVendaMin)
        const custo = custosVigentes.find(c => c.id.startsWith('5-'));
        return custo ? custo.valorVendaMin : 0;
      }
      const found = currentProposal?.items.find(i => i.category === cat);
      return found ? found.unitPrice : 0;
    };
    let totalCusto = 0, totalVenda = 0, totalLucro = 0;
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-sky-700 mb-2">Projeção Financeira</h2>
        <div className="mb-2 text-xs text-gray-500">
          Vigência utilizada: {vigente.vigenciaInicio.split('T')[0]}<br />
          Cidade: <span className="font-semibold">{formData.proposalLocation || formData.clientName}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-200">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Item</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Qtde</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Custo Unit.</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Custo Total</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Venda Unit.</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Venda Total</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Lucro (R$)</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Lucro (%)</th>
              </tr>
            </thead>
            <tbody>
              {itens.map(item => {
                const custo = custosVigentes.find(c => c.id === `${item.id}-${vigente.vigenciaInicio}`);
                const qtde = getItemQuantity(item.categoria);
                const vendaUnit = getItemUnitPrice(item.categoria);
                const custoUnit = custo ? custo.valorCompra : 0;
                const custoTotal = custoUnit * qtde;
                const vendaTotal = vendaUnit * qtde;
                const lucro = vendaTotal - custoTotal;
                const lucroPerc = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;
                totalCusto += custoTotal;
                totalVenda += vendaTotal;
                totalLucro += lucro;
                return (
                  <tr key={item.id}>
                    <td className="px-2 py-2 text-sm text-gray-700">{item.label}</td>
                    <td className="px-2 py-2 text-sm text-gray-700">{qtde}</td>
                    <td className="px-2 py-2 text-sm text-gray-700">R$ {custoUnit.toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-gray-700">R$ {custoTotal.toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-gray-700">R$ {vendaUnit.toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-gray-700">R$ {vendaTotal.toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-gray-700">R$ {lucro.toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-gray-700">{lucroPerc.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="px-2 py-2 text-sm font-bold text-gray-800">Totais</td>
                <td></td>
                <td></td>
                <td className="px-2 py-2 text-sm font-bold text-gray-800">R$ {totalCusto.toFixed(2)}</td>
                <td></td>
                <td className="px-2 py-2 text-sm font-bold text-gray-800">R$ {totalVenda.toFixed(2)}</td>
                <td className="px-2 py-2 text-sm font-bold text-gray-800">R$ {totalLucro.toFixed(2)}</td>
                <td className="px-2 py-2 text-sm font-bold text-gray-800">{totalCusto > 0 ? (totalLucro / totalCusto * 100).toFixed(1) : '0.0'}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const tabButtonClass = (tab: string) => `px-4 py-2 bg-slate-200 text-gray-700 rounded-md ${activeTab === tab ? 'bg-sky-100' : ''}`;

  return (
    <div className="flex flex-col h-[calc(100vh-theme(space.12))]">
      <div className="px-4 md:px-6 pt-3 border-b border-gray-200 bg-slate-50 no-print">
        <nav className="flex space-x-1 sm:space-x-4" aria-label="Tabs">
          <button onClick={() => setInternalTab('atuais')} className={tabButtonClass('atuais')}>
            Editando
          </button>
          <button onClick={() => setInternalTab('salvas')} className={tabButtonClass('salvas')}>
            Salvas
          </button>
          <button onClick={() => setInternalTab('audio')} className={tabButtonClass('audio')}>
            Áudio
          </button>
        </nav>
      </div>
      <div className={`flex-grow overflow-y-auto p-1 md:p-2 bg-slate-100`}> 
        {internalTab === 'atuais' && (
          <>
            {/* Navegação das sub-abas internas */}
            <div className="flex space-x-1 mb-4">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'form' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-gray-700'}`}
                onClick={() => setActiveTab('form')}
              >
                Editar Dados
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'preview' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-gray-700'}`}
                onClick={() => setActiveTab('preview')}
              >
                Visualizar Proposta
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'finance' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-gray-700'}`}
                onClick={() => setActiveTab('finance')}
              >
                Projeção Financeira
              </button>
            </div>
            {activeTab === 'form' && renderForm()}
            {activeTab === 'preview' && renderProposalPreview()}
            {activeTab === 'finance' && renderFinanceProjection()}
            <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
              <button type="button" onClick={handleSave} className="w-full sm:w-auto order-1 px-5 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition duration-150 text-sm">
                {isEditing ? "Atualizar Proposta" : "Salvar Proposta"}
              </button>
              <button type="button" onClick={handleGeneratePdf} className="w-full sm:w-auto order-2 px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 text-sm">
                Gerar PDF
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
          </>
        )}
        {internalTab === 'salvas' && (
          <SavedProposalsView 
            proposalsMeta={savedProposalsMeta}
            onViewProposal={onViewProposal}
            onDeleteProposal={onDeleteProposal}
          />
        )}
        {internalTab === 'audio' && <AudioUpload />}
      </div>
    </div>
  );
};

export default ProposalView;