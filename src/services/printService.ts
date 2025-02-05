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
  if (!packingList.boxes || !Array.isArray(packingList.boxes) || packingList.boxes.length === 0) {
    throw new Error('Invalid packing list: No boxes found');
  }
  if (!packingList.client || !packingList.client.name || !packingList.client.address) {
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
    }
  `;
}

export async function printDocument(type: 'a4' | 'label', packingList: PackingList): Promise<void> {
  try {
    validatePackingList(packingList);

    const qrCodeDataURL = await generateQRCodeDataURL(packingList.code);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window. Please check if pop-ups are blocked.');
    }

    const content = type === 'label' 
      ? await generateLabelContent(packingList, qrCodeDataURL) 
      : await generateA4Content(packingList, qrCodeDataURL);

    printWindow.document.write(`
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

    printWindow.document.close();

    await new Promise<void>((resolve) => {
      printWindow.onload = () => {
        setTimeout(resolve, 500);
      };
    });

    printWindow.focus();
    printWindow.print();
    setTimeout(() => printWindow.close(), 1000);

  } catch (error) {
    console.error('Print error:', error);
    alert(error instanceof Error ? error.message : 'Failed to generate print document');
  }
}

async function generateLabelContent(packingList: PackingList, qrCodeDataURL: string): Promise<string> {
  return packingList.boxes.map((box) => {
    const styleTotals = box.models.reduce((acc, model) => {
      const key = `${model.modelReference}-${model.color}`;
      if (!acc[key]) {
        acc[key] = {
          style: model.modelReference,
          color: model.color,
          sizes: {},
          total: 0
        };
      }
      
      model.sizeQuantities?.forEach(sq => {
        const sizeKey = box.sizeDescriptions?.[sq.size] || sq.size;
        if (!acc[key].sizes[sizeKey]) acc[key].sizes[sizeKey] = 0;
        acc[key].sizes[sizeKey] += sq.quantity;
        acc[key].total += sq.quantity;
      });
      
      return acc;
    }, {} as Record<string, { style: string; color: string; sizes: Record<string, number>; total: number }>);

    return `
      <div class="box-label">
        <img src="${qrCodeDataURL}" class="qr-code" alt="QR Code" />
        <div class="label-header">LOMARTEX</div>
        <div class="label-code">${packingList.code}</div>
        
        <div style="margin-bottom: 3mm">
          <div style="float: left; width: 60%">
            <strong>Box:</strong> ${box.boxNumber}/${packingList.boxes.length}<br>
            <strong>Weight:</strong> ${box.grossWeight}kg<br>
            <strong>Dimensions:</strong> ${box.dimensions.length}x${box.dimensions.width}x${box.dimensions.height}cm<br>
            <strong>Tracking:</strong> ${packingList.trackingNumbers?.[box.boxNumber - 1] || 'N/A'}
          </div>
          <div style="float: right; width: 40%">
            <strong>To:</strong><br>
            ${packingList.client.name}<br>
            ${packingList.client.address.street}<br>
            ${packingList.client.address.city}, ${packingList.client.address.state}<br>
            ${packingList.client.address.postalCode}<br>
            ${packingList.client.address.country}
          </div>
          <div style="clear: both"></div>
        </div>

        <table style="font-size: 8pt">
          <thead>
            <tr>
              <th>Style</th>
              <th>Color</th>
              <th>Sizes</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${Object.values(styleTotals).map(item => `
              <tr>
                <td>${item.style}</td>
                <td>${item.color}</td>
                <td class="sizes-cell">${Object.entries(item.sizes)
                  .map(([size, qty]) => `${size}:${qty}`)
                  .join(' ')}</td>
                <td style="text-align: right">${item.total}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3">Total Items</td>
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
  const styleTotals = packingList.boxes.reduce((acc, box) => {
    box.models.forEach(model => {
      const key = `${model.modelReference}-${model.color}`;
      if (!acc[key]) {
        acc[key] = {
          style: model.modelReference,
          description: model.modelDescription,
          color: model.color,
          sizes: {},
          total: 0,
          sizeDescriptions: box.sizeDescriptions || {}
        };
      }
      
      model.sizeQuantities?.forEach(sq => {
        const sizeKey = box.sizeDescriptions?.[sq.size] || sq.size;
        if (!acc[key].sizes[sizeKey]) acc[key].sizes[sizeKey] = 0;
        acc[key].sizes[sizeKey] += sq.quantity;
        acc[key].total += sq.quantity;
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

  return `
    <div style="text-align: center; margin-bottom: 5mm; position: relative;">
      <img src="${qrCodeDataURL}" style="position: absolute; top: 0; right: 0; width: 20mm; height: 20mm;" alt="QR Code" />
      <h1 style="font-size: 18pt; margin: 0">LOMARTEX</h1>
      <div style="font-size: 12pt; margin-top: 2mm">${packingList.code}</div>
    </div>

    <div style="margin-bottom: 5mm">
      <table>
        <tr>
          <td style="width: 50%; vertical-align: top">
            <strong>Client Information</strong><br>
            ${packingList.client.name}<br>
            ${packingList.client.address.street}<br>
            ${packingList.client.address.city}, ${packingList.client.address.state}<br>
            ${packingList.client.address.postalCode}<br>
            ${packingList.client.address.country}
          </td>
          <td style="width: 50%; vertical-align: top">
            <strong>Summary</strong><br>
            Total Boxes: ${packingList.boxes.length}<br>
            Total Items: ${totalItems}<br>
            Carrier: ${packingList.carrier}${packingList.customCarrier ? ` - ${packingList.customCarrier}` : ''}<br>
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

    <div>
      <strong>Box Details</strong>
      <table>
        <thead>
          <tr>
            <th>Box</th>
            <th>Style</th>
            <th>Color</th>
            <th class="sizes-cell">Sizes</th>
            <th>Total</th>
            <th>Measurements</th>
            ${packingList.trackingNumbers?.length > 1 ? '<th>Tracking</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${packingList.boxes.map((box, index) => {
            const boxTotal = box.models.reduce((sum, model) => 
              sum + (model.sizeQuantities?.reduce((s, sq) => s + sq.quantity, 0) || 0), 0);
            
            return `
              <tr>
                <td>${box.boxNumber}/${packingList.boxes.length}</td>
                <td>${box.models.map(m => m.modelReference).join('<br>')}</td>
                <td>${box.models.map(m => m.color).join('<br>')}</td>
                <td class="sizes-cell">${box.models.map(m => 
                  m.sizeQuantities
                    ?.filter(sq => sq.quantity > 0)
                    ?.map(sq => `${box.sizeDescriptions?.[sq.size] || sq.size}:${sq.quantity}`)
                    ?.join(' ')
                ).join('<br>')}</td>
                <td style="text-align: right">${boxTotal}</td>
                <td>${box.dimensions.length}x${box.dimensions.width}x${box.dimensions.height}cm<br>${box.grossWeight}kg</td>
                ${packingList.trackingNumbers?.length > 1 
                  ? `<td>${packingList.trackingNumbers[index] || 'N/A'}</td>` 
                  : ''}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}