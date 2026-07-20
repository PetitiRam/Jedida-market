import { PAYMENT_METHODS } from "../constants/paymentMethods";

const logos = {
  mtn_mobile_money:
    "https://upload.wikimedia.org/wikipedia/commons/9/93/New-mtn-logo.jpg",

  airtel_money:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Airtel_logo.svg/512px-Airtel_logo.svg.png",

  card:
    "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",

  paypal:
    "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",

  bank:
    "https://cdn-icons-png.flaticon.com/512/2830/2830284.png",

  crypto:
    "https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg"
};


export default function PaymentMethodPicker({
  value,
  onChange
}) {

return (

<div
style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",
gap:16
}}
>


{PAYMENT_METHODS.map((m)=>(

<label

key={m.id}

style={{

border:
value===m.id
?"2px solid #1B5E20"
:"1px solid #ddd",

borderRadius:16,

padding:18,

cursor:m.available
?"pointer"
:"not-allowed",

opacity:m.available?1:.55,

display:"flex",

flexDirection:"column",

alignItems:"center",

background:"#fff",

boxShadow:
"0 4px 12px rgba(0,0,0,.08)"

}}

>


<input

type="radio"

name="payment-method"

checked={value===m.id}

disabled={!m.available}

onChange={()=>{
if(m.available){
onChange(m.id)
}
}}

/>



<img

src={logos[m.id] || m.logo}

alt={m.label}

style={{

height:48,

objectFit:"contain",

margin:"12px 0"

}}

/>



<div
style={{
fontWeight:700,
textAlign:"center"
}}
>

{m.label}

</div>



{m.network && (

<div
style={{
fontSize:13,
color:"#666",
marginTop:5
}}
>

{m.network}

</div>

)}



{!m.available && (

<div

style={{

marginTop:12,

background:"#FFE9A8",

color:"#7A5600",

padding:"5px 12px",

borderRadius:999,

fontSize:12,

fontWeight:700

}}

>

Coming Soon

</div>

)}


</label>

))}


</div>

);

}
