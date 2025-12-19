import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, Shield, Bell, User } from 'lucide-react';
import { Button, Card, Input, Avatar, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';        

export function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', content: '' });

  // Password state
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', content: '' });
    
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'), // Note: Email update might require verification in real app
      profile: {
        location: formData.get('location'),
        bio: formData.get('bio')
      }
    };

    try {
      await updateProfile(data);
      setMsg({ type: 'success', content: 'Profile updated successfully' });
    } catch (err) {
      setMsg({ type: 'error', content: err });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      setMsg({ type: 'error', content: 'New passwords do not match' });
      return;
    }
    setLoading(true);
    setMsg({ type: '', content: '' });
    try {
      await changePassword(passwords.current, passwords.new);
      setMsg({ type: 'success', content: 'Password changed successfully' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      setMsg({ type: 'error', content: err });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-500">Manage your account information and preferences</p>
      </div>

      {msg.content && (
        <div className={`p-4 mb-4 rounded ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {msg.content}
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="w-full sm:w-auto justify-start">
          <TabsTrigger value="general" className="px-6"><User className="w-4 h-4 mr-2"/> General</TabsTrigger>      
          <TabsTrigger value="security" className="px-6"><Shield className="w-4 h-4 mr-2"/> Security</TabsTrigger>  
          <TabsTrigger value="notifications" className="px-6"><Bell className="w-4 h-4 mr-2"/> Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="p-6 border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-6">Personal Information</h3>

            <div className="flex items-center gap-6 mb-8">
              <Avatar className="h-24 w-24 text-2xl" fallback={user.name.charAt(0)} />
              <div>
                <Button variant="outline" size="sm" className="mb-2">Change Avatar</Button>
                <p className="text-xs text-slate-500">JPG, GIF or PNG. Max size of 800K</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <Input name="name" defaultValue={user.name} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <Input name="email" defaultValue={user.email} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Role</label>
                  <Input defaultValue={user.role} disabled className="capitalize" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Location</label>
                  <Input name="location" defaultValue={user.profile?.location || ''} />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-sm font-medium text-slate-700">Bio</label>
                <textarea
                  name="bio"
                  className="flex min-h-[120px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  defaultValue={user.profile?.bio || ''}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" /> {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6 border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-6">Security Settings</h3>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Current Password</label>
                <Input type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">New Password</label>
                <Input type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} />
              </div>
              <Button className="mt-4" onClick={handlePasswordChange} disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          {/* Notifications Placeholder - implemented as mostly UI for now */}
          <Card className="p-6">
             <div className="space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-slate-500" /> Email Preferences
              </h3>
              <div className="space-y-3">
                {['Campaign Updates', 'New Messages', 'Marketing Emails', 'Security Alerts'].map((item) => (
                  <div key={item} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-slate-700">{item}</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-4">
                <Button>Save Preferences</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
