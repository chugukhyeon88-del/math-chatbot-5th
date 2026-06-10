'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginGuard from '@/components/LoginGuard';
import { saveChatSession, updateChatSession } from '@/lib/firestore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Web Speech API 타입 선언
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent {
  error: string;
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

궁금한 게 있으면 뭐든지 질문해 보세요! 💬 글자로 입력하거나 🎤 마이크 버튼을 눌러 말해도 돼요 😊`,
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

  // 음성 인식 상태
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // 브라우저 음성 인식 지원 여부 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      setVoiceSupported(!!SR);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimText]);

  const sendMessage = useCallback(async (text: string) => {
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
  }, [loading, messages, sessionId, user]);

  // 음성 인식 시작/중지
  const toggleListening = useCallback(() => {
    if (!voiceSupported) return;

    if (isListening) {
      // 중지
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimText('');
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
      if (final) {
        setInput((prev) => (prev + ' ' + final).trim());
        setInterimText('');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('음성 인식 오류:', event.error);
      setIsListening(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, voiceSupported]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-64px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">💬 AI 선생님과 대화하기</h1>
        <p className="text-sm text-gray-500 mt-1">
          대응관계에 대해 무엇이든 질문해 보세요!
          {voiceSupported && <span className="ml-2 text-blue-400">🎤 음성 입력 가능</span>}
        </p>
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
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm ml-2 flex-shrink-0 mt-1 overflow-hidden">
                {user?.photoURL
                  ? <img src={user.photoURL} className="w-8 h-8 rounded-full" alt="user" />
                  : '👤'}
              </div>
            )}
          </div>
        ))}

        {/* 로딩 */}
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

        {/* 음성 인식 중 실시간 텍스트 */}
        {isListening && (
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-blue-100 border border-blue-200 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-blue-700 italic">
              {interimText || '듣고 있어요...'}
              <span className="inline-block w-1 h-4 bg-blue-500 ml-1 animate-pulse align-middle" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="mt-3 space-y-2">
        {/* 음성 인식 중 상태 표시 */}
        {isListening && (
          <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-200 rounded-xl py-2 px-4">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-600 text-sm font-medium">음성 인식 중... 말씀해 주세요</span>
            <div className="flex gap-0.5 ml-1">
              {[1,2,3,4,5].map((i) => (
                <span
                  key={i}
                  className="w-1 bg-red-400 rounded-full animate-bounce"
                  style={{
                    height: `${8 + i * 3}px`,
                    animationDelay: `${i * 80}ms`,
                    animationDuration: '600ms',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder={isListening ? '말씀해 주세요...' : '질문을 입력하세요...'}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />

          {/* 마이크 버튼 */}
          {voiceSupported && (
            <button
              onClick={toggleListening}
              title={isListening ? '음성 입력 중지' : '음성으로 입력하기'}
              className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                isListening
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200 scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {isListening ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  <span className="text-xs hidden sm:block">중지</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
                  </svg>
                  <span className="text-xs hidden sm:block">음성</span>
                </>
              )}
            </button>
          )}

          {/* 전송 버튼 */}
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="bg-blue-500 text-white rounded-xl px-5 py-3 font-medium hover:bg-blue-600 disabled:opacity-40 transition-colors"
          >
            전송
          </button>
        </div>

        {!voiceSupported && (
          <p className="text-xs text-gray-400 text-center">
            ※ 이 브라우저는 음성 인식을 지원하지 않아요. Chrome 브라우저를 사용해 보세요.
          </p>
        )}
      </div>
    </div>
  );
}
