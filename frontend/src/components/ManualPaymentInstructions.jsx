export default function ManualPaymentInstructions({ method, amount }) {

  const paymentInfo = {
    mtn_mobile_money: {
      name: "MTN Mobile Money",
      logo: "/payment-logos/mtn.png",
      number: "0770123456"
    },

    airtel_money: {
      name: "Airtel Money",
      logo: "/payment-logos/airtel.svg",
      number: "0750123456"
    }
  };

  const info = paymentInfo[method];

  if (!info) return null;

  return (
    <div
      className="card-surface"
      style={{
        padding:20,
        marginBottom:20
      }}
    >

      <h2>
        Pay using {info.name}
      </h2>


      <img
        src={info.logo}
        alt={info.name}
        style={{
          height:50,
          marginBottom:15
        }}
      />


      <p>
        <strong>Business Name:</strong>
        <br/>
        JEDIDA Marketplace
      </p>


      <p>
        <strong>Payment Number:</strong>
        <br/>
        {info.number}
      </p>


      <p>
        <strong>Amount:</strong>
        <br/>
        UGX {amount.toLocaleString()}
      </p>


      <div
        style={{
          background:"#fff3cd",
          padding:12,
          borderRadius:8
        }}
      >
        After payment, enter your transaction ID below and submit for verification.
      </div>

    </div>
  );
}
