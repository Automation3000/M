import React, { useState } from 'react';
import { Check, MessageSquare, Percent, QrCode, Save, ShieldCheck } from 'lucide-react';
import { RestaurantSettings } from '../data/mockDatabase';
import { QrCodeMatrix } from './QrCodeMatrix';

interface SettingsModuleProps {
  settings: RestaurantSettings;
  onUpdateSettings: (next: RestaurantSettings) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [draft, setDraft] = useState<RestaurantSettings>(settings);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const cleanPhone = (draft.whatsappNumber || '919876543210').replace(/[^\d]/g, '');
  const encodedText = encodeURIComponent(draft.whatsappPrefillText || 'Hi Mumbai Zaika, I want to place a direct order!');
  const qrUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(draft);
    setSavedBanner('Settings saved & synced with Google Sheet Tab 5 (Settings)!');
    setTimeout(() => setSavedBanner(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded">
                Google Sheet Tab 5
              </span>
              <h1 className="text-lg font-bold text-stone-900 font-display">
                Kitchen & Thermal Receipt Settings
              </h1>
            </div>
            <p className="text-xs text-stone-500">
              Manage WhatsApp direct order bypass, commissions saver QR CTA, restaurant tax rate & parcel packaging fees.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto font-medium">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />Tab 5 Active
          </span>
        </div>
      </div>

      {savedBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* WhatsApp Smart Bypass CTA & QR Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-stone-900">
                  Smart Bypass WhatsApp QR Call-To-Action
                </h2>
                <p className="text-[11px] text-stone-500">
                  Printed directly at the bottom of the 80mm thermal receipt below the QR code
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Receipt Footer Call-to-Action Text
              </label>
              <textarea
                rows={2}
                value={draft.billFooterCTA}
                onChange={(e) => setDraft({ ...draft, billFooterCTA: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Motivates Swiggy & Zomato customers to bypass aggregator commissions and order directly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  WhatsApp Business Number (with 91)
                </label>
                <input
                  type="text"
                  value={draft.whatsappNumber}
                  onChange={(e) => setDraft({ ...draft, whatsappNumber: e.target.value })}
                  placeholder="919876543210"
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Direct Order Customer Discount (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={draft.directDiscountPercent}
                    onChange={(e) => setDraft({ ...draft, directDiscountPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-stone-50 pr-8"
                  />
                  <Percent className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-stone-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                WhatsApp Pre-filled Customer Message
              </label>
              <input
                type="text"
                value={draft.whatsappPrefillText}
                onChange={(e) => setDraft({ ...draft, whatsappPrefillText: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-stone-50"
              />
            </div>
          </div>

          {/* Live QR Preview Box */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg flex items-center gap-4">
            <div className="p-1 bg-white border border-stone-300 rounded shadow-2xs shrink-0">
              <QrCodeMatrix url={qrUrl} size={64} />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-stone-900">Live QR Destination Preview</div>
              <div className="font-mono text-[11px] text-stone-500 break-all">{qrUrl}</div>
              <div className="text-[11px] text-emerald-700 font-semibold">
                ✓ Customers scanning this open WhatsApp with "{draft.whatsappPrefillText}"
              </div>
            </div>
          </div>
        </div>

        {/* Taxes & Charges Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="border-b border-stone-100 pb-2">
            <h2 className="text-sm font-bold text-stone-900">Restaurant Taxes & Parcel Charges</h2>
            <p className="text-[11px] text-stone-500">Applied automatically when generating new customer bills</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Default Packaging Charge (₹)
              </label>
              <input
                type="number"
                min="0"
                value={draft.defaultPackagingCharge}
                onChange={(e) => setDraft({ ...draft, defaultPackagingCharge: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-stone-50"
              />
              <p className="text-[11px] text-stone-500 mt-1">Default parcel fee added to takeaway/delivery orders.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                GST Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="28"
                value={draft.gstRatePercent}
                onChange={(e) => setDraft({ ...draft, gstRatePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-stone-50"
              />
              <p className="text-[11px] text-stone-500 mt-1">Standard restaurant GST (default 5%).</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings to Google Sheet Tab 5</span>
          </button>
        </div>
      </form>
    </div>
  );
};
