import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";
import MarketplaceHeader from "../../components/MarketplaceHeader";
import PaymentMethodSelector from "../../components/PaymentMethodSelector";

export default function PaymentCenter() {

  const { checkoutGroupId } = useParams();
  const navigate = useNavigate();

  const [method,setMethod] = useState("mtn_mobile_money");
  const [phone,setPhone] = useState("");
  const [reference,setReference] = useState("");
  const [proof,setProof] = useState(null);

  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");



  const submitPayment = async(e)=>{

    e.preventDefault();

    if(!phone || !reference){
      setError("Fill all payment details");
      return;
    }


    try{

      setLoading(true);
      setError("");


      const formData = new FormData();

      formData.append(
        "paymentMethod",
        method
      );

      formData.append(
        "phoneNumber",
        phone
      );

      formData.append(
        "transactionReference",
        reference
      );


      if(proof){
        formData.append(
          "proof",
          proof
        );
      }



      await client.post(
        `/orders/cart-checkout/${checkoutGroupId}/submit-payment`,
        formData,
        {
          headers:{
            "Content-Type":"multipart/form-data"
          }
        }
      );


      setSuccess(
        "Payment submitted. Waiting for admin verification."
      );


      setTimeout(()=>{
        navigate("/orders");
      },2000);


    }catch(err){

      setError(
        err.response?.data?.error ||
        "Payment submission failed"
      );

    }finally{
      setLoading(false);
    }

  };



return (
<>
<MarketplaceHeader/>

<div className="dash-body"
style={{maxWidth:650}}>


<h2>Payment Center</h2>


{error &&
<div className="alert alert-error">
{error}
</div>
}


{success &&
<div className="alert alert-success">
{success}
</div>
}



<div className="card-surface">

<h3>
Select Payment Method
</h3>


<PaymentMethodSelector
value={method}
onChange={setMethod}
/>



<hr/>


<h3>
Payment Instructions
</h3>


<p>
Send payment to:
</p>


<strong>
{
method==="mtn_mobile_money"
?
"MTN: 0770123456"
:
"Airtel: 0750123456"
}
</strong>


<p>
After paying enter details below.
</p>



<form onSubmit={submitPayment}>


<div className="field-group">

<label>
Your Mobile Number
</label>

<input
value={phone}
onChange={
e=>setPhone(e.target.value)
}
placeholder="07XXXXXXXX"
/>

</div>



<div className="field-group">

<label>
Transaction Reference
</label>

<input
value={reference}
onChange={
e=>setReference(e.target.value)
}
placeholder="MPESA/MTN reference"
/>

</div>



<div className="field-group">

<label>
Payment Screenshot
</label>

<input
type="file"
accept="image/*"
onChange={
e=>setProof(e.target.files[0])
}
/>

</div>



<button
className="btn-primary"
disabled={loading}
style={{width:"100%"}}
>

{
loading
?
"Submitting..."
:
"Submit Payment"
}

</button>


</form>

</div>

</div>

</>
)

}
