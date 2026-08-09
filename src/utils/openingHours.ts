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
