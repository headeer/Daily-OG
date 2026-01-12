"use client";

import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export function SettingsView({ user }: { user: { id: string; email: string } }) {
  const [defaultWakeTime, setDefaultWakeTime] = useState("07:00");
  const [defaultDayLength, setDefaultDayLength] = useState(15);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Load from localStorage or defaults
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWakeTime = localStorage.getItem("defaultWakeTime");
      const savedDayLength = localStorage.getItem("defaultDayLength");
      const savedReminders = localStorage.getItem("remindersEnabled");
      if (savedWakeTime) setDefaultWakeTime(savedWakeTime);
      if (savedDayLength) setDefaultDayLength(Number(savedDayLength));
      if (savedReminders !== null) setRemindersEnabled(savedReminders === "true");
    }
  }, []);

  function handleSaveDefaults() {
    if (typeof window !== "undefined") {
      localStorage.setItem("defaultWakeTime", defaultWakeTime);
      localStorage.setItem("defaultDayLength", String(defaultDayLength));
      localStorage.setItem("remindersEnabled", String(remindersEnabled));
      alert("Settings saved!");
    }
  }

  async function handleExportData() {
    // In a real app, this would fetch all user data and export as JSON
    alert("Data export feature - to be implemented with full data fetch");
  }

  async function handleDeleteAccount() {
    if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      // In a real app, this would delete all user data
      alert("Account deletion - to be implemented with proper data deletion");
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your preferences and account</p>
      </div>

      <div className="space-y-6">
        {/* Default Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Default Settings</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Default Wake Time</label>
              <input
                type="time"
                value={defaultWakeTime}
                onChange={(e) => setDefaultWakeTime(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Default Day Length (hours)</label>
              <input
                type="number"
                min="12"
                max="18"
                value={defaultDayLength}
                onChange={(e) => setDefaultDayLength(Number(e.target.value))}
                className="input"
              />
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={remindersEnabled}
                onChange={(e) => setRemindersEnabled(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Enable Reminders</span>
                <p className="text-xs text-gray-600 mt-1">Get notified every 30 minutes for check-ins</p>
              </div>
            </div>
            <button
              onClick={handleSaveDefaults}
              className="btn-primary w-full"
            >
              Save Defaults
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Account</h2>
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</div>
              <div className="text-base font-semibold text-gray-900">{user.email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="btn-secondary w-full"
          >
            Sign Out
          </button>
        </div>

        {/* Data Management */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Data Management</h2>
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full px-6 py-3 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
            >
              📥 Export Data
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full px-6 py-3 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition-colors"
            >
              🗑️ Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

