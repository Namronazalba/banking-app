import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { getUserAccounts, getAccountTransactions } from '../utils/storage';
import { Account, Transaction } from '../types/banking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowUpRight, ArrowDownLeft, CreditCard, Wallet, TrendingUp, DollarSign } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user) {
      const userAccounts = getUserAccounts(user.id);
      setAccounts(userAccounts);

      // Get recent transactions across all accounts
      const allTransactions: Transaction[] = [];
      userAccounts.forEach(account => {
        const transactions = getAccountTransactions(account.id);
        allTransactions.push(...transactions);
      });
      
      // Sort by date and take the 5 most recent
      const sorted = allTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentTransactions(sorted.slice(0, 5));
    }
  }, [user]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'transfer':
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
      case 'payment':
        return <ArrowUpRight className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1">Here's your financial overview</p>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <CardHeader>
          <CardDescription className="text-indigo-100">Total Balance</CardDescription>
          <CardTitle className="text-4xl">{formatCurrency(totalBalance)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-indigo-100">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="text-sm">Across {accounts.length} accounts</span>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Accounts</h2>
          <Link to="/accounts">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {account.accountType} Account
                </CardTitle>
                {account.accountType === 'checking' ? (
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(account.balance)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ****{account.accountNumber.slice(-4)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/deposit" className="block">
            <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg mr-4">
                    <ArrowDownLeft className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Deposit Money</p>
                    <p className="text-sm text-muted-foreground">Add funds to account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/transfer" className="block">
            <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4">
                    <ArrowUpRight className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Transfer Money</p>
                    <p className="text-sm text-muted-foreground">Send to another account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/transactions" className="block">
            <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg mr-4">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">View Transactions</p>
                    <p className="text-sm text-muted-foreground">Check your history</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
          <Link to="/transactions">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-full">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
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
      </div>
    </div>
  );
};