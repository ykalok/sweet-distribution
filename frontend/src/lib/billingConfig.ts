export interface DeliveryRule {
  id: string;
  minOrder: number;
  maxOrder: number | null; // null = unlimited
  charge: number;
  label: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
}

const DELIVERY_KEY = 'billing_delivery_rules';
const COUPON_KEY = 'billing_coupons';

const DEFAULT_RULES: DeliveryRule[] = [
  { id: '1', minOrder: 0, maxOrder: 499, charge: 50, label: 'Standard Delivery' },
  { id: '2', minOrder: 500, maxOrder: 999, charge: 30, label: 'Standard Delivery' },
  { id: '3', minOrder: 1000, maxOrder: null, charge: 0, label: 'Free Delivery' },
];

export const getDeliveryRules = (): DeliveryRule[] => {
  try {
    const raw = localStorage.getItem(DELIVERY_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_RULES;
  } catch { return DEFAULT_RULES; }
};

export const saveDeliveryRules = (rules: DeliveryRule[]) =>
  localStorage.setItem(DELIVERY_KEY, JSON.stringify(rules));

export const getDeliveryCharge = (orderTotal: number): { charge: number; label: string } => {
  const rules = getDeliveryRules().sort((a, b) => b.minOrder - a.minOrder);
  for (const rule of rules) {
    if (orderTotal >= rule.minOrder && (rule.maxOrder === null || orderTotal <= rule.maxOrder)) {
      return { charge: rule.charge, label: rule.label };
    }
  }
  return { charge: 0, label: 'Free Delivery' };
};

export const getCoupons = (): Coupon[] => {
  try {
    const raw = localStorage.getItem(COUPON_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const saveCoupons = (coupons: Coupon[]) =>
  localStorage.setItem(COUPON_KEY, JSON.stringify(coupons));

export const validateCoupon = (code: string, orderTotal: number): { valid: boolean; coupon?: Coupon; error?: string } => {
  const coupons = getCoupons();
  const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (!coupon) return { valid: false, error: 'Invalid coupon code' };
  if (!coupon.active) return { valid: false, error: 'Coupon is inactive' };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { valid: false, error: 'Coupon has expired' };
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { valid: false, error: 'Coupon usage limit reached' };
  if (orderTotal < coupon.minOrder) return { valid: false, error: `Minimum order ₹${coupon.minOrder} required` };
  return { valid: true, coupon };
};

export const applyCoupon = (coupon: Coupon, orderTotal: number): number => {
  if (coupon.type === 'PERCENT') return Math.min(orderTotal, (orderTotal * coupon.value) / 100);
  return Math.min(orderTotal, coupon.value);
};

export const incrementCouponUsage = (code: string) => {
  const coupons = getCoupons();
  const idx = coupons.findIndex(c => c.code.toUpperCase() === code.toUpperCase());
  if (idx !== -1) { coupons[idx].usedCount += 1; saveCoupons(coupons); }
};
