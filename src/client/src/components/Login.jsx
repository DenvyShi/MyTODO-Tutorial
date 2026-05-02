import { useState } from 'react';
import { CheckCircle, User, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

export default function Login({ onLogin, loading, error }) {
  const [username, setUsername] = useState('guest');
  const [password, setPassword] = useState('guest');
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-blue-600 p-3 rounded-xl">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center mb-2">{t('app.title')}</h1>
          <p className="text-slate-400 text-center mb-8">{t('app.subtitle')}</p>

          {/* Guest credentials hint */}
          <div className="mb-6 bg-slate-700/50 border border-slate-600/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">{t('login.demoHint')}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>{t('login.username')}: <code className="bg-slate-600 px-1.5 py-0.5 rounded text-blue-300">guest</code></span>
              <span>{t('login.password')}: <code className="bg-slate-600 px-1.5 py-0.5 rounded text-blue-300">guest</code></span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">{t('login.demoNote')}</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t('login.username')}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={t('login.usernamePlaceholder')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder={t('login.passwordPlaceholder')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-medium transition"
              >
                {loading ? t('login.loggingIn') : t('login.loginButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
