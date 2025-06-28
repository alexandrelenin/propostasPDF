import React, { useState, useEffect, useRef } from 'react';
import { Template, ContactInfo, ProposalItemCategory } from '../types';
import { PROPOSAL_ITEM_DEFINITIONS, SUPPORT_ITEM_CATEGORY, INITIAL_TEMPLATE_SETTINGS } from '../constants';

// === CONFIGURAÇÃO DO CLOUDINARY ===
const CLOUDINARY_CLOUD_NAME = "dfezexws1"; // Substitua pelo seu cloud name
const CLOUDINARY_UPLOAD_PRESET = "propostasPDF"; // Substitua pelo seu upload preset unsigned
// ================================

interface TemplateEditorViewProps {
  initialSettings: Template;
  onSave: (settings: Template) => void;
  onDelete?: (id: string) => void;
}

const InputField: React.FC<{label: string, value: string, onChange: (value: string) => void, type?: string, placeholder?: string, textArea?: boolean }> = 
  ({ label, value, onChange, type = "text", placeholder, textArea = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {textArea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
      />
    )}
  </div>
);

const NumberInputField: React.FC<{label: string, value: number, onChange: (value: number) => void, placeholder?: string, step?: string }> =
 ({ label, value, onChange, placeholder, step = "0.01" }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      placeholder={placeholder || label}
      step={step}
      min="0"
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
    />
  </div>
);


const TemplateEditorView: React.FC<TemplateEditorViewProps> = ({ initialSettings, onSave, onDelete }) => {
  const [settings, setSettings] = useState<Template>(initialSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleFieldChange = (key: keyof Template, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleContactInfoChange = <K extends keyof ContactInfo>(key: K, value: ContactInfo[K]) => {
    setSettings(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [key]: value,
      },
    }));
  };

  const handleUnitPriceChange = (itemCategory: ProposalItemCategory, value: number) => {
    setSettings(prev => ({
      ...prev,
      defaultUnitPrices: {
        ...prev.defaultUnitPrices,
        [itemCategory]: value,
      },
    }));
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("O arquivo de imagem é muito grande. O limite é 2MB.");
        if(fileInputRef.current) {
            fileInputRef.current.value = ""; // Clear the file input
        }
        return;
      }
      // Upload para o Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.secure_url) {
          setSettings(prev => ({ ...prev, companyLogoUrl: data.secure_url }));
        } else {
          alert("Erro ao fazer upload da imagem para o Cloudinary. Verifique as credenciais e tente novamente.");
        }
      } catch (err) {
        alert("Erro ao fazer upload da imagem para o Cloudinary.");
      }
    }
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, companyLogoUrl: INITIAL_TEMPLATE_SETTINGS.companyLogoUrl }));
    if(fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the file input
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-white shadow-xl rounded-lg">
      <h1 className="text-3xl font-bold text-sky-700 mb-8">Editar Template da Proposta</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Template</label>
            <input
              type="text"
              value={settings.name}
              onChange={e => handleFieldChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              required
            />
          </div>
          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              checked={settings.isDefault}
              onChange={e => handleFieldChange('isDefault', e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm">Definir como padrão</label>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Informações Gerais</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo da Empresa</label>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleLogoChange}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            />
            {settings.companyLogoUrl && (
              <div className="mt-3 p-2 border border-dashed border-gray-300 rounded-md inline-block">
                <img 
                  src={settings.companyLogoUrl} 
                  alt="Pré-visualização do Logo" 
                  className="h-16 max-w-xs object-contain"
                  onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentNode;
                      if (parent) {
                          const altText = document.createElement('span');
                          altText.textContent = 'Erro ao carregar logo';
                          altText.className = 'text-red-500 text-xs';
                          parent.insertBefore(altText, target);
                      }
                  }}
                />
              </div>
            )}
            {settings.companyLogoUrl !== INITIAL_TEMPLATE_SETTINGS.companyLogoUrl && (
                 <button 
                    type="button" 
                    onClick={handleRemoveLogo}
                    className="ml-3 mt-2 px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                    Remover Logo
                </button>
            )}
          </div>

          <InputField label="Texto Introdutório da Proposta (Parágrafo abaixo do cabeçalho)" value={settings.introductoryText} onChange={val => handleFieldChange('introductoryText', val)} textArea={true}/>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Informações de Contato (Rodapé)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Endereço Completo" value={settings.contactInfo.address} onChange={val => handleContactInfoChange('address', val)}/>
            <InputField label="Telefone Principal" value={settings.contactInfo.phone} onChange={val => handleContactInfoChange('phone', val)}/>
            <InputField label="CNPJ" value={settings.contactInfo.cnpj} onChange={val => handleContactInfoChange('cnpj', val)}/>
            <InputField label="E-mail Principal (Rodapé)" value={settings.contactInfo.email} onChange={val => handleContactInfoChange('email', val)}/>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Valores Unitários Padrão</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROPOSAL_ITEM_DEFINITIONS.map(itemDef => (
              <NumberInputField
                key={itemDef.category}
                label={`Preço Unitário: ${itemDef.name.substring(0,50)}...`} 
                value={settings.defaultUnitPrices[itemDef.category]}
                onChange={val => handleUnitPriceChange(itemDef.category, val)}
              />
            ))}
             <NumberInputField
                label="Preço Unitário Mensal: Serviços de Suporte (por escola)"
                value={settings.defaultUnitPrices[SUPPORT_ITEM_CATEGORY]}
                onChange={val => handleUnitPriceChange(SUPPORT_ITEM_CATEGORY, val)}
              />
          </div>
           <InputField 
              label="E-mail para Contato de Suporte (usado na descrição do item de suporte)" 
              value={settings.supportServiceEmail} 
              onChange={val => handleFieldChange('supportServiceEmail', val)}
              placeholder="suporte@suaempresa.com"
            />
        </div>

        <div className="mt-10 flex justify-end">
          <button 
            type="submit"
            className="px-8 py-3 bg-sky-600 text-white font-semibold rounded-md shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            Salvar Configurações do Template
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateEditorView;
