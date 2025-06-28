import React, { useEffect, useState } from 'react';
import { Template } from '../types';
import { getAllTemplates, deleteTemplate, setDefaultTemplate, saveTemplate } from '../services/templateService';
import { v4 as uuidv4 } from 'uuid';

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
  },
});

const TemplatesView: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState<Template>(emptyTemplate());
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
    setForm(tpl);
    setIsNew(false);
  };

  const handleNew = () => {
    setEditing(emptyTemplate());
    setForm(emptyTemplate());
    setIsNew(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveTemplate(form);
    setEditing(null);
    setIsNew(false);
    fetchTemplates();
  };

  const handleCancel = () => {
    setEditing(null);
    setIsNew(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-sky-700">Templates de Proposta</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition" onClick={handleNew}>Novo Template</button>
      </div>
      {editing && (
        <form onSubmit={handleFormSubmit} className="bg-white rounded shadow p-4 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nome do Template</label>
            <input type="text" name="name" value={form.name} onChange={handleFormChange} className="border rounded px-3 py-2 w-full" required />
          </div>
          <div className="mb-4 flex items-center">
            <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleFormChange} className="mr-2" />
            <label className="text-sm">Definir como padrão</label>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Logo da Empresa (URL)</label>
            <input type="text" name="companyLogoUrl" value={form.companyLogoUrl} onChange={handleFormChange} className="border rounded px-3 py-2 w-full" />
            {form.companyLogoUrl && (
              <img src={form.companyLogoUrl} alt="Logo" className="h-16 mt-2" />
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Texto Introdutório</label>
            <textarea name="introductoryText" value={form.introductoryText} onChange={handleTextAreaChange} className="border rounded px-3 py-2 w-full" rows={3} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">E-mail para Suporte</label>
            <input type="text" name="supportServiceEmail" value={form.supportServiceEmail} onChange={handleFormChange} className="border rounded px-3 py-2 w-full" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Informações de Contato</label>
            <input type="text" name="contactInfo.address" value={form.contactInfo.address} onChange={e => setForm(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, address: e.target.value } }))} className="border rounded px-3 py-2 w-full mb-2" placeholder="Endereço" />
            <input type="text" name="contactInfo.phone" value={form.contactInfo.phone} onChange={e => setForm(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, phone: e.target.value } }))} className="border rounded px-3 py-2 w-full mb-2" placeholder="Telefone" />
            <input type="text" name="contactInfo.cnpj" value={form.contactInfo.cnpj} onChange={e => setForm(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, cnpj: e.target.value } }))} className="border rounded px-3 py-2 w-full mb-2" placeholder="CNPJ" />
            <input type="text" name="contactInfo.email" value={form.contactInfo.email} onChange={e => setForm(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, email: e.target.value } }))} className="border rounded px-3 py-2 w-full" placeholder="E-mail" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Preços Unitários</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input type="number" step="0.01" name="defaultUnitPrices.ELECTRONIC_DEVICE" value={form.defaultUnitPrices.ELECTRONIC_DEVICE} onChange={e => setForm(prev => ({ ...prev, defaultUnitPrices: { ...prev.defaultUnitPrices, ELECTRONIC_DEVICE: parseFloat(e.target.value) || 0 } }))} className="border rounded px-3 py-2 w-full" placeholder="Dispositivo Eletrônico" />
              <input type="number" step="0.01" name="defaultUnitPrices.INSTALLATION_SERVICES" value={form.defaultUnitPrices.INSTALLATION_SERVICES} onChange={e => setForm(prev => ({ ...prev, defaultUnitPrices: { ...prev.defaultUnitPrices, INSTALLATION_SERVICES: parseFloat(e.target.value) || 0 } }))} className="border rounded px-3 py-2 w-full" placeholder="Serviços de Instalação" />
              <input type="number" step="0.01" name="defaultUnitPrices.STUDENT_LICENSE" value={form.defaultUnitPrices.STUDENT_LICENSE} onChange={e => setForm(prev => ({ ...prev, defaultUnitPrices: { ...prev.defaultUnitPrices, STUDENT_LICENSE: parseFloat(e.target.value) || 0 } }))} className="border rounded px-3 py-2 w-full" placeholder="Licença Aluno" />
              <input type="number" step="0.01" name="defaultUnitPrices.SERVER_LICENSE" value={form.defaultUnitPrices.SERVER_LICENSE} onChange={e => setForm(prev => ({ ...prev, defaultUnitPrices: { ...prev.defaultUnitPrices, SERVER_LICENSE: parseFloat(e.target.value) || 0 } }))} className="border rounded px-3 py-2 w-full" placeholder="Licença Servidor" />
              <input type="number" step="0.01" name="defaultUnitPrices.SUPPORT_SERVICES" value={form.defaultUnitPrices.SUPPORT_SERVICES} onChange={e => setForm(prev => ({ ...prev, defaultUnitPrices: { ...prev.defaultUnitPrices, SUPPORT_SERVICES: parseFloat(e.target.value) || 0 } }))} className="border rounded px-3 py-2 w-full" placeholder="Serviços de Suporte (mensal por escola)" />
            </div>
          </div>
          <div className="flex space-x-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Salvar</button>
            <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500" onClick={handleCancel}>Cancelar</button>
          </div>
        </form>
      )}
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
                    <button className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700" onClick={() => handleSetDefault(tpl.id)}>Definir como Padrão</button>
                  )}
                  <button className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600" onClick={() => handleEdit(tpl)}>Editar</button>
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