import { useEffect, useRef, useState } from 'react';
import client from '../api/client';
import { useChatSocket } from '../chat/useChatSocket';

export default function ChatPanelV2() {
  const [conversationId, setConversationId] = useState(null);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  const {
    connected, messages, setMessages, typingUsers,
    sendMessage, startTyping, stopTyping, markRead, react, deleteForEveryone
  } = useChatSocket(conversationId);

  useEffect(() => {
    client.get('/chat-v2/mine').then(({ data }) => setConversationId(data.conversation.id));
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    client.get(`/chat-v2/${conversationId}/messages`).then(({ data }) => setMessages(data.messages));
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) markRead();
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const body = text;
    setText('');
    stopTyping();
    try {
      await sendMessage(body);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="card-surface" style={{ display: 'flex', flexDirection: 'column', height: 460 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '0.8rem', color: connected ? 'var(--forest)' : '#8A9189' }}>
          {connected ? '● Connected' : '○ Reconnecting…'}
        </span>
        {typingUsers.size > 0 && <span style={{ fontSize: '0.8rem', color: '#8A9189', fontStyle: 'italic' }}>Admin is typing…</span>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && <div className="empty-state">No messages yet. Say hello to the JEDIDA admin team.</div>}
        {messages.map((m) => (
          <div key={m.id} style={{
            alignSelf: m.sender_id === m.user_id ? 'flex-end' : 'flex-start',
            background: 'var(--cream-dim)', padding: '8px 12px', borderRadius: 10, maxWidth: '75%', fontSize: '0.9rem', position: 'relative'
          }}>
            {m.deleted_for_everyone ? <em style={{ color: '#8A9189' }}>Message deleted</em> : m.body}
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: '0.68rem', color: '#8A9189' }}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {m.status === 'read' && <span style={{ fontSize: '0.68rem', color: 'var(--forest)' }}>✓✓ Read</span>}
              <button onClick={() => react(m.id, '👍')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>👍</button>
              {!m.deleted_for_everyone && <button onClick={() => deleteForEveryone(m.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 
'0.68rem', color: '#8A2E10' }}>Delete</button>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); startTyping(); }}
          onBlur={stopTyping}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Message the admin team…"
        />
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 18px' }} onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
