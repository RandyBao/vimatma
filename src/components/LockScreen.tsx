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

          <h1 className="text-[23px] font-extrabold tracking-tight text-white font-sans transition-all leading-snug">
            {isSetupMode ? t.lock_setupState : (lang === 'vi' ? 'VÍ MẬT MÃ' : 'SAVE CODE')}
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
            
            {/* Round LBM Logo Badge with integrated view/click action */}
            <div className="flex flex-col items-center justify-center py-1">
              <div 
                onClick={() => {
                  if (!lbmIsRevealed && !lbmIsInputting) {
                    setLbmIsInputting(true);
                  }
                }}
                title={lang === 'vi' ? 'Bấm để xem Email Tác Giả' : 'Click to view Creator Email'}
                className="group relative h-14 w-14 rounded-full bg-slate-950/90 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_18px_rgba(52,211,153,0.35)] hover:shadow-[0_0_28px_rgba(52,211,153,0.6)] transform hover:scale-110 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Standard LBM label */}
                <span className="text-sm font-black text-emerald-400 tracking-wider group-hover:opacity-10 transition-opacity duration-200">
                  LBM
                </span>
                {/* Embedded hover button */}
                <span className="absolute inset-0 flex flex-col items-center justify-center text-[7.5px] font-black uppercase text-emerald-400 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-205 leading-none px-1 select-none">
                  <span>{lang === 'vi' ? 'Xem' : 'View'}</span>
                  <span className="mt-0.5 font-mono text-[7px]">EMAIL</span>
                </span>
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

            <div className="text-[8px] text-slate-600 leading-relaxed pt-1.5 border-t border-slate-850/60 font-medium">
              {lang === 'vi' 
                ? 'Ứng dụng đã được ghi nhận bản quyền tác giả chính thức.' 
                : 'Registered authentic software. All rights reserved.'}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
