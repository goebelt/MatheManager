/**
 * DashboardHeader - Header with day navigation and current day display
 */

'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DashboardHeaderProps {
  currentDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
}

export function DashboardHeader({ 
  currentDate, 
  onPreviousDay, 
  onNextDay 
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
      <div className="flex items-center justify-between gap-4">
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
        </div>

        {/* Placeholder for future features */}
        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
          Tagesübersicht mit Terminvorschlägen
        </div>
      </div>
    </div>
  );
}