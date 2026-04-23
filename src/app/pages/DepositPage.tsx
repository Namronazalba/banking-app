import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { getUserAccounts, getAccountById, savePendingDeposit, generateId, getUserPendingDeposits, updateAccount, saveTransaction } from '../utils/storage';
import type { PendingDeposit, Account } from '../types/banking';
// import type { Account } from '../types/banking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent } from '../components/ui/tabs';
// import { TabsList, TabsTrigger } from '../components/ui/tabs';
import { AlertCircle, ArrowDownLeft, QrCode, Clock, CheckCircle, XCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeLib from 'qrcode';

export const DepositPage: React.FC = () => {
  const { user } = useAuth();
  // const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);

  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [currentDepositId, setCurrentDepositId] = useState('');

  // Quick deposit states
  const [quickAccountId, setQuickAccountId] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [quickError, setQuickError] = useState('');

  useEffect(() => {
    if (user) {
      const userAccounts = getUserAccounts(user.id);
      setAccounts(userAccounts);
      loadPendingDeposits();
    }
  }, [user]);

  const loadPendingDeposits = () => {
    if (user) {
      const deposits = getUserPendingDeposits(user.id);
      setPendingDeposits(deposits);
    }
  };

  const reloadAccounts = () => {
    if (user) {
      const userAccounts = getUserAccounts(user.id);
      setAccounts(userAccounts);
    }
  };

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const account = getAccountById(accountId);
    if (!account) {
      setError('Account not found');
      return;
    }

    if (depositAmount > 10000) {
      setError('Maximum deposit amount is ₱10,000 per transaction');
      return;
    }

    // Generate deposit ID
    const depositId = generateId();

    // Create QR code data
    const qrData = JSON.stringify({
      depositId,
      userId: user?.id,
      accountId,
      amount: depositAmount,
      description: description || 'Cash Deposit',
      timestamp: new Date().toISOString(),
    });

    try {
      // Generate QR code
      const qrCodeDataUrl = await QRCodeLib.toDataURL(qrData, {
        width: 300,
        margin: 2,
      });

      // Save pending deposit
      const pendingDeposit: PendingDeposit = {
        id: depositId,
        userId: user!.id,
        accountId,
        amount: depositAmount,
        description: description || 'Cash Deposit',
        qrCode: qrData,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      savePendingDeposit(pendingDeposit);
      setQrCodeUrl(qrCodeDataUrl);
      setCurrentDepositId(depositId);
      setShowQRDialog(true);
      loadPendingDeposits();

      // Reset form
      setAmount('');
      setDescription('');
      
      toast.success('Deposit request created! Show QR code to admin for approval.');
    } catch (err) {
      setError('Failed to generate QR code');
    }
  };

  const selectedAccount = accounts.find(acc => acc.id === accountId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const showDepositQR = async (deposit: PendingDeposit) => {
    try {
      const qrCodeDataUrl = await QRCodeLib.toDataURL(deposit.qrCode, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(qrCodeDataUrl);
      setCurrentDepositId(deposit.id);
      setShowQRDialog(true);
    } catch (err) {
      toast.error('Failed to generate QR code');
    }
  };

  const handleQuickDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError('');

    const depositAmount = parseFloat(quickAmount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setQuickError('Please enter a valid amount');
      return;
    }

    const account = getAccountById(quickAccountId);
    if (!account) {
      setQuickError('Account not found');
      return;
    }

    if (depositAmount > 10000) {
      setQuickError('Maximum deposit amount is ₱10,000 per transaction');
      return;
    }

    // Update account balance directly
    const newBalance = account.balance + depositAmount;
    updateAccount(quickAccountId, { balance: newBalance });

    // Create transaction record
    saveTransaction({
      id: generateId(),
      accountId: quickAccountId,
      type: 'deposit',
      amount: depositAmount,
      balance: newBalance,
      description: quickDescription || 'Quick Deposit',
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    toast.success(`Successfully deposited ${formatCurrency(depositAmount)} to your account!`);

    // Reset form and reload accounts
    setQuickAmount('');
    setQuickDescription('');
    reloadAccounts();
  };

  const selectedQuickAccount = accounts.find(acc => acc.id === quickAccountId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deposit Money</h1>
        <p className="text-gray-600 mt-1">Choose your deposit method below</p>
      </div>

      <Tabs defaultValue="quick" className="w-full">
        {/* <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick">
            <Zap className="h-4 w-4 mr-2" />
            Quick Deposit (Temporary)
          </TabsTrigger>
          <TabsTrigger value="qr">
            <QrCode className="h-4 w-4 mr-2" />
            QR Deposit (Admin Approval)
          </TabsTrigger>
        </TabsList> */}

        {/* Quick Deposit Tab */}
        <TabsContent value="quick" className="space-y-6">
          <Alert className="bg-yellow-50 border-yellow-200">
            <Zap className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Temporary Feature:</strong> This quick deposit adds money instantly to your account without admin approval. This is a temporary feature for testing purposes.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Quick Deposit Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Zap className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle>Instant Deposit</CardTitle>
                    <CardDescription>Add money instantly without approval</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleQuickDeposit} className="space-y-6">
                  {quickError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{quickError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="quick-account">Deposit To Account</Label>
                    <Select value={quickAccountId} onValueChange={setQuickAccountId} required>
                      <SelectTrigger id="quick-account">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} -
                            ****{account.accountNumber.slice(-4)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedQuickAccount && (
                      <p className="text-sm text-muted-foreground">
                        Current balance: {formatCurrency(selectedQuickAccount.balance)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quick-amount">Deposit Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        ₱
                      </span>
                      <Input
                        id="quick-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={quickAmount}
                        onChange={(e) => setQuickAmount(e.target.value)}
                        className="pl-7"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maximum deposit: ₱10,000 per transaction
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quick-description">Description (Optional)</Label>
                    <Input
                      id="quick-description"
                      placeholder="e.g., Cash deposit, Salary"
                      value={quickDescription}
                      onChange={(e) => setQuickDescription(e.target.value)}
                    />
                  </div>

                  {/* Quick amount buttons */}
                  <div className="space-y-2">
                    <Label>Quick Amounts</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[100, 500, 1000, 5000].map((quickAmountValue) => (
                        <Button
                          key={quickAmountValue}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickAmount(quickAmountValue.toString())}
                        >
                          ₱{quickAmountValue}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700" size="lg">
                    <Zap className="h-4 w-4 mr-2" />
                    Deposit Instantly
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Information Card */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <h4 className="font-medium mb-3 text-yellow-900 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  How Quick Deposit Works
                </h4>
                <ul className="space-y-3 text-sm text-yellow-800">
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">1.</span>
                    <span>Select the account to deposit into</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">2.</span>
                    <span>Enter the amount you want to deposit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">3.</span>
                    <span>Click "Deposit Instantly" - money is added immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">4.</span>
                    <span><strong>No admin approval required</strong> - for temporary use only</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* QR Deposit Tab */}
        <TabsContent value="qr" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
        {/* New Deposit Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <ArrowDownLeft className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>New Deposit Request</CardTitle>
                <CardDescription>Fill in the details below</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDepositSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="account">Deposit To Account</Label>
                <Select value={accountId} onValueChange={setAccountId} required>
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} - 
                        ****{account.accountNumber.slice(-4)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAccount && (
                  <p className="text-sm text-muted-foreground">
                    Current balance: {formatCurrency(selectedAccount.balance)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Deposit Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ₱
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
                <p className="text-xs text-muted-foreground">
                  Maximum deposit: ₱10,000 per transaction
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g., Cash deposit, Check deposit"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Quick amount buttons */}
              <div className="space-y-2">
                <Label>Quick Amounts</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 500, 1000, 5000].map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(quickAmount.toString())}
                    >
                      ${quickAmount}
                    </Button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3 text-blue-900 flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              How Deposit Works
            </h4>
            <ul className="space-y-3 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">1.</span>
                <span>Enter deposit amount and select account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">2.</span>
                <span>Generate QR code for your deposit request</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">3.</span>
                <span>Show QR code to bank admin for scanning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">4.</span>
                <span>Admin approves deposit and funds are added instantly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">5.</span>
                <span>Track deposit status in "Pending Deposits" section below</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
        </TabsContent>
      </Tabs>

      {/* Pending Deposits */}
      {pendingDeposits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Deposit Requests</CardTitle>
            <CardDescription>Track the status of your deposits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingDeposits.map((deposit) => {
                const account = getAccountById(deposit.accountId);
                return (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{deposit.description}</p>
                        {getStatusBadge(deposit.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {account
                          ? `${account.accountType.charAt(0).toUpperCase()}${account.accountType.slice(1)} Account - ****${account.accountNumber.slice(-4)}`
                          : 'No account selected'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(deposit.createdAt)}
                      </p>
                      {deposit.approvedAt && (
                        <p className="text-xs text-green-600 mt-1">
                          Approved on {formatDate(deposit.approvedAt)}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <p className="text-lg font-semibold text-green-600">
                        +{formatCurrency(deposit.amount)}
                      </p>
                      {deposit.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showDepositQR(deposit)}
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          Show QR
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deposit QR Code</DialogTitle>
            <DialogDescription>
              Show this QR code to the bank admin for scanning and approval
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {qrCodeUrl && (
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                <img src={qrCodeUrl} alt="Deposit QR Code" className="w-64 h-64" />
              </div>
            )}
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Deposit ID: {currentDepositId.slice(0, 8)}...</p>
              <p className="text-xs text-muted-foreground">
                This deposit is pending admin approval
              </p>
            </div>
            <Button onClick={() => setShowQRDialog(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
