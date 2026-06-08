'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginGuard from '@/components/LoginGuard';
import { saveChatSession, updateChatSession } from '@/lib/firestore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  '대응관계가 뭐예요?',
  '☐와 △는 어떻게 사용해요?',
  '표에서 규칙을 어떻게 찾아요?',
  '생활 속 대응관계 예시를 알려주세요',
  '의자 4개에 다리는 몇 개예요?',
];

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: `안녕하세요! 저는 대응관계를 가르쳐 주는 AI 수학 선생님이에요 🤖✨

**대응관계**란 한 양이 변할 때 다른 양도 그에 따라 변하는 관계예요.

예를 들어, 삼각형이 1개이면 꼭짓점이 3개, 삼각형이 2개이면 꼭짓점이 6개처럼요!

이걸 식으로 나타내면 👉 **△ = ☐ × 3**

궁금한 게 있으면 뭐든지 물어보세요! 😊`,
};

export default function ChatPage() {
  return (
    <LoginGuard>
      <ChatContent />
    </LoginGuard>
  );
}

function ChatContent() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const assistantMsg: Message = { role: 'assistant', content: data.message };
      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);

      if (user) {
        if (!sessionId) {
          const id = await saveChatSession({
            userId: user.uid,
            userEmail: user.email ?? '',
            userName: user.displayName ?? '',
            messages: finalMessages,
          });
          setSessionId(id);
        } else {
          await updateChatSession(sessionId, finalMessages);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '죄송해요, 오류가 발생했어요. 다시 시도해 주세요. 😥' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-64px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">💬 AI 선생님과 대화하기</h1>
        <p className="text-sm text-gray-500 mt-1">대응관계에 대해 무엇이든 질문해 보세요!</p>
      </div>

      {/* 빠른 질문 */}
      <div className="flex gap-2 flex-wrap mb-3">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-100 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm mr-2 flex-shrink-0 mt-1">
                🤖
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-tr-sm'
                  : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm'
              }`}
              dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>'),
              }}
            />
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm ml-2 flex-shrink-0 mt-1">
                {user?.photoURL ? (
                  <img src={user.photoURL} className="w-8 h-8 rounded-full" alt="user" />
                ) : '👤'}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm mr-2">🤖</div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="질문을 입력하세요..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="bg-blue-500 text-white rounded-xl px-5 py-3 font-medium hover:bg-blue-600 disabled:opacity-40 transition-colors"
        >
          전송
        </button>
      </div>
    </div>
  );
}
