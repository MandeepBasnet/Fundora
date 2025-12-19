import React from 'react';
import { 
  Download, Filter, Search, ArrowUpRight, ArrowDownLeft, Calendar 
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../../components/ui';

export function Transactions() {
  // Mock Transaction Data
  const transactions = [
    { id: "TRX-987654", date: "2024-10-24", description: "Pledge to Eco-Friendly Water Purifier", type: "Debit", amount: 5000, status: "Completed", method: "eSewa" },
    { id: "TRX-987653", date: "2024-10-22", description: "Refund from Cancelled Project", type: "Credit", amount: 2500, status: "Completed", method: "Wallet" },
    { id: "TRX-987652", date: "2024-10-20", description: "Pledge to Community Art Center", type: "Debit", amount: 1000, status: "Pending", method: "Khalti" },
    { id: "TRX-987651", date: "2024-10-15", description: "Wallet Top-up", type: "Credit", amount: 10000, status: "Completed", method: "Bank Transfer" },
    { id: "TRX-987650", date: "2024-10-10", description: "Pledge to Tech Education", type: "Debit", amount: 3000, status: "Failed", method: "Card" },
  ];

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
          <div className="text-2xl font-bold text-slate-900">Rs. 45,200</div>
          <div className="text-xs text-slate-500 mt-1">+12% from last month</div>
        </Card>
        
        <Card className="p-6 border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Received</h3>
            <div className="p-2 bg-green-50 rounded-lg">
              <ArrowDownLeft className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">Rs. 12,500</div>
          <div className="text-xs text-slate-500 mt-1">Refunds & Top-ups</div>
        </Card>

        <Card className="p-6 border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Net Balance</h3>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">Rs. 2,450</div>
          <div className="text-xs text-slate-500 mt-1">Available in Wallet</div>
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
