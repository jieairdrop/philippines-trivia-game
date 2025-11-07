'use client';

import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Withdrawal {
  id: string;
  points_deducted: number;
  amount: string | number;
  payment_method: string;
  payment_details: any;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at: string;
  processed_at: string | null;
}

interface WithdrawalHistoryProps {
  withdrawals: Withdrawal[];
}

export default function WithdrawalHistory({ withdrawals }: WithdrawalHistoryProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1";
    
    switch (status) {
      case 'completed':
        return (
          <span className={`${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`}>
            {getStatusIcon(status)}
            Completed
          </span>
        );
      case 'approved':
        return (
          <span className={`${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`}>
            {getStatusIcon(status)}
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className={`${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`}>
            {getStatusIcon(status)}
            Rejected
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`}>
            {getStatusIcon(status)}
            Pending
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentDetails = (details: any, method: string) => {
    if (typeof details === 'string') return details;
    if (typeof details === 'object' && details !== null) {
      return details[method] || JSON.stringify(details);
    }
    return 'N/A';
  };

  if (withdrawals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-slate-400 text-lg">No withdrawal history yet</p>
        <p className="text-slate-500 text-sm mt-1">Your withdrawals will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      {withdrawals.map((withdrawal) => (
        <div
          key={withdrawal.id}
          className="bg-gradient-to-r from-slate-700/30 to-transparent p-4 rounded-lg border border-slate-700/50 hover:border-primary/30 transition-all duration-300 group"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-white font-semibold text-lg">
                ₱{Number(withdrawal.amount).toFixed(2)}
              </p>
              <p className="text-slate-400 text-sm">
                {withdrawal.points_deducted.toLocaleString()} points
              </p>
            </div>
            {getStatusBadge(withdrawal.status)}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Method:</span>
              <span className="text-white font-medium uppercase">{withdrawal.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Details:</span>
              <span className="text-white font-mono text-xs truncate max-w-[180px]">
                {getPaymentDetails(withdrawal.payment_details, withdrawal.payment_method)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Requested:</span>
              <span className="text-white">{formatDate(withdrawal.requested_at)}</span>
            </div>
            {withdrawal.processed_at && (
              <div className="flex justify-between">
                <span className="text-slate-400">Processed:</span>
                <span className="text-white">{formatDate(withdrawal.processed_at)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
