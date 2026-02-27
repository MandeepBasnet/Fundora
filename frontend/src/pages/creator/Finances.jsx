import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Download, Clock } from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import paymentService from '../../services/paymentService'; // Replace mockData

export function Finances() {
  const [finances, setFinances] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    totalWithdrawn: 0
  });
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFinances = async () => {
      try {
        setLoading(true);
        const [financeOverview, payoutHistory] = await Promise.all([
          paymentService.getCreatorFinances(),
          paymentService.getCreatorPayouts()
        ]);
        setFinances(financeOverview);
        setPayouts(payoutHistory);
      } catch (error) {
        console.error('Failed to load finances:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFinances();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading financial data...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
        <p className="text-slate-500">Manage funds, payouts, and transaction history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-slate-900 text-white border-none">
          <div className="flex items-center gap-3 mb-4 text-slate-300">
            <div className="p-2 bg-white/10 rounded-lg"><Wallet className="h-5 w-5" /></div>
            <span className="font-medium">Available Balance</span>
          </div>
          <div className="text-3xl font-bold mb-1">Rs. {finances.availableBalance.toLocaleString()}</div>        
          <div className="flex items-center gap-2 mt-4">
            <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 w-full disabled:opacity-50">
              Withdraw Funds (Contact Admin)
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4 text-slate-500">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Clock className="h-5 w-5" /></div>       
            <span className="font-medium">Pending Payouts</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">Rs. {finances.pendingBalance.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-2">Held for milestone security</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4 text-slate-500">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><ArrowUpRight className="h-5 w-5" /></div>  
            <span className="font-medium">Total Withdrawn</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">Rs. {finances.totalWithdrawn.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-2">Lifetime earnings processed</p>
        </Card>
      </div>

      {/* Bank Account Section */}
      <Card className="p-6 border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-900">Payout Method</h3>
          <Button variant="outline" size="sm">Manage</Button>
        </div>
        <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50">
          <div className="h-10 w-10 bg-green-600 rounded flex items-center justify-center text-white font-bold text-xs">
            eSewa
          </div>
          <div>
            <p className="font-medium text-slate-900">eSewa Wallet</p>
            <p className="text-sm text-slate-500">Primary Disbursement Method</p>
          </div>
          <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Auto Request</span>
        </div>
      </Card>

      {/* Payout History */}
      <Card className="overflow-hidden border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-900">Disbursement History</h3>
          <Button variant="ghost" size="sm" className="text-slate-500">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          {payouts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic">No payouts have been processed yet.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Ref ID / Campaign</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Gross/Fee</th>
                  <th className="px-6 py-4">Method & Status</th>
                  <th className="px-6 py-4 text-right">Net Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((release) => (
                  <tr key={release._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 font-mono text-xs">{release.transactionReference || release._id.slice(-8)}</div>
                      <div className="text-slate-500 text-xs truncate max-w-[200px] mt-1">{release.campaign?.title}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(release.disbursedAt || release.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-500">Gross: Rs. {release.grossAmount.toLocaleString()}</div>
                      <div className="text-red-500 text-xs font-medium">Fee: -Rs. {release.platformFee.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{release.disbursementMethod}</span>
                        <Badge variant="outline" className={`
                          ${release.disbursementStatus === 'completed' ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}
                        `}>
                          {release.disbursementStatus}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      Rs. {release.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
