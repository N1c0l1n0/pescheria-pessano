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

/**
 * Check if a time string "HH:MM" falls within the store's opening hours for a given Date
 */
export function isTimeInOpeningHours(timeStr: string, date: Date = new Date()): boolean {
  const schedule = getDaySchedule(date);
  if (schedule.isClosedAllDay || !schedule.slots.length) return false;

  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return false;
  const targetMin = parts[0] * 60 + parts[1];

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

  const hoursSet = new Set<number>();
  schedule.slots.forEach((slot) => {
    const openH = parseInt(slot.open.split(':')[0], 10);
    const closeH = parseInt(slot.close.split(':')[0], 10);
    for (let h = openH; h <= closeH; h++) {
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

  const valid: number[] = [];
  for (let m = 0; m < 60; m += step) {
    const totalMin = hour * 60 + m;
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
 * Get quick selectable time slot strings (e.g., ["12:30", "13:00", ...]) for a date
 */
export function getQuickTimeOptionsForDate(date: Date = new Date()): string[] {
  const schedule = getDaySchedule(date);
  if (schedule.isClosedAllDay || !schedule.slots.length) return [];

  const slotsOptions: string[] = [];
  schedule.slots.forEach((slot) => {
    const openMin = timeToMinutes(slot.open);
    const closeMin = timeToMinutes(slot.close);

    // Round openMin up to nearest 15/30 min
    const startMin = Math.ceil(openMin / 30) * 30;
    for (let m = startMin; m <= closeMin; m += 30) {
      const hh = Math.floor(m / 60).toString().padStart(2, '0');
      const mm = (m % 60).toString().padStart(2, '0');
      slotsOptions.push(`${hh}:${mm}`);
    }
  });

  return slotsOptions;
}

