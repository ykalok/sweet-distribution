import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Tag, Truck, Percent, IndianRupee, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  DeliveryRule, Coupon,
  getDeliveryRules, saveDeliveryRules,
  getCoupons, saveCoupons,
} from '../../lib/billingConfig';

const uid = () => Math.random().toString(36).slice(2, 10);

export const BillingSettings = () => {
  const [rules, setRules] = useState<DeliveryRule[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [rulesSaved, setRulesSaved] = useState(false);

  const [newCoupon, setNewCoupon] = useState<Omit<Coupon, 'id' | 'usedCount'>>({
    code: '', type: 'PERCENT', value: 0, minOrder: 0, maxUses: null, active: true, expiresAt: null,
  });

  useEffect(() => {
    setRules(getDeliveryRules());
    setCoupons(getCoupons());
  }, []);

  // --- Delivery Rules ---
  const updateRule = (id: string, field: keyof DeliveryRule, val: string) => {
    setRules(prev => prev.map(r => r.id === id ? {
      ...r,
      [field]: field === 'label' ? val : field === 'maxOrder' ? (val === '' ? null : Number(val)) : Number(val),
    } : r));
  };

  const addRule = () => setRules(prev => [...prev, { id: uid(), minOrder: 0, maxOrder: null, charge: 0, label: 'Delivery' }]);
  const removeRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id));

  const handleSaveRules = () => {
    saveDeliveryRules(rules);
    setRulesSaved(true);
    setTimeout(() => setRulesSaved(false), 2000);
  };

  // --- Coupons ---
  const addCoupon = () => {
    if (!newCoupon.code.trim()) return;
    const coupon: Coupon = { ...newCoupon, id: uid(), code: newCoupon.code.toUpperCase(), usedCount: 0 };
    const updated = [...coupons, coupon];
    setCoupons(updated);
    saveCoupons(updated);
    setNewCoupon({ code: '', type: 'PERCENT', value: 0, minOrder: 0, maxUses: null, active: true, expiresAt: null });
  };

  const toggleCoupon = (id: string) => {
    const updated = coupons.map(c => c.id === id ? { ...c, active: !c.active } : c);
    setCoupons(updated);
    saveCoupons(updated);
  };

  const deleteCoupon = (id: string) => {
    const updated = coupons.filter(c => c.id !== id);
    setCoupons(updated);
    saveCoupons(updated);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure delivery charges, coupons and offers</p>
      </div>

      {/* Delivery Rules */}
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Truck className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900">Delivery Charge Rules</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">Rules are matched by order subtotal (before GST). First matching rule from highest minOrder wins.</p>

        <div className="space-y-3 mb-4">
          {rules.map(rule => (
            <div key={rule.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-3">
                <label className="block text-[10px] text-gray-400 mb-1">Min Order (₹)</label>
                <input type="number" value={rule.minOrder} onChange={e => updateRule(rule.id, 'minOrder', e.target.value)}
                  className="input-field py-2 text-sm" />
              </div>
              <div className="col-span-3">
                <label className="block text-[10px] text-gray-400 mb-1">Max Order (₹, blank=∞)</label>
                <input type="number" value={rule.maxOrder ?? ''} onChange={e => updateRule(rule.id, 'maxOrder', e.target.value)}
                  placeholder="∞" className="input-field py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-gray-400 mb-1">Charge (₹)</label>
                <input type="number" value={rule.charge} onChange={e => updateRule(rule.id, 'charge', e.target.value)}
                  className="input-field py-2 text-sm" />
              </div>
              <div className="col-span-3">
                <label className="block text-[10px] text-gray-400 mb-1">Label</label>
                <input type="text" value={rule.label} onChange={e => updateRule(rule.id, 'label', e.target.value)}
                  className="input-field py-2 text-sm" />
              </div>
              <div className="col-span-1 pt-5">
                <button onClick={() => removeRule(rule.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={addRule} className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Rule
          </button>
          <button onClick={handleSaveRules} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
            <Save className="w-4 h-4" /> {rulesSaved ? 'Saved ✓' : 'Save Rules'}
          </button>
        </div>
      </section>

      {/* Coupons */}
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Tag className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900">Coupons & Offers</h2>
        </div>

        {/* Add coupon form */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Coupon</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Code</label>
              <input type="text" placeholder="e.g. SAVE20" value={newCoupon.code}
                onChange={e => setNewCoupon(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                className="input-field py-2 text-sm font-mono" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Type</label>
              <select value={newCoupon.type} onChange={e => setNewCoupon(p => ({ ...p, type: e.target.value as 'PERCENT' | 'FLAT' }))}
                className="input-field py-2 text-sm">
                <option value="PERCENT">Percent (%)</option>
                <option value="FLAT">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">
                {newCoupon.type === 'PERCENT' ? 'Discount %' : 'Discount ₹'}
              </label>
              <input type="number" value={newCoupon.value}
                onChange={e => setNewCoupon(p => ({ ...p, value: Number(e.target.value) }))}
                className="input-field py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Min Order (₹)</label>
              <input type="number" value={newCoupon.minOrder}
                onChange={e => setNewCoupon(p => ({ ...p, minOrder: Number(e.target.value) }))}
                className="input-field py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Max Uses (blank=∞)</label>
              <input type="number" value={newCoupon.maxUses ?? ''}
                onChange={e => setNewCoupon(p => ({ ...p, maxUses: e.target.value === '' ? null : Number(e.target.value) }))}
                placeholder="∞" className="input-field py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Expires At</label>
              <input type="date" value={newCoupon.expiresAt ?? ''}
                onChange={e => setNewCoupon(p => ({ ...p, expiresAt: e.target.value || null }))}
                className="input-field py-2 text-sm" />
            </div>
          </div>
          <button onClick={addCoupon} disabled={!newCoupon.code.trim()}
            className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Coupon
          </button>
        </div>

        {/* Coupon list */}
        {coupons.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No coupons yet</p>
        ) : (
          <div className="space-y-2">
            {coupons.map(c => (
              <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${c.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  {c.type === 'PERCENT' ? <Percent className="w-4 h-4 text-orange-500" /> : <IndianRupee className="w-4 h-4 text-orange-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-gray-900">{c.code}</span>
                    <span className="badge bg-orange-50 text-orange-600">
                      {c.type === 'PERCENT' ? `${c.value}% off` : `₹${c.value} off`}
                    </span>
                    {!c.active && <span className="badge bg-gray-100 text-gray-400">Inactive</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex gap-3 flex-wrap">
                    <span>Min ₹{c.minOrder}</span>
                    <span>Used: {c.usedCount}{c.maxUses !== null ? `/${c.maxUses}` : ''}</span>
                    {c.expiresAt && <span>Expires: {new Date(c.expiresAt).toLocaleDateString('en-IN')}</span>}
                  </div>
                </div>
                <button onClick={() => toggleCoupon(c.id)} className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors" title={c.active ? 'Deactivate' : 'Activate'}>
                  {c.active ? <ToggleRight className="w-5 h-5 text-orange-500" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => deleteCoupon(c.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
