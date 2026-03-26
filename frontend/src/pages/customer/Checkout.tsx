import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cartApi, orderApi, paymentApi, addressApi } from '../../lib/api';
import { getDeliveryCharge, validateCoupon, applyCoupon, incrementCouponUsage } from '../../lib/billingConfig';
import { getStateByCity } from '../../lib/cityState';
import { CheckCircle, CreditCard, Loader2, MapPin, Plus, Pencil, Trash2, Save, X, Tag } from 'lucide-react';

interface CartItemData {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

interface AddressData {
  id: string;
  label: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  mobileNumber?: string | null;
  isDefault: boolean;
}

interface CustomAddressForm {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  mobileNumber: string;
}

export const Checkout = ({
  onComplete,
  onBack
}: {
  onComplete: (orderId: string) => void,
  onBack: () => void
}) => {
  const { profile } = useAuth();
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState<CustomAddressForm>({
    addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', mobileNumber: '',
  });
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ addressLine1: string; addressLine2: string; city: string; state: string; pincode: string; mobileNumber: string; label: string }>({
    addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', mobileNumber: '', label: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchCart(), fetchAddresses()]).then(() => setLoading(false));
  }, [profile?.id]);

  const fetchCart = async () => {
    try {
      const { data } = await cartApi.get();
      setCart(data.data || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data } = await addressApi.getAll();
      const list = data.data || [];
      setAddresses(list);
      const def = list.find((a: AddressData) => a.isDefault);
      if (def) setSelectedAddressId(def.id);
      else if (list.length > 0) setSelectedAddressId(list[0].id);
      else setUseCustomAddress(true);
    } catch { /* no addresses */ setUseCustomAddress(true); }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const delivery = getDeliveryCharge(totalAmount);
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const gstAmount = (totalAmount - couponDiscount) * 0.18;
  const totalWithTax = totalAmount - couponDiscount + gstAmount + delivery.charge;

  const handleApplyCoupon = () => {
    setCouponError('');
    const result = validateCoupon(couponCode, totalAmount);
    if (!result.valid || !result.coupon) { setCouponError(result.error || 'Invalid coupon'); return; }
    const discount = applyCoupon(result.coupon, totalAmount);
    setAppliedCoupon({ code: result.coupon.code, discount });
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(''); setCouponError(''); };

  const getDeliveryAddress = () => {
    if (useCustomAddress) {
      const { addressLine1, addressLine2, city, state, pincode, mobileNumber } = customAddress;
      return [addressLine1, addressLine2, city, state, pincode, mobileNumber ? `Ph: ${mobileNumber}` : '']
        .filter(Boolean).join(', ');
    }
    const addr = addresses.find(a => a.id === selectedAddressId);
    if (!addr) return '';
    return [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode,
      addr.mobileNumber ? `Ph: ${addr.mobileNumber}` : '']
      .filter(Boolean).join(', ');
  };

  const isCustomAddressValid = () => {
    const { addressLine1, city, state, pincode, mobileNumber } = customAddress;
    return addressLine1.trim() && city.trim() && state.trim()
      && /^\d{6}$/.test(pincode) && /^\d{10}$/.test(mobileNumber);
  };

  const startEditAddress = (addr: AddressData) => {
    setEditingAddressId(addr.id);
    setEditForm({
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      mobileNumber: addr.mobileNumber || '',
      label: addr.label || '',
    });
  };

  const saveEditAddress = async () => {
    if (!editingAddressId) return;
    setSavingEdit(true);
    try {
      const { data } = await addressApi.update(editingAddressId, {
        addressLine1: editForm.addressLine1,
        addressLine2: editForm.addressLine2 || undefined,
        city: editForm.city,
        state: editForm.state,
        pincode: editForm.pincode,
        mobileNumber: editForm.mobileNumber || undefined,
        label: editForm.label || undefined,
      });
      setAddresses(prev => prev.map(a => a.id === editingAddressId ? data.data : a));
      setEditingAddressId(null);
    } catch { /* ignore */ }
    setSavingEdit(false);
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      await addressApi.delete(id);
      const remaining = addresses.filter(a => a.id !== id);
      setAddresses(remaining);
      if (selectedAddressId === id) {
        if (remaining.length > 0) setSelectedAddressId(remaining[0].id);
        else { setSelectedAddressId(null); setUseCustomAddress(true); }
      }
    } catch { /* ignore */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = getDeliveryAddress();
    if (!address) { setError('Please provide a delivery address'); return; }
    if (useCustomAddress && !isCustomAddressValid()) {
      setError('Please fill all required address fields correctly'); return;
    }
    if (cart.length === 0) { setError('Cart is empty'); return; }

    setError('');
    setProcessing(true);

    try {
      if (useCustomAddress && saveAddress) {
        try {
          const saved = await addressApi.create({
            addressLine1: customAddress.addressLine1,
            addressLine2: customAddress.addressLine2 || undefined,
            city: customAddress.city,
            state: customAddress.state,
            pincode: customAddress.pincode,
            mobileNumber: customAddress.mobileNumber || undefined,
            isDefault: addresses.length === 0,
          });
          setAddresses(prev => [...prev, saved.data.data]);
        } catch { /* non-fatal */ }
      }

      const items = cart.map(item => ({ productId: item.productId, quantity: item.quantity }));
      const { data } = await orderApi.create({ deliveryAddress: address, notes: notes || undefined, items });
      const createdOrderId = data.data.id;
      setOrderId(createdOrderId);

      if (appliedCoupon) incrementCouponUsage(appliedCoupon.code);

      // Clear persistent cart
      await cartApi.clear();

      await initiatePayment(createdOrderId);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to place order');
      setProcessing(false);
    }
  };

  const initiatePayment = async (oid: string) => {
    setError('');
    try {
      const [paymentRes, keyRes] = await Promise.all([
        paymentApi.createOrder(oid),
        paymentApi.getRazorpayKey(),
      ]);

      const { gatewayOrderId, amount, currency } = paymentRes.data.data;
      const { keyId } = keyRes.data.data;

      const options: RazorpayOptions = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        name: 'B2B Sweet Distribution',
        description: 'Order Payment',
        order_id: gatewayOrderId,
        handler: async (response) => {
          try {
            await paymentApi.verify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            onComplete(oid);
          } catch (err: any) {
            setError(err.response?.data?.message || 'Payment verification failed');
          }
          setProcessing(false);
        },
        prefill: { name: profile?.fullName || '', email: profile?.email || '' },
        theme: { color: '#f97316' },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setError('Payment cancelled. You can retry from Order Tracking.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading checkout...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Details</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {/* Saved Addresses */}
            {addresses.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Saved Addresses</label>
                <div className="space-y-2">
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`border rounded-lg transition-all ${
                        !useCustomAddress && selectedAddressId === addr.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200'
                      }`}
                    >
                      {editingAddressId === addr.id ? (
                        /* Inline edit form */
                        <div className="p-3 space-y-2">
                          <input placeholder="Label (e.g. Home, Office)" value={editForm.label} onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                          <input placeholder="Address Line 1 *" value={editForm.addressLine1} onChange={e => setEditForm(p => ({ ...p, addressLine1: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                          <input placeholder="Address Line 2" value={editForm.addressLine2} onChange={e => setEditForm(p => ({ ...p, addressLine2: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                          <div className="grid grid-cols-2 gap-2">
                            <input placeholder="City *" value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                            <input placeholder="State *" value={editForm.state} onChange={e => setEditForm(p => ({ ...p, state: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Pincode *" maxLength={6} value={editForm.pincode} onChange={e => setEditForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                            <input placeholder="Mobile *" maxLength={10} value={editForm.mobileNumber} onChange={e => setEditForm(p => ({ ...p, mobileNumber: e.target.value.replace(/\D/g, '') }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button type="button" onClick={saveEditAddress} disabled={savingEdit} className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1.5">
                              {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                            </button>
                            <button type="button" onClick={() => setEditingAddressId(null)} className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1.5">
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal view */
                        <label className="flex items-start gap-3 p-3 cursor-pointer">
                          <input
                            type="radio"
                            name="address"
                            checked={!useCustomAddress && selectedAddressId === addr.id}
                            onChange={() => { setSelectedAddressId(addr.id); setUseCustomAddress(false); }}
                            disabled={processing}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                              <span className="font-semibold text-sm">{addr.label || 'Address'}</span>
                              {addr.isDefault && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Default</span>}
                            </div>
                            <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                              <div>{[addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ')}</div>
                              <div className="flex gap-3 flex-wrap">
                                <span>{addr.city}</span><span>{addr.state}</span>
                                <span className="font-medium text-gray-700">{addr.pincode}</span>
                              </div>
                              {addr.mobileNumber && <div className="text-gray-500">📞 {addr.mobileNumber}</div>}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0" onClick={e => e.preventDefault()}>
                            <button type="button" onClick={() => startEditAddress(addr)} disabled={processing}
                              className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => deleteAddress(addr.id)} disabled={processing}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </label>
                      )}
                    </div>
                  ))}
                  <label
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      useCustomAddress ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={useCustomAddress}
                      onChange={() => setUseCustomAddress(true)}
                      disabled={processing}
                    />
                    <Plus className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Use a different address</span>
                  </label>
                </div>
              </div>
            )}

            {useCustomAddress && (
              <div className="mb-6 space-y-3">
                <label className="block text-sm font-semibold text-gray-700">New Delivery Address</label>

                {/* Address Line 1 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Address Line 1 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={customAddress.addressLine1}
                    onChange={e => setCustomAddress(p => ({ ...p, addressLine1: e.target.value }))}
                    disabled={processing}
                    placeholder="House / Flat / Building No., Street"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* Address Line 2 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={customAddress.addressLine2}
                    onChange={e => setCustomAddress(p => ({ ...p, addressLine2: e.target.value }))}
                    disabled={processing}
                    placeholder="Area, Landmark (optional)"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* City + State */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">City <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={customAddress.city}
                      onChange={e => {
                        const city = e.target.value;
                        const state = getStateByCity(city);
                        setCustomAddress(p => ({ ...p, city, ...(state ? { state } : {}) }));
                      }}
                      disabled={processing}
                      placeholder="City"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">State <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={customAddress.state}
                      onChange={e => setCustomAddress(p => ({ ...p, state: e.target.value }))}
                      disabled={processing}
                      placeholder="State"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* Pincode + Mobile */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Pincode <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      maxLength={6}
                      value={customAddress.pincode}
                      onChange={e => setCustomAddress(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))}
                      disabled={processing}
                      placeholder="6-digit pincode"
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 ${
                        customAddress.pincode && !/^\d{6}$/.test(customAddress.pincode)
                          ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {customAddress.pincode && !/^\d{6}$/.test(customAddress.pincode) && (
                      <p className="text-xs text-red-500 mt-1">Must be 6 digits</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      maxLength={10}
                      value={customAddress.mobileNumber}
                      onChange={e => setCustomAddress(p => ({ ...p, mobileNumber: e.target.value.replace(/\D/g, '') }))}
                      disabled={processing}
                      placeholder="10-digit mobile"
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 ${
                        customAddress.mobileNumber && !/^\d{10}$/.test(customAddress.mobileNumber)
                          ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {customAddress.mobileNumber && !/^\d{10}$/.test(customAddress.mobileNumber) && (
                      <p className="text-xs text-red-500 mt-1">Must be 10 digits</p>
                    )}
                  </div>
                </div>

                {/* Save address checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={e => setSaveAddress(e.target.checked)}
                    disabled={processing}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">Save this address for future orders</span>
                </label>
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                Order Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={processing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none disabled:bg-gray-100"
                placeholder="Any special instructions?"
              />
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={onBack} disabled={processing}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50">
                Back to Cart
              </button>
              <button type="submit" disabled={processing}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-3 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                {processing
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  : <><CreditCard className="w-5 h-5" /> Pay & Place Order</>}
              </button>
            </div>
          </form>

          {orderId && !processing && error && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Order created but payment incomplete.{' '}
                <button onClick={() => initiatePayment(orderId)} className="font-semibold underline hover:text-yellow-900">
                  Retry Payment
                </button>
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{item.productName}</div>
                    <div className="text-sm text-gray-600">{item.quantity} × ₹{item.productPrice}</div>
                  </div>
                  <div className="font-semibold text-gray-900">₹{item.subtotal.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="mb-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Tag className="w-4 h-4" />
                    <span className="font-mono font-bold">{appliedCoupon.code}</span>
                    <span>− ₹{appliedCoupon.discount.toFixed(2)}</span>
                  </div>
                  <button onClick={removeCoupon} className="text-green-500 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Coupon code" value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                  </div>
                  <button onClick={handleApplyCoupon} disabled={!couponCode.trim()}
                    className="btn-primary px-4 py-2 text-sm">Apply</button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">₹{totalAmount.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600">Coupon ({appliedCoupon.code})</span>
                  <span className="font-semibold text-green-600">− ₹{appliedCoupon.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">GST (18%)</span>
                <span className="font-semibold text-gray-900">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{delivery.label}</span>
                {delivery.charge === 0
                  ? <span className="font-semibold text-green-600">Free</span>
                  : <span className="font-semibold text-gray-900">₹{delivery.charge.toFixed(2)}</span>}
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">₹{totalWithTax.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <div className="font-semibold mb-1">Secure Payment via Razorpay</div>
                <div>Your payment is processed securely. We support UPI, cards, and netbanking.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
