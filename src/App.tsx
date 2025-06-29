import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import ProposalView from './components/ProposalView';
import SavedProposalsView from './components/SavedProposalsView';
import TemplatesView from './components/TemplatesView';
import CostsCrudView from './components/CostsCrudView';
import AudioUpload from './components/AudioUpload';
import { Template, Proposal, SavedProposalMeta } from './types';
import { INITIAL_TEMPLATE_SETTINGS } from './constants';
import { saveTemplate, getTemplateById, getAllTemplates, getDefaultTemplate } from './services/templateService';
import { saveProposal, getAllProposals, getProposalById, deleteProposal } from './services/proposalService';

interface NavbarProps {
  onCreateNewProposal: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onCreateNewProposal }) => {
  const location = useLocation();
  const linkClass = (path: string) => 
    `px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
      location.pathname === path 
        ? 'bg-sky-700 text-white shadow-inner' 
        : 'text-sky-100 hover:bg-sky-600 hover:text-white'
    }`;

  return (
    <nav className="bg-sky-800 p-4 shadow-lg no-print">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" onClick={onCreateNewProposal} className="text-2xl font-bold text-white hover:text-sky-200 transition-colors">
          Propostas
        </Link>
        <div className="space-x-3 flex flex-row md:flex-row items-center">
          <Link to="/" onClick={onCreateNewProposal} className={linkClass('/')}>Propostas</Link>
          <Link to="/templates" className={linkClass('/templates')}>Templates</Link>
          <Link to="/costs" className={linkClass('/costs')}>Custos</Link>
        </div>
      </div>
    </nav>
  );
};

// Componente para exibir mensagens do sistema
interface SystemMessageProps {
  message: string | null;
  type: 'success' | 'error' | 'info' | null;
  onClear: () => void;
}

const SystemMessage: React.FC<SystemMessageProps> = ({ message, type, onClear }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
                  type === 'error' ? 'bg-red-100 border-red-400 text-red-700' :
                  'bg-blue-100 border-blue-400 text-blue-700';

  return (
    <div className={`border-l-4 p-4 mb-4 ${bgColor} no-print`}>
      <div className="flex justify-between items-center">
        <p className="font-medium">{message}</p>
        <button
          onClick={onClear}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const initialTemplate: Template = {
    ...INITIAL_TEMPLATE_SETTINGS,
    id: 'default',
    name: 'Template Padrão',
    isDefault: true,
  };
  const [templateSettings, setTemplateSettings] = useState<Template>(initialTemplate);
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [savedProposalsMeta, setSavedProposalsMeta] = useState<SavedProposalMeta[]>([]);
  const [editingProposal, setEditingProposal] = useState<Proposal | null | undefined>(undefined);
  const [systemMessage, setSystemMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function fetchProposalsAndTemplates() {
      const propostas = await getAllProposals();
      const meta = propostas.map(p => ({
        id: p.id,
        clientName: p.clientName,
        proposalDate: p.proposalDate,
        totalValue: p.firstYearInvestment + (p.supportAnnualTotal || 0),
        createdAt: p.createdAt,
      })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSavedProposalsMeta(meta);
      
      // Carregar todos os templates
      const templates = await getAllTemplates();
      setAllTemplates(templates);
      
      // Buscar template padrão
      const defaultTemplate = await getDefaultTemplate();
      if (defaultTemplate) {
        setTemplateSettings(defaultTemplate);
      } else if (templates.length > 0) {
        // Se não há template padrão, usar o primeiro
        setTemplateSettings(templates[0]);
      } else {
        // Se não há templates, usar o inicial
        setTemplateSettings(initialTemplate);
      }
    }
    fetchProposalsAndTemplates();
  }, []);

  // Effect to clear editingProposal if navigating to '/' directly
  // and the intention is not to continue editing (e.g. browser back button to / from an edit state)
  useEffect(() => {
    if (location.pathname === '/' && editingProposal && !getProposalById(editingProposal.id)) {
      // If we are at '/' and editingProposal is set but doesn't match a loadable ID (e.g. stale state)
      // This situation is less common with explicit `onCreateNewProposal`
      setEditingProposal(undefined);
    }
  }, [location.pathname, editingProposal]);

  const showSystemMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSystemMessage({ message, type });
    // Auto-clear success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        setSystemMessage(null);
      }, 5000);
    }
  };

  const clearSystemMessage = () => {
    setSystemMessage(null);
  };

  const handleSaveTemplate = async (settings: Template) => {
    await saveTemplate(settings);
    // Buscar o template padrão atualizado (id: 'default')
    const updated = await getTemplateById('default');
    if (updated) {
      setTemplateSettings(updated);
    } else {
      setTemplateSettings(prev => ({ ...prev, ...settings }));
    }
    showSystemMessage("Configurações do template salvas com sucesso!", "success");
  };

  const handleSaveProposal = async (proposal: Proposal) => {
    await saveProposal(proposal);
    const propostas = await getAllProposals();
    const meta = propostas.map(p => ({
      id: p.id,
      clientName: p.clientName,
      proposalDate: p.proposalDate,
      totalValue: p.firstYearInvestment + (p.supportAnnualTotal || 0),
      createdAt: p.createdAt,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setSavedProposalsMeta(meta);
    showSystemMessage(`Proposta para ${proposal.clientName} salva com sucesso!`, "success");
  };

  const handleDeleteProposal = async (id: string) => {
    await deleteProposal(id);
    const propostas = await getAllProposals();
    const meta = propostas.map(p => ({
      id: p.id,
      clientName: p.clientName,
      proposalDate: p.proposalDate,
      totalValue: p.firstYearInvestment + (p.supportAnnualTotal || 0),
      createdAt: p.createdAt,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setSavedProposalsMeta(meta);
  };

  const handleViewProposal = useCallback(async (id: string) => {
    const proposalToEdit = await getProposalById(id);
    if (proposalToEdit) {
      setEditingProposal(proposalToEdit);
      navigate('/');
    } else {
      showSystemMessage("Proposta não encontrada.", "error");
      setEditingProposal(null);
    }
  }, [navigate]);

  const handleCreateNewProposal = () => {
    setEditingProposal(undefined);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleTemplateChange = async (templateId: string) => {
    const selectedTemplate = allTemplates.find(t => t.id === templateId);
    if (selectedTemplate) {
      setTemplateSettings(selectedTemplate);
      showSystemMessage(`Template "${selectedTemplate.name}" selecionado!`, "success");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar onCreateNewProposal={handleCreateNewProposal} />
      {/* Área de mensagens do sistema */}
      <div className="container mx-auto px-4 md:px-6">
        <SystemMessage 
          message={systemMessage?.message || null}
          type={systemMessage?.type || null}
          onClear={clearSystemMessage}
        />
      </div>
      
      <main className="flex-grow container mx-auto mt-1 mb-1 w-full max-w-full">
        <Routes>
          <Route 
            path="/" 
            element={
              <ProposalView 
                templateSettings={templateSettings} 
                allTemplates={allTemplates}
                onTemplateChange={handleTemplateChange}
                onSaveProposal={handleSaveProposal}
                existingProposal={editingProposal}
                onNavigateToSaved={() => {
                  setEditingProposal(undefined); 
                  navigate('/saved');
                }}
                onShowMessage={showSystemMessage}
                savedProposalsMeta={savedProposalsMeta}
                onViewProposal={handleViewProposal}
                onDeleteProposal={handleDeleteProposal}
              />
            } 
          />
          <Route 
            path="/saved" 
            element={
              <SavedProposalsView 
                proposalsMeta={savedProposalsMeta} 
                onViewProposal={handleViewProposal}
                onDeleteProposal={handleDeleteProposal}
              />
            } 
          />
          <Route 
            path="/templates" 
            element={<TemplatesView />} 
          />
          <Route path="/costs" element={<CostsCrudView />} />
          <Route 
            path="/audio-upload" 
            element={<AudioUpload />} 
          />
        </Routes>
      </main>
      <footer className="bg-slate-700 text-center text-xs text-slate-300 p-3 no-print">
        © {new Date().getFullYear()} Gerador de Propostas PDF. Todos os direitos reservados.
      </footer>
    </div>
  );
};

const AppWrapper: React.FC = () => (
  <HashRouter>
    <App />
  </HashRouter>
);

export default AppWrapper;
