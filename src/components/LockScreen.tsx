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
    <div id="lockscreen-root" className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-y-auto relative">
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
        className="w-full max-w-md bg-slate-900 border border-slate-800/80 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 bg-slate-950/60 rounded-2xl flex items-center justify-center border border-slate-800 text-emerald-400 mb-4 shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
            {loading ? (
              <Unlock className="h-7 w-7 text-emerald-400 animate-pulse" />
            ) : (
              <Vault className="h-7 w-7 text-emerald-400" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans sm:text-2xl">
            {isSetupMode ? t.lock_setupState : t.lock_decryptState}
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 max-w-xs leading-relaxed">
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

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 leading-relaxed max-w-[280px] mx-auto font-medium">
            <span>{t.lock_aesgcmText}</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
