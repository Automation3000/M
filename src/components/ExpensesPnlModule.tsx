import React, { useMemo, useState } from 'react';
import {
  Banknote,
  Calendar,
  Check,
  Flame,
  LayoutGrid,
  List,
  Lock,
  Package,
  Plus,
  Receipt,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Users,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';
import {
  ExpenseCategory,
  ExpenseRecord,
  OrderRecord,
  RestaurantSettings,
  UserAccount,
} from '../data/mockDatabase';

interface ExpensesPnlModuleProps {
  orders: OrderRecord[];
  expenses: ExpenseRecord[];
  currentUser: UserAccount;
  settings: RestaurantSettings;
  onAddExpense: (exp: ExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
  onRequestAdminSwitch: () => void;
}

type DateFilter = 'today' | 'week' | 'month' | 'all';

const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'Raw Material', label: 'Raw Material', icon: <UtensilsCrossed className="w-3.5 h-3.5" />, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'Packaging', label: 'Packaging', icon: <Package className="w-3.5 h-3.5" />, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'Gas/Fuel', label: 'Gas/Fuel', icon: <Flame className="w-3.5 h-3.5" />, color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'Staff', label: 'Staff', icon: <Users className="w-3.5 h-3.5" />, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'Misc', label: 'Misc', icon: <Wrench className="w-3.5 h-3.5" />, color: 'bg-stone-200 text-stone-800 border-stone-300' },
];

// Quick items common in cloud kitchens to allow 1-click expense logging
const QUICK_KITCHEN_ITEMS = [
  { name: 'Fresh Mutton (Meat Market)', category: 'Raw Material' as ExpenseCategory, defaultAmt: 1400 },
  { name: 'Chicken Supply (Broiler)', category: 'Raw Material' as ExpenseCategory, defaultAmt: 850 },
  { name: 'Desi Ghee & Awadhi Masale', category: 'Raw Material' as ExpenseCategory, defaultAmt: 600 },
  { name: 'Onion, Ginger & Vegetables', category: 'Raw Material' as ExpenseCategory, defaultAmt: 350 },
  { name: '19KG Commercial LPG Cylinder', category: 'Gas/Fuel' as ExpenseCategory, defaultAmt: 1850 },
  { name: '80mm Thermal Rolls & Foil Boxes', category: 'Packaging' as ExpenseCategory, defaultAmt: 500 },
  { name: 'Daily Helper Evening Wage', category: 'Staff' as ExpenseCategory, defaultAmt: 400 },
  { name: 'Cleaning Detergents & Broom', category: 'Misc' as ExpenseCategory, defaultAmt: 180 },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export const ExpensesPnlModule: React.FC<ExpensesPnlModuleProps> = ({
  orders,
  expenses,
  currentUser,
  settings,
  onAddExpense,
  onDeleteExpense,
  onRequestAdminSwitch,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Raw Material');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI'>('Cash');
  const [notes, setNotes] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ExpenseCategory | 'All'>('All');
  const [deductCommissions, setDeductCommissions] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // P&L and Sales figures are strictly restricted to Admin role with PnL permission
  const canViewPnl = currentUser.role === 'Admin' && Boolean(currentUser.permissions.pnl);

  const isWithinRange = (isoDate: string, range: DateFilter): boolean => {
    if (range === 'all') return true;
    const target = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - target.getTime();
    const diffDays = diffMs / (1000 * 3600 * 24);
    if (range === 'today') {
      return (
        target.getDate() === now.getDate() &&
        target.getMonth() === now.getMonth() &&
        target.getFullYear() === now.getFullYear()
      );
    }
    if (range === 'week') return diffDays <= 7;
    if (range === 'month') return diffDays <= 30;
    return true;
  };

  const filteredOrders = useMemo(
    () => orders.filter((o) => isWithinRange(o.timestamp, dateFilter)),
    [orders, dateFilter]
  );

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        const matchesDate = isWithinRange(e.timestamp, dateFilter);
        const matchesCat =
          selectedCategoryFilter === 'All' || e.category === selectedCategoryFilter;
        const q = expenseSearch.toLowerCase().trim();
        const matchesSearch =
          !q ||
          e.itemName.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.loggedBy.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q));

        return matchesDate && matchesCat && matchesSearch;
      }),
    [expenses, dateFilter, selectedCategoryFilter, expenseSearch]
  );

  const metrics = useMemo(() => {
    let directSales = 0;
    let swiggySales = 0;
    let zomatoSales = 0;

    filteredOrders.forEach((o) => {
      if (o.orderType === 'Swiggy') swiggySales += o.grandTotal;
      else if (o.orderType === 'Zomato') zomatoSales += o.grandTotal;
      else directSales += o.grandTotal;
    });

    const swiggyFee = deductCommissions
      ? Math.round((swiggySales * settings.swiggyCommissionPercent) / 100)
      : 0;
    const zomatoFee = deductCommissions
      ? Math.round((zomatoSales * settings.zomatoCommissionPercent) / 100)
      : 0;

    const grossSales = directSales + swiggySales + zomatoSales;
    const netRevenue = grossSales - swiggyFee - zomatoFee;

    const totalExpenses = expenses
      .filter((e) => isWithinRange(e.timestamp, dateFilter))
      .reduce((sum, e) => sum + e.amount, 0);

    const netProfit = netRevenue - totalExpenses;
    const profitMargin = netRevenue > 0 ? ((netProfit / netRevenue) * 100).toFixed(1) : '0.0';

    const byCategory: Record<ExpenseCategory, number> = {
      'Raw Material': 0,
      Packaging: 0,
      'Gas/Fuel': 0,
      Staff: 0,
      Misc: 0,
    };

    expenses
      .filter((e) => isWithinRange(e.timestamp, dateFilter))
      .forEach((e) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      });

    return {
      directSales,
      swiggySales,
      zomatoSales,
      grossSales,
      swiggyFee,
      zomatoFee,
      netRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      byCategory,
    };
  }, [filteredOrders, expenses, dateFilter, deductCommissions, settings]);

  const handleCreateExpense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!itemName.trim() || isNaN(numAmt) || numAmt <= 0) return;

    const newExp: ExpenseRecord = {
      id: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      itemName: itemName.trim(),
      category,
      amount: Math.round(numAmt),
      paymentMode,
      notes: notes.trim() || 'Logged via Kitchen Desk',
      loggedBy: currentUser.name,
    };

    onAddExpense(newExp);
    setAddedToast(`Logged ₹${newExp.amount} for "${newExp.itemName}"`);
    setTimeout(() => setAddedToast(null), 3000);

    setItemName('');
    setAmount('');
    setNotes('');
  };

  const handleQuickPreset = (item: (typeof QUICK_KITCHEN_ITEMS)[0]) => {
    setItemName(item.name);
    setCategory(item.category);
    if (!amount) {
      setAmount(String(item.defaultAmt));
    }
  };

  const handleAddAmountDelta = (delta: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + delta));
  };

  const getCatStyle = (cat: ExpenseCategory) => {
    const found = EXPENSE_CATEGORIES.find((c) => c.id === cat);
    return found ? found.color : 'bg-stone-100 text-stone-800';
  };

  return (
    <div className="space-y-6">
      {/* Header and Period Filter */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 rounded-full">
                Google Sheet Tab 1
              </span>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Live Kitchen Sync
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-display">
              Kitchen Expense Manager & P&L Statement
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Easy 1-tap voucher logging for daily raw materials, gas, and helper wages.
            </p>
          </div>

          {/* Date Filter Segmented Buttons */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl self-start sm:self-auto">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All Time' },
              ] as { id: DateFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  dateFilter === tab.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {addedToast && (
        <div className="p-3 bg-emerald-900 text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-300" />
            <span>{addedToast}</span>
          </div>
          <button onClick={() => setAddedToast(null)} className="text-emerald-300 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* P&L ANALYTICS CARDS (Admin Only) */}
      {canViewPnl ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Profit & Loss Summary ({dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'Last 7 Days' : dateFilter === 'month' ? 'Last 30 Days' : 'All Records'})
            </h2>
            <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deductCommissions}
                onChange={(e) => setDeductCommissions(e.target.checked)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <span>Deduct Aggregator Commissions</span>
            </label>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 sm:p-4">
              <div className="text-[11px] font-medium text-stone-500">Gross Sales Revenue</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-stone-900 mt-1 tabular-nums">
                ₹{metrics.grossSales.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-stone-500 mt-1 font-mono">
                {filteredOrders.length} orders
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 sm:p-4">
              <div className="text-[11px] font-medium text-stone-500">Total Kitchen Expenses</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 mt-1 tabular-nums">
                ₹{metrics.totalExpenses.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-stone-500 mt-1 font-mono">
                {filteredExpenses.length} vouchers logged
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 sm:p-4">
              <div className="text-[11px] font-medium text-stone-500">Counter vs Portals</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-700 mt-1 tabular-nums">
                ₹{metrics.directSales.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-stone-500 mt-1 font-mono">
                Portals: ₹{metrics.swiggySales + metrics.zomatoSales}
              </div>
            </div>

            <div className="bg-stone-900 text-white rounded-xl p-3.5 sm:p-4">
              <div className="text-[11px] font-medium text-stone-400">Net Profit / Margin</div>
              <div
                className={`text-xl sm:text-2xl font-black font-mono mt-1 tabular-nums ${
                  metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {metrics.netProfit >= 0 ? '+' : '-'}₹{Math.abs(metrics.netProfit).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">
                Margin: {metrics.profitMargin}%
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-stone-900">
                Logged in as {currentUser.name} ({currentUser.role})
              </div>
              <div className="text-[11px] text-stone-500">
                Kitchen expense logging is active. P&L statement cards are reserved for Admin.
              </div>
            </div>
          </div>
          <button
            onClick={onRequestAdminSwitch}
            className="px-3 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Unlock Admin with PIN
          </button>
        </div>
      )}

      {/* MAIN TWO-COLUMN SPLIT: LEFT IS APP-STYLE EXPENSE LOGGER, RIGHT IS COMPACT RECORD CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SIMPLE & EASY EXPENSE LOGGER (APP-LIKE) */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-5 space-y-5 shadow-xs">
          <div className="border-b border-stone-100 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>Log Kitchen Expense</span>
              </h2>
              <span className="text-[11px] text-stone-500 font-mono">
                By: {currentUser.name.split('(')[0].trim()}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Tap an amount, pick an item, or enter details below.
            </p>
          </div>

          <form onSubmit={handleCreateExpense} className="space-y-4">
            {/* BIG TAP-FRIENDLY AMOUNT BOX */}
            <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-3.5 space-y-2">
              <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                Amount (₹) — Click & Enter
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-2xl font-black text-amber-900 font-mono select-none">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 text-2xl font-black font-mono text-stone-900 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAddAmountDelta(amt)}
                    className="px-2.5 py-1 text-xs font-mono font-bold bg-white hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    +₹{amt}
                  </button>
                ))}
                {amount && (
                  <button
                    type="button"
                    onClick={() => setAmount('')}
                    className="px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-red-600 ml-auto"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* QUICK COMMON ITEMS PILLS */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Quick 1-Tap Kitchen Items
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_KITCHEN_ITEMS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleQuickPreset(item)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer text-left ${
                      itemName === item.name
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ITEM NAME / DESCRIPTION INPUT */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Item / Description *
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. 5kg Mutton, LPG Gas, Foil Boxes..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            {/* CATEGORY SELECTOR PILLS */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">Category *</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                      category === cat.id
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="text-[10px] text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* PAYMENT MODE TOGGLE */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Cash', 'UPI'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      paymentMode === mode
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Paid in {mode}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* VENDOR OR SHIFT NOTES */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Vendor / Shift Note (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid to meat vendor, Saadatganj"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            {/* SAVE EXPENSE BUTTON (Large & easy to tap) */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save Kitchen Expense Entry</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: COMPACT CARD TYPE RECORD AREA */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
          {/* Top Bar: Search, Category Filter & View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Kitchen Expense Records ({filteredExpenses.length})
              </h2>
              <p className="text-[11px] text-stone-500">
                Compact Card View · Linked with Google Sheet Tab 1
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <div className="relative w-44 sm:w-48">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder="Search expense..."
                  className="w-full pl-7 pr-2.5 py-1 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              {/* View Switcher: Cards vs Table */}
              <div className="flex items-center gap-0.5 bg-stone-100 p-0.5 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  title="Card view"
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Table view"
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('All')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                selectedCategoryFilter === 'All'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All
            </button>
            {EXPENSE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(c.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedCategoryFilter === c.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {c.icon}
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          {/* COMPACT CARD VIEW (User requirement: "Record area ko Compact rakho achChe se Card Type me DikheGa to Better lgeGa") */}
          {filteredExpenses.length === 0 ? (
            <div className="py-12 text-center bg-stone-50 rounded-xl border border-dashed border-stone-300 space-y-1">
              <Receipt className="w-6 h-6 mx-auto text-stone-400" />
              <div className="text-xs font-semibold text-stone-700">No expense vouchers found</div>
              <p className="text-[11px] text-stone-500">
                Log a kitchen expense using the easy form on the left.
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-stone-50/70 hover:bg-white border border-stone-200 rounded-xl p-3.5 transition-all duration-150 flex flex-col justify-between gap-2.5 shadow-2xs hover:shadow-xs group"
                >
                  {/* Top Row: Amount & Mode + Delete */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-black font-mono text-stone-900 tabular-nums">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getCatStyle(exp.category)}`}>
                          {exp.category}
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-stone-200/80 text-stone-700">
                          {exp.paymentMode}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteExpense(exp.id)}
                      title="Delete expense voucher"
                      className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Middle: Item Name & Note */}
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-stone-900 leading-snug">
                      {exp.itemName}
                    </div>
                    {exp.notes && (
                      <div className="text-[11px] text-stone-500 italic truncate">
                        "{exp.notes}"
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Date/Time + Logged By */}
                  <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                    <span>
                      {new Date(exp.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}{' '}
                      ·{' '}
                      {new Date(exp.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="font-sans font-medium text-stone-600 truncate max-w-[120px]">
                      By {exp.loggedBy.split('(')[0].trim()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* COMPACT TABLE VIEW */
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Item & Note</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Mode</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-stone-50">
                      <td className="py-2 px-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                        {new Date(exp.timestamp).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-stone-900">{exp.itemName}</div>
                        {exp.notes && <div className="text-[10px] text-stone-500">{exp.notes}</div>}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${getCatStyle(exp.category)}`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono whitespace-nowrap">{exp.paymentMode}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-stone-900 tabular-nums whitespace-nowrap">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1 text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
