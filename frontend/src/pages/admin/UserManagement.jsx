import React, { useState, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button, Card, Badge, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce'; // Assuming we have this or I'll use setTimeout

export function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, filters.role, filters.status, filters.page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        search: debouncedSearch,
        role: filters.role === 'All Roles' ? '' : filters.role,
        status: filters.status === 'All Status' ? '' : filters.status
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value, 
      page: key === 'page' ? value : 1 
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage user roles and account status</p>
        </div>
        <Button variant="outline" disabled>Add New User</Button>
      </div>

      <Card className="border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
          <Input 
            placeholder="Search users by name or email..." 
            className="max-w-sm"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          <select 
            className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option>All Roles</option>
            <option value="backer">Backer</option>
            <option value="creator">Creator</option>
            <option value="admin">Admin</option>
          </select>
          <select 
            className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option>All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
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
              {loading ? (
                <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No users found matching your criteria.</td>
                </tr>
              ) : (
                users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs uppercase">
                            {user.name ? user.name.charAt(0) : 'U'}
                        </div>
                        <div>
                            <div className="font-medium text-slate-900">{user.name || 'Unknown'}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <Badge variant="outline" className={
                        user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        user.role === 'creator' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                        }>
                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Backer'}
                        </Badge>
                    </td>
                    <td className="px-6 py-4">
                        {/* Assuming status or default to active if missing */}
                        <Badge className={
                        (user.status || 'active') === 'active' ? 'bg-green-100 text-green-700 border-none hover:bg-green-100' : 'bg-red-100 text-red-700 border-none hover:bg-red-100'
                        }>
                        {(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                        </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                        <MoreVertical className="w-4 h-4" />
                        </Button>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Page <span className="font-medium text-slate-900">{filters.page}</span> of <span className="font-medium text-slate-900">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={filters.page <= 1}
              onClick={() => handleFilterChange('page', filters.page - 1)}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={filters.page >= totalPages}
              onClick={() => handleFilterChange('page', filters.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
