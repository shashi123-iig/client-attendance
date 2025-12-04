'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Clock, LogOut, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Unauthorized access</p>
        </div>
      </div>
    );
  }
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/attendance/reports');
      const data = await response.json();
      if (response.ok) {
        setAttendances(data.attendances);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleAttendance = async (type) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        fetchReports(); // Refresh the list
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {session?.user?.name}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check-in/Check-out Section */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-indigo-600" />
                  <h3 className="ml-3 text-lg font-medium text-gray-900">Attendance</h3>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAttendance('checkin')}
                    disabled={loading}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    Check In
                  </button>
                  <button
                    onClick={() => handleAttendance('checkout')}
                    disabled={loading}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    Check Out
                  </button>
                </div>
                {message && (
                  <p className={`mt-4 text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                  </p>
                )}
              </div>
            </div>

            {/* Today's Status */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-indigo-600" />
                   <h3 className="ml-3 text-lg font-medium text-gray-900">Today&apos;s Status</h3>
                </div>
                <div className="mt-6">
                   {attendances.length > 0 && new Date(attendances[0].date).toDateString() === new Date().toDateString() ? (
                    <div>
                      <p className="text-sm text-gray-600">
                        Check-in: {formatTime(attendances[0].checkIn)}
                      </p>
                      {attendances[0].checkOut && (
                        <p className="text-sm text-gray-600">
                          Check-out: {formatTime(attendances[0].checkOut)}
                        </p>
                      )}
                      {attendances[0].totalHours > 0 && (
                        <p className="text-sm text-gray-600">
                          Total Hours: {attendances[0].totalHours.toFixed(2)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Not checked in yet today</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div className="mt-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Attendance History</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {attendances.map((attendance) => (
                  <li key={attendance._id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(attendance.date)}
                          </p>
                        </div>
                        <div className="flex flex-col text-right">
                          <p className="text-sm text-gray-600">
                            Check-in: {formatTime(attendance.checkIn)}
                          </p>
                          {attendance.checkOut && (
                            <p className="text-sm text-gray-600">
                              Check-out: {formatTime(attendance.checkOut)}
                            </p>
                          )}
                          {attendance.totalHours > 0 && (
                            <p className="text-sm text-gray-600">
                              Hours: {attendance.totalHours.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}