import React from 'react';
import { 
  Settings, CreditCard, Shield, Bell, Save, Globe, Mail, Smartphone 
} from 'lucide-react';
import { Button, Card, Input, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';

export function PlatformSettings() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
          <p className="text-slate-500">Configure general, payment, and security settings.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" /> Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 mb-6">
          <TabsTrigger value="general" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <Globe className="w-4 h-4 mr-2" /> General
          </TabsTrigger>
          <TabsTrigger value="payment" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <CreditCard className="w-4 h-4 mr-2" /> Payment & Fees
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <Shield className="w-4 h-4 mr-2" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <Bell className="w-4 h-4 mr-2" /> Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="p-6 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">General Configuration</h3>
            <div className="grid gap-6 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Platform Name</label>
                <Input defaultValue="Fundora" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Support Email</label>
                <Input defaultValue="support@fundora.com" type="email" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Maintenance Mode</label>
                <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-1 top-1"/>
                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                  </div>
                  <span className="text-sm text-slate-600">Enable maintenance mode (only admins can access)</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="p-6 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Payment & Commission</h3>
            <div className="grid gap-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Platform Fee (%)</label>
                  <Input defaultValue="5" type="number" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Transaction Fee (%)</label>
                  <Input defaultValue="2.9" type="number" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Payment Gateways</h4>
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded flex items-center justify-center text-white font-bold text-xs">eS</div>
                    <div>
                      <div className="font-bold text-slate-900">eSewa</div>
                      <div className="text-xs text-slate-500">Connected</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200">Disconnect</Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded flex items-center justify-center text-white font-bold text-xs">K</div>
                    <div>
                      <div className="font-bold text-slate-900">Khalti</div>
                      <div className="text-xs text-slate-500">Connected</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200">Disconnect</Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6 border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Security Settings</h3>
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Two-Factor Authentication (2FA)</div>
                    <div className="text-sm text-slate-500">Enforce 2FA for all admin accounts</div>
                  </div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Email Verification</div>
                    <div className="text-sm text-slate-500">Require email verification for new users</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-bold text-green-600 mr-2">Enabled</span>
                  <Button variant="ghost" size="sm" className="text-slate-400">Edit</Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
