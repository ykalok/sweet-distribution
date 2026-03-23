import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Search, Loader2, PackageOpen, Sparkles } from 'lucide-react';
import { productApi, cartApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  stockQuantity: number;
  minOrderQuantity: number;
  isActive: boolean;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
}

const SWEET_EMOJIS: Record<string, string> = {
  'Traditional': '🍯',
  'Premium': '✨',
  'Dry Sweets': '🍪',
  'Chocolates': '🍫',
};

const ProductSkeleton = () => (
  <div className="card overflow-hidden">
    <div className="h-44 skeleton" />
    <div className="p-5 space-y-3">
      <div className="h-4 w-20 skeleton" />
      <div className="h-5 w-3/4 skeleton" />
      <div className="h-4 w-full skeleton" />
      <div className="h-10 skeleton" />
    </div>
  </div>
);

export const Products = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCart();
  }, [profile?.id]);

  const fetchProducts = async (category?: string) => {
    setLoading(true);
    try {
      const { data } = await productApi.getAll(category === 'all' ? undefined : category, 0, 100);
      setProducts(data.data?.content || data.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const { data } = await productApi.getCategories();
      setCategories(data.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchCart = async () => {
    try {
      const { data } = await cartApi.get();
      setCartItems(data.data || []);
    } catch { /* not logged in or empty */ }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery('');
    fetchProducts(category);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchProducts(selectedCategory === 'all' ? undefined : selectedCategory);
      return;
    }
    setSearching(true);
    try {
      const { data } = await productApi.search(searchQuery, 0, 100);
      setProducts(data.data?.content || data.data || []);
    } catch (err) {
      console.error('Error searching:', err);
    }
    setSearching(false);
  };

  const getCartQuantity = (productId: string) =>
    cartItems.find(c => c.productId === productId)?.quantity || 0;

  const getCartItemId = (productId: string) =>
    cartItems.find(c => c.productId === productId)?.id;

  const addToCart = async (product: Product) => {
    setAddingToCart(product.id);
    try {
      await cartApi.add(product.id, product.minOrderQuantity);
      fetchCart();
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
    setAddingToCart(null);
  };

  const updateQuantity = async (productId: string, change: number, minQty: number) => {
    const itemId = getCartItemId(productId);
    const current = getCartQuantity(productId);
    const newQty = current + change;
    if (!itemId) return;
    try {
      if (newQty < minQty) {
        await cartApi.remove(itemId);
      } else {
        await cartApi.updateQuantity(itemId, newQty);
      }
      fetchCart();
    } catch (err) {
      console.error('Error updating cart:', err);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity < product.minOrderQuantity) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
    if (product.stockQuantity < product.minOrderQuantity * 3) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700' };
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
          <Sparkles className="w-6 h-6 text-amber-500" />
        </div>
        <p className="text-gray-500">Discover our premium selection of traditional Indian sweets</p>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search sweets..."
            className="input-field pl-10"
          />
        </div>
        <button onClick={handleSearch} disabled={searching}
          className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {/* Categories */}
      <div className="mb-8 flex gap-2 flex-wrap animate-slide-up" style={{ animationDelay: '0.15s' }}>
        {['all', ...categories].map(category => (
          <button key={category} onClick={() => handleCategoryChange(category)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? 'btn-primary shadow-md'
                : 'btn-secondary'
            }`}>
            {category !== 'all' && <span className="mr-1.5">{SWEET_EMOJIS[category] || '🍬'}</span>}
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <PackageOpen className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product, i) => {
            const inCart = getCartQuantity(product.id);
            const stock = getStockStatus(product);
            return (
              <div key={product.id}
                className="card overflow-hidden group animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="h-44 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center relative overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                      {SWEET_EMOJIS[product.category] || '🍬'}
                    </span>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`badge ${stock.color}`}>{stock.label}</span>
                  </div>
                  {inCart > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="badge bg-orange-500 text-white shadow-lg">
                        {inCart} in cart
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <span className="badge bg-gray-100 text-gray-600 mb-2">{product.category}</span>
                  <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">{product.description}</p>

                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                      <span className="text-xs text-gray-400 ml-1">/unit</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">Min: {product.minOrderQuantity}</span>
                  </div>

                  {inCart > 0 ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(product.id, -product.minOrderQuantity, product.minOrderQuantity)}
                        className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="flex-1 text-center font-semibold text-sm text-gray-900">{inCart}</span>
                      <button onClick={() => updateQuantity(product.id, product.minOrderQuantity, product.minOrderQuantity)}
                        className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(product)}
                      disabled={product.stockQuantity < product.minOrderQuantity || addingToCart === product.id}
                      className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
                      {addingToCart === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><ShoppingCart className="w-4 h-4" /> Add to Cart</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
