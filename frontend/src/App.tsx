import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Products } from './pages/customer/Products';
import { Cart } from './pages/customer/Cart';
import { Checkout } from './pages/customer/Checkout';
import { OrderTracking } from './pages/customer/OrderTracking';
import { ProductManagement } from './pages/admin/ProductManagement';
import { OrderManagement } from './pages/admin/OrderManagement';
import { BillingSettings } from './pages/admin/BillingSettings';
import { ShoppingCart, Package, LogOut, Store, Settings, Home, Loader2, Sparkles, Receipt } from 'lucide-react';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { SiteInfoFooter } from './components/SiteInfoFooter';
import { cartApi } from './lib/api';

type Page = 'products' | 'cart' | 'checkout' | 'orders' | 'admin-products' | 'admin-orders' | 'admin-billing';

function AppContent() {
  const { profile, loading, signOut, isAdmin } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('products');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!profile || isAdmin) return;
    fetchCartCount();
  }, [profile, currentPage]);

  const fetchCartCount = () => {
    cartApi.get().then(({ data }) => {
      const items = data.data || [];
      setCartCount(items.reduce((s: number, i: any) => s + i.quantity, 0));
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center animate-pulse-soft shadow-xl shadow-orange-500/20">
            <span className="text-4xl">🍬</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Loading your sweet experience...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="animate-fade-in">
        {showLogin
          ? <Login onToggle={() => setShowLogin(false)} />
          : <Register onToggle={() => setShowLogin(true)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/80 via-amber-50/50 to-yellow-50/80">
      <nav className="glass sticky top-0 z-50 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentPage(isAdmin ? 'admin-products' : 'products')}>
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all duration-300 group-hover:scale-105">
                <span className="text-xl">🍬</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                  F&C Sweet
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h1>
                <p className="text-[11px] text-gray-500 font-medium tracking-wide uppercase">
                  {profile.companyName || 'Premium Sweet Supplier'}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {!isAdmin && (
                <>
                  <NavButton icon={<Home className="w-[18px] h-[18px]" />} label="Products" active={currentPage === 'products'} onClick={() => setCurrentPage('products')} />
                  <NavButton icon={<Package className="w-[18px] h-[18px]" />} label="My Orders" active={currentPage === 'orders'} onClick={() => setCurrentPage('orders')} />
                  <NavButton icon={<ShoppingCart className="w-[18px] h-[18px]" />} label="Cart" active={currentPage === 'cart'} onClick={() => setCurrentPage('cart')} badge={cartCount} />
                </>
              )}
              {isAdmin && (
                <>
                  <NavButton icon={<Store className="w-[18px] h-[18px]" />} label="Products" active={currentPage === 'admin-products'} onClick={() => setCurrentPage('admin-products')} />
                  <NavButton icon={<Settings className="w-[18px] h-[18px]" />} label="Orders" active={currentPage === 'admin-orders'} onClick={() => setCurrentPage('admin-orders')} />
                  <NavButton icon={<Receipt className="w-[18px] h-[18px]" />} label="Billing" active={currentPage === 'admin-billing'} onClick={() => setCurrentPage('admin-billing')} />
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-gray-900">{profile.fullName}</div>
                <div className="text-[11px] font-medium text-gray-500">
                  {isAdmin ? '✦ Admin' : '● Customer'}
                </div>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                {profile.fullName.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                title="Sign out"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-1 pb-3 -mt-1 overflow-x-auto">
            {!isAdmin && (
              <>
                <NavButton icon={<Home className="w-4 h-4" />} label="Products" active={currentPage === 'products'} onClick={() => setCurrentPage('products')} />
                <NavButton icon={<Package className="w-4 h-4" />} label="Orders" active={currentPage === 'orders'} onClick={() => setCurrentPage('orders')} />
                <NavButton icon={<ShoppingCart className="w-4 h-4" />} label="Cart" active={currentPage === 'cart'} onClick={() => setCurrentPage('cart')} badge={cartCount} />
              </>
            )}
            {isAdmin && (
              <>
                <NavButton icon={<Store className="w-4 h-4" />} label="Products" active={currentPage === 'admin-products'} onClick={() => setCurrentPage('admin-products')} />
                <NavButton icon={<Settings className="w-4 h-4" />} label="Orders" active={currentPage === 'admin-orders'} onClick={() => setCurrentPage('admin-orders')} />
                <NavButton icon={<Receipt className="w-4 h-4" />} label="Billing" active={currentPage === 'admin-billing'} onClick={() => setCurrentPage('admin-billing')} />
              </>
            )}
          </div>
        </div>
      </nav>

      <AnnouncementBanner isAdmin={isAdmin} />

      <main className="animate-fade-in">
        {!isAdmin && currentPage === 'products' && <Products onCartUpdate={fetchCartCount} />}
        {!isAdmin && currentPage === 'cart' && <Cart onCheckout={() => setCurrentPage('checkout')} onCartUpdate={fetchCartCount} />}
        {!isAdmin && currentPage === 'checkout' && (
          <Checkout onComplete={() => setCurrentPage('orders')} onBack={() => setCurrentPage('cart')} />
        )}
        {!isAdmin && currentPage === 'orders' && <OrderTracking />}
        {isAdmin && currentPage === 'admin-products' && <ProductManagement />}
        {isAdmin && currentPage === 'admin-orders' && <OrderManagement />}
        {isAdmin && currentPage === 'admin-billing' && <BillingSettings />}
      </main>

      <SiteInfoFooter isAdmin={isAdmin} />
    </div>
  );
}

function NavButton({ icon, label, active, onClick, badge }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
        active
          ? 'bg-orange-500/10 text-orange-600'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
      }`}
    >
      <span className="relative">
        {icon}
        {badge != null && badge > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[16px] h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      {label}
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full" />
      )}
    </button>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
