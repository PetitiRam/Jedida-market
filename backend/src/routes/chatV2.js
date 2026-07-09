import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  getOrCreateConversation,
  saveMessage,
  getMessages
} from '../chat/chatService.js';

const router = express.Router();


// Buyer opens marketplace contact
router.post('/contact-product', requireAuth, async (req,res)=>{
try {

  const {
    productId,
    message
  } = req.body;


  const conversation = await getOrCreateConversation({
    userId:req.user.id,
    productId
  });


  if(message){
    await saveMessage({
      conversationId:conversation.id,
      userId:req.user.id,
      senderId:req.user.id,
      body:message
    });
  }


  res.json({
    conversation
  });


} catch(err){

 console.error('CHAT CONTACT ERROR:',err);

 res.status(500).json({
   error:'Unable to create chat'
 });

}

});


// Current buyer conversation
router.get('/mine', requireAuth, async(req,res)=>{

  const conversation = await getOrCreateConversation({
    userId:req.user.id
  });


  res.json({
    conversation
  });

});



// Messages
router.get('/:conversationId/messages',
requireAuth,
async(req,res)=>{

  const messages = await getMessages(
    req.params.conversationId
  );


  res.json({
    messages
  });

});



// Send message
router.post('/:conversationId/messages',
requireAuth,
async(req,res)=>{

  const { body } = req.body;


  const message = await saveMessage({
    conversationId:req.params.conversationId,
    userId:req.user.id,
    senderId:req.user.id,
    body
  });


  res.json({
    message
  });

});



// Admin conversations placeholder
router.get('/admin/conversations',
requireAuth,
requireAdmin,
async(req,res)=>{

  const { query } = await import('../config/db.js');

  const result = await query(
    `
    SELECT *
    FROM chat_conversations
    ORDER BY created_at DESC
    `
  );


  res.json({
    conversations:result.rows
  });

});


export default router;
