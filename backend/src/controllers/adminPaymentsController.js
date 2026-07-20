import { query } from "../config/db.js";


export async function getPendingPayments(req, res) {
  try {

    const result = await query(`
      SELECT
        mp.id,
        mp.order_id,
        mp.amount,
        mp.currency,

        mp.network AS method,

        mp.transaction_reference,

        mp.screenshot_url AS payment_proof,

        mp.status,

        u.email AS buyer_name

      FROM manual_payments mp

      JOIN users u
      ON u.id = mp.user_id

      WHERE mp.status = 'pending'

      ORDER BY mp.created_at DESC
    `);


    res.json({
      payments: result.rows
    });


  } catch(err){

    console.error(
      "Get pending payments error:",
      err
    );

    res.status(500).json({
      error:"Could not load payments"
    });

  }
}


export async function approvePayment(req,res){

 const {paymentId}=req.params;


 try{


 const payment = await query(
 `
 SELECT *
 FROM payments
 WHERE id=$1
 `,
 [paymentId]
 );


 if(payment.rows.length===0)
 return res.status(404).json({
 error:"Payment not found"
 });



 const p = payment.rows[0];


 await query(
 `
 UPDATE payments
 SET status='succeeded'
 WHERE id=$1
 `,
 [paymentId]
 );


 await query(
 `
 UPDATE orders
 SET status='paid_escrow'
 WHERE id=$1
 `,
 [p.order_id]
 );


 await query(
 `
 UPDATE wallets
 SET balance = balance + $1
 WHERE type='escrow'
 `,
 [p.amount]
 );


 res.json({
 message:"Payment approved"
 });



 }catch(err){

 console.error(err);

 res.status(500).json({
 error:"Approval failed"
 });

 }


}



export async function rejectPayment(req,res){

const {paymentId}=req.params;


await query(
`
UPDATE payments
SET status='rejected'
WHERE id=$1
`,
[paymentId]
);


res.json({
message:"Payment rejected"
});


}
