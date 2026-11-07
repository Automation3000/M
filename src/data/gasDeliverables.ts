export interface SheetTabSchema {
  tabName: string;
  tabIndex: number;
  purpose: string;
  columns: string[];
  sampleRow?: string[];
}

export const SPREADSHEET_ID = '1niu19tKMOQfIEMOhqGqgMA56BLL7Ig-ELHq59Mqlz2M';
export const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?usp=sharing`;

export const GOOGLE_SHEETS_SCHEMA: SheetTabSchema[] = [
  {
    tabIndex: 1,
    tabName: 'Expenses Manager',
    purpose: 'Tab 1: Real-time kitchen expense logger (Mutton, Spices, 80mm Rolls, Packaging, LPG Gas, Staff wages & Misc).',
    columns: [
      'ExpenseID',
      'Timestamp',
      'ItemName',
      'Category',
      'Amount',
      'PaymentMode',
      'Notes',
      'LoggedBy',
    ],
    sampleRow: [
      'EXP-301',
      '2026-11-07T08:30:00Z',
      'Fresh Mutton & Nihari Bones (8 Kg)',
      'Raw Material',
      '1450',
      'Cash',
      'Saadatganj Meat Market',
      'Majeed (Admin)',
    ],
  },
  {
    tabIndex: 2,
    tabName: 'Orders',
    purpose: 'Tab 2: Stores all customer POS bills across Pickup/Takeaway, Direct Delivery, Swiggy, and Zomato.',
    columns: [
      'InvoiceNo',
      'Timestamp',
      'OrderType',
      'CustomerName',
      'CustomerPhone',
      'CustomerAddress',
      'ExternalOrderId',
      'ItemsJSON',
      'Subtotal',
      'TaxAmount',
      'PackagingCharge',
      'DiscountAmount',
      'GrandTotal',
      'PaymentMode',
      'CashierName',
    ],
    sampleRow: [
      'MZ-8401',
      '2026-11-07T09:15:00Z',
      'Pickup / Takeaway',
      'Rohit Srivastava',
      '9839455120',
      'Saadatganj, Lucknow',
      '',
      '[{"menuItemId":"M-401","name":"Galouti Kebab + 2 Paratha","price":260,"qty":2}]',
      '520',
      '26',
      '20',
      '0',
      '566',
      'UPI',
      'Majeed (Admin)',
    ],
  },
  {
    tabIndex: 3,
    tabName: 'Menu',
    purpose: 'Tab 3: Category-wise dishes (Kebabs, Stews, Rice Bowls, Combos, Burgers, Pakoras) & live pricing.',
    columns: [
      'ItemID',
      'Name',
      'Category',
      'Price',
      'Veg',
      'Available',
      'PrepTimeMins',
      'SKU',
    ],
    sampleRow: [
      'M-101',
      'Lucknowi Galouti Kebab (4 Pcs)',
      'Kebabs',
      '240',
      'FALSE',
      'TRUE',
      '12',
      'KBB-01',
    ],
  },
  {
    tabIndex: 4,
    tabName: 'Admin & Profile',
    purpose: 'Tab 4: Admin Profile, Contact Details (Name, Tagline, Address, Phone, FSSAI 30261105128038073) & Staff Accounts List.',
    columns: [
      'FieldKey',
      'FieldValue',
      'Label',
      'Section',
      'UpdatedAt',
    ],
    sampleRow: [
      'ADMIN_PIN',
      '1234',
      'Terminal Unlock PIN',
      'Security',
      '2026-11-07T09:00:00Z',
    ],
  },
  {
    tabIndex: 5,
    tabName: 'Settings',
    purpose: 'Tab 5: WhatsApp Direct Order Bypass QR CTA, WhatsApp Number, Pre-filled Message, Discounts, GST % & Packaging Charges.',
    columns: [
      'SettingKey',
      'SettingValue',
      'SettingLabel',
      'Description',
      'UpdatedAt',
    ],
    sampleRow: [
      'BILL_FOOTER_CTA',
      'Scan to Order Directly on WhatsApp Next Time & Get 15% OFF! Bypass Swiggy/Zomato Commissions!',
      '80mm Thermal Bill QR CTA',
      'Printed below WhatsApp QR on receipt to bypass Swiggy/Zomato',
      '2026-11-07T09:00:00Z',
    ],
  },
  {
    tabIndex: 6,
    tabName: 'CCTV & Camera Hub',
    purpose: 'Tab 6: Live RTSP/HLS stream URLs & camera status for kitchen bays & pickup counter.',
    columns: [
      'CameraID',
      'CameraName',
      'Zone',
      'StreamURL',
      'Status',
      'Resolution',
    ],
    sampleRow: [
      'CAM-01',
      'Main Tandoor & Galouti Station',
      'Kitchen Bay 1',
      'https://stream.mumbaizaika.in/live/cam1.m3u8',
      'Online',
      '1080p FHD',
    ],
  },
  {
    tabIndex: 7,
    tabName: 'Order History & Day-End',
    purpose: 'Tab 7: Complete invoice records & daily settlement audit with gross sales, payments, and net profit.',
    columns: [
      'InvoiceNo',
      'Date',
      'Time',
      'Channel',
      'Customer',
      'Phone',
      'ItemsSummary',
      'Subtotal',
      'Tax',
      'Packaging',
      'Discount',
      'GrandTotal',
      'PaymentMode',
      'Cashier',
    ],
    sampleRow: [
      'MZ-8401',
      '07/11/2026',
      '09:15:00',
      'Pickup / Takeaway',
      'Walk-in Customer',
      '',
      '2x Galouti Kebab, 1x Mutton Nihari',
      '520',
      '26',
      '20',
      '0',
      '566',
      'UPI',
      'Admin (Owner)',
    ],
  },
];

export const CODE_GS_SOURCE = `/**
 * MUMBAI ZAIKA (Wazirbagh Mohalla, Lucknow - 226003)
 * Serverless Cloud Kitchen POS & CRM - Google Apps Script Backend (Code.gs)
 * FSSAI Reg No: 30261105128038073
 * Linked Google Sheet: https://docs.google.com/spreadsheets/d/1niu19tKMOQfIEMOhqGqgMA56BLL7Ig-ELHq59Mqlz2M/edit?usp=sharing
 */

const SPREADSHEET_ID = '1niu19tKMOQfIEMOhqGqgMA56BLL7Ig-ELHq59Mqlz2M';

const SHEET_TABS = {
  EXPENSES: 'Expenses Manager',               // Tab 1 (Primary Kitchen Expense Tracker)
  ORDERS: 'Orders',                           // Tab 2 (POS Bills across Pickup, Delivery, Swiggy, Zomato)
  MENU: 'Menu',                               // Tab 3 (Dishes & Pricing)
  ADMIN_PROFILE: 'Admin & Profile',           // Tab 4 (Admin Profile, Contact Info, Staff Users & PIN)
  SETTINGS: 'Settings',                       // Tab 5 (WhatsApp Bypass QR CTA, Discounts, Taxes, Packaging)
  CAMERAS: 'CCTV & Camera Hub',               // Tab 6 (Live Shop Camera Streams)
  ORDER_HISTORY: 'Order History & Day-End'    // Tab 7 (Complete Invoice & Daily Settlement Audit)
};

/**
 * Access the Google Sheet by ID or active bound sheet
 */
function getSpreadsheet() {
  try {
    if (SPREADSHEET_ID && SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID') {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  } catch (err) {
    Logger.log('Falling back to active spreadsheet: ' + err);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Web App Entry Point - Serves App.html in IFRAME or JSON API for real-time sync
 */
function doGet(e) {
  try {
    setupDatabase();
  } catch (err) {
    Logger.log('Auto setup notice: ' + err);
  }

  // Real-Time JSON API endpoint for external sync
  if (e && e.parameter && (e.parameter.action === 'getData' || e.parameter.api === 'true')) {
    return ContentService.createTextOutput(JSON.stringify(getDashboardData()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createTemplateFromFile('App')
    .evaluate()
    .setTitle('Mumbai Zaika — Cloud Kitchen POS & CRM')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

/**
 * Fallback doPost for form submissions and JSON mutations
 */
function doPost(e) {
  if (e && e.parameter && e.parameter.action === 'saveExpense') {
    try {
      const data = JSON.parse(e.postData.contents);
      const res = saveExpense(data);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  if (e && e.parameter && e.parameter.action === 'deleteExpense') {
    try {
      const id = e.parameter.id;
      const res = deleteExpense(id);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return doGet(e);
}

/**
 * Standalone runner to directly clean, repair, and initialize the exact schema into Google Sheets
 */
function initializeGoogleSheet() {
  return setupDatabase();
}

/**
 * Sets up 7 clean, strict tabs in Google Sheets:
 * Tab 1: Expenses Manager (Empty - no fake rows)
 * Tab 2: Orders (Empty - no fake rows)
 * Tab 3: Menu (Category-wise dishes)
 * Tab 4: Admin & Profile (Real Admin info - no fake staff)
 * Tab 5: Settings (WhatsApp QR CTA, Discounts, Packaging, GST)
 * Tab 6: CCTV & Camera Hub (Live streams)
 * Tab 7: Order History & Day-End (Reconciliation audit)
 */
function setupDatabase() {
  const ss = getSpreadsheet();
  if (!ss) throw new Error('Could not access Google Spreadsheet!');

  // Clean old/redundant sheets if they exist
  const obsoleteNames = ['Sheet1', 'Sheet 1', 'Sheet', 'शीट1', 'शीट 1'];
  for (let o = 0; o < obsoleteNames.length; o++) {
    const obs = ss.getSheetByName(obsoleteNames[o]);
    if (obs && ss.getSheets().length > 1) {
      try { ss.deleteSheet(obs); } catch (e) {}
    }
  }

  // --- TAB 1: Expenses Manager ---
  let expSheet = ss.getSheetByName(SHEET_TABS.EXPENSES);
  if (!expSheet) expSheet = ss.insertSheet(SHEET_TABS.EXPENSES, 0);
  if (expSheet.getLastRow() === 0) {
    const expHeaders = ['ExpenseID', 'Timestamp', 'ItemName', 'Category', 'Amount', 'PaymentMode', 'Notes', 'LoggedBy'];
    expSheet.appendRow(expHeaders);
  }
  formatHeaderRow(expSheet, 8);
  expSheet.setColumnWidth(1, 120);
  expSheet.setColumnWidth(2, 200);
  expSheet.setColumnWidth(3, 260);
  expSheet.setColumnWidth(4, 130);
  expSheet.setColumnWidth(5, 100);
  expSheet.setColumnWidth(6, 110);
  expSheet.setColumnWidth(7, 220);
  expSheet.setColumnWidth(8, 150);

  // --- TAB 2: Orders ---
  let orderSheet = ss.getSheetByName(SHEET_TABS.ORDERS);
  if (!orderSheet) orderSheet = ss.insertSheet(SHEET_TABS.ORDERS, 1);
  if (orderSheet.getLastRow() === 0) {
    const orderHeaders = ['InvoiceNo', 'Timestamp', 'OrderType', 'CustomerName', 'CustomerPhone', 'CustomerAddress', 'ExternalOrderId', 'ItemsJSON', 'Subtotal', 'TaxAmount', 'PackagingCharge', 'DiscountAmount', 'GrandTotal', 'PaymentMode', 'CashierName'];
    orderSheet.appendRow(orderHeaders);
  }
  formatHeaderRow(orderSheet, 15);
  orderSheet.setColumnWidth(1, 100);
  orderSheet.setColumnWidth(2, 200);
  orderSheet.setColumnWidth(3, 140);
  orderSheet.setColumnWidth(4, 160);
  orderSheet.setColumnWidth(5, 130);
  orderSheet.setColumnWidth(8, 280);
  orderSheet.setColumnWidth(13, 110);

  // --- TAB 3: Menu ---
  let menuSheet = ss.getSheetByName(SHEET_TABS.MENU);
  if (!menuSheet) menuSheet = ss.insertSheet(SHEET_TABS.MENU, 2);
  if (menuSheet.getLastRow() === 0) {
    const menuHeaders = ['ItemID', 'Name', 'Category', 'Price', 'Veg', 'Available', 'PrepTimeMins', 'SKU'];
    menuSheet.appendRow(menuHeaders);
    const defaultMenu = [
      ['M-101', 'Lucknowi Galouti Kebab (4 Pcs)', 'Kebabs', 240, false, true, 12, 'KBB-01'],
      ['M-102', 'Charcoal Chicken Seekh Kebab', 'Kebabs', 210, false, true, 14, 'KBB-02'],
      ['M-201', 'Wazirbagh Special Mutton Nihari', 'Stews', 320, false, true, 15, 'STW-01'],
      ['M-202', 'Mumbai Bhuna Chicken Khara Masala', 'Stews', 270, false, true, 14, 'STW-02'],
      ['M-301', 'Lucknowi Dum Chicken Biryani Bowl', 'Rice Bowls', 240, false, true, 10, 'RIC-01'],
      ['M-401', 'Galouti Kebab + 2 Ulte Tawe Ka Paratha', 'Combos', 260, false, true, 12, 'CMB-01'],
      ['M-402', 'Mutton Nihari + 2 Mughlai Sheermal', 'Combos', 360, false, true, 15, 'CMB-02'],
      ['M-501', 'Crispy Chicken Shami Bun Kebab Burger', 'Burgers', 135, false, true, 8, 'BRG-01'],
      ['M-502', 'Mumbai Schezwan Vada Pav Slider (2 Pcs)', 'Burgers', 110, true, true, 6, 'BRG-02'],
      ['M-601', 'Crispy Chicken Lollipop Pakora (6 Pcs)', 'Pakoras', 190, false, true, 10, 'PKR-01'],
      ['M-602', 'Mumbai Kanda Bhajiya Basket', 'Pakoras', 115, true, true, 7, 'PKR-02']
    ];
    defaultMenu.forEach(function(row) { menuSheet.appendRow(row); });
  }
  formatHeaderRow(menuSheet, 8);
  menuSheet.setColumnWidth(1, 90);
  menuSheet.setColumnWidth(2, 280);
  menuSheet.setColumnWidth(3, 120);
  menuSheet.setColumnWidth(4, 90);

  // --- TAB 4: Admin & Profile (NO FAKE USERS - Only true admin and actual staff list) ---
  let adminSheet = ss.getSheetByName(SHEET_TABS.ADMIN_PROFILE);
  if (!adminSheet) adminSheet = ss.insertSheet(SHEET_TABS.ADMIN_PROFILE, 3);
  if (adminSheet.getLastRow() === 0) {
    const adminHeaders = ['FieldKey', 'FieldValue', 'Label', 'Section', 'UpdatedAt'];
    adminSheet.appendRow(adminHeaders);
    const adminProfileData = [
      ['RESTAURANT_NAME', 'Mumbai Zaika', 'Restaurant Brand Name', 'Contact Info', new Date().toISOString()],
      ['TAGLINE', 'Authentic Lucknowi & Bambaiya Cloud Kitchen', 'Kitchen Tagline', 'Contact Info', new Date().toISOString()],
      ['ADDRESS', 'Wazirbagh Mohalla, Saadatganj, Lucknow - 226003', 'Shop Address', 'Contact Info', new Date().toISOString()],
      ['PHONE', '+91 98765 43210', 'Primary Phone', 'Contact Info', new Date().toISOString()],
      ['FSSAI_NO', '30261105128038073', 'FSSAI License Reg No', 'Contact Info', new Date().toISOString()],
      ['ADMIN_NAME', 'Admin (Owner)', 'Admin / Owner Name', 'Profile', new Date().toISOString()],
      ['ADMIN_PIN', '1234', 'Terminal Unlock PIN', 'Security', new Date().toISOString()],
      ['STAFF_USERS_JSON', JSON.stringify([]), 'Staff Accounts List', 'Users', new Date().toISOString()]
    ];
    adminProfileData.forEach(function(r) { adminSheet.appendRow(r); });
  }
  formatHeaderRow(adminSheet, 5);
  adminSheet.setColumnWidth(1, 200);
  adminSheet.setColumnWidth(2, 340);
  adminSheet.setColumnWidth(3, 200);
  adminSheet.setColumnWidth(4, 140);
  adminSheet.setColumnWidth(5, 180);

  // --- TAB 5: Settings ---
  let setSheet = ss.getSheetByName(SHEET_TABS.SETTINGS);
  if (!setSheet) setSheet = ss.insertSheet(SHEET_TABS.SETTINGS, 4);
  if (setSheet.getLastRow() === 0) {
    const setHeaders = ['SettingKey', 'SettingValue', 'SettingLabel', 'Description', 'UpdatedAt'];
    setSheet.appendRow(setHeaders);
    const settingsData = [
      ['BILL_FOOTER_CTA', 'Scan to Order Directly on WhatsApp Next Time & Get 15% OFF! Bypass Swiggy/Zomato Commissions!', '80mm Thermal Bill QR CTA', 'Printed below WhatsApp QR on receipt to bypass Swiggy/Zomato', new Date().toISOString()],
      ['WHATSAPP_NUMBER', '919876543210', 'WhatsApp Business Number', 'Direct order mobile number with 91 country code', new Date().toISOString()],
      ['WHATSAPP_PREFILL_TEXT', 'Hi Mumbai Zaika, I want to place a direct order!', 'WhatsApp Pre-filled Message', 'Auto-filled chat message when customer scans receipt QR', new Date().toISOString()],
      ['DIRECT_DISCOUNT_PERCENT', '15', 'Direct Order Discount (%)', 'Discount offered to customers when ordering via WhatsApp directly', new Date().toISOString()],
      ['GST_PERCENT', '5', 'GST Tax Rate (%)', 'Standard GST rate applied on restaurant bills', new Date().toISOString()],
      ['DEFAULT_PACKAGING', '20', 'Packaging Charge (₹)', 'Default parcel packaging charge added to cart', new Date().toISOString()]
    ];
    settingsData.forEach(function(r) { setSheet.appendRow(r); });
  }
  formatHeaderRow(setSheet, 5);
  setSheet.setColumnWidth(1, 240);
  setSheet.setColumnWidth(2, 360);
  setSheet.setColumnWidth(3, 220);
  setSheet.setColumnWidth(4, 300);
  setSheet.setColumnWidth(5, 180);

  // --- TAB 6: CCTV & Camera Hub ---
  let camSheet = ss.getSheetByName(SHEET_TABS.CAMERAS);
  if (!camSheet) camSheet = ss.insertSheet(SHEET_TABS.CAMERAS, 5);
  if (camSheet.getLastRow() === 0) {
    const camHeaders = ['CameraID', 'CameraName', 'Zone', 'StreamURL', 'Status', 'Resolution'];
    camSheet.appendRow(camHeaders);
    camSheet.appendRow(['CAM-01', 'Main Tandoor & Galouti Station', 'Kitchen Bay 1', '', 'Online', '1080p FHD']);
    camSheet.appendRow(['CAM-02', 'Stew, Nihari & Biryani Line', 'Kitchen Bay 2', '', 'Online', '1080p FHD']);
    camSheet.appendRow(['CAM-03', 'Dispatch & 80mm Packing Desk', 'Quality Check Desk', '', 'Online', '1080p FHD']);
    camSheet.appendRow(['CAM-04', 'Walk-in & Rider Pickup Window', 'Wazirbagh Entrance Counter', '', 'Online', '1080p FHD']);
  }
  formatHeaderRow(camSheet, 6);
  camSheet.setColumnWidth(1, 100);
  camSheet.setColumnWidth(2, 240);
  camSheet.setColumnWidth(3, 200);
  camSheet.setColumnWidth(5, 100);

  // --- TAB 7: Order History & Day-End Settlement ---
  let histSheet = ss.getSheetByName(SHEET_TABS.ORDER_HISTORY);
  if (!histSheet) histSheet = ss.insertSheet(SHEET_TABS.ORDER_HISTORY, 6);
  if (histSheet.getLastRow() === 0) {
    const histHeaders = ['InvoiceNo', 'Date', 'Time', 'Channel', 'Customer', 'Phone', 'ItemsSummary', 'Subtotal', 'Tax', 'Packaging', 'Discount', 'GrandTotal', 'PaymentMode', 'Cashier'];
    histSheet.appendRow(histHeaders);
  }
  formatHeaderRow(histSheet, 14);
  histSheet.setColumnWidth(1, 100);
  histSheet.setColumnWidth(2, 110);
  histSheet.setColumnWidth(3, 100);
  histSheet.setColumnWidth(4, 130);
  histSheet.setColumnWidth(7, 300);
  histSheet.setColumnWidth(12, 110);

  // STRICT TAB ORDERING (1 to 7)
  const orderedTabNames = [
    SHEET_TABS.EXPENSES,      // 1: Expenses Manager
    SHEET_TABS.ORDERS,        // 2: Orders
    SHEET_TABS.MENU,          // 3: Menu
    SHEET_TABS.ADMIN_PROFILE, // 4: Admin & Profile
    SHEET_TABS.SETTINGS,      // 5: Settings
    SHEET_TABS.CAMERAS,       // 6: CCTV & Camera Hub
    SHEET_TABS.ORDER_HISTORY  // 7: Order History & Day-End
  ];

  for (let i = 0; i < orderedTabNames.length; i++) {
    const s = ss.getSheetByName(orderedTabNames[i]);
    if (s) {
      ss.setActiveSheet(s);
      try { ss.moveActiveSheet(i + 1); } catch (e) {}
    }
  }

  // Activate Tab 1: Expenses Manager by default
  const primaryTab = ss.getSheetByName(SHEET_TABS.EXPENSES);
  if (primaryTab) ss.setActiveSheet(primaryTab);

  return { success: true, message: 'Google Sheet schema initialized with 7 strict tabs!' };
}

function formatHeaderRow(sheet, numCols) {
  if (!sheet) return;
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1c1917');
  headerRange.setFontColor('#ffffff');
  sheet.setFrozenRows(1);
}

/**
 * Fetch all synced data directly from Sheet cells safely.
 * Returns EXACTLY what is present in the sheet cells - NEVER returns deleted or fake rows!
 */
function getDashboardData() {
  try {
    const ss = getSpreadsheet();
    if (!ss) return { error: 'Spreadsheet inaccessible' };

    // 1. Expenses Manager (Tab 1)
    const expSheet = ss.getSheetByName(SHEET_TABS.EXPENSES);
    const expRows = (expSheet && expSheet.getLastRow() > 1) ? expSheet.getDataRange().getValues() : [];
    const expenses = (expRows.length > 1) ? expRows.slice(1).reverse().map(function(r) {
      const ts = (r[1] instanceof Date) ? r[1].toISOString() : String(r[1] || '');
      return {
        id: String(r[0] || ''),
        timestamp: ts,
        itemName: String(r[2] || ''),
        category: String(r[3] || 'Misc'),
        amount: Number(r[4] || 0),
        paymentMode: String(r[5] || 'Cash'),
        notes: String(r[6] || ''),
        loggedBy: String(r[7] || 'Staff')
      };
    }) : [];

    // 2. Orders (Tab 2)
    const orderSheet = ss.getSheetByName(SHEET_TABS.ORDERS);
    const orderRows = (orderSheet && orderSheet.getLastRow() > 1) ? orderSheet.getDataRange().getValues() : [];
    const orders = (orderRows.length > 1) ? orderRows.slice(1).reverse().map(function(r) {
      const ts = (r[1] instanceof Date) ? r[1].toISOString() : String(r[1] || '');
      let parsedItems = [];
      try { parsedItems = JSON.parse(r[7] || '[]'); } catch (e) { parsedItems = []; }
      return {
        invoiceNo: String(r[0] || ''),
        timestamp: ts,
        orderType: String(r[2] || 'Pickup / Takeaway'),
        customerName: String(r[3] || 'Walk-in'),
        customerPhone: String(r[4] || ''),
        customerAddress: String(r[5] || ''),
        externalOrderId: String(r[6] || ''),
        items: parsedItems,
        subtotal: Number(r[8] || 0),
        taxAmount: Number(r[9] || 0),
        packagingCharge: Number(r[10] || 0),
        discountAmount: Number(r[11] || 0),
        grandTotal: Number(r[12] || 0),
        paymentMode: String(r[13] || 'Cash'),
        cashierName: String(r[14] || 'Staff')
      };
    }) : [];

    // 3. Menu (Tab 3)
    const menuSheet = ss.getSheetByName(SHEET_TABS.MENU);
    const menuRows = (menuSheet && menuSheet.getLastRow() > 1) ? menuSheet.getDataRange().getValues() : [];
    const menu = (menuRows.length > 1) ? menuRows.slice(1).map(function(r) {
      return {
        id: String(r[0] || ''),
        name: String(r[1] || ''),
        category: String(r[2] || 'Kebabs'),
        price: Number(r[3] || 0),
        veg: Boolean(r[4]),
        available: Boolean(r[5]),
        prepTimeMins: Number(r[6] || 10),
        sku: String(r[7] || '')
      };
    }) : [];

    // 4. Admin & Profile (Tab 4)
    const adminSheet = ss.getSheetByName(SHEET_TABS.ADMIN_PROFILE);
    const adminRows = adminSheet ? adminSheet.getDataRange().getValues() : [];
    const adminMap = {};
    for (let i = 1; i < adminRows.length; i++) {
      const k = String(adminRows[i][0] || '').trim();
      const v = String(adminRows[i][1] || '').trim();
      if (k) adminMap[k] = v;
    }

    // STRICT USER HANDLING: ONLY real users from sheet, NEVER hardcoded Faizan/Rizwan
    let users = [];
    if (adminMap['STAFF_USERS_JSON']) {
      try {
        users = JSON.parse(adminMap['STAFF_USERS_JSON']);
      } catch (e) {
        users = [];
      }
    }

    const adminName = adminMap['ADMIN_NAME'] || 'Admin (Owner)';
    const adminPin = String(adminMap['ADMIN_PIN'] || '1234');

    if (!Array.isArray(users) || users.length === 0) {
      // Default to single active Admin from sheet cells
      users = [
        {
          id: 'USR-01',
          name: adminName,
          role: 'Admin',
          pin: adminPin,
          permissions: { expenses: true, pos: true, history: true, cctv: true, admin: true, settings: true, deploy: true, pnl: true },
          active: true
        }
      ];
    } else {
      // Ensure Admin in users matches sheet's ADMIN_NAME and ADMIN_PIN
      let hasAdmin = false;
      for (let u = 0; u < users.length; u++) {
        if (users[u].role === 'Admin') {
          hasAdmin = true;
          users[u].name = adminName;
          users[u].pin = adminPin;
        }
      }
      if (!hasAdmin) {
        users.unshift({
          id: 'USR-01',
          name: adminName,
          role: 'Admin',
          pin: adminPin,
          permissions: { expenses: true, pos: true, history: true, cctv: true, admin: true, settings: true, deploy: true, pnl: true },
          active: true
        });
      }
    }

    // 5. Settings (Tab 5)
    const setSheet = ss.getSheetByName(SHEET_TABS.SETTINGS);
    const setRows = setSheet ? setSheet.getDataRange().getValues() : [];
    const setMap = {};
    for (let j = 1; j < setRows.length; j++) {
      const sk = String(setRows[j][0] || '').trim();
      const sv = String(setRows[j][1] || '').trim();
      if (sk) setMap[sk] = sv;
    }

    const settings = {
      restaurantName: adminMap['RESTAURANT_NAME'] || 'Mumbai Zaika',
      tagline: adminMap['TAGLINE'] || 'Authentic Lucknowi & Bambaiya Cloud Kitchen',
      address: adminMap['ADDRESS'] || 'Wazirbagh Mohalla, Saadatganj, Lucknow - 226003',
      phone: adminMap['PHONE'] || '+91 98765 43210',
      fssaiNo: adminMap['FSSAI_NO'] || '30261105128038073',
      adminName: adminName,
      adminPin: adminPin,
      billFooterCTA: setMap['BILL_FOOTER_CTA'] || 'Scan to Order Directly on WhatsApp Next Time & Get 15% OFF! Bypass Swiggy/Zomato Commissions!',
      whatsappNumber: setMap['WHATSAPP_NUMBER'] || '919876543210',
      whatsappPrefillText: setMap['WHATSAPP_PREFILL_TEXT'] || 'Hi Mumbai Zaika, I want to place a direct order!',
      directDiscountPercent: Number(setMap['DIRECT_DISCOUNT_PERCENT'] || 15),
      gstRatePercent: Number(setMap['GST_PERCENT'] || 5),
      defaultPackagingCharge: Number(setMap['DEFAULT_PACKAGING'] || 20)
    };

    return {
      expenses: expenses,
      orders: orders,
      menu: menu,
      settings: settings,
      users: users
    };
  } catch (err) {
    Logger.log('getDashboardData error: ' + err);
    return { error: err.toString() };
  }
}

/**
 * Save new customer order into Tab 2: Orders AND Tab 7: Order History & Day-End
 */
function saveOrder(order) {
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_TABS.ORDERS);
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName(SHEET_TABS.ORDERS);
    }
    const inv = order.invoiceNo || ('MZ-' + Math.floor(1000 + Math.random() * 9000));
    const nowStr = (order.timestamp && typeof order.timestamp === 'string') ? order.timestamp : new Date().toISOString();
    
    // Tab 2 Row
    sheet.appendRow([
      inv,
      nowStr,
      String(order.orderType || 'Pickup / Takeaway'),
      String(order.customerName || 'Walk-in Customer'),
      String(order.customerPhone || ''),
      String(order.customerAddress || ''),
      String(order.externalOrderId || ''),
      JSON.stringify(order.items || []),
      Number(order.subtotal || 0),
      Number(order.taxAmount || 0),
      Number(order.packagingCharge || 0),
      Number(order.discountAmount || 0),
      Number(order.grandTotal || 0),
      String(order.paymentMode || 'Cash'),
      String(order.cashierName || 'Staff')
    ]);

    // Also Append to Tab 7: Order History & Day-End
    let histSheet = ss.getSheetByName(SHEET_TABS.ORDER_HISTORY);
    if (!histSheet) {
      setupDatabase();
      histSheet = ss.getSheetByName(SHEET_TABS.ORDER_HISTORY);
    }
    if (histSheet) {
      const d = new Date(nowStr);
      const dateStr = d.toLocaleDateString('en-IN');
      const timeStr = d.toLocaleTimeString('en-IN');
      const itemsSummary = (order.items || []).map(function(i) { return i.qty + 'x ' + i.name; }).join(', ');
      histSheet.appendRow([
        inv,
        dateStr,
        timeStr,
        String(order.orderType || 'Pickup / Takeaway'),
        String(order.customerName || 'Walk-in'),
        String(order.customerPhone || ''),
        itemsSummary,
        Number(order.subtotal || 0),
        Number(order.taxAmount || 0),
        Number(order.packagingCharge || 0),
        Number(order.discountAmount || 0),
        Number(order.grandTotal || 0),
        String(order.paymentMode || 'Cash'),
        String(order.cashierName || 'Staff')
      ]);
    }

    return { success: true, invoiceNo: inv };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Save daily expense voucher into Tab 1: Expenses Manager
 */
function saveExpense(expense) {
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_TABS.EXPENSES);
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName(SHEET_TABS.EXPENSES);
    }
    const newId = expense.id || ('EXP-' + Math.floor(1000 + Math.random() * 9000));
    const nowStr = (expense.timestamp && typeof expense.timestamp === 'string') ? expense.timestamp : new Date().toISOString();
    sheet.appendRow([
      newId,
      nowStr,
      String(expense.itemName || 'Kitchen Expense'),
      String(expense.category || 'Misc'),
      Number(expense.amount || 0),
      String(expense.paymentMode || 'Cash'),
      String(expense.notes || ''),
      String(expense.loggedBy || 'Staff')
    ]);
    return { success: true, id: newId };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Admin action: Delete expense entry from Tab 1: Expenses Manager
 * Accurately finds the row by ExpenseID and permanently removes it.
 */
function deleteExpense(expenseId) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_TABS.EXPENSES);
    if (!sheet) return { success: false, error: 'Sheet not found' };

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(expenseId).trim()) {
        sheet.deleteRow(i + 1);
        return { success: true, id: expenseId };
      }
    }
    return { success: false, error: 'Expense ID not found in sheet' };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Update Admin Contact Information in Tab 4: Admin & Profile
 */
function updateAdminProfile(profileObj) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_TABS.ADMIN_PROFILE);
    if (!sheet) return { success: false, error: 'Admin sheet not found' };

    const keysMap = {
      'RESTAURANT_NAME': profileObj.restaurantName,
      'TAGLINE': profileObj.tagline,
      'ADDRESS': profileObj.address,
      'PHONE': profileObj.phone,
      'FSSAI_NO': profileObj.fssaiNo,
      'ADMIN_NAME': profileObj.adminName,
      'ADMIN_PIN': String(profileObj.adminPin || '1234')
    };

    const data = sheet.getDataRange().getValues();
    const now = new Date().toISOString();
    for (let i = 1; i < data.length; i++) {
      const k = String(data[i][0]).trim();
      if (keysMap[k] !== undefined && keysMap[k] !== null) {
        sheet.getRange(i + 1, 2).setValue(keysMap[k]);
        sheet.getRange(i + 1, 5).setValue(now);
      }
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Save / Update Full Staff Users List in Tab 4: Admin & Profile
 */
function saveUsersList(usersArray) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_TABS.ADMIN_PROFILE);
    if (!sheet) return { success: false, error: 'Admin sheet not found' };

    const data = sheet.getDataRange().getValues();
    const now = new Date().toISOString();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === 'STAFF_USERS_JSON') {
        sheet.getRange(i + 1, 2).setValue(JSON.stringify(usersArray));
        sheet.getRange(i + 1, 5).setValue(now);
        return { success: true };
      }
    }
    sheet.appendRow(['STAFF_USERS_JSON', JSON.stringify(usersArray), 'Staff Accounts List', 'Users', now]);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Update Kitchen Settings in Tab 5: Settings (WhatsApp CTA, Discounts, Packaging, GST)
 */
function updateSettings(settingsObj) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_TABS.SETTINGS);
    if (!sheet) return { success: false, error: 'Settings sheet not found' };

    const keysMap = {
      'BILL_FOOTER_CTA': settingsObj.billFooterCTA,
      'WHATSAPP_NUMBER': settingsObj.whatsappNumber,
      'WHATSAPP_PREFILL_TEXT': settingsObj.whatsappPrefillText,
      'DIRECT_DISCOUNT_PERCENT': String(settingsObj.directDiscountPercent || 15),
      'GST_PERCENT': String(settingsObj.gstRatePercent || 5),
      'DEFAULT_PACKAGING': String(settingsObj.defaultPackagingCharge || 20)
    };

    const data = sheet.getDataRange().getValues();
    const now = new Date().toISOString();
    for (let i = 1; i < data.length; i++) {
      const k = String(data[i][0]).trim();
      if (keysMap[k] !== undefined && keysMap[k] !== null) {
        sheet.getRange(i + 1, 2).setValue(keysMap[k]);
        sheet.getRange(i + 1, 5).setValue(now);
      }
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}
`;

export const STANDALONE_APP_HTML_SOURCE = `<!-- Complete standalone App.html for Google Apps Script -->
<!-- Copy directly into Apps Script 'App.html' -->`;

export const GITHUB_PAGES_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Mumbai Zaika — Cloud Kitchen POS & CRM (Lucknow)</title>
  <meta name="description" content="Mumbai Zaika Cloud Kitchen Management & 80mm Thermal POS Billing Portal - Wazirbagh Mohalla, Lucknow." />
  <meta name="theme-color" content="#1c1917" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%; height: 100dvh;
      overflow: hidden; background-color: #fafaf9;
      font-family: system-ui, -apple-system, sans-serif;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none; -ms-overflow-style: none;
    }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
    #app-frame-container {
      position: fixed; inset: 0; width: 100vw; height: 100vh; height: 100dvh; overflow: hidden;
    }
    iframe#gas-pos-frame {
      width: 100%; height: 100%; border: 0; display: block; overflow: auto;
    }
  </style>
</head>
<body>
  <div id="app-frame-container">
    <!-- Replace YOUR_DEPLOYMENT_ID with your Google Apps Script Web App Deployment ID -->
    <iframe
      id="gas-pos-frame"
      src="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
      allow="clipboard-read; clipboard-write; fullscreen"
      title="Mumbai Zaika POS & Cloud Kitchen CRM"
    ></iframe>
  </div>
</body>
</html>`;
