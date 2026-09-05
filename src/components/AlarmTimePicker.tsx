import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle, Check } from 'lucide-react';
import {
  getDaySchedule,
  isTimeInOpeningHours,
  getMealPresetOptionsForDate,
  getVisibleMealGroups,
} from '../utils/openingHours';

interface TimePickerProps {
  orderType: 'Ritiro' | 'Consegna';
  selectedTime: string;
  selectedDay: 'oggi' | 'domani';
  onTimeChange: (time: string, day: 'oggi' | 'domani') => void;
}

export const AlarmTimePicker: React.FC<TimePickerProps> = ({
  orderType,
  selectedTime,
  selectedDay,
  onTimeChange,
}) => {
  const [day, setDay] = useState<'oggi' | 'domani'>(selectedDay);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customTime, setCustomTime] = useState<string>('12:30');

  useEffect(() => {
    setDay(selectedDay);
  }, [selectedDay]);

  const todayDate = new Date();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(todayDate.getDate() + 1);

  const activeDate = day === 'oggi' ? todayDate : tomorrowDate;
  const activeSchedule = getDaySchedule(activeDate);
  const mealPresets = getMealPresetOptionsForDate(activeDate);
  const visibleMeals = getVisibleMealGroups(activeDate);
  const visiblePranzo = visibleMeals.showPranzo ? mealPresets.pranzo : [];
  const visibleCena = visibleMeals.showCena ? mealPresets.cena : [];

  const cleanTimeStr = (str: string): string => {
    return (str || '').replace(/\s*\((Oggi|Domani|oggi|domani)\)/gi, '').trim();
  };

  const rawSelectedTime = cleanTimeStr(selectedTime);

  const handleDaySelect = (newDay: 'oggi' | 'domani') => {
    setDay(newDay);
    const targetTime = isCustom ? customTime : (rawSelectedTime || 'Prima possibile');
    onTimeChange(targetTime, newDay);
  };

  const handlePresetSelect = (presetStr: string) => {
    setIsCustom(false);
    onTimeChange(presetStr, day);
  };

  const handleCustomTimeInput = (val: string) => {
    setCustomTime(val);
    setIsCustom(true);
    onTimeChange(val, day);
  };

  const isAsapSelected = !isCustom && (rawSelectedTime === 'Prima possibile' || rawSelectedTime.includes('ASAP'));
  const isValidCustomTime = isTimeInOpeningHours(customTime, activeDate);

  const renderPresetButton = (slotTime: string) => {
    const isSel = !isCustom && selectedTime.includes(slotTime);
    return (
      <button
        key={slotTime}
        type="button"
        onClick={() => handlePresetSelect(slotTime)}
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
  };

  return (
    <div className="order-timepicker">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.85rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-ocean-dark)',
            fontWeight: 700,
            fontSize: '0.875rem',
          }}
        >
          <Calendar size={18} color="var(--color-coral)" />
          <span>Giorno di {orderType}:</span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.2rem',
            backgroundColor: 'white',
            padding: '0.22rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(10, 35, 66, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => handleDaySelect('oggi')}
            className={`order-filter-chip${day === 'oggi' ? ' order-filter-chip--active' : ''}`}
            style={{ fontSize: '0.8rem' }}
          >
            Oggi ({todayDate.toLocaleDateString('it-IT', { weekday: 'short' })})
          </button>
          <button
            type="button"
            onClick={() => handleDaySelect('domani')}
            className={`order-filter-chip${day === 'domani' ? ' order-filter-chip--active' : ''}`}
            style={{ fontSize: '0.8rem' }}
          >
            Domani ({tomorrowDate.toLocaleDateString('it-IT', { weekday: 'short' })})
          </button>
        </div>
      </div>

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

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.775rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
          Seleziona Orario
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handlePresetSelect('Prima possibile')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: isAsapSelected ? '1.5px solid var(--color-coral)' : '1px solid rgba(11, 37, 69, 0.15)',
              backgroundColor: isAsapSelected ? 'var(--color-coral)' : 'white',
              color: isAsapSelected ? 'white' : 'var(--color-ocean-dark)',
              fontWeight: isAsapSelected ? 800 : 600,
              fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            ⚡ Prima possibile
          </button>

          {visiblePranzo.length > 0 && (
            <div style={{ width: '100%', marginTop: '0.35rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  marginBottom: '0.35rem',
                }}
              >
                Pranzo
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {visiblePranzo.map(renderPresetButton)}
              </div>
            </div>
          )}

          {visibleCena.length > 0 && (
            <div style={{ width: '100%', marginTop: '0.35rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  marginBottom: '0.35rem',
                }}
              >
                Cena
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {visibleCena.map(renderPresetButton)}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setIsCustom(true);
              onTimeChange(customTime, day);
            }}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: isCustom ? '1.5px solid var(--color-gold)' : '1px dashed var(--color-sea-blue)',
              backgroundColor: isCustom ? '#FEF9C3' : 'white',
              color: isCustom ? '#854D0E' : 'var(--color-ocean-medium)',
              fontWeight: isCustom ? 800 : 600,
              fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            ✏️ Altro Orario
          </button>
        </div>
      </div>

      {isCustom && (
        <div
          style={{
            marginTop: '0.85rem',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'white',
            border: '1.5px solid var(--color-ocean-medium)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <label
            htmlFor="custom-time-picker-input"
            style={{
              display: 'block',
              fontSize: '0.825rem',
              fontWeight: 700,
              color: 'var(--color-ocean-dark)',
              marginBottom: '0.4rem',
            }}
          >
            Inserisci o Seleziona Orario Personalizzato:
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              id="custom-time-picker-input"
              type="time"
              inputMode="numeric"
              autoComplete="time"
              min={day === 'oggi' ? `${todayDate.getHours().toString().padStart(2, '0')}:${todayDate.getMinutes().toString().padStart(2, '0')}` : undefined}
              value={customTime}
              onChange={(e) => handleCustomTimeInput(e.target.value)}
              style={{
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-ocean-medium)',
                backgroundColor: '#F8FAFC',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--color-ocean-dark)',
                outline: 'none',
                minWidth: '150px',
                cursor: 'pointer',
              }}
            />

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isValidCustomTime ? '#DCFCE7' : '#FEE2E2',
                color: isValidCustomTime ? '#15803D' : '#B91C1C',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {isValidCustomTime ? (
                <>
                  <Check size={14} />
                  <span>Orario valido</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} />
                  <span>
                    {day === 'oggi'
                      ? 'Orario già passato o pescheria chiusa'
                      : 'Pescheria chiusa a quest\'ora'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
