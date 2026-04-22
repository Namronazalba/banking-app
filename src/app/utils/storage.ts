import type { User, Account, Transaction, PendingDeposit } from '../types/banking';

const STORAGE_KEYS = {
  USERS: 'banking_users',
  ACCOUNTS: 'banking_accounts',
  TRANSACTIONS: 'banking_transactions',
  CURRENT_USER: 'banking_current_user',
  PENDING_DEPOSITS: 'banking_pending_deposits',
};

// User operations
export const getUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const findUserByEmail = (email: string): User | undefined => {
  const users = getUsers();
  return users.find(u => u.email === email);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

// Account operations
export const getAccounts = (): Account[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
  return data ? JSON.parse(data) : [];
};

export const getUserAccounts = (userId: string): Account[] => {
  const accounts = getAccounts();
  return accounts.filter(acc => acc.userId === userId);
};

export const saveAccount = (account: Account): void => {
  const accounts = getAccounts();
  accounts.push(account);
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
};

export const updateAccount = (accountId: string, updates: Partial<Account>): void => {
  const accounts = getAccounts();
  const index = accounts.findIndex(acc => acc.id === accountId);
  if (index !== -1) {
    accounts[index] = { ...accounts[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }
};

export const getAccountById = (accountId: string): Account | undefined => {
  const accounts = getAccounts();
  return accounts.find(acc => acc.id === accountId);
};

// Transaction operations
export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
};

export const getAccountTransactions = (accountId: string): Transaction[] => {
  const transactions = getTransactions();
  return transactions.filter(txn => txn.accountId === accountId).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const saveTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  transactions.push(transaction);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
};

// Generate unique IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const generateAccountNumber = (): string => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Pending Deposit operations
export const getPendingDeposits = (): PendingDeposit[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PENDING_DEPOSITS);
  return data ? JSON.parse(data) : [];
};

export const savePendingDeposit = (deposit: PendingDeposit): void => {
  const deposits = getPendingDeposits();
  deposits.push(deposit);
  localStorage.setItem(STORAGE_KEYS.PENDING_DEPOSITS, JSON.stringify(deposits));
};

export const updatePendingDeposit = (depositId: string, updates: Partial<PendingDeposit>): void => {
  const deposits = getPendingDeposits();
  const index = deposits.findIndex(dep => dep.id === depositId);
  if (index !== -1) {
    deposits[index] = { ...deposits[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.PENDING_DEPOSITS, JSON.stringify(deposits));
  }
};

export const getPendingDepositById = (depositId: string): PendingDeposit | undefined => {
  const deposits = getPendingDeposits();
  return deposits.find(dep => dep.id === depositId);
};

export const getUserPendingDeposits = (userId: string): PendingDeposit[] => {
  const deposits = getPendingDeposits();
  return deposits.filter(dep => dep.userId === userId).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getAllPendingDeposits = (): PendingDeposit[] => {
  const deposits = getPendingDeposits();
  return deposits.filter(dep => dep.status === 'pending').sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

// Initialize demo data if needed
export const initializeDemoData = (userId: string): void => {
  const existingAccounts = getUserAccounts(userId);
  
  if (existingAccounts.length === 0) {
    // Create default accounts
    const checkingAccount: Account = {
      id: generateId(),
      userId,
      accountNumber: generateAccountNumber(),
      accountType: 'checking',
      balance: 5420.50,
      currency: 'PHP',
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    
    const savingsAccount: Account = {
      id: generateId(),
      userId,
      accountNumber: generateAccountNumber(),
      accountType: 'savings',
      balance: 12850.75,
      currency: 'PHP',
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    
    saveAccount(checkingAccount);
    saveAccount(savingsAccount);
    
    // Create some demo transactions
    const demoTransactions: Transaction[] = [
      {
        id: generateId(),
        accountId: checkingAccount.id,
        type: 'deposit',
        amount: 2500,
        balance: 5420.50,
        description: 'Salary Deposit',
        status: 'completed',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: generateId(),
        accountId: checkingAccount.id,
        type: 'withdrawal',
        amount: 120.30,
        balance: 2920.50,
        description: 'ATM Withdrawal',
        status: 'completed',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: generateId(),
        accountId: checkingAccount.id,
        type: 'payment',
        amount: 89.99,
        balance: 3040.80,
        description: 'Electric Bill',
        recipient: 'City Power Co.',
        status: 'completed',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: generateId(),
        accountId: savingsAccount.id,
        type: 'deposit',
        amount: 1000,
        balance: 12850.75,
        description: 'Monthly Savings',
        status: 'completed',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    
    demoTransactions.forEach(saveTransaction);
  }
};