import React from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Download, Clock } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { financeData } from '../../mockData';

export function Finances() {
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
          <div className="text-3xl font-bold mb-1">Rs. {financeData.availableBalance.toLocaleString()}</div>        
          <div className="flex items-center gap-2 mt-4">
            <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 w-full">
              Withdraw Funds
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4 text-slate-500">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Clock className="h-5 w-5" /></div>       
            <span className="font-medium">Pending Payouts</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">Rs. {financeData.pendingBalance.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-2">Held until milestone verification</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4 text-slate-500">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><ArrowUpRight className="h-5 w-5" /></div>  
            <span className="font-medium">Total Withdrawn</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">Rs. {financeData.totalWithdrawn.toLocaleString()}</div>
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
            <p className="text-sm text-slate-500">984•••••89</p>
          </div>
          <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Verified</span>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="overflow-hidden border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-900">Transaction History</h3>
          <Button variant="ghost" size="sm" className="text-slate-500">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Transaction ID</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {financeData.transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">{txn.id}</td>
                  <td className="px-6 py-4 text-slate-500">{txn.date}</td>
                  <td className="px-6 py-4 text-slate-600">{txn.description}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {txn.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${txn.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                    {txn.amount > 0 ? '+' : ''} Rs. {Math.abs(txn.amount).toLocaleString()}
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
