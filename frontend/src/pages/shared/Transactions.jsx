import React from 'react';
import { 
  Download, Filter, Search, ArrowUpRight, ArrowDownLeft, Calendar, FileText 
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../../components/ui';
import { toast } from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import { generateReceiptPDF } from '../../utils/receiptGenerator';

export function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    spent: 0,
    received: 0,
    balance: 0
  });
  
  // Filters State
  const [searchTerm, setSearchTerm] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(trx => {
      // Search
      const searchString = `${trx.id} ${trx.description} ${trx.campaignTitle} ${trx.status} ${trx.method}`.toLowerCase();
      const matchSearch = searchString.includes(searchTerm.toLowerCase());
      
      // Type Filter
      const matchType = typeFilter === 'all' || trx.type.toLowerCase() === typeFilter;
      
      // Date Filter
      let matchDate = true;
      if (dateFilter !== 'all') {
        const trxDate = new Date(trx.rawDate);
        const today = new Date();
        const diffTime = today - trxDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (dateFilter === '7') matchDate = diffDays <= 7;
        if (dateFilter === '30') matchDate = diffDays <= 30;
        if (dateFilter === 'this_year') matchDate = trxDate.getFullYear() === today.getFullYear();
      }
      
      return matchSearch && matchType && matchDate;
    });
  }, [transactions, searchTerm, dateFilter, typeFilter]);

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, typeFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Import service
  const fetchHistory = async () => {
    try {
      const { default: paymentService } = await import('../../services/paymentService');
      const data = await paymentService.getTransactionHistory();
      
      let totalSpent = 0;
      let totalReceived = 0;

      // Transform data to match UI
      const formatted = data.map(t => {
        const isCredit = t.user?._id !== user?._id && user?.role === 'creator';
        
        let displayAmount = t.amount;
        let platformFee = 0;
        let netAmount = t.amount;
        
        // If it's a pledge going to the creator, calculate the 5% system fee
        if (isCredit && t.campaign?.fundingType !== 'donation-based') {
            platformFee = Math.round(t.amount * 0.05);
            netAmount = t.amount - platformFee;
        }

        // Calculate totals
        if (t.status === 'completed') {
            if (isCredit) {
                totalReceived += netAmount; // Stats show the NET received
            } else {
                totalSpent += t.amount;
            }
        }

        return {
          id: t.transactionId,
          original_id: t._id,
          date: new Date(t.createdAt).toLocaleDateString(),
          rawDate: t.createdAt,
          description: isCredit ? `Backing from ${t.user?.name || 'User'}` : `Pledge Supported`,
          campaignTitle: t.campaign?.title || 'Unknown Campaign',
          type: isCredit ? 'Credit' : 'Debit',
          amount: t.amount,
          platformFee: platformFee, // Add fee to display
          netAmount: netAmount,     // Add net to display
          status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
          method: t.gateway.charAt(0).toUpperCase() + t.gateway.slice(1),
          rewardTier: t.rewardTier,
          rewardRedeemed: t.rewardRedeemed,
          fundingType: t.campaign?.fundingType
        };
      });

      setTransactions(formatted);
      setStats({
        spent: totalSpent,
        received: totalReceived,
        balance: totalReceived - totalSpent // Net flow
      });

    } catch (error) {
      console.error("Failed to load transactions", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
      fetchHistory();
  }, [user]);

  const handleRedeemReward = async (trxId, originalId) => {
    try {
      const { default: paymentService } = await import('../../services/paymentService');
      await paymentService.redeemReward(originalId);
      toast.success('Reward marked as redeemed!');
      
      // Update local state
      setTransactions(prev => prev.map(t => 
        t.original_id === originalId ? { ...t, rewardRedeemed: true } : t
      ));
    } catch (error) {
      console.error(error);
      toast.error('Failed to redeem reward. Ensure it is a completed transaction.');
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Transaction ID', 'Date', 'Description', 'Campaign', 'Method', 'Status', 'Gross Amount', 'Platform Fee', 'Net Amount'];
    
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.id,
        t.date,
        `"${t.description}"`, 
        `"${t.campaignTitle}"`, // Added Campaign
        t.method,
        t.status,
        t.type === 'Credit' ? t.amount : -t.amount,
        t.platformFee || 0,
        t.type === 'Credit' ? t.netAmount || t.amount : -t.amount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fundora_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Downloaded');
  };

  const handleDownloadReceipt = (trx) => {
    try {
      generateReceiptPDF(trx, user);
      toast.success('Receipt downloaded');
    } catch (error) {
      console.error("Failed to generate PDF", error);
      toast.error('Error generating receipt');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
          <p className="text-slate-500">View and manage your financial activity.</p>
        </div>
        <Button variant="outline" className="text-slate-600" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {user?.role !== 'creator' && (
          <Card className="p-6 border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-500">Total Spent</h3>
              <div className="p-2 bg-red-50 rounded-lg">
                <ArrowUpRight className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">Rs. {stats.spent.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Lifetime contributions</div>
          </Card>
        )}
        
        {user?.role === 'creator' && (
          <Card className="p-6 border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-500">Net Received</h3>
              <div className="p-2 bg-green-50 rounded-lg">
                <ArrowDownLeft className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">Rs. {stats.received.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">After platform fees</div>
          </Card>
        )}

        <Card className="p-6 border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Net Flow</h3>
            <div className="p-2 bg-sky-50 rounded-lg">
              <Calendar className="w-4 h-4 text-sky-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">Rs. {(stats.received - stats.spent).toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Received - Spent</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-slate-200 bg-slate-50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              className="pl-9 bg-white" 
              placeholder="Search transactions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select 
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-md bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none h-10 cursor-pointer"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="this_year">This Year</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select 
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-md bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none h-10 cursor-pointer"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="credit">Credits (Received)</option>
                <option value="debit">Debits (Spent)</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Campaign</th>
                <th className="px-6 py-4">Status & Method</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.length > 0 ? paginatedTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{trx.description}</div>
                    <div className="text-slate-500 text-xs">{trx.id} • {trx.type}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{trx.date}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700">{trx.campaignTitle}</div>
                    <div className="text-xs text-slate-400">
                      {trx.fundingType 
                        ? trx.fundingType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                        : 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant="outline" className={`
                        ${trx.status === 'Completed' ? 'border-green-200 bg-green-50 text-green-700' : 
                          trx.status === 'Pending' ? 'border-amber-200 bg-amber-50 text-amber-700' : 
                          'border-red-200 bg-red-50 text-red-700'}
                      `}>
                        {trx.status}
                      </Badge>
                      <span className="text-xs text-slate-500">{trx.method}</span>
                    </div>
                    {trx.rewardTier && trx.status === 'Completed' && trx.type === 'Debit' && (
                      <div className="mt-2">
                        {trx.rewardRedeemed ? (
                          <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Redeemed
                          </span>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs px-2 border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 mt-1"
                            onClick={() => handleRedeemReward(trx.id, trx.original_id)}
                          >
                            Redeem Reward
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-right ${trx.type === 'Credit' ? 'text-green-600' : 'text-slate-900'}`}>
                    {trx.type === 'Credit' && trx.platformFee > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-400 line-through">Gross: Rs. {trx.amount.toLocaleString()}</span>
                        <span className="text-xs text-red-500">Fee: -Rs. {trx.platformFee.toLocaleString()}</span>
                        <span className="font-bold mt-1">+Rs. {trx.netAmount.toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="font-bold">{trx.type === 'Credit' ? '+' : '-'} Rs. {trx.amount.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-sky-600"
                      onClick={() => handleDownloadReceipt(trx)}
                      title="Download PDF Receipt"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 bg-white">
                    No transactions match your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <span className="text-sm text-slate-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} entries
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
