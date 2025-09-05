import React, { useEffect, useState } from 'react';
import { Template } from '../types';
import { getAllTemplates, deleteTemplate, setDefaultTemplate, saveTemplate, getDefaultTemplate } from '../services/templateService';
import { v4 as uuidv4 } from 'uuid';
import TemplateEditorView from './TemplateEditorView';

const emptyTemplate = (): Template => ({
  id: uuidv4(),
  name: '',
  isDefault: false,
  companyLogoUrl: '',
  introductoryText: '',
  contactInfo: { address: '', phone: '', cnpj: '', email: '' },
  supportServiceEmail: '',
  defaultUnitPrices: {
    ELECTRONIC_DEVICE: 0,
    INSTALLATION_SERVICES: 0,
    STUDENT_LICENSE: 0,
    SERVER_LICENSE: 0,
    SUPPORT_SERVICES: 0,
    METAL_DETECTOR_DEVICE: 0,
  },
  cidadeUf: '',
});

const TemplatesView: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Template | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await getAllTemplates();
      setTemplates(data);
    } catch (e) {
      setError('Erro ao carregar templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      await deleteTemplate(id);
      fetchTemplates();
    }
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultTemplate(id);
    fetchTemplates();
  };

  const handleEdit = (tpl: Template) => {
    setEditing(tpl);
    setIsNew(false);
  };

  const handleNew = async () => {
    // Buscar o template padrão
    const defaultTemplate = await getDefaultTemplate();
    let base: Template;
    if (defaultTemplate) {
      // Clonar o template padrão, mas com novo id, nome vazio e não padrão
      base = {
        ...defaultTemplate,
        id: uuidv4(),
        name: '',
        isDefault: false
      };
    } else {
      base = emptyTemplate();
    }
    setEditing(base);
    setIsNew(true);
  };

  const handleSave = async (template: Template) => {
    await saveTemplate(template);
    setEditing(null);
    setIsNew(false);
    fetchTemplates();
  };

  const handleCancel = () => {
    setEditing(null);
    setIsNew(false);
  };

  if (editing) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-sky-700">
            {isNew ? 'Novo Template' : 'Editar Template'}
          </h1>
          <button 
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition" 
            onClick={handleCancel}
          >
            Cancelar
          </button>
        </div>
        <TemplateEditorView 
          initialSettings={editing} 
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-sky-700">Templates de Proposta</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition" onClick={() => handleNew()}>Novo Template</button>
      </div>
      
      {loading ? (
        <div>Carregando...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-4 text-left">Nome</th>
              <th className="py-2 px-4 text-left">Padrão</th>
              <th className="py-2 px-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((tpl) => (
              <tr key={tpl.id} className={tpl.isDefault ? 'bg-blue-50 font-bold' : ''}>
                <td className="py-2 px-4">{tpl.name}</td>
                <td className="py-2 px-4">{tpl.isDefault ? 'Sim' : 'Não'}</td>
                <td className="py-2 px-4 space-x-2">
                  {!tpl.isDefault && (
                    <button className="bg-sky-600 text-white px-2 py-1 rounded hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition duration-150 text-sm" onClick={() => handleSetDefault(tpl.id)}>Definir como Padrão</button>
                  )}
                  <button className="bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition duration-150 text-sm" onClick={() => handleEdit(tpl)}>Editar</button>
                  <button className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700" onClick={() => handleDelete(tpl.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TemplatesView; 