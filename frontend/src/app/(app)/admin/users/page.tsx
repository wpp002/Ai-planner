'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('ALL');
  const canManageUsers = currentUser?.role === 'ADMIN';

  async function load() {
    const { data } = await api.get('/admin/users');
    setUsers(data);
  }

  useEffect(() => {
    load();
    api.get('/auth/profile').then(({ data }) => setCurrentUser(data)).catch(() => setCurrentUser(null));
  }, []);

  async function updateRole(userId: string, role: UserRole) {
    await api.patch(`/admin/users/${userId}/role`, { role });
    await load();
  }

  async function deleteUser(userId: string) {
    await api.delete(`/admin/users/${userId}`);
    await load();
  }

  const filteredUsers = users.filter((user) => {
    const matchesQuery = [user.name, user.email].some((value) => value.toLowerCase().includes(query.toLowerCase()));
    const matchesRole = role === 'ALL' || user.role === role;
    return matchesQuery && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Users</h1>
        <p className="text-muted-foreground">Manage accounts, roles, and user access.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
            <Input placeholder="Search users..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="ALL">All roles</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPPORT">SUPPORT</option>
            </Select>
          </div>
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3">Name</th>
                <th>Email</th>
                <th>Trips</th>
                <th>Role</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="py-3 font-medium">{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user._count?.trips ?? 0}</td>
                  <td>
                    {canManageUsers ? (
                      <Select className="w-32" value={user.role} onChange={(e) => updateRole(user.id, e.target.value as UserRole)}>
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPPORT">SUPPORT</option>
                      </Select>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{user.role}</span>
                    )}
                  </td>
                  <td className="flex justify-end gap-2 text-right">
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="outline" title="View user detail">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {canManageUsers && (
                      <Button variant="ghost" title="Delete user" onClick={() => deleteUser(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
