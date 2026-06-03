import { Invoice } from '../types';

export const createSupplierSheet = async (invoice: Invoice, accessToken: string): Promise<{ id: string, url: string }> => {
  try {
    // 1. Create a new Spreadsheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `Weight Log: ${invoice.id} - ${invoice.clientName}`,
        },
      }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create spreadsheet');
    }

    const spreadsheet = await createResponse.json();
    const spreadsheetId = spreadsheet.spreadsheetId;
    const spreadsheetUrl = spreadsheet.spreadsheetUrl;

    // 2. Add Headers and Data
    const rows = [
      ['Delivery Receipt & Weight Reconciliation Log', '', '', ''],
      ['Invoice ID', invoice.id, '', ''],
      ['Client', invoice.clientName, '', ''],
      ['Delivery Person', invoice.deliveryPerson || 'Not Assigned', '', ''],
      ['', '', '', ''],
      ['Item Description', 'Ordered Qty', 'Supply Weight (KGs)', 'Delivery Weight (KGs)'],
      ...invoice.items.map(item => [
        item.description, 
        item.quantity, 
        item.supplyWeight || '', 
        item.deliveryWeight || ''
      ]),
      ['', '', '', ''],
      ['OPERATIONAL TEMPLATES & GUIDELINES', '', '', ''],
      ['ROLE', 'INSTRUCTION 1', 'INSTRUCTION 2', 'INSTRUCTION 3'],
      ['SUPPLIER (Abbatoir)', 'Log weights during carcass loading.', 'Verify temperature is < 5°C.', 'Check for quality stamps.'],
      ['DELIVERY (Transport)', 'Re-weigh on arrival if discrepancies found.', 'Collect cash/cheque if stated in notes.', 'Obtain stamped receiving note.'],
      ['', '', '', ''],
      ['OFFICIAL NOTES', invoice.notes || 'None provided.', '', ''],
      ['SUPPLY NOTES', invoice.supplierNote || 'No specific supply instructions.', '', ''],
      ['DELIVERY NOTES', invoice.deliveryNote || 'No specific delivery instructions.', '', '']
    ];

    const updateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:D${rows.length}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to populate spreadsheet');
    }

    // 3. Format headers (Row 6)
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 5,
                endRowIndex: 6,
                startColumnIndex: 0,
                endColumnIndex: 4
              },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true },
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                }
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor)'
            }
          }
        ]
      })
    });

    return { id: spreadsheetId, url: spreadsheetUrl };
  } catch (error) {
    console.error('Error in createSupplierSheet:', error);
    throw error;
  }
};

export const syncInvoiceFromSheet = async (spreadsheetId: string, accessToken: string): Promise<{ items: any[] }> => {
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A7:D100`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch spreadsheet data');
    }

    const data = await response.json();
    const values = data.values || [];

    // Map rows back to weights
    // Row format: [Description, Qty, Supply Weight, Delivery Weight]
    const updatedItems = values.map((row: any[]) => ({
      description: row[0],
      supplyWeight: row[2] ? parseFloat(row[2]) : undefined,
      deliveryWeight: row[3] ? parseFloat(row[3]) : undefined,
    }));

    return { items: updatedItems };
  } catch (error) {
    console.error('Error in syncInvoiceFromSheet:', error);
    throw error;
  }
};
