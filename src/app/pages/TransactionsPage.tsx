import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserAccounts, getAccountTransactions } from '../utils/storage';
import type { Account, Transaction } from '../types/banking';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, DollarSign, Search } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      const userAccounts = getUserAccounts(user.id);
      setAccounts(userAccounts);
    }
  }, [user]);

  useEffect(() => {
    if (selectedAccountId === 'all') {
      const allTransactions: Transaction[] = [];
      accounts.forEach(account => {
        const accountTransactions = getAccountTransactions(account.id);
        allTransactions.push(...accountTransactions);
      });
      const sorted = allTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTransactions(sorted);
    } else {
      const accountTransactions = getAccountTransactions(selectedAccountId);
      setTransactions(accountTransactions);
    }
  }, [selectedAccountId, accounts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-5 w-5 text-green-600" />;
      case 'withdrawal':
      case 'transfer':
      case 'payment':
        return <ArrowUpRight className="h-5 w-5 text-red-600" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.sender?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Transactions
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          View and manage your transaction history
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Account Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Account</label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountType.charAt(0).toUpperCase() +
                        account.accountType.slice(1)}{" "}
                      - ****{account.accountNumber.slice(-4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Transaction History
          </CardTitle>
        </CardHeader>

        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions found
            </p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Left Side */}
                  <div className="flex gap-3 sm:gap-4 flex-1">
                    <div className="p-2 sm:p-3 bg-gray-100 rounded-full shrink-0">
                      {getTransactionIcon(transaction.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {transaction.description}
                        </p>

                        <Badge
                          className={`${getStatusColor(
                            transaction.status
                          )} text-xs`}
                        >
                          {transaction.status}
                        </Badge>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 mt-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                        </p>

                        {transaction.recipient && (
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            To: {transaction.recipient}
                          </p>
                        )}

                        {transaction.sender && (
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            From: {transaction.sender}
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        {transaction.type}
                      </p>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="text-left sm:text-right border-t pt-3 sm:pt-0 sm:border-0 sm:ml-4">
                    <p
                      className={`text-base sm:text-lg font-semibold ${
                        transaction.type === "deposit"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "deposit" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>

                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Balance: {formatCurrency(transaction.balance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
