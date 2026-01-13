"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { computeCurrentBlock, requestNotificationPermission, startHalfHourNotifier } from "@/lib/reminders";
import { getDayEntry, updateTimeBlock, updateDayEntry, bulkUpdateTimeBlocks } from "@/app/actions/day";
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
  distractions: string;
  timeBlocks: TimeBlock[];
}

export function CheckInView({ userId }: { userId: string }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dayEntry, setDayEntry] = useState<DayEntry | null>(null);
  const [currentBlock, setCurrentBlock] = useState<TimeBlock | null>(null);
  const [actualText, setActualText] = useState("");
  const [distractionText, setDistractionText] = useState("");
  const [editingPreviousBlock, setEditingPreviousBlock] = useState<string | null>(null);

  useEffect(() => {
    loadToday();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (dayEntry) {
      const block = computeCurrentBlock(
        dayEntry.wakeTime,
        dayEntry.dayLengthHours,
        dayEntry.timeBlocks.map((b) => ({ id: b.id, startTime: b.startTime, endTime: b.endTime }))
      );
      if (block) {
        const fullBlock = dayEntry.timeBlocks.find((b) => b.id === block.id);
        setCurrentBlock(fullBlock || null);
        if (fullBlock) {
          setActualText(fullBlock.actual);
        }
      } else {
        setCurrentBlock(null);
      }
    }
  }, [dayEntry, currentTime]);

  useEffect(() => {
    // Request notification permission and start reminders
    requestNotificationPermission().then(() => {
      const stop = startHalfHourNotifier({
        title: "Check-in: What are you doing right now?",
        body: "Time for your 30-minute check-in",
        onFire: () => {
          console.log("Check-in reminder fired");
        },
        checkUnfulfilled: () => {
          if (!dayEntry) return { count: 0, blocks: [] };
          
          const now = new Date();
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          
          const unfulfilled = dayEntry.timeBlocks.filter((block) => {
            const [endH, endM] = block.endTime.split(":").map(Number);
            const endMinutes = endH * 60 + endM;
            // Block ended in last 5 minutes and has no actual entry
            return endMinutes < nowMinutes && 
                   endMinutes >= nowMinutes - 5 &&
                   (!block.actual || block.actual.trim() === "") &&
                   block.status !== "skipped";
          });
          
          return { count: unfulfilled.length, blocks: unfulfilled };
        },
      });
      return () => stop();
    });
  }, [dayEntry]);

  async function loadToday() {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const entry = await getDayEntry({ userId, date: today });
      if (entry) {
        setDayEntry(entry as any);
      }
    } catch (error) {
      console.error("Failed to load today:", error);
    }
  }

  async function handleStatusChange(status: string) {
    if (!currentBlock || !dayEntry) return;
    const currentActual = actualText || currentBlock.actual;
    await updateTimeBlock({
      userId,
      timeBlockId: currentBlock.id,
      status,
      actual: currentActual,
    });
    const updatedBlocks = dayEntry.timeBlocks.map((b) =>
      b.id === currentBlock.id ? { ...b, status, actual: currentActual } : b
    );
    setDayEntry({ ...dayEntry, timeBlocks: updatedBlocks });
    setCurrentBlock({ ...currentBlock, status, actual: currentActual });
    setActualText(currentActual);
  }

  async function handleActualSave(newValue?: string) {
    if (!currentBlock || !dayEntry) return;
    const valueToSave = newValue !== undefined ? newValue : actualText;
    await updateTimeBlock({
      userId,
      timeBlockId: currentBlock.id,
      actual: valueToSave,
    });
    const updatedBlocks = dayEntry.timeBlocks.map((b) =>
      b.id === currentBlock.id ? { ...b, actual: valueToSave } : b
    );
    setDayEntry({ ...dayEntry, timeBlocks: updatedBlocks });
    setCurrentBlock({ ...currentBlock, actual: valueToSave });
    setActualText(valueToSave);
  }

  async function handleAddDistraction() {
    if (!dayEntry || !distractionText.trim()) return;
    const newDistractions = dayEntry.distractions
      ? `${dayEntry.distractions}\n${distractionText}`
      : distractionText;
    await updateDayEntry({
      userId,
      dayEntryId: dayEntry.id,
      distractions: newDistractions,
    });
    setDayEntry({ ...dayEntry, distractions: newDistractions });
    setDistractionText("");
  }

  function getPreviousBlocks(): TimeBlock[] {
    if (!dayEntry) return [];
    
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Get all blocks that have ended (endTime < current time)
    const previousBlocks = dayEntry.timeBlocks.filter((block) => {
      const [endH, endM] = block.endTime.split(":").map(Number);
      const endMinutes = endH * 60 + endM;
      return endMinutes < nowMinutes;
    });
    
    // Sort by time descending (most recent first) - show ALL previous blocks
    return previousBlocks.sort((a, b) => {
      const [aH, aM] = a.endTime.split(":").map(Number);
      const [bH, bM] = b.endTime.split(":").map(Number);
      return (bH * 60 + bM) - (aH * 60 + aM);
    });
  }

  function getUnfulfilledCount(): number {
    if (!dayEntry) return 0;
    
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

  // Reload day entry periodically to update unfulfilled count
  useEffect(() => {
    const interval = setInterval(() => {
      loadToday();
    }, 60000); // Reload every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleUpdatePreviousBlock(blockId: string, field: "planned" | "actual" | "status", value: string) {
    if (!dayEntry) return;
    
    const block = dayEntry.timeBlocks.find(b => b.id === blockId);
    if (!block) return;

    const updateData: any = {};
    if (field === "planned") updateData.planned = value;
    if (field === "actual") updateData.actual = value;
    if (field === "status") updateData.status = value;

    await updateTimeBlock({
      userId,
      timeBlockId: blockId,
      ...updateData,
    });

    const updatedBlocks = dayEntry.timeBlocks.map((b) =>
      b.id === blockId ? { ...b, ...updateData } : b
    );
    setDayEntry({ ...dayEntry, timeBlocks: updatedBlocks });
    setEditingPreviousBlock(null);
  }

  async function handleFillTodayBlocks() {
    if (!dayEntry) return;
    
    const updates = [
      { startTime: "07:00", endTime: "07:30", actual: "Woke up, driving nephew to school", status: "done" },
      { startTime: "07:30", endTime: "08:00", actual: "Driving nephew to school", status: "done" },
      { startTime: "08:00", endTime: "08:30", actual: "In the shop, came back, prepared meal", status: "done" },
      { startTime: "08:30", endTime: "09:00", actual: "Working on mobile and design, watching YouTube", status: "done" },
      { startTime: "09:00", endTime: "10:00", actual: "Meeting", status: "done" },
      { startTime: "10:00", endTime: "10:30", actual: "Eating breakfast", status: "done" },
      { startTime: "10:30", endTime: "11:00", actual: "Meeting continued", status: "done" },
      { startTime: "11:00", endTime: "11:30", actual: "Watching YouTube, helping mom with curtains", status: "done" },
      { startTime: "11:30", endTime: "12:00", actual: "Working on mobile, watching YouTube, eating, hanging curtains", status: "done" },
      { startTime: "12:00", endTime: "12:30", actual: "Working on mobile, watching YouTube, eating, hanging curtains", status: "done" },
      { startTime: "12:30", endTime: "13:00", actual: "Working on mobile, watching YouTube, eating, hanging curtains", status: "done" },
      { startTime: "13:00", endTime: "13:30", actual: "Working on mobile, watching YouTube, eating, hanging curtains", status: "done" },
      { startTime: "13:30", endTime: "14:00", actual: "Working on mobile, watching YouTube, eating, hanging curtains", status: "done" },
      { startTime: "14:00", endTime: "14:30", actual: "Working on mobile, watching YouTube, eating, hanging curtains", status: "done" },
      { startTime: "14:30", endTime: "15:00", actual: "Working on mobile, watching YouTube, eating, hanging curtains", status: "done" },
      { startTime: "15:00", endTime: "15:30", actual: "Meeting with client, closed the deal", status: "done" },
      { startTime: "15:30", endTime: "16:00", actual: "Planning workout, working on mobile design, listening", status: "in_progress" },
    ];

    const blockUpdates = updates
      .map(update => {
        const block = dayEntry.timeBlocks.find(b => b.startTime === update.startTime && b.endTime === update.endTime);
        if (!block) return null;
        return {
          timeBlockId: block.id,
          actual: update.actual,
          status: update.status,
        };
      })
      .filter((u): u is { timeBlockId: string; actual: string; status: string } => u !== null);

    if (blockUpdates.length === 0) {
      alert("No matching blocks found. Make sure your wake time is 7:00 AM.");
      return;
    }

    try {
      await bulkUpdateTimeBlocks({
        userId,
        updates: blockUpdates,
      });
      
      // Reload to show updated data
      await loadToday();
      alert(`Successfully filled ${blockUpdates.length} time blocks!`);
    } catch (error) {
      console.error("Failed to fill blocks:", error);
      alert(`Failed to fill blocks: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  if (!dayEntry) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-In</h1>
        <p className="text-gray-600">Track what you&apos;re doing right now</p>
      </div>

      {/* Current Time */}
      <div className="card text-center">
        <div className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2">
          {format(currentTime, "HH:mm:ss")}
        </div>
        <div className="text-lg text-gray-600 font-medium">
          {format(currentTime, "EEEE, MMMM d, yyyy")}
        </div>
      </div>

      {/* Current Block */}
      {currentBlock ? (
        <div className="card">
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Current Time Block</div>
            <div className="text-2xl font-bold text-gray-900">
              {currentBlock.startTime} - {currentBlock.endTime}
            </div>
          </div>

          {currentBlock.planned && (
            <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="text-xs font-semibold text-primary-700 mb-1 uppercase tracking-wide">Planned</div>
              <div className="text-base font-semibold text-gray-900">{currentBlock.planned}</div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">What are you actually doing?</label>
            <textarea
              defaultValue={actualText}
              onBlur={(e) => {
                const newValue = e.target.value;
                if (newValue !== currentBlock?.actual) {
                  handleActualSave(newValue);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.currentTarget.blur();
                }
              }}
              placeholder="Enter what you're doing right now..."
              className="input"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleStatusChange("in_progress")}
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                currentBlock.status === "in_progress"
                  ? "bg-primary-600 text-white shadow-medium scale-105"
                  : "bg-primary-100 text-primary-700 hover:bg-primary-200"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => handleStatusChange("done")}
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                currentBlock.status === "done"
                  ? "bg-green-600 text-white shadow-medium scale-105"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              Done
            </button>
            <button
              onClick={() => handleStatusChange("skipped")}
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                currentBlock.status === "skipped"
                  ? "bg-gray-600 text-white shadow-medium scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Skipped
            </button>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">⏰</div>
          <div className="text-gray-600 font-medium">
            No active time block. Your day may not have started yet or has ended.
          </div>
          {unfulfilledCount > 0 && (
            <div className="mt-4">
              <span className="badge badge-warning text-base font-bold px-4 py-2">
                {unfulfilledCount} unfulfilled block{unfulfilledCount > 1 ? "s" : ""} need attention!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Fill Today Button - Only show for today */}
      {getPreviousBlocks().length > 0 && format(new Date(), "yyyy-MM-dd") === dayEntry.date && (
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quick Fill Today</h2>
              <p className="text-sm text-gray-600 mt-1">Fill all today&apos;s blocks based on your schedule</p>
            </div>
            <button
              onClick={handleFillTodayBlocks}
              className="btn-primary px-6 py-2 font-semibold"
            >
              Fill All Today
            </button>
          </div>
        </div>
      )}

      {/* Previous Blocks */}
      {getPreviousBlocks().length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Fill Previous Blocks</h2>
              <p className="text-sm text-gray-600 mt-1">Update past time blocks you may have missed ({getPreviousBlocks().length} blocks)</p>
            </div>
            {unfulfilledCount > 0 && (
              <span className="badge badge-warning text-sm font-bold">
                {unfulfilledCount} unfulfilled
              </span>
            )}
          </div>
          <div className="space-y-4">
            {getPreviousBlocks().map((block) => {
              const isEditing = editingPreviousBlock === block.id;
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
                  className={`p-4 border rounded-lg ${statusColors[block.status as keyof typeof statusColors] || statusColors.empty}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {block.startTime} - {block.endTime}
                      </div>
                      {block.planned && !isEditing && (
                        <div className="text-xs text-gray-600 mt-1">Planned: {block.planned}</div>
                      )}
                    </div>
                    <span className={`${statusBadges[block.status as keyof typeof statusBadges] || statusBadges.empty} capitalize`}>
                      {block.status}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Planned</label>
                        <input
                          type="text"
                          defaultValue={block.planned}
                          onBlur={(e) => {
                            if (e.target.value !== block.planned) {
                              handleUpdatePreviousBlock(block.id, "planned", e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          className="input text-sm"
                          placeholder="What was planned?"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Actual</label>
                        <textarea
                          defaultValue={block.actual}
                          onBlur={(e) => {
                            if (e.target.value !== block.actual) {
                              handleUpdatePreviousBlock(block.id, "actual", e.target.value);
                            }
                          }}
                          className="input text-sm"
                          rows={2}
                          placeholder="What actually happened?"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            handleUpdatePreviousBlock(block.id, "status", "in_progress");
                          }}
                          className={`px-3 py-2 rounded text-xs font-semibold ${
                            block.status === "in_progress"
                              ? "bg-primary-600 text-white"
                              : "bg-primary-100 text-primary-700"
                          }`}
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => {
                            handleUpdatePreviousBlock(block.id, "status", "done");
                          }}
                          className={`px-3 py-2 rounded text-xs font-semibold ${
                            block.status === "done"
                              ? "bg-green-600 text-white"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          Done
                        </button>
                        <button
                          onClick={() => {
                            handleUpdatePreviousBlock(block.id, "status", "skipped");
                          }}
                          className={`px-3 py-2 rounded text-xs font-semibold ${
                            block.status === "skipped"
                              ? "bg-gray-600 text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          Skipped
                        </button>
                      </div>
                      <button
                        onClick={() => setEditingPreviousBlock(null)}
                        className="btn-secondary w-full text-sm py-2"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {block.actual ? (
                        <div className="text-sm text-gray-700 bg-white/50 p-2 rounded">
                          {block.actual}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">No entry yet</div>
                      )}
                      <button
                        onClick={() => setEditingPreviousBlock(block.id)}
                        className="btn-secondary w-full text-sm py-2"
                      >
                        Edit Block
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {getPreviousBlocks().length > 10 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Showing all {getPreviousBlocks().length} previous blocks. Scroll to see more.
            </div>
          )}
        </div>
      )}

      {/* Add Distraction */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Distraction</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={distractionText}
            onChange={(e) => setDistractionText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddDistraction();
              }
            }}
            placeholder="What distracted you?"
            className="input flex-1"
          />
          <button
            onClick={handleAddDistraction}
            className="btn-primary px-6"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

