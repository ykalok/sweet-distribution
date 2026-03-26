import { useState, useEffect } from 'react';
import { Pencil, X, Check, Facebook, Instagram, Twitter, Youtube, Linkedin, Phone, Mail, Info } from 'lucide-react';

interface SiteInfo {
  companyName: string;
  aboutUs: string;
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  linkedin: string;
}

const STORAGE_KEY = 'site_info';

const DEFAULT: SiteInfo = {
  companyName: 'F&C Sweet',
  aboutUs: 'Premium sweet supplier for businesses across India. We offer a wide range of traditional and modern sweets with bulk pricing and reliable delivery.',
  phone: '+91 98765 43210',
  email: 'contact@sweetdistribution.com',
  facebook: '',
  instagram: '',
  twitter: '',
  youtube: '',
  linkedin: '',
};

function load(): SiteInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT;
}

function save(info: SiteInfo) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
}

const SOCIAL_ICONS: { key: keyof SiteInfo; Icon: React.ElementType; label: string; color: string }[] = [
  { key: 'facebook',  Icon: Facebook,  label: 'Facebook',  color: 'hover:text-blue-600' },
  { key: 'instagram', Icon: Instagram, label: 'Instagram', color: 'hover:text-pink-500' },
  { key: 'twitter',   Icon: Twitter,   label: 'Twitter',   color: 'hover:text-sky-500' },
  { key: 'youtube',   Icon: Youtube,   label: 'YouTube',   color: 'hover:text-red-600' },
  { key: 'linkedin',  Icon: Linkedin,  label: 'LinkedIn',  color: 'hover:text-blue-700' },
];

interface Props { isAdmin: boolean; }

export function SiteInfoFooter({ isAdmin }: Props) {
  const [info, setInfo] = useState<SiteInfo>(load);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SiteInfo>(info);

  useEffect(() => {
    const h = () => setInfo(load());
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);

  const openEdit = () => { setDraft(info); setEditing(true); };

  const handleSave = () => {
    save(draft);
    setInfo(draft);
    setEditing(false);
  };

  const activeSocials = SOCIAL_ICONS.filter(s => info[s.key]);

  return (
    <>
      <footer className="mt-16 border-t border-gray-200/50 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* About */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🍬</span>
                <h3 className="font-bold text-gray-900">{info.companyName}</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{info.aboutUs}</p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-orange-500" /> Contact Us
              </h4>
              <div className="space-y-2">
                {info.phone && (
                  <a href={`tel:${info.phone}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors">
                    <Phone className="w-4 h-4 shrink-0" /> {info.phone}
                  </a>
                )}
                {info.email && (
                  <a href={`mailto:${info.email}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors">
                    <Mail className="w-4 h-4 shrink-0" /> {info.email}
                  </a>
                )}
              </div>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Follow Us</h4>
              {activeSocials.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {activeSocials.map(({ key, Icon, label, color }) => (
                    <a
                      key={key}
                      href={info[key] as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={label}
                      className={`p-2 rounded-xl bg-gray-100 text-gray-500 ${color} hover:bg-gray-200 transition-all duration-200`}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No social links added yet.</p>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} {info.companyName} · Premium Sweets for Your Business
            </p>
            {isAdmin && (
              <button
                onClick={openEdit}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-600 transition-colors"
              >
                <Pencil className="w-3 h-3" /> Edit footer info
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* ── ADMIN EDIT MODAL ── */}
      {editing && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Edit Footer Info</h2>
              <button onClick={() => setEditing(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <Field label="Company Name" value={draft.companyName} onChange={v => setDraft(d => ({ ...d, companyName: v }))} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">About Us</label>
                <textarea
                  rows={3}
                  value={draft.aboutUs}
                  onChange={e => setDraft(d => ({ ...d, aboutUs: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone" value={draft.phone} onChange={v => setDraft(d => ({ ...d, phone: v }))} placeholder="+91 98765 43210" />
                <Field label="Email" value={draft.email} onChange={v => setDraft(d => ({ ...d, email: v }))} placeholder="contact@example.com" />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Social Media Links</p>
                <div className="space-y-3">
                  {SOCIAL_ICONS.map(({ key, Icon, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <input
                        type="url"
                        value={draft[key] as string}
                        onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                        placeholder={`${label} URL (optional)`}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
    </div>
  );
}
