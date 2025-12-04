'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useMemo } from 'react';
import {
  Users, LogOut, Filter, UserPlus,
  BarChart3, Calendar, Clock, TrendingUp
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [attendances, setAttendances] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalAttendances: 0,
    todayCheckIns: 0,
    avgHours: 0
  });

  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: ''
  });

  const [createMessage, setCreateMessage] = useState('');

  // -------------------------
  // FILTERED ATTENDANCES
  // -------------------------
  const filteredAttendances = useMemo(() => {
    let filtered = attendances;

    if (employeeId) {
      filtered = filtered.filter(att => att.employeeId.includes(employeeId));
    }

    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      filtered = filtered.filter(att => {
        const d = new Date(att.date);
        return d >= s && d <= e;
      });
    }

    return filtered;
  }, [attendances, employeeId, startDate, endDate]);

  // -------------------------
  // FETCH DATA
  // -------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/attendance/admin');
        const data = await response.json();

        if (response.ok) {
          setAttendances(data.attendances);

          // Calculate stats
          const totalAttendances = data.attendances.length;
          const today = new Date().toDateString();

          const todayAtt = data.attendances.filter(
            att => new Date(att.date).toDateString() === today
          );

          const todayCheckIns = todayAtt.length;
          const totalHours = todayAtt.reduce(
            (sum, att) => sum + (att.totalHours || 0), 0
          );

          const avgHours = todayCheckIns > 0 ? totalHours / todayCheckIns : 0;

          setStats({
            totalEmployees: 0,
            totalAttendances,
            todayCheckIns,
            avgHours
          });
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchData();
  }, []);

  // -------------------------
  // DATE/TIME FORMAT
  // -------------------------
  const formatDate = (d) => new Date(d).toLocaleDateString();
  const formatTime = (d) => new Date(d).toLocaleTimeString();

  // -------------------------
  // CLEAR FILTERS
  // -------------------------
  const clearFilters = () => {
    setEmployeeId('');
    setStartDate('');
    setEndDate('');
  };

  // -------------------------
  // CREATE EMPLOYEE
  // -------------------------
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setCreateMessage('');

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee)
      });

      const data = await response.json();

      if (response.ok) {
        setCreateMessage('Employee created successfully!');
        setNewEmployee({ name: '', email: '', password: '', employeeId: '' });
        setShowCreateForm(false);
      } else {
        setCreateMessage(data.error);
      }
    } catch (error) {
      setCreateMessage('An error occurred!');
    }
  };

  // ----------------------------------------------------------------------
  // UI STARTS HERE  (DO NOT CHANGE FUNCTIONALITY)
  // ----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* ---------------- Header ---------------- */}
      <header className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">
                Welcome, {session?.user?.name || "Admin"}
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <button
            onClick={() => signOut()}
            className="px-4 py-2 flex items-center gap-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="max-w-7xl mx-auto py-8 px-4 space-y-8">

        {/* ---------------- Stats Cards ---------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          <StatCard
            icon={<Users className="h-6 w-6 text-blue-600" />}
            label="Total Employees"
            value={stats.totalEmployees}
            color="bg-blue-100"
          />

          <StatCard
            icon={<Calendar className="h-6 w-6 text-green-600" />}
            label="Total Attendances"
            value={stats.totalAttendances}
            color="bg-green-100"
          />

          <StatCard
            icon={<Clock className="h-6 w-6 text-purple-600" />}
            label="Today's Check-ins"
            value={stats.todayCheckIns}
            color="bg-purple-100"
          />

          <StatCard
            icon={<TrendingUp className="h-6 w-6 text-orange-600" />}
            label="Avg Hours Today"
            value={stats.avgHours.toFixed(1)}
            color="bg-orange-100"
          />

        </div>

        {/* ---------------- Quick Actions ---------------- */}
        <div className="bg-white border rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          </div>

          <div className="p-6">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 flex items-center gap-2"
            >
              <UserPlus className="h-5 w-5" />
              {showCreateForm ? "Cancel" : "Add New Employee"}
            </button>
          </div>
        </div>

        {/* ---------------- Create Employee Form ---------------- */}
        {showCreateForm && (
          <div className="bg-white border rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Employee</h3>

            <form onSubmit={handleCreateEmployee} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <InputField
                  label="Full Name"
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, name: e.target.value })
                  }
                />

                <InputField
                  label="Employee ID"
                  value={newEmployee.employeeId}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, employeeId: e.target.value })
                  }
                />

                <InputField
                  label="Email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, email: e.target.value })
                  }
                />

                <InputField
                  label="Password"
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, password: e.target.value })
                  }
                />

              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
                >
                  Create Employee
                </button>
              </div>

              {createMessage && (
                <p className="text-sm mt-4 text-green-600">{createMessage}</p>
              )}
            </form>
          </div>
        )}

        {/* ---------------- Filters ---------------- */}
        <div className="bg-white border rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <InputField
              label="Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />

            <InputField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <InputField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Clear Filters
              </button>
            </div>

          </div>
        </div>

        {/* ---------------- Attendance Table ---------------- */}
        <div className="bg-white border rounded-xl shadow-lg p-6">
          
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Employee Attendance ({filteredAttendances.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border divide-y divide-gray-200">

              <thead className="bg-gray-50">
                <tr>
                  <Th>Employee</Th>
                  <Th>Date</Th>
                  <Th>Check-in</Th>
                  <Th>Check-out</Th>
                  <Th>Hours</Th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">

                {filteredAttendances.map(att => (
                  <tr key={att._id} className="hover:bg-gray-50">
                    
                    {/* EMPLOYEE */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">

                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold">
                            {att?.employeeName?.charAt(0)?.toUpperCase() ?? "?"}
                          </span>
                        </div>

                        <div>
                          <p className="font-medium text-gray-900">
                            {att?.employeeName ?? "Unknown"}
                          </p>
                          <p className="text-sm text-gray-500">
                            ID: {att.employeeId}
                          </p>
                        </div>

                      </div>
                    </td>

                    <Td>{formatDate(att.date)}</Td>
                    <Td>{formatTime(att.checkIn)}</Td>
                    <Td>{att.checkOut ? formatTime(att.checkOut) : "-"}</Td>
                    <Td>{att.totalHours ? att.totalHours.toFixed(2) : "-"}</Td>

                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          {filteredAttendances.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No attendance found</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

/* ----------------- UI COMPONENTS ------------------ */

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white border rounded-xl shadow hover:shadow-md transition p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
      {children}
    </td>
  );
}
