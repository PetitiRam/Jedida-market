import { useEffect, useState } from "react";
import client from "../api/client";
import CopyField from "./payment/CopyField";
import Icon from "./icons/icon";
import "../styles/payment-forms.css";

const PAYMENT_METHOD_LABELS = {
  mtn_mobile_money: "MTN Mobile Money",
  airtel_money: "Airtel Money"
};

export default function ManualPaymentInstructions({ method, amount, currency = "UGX" }) {

  // Merchant number/name come live from Admin → Settings → Payment
  // instead of being hard-coded, so admin changes take effect immediately.
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    client.get("/admin/settings-center/public/payment-methods")
      .then(({ data }) => setSettings(data))
      .catch(() => setSettings(null));
  }, []);

  if (!settings || !settings.enableMobileMoney) return null;

  const number = method === "airtel_money"
    ? (settings.alternativeMobileNumber || settings.mobileMoneyNumber)
    : settings.mobileMoneyNumber;

  const label = PAYMENT_METHOD_LABELS[method];

  if (!label || !number) return null;

  return (
    <div className="jp-scope jp-panel">

      <div className="jp-eyebrow"><Icon name="phone" size={13} /> Manual Payment</div>
      <h3 className="jp-title" style={{ fontSize: "1.15rem" }}>Pay using {label}</h3>

      <div className="jp-instructions-banner">
        <Icon name="alertCircle" size={16} />
        <span>Send the exact amount below, then submit your transaction reference for verification.</span>
      </div>

      <div className="jp-detail-grid">
        <div className="jp-detail-row">
          <div className="jp-detail-label">Business Name</div>
          <div className="jp-detail-value">{settings.accountName || "JEDIDA Marketplace"}</div>
        </div>
        <CopyField label="Payment Number" value={number} />
        <div className="jp-detail-row">
          <div className="jp-detail-label">Amount</div>
          <div className="jp-detail-value jp-amount">{currency} {Number(amount || 0).toLocaleString()}</div>
        </div>
      </div>

    </div>
  );
}
