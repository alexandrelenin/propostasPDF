import { TemplateSettings, ProposalItemCategory, ContactInfo, ProposalItemConfigEntry } from './types';

export const INITIAL_CONTACT_INFO: ContactInfo = {
  address: "Rua Coronel Constantino, 130, Sala Navegantes 141, Tabajaras, Uberlândia/MG, CEP 77402-060",
  phone: "(63) 9976-7070",
  cnpj: "52.625.847/0001-65",
  email: "smarttechschoolmg@gmail.com",
};

// Simple SVG placeholder for the logo
const placeholderLogoSvg = `data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 50'%3e%3crect width='150' height='50' fill='%23cccccc'/%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12px' fill='%23333333'%3eLogo Empresa%3c/text%3e%3c/svg%3e`;

export const INITIAL_TEMPLATE_SETTINGS: TemplateSettings = {
  companyLogoUrl: placeholderLogoSvg, 
  introductoryText: "Estudos preliminares para fornecimento, instalação e manutenção preventiva e corretiva por 12 meses de plataforma integrada de suporte operacional composta de módulos de gestão integrada de unidades educacionais, órgãos e entidades da administração direta e indireta, visando a implementação de políticas públicas voltadas à erradicação da evasão e inassiduidade, incremento da eficácia dos planejamentos e aumento da segurança das unidades educacionais, órgãos e entidades, composto por equipamentos, softwares e serviços.",
  contactInfo: INITIAL_CONTACT_INFO,
  supportServiceEmail: "suporte@smarttechschoolmg.com.br", 
  defaultUnitPrices: {
    [ProposalItemCategory.ELECTRONIC_DEVICE]: 7500.00,
    [ProposalItemCategory.INSTALLATION_SERVICES]: 1600.00,
    [ProposalItemCategory.STUDENT_LICENSE]: 29.90,
    [ProposalItemCategory.SERVER_LICENSE]: 41.00,
    [ProposalItemCategory.SUPPORT_SERVICES]: 790.00, 
  },
};

export const PROPOSAL_ITEM_DEFINITIONS: ProposalItemConfigEntry[] = [
  {
    id: 'electronic_device_presence',
    itemNumber: "1",
    name: "Dispositivo eletrônico para registro de presença por meio de autenticação da face, com sistema web de transmissão cloud e gerenciamento.",
    category: ProposalItemCategory.ELECTRONIC_DEVICE,
    defaultQuantityLabel: "Qtd. Dispositivos de Presença"
  },
  {
    id: 'installation_cabling_services',
    itemNumber: "2",
    name: "Prestação dos serviços de instalação de cabeamento elétrico e de rede de dados, delimitação de posicionamento, instalação e configuração dos dispositivos.",
    category: ProposalItemCategory.INSTALLATION_SERVICES,
    defaultQuantityLabel: "Qtd. Projetos de Instalação"
  },
  {
    id: 'student_license_system',
    itemNumber: "3",
    name: "Licença de aquisição perpétua de sistema informatizado, por aluno, para gerenciamento dos dados relativos à presença registrada nos dispositivos de autenticação da face e à educação municipal, com acesso via web, aplicação mobile para comunicação e consultas.",
    category: ProposalItemCategory.STUDENT_LICENSE,
    defaultQuantityLabel: "Qtd. Licenças por Aluno"
  },
  {
    id: 'server_license_system',
    itemNumber: "4",
    name: "Licença de aquisição perpétua de sistema informatizado, por servidor, para modulação e gerenciamento dos dados relativos à presença registrada nos dispositivos de autenticação da face, com acesso via web, aplicação mobile para registros, justificativas e consultas.",
    category: ProposalItemCategory.SERVER_LICENSE,
    defaultQuantityLabel: "Qtd. Licenças por Servidor"
  },
];

// Função utilitária para número por extenso (0 a 9000)
function numeroPorExtenso(n: number): string {
  const unidades = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const especiais = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dezenas = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cem", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  if (n < 10) return unidades[n];
  if (n < 20) return especiais[n - 10];
  if (n < 100) {
    const dez = Math.floor(n / 10);
    const uni = n % 10;
    return dezenas[dez] + (uni > 0 ? ` e ${unidades[uni]}` : "");
  }
  if (n === 100) return "cem";
  if (n < 200) return "cento" + (n % 100 > 0 ? ` e ${numeroPorExtenso(n % 100)}` : "");
  if (n < 1000) {
    const cen = Math.floor(n / 100);
    const resto = n % 100;
    return centenas[cen] + (resto > 0 ? ` e ${numeroPorExtenso(resto)}` : "");
  }
  if (n === 1000) return "mil";
  if (n < 2000) return "mil" + (n % 1000 > 0 ? ` e ${numeroPorExtenso(n % 1000)}` : "");
  if (n < 10000) {
    const mil = Math.floor(n / 1000);
    const resto = n % 1000;
    return unidades[mil] + " mil" + (resto > 0 ? ` e ${numeroPorExtenso(resto)}` : "");
  }
  return n.toString(); // fallback para números maiores
}

// Used for the "Serviços de Suporte" table's description
export const SUPPORT_SERVICE_DESCRIPTION_TEMPLATE = (numSchools: number, contactEmail: string): string =>
  `Prestação dos serviços de treinamento, suporte técnico, atualizações, integrações, customizações, hospedagem, manutenção preventiva e corretiva, presencial e remotamente, e envio de alertas por e-mail, notificação push mensagens de texto para celular de forma automática e em quantidade ilimitada, para ${numSchools} (${numeroPorExtenso(numSchools)}) unidade(s) da Secretaria Municipal de Educação.`;

export const SUPPORT_ITEM_CATEGORY = ProposalItemCategory.SUPPORT_SERVICES; // For easy access

// For local storage keys
export const STORAGE_KEYS = {
  TEMPLATE_SETTINGS: 'pdfProposalGenerator_templateSettings_v2', 
  SAVED_PROPOSALS: 'pdfProposalGenerator_savedProposals_v2',
};
