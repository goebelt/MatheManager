/**
 * DashboardHeader - Header with day navigation and current day display
 */

'use client';

import { ChevronLeft, ChevronRight, Calendar, CalendarDays } from 'lucide-react';

interface DashboardHeaderProps {
  currentDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onGoToToday: () => void;
}

export function DashboardHeader({ 
  currentDate, 
  onPreviousDay, 
  onNextDay,
  onGoToToday
}: DashboardHeaderProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', { 
      weekday: 'long',
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isToday = new Date().toDateString() === currentDate.toDateString();

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-center gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={onPreviousDay}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
            disabled={false}
            title="Vorheriger Tag"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Day Label */}
          <div className="flex flex-col items-center min-w-[200px]">
            <span className={`text-sm font-semibold ${isToday ? 'text-green-600 dark:text-green-500' : 'text-gray-900 dark:text-white'}`}>
              {formatDate(currentDate)}
            </span>
            {isToday && (
              <span className="text-xs text-green-600 dark:text-green-500 font-medium">
                Heute
              </span>
            )}
          </div>

          <button
            onClick={onNextDay}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
            disabled={false}
            title="Nächster Tag"
          >
            <ChevronRight size={20} />
          </button>

          {/* Today Button */}
          <button
            onClick={onGoToToday}
            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              isToday 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            disabled={isToday}
            title="Zum heutigen Tag springen"
          >
            <CalendarDays size={16} className="inline mr-1" />
            Heute
          </button>
        </div>
      </div>
    </div>
  );
}