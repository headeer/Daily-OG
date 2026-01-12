import { parse, isWithinInterval } from "date-fns";

export function computeCurrentBlock(
  wakeTimeHHmm: string,
  dayLengthHours: number,
  blocks: { startTime: string; endTime: string; id: string }[]
) {
  const now = new Date();
  const anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const wake = parse(wakeTimeHHmm, "HH:mm", anchor);
  const end = new Date(wake.getTime() + dayLengthHours * 60 * 60 * 1000);

  if (!isWithinInterval(now, { start: wake, end })) return null;

  // Parse current time to minutes for accurate comparison
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Find block where startTime <= now < endTime
  return blocks.find((b) => {
    const [startH, startM] = b.startTime.split(":").map(Number);
    const [endH, endM] = b.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }) ?? null;
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined") return "denied" as NotificationPermission;
  if (!("Notification" in window)) return "denied" as NotificationPermission;
  if (Notification.permission === "granted") return "granted";
  return await Notification.requestPermission();
}

/**
 * While the app tab is open:
 * - schedules a notification at the next :00 or :30 boundary
 * - then repeats every 30 minutes
 */
export function playNotificationSound() {
  if (typeof window === "undefined") return;
  
  // Create audio context and play a beep sound
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.error("Could not play sound:", e);
  }
}

export function startHalfHourNotifier(opts: {
  title: string;
  body: string;
  onFire?: () => void;
  checkUnfulfilled?: () => { count: number; blocks: any[] };
}) {
  if (typeof window === "undefined") return () => {};
  let intervalId: any = null;
  let timeoutId: any = null;
  let blockEndCheckInterval: any = null;

  const showNotification = (title: string, body: string, urgent = false) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        requireInteraction: urgent,
        tag: urgent ? "unfulfilled-block" : "check-in",
      });
      
      playNotificationSound();
      
      // Show multiple notifications for urgent ones
      if (urgent) {
        setTimeout(() => {
          playNotificationSound();
          new Notification(title, {
            body: body + " (Reminder 2)",
            icon: "/favicon.ico",
            requireInteraction: true,
            tag: "unfulfilled-block-2",
          });
        }, 5000);
        
        setTimeout(() => {
          playNotificationSound();
          new Notification(title, {
            body: body + " (Reminder 3)",
            icon: "/favicon.ico",
            requireInteraction: true,
            tag: "unfulfilled-block-3",
          });
        }, 10000);
      }
    }
  };

  // Check for unfulfilled blocks every minute
  const startBlockEndChecker = () => {
    blockEndCheckInterval = setInterval(() => {
      if (opts.checkUnfulfilled) {
        const result = opts.checkUnfulfilled();
        if (result.count > 0) {
          const block = result.blocks[0];
          showNotification(
            "⚠️ Unfulfilled Time Block!",
            `Block ${block.startTime}-${block.endTime} ended without entry. Please fill it now!`,
            true
          );
        }
      }
    }, 60000); // Check every minute
  };

  const schedule = () => {
    const now = new Date();
    const mins = now.getMinutes();
    const nextMins = mins < 30 ? 30 : 60;
    const next = new Date(now);
    next.setMinutes(nextMins, 0, 0);

    const ms = next.getTime() - now.getTime();

    timeoutId = setTimeout(() => {
      showNotification(opts.title, opts.body);
      opts.onFire?.();
      startBlockEndChecker();

      intervalId = setInterval(() => {
        showNotification(opts.title, opts.body);
        opts.onFire?.();
      }, 30 * 60 * 1000);
    }, ms);
  };

  schedule();

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (intervalId) clearInterval(intervalId);
    if (blockEndCheckInterval) clearInterval(blockEndCheckInterval);
  };
}

