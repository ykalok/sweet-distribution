import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Clock, Truck, CheckCircle, XCircle, MapPin, Loader2, ChevronDown, ChevronUp, Send } from 'lucide-react';

interface OrderItem { id: string; productName: string; quantity: number; priceAtTime: number; subtotal: number; }
interface OrderData { id: string; customerId: string; customerName: string; customerEmail: string; companyName: string | null; status: string; totalAmount: number; deliveryAddress: string; notes: string | null; items: OrderItem[]; createdAt: string; }
interface TrackingEntry { id: string; status: string; location: string | null; notes: string | null; updatedByName: string | null; createdAt: string; }

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  PENDING: { icon: <Clock className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  CONFIRMED: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  PROCESSING: { icon: <Package className="w-4 h-4" />, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  SHIPPED: { icon: <Truck className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  DELIVERED: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  CANCELLED: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

export const OrderManagement = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [trackingMap, setTrackingMap] = useState<Record<string, TrackingEntry[]>>({});
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState({ status: '', location: '', notes: '' });
  const [showTracking, setShowTracking] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, [filterStatus, profile?.id]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const status = filterStatus === 'all' ? undefined : filterStatus;
      const { data } = await adminApi.getOrders(status, 0, 100);
      setOrders(data.data?.content || data.data || []);
    } catch (err) { console.error('Error fetching orders:', err); }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try { await adminApi.updateOrderStatus(orderId, newStatus); fetchOrders(); }
    catch (err: any) { alert(err.response?.data?.message || 'Failed to update status'); }
  };

  const fetchTracking = async (orderId: string) => {
    try { const { data } = await adminApi.getTracking(orderId); setTrackingMap(prev => ({ ...prev, [orderId]: data.data || [] })); } catch {}
  };

  const toggleTracking = (orderId: string) => {
    if (showTracking === orderId) { setShowTracking(null); }
    else { setShowTracking(orderId); fetchTracking(orderId); }
  };

  const addTrackingEntry = async (orderId: string) => {
    if (!trackingForm.status) return;
    try {
      await adminApi.addTracking(orderId, trackingForm.status, trackingForm.location || undefined, trackingForm.notes || undefined);
      setTrackingForm({ status: '', location: '', notes: '' });
      fetchTracking(orderId);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to add tracking'); }
  };

  const statuses = ['all', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" /><span className="font-medium">Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and track customer orders</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {statuses.map(status => (
          <button key={status} onClick={() => setFilterStatus(status)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              filterStatus === status ? 'btn-primary shadow-md' : 'btn-secondary'
            }`}>
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, idx) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const isExpanded = expandedOrder === order.id;
            const isTrackingOpen = showTracking === order.id;

            return (
              <div key={order.id} className="card overflow-hidden animate-slide-up" style={{ animationDelay: `${idx * 0.03}s` }}>
                {/* Order header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}
                      </div>
                      <div>
                        <div className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8)}</div>
                        <div className="text-sm font-semibold text-gray-900">{order.customerName}</div>
                        <div className="text-xs text-gray-400">{order.customerEmail}{order.companyName && ` · ${order.companyName}`}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="input-field py-1.5 px-3 text-xs w-auto font-medium">
                      {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5">
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      Details
                    </button>
                    <button onClick={() => toggleTracking(order.id)}
                      className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Tracking
                    </button>
                  </div>
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 animate-fade-in">
                    <div className="space-y-2 mb-3">
                      {order.items?.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-sm">
                          <div>
                            <span className="font-medium text-gray-900">{item.productName}</span>
                            <span className="text-gray-400 ml-2">{item.quantity} × ₹{item.priceAtTime}</span>
                          </div>
                          <span className="font-bold text-gray-900">₹{item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
                      <span className="font-medium text-gray-700">Address: </span>{order.deliveryAddress}
                      {order.notes && <><br /><span className="font-medium text-gray-700">Notes: </span>{order.notes}</>}
                    </div>
                  </div>
                )}

                {/* Tracking */}
                {isTrackingOpen && (
                  <div className="border-t border-gray-100 p-5 animate-fade-in">
                    {(trackingMap[order.id] || []).length > 0 && (
                      <div className="mb-4 space-y-2.5">
                        {trackingMap[order.id].map(entry => (
                          <div key={entry.id} className="flex gap-3 text-xs">
                            <div className="w-2 h-2 mt-1 bg-indigo-400 rounded-full flex-shrink-0" />
                            <div>
                              <span className="font-semibold text-gray-900">{entry.status}</span>
                              {entry.location && <span className="text-gray-400 ml-2">· {entry.location}</span>}
                              {entry.notes && <div className="text-gray-400 italic">{entry.notes}</div>}
                              <div className="text-gray-300 mt-0.5">{new Date(entry.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input type="text" placeholder="Status" value={trackingForm.status}
                        onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                        className="input-field py-2 text-xs flex-1" />
                      <input type="text" placeholder="Location" value={trackingForm.location}
                        onChange={(e) => setTrackingForm({ ...trackingForm, location: e.target.value })}
                        className="input-field py-2 text-xs flex-1" />
                      <input type="text" placeholder="Notes" value={trackingForm.notes}
                        onChange={(e) => setTrackingForm({ ...trackingForm, notes: e.target.value })}
                        className="input-field py-2 text-xs flex-1" />
                      <button onClick={() => addTrackingEntry(order.id)}
                        className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5">
                        <Send className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
