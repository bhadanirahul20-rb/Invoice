import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '../types';
import { formatIndianCurrency } from '../components/InvoiceTemplate';

/**
 * Format currency amount cleanly using Indian numbering system (e.g. ₹ 1,14,660.00)
 */
export function formatCurrency(amount: number, _currencyCode: string = 'INR'): string {
  return formatIndianCurrency(amount);
}

/**
 * Generates and downloads the exact PDF invoice matching the uploaded reference design
 * with top/bottom geometric banners, dual-swirl logo, and BHADANI COMPLEX watermark
 */
export async function exportInvoiceToPDF(
  invoice: Invoice,
  autoDownload: boolean = true,
  targetElement?: HTMLElement | null
): Promise<Blob> {
  let elementToCapture = targetElement;
  let tempWrapper: HTMLDivElement | null = null;

  try {
    // If no target element provided, try finding the rendered invoice in DOM
    if (!elementToCapture) {
      elementToCapture = document.getElementById('invoice-render-target');
    }

    // If still not available or detached, create an offscreen container to capture
    if (!elementToCapture) {
      tempWrapper = document.createElement('div');
      tempWrapper.style.position = 'fixed';
      tempWrapper.style.top = '-9999px';
      tempWrapper.style.left = '-9999px';
      tempWrapper.style.width = '794px'; // A4 standard width at 96 DPI
      tempWrapper.style.backgroundColor = '#ffffff';
      tempWrapper.style.zIndex = '-1000';

      const contactPhone = invoice.companyPhone || '9431163109';
      const contactEmail = invoice.companyEmail || 'dineshbhadani05@gmail.com';
      const contactPerson = invoice.contactPersonInfo || 'DR D. P. BHADANI +91-9431163109';
      const footerMsg = invoice.footerMessage || 'THANK YOU FOR YOUR BUSINESS!';

      // Render the exact HTML template matching reference image
      tempWrapper.innerHTML = `
        <div style="position: relative; width: 794px; min-height: 1122px; box-sizing: border-box; background-color: #ffffff; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; border: 2px solid #818cf8; overflow: hidden; user-select: none;">
          
          <!-- TOP GEOMETRIC BANNERS -->
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 85px; pointer-events: none; z-index: 0;">
            <svg width="794" height="85" viewBox="0 0 794 85" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
              <polygon points="0,0 580,0 565,8 0,8" fill="#cf5624" />
              <polygon points="0,8 565,8 495,72 0,72" fill="#222222" />
              <polygon points="590,8 794,8 794,18 600,18" fill="#cf5624" />
              <polygon points="560,28 794,28 794,38 570,38" fill="#222222" />
            </svg>
          </div>

          <!-- BOTTOM GEOMETRIC BANNERS -->
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 100px; pointer-events: none; z-index: 0;">
            <svg width="794" height="100" viewBox="0 0 794 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
              <polygon points="0,65 240,65 205,100 0,100" fill="#222222" />
              <polygon points="0,58 248,58 240,65 0,65" fill="#cf5624" />
              <polygon points="260,100 375,30 794,30 794,100" fill="#cf5624" />
            </svg>
          </div>

          <!-- WATERMARK LAYER -->
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; user-select: none; display: flex; align-items: center; justify-content: center; z-index: 0; overflow: hidden;">
            <div style="transform: rotate(-32deg); transform-origin: center; font-size: 68px; font-weight: 900; letter-spacing: 0.22em; color: rgba(0, 0, 0, 0.04); white-space: nowrap; font-family: system-ui, -apple-system, sans-serif;">
              BHADANI COMPLEX
            </div>
          </div>

          <!-- MAIN CONTENT LAYER -->
          <div style="position: relative; z-index: 10; padding: 96px 48px 80px 48px; display: flex; flex-direction: column; justify-content: space-between; min-height: 1122px; box-sizing: border-box;">
            
            <div>
              <!-- Header: Logo + Address + INVOICE # -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                
                <!-- Left: Logo & Address -->
                <div style="display: flex; align-items: center; gap: 14px;">
                  <svg width="54" height="54" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                    <g transform="translate(50,50)">
                      <path d="M -7 -44 C 18 -44 38 -28 35 -6 C 32 14 16 22 2 30 C -12 38 -20 44 -14 48 C -8 52 10 46 16 38 C 12 45 0 49 -10 48 C -32 46 -46 26 -44 0 C -42 -26 -28 -44 -7 -44 Z" fill="#cf5624" />
                      <path d="M 7 44 C -18 44 -38 28 -35 6 C -32 -14 -16 -22 -2 -30 C 12 -38 20 -44 14 -48 C 8 -52 -10 -46 -16 -38 C -12 -45 0 -49 10 -48 C 32 -46 46 -26 44 0 C 42 26 28 44 7 44 Z" fill="#222222" />
                    </g>
                  </svg>
                  <div style="line-height: 1.25;">
                    <div style="font-weight: 800; font-size: 15px; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${invoice.companyName || 'BHADANI COMPLEX'}
                    </div>
                    <div style="font-weight: 700; font-size: 12px; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">
                      SATYAM &nbsp; &nbsp; &nbsp; &nbsp; NAGAR,
                    </div>
                    <div style="font-weight: 700; font-size: 12px; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px;">
                      DHANBAD, 826001
                    </div>
                  </div>
                </div>

                <!-- Right: INVOICE # -->
                <div style="text-align: right; padding-top: 8px;">
                  <span style="font-weight: 800; font-size: 15px; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">
                    INVOICE # ${invoice.invoiceNumber}
                  </span>
                </div>
              </div>

              <!-- Title: INVOICE -->
              <div style="margin: 16px 0 24px 0;">
                <h1 style="margin: 0; font-size: 52px; font-weight: 900; color: #111827; letter-spacing: -1px; line-height: 1;">
                  INVOICE
                </h1>
              </div>

              <!-- Date line -->
              <div style="margin-bottom: 28px; font-size: 14px; color: #111827;">
                <span style="font-weight: 500;">Date : &nbsp; &nbsp;</span>
                <span style="font-weight: 800;">${invoice.date}</span>
              </div>

              <!-- Billed To & From Columns -->
              <div style="display: flex; justify-content: space-between; gap: 40px; margin-bottom: 32px; font-size: 13px;">
                
                <!-- Billed To -->
                <div style="flex: 1;">
                  <div style="font-weight: 800; color: #111827; margin-bottom: 8px;">
                    Billed To :
                  </div>
                  <div style="line-height: 1.5; color: #1f2937;">
                    <div style="font-weight: 700; color: #111827; display: flex; align-items: center; gap: 6px;">
                      <span>🏢</span>
                      <span>${invoice.customerName}</span>
                    </div>
                    ${invoice.customerAddress ? `
                      <div style="display: flex; align-items: flex-start; gap: 6px; color: #374151; margin-top: 3px;">
                        <span>📍</span>
                        <span>${invoice.customerAddress}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <!-- From -->
                <div style="flex: 1;">
                  <div style="font-weight: 800; color: #111827; margin-bottom: 8px;">
                    From :
                  </div>
                  <div style="line-height: 1.5; color: #1f2937;">
                    <div style="font-weight: 700; color: #111827; display: flex; align-items: center; gap: 6px;">
                      <span>👤</span>
                      <span>Dr D. P. Bhadani</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 6px; color: #374151; margin-top: 3px;">
                      <span>📍</span>
                      <span>${invoice.companyAddress || 'Satyam Nagar, Dhanbad, 826001'}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; color: #374151; margin-top: 3px;">
                      <span>✉️</span>
                      <span>${contactEmail}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Line Items Table -->
              <div style="margin-bottom: 24px;">
                <div style="background-color: #e5e7eb; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 800; color: #111827; letter-spacing: 0.5px;">
                  <span>ITEM DESCRIPTION</span>
                  <span>AMOUNT</span>
                </div>
                <div>
                  ${invoice.items.map((item) => `
                    <div style="padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; border-bottom: 1px solid #f3f4f6;">
                      <span style="color: #111827; font-weight: 500;">${item.description}</span>
                      <span style="color: #111827; font-weight: 700; font-family: monospace;">${formatIndianCurrency(item.amount)}</span>
                    </div>
                  `).join('')}
                </div>
                <div style="width: 100%; height: 1px; background-color: #e5e7eb; margin-top: 8px;"></div>
              </div>

              <!-- Totals Section -->
              <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
                <div style="width: 256px; font-size: 13px; line-height: 1.6;">
                  <div style="display: flex; justify-content: space-between; color: #1f2937;">
                    <span>Subtotal</span>
                    <span style="font-weight: 600; font-family: monospace;">${formatIndianCurrency(invoice.subtotal)}</span>
                  </div>
                  ${invoice.taxRate ? `
                    <div style="display: flex; justify-content: space-between; color: #1f2937;">
                      <span>Tax Rate</span>
                      <span style="font-weight: 600; font-family: monospace;">${invoice.taxRate}</span>
                    </div>
                  ` : ''}
                  ${invoice.additionalCosts ? `
                    <div style="display: flex; justify-content: space-between; color: #1f2937;">
                      <span>Additional Costs</span>
                      <span style="font-weight: 600; font-family: monospace;">${formatIndianCurrency(invoice.additionalCosts)}</span>
                    </div>
                  ` : ''}
                  <div style="display: flex; justify-content: space-between; font-weight: 800; color: #111827; border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 4px;">
                    <span>TOTAL COST</span>
                    <span style="font-size: 14px; font-family: monospace;">${formatIndianCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>

              <!-- Purpose in bold terracotta/orange -->
              ${invoice.forPurpose ? `
                <div style="margin-bottom: 24px; font-size: 14px; font-weight: 800; color: #cf5624;">
                  Purpose : ${invoice.forPurpose}
                </div>
              ` : ''}
            </div>

            <!-- FOOTER DETAILS -->
            <div style="padding-top: 16px;">
              <div style="display: flex; justify-content: space-between; gap: 32px; font-size: 12px; line-height: 1.3;">
                <div style="color: #1f2937; font-weight: 600;">
                  <div><span style="font-weight: normal;">Phone &nbsp; &nbsp; &nbsp; &nbsp;: &nbsp;</span><span>${contactPhone}</span></div>
                  <div style="margin-top: 3px;"><span style="font-weight: normal;">Email &nbsp; &nbsp; &nbsp; &nbsp; : &nbsp;</span><span>${contactEmail}</span></div>
                  <div style="margin-top: 8px; font-weight: 900; color: #111827; letter-spacing: 0.5px; text-transform: uppercase;">
                    ${footerMsg}
                  </div>
                </div>
                <div style="max-width: 320px; font-size: 11px; color: #1f2937; font-weight: 800; line-height: 1.4; text-transform: uppercase;">
                  IF YOU HAVE ANY QUESTIONS CONCERNING THIS INVOICE, CONTACT: ${contactPerson}
                </div>
              </div>
            </div>

          </div>
        </div>
      `;

      document.body.appendChild(tempWrapper);
      elementToCapture = tempWrapper.firstElementChild as HTMLElement;
    }

    // Capture using html2canvas with 2x scale for print-quality crispness
    const canvas = await html2canvas(elementToCapture, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Fit into A4 page
    doc.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));

    if (autoDownload) {
      const sanitizedCust = invoice.customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Invoice_${invoice.invoiceNumber || '13'}_${sanitizedCust}.pdf`;
      doc.save(filename);
    }

    return doc.output('blob');
  } catch (error) {
    console.error('Error generating PDF with html2canvas, falling back to vector:', error);
    return generateVectorFallbackPDF(invoice, autoDownload);
  } finally {
    if (tempWrapper && tempWrapper.parentNode) {
      tempWrapper.parentNode.removeChild(tempWrapper);
    }
  }
}

/**
 * Pure vector fallback in case canvas capture encounters an environment error
 */
function generateVectorFallbackPDF(invoice: Invoice, autoDownload: boolean): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // WATERMARK
  doc.saveGraphicsState();
  doc.setTextColor(245, 245, 245);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(38);
  doc.text('BHADANI COMPLEX', pageWidth / 2, 145, {
    align: 'center',
    angle: 35
  });
  doc.restoreGraphicsState();

  // Top Geometric Accent: Orange top stripe + black angled polygon
  doc.setFillColor(207, 86, 36); // #cf5624
  doc.rect(0, 0, 150, 2, 'F');
  doc.setFillColor(34, 34, 34); // #222222
  doc.rect(0, 2, 140, 14, 'F');

  // Top right stripes
  doc.setFillColor(207, 86, 36);
  doc.rect(155, 3, 55, 2, 'F');
  doc.setFillColor(34, 34, 34);
  doc.rect(150, 7, 60, 2.5, 'F');

  // Bottom Accents
  doc.setFillColor(34, 34, 34);
  doc.rect(0, 285, 60, 12, 'F');
  doc.setFillColor(207, 86, 36);
  doc.rect(0, 283, 62, 2, 'F');
  doc.rect(70, 275, 140, 22, 'F');

  // Company Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text(invoice.companyName || 'BHADANI COMPLEX', margin + 14, 28);

  doc.setFontSize(9);
  doc.text('SATYAM   NAGAR,', margin + 14, 33);
  doc.text('DHANBAD, 826001', margin + 14, 37);

  // INVOICE #
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`INVOICE # ${invoice.invoiceNumber}`, pageWidth - margin, 28, { align: 'right' });

  // INVOICE big heading
  doc.setFontSize(32);
  doc.setTextColor(17, 24, 39);
  doc.text('INVOICE', margin, 52);

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Date :   ', margin, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.date, margin + 14, 60);

  // Billed To & From
  const colWidth = (contentWidth - 10) / 2;
  let curY = 70;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Billed To :', margin, curY);
  doc.text('From :', margin + colWidth + 10, curY);

  curY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(invoice.customerName, margin, curY);
  doc.text('Dr D. P. Bhadani', margin + colWidth + 10, curY);

  curY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  if (invoice.customerAddress) {
    const splitAddr = doc.splitTextToSize(invoice.customerAddress, colWidth - 4);
    doc.text(splitAddr, margin, curY);
  }
  doc.text(invoice.companyAddress || 'Satyam Nagar, Dhanbad, 826001', margin + colWidth + 10, curY);

  curY += 6;
  doc.text(invoice.companyEmail || 'dineshbhadani05@gmail.com', margin + colWidth + 10, curY);

  // Items table
  curY += 12;
  doc.setFillColor(229, 231, 235); // #e5e7eb
  doc.rect(margin, curY, contentWidth, 7, 'F');
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ITEM DESCRIPTION', margin + 4, curY + 4.8);
  doc.text('AMOUNT', pageWidth - margin - 4, curY + 4.8, { align: 'right' });

  curY += 12;
  invoice.items.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text(item.description, margin + 4, curY);

    doc.setFont('helvetica', 'bold');
    const amtStr = `Rs. ${Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    doc.text(amtStr, pageWidth - margin - 4, curY, { align: 'right' });

    doc.setDrawColor(243, 244, 246);
    doc.line(margin, curY + 3, pageWidth - margin, curY + 3);
    curY += 8;
  });

  // Totals
  curY += 6;
  const totalsX = pageWidth - margin - 65;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text('Subtotal', totalsX, curY);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, curY, { align: 'right' });

  curY += 5.5;
  if (invoice.additionalCosts) {
    doc.setFont('helvetica', 'normal');
    doc.text('Additional Costs', totalsX, curY);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${Number(invoice.additionalCosts).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, curY, { align: 'right' });
    curY += 5.5;
  }

  doc.setDrawColor(229, 231, 235);
  doc.line(totalsX, curY - 1, pageWidth - margin, curY - 1);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text('TOTAL COST', totalsX, curY + 4);
  doc.text(`Rs. ${Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 4, curY + 4, { align: 'right' });

  // Purpose
  if (invoice.forPurpose) {
    curY += 16;
    doc.setTextColor(207, 86, 36);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Purpose : ${invoice.forPurpose}`, margin, curY);
  }

  // Footer Contacts
  curY = 260;
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Phone   :   ${invoice.companyPhone || '9431163109'}`, margin, curY);
  doc.text(`Email   :   ${invoice.companyEmail || 'dineshbhadani05@gmail.com'}`, margin, curY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text(invoice.footerMessage || 'THANK YOU FOR YOUR BUSINESS!', margin, curY + 11);

  // Right side contact query
  doc.setFontSize(7.5);
  const note = `IF YOU HAVE ANY QUESTIONS CONCERNING THIS INVOICE, CONTACT: ${invoice.contactPersonInfo || 'DR D. P. BHADANI +91-9431163109'}`;
  const splitNote = doc.splitTextToSize(note, 80);
  doc.text(splitNote, pageWidth - margin, curY, { align: 'right' });

  if (autoDownload) {
    const filename = `Invoice_${invoice.invoiceNumber || '13'}.pdf`;
    doc.save(filename);
  }

  return doc.output('blob');
}
