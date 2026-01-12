"use client";

import { useEffect, useState } from "react";
import { format, parse, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { getHistory } from "@/app/actions/day";

interface DayEntry {
  id: string;
  date: string;
  wakeTime: string;
  dayLengthHours: number;
  topTasks: Array<{ id: string; text: string; done: boolean }>;
  callsBooked: number;
  callsConducted: number;
  distractions: string;
  improvements: string;
  endOfDay: any;
  timeBlocks: Array<{
    id: string;
    startTime: string;
    endTime: string;
    planned: string;
    actual: string;
    status: string;
  }>;
}

export function HistoryView({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await getHistory({ userId, limit: 90 });
      setEntries(data as any);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(entryList: DayEntry[]) {
    const completed = entryList.filter((e) => e.endOfDay).length;
    const totalHours = entryList.reduce((sum, e) => sum + (e.endOfDay?.hoursWorked || 0), 0);
    const avgFocus = entryList.reduce((sum, e) => sum + (e.endOfDay?.focusPct || 0), 0) / completed || 0;
    const avgOutput = entryList.reduce((sum, e) => sum + (e.endOfDay?.outputPct || 0), 0) / completed || 0;
    const totalCallsBooked = entryList.reduce((sum, e) => sum + e.callsBooked, 0);
    const totalCallsConducted = entryList.reduce((sum, e) => sum + e.callsConducted, 0);
    const blocksDone = entryList.reduce(
      (sum, e) => sum + e.timeBlocks.filter((b) => b.status === "done").length,
      0
    );
    const totalBlocks = entryList.reduce((sum, e) => sum + e.timeBlocks.length, 0);
    const completionRate = totalBlocks > 0 ? (blocksDone / totalBlocks) * 100 : 0;
    
    // Count distractions (split by newlines)
    const totalDistractions = entryList.reduce((sum, e) => {
      if (!e.distractions || e.distractions.trim() === "") return sum;
      return sum + e.distractions.split('\n').filter(d => d.trim() !== '').length;
    }, 0);
    
    // Count fulfilled blocks (have actual text)
    const fulfilledBlocks = entryList.reduce((sum, e) => {
      return sum + e.timeBlocks.filter((b) => b.actual && b.actual.trim() !== "").length;
    }, 0);
    const fulfillmentRate = totalBlocks > 0 ? (fulfilledBlocks / totalBlocks) * 100 : 0;

    return {
      completed,
      totalHours,
      avgFocus: Math.round(avgFocus),
      avgOutput: Math.round(avgOutput),
      totalCallsBooked,
      totalCallsConducted,
      completionRate: Math.round(completionRate),
      totalDistractions,
      fulfillmentRate: Math.round(fulfillmentRate),
    };
  }

  function getWeeklyEntries() {
    const weeks: { [key: string]: DayEntry[] } = {};
    entries.forEach((entry) => {
      const date = parse(entry.date, "yyyy-MM-dd", new Date());
      const weekStart = format(startOfWeek(date), "yyyy-MM-dd");
      if (!weeks[weekStart]) weeks[weekStart] = [];
      weeks[weekStart].push(entry);
    });
    return weeks;
  }

  function getMonthlyEntries() {
    const months: { [key: string]: DayEntry[] } = {};
    entries.forEach((entry) => {
      const date = parse(entry.date, "yyyy-MM-dd", new Date());
      const monthKey = format(startOfMonth(date), "yyyy-MM");
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(entry);
    });
    return months;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
          <div className="text-gray-600 font-medium">Loading history...</div>
        </div>
      </div>
    );
  }

  const stats = calculateStats(entries);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">History</h1>
        <p className="text-gray-600">Track your productivity over time</p>
      </div>

      {/* View Toggle */}
      <div className="card">
        <div className="flex gap-3">
          <button
            onClick={() => setView("daily")}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              view === "daily" 
                ? "bg-primary-600 text-white shadow-medium" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setView("weekly")}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              view === "weekly" 
                ? "bg-primary-600 text-white shadow-medium" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setView("monthly")}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              view === "monthly" 
                ? "bg-primary-600 text-white shadow-medium" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Overall Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-white rounded-lg">
            <div className="text-sm font-semibold text-gray-600 mb-1">Total Hours</div>
            <div className="text-3xl font-bold text-primary-600">{stats.totalHours.toFixed(1)}</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-white rounded-lg">
            <div className="text-sm font-semibold text-gray-600 mb-1">Avg Focus</div>
            <div className="text-3xl font-bold text-green-600">{stats.avgFocus}%</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg">
            <div className="text-sm font-semibold text-gray-600 mb-1">Avg Output</div>
            <div className="text-3xl font-bold text-blue-600">{stats.avgOutput}%</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg">
            <div className="text-sm font-semibold text-gray-600 mb-1">Completion</div>
            <div className="text-3xl font-bold text-purple-600">{stats.completionRate}%</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-white rounded-lg">
            <div className="text-sm font-semibold text-gray-600 mb-1">Calls Booked</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.totalCallsBooked}</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg">
            <div className="text-sm font-semibold text-gray-600 mb-1">Calls Done</div>
            <div className="text-3xl font-bold text-orange-600">{stats.totalCallsConducted}</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-white rounded-lg">
            <div className="text-sm font-semibold text-gray-600 mb-1">Distractions</div>
            <div className="text-3xl font-bold text-red-600">{stats.totalDistractions}</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-white rounded-lg">
            <div className="text-sm font-semibold text-gray-600 mb-1">Fulfillment</div>
            <div className="text-3xl font-bold text-indigo-600">{stats.fulfillmentRate}%</div>
          </div>
        </div>
      </div>

      {/* Daily View */}
      {view === "daily" && (
        <div className="space-y-4">
          {entries.map((entry) => {
            const stats = calculateStats([entry]);
            const fulfilledBlocks = entry.timeBlocks.filter((b) => b.actual && b.actual.trim() !== "").length;
            const doneBlocks = entry.timeBlocks.filter((b) => b.status === "done").length;
            const distractionsList = entry.distractions 
              ? entry.distractions.split('\n').filter(d => d.trim() !== '')
              : [];
            
            return (
              <div key={entry.id} className="card card-hover">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{format(parse(entry.date, "yyyy-MM-dd", new Date()), "MMM d, yyyy")}</div>
                    <div className="text-sm text-gray-600 mt-1">{entry.wakeTime} - {entry.dayLengthHours}h day</div>
                  </div>
                  <div className="flex gap-2">
                    {entry.endOfDay && (
                      <span className="badge badge-success">Completed</span>
                    )}
                    {fulfilledBlocks > 0 && (
                      <span className="badge badge-info">{fulfilledBlocks}/{entry.timeBlocks.length} fulfilled</span>
                    )}
                  </div>
                </div>

                {/* Top Tasks */}
                {entry.topTasks && entry.topTasks.some(t => t.text) && (
                  <div className="mb-4 pt-4 border-t border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Top Tasks</div>
                    <div className="space-y-1">
                      {entry.topTasks.filter(t => t.text).map((task, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className={task.done ? "text-green-600" : "text-gray-400"}>
                            {task.done ? "✓" : "○"}
                          </span>
                          <span className={task.done ? "line-through text-gray-500" : "text-gray-700"}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time Blocks Summary */}
                <div className="mb-4 pt-4 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Time Blocks</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Done:</span> <span className="font-semibold text-green-600">{doneBlocks}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fulfilled:</span> <span className="font-semibold text-blue-600">{fulfilledBlocks}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span> <span className="font-semibold">{entry.timeBlocks.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Calls:</span> <span className="font-semibold">{entry.callsConducted}/{entry.callsBooked}</span>
                    </div>
                  </div>
                  
                  {/* Show some fulfilled blocks */}
                  {fulfilledBlocks > 0 && (
                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                      {entry.timeBlocks
                        .filter(b => b.actual && b.actual.trim() !== "")
                        .slice(0, 5)
                        .map((block) => (
                          <div key={block.id} className="p-2 bg-gray-50 rounded text-xs">
                            <div className="font-semibold text-gray-900 mb-1">
                              {block.startTime} - {block.endTime}
                              {block.status === "done" && <span className="ml-2 text-green-600">✓</span>}
                            </div>
                            {block.planned && (
                              <div className="text-gray-600 mb-1">Planned: {block.planned}</div>
                            )}
                            <div className="text-gray-700">{block.actual}</div>
                          </div>
                        ))}
                      {fulfilledBlocks > 5 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{fulfilledBlocks - 5} more blocks...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Distractions */}
                {distractionsList.length > 0 && (
                  <div className="mb-4 pt-4 border-t border-gray-100">
                    <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                      Distractions ({distractionsList.length})
                    </div>
                    <div className="space-y-1">
                      {distractionsList.map((distraction, idx) => (
                        <div key={idx} className="text-sm text-gray-700 bg-red-50 p-2 rounded">
                          • {distraction}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {entry.improvements && entry.improvements.trim() !== "" && (
                  <div className="mb-4 pt-4 border-t border-gray-100">
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Improvements</div>
                    <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded whitespace-pre-wrap">
                      {entry.improvements}
                    </div>
                  </div>
                )}

                {/* End of Day Stats */}
                {entry.endOfDay && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">End of Day Review</div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Hours</div>
                        <div className="text-xl font-bold text-gray-900">{entry.endOfDay.hoursWorked}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Focus</div>
                        <div className="text-xl font-bold text-gray-900">{entry.endOfDay.focusPct}%</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Output</div>
                        <div className="text-xl font-bold text-gray-900">{entry.endOfDay.outputPct}%</div>
                      </div>
                    </div>
                    {entry.endOfDay.dayThoughts && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Thoughts</div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{entry.endOfDay.dayThoughts}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Weekly View */}
      {view === "weekly" && (
        <div className="space-y-4">
          {Object.entries(getWeeklyEntries())
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([weekStart, weekEntries]) => {
              const weekStats = calculateStats(weekEntries);
              return (
                <div key={weekStart} className="card card-hover">
                  <div className="text-lg font-bold text-gray-900 mb-4">
                    Week of {format(parse(weekStart, "yyyy-MM-dd", new Date()), "MMM d, yyyy")}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Hours</div>
                      <div className="text-2xl font-bold text-gray-900">{weekStats.totalHours.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Avg Focus</div>
                      <div className="text-2xl font-bold text-gray-900">{weekStats.avgFocus}%</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Completion</div>
                      <div className="text-2xl font-bold text-gray-900">{weekStats.completionRate}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Monthly View */}
      {view === "monthly" && (
        <div className="space-y-4">
          {Object.entries(getMonthlyEntries())
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([monthKey, monthEntries]) => {
              const monthStats = calculateStats(monthEntries);
              return (
                <div key={monthKey} className="card card-hover">
                  <div className="text-lg font-bold text-gray-900 mb-4">
                    {format(parse(monthKey + "-01", "yyyy-MM-dd", new Date()), "MMMM yyyy")}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Hours</div>
                      <div className="text-2xl font-bold text-gray-900">{monthStats.totalHours.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Avg Focus</div>
                      <div className="text-2xl font-bold text-gray-900">{monthStats.avgFocus}%</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Completion</div>
                      <div className="text-2xl font-bold text-gray-900">{monthStats.completionRate}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

