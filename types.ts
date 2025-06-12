
export enum ProposalItemCategory {
  ELECTRONIC_DEVICE = 'ELECTRONIC_DEVICE', // Dispositivo eletrônico para registro de presença
  INSTALLATION_SERVICES = 'INSTALLATION_SERVICES', // Prestação dos serviços de instalação de cabeamento
  STUDENT_LICENSE = 'STUDENT_LICENSE', // Licença de aquisição perpétua ... por aluno
  SERVER_LICENSE = 'SERVER_LICENSE', // Licença de aquisição perpétua ... por servidor
  SUPPORT_SERVICES = 'SUPPORT_SERVICES', // Serviços de Suporte
}

export interface ProposalItemConfigEntry {
  id: string; // e.g., 'electronic_device_presence'
  itemNumber: string; // "1", "2", "3", "4" - for display
  name: string; // The "Descrição" from the PDF
  category: ProposalItemCategory;
  defaultQuantityLabel: string; // For the form input label
}

export interface ProposalItem {
  id: string; // Matches id from ProposalItemConfigEntry
  itemNumber: string;
  name: string; // "Descrição"
  category: ProposalItemCategory;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitType: 'UN'; // Fixed as 'UN' from PDF for main items
}

export interface Proposal {
  id: string; // UUID
  clientName: string; // "CIDADE - UF"
  proposalLocation: string; // e.g., "Uberlândia"
  proposalDate: string; // YYYY-MM-DD
  items: ProposalItem[]; // Main items (1-4)
  includeSupportServices: boolean;
  supportNumSchools: number; // Quantidade de escolas (unidades da Secretaria) for support
  firstYearInvestment: number;
  supportMonthlyTotal?: number;
  supportAnnualTotal?: number;
  createdAt: string; // ISO date string
}

export interface ContactInfo {
  address: string;
  phone: string;
  cnpj: string;
  email: string;
}

export interface TemplateSettings {
  companyLogoUrl: string;
  introductoryText: string;
  contactInfo: ContactInfo;
  supportServiceEmail: string; // Used in dynamic support description
  defaultUnitPrices: {
    [ProposalItemCategory.ELECTRONIC_DEVICE]: number;
    [ProposalItemCategory.INSTALLATION_SERVICES]: number;
    [ProposalItemCategory.STUDENT_LICENSE]: number;
    [ProposalItemCategory.SERVER_LICENSE]: number;
    [ProposalItemCategory.SUPPORT_SERVICES]: number; // Monthly unit price for support per school
  };
}

export type ProposalInputData = Omit<Proposal, 'id' | 'items' | 'firstYearInvestment' | 'supportMonthlyTotal' | 'supportAnnualTotal' | 'createdAt'> & {
  itemQuantities: {
    [ProposalItemCategory.ELECTRONIC_DEVICE]: number;
    [ProposalItemCategory.INSTALLATION_SERVICES]: number;
    [ProposalItemCategory.STUDENT_LICENSE]: number;
    [ProposalItemCategory.SERVER_LICENSE]: number;
  };
};

export interface SavedProposalMeta {
  id: string;
  clientName: string;
  proposalDate: string;
  totalValue: number;
  createdAt: string;
}
