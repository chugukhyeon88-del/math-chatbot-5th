import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
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
  const attemptsSnap = await getDocs(
    query(collection(db, 'practiceAttempts'), orderBy('attemptedAt', 'desc'))
  );
  const attempts = attemptsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PracticeAttempt));

  const chatSnap = await getDocs(
    query(collection(db, 'chatSessions'), orderBy('updatedAt', 'desc'))
  );
  const chatSessions = chatSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatSession));

  return { attempts, chatSessions };
}

export async function getStudentProgress(userId: string) {
  const attemptsSnap = await getDocs(
    query(
      collection(db, 'practiceAttempts'),
      where('userId', '==', userId),
      orderBy('attemptedAt', 'desc')
    )
  );
  return attemptsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PracticeAttempt));
}
