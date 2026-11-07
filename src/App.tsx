/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Check,
  ClipboardPaste,
  Code2,
  KeyRound,
  Lock,
  Minus,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Video,
  X,
} from 'lucide-react';
import {
  CartItem,
  DataService,
  ExpenseRecord,
  MenuCategory,
  MenuItem,
  OrderRecord,
  OrderType,
  PaymentMode,
  RestaurantSettings,
  SAMPLE_SWIGGY_PASTE,
  SAMPLE_ZOMATO_PASTE,
  UserAccount,
  UserPermissions,
  parseAggregatorOrderText,
} from './data/mockDatabase';
import { ThermalReceipt } from './components/ThermalReceipt';
import { ExpensesPnlModule } from './components/ExpensesPnlModule';
import { OrderHistoryModule } from './components/OrderHistoryModule';
import { CctvModule } from './components/CctvModule';
import { AdminModule } from './components/AdminModule';
import { SettingsModule } from './components/SettingsModule';
import { DeployCodeHub } from './components/DeployCodeHub';
import { printThermalReceipt } from './utils/printReceipt';

type ActiveModule = 'pos' | 'expenses' | 'history' | 'cctv' | 'admin' | 'settings' | 'deploy';

interface NavItemConfig {
  id: ActiveModule;
  label: string;
  mobileLabel: string;
  icon: React.ElementType;
  permissionKey: keyof UserPermissions;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'expenses', label: 'Expenses Manager', mobileLabel: 'Expenses', icon: Receipt, permissionKey: 'expenses' },
  { id: 'pos', label: 'Billing Desk', mobileLabel: 'Billing', icon: UtensilsCrossed, permissionKey: 'pos' },
  { id: 'history', label: 'Order History & PnL', mobileLabel: 'History', icon: TrendingUp, permissionKey: 'history' },
  { id: 'cctv', label: 'Camera Hub', mobileLabel: 'Camera', icon: Video, permissionKey: 'cctv' },
  { id: 'admin', label: 'Admin & Profile', mobileLabel: 'Admin', icon: Users, permissionKey: 'admin' },
  { id: 'settings', label: 'Settings', mobileLabel: 'Settings', icon: Sliders, permissionKey: 'settings' },
  { id: 'deploy', label: 'GAS & GitHub Code', mobileLabel: 'Code Hub', icon: Code2, permissionKey: 'deploy' },
];

const ORDER_TYPES: OrderType[] = [
  'Pickup / Takeaway',
  'Direct Delivery',
  'Swiggy',
  'Zomato',
];

const CATEGORIES: (MenuCategory | 'All')[] = [
  'All',
  'Kebabs',
  'Stews',
  'Rice Bowls',
  'Combos',
  'Burgers',
  'Pakoras',
];

const LOCKED_USER: UserAccount = {
  id: 'USR-GUEST',
  name: 'Terminal Locked (Guest)',
  role: 'Guest',
  pin: '',
  active: false,
  permissions: { expenses: false, pos: false, history: false, cctv: false, admin: false, settings: false, deploy: false, pnl: false },
};

export default function App() {
  const initialData = useMemo(() => DataService.loadAll(), []);

  const [menu, setMenu] = useState<MenuItem[]>(initialData.menu);
  const [orders, setOrders] = useState<OrderRecord[]>(initialData.orders);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialData.expenses);
  const [users, setUsers] = useState<UserAccount[]>(initialData.users);
  const [settings, setSettings] = useState<RestaurantSettings>(initialData.settings);
  const [runtimeMode, setRuntimeMode] = useState(initialData.mode);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);

  // Active User session: restored from localStorage until explicit Logout
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem('mz_active_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.id !== 'USR-GUEST' && parsed.active) {
          return parsed;
        }
      }
    } catch {}
    return LOCKED_USER;
  });
  const [billPaperSize, setBillPaperSize] = useState<'58mm' | '80mm'>('58mm');
  const [inlinePin, setInlinePin] = useState('');
  const [inlinePinError, setInlinePinError] = useState('');

  // Background silent auto-sync every 20 seconds (Without annoying toast popups)
  React.useEffect(() => {
    const timer = setInterval(() => {
      const fresh = DataService.loadAll();
      if (fresh) {
        setExpenses(fresh.expenses);
        setOrders(fresh.orders);
        if (fresh.users && fresh.users.length) setUsers(fresh.users);
        if (fresh.settings) setSettings(fresh.settings);
      }
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  // Navigation Items strictly linked to permissions
  const permittedNavItems = useMemo(() => {
    if (!currentUser.active && currentUser.id === 'USR-GUEST') {
      return [];
    }
    return NAV_ITEMS.filter((item) => Boolean(currentUser.permissions && currentUser.permissions[item.permissionKey]));
  }, [currentUser]);

  const [activeModule, setActiveModule] = useState<ActiveModule>('expenses');

  // Ensure activeModule is permitted for the active user session
  React.useEffect(() => {
    if (permittedNavItems.length > 0) {
      const isPermitted = permittedNavItems.some((item) => item.id === activeModule);
      if (!isPermitted) {
        setActiveModule(permittedNavItems[0].id);
      }
    }
  }, [permittedNavItems, activeModule]);

  // POS State
  const [orderType, setOrderType] = useState<OrderType>('Pickup / Takeaway');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [externalOrderId, setExternalOrderId] = useState('');
  const [packagingCharge, setPackagingCharge] = useState<number>(
    initialData.settings.defaultPackagingCharge
  );
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [customTaxOverride, setCustomTaxOverride] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');

  // Smart Paste Parser State
  const [showSmartParser, setShowSmartParser] = useState(false);
  const [rawPasteText, setRawPasteText] = useState('');
  const [parserFeedback, setParserFeedback] = useState<string | null>(null);

  // Thermal Receipt Print Modal State
  const [previewOrder, setPreviewOrder] = useState<OrderRecord | null>(null);
  const [orderSavedBanner, setOrderSavedBanner] = useState<string | null>(null);

  // PIN Login / Staff Switcher Modal State
  const [showPinModal, setShowPinModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Keyboard Shortcuts: ESC closes modals, Enter submits / prints / saves open modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPinModal(false);
        setShowUserProfileModal(false);
        setPreviewOrder(null);
        setShowSmartParser(false);
      } else if (e.key === 'Enter') {
        if (showPinModal) {
          const form = document.getElementById('pin-modal-form') as HTMLFormElement | null;
          if (form) {
            e.preventDefault();
            form.requestSubmit();
          }
        } else if (previewOrder) {
          e.preventDefault();
          printThermalReceipt('thermal-modal-receipt');
        } else if (showSmartParser && rawPasteText.trim()) {
          e.preventDefault();
          handleRunSmartPasteParser();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal, previewOrder, showSmartParser, rawPasteText, pinInput]);

  // Next Invoice Generator
  const nextInvoiceNo = useMemo(() => {
    const base = 8401 + orders.length;
    return `MZ-${base}`;
  }, [orders.length]);

  // Cart Calculations
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const taxAmount = useMemo(() => {
    if (customTaxOverride !== null) return customTaxOverride;
    return Math.round((subtotal * settings.gstRatePercent) / 100);
  }, [subtotal, settings.gstRatePercent, customTaxOverride]);

  const grandTotal = useMemo(
    () => Math.max(0, subtotal + taxAmount + packagingCharge - discountAmount),
    [subtotal, taxAmount, packagingCharge, discountAmount]
  );

  // Live Draft Order for 80mm Receipt Preview
  const activeDraftOrder: OrderRecord = useMemo(
    () => ({
      invoiceNo: nextInvoiceNo,
      timestamp: new Date().toISOString(),
      orderType,
      customerName: customerName.trim() || (orderType === 'Pickup / Takeaway' ? 'Walk-in Customer' : 'Customer'),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim() || undefined,
      externalOrderId: externalOrderId.trim() || undefined,
      items: cart,
      subtotal,
      taxAmount,
      packagingCharge,
      discountAmount,
      grandTotal,
      paymentMode,
      cashierName: currentUser.name,
    }),
    [
      nextInvoiceNo,
      orderType,
      customerName,
      customerPhone,
      customerAddress,
      externalOrderId,
      cart,
      subtotal,
      taxAmount,
      packagingCharge,
      discountAmount,
      grandTotal,
      paymentMode,
      currentUser.name,
    ]
  );

  const receiptToPrint = previewOrder || activeDraftOrder;

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  const handleSelectOrderType = (type: OrderType) => {
    setOrderType(type);
    if (type === 'Pickup / Takeaway') {
      setPackagingCharge(15);
      setPaymentMode('UPI');
    } else if (type === 'Direct Delivery') {
      setPackagingCharge(settings.defaultPackagingCharge);
      setPaymentMode('UPI');
    } else {
      setPackagingCharge(30);
      setPaymentMode('Online Portal');
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!item.available) return;
    setCustomTaxOverride(null);
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) => (c.menuItemId === item.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const handleUpdateCartQty = (menuItemId: string, delta: number) => {
    setCustomTaxOverride(null);
    setCart((prev) =>
      prev
        .map((c) => (c.menuItemId === menuItemId ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const handleClearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setExternalOrderId('');
    setDiscountAmount(0);
    setCustomTaxOverride(null);
  };

  const handleRunSmartPasteParser = () => {
    if (!rawPasteText.trim()) return;
    const parsed = parseAggregatorOrderText(rawPasteText, menu);
    setOrderType(parsed.orderType);
    if (parsed.externalOrderId) setExternalOrderId(parsed.externalOrderId);
    if (parsed.customerName) setCustomerName(parsed.customerName);
    if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
    if (parsed.items.length > 0) setCart(parsed.items);
    setPackagingCharge(parsed.packagingCharge);
    setDiscountAmount(parsed.discountAmount);
    if (parsed.taxAmount > 0) setCustomTaxOverride(parsed.taxAmount);
    setPaymentMode('Online Portal');

    setParserFeedback(
      `Parsed ${parsed.items.length} dishes (${parsed.orderType}${
        parsed.externalOrderId ? ` · #${parsed.externalOrderId}` : ''
      }) into POS cart.`
    );
    setTimeout(() => setParserFeedback(null), 4000);
  };

  const handleCompleteOrder = (triggerPrint: boolean) => {
    if (cart.length === 0) return;
    const finalizedOrder: OrderRecord = {
      ...activeDraftOrder,
      timestamp: new Date().toISOString(),
    };

    const nextOrders = [finalizedOrder, ...orders];
    setOrders(nextOrders);
    DataService.saveOrders(nextOrders, finalizedOrder);

    setOrderSavedBanner(
      `Order ${finalizedOrder.invoiceNo} (${finalizedOrder.orderType} · ₹${finalizedOrder.grandTotal}) saved to ${runtimeMode}.`
    );
    setTimeout(() => setOrderSavedBanner(null), 3500);

    if (triggerPrint) {
      setPreviewOrder(finalizedOrder);
      setTimeout(() => {
        printThermalReceipt('thermal-print-area', billPaperSize);
      }, 150);
    }

    handleClearCart();
  };

  const handleInlinePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const matched = users.find((u) => u.pin === inlinePin.trim());
    if (!matched) {
      setInlinePinError('Incorrect PIN code. Please check and try again.');
      return;
    }
    setCurrentUser(matched);
    try {
      localStorage.setItem('mz_active_user', JSON.stringify(matched));
    } catch {}
    setInlinePin('');
    setInlinePinError('');
    if (activeModule === 'admin' && !matched.permissions.admin) {
      setActiveModule('pos');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = users.find((u) => u.pin === pinInput.trim());
    if (!matched) {
      setPinError('Incorrect PIN code. Please check and try again.');
      return;
    }
    setCurrentUser(matched);
    try {
      localStorage.setItem('mz_active_user', JSON.stringify(matched));
    } catch {}
    setPinInput('');
    setPinError('');
    setShowPinModal(false);
    if (activeModule === 'admin' && !matched.permissions.admin) {
      setActiveModule('pos');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('mz_active_user');
    } catch {}
    // Switch to Locked Guest with zero module permissions
    const guestUser: UserAccount = {
      id: 'USR-GUEST',
      name: 'Terminal Locked (Guest)',
      role: 'Guest',
      pin: '',
      active: false,
      permissions: { expenses: false, pos: false, history: false, cctv: false, admin: false, settings: false, deploy: false, pnl: false },
    };
    setCurrentUser(guestUser);
    setShowUserProfileModal(false);
  };

  const getProfileBadge = (user: UserAccount, isMobile: boolean) => {
    if (!user.active && user.id === 'USR-GUEST') {
      return isMobile ? '🔒 Locked' : '🔒 Terminal Locked';
    }
    const match = user.name.match(/\(([^)]+)\)/);
    const roleInParen = match ? match[1].trim() : user.role;
    const firstName = user.name.split('(')[0].trim().split(' ')[0];
    if (isMobile) {
      return `${firstName} (${roleInParen})`;
    }
    return `${user.name.split('(')[0].trim()} · ${roleInParen}`;
  };

  const isTerminalLocked = currentUser.id === 'USR-GUEST' || !currentUser.active;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 pb-20 sm:pb-0">
      {/* Hidden/Dedicated 80mm Print Area for Physical Thermal POS Printer */}
      <div className="hidden print:block">
        <ThermalReceipt id="thermal-print-area" order={receiptToPrint} settings={settings} />
      </div>

      {/* TOP BAR: Clean & Responsive Header */}
      <header className="bg-white border-b border-stone-200 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-6 sticky top-0 z-30 no-print shadow-2xs">
        {/* Brand logo / wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="#expenses"
            onClick={(e) => {
              e.preventDefault();
              if (permittedNavItems.length > 0) setActiveModule('expenses');
            }}
            className="text-base sm:text-lg font-black tracking-tight text-stone-900 whitespace-nowrap shrink-0 font-display"
          >
            {settings.restaurantName}
          </a>
          <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded">
            Lucknow
          </span>
        </div>

        {/* DESKTOP MENU BAR: Strictly filtered by active user permissions (Hidden on mobile) */}
        <nav className="hidden sm:flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-medium text-stone-600 overflow-x-auto py-1 scrollbar-none">
          {isTerminalLocked ? (
            <div className="text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Terminal Locked · Click Profile to Unlock</span>
            </div>
          ) : (
            permittedNavItems.map((item) => {
              const active = activeModule === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-stone-900 text-white font-bold shadow-xs'
                      : 'hover:text-stone-900 hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </nav>

        {/* Staff Profile & Terminal PIN Unlock Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (isTerminalLocked) {
                setShowPinModal(true);
              } else {
                setShowUserProfileModal(true);
              }
            }}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer shadow-xs ${
              isTerminalLocked
                ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-[10px]">
              {currentUser.name.charAt(0)}
            </div>
            {/* Desktop label: Full Name · Role */}
            <span className="hidden sm:inline font-bold">
              {getProfileBadge(currentUser, false)}
            </span>
            {/* Mobile label: User (Role) */}
            <span className="sm:hidden font-bold">
              {getProfileBadge(currentUser, true)}
            </span>
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (iOS / Android App Style) */}
      {!isTerminalLocked && permittedNavItems.length > 0 && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-1 py-1 flex items-center justify-around shadow-lg sm:hidden no-print">
          {permittedNavItems.map((item) => {
            const active = activeModule === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1.5 px-0.5 transition-colors cursor-pointer ${
                  active ? 'text-amber-600 font-extrabold' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    active ? 'bg-amber-100 text-amber-900 shadow-2xs' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-medium truncate max-w-[56px]">
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-8 no-print">
        {/* If Terminal is Locked / Guest, show lock prompt */}
        {isTerminalLocked ? (
          <div className="max-w-md mx-auto my-12 bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xl">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-display">Terminal Locked</h2>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Please enter assigned staff PIN code to unlock counter terminal and load authorized menu modules.
              </p>
            </div>
            <form onSubmit={handleInlinePinSubmit} className="space-y-3 pt-2">
              <input
                type="password"
                maxLength={6}
                value={inlinePin}
                onChange={(e) => {
                  setInlinePin(e.target.value);
                  setInlinePinError('');
                }}
                placeholder="Enter Staff PIN"
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 border-stone-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50"
              />
              {inlinePinError && (
                <p className="text-xs text-rose-600 font-semibold">{inlinePinError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Unlock Terminal</span>
              </button>
            </form>
            <p className="text-[11px] text-stone-400 pt-1">
              Security Note: On page refresh and logout, terminal automatically locks with zero module permissions.
            </p>
          </div>
        ) : (
          <>
        {/* MODULE 1: POS BILLING & ORDER MODE */}
        {activeModule === 'pos' && (
          <div className="space-y-8">
            {/* Sub-header context strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                  Cloud Kitchen POS Billing & 80mm Thermal Receipt Desk
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-1">
                  <span>{settings.address}</span>
                  <span>·</span>
                  <span className="font-mono">FSSAI {settings.fssaiNo}</span>
                  <span>·</span>
                  <span className="font-mono text-stone-700">{runtimeMode}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setShowSmartParser(!showSmartParser)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    showSmartParser
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Swiggy / Zomato Smart Paste Parser</span>
                </button>
                <button
                  onClick={() => setPreviewOrder(activeDraftOrder)}
                  className="px-3.5 py-2 text-xs font-semibold bg-white border border-stone-300 text-stone-800 rounded-lg hover:bg-stone-100 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>80mm Print Preview</span>
                </button>
              </div>
            </div>

            {orderSavedBanner && (
              <div className="fixed z-50 transition-all duration-300 sm:top-5 sm:right-5 sm:bottom-auto sm:left-auto sm:translate-x-0 bottom-20 left-1/2 -translate-x-1/2">
                <div className="bg-stone-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 shadow-xl border border-stone-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{orderSavedBanner}</span>
                  </div>
                  <button
                    onClick={() => setOrderSavedBanner(null)}
                    className="text-stone-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Swiggy / Zomato Smart Paste Parser Drawer */}
            {showSmartParser && (
              <div className="bg-white border border-stone-300 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-stone-900">
                      Swiggy & Zomato Partner Portal Smart Paste Parser
                    </h2>
                    <p className="text-xs text-stone-600">
                      Paste raw order text from Swiggy or Zomato partner portals to automatically extract Item Names, Quantities, Taxes, Packaging, and Total Price into the POS cart.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRawPasteText(SAMPLE_SWIGGY_PASTE)}
                      className="px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md whitespace-nowrap"
                    >
                      Load Sample Swiggy Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setRawPasteText(SAMPLE_ZOMATO_PASTE)}
                      className="px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md whitespace-nowrap"
                    >
                      Load Sample Zomato Order
                    </button>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={rawPasteText}
                  onChange={(e) => setRawPasteText(e.target.value)}
                  placeholder="Paste raw Swiggy/Zomato order breakdown here (e.g., '2 x Lucknowi Galouti Kebab (4 Pcs) @ ₹240 = ₹480...')"
                  className="w-full p-3 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-emerald-700 font-medium">
                    {parserFeedback || 'Tip: Click "Load Sample Swiggy Order" above to test 1-click regex extraction.'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRawPasteText('');
                        setParserFeedback(null);
                      }}
                      className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                    >
                      Clear Text
                    </button>
                    <button
                      type="button"
                      onClick={handleRunSmartPasteParser}
                      className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Extract & Populate POS Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main 2-Column POS Split: Left (Order Mode + Menu Grid), Right (Cart + Live 80mm Bill) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT 7 COLUMNS: ORDER TYPE SELECTOR + MENU CATALOG */}
              <div className="lg:col-span-7 space-y-5">
                {/* Order Type Selector Card */}
                <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-700">
                      1. Select Order Channel Mode
                    </span>
                    <span className="text-xs text-stone-500">
                      {orderType === 'Pickup / Takeaway'
                        ? 'Minimal fields enabled for 1-click fast counter billing'
                        : `Channel: ${orderType}`}
                    </span>
                  </div>

                  {/* 4 Quick Toggle Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ORDER_TYPES.map((type) => {
                      const active = orderType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleSelectOrderType(type)}
                          className={`py-2.5 px-3 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>

                  {/* Minimal Customer Inputs for Pickup vs Extended for Delivery/Swiggy/Zomato */}
                  {orderType === 'Pickup / Takeaway' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer Name (Optional for 1-click Pickup)"
                        className="px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                      />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="WhatsApp Mobile (Optional)"
                        className="px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer Name"
                        className="px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                      />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                      />
                      {orderType === 'Direct Delivery' ? (
                        <input
                          type="text"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="Delivery Address (e.g. Chowk, Lucknow)"
                          className="px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                        />
                      ) : (
                        <input
                          type="text"
                          value={externalOrderId}
                          onChange={(e) => setExternalOrderId(e.target.value)}
                          placeholder={`${orderType} Order ID (e.g. SWG-19482)`}
                          className="px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Menu Grid Card */}
                <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
                  {/* Category Tabs + Search Input */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                    <div className="flex flex-wrap gap-1">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                            selectedCategory === cat
                              ? 'bg-stone-900 text-white'
                              : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="relative sm:w-56 shrink-0">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter dishes or SKU..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                      />
                    </div>
                  </div>

                  {/* Interactive Dish Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredMenu.map((item) => {
                      const inCart = cart.find((c) => c.menuItemId === item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleAddToCart(item)}
                          className={`p-3.5 rounded-lg border transition-colors flex flex-col justify-between gap-3 ${
                            !item.available
                              ? 'bg-stone-100 border-stone-200 opacity-50 cursor-not-allowed'
                              : inCart
                              ? 'bg-amber-50/50 border-amber-500 cursor-pointer'
                              : 'bg-stone-50/70 hover:bg-stone-100/80 border-stone-200 cursor-pointer'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold text-stone-900 leading-snug">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-1">
                              <span>{item.category}</span>
                              <span>·</span>
                              <span>{item.veg ? 'Veg' : 'Non-Veg'}</span>
                              <span>·</span>
                              <span className="font-mono">{item.sku}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-stone-200/80">
                            <span className="text-sm font-bold font-mono text-stone-900 tabular-nums">
                              ₹{item.price}
                            </span>

                            {inCart ? (
                              <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(item.id, -1)}
                                  className="w-6 h-6 rounded bg-white border border-stone-300 flex items-center justify-center hover:bg-stone-100"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-mono font-bold tabular-nums">
                                  {inCart.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(item.id, 1)}
                                  className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center hover:bg-stone-800"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-amber-700">
                                {item.available ? '+ Add' : 'Sold Out'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT 5 COLUMNS: ACTIVE POS CART + LIVE 80MM THERMAL RECEIPT */}
              <div className="lg:col-span-5 space-y-5">
                {/* Active Bill Cart Card */}
                <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-stone-900">Active POS Bill Cart</h2>
                      <div className="text-xs text-stone-500 font-mono mt-0.5">
                        Invoice: <strong>{nextInvoiceNo}</strong> · Mode: {orderType}
                      </div>
                    </div>
                    {cart.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCart}
                        className="text-xs text-stone-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {/* Cart Items List */}
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-lg border border-dashed border-stone-300">
                      Cart is empty. Click any dish on the left or paste a Swiggy/Zomato order above.
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-200 max-h-60 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div
                          key={item.menuItemId}
                          className="py-2.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-stone-900 truncate">{item.name}</div>
                            <div className="text-[11px] font-mono text-stone-500 tabular-nums">
                              ₹{item.price} × {item.qty} = ₹{item.price * item.qty}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(item.menuItemId, -1)}
                              className="w-6 h-6 rounded border border-stone-300 bg-stone-50 hover:bg-stone-100 flex items-center justify-center"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-mono font-semibold tabular-nums">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(item.menuItemId, 1)}
                              className="w-6 h-6 rounded border border-stone-300 bg-stone-50 hover:bg-stone-100 flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Packaging, Discount & Payment Controls */}
                  <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-stone-200">
                    <div>
                      <label className="block text-[11px] font-medium text-stone-600">
                        Packaging (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={packagingCharge}
                        onChange={(e) => setPackagingCharge(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono bg-stone-50 border border-stone-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-600">
                        Discount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono bg-stone-50 border border-stone-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-600">
                        Payment Mode
                      </label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                        className="w-full mt-1 px-2 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-md"
                      >
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Online Portal">Online Portal</option>
                      </select>
                    </div>
                  </div>

                  {/* Bill Totals Breakdown */}
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-3.5 space-y-1 text-xs font-mono tabular-nums">
                    <div className="flex justify-between text-stone-600">
                      <span>Items Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>GST / Restaurant Tax ({settings.gstRatePercent}%):</span>
                      <span>+₹{taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Packaging Charge:</span>
                      <span>+₹{packagingCharge.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Direct / Promo Discount:</span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-stone-900 border-t border-stone-300 pt-1.5 mt-1">
                      <span>GRAND TOTAL:</span>
                      <span>₹{grandTotal.toLocaleString('en-IN')}.00</span>
                    </div>
                  </div>

                  {/* POS Printer Roll Size Selector */}
                  <div className="flex items-center justify-between p-2.5 bg-stone-100 rounded-xl border border-stone-200 text-xs">
                    <label htmlFor="bill-paper-size-select" className="font-semibold text-stone-700 flex items-center gap-1.5 cursor-pointer">
                      <Printer className="w-3.5 h-3.5 text-stone-500" /> Bill Size:
                    </label>
                    <select
                      id="bill-paper-size-select"
                      value={billPaperSize}
                      onChange={(e) => setBillPaperSize(e.target.value as '58mm' | '80mm')}
                      className="px-2.5 py-1 text-xs font-semibold bg-white text-stone-800 border border-stone-300 rounded-lg shadow-2xs focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer"
                    >
                      <option value="58mm">58mm (2-Inch)</option>
                      <option value="80mm">80mm (3-Inch)</option>
                    </select>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={cart.length === 0}
                      onClick={() => handleCompleteOrder(false)}
                      className="py-2.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Save Order Only
                    </button>
                    <button
                      type="button"
                      disabled={cart.length === 0}
                      onClick={() => handleCompleteOrder(true)}
                      className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Save & Print {billPaperSize} Bill</span>
                    </button>
                  </div>
                </div>

                {/* Live Thermal Receipt Preview Dock */}
                <div className="bg-stone-200/75 border border-stone-300 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                        Live POS Thermal Receipt ({billPaperSize === '58mm' ? '2-inch / 58mm' : '3-inch / 80mm'})
                      </h3>
                      <p className="text-[11px] text-stone-600">
                        Includes FSSAI {settings.fssaiNo} & Dynamic WhatsApp Bypass QR
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewOrder(activeDraftOrder);
                        setTimeout(() => printThermalReceipt('thermal-preview-dock-receipt', billPaperSize), 100);
                      }}
                      className="px-3 py-1.5 bg-white border border-stone-300 rounded-md text-xs font-semibold text-stone-800 hover:bg-stone-50 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Now</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto py-2 flex justify-center">
                    <div className="shadow-sm border border-stone-300 bg-white">
                      <ThermalReceipt id="thermal-preview-dock-receipt" order={activeDraftOrder} settings={settings} billSize={billPaperSize} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent POS Orders History Table with 1-Click Reprint */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-stone-900">
                    Recent POS Orders & Reprint Queue ({orders.length})
                  </h2>
                  <p className="text-xs text-stone-500">
                    Click "Preview / Print 80mm" on any invoice to inspect or reprint its thermal receipt.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600">
                      <th className="py-2.5 px-4">Invoice & Time</th>
                      <th className="py-2.5 px-4">Order Channel</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Items Ordered</th>
                      <th className="py-2.5 px-4 text-right">Grand Total</th>
                      <th className="py-2.5 px-4 text-right">80mm Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-xs">
                    {orders.slice(0, 10).map((ord) => (
                      <tr key={ord.invoiceNo} className="hover:bg-stone-50/80">
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          <div className="font-bold text-stone-900">{ord.invoiceNo}</div>
                          <div className="text-[11px] text-stone-500">
                            {new Date(ord.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-stone-900">{ord.orderType}</span>
                          <span className="mx-1.5 text-stone-400">·</span>
                          <span className="font-mono text-stone-600">{ord.paymentMode}</span>
                          {ord.externalOrderId && (
                            <div className="text-[11px] font-mono text-stone-500">
                              Ref: {ord.externalOrderId}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-stone-900">{ord.customerName}</div>
                          {ord.customerPhone && (
                            <div className="text-[11px] font-mono text-stone-500">
                              {ord.customerPhone}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-stone-600 max-w-md truncate">
                          {ord.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-stone-900 tabular-nums whitespace-nowrap">
                          ₹{ord.grandTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setPreviewOrder(ord)}
                            className="px-2.5 py-1 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md inline-flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Preview / Print 80mm</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2: EXPENSE MANAGER & P&L ANALYTICS */}
        {activeModule === 'expenses' && (
          <ExpensesPnlModule
            orders={orders}
            expenses={expenses}
            currentUser={currentUser}
            settings={settings}
            onAddExpense={(newExp) => {
              const updated = [newExp, ...expenses];
              setExpenses(updated);
              DataService.saveExpenses(updated, newExp);
            }}
            onDeleteExpense={(id) => {
              const updated = expenses.filter((e) => e.id !== id);
              setExpenses(updated);
              DataService.saveExpenses(updated);
            }}
            onRequestAdminSwitch={() => setShowPinModal(true)}
          />
        )}

        {/* MODULE 3: SHOP LIVE CAMERA FEED (CCTV HUB) */}
        {activeModule === 'cctv' && (
          <CctvModule
            settings={settings}
            isAdmin={currentUser.permissions.admin}
            onUpdateSettings={(next) => {
              setSettings(next);
              DataService.saveSettings(next);
            }}
          />
        )}

        {/* MODULE 4: ADMIN CONTROL PANEL & RBAC */}
        {activeModule === 'admin' && (
          <AdminModule
            menu={menu}
            users={users}
            settings={settings}
            onUpdateMenu={(next) => {
              setMenu(next);
              DataService.saveMenu(next);
            }}
            onUpdateUsers={(next) => {
              setUsers(next);
              DataService.saveUsers(next);
              const refreshedCurrent = next.find((u) => u.id === currentUser.id);
              if (refreshedCurrent) setCurrentUser(refreshedCurrent);
            }}
            onUpdateSettings={(next) => {
              setSettings(next);
              DataService.saveSettings(next);
            }}
            onResetDemoData={() => {
              const fresh = DataService.resetToDemoDefaults();
              setMenu(fresh.menu);
              setOrders(fresh.orders);
              setExpenses(fresh.expenses);
              setUsers(fresh.users);
              setSettings(fresh.settings);
            }}
          />
        )}

        {/* MODULE 5: SETTINGS */}
        {activeModule === 'settings' && (
          <SettingsModule
            settings={settings}
            onUpdateSettings={(next) => {
              setSettings(next);
              DataService.saveSettings(next);
            }}
          />
        )}

        {/* MODULE 6: GOOGLE APPS SCRIPT & GITHUB CODE SUITE */}
        {activeModule === 'deploy' && <DeployCodeHub />}

        {/* MODULE 7: ORDER HISTORY & DAY-END RECONCILIATION */}
        {activeModule === 'history' && (
          <OrderHistoryModule
            orders={orders}
            expenses={expenses}
            settings={settings}
            onReprintReceipt={(ord) => setPreviewOrder(ord)}
          />
        )}
        </>
        )}
      </main>

      {/* 80MM THERMAL RECEIPT MODAL */}
      {previewOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-stone-100 border border-stone-300 rounded-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 bg-white border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  POS Thermal Receipt ({previewOrder.invoiceNo}) · {billPaperSize === '58mm' ? '2-inch (58mm)' : '3-inch (80mm)'}
                </h3>
                <p className="text-[11px] text-stone-500">
                  {billPaperSize === '58mm' ? '48mm' : '72mm'} printable width · Zero margins · WhatsApp Direct Bypass QR
                </p>
              </div>
              <button
                onClick={() => setPreviewOrder(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex justify-center bg-stone-200/70">
              <div className="bg-white shadow-md border border-stone-300">
                <ThermalReceipt id="thermal-modal-receipt" order={previewOrder} settings={settings} billSize={billPaperSize} />
              </div>
            </div>

            <div className="px-4 py-3 bg-white border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewOrder(null)}
                className="px-3.5 py-2 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer"
              >
                Close Preview (ESC)
              </button>
              <button
                onClick={() => printThermalReceipt('thermal-modal-receipt', billPaperSize)}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print {billPaperSize} Thermal Bill (Enter)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAFF PIN LOGIN & RBAC ROLE SWITCHER MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-stone-200 rounded-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Staff PIN Login & RBAC Role Switcher
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Role-Based Access Control (Admin vs. Staff/Cashier)
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinError('');
                }}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="pin-modal-form" onSubmit={handlePinSubmit} className="space-y-3">
              <label className="block text-xs font-medium text-stone-700">
                Enter Staff PIN Code
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  placeholder="Enter 4-digit PIN"
                  className="flex-1 px-3 py-2 text-sm font-mono tracking-widest bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
                >
                  Unlock
                </button>
              </div>
              {pinError && <p className="text-xs text-red-600 font-medium">{pinError}</p>}
            </form>

            <div className="space-y-2 pt-2 border-t border-stone-200">
              <div className="text-xs font-semibold text-stone-700">
                Switch User Profile:
              </div>
              <div className="space-y-2">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setPinInput('');
                        setPinError(`Enter 4-digit PIN code for ${u.name}`);
                        const inputEl = document.querySelector<HTMLInputElement>('#pin-modal-form input');
                        if (inputEl) inputEl.focus();
                      }}
                      className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-50/70 border-amber-600'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-stone-900">{u.name}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          Role: {u.role} · P&L Access: {u.permissions.pnl ? 'Yes' : 'Hidden'} · Admin: {u.permissions.admin ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-amber-700">
                        {isCurrent ? 'Active' : 'Enter PIN'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE DETAILS & LOGOUT MODAL */}
      {showUserProfileModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-sm">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">User Profile Details</h3>
                  <p className="text-[11px] text-stone-500">Active Terminal Session</p>
                </div>
              </div>
              <button
                onClick={() => setShowUserProfileModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 font-medium">Full Name</span>
                <span className="font-bold text-stone-900">{currentUser.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 font-medium">Access Level</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  currentUser.role === 'Admin' ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-700'
                }`}>
                  {currentUser.role}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-200/80 text-[11px] space-y-1">
                <div className="text-stone-500 font-semibold mb-1">Module Permissions:</div>
                <div className="grid grid-cols-2 gap-1 text-stone-700">
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Billing & POS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Kitchen Expenses</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {currentUser.role === 'Admin' && currentUser.permissions.pnl ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <X className="w-3 h-3 text-stone-400" />
                    )}
                    <span className={currentUser.role === 'Admin' && currentUser.permissions.pnl ? 'text-stone-900' : 'text-stone-400'}>
                      P&L Analytics
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {currentUser.role === 'Admin' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <X className="w-3 h-3 text-stone-400" />
                    )}
                    <span className={currentUser.role === 'Admin' ? 'text-stone-900' : 'text-stone-400'}>
                      Admin Settings
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowUserProfileModal(false);
                  setShowPinModal(true);
                }}
                className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
              >
                Switch Account
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs text-center flex items-center justify-center gap-1.5"
              >
                <span>Logout / Lock</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
