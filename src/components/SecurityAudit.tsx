import React, { useState, useMemo } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, AlertTriangle, Fingerprint, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { VaultEntry } from '../types';
import { translations, LangType } from '../utils/lang';

interface SecurityAuditProps {
  entries: VaultEntry[];
  isPro: boolean;
  onUpgradeClick: () => void;
  currentLang: LangType;
}

export default function SecurityAudit({ entries, isPro, onUpgradeClick, currentLang }: SecurityAuditProps) {
  const t = translations[currentLang];

  // Common highly-insecure leaked password fragments
  const LEAKED_DICTIONARY = useMemo(() => [
    '123456', '12345678', '123456789', 'password', '12345', '1234567', 'qwerty', 
    'admin', 'iloveyou', 'root', '123123', 'pass@123', '1234'
  ], []);

  // Helper to extract passwords from any category type safely
  const getEntryPassword = (entry: VaultEntry): string => {
    if (entry.category === 'bank') return entry.password || '';
    if (entry.category === 'social') return entry.password || '';
    if (entry.category === 'web') return entry.password || '';
    if (entry.category === 'wallet') return entry.password || '';
    if (entry.category === 'ewallet') return entry.password || '';
    if (entry.category === 'phoneapp') return entry.password || '';
    return '';
  };

  // Run audit processing with genuine logic
  const auditReport = useMemo(() => {
    // Filter to entries that actually hold credentials
    const credentialEntries = entries.filter(e => e.category !== 'note' && e.category !== 'sheet');
    const totalCount = credentialEntries.length;

    const weakEntries: VaultEntry[] = [];
    const leakedEntries: VaultEntry[] = [];
    const missing2faEntries: VaultEntry[] = [];
    
    // Group entries by password values for duplicate/reuse check
    const passwordGroups: { [pwd: string]: VaultEntry[] } = {};

    credentialEntries.forEach(entry => {
      const pwd = getEntryPassword(entry).trim();
      
      // If no password or empty, skipping or adding to weak
      if (!pwd) {
        weakEntries.push(entry);
        return;
      }

      // Check for length < 8 (Weak)
      if (pwd.length < 8) {
        weakEntries.push(entry);
      } else if (/^[0-9]+$/.test(pwd) || /^[a-zA-Z]+$/.test(pwd)) {
        // Only letters or only numbers is also weak
        weakEntries.push(entry);
      }

      // Check leaked sequences
      if (LEAKED_DICTIONARY.includes(pwd.toLowerCase())) {
        leakedEntries.push(entry);
      }

      // Track occurrences of password for reuse checking
      if (!passwordGroups[pwd]) {
        passwordGroups[pwd] = [];
      }
      passwordGroups[pwd].push(entry);

      // Check 2FA registration
      if (!entry.totpSecret) {
        missing2faEntries.push(entry);
      }
    });

    // Extract duplicate records
    const reusedEntries: VaultEntry[] = [];
    Object.values(passwordGroups).forEach(group => {
      if (group.length > 1) {
        reusedEntries.push(...group);
      }
    });

    // Compute healthy items
    let safeComplexityCount = 0;
    let uniqueCount = 0;
    let registered2faCount = 0;

    credentialEntries.forEach(entry => {
      const pwd = getEntryPassword(entry).trim();
      if (pwd && pwd.length >= 8 && !/^[0-9]+$/.test(pwd) && !/^[a-zA-Z]+$/.test(pwd)) {
        safeComplexityCount++;
      }
      if (pwd && passwordGroups[pwd]?.length === 1) {
        uniqueCount++;
      }
      if (entry.totpSecret) {
        registered2faCount++;
      }
    });

    // Max potential points = totalCount * 3 (safe complexity, unique, 2fa)
    const basePotential = totalCount * 3;
    let score = 100;

    if (totalCount > 0) {
      const positiveScore = safeComplexityCount + uniqueCount + registered2faCount;
      score = Math.round(100 * (positiveScore / basePotential));
    }

    // Double check constraints (between 10 and 100)
    score = Math.max(10, Math.min(100, score));

    return {
      totalCount,
      weakEntries,
      reusedEntries,
      missing2faEntries,
      leakedEntries,
      score
    };
  }, [entries, LEAKED_DICTIONARY]);

  const { score, weakEntries, reusedEntries, missing2faEntries, leakedEntries } = auditReport;

  // Visual text & colors for safety status
  const scoreBadge = (() => {
    if (score >= 80) return { color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', label: t.audit_statusSafe };
    if (score >= 50) return { color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5', label: t.audit_statusWarning };
    return { color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5', label: t.audit_statusCritical };
  })();

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner Card containing gauge & general overview */}
      <div className={`p-6 rounded-3xl border ${scoreBadge.border} ${scoreBadge.bg} flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative`}>
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
          <ShieldCheck className="h-48 w-48 text-indigo-400" />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full md:w-auto">
          {/* Circular Score Gauge */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#131326"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e'}
                strokeWidth="7"
                fill="transparent"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * score) / 100}
                className="transition-all duration-1000 ease-out stroke-linecap-round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-black font-mono tracking-tighter text-white">
                {score}
              </span>
              <span className="text-slate-500 text-[10px] block font-semibold">/100</span>
            </div>
          </div>

          <div className="text-center md:text-left space-y-1.5">
            <h3 className="text-lg font-extrabold text-white flex items-center justify-center md:justify-start gap-2">
              <span>{t.audit_score}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 ${scoreBadge.color}`}>
                {scoreBadge.label}
              </span>
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              {t.audit_scoreDesc}
            </p>
          </div>
        </div>

        {/* Sync or upgrade quick highlights */}
        {!isPro && (
          <button
            onClick={onUpgradeClick}
            className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-indigo-500/10 shrink-0 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 shrink-0 animate-pulse text-amber-200" />
            <span>{t.tier_upgradeBtn}</span>
          </button>
        )}
      </div>

      {/* Grid of issues */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card Weak */}
        <div className="bg-slate-900 border border-slate-800/60 p-4.5 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/10 text-yellow-500 rounded-xl">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 capitalize">{t.audit_weak}</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{weakEntries.length}</div>
            <div className="text-[10px] text-slate-500 leading-normal mt-1">{t.audit_weakDesc}</div>
          </div>
        </div>

        {/* Card Reused */}
        <div className="bg-slate-900 border border-slate-800/60 p-4.5 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/10 text-amber-500 rounded-xl">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 capitalize">{t.audit_reused}</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{reusedEntries.length}</div>
            <div className="text-[10px] text-slate-500 leading-normal mt-1">{t.audit_reusedDesc}</div>
          </div>
        </div>

        {/* Card Missing 2FA */}
        <div className="bg-slate-900 border border-slate-800/60 p-4.5 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/10 text-indigo-400 rounded-xl">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 capitalize">{t.audit_no2fa}</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{missing2faEntries.length}</div>
            <div className="text-[10px] text-slate-500 leading-normal mt-1">{t.audit_no2faDesc}</div>
          </div>
        </div>
      </div>

      {/* Main Lists Section */}
      <div className="relative bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
        {isPro ? (
          /* FULL PRO EXPERIENCE - RENDERS REAL VULNERATIVE LISTS */
          <div className="space-y-6">
            {weakEntries.length === 0 && reusedEntries.length === 0 && missing2faEntries.length === 0 ? (
              <div className="text-center py-10 space-y-3.5">
                <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full animate-bounce">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div className="text-base font-bold text-white">{t.audit_perfect}</div>
              </div>
            ) : (
              <div className="space-y-6.5">
                {/* Weak Entries List */}
                {weakEntries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4.5 w-4.5" />
                      <span>{t.audit_listWeak} ({weakEntries.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {weakEntries.map(entry => (
                        <div key={entry.id} className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-2xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-200 text-sm">{entry.title}</div>
                            <div className="text-slate-500 font-mono text-[10px] mt-0.5 uppercase">{entry.category}</div>
                          </div>
                          <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/10 px-2 py-0.5 rounded text-[10px]">
                            {getEntryPassword(entry).length < 8 ? 'Quá ngắn' : 'Bảo mật yếu'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reused Entries List */}
                {reusedEntries.length > 0 && (
                  <div className="pt-2 border-t border-slate-850/60">
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4.5 w-4.5" />
                      <span>{t.audit_listReused} ({reusedEntries.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {reusedEntries.map(entry => (
                        <div key={entry.id} className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-2xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-200 text-sm">{entry.title}</div>
                            <div className="text-slate-500 font-mono text-[10px] mt-0.5 uppercase">{entry.category}</div>
                          </div>
                          <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded text-[10px]">
                            Trùng lặp mật mã
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing 2FA Entries List */}
                {missing2faEntries.length > 0 && (
                  <div className="pt-2 border-t border-slate-850/60">
                    <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2 mb-3">
                      <Fingerprint className="h-4.5 w-4.5" />
                      <span>{t.audit_listNo2fa} ({missing2faEntries.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {missing2faEntries.map(entry => (
                        <div key={entry.id} className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-2xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-200 text-sm">{entry.title}</div>
                            <div className="text-slate-500 font-mono text-[10px] mt-0.5 uppercase">{entry.category}</div>
                          </div>
                          <span className="text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 rounded text-[10px]">
                            Nên bật 2FA/TOTP
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* FREE LOCKED BLUR EXPERIENCED WITH UPGRADE PROMPT overlay */
          <div className="relative py-4 min-h-[190px] overflow-hidden rounded-2xl">
            {/* Blurry mock items */}
            <div className="filter blur-md opacity-20 space-y-4 select-none pointer-events-none">
              <div className="p-4.5 bg-slate-950 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="h-4 w-32 bg-slate-600 rounded"></div>
                  <div className="h-3 w-16 bg-slate-700 rounded mt-1.5"></div>
                </div>
                <div className="h-6 w-24 bg-rose-900 rounded"></div>
              </div>
              <div className="p-4.5 bg-slate-950 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="h-4 w-44 bg-slate-600 rounded"></div>
                  <div className="h-3 w-20 bg-slate-700 rounded mt-1.5"></div>
                </div>
                <div className="h-6 w-20 bg-amber-900 rounded"></div>
              </div>
            </div>

            {/* Glowing locker trigger */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xs p-5 text-center">
              <div className="p-4 bg-gradient-to-tr from-indigo-500/10 to-purple-500/25 border border-indigo-500/20 text-indigo-300 rounded-full shadow-lg shadow-indigo-500/5 mb-3.5">
                <Lock className="h-7 w-7 text-indigo-400" />
              </div>
              <h4 className="text-lg font-black text-white tracking-tight">
                {currentLang === 'vi' ? 'Mở Khóa Báo Cáo Bảo Mật Chi Tiết' : 'Unlock Detailed Security Reports'}
              </h4>
              <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                {t.tier_proBanner}
              </p>
              
              <button
                type="button"
                onClick={onUpgradeClick}
                className="mt-4 px-5 py-2.5 bg-indigo-500 hover:bg-slate-100 ring-1 ring-indigo-400/25 text-slate-950 hover:text-indigo-950 font-bold rounded-xl text-xs tracking-wide transition-all shadow-lg cursor-pointer"
              >
                {t.tier_upgradeBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
