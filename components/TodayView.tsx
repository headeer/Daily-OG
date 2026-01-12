"use client";

import { useEffect, useState } from "react";
import { format, parse, addDays, subDays } from "date-fns";
import {
  upsertTodayDayEntry,
  updateTimeBlock,
  updateDayEntry,
  updateEndOfDay,
  getDayEntry,
} from "@/app/actions/day";
import { usePageTitle } from "./PageTitle";

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  planned: string;
  actual: string;
  status: string;
}

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
  timeBlocks: TimeBlock[];
}

export function TodayView({ userId }: { userId: string }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dayEntry, setDayEntry] = useState<DayEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [showEndOfDay, setShowEndOfDay] = useState(false);

  useEffect(() => {
    loadDay();
  }, [selectedDate, userId]);

  function getUnfulfilledCount(): number {
    if (!dayEntry) return 0;
    const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");
    if (!isToday) return 0;
    
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    
    return dayEntry.timeBlocks.filter((block) => {
      const [endH, endM] = block.endTime.split(":").map(Number);
      const endMinutes = endH * 60 + endM;
      return endMinutes < nowMinutes && 
             (!block.actual || block.actual.trim() === "") &&
             block.status !== "skipped";
    }).length;
  }

  const unfulfilledCount = getUnfulfilledCount();
  usePageTitle(unfulfilledCount);

  function parseDayEntry(entry: any): DayEntry {
    return {
      ...entry,
      topTasks: entry.topTasks || [],
      endOfDay: entry.endOfDay || null,
    };
  }

  async function loadDay() {
    setLoading(true);
    try {
      const entry = await upsertTodayDayEntry({
        userId,
        date: selectedDate,
      });
      setDayEntry(parseDayEntry(entry));
    } catch (error) {
      console.error("Failed to load day:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleWakeTimeChange(wakeTime: string) {
    if (!dayEntry) return;
    const updated = await upsertTodayDayEntry({
      userId,
      date: selectedDate,
      wakeTime,
    });
    setDayEntry(parseDayEntry(updated));
  }

  async function handleDayLengthChange(dayLengthHours: number) {
    if (!dayEntry) return;
    const updated = await upsertTodayDayEntry({
      userId,
      date: selectedDate,
      dayLengthHours,
    });
    setDayEntry(parseDayEntry(updated));
  }

  async function handleTopTaskChange(index: number, field: "text" | "done", value: string | boolean) {
    if (!dayEntry) return;
    const newTasks = [...dayEntry.topTasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    await updateDayEntry({
      userId,
      dayEntryId: dayEntry.id,
      topTasks: newTasks,
    });
    setDayEntry({ ...dayEntry, topTasks: newTasks });
  }

  async function handleBlockUpdate(blockId: string, planned: string, status: string) {
    if (!dayEntry) return;
    await updateTimeBlock({
      userId,
      timeBlockId: blockId,
      planned,
      status,
    });
    const updatedBlocks = dayEntry.timeBlocks.map((b) =>
      b.id === blockId ? { ...b, planned, status } : b
    );
    setDayEntry({ ...dayEntry, timeBlocks: updatedBlocks });
    setEditingBlock(null);
  }

  async function handleEndOfDaySubmit(data: {
    hoursWorked: number;
    focusPct: number;
    outputPct: number;
    dayThoughts: string;
  }) {
    if (!dayEntry) return;
    await updateEndOfDay({
      userId,
      dayEntryId: dayEntry.id,
      endOfDay: {
        ...data,
        completedAt: new Date().toISOString(),
      },
    });
    setShowEndOfDay(false);
    loadDay();
  }

  if (loading || !dayEntry) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
          <div className="text-gray-600 font-medium">Loading your day...</div>
        </div>
      </div>
    );
  }

  const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Today</h1>
          <p className="text-gray-600">{format(parse(selectedDate, "yyyy-MM-dd", new Date()), "EEEE, MMMM d, yyyy")}</p>
        </div>
      </div>

      {/* Date Selector */}
      <div className="card">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDate(format(subDays(parse(selectedDate, "yyyy-MM-dd", new Date()), 1), "yyyy-MM-dd"))}
            className="btn-secondary px-4 py-2 rounded-lg"
          >
            ←
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input flex-1"
          />
          <button
            onClick={() => setSelectedDate(format(addDays(parse(selectedDate, "yyyy-MM-dd", new Date()), 1), "yyyy-MM-dd"))}
            className="btn-secondary px-4 py-2 rounded-lg"
          >
            →
          </button>
        </div>
      </div>

      {/* Wake Time & Day Length */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Day Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Wake Time</label>
            <input
              type="time"
              value={dayEntry.wakeTime}
              onChange={(e) => handleWakeTimeChange(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Day Length (hours)</label>
            <input
              type="number"
              min="12"
              max="18"
              value={dayEntry.dayLengthHours}
              onChange={(e) => handleDayLengthChange(Number(e.target.value))}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Top 3 Tasks */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 3 Tasks</h2>
        <div className="space-y-3">
          {dayEntry.topTasks.map((task, idx) => (
            <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={task.done}
                onChange={(e) => handleTopTaskChange(idx, "done", e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <input
                type="text"
                defaultValue={task.text}
                onBlur={(e) => {
                  if (e.target.value !== task.text) {
                    handleTopTaskChange(idx, "text", e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                placeholder={`Task ${idx + 1}`}
                className={`flex-1 input bg-transparent border-0 p-0 focus:ring-0 ${
                  task.done ? "line-through text-gray-500" : ""
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Time Blocks */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Time Blocks</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {dayEntry.timeBlocks.map((block) => {
            const statusColors = {
              done: "bg-green-50 border-green-200",
              in_progress: "bg-blue-50 border-blue-200",
              skipped: "bg-gray-100 border-gray-300",
              planned: "bg-yellow-50 border-yellow-200",
              empty: "bg-white border-gray-200",
            };
            const statusBadges = {
              done: "badge badge-success",
              in_progress: "badge badge-info",
              skipped: "badge badge-gray",
              planned: "badge badge-warning",
              empty: "badge badge-gray",
            };
            return (
              <div
                key={block.id}
                className={`p-4 border rounded-lg transition-all hover:shadow-soft ${statusColors[block.status as keyof typeof statusColors] || statusColors.empty}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {block.startTime} - {block.endTime}
                  </span>
                  <span className={`${statusBadges[block.status as keyof typeof statusBadges] || statusBadges.empty} capitalize`}>
                    {block.status}
                  </span>
                </div>
                {editingBlock === block.id ? (
                  <input
                    type="text"
                    defaultValue={block.planned}
                    onBlur={(e) => {
                      if (e.target.value !== block.planned) {
                        handleBlockUpdate(block.id, e.target.value, block.status === "empty" ? "planned" : block.status);
                      }
                      setEditingBlock(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                    className="input text-sm"
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => setEditingBlock(block.id)}
                    className="text-sm text-gray-700 cursor-pointer hover:text-gray-900"
                  >
                    {block.planned || <span className="text-gray-400 italic">Tap to plan...</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Meta */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Meta</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Calls Booked</label>
            <input
              type="number"
              defaultValue={dayEntry.callsBooked}
              onBlur={(e) => {
                const newValue = Number(e.target.value);
                if (newValue !== dayEntry.callsBooked) {
                  updateDayEntry({
                    userId,
                    dayEntryId: dayEntry.id,
                    callsBooked: newValue,
                  });
                  setDayEntry({ ...dayEntry, callsBooked: newValue });
                }
              }}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Calls Conducted</label>
            <input
              type="number"
              defaultValue={dayEntry.callsConducted}
              onBlur={(e) => {
                const newValue = Number(e.target.value);
                if (newValue !== dayEntry.callsConducted) {
                  updateDayEntry({
                    userId,
                    dayEntryId: dayEntry.id,
                    callsConducted: newValue,
                  });
                  setDayEntry({ ...dayEntry, callsConducted: newValue });
                }
              }}
              className="input"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Distractions</label>
            <textarea
              defaultValue={dayEntry.distractions}
              onBlur={(e) => {
                if (e.target.value !== dayEntry.distractions) {
                  updateDayEntry({
                    userId,
                    dayEntryId: dayEntry.id,
                    distractions: e.target.value,
                  });
                  setDayEntry({ ...dayEntry, distractions: e.target.value });
                }
              }}
              className="input"
              rows={3}
              placeholder="What distracted you today?"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Improvements</label>
            <textarea
              defaultValue={dayEntry.improvements}
              onBlur={(e) => {
                if (e.target.value !== dayEntry.improvements) {
                  updateDayEntry({
                    userId,
                    dayEntryId: dayEntry.id,
                    improvements: e.target.value,
                  });
                  setDayEntry({ ...dayEntry, improvements: e.target.value });
                }
              }}
              className="input"
              rows={3}
              placeholder="What could be improved?"
            />
          </div>
        </div>
      </div>

      {/* End of Day Review */}
      {isToday && (
        <div className="card">
          <button
            onClick={() => setShowEndOfDay(!showEndOfDay)}
            className="btn-primary w-full"
          >
            {dayEntry.endOfDay ? "📊 View End of Day Review" : "✨ Complete End of Day Review"}
          </button>
          {showEndOfDay && (
            <EndOfDayForm
              initialData={dayEntry.endOfDay}
              onSubmit={handleEndOfDaySubmit}
              onCancel={() => setShowEndOfDay(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function EndOfDayForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData: any;
  onSubmit: (data: { hoursWorked: number; focusPct: number; outputPct: number; dayThoughts: string }) => void;
  onCancel: () => void;
}) {
  const [hoursWorked, setHoursWorked] = useState(initialData?.hoursWorked || 0);
  const [focusPct, setFocusPct] = useState(initialData?.focusPct || 0);
  const [outputPct, setOutputPct] = useState(initialData?.outputPct || 0);
  const [dayThoughts, setDayThoughts] = useState(initialData?.dayThoughts || "");

  return (
    <div className="mt-6 p-6 bg-gradient-to-br from-primary-50 to-white border border-primary-200 rounded-xl space-y-6 animate-slide-up">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">End of Day Review</h3>
        <p className="text-sm text-gray-600">Reflect on your day and track your progress</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Hours Worked</label>
          <input
            type="number"
            min="0"
            max="24"
            value={hoursWorked}
            onChange={(e) => setHoursWorked(Number(e.target.value))}
            className="input"
            placeholder="0-24"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Focus %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={focusPct}
            onChange={(e) => setFocusPct(Number(e.target.value))}
            className="input"
            placeholder="0-100"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Output %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={outputPct}
            onChange={(e) => setOutputPct(Number(e.target.value))}
            className="input"
            placeholder="0-100"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Day Thoughts</label>
        <textarea
          value={dayThoughts}
          onChange={(e) => setDayThoughts(e.target.value)}
          className="input"
          rows={4}
          placeholder="How did your day go? What did you learn?"
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onSubmit({ hoursWorked, focusPct, outputPct, dayThoughts })}
          className="btn-primary flex-1"
        >
          Save Review
        </button>
        <button
          onClick={onCancel}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

