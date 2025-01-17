import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { PDF_CONSTANTS } from './constants';
import { PDFGenerationError } from './error';
import { ASSETS } from '../../config/assets';
import type { ExportData } from '../../types/report';
import type { TableRow } from '../../types/pdf';
import html2canvas from 'html2canvas';

interface PDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

const addChartToPDF = async (doc: jsPDF, chartContainer: HTMLElement, title: string, y: number): Promise<number> => {
  try {
    // Wait for any animations to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(chartContainer, {
      scale: 2, // Increase quality
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const imgWidth = pageWidth - (2 * margin);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add title
    doc.setFontSize(12);
    doc.text(title, margin, y);
    
    // Add image below title
    doc.addImage(imgData, 'PNG', margin, y + 5, imgWidth, imgHeight);

    return y + imgHeight + 15;
  } catch (error) {
    console.error(`Error adding chart ${title} to PDF:`, error);
    return y + 10; // Return slightly increased y if failed
  }
};

export const generateAdminReport = async (data: ExportData): Promise<jsPDF> => {
  try {
    const doc = new jsPDF() as PDFWithAutoTable;
    let currentY = 15;

    // Add logo and header
    try {
      const logoResponse = await fetch(ASSETS.LOGO.PDF);
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        const reader = new FileReader();
        reader.readAsDataURL(logoBlob);
        await new Promise((resolve) => {
          reader.onloadend = () => {
            const logoData = reader.result as string;
            doc.addImage(logoData, 'PNG', 15, currentY, 30, 30);
            resolve(null);
          };
        });
      }
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }

    // Add title
    doc.setFontSize(20);
    doc.text('IMD-Care Administrative Report', doc.internal.pageSize.width / 2, currentY + 15, { align: 'center' });
    
    currentY += 25;
    doc.setFontSize(12);
    doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, doc.internal.pageSize.width / 2, currentY, { align: 'center' });
    
    currentY += 7;
    doc.text(
      `Period: ${format(new Date(data.dateFilter.startDate), 'dd/MM/yyyy')} to ${format(new Date(data.dateFilter.endDate), 'dd/MM/yyyy')}`,
      doc.internal.pageSize.width / 2,
      currentY,
      { align: 'center' }
    );
    
    currentY += 15;

    // Add summary section
    doc.setFontSize(14);
    doc.text('Summary Statistics', 14, currentY);
    currentY += 10;

    const summaryData: TableRow[] = [
      {
        cells: [
          { content: 'Total Active Patients' },
          { content: data.patients.filter(p => p.admissions?.[0]?.status === 'active').length.toString() }
        ]
      },
      {
        cells: [
          { content: 'Total Active Consultations' },
          { content: data.consultations.filter(c => c.status === 'active').length.toString() }
        ]
      },
      {
        cells: [
          { content: 'Total Appointments' },
          { content: data.appointments.length.toString() }
        ]
      }
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Metric', 'Count']],
      body: summaryData.map(row => row.cells.map(cell => cell.content)),
      styles: { fontSize: 10 },
      headStyles: { fillColor: PDF_CONSTANTS.COLORS.PRIMARY },
      margin: { left: 14 },
      tableWidth: 100
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // Define chart sections to capture
    const chartSections = [
      { id: '#occupancy-chart', title: 'Occupancy Trend', parentClass: '.bg-white.rounded-xl' },
      { id: '#admission-trends-chart', title: 'Admission Trends', parentClass: '.bg-white.rounded-xl' },
      { id: '#specialty-stats-chart', title: 'Specialty Distribution', parentClass: '.bg-white.rounded-lg' },
      { id: '#doctor-stats-chart', title: 'Doctor Statistics', parentClass: '.space-y-6.bg-white.rounded-xl' },
      { id: '#consultation-metrics-chart', title: 'Consultation Metrics', parentClass: '.bg-white.rounded-xl' },
      { id: '#safety-stats-chart', title: 'Safety Statistics', parentClass: '.bg-white.rounded-xl' },
      { id: '#discharge-stats-chart', title: 'Discharge Statistics', parentClass: '.grid.grid-cols-1' }
    ];

    // Add each chart section
    for (const section of chartSections) {
      const chartElement = document.querySelector(section.id);
      if (chartElement) {
        // Find the parent container that contains the full chart section
        const container = (chartElement.closest(section.parentClass) || chartElement) as HTMLElement;
        
        // Add the chart to the PDF
        currentY = await addChartToPDF(doc, container, section.title, currentY);
        
        // Add a new page if not the last chart
        if (section !== chartSections[chartSections.length - 1]) {
          doc.addPage();
          currentY = 15;
        }
      }
    }

    // Add footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    return doc;
  } catch (error) {
    throw new PDFGenerationError(
      'Failed to generate administrative report',
      { originalError: error },
      'PDF_GENERATION_ERROR'
    );
  }
};

export const exportAdminPDF = async (data: ExportData): Promise<void> => {
  try {
    const doc = await generateAdminReport(data);
    doc.save(`imd-care-admin-report-${format(new Date(), 'dd-MM-yyyy-HHmm')}.pdf`);
  } catch (error) {
    throw new PDFGenerationError(
      'Failed to export administrative report',
      { originalError: error },
      'PDF_EXPORT_ERROR'
    );
  }
};