import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Check, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import {
  getDaySchedule,
  isTimeInOpeningHours,
  getValidHoursForDate,
  getValidMinutesForHour,
  getQuickTimeOptionsForDate,
} from '../utils/openingHours';

interface AlarmTimePickerProps {
  orderType: 'Ritiro' | 'Consegna';
  selectedTime: string; // e.g. "Prima possibile", "12:30", or custom "14:15"
  selectedDay: 'oggi' | 'domani';
  onTimeChange: (time: string, day: 'oggi' | 'domani') => void;
}

export const AlarmTimePicker: React.FC<AlarmTimePickerProps> = ({
  orderType,
  selectedTime,
  selectedDay,
  onTimeChange,
}) => {
  const [day, setDay] = useState<'oggi' | 'domani'>(selectedDay);
  const [mode, setMode] = useState<'asap' | 'quick' | 'alarm'>('asap');

  // Date objects for Oggi & Domani
  const todayDate = new Date();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(todayDate.getDate() + 1);

  const activeDate = day === 'oggi' ? todayDate : tomorrowDate;
  const activeSchedule = getDaySchedule(activeDate);

  // Alarm clock state (Hours & Minutes)
  const validHours = getValidHoursForDate(activeDate);
  const initialHour = validHours.length > 0 ? validHours[0] : 12;
  const [selectedHour, setSelectedHour] = useState<number>(initialHour);

  const validMinutes = getValidMinutesForHour(selectedHour, activeDate, 5);
  const initialMinute = validMinutes.length > 0 ? validMinutes[0] : 0;
  const [selectedMinute, setSelectedMinute] = useState<number>(initialMinute);

  // Quick preset options for active date
  const quickSlots = getQuickTimeOptionsForDate(activeDate);

  // Sync state if date changes or if initial hour is invalid for day
  useEffect(() => {
    const hours = getValidHoursForDate(activeDate);
    if (hours.length > 0 && !hours.includes(selectedHour)) {
      setSelectedHour(hours[0]);
    }
  }, [day]);

  useEffect(() => {
    const mins = getValidMinutesForHour(selectedHour, activeDate, 5);
    if (mins.length > 0 && !mins.includes(selectedMinute)) {
      setSelectedMinute(mins[0]);
    }
  }, [selectedHour, day]);

  // Formatted custom time string "HH:MM"
  const formattedAlarmTime = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
  const isValidTime = isTimeInOpeningHours(formattedAlarmTime, activeDate);

  // Handle hour increment / decrement
  const handleHourStep = (delta: number) => {
    if (validHours.length === 0) return;
    const currentIndex = validHours.indexOf(selectedHour);
    let nextIndex = currentIndex + delta;
    if (nextIndex < 0) nextIndex = validHours.length - 1;
    if (nextIndex >= validHours.length) nextIndex = 0;
    const newH = validHours[nextIndex];
    setSelectedHour(newH);
    
    // Auto sync minutes
    const newMins = getValidMinutesForHour(newH, activeDate, 5);
    if (newMins.length > 0 && !newMins.includes(selectedMinute)) {
      setSelectedMinute(newMins[0]);
    }

    const timeStr = `${newH.toString().padStart(2, '0')}:${(newMins[0] || selectedMinute).toString().padStart(2, '0')}`;
    onTimeChange(timeStr, day);
  };

  // Handle minute increment / decrement
  const handleMinuteStep = (delta: number) => {
    const mins = getValidMinutesForHour(selectedHour, activeDate, 5);
    if (mins.length === 0) return;
    const currentIndex = mins.indexOf(selectedMinute);
    let nextIndex = currentIndex + delta;
    if (nextIndex < 0) nextIndex = mins.length - 1;
    if (nextIndex >= mins.length) nextIndex = 0;
    const newM = mins[nextIndex];
    setSelectedMinute(newM);

    const timeStr = `${selectedHour.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
    onTimeChange(timeStr, day);
  };

  const handleSelectPreset = (timeStr: string) => {
    setMode(timeStr === 'Prima possibile' ? 'asap' : 'quick');
    onTimeChange(timeStr, day);
  };

  const handleSelectDay = (newDay: 'oggi' | 'domani') => {
    setDay(newDay);
    const newDate = newDay === 'oggi' ? todayDate : tomorrowDate;

    if (mode === 'asap') {
      onTimeChange('Prima possibile', newDay);
    } else if (mode === 'alarm') {
      const hours = getValidHoursForDate(newDate);
      const h = hours[0] || 12;
      const mins = getValidMinutesForHour(h, newDate, 5);
      const m = mins[0] || 0;
      setSelectedHour(h);
      setSelectedMinute(m);
      onTimeChange(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`, newDay);
    } else {
      const options = getQuickTimeOptionsForDate(newDate);
      if (options.length > 0) {
        onTimeChange(options[0], newDay);
      }
    }
  };

  const isAsapSelected = selectedTime === 'Prima possibile' || selectedTime.includes('ASAP');

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        backgroundColor: '#F8FAFC',
        border: '1px solid rgba(11, 37, 69, 0.12)',
        padding: '1.25rem',
        marginTop: '0.5rem',
      }}
    >
      {/* 1. Day Selector (Oggi vs Domani) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-ocean-dark)', fontWeight: 700, fontSize: '0.875rem' }}>
          <Calendar size={18} color="var(--color-coral)" />
          <span>Giorno di {orderType}:</span>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'white', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(11, 37, 69, 0.12)' }}>
          <button
            type="button"
            onClick={() => handleSelectDay('oggi')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: day === 'oggi' ? 'var(--color-ocean-dark)' : 'transparent',
              color: day === 'oggi' ? 'white' : 'var(--color-text-muted)',
              fontWeight: day === 'oggi' ? 800 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Oggi ({todayDate.toLocaleDateString('it-IT', { weekday: 'short' })})
          </button>
          <button
            type="button"
            onClick={() => handleSelectDay('domani')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: day === 'domani' ? 'var(--color-ocean-dark)' : 'transparent',
              color: day === 'domani' ? 'white' : 'var(--color-text-muted)',
              fontWeight: day === 'domani' ? 800 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Domani ({tomorrowDate.toLocaleDateString('it-IT', { weekday: 'short' })})
          </button>
        </div>
      </div>

      {/* 2. Opening Hours Info Badge */}
      {activeSchedule.isClosedAllDay ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            fontSize: '0.825rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          <AlertCircle size={16} />
          <span>La pescheria è <strong>chiusa</strong> il {activeSchedule.dayName}. Seleziona un altro giorno.</span>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(19, 64, 116, 0.06)',
            border: '1px solid rgba(19, 64, 116, 0.12)',
            color: 'var(--color-ocean-dark)',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          <Clock size={15} color="var(--color-ocean-medium)" />
          <span>
            Orari {activeSchedule.dayName}:{' '}
            {activeSchedule.slots.map((s) => `${s.open} - ${s.close}`).join('  •  ')}
          </span>
        </div>
      )}

      {/* 3. Fast Time Pill Selectors */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.775rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
          Orari Suggeriti
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {/* ASAP Button */}
          <button
            type="button"
            onClick={() => handleSelectPreset('Prima possibile')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: isAsapSelected ? '1.5px solid var(--color-coral)' : '1px solid rgba(11, 37, 69, 0.15)',
              backgroundColor: isAsapSelected ? 'var(--color-coral)' : 'white',
              color: isAsapSelected ? 'white' : 'var(--color-ocean-dark)',
              fontWeight: isAsapSelected ? 800 : 600,
              fontSize: '0.825rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: isAsapSelected ? 'var(--shadow-glow)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            ⚡ Prima possibile (ASAP)
          </button>

          {/* Quick Slots Pill Buttons */}
          {quickSlots.map((slotTime) => {
            const isSel = selectedTime === slotTime && mode !== 'alarm';
            return (
              <button
                key={slotTime}
                type="button"
                onClick={() => handleSelectPreset(slotTime)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isSel ? '1.5px solid var(--color-ocean-medium)' : '1px solid rgba(11, 37, 69, 0.15)',
                  backgroundColor: isSel ? 'var(--color-ocean-dark)' : 'white',
                  color: isSel ? 'white' : 'var(--color-ocean-dark)',
                  fontWeight: isSel ? 800 : 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {slotTime}
              </button>
            );
          })}

          {/* Mode Switch to Custom Alarm Clock Wheel */}
          <button
            type="button"
            onClick={() => {
              setMode('alarm');
              onTimeChange(formattedAlarmTime, day);
            }}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: mode === 'alarm' ? '1.5px solid var(--color-gold)' : '1px dashed var(--color-sea-blue)',
              backgroundColor: mode === 'alarm' ? '#FEF9C3' : 'white',
              color: mode === 'alarm' ? '#854D0E' : 'var(--color-ocean-medium)',
              fontWeight: mode === 'alarm' ? 800 : 600,
              fontSize: '0.825rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            ⏰ Seleziona Orario Preciso
          </button>
        </div>
      </div>

      {/* 4. Alarm-Clock / Digital Stepper Custom Time Picker UI */}
      {mode === 'alarm' && !activeSchedule.isClosedAllDay && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-ocean-dark)',
            color: 'white',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-sea-blue)', marginBottom: '0.75rem', fontWeight: 700 }}>
            ⏰ Selezione Orario Stile Sveglia
          </div>

          {/* Big Digital Clock Display */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', margin: '0.5rem 0 1rem 0' }}>
            
            {/* HOUR WHEEL CONTROLLER */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleHourStep(1)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  width: '56px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronUp size={22} />
              </button>

              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '2px solid var(--color-sea-blue)',
                  padding: '0.2rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  color: '#38BDF8',
                  minWidth: '70px',
                  textAlign: 'center',
                  margin: '0.4rem 0',
                }}
              >
                {selectedHour.toString().padStart(2, '0')}
              </div>

              <button
                type="button"
                onClick={() => handleHourStep(-1)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  width: '56px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronDown size={22} />
              </button>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-sea-blue)', marginTop: '4px', fontWeight: 600 }}>ORA</span>
            </div>

            {/* SEPARATOR DOTS */}
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-coral)', animation: 'pulse 1.5s infinite' }}>
              :
            </div>

            {/* MINUTE WHEEL CONTROLLER */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleMinuteStep(1)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  width: '56px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronUp size={22} />
              </button>

              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '2px solid var(--color-sea-blue)',
                  padding: '0.2rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  color: '#38BDF8',
                  minWidth: '70px',
                  textAlign: 'center',
                  margin: '0.4rem 0',
                }}
              >
                {selectedMinute.toString().padStart(2, '0')}
              </div>

              <button
                type="button"
                onClick={() => handleMinuteStep(-1)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  width: '56px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronDown size={22} />
              </button>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-sea-blue)', marginTop: '4px', fontWeight: 600 }}>MINUTI</span>
            </div>

          </div>

          {/* Direct Selectors for Hours & Minutes (Horizontal Scroll Chips) */}
          <div style={{ marginTop: '0.8rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.8rem' }}>
            <div style={{ fontSize: '0.725rem', color: 'var(--color-sea-blue)', marginBottom: '0.35rem', textAlign: 'left', fontWeight: 700 }}>
              SELEZIONA ORA:
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.4rem', scrollbarWidth: 'thin' }}>
              {validHours.map((h) => {
                const isH = selectedHour === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setSelectedHour(h);
                      const mins = getValidMinutesForHour(h, activeDate, 5);
                      const newM = mins.includes(selectedMinute) ? selectedMinute : (mins[0] || 0);
                      setSelectedMinute(newM);
                      onTimeChange(`${h.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`, day);
                    }}
                    style={{
                      padding: '0.35rem 0.6rem',
                      borderRadius: '6px',
                      border: isH ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.2)',
                      backgroundColor: isH ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      color: isH ? '#38BDF8' : 'white',
                      fontWeight: isH ? 800 : 500,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {h}:00
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: '0.725rem', color: 'var(--color-sea-blue)', margin: '0.5rem 0 0.35rem 0', textAlign: 'left', fontWeight: 700 }}>
              SELEZIONA MINUTI (PASSO 5 MIN):
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.2rem', scrollbarWidth: 'thin' }}>
              {validMinutes.map((m) => {
                const isM = selectedMinute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedMinute(m);
                      onTimeChange(`${selectedHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`, day);
                    }}
                    style={{
                      padding: '0.35rem 0.6rem',
                      borderRadius: '6px',
                      border: isM ? '1.5px solid var(--color-coral)' : '1px solid rgba(255, 255, 255, 0.2)',
                      backgroundColor: isM ? 'rgba(255, 107, 107, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      color: isM ? 'var(--color-coral)' : 'white',
                      fontWeight: isM ? 800 : 500,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    :{m.toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Status pill */}
          <div
            style={{
              marginTop: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isValidTime ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: isValidTime ? '#4ADE80' : '#FCA5A5',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: isValidTime ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            }}
          >
            {isValidTime ? (
              <>
                <Check size={14} />
                <span>Orario confermato: {formattedAlarmTime} ({day === 'oggi' ? 'Oggi' : 'Domani'})</span>
              </>
            ) : (
              <>
                <AlertCircle size={14} />
                <span>La pescheria è chiusa alle {formattedAlarmTime}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
