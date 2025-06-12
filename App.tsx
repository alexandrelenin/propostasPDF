
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import ProposalView from './components/ProposalView';
import TemplateEditorView from './components/TemplateEditorView';
import SavedProposalsView from './components/SavedProposalsView';
import { TemplateSettings, Proposal, SavedProposalMeta } from './types';
import { INITIAL_TEMPLATE_SETTINGS } from './constants';
import { 
  loadTemplateSettings as loadSettings, 
  saveTemplateSettings as saveSettings,
  addProposal as saveNewProposal,
  getProposalById,
  deleteProposalById as deleteSavedProposal,
  getSavedProposalsMeta as loadProposalsMeta
} from './services/storageManager';

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
          Gerador de Propostas PDF
        </Link>
        <div className="space-x-3">
          <Link to="/" onClick={onCreateNewProposal} className={linkClass('/')}>Nova Proposta</Link>
          <Link to="/saved" className={linkClass('/saved')}>Propostas Salvas</Link>
          <Link to="/template" className={linkClass('/template')}>Configurar Template</Link>
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const [templateSettings, setTemplateSettings] = useState<TemplateSettings>(INITIAL_TEMPLATE_SETTINGS);
  const [savedProposalsMeta, setSavedProposalsMeta] = useState<SavedProposalMeta[]>([]);
  const [editingProposal, setEditingProposal] = useState<Proposal | null | undefined>(undefined);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setTemplateSettings(loadSettings());
    setSavedProposalsMeta(loadProposalsMeta());
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


  const handleSaveTemplate = (settings: TemplateSettings) => {
    setTemplateSettings(settings);
    saveSettings(settings);
  };

  const handleSaveProposal = (proposal: Proposal) => {
    saveNewProposal(proposal);
    setSavedProposalsMeta(loadProposalsMeta());
    setEditingProposal(undefined); 
  };

  const handleDeleteProposal = (id: string) => {
    deleteSavedProposal(id);
    setSavedProposalsMeta(loadProposalsMeta()); 
  };

  const handleViewProposal = useCallback((id: string) => {
    const proposalToEdit = getProposalById(id);
    if (proposalToEdit) {
      setEditingProposal(proposalToEdit);
      navigate('/'); 
    } else {
      alert("Proposta não encontrada.");
      setEditingProposal(null); 
    }
  }, [navigate]);

  const handleCreateNewProposal = () => {
    setEditingProposal(undefined);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar onCreateNewProposal={handleCreateNewProposal} />
      <main className="flex-grow container mx-auto mt-1 mb-1 w-full max-w-full">
        <Routes>
          <Route 
            path="/" 
            element={
              <ProposalView 
                templateSettings={templateSettings} 
                onSaveProposal={handleSaveProposal}
                existingProposal={editingProposal}
                onNavigateToSaved={() => {
                  setEditingProposal(undefined); 
                  navigate('/saved');
                }}
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
            path="/template" 
            element={
              <TemplateEditorView 
                initialSettings={templateSettings} 
                onSave={handleSaveTemplate} 
              />
            } 
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
