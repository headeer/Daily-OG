import { addMinutes, format, parse } from "date-fns";

export function generateHalfHourBlocks(wakeTimeHHmm: string, dayLengthHours = 15) {
  // Use a fixed "anchor date" so we can safely do arithmetic
  const base = parse(wakeTimeHHmm, "HH:mm", new Date(2000, 0, 1));

  const totalMinutes = dayLengthHours * 60;
  const blocks: { startTime: string; endTime: string }[] = [];

  for (let m = 0; m < totalMinutes; m += 30) {
    const start = addMinutes(base, m);
    const end = addMinutes(base, m + 30);
    blocks.push({
      startTime: format(start, "HH:mm"),
      endTime: format(end, "HH:mm"),
    });
  }
  return blocks;
}

