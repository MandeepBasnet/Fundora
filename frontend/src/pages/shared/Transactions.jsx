import React from 'react';
import { 
  Download, Filter, Search, ArrowUpRight, ArrowDownLeft, Calendar 
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../../components/ui';

import { useAuth } from '../../context/AuthContext';

export function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    spent: 0,
    received: 0,
    balance: 0
  });
  
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
        
        // Calculate totals
        if (t.status === 'completed') {
            if (isCredit) {
                totalReceived += t.amount;
            } else {
                totalSpent += t.amount;
            }
        }

        return {
          id: t.transactionId,
          date: new Date(t.createdAt).toLocaleDateString(),
          description: isCredit 
            ? `Backing from ${t.user?.name || 'User'}` 
            : `Pledge to ${t.campaign?.title || 'Unknown Campaign'}`,
          type: isCredit ? 'Credit' : 'Debit',
          amount: t.amount,
          status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
          method: t.gateway.charAt(0).toUpperCase() + t.gateway.slice(1)
        };
      });

      setTransactions(formatted);
      setStats({
        spent: totalSpent,
        received: totalReceived,
        balance: totalReceived - totalSpent // Simplified balance logic
      });

    } catch (error) {
      console.error("Failed to load transactions", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
      fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
          <p className="text-slate-500">View and manage your financial activity.</p>
        </div>
        <Button variant="outline" className="text-slate-600">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        
        <Card className="p-6 border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Received</h3>
            <div className="p-2 bg-green-50 rounded-lg">
              <ArrowDownLeft className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">Rs. {stats.received.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Gross funding received</div>
        </Card>

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
            <Input className="pl-9 bg-white" placeholder="Search transactions..." />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white border-slate-200 text-slate-600">
              <Calendar className="w-4 h-4 mr-2" /> Date Range
            </Button>
            <Button variant="outline" className="bg-white border-slate-200 text-slate-600">
              <Filter className="w-4 h-4 mr-2" /> Type
            </Button>
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
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{trx.description}</div>
                    <div className="text-slate-500 text-xs">{trx.id} • {trx.type}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{trx.date}</td>
                  <td className="px-6 py-4 text-slate-600">{trx.method}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`
                      ${trx.status === 'Completed' ? 'border-green-200 bg-green-50 text-green-700' : 
                        trx.status === 'Pending' ? 'border-amber-200 bg-amber-50 text-amber-700' : 
                        'border-red-200 bg-red-50 text-red-700'}
                    `}>
                      {trx.status}
                    </Badge>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${trx.type === 'Credit' ? 'text-green-600' : 'text-slate-900'}`}>
                    {trx.type === 'Credit' ? '+' : '-'} Rs. {trx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
