import React, { useState } from 'react';
import { Package, Truck, CheckCircle2, Clock, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';
import { Order, OrderStatus } from '../types/ecommerce';

interface OrderTrackingViewProps {
  orders: Order[];
  activeOrder?: Order | null;
  onBackToStore: () => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  orders,
  activeOrder: initialActiveOrder,
  onBackToStore,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialActiveOrder?.id || (orders.length > 0 ? orders[0].id : null)
  );

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || initialActiveOrder || orders[0];

  const steps: { key: OrderStatus; label: string; desc: string }[] = [
    { key: 'confirmed', label: 'Order Confirmed', desc: 'Received & committed to DynamoDB' },
    { key: 'processing', label: 'Batch Processing', desc: 'Custom packaging & quality audit' },
    { key: 'shipped', label: 'Dispatched', desc: 'En route with Apex Air Logistics' },
    { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Courier on local delivery route' },
    { key: 'delivered', label: 'Delivered', desc: 'Securely received & signature confirmed' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return 0;
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Catalog</span>
        </button>
      </div>

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Order Tracking & History
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time fulfillment tracking queried from AWS DynamoDB DocumentClient
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-zinc-400">
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Recorded
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <Package className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No Orders Placed Yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-6">
            When you complete checkout, your order will be committed to DynamoDB and displayed here with live tracking.
          </p>
          <button
            onClick={onBackToStore}
            className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Orders sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Your Recent Orders</h3>
            <div className="space-y-2">
              {orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrderId(o.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedOrder?.id === o.id
                      ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{o.id}</span>
                    <span className="capitalize text-blue-600 dark:text-blue-400 font-semibold">{o.status}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-500">
                    <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                    <span className="font-mono tabular-nums font-bold text-zinc-900 dark:text-zinc-100">
                      ${o.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active order detail */}
          {selectedOrder && (
            <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-8">
              {/* Top Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <div className="text-xs font-mono text-zinc-400">Order ID: {selectedOrder.id}</div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    Estimated Delivery: {selectedOrder.estimatedDelivery}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Carrier: {selectedOrder.carrier} · Tracking: <span className="font-mono font-semibold">{selectedOrder.trackingNumber}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-zinc-500">Order Total</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                    ${selectedOrder.totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Progress Stepper Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-6">Delivery Progress</h4>
                <div className="relative">
                  <div className="space-y-6">
                    {steps.map((st, idx) => {
                      const currentIdx = getStepIndex(selectedOrder.status);
                      const isComplete = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={st.key} className="flex items-start gap-4">
                          <div className="relative flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 ${
                                isComplete
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                              }`}
                            >
                              {isComplete ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                            </div>
                            {idx < steps.length - 1 && (
                              <div
                                className={`w-0.5 h-10 mt-1 ${
                                  idx < currentIdx ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-800'
                                }`}
                              />
                            )}
                          </div>
                          <div className="pt-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  isCurrent
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : isComplete
                                    ? 'text-zinc-900 dark:text-zinc-100'
                                    : 'text-zinc-400'
                                }`}
                              >
                                {st.label}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                                  Current Status
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">{st.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Package Contents</h4>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {selectedOrder.items.map((it) => (
                    <div key={it.productId} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={it.image}
                          alt={it.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
                        />
                        <div>
                          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{it.title}</div>
                          <div className="text-[11px] text-zinc-500">Qty: {it.quantity} × ${it.unitPrice.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="text-xs font-mono tabular-nums font-bold text-zinc-900 dark:text-zinc-100">
                        ${(it.unitPrice * it.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address & Summary */}
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Destination Address
                  </h4>
                  <div className="text-zinc-700 dark:text-zinc-300 space-y-0.5">
                    <div className="font-semibold">{selectedOrder.shippingAddress.fullName}</div>
                    <div>{selectedOrder.shippingAddress.street}</div>
                    {selectedOrder.shippingAddress.apartment && <div>{selectedOrder.shippingAddress.apartment}</div>}
                    <div>
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                    </div>
                    <div>{selectedOrder.shippingAddress.country}</div>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-850/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums">${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Promo Discount</span>
                      <span className="font-mono tabular-nums">-${selectedOrder.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-500">
                    <span>Shipping</span>
                    <span className="font-mono tabular-nums">
                      {selectedOrder.shippingFee === 0 ? 'FREE' : `$${selectedOrder.shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    <span>Total Paid</span>
                    <span className="font-mono tabular-nums">${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
