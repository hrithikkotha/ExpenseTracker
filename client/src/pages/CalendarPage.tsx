import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendarMonth } from '@/features/calendar/hooks';
import { formatCurrency } from '@/lib/utils';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const { data: calendarData = [], isLoading } = useCalendarMonth(monthStr);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const dayDataMap = new Map(calendarData.map(d => [d.date, d]));

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDayOfWeek).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <h1 className="text-xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-full touch-target">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-full touch-target">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center py-12">Loading calendar...</div>
        ) : (
          <div className="bg-background rounded-lg border overflow-hidden">
            {/* Week days header */}
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 border-b last:border-b-0">
                {week.map((day, dayIdx) => {
                  if (day === null) {
                    return <div key={dayIdx} className="aspect-square border-r last:border-r-0 bg-muted/20" />;
                  }

                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayData = dayDataMap.get(dateStr);
                  const isToday = new Date().toDateString() === new Date(dateStr).toDateString();

                  return (
                    <button
                      key={dayIdx}
                      className="aspect-square border-r last:border-r-0 p-2 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary' : ''}`}>
                        {day}
                      </div>
                      {dayData && (
                        <div className="text-xs space-y-0.5">
                          {dayData.income > 0 && (
                            <div className="text-green-600 truncate">
                              +{formatCurrency(dayData.income, 'USD')}
                            </div>
                          )}
                          {dayData.expense > 0 && (
                            <div className="text-red-600 truncate">
                              -{formatCurrency(dayData.expense, 'USD')}
                            </div>
                          )}
                          <div className="text-muted-foreground">{dayData.count} txns</div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
