import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export function useChatSocket(conversationId) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [presence, setPresence] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('jedida_access_token');
    if (!token) return;

    const socket = io(SOCKET_URL, { auth: { token }, reconnection: true, reconnectionDelay: 1000 });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('message:new', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on('message:edited', (msg) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    });
    socket.on('message:deleted', ({ messageId }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deleted_for_everyone: true, body: '' } : m)));
    });
    socket.on('message:read', ({ messageIds }) => {
      setMessages((prev) => prev.map((m) => (messageIds.includes(m.id) ? { ...m, status: 'read' } : m)));
    });
    socket.on('typing:update', ({ userId, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        isTyping ? next.add(userId) : next.delete(userId);
        return next;
      });
    });
    socket.on('presence:update', ({ userId, isOnline, lastSeenAt }) => {
      setPresence((prev) => ({ ...prev, [userId]: { isOnline, lastSeenAt } }));
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!socketRef.current || !conversationId) return;
    socketRef.current.emit('conversation:join', { conversationId });
    return () => socketRef.current?.emit('conversation:leave', { conversationId });
  }, [conversationId]);

  const sendMessage = useCallback((body, replyToId) => {
    return new Promise((resolve, reject) => {
      socketRef.current.emit('message:send', { conversationId, body, replyToId }, (res) => {
        if (res?.error) reject(new Error(res.error));
        else resolve(res);
      });
    });
  }, [conversationId]);

  const sendBridgedMessage = useCallback((linkId, body) => {
    return new Promise((resolve, reject) => {
      socketRef.current.emit('message:send-bridged', { linkId, senderConversationId: conversationId, body }, (res) => {
        if (res?.error) reject(new Error(res.error));
        else resolve(res);
      });
    });
  }, [conversationId]);

  const startTyping = useCallback(() => socketRef.current?.emit('typing:start', { conversationId }), [conversationId]);
  const stopTyping = useCallback(() => socketRef.current?.emit('typing:stop', { conversationId }), [conversationId]);
  const markRead = useCallback(() => socketRef.current?.emit('message:mark-read', { conversationId }), [conversationId]);
  const react = useCallback((messageId, emoji) => socketRef.current?.emit('message:react', { messageId, conversationId, emoji }), [conversationId]);
  const editMessage = useCallback((messageId, newBody) => new Promise((resolve, reject) => {
    socketRef.current.emit('message:edit', { messageId, conversationId, newBody }, (res) => res?.error ? reject(new Error(res.error)) : resolve(res));
  }), [conversationId]);
  const deleteForEveryone = useCallback((messageId) => socketRef.current?.emit('message:delete-for-everyone', { messageId, conversationId }), [conversationId]);

  return {
    connected, messages, setMessages, typingUsers, presence,
    sendMessage, sendBridgedMessage, startTyping, stopTyping, markRead, react, editMessage, deleteForEveryone
  };
}
