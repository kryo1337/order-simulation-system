'use client';

import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const redirectUrl = searchParams.get('redirect_url') || '/';

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Order Simulation System
          </h1>
          <p className="text-gray-400">
            System symulacji przetwarzania zamowien
          </p>
        </div>

        {error === 'domain' && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm font-medium mb-1">
              Dostep zabroniony
            </p>
            <p className="text-red-400 text-sm">
              Twoje konto nie nalezy do domeny @akademiabialska.pl.
              Zaloguj sie kontem uczelnianym.
            </p>
          </div>
        )}

        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <p className="text-gray-300 text-sm mb-2">
            Zaloguj sie kontem uczelnianym:
          </p>
          <p className="text-blue-400 font-mono text-sm">
            @akademiabialska.pl
          </p>
        </div>

        <div className="flex justify-center [&_.cl-card]:bg-gray-800 [&_.cl-card]:border-gray-700 [&_.cl-headerTitle]:text-white [&_.cl-headerSubtitle]:text-gray-400 [&_.cl-socialButtonsBlockButton]:bg-gray-700 [&_.cl-socialButtonsBlockButton]:border-gray-600 [&_.cl-socialButtonsBlockButton]:text-white [&_.cl-socialButtonsBlockButton:hover]:bg-gray-600 [&_.cl-formFieldLabel]:text-gray-300 [&_.cl-formFieldInput]:bg-gray-900 [&_.cl-formFieldInput]:border-gray-700 [&_.cl-formFieldInput]:text-white [&_.cl-footerActionText]:text-gray-400 [&_.cl-footerActionLink]:text-blue-400 [&_.cl-internal-b3fm6y]:text-gray-400">
          <SignIn
            forceRedirectUrl={redirectUrl}
            appearance={{
              elements: {
                rootBox: 'w-full',
              },
            }}
          />
        </div>

        <p className="mt-6 text-gray-500 text-xs text-center">
          Wymagane konto Microsoft Akademii Bialskiej
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <LoginContent />
    </Suspense>
  );
}
