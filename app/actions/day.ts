"use server";

import { prisma } from "@/lib/db";
import { generateHalfHourBlocks } from "@/lib/timeBlocks";

function defaultTopTasks() {
  return [
    { id: "t1", text: "", done: false },
    { id: "t2", text: "", done: false },
    { id: "t3", text: "", done: false },
  ];
}

export async function upsertTodayDayEntry(params: {
  userId: string;
  date: string; // YYYY-MM-DD
  wakeTime?: string;
  dayLengthHours?: number;
}) {
  const existing = await prisma.dayEntry.findUnique({
    where: { userId_date: { userId: params.userId, date: params.date } },
    include: { timeBlocks: true },
  });

  if (!existing) {
    const wakeTime = params.wakeTime ?? "07:00";
    const dayLengthHours = params.dayLengthHours ?? 15;

    const created = await prisma.dayEntry.create({
      data: {
        userId: params.userId,
        date: params.date,
        wakeTime,
        dayLengthHours,
        topTasks: defaultTopTasks(),
      },
    });

    const blocks = generateHalfHourBlocks(wakeTime, dayLengthHours);
    await prisma.timeBlock.createMany({
      data: blocks.map((b) => ({
        userId: params.userId,
        dayEntryId: created.id,
        startTime: b.startTime,
        endTime: b.endTime,
        status: "empty",
      })),
    });

    return prisma.dayEntry.findUnique({
      where: { id: created.id },
      include: { timeBlocks: { orderBy: { startTime: "asc" } } },
    });
  }

  // If wakeTime/dayLength changes, reconcile blocks while preserving text by startTime
  const newWakeTime = params.wakeTime ?? existing.wakeTime;
  const newLen = params.dayLengthHours ?? existing.dayLengthHours;

  const mustRegen =
    newWakeTime !== existing.wakeTime || newLen !== existing.dayLengthHours;

  if (!mustRegen) return existing;

  const desired = generateHalfHourBlocks(newWakeTime, newLen);

  // Map existing blocks by startTime for preserving planned/actual/status
  const existingMap = new Map(existing.timeBlocks.map((b) => [b.startTime, b]));

  // Upsert desired blocks
  for (const b of desired) {
    const old = existingMap.get(b.startTime);
    if (old) {
      await prisma.timeBlock.update({
        where: { id: old.id },
        data: { endTime: b.endTime }, // keep user data
      });
    } else {
      await prisma.timeBlock.create({
        data: {
          userId: params.userId,
          dayEntryId: existing.id,
          startTime: b.startTime,
          endTime: b.endTime,
          status: "empty",
        },
      });
    }
  }

  // Delete blocks that are no longer in the desired schedule
  const desiredSet = new Set(desired.map((b) => b.startTime));
  const toDelete = existing.timeBlocks.filter((b) => !desiredSet.has(b.startTime));
  if (toDelete.length) {
    await prisma.timeBlock.deleteMany({ where: { id: { in: toDelete.map((b) => b.id) } } });
  }

  await prisma.dayEntry.update({
    where: { id: existing.id },
    data: { wakeTime: newWakeTime, dayLengthHours: newLen },
  });

  return prisma.dayEntry.findUnique({
    where: { id: existing.id },
    include: { timeBlocks: { orderBy: { startTime: "asc" } } },
  });
}

export async function updateTimeBlock(params: {
  userId: string;
  timeBlockId: string;
  planned?: string;
  actual?: string;
  status?: string;
}) {
  // Validate ownership
  const block = await prisma.timeBlock.findUnique({
    where: { id: params.timeBlockId },
  });

  if (!block || block.userId !== params.userId) {
    throw new Error("Unauthorized");
  }

  return prisma.timeBlock.update({
    where: { id: params.timeBlockId },
    data: {
      planned: params.planned,
      actual: params.actual,
      status: params.status,
    },
  });
}

export async function updateDayEntry(params: {
  userId: string;
  dayEntryId: string;
  topTasks?: any;
  callsBooked?: number;
  callsConducted?: number;
  distractions?: string;
  improvements?: string;
}) {
  const entry = await prisma.dayEntry.findUnique({
    where: { id: params.dayEntryId },
  });

  if (!entry || entry.userId !== params.userId) {
    throw new Error("Unauthorized");
  }

  return prisma.dayEntry.update({
    where: { id: params.dayEntryId },
    data: {
      topTasks: params.topTasks,
      callsBooked: params.callsBooked,
      callsConducted: params.callsConducted,
      distractions: params.distractions,
      improvements: params.improvements,
    },
  });
}

export async function updateEndOfDay(params: {
  userId: string;
  dayEntryId: string;
  endOfDay: {
    hoursWorked: number;
    focusPct: number;
    outputPct: number;
    dayThoughts: string;
    completedAt?: string; // ISO
  };
}) {
  const entry = await prisma.dayEntry.findUnique({
    where: { id: params.dayEntryId },
  });

  if (!entry || entry.userId !== params.userId) {
    throw new Error("Unauthorized");
  }

  return prisma.dayEntry.update({
    where: { id: params.dayEntryId },
    data: { endOfDay: params.endOfDay as any },
  });
}

export async function getDayEntry(params: {
  userId: string;
  date: string;
}) {
  return prisma.dayEntry.findUnique({
    where: { userId_date: { userId: params.userId, date: params.date } },
    include: { timeBlocks: { orderBy: { startTime: "asc" } } },
  });
}

export async function getHistory(params: {
  userId: string;
  limit?: number;
}) {
  return prisma.dayEntry.findMany({
    where: { userId: params.userId },
    include: { 
      timeBlocks: {
        orderBy: { startTime: "asc" }
      }
    },
    orderBy: { date: "desc" },
    take: params.limit ?? 30,
  });
}

