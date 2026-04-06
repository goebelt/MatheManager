/**
 * DashboardHeader - Header with week navigation and current week display
 */

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DashboardHeaderProps {
  currentDate: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

export function DashboardHeader({ 
  currentDate, 
  onPreviousWeek, 
  onNextWeek 
}: DashboardHeaderProps) {
  // Calculate week range for the current date
  const getCurrentWeekRange = (date: Date): [Date, Date] => {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    
    // Start of week is Monday
    const startDay = new Date(d);
    startDay.setDate(d.getDate() - dayOfWeek + 1);

    // End of week is Sunday
    const endDay = new Date(startDay);
    endDay.setDate(startDay.getDate() + 6);

    return [startDay, endDay];
  };

  const [weekStart, weekEnd] = getCurrentWeekRange(currentDate);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const isToday = new Date().toDateString() === currentDate.toDateString();

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={onPreviousWeek}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
            disabled={false}
            title="Vorherige Woche"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Week Label */}
          <div className="flex flex-col items-center min-w-[140px]">
            <span className={`text-sm font-semibold ${isToday ? 'text-green-600 dark:text-green-500' : 'text-gray-900 dark:text-white'}`}>
              {formatDate(weekStart)} - {formatDate(weekEnd)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Calendar size={12} />
              Woche {Math.ceil(currentDate.getDate() / 7) + ((currentDate.getMonth() + 1) * 4)}
            </span>
          </div>

          <button
            onClick={onNextWeek}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
            disabled={false}
            title="Nächste Woche"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Week Number Display */}
        <div className="flex items-center justify-center flex-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
            Aktuelle Woche:
          </span>
          <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
          <span className="font-mono font-bold text-lg bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
            {Math.ceil(currentDate.getDate() / 7) + ((currentDate.getMonth() + 1) * 4)}
          </span>
        </div>

        {/* Placeholder for future features */}
        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
          Pro Woche automatisch vorschlagen
        </div>
      </div>
    </div>
  );
}