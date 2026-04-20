import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserAccounts, getAccountTransactions } from '../utils/storage';
import type { Account, Transaction } from '../types/banking';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Wallet, CreditCard, TrendingUp, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user) {
      const userAccounts = getUserAccounts(user.id);
      setAccounts(userAccounts);
      if (userAccounts.length > 0) {
        setSelectedAccount(userAccounts[0]);
      }
    }
  }, [user]);

  useEffect(() => {
    if (selectedAccount) {
      const accountTransactions = getAccountTransactions(selectedAccount.id);
      setTransactions(accountTransactions);
    }
  }, [selectedAccount]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <Wallet className="h-8 w-8 text-blue-600" />;
      case 'savings':
        return <CreditCard className="h-8 w-8 text-green-600" />;
      case 'credit':
        return <CreditCard className="h-8 w-8 text-purple-600" />;
      default:
        return <Wallet className="h-8 w-8" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      frozen: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.active}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' || t.type === 'transfer' || t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Accounts</h1>
        <p className="text-gray-600 mt-1">Manage and view your account details</p>
      </div>

      <Tabs
        value={selectedAccount?.id}
        onValueChange={(value) => {
          const account = accounts.find(acc => acc.id === value);
          if (account) setSelectedAccount(account);
        }}
      >
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <TabsTrigger key={account.id} value={account.id}>
              {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {accounts.map((account) => (
          <TabsContent key={account.id} value={account.id} className="space-y-6">
            {/* Account Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      {getAccountIcon(account.accountType)}
                    </div>
                    <div>
                      <CardTitle className="capitalize">
                        {account.accountType} Account
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Account Number: ****{account.accountNumber.slice(-4)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(account.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-4xl font-bold text-gray-900 mt-1">
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Account Type</p>
                      <p className="font-medium mt-1 capitalize">{account.accountType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Currency</p>
                      <p className="font-medium mt-1">{account.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Opened On</p>
                      <p className="font-medium mt-1">{formatDate(account.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Full Account Number</p>
                      <p className="font-medium mt-1">{account.accountNumber}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                  <ArrowDownLeft className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalDeposits)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transactions.filter(t => t.type === 'deposit').length} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalWithdrawals)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transactions.filter(t => t.type !== 'deposit').length} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Change</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalDeposits - totalWithdrawals)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All time
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No transactions yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {transactions.slice(0, 10).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between pb-4 border-b last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'deposit' 
                              ? 'bg-green-100' 
                              : 'bg-red-100'
                          }`}>
                            {transaction.type === 'deposit' ? (
                              <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'deposit' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {transaction.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
