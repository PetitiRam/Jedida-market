import { useEffect, useState } from 'react';
import * as api from '../settingsCenterApi';
import { SectionCard, SaveFeedback, useSaveState, Toggle } from '../settingsCenterUI';

export default function UpgradeSettingsTab() {
  const [form, setForm] = useState(null);
  const { saving, message, run } = useSaveState();

  const load = async () => {
    const { data } = await api.getSection('sellerUpgrade');
    setForm(data.value);
  };
  useEffect(() => { load(); }, []);

  const save = (e) => {
    e.preventDefault();
    run(() => api.updateSection('sellerUpgrade', form));
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setToggle = (key) => (val) => setForm({ ...form, [key]: val });

  if (!form) return <div className="empty-state">Loading upgrade settings…</div>;

  return (
    <div>
      <SaveFeedback message={message} />
      <SectionCard title="Seller & Delivery Upgrade Settings" description="Controls the fee, payment instructions, and required steps for buyers upgrading to seller or 
delivery.">
        <form onSubmit={save}>
          <div className="field-row">
            <div className="field-group">
              <label>Seller upgrade fee</label>
              <input type="number" min="0" value={form.sellerFeeAmount} onChange={set('sellerFeeAmount')} />
            </div>
            <div className="field-group">
              <label>Delivery upgrade fee</label>
              <input type="number" min="0" value={form.deliveryFeeAmount} onChange={set('deliveryFeeAmount')} />
            </div>
            <div className="field-group">
              <label>Currency</label>
              <input value={form.currency} onChange={set('currency')} />
            </div>
          </div>

          <div className="field-group">
            <label>Mobile money number</label>
            <input value={form.mobileMoneyNumber} onChange={set('mobileMoneyNumber')} />
          </div>

          <div className="field-group">
            <label>Payment instructions shown to applicants</label>
            <textarea rows={3} value={form.paymentInstructions} onChange={set('paymentInstructions')} />
          </div>

          <div style={{ marginTop: 10 }}>
            <Toggle checked={form.sellerUpgradesEnabled} onChange={setToggle('sellerUpgradesEnabled')} label="Enable seller upgrades" />
            <Toggle checked={form.deliveryUpgradesEnabled} onChange={setToggle('deliveryUpgradesEnabled')} label="Enable delivery upgrades" />
            <Toggle checked={form.requirePaymentBeforeKyc} onChange={setToggle('requirePaymentBeforeKyc')} label="Require payment before KYC" />
            <Toggle checked={form.requireKycBeforeApproval} onChange={setToggle('requireKycBeforeApproval')} label="Require KYC before approval" />
            <Toggle checked={form.allowAutomaticApproval} onChange={setToggle('allowAutomaticApproval')} label="Allow automatic approval (default OFF — recommended to 
keep off)" />
          </div>

          <button className="btn-primary" disabled={saving} style={{ marginTop: 12 }}>{saving ? 'Saving…' : 'Save upgrade settings'}</button>
        </form>
      </SectionCard>
    </div>
  );
}
