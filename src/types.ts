export enum ProposalItemCategory {
  ELECTRONIC_DEVICE = 'ELECTRONIC_DEVICE', // Dispositivo eletrônico para registro de presença
  INSTALLATION_SERVICES = 'INSTALLATION_SERVICES', // Prestação dos serviços de instalação de cabeamento
  STUDENT_LICENSE = 'STUDENT_LICENSE', // Licença de aquisição perpétua ... por aluno
  SERVER_LICENSE = 'SERVER_LICENSE', // Licença de aquisição perpétua ... por servidor
  SUPPORT_SERVICES = 'SUPPORT_SERVICES', // Serviços de Suporte
  METAL_DETECTOR_DEVICE = 'METAL_DETECTOR_DEVICE', // Dispositivo eletrônico detector de metal
  RFID_CARD = 'RFID_CARD', // Cartão de proximidade RFID
  KIT_ALUNO_PRESENTE = 'KIT_ALUNO_PRESENTE', // Kit Aluno Presente (400/600/800 alunos)
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
  unitType: 'UN' | 'Kit'; // 'UN' para itens padrão; 'Kit' para o template Aluno Presente
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
  costVigencia: string; // Vigência do custo vigente associado
  includeMetalDetectorDevice: boolean;
  metalDetectorDeviceQuantity: number;
  kitSize?: 400 | 600 | 800; // preenchido apenas no template 'aluno-presente'
}

export interface ContactInfo {
  address: string;
  phone: string;
  cnpj: string;
  email: string;
}

export interface TemplateSettings {
  companyLogoUrl: string;
  titleText: string; // Texto do título (ex: "SECRETARIA MUNICIPAL DE EDUCAÇÃO DE")
  introductoryText: string;
  contactInfo: ContactInfo;
  cidadeUf: string; // Cidade/UF para local da proposta
  supportServiceEmail: string; // Used in dynamic support description
  defaultUnitPrices: {
    [ProposalItemCategory.ELECTRONIC_DEVICE]: number;
    [ProposalItemCategory.INSTALLATION_SERVICES]: number;
    [ProposalItemCategory.STUDENT_LICENSE]: number;
    [ProposalItemCategory.SERVER_LICENSE]: number;
    [ProposalItemCategory.SUPPORT_SERVICES]: number; // Monthly unit price for support per school
    [ProposalItemCategory.METAL_DETECTOR_DEVICE]: number;
    [ProposalItemCategory.RFID_CARD]: number;
  };
  templateType?: 'standard' | 'rfid' | 'aluno-presente';
  mainTableTitle?: string;
  kitUnitPrices?: { 400: number; 600: number; 800: number }; // valores unitários padrão por kit
}

export type ProposalInputData = Omit<Proposal, 'id' | 'items' | 'firstYearInvestment' | 'supportMonthlyTotal' | 'supportAnnualTotal' | 'createdAt' | 'costVigencia'> & {
  itemQuantities: {
    [ProposalItemCategory.ELECTRONIC_DEVICE]: number;
    [ProposalItemCategory.INSTALLATION_SERVICES]: number;
    [ProposalItemCategory.STUDENT_LICENSE]: number;
    [ProposalItemCategory.SERVER_LICENSE]: number;
    [ProposalItemCategory.METAL_DETECTOR_DEVICE]: number;
    [ProposalItemCategory.RFID_CARD]: number;
  };
  costVigencia?: string;
  kitSize?: 400 | 600 | 800;
  kitQuantity?: number;
};

export interface SavedProposalMeta {
  id: string;
  clientName: string;
  proposalDate: string;
  totalValue: number;
  createdAt: string;
}

export interface ProposalItemDefinition {
  id: string;
  label: string;
  category: ProposalItemCategory;
  description: string;
}

export interface Template extends TemplateSettings {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface Cost {
  id: string; // UUID
  descricao: string;
  formaCobranca: string;
  valorCompra: number;
  valorVendaMin: number;
  valorVendaMax: number;
  vigenciaInicio: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
