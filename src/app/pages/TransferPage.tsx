import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { getUserAccounts, getAccountById, updateAccount, saveTransaction, generateId } from '../utils/storage';
import type { Account } from '../types/banking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertCircle, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

export const TransferPage: React.FC = () => {
  const { user, verifyPin } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccountId, setFromAccountId] = useState('');
  const [transferType, setTransferType] = useState<'internal' | 'external'>('internal');
  const [toAccountId, setToAccountId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (user) {
      const userAccounts = getUserAccounts(user.id);
      setAccounts(userAccounts);
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const fromAccount = getAccountById(fromAccountId);
    if (!fromAccount) {
      setError('Source account not found');
      return;
    }

    if (transferAmount > fromAccount.balance) {
      setError('Insufficient funds');
      return;
    }

    if (transferType === 'internal' && !toAccountId) {
      setError('Please select a destination account');
      return;
    }

    if (transferType === 'external' && (!recipientName || !recipientAccount)) {
      setError('Please provide recipient details');
      return;
    }

    // Show PIN dialog for verification
    setShowPinDialog(true);
  };

  const handlePinSubmit = () => {
    setPinError('');

    if (!verifyPin(pin)) {
      setPinError('Invalid PIN');
      return;
    }

    // Process transfer
    processTransfer();
  };

  const processTransfer = () => {
    const transferAmount = parseFloat(amount);
    const fromAccount = getAccountById(fromAccountId)!;

    // Update source account balance
    const newFromBalance = fromAccount.balance - transferAmount;
    updateAccount(fromAccountId, { balance: newFromBalance });

    // Create transaction for source account
    saveTransaction({
      id: generateId(),
      accountId: fromAccountId,
      type: 'transfer',
      amount: transferAmount,
      balance: newFromBalance,
      description: description || `Transfer to ${transferType === 'internal' ? 'account' : recipientName}`,
      recipient: transferType === 'internal' ? toAccountId : recipientName,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    if (transferType === 'internal') {
      // Update destination account balance
      const toAccount = getAccountById(toAccountId)!;
      const newToBalance = toAccount.balance + transferAmount;
      updateAccount(toAccountId, { balance: newToBalance });

      // Create transaction for destination account
      saveTransaction({
        id: generateId(),
        accountId: toAccountId,
        type: 'deposit',
        amount: transferAmount,
        balance: newToBalance,
        description: description || 'Internal transfer received',
        sender: fromAccountId,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
    }

    setShowPinDialog(false);
    toast.success('Transfer completed successfully!');
    
    // Reset form and navigate
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const selectedFromAccount = accounts.find(acc => acc.id === fromAccountId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transfer Money</h1>
        <p className="text-gray-600 mt-1">Send money to your accounts or others</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ArrowRightLeft className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>New Transfer</CardTitle>
              <CardDescription>Fill in the details below</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransferSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="from-account">From Account</Label>
              <Select value={fromAccountId} onValueChange={setFromAccountId} required>
                <SelectTrigger id="from-account">
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} - 
                      ****{account.accountNumber.slice(-4)} ({formatCurrency(account.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFromAccount && (
                <p className="text-sm text-muted-foreground">
                  Available balance: {formatCurrency(selectedFromAccount.balance)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Transfer Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={transferType === 'internal' ? 'default' : 'outline'}
                  onClick={() => setTransferType('internal')}
                  className="w-full"
                >
                  Internal Transfer
                </Button>
                <Button
                  type="button"
                  variant={transferType === 'external' ? 'default' : 'outline'}
                  onClick={() => setTransferType('external')}
                  className="w-full"
                >
                  External Transfer
                </Button>
              </div>
            </div>

            {transferType === 'internal' ? (
              <div className="space-y-2">
                <Label htmlFor="to-account">To Account</Label>
                <Select value={toAccountId} onValueChange={setToAccountId} required>
                  <SelectTrigger id="to-account">
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter(acc => acc.id !== fromAccountId)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} - 
                          ****{account.accountNumber.slice(-4)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="recipient-name">Recipient Name</Label>
                  <Input
                    id="recipient-name"
                    placeholder="John Doe"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient-account">Recipient Account Number</Label>
                  <Input
                    id="recipient-account"
                    placeholder="1234567890"
                    value={recipientAccount}
                    onChange={(e) => setRecipientAccount(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="What's this transfer for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Review Transfer
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* PIN Verification Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Your Identity</DialogTitle>
            <DialogDescription>
              Please enter your 4-digit PIN to confirm this transfer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {pinError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{pinError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="font-medium">${amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">To:</span>
                <span className="font-medium">
                  {transferType === 'internal' 
                    ? accounts.find(acc => acc.id === toAccountId)?.accountType 
                    : recipientName}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePinSubmit}>
              Confirm Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
