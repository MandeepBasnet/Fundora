import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Badge } from '../../components/ui';
import { DollarSign, TrendingUp, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export default function FinancialReports() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalHeld: 0,
    totalReleased: 0,
    platformFees: 0
  });
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/admin/financial-reports', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (response.ok) {
            setStats(data.stats);
            setTransactions(data.transactions);
        }
    } catch (error) {
        console.error("Failed to load financial reports", error);
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading financial reports...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
        <p className="text-slate-500">Platform revenue and payout status tracking</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 text-sky-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            Rs. {(stats.totalVolume / 1000).toFixed(1)}k
          </div>
          <div className="text-sm text-slate-500">Total Transaction Volume</div>
        </Card>

        <Card className="p-6 border-none shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <Badge className="bg-orange-100 text-orange-700 border-none hover:bg-orange-100">Pending Release</Badge>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            Rs. {(stats.totalHeld / 1000).toFixed(1)}k
          </div>
          <div className="text-sm text-slate-500">Funds Held by Platform</div>
        </Card>

        <Card className="p-6 border-none shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            Rs. {(stats.totalReleased / 1000).toFixed(1)}k
          </div>
          <div className="text-sm text-slate-500">Funds Released to Creators</div>
        </Card>

        <Card className="p-6 border-none shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-none">5% Fee</Badge>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            Rs. {(stats.platformFees / 1000).toFixed(1)}k
          </div>
          <div className="text-sm text-slate-500">Est. Platform Revenue</div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="overflow-hidden border-slate-200">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900">Recent Transactions</h3>
            <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" /> Export CSV
            </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Campaign</th>
                <th className="px-6 py-4 font-medium">Backer</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Gateway</th>
                <th className="px-6 py-4 font-medium">Payout Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 truncate max-w-[200px]">
                    {tx.campaign?.title || 'Unknown Campaign'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{tx.user?.name || 'Unknown User'}</span>
                        <span className="text-xs text-slate-500">{tx.user?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    Rs. {tx.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-slate-500 uppercase text-xs">
                    {tx.gateway}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`
                        ${tx.payoutStatus === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                          tx.payoutStatus === 'processing' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 
                          'bg-orange-100 text-orange-700 hover:bg-orange-100'} border-none uppercase text-[10px]
                    `}>
                        {tx.payoutStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                        No transactions found
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
