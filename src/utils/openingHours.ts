export interface TimeSlot {
  open: string;  // e.g. "08:30"
  close: string; // e.g. "14:30"
}

export interface DaySchedule {
  dayIndex: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayName: string;
  slots: TimeSlot[];
  isClosedAllDay: boolean;
}

export const WEEKLY_SCHEDULE: DaySchedule[] = [
  {
    dayIndex: 1,
    dayName: 'Lunedì',
    slots: [],
    isClosedAllDay: true,
  },
  {
    dayIndex: 2,
    dayName: 'Martedì',
    slots: [{ open: '08:30', close: '14:30' }],
    isClosedAllDay: false,
  },
  {
    dayIndex: 3,
    dayName: 'Mercoledì',
    slots: [{ open: '08:30', close: '14:30' }],
    isClosedAllDay: false,
  },
  {
    dayIndex: 4,
    dayName: 'Giovedì',
    slots: [{ open: '08:30', close: '14:30' }],
    isClosedAllDay: false,
  },
  {
    dayIndex: 5,
    dayName: 'Venerdì',
    slots: [
      { open: '08:30', close: '14:45' },
      { open: '17:45', close: '20:30' },
    ],
    isClosedAllDay: false,
  },
  {
    dayIndex: 6,
    dayName: 'Sabato',
    slots: [
      { open: '08:30', close: '14:45' },
      { open: '17:45', close: '20:30' },
    ],
    isClosedAllDay: false,
  },
  {
    dayIndex: 0,
    dayName: 'Domenica',
    slots: [
      { open: '09:00', close: '14:45' },
      { open: '17:45', close: '20:30' },
    ],
    isClosedAllDay: false,
  },
];

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export interface StoreStatus {
  isOpen: boolean;
  message: string;
  nextEventText: string;
  currentDayName: string;
}

export function getStoreStatus(now: Date = new Date()): StoreStatus {
  const dayIndex = now.getDay(); // 0 = Sun, 1 = Mon, etc.
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todaySchedule = WEEKLY_SCHEDULE.find((s) => s.dayIndex === dayIndex)!;
  const currentDayName = todaySchedule.dayName;

  if (todaySchedule.isClosedAllDay) {
    return {
      isOpen: false,
      message: 'Chiuso Oggi (Lunedì)',
      nextEventText: 'Riapre Domani Martedì alle 08:30',
      currentDayName,
    };
  }

  // Check if inside any slot
  for (const slot of todaySchedule.slots) {
    const openMin = timeToMinutes(slot.open);
    const closeMin = timeToMinutes(slot.close);

    if (currentMinutes >= openMin && currentMinutes < closeMin) {
      return {
        isOpen: true,
        message: 'Aperto Ora',
        nextEventText: `Chiude alle ${slot.close}`,
        currentDayName,
      };
    }
  }

  // If before first slot today
  if (todaySchedule.slots.length > 0) {
    const firstOpen = timeToMinutes(todaySchedule.slots[0].open);
    if (currentMinutes < firstOpen) {
      return {
        isOpen: false,
        message: 'Chiuso Ora',
        nextEventText: `Apre oggi alle ${todaySchedule.slots[0].open}`,
        currentDayName,
      };
    }
  }

  // If between morning and afternoon slot on Fri/Sat/Sun
  if (todaySchedule.slots.length > 1) {
    const morningClose = timeToMinutes(todaySchedule.slots[0].close);
    const afternoonOpen = timeToMinutes(todaySchedule.slots[1].open);

    if (currentMinutes >= morningClose && currentMinutes < afternoonOpen) {
      return {
        isOpen: false,
        message: 'Pausa Pomeridiana',
        nextEventText: `Riapre oggi alle ${todaySchedule.slots[1].open}`,
        currentDayName,
      };
    }
  }

  // After last slot of today, look for next day opening
  const nextDayIndex = (dayIndex + 1) % 7;
  const nextSchedule = WEEKLY_SCHEDULE.find((s) => s.dayIndex === nextDayIndex)!;

  if (nextSchedule.isClosedAllDay) {
    return {
      isOpen: false,
      message: 'Chiuso Ora',
      nextEventText: 'Riapre Martedì alle 08:30',
      currentDayName,
    };
  } else {
    return {
      isOpen: false,
      message: 'Chiuso Ora',
      nextEventText: `Riapre domani alle ${nextSchedule.slots[0].open}`,
      currentDayName,
    };
  }
}

/**
 * Get schedule object for a specific Date
 */
export function getDaySchedule(date: Date = new Date()): DaySchedule {
  const dayIndex = date.getDay();
  return WEEKLY_SCHEDULE.find((s) => s.dayIndex === dayIndex) || WEEKLY_SCHEDULE[0];
}

function isSameDay(d1: Date, d2: Date = new Date()): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Check if a time string "HH:MM" falls within the store's opening hours for a given Date
 * AND is equal to or after current time if the date is Today.
 */
export function isTimeInOpeningHours(timeStr: string, date: Date = new Date()): boolean {
  const schedule = getDaySchedule(date);
  if (schedule.isClosedAllDay || !schedule.slots.length) return false;

  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return false;
  const targetMin = parts[0] * 60 + parts[1];

  const now = new Date();
  if (isSameDay(date, now)) {
    const currentMin = now.getHours() * 60 + now.getMinutes();
    if (targetMin < currentMin) {
      return false;
    }
  }

  return schedule.slots.some((slot) => {
    const openMin = timeToMinutes(slot.open);
    const closeMin = timeToMinutes(slot.close);
    return targetMin >= openMin && targetMin <= closeMin;
  });
}

/**
 * Get valid hour numbers (0-23) during which the store is open on a given Date
 */
export function getValidHoursForDate(date: Date = new Date()): number[] {
  const schedule = getDaySchedule(date);
  if (schedule.isClosedAllDay || !schedule.slots.length) return [];

  const now = new Date();
  const isToday = isSameDay(date, now);
  const currentHour = now.getHours();

  const hoursSet = new Set<number>();
  schedule.slots.forEach((slot) => {
    const openH = parseInt(slot.open.split(':')[0], 10);
    const closeH = parseInt(slot.close.split(':')[0], 10);
    for (let h = openH; h <= closeH; h++) {
      if (isToday && h < currentHour) continue;
      hoursSet.add(h);
    }
  });

  return Array.from(hoursSet).sort((a, b) => a - b);
}

/**
 * Get valid minute options (step intervals, e.g. 5 or 15 mins) for a specific hour on a given Date
 */
export function getValidMinutesForHour(hour: number, date: Date = new Date(), step: number = 5): number[] {
  const schedule = getDaySchedule(date);
  if (schedule.isClosedAllDay || !schedule.slots.length) return [];

  const now = new Date();
  const isToday = isSameDay(date, now);
  const currentTotalMin = now.getHours() * 60 + now.getMinutes();

  const valid: number[] = [];
  for (let m = 0; m < 60; m += step) {
    const totalMin = hour * 60 + m;
    if (isToday && totalMin < currentTotalMin) continue;

    const isWithinSlot = schedule.slots.some((slot) => {
      const openMin = timeToMinutes(slot.open);
      const closeMin = timeToMinutes(slot.close);
      return totalMin >= openMin && totalMin <= closeMin;
    });
    if (isWithinSlot) {
      valid.push(m);
    }
  }
  return valid;
}

/**
 * Get quick selectable time slot strings (e.g., ["12:30", "13:00", ...]) for a date.
 * Automatically filters out any slots earlier than the current time when date is Today.
 */
export function getQuickTimeOptionsForDate(
  date: Date = new Date(),
  options: { includePast?: boolean; stepMinutes?: number } = {}
): string[] {
  const schedule = getDaySchedule(date);
  if (schedule.isClosedAllDay || !schedule.slots.length) return [];

  const stepMinutes = options.stepMinutes ?? 20;
  const includePast = options.includePast ?? false;
  const now = new Date();
  const isToday = isSameDay(date, now);
  const currentTotalMin = now.getHours() * 60 + now.getMinutes();

  const slotsOptions: string[] = [];
  schedule.slots.forEach((slot) => {
    const openMin = timeToMinutes(slot.open);
    const closeMin = timeToMinutes(slot.close);

    for (let m = openMin; m <= closeMin; m += stepMinutes) {
      // Hide past slots if date is Today
      if (!includePast && isToday && m < currentTotalMin) {
        continue;
      }
      const hh = Math.floor(m / 60).toString().padStart(2, '0');
      const mm = (m % 60).toString().padStart(2, '0');
      slotsOptions.push(`${hh}:${mm}`);
    }
  });

  return slotsOptions;
}

export const MEAL_WINDOWS = {
  pranzo: { start: '11:30', end: '13:30' },
  cena: { start: '18:30', end: '20:15' },
} as const;

export const MEAL_PRESET_TARGETS = {
  pranzo: ['12:10', '12:30', '13:10'],
  cena: ['18:45', '19:05', '19:25', '20:05'],
} as const;

export interface MealPresetOptions {
  pranzo: string[];
  cena: string[];
}

export function dayHasEvening(schedule: DaySchedule): boolean {
  return schedule.slots.some((slot) => timeToMinutes(slot.open) >= timeToMinutes('17:00'));
}

function resolveTargetsToGrid(
  targets: readonly string[],
  gridAll: string[],
  gridVisible: Set<string>,
  window: { start: string; end: string }
): string[] {
  const windowStart = timeToMinutes(window.start);
  const windowEnd = timeToMinutes(window.end);
  const resolved = new Set<string>();

  for (const target of targets) {
    const targetMin = timeToMinutes(target);
    let best: string | null = null;
    let bestDist = Infinity;

    for (const slot of gridAll) {
      const slotMin = timeToMinutes(slot);
      if (slotMin < windowStart || slotMin > windowEnd) continue;
      const dist = Math.abs(slotMin - targetMin);
      if (dist < bestDist || (dist === bestDist && best !== null && slotMin > timeToMinutes(best))) {
        bestDist = dist;
        best = slot;
      }
    }

    if (best && gridVisible.has(best)) {
      resolved.add(best);
    }
  }

  return Array.from(resolved).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}

export function getMealPresetOptionsForDate(date: Date = new Date()): MealPresetOptions {
  const schedule = getDaySchedule(date);
  if (schedule.isClosedAllDay) {
    return { pranzo: [], cena: [] };
  }

  const gridAll = getQuickTimeOptionsForDate(date, { includePast: true });
  const gridVisible = new Set(getQuickTimeOptionsForDate(date, { includePast: false }));
  const hasEvening = dayHasEvening(schedule);

  return {
    pranzo: resolveTargetsToGrid(
      MEAL_PRESET_TARGETS.pranzo,
      gridAll,
      gridVisible,
      MEAL_WINDOWS.pranzo
    ),
    cena: hasEvening
      ? resolveTargetsToGrid(
          MEAL_PRESET_TARGETS.cena,
          gridAll,
          gridVisible,
          MEAL_WINDOWS.cena
        )
      : [],
  };
}

export const MEAL_OVERLAP_MINUTES = 30;

export interface VisibleMealGroups {
  showPranzo: boolean;
  showCena: boolean;
}

export function getVisibleMealGroups(
  date: Date,
  now: Date = new Date()
): VisibleMealGroups {
  const schedule = getDaySchedule(date);
  if (schedule.isClosedAllDay || !schedule.slots.length) {
    return { showPranzo: false, showCena: false };
  }

  const hasEvening = dayHasEvening(schedule);
  if (!isSameDay(date, now)) {
    return { showPranzo: true, showCena: hasEvening };
  }

  const morningClose = timeToMinutes(schedule.slots[0].close);
  const overlapStart = morningClose - MEAL_OVERLAP_MINUTES;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (nowMin < overlapStart) {
    return { showPranzo: true, showCena: false };
  }
  if (nowMin <= morningClose) {
    return { showPranzo: true, showCena: hasEvening };
  }
  return { showPranzo: false, showCena: hasEvening };
}

