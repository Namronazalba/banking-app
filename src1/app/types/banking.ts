export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  createdAt: string;
  pin: string; // In real app, this would be hashed
  role?: 'user' | 'admin';
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'credit';
  balance: number;
  currency: string;
  createdAt: string;
  status: 'active' | 'frozen' | 'closed';
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment';
  amount: number;
  balance: number;
  description: string;
  recipient?: string;
  sender?: string;
  status: 'completed' | 'pending' | 'failed' | 'rejected';
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface PendingDeposit {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  description: string;
  qrCode: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<boolean>;
  logout: () => void;
  verifyPin: (pin: string) => boolean;
}