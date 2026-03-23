import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cartApi, orderApi, paymentApi, addressApi } from '../../lib/api';
import { CheckCircle, CreditCard, Loader2, MapPin, Plus } from 'lucide-react';

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
  isDefault: boolean;
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
  const [customAddress, setCustomAddress] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [notes, setNotes] = useState('');
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
  const gstAmount = totalAmount * 0.18;
  const totalWithTax = totalAmount + gstAmount;

  const getDeliveryAddress = () => {
    if (useCustomAddress) return customAddress;
    const addr = addresses.find(a => a.id === selectedAddressId);
    if (!addr) return '';
    return [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode]
      .filter(Boolean).join(', ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = getDeliveryAddress();
    if (!address) { setError('Please provide a delivery address'); return; }
    if (cart.length === 0) { setError('Cart is empty'); return; }

    setError('');
    setProcessing(true);

    try {
      const items = cart.map(item => ({ productId: item.productId, quantity: item.quantity }));
      const { data } = await orderApi.create({ deliveryAddress: address, notes: notes || undefined, items });
      const createdOrderId = data.data.id;
      setOrderId(createdOrderId);

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
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        !useCustomAddress && selectedAddressId === addr.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={!useCustomAddress && selectedAddressId === addr.id}
                        onChange={() => { setSelectedAddressId(addr.id); setUseCustomAddress(false); }}
                        disabled={processing}
                        className="mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          <span className="font-semibold text-sm">{addr.label || 'Address'}</span>
                          {addr.isDefault && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Default</span>}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {[addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </label>
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
              <div className="mb-6">
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivery Address
                </label>
                <textarea
                  id="address"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  required={useCustomAddress}
                  rows={4}
                  disabled={processing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none disabled:bg-gray-100"
                  placeholder="Enter your complete delivery address"
                />
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
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">GST (18%)</span>
                <span className="font-semibold text-gray-900">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Delivery</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
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
