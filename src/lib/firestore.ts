import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Timestamp;
}

export interface ChatSession {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  messages: ChatMessage[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PracticeAttempt {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  problemId: string;
  problemTitle: string;
  userAnswer: string;
  isCorrect: boolean;
  score: number;
  attemptedAt?: Timestamp;
}

export async function saveChatSession(session: Omit<ChatSession, 'id'>) {
  const ref = await addDoc(collection(db, 'chatSessions'), {
    ...session,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateChatSession(sessionId: string, messages: ChatMessage[]) {
  await setDoc(
    doc(db, 'chatSessions', sessionId),
    { messages, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function savePracticeAttempt(attempt: Omit<PracticeAttempt, 'id'>) {
  const ref = await addDoc(collection(db, 'practiceAttempts'), {
    ...attempt,
    attemptedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getAllStudentsProgress() {
  // orderBy 제거 — 복합 인덱스 불필요
  const attemptsSnap = await getDocs(collection(db, 'practiceAttempts'));
  const attempts = attemptsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PracticeAttempt));

  const chatSnap = await getDocs(collection(db, 'chatSessions'));
  const chatSessions = chatSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatSession));

  return { attempts, chatSessions };
}

export async function getStudentProgress(userId: string) {
  const attemptsSnap = await getDocs(
    query(collection(db, 'practiceAttempts'), where('userId', '==', userId))
  );
  return attemptsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PracticeAttempt));
}
