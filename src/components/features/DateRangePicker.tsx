import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onChange: (checkIn: Date | null, checkOut: Date | null) => void;
  onClose: () => void;
}

// Monday-first week (weekend columns are highlighted).
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
// Offset of the 1st with a Monday-first week (Mon=0 … Sun=6).
function firstDayOf(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7; }
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface CalendarMonthProps {
  year: number;
  month: number;
  checkIn: Date | null;
  checkOut: Date | null;
  hoverDate: Date | null;
  selecting: "checkin" | "checkout";
  onDayClick: (d: Date) => void;
  onDayHover: (d: Date | null) => void;
}

function CalendarMonth({ year, month, checkIn, checkOut, hoverDate, selecting, onDayClick, onDayHover }: CalendarMonthProps) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOf(year, month);

  const rangeEnd = checkOut ?? (selecting === "checkout" && hoverDate ? hoverDate : null);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(<div key={`e${i}`} />);

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const isPast = date < today;
    const isStart = checkIn ? sameDay(date, checkIn) : false;
    const isEnd = checkOut ? sameDay(date, checkOut) : false;
    const isHoverEnd = !checkOut && selecting === "checkout" && hoverDate ? sameDay(date, hoverDate) : false;
    const inRange = checkIn && rangeEnd ? (date > checkIn && date < rangeEnd) : false;
    const isToday = sameDay(date, today);

    cells.push(
      <button
        key={day}
        disabled={isPast}
        onClick={() => !isPast && onDayClick(date)}
        onMouseEnter={() => !isPast && onDayHover(date)}
        onMouseLeave={() => onDayHover(null)}
        className={cn(
          "calendar-day !w-full !h-11 !text-sm",
          isPast && "disabled",
          isStart && "selected range-start",
          isEnd && "selected range-end",
          isHoverEnd && !isEnd && "selected range-end",
          inRange && "in-range",
          isToday && !isStart && !isEnd && !inRange && "today"
        )}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xl font-bold text-gray-900 text-center mb-4">
        {MONTH_NAMES[month]} {year}
      </p>
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "text-center text-xs font-semibold py-1",
              i >= 5 ? "text-blue-500" : "text-gray-400"
            )}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">{cells}</div>
    </div>
  );
}

const FLEX_OPTIONS = [
  { id: "exact", label: "Exact dates" },
  { id: "1", label: "± 1 Days" },
  { id: "2", label: "± 2 Days" },
  { id: "3", label: "± 3 Days" },
  { id: "7", label: "± 7 Days" },
];

export default function DateRangePicker({ checkIn, checkOut, onChange, onClose }: DateRangePickerProps) {
  const today = new Date();
  const [baseYear, setBaseYear] = useState(today.getFullYear());
  const [baseMonth, setBaseMonth] = useState(today.getMonth());
  const [selecting, setSelecting] = useState<"checkin" | "checkout">(checkIn ? "checkout" : "checkin");
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  // Date flexibility (visual for now — "Exact dates" is the default).
  const [flex, setFlex] = useState("exact");

  const nextYear = baseMonth === 11 ? baseYear + 1 : baseYear;
  const nextMonth = baseMonth === 11 ? 0 : baseMonth + 1;

  // Don't allow navigating before the current month (all past dates are disabled).
  const atCurrentMonth = baseYear === today.getFullYear() && baseMonth === today.getMonth();

  const prev = () => {
    if (baseMonth === 0) { setBaseYear((y) => y - 1); setBaseMonth(11); }
    else setBaseMonth((m) => m - 1);
  };
  const next = () => {
    if (baseMonth === 11) { setBaseYear((y) => y + 1); setBaseMonth(0); }
    else setBaseMonth((m) => m + 1);
  };

  const handleDayClick = (date: Date) => {
    if (selecting === "checkin") {
      onChange(date, null);
      setSelecting("checkout");
    } else {
      if (checkIn && date <= checkIn) {
        onChange(date, null);
        setSelecting("checkout");
      } else {
        onChange(checkIn, date);
        setSelecting("checkin");
        onClose();
      }
    }
  };

  return (
    <div className="dropdown-panel !relative shrink-0 animate-fade-in-down p-6" style={{ width: "min(720px, 95vw)" }}>
      {/* Two-month calendars with edge navigation */}
      <div className="relative">
        {!atCurrentMonth && (
          <button
            onClick={prev}
            aria-label="Previous month"
            className="absolute left-0 top-0 w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}
        <button
          onClick={next}
          aria-label="Next month"
          className="absolute right-0 top-0 w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors z-10"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>

        <div className="flex gap-8">
          <CalendarMonth
            year={baseYear} month={baseMonth}
            checkIn={checkIn} checkOut={checkOut}
            hoverDate={hoverDate} selecting={selecting}
            onDayClick={handleDayClick} onDayHover={setHoverDate}
          />
          <CalendarMonth
            year={nextYear} month={nextMonth}
            checkIn={checkIn} checkOut={checkOut}
            hoverDate={hoverDate} selecting={selecting}
            onDayClick={handleDayClick} onDayHover={setHoverDate}
          />
        </div>
      </div>

      {/* Date flexibility pills */}
      <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
        {FLEX_OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => setFlex(o.id)}
            className={cn(
              "px-5 py-2.5 rounded-full border text-sm font-medium transition-colors",
              flex === o.id
                ? "border-blue-400 text-blue-600 bg-blue-50"
                : "border-gray-200 text-gray-700 hover:border-gray-300"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
