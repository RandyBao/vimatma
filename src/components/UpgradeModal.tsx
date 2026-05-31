import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  X, 
  Sparkles, 
  Check, 
  KeyRound, 
  Fingerprint, 
  Lock, 
  ShieldAlert, 
  Table, 
  RefreshCw, 
  Gift, 
  ArrowLeft, 
  CreditCard, 
  CheckCircle2, 
  DollarSign, 
  LockKeyhole,
  Globe
} from 'lucide-react';
import { translations, LangType } from '../utils/lang';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  onUpgradeSuccess: () => void;
  lang: LangType;
}

type StepType = 'comparison' | 'payment';
type PlanType = 'monthly' | 'annual' | 'lifetime';
type PaymentMethodType = 'paypal' | 'stripe' | 'card' | 'gpay_applepay';

export default function UpgradeModal({ isOpen, onClose, isPro, onUpgradeSuccess, lang }: UpgradeModalProps) {
  const t = translations[lang];
  const [step, setStep] = useState<StepType>('comparison');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('lifetime');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');
  const [couponCode, setCouponCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Card details state (simulated)
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Reset step to comparison when modal is opened
  useEffect(() => {
    if (isOpen) {
      setStep('comparison');
      setSuccess(false);
      setIsProcessing(false);
      setCouponCode('');
      setErrorMsg('');
      // Reset card details
      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();

    // Support VIP2026, FREEPRO, SECURE as special promotional codes
    if (cleanCode === 'VIP2026' || cleanCode === 'FREEPRO' || cleanCode === 'SECURE') {
      activatePro(true);
    } else {
      setErrorMsg(t.tier_invalidCode);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const activatePro = (isVoucher: boolean = false) => {
    setIsProcessing(true);
    setErrorMsg('');
    
    // Simulate payment clearing
    setTimeout(() => {
      setIsProcessing(false);
      localStorage.setItem('secure_vault_pro_active', 'true');
      setSuccess(true);
      setTimeout(() => {
        onUpgradeSuccess();
        setSuccess(false);
        setCouponCode('');
        onClose();
      }, 2500);
    }, 1800);
  };

  const handlePayNow = () => {
    // If voucher code is VIP2026 / FREEPRO / SECURE in input during payment check
    if (couponCode.trim().toUpperCase() === 'VIP2026' || couponCode.trim().toUpperCase() === 'FREEPRO' || couponCode.trim().toUpperCase() === 'SECURE') {
      activatePro(true);
      return;
    }
    
    if (paymentMethod === 'card') {
      if (!cardName.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
        setErrorMsg(lang === 'vi' ? 'Vui lòng nhập đầy đủ thông tin thẻ thanh toán USD!' : 'Please fill out all USD card details!');
        setTimeout(() => setErrorMsg(''), 4000);
        return;
      }
    }
    
    activatePro(false);
  };

  const getPlanPrice = () => {
    switch (selectedPlan) {
      case 'monthly': return '$4.99';
      case 'annual': return '$29.99';
      case 'lifetime': return '$49.99';
    }
  };

  // Compare specifications list
  const compareSpecs = [
    {
      feature: lang === 'vi' ? 'Giới hạn số lượng mật khẩu' : 'Password Capacity',
      free: lang === 'vi' ? 'Giới hạn tối đa 30 mật khẩu' : 'Maximum 30 items',
      pro: lang === 'vi' ? 'Không giới hạn hoàn toàn' : 'Unlimited storage',
      highlight: true
    },
    {
      feature: lang === 'vi' ? 'Trình tạo mật khẩu' : 'Password Generator',
      free: lang === 'vi' ? 'Cơ bản (Độ dài 8-12 ký tự)' : 'Basic (Length 8-12, no symbols)',
      pro: lang === 'vi' ? 'Cao cấp (Độ dài 8-32, ký tự đặc biệt)' : 'Elite (Length 8-32, full options)',
      highlight: false
    },
    {
      feature: lang === 'vi' ? 'Trình xác thực 2-Lớp (2FA/TOTP)' : 'Two-Factor Authenticator (2FA)',
      free: lang === 'vi' ? 'Tối đa 5 tài khoản bảo mật' : 'Max 5 secure accounts',
      pro: lang === 'vi' ? 'Không giới hạn tài khoản độc lập' : 'Unlimited accounts',
      highlight: true
    },
    {
      feature: lang === 'vi' ? 'Đánh giá sức khỏe mật khẩu' : 'Password Health Audit',
      free: lang === 'vi' ? 'Không hỗ trợ báo cáo' : 'Not supported',
      pro: lang === 'vi' ? 'Đầy đủ báo cáo an toàn cấp quân sự' : 'Full reports & Security scores',
      highlight: true
    },
    {
      feature: lang === 'vi' ? 'Chủ đề hiển thị nghệ thuật' : 'App Themes',
      free: lang === 'vi' ? '1 Chủ đề Slate (Dark Space)' : 'Slate theme only',
      pro: lang === 'vi' ? 'Cyberpunk, Emerald, Sapphire... 🎨' : 'Cyberpunk, Emerald, Sapphire... 🎨',
      highlight: false
    },
    {
      feature: lang === 'vi' ? 'Thời gian tự khóa màn hình' : 'Auto-lock timeout',
      free: lang === 'vi' ? 'Mặc định 1 phút (khóa cứng)' : 'Fixed to 1 minute',
      pro: lang === 'vi' ? 'Tùy chỉnh linh hoạt hoặc tắt hẳn' : 'Custom duration / Disable',
      highlight: false
    },
    {
      feature: lang === 'vi' ? 'Ngăn Code bí mật' : 'Secret Drawer (Code)',
      free: lang === 'vi' ? 'Không hỗ trợ dữ liệu bí ẩn' : 'Not supported',
      pro: lang === 'vi' ? 'Hỗ trợ nâng cao đặc quyền' : 'Fully supported with Double-tap',
      highlight: true
    },
    {
      feature: lang === 'vi' ? 'Tùy biến sắp xếp & chế độ xem' : 'Custom Views & Sorting',
      free: lang === 'vi' ? 'Cố định hiển thị dạng lưới' : 'Fixed to Grid view',
      pro: lang === 'vi' ? 'Grid/List, sắp xếp linh hoạt' : 'Toggle Grid/List & Sorting',
      highlight: false
    },
    {
      feature: lang === 'vi' ? 'Liên kết Google Sheet & Google Drive' : 'Spreadsheets & Google Drive',
      free: lang === 'vi' ? 'Không hỗ trợ sao lưu cloud' : 'Not supported',
      pro: lang === 'vi' ? 'Đồng bộ đám mây và Auto-Backup an toàn' : 'Fully sync & manage high-cap files',
      highlight: true
    },
    {
      feature: lang === 'vi' ? 'Đặt lịch nhắc nhở đổi mật khẩu' : 'Reminder Calendars',
      free: lang === 'vi' ? 'Không hỗ trợ' : 'Not supported',
      pro: lang === 'vi' ? 'Cảnh báo ngày đáo hạn định kỳ' : 'Periodical password updates alert',
      highlight: false
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl animate-scale-up max-h-[92vh] flex flex-col">
        
        {/* Glowing Head Decoration */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
        
        {/* Header bar */}
        <div className="p-4 sm:p-5 border-b border-slate-850 flex items-center justify-between shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            {step === 'payment' && !success && (
              <button
                type="button"
                onClick={() => setStep('comparison')}
                className="p-1 px-2 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/80 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer mr-0.5 sm:mr-1"
                title={lang === 'vi' ? 'Quay lại so sánh tính năng' : 'Back to features comparison'}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{lang === 'vi' ? 'Quay lại' : 'Back'}</span>
              </button>
            )}
            <div className="p-1.5 sm:p-2 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
              <Sparkles className="h-4 sm:h-5 w-4 sm:w-5 animate-pulse" />
            </div>
            <div className="text-left">
              <h2 className="text-xs sm:text-sm md:text-base font-black text-white leading-tight">
                {step === 'comparison' 
                  ? (lang === 'vi' ? 'So sánh các tính năng bảo mật - Cập nhật phiên bản cao cấp' : 'Compare Security Features - Upgrade Premium Version')
                  : (lang === 'vi' ? 'Cổng thanh toán bảo mật USD - Kích hoạt bản cao cấp' : 'Secure USD Gateway - Activate Premium Version')
                }
              </h2>
              <p className="text-[9px] sm:text-[10px] text-indigo-400/80 font-bold uppercase tracking-widest font-mono mt-0.5">
                {step === 'comparison' 
                  ? (lang === 'vi' ? 'Tìm giải pháp lưu trữ an toàn nhất' : 'Identify your best secure storage path')
                  : (lang === 'vi' ? 'Mã hóa hoàn tất giao dịch tự động' : 'Automatic military grade order safety')
                }
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body (Scrollable) */}
        <div 
          ref={contentRef}
          className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 text-left select-none scrollbar-thin"
        >
          {isProcessing ? (
            /* Processing Animation View */
            <div className="py-20 text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <RefreshCw className="h-10 sm:h-12 w-10 sm:w-12 text-indigo-500 animate-spin" />
                <LockKeyhole className="h-5 w-5 text-indigo-400 absolute" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
                {lang === 'vi' ? 'Đang xử lý kết nối bảo mật...' : 'Processing Secure Connection...'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-mono">
                {lang === 'vi' ? 'Yêu cầu thanh toán USD đang được mã hóa đầu-cuối qua API 256-bit an toàn.' : 'Enabling global payment API pipeline with custom AES verification chains.'}
              </p>
            </div>
          ) : success ? (
            /* Celebrating Success Screen */
            <div className="py-12 text-center space-y-4 animate-scale-up">
              <div className="inline-flex p-4.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full animate-bounce">
                <ShieldCheck className="h-12 sm:h-14 w-12 sm:w-14" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">PRO UPGRADED SUCCESSFULLY!</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed font-semibold">
                {t.tier_successUpgrade}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {lang === 'vi' ? 'Hệ thống đang tải lại giấy phép...' : 'Securing local device license nodes...'}
              </p>
            </div>
          ) : isPro ? (
            /* Already Upgraded Prompt */
            <div className="py-10 text-center space-y-4">
              <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-400 rounded-full">
                <Sparkles className="h-10 w-10 animate-pulse" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">{t.tier_proActive}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {lang === 'vi' 
                  ? 'Ví của bạn đang hoạt động ở cấp độ PRO ELITE cao nhất. Cảm ơn bạn đã đồng hành!' 
                  : 'Your database is secured under the elite license structure. Thank you for using our app.'}
              </p>
            </div>
          ) : step === 'comparison' ? (
            /* Comparison Step */
            <>
              {/* Features Comparison Matrix Table */}
              <div className="border border-slate-805 bg-slate-950/40 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-xs min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-850/80">
                      <th className="p-3 text-left font-bold text-slate-400">{lang === 'vi' ? 'Tính năng' : 'Feature'}</th>
                      <th className="p-3 text-center font-bold text-slate-500 w-[130px]">{lang === 'vi' ? 'Miễn phí' : 'Free'}</th>
                      <th className="p-3 text-center font-bold text-indigo-400 w-[180px] bg-indigo-500/5">{lang === 'vi' ? 'Bản PRO Cận Vệ 💎' : 'PRO Elite 💎'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 font-sans">
                    {compareSpecs.map((spec, i) => (
                      <tr key={i} className="hover:bg-slate-900/20 transition-colors">
                        <td className="p-3 text-slate-300 font-semibold">{spec.feature}</td>
                        <td className="p-3 text-center text-slate-500">{spec.free}</td>
                        <td className={`p-3 text-center font-bold bg-indigo-500/[0.02] ${spec.highlight ? 'text-indigo-400' : 'text-slate-200'}`}>
                          {spec.pro}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Informative Pro Banner */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <h4 className="font-bold text-slate-300">{lang === 'vi' ? 'Tại sao nên bảo mật với bản PRO?' : 'Why secure your vaults with PRO Edition?'}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {lang === 'vi' 
                      ? 'Nền tảng bảo mật của chúng tôi hỗ trợ mã hóa biệt lập tại chỗ hoàn toàn. Phiên bản PRO cho phép bạn mở khóa tối đa số tài khoản, đồng bộ Google Drive chuẩn cao cấp, hỗ trợ kỹ thuật và bảo trì lâu dài không lo sợ mất dữ liệu.'
                      : 'Our security platform handles offline-first military lock schemes. Pro licensing grants limitless categories, deep health analytics, premium themes, auto backups and continuous priority care.'
                    }
                  </p>
                </div>
              </div>

              {/* ACTION TRIGGER AREA AT COOLDOWN BOTTOM */}
              <div className="pt-4 border-t border-slate-850 flex flex-col items-center gap-3">
                <div className="text-center">
                  <p className="text-xs text-slate-400">
                    {lang === 'vi' ? 'Xem xong tài liệu so sánh? Hãy kích hoạt để trải nghiệm tính năng đặc quyền của Cận vệ Mật mã.' : 'Reviewed the table? Click build path below to access direct gateway.'}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setStep('payment');
                    // Scroll to top of body container
                    if (contentRef.current) {
                      contentRef.current.scrollTop = 0;
                    }
                  }}
                  className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 hover:scale-[1.01] text-white font-black text-sm rounded-2xl transition-all cursor-pointer shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/15 text-center flex items-center justify-center gap-2 group"
                >
                  <Sparkles className="h-4.5 w-4.5 text-white animate-bounce" />
                  <span>{lang === 'vi' ? 'KÍCH HOẠT PRO NGAY 💎' : 'ACTIVATE PRO EDITION 💎'}</span>
                </button>
              </div>
            </>
          ) : (
            /* Payment Step showing Suggested USD methods */
            <div className="space-y-5 animate-slide-up">
              
              {/* Plan Picker Selector */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-left">
                  {lang === 'vi' ? '1. Lựa chọn gói đăng ký (Thanh toán bằng USD)' : '1. Choose Subscription tier (USD Payment)'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Monthly */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('monthly')}
                    className={`p-3.5 border rounded-2xl text-left transition-all ${
                      selectedPlan === 'monthly'
                        ? 'bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-slate-950/50 border-slate-850 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300">{lang === 'vi' ? 'Gói Tháng' : 'Monthly'}</span>
                      {selectedPlan === 'monthly' && <CheckCircle2 className="h-4 w-4 text-indigo-400" />}
                    </div>
                    <p className="text-base font-black text-white mt-1.5">$4.99 <span className="text-[10px] text-slate-500 font-normal">/mo</span></p>
                    <p className="text-[9px] text-slate-500 mt-1">{lang === 'vi' ? 'Hỗ trợ ngắn hạn' : 'Short-term support'}</p>
                  </button>

                  {/* Annual */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('annual')}
                    className={`p-3.5 border rounded-2xl text-left relative transition-all ${
                      selectedPlan === 'annual'
                        ? 'bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-slate-950/50 border-slate-850 hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 px-1.5 py-0.5 bg-indigo-500 text-white font-extrabold text-[8px] rounded uppercase tracking-wider scale-90">SAVE 50%</span>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400">{lang === 'vi' ? 'Gói Năm' : 'Annual Plan'}</span>
                      {selectedPlan === 'annual' && <CheckCircle2 className="h-4 w-4 text-indigo-400" />}
                    </div>
                    <p className="text-base font-black text-white mt-1.5">$29.99 <span className="text-[10px] text-slate-500 font-normal">/yr</span></p>
                    <p className="text-[9px] text-slate-400 mt-1">{lang === 'vi' ? 'Khuyên dùng, tiết kiệm' : 'Best budget balance'}</p>
                  </button>

                  {/* Lifetime */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('lifetime')}
                    className={`p-3.5 border rounded-2xl text-left relative transition-all ${
                      selectedPlan === 'lifetime'
                        ? 'bg-gradient-to-br from-indigo-950/20 to-emerald-950/10 border-emerald-500 shadow-lg ring-1 ring-emerald-500/20'
                        : 'bg-slate-950/50 border-slate-850 hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 px-1.5 py-0.5 bg-emerald-500 text-slate-950 font-black text-[8px] rounded uppercase tracking-wider scale-90">{lang === 'vi' ? 'SỞ HỮU VĨNH VIỄN' : 'BEST DEAL'}</span>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-400">{lang === 'vi' ? 'Trọn Đời' : 'Lifetime License'}</span>
                      {selectedPlan === 'lifetime' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <p className="text-base font-black text-white mt-1.5">$49.99 <span className="text-[9px] text-slate-500 font-normal">{lang === 'vi' ? 'Một lần' : 'One-time'}</span></p>
                    <p className="text-[9px] text-emerald-400/80 font-bold mt-1">{lang === 'vi' ? 'Trọn đời không gia hạn' : 'Own forever, zero monthly fees'}</p>
                  </button>
                </div>
              </div>

              {/* Payment Methods Suggestion (USD Services) */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-left">
                  {lang === 'vi' ? '2. Gợi ý phương thức thanh toán quốc tế' : '2. Integrated USD Payment Gateways'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  
                  {/* Option Stripe Credit Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${
                      paymentMethod === 'card'
                        ? 'bg-slate-950/90 border-indigo-500 text-white shadow'
                        : 'bg-slate-950/30 border-slate-850 text-slate-400 hover:bg-slate-950/50 hover:text-slate-200'
                    }`}
                  >
                    <CreditCard className="h-5 w-5 text-indigo-400 shrink-0" />
                    <span className="text-[11px] font-black tracking-wide font-sans">Credit Card</span>
                    <span className="text-[8px] text-slate-500 font-mono tracking-widest">VISA/AMEX/MC</span>
                  </button>

                  {/* Option PayPal */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${
                      paymentMethod === 'paypal'
                        ? 'bg-slate-950/90 border-yellow-500 text-white shadow'
                        : 'bg-slate-950/30 border-slate-850 text-slate-400 hover:bg-slate-950/50 hover:text-slate-200'
                    }`}
                  >
                    <Globe className="h-5 w-5 text-yellow-500 shrink-0" />
                    <span className="text-[11px] font-black tracking-wide font-sans">PayPal USD</span>
                    <span className="text-[8px] text-yellow-500 font-mono tracking-wider">Fast International</span>
                  </button>

                  {/* Option Stripe */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${
                      paymentMethod === 'stripe'
                        ? 'bg-slate-950/90 border-indigo-400 text-white shadow'
                        : 'bg-slate-950/30 border-slate-850 text-slate-400 hover:bg-slate-950/50 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
                    <span className="text-[11px] font-black tracking-wide font-sans">Stripe Secure</span>
                    <span className="text-[8px] text-teal-400 font-mono tracking-wider">Instant Setup</span>
                  </button>

                  {/* Option Apple/Google Pay */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gpay_applepay')}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${
                      paymentMethod === 'gpay_applepay'
                        ? 'bg-slate-950/90 border-emerald-400 text-white shadow'
                        : 'bg-slate-950/30 border-slate-850 text-slate-400 hover:bg-slate-950/50 hover:text-slate-200'
                    }`}
                  >
                    <Fingerprint className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-black tracking-wide font-sans">1-Click Express</span>
                    <span className="text-[8px] text-slate-500 font-mono">Apple/Google Pay</span>
                  </button>

                </div>
              </div>

              {/* Dynamic form inputs based on selected Payment method */}
              {paymentMethod === 'card' && (
                <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-2xl space-y-3.5 animate-slide-up">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                    {lang === 'vi' ? 'Nhập thông tin thẻ Visa / Mastercard (Ví dụ minh họa)' : 'Secure Card Checkout Details (Simulated)'}
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lang === 'vi' ? 'Họ tên trên thẻ' : 'Cardholder Name'}</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="NUGYEN VAN A"
                        className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 outline-none uppercase font-mono tracking-wider"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lang === 'vi' ? 'Số thẻ tín dụng' : 'Card Number'}</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                        maxLength={19}
                        placeholder="4111 2222 3333 4444"
                        className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 outline-none font-mono tracking-widest"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lang === 'vi' ? 'Ngày hết hạn Mẫu MM/YY' : 'Expiry Date (MM/YY)'}</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        maxLength={5}
                        className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 outline-none font-mono text-center tracking-wider"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CVC / CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        maxLength={3}
                        className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 outline-none font-mono text-center tracking-widest"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod !== 'card' && (
                <div className="p-5 bg-slate-950/60 border border-slate-850 border-dashed rounded-2xl text-center space-y-1.5 animate-slide-up">
                  <div className="h-8.5 w-8.5 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mx-auto">
                    <Check className="h-4.5 w-4.5 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-300">
                    {paymentMethod === 'paypal' && 'PayPal Secure Wallet Option'}
                    {paymentMethod === 'stripe' && 'Instant Stripe Direct Access'}
                    {paymentMethod === 'gpay_applepay' && 'Apple Pay / Google Pay Express Token'}
                  </h4>
                  <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                    {lang === 'vi' 
                      ? 'Nền tảng sẽ kích hoạt thanh toán một chạm USD an toàn qua cổng liên kết quốc tế.' 
                      : 'You will slide directly into automatic redirection and verification tokens on complete button.'}
                  </p>
                </div>
              )}

              {/* Fallback Promo / Coupon Voucher inputs */}
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-3">
                <div className="flex items-start gap-2">
                  <Gift className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider">{lang === 'vi' ? 'Bạn có mã kích hoạt Pro / Voucher?' : 'Have a Promo discount / Voucher Code?'}</h4>
                    <p className="text-[9px] text-slate-500">{lang === 'vi' ? 'Hỗ trợ mã VIP2026 hoặc FREEPRO giảm giá 100% để trải nghiệm ngay lập tức' : 'Enter VIP2026 or FREEPRO to unlock complete access with 100% discount rate'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder={t.tier_codePlc}
                    className="flex-1 bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-[11px] text-white placeholder-slate-600 outline-none transition-all font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'vi' ? 'Áp dụng mã' : 'Apply coupon'}
                  </button>
                </div>
              </div>

              {/* Final Error Prompt Display */}
              {errorMsg && (
                <p className="text-[11px] text-rose-450 font-bold bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 animate-shake text-center">{errorMsg}</p>
              )}

              {/* ACTION TRIGGER BUTTONS IN PAYMENT FORM */}
              <div className="pt-2 border-t border-slate-850 flex flex-col sm:flex-row items-center gap-3 justify-between">
                <div>
                  <p className="text-[10px] text-slate-500">
                    {lang === 'vi' ? 'Giao dịch được bảo mật bởi mã hóa 256-bit đầu-cuối SSL.' : 'All payments are protected with 256-bit secure end-to-end SSL.'}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handlePayNow}
                  className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md select-none text-center"
                >
                  {lang === 'vi' ? `Thanh Toán & Kích Hoạt vĩnh viễn (${getPlanPrice()}) 💳` : `Complete & Activate license (${getPlanPrice()}) 💳`}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
