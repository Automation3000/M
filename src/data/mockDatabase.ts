export type OrderType = 'Pickup / Takeaway' | 'Direct Delivery' | 'Swiggy' | 'Zomato';
export type MenuCategory = 'Kebabs' | 'Stews' | 'Rice Bowls' | 'Combos' | 'Burgers' | 'Pakoras';
export type ExpenseCategory = 'Raw Material' | 'Packaging' | 'Gas/Fuel' | 'Staff' | 'Misc';
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Online Portal';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  veg: boolean;
  available: boolean;
  prepTimeMins: number;
  sku: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
}

export interface OrderRecord {
  invoiceNo: string;
  timestamp: string; // ISO string
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  externalOrderId?: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  packagingCharge: number;
  discountAmount: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  cashierName: string;
}

export interface ExpenseRecord {
  id: string;
  timestamp: string;
  itemName: string;
  category: ExpenseCategory;
  amount: number;
  paymentMode: 'Cash' | 'UPI';
  notes: string;
  loggedBy: string;
}

export interface UserPermissions {
  expenses: boolean;
  pos: boolean;
  history: boolean;
  cctv: boolean;
  admin: boolean;
  settings: boolean;
  deploy: boolean;
  pnl: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  role: string;
  pin: string;
  permissions: UserPermissions;
  active: boolean;
}

export interface CameraConfig {
  id: string;
  name: string;
  zone: string;
  streamUrl: string;
  streamType: 'simulated' | 'iframe' | 'video';
  online: boolean;
  resolution: string;
}

export interface RestaurantSettings {
  restaurantName: string;
  tagline: string;
  address: string;
  phone: string;
  fssaiNo: string;
  gstRatePercent: number;
  defaultPackagingCharge: number;
  directDiscountPercent?: number;
  whatsappNumber: string;
  whatsappPrefillText: string;
  billHeaderNote: string;
  billFooterCTA: string;
  swiggyCommissionPercent: number;
  zomatoCommissionPercent: number;
  gasWebAppUrl: string;
  cameras: CameraConfig[];
}

export const INITIAL_MENU: MenuItem[] = [
  // Kebabs
  { id: 'M-101', name: 'Lucknowi Galouti Kebab (4 Pcs)', category: 'Kebabs', price: 240, veg: false, available: true, prepTimeMins: 12, sku: 'KBB-01' },
  { id: 'M-102', name: 'Charcoal Chicken Seekh Kebab', category: 'Kebabs', price: 210, veg: false, available: true, prepTimeMins: 14, sku: 'KBB-02' },
  { id: 'M-103', name: 'Awadhi Mutton Shami Kebab (4 Pcs)', category: 'Kebabs', price: 230, veg: false, available: true, prepTimeMins: 10, sku: 'KBB-03' },
  { id: 'M-104', name: 'Mumbai Malai Chicken Tikka', category: 'Kebabs', price: 250, veg: false, available: true, prepTimeMins: 15, sku: 'KBB-04' },
  { id: 'M-105', name: 'Subz Hara Bhara Kebab (6 Pcs)', category: 'Kebabs', price: 170, veg: true, available: true, prepTimeMins: 10, sku: 'KBB-05' },

  // Stews
  { id: 'M-201', name: 'Wazirbagh Special Mutton Nihari', category: 'Stews', price: 320, veg: false, available: true, prepTimeMins: 15, sku: 'STW-01' },
  { id: 'M-202', name: 'Mumbai Bhuna Chicken Khara Masala', category: 'Stews', price: 270, veg: false, available: true, prepTimeMins: 14, sku: 'STW-02' },
  { id: 'M-203', name: 'Degh Mutton Korma Stew', category: 'Stews', price: 310, veg: false, available: true, prepTimeMins: 15, sku: 'STW-03' },
  { id: 'M-204', name: 'Paneer Mughlai White Korma', category: 'Stews', price: 220, veg: true, available: true, prepTimeMins: 12, sku: 'STW-04' },

  // Rice Bowls
  { id: 'M-301', name: 'Lucknowi Dum Chicken Biryani Bowl', category: 'Rice Bowls', price: 240, veg: false, available: true, prepTimeMins: 10, sku: 'RIC-01' },
  { id: 'M-302', name: 'Mutton Yakhni Pulao Bowl', category: 'Rice Bowls', price: 290, veg: false, available: true, prepTimeMins: 12, sku: 'RIC-02' },
  { id: 'M-303', name: 'Smoky Tikka Masala Rice Bowl', category: 'Rice Bowls', price: 210, veg: false, available: true, prepTimeMins: 10, sku: 'RIC-03' },
  { id: 'M-304', name: 'Tawa Pulao Mumbai Style (Veg)', category: 'Rice Bowls', price: 165, veg: true, available: true, prepTimeMins: 8, sku: 'RIC-04' },

  // Combos
  { id: 'M-401', name: 'Galouti Kebab + 2 Ulte Tawe Ka Paratha', category: 'Combos', price: 260, veg: false, available: true, prepTimeMins: 12, sku: 'CMB-01' },
  { id: 'M-402', name: 'Mutton Nihari + 2 Mughlai Sheermal', category: 'Combos', price: 360, veg: false, available: true, prepTimeMins: 15, sku: 'CMB-02' },
  { id: 'M-403', name: 'Chicken Seekh Roll + Masala Chaas Combo', category: 'Combos', price: 195, veg: false, available: true, prepTimeMins: 10, sku: 'CMB-03' },
  { id: 'M-404', name: 'Family Zaika Dastarkhwan Box (Serves 3)', category: 'Combos', price: 790, veg: false, available: true, prepTimeMins: 22, sku: 'CMB-04' },

  // Burgers
  { id: 'M-501', name: 'Crispy Chicken Shami Bun Kebab Burger', category: 'Burgers', price: 135, veg: false, available: true, prepTimeMins: 8, sku: 'BRG-01' },
  { id: 'M-502', name: 'Mumbai Schezwan Vada Pav Slider (2 Pcs)', category: 'Burgers', price: 110, veg: true, available: true, prepTimeMins: 6, sku: 'BRG-02' },
  { id: 'M-503', name: 'Mutton Keema Pav Bun Burger', category: 'Burgers', price: 165, veg: false, available: true, prepTimeMins: 9, sku: 'BRG-03' },
  { id: 'M-504', name: 'Tandoori Paneer Zinger Burger', category: 'Burgers', price: 140, veg: true, available: true, prepTimeMins: 8, sku: 'BRG-04' },

  // Pakoras
  { id: 'M-601', name: 'Crispy Chicken Lollipop Pakora (6 Pcs)', category: 'Pakoras', price: 190, veg: false, available: true, prepTimeMins: 10, sku: 'PKR-01' },
  { id: 'M-602', name: 'Mumbai Kanda Bhajiya Basket', category: 'Pakoras', price: 115, veg: true, available: true, prepTimeMins: 7, sku: 'PKR-02' },
  { id: 'M-603', name: 'Lahori Fish Amritsari Pakora', category: 'Pakoras', price: 245, veg: false, available: true, prepTimeMins: 12, sku: 'PKR-03' },
  { id: 'M-604', name: 'Mirchi & Paneer Pakora Platter', category: 'Pakoras', price: 145, veg: true, available: true, prepTimeMins: 8, sku: 'PKR-04' },
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'USR-01',
    name: 'Majeed (Admin)',
    role: 'Admin',
    pin: '1234',
    active: true,
    permissions: { expenses: true, pos: true, history: true, cctv: true, admin: true, settings: true, deploy: true, pnl: true },
  },
];

export const INITIAL_SETTINGS: RestaurantSettings = {
  restaurantName: 'Mumbai Zaika',
  tagline: 'Authentic Lucknowi & Bambaiya Cloud Kitchen',
  address: 'Wazirbagh Mohalla, Saadatganj, Lucknow - 226003',
  phone: '+91 98765 43210',
  fssaiNo: '30261105128038073',
  gstRatePercent: 5,
  defaultPackagingCharge: 20,
  directDiscountPercent: 15,
  whatsappNumber: '919876543210',
  whatsappPrefillText: 'Hi Mumbai Zaika, I want to place a direct order!',
  billHeaderNote: 'Freshly Prepared · 100% Halal · Hygienic Cloud Kitchen',
  billFooterCTA: 'Scan to Order Directly on WhatsApp Next Time & Get 15% OFF! Bypass Swiggy/Zomato Commissions!',
  swiggyCommissionPercent: 24,
  zomatoCommissionPercent: 25,
  gasWebAppUrl: 'https://script.google.com/macros/s/AKfycbz_MUMBAI_ZAIKA_DEPLOYMENT_ID/exec',
  cameras: [
    {
      id: 'CAM-01',
      name: 'Main Tandoor & Kebab Station',
      zone: 'Kitchen Hot Line · Bay 1',
      streamUrl: '',
      streamType: 'simulated',
      online: true,
      resolution: '1080p · 30fps',
    },
    {
      id: 'CAM-02',
      name: 'Stew, Nihari & Dum Biryani Line',
      zone: 'Kitchen Prep · Bay 2',
      streamUrl: '',
      streamType: 'simulated',
      online: true,
      resolution: '1080p · 30fps',
    },
    {
      id: 'CAM-03',
      name: 'Dispatch & Thermal Packing Counter',
      zone: 'Quality Check & Sealing',
      streamUrl: '',
      streamType: 'simulated',
      online: true,
      resolution: '1080p · 25fps',
    },
    {
      id: 'CAM-04',
      name: 'Walk-in & Swiggy/Zomato Rider Window',
      zone: 'Wazirbagh Street Entrance',
      streamUrl: '',
      streamType: 'simulated',
      online: true,
      resolution: '720p · 30fps',
    },
  ],
};

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000).toISOString();

export const INITIAL_ORDERS: OrderRecord[] = [];

export const INITIAL_EXPENSES: ExpenseRecord[] = [];

export const SAMPLE_SWIGGY_PASTE = `SWIGGY PARTNER ORDER #SWG-884920144
Customer: Rohit Srivastava (+91 98394 55120)
2 x Lucknowi Galouti Kebab (4 Pcs) @ ₹240 = ₹480
1 x Wazirbagh Special Mutton Nihari @ ₹320 = ₹320
2 x Mumbai Schezwan Vada Pav Slider (2 Pcs) @ ₹110 = ₹220
Packaging Charge: ₹30
GST / Taxes: ₹51
Promo Discount: -₹60
Grand Total: ₹1041`;

export const SAMPLE_ZOMATO_PASTE = `ZOMATO ORDER ID: ZMT-55192837
Customer: Ayesha Kidwai (9415288310)
1 x Family Zaika Dastarkhwan Box (Serves 3) - Rs. 790
2 x Crispy Chicken Shami Bun Kebab Burger - Rs. 270
1 x Crispy Chicken Lollipop Pakora (6 Pcs) - Rs. 190
Restaurant Packaging: Rs. 35
Taxes (5% GST): Rs. 62.50
Coupon Discount: Rs. 100
Total Bill: Rs. 1247.50`;

export interface ParsedAggregatorOrder {
  orderType: OrderType;
  externalOrderId: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  packagingCharge: number;
  taxAmount: number;
  discountAmount: number;
}

export function parseAggregatorOrderText(rawText: string, menu: MenuItem[]): ParsedAggregatorOrder {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let orderType: OrderType = 'Swiggy';
  if (/zomato|zmt/i.test(rawText)) {
    orderType = 'Zomato';
  } else if (/swiggy|swg/i.test(rawText)) {
    orderType = 'Swiggy';
  }

  let externalOrderId = '';
  const orderIdMatch = rawText.match(/(?:ORDER\s*(?:ID|#)?\s*[:#-]?\s*)([A-Z0-9-]{5,})/i);
  if (orderIdMatch) {
    externalOrderId = orderIdMatch[1].trim();
  }

  let customerName = 'Portal Customer';
  let customerPhone = '';
  const custMatch = rawText.match(/Customer\s*:\s*([^(\n]+)(?:\(([^)]+)\))?/i);
  if (custMatch) {
    customerName = custMatch[1].trim();
    if (custMatch[2]) {
      customerPhone = custMatch[2].replace(/[^\d+]/g, '');
    }
  }
  if (!customerPhone) {
    const phoneMatch = rawText.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
    if (phoneMatch) customerPhone = phoneMatch[0].trim();
  }

  let packagingCharge = 0;
  let taxAmount = 0;
  let discountAmount = 0;
  const items: CartItem[] = [];

  for (const line of lines) {
    if (/packaging|packing|container/i.test(line)) {
      const m = line.match(/(?:₹|Rs\.?|INR)?\s*(\d+(?:\.\d+)?)/i);
      if (m) packagingCharge = Math.round(parseFloat(m[1]));
      continue;
    }
    if (/\b(?:gst|tax|taxes|cgst|sgst)\b/i.test(line)) {
      const nums = [...line.matchAll(/(?:₹|Rs\.?|INR)?\s*(\d+(?:\.\d+)?)/gi)].map((x) => parseFloat(x[1]));
      if (nums.length > 0) {
        taxAmount = Math.round(nums[nums.length - 1]);
      }
      continue;
    }
    if (/discount|promo|coupon|offer/i.test(line)) {
      const m = line.match(/(?:₹|Rs\.?|INR|-)?\s*(\d+(?:\.\d+)?)/i);
      if (m) discountAmount = Math.round(parseFloat(m[1]));
      continue;
    }
    if (/^(?:swiggy|zomato|customer|grand total|total bill|subtotal|net payable)/i.test(line)) {
      continue;
    }

    // Match item lines like:
    // "2 x Lucknowi Galouti Kebab (4 Pcs) @ ₹240 = ₹480"
    // "1 x Family Zaika Dastarkhwan Box (Serves 3) - Rs. 790"
    // "Lucknowi Dum Chicken Biryani Bowl x 2 ₹480"
    const qtyPrefixMatch = line.match(/^(\d+)\s*[xX*]\s+(.+?)(?:\s*[@=-]\s*(?:₹|Rs\.?|INR)?\s*(\d+(?:\.\d+)?))?(?:\s*=\s*(?:₹|Rs\.?|INR)?\s*(\d+(?:\.\d+)?))?$/i);
    const qtySuffixMatch = line.match(/^(.+?)\s*[xX*]\s*(\d+)\s*(?:[@=-]|\s)\s*(?:₹|Rs\.?|INR)?\s*(\d+(?:\.\d+)?)$/i);

    let qty = 0;
    let rawName = '';
    let parsedUnitOrLinePrice = 0;
    let hasUnitPriceIndicator = false;

    if (qtyPrefixMatch) {
      qty = parseInt(qtyPrefixMatch[1], 10);
      rawName = qtyPrefixMatch[2].replace(/\s*[-@=]\s*$/, '').trim();
      if (qtyPrefixMatch[3] && qtyPrefixMatch[4]) {
        parsedUnitOrLinePrice = parseFloat(qtyPrefixMatch[3]);
        hasUnitPriceIndicator = true;
      } else if (qtyPrefixMatch[3]) {
        parsedUnitOrLinePrice = parseFloat(qtyPrefixMatch[3]);
        hasUnitPriceIndicator = line.includes('@');
      }
    } else if (qtySuffixMatch) {
      rawName = qtySuffixMatch[1].trim();
      qty = parseInt(qtySuffixMatch[2], 10);
      parsedUnitOrLinePrice = parseFloat(qtySuffixMatch[3]);
    }

    if (qty > 0 && rawName) {
      const cleanNameLower = rawName.toLowerCase();
      const matchedMenu = menu.find(
        (m) =>
          m.name.toLowerCase() === cleanNameLower ||
          m.name.toLowerCase().includes(cleanNameLower) ||
          cleanNameLower.includes(m.name.toLowerCase().split('(')[0].trim())
      );

      let unitPrice = matchedMenu ? matchedMenu.price : 180;
      if (!matchedMenu && parsedUnitOrLinePrice > 0) {
        unitPrice = hasUnitPriceIndicator
          ? Math.round(parsedUnitOrLinePrice)
          : Math.round(parsedUnitOrLinePrice / qty);
      }

      items.push({
        menuItemId: matchedMenu ? matchedMenu.id : `CUSTOM-${Date.now()}-${items.length}`,
        name: matchedMenu ? matchedMenu.name : rawName,
        price: unitPrice,
        qty,
      });
    }
  }

  return {
    orderType,
    externalOrderId,
    customerName,
    customerPhone,
    items,
    packagingCharge,
    taxAmount,
    discountAmount,
  };
}

// Smart Environment Detector: Checks if running inside Google Apps Script iframe
export function isGasEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).google !== 'undefined' && Boolean((window as any).google.script);
}

const STORAGE_KEYS = {
  MENU: 'mz_pos_menu_v1',
  ORDERS: 'mz_pos_orders_v1',
  EXPENSES: 'mz_pos_expenses_v1',
  USERS: 'mz_pos_users_v1',
  SETTINGS: 'mz_pos_settings_v1',
};

export const DataService = {
  loadAll(): {
    menu: MenuItem[];
    orders: OrderRecord[];
    expenses: ExpenseRecord[];
    users: UserAccount[];
    settings: RestaurantSettings;
    mode: 'Google Sheets (Apps Script)' | 'LocalStorage & Live Preview Mock DB';
  } {
    const mode = isGasEnvironment()
      ? 'Google Sheets (Apps Script)'
      : 'LocalStorage & Live Preview Mock DB';

    try {
      const menuRaw = localStorage.getItem(STORAGE_KEYS.MENU);
      const ordersRaw = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const expensesRaw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      const usersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
      const settingsRaw = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      const menu: MenuItem[] = menuRaw ? JSON.parse(menuRaw) : INITIAL_MENU;
      const orders: OrderRecord[] = ordersRaw ? JSON.parse(ordersRaw) : INITIAL_ORDERS;
      const expenses: ExpenseRecord[] = expensesRaw ? JSON.parse(expensesRaw) : INITIAL_EXPENSES;
      const rawUsersList: UserAccount[] = usersRaw ? JSON.parse(usersRaw) : INITIAL_USERS;
      const users: UserAccount[] = rawUsersList.map((u) => ({
        ...u,
        permissions: {
          expenses: u.permissions?.expenses ?? true,
          pos: u.permissions?.pos ?? true,
          history: u.permissions?.history ?? true,
          cctv: u.permissions?.cctv ?? true,
          admin: u.permissions?.admin ?? (u.role === 'Admin'),
          settings: u.permissions?.settings ?? (u.role === 'Admin'),
          deploy: u.permissions?.deploy ?? (u.role === 'Admin'),
          pnl: u.permissions?.pnl ?? (u.role === 'Admin'),
        },
      }));
      // Filter out any obsolete hardcoded mock accounts (Faizan/Rizwan) so only actual Sheet users remain
      const cleanUsers = users.filter(
        (u) =>
          u.name !== 'Faizan Siddiqui (Cashier)' &&
          u.name !== 'Rizwan Khan (Kitchen Lead)' &&
          u.name !== 'Rizwan Khan (Kitchen Head)'
      );
      const finalUsers = cleanUsers.length > 0 ? cleanUsers : INITIAL_USERS;

      const settings: RestaurantSettings = settingsRaw
        ? { ...INITIAL_SETTINGS, ...JSON.parse(settingsRaw) }
        : INITIAL_SETTINGS;

      if (!menuRaw) localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
      if (!ordersRaw) localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      if (!expensesRaw) localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(finalUsers));
      if (!settingsRaw) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

      return { menu, orders, expenses, users: finalUsers, settings, mode };
    } catch {
      return {
        menu: INITIAL_MENU,
        orders: INITIAL_ORDERS,
        expenses: INITIAL_EXPENSES,
        users: INITIAL_USERS,
        settings: INITIAL_SETTINGS,
        mode,
      };
    }
  },

  deleteExpense(expenseId: string) {
    if (isGasEnvironment()) {
      (window as any).google.script.run.deleteExpense(expenseId);
    }
  },

  saveOrders(orders: OrderRecord[], latestOrder?: OrderRecord) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    if (isGasEnvironment() && latestOrder) {
      (window as any).google.script.run.saveOrder(latestOrder);
    }
  },

  saveExpenses(expenses: ExpenseRecord[], latestExpense?: ExpenseRecord) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    if (isGasEnvironment() && latestExpense) {
      (window as any).google.script.run.saveExpense(latestExpense);
    }
  },

  saveMenu(menu: MenuItem[]) {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
    if (isGasEnvironment()) {
      (window as any).google.script.run.saveMenu(menu);
    }
  },

  saveUsers(users: UserAccount[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    if (isGasEnvironment()) {
      (window as any).google.script.run.manageUsers(users);
    }
  },

  saveSettings(settings: RestaurantSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (isGasEnvironment()) {
      (window as any).google.script.run.updateSettings(settings);
    }
  },

  resetToDemoDefaults() {
    localStorage.removeItem(STORAGE_KEYS.MENU);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    return this.loadAll();
  },
};
