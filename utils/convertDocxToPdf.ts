import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function convertDocxToPdf(
  file: File,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  // 1. Convert DOCX to HTML with enhanced styling support
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
        "p[style-name='Title'] => h1.title:fresh",
        "p[style-name='Subtitle'] => h2.subtitle:fresh",
        "table => table.w-full.border-collapse.my-4",
        "tr => tr",
        "td => td.p-2.border",
        "th => th.p-2.border.font-bold",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "r[style-name='Underline'] => u",
        "chart => div.chart-container.relative"
      ],
      includeDefaultStyleMap: true,
      convertImage: mammoth.images.imgElement(async (image) => {
        const buffer = await image.read("base64");
        return {
          src: `data:${image.contentType};base64,${buffer}`,
          style: 'max-width: 100%; height: auto;'
        };
      })
    }
  );

  // 2. Create container with optimized styling that preserves headers
  const container = document.createElement('div');
  container.innerHTML = html;
  Object.assign(container.style, {
    width: '8.5in',
    padding: '1in',
    fontFamily: 'Arial, sans-serif',
    color: '#000000',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box'
  });

  // Add comprehensive CSS for proper formatting
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    /* Header styling with proper hierarchy */
    h1 {
      font-size: 24pt !important;
      font-weight: bold !important;
      margin: 24px 0 12px 0 !important;
      line-height: 1.2 !important;
    }
    h2 {
      font-size: 20pt !important;
      font-weight: bold !important;
      margin: 20px 0 10px 0 !important;
      line-height: 1.3 !important;
    }
    h3 {
      font-size: 16pt !important;
      font-weight: bold !important;
      margin: 16px 0 8px 0 !important;
      line-height: 1.4 !important;
    }
    h4 {
      font-size: 14pt !important;
      font-weight: bold !important;
      margin: 14px 0 7px 0 !important;
      line-height: 1.4 !important;
    }
    h5 {
      font-size: 12pt !important;
      font-weight: bold !important;
      margin: 12px 0 6px 0 !important;
      line-height: 1.4 !important;
    }
    h6 {
      font-size: 11pt !important;
      font-weight: bold !important;
      margin: 11px 0 5.5px 0 !important;
      line-height: 1.4 !important;
    }
    .title {
      font-size: 28pt !important;
      margin-bottom: 12px !important;
    }
    .subtitle {
      font-size: 18pt !important;
      font-weight: normal !important;
      margin-top: 0 !important;
      margin-bottom: 24px !important;
    }
    
    /* Body text styling */
    p, li, td {
      font-size: 12pt !important;
      line-height: 1.5 !important;
    }
    
    /* Table styling */
    table.w-full {
      width: 100% !important;
      page-break-inside: avoid;
    }
    table.border-collapse {
      border-collapse: collapse !important;
    }
    td.border, th.border {
      border: 1px solid #000000 !important;
      padding: 8px !important;
    }
    th {
      background-color: #f3f4f6 !important;
      text-align: left !important;
      font-weight: bold !important;
    }

    /* Chart styling */
    .chart-container {
      width: 100% !important;
      height: auto !important;
      page-break-inside: avoid;
    }
    .chart-container img {
      width: 100% !important;
      height: auto !important;
    }

    /* General document styling */
    * {
      color: #000000 !important;
      background-color: transparent !important;
    }
    body, html, div {
      background-color: #ffffff !important;
    }
  `;
  container.appendChild(styleElement);
  document.body.appendChild(container);

  try {
    onProgress?.(10);

    // 3. High-quality rendering with style preservation
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
      onclone: (clonedDoc) => {
        // Ensure all elements are visible
        clonedDoc.querySelectorAll('*').forEach(el => {
          const element = el as HTMLElement;
          element.style.boxShadow = 'none';
          element.style.textShadow = 'none';
        });
      }
    });

    onProgress?.(70);

    // 4. Create PDF with proper formatting
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter'
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
    
    // Handle multi-page documents
    let heightLeft = imgHeight;
    const pageHeight = pdf.internal.pageSize.getHeight();
    let position = 0;
    let pageNum = 1;
    
    while (heightLeft > 0) {
      position = heightLeft - pageHeight;
      if (position > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -position, pdfWidth, imgHeight);
        pageNum++;
      }
      heightLeft -= pageHeight;
      onProgress?.(70 + (30 * (1 - heightLeft/imgHeight)));
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}