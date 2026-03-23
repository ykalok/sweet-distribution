import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Mail, Lock, User, Building2, ArrowRight } from 'lucide-react';

export const Register = ({ onToggle }: { onToggle: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName, companyName);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl shadow-orange-500/10 overflow-hidden animate-scale-in">
        {/* Left decorative panel */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-40 h-40 border-2 border-white rounded-full" />
            <div className="absolute bottom-10 left-10 w-56 h-56 border-2 border-white rounded-full" />
          </div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">🎉</span>
            </div>
            <h2 className="text-3xl font-bold mb-3">Join Our Network</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Register your business and get access to premium sweets at wholesale prices. Start ordering in minutes.
            </p>
          </div>
          <div className="relative z-10 space-y-3">
            {['No minimum commitment', 'Competitive wholesale prices', 'Dedicated support team'].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/90">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">✓</span>
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Right form panel */}
        <div className="p-8 md:p-10">
          <div className="mb-6">
            <div className="md:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <span className="text-xl">🍬</span>
              </div>
              <span className="font-bold text-lg text-gray-900">B2B Sweets</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
            <p className="text-gray-500 text-sm">Get started with B2B Sweet Distribution</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm animate-scale-in flex items-center gap-2">
                <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs">!</span>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                  className="input-field pl-10" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="companyName" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  className="input-field pl-10" placeholder="Your Company Ltd (optional)" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="input-field pl-10" placeholder="you@company.com" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="input-field pl-10" placeholder="Minimum 6 characters" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <button onClick={onToggle} className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
