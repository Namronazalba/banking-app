import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { User, Mail, Phone, MapPin, Lock, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handlePinChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (currentPin !== user?.pin) {
      setPinError('Current PIN is incorrect');
      return;
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setPinError('New PIN must be exactly 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('New PIN and confirmation do not match');
      return;
    }

    // In a real app, this would update the user's PIN in the database
    toast.success('PIN updated successfully');
    setShowPinChange(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account information and security</p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-600">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {user.firstName} {user.lastName}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Member since {formatDate(user.createdAt)}
              </CardDescription>
            </div>
            <Button
              variant={isEditing ? 'outline' : 'default'}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your account details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="firstName"
                  value={user.firstName}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="lastName"
                  value={user.lastName}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                value={user.phone}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="address"
                value={user.address}
                disabled={!isEditing}
                className="pl-10"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-4">
              <Button className="flex-1">Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            <CardTitle>Security Settings</CardTitle>
          </div>
          <CardDescription>Manage your account security and authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Lock className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium">Change PIN</p>
                <p className="text-sm text-muted-foreground">
                  Update your 4-digit security PIN
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPinChange(!showPinChange)}
            >
              {showPinChange ? 'Cancel' : 'Change PIN'}
            </Button>
          </div>

          {showPinChange && (
            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardContent className="pt-6">
                <form onSubmit={handlePinChange} className="space-y-4">
                  {pinError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{pinError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="currentPin">Current PIN</Label>
                    <Input
                      id="currentPin"
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPin">New PIN</Label>
                    <Input
                      id="newPin"
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPin">Confirm New PIN</Label>
                    <Input
                      id="confirmPin"
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Update PIN
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Security Information</h4>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Last Login</span>
                <span className="font-medium">Today at {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Account Created</span>
                <span className="font-medium">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Two-Factor Authentication</span>
                <span className="font-medium text-yellow-600">Not Enabled</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
