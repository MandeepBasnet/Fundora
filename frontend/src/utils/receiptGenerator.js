import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a PDF receipt for a specific transaction
 * @param {Object} transaction - The formatted transaction object from Transactions.jsx state
 * @param {Object} user - The current authenticated user object
 */
export const generateReceiptPDF = (transaction, user) => {
  const doc = new jsPDF();
  const isCreatorView = user?.role === 'creator' && transaction.type === 'Credit';

  // --- Header & Branding ---
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138); // Sky/Blue color
  doc.text('Fundora', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('support@fundora.com', 14, 26);
  doc.text('Kathmandu, Nepal', 14, 31);

  // --- Title ---
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('Transaction Receipt', 14, 45);

  // --- Transaction Meta Info ---
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // Slate 500
  
  // Left Column
  doc.text(`Receipt ID:`, 14, 55);
  doc.text(`Date:`, 14, 62);
  doc.text(`Campaign:`, 14, 69);
  doc.text(`Status:`, 14, 76);
  
  // Left Column Values
  doc.setTextColor(15, 23, 42);
  doc.text(`${transaction.id}`, 40, 55);
  doc.text(`${transaction.date}`, 40, 62);
  doc.text(`${transaction.campaignTitle}`, 40, 69);
  doc.text(`${transaction.status}`, 40, 76);

  // Right Column
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Method:`, 120, 55);
  doc.text(`Role:`, 120, 62);
  
  // Right Column Values
  doc.setTextColor(15, 23, 42);
  doc.text(`${transaction.method}`, 155, 55);
  doc.text(`${user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}`, 155, 62);

  // --- Separator ---
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.line(14, 83, 196, 83);

  // --- Table Data Preparation ---
  let tableHeaders;
  let tableData;

  // We customize the table based on whether the user is viewing their GROSS total (backer/admin)
  // or they are a creator receiving a pledge (subject to a 5% platform fee).
  if (isCreatorView && transaction.platformFee > 0) {
    tableHeaders = [['Description', 'Gross Amount', 'Platform Fee', 'Net Credited']];
    tableData = [[
      transaction.description,
      `Rs. ${transaction.amount.toLocaleString()}`,
      `-Rs. ${transaction.platformFee.toLocaleString()}`,
      `Rs. ${transaction.netAmount.toLocaleString()}`
    ]];
  } else {
    // Normal backer or admin view, or creator giving money to another campaign
    tableHeaders = [['Description', 'Transaction Type', 'Total Amount']];
    tableData = [[
      transaction.description,
      `${transaction.type} ${transaction.type === 'Credit' ? '(Received)' : '(Spent)'}`,
      `Rs. ${transaction.amount.toLocaleString()}`
    ]];
  }

  // --- Table Generation ---
  autoTable(doc, {
    startY: 85,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [248, 250, 252], // Slate 50
      textColor: [71, 85, 105], // Slate 500
      fontStyle: 'bold',
      lineColor: [226, 232, 240], // Slate 200
      lineWidth: 0.1
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    margin: { top: 85 }
  });

  // --- Footer Totals (Placed right below table) ---
  const finalY = doc.lastAutoTable.finalY + 15;
  
  if (isCreatorView && transaction.platformFee > 0) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Net Credited:`, 130, finalY);
    doc.setTextColor(22, 163, 74); // Green 600
    doc.text(`Rs. ${transaction.netAmount.toLocaleString()}`, 170, finalY);
  } else {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Paid:`, 145, finalY);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(`Rs. ${transaction.amount.toLocaleString()}`, 170, finalY);
  }

  // --- Footer Notice ---
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFont(undefined, 'normal');
  const footerY = doc.internal.pageSize.height - 20;
  doc.text('This is a computer-generated receipt and does not require a physical signature.', 14, footerY);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, footerY + 5);

  // --- Output ---
  doc.save(`receipt-${transaction.id}.pdf`);
};
