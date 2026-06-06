import React, { useState, useEffect } from 'react';
import { Vault, Lock, Unlock, Eye, EyeOff, AlertTriangle, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { encryptText, decryptText, generateRandomHexSalt } from '../utils/crypto';
import { EncryptedDatabase } from '../types';
import { LangType, translations } from '../utils/lang';

interface LockScreenProps {
  onUnlock: (password: string, decryptedEntries: any[]) => void;
  lang: LangType;
  onLangChange: (lang: LangType) => void;
}

export default function LockScreen({ onUnlock, lang, onLangChange }: LockScreenProps) {
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme] = useState(() => localStorage.getItem('secure_vault_theme') || 'slate');
  
  // States for interactive LBM Author Badge
  const [lbmUserEmail, setLbmUserEmail] = useState('');
  const [lbmIsRevealed, setLbmIsRevealed] = useState(false);
  const [lbmIsInputting, setLbmIsInputting] = useState(false);
  const [lbmErrorMsg, setLbmErrorMsg] = useState('');

  const handleLbmReveal = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lbmUserEmail.trim())) {
      setLbmErrorMsg(lang === 'vi' ? 'Vui lòng nhập Email hợp lệ!' : 'Please enter a valid email address!');
      return;
    }
    setLbmErrorMsg('');
    setLbmIsRevealed(true);
    setLbmIsInputting(false);
  };

  const t = translations[lang];

  useEffect(() => {
    const savedDb = localStorage.getItem('secure_vault_db');
    if (!savedDb) {
      setIsSetupMode(true);
    } else {
      setIsSetupMode(false);
    }
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);

    if (password.length < 8) {
      setErrorCode(t.lock_masterMinError);
      return;
    }
    if (password !== confirmPassword) {
      setErrorCode(t.lock_masterMatchError);
      return;
    }

    setLoading(true);
    try {
      // Create fresh DB structure
      const salt = generateRandomHexSalt();
      
      // Encrypt verification token
      const verificationStr = 'VAULT_VERIFIED';
      const encryptedVerification = await encryptText(verificationStr, password, salt);
      
      // Encrypt empty entries Array
      const encryptedEntries = await encryptText(JSON.stringify([]), password, salt);

      const newDb: EncryptedDatabase = {
        salt,
        verification: encryptedVerification,
        encryptedEntries,
        lastUpdated: Date.now(),
      };

      localStorage.setItem('secure_vault_db', JSON.stringify(newDb));
      onUnlock(password, []);
    } catch (err) {
      console.error(err);
      setErrorCode(t.lock_failSetupSystem);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);

    if (!password) {
      setErrorCode(t.lock_enterMasterAlert);
      return;
    }

    setLoading(true);
    // Add small artificial timeout for sleek unlocking animation feel
    await new Promise((r) => setTimeout(r, 600));

    try {
      const savedDbStr = localStorage.getItem('secure_vault_db');
      if (!savedDbStr) {
        setErrorCode(t.lock_failDbNotFound);
        setIsSetupMode(true);
        setLoading(false);
        return;
      }

      const db: EncryptedDatabase = JSON.parse(savedDbStr);
      
      // Try decrypting verification token first
      const decryptedVerification = await decryptText(db.verification, password, db.salt);
      
      if (decryptedVerification === 'VAULT_VERIFIED') {
        // Correct password! Decrypt items
        const decryptedEntriesStr = await decryptText(db.encryptedEntries, password, db.salt);
        const decryptedEntries = JSON.parse(decryptedEntriesStr);
        onUnlock(password, decryptedEntries);
      } else {
        setErrorCode(t.lock_incorrectPwd);
      }
    } catch (err) {
      console.error(err);
      setErrorCode(t.lock_genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="lockscreen-root" data-theme={theme} className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-y-auto relative">
      {/* Absolute ambient background light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Floating Language Switcher at the top right */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-lg">
        <Globe className="h-4 w-4 text-slate-450 shrink-0 ml-1" />
        <button
          type="button"
          onClick={() => onLangChange('vi')}
          className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            lang === 'vi' 
              ? 'bg-emerald-500 text-slate-950 shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          VN
        </button>
        <button
          type="button"
          onClick={() => onLangChange('en')}
          className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            lang === 'en' 
              ? 'bg-emerald-500 text-slate-950 shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          EN
        </button>
      </div>

      <motion.div
        id="lockscreen-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm bg-slate-900 border border-slate-800/80 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          {/* Custom Shield + Crossed Swords Icon with flashing neon border matching the shield shape */}
          <div className="relative mb-6 h-36 w-36 flex items-center justify-center">
            
            {/* Real SVG rendering nested shield shape outline as a bright flashing glowing border */}
            <svg viewBox="0 0 100 100" className={`w-full h-full text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.25)] ${loading ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              
              {/* Shield Outer Glow (Wide, soft) */}
              <path 
                d="M50,28 L74,32 C74,52 66,72 50,82 C34,72 26,52 26,32 L50,28 Z" 
                stroke="currentColor" 
                strokeWidth="11" 
                className="opacity-15 blur-md text-emerald-400 pointer-events-none"
                fill="none"
              />

              {/* Shield Secondary Glow (Medium, bright) */}
              <path 
                d="M50,28 L74,32 C74,52 66,72 50,82 C34,72 26,52 26,32 L50,28 Z" 
                stroke="currentColor" 
                strokeWidth="6" 
                className="opacity-35 blur-xs text-emerald-400 pointer-events-none animate-pulse"
                fill="none"
              />

              {/* Sharp outer shield border acting as the primary outline */}
              <path 
                d="M50,28 L74,32 C74,52 66,72 50,82 C34,72 26,52 26,32 L50,28 Z" 
                stroke="currentColor" 
                strokeWidth="2.8" 
                className="text-emerald-400 pointer-events-none"
                fill="none"
              />

              {/* Sword 1: Top-Left to Bottom-Right (pointing down) */}
              <line x1="33" y1="33" x2="80" y2="80" stroke="currentColor" strokeWidth="2.2" className="text-emerald-500/70" />
              <line x1="25" y1="41" x2="41" y2="25" stroke="currentColor" strokeWidth="3" className="text-emerald-500/70" />
              <line x1="33" y1="33" x2="20" y2="20" stroke="currentColor" strokeWidth="4.2" className="text-emerald-500/70" />
              <circle cx="20" cy="20" r="2.5" fill="currentColor" className="text-emerald-500" />

              {/* Sword 2: Top-Right to Bottom-Left (pointing down) */}
              <line x1="67" y1="33" x2="20" y2="80" stroke="currentColor" strokeWidth="2.2" className="text-emerald-500/70" />
              <line x1="59" y1="25" x2="75" y2="41" stroke="currentColor" strokeWidth="3" className="text-emerald-500/70" />
              <line x1="67" y1="33" x2="80" y2="20" stroke="currentColor" strokeWidth="4.2" className="text-emerald-500/70" />
              <circle cx="80" cy="20" r="2.5" fill="currentColor" className="text-emerald-500" />

              {/* Shield Base (Centered solid dark background so swords appear behind it) */}
              <path 
                d="M50,28 L74,32 C74,52 66,72 50,82 C34,72 26,52 26,32 L50,28 Z" 
                fill="#020617" 
                stroke="currentColor" 
                strokeWidth="3.2" 
                className="fill-slate-950/95 text-emerald-400"
              />
              
              {/* Inner Shield detail */}
              <path 
                d="M50,36 L64,39 C64,52 58,66 50,74 C42,66 36,52 36,39 L50,36 Z" 
                stroke="currentColor" 
                strokeWidth="1.8" 
                className="opacity-90 text-emerald-500"
              />

              {/* Center secure core keyhole */}
              <circle cx="50" cy="50" r="3.5" fill="currentColor" className="text-emerald-400" />
              <path d="M50,53 L48,61 L52,61 Z" fill="currentColor" className="text-emerald-400" />
            </svg>
          </div>

          <h1 className="text-[23px] font-extrabold tracking-tight text-white font-sans transition-all leading-snug flex items-center justify-center gap-2">
            <span>{isSetupMode ? t.lock_setupState : (lang === 'vi' ? 'VÍ MẬT MÃ' : 'SAVE CODE')}</span>
            <span className="bg-emerald-500/10 text-emerald-400 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono align-middle">
              v1.1
            </span>
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 max-w-[280px] leading-relaxed">
            {isSetupMode ? t.lock_setupSubtext : t.lock_decryptSubtext}
          </p>
        </div>

        {isSetupMode ? (
          <form id="setup-form" onSubmit={handleSetup} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                {t.lock_masterPwdLabel}
              </label>
              <div className="relative">
                <input
                  id="new-master-pwd"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t.lock_enterMinText}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-mono tracking-wide placeholder-slate-650 outline-none transition-all"
                />
                <Lock className="absolute left-3.5 top-4 h-4 w-4 text-slate-500" />
                <button
                  id="toggle-setup-pwd-btn"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-4 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                {t.lock_masterConfirmLabel}
              </label>
              <div className="relative">
                <input
                  id="confirm-master-pwd"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t.lock_enterConfirmPlc}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-mono tracking-wide placeholder-slate-650 outline-none transition-all"
                />
                <Lock className="absolute left-3.5 top-4 h-4 w-4 text-slate-500" />
              </div>
            </div>

            {/* Crucial Security Warning */}
            <div className="flex gap-3 bg-amber-500/15 border border-amber-500/25 p-4 rounded-xl text-amber-300 text-xs leading-relaxed">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold">{t.lock_warningTitle}</span> {t.lock_warningText}
              </div>
            </div>

            {errorCode && (
              <div id="setup-err-msg" className="text-rose-400 text-xs font-semibold text-center bg-rose-500/10 border border-rose-500/20 py-3 px-3 rounded-xl">
                {errorCode}
              </div>
            )}

            <button
              id="submit-setup-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              {loading ? t.lock_setupLoading : t.lock_initButton}
            </button>
          </form>
        ) : (
          <form id="login-form" onSubmit={handleLogin} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-300">
                  {t.lock_decryptState}
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-master-pwd"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t.lock_enterPwdPlc}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-mono tracking-wide placeholder-slate-650 outline-none transition-all"
                  autoFocus
                />
                <Lock className="absolute left-3.5 top-4.5 h-4 w-4 text-slate-500" />
                <button
                  id="toggle-login-pwd-btn"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-4.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorCode && (
              <div id="login-err-msg" className="text-rose-400 text-xs font-semibold text-center bg-rose-500/10 border border-rose-500/20 py-3 px-3 rounded-xl">
                {errorCode}
              </div>
            )}

            <button
              id="submit-login-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              {loading ? t.lock_decryptLoading : t.lock_loginButton}
            </button>

            <div className="text-center pt-2">
              <button
                id="reset-vault-link"
                type="button"
                onClick={() => {
                  if (window.confirm(t.lock_resetWarning)) {
                    localStorage.removeItem('secure_vault_db');
                    setIsSetupMode(true);
                    setPassword('');
                    setConfirmPassword('');
                    setErrorCode(null);
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer font-medium"
              >
                {t.lock_resetLink}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center space-y-3.5">
          <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1.5 leading-relaxed max-w-[280px] mx-auto font-medium">
            <span>{t.lock_aesgcmText}</span>
          </p>
          <div className="pt-2 text-center space-y-3 relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-lg pointer-events-none"></div>
            
            {/* High-Fidelity Shield LBM Logo Badge with integrated view/click action */}
            <div className="flex flex-col items-center justify-center py-1">
              <div 
                onClick={() => {
                  if (!lbmIsRevealed && !lbmIsInputting) {
                    setLbmIsInputting(true);
                  }
                }}
                title={lang === 'vi' ? 'Bấm để xem Email Tác Giả' : 'Click to view Creator Email'}
                className="group relative w-20 h-20 flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer drop-shadow-[0_0_12px_rgba(244,63,94,0.45)] hover:drop-shadow-[0_0_22px_rgba(244,63,94,0.75)]"
              >
                <svg 
                  viewBox="0 0 100 100" 
                  className="w-20 h-20 overflow-visible transition-transform duration-300 pointer-events-none"
                >
                  {/* Left sword (behind shield) */}
                  <line x1="16" y1="16" x2="32" y2="32" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                  <line x1="26" y1="36" x2="36" y2="26" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="16" cy="16" r="3.5" fill="#f43f5e" />
                  <line x1="32" y1="32" x2="84" y2="84" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />

                  {/* Right sword (behind shield) */}
                  <line x1="84" y1="16" x2="68" y2="32" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                  <line x1="74" y1="36" x2="64" y2="26" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="84" cy="16" r="3.5" fill="#f43f5e" />
                  <line x1="68" y1="32" x2="16" y2="84" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />

                  {/* Shield Body (has opaque slate-950 fill to mask the crossed blades) */}
                  <path 
                    d="M 50 18 C 30 18, 25 22, 24 25 C 23 48, 26 71, 50 86 C 74 71, 77 48, 76 25 C 75 22, 70 18, 50 18 Z" 
                    fill="#020617" 
                    stroke="#f43f5e" 
                    strokeWidth="3.5" 
                    strokeLinejoin="round"
                  />
                  
                  {/* Shield Inner Decorative Outline */}
                  <path 
                    d="M 50 24 C 36 24, 32 26, 31 28 C 29 46, 31 66, 50 78 C 69 66, 71 46, 69 28 C 68 26, 62 24, 50 24 Z" 
                    fill="none" 
                    stroke="#f43f5e" 
                    strokeWidth="1.2" 
                    opacity="0.55" 
                  />

                  {/* Dynamic Content Group inside Shield */}
                  {/* Keyhole state (shown by default, fades out on hover) */}
                  <g className="transition-opacity duration-300 group-hover:opacity-0">
                    <circle cx="50" cy="46" r="4.5" fill="#f43f5e" />
                    <path d="M 47.5 48.5 L 45 61 L 55 61 L 52.5 48.5 Z" fill="#f43f5e" />
                  </g>

                  {/* LBM / Action state (fades in on hover) */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-305">
                    <text 
                      x="50" 
                      y="48" 
                      textAnchor="middle" 
                      className="fill-rose-400 font-extrabold text-[12px] tracking-wider select-none font-sans"
                    >
                      LBM
                    </text>
                    <text 
                      x="50" 
                      y="59" 
                      textAnchor="middle" 
                      className="fill-slate-400 font-bold text-[7px] tracking-widest select-none font-sans"
                    >
                      {lang === 'vi' ? 'XEM' : 'VIEW'}
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {lbmIsInputting && !lbmIsRevealed && (
              <form onSubmit={handleLbmReveal} className="space-y-1.5 max-w-[155px] mx-auto animate-fade-in text-left">
                <p className="text-[8.5px] text-slate-500 leading-normal text-center">
                  {lang === 'vi' 
                    ? 'Nhập Email để xác thực & xem:' 
                    : 'Enter email to verify & view:'}
                </p>
                <div className="flex gap-1.5 border-b border-slate-800 focus-within:border-emerald-505 transition-all pb-1">
                  <input
                    type="email"
                    required
                    value={lbmUserEmail}
                    onChange={(e) => {
                      setLbmUserEmail(e.target.value);
                      if (lbmErrorMsg) setLbmErrorMsg('');
                    }}
                    placeholder="email..."
                    className="flex-1 min-w-0 bg-transparent text-[10px] text-white placeholder-slate-700 outline-none font-sans"
                  />
                  <button
                    type="submit"
                    className="text-emerald-400 hover:text-emerald-350 text-[10px] font-bold transition-all cursor-pointer"
                  >
                    ✓
                  </button>
                </div>
                {lbmErrorMsg && (
                  <p className="text-[8px] text-rose-450 font-medium text-center">{lbmErrorMsg}</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setLbmIsInputting(false);
                    setLbmErrorMsg('');
                  }}
                  className="text-[8px] text-slate-550 hover:text-slate-450 underline block mx-auto font-medium"
                >
                  {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
              </form>
            )}

            {lbmIsRevealed && (
              <div className="space-y-1 animate-fade-in-down max-w-[180px] mx-auto">
                <span className="text-[10px] text-emerald-405 font-mono select-all font-black tracking-wide block">
                  locbaomedia23@gmail.com
                </span>
                <span className="text-[7.5px] text-emerald-400/90 font-extrabold uppercase tracking-widest flex items-center justify-center gap-1">
                  <span>✓ {lang === 'vi' ? 'ĐÃ CHỨNG THỰC TÁC QUYỀN' : 'VERIFIED'}</span>
                </span>
              </div>
            )}

            <div className="text-[8px] text-slate-500 leading-relaxed pt-1.5 border-t border-slate-850/60 font-semibold font-mono flex items-center justify-between gap-2">
              <span>{lang === 'vi' ? 'Phiên bản v1.1 (Phát hành chính thức)' : 'Release version v1.1 (Official Edition)'}</span>
              <span className="text-slate-650 font-normal">© 2026 LBM</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
