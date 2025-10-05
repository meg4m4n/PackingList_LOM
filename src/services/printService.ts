import { PackingList } from '../types';
import QRCode from 'qrcode';

const ZEBRA_PAPER_SIZE = {
  width: '100mm',
  height: '150mm',
};

const A4_PAPER_SIZE = {
  width: '210mm',
  height: '297mm',
};

const BOXES_PER_PAGE = 10; // Maximum number of boxes to show per page

async function generateQRCodeDataURL(code: string): Promise<string> {
  try {
    return await QRCode.toDataURL(code, {
      width: 128,
      margin: 1,
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

function validatePackingList(packingList: PackingList): void {
  if (!packingList) {
    throw new Error('Invalid packing list: No data provided');
  }
  if (!Array.isArray(packingList.boxes) || packingList.boxes.length === 0) {
    throw new Error('Invalid packing list: No boxes found');
  }
  if (!packingList.client?.name || !packingList.client?.address) {
    throw new Error('Invalid packing list: Missing client information');
  }
  if (!packingList.code) {
    throw new Error('Invalid packing list: Missing code');
  }
}

export function generatePrintStyles(type: 'a4' | 'label'): string {
  const paperSize = type === 'label' ? ZEBRA_PAPER_SIZE : A4_PAPER_SIZE;
  
  return `
    @page {
      size: ${paperSize.width} ${paperSize.height};
      margin: ${type === 'label' ? '5mm' : '10mm'};
    }
    @media print {
      body {
        width: ${paperSize.width};
        height: ${paperSize.height};
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        font-size: ${type === 'label' ? '9pt' : '10pt'};
      }
      .no-print {
        display: none !important;
      }
      .page {
        page-break-after: always;
        position: relative;
        padding-bottom: 20px;
      }
      .page:last-child {
        page-break-after: avoid;
      }
      .page-number {
        position: absolute;
        bottom: 10px;
        right: 10px;
        font-size: 8pt;
        color: #666;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1rem;
        page-break-inside: avoid;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 4px;
        text-align: left;
        font-size: ${type === 'label' ? '8pt' : '9pt'};
      }
      th {
        background-color: #f8f9fa;
      }
      .box-label {
        page-break-after: always;
        border: 1px solid #000;
        padding: 5mm;
        height: ${ZEBRA_PAPER_SIZE.height};
        box-sizing: border-box;
        position: relative;
      }
      .box-label:last-child {
        page-break-after: avoid;
      }
      .label-header {
        text-align: center;
        font-size: 12pt;
        font-weight: bold;
        margin-bottom: 3mm;
        border-bottom: 1px solid #000;
      }
      .label-code {
        font-size: 10pt;
        margin-bottom: 3mm;
      }
      .total-row {
        font-weight: bold;
        background-color: #f8f9fa;
      }
      .sizes-cell {
        font-size: ${type === 'label' ? '7pt' : '8pt'};
      }
      .qr-code {
        position: absolute;
        top: 5mm;
        right: 5mm;
        width: 20mm;
        height: 20mm;
      }
      .page-header {
        margin-bottom: 15px;
        border-bottom: 1px solid #ddd;
        padding-bottom: 10px;
      }
      .continuation-header {
        font-size: 10pt;
        color: #666;
        margin-bottom: 10px;
      }
    }
  `;
}

export async function printDocument(type: 'a4' | 'label', packingList: PackingList): Promise<void> {
  try {
    // Ensure we have a valid packing list with required data
    validatePackingList(packingList);

    const qrCodeDataURL = await generateQRCodeDataURL(packingList.code);
    if (!qrCodeDataURL) {
      throw new Error('Failed to generate QR code');
    }

    // Create a hidden iframe for printing instead of opening a new window
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    document.body.appendChild(iframe);

    const content = type === 'label'
      ? await generateLabelContent(packingList, qrCodeDataURL)
      : await generateA4Content(packingList, qrCodeDataURL);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      throw new Error('Failed to access print frame');
    }

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${type === 'label' ? 'Labels' : 'Packing List'} - ${packingList.code}</title>
          <meta charset="UTF-8">
          <style>${generatePrintStyles(type)}</style>
        </head>
        <body>${content}</body>
      </html>
    `);
    iframeDoc.close();

    // Wait for content to load before printing
    await new Promise<void>((resolve) => {
      if (iframeDoc.readyState === 'complete') {
        resolve();
      } else {
        iframe.onload = () => resolve();
      }
    });

    // Small delay to ensure images are loaded
    await new Promise(resolve => setTimeout(resolve, 100));

    // Trigger print
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Clean up after printing
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch (e) {
        console.warn('Could not remove print frame:', e);
      }
    }, 1000);

  } catch (error) {
    console.error('Print error:', error);
    throw error;
  }
}

async function generateLabelContent(packingList: PackingList, qrCodeDataURL: string): Promise<string> {
  return (packingList.boxes || []).map((box, index) => {
    if (!box) return '';

    const styleTotals = (box.models || []).reduce((acc, model) => {
      if (!model) return acc;

      const key = `${model.modelReference || ''}-${model.color || ''}`;
      if (!acc[key]) {
        acc[key] = {
          style: model.modelReference || '',
          description: model.modelDescription || '',
          color: model.color || '',
          sizes: {},
          total: 0
        };
      }
      
      (model.sizeQuantities || []).forEach(sq => {
        if (!sq) return;
        const sizeKey = box.sizeDescriptions?.[sq.size] || sq.size || '';
        if (!acc[key].sizes[sizeKey]) acc[key].sizes[sizeKey] = 0;
        acc[key].sizes[sizeKey] += sq.quantity || 0;
        acc[key].total += sq.quantity || 0;
      });
      
      return acc;
    }, {} as Record<string, { style: string; description: string; color: string; sizes: Record<string, number>; total: number }>);

    return `
      <div class="box-label">
        <img src="${qrCodeDataURL}" class="qr-code" alt="QR Code" />
        <div class="label-header">LOMARTEX</div>
        <div class="label-code">${packingList.code}</div>
        ${packingList.po ? `<div style="font-size: 9pt; margin-bottom: 2mm">PO: ${packingList.po}</div>` : ''}
        
        <div style="margin-bottom: 3mm">
          <div style="float: left; width: 60%">
            <strong>Box:</strong> ${(box.boxNumber || index + 1)}/${packingList.boxes?.length || 0}<br>
            <strong>Weight:</strong> ${box.grossWeight || 0}kg<br>
            <strong>Dimensions:</strong> ${box.dimensions?.length || 0}x${box.dimensions?.width || 0}x${box.dimensions?.height || 0}cm<br>
            <strong>Tracking:</strong> ${packingList.trackingNumbers?.[index] || 'N/A'}
          </div>
          <div style="float: right; width: 40%">
            <strong>To:</strong><br>
            ${packingList.client?.name || ''}<br>
            ${packingList.client?.address?.street || ''}<br>
            ${packingList.client?.address?.city || ''}, ${packingList.client?.address?.state || ''}<br>
            ${packingList.client?.address?.postalCode || ''}<br>
            ${packingList.client?.address?.country || ''}
          </div>
          <div style="clear: both"></div>
        </div>

        <table style="font-size: 7pt">
          <thead>
            <tr>
              <th>Style</th>
              <th>Description</th>
              <th>Color</th>
              <th>Sizes</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${Object.values(styleTotals).map(item => `
              <tr>
                <td>${item.style}</td>
                <td>${item.description}</td>
                <td>${item.color}</td>
                <td class="sizes-cell">${Object.entries(item.sizes)
                  .map(([size, qty]) => `${size}:${qty}`)
                  .join(' ')}</td>
                <td style="text-align: right">${item.total}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4">Total Items</td>
              <td style="text-align: right">${Object.values(styleTotals)
                .reduce((sum, item) => sum + item.total, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }).join('');
}

async function generateA4Content(packingList: PackingList, qrCodeDataURL: string): Promise<string> {
  const boxes = packingList.boxes || [];
  const totalPages = Math.ceil(boxes.length / BOXES_PER_PAGE);

  const styleTotals = boxes.reduce((acc, box) => {
    if (!box) return acc;

    (box.models || []).forEach(model => {
      if (!model) return;
      
      const key = `${model.modelReference || ''}-${model.color || ''}`;
      if (!acc[key]) {
        acc[key] = {
          style: model.modelReference || '',
          description: model.modelDescription || '',
          color: model.color || '',
          sizes: {},
          total: 0,
          sizeDescriptions: box.sizeDescriptions || {}
        };
      }
      
      (model.sizeQuantities || []).forEach(sq => {
        if (!sq) return;
        const sizeKey = box.sizeDescriptions?.[sq.size] || sq.size || '';
        if (!acc[key].sizes[sizeKey]) acc[key].sizes[sizeKey] = 0;
        acc[key].sizes[sizeKey] += sq.quantity || 0;
        acc[key].total += sq.quantity || 0;
      });
    });
    return acc;
  }, {} as Record<string, { 
    style: string; 
    description: string; 
    color: string; 
    sizes: Record<string, number>; 
    total: number;
    sizeDescriptions: Record<string, string>;
  }>);

  const totalItems = Object.values(styleTotals).reduce((sum, item) => sum + item.total, 0);

  // Generate header and summary content (first page)
  let content = `
    <div class="page">
      <div style="text-align: center; margin-bottom: 5mm; position: relative;">
        <img src="${qrCodeDataURL}" style="position: absolute; top: 0; right: 0; width: 20mm; height: 20mm;" alt="QR Code" />
        <h1 style="font-size: 18pt; margin: 0">LOMARTEX</h1>
        <div style="font-size: 12pt; margin-top: 2mm">${packingList.code}</div>
        ${packingList.po ? `<div style="font-size: 10pt; margin-top: 2mm; color: #666">PO: ${packingList.po}</div>` : ''}
      </div>

      <div style="margin-bottom: 5mm">
        <table>
          <tr>
            <td style="width: 50%; vertical-align: top">
              <strong>Client Information</strong><br>
              ${packingList.client?.name || ''}<br>
              ${packingList.client?.address?.street || ''}<br>
              ${packingList.client?.address?.city || ''}, ${packingList.client?.address?.state || ''}<br>
              ${packingList.client?.address?.postalCode || ''}<br>
              ${packingList.client?.address?.country || ''}
            </td>
            <td style="width: 50%; vertical-align: top">
              <strong>Summary</strong><br>
              ${packingList.po ? `PO: ${packingList.po}<br>` : ''}
              Total Boxes: ${boxes.length || 0}<br>
              Total Items: ${totalItems}<br>
              Carrier: ${packingList.carrier || ''}${packingList.customCarrier ? ` - ${packingList.customCarrier}` : ''}<br>
              ${packingList.trackingNumbers?.length === 1
                ? `Tracking: ${packingList.trackingNumbers[0]}`
                : 'Tracking: Multiple numbers (see box details)'}
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 5mm">
        <strong>Box Summary</strong>
        <table>
          <thead>
            <tr>
              <th>Style</th>
              <th>Description</th>
              <th>Color</th>
              <th class="sizes-cell">Sizes</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${Object.values(styleTotals).map(item => `
              <tr>
                <td>${item.style}</td>
                <td>${item.description}</td>
                <td>${item.color}</td>
                <td class="sizes-cell">${Object.entries(item.sizes)
                  .map(([size, qty]) => `${size}:${qty}`)
                  .join(' ')}</td>
                <td style="text-align: right">${item.total}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4">Total Items</td>
              <td style="text-align: right">${totalItems}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="page-number">Page 1 of ${totalPages + 1}</div>
    </div>
  `;

  // Generate box details pages
  for (let page = 0; page < totalPages; page++) {
    const startIndex = page * BOXES_PER_PAGE;
    const endIndex = Math.min(startIndex + BOXES_PER_PAGE, boxes.length);
    const pageBoxes = boxes.slice(startIndex, endIndex);

    content += `
      <div class="page">
        <div class="page-header">
          <div style="text-align: center; font-size: 14pt; margin-bottom: 5mm">
            LOMARTEX - ${packingList.code}
          </div>
          <div class="continuation-header">Box Details (continued)</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Box</th>
              <th>Style</th>
              <th>Color</th>
              <th class="sizes-cell">Sizes</th>
              <th>Total</th>
              <th>Measurements</th>
              ${(packingList.trackingNumbers?.length || 0) > 1 ? '<th>Tracking</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${pageBoxes.map((box, index) => {
              if (!box) return '';
              
              const boxTotal = (box.models || []).reduce((sum, model) => 
                sum + ((model?.sizeQuantities || []).reduce((s, sq) => s + (sq?.quantity || 0), 0) || 0), 0);
              
              const absoluteIndex = startIndex + index;
              
              return `
                <tr>
                  <td>${(box.boxNumber || absoluteIndex + 1)}/${boxes.length || 0}</td>
                  <td>${(box.models || []).map(m => m?.modelReference || '').filter(Boolean).join('<br>')}</td>
                  <td>${(box.models || []).map(m => m?.color || '').filter(Boolean).join('<br>')}</td>
                  <td class="sizes-cell">${(box.models || []).map(m => 
                    (m?.sizeQuantities || [])
                      .filter(sq => sq && sq.quantity > 0)
                      .map(sq => `${box.sizeDescriptions?.[sq.size] || sq.size}:${sq.quantity}`)
                      .join(' ')
                  ).filter(Boolean).join('<br>')}</td>
                  <td style="text-align: right">${boxTotal}</td>
                  <td>${box.dimensions?.length || 0}x${box.dimensions?.width || 0}x${box.dimensions?.height || 0}cm<br>${box.grossWeight || 0}kg</td>
                  ${(packingList.trackingNumbers?.length || 0) > 1 
                    ? `<td>${packingList.trackingNumbers?.[absoluteIndex] || 'N/A'}</td>` 
                    : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div class="page-number">Page ${page + 2} of ${totalPages + 1}</div>
      </div>
    `;
  }

  return content;
}