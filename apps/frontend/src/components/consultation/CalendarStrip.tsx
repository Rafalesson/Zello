'use client';

import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  addMonths, 
  subMonths, 
  isBefore, 
  startOfDay,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarStripProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  hasSlots?: (date: Date) => boolean;
}

export function CalendarStrip({ onSelectDate, selectedDate, hasSlots }: CalendarStripProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  useEffect(() => {
    // Generate standard grid calendar days
    const monthStart = startOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // 0 = Sunday
    const endDate = endOfWeek(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0), { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    setCalendarDays(days);
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Check if current month is the actual current month to disable going to the past
  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();
  const today = startOfDay(new Date());

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-2 mb-4">
        <button 
          onClick={handlePrevMonth} 
          disabled={isCurrentMonth}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <CalendarIcon className="h-4 w-4 text-teal-600" />
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button 
          onClick={handleNextMonth} 
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isAvailable = hasSlots ? hasSlots(date) : false;
          const isPast = isBefore(date, today);
          const isCurrentMonthDay = isSameMonth(date, currentMonth);
          
          // se for passado ou não for do mês atual, fica bem opaco e não clicável
          const isDisabled = isPast || !isCurrentMonthDay;

          return (
            <button
              key={index}
              onClick={() => {
                if (!isDisabled) onSelectDate(date);
              }}
              disabled={isDisabled}
              className={`
                relative flex flex-col items-center justify-center aspect-square rounded-xl border transition-all duration-200
                ${isDisabled ? 'opacity-30 cursor-not-allowed border-transparent bg-transparent' : ''}
                ${!isDisabled && !isAvailable && !isSelected ? 'opacity-60 bg-slate-50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-800/40' : ''}
                ${!isDisabled && isAvailable && !isSelected ? 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700' : ''}
                ${isSelected ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20' : ''}
              `}
              aria-pressed={isSelected}
            >
              <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                {format(date, 'd')}
              </span>
              
              {!isDisabled && (
                <span className={`absolute bottom-1.5 h-1 w-1 rounded-full ${
                  isSelected 
                    ? 'bg-white' 
                    : isAvailable 
                      ? 'bg-teal-500' 
                      : 'bg-rose-400'
                }`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
