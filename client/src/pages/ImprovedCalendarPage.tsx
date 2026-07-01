import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCalendarMonth } from '@/features/calendar/hooks';
import { useTransactions } from '@/features/transactions/hooks';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function ImprovedCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const { data: calendarData = [], isLoading } = useCalendarMonth(monthStr);

  // Fetch transactions for selected date
  const selectedDateObj = selectedDate ? new Date(selectedDate) : null;
  const selectedDateFrom = selectedDateObj
    ? new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 0, 0, 0)
    : null;
  const selectedDateTo = selectedDateObj
    ? new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate(), 23, 59, 59)
    : null;

  const transactionFilters = selectedDate && selectedDateFrom && selectedDateTo
    ? {
        from: selectedDateFrom.toISOString(),
        to: selectedDateTo.toISOString(),
        sort: '-date' as const,
        page: 1,
        limit: 100,
      }
    : { page: 1, limit: 0 };

  const { data: transactionsData } = useTransactions(transactionFilters);

  const dayTransactions = transactionsData?.items ?? [];

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

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const closeSheet = () => {
    setSelectedDate(null);
  };

  const selectedDayData = selectedDate ? dayDataMap.get(selectedDate) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-30 backdrop-blur-sm bg-background/95">
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
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
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
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={dayIdx}
                      onClick={() => handleDateClick(dateStr)}
                      className={cn(
                        "aspect-square border-r last:border-r-0 p-2 hover:bg-muted/50 transition-colors text-left",
                        isSelected && "bg-primary/10 ring-2 ring-primary ring-inset"
                      )}
                    >
                      <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary' : ''}`}>
                        {day}
                      </div>
                      {dayData && (
                        <div className="text-xs space-y-0.5">
                          {dayData.income > 0 && (
                            <div className="text-green-600 truncate text-[10px]">
                              +{formatCurrency(dayData.income, 'USD')}
                            </div>
                          )}
                          {dayData.expense > 0 && (
                            <div className="text-red-600 truncate text-[10px]">
                              -{formatCurrency(dayData.expense, 'USD')}
                            </div>
                          )}
                          <div className="text-muted-foreground text-[10px]">{dayData.count} txn</div>
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

      {/* Transaction List Bottom Sheet */}
      {selectedDate && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 transition-opacity"
            onClick={closeSheet}
          />

          {/* Sheet */}
          <div className="fixed left-0 right-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden">
            <div className="flex flex-col h-full">
              {/* Sheet Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold">
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  {selectedDayData && (
                    <div className="flex items-center gap-4 mt-1 text-sm">
                      <span className="text-green-600">
                        +{formatCurrency(selectedDayData.income, 'USD')}
                      </span>
                      <span className="text-red-600">
                        -{formatCurrency(selectedDayData.expense, 'USD')}
                      </span>
                      <span className="text-muted-foreground">
                        {selectedDayData.count} transactions
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={closeSheet}
                  className="touch-target rounded-full hover:bg-muted transition-colors p-2"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Transaction List */}
              <div className="flex-1 overflow-y-auto p-6">
                {dayTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No transactions on this day</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayTransactions.map((t) => (
                      <div
                        key={t._id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                            style={{ backgroundColor: `${t.category?.color ?? '#ccc'}22` }}
                          >
                            {t.category?.icon ?? '🏷️'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {t.category?.name ?? 'Uncategorized'}
                            </p>
                            {t.note && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {t.note}
                              </p>
                            )}
                          </div>
                        </div>
                        <p
                          className={`text-sm font-semibold ${
                            t.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {t.type === 'income' ? '+' : '-'}
                          {formatCurrency(t.amount, 'USD')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
