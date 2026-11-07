import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  Filter,
  Package,
  Printer,
  Receipt,
  Search,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  User,
  Wallet,
} from 'lucide-react';
import {
  ExpenseRecord,
  OrderRecord,
  OrderType,
  RestaurantSettings,
} from '../data/mockDatabase';

interface OrderHistoryModuleProps {
  orders: OrderRecord[];
  expenses: ExpenseRecord[];
  settings: RestaurantSettings;
  onReprintReceipt: (order: OrderRecord) => void;
}

type PeriodFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

export const OrderHistoryModule: React.FC<OrderHistoryModuleProps> = ({
  orders,
  expenses,
  settings,
  onReprintReceipt,
}) => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('today');
  const [channelFilter, setChannelFilter] = useState<OrderType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [deductCommissions, setDeductCommissions] = useState(true);
  const [customDate, setCustomDate] = useState<string>('');

  // Date check helper
  const isDateMatch = (isoTimestamp: string, period: PeriodFilter, specificDate?: string): boolean => {
    const itemDate = new Date(isoTimestamp);
    const now = new Date();

    if (specificDate) {
      const target = new Date(specificDate);
      return (
        itemDate.getFullYear() === target.getFullYear() &&
        itemDate.getMonth() === target.getMonth() &&
        itemDate.getDate() === target.getDate()
      );
    }

    if (period === 'all') return true;

    if (period === 'today') {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getDate() === now.getDate()
      );
    }

    if (period === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      return (
        itemDate.getFullYear() === yesterday.getFullYear() &&
        itemDate.getMonth() === yesterday.getMonth() &&
        itemDate.getDate() === yesterday.getDate()
      );
    }

    const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
    if (period === 'week') return diffDays <= 7;
    if (period === 'month') return diffDays <= 30;

    return true;
  };

  // Filtered orders based on selected period and channel
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchesPeriod = isDateMatch(ord.timestamp, periodFilter, customDate || undefined);
      const matchesChannel = channelFilter === 'All' || ord.orderType === channelFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ord.invoiceNo.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.customerPhone.toLowerCase().includes(q) ||
        (ord.externalOrderId && ord.externalOrderId.toLowerCase().includes(q)) ||
        ord.items.some((i) => i.name.toLowerCase().includes(q));

      return matchesPeriod && matchesChannel && matchesSearch;
    });
  }, [orders, periodFilter, customDate, channelFilter, searchQuery]);

  // Orders matching only the date period (for overall day-end metrics calculation)
  const periodOrders = useMemo(() => {
    return orders.filter((ord) => isDateMatch(ord.timestamp, periodFilter, customDate || undefined));
  }, [orders, periodFilter, customDate]);

  // Expenses matching the same period
  const periodExpenses = useMemo(() => {
    return expenses.filter((exp) => isDateMatch(exp.timestamp, periodFilter, customDate || undefined));
  }, [expenses, periodFilter, customDate]);

  // Day-End Financial Reconciliation Calculations
  const dayEndStats = useMemo(() => {
    let grossSales = 0;
    let cashSales = 0;
    let upiSales = 0;
    let portalSales = 0;
    let directSales = 0;
    let swiggySales = 0;
    let zomatoSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalPackaging = 0;

    periodOrders.forEach((o) => {
      grossSales += o.grandTotal;
      totalDiscount += o.discountAmount || 0;
      totalTax += o.taxAmount || 0;
      totalPackaging += o.packagingCharge || 0;

      if (o.paymentMode === 'Cash') cashSales += o.grandTotal;
      else if (o.paymentMode === 'UPI') upiSales += o.grandTotal;
      else portalSales += o.grandTotal;

      if (o.orderType === 'Swiggy') swiggySales += o.grandTotal;
      else if (o.orderType === 'Zomato') zomatoSales += o.grandTotal;
      else directSales += o.grandTotal;
    });

    const swiggyComm = deductCommissions
      ? Math.round((swiggySales * (settings.swiggyCommissionPercent || 24)) / 100)
      : 0;
    const zomatoComm = deductCommissions
      ? Math.round((zomatoSales * (settings.zomatoCommissionPercent || 25)) / 100)
      : 0;
    const totalCommissions = swiggyComm + zomatoComm;

    const netRealizedRevenue = grossSales - totalCommissions;

    const totalKitchenExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    const netProfit = netRealizedRevenue - totalKitchenExpenses;
    const profitMargin =
      netRealizedRevenue > 0 ? ((netProfit / netRealizedRevenue) * 100).toFixed(1) : '0.0';

    return {
      orderCount: periodOrders.length,
      grossSales,
      cashSales,
      upiSales,
      portalSales,
      directSales,
      swiggySales,
      zomatoSales,
      swiggyComm,
      zomatoComm,
      totalCommissions,
      netRealizedRevenue,
      totalDiscount,
      totalTax,
      totalPackaging,
      totalKitchenExpenses,
      expenseCount: periodExpenses.length,
      netProfit,
      profitMargin,
    };
  }, [periodOrders, periodExpenses, deductCommissions, settings]);

  const periodLabel = useMemo(() => {
    if (customDate) return `Date: ${customDate}`;
    switch (periodFilter) {
      case 'today':
        return 'Today (Day-End)';
      case 'yesterday':
        return 'Yesterday';
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      case 'all':
        return 'All Time';
    }
  }, [periodFilter, customDate]);

  return (
    <div className="space-y-6">
      {/* Header & Sub-toolbar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 rounded-full">
                Google Sheet Tab 2 & 7: Order History & Day-End
              </span>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Live Audit
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-display">
              Order History & Day-End Profit Settlement
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Complete POS invoice audit trail linked with kitchen expenses to calculate exact Day-End Net Profit.
            </p>
          </div>

          {/* Period Dropdown & Date Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
              <Calendar className="w-3.5 h-3.5 text-stone-500 ml-1.5" />
              <select
                value={customDate ? 'custom' : periodFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    // keep custom
                  } else {
                    setCustomDate('');
                    setPeriodFilter(val as PeriodFilter);
                  }
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer shadow-2xs"
              >
                <option value="today">Today (Aaj)</option>
                <option value="yesterday">Yesterday (Kal)</option>
                <option value="week">This Week (7 Days)</option>
                <option value="month">This Month (30 Days)</option>
                <option value="all">All Time (Sabhi Orders)</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-xl px-2 py-1 shadow-2xs">
              <span className="text-[11px] text-stone-500 font-medium">Date:</span>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                }}
                title="Select specific date"
                className="text-xs bg-transparent text-stone-800 font-mono focus:outline-none"
              />
              {customDate && (
                <button
                  type="button"
                  onClick={() => setCustomDate('')}
                  className="text-stone-400 hover:text-stone-700 text-xs px-1"
                  title="Clear custom date"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DAY-END PROFIT & SALES RECONCILIATION SUMMARY BANNER */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-700/80 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                Day-End Net Profit Audit
              </div>
              <div className="text-base font-bold text-white font-display">
                Reconciliation for {periodLabel}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer select-none bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
            <input
              type="checkbox"
              checked={deductCommissions}
              onChange={(e) => setDeductCommissions(e.target.checked)}
              className="rounded border-stone-600 text-amber-500 focus:ring-amber-500"
            />
            <span>
              Deduct Portals Fee (Swiggy {settings.swiggyCommissionPercent}% · Zomato {settings.zomatoCommissionPercent}%)
            </span>
          </label>
        </div>

        {/* 4 Core Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Gross Sales */}
          <div className="bg-stone-800/80 border border-stone-700 rounded-xl p-3.5 sm:p-4">
            <div className="text-[11px] font-medium text-stone-400">Gross Orders Billed</div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1 tabular-nums">
              ₹{dayEndStats.grossSales.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-stone-400 mt-1.5 flex items-center justify-between">
              <span>{dayEndStats.orderCount} Orders</span>
              <span className="text-amber-400 font-semibold font-mono">
                Cash ₹{dayEndStats.cashSales} · UPI ₹{dayEndStats.upiSales}
              </span>
            </div>
          </div>

          {/* Card 2: Kitchen Expenses */}
          <div className="bg-stone-800/80 border border-stone-700 rounded-xl p-3.5 sm:p-4">
            <div className="text-[11px] font-medium text-stone-400">Kitchen Expenses (Period)</div>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-400 mt-1 tabular-nums">
              -₹{dayEndStats.totalKitchenExpenses.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-stone-400 mt-1.5">
              {dayEndStats.expenseCount} logged vouchers in ledger
            </div>
          </div>

          {/* Card 3: Platform Fees & Deductions */}
          <div className="bg-stone-800/80 border border-stone-700 rounded-xl p-3.5 sm:p-4">
            <div className="text-[11px] font-medium text-stone-400">Platform Commissions</div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-1 tabular-nums">
              -₹{dayEndStats.totalCommissions.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-stone-400 mt-1.5 font-mono">
              Swiggy: ₹{dayEndStats.swiggyComm} · Zom: ₹{dayEndStats.zomatoComm}
            </div>
          </div>

          {/* Card 4: Net Day Profit */}
          <div className="bg-emerald-950/70 border border-emerald-600/40 rounded-xl p-3.5 sm:p-4">
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Net Profit (Day-End)
            </div>
            <div
              className={`text-xl sm:text-2xl font-black font-mono mt-1 tabular-nums ${
                dayEndStats.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'
              }`}
            >
              {dayEndStats.netProfit >= 0 ? '+' : '-'}₹{Math.abs(dayEndStats.netProfit).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-300/90 mt-1.5 font-medium flex items-center justify-between">
              <span>Margin: {dayEndStats.profitMargin}%</span>
              <span className="font-semibold">{dayEndStats.netProfit >= 0 ? '✓ Profitable' : '⚠ Deficit'}</span>
            </div>
          </div>
        </div>

        {/* Revenue Channel Breakdown Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-4 border-t border-stone-800 text-xs">
          <div className="bg-stone-850 p-2.5 rounded-lg border border-stone-750">
            <div className="text-stone-400 text-[10px]">Takeaway / Counter</div>
            <div className="font-mono font-bold text-white mt-0.5">₹{dayEndStats.directSales}</div>
            <div className="text-[10px] text-emerald-400">0% Commission</div>
          </div>
          <div className="bg-stone-850 p-2.5 rounded-lg border border-stone-750">
            <div className="text-stone-400 text-[10px]">Swiggy Orders</div>
            <div className="font-mono font-bold text-orange-400 mt-0.5">₹{dayEndStats.swiggySales}</div>
            <div className="text-[10px] text-stone-400">Gross Sales</div>
          </div>
          <div className="bg-stone-850 p-2.5 rounded-lg border border-stone-750">
            <div className="text-stone-400 text-[10px]">Zomato Orders</div>
            <div className="font-mono font-bold text-rose-400 mt-0.5">₹{dayEndStats.zomatoSales}</div>
            <div className="text-[10px] text-stone-400">Gross Sales</div>
          </div>
          <div className="bg-stone-850 p-2.5 rounded-lg border border-stone-750">
            <div className="text-stone-400 text-[10px]">Net Realized Revenue</div>
            <div className="font-mono font-bold text-amber-300 mt-0.5">₹{dayEndStats.netRealizedRevenue}</div>
            <div className="text-[10px] text-stone-400">Before kitchen expenses</div>
          </div>
        </div>
      </div>

      {/* ORDERS HISTORY LIST & SEARCH SECTION */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        {/* Controls: Search, Channel Filters, View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Pickup / Takeaway', 'Direct Delivery', 'Swiggy', 'Zomato'] as const).map(
              (ch) => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    channelFilter === ch
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {ch}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Invoice #, Phone, Name..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'cards' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
          <span>
            Showing <strong>{filteredOrders.length}</strong> orders for {periodLabel}
          </span>
          <span className="font-mono">
            Total Billed: ₹{filteredOrders.reduce((s, o) => s + o.grandTotal, 0).toLocaleString('en-IN')}
          </span>
        </div>

        {/* EMPTY STATE */}
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center bg-stone-50 rounded-xl border border-dashed border-stone-300 space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-stone-400" />
            <div className="text-sm font-semibold text-stone-800">No Orders Found</div>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No bills found for the selected period ({periodLabel}). Switch date filter or generate a new order in Billing Desk.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* CARD TYPE VIEW (Compact, modern, mobile-friendly) */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredOrders.map((ord) => (
              <div
                key={ord.invoiceNo}
                className="bg-stone-50/70 hover:bg-stone-100/90 border border-stone-200 rounded-xl p-4 transition-all duration-150 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs"
              >
                {/* Card Top Row: Invoice, Time, Channel Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sm text-stone-900">
                          {ord.invoiceNo}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            ord.orderType === 'Swiggy'
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : ord.orderType === 'Zomato'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : ord.orderType === 'Direct Delivery'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {ord.orderType}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                        {new Date(ord.timestamp).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}{' '}
                        ·{' '}
                        {new Date(ord.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold font-mono text-stone-900 tabular-nums">
                        ₹{ord.grandTotal.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] font-mono text-stone-600 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                        {ord.paymentMode}
                      </span>
                    </div>
                  </div>

                  {/* Customer / Reference line */}
                  <div className="mt-2.5 pt-2 border-t border-stone-200/80 text-xs flex items-center justify-between text-stone-700">
                    <div className="flex items-center gap-1 font-medium truncate max-w-[180px]">
                      <User className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{ord.customerName}</span>
                    </div>
                    {ord.customerPhone && (
                      <span className="font-mono text-[11px] text-stone-500 shrink-0">
                        {ord.customerPhone}
                      </span>
                    )}
                  </div>

                  {ord.externalOrderId && (
                    <div className="text-[10px] font-mono text-stone-500 mt-1">
                      Portal Ref: {ord.externalOrderId}
                    </div>
                  )}

                  {/* Items Ordered List */}
                  <div className="mt-2 text-xs text-stone-600 bg-white p-2 rounded-lg border border-stone-200/70 space-y-1">
                    {ord.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <span className="truncate pr-2 font-medium text-stone-800">
                          {i.qty}x {i.name}
                        </span>
                        <span className="font-mono text-stone-600 shrink-0">
                          ₹{i.price * i.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Bottom Row: Cashier info & Reprint Button */}
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px]">
                  <span className="text-stone-500 truncate max-w-[140px]">
                    By: {ord.cashierName.split('(')[0].trim()}
                  </span>

                  <button
                    type="button"
                    onClick={() => onReprintReceipt(ord)}
                    className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-stone-900 hover:text-white border border-stone-300 text-stone-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3 h-3" />
                    <span>80mm Bill</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600">
                  <th className="py-2.5 px-4">Invoice & Time</th>
                  <th className="py-2.5 px-4">Channel & Mode</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Dishes Ordered</th>
                  <th className="py-2.5 px-4 text-right">Tax & Pack</th>
                  <th className="py-2.5 px-4 text-right">Grand Total</th>
                  <th className="py-2.5 px-4 text-right">Reprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs">
                {filteredOrders.map((ord) => (
                  <tr key={ord.invoiceNo} className="hover:bg-stone-50/80 transition-colors">
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
                      <div className="text-[11px] font-mono text-stone-500">
                        {ord.paymentMode} {ord.externalOrderId ? `· ${ord.externalOrderId}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-stone-900">{ord.customerName}</div>
                      <div className="text-[11px] font-mono text-stone-500">{ord.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4 text-stone-600 max-w-xs truncate">
                      {ord.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-stone-500 whitespace-nowrap">
                      Tax: ₹{ord.taxAmount} · Pkg: ₹{ord.packagingCharge}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900 tabular-nums whitespace-nowrap">
                      ₹{ord.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onReprintReceipt(ord)}
                        className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print</span>
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
  );
};
