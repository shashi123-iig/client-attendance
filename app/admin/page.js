'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useMemo } from 'react';
import {
  Users, LogOut, Filter, UserPlus,
  BarChart3, Calendar, Clock, TrendingUp,
  Download, Trash2, Edit, FileText
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
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
  // DATE/TIME FORMAT
  // -------------------------
  const formatDate = (d) => new Date(d).toLocaleDateString();
  const formatTime = (d) => new Date(d).toLocaleTimeString();

  // -------------------------
  // FETCH EMPLOYEES
  // -------------------------
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      if (response.ok) {
        setEmployees(data.employees);
        setStats(prev => ({ ...prev, totalEmployees: data.employees.length }));
      }
    } catch (error) {
      console.error('Fetch employees error:', error);
    }
  };

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
        fetchEmployees(); // Refresh employee list
      } else {
        setCreateMessage(data.error);
      }
    } catch (error) {
      setCreateMessage('An error occurred!');
    }
  };

  // -------------------------
  // DELETE EMPLOYEE
  // -------------------------
  const handleDeleteEmployee = async (employeeId) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await fetch(`/api/employees?id=${employeeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchEmployees(); // Refresh list
        alert('Employee deleted successfully!');
      } else {
        alert('Failed to delete employee');
      }
    } catch (error) {
      alert('An error occurred while deleting employee');
    }
  };

  // -------------------------
  // DOWNLOAD REPORT
  // -------------------------
  const handleDownload = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        employeeId: employeeId || '',
        startDate: startDate || '',
        endDate: endDate || ''
      });

      const response = await fetch(`/api/attendance/reports/download?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download report');
      }
    } catch (error) {
      alert('An error occurred while downloading');
    }
  };

  // -------------------------
  // FETCH DATA
  // -------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch attendances
        const attResponse = await fetch('/api/attendance/admin');
        const attData = await attResponse.json();

        if (attResponse.ok) {
          setAttendances(attData.attendances);

          // Calculate stats
          const totalAttendances = attData.attendances.length;
          const today = new Date().toDateString();

          const todayAtt = attData.attendances.filter(
            att => new Date(att.date).toDateString() === today
          );

          const todayCheckIns = todayAtt.length;
          const totalHours = todayAtt.reduce(
            (sum, att) => sum + (att.totalHours || 0), 0
          );

          const avgHours = todayCheckIns > 0 ? totalHours / todayCheckIns : 0;

          setStats(prev => ({
            ...prev,
            totalAttendances,
            todayCheckIns,
            avgHours
          }));
        }

        // Fetch employees
        await fetchEmployees();
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchData();
  }, []);

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
      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <TabButton
                active={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
                icon={<BarChart3 className="h-5 w-5" />}
                label="Dashboard"
              />
              <TabButton
                active={activeTab === 'employees'}
                onClick={() => setActiveTab('employees')}
                icon={<Users className="h-5 w-5" />}
                label="Employees"
              />
              <TabButton
                active={activeTab === 'attendance'}
                onClick={() => setActiveTab('attendance')}
                icon={<Clock className="h-5 w-5" />}
                label="Attendance"
              />
              <TabButton
                active={activeTab === 'reports'}
                onClick={() => setActiveTab('reports')}
                icon={<FileText className="h-5 w-5" />}
                label="Reports"
              />
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
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

            {/* Recent Activity */}
            <div className="bg-white border rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Attendance Activity</h2>
              <div className="space-y-4">
                {attendances.slice(0, 5).map(att => (
                  <div key={att._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">
                          {att?.employeeName?.charAt(0)?.toUpperCase() ?? "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{att?.employeeName ?? "Unknown"}</p>
                        <p className="text-sm text-gray-500">{formatDate(att.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Check-in: {formatTime(att.checkIn)}
                      </p>
                      {att.checkOut && (
                        <p className="text-sm text-gray-600">
                          Check-out: {formatTime(att.checkOut)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-8">
            {/* Create Employee Section */}
            <div className="bg-white border rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Employee Management</h2>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {showCreateForm ? "Cancel" : "Add Employee"}
                </button>
              </div>

              {showCreateForm && (
                <form onSubmit={handleCreateEmployee} className="space-y-6 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Full Name"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    />
                    <InputField
                      label="Employee ID"
                      value={newEmployee.employeeId}
                      onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                    />
                    <InputField
                      label="Email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    />
                    <InputField
                      label="Password"
                      type="password"
                      value={newEmployee.password}
                      onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
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
                    <p className={`text-sm mt-4 ${createMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                      {createMessage}
                    </p>
                  )}
                </form>
              )}

              {/* Employee List */}
              <div className="overflow-x-auto">
                <table className="min-w-full border divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <Th>Employee</Th>
                      <Th>Email</Th>
                      <Th>Employee ID</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map(emp => (
                      <tr key={emp._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-semibold">
                                {emp.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{emp.name}</span>
                          </div>
                        </td>
                        <Td>{emp.email}</Td>
                        <Td>{emp.employeeId}</Td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => alert('Edit functionality coming soon')}
                              className="text-indigo-600 hover:text-indigo-900 p-2 rounded hover:bg-indigo-50"
                              title="Edit Employee"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp._id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                              title="Delete Employee"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {employees.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-gray-500 mt-2">No employees found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-8">
            <div className="bg-white border rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Attendance Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <h3 className="font-medium text-green-800 mb-2">Today&apos;s Check-ins</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.todayCheckIns}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <h3 className="font-medium text-blue-800 mb-2">Average Hours</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.avgHours.toFixed(1)}h</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <h3 className="font-medium text-purple-800 mb-2">Total Records</h3>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalAttendances}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Today&apos;s Attendance Activity</h2>
              <div className="space-y-3">
                {attendances
                  .filter(att => new Date(att.date).toDateString() === new Date().toDateString())
                  .slice(0, 15)
                  .map(att => (
                  <div key={att._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-indigo-600">
                          {att?.employeeName?.charAt(0)?.toUpperCase() ?? "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{att?.employeeName ?? "Unknown"}</p>
                        <p className="text-xs text-gray-500">ID: {att.employeeId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        ✓ Checked In
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatTime(att.checkIn)}
                      </p>
                      {att.checkOut && (
                        <p className="text-xs text-gray-500">
                          Out: {formatTime(att.checkOut)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {attendances.filter(att => new Date(att.date).toDateString() === new Date().toDateString()).length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-gray-500 mt-2">No check-ins today yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* Filters */}
            <div className="bg-white border rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Attendance Reports</h2>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </button>
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

            {/* Reports Table */}
            <div className="bg-white border rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Filtered Results ({filteredAttendances.length} records)
              </h3>

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
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-gray-500 mt-2">No attendance records found</p>
                </div>
              )}
            </div>
          </div>
        )}
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

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
        active
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
