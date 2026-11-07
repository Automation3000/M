export type ThermalBillSize = '58mm' | '80mm';

export function printThermalReceipt(
  receiptElementId: string = 'thermal-receipt-preview',
  billSize: ThermalBillSize = '58mm'
) {
  const el = document.getElementById(receiptElementId);
  if (!el) {
    window.print();
    return;
  }

  let printFrame = document.getElementById('pos-isolated-print-frame') as HTMLIFrameElement;
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'pos-isolated-print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);
  }

  const doc = printFrame.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const rollWidth = billSize === '58mm' ? '58mm' : '80mm';
  const printableWidth = billSize === '58mm' ? '48mm' : '72mm';
  const fontSize = billSize === '58mm' ? '9px' : '11px';
  const lineHeight = billSize === '58mm' ? '1.18' : '1.35';

  doc.open();
  doc.write(`<!DOCTYPE html><html><head><title>${billSize === '58mm' ? '58mm (2-Inch)' : '80mm (3-Inch)'} POS Receipt</title>`);
  doc.write('<style>');
  doc.write(`@page { size: ${rollWidth} auto; margin: 0; }`);
  doc.write('@media print {');
  doc.write(`  html, body { width: ${printableWidth} !important; max-width: ${printableWidth} !important; margin: 0 auto !important; padding: 0 !important; background: #fff !important; color: #000 !important; font-family: 'Courier New', Courier, monospace !important; font-size: ${fontSize} !important; line-height: ${lineHeight} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }`);
  doc.write('  * { box-sizing: border-box !important; margin-left: 0; margin-right: 0; }');
  doc.write('  img, svg { image-rendering: -webkit-optimize-contrast !important; image-rendering: pixelated !important; image-rendering: crisp-edges !important; display: block !important; margin: 0 auto !important; }');
  doc.write('}');
  doc.write(`html, body { width: ${printableWidth}; max-width: ${printableWidth}; margin: 0 auto; padding: 1mm 0; background: #fff; color: #000; font-family: 'Courier New', Courier, monospace; font-size: ${fontSize}; line-height: ${lineHeight}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`);
  doc.write('* { box-sizing: border-box; }');
  doc.write('img, svg { max-width: 100%; height: auto; display: block; margin: 0 auto; image-rendering: pixelated; image-rendering: crisp-edges; }');
  doc.write('</style></head><body>');
  doc.write(el.outerHTML);
  doc.write('</body></html>');
  doc.close();

  setTimeout(() => {
    try {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print error, falling back to window.print():', err);
      window.print();
    }
  }, 280);
}
