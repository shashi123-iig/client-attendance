'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CheckinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Automatically trigger checkin/checkout when page loads
    const performToggle = async () => {
      try {
        const response = await fetch('/api/checkin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setMessage(data.message);
          // Redirect back to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          setMessage(data.error || 'An error occurred');
        }
      } catch (error) {
        setMessage('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    performToggle();
  }, [session, status, router]);



  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {message.includes('Checked in') ? (
            <div className="text-green-500 text-6xl">✓</div>
          ) : message.includes('Checked out') ? (
            <div className="text-blue-500 text-6xl">✓</div>
          ) : (
            <div className="text-red-500 text-6xl">✗</div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Attendance Update</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}