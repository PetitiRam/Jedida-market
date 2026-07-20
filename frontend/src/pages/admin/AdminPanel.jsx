import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import client from '../../api/client';
import Logo from '../../components/Logo';
import TabBar from '../../components/TabBar';
import AdminUpgradePanel from './AdminUpgradePanel';
import AdminShopsPanel from "./AdminShopsPanel";
import AdminProductsPanel from './AdminProductsPanel';
import AdminUsersPanel from './AdminUsersPanel';
import AdminOrdersPanel from './AdminOrdersPanel';
import AdminWithdrawalsPanel from './AdminWithdrawalsPanel';
import AdminAdsPanel from './AdminAdsPanel';
import AdminSettingsPanel from './AdminSettingsPanel';
import AdminChatPanel from './AdminChatPanel';
import AICommandCenter from './AICommandCenter';
import AdminSettingsCenter from './settings/AdminSettingsCenter';
import AdminChatBridgePanel from './AdminChatBridgePanel';
import AdminQuestionsPanel from './AdminQuestionsPanel';
import AdminQuotesPanel from './AdminQuotesPanel';
import AdminPayments from './AdminPayments';
const TABS = [
  { key: 'upgrades', label: '🆙 Upgrades' },
  { key: 'shops', label: 'Shops' },
  { key: 'products', label: 'Products' },
  { key: 'users', label: 'Users' },
  { key: 'orders', label: 'Orders & Payouts' },
  { key: 'withdrawals', label: 'Withdrawals' },
  { key: 'ads', label: 'Ads' },
  { key: 'settings', label: 'Settings' },
  { key: 'chat', label: 'Chat' },
  { key: 'ai', label: '🤖 AI Command Center' },          
  { key: 'settingsCenter', label: '⚙️ Settings Cener' },
  { key: 'chatBridge', label: '🔗 Chat Bridging' },     
  { key: 'questions', label: '❓ Product Questions' },
  { key: 'quotes', label: 'Quote Requests' },
 { key: 'payments', label: '💳 Payments' }
];
                                                                                                                                                                                                                                                                             
export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    client.get('/auth/me').then(({ data }) => setUser(data.user)).finally(() => setChecked(true));
  }, []);

  if (checked && user && !user.is_admin) return <Navigate to="/marketplace" replace />;

  return (
    <div>
      <header className="dash-header"><Logo size={32} /></header>
      <div className="dash-body">
        <h2>Admin Panel</h2>
        <TabBar tabs={TABS} initial="upgrades">
          {(active) => (
            <>
              {active === 'upgrades' && <AdminUpgradePanel />}
              {active === 'shops' && <AdminShopsPanel />}
              {active === 'products' && <AdminProductsPanel />}
              {active === 'users' && <AdminUsersPanel />}
              {active === 'orders' && <AdminOrdersPanel />}
              {active === 'withdrawals' && <AdminWithdrawalsPanel />}
            {active === 'payments' && <AdminPayments />}       
       {active === 'ads' && <AdminAdsPanel />}
              {active === 'settings' && <AdminSettingsPanel />}
              {active === 'chat' && <AdminChatPanel />}
              {active === 'ai' && <AICommandCenter />}
              {active === 'settingsCenter' && <AdminSettingsCenter />}
               {active === 'chatBridge' && <AdminChatBridgePanel />}           
              {active === 'questions' && <AdminQuestionsPanel />} 
              {active === 'quotes' && <AdminQuotesPanel />}


 </>         

          )}
        </TabBar>
      </div>
    </div>
  );
}
