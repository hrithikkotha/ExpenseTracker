import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCalendarMonth } from '@/features/calendar/hooks';
import { useTransactions } from '@/features/transactions/hooks';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/features/transactions/transaction.types';

export function ImprovedCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
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
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-4">
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
                        "aspect-square border-r last:border-r-0 p-1.5 md:p-2 hover:bg-muted/50 transition-colors text-left flex flex-col",
                        isSelected && "bg-primary/10 ring-2 ring-primary ring-inset"
                      )}
                    >
                      <div className={`text-xs md:text-sm font-semibold mb-0.5 ${isToday ? 'text-primary' : ''}`}>
                        {day}
                      </div>
                      {dayData && dayData.count > 0 && (
                        <div className="flex-1 flex flex-col justify-start text-[9px] md:text-[10px] space-y-0.5 overflow-hidden">
                          {dayData.income > 0 && (
                            <div className="text-green-600 truncate font-medium leading-tight">
                              +{formatCurrency(dayData.income, currency)}
                            </div>
                          )}
                          {dayData.expense > 0 && (
                            <div className="text-red-600 truncate font-medium leading-tight">
                              -{formatCurrency(dayData.expense, currency)}
                            </div>
                          )}
                          <div className="text-muted-foreground leading-tight">{dayData.count} txn</div>
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
          <div className="fixed left-0 right-0 bottom-16 md:bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl max-h-[calc(75vh-4rem)] md:max-h-[75vh] flex flex-col">
            {/* Sheet Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="text-base md:text-lg font-semibold text-foreground truncate">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                {selectedDayData && (
                  <div className="flex items-center gap-3 md:gap-4 mt-1 text-xs md:text-sm flex-wrap">
                    <span className="text-green-600 font-medium">
                      +{formatCurrency(selectedDayData.income, currency)}
                    </span>
                    <span className="text-red-600 font-medium">
                      -{formatCurrency(selectedDayData.expense, currency)}
                    </span>
                    <span className="text-muted-foreground">
                      {selectedDayData.count} txn
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={closeSheet}
                className="flex-shrink-0 rounded-full hover:bg-muted transition-colors p-2 -mr-2"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Transaction List */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-6 py-4">
              {dayTransactions.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground text-sm">No transactions on this day</p>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3 pb-6">
                  {dayTransactions.map((t: Transaction) => (
                    <div
                      key={t._id}
                      className="flex items-start justify-between gap-3 p-3 md:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm md:text-base text-foreground break-words">
                          {t.purpose}
                        </p>
                        {t.note && (
                          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 break-words line-clamp-2">
                            {t.note}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <p
                          className={`text-sm md:text-base font-bold whitespace-nowrap ${
                            t.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {t.type === 'income' ? '+' : '-'}
                          {formatCurrency(t.amount, currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
