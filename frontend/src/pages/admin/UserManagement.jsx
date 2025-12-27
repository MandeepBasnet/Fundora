import React from 'react';
import { MoreVertical, Shield, Ban, UserCheck } from 'lucide-react';
import { Button, Card, Badge, Input } from '../../components/ui';

export function UserManagement() {
  // Mock data for users
  const users = [
    { id: 1, name: "Ram Sharma", email: "ram@example.com", role: "Backer", status: "active", joined: "2023-12-01" },
    { id: 2, name: "TechFarm Nepal", email: "contact@techfarm.np", role: "Creator", status: "active", joined: "2023-11-15" },
    { id: 3, name: "Sita Nepali", email: "sita@example.com", role: "Backer", status: "suspended", joined: "2024-01-10" },
    { id: 4, name: "Green Homes", email: "info@greenhomes.np", role: "Creator", status: "active", joined: "2024-02-05" },
    { id: 5, name: "Admin User", email: "admin@fundora.np", role: "Admin", status: "active", joined: "2023-10-01" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage user roles and account status</p>
        </div>
        <Button>Add New User</Button>
      </div>

      <Card className="border-slate-200">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <Input placeholder="Search users..." className="max-w-sm" />
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <option>All Roles</option>
            <option>Backer</option>
            <option>Creator</option>
            <option>Admin</option>
          </select>
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <option>All Status</option>
            <option>Active</option>
            <option>Suspended</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={
                      user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      user.role === 'Creator' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={
                      user.status === 'active' ? 'bg-green-100 text-green-700 border-none' : 'bg-red-100 text-red-700 border-none'
                    }>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {user.joined}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
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
