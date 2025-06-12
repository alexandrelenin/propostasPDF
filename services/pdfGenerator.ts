import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Proposal, TemplateSettings, ProposalItemCategory } from '../types';
import { formatCurrency, formatDateForDisplay } from '../utils/formatters';
import { SUPPORT_SERVICE_DESCRIPTION_TEMPLATE, PROPOSAL_ITEM_DEFINITIONS } from '../constants';

// Helper function to add footer to each page
const addFooter = (doc: jsPDF, settings: TemplateSettings, pageNumber: number, totalPages: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const footerTextLine1 = settings.contactInfo.address;
  const footerTextLine2 = `Telefone: ${settings.contactInfo.phone} – CNPJ: ${settings.contactInfo.cnpj} – ${settings.contactInfo.email}`;
  const pageNumText = `Página ${pageNumber} de ${totalPages}`;

  doc.setFontSize(8);
  doc.setTextColor(100); // Dark gray

  // Calculate text widths to center them
  const textWidthLine1 = doc.getTextWidth(footerTextLine1);
  const textWidthLine2 = doc.getTextWidth(footerTextLine2);
  
  const bottomMargin = 10; // Margin from bottom of page
  const lineSpacing = 3.5;

  doc.text(footerTextLine1, (pageWidth - textWidthLine1) / 2, pageHeight - bottomMargin - lineSpacing);
  doc.text(footerTextLine2, (pageWidth - textWidthLine2) / 2, pageHeight - bottomMargin);
  
  // Page number
  doc.text(pageNumText, pageWidth - doc.getTextWidth(pageNumText) - 10, pageHeight - bottomMargin);
};


export const generateProposalPdf = async (proposal: Proposal, settings: TemplateSettings, fileName: string): Promise<void> => {
  if (!proposal || !settings) {
    alert("Erro: Dados da proposta ou configurações do template ausentes.");
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFont('Helvetica', 'normal');

  let currentY = 15; // Initial Y position in mm (top margin)
  const leftMargin = 15;
  const rightMargin = 15;
  const contentWidth = doc.internal.pageSize.getWidth() - leftMargin - rightMargin;

  // 1. Company Logo
  let logoAddedSuccessfully = false;
  if (settings.companyLogoUrl && settings.companyLogoUrl.startsWith('data:image')) {
    try {
        let imageFormat = '';
        // Regex to capture image subtype (png, jpeg, svg+xml)
        const mimeTypeMatch = settings.companyLogoUrl.match(/^data:image\/(.+?)(;base64|,)/);

        if (mimeTypeMatch && mimeTypeMatch[1]) {
            const subType = mimeTypeMatch[1].toLowerCase();
            if (subType === 'png') imageFormat = 'PNG';
            else if (subType === 'jpeg' || subType === 'jpg') imageFormat = 'JPEG';
            else if (subType === 'gif') imageFormat = 'GIF';
            else if (subType === 'svg+xml') imageFormat = 'SVG';
        }

        if (!imageFormat) {
            console.warn("Could not determine image format from data URL for logo:", settings.companyLogoUrl.substring(0, 70));
            throw new Error("Unsupported image type or malformed data URL for logo (could not determine format).");
        }

        const imgProps = doc.getImageProperties(settings.companyLogoUrl);
        
        const logoHeight = 12; // mm
        let logoWidth;

        if (imgProps.width && imgProps.height && imgProps.width > 0 && imgProps.height > 0) {
            logoWidth = (imgProps.width * logoHeight) / imgProps.height;
        } else if (imageFormat === 'SVG') {
            // Fallback for SVG if getImageProperties doesn't provide dimensions.
            // Attempt to parse viewBox if available, or use a fixed aspect ratio.
            // For the placeholder '0 0 150 50', aspect ratio is 150/50 = 3.
            // This is a common issue with jsPDF and SVGs.
            const svgContentMatch = settings.companyLogoUrl.match(/<svg[^>]*viewBox\s*=\s*['"]([\d\s\.\-]+)['"]/i);
            if (svgContentMatch && svgContentMatch[1]) {
                const viewBoxParts = svgContentMatch[1].split(/\s+/);
                if (viewBoxParts.length === 4) {
                    const vbWidth = parseFloat(viewBoxParts[2]);
                    const vbHeight = parseFloat(viewBoxParts[3]);
                    if (vbWidth > 0 && vbHeight > 0) {
                        logoWidth = (vbWidth * logoHeight) / vbHeight;
                    } else {
                         logoWidth = logoHeight * 3; // Default aspect ratio (e.g. 150x50)
                    }
                } else {
                     logoWidth = logoHeight * 3; 
                }
            } else {
                 logoWidth = logoHeight * 3; // Default if no viewBox found
            }
            console.warn("getImageProperties failed to return dimensions for SVG. Using calculated/default aspect ratio for logo.");
        } else {
            throw new Error("Could not get valid image dimensions from getImageProperties or SVG fallback.");
        }
        
        if (logoWidth <= 0) { // Final check for valid width
             throw new Error(`Invalid calculated logo width: ${logoWidth}`);
        }

        doc.addImage(settings.companyLogoUrl, imageFormat, leftMargin, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 8;
        logoAddedSuccessfully = true;

    } catch (e) {
        console.error("Error adding logo, using fallback text:", e);
        // Ensure currentY is not advanced if logo addition fails before this point.
        // The fallback text will handle its own currentY increment.
    }
  }

  if (!logoAddedSuccessfully) {
     // Fallback text if no logo URL, not a data URL, or if adding image failed
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text("T SMART TEC SCHOOL", leftMargin, currentY + 6);
      doc.setFont('Helvetica', 'normal');
      currentY += 12 + 8; // Consistent space as if logo was intended
  }


  // 2. Header Title (New Style)
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  const titleText = `SECRETARIA MUNICIPAL DE EDUCAÇÃO DE ${proposal.clientName.toUpperCase()}`;
  const titleWidth = doc.getTextWidth(titleText);
  const titleRectHeight = 10; // Height of the background rectangle
  const titleRectY = currentY - 5; // Adjust Y to center text vertically in rectangle
  
  // Draw rectangle background
  doc.setFillColor(222, 226, 230); // Light gray background
  doc.rect(leftMargin, titleRectY, contentWidth, titleRectHeight, 'FD');

  // Add text centered in the rectangle
  doc.setTextColor(33, 37, 41); // Dark text color
  doc.text(titleText, (doc.internal.pageSize.getWidth() / 2) - (titleWidth / 2), currentY + 1); // Truly center the text
  currentY += titleRectHeight + 5; // Space after title block

  // 3. Introductory Text
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  const introLines = doc.splitTextToSize(settings.introductoryText, contentWidth);
  doc.text(introLines, leftMargin, currentY, { align: 'justify', maxWidth: contentWidth });
  currentY += (introLines.length * doc.getLineHeight() / doc.internal.scaleFactor) + 6; // Space after intro

  // 4. Main Items Table (with integrated title)
  const mainItemsTableTitle = 'Equipamentos, Instalações e Licenças';
  const mainItemsHead = [
    [{ content: mainItemsTableTitle, colSpan: 6, 
      // @ts-ignore
      styles: { halign: 'center', fillColor: [222, 226, 230], textColor: [33, 37, 41], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0, 0, 0] } }],
    ['Item', 'Unid.', 'Qtde.', 'Descrição', 'Valor Unitário', 'Valor Total']
  ];
  const mainItemsBody = proposal.items.map(item => [
    item.itemNumber,
    item.unitType,
    item.quantity.toString(),
    item.name,
    formatCurrency(item.unitPrice),
    formatCurrency(item.totalPrice)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: mainItemsHead,
    body: mainItemsBody,
    theme: 'grid',
    margin: { left: leftMargin, right: rightMargin },
    headStyles: { fillColor: [222, 226, 230], textColor: [33, 37, 41], fontSize: 8, fontStyle: 'bold', halign: 'center', lineWidth: 0.1, lineColor: [0, 0, 0] },
    bodyStyles: { fontSize: 8, textColor: [33, 37, 41], lineWidth: 0.1, lineColor: [0, 0, 0] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 'auto' }, // Item
      1: { halign: 'center', cellWidth: 'auto' }, // Unid.
      2: { halign: 'center', cellWidth: 'auto' }, // Qtde.
      3: { halign: 'left', cellWidth: 'auto' },   // Descrição (takes remaining space)
      4: { halign: 'right', cellWidth: 'auto' }, // Valor Unitário
      5: { halign: 'right', cellWidth: 'auto' }  // Valor Total
    },
    foot: [
      [{ content: 'Investimento primeiro ano:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fillColor: [222, 226, 230], textColor: [33, 37, 41] } }, 
       { content: formatCurrency(proposal.firstYearInvestment), colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [222, 226, 230], textColor: [33, 37, 41] } }]
    ],
    footStyles: {
      fontSize: 9,
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      cellPadding: { top: 2, bottom: 2, left: 2, right: 2 }
    },
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.1,
    didParseCell: (data) => {
        if (data.section === 'body' && (data.column.index === 4 || data.column.index === 5)) {
            data.cell.styles.halign = 'right';
        }
        if (data.section === 'head' && data.column.index === 3) { // Description header
            data.cell.styles.halign = 'left';
        }
    },
    didDrawPage: (data) => {
      // Footer will be added globally later
    }
  });
  currentY = (doc as any).lastAutoTable.finalY + 8; // Space after table

  // 5. Support Services Table (with integrated title)
  if (proposal.includeSupportServices && proposal.supportNumSchools > 0 && proposal.supportAnnualTotal !== undefined && proposal.supportMonthlyTotal !== undefined) {
    if (currentY + 40 > doc.internal.pageSize.getHeight() - 30) { // Check if new table needs new page (approx height)
        doc.addPage();
        currentY = 15;
    }
    const supportServicesTableTitle = 'Serviços de Suporte';
    const supportHead = [
      [{ content: supportServicesTableTitle, colSpan: 7, 
        // @ts-ignore
        styles: { halign: 'center', fillColor: [222, 226, 230], textColor: [33, 37, 41], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0, 0, 0] } }],
      ['Item', 'Unid.', 'Qtde.', 'Descrição', 'Valor Unit. Mensal', 'Valor Total Mensal', 'Valor Total Anual']
    ];
    const supportItemNumber = (PROPOSAL_ITEM_DEFINITIONS.length + 1).toString();
    const supportDesc = SUPPORT_SERVICE_DESCRIPTION_TEMPLATE(proposal.supportNumSchools, settings.supportServiceEmail);
    const supportBody = [[
      supportItemNumber,
      'UN',
      proposal.supportNumSchools.toString(),
      supportDesc,
      formatCurrency(settings.defaultUnitPrices[ProposalItemCategory.SUPPORT_SERVICES]),
      formatCurrency(proposal.supportMonthlyTotal),
      formatCurrency(proposal.supportAnnualTotal)
    ]];

    autoTable(doc, {
      startY: currentY,
      head: supportHead,
      body: supportBody,
      theme: 'grid',
      margin: { left: leftMargin, right: rightMargin },
      headStyles: { fillColor: [222, 226, 230], textColor: [33, 37, 41], fontSize: 8, fontStyle: 'bold', halign: 'center', lineWidth: 0.1, lineColor: [0, 0, 0] },
      bodyStyles: { fontSize: 8, textColor: [33, 37, 41], lineWidth: 0.1, lineColor: [0, 0, 0] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 'auto' }, // Item
        1: { halign: 'center', cellWidth: 'auto' }, // Unid.
        2: { halign: 'center', cellWidth: 'auto' }, // Qtde.
        3: { halign: 'left', cellWidth: 'auto' },   // Descrição
        4: { halign: 'right', cellWidth: 'auto' }, // Valor Unit. Mensal
        5: { halign: 'right', cellWidth: 'auto' }, // Valor Total Mensal
        6: { halign: 'right', cellWidth: 'auto' }  // Valor Total Anual
      },
      foot: [
        [{ content: 'Custeio segundo ano', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [222, 226, 230], textColor: [33, 37, 41] } }, 
         { content: formatCurrency(proposal.supportAnnualTotal), colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [222, 226, 230], textColor: [33, 37, 41] } }]
      ],
      footStyles: {
        fontSize: 9,
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 }
      },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.1,
      didParseCell: (data) => {
        if (data.section === 'body' && (data.column.index >= 4)) {
            data.cell.styles.halign = 'right';
        }
         if (data.section === 'head' && data.column.index === 3) { // Description header
            data.cell.styles.halign = 'left';
        }
      },
      didDrawPage: (data) => {
        // Footer will be added globally later
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Summary for Support Services
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    const supportTotalText = "Total Anual (Serviços de Suporte):";
    const supportTotalValue = formatCurrency(proposal.supportAnnualTotal);
    const supportTotalTextWidth = doc.getTextWidth(supportTotalText);
    const supportTotalValueWidth = doc.getTextWidth(supportTotalValue);
    doc.text(supportTotalText, doc.internal.pageSize.getWidth() - rightMargin - supportTotalValueWidth - supportTotalTextWidth - 2, currentY);
    doc.text(supportTotalValue, doc.internal.pageSize.getWidth() - rightMargin - supportTotalValueWidth, currentY);
    currentY += 10;
  }
  
  // 6. Proposal Date and Location
  if (currentY + 15 > doc.internal.pageSize.getHeight() - 30) { // Check space for date/location and footer
    doc.addPage();
    currentY = 15;
  }
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.text(formatDateForDisplay(proposal.proposalDate, proposal.proposalLocation), leftMargin, currentY);
  currentY += 10;

  // Add footer to all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, settings, i, totalPages);
  }

  // 7. Save PDF
  try {
    doc.save(`${fileName}.pdf`);
    alert(`PDF "${fileName}.pdf" gerado com sucesso com texto selecionável!`);
  } catch (error) {
    console.error("Erro ao salvar PDF:", error);
    alert(`Ocorreu um erro ao salvar o PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
};
