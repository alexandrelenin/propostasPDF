export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return 'R$\u00A00,00';
  return `R$\u00A0${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDateForDisplay = (dateString: string | undefined | null, location?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString + 'T00:00:00'); // Ensure date is parsed as local
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const month = monthNames[date.getMonth()];
    if (location) {
      return `${location}, ${day} de ${month} de ${year}`;
    }
    return `${day}/${month}/${year}`; // Fallback or alternative format
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString; // Return original if error
  }
};

export const getCurrentDateISO = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};
