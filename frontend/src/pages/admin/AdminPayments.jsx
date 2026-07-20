import { useEffect, useState } from "react";
import client from "../../api/client";

export default function AdminPayments() {

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");



  const loadPayments = async () => {

    try {

      const { data } = await client.get(
        "/admin/payments/pending"
      );

      setPayments(data.payments || []);

    } catch(err){

      setError(
        err.response?.data?.error ||
        "Failed loading payments"
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(()=>{
    loadPayments();
  },[]);



  const approvePayment = async(id)=>{

    try {

      await client.post(
        `/admin/payments/${id}/approve`
      );

      await loadPayments();

    } catch(err){

      alert(
        err.response?.data?.error ||
        "Approval failed"
      );

    }

  };



  const rejectPayment = async(id)=>{

    try {

      await client.post(
        `/admin/payments/${id}/reject`
      );

      await loadPayments();

    } catch(err){

      alert(
        err.response?.data?.error ||
        "Reject failed"
      );

    }

  };



  if(loading)
    return (
      <div className="card-surface">
        Loading pending payments...
      </div>
    );



  return (

    <div>

      <h2>
        💳 Manual Payment Verification
      </h2>


      {error &&
        <div className="alert alert-error">
          {error}
        </div>
      }



      {
        payments.length === 0 ?

        <div className="empty-state">
          No payments waiting for verification.
        </div>


        :


        payments.map(payment=>(

          <div
            key={payment.id}
            className="card-surface"
            style={{
              marginBottom:20,
              padding:20
            }}
          >


            <h3>
              Payment #{payment.id}
            </h3>


            <p>
              Order:
              <strong>
                {" "}
                {payment.order_id}
              </strong>
            </p>


            <p>
              Buyer:
              <strong>
                {" "}
                {payment.buyer_name || "Unknown"}
              </strong>
            </p>


            <p>
              Amount:
              <strong>
                {" "}
                {payment.currency}
                {" "}
                {Number(payment.amount)
                .toLocaleString()}
              </strong>
            </p>


            <p>
              Method:
              {" "}
              {payment.method}
            </p>


            <p>
              Transaction:
              {" "}
              {payment.transaction_reference || "Not provided"}
            </p>



            {
              payment.payment_proof &&

              <p>
                <a
                  href={payment.payment_proof}
                  target="_blank"
                  rel="noreferrer"
                >
                  📎 View payment proof
                </a>
              </p>

            }



            <div
              style={{
                display:"flex",
                gap:12
              }}
            >

              <button
                className="btn-primary"
                onClick={()=>
                  approvePayment(payment.id)
                }
              >
                ✅ Approve
              </button>


              <button
                className="btn-secondary"
                onClick={()=>
                  rejectPayment(payment.id)
                }
              >
                ❌ Reject
              </button>


            </div>


          </div>


        ))

      }


    </div>

  );

}
