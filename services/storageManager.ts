
import { TemplateSettings, Proposal, SavedProposalMeta } from '../types';
import { INITIAL_TEMPLATE_SETTINGS, STORAGE_KEYS } from '../constants';

export const saveTemplateSettings = (settings: TemplateSettings): void => {
  localStorage.setItem(STORAGE_KEYS.TEMPLATE_SETTINGS, JSON.stringify(settings));
};

export const loadTemplateSettings = (): TemplateSettings => {
  const storedSettings = localStorage.getItem(STORAGE_KEYS.TEMPLATE_SETTINGS);
  if (storedSettings) {
    try {
      return JSON.parse(storedSettings) as TemplateSettings;
    } catch (error) {
      console.error("Error parsing stored template settings:", error);
      // Fallback to initial settings if parsing fails
      return INITIAL_TEMPLATE_SETTINGS;
    }
  }
  return INITIAL_TEMPLATE_SETTINGS;
};

export const saveProposals = (proposals: Proposal[]): void => {
  localStorage.setItem(STORAGE_KEYS.SAVED_PROPOSALS, JSON.stringify(proposals));
};

export const loadProposals = (): Proposal[] => {
  const storedProposals = localStorage.getItem(STORAGE_KEYS.SAVED_PROPOSALS);
  if (storedProposals) {
     try {
      return JSON.parse(storedProposals) as Proposal[];
    } catch (error) {
      console.error("Error parsing stored proposals:", error);
      return [];
    }
  }
  return [];
};

export const addProposal = (proposal: Proposal): void => {
  const proposals = loadProposals();
  const updatedProposals = [proposal, ...proposals.filter(p => p.id !== proposal.id)]; // Add or update
  saveProposals(updatedProposals);
};

export const getProposalById = (id: string): Proposal | undefined => {
  const proposals = loadProposals();
  return proposals.find(p => p.id === id);
};

export const deleteProposalById = (id: string): void => {
  let proposals = loadProposals();
  proposals = proposals.filter(p => p.id !== id);
  saveProposals(proposals);
};

export const getSavedProposalsMeta = (): SavedProposalMeta[] => {
  const proposals = loadProposals();
  return proposals.map(p => ({
    id: p.id,
    clientName: p.clientName,
    proposalDate: p.proposalDate,
    totalValue: p.firstYearInvestment + (p.supportAnnualTotal || 0),
    createdAt: p.createdAt,
  })).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
