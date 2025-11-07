'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Smartphone, Mail, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { submitWithdrawal } from '@/lib/actions/withdrawal';

interface WithdrawalFormProps {
  availablePoints: number;
  userId: string;
}

export default function WithdrawalForm({ availablePoints, userId }: WithdrawalFormProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'paypal' | 'crypto'>('gcash');
  const [pointsToWithdraw, setPointsToWithdraw] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [bnbPrice, setBnbPrice] = useState<number | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [state, formAction, isPendingAction] = useActionState(submitWithdrawal, { success: false, error: null });

  const [localError, setLocalError] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const POINTS_TO_PHP_RATE = 100;
  const MIN_WITHDRAWAL_POINTS = 500;

  // Fetch current BNB price in PHP
  useEffect(() => {
    const fetchBnbPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=php');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setBnbPrice(data.binancecoin.php);
      } catch (error) {
        console.error('Failed to fetch BNB price:', error);
        setBnbPrice(null);
      }
    };
    fetchBnbPrice();
  }, []);

  // Handle success/error from action state
  useEffect(() => {
    if (state.success) {
      // Reset form immediately
      setPointsToWithdraw('');
      setPaymentDetails('');
      setPaymentMethod('gcash');
      setLocalError('');
      setServerError(null);
      // Show success dialog
      setIsSuccessDialogOpen(true);
    }
  }, [state, router]);

  // Sync server errors to local state
  useEffect(() => {
    if (state.error) {
      setServerError(state.error);
    }
  }, [state.error]);

  // Clear server error on user input changes
  useEffect(() => {
    setServerError(null);
  }, [pointsToWithdraw, paymentDetails, paymentMethod]);

  // Client-side preview validation (sets local error)
  useEffect(() => {
    const points = parseInt(pointsToWithdraw || '0');
    if (isNaN(points) || points < MIN_WITHDRAWAL_POINTS) {
      setLocalError(`Minimum withdrawal is ${MIN_WITHDRAWAL_POINTS} points`);
    } else if (points > availablePoints) {
      setLocalError(`Insufficient points available (only ${availablePoints} available)`);
    } else if (!paymentDetails.trim()) {
      setLocalError('Please enter your payment details');
    } else {
      setLocalError('');
    }
  }, [pointsToWithdraw, availablePoints, paymentDetails]);

  const calculatePayout = (points: number, method: 'gcash' | 'paypal' | 'crypto', bnbPrice: number | null) => {
    if (points <= 0) {
      return method === 'crypto' ? '0.000000 BNB' : '₱0.00';
    }

    const phpAmount = points / POINTS_TO_PHP_RATE;

    if (method === 'crypto') {
      if (bnbPrice === null) {
        return 'Loading...';
      }
      const bnbAmount = phpAmount / bnbPrice;
      return `${bnbAmount.toFixed(6)} BNB`;
    }

    return `₱${phpAmount.toFixed(2)}`;
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'gcash':
        return <Smartphone className="w-4 h-4" />;
      case 'paypal':
        return <Mail className="w-4 h-4" />;
      case 'crypto':
        return <Wallet className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPaymentPlaceholder = () => {
    switch (paymentMethod) {
      case 'gcash':
        return '09XX XXX XXXX';
      case 'paypal':
        return 'your@email.com';
      case 'crypto':
        return '0x...';
      default:
        return '';
    }
  };

  const getPaymentLabel = () => {
    switch (paymentMethod) {
      case 'gcash':
        return 'GCash Number';
      case 'paypal':
        return 'PayPal Email';
      case 'crypto':
        return 'BSC Wallet Address (BEP-20)';
      default:
        return '';
    }
  };

  // Combined error: Local preview + server error
  const error = localError || serverError;

  return (
    <>
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="user_id" value={userId} />
        <input type="hidden" name="payment_method" value={paymentMethod} />
        <input type="hidden" name="points_deducted" value={pointsToWithdraw} />
        <input type="hidden" name="payment_details" value={paymentDetails} />

        {/* Payment Method Selector */}
        <div>
          <Label className="text-slate-300 mb-3 block">Payment Method</Label>
          <div className="grid grid-cols-3 gap-3">
            {(['gcash', 'paypal', 'crypto'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  setPaymentMethod(method);
                  setPaymentDetails('');
                  setLocalError('');
                }}
                disabled={isPendingAction}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  paymentMethod === method
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                } disabled:opacity-50`}
              >
                <div className="flex flex-col items-center gap-2">
                  {getPaymentIcon(method)}
                  <p className="font-semibold text-sm text-white capitalize">{method}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Details */}
        <div>
          <Label htmlFor="payment-details" className="text-slate-300">
            {getPaymentLabel()}
          </Label>
          <Input
            id="payment-details"
            type="text"
            value={paymentDetails}
            onChange={(e) => setPaymentDetails(e.target.value)}
            placeholder={getPaymentPlaceholder()}
            className="mt-2 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
            required
            disabled={isPendingAction}
          />
        </div>

        {/* Points to Withdraw */}
        <div>
          <Label htmlFor="points" className="text-slate-300">
            Points to Withdraw
          </Label>
          <Input
            id="points"
            type="number"
            value={pointsToWithdraw}
            onChange={(e) => setPointsToWithdraw(e.target.value)}
            placeholder={`Min: ${MIN_WITHDRAWAL_POINTS} points`}
            min={MIN_WITHDRAWAL_POINTS}
            max={availablePoints}
            className="mt-2 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
            required
            disabled={isPendingAction}
          />
          <p className="text-xs text-slate-400 mt-2">
            You will receive: {pointsToWithdraw ? calculatePayout(parseInt(pointsToWithdraw), paymentMethod, bnbPrice) : (paymentMethod === 'crypto' ? '0.000000 BNB' : '₱0.00')}
          </p>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-1">
          <p className="text-sm text-blue-300">
            <strong>Conversion Rate:</strong>{' '}
            {paymentMethod === 'crypto'
              ? `100 points = ₱1.00 (equivalent to ~${(1 / (bnbPrice || 1)).toFixed(6)} BNB; 1 BNB ≈ ₱${bnbPrice ? bnbPrice.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'Loading...'})`
              : '100 points = ₱1.00'}
          </p>
          <p className="text-sm text-blue-300">
            <strong>Processing Time:</strong> 1-3 business days
          </p>
          <p className="text-sm text-blue-300">
            <strong>Available:</strong> {availablePoints.toLocaleString()} points
          </p>
        </div>

        {/* Error Message (local or from server action) */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <FormButton 
          disabled={!!error}
          isPending={isPendingAction}
        />
      </form>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={(open) => {
        setIsSuccessDialogOpen(open);
        if (!open) {
          router.refresh(); // Refresh page for updated stats after closing dialog
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Success!
            </DialogTitle>
            <DialogDescription className="text-center">
              Withdrawal request submitted successfully!
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Simplified button without useTransition or onClick interference
function FormButton({ disabled, isPending }: { 
  disabled: boolean; 
  isPending: boolean; 
}) {
  return (
    <Button
      type="submit"
      disabled={disabled || isPending}
      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold h-12 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Submitting...
        </>
      ) : (
        'Request Withdrawal'
      )}
    </Button>
  );
}
