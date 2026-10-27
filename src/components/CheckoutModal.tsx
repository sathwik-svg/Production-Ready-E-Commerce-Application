import React, { useState } from 'react';
import { X, Check, Lock, CreditCard, Truck, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { CartResponse, checkout } from '../services/api';
import { Order, ShippingAddress } from '../types/ecommerce';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartResponse | null;
  appliedPromo?: string;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  appliedPromo,
  onOrderSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Address form
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+1 (555) 234-5678',
    street: '742 Evergreen Terrace',
    apartment: 'Apt 4B',
    city: 'Springfield',
    state: 'OR',
    postalCode: '97477',
    country: 'United States',
  });

  // Shipping choice
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express'>('standard');

  // Payment form
  const [paymentType, setPaymentType] = useState<'credit_card' | 'cod' | 'amazon_pay'>('credit_card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  if (!isOpen || !cart) return null;

  const validPromos: Record<string, number> = {
    SAVE10: 0.1,
    APEX20: 0.2,
    INTERN100: 0.25,
  };

  const subtotal = cart.subtotal;
  const discountRate = appliedPromo ? validPromos[appliedPromo] || 0 : 0;
  const discountAmount = Math.round(subtotal * discountRate * 100) / 100;
  const deliveryFee = deliveryOption === 'express' ? 15.0 : cart.shippingFee;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (step === 1) {
      if (!address.fullName || !address.email || !address.street || !address.city || !address.postalCode) {
        setErrorMessage('Please complete all required shipping fields.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePlaceOrder = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const order = await checkout({
        shippingAddress: address,
        paymentMethod: {
          type: paymentType,
          lastFour: paymentType === 'credit_card' ? '4242' : undefined,
        },
        promoCode: appliedPromo,
      });

      setIsSubmitting(false);
      onOrderSuccess(order);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Payment simulation failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Encrypted Checkout
            </span>
            <span className="text-xs text-zinc-400">· AWS DynamoDB Transaction</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-850/50 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center justify-between max-w-sm mx-auto text-xs font-semibold">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-blue-600' : 'text-zinc-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                1
              </span>
              <span>Shipping</span>
            </div>
            <div className="h-0.5 w-8 bg-zinc-200 dark:bg-zinc-700" />
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-blue-600' : 'text-zinc-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                2
              </span>
              <span>Delivery</span>
            </div>
            <div className="h-0.5 w-8 bg-zinc-200 dark:bg-zinc-700" />
            <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-blue-600' : 'text-zinc-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                3
              </span>
              <span>Payment</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Address */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Contact & Delivery Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Country</label>
                  <input
                    type="text"
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">State / Province</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Continue to Delivery Method
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Delivery Option */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Select Shipping Service</h3>
              <div className="space-y-3">
                <label
                  onClick={() => setDeliveryOption('standard')}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${
                    deliveryOption === 'standard'
                      ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Apex Insured Ground (3-4 Business Days)
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Carbon-neutral delivery with full loss and transit protection
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {cart.shippingFee === 0 ? 'FREE' : `$${cart.shippingFee.toFixed(2)}`}
                  </span>
                </label>

                <label
                  onClick={() => setDeliveryOption('express')}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${
                    deliveryOption === 'express'
                      ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Apex Air Priority (Next-Day Morning)
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Direct air express courier with real-time GPS tracking
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    $15.00
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 cursor-pointer"
                >
                  Back to Address
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Payment Simulation</h3>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('credit_card')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    paymentType === 'credit_card'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('amazon_pay')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    paymentType === 'amazon_pay'
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  <span className="font-black text-xs text-amber-600 dark:text-amber-400">a pay</span>
                  <span>Amazon Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('cod')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    paymentType === 'cod'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>COD</span>
                </button>
              </div>

              {paymentType === 'amazon_pay' && (
                <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs space-y-1.5">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <span className="font-black">Amazon Pay 1-Click</span>
                    <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900 px-1.5 py-0.5 rounded font-medium text-amber-800 dark:text-amber-200">
                      A-to-z Guarantee
                    </span>
                  </div>
                  <p className="text-amber-800 dark:text-amber-300">
                    Your order will be debited to your default Amazon wallet and fulfilled with Amazon Prime delivery speed.
                  </p>
                </div>
              )}

              {paymentType === 'credit_card' && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
                  <div>
                    <label className="block text-zinc-500 mb-1">Simulated Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 font-mono tracking-wider"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-500 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 mb-1">Security CVC</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentType === 'cod' && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-200">
                  You will pay <strong className="font-mono">${total.toFixed(2)}</strong> in cash or via mobile terminal upon courier arrival.
                </div>
              )}

              {/* Order Final Summary */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Cart Subtotal</span>
                  <span className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({appliedPromo})</span>
                    <span className="font-mono tabular-nums">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-500">
                  <span>Shipping</span>
                  <span className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-base font-bold text-zinc-950 dark:text-white">
                  <span>Grand Total</span>
                  <span className="font-mono tabular-nums">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Writing to DynamoDB...</span>
                    </>
                  ) : (
                    <span>Confirm & Place Order · ${total.toFixed(2)}</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
