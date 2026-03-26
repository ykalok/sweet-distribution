import { useState, useEffect } from 'react';
import { orderApi, paymentApi, invoiceApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Clock, Truck, CheckCircle, XCircle, CreditCard, FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface OrderItem { id: string; productId: string; productName: string; category: string; quantity: number; priceAtTime: number; subtotal: number; }
interface OrderData { id: string; status: string; totalAmount: number; deliveryAddress: string; notes: string | null; items: OrderItem[]; createdAt: string; }
interface PaymentData { status: string; method: string | null; paidAt: string | null; amount: number; }
interface InvoiceData { invoiceNumber: string; gstAmount: number; totalWithTax: number; }

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  PENDING:    { icon: <Clock className="w-4 h-4" />,       color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',   label: 'Pending' },
  CONFIRMED:  { icon: <CheckCircle className="w-4 h-4" />, color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',     label: 'Confirmed' },
  PROCESSING: { icon: <Package className="w-4 h-4" />,     color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200', label: 'Processing' },
  SHIPPED:    { icon: <Truck className="w-4 h-4" />,       color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200', label: 'Shipped' },
  DELIVERED:  { icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Delivered' },
  CANCELLED:  { icon: <XCircle className="w-4 h-4" />,     color: 'text-red-600',     bg: 'bg-red-50 border-red-200',       label: 'Cancelled' },
};

const STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export const OrderTracking = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<Record<string, PaymentData>>({});
  const [invoiceInfo, setInvoiceInfo] = useState<Record<string, InvoiceData>>({});
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => { fetchOrders(); }, [profile?.id]);

  const fetchOrders = async () => {
    try {
      const { data } = await orderApi.getMyOrders();
      const orderList = data.data?.content || data.data || [];
      setOrders(orderList);
      for (const order of orderList) {
        fetchPaymentInfo(order.id);
        fetchInvoiceInfo(order.id);
      }
    } catch (err) { console.error('Error fetching orders:', err); }
    setLoading(false);
  };

  const fetchPaymentInfo = async (orderId: string) => {
    try { const { data } = await paymentApi.getStatus(orderId); setPaymentInfo(prev => ({ ...prev, [orderId]: data.data })); } catch {}
  };
  const fetchInvoiceInfo = async (orderId: string) => {
    try { const { data } = await invoiceApi.getByOrderId(orderId); setInvoiceInfo(prev => ({ ...prev, [orderId]: data.data })); } catch {}
  };

  const filteredOrders = activeFilter === 'ALL' ? orders : orders.filter(o => o.status === activeFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" /><span className="font-medium">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="card-elevated p-12">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-500 text-sm">Your order history will appear here once you place an order.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        <p className="text-gray-500 text-sm mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
      </div>


      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(f => {
          const count = f === 'ALL' ? orders.length : orders.filter(o => o.status === f).length;
          if (f !== 'ALL' && count === 0) return null;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeFilter === f ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {f === 'ALL' ? 'All' : STATUS_CONFIG[f]?.label} <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Order list */}
      <div className="space-y-4">
        {filteredOrders.map((order, idx) => {
          const payment = paymentInfo[order.id];
          const invoice = invoiceInfo[order.id];
          const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
          const isExpanded = expandedOrder === order.id;
          const stepIdx = STEPS.indexOf(order.status);

          return (
            <div key={order.id} className="card overflow-hidden animate-slide-up" style={{ animationDelay: `${idx * 0.04}s` }}>
              {/* Header row */}
              <div className="p-5 cursor-pointer" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div>
                      <div className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-lg font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Items preview */}
                <p className="text-xs text-gray-400 mb-3">
                  {order.items?.slice(0, 3).map(i => i.productName).join(', ')}
                  {order.items?.length > 3 && ` +${order.items.length - 3} more`}
                </p>

                {/* Progress bar */}
                {order.status !== 'CANCELLED' && (
                  <div className="flex items-center gap-1">
                    {STEPS.map((step, i) => (
                      <div key={step} className="flex-1">
                        <div className={`h-1.5 rounded-full transition-all duration-500 ${
                          i <= stepIdx ? 'bg-gradient-to-r from-orange-400 to-amber-400' : 'bg-gray-100'
                        }`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-5 space-y-4 animate-fade-in">
                  {/* Payment & Invoice badges */}
                  {(payment || invoice) && (
                    <div className="flex flex-wrap gap-2">
                      {payment && (
                        <span className={`badge gap-1.5 ${
                          payment.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : payment.status === 'FAILED' ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <CreditCard className="w-3 h-3" /> {payment.status}{payment.method && ` · ${payment.method}`}
                        </span>
                      )}
                      {invoice && (
                        <span className="badge bg-blue-50 text-blue-700 border border-blue-200 gap-1.5">
                          <FileText className="w-3 h-3" /> {invoice.invoiceNumber}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items Ordered</p>
                    {order.items?.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">🍬</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900">{item.productName}</div>
                          <div className="text-xs text-gray-400">{item.quantity} × ₹{item.priceAtTime}</div>
                        </div>
                        <div className="text-sm font-bold text-gray-900">₹{item.subtotal.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  {invoice && (
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span><span>₹{order.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>GST (18%)</span><span>₹{invoice.gstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                        <span>Total Paid</span><span>₹{invoice.totalWithTax.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Delivery address */}
                  <div className="p-3 bg-gray-50 rounded-xl text-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Delivery Address</p>
                    <span className="text-gray-600">{order.deliveryAddress}</span>
                    {order.notes && (
                      <div className="mt-1 text-gray-500"><span className="font-medium">Notes: </span>{order.notes}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
