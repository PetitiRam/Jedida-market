import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import client from "../../api/client";
import MarketplaceHeader from "../../components/MarketplaceHeader";
import PaymentMethodSelector from "../../components/PaymentMethodSelector";

export default function Checkout() {

  const { productId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const qty = Number(params.get("qty") || 1);

  const [product, setProduct] = useState(null);
  const [method, setMethod] = useState("mtn_mobile_money");
  const [address, setAddress] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
const [phoneNumber,setPhoneNumber] = useState("");
const [transactionReference,setTransactionReference] = useState("");
const [proof,setProof] = useState(null);

  useEffect(() => {

    async function loadProduct(){

      try {

        const {data} = await client.get(
          `/products/${productId}`
        );

        setProduct(data.product);

      } catch(err){

        setError(
          "Unable to load product."
        );

      }

    }

    loadProduct();

  },[productId]);



  const placeOrder = async()=>{

    if(!address.trim()){

      setError(
        "Please enter delivery address."
      );

      return;

    }


    if(!method){

      setError(
        "Please select payment method."
      );

      return;

    }


    setBusy(true);
    setError("");


    try{


      const {data}= await client.post(
        "/orders",
        {
          productId,
          quantity:qty,
          shippingAddress:address,

          // manual payment identifier
          method
        }
      );


      /*
        Redirect buyer to manual payment center
        with created order id
      */

      navigate(
        `/payment-center/${data.order.id}`
      );


    }catch(err){

      setError(
        err.response?.data?.error ||
        "Failed creating order."
      );

    }finally{

      setBusy(false);

    }

  };



  if(!product){

    return(
      <>
      <MarketplaceHeader/>

      <div className="dash-body">
        Loading product...
      </div>

      </>
    );

  }



  const total =
    Number(product.price) * qty;



  return (

    <>

    <MarketplaceHeader/>


    <div
      className="dash-body"
      style={{
        maxWidth:600
      }}
    >

      <h2>
        Checkout
      </h2>


      <div className="card-surface">


        <div
          style={{
            display:"flex",
            justifyContent:"space-between",
            marginBottom:20
          }}
        >

          <span>
            {product.title} × {qty}
          </span>


          <strong>
            {product.currency}{" "}
            {total.toLocaleString()}
          </strong>


        </div>



        {
          error &&
          <div className="alert alert-error">
            {error}
          </div>
        }



        <div className="field-group">

          <label>
            Delivery Address
          </label>


          <textarea

            rows={3}

            value={address}

            onChange={
              e=>setAddress(e.target.value)
            }

            placeholder="Enter delivery location"

          />

        </div>




        <label
          style={{
            fontWeight:700,
            display:"block",
            marginBottom:10
          }}
        >

          Select Manual Payment Method

        </label>



        <PaymentMethodSelector

          value={method}

          onChange={setMethod}

        />

{(method === "mtn_mobile_money" ||
  method === "airtel_money") && (

<div className="card-surface"
style={{
 padding:20,
 marginTop:20
}}>

<h3>
{
method === "mtn_mobile_money"
? "MTN Mobile Money Payment"
: "Airtel Money Payment"
}
</h3>


<p>
Pay to:
<strong>
{
method === "mtn_mobile_money"
? "0770123456"
: "0750123456"
}
</strong>
</p>


<p>
Amount:
<strong>
UGX {(product.price * qty).toLocaleString()}
</strong>
</p>


<div className="field-group">

<label>
Your Mobile Money Number
</label>

<input
value={phoneNumber}
onChange={(e)=>setPhoneNumber(e.target.value)}
placeholder="07XXXXXXXX"
/>

</div>



<div className="field-group">

<label>
Transaction Reference
</label>

<input
value={transactionReference}
onChange={(e)=>setTransactionReference(e.target.value)}
placeholder="MPXXXXXXXX"
/>

</div>



<div className="field-group">

<label>
Payment Screenshot
</label>

<input
type="file"
accept="image/*"
onChange={(e)=>setProof(e.target.files[0])}
/>

</div>


</div>

)}


        <button

          className="btn-primary"

          disabled={busy}

          onClick={placeOrder}

          style={{
            width:"100%",
            marginTop:25
          }}

        >

        {
          busy
          ?
          "Creating Order..."
          :
          "Submit Payment"

        }

        </button>



        <p className="auth-footer-note">

          After creating your order, JEDIDA Payment Center will show
          the MTN/Airtel payment number and allow you to submit
          your transaction reference.

        </p>


      </div>


    </div>


    </>

  );

}
