const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');

exports.generateReceiptPDF = async (dealInfo, customer) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setTextColor(22, 163, 74);
  doc.text('Green Era Recyclers', pageW / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('E-Waste Management & Recycling', pageW / 2, 27, { align: 'center' });

  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.5);
  doc.line(14, 32, pageW - 14, 32);

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Collection Receipt', pageW / 2, 42, { align: 'center' });

  doc.setFontSize(10);
  let y = 52;
  const leftX = 20;
  const labelX = 65;
  const lineH = 8;

  const fields = [
    { label: 'Receipt No', value: dealInfo.receipt_number || 'N/A' },
    { label: 'Deal No', value: dealInfo.deal_number || 'N/A' },
    { label: 'Collection No', value: dealInfo.collection_number || 'N/A' },
    { label: 'Customer', value: customer.customer_name || '-' },
    { label: 'Phone', value: customer.customer_phone || '-' },
    { label: 'Email', value: customer.customer_email || '-' },
    { label: 'Product', value: dealInfo.product_name || '-' },
    { label: 'Approved Value', value: `\u20B9${(dealInfo.approved_value || 0).toLocaleString('en-IN')}` },
    { label: 'Payment Method', value: (dealInfo.payment_method || 'Cash').replace(/_/g, ' ') },
    { label: 'Transaction ID', value: dealInfo.transaction_id || 'N/A' },
    { label: 'Hub / Branch', value: dealInfo.branch_name || '-' },
    { label: 'Collected By', value: dealInfo.collected_by_name || '-' },
    { label: 'Date & Time', value: new Date(dealInfo.deal_closed_at || Date.now()).toLocaleString('en-IN') },
  ];

  fields.forEach(f => {
    doc.setFont('helvetica', 'bold');
    doc.text(f.label + ':', leftX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(f.value), labelX, y);
    y += lineH;
  });

  y += 6;
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text('This certifies that the above e-waste item has been collected', pageW / 2, y, { align: 'center' });
  y += 5;
  doc.text('and received by Green Era Recyclers for responsible recycling.', pageW / 2, y, { align: 'center' });
  y += 10;

  // QR Code
  if (dealInfo.qr_data) {
    try {
      const qrDataUrl = await QRCode.toDataURL(dealInfo.qr_data, { width: 80, margin: 1 });
      const qrSize = 30;
      const qrX = (pageW - qrSize) / 2;
      doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);
      y += qrSize + 4;
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text('Scan QR for details', pageW / 2, y, { align: 'center' });
    } catch (e) {
      console.error('QR generation error:', e.message);
    }
  }

  // Digital signature
  y += 10;
  doc.setDrawColor(100);
  doc.setLineWidth(0.5);
  const sigX = 20;
  const sigY = y;
  doc.line(sigX, sigY, sigX + 60, sigY);
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Collected By Signature', sigX, sigY + 4);
  if (dealInfo.collected_by_signature) {
    doc.setFont('helvetica', 'italic');
    doc.text(dealInfo.collected_by_signature, sigX, sigY - 4);
  }
  doc.setFont('helvetica', 'normal');

  // Payment stamp
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.3);
  const stampX = pageW - 70;
  doc.rect(stampX, sigY - 8, 55, 20);
  doc.setFontSize(7);
  doc.setTextColor(22, 163, 74);
  doc.text('PAYMENT COMPLETED', stampX + 27.5, sigY, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text(`\u20B9${(dealInfo.approved_value || 0).toLocaleString('en-IN')}`, stampX + 27.5, sigY + 8, { align: 'center' });

  y = sigY + 16;

  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageW - 14, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Thank you for contributing to a greener environment!', pageW / 2, y, { align: 'center' });
  y += 4;
  doc.text('Green Era Recyclers | www.greenera.com | Toll-free: 1800-123-4567', pageW / 2, y, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
};
