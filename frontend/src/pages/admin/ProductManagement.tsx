import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Pencil, Trash2, Save, X, Loader2, PackageOpen, ImagePlus, Crop, Check } from 'lucide-react';

interface Product {
  id: string; name: string; description: string; price: number; category: string;
  imageUrl: string | null; stockQuantity: number; minOrderQuantity: number; unit: string; isActive: boolean;
}

interface CropBox { x: number; y: number; w: number; h: number; }

const ASPECT = 16 / 9;

const ImageCropper = ({ src, onDone, onCancel }: { src: string; onDone: (b64: string) => void; onCancel: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const drag = useRef<{ startX: number; startY: number; origCrop: CropBox } | null>(null);

  const draw = useCallback((c: CropBox) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    // rule-of-thirds grid
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(c.x + (c.w / 3) * i, c.y); ctx.lineTo(c.x + (c.w / 3) * i, c.y + c.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c.x, c.y + (c.h / 3) * i); ctx.lineTo(c.x + c.w, c.y + (c.h / 3) * i); ctx.stroke();
    }
    // corner handles
    const hs = 8;
    ctx.fillStyle = '#f97316';
    [[c.x, c.y], [c.x + c.w - hs, c.y], [c.x, c.y + c.h - hs], [c.x + c.w - hs, c.y + c.h - hs]].forEach(([hx, hy]) => {
      ctx.fillRect(hx, hy, hs, hs);
    });
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current!;
      const maxW = Math.min(640, window.innerWidth - 64);
      const scale = maxW / img.naturalWidth;
      canvas.width = maxW;
      canvas.height = img.naturalHeight * scale;
      const cw = canvas.width * 0.8;
      const ch = cw / ASPECT;
      const initCrop = { x: (canvas.width - cw) / 2, y: (canvas.height - ch) / 2, w: cw, h: ch };
      setCrop(initCrop);
      draw(initCrop);
      setReady(true);
    };
    img.src = src;
  }, [src, draw]);

  useEffect(() => { if (ready) draw(crop); }, [crop, ready, draw]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const { x, y } = getPos(e, canvas);
    drag.current = { startX: x, startY: y, origCrop: { ...crop } };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current) return;
    const canvas = canvasRef.current!;
    const { x, y } = getPos(e, canvas);
    const dx = x - drag.current.startX;
    const dy = y - drag.current.startY;
    const { origCrop } = drag.current;
    const newX = Math.max(0, Math.min(canvas.width - origCrop.w, origCrop.x + dx));
    const newY = Math.max(0, Math.min(canvas.height - origCrop.h, origCrop.y + dy));
    setCrop(prev => ({ ...prev, x: newX, y: newY }));
  };

  const onMouseUp = () => { drag.current = null; };

  const handleConfirm = () => {
    const canvas = document.createElement('canvas');
    const img = imgRef.current!;
    const displayCanvas = canvasRef.current!;
    const scaleX = img.naturalWidth / displayCanvas.width;
    const scaleY = img.naturalHeight / displayCanvas.height;
    canvas.width = crop.w * scaleX;
    canvas.height = crop.h * scaleY;
    canvas.getContext('2d')!.drawImage(img, crop.x * scaleX, crop.y * scaleY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    onDone(canvas.toDataURL('image/jpeg', 0.92));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-gray-900 text-sm">Crop Image</span>
            <span className="text-xs text-gray-400">Drag to reposition</span>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-4">
          <canvas
            ref={canvasRef}
            className="w-full rounded-xl cursor-move select-none"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>
        <div className="flex gap-3 p-4 pt-0">
          <button onClick={onCancel} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
          <button onClick={handleConfirm} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductManagement = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', imageUrl: '',
    stockQuantity: '', minOrderQuantity: '1', unit: 'UNIT', isActive: true,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProducts(); }, [profile?.id]);

  const fetchProducts = async () => {
    try {
      const { data } = await adminApi.getProducts(0, 100);
      setProducts(data.data?.content || data.data || []);
    } catch (err) { console.error('Error fetching products:', err); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: formData.name, description: formData.description,
      price: parseFloat(formData.price), category: formData.category,
      imageUrl: formData.imageUrl || undefined,
      stockQuantity: parseInt(formData.stockQuantity),
      minOrderQuantity: parseInt(formData.minOrderQuantity),
      unit: formData.unit,
      isActive: formData.isActive,
    };
    try {
      if (editingId) await adminApi.updateProduct(editingId, payload);
      else await adminApi.createProduct(payload);
      resetForm();
      fetchProducts();
    } catch (err) { console.error('Error saving product:', err); }
    setSaving(false);
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name, description: p.description, price: p.price.toString(),
      category: p.category, imageUrl: p.imageUrl || '',
      stockQuantity: p.stockQuantity.toString(), minOrderQuantity: p.minOrderQuantity.toString(),
      unit: p.unit || 'UNIT',
      isActive: p.isActive,
    });
    setImagePreview(p.imageUrl || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try { await adminApi.deleteProduct(id); fetchProducts(); }
    catch (err) { console.error('Error deleting product:', err); }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', category: '', imageUrl: '', stockQuantity: '', minOrderQuantity: '1', unit: 'UNIT', isActive: true });
    setImagePreview(null);
    setCropSrc(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleImageFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setCropSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropDone = (b64: string) => {
    setImagePreview(b64);
    setFormData(prev => ({ ...prev, imageUrl: b64 }));
    setCropSrc(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" /><span className="font-medium">Loading products...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} products</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Crop Modal */}
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onDone={handleCropDone}
          onCancel={() => { setCropSrc(null); if (fileRef.current) fileRef.current.value = ''; }}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={resetForm} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹)</label>
                  <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={3} className="input-field resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock</label>
                  <input type="number" value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Order Qty</label>
                  <input type="number" value={formData.minOrderQuantity} onChange={(e) => setFormData({ ...formData, minOrderQuantity: e.target.value })} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sell By</label>
                  <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="input-field">
                    <option value="UNIT">Unit</option>
                    <option value="KG">KG</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleImageFile(e.target.files?.[0] ?? null)}
                  />
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img src={imagePreview} alt="preview" className="w-full h-40 object-cover" />
                      <button
                        type="button"
                        onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, imageUrl: '' })); if (fileRef.current) fileRef.current.value = ''; }}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-xs rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <ImagePlus className="w-3.5 h-3.5" /> Change
                      </button>
                      <button
                        type="button"
                        onClick={() => imagePreview && setCropSrc(imagePreview)}
                        className="absolute bottom-2 left-2 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-xs rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Crop className="w-3.5 h-3.5" /> Crop
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 hover:border-orange-400 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      <ImagePlus className="w-7 h-7" />
                      <span className="text-sm font-medium">Click to upload image</span>
                      <span className="text-xs">PNG, JPG, WEBP from your drive</span>
                    </button>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20">
          <PackageOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No products yet</h3>
          <p className="text-gray-500 text-sm">Add your first product to get started</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product, i) => (
            <div key={product.id} className="card overflow-hidden group animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <div className="h-36 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center relative">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">🍬</span>
                )}
                <span className={`absolute top-2.5 right-2.5 badge ${product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="p-4">
                <span className="badge bg-gray-100 text-gray-500 mb-1.5">{product.category}</span>
                <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{product.name}</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                  <span className="text-xs text-gray-400">Stock: {product.stockQuantity} {product.unit === 'KG' ? 'kg' : 'units'}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(product)}
                    className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1.5">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleDelete(product.id)}
                    className="flex-1 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
