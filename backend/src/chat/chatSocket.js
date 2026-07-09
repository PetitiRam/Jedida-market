import { Server } from 'socket.io';
import { saveMessage } from './chatService.js';

let io;

export function initChatSocket(httpServer, frontendUrl) {
  io = new Server(httpServer, {
    cors: {
      origin: frontendUrl || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('🟢 Chat connected:', socket.id);

    socket.on('conversation:join', ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`Joined conversation ${conversationId}`);
    });

    socket.on('conversation:leave', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });


socket.on('message:send', async ({
  conversationId,
  body,
  userId
}, callback)=>{

  try {

    const message = await saveMessage({
      conversationId,
      userId,
      senderId:userId,
      body
    });


    io.to(`conversation:${conversationId}`)
      .emit('message:new', message);


    callback({
      success:true,
      message
    });


  } catch(error){

    console.error(error);

    callback({
      error:'Unable to send message'
    });

  }

});

    socket.on('typing:start', ({conversationId}) => {
      socket.to(`conversation:${conversationId}`)
        .emit('typing:update',{
          userId: socket.id,
          isTyping:true
        });
    });


    socket.on('typing:stop', ({conversationId}) => {
      socket.to(`conversation:${conversationId}`)
        .emit('typing:update',{
          userId: socket.id,
          isTyping:false
        });
    });


    socket.on('disconnect',()=> {
      console.log('🔴 Chat disconnected:', socket.id);
    });

  });

  return io;
}

export function getIO(){
  return io;
}
