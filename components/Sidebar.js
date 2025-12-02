'use client';

import { Users, FileText } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
      </div>
      <nav className="mt-6">
        <div className="px-3">
          <button
            onClick={() => setActiveTab('employees')}
            className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
              activeTab === 'employees'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5 mr-3" />
            Employees
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center px-4 py-3 mt-2 text-left rounded-lg transition-colors ${
              activeTab === 'reports'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5 mr-3" />
            Reports
          </button>
        </div>
      </nav>
    </div>
  );
}