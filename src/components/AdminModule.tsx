import React, { useState } from 'react';
import { Check, Plus, RotateCcw, Save, Trash2, UserPlus } from 'lucide-react';
import {
  MenuCategory,
  MenuItem,
  RestaurantSettings,
  UserAccount,
  UserPermissions,
} from '../data/mockDatabase';
import { QrCodeMatrix } from './QrCodeMatrix';

interface AdminModuleProps {
  menu: MenuItem[];
  users: UserAccount[];
  settings: RestaurantSettings;
  onUpdateMenu: (next: MenuItem[]) => void;
  onUpdateUsers: (next: UserAccount[]) => void;
  onUpdateSettings: (next: RestaurantSettings) => void;
  onResetDemoData: () => void;
}

const MENU_CATEGORIES: MenuCategory[] = [
  'Kebabs',
  'Stews',
  'Rice Bowls',
  'Combos',
  'Burgers',
  'Pakoras',
];

export const AdminModule: React.FC<AdminModuleProps> = ({
  menu,
  users,
  settings,
  onUpdateMenu,
  onUpdateUsers,
  onUpdateSettings,
  onResetDemoData,
}) => {
  const [subTab, setSubTab] = useState<'receipt' | 'menu' | 'users'>('receipt');
  const [settingsDraft, setSettingsDraft] = useState<RestaurantSettings>(settings);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // New Menu Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<MenuCategory>('Kebabs');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemVeg, setNewItemVeg] = useState(false);
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<MenuCategory | 'All'>('All');

  // New User State
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('Staff/Cashier');
  const [customRoleText, setCustomRoleText] = useState('');
  const [newUserPin, setNewUserPin] = useState('');

  const showSavedToast = (msg: string) => {
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(null), 2800);
  };

  const handleSaveReceiptSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settingsDraft);
    showSavedToast('Receipt, FSSAI & WhatsApp QR settings updated and synced.');
  };

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newItemPrice);
    if (!newItemName.trim() || isNaN(priceNum) || priceNum <= 0) return;

    const newItem: MenuItem = {
      id: `M-${Date.now().toString().slice(-4)}`,
      name: newItemName.trim(),
      category: newItemCategory,
      price: Math.round(priceNum),
      veg: newItemVeg,
      available: true,
      prepTimeMins: 12,
      sku: `${newItemCategory.slice(0, 3).toUpperCase()}-${menu.length + 1}`,
    };

    onUpdateMenu([newItem, ...menu]);
    setNewItemName('');
    setNewItemPrice('');
    showSavedToast(`Added "${newItem.name}" to ${newItem.category}.`);
  };

  const handleUpdateMenuPrice = (id: string, price: number) => {
    if (isNaN(price) || price < 0) return;
    onUpdateMenu(menu.map((m) => (m.id === id ? { ...m, price: Math.round(price) } : m)));
  };

  const handleToggleMenuAvailability = (id: string) => {
    onUpdateMenu(menu.map((m) => (m.id === id ? { ...m, available: !m.available } : m)));
  };

  const handleDeleteMenuItem = (id: string) => {
    onUpdateMenu(menu.filter((m) => m.id !== id));
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPin.trim()) return;

    const assignedRole = newUserRole === 'Custom' ? (customRoleText.trim() || 'Staff') : newUserRole;
    const isDefaultAdmin = assignedRole.toLowerCase().includes('admin') || assignedRole.toLowerCase().includes('owner');

    const newUser: UserAccount = {
      id: `USR-0${users.length + 1}`,
      name: newUserName.trim(),
      role: assignedRole,
      pin: newUserPin.trim(),
      active: true,
      permissions: {
        expenses: true,
        pos: true,
        history: true,
        cctv: true,
        admin: isDefaultAdmin,
        settings: isDefaultAdmin,
        deploy: isDefaultAdmin,
        pnl: isDefaultAdmin,
      },
    };

    onUpdateUsers([...users, newUser]);
    setNewUserName('');
    setNewUserPin('');
    setCustomRoleText('');
    setNewUserRole('Staff/Cashier');
    showSavedToast(`Created user account for ${newUser.name} (${assignedRole}).`);
  };

  const handleTogglePermission = (userId: string, key: keyof UserPermissions) => {
    const next = users.map((u) =>
      u.id === userId
        ? {
            ...u,
            permissions: {
              ...u.permissions,
              [key]: !u.permissions[key],
            },
          }
        : u
    );
    onUpdateUsers(next);
  };

  const handleDeleteUser = (userId: string) => {
    if (users.length <= 1) return;
    onUpdateUsers(users.filter((u) => u.id !== userId));
  };

  const cleanWaPhone = settingsDraft.whatsappNumber.replace(/[^\d]/g, '');
  const liveWaUrl = `https://wa.me/${cleanWaPhone}?text=${encodeURIComponent(
    settingsDraft.whatsappPrefillText
  )}`;

  const filteredMenu =
    menuCategoryFilter === 'All'
      ? menu
      : menu.filter((m) => m.category === menuCategoryFilter);

  return (
    <div className="space-y-8">
      {/* Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Admin Control Panel & RBAC Settings
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Configure 80mm thermal bill branding, dynamic WhatsApp QR code, menu items, and staff role permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-lg">
            {(
              [
                { id: 'receipt', label: 'Receipt & WhatsApp QR' },
                { id: 'menu', label: `Menu Items (${menu.length})` },
                { id: 'users', label: `Users & RBAC (${users.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  subTab === tab.id
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              onResetDemoData();
              showSavedToast('Demo database reset to factory Mumbai Zaika defaults.');
            }}
            title="Reset Demo Data"
            className="px-3 py-2 text-xs font-medium bg-white border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-100 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="bg-emerald-900 text-white px-4 py-3 rounded-lg text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      {/* TAB 1: RECEIPT & WHATSAPP QR CUSTOMIZER */}
      {subTab === 'receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSaveReceiptSettings}
            className="lg:col-span-8 bg-white border border-stone-200 rounded-xl p-6 space-y-5"
          >
            <div className="border-b border-stone-200 pb-3">
              <h2 className="text-base font-semibold text-stone-900">
                80mm Thermal Bill Header, FSSAI & WhatsApp Bypass Configuration
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Changes immediately update the 80mm thermal receipt header and regenerate the bottom WhatsApp QR code.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-stone-700">Restaurant Name</label>
                <input
                  type="text"
                  value={settingsDraft.restaurantName}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, restaurantName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-stone-700">
                  FSSAI Registration Number
                </label>
                <input
                  type="text"
                  value={settingsDraft.fssaiNo}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, fssaiNo: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-stone-300 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-medium text-stone-700">
                  Shop Address (Printed on Bill Header)
                </label>
                <input
                  type="text"
                  value={settingsDraft.address}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-stone-700">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={settingsDraft.phone}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-stone-300 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-stone-700">
                  WhatsApp Business Number (with Country Code)
                </label>
                <input
                  type="text"
                  value={settingsDraft.whatsappNumber}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, whatsappNumber: e.target.value })
                  }
                  placeholder="919876543210"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-stone-300 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-medium text-stone-700">
                  WhatsApp Pre-filled Order Text (Encoded in QR)
                </label>
                <input
                  type="text"
                  value={settingsDraft.whatsappPrefillText}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, whatsappPrefillText: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-medium text-stone-700">
                  Smart Bypass Call-To-Action (Printed in Bold Below QR Code)
                </label>
                <textarea
                  rows={2}
                  value={settingsDraft.billFooterCTA}
                  onChange={(e) =>
                    setSettingsDraft({ ...settingsDraft, billFooterCTA: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-stone-700">
                  Default GST Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="28"
                  step="0.5"
                  value={settingsDraft.gstRatePercent}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      gstRatePercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-stone-300 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-stone-700">
                  Default Packaging Charge (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settingsDraft.defaultPackagingCharge}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      defaultPackagingCharge: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-stone-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Receipt & WhatsApp QR Settings</span>
              </button>
            </div>
          </form>

          {/* Live Dynamic WhatsApp QR Preview Card */}
          <div className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-6 space-y-4">
            <div className="border-b border-stone-200 pb-3">
              <h3 className="text-sm font-semibold text-stone-900">
                Live Thermal Footer QR Preview
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Scan with your phone camera to test the WhatsApp deep link.
              </p>
            </div>

            <div className="bg-stone-50 border border-dashed border-stone-300 rounded-lg p-4 text-center font-mono">
              <div className="text-xs font-bold uppercase text-stone-900">
                {settingsDraft.restaurantName}
              </div>
              <div className="text-[11px] text-stone-600 mt-0.5">
                FSSAI: {settingsDraft.fssaiNo}
              </div>
              <div className="my-3 flex justify-center">
                <QrCodeMatrix url={liveWaUrl} size={136} />
              </div>
              <div className="text-[11px] font-bold text-stone-900 border border-stone-900 p-2 bg-white leading-snug">
                {settingsDraft.billFooterCTA}
              </div>
              <div className="text-[10px] text-stone-500 mt-2 break-all">{liveWaUrl}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MENU & PRICING CUSTOMIZER */}
      {subTab === 'menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Menu Item Form */}
          <form
            onSubmit={handleAddMenuItem}
            className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-5 space-y-4"
          >
            <div className="border-b border-stone-200 pb-3">
              <h2 className="text-base font-semibold text-stone-900">Add New Dish to Menu</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Syncs with POS Billing grid & Google Sheets `Menu` tab.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-stone-700">Dish Name *</label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g., Special Mutton Pasanda Roll"
                className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-stone-700">Category *</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as MenuCategory)}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg"
                >
                  {MENU_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-stone-700">Price (₹) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="220"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-stone-300 rounded-lg"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={newItemVeg}
                onChange={(e) => setNewItemVeg(e.target.checked)}
                className="rounded border-stone-300 text-emerald-600"
              />
              <span>Vegetarian Item (Mark as Veg)</span>
            </label>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dish to POS Menu</span>
            </button>
          </form>

          {/* Menu Items Table */}
          <div className="lg:col-span-8 bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-stone-900">
                Active Menu Catalog ({filteredMenu.length} dishes)
              </h2>
              <div className="flex flex-wrap gap-1">
                {(['All', ...MENU_CATEGORIES] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMenuCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      menuCategoryFilter === cat
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600">
                    <th className="py-2.5 px-4">SKU & Dish Name</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Price (₹)</th>
                    <th className="py-2.5 px-4">Stock Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-xs">
                  {filteredMenu.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/80">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-stone-900">{item.name}</div>
                        <div className="text-[11px] font-mono text-stone-500">
                          {item.sku} · {item.veg ? 'Veg' : 'Non-Veg'}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-stone-600 whitespace-nowrap">
                        {item.category}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="1"
                          value={item.price}
                          onChange={(e) =>
                            handleUpdateMenuPrice(item.id, parseFloat(e.target.value))
                          }
                          className="w-24 px-2 py-1 text-xs font-mono bg-white border border-stone-300 rounded-md"
                        />
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleMenuAvailability(item.id)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border ${
                            item.available
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border-stone-300'
                          }`}
                        >
                          {item.available ? 'In Stock' : 'Sold Out'}
                        </button>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-md hover:bg-red-50"
                          title="Remove Dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB 3: USER MANAGEMENT & RBAC PERMISSIONS */}
      {subTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Staff User Form */}
          <form
            onSubmit={handleAddUser}
            className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-5 space-y-4"
          >
            <div className="border-b border-stone-200 pb-3">
              <h2 className="text-base font-semibold text-stone-900">Create Staff / Cashier Account</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Assign a 4-digit PIN and configure granular module access.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-stone-700">Full Name *</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g., Zeeshan Ali (Evening Cashier)"
                className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg"
              />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">Role Designation</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="Staff/Cashier">Staff/Cashier</option>
                    <option value="Kitchen Manager">Kitchen Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="Custom">+ Custom Role (Khud Se Likhien)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">Login PIN *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value)}
                    placeholder="4455"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* Custom Role Text Input when 'Custom' is chosen */}
              {newUserRole === 'Custom' && (
                <div className="space-y-1.5 bg-amber-50/70 p-3 rounded-lg border border-amber-200">
                  <label className="block text-xs font-semibold text-amber-950">
                    Apna Custom Role Likhien *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={customRoleText}
                    onChange={(e) => setCustomRoleText(e.target.value)}
                    placeholder="e.g. Supervisor / Floor Manager / Delivery Lead / Head Chef"
                    className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-stone-500">
                    Yeh role staff profile aur receipts me dikhega.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create User Account</span>
            </button>
          </form>

          {/* RBAC Matrix Table */}
          <div className="lg:col-span-8 bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-200">
              <h2 className="text-base font-semibold text-stone-900">
                Role-Based Access Control (RBAC) Matrix
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Toggle checkboxes to grant or revoke module access per staff member in real time. Permitted modules immediately appear in the user's top/bottom Menu Bar.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600">
                    <th className="py-2.5 px-3">Staff & Role</th>
                    <th className="py-2.5 px-2">PIN</th>
                    <th className="py-2.5 px-2 text-center" title="Expenses Manager">Expenses</th>
                    <th className="py-2.5 px-2 text-center" title="POS Billing Desk">Billing</th>
                    <th className="py-2.5 px-2 text-center" title="Order History & Day-End">History</th>
                    <th className="py-2.5 px-2 text-center" title="Live Camera Hub">Camera</th>
                    <th className="py-2.5 px-2 text-center" title="Admin & Profile">Admin</th>
                    <th className="py-2.5 px-2 text-center" title="Settings">Settings</th>
                    <th className="py-2.5 px-2 text-center" title="GAS & GitHub Code Hub">Code Hub</th>
                    <th className="py-2.5 px-2 text-center" title="View P&L Profit Figures">P&L Profit</th>
                    <th className="py-2.5 px-3 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-xs">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-50/80">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-stone-900">{u.name}</div>
                        <div className="text-[11px] text-stone-500">
                          {u.role} · {u.id}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono font-semibold text-stone-800">{u.pin}</td>
                      {(
                        [
                          'expenses',
                          'pos',
                          'history',
                          'cctv',
                          'admin',
                          'settings',
                          'deploy',
                          'pnl',
                        ] as const
                      ).map((permKey) => (
                        <td key={permKey} className="py-3 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(u.permissions[permKey])}
                            onChange={() => handleTogglePermission(u.id, permKey)}
                            className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>
                      ))}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={users.length <= 1}
                          className="p-1.5 text-stone-400 hover:text-red-600 disabled:opacity-30 rounded-md"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
