'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/generator', label: 'Generator' },
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  // Nie pokazuj nawigacji na stronie logowania
  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-white font-bold text-lg">
              Order Simulator
            </span>
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isLoaded ? (
              <div className="animate-pulse bg-gray-700 h-8 w-32 rounded" />
            ) : user ? (
              <>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">
                    {user.fullName || 'Uzytkownik'}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ redirectUrl: '/login' })}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Wyloguj
                </button>
              </>
            ) : (
              <span className="text-gray-400 text-sm">
                Niezalogowany
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
