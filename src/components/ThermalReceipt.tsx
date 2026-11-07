import React from 'react';
import { OrderRecord, RestaurantSettings } from '../data/mockDatabase';
import { QrCodeMatrix } from './QrCodeMatrix';

interface ThermalReceiptProps {
  order: OrderRecord;
  settings: RestaurantSettings;
  id?: string;
  billSize?: '58mm' | '80mm';
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ order, settings, id, billSize = '58mm' }) => {
  const cleanPhone = settings.whatsappNumber.replace(/[^\d]/g, '');
  const encodedText = encodeURIComponent(settings.whatsappPrefillText);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  const formattedDate = new Date(order.timestamp).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = new Date(order.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const totalQty = order.items.reduce((acc, item) => acc + item.qty, 0);
  const is2Inch = billSize === '58mm';

  return (
    <div
      id={id}
      className={`bg-white text-black font-mono mx-auto select-text ${
        is2Inch ? 'text-[9px] leading-[1.18]' : 'text-[11px] leading-[1.35]'
      }`}
      style={{
        width: is2Inch ? '48mm' : '72mm',
        maxWidth: is2Inch ? '48mm' : '72mm',
        padding: is2Inch ? '1mm 0' : '3mm 2mm',
      }}
    >
      {/* Header */}
      <div className="text-center border-b border-dashed border-black pb-2 mb-2">
        <div className="text-[15px] font-bold tracking-tight uppercase">{settings.restaurantName}</div>
        <div className="text-[10px] mt-0.5">{settings.address}</div>
        <div className="text-[10px] mt-0.5">Ph: {settings.phone}</div>
        <div className="text-[10px] font-semibold mt-0.5">FSSAI Reg No: {settings.fssaiNo}</div>
        {settings.billHeaderNote && (
          <div className="text-[9.5px] mt-1 pt-1 border-t border-dotted border-black">
            {settings.billHeaderNote}
          </div>
        )}
      </div>

      {/* Order Mode & Invoice Meta */}
      <div className="border-b border-dashed border-black pb-1.5 mb-1.5 text-[10.5px]">
        <div className="flex justify-between font-bold text-[12px] py-0.5 border border-black px-1.5 mb-1 uppercase">
          <span>MODE: {order.orderType}</span>
          <span>{order.paymentMode}</span>
        </div>
        <div className="flex justify-between">
          <span>Inv No: <strong>{order.invoiceNo}</strong></span>
          <span>{formattedDate}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier: {order.cashierName.split(' ')[0]}</span>
          <span>{formattedTime}</span>
        </div>
        {order.externalOrderId && (
          <div className="flex justify-between font-semibold mt-0.5">
            <span>Portal Ref:</span>
            <span>{order.externalOrderId}</span>
          </div>
        )}
        {(order.customerName || order.customerPhone) && (
          <div className="mt-0.5 pt-0.5 border-t border-dotted border-black">
            <div>Cust: {order.customerName || 'Walk-in'} {order.customerPhone ? `(${order.customerPhone})` : ''}</div>
            {order.customerAddress && <div className="text-[9.5px]">Addr: {order.customerAddress}</div>}
          </div>
        )}
      </div>

      {/* Itemized Table */}
      <div className="border-b border-dashed border-black pb-1 mb-1">
        <div className={`grid grid-cols-12 font-bold border-b border-black pb-0.5 mb-1 ${is2Inch ? 'text-[8.5px]' : 'text-[10px]'}`}>
          <div className="col-span-6">ITEM</div>
          <div className="col-span-2 text-center">QTY</div>
          <div className="col-span-2 text-right">RATE</div>
          <div className="col-span-2 text-right">AMT</div>
        </div>
        <div className={is2Inch ? 'space-y-0.5' : 'space-y-1'}>
          {order.items.map((item, idx) => (
            <div key={`${item.menuItemId}-${idx}`} className={`grid grid-cols-12 items-start ${is2Inch ? 'text-[8.5px] leading-tight' : 'text-[10.5px]'}`}>
              <div className="col-span-6 pr-0.5 break-words leading-tight">{item.name}</div>
              <div className="col-span-2 text-center tabular-nums">{item.qty}</div>
              <div className="col-span-2 text-right tabular-nums">{item.price}</div>
              <div className="col-span-2 text-right font-semibold tabular-nums">{item.price * item.qty}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals Breakdown */}
      <div className={`border-b border-dashed border-black pb-1.5 mb-1.5 space-y-0.5 tabular-nums ${is2Inch ? 'text-[9px]' : 'text-[10.5px]'}`}>
        <div className="flex justify-between">
          <span>Items ({order.items.length}) / Qty ({totalQty})</span>
          <span>₹{order.subtotal.toFixed(2)}</span>
        </div>
        {order.packagingCharge > 0 && (
          <div className="flex justify-between">
            <span>Packaging</span>
            <span>+₹{order.packagingCharge.toFixed(2)}</span>
          </div>
        )}
        {order.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>GST / Taxes</span>
            <span>+₹{order.taxAmount.toFixed(2)}</span>
          </div>
        )}
        {order.discountAmount > 0 && (
          <div className="flex justify-between font-semibold">
            <span>Discount / Promo</span>
            <span>-₹{order.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className={`flex justify-between font-bold border-t border-black pt-1 mt-1 ${is2Inch ? 'text-[11px]' : 'text-[13px]'}`}>
          <span>GRAND TOTAL</span>
          <span>₹{Math.round(order.grandTotal).toLocaleString('en-IN')}.00</span>
        </div>
      </div>

      {/* Smart Bypass Footer with Dynamic WhatsApp QR Code */}
      <div className="text-center pt-0.5">
        <div className={`font-bold uppercase tracking-tight mb-1 ${is2Inch ? 'text-[8px]' : 'text-[10px]'}`}>
          ★ DIRECT WHATSAPP ORDER BYPASS ★
        </div>
        <div className="flex justify-center my-1">
          <QrCodeMatrix url={whatsappUrl} size={is2Inch ? 96 : 116} />
        </div>
        <div className={`font-bold leading-snug mt-1 px-1 border border-black py-0.5 ${is2Inch ? 'text-[8.5px]' : 'text-[10.5px]'}`}>
          {settings.billFooterCTA}
        </div>
        <div className={`mt-0.5 font-semibold ${is2Inch ? 'text-[8px]' : 'text-[9.5px]'}`}>
          WhatsApp: +{cleanPhone}
        </div>
        <div className={`mt-1 text-neutral-700 ${is2Inch ? 'text-[7.5px]' : 'text-[9px]'}`}>
          Thank you for dining with {settings.restaurantName}!
        </div>
      </div>
    </div>
  );
};
