import { useState, useEffect } from 'react';
import { Trash2, ShoppingBag, Minus, Plus, Loader2, ArrowRight } from 'lucide-react';
import { cartApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface CartItemData {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export const Cart = ({ onCheckout }: { onCheckout: () => void }) => {
  const { profile } = useAuth();
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { fetchCart(); }, [profile?.id]);

  const fetchCart = async () => {
    try {
      const { data } = await cartApi.get();
      setCart(data.data || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
    setLoading(false);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) { await removeItem(itemId); return; }
    setUpdatingId(itemId);
    try {
      await cartApi.updateQuantity(itemId, quantity);
      fetchCart();
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
    setUpdatingId(null);
  };

  const removeItem = async (itemId: string) => {
    setUpdatingId(itemId);
    try {
      await cartApi.remove(itemId);
      fetchCart();
    } catch (err) {
      console.error('Error removing item:', err);
    }
    setUpdatingId(null);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Loading cart...</span>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="card-elevated p-12">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm">Browse our products and add some delicious sweets!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-500 text-sm mt-1">{totalItems} items in your cart</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.map((item, index) => (
            <div key={item.id} className="card p-4 flex items-center gap-4 animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🍬</span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">{item.productName}</h3>
                <p className="text-xs text-gray-400 mb-1">{item.productCategory}</p>
                <span className="text-sm font-bold text-gray-900">₹{item.productPrice}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={updatingId === item.id}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-10 text-center font-semibold text-sm">
                  {updatingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : item.quantity}
                </span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={updatingId === item.id}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50">
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="text-right min-w-[80px]">
                <div className="font-bold text-gray-900">₹{item.subtotal.toFixed(2)}</div>
              </div>

              <button onClick={() => removeItem(item.id)} disabled={updatingId === item.id}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card-elevated p-6 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>

            <div className="space-y-3 mb-4 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-medium text-gray-900">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>GST (18%)</span>
                <span className="font-medium text-gray-900">₹{(totalAmount * 0.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery</span>
                <span className="font-medium text-emerald-600">Free</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900">₹{(totalAmount * 1.18).toFixed(2)}</span>
              </div>
            </div>

            <button onClick={onCheckout}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
