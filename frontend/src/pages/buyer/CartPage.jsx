import { useEffect, useState } from "react";
import MarketplaceHeader from "../../components/MarketplaceHeader";
import Icon from "../../components/icons/icon";
import * as commerceApi from "../../api/commerceApi";
import client from "../../api/client";
import PaymentMethodSelector from "../../components/PaymentMethodSelector";

export default function CartPage() {
  const [cart, setCart] = useState(null);

  const [method, setMethod] = useState("mtn_mobile_money");
  const [checkingOut, setCheckingOut] = useState(false);

  const [checkoutResult, setCheckoutResult] = useState(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [proof, setProof] = useState(null);


  const load = async () => {
    const { data } = await commerceApi.getCart();
    setCart(data);
  };


  useEffect(() => {
    load();
  }, []);


  const checkoutCart = async () => {

    setCheckingOut(true);

    try {

      const { data } = await client.post(
        "/orders/cart-checkout",
        {
          method,
          shippingAddress: ""
        }
      );


      // DON'T NAVIGATE
      // Keep user here and show payment form

      setCheckoutResult(data);


    } catch(err){

      alert(
        err.response?.data?.error ||
        "Could not checkout."
      );

    } finally {

      setCheckingOut(false);

    }
  };


  const submitPayment = async () => {

    if(!phoneNumber || !transactionReference){

      alert(
        "Enter payment number and transaction reference"
      );

      return;
    }


    try {

      await client.post(
        `/orders/cart-checkout/${checkoutResult.checkoutGroupId}/confirm`
      );


      alert(
        "Payment submitted for verification"
      );


      window.location.href="/orders";


    } catch(err){

      alert(
        err.response?.data?.error ||
        "Payment submission failed"
      );

    }

  };


  if(!cart){

    return (
      <div className="empty-state">
        Loading cart...
      </div>
    );

  }


  return (

    <div>

      <MarketplaceHeader />


      <div
        className="dash-body"
        style={{maxWidth:800}}
      >

      <h2>
        <Icon name="cart" size={22}/>
        Your Cart
      </h2>


      {cart.items.map(item=>(

        <div
          key={item.id}
          className="card-surface"
          style={{
            marginBottom:10
          }}
        >

          <strong>
            {item.title}
          </strong>

          <p>
            {item.currency}{" "}
            {item.price.toLocaleString()}
            {" "}× {item.quantity}
          </p>


        </div>

      ))}



      {!checkoutResult ? (

        <div className="card-surface">


          <h3>
            Payment Method
          </h3>


          <PaymentMethodSelector
            value={method}
            onChange={setMethod}
          />


          <button
            className="btn-primary"
            style={{
              marginTop:20,
              width:"100%"
            }}
            disabled={checkingOut}
            onClick={checkoutCart}
          >

          {
            checkingOut
            ?
            "Creating payment..."
            :
            "Continue to Payment"
          }

          </button>


        </div>


      ) : (


        <div className="card-surface">


          <h2>
            Complete Payment
          </h2>


          <p>
            Amount:
            {" "}
            {checkoutResult.combinedTotal}
          </p>


          <p>
            Pay using:
            {" "}
            {method}
          </p>


          <div className="field-group">

          <label>
            Mobile Money Number
          </label>

          <input
            value={phoneNumber}
            onChange={
              e=>setPhoneNumber(e.target.value)
            }
            placeholder="07XXXXXXXX"
          />

          </div>



          <div className="field-group">

          <label>
            Transaction Reference
          </label>


          <input
            value={transactionReference}
            onChange={
              e=>setTransactionReference(e.target.value)
            }
            placeholder="Transaction ID"
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



          <div className="alert alert-success">

          Payment instructions:

          <br/>

          Send money to JEDIDA Marketplace account.

          Wait for verification.

          Your order will then enter escrow.

          </div>



          <button
            className="btn-primary"
            style={{
              width:"100%"
            }}
            onClick={submitPayment}
          >

          Submit Payment

          </button>


        </div>


      )}


      </div>


    </div>

  );

}
