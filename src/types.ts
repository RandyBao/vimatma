export type VaultCategory = 'bank' | 'social' | 'web' | 'note' | 'wallet' | 'ewallet' | 'phoneapp' | 'sheet' | string;

export interface ReminderConfig {
  enabled: boolean;
  date: string;               // Định dạng YYYY-MM-DD
  type: 'once' | 'yearly';    // Ví dụ: Nhắc một lần hoặc nhắc hàng năm (sinh nhật, ngày kỷ niệm)
  message?: string;           // Lời nhắc tùy chỉnh (ví dụ: "Sinh nhật vợ yêu ❤️")
}

export interface BaseVaultEntry {
  id: string;
  category: VaultCategory;
  title: string;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  isFavorite?: boolean;
  reminder?: ReminderConfig;   // Cấu hình nhắc nhở
}

export interface BankAccountEntry extends BaseVaultEntry {
  category: 'bank';
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  pin?: string;
  username?: string;
  password?: string;
  branch?: string;
}

export interface SocialMediaEntry extends BaseVaultEntry {
  category: 'social';
  platformName: string;
  username: string; // e.g., email or phone
  password?: string;
  url?: string;
}

export interface WebAccountEntry extends BaseVaultEntry {
  category: 'web';
  websiteUrl: string;
  username: string;
  password?: string;
}

export interface SecureNoteEntry extends BaseVaultEntry {
  category: 'note';
  content: string;
}

export interface WalletEntry extends BaseVaultEntry {
  category: 'wallet';
  walletName: string;       // e.g. Binance, Metamask, Ledger
  walletType: 'exchange' | 'dex_app' | 'hardware'; // Sàn, Ví phần mềm, Ví lạnh
  address?: string;         // Wallet Address (usually public)
  username?: string;        // E.g., Binance login email
  password?: string;        // Binance login password or wallet passcode
  seedPhrase?: string;      // Recovery code (12-24 words)
  privateKey?: string;      // Private key code
  apiKey?: string;          // API key
  apiSecret?: string;       // API Secret
}

export interface EWalletEntry extends BaseVaultEntry {
  category: 'ewallet';
  ewalletName: string;      // e.g. Momo, Zalopay, ShopeePay
  phoneNumber: string;       // Phone number or account identifier
  accountHolder?: string;    // Owner's full name
  pin?: string;              // PIN code (usually 4-6 digits)
  password?: string;         // App password (if different from PIN)
  linkedBank?: string;       // Linked bank accounts or credit cards
}

export interface PhoneAppEntry extends BaseVaultEntry {
  category: 'phoneapp';
  appName: string;          // e.g. VNeID, VNeTraffic, eTax Mobile
  username?: string;        // SĐT hoặc Số CCCD đăng nhập
  password?: string;        // Mật khẩu đăng nhập
  passcode?: string;        // Mã PIN / Passcode bảo mật (vd: 6 chữ số)
  nationalId?: string;      // Số căn cước công dân CCCD (nếu có)
  email?: string;           // Email liên kết (nếu có)
}

export interface GoogleSheetEntry extends BaseVaultEntry {
  category: 'sheet';
  headers: string[];        // Danh sách tiêu đề cột (vd: ["Tiêu đề", "Giá trị", "Chú thích"])
  rows: string[][];         // Ma trận các dòng (vd: [["A1", "B1", "C1"], ["A2", "B2", "C2"]])
  
  // Custom Google account integration attributes
  isIntegrated?: boolean;    // Có đồng bộ với Google Sheet hay không
  syncMode?: 'public' | 'private'; // Chế độ: public sheet hoặc private sheet
  spreadsheetId?: string;    // ID của file Google Sheet
  spreadsheetUrl?: string;   // URL đầy đủ của Google Sheet
  googleAccount?: string;    // Email tài khoản liên kết (nếu có)
  googleClientId?: string;   // Google OAuth Client ID tùy cấu hình (nếu có)
  lastSyncTime?: number;     // Thời điểm đồng bộ cuối cùng
}

export type VaultEntry = BankAccountEntry | SocialMediaEntry | WebAccountEntry | SecureNoteEntry | WalletEntry | EWalletEntry | PhoneAppEntry | GoogleSheetEntry;

export interface EncryptedDatabase {
  salt: string;          // hex string
  verification: string;  // encrypted "VAULT_VERIFIED" string
  encryptedEntries: string; // encrypted JSON of VaultEntry[]
  lastUpdated: number;
}

export interface CustomCategory {
  id: string;
  label: string;
  count?: number;
  iconType: 'bank' | 'social' | 'web' | 'wallet' | 'ewallet' | 'phoneapp' | 'sheet' | 'note';
}
