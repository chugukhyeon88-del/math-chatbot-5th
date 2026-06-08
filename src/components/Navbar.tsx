'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: '/', label: '🏠 홈' },
    { href: '/chat', label: '💬 챗봇' },
    { href: '/practice', label: '✏️ 연습하기' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
          🔢 대응관계 수학
        </Link>
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <div className="flex items-center gap-2 ml-3 pl-3 border-l border-gray-200">
              <span className="text-xs text-gray-500 hidden sm:block truncate max-w-24">
                {user.displayName?.split(' ')[0]}
              </span>
              <button
                onClick={logout}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
