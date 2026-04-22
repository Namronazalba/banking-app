import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllPendingDeposits,
  getPendingDepositById,
  updatePendingDeposit,
  getAccountById,
  updateAccount,
  saveTransaction,
  generateId,
  getUsers,
} from '../utils/storage';
import type { PendingDeposit } from '../types/banking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  ShieldCheck,
  QrCode,
  Clock,
  CheckCircle,
  XCircle,
  ScanLine,
  AlertCircle,
  LogOut,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import QrScanner from 'qr-scanner';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<PendingDeposit | null>(null);
  const [scanError, setScanError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    loadPendingDeposits();
  }, []);

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      }
    };
  }, []);

  const loadPendingDeposits = () => {
    const deposits = getAllPendingDeposits();
    setPendingDeposits(deposits);
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

  const startScanning = async () => {
    setShowScanDialog(true);
    setScanError('');

    // Wait for dialog to render
    setTimeout(async () => {
      if (videoRef.current) {
        try {
          const scanner = new QrScanner(
            videoRef.current,
            (result) => {
              handleScanResult(result.data);
            },
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
            }
          );

          scannerRef.current = scanner;
          await scanner.start();
        } catch (err) {
          setScanError('Failed to start camera. Please check permissions.');
          console.error('Scanner error:', err);
        }
      }
    }, 100);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setShowScanDialog(false);
    setScanError('');
  };

  const handleScanResult = (data: string) => {
    try {
      const qrData = JSON.parse(data);
      const deposit = getPendingDepositById(qrData.depositId);

      if (!deposit) {
        setScanError('Deposit not found or already processed');
        return;
      }

      if (deposit.status !== 'pending') {
        setScanError(`This deposit has already been ${deposit.status}`);
        return;
      }

      // Stop scanning and show approval dialog
      stopScanning();
      setSelectedDeposit(deposit);
      setShowApprovalDialog(true);
      toast.success('QR code scanned successfully!');
    } catch (err) {
      setScanError('Invalid QR code format');
    }
  };

  const handleApprove = () => {
    if (!selectedDeposit) return;

    const account = getAccountById(selectedDeposit.accountId);
    if (!account) {
      toast.error('Account not found');
      return;
    }

    // Update account balance
    const newBalance = account.balance + selectedDeposit.amount;
    updateAccount(selectedDeposit.accountId, { balance: newBalance });

    // Create transaction
    saveTransaction({
      id: generateId(),
      accountId: selectedDeposit.accountId,
      type: 'deposit',
      amount: selectedDeposit.amount,
      balance: newBalance,
      description: selectedDeposit.description,
      status: 'completed',
      createdAt: new Date().toISOString(),
      approvedBy: user?.email || 'Admin',
      approvedAt: new Date().toISOString(),
    });

    // Update pending deposit status
    updatePendingDeposit(selectedDeposit.id, {
      status: 'approved',
      approvedBy: user?.email || 'Admin',
      approvedAt: new Date().toISOString(),
    });

    toast.success('Deposit approved successfully!');
    setShowApprovalDialog(false);
    setSelectedDeposit(null);
    loadPendingDeposits();
  };

  const handleReject = () => {
    if (!selectedDeposit) return;

    updatePendingDeposit(selectedDeposit.id, {
      status: 'rejected',
      approvedBy: user?.email || 'Admin',
      approvedAt: new Date().toISOString(),
    });

    toast.error('Deposit rejected');
    setShowApprovalDialog(false);
    setSelectedDeposit(null);
    loadPendingDeposits();
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const totalPendingAmount = pendingDeposits.reduce((sum, dep) => sum + dep.amount, 0);
  const totalUsers = getUsers().filter(u => u.role !== 'admin').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">BankWithNorms Administration</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingDeposits.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending Amount</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPendingAmount)}</div>
              <p className="text-xs text-muted-foreground">To be processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Scan QR Button */}
        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Scan Deposit QR Code</h3>
                <p className="text-purple-100">
                  Use your camera to scan customer deposit requests
                </p>
              </div>
              <Button
                size="lg"
                variant="secondary"
                onClick={startScanning}
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Start Scanner
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Deposits List */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Deposit Requests</CardTitle>
            <CardDescription>Review and approve customer deposits</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingDeposits.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">All caught up!</p>
                <p className="text-sm text-muted-foreground">No pending deposits at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDeposits.map((deposit) => {
                  const account = getAccountById(deposit.accountId);
                  const users = getUsers();
                  const depositUser = users.find(u => u.id === deposit.userId);

                  return (
                    <div
                      key={deposit.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{deposit.description}</p>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Customer: {depositUser?.firstName} {depositUser?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {account
                            ? `${account.accountType.charAt(0).toUpperCase()}${account.accountType.slice(1)} - ****${account.accountNumber.slice(-4)}`
                            : "No account"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Requested: {formatDate(deposit.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">
                          +{formatCurrency(deposit.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* QR Scanner Dialog */}
      <Dialog open={showScanDialog} onOpenChange={(open) => !open && stopScanning()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scan QR Code
            </DialogTitle>
            <DialogDescription>
              Point your camera at the customer's deposit QR code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {scanError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{scanError}</AlertDescription>
              </Alert>
            )}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-white rounded-lg" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ScanLine className="h-4 w-4 animate-pulse" />
              <span>Scanning for QR code...</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={stopScanning}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Deposit Request</DialogTitle>
            <DialogDescription>
              Review the deposit details and approve or reject
            </DialogDescription>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-semibold text-green-600">
                    +{formatCurrency(selectedDeposit.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Description:</span>
                  <span className="font-medium">{selectedDeposit.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Account:</span>
                  <span className="font-medium">
                    {(() => {
                      const account = getAccountById(selectedDeposit.accountId);
                      return account ? `****${account.accountNumber.slice(-4)}` : 'N/A';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Request Time:</span>
                  <span className="font-medium">{formatDate(selectedDeposit.createdAt)}</span>
                </div>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Once approved, the amount will be immediately added to the customer's account.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleReject} className="text-red-600">
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
