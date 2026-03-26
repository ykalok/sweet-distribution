import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Megaphone, Pencil, Check, ImagePlus, Trash2, ChevronLeft, ChevronRight, Image } from 'lucide-react';

interface BannerImage {
  id: string;
  src: string;       // base64 data URL
  caption?: string;
}

interface Announcement {
  text: string;
  bgColor: string;
  visible: boolean;
  mode: 'text' | 'image';
  images: BannerImage[];
  autoSlide: boolean;
}

const STORAGE_KEY = 'site_announcement';

const DEFAULT: Announcement = {
  text: '🎉 Free delivery on orders above ₹5,000 this week! Use code SWEET2024',
  bgColor: 'orange',
  visible: true,
  mode: 'text',
  images: [],
  autoSlide: true,
};

const BG_OPTIONS = [
  { value: 'orange', label: 'Orange', cls: 'bg-gradient-to-r from-orange-500 to-amber-500' },
  { value: 'blue',   label: 'Blue',   cls: 'bg-gradient-to-r from-blue-600 to-indigo-600' },
  { value: 'green',  label: 'Green',  cls: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  { value: 'red',    label: 'Red',    cls: 'bg-gradient-to-r from-red-500 to-rose-500' },
  { value: 'purple', label: 'Purple', cls: 'bg-gradient-to-r from-purple-600 to-violet-600' },
];

function getBgClass(color: string) {
  return BG_OPTIONS.find(o => o.value === color)?.cls ?? BG_OPTIONS[0].cls;
}

function load(): Announcement {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT;
}

function save(a: Announcement) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

interface Props { isAdmin: boolean; }

export function AnnouncementBanner({ isAdmin }: Props) {
  const [ann, setAnn] = useState<Announcement>(load);
  const [dismissed, setDismissed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Announcement>(ann);
  const [slide, setSlide] = useState(0);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // sync across tabs
  useEffect(() => {
    const h = () => setAnn(load());
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);

  // auto-slide
  const startSlide = useCallback(() => {
    if (slideTimer.current) clearInterval(slideTimer.current);
    if (ann.mode === 'image' && ann.images.length > 1 && ann.autoSlide) {
      slideTimer.current = setInterval(() => {
        setSlide(s => (s + 1) % ann.images.length);
      }, 4000);
    }
  }, [ann]);

  useEffect(() => {
    startSlide();
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, [startSlide]);

  const prev = () => { setSlide(s => (s - 1 + ann.images.length) % ann.images.length); startSlide(); };
  const next = () => { setSlide(s => (s + 1) % ann.images.length); startSlide(); };

  // image upload
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        const src = e.target?.result as string;
        setDraft(d => ({
          ...d,
          images: [...d.images, { id: uid(), src, caption: '' }],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const openEdit = () => { setDraft(ann); setEditing(true); };

  // hidden / dismissed state
  if (!ann.visible || dismissed) {
    if (isAdmin && !editing) {
      return (
        <div className="flex justify-center py-1.5 bg-gray-100 border-b border-gray-200">
          <button onClick={openEdit} className="text-xs text-gray-500 hover:text-orange-600 flex items-center gap-1.5 transition-colors">
            <Megaphone className="w-3 h-3" /> Manage announcement banner
          </button>
        </div>
      );
    }
    if (!editing) return null;
  }

  return (
    <>
      {/* ── BANNER ── */}
      {ann.visible && !dismissed && (
        ann.mode === 'image' && ann.images.length > 0 ? (
          /* Image banner */
          <div className="relative w-full overflow-hidden bg-black" style={{ height: 220 }}>
            {ann.images.map((img, i) => (
              <div
                key={img.id}
                className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: i === slide ? 1 : 0 }}
              >
                <img src={img.src} alt={img.caption || 'banner'} className="w-full h-full object-cover" />
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-3">
                    <p className="text-white text-sm font-medium">{img.caption}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Arrows */}
            {ann.images.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={next} className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {ann.images.map((_, i) => (
                    <button key={i} onClick={() => { setSlide(i); startSlide(); }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === slide ? 'bg-white w-4' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Top-right controls */}
            <div className="absolute top-2 right-2 flex gap-1">
              {isAdmin && (
                <button onClick={openEdit} className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-lg transition-colors" title="Edit banner">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setDismissed(true)} className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-lg transition-colors" title="Dismiss">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Text banner */
          <div className={`${getBgClass(ann.bgColor)} text-white`}>
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
              <Megaphone className="w-4 h-4 shrink-0 opacity-90" />
              <p className="text-sm font-medium text-center flex-1 leading-snug">{ann.text}</p>
              <div className="flex items-center gap-1 shrink-0">
                {isAdmin && (
                  <button onClick={openEdit} className="p-1 rounded hover:bg-white/20 transition-colors" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => setDismissed(true)} className="p-1 rounded hover:bg-white/20 transition-colors" title="Dismiss">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* ── ADMIN EDIT MODAL ── */}
      {editing && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-500" />
                Announcement Banner
              </h2>
              <button onClick={() => setEditing(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Mode toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['text', 'image'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setDraft(d => ({ ...d, mode: m }))}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        draft.mode === m
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {m === 'text' ? <Megaphone className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                      {m === 'text' ? 'Text Banner' : 'Image Slider'}
                    </button>
                  ))}
                </div>
              </div>

              {/* TEXT mode fields */}
              {draft.mode === 'text' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                    <textarea
                      rows={3}
                      value={draft.text}
                      onChange={e => setDraft(d => ({ ...d, text: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                      placeholder="Enter announcement text..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {BG_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setDraft(d => ({ ...d, bgColor: opt.value }))}
                          className={`${opt.cls} w-8 h-8 rounded-full transition-all ${
                            draft.bgColor === opt.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                          }`}
                          title={opt.label}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Text preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Preview</label>
                    <div className={`${getBgClass(draft.bgColor)} rounded-xl px-4 py-2.5 flex items-center gap-2`}>
                      <Megaphone className="w-4 h-4 text-white shrink-0" />
                      <p className="text-sm text-white font-medium truncate">{draft.text || 'Your message here...'}</p>
                    </div>
                  </div>
                </>
              )}

              {/* IMAGE mode fields */}
              {draft.mode === 'image' && (
                <>
                  {/* Upload area */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Images <span className="text-gray-400 font-normal">({draft.images.length} added)</span>
                    </label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => handleFiles(e.target.files)}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 hover:border-orange-400 rounded-xl py-6 flex flex-col items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      <ImagePlus className="w-7 h-7" />
                      <span className="text-sm font-medium">Click to upload images</span>
                      <span className="text-xs">PNG, JPG, WEBP supported</span>
                    </button>
                  </div>

                  {/* Image list */}
                  {draft.images.length > 0 && (
                    <div className="space-y-3">
                      {draft.images.map((img, i) => (
                        <div key={img.id} className="flex gap-3 items-start bg-gray-50 rounded-xl p-3">
                          <img src={img.src} alt="" className="w-20 h-14 object-cover rounded-lg shrink-0" />
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={img.caption ?? ''}
                              onChange={e => setDraft(d => ({
                                ...d,
                                images: d.images.map((im, idx) => idx === i ? { ...im, caption: e.target.value } : im),
                              }))}
                              placeholder="Caption (optional)"
                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                            <div className="flex gap-1 mt-2">
                              <button
                                disabled={i === 0}
                                onClick={() => setDraft(d => {
                                  const imgs = [...d.images];
                                  [imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]];
                                  return { ...d, images: imgs };
                                })}
                                className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-30 transition-colors"
                              >↑</button>
                              <button
                                disabled={i === draft.images.length - 1}
                                onClick={() => setDraft(d => {
                                  const imgs = [...d.images];
                                  [imgs[i], imgs[i + 1]] = [imgs[i + 1], imgs[i]];
                                  return { ...d, images: imgs };
                                })}
                                className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-30 transition-colors"
                              >↓</button>
                            </div>
                          </div>
                          <button
                            onClick={() => setDraft(d => ({ ...d, images: d.images.filter((_, idx) => idx !== i) }))}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Auto-slide toggle */}
                  {draft.images.length > 1 && (
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Auto-slide (4s)</span>
                      <button
                        onClick={() => setDraft(d => ({ ...d, autoSlide: !d.autoSlide }))}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${draft.autoSlide ? 'bg-orange-500' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${draft.autoSlide ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Visibility toggle */}
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-700">Show banner</span>
                <button
                  onClick={() => setDraft(d => ({ ...d, visible: !d.visible }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${draft.visible ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${draft.visible ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  save(draft);
                  setAnn(draft);
                  setSlide(0);
                  setDismissed(false);
                  setEditing(false);
                }}
                className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
