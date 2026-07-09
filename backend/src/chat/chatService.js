import { query } from '../config/db.js';

export async function getOrCreateConversation({
  userId,
  sellerId = null,
  orderId = null,
  productId = null
}) {

const existing = await query(
`
SELECT *
FROM chat_conversations
WHERE user_id=$1
AND product_id=$2
AND status='open'
ORDER BY created_at DESC
LIMIT 1
`,
[
 userId,
 productId
]
);

  if (existing.rows.length) {
    return existing.rows[0];
  }


  const result = await query(
    `
    INSERT INTO chat_conversations
    (
      user_id,
      seller_id,
      order_id,
      product_id
    )
    VALUES($1,$2,$3,$4)
    RETURNING *
    `,
    [
      userId,
      sellerId,
      orderId,
      productId
    ]
  );


  return result.rows[0];
}



export async function saveMessage({
  conversationId,
  userId,
  senderId,
  body,
  messageType = 'text'
}) {

  const result = await query(
    `
    INSERT INTO chat_messages
    (
      conversation_id,
      user_id,
      sender_id,
      body,
      message_type
    )
    VALUES($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [
      conversationId,
      userId,
      senderId,
      body,
      messageType
    ]
  );


  return result.rows[0];
}



export async function getMessages(conversationId){

  const result = await query(
    `
    SELECT *
    FROM chat_messages
    WHERE conversation_id=$1
    ORDER BY created_at ASC
    `,
    [
      conversationId
    ]
  );


  return result.rows;
}



export async function createBridge({
  buyerConversationId,
  sellerConversationId,
  adminId,
  reason
}){

  const result = await query(
    `
    INSERT INTO chat_bridges
    (
      buyer_conversation_id,
      seller_conversation_id,
      admin_id,
      reason
    )
    VALUES($1,$2,$3,$4)
    RETURNING *
    `,
    [
      buyerConversationId,
      sellerConversationId,
      adminId,
      reason
    ]
  );


  return result.rows[0];
}
