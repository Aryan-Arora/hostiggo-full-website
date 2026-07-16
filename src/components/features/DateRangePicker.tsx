import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onChange: (checkIn: Date | null, checkOut: Date | null) => void;
  onClose: () => void;
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOf(y: number, m: number) { return new Date(y, m, 1).getDay(); }
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
  const today = new Date(); today.setHours(0,0,0,0);
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOf(year, month);

  const rangeEnd = checkOut ?? (selecting === "checkout" && hoverDate ? hoverDate : null);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(<div key={`e${i}`} />);

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);
    date.setHours(0,0,0,0);
    const isPast = date < today;
    const isStart = checkIn ? sameDay(date, checkIn) : false;
    const isEnd   = checkOut ? sameDay(date, checkOut) : false;
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
          "calendar-day",
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
    <div className="flex-1 min-w-[230px]">
      <p className="text-sm font-semibold text-gray-700 text-center mb-3">
        {MONTH_NAMES[month]} {year}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1 uppercase tracking-wide">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">{cells}</div>
    </div>
  );
}

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DateRangePicker({ checkIn, checkOut, onChange, onClose }: DateRangePickerProps) {
  const today = new Date();
  const [baseYear, setBaseYear] = useState(today.getFullYear());
  const [baseMonth, setBaseMonth] = useState(today.getMonth());
  const [selecting, setSelecting] = useState<"checkin"|"checkout">(checkIn ? "checkout" : "checkin");
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const nextYear  = baseMonth === 11 ? baseYear + 1 : baseYear;
  const nextMonth = baseMonth === 11 ? 0 : baseMonth + 1;

  const prev = () => {
    if (baseMonth === 0) { setBaseYear(y => y - 1); setBaseMonth(11); }
    else setBaseMonth(m => m - 1);
  };
  const next = () => {
    if (baseMonth === 11) { setBaseYear(y => y + 1); setBaseMonth(0); }
    else setBaseMonth(m => m + 1);
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
    <div
      className="dropdown-panel animate-fade-in-down p-5 right-0 max-h-[min(75vh,600px)] overflow-y-auto"
      style={{ width: "min(600px, calc(100vw - 2rem))" }}
    >
      {/* Date selection header */}
      <div className="flex gap-3 mb-5">
        {[
          { label: "Check in", date: checkIn, panel: "checkin" as const },
          { label: "Check out", date: checkOut, panel: "checkout" as const },
        ].map(({ label, date, panel }) => (
          <button
            key={panel}
            onClick={() => setSelecting(panel)}
            className={cn(
              "flex-1 border rounded-xl p-3 text-left transition-all",
              selecting === panel
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            <p className={cn("text-sm font-semibold", date ? "text-gray-900" : "text-gray-400")}>
              {fmtDate(date)}
            </p>
          </button>
        ))}
      </div>

      {/* Month navigation row */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={prev}
          className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={next}
          className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Two-month calendars */}
      <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-1">
        <CalendarMonth
          year={baseYear} month={baseMonth}
          checkIn={checkIn} checkOut={checkOut}
          hoverDate={hoverDate} selecting={selecting}
          onDayClick={handleDayClick} onDayHover={setHoverDate}
        />
        <div className="w-px bg-gray-100 flex-shrink-0 self-stretch" />
        <CalendarMonth
          year={nextYear} month={nextMonth}
          checkIn={checkIn} checkOut={checkOut}
          hoverDate={hoverDate} selecting={selecting}
          onDayClick={handleDayClick} onDayHover={setHoverDate}
        />
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => { onChange(null, null); setSelecting("checkin"); }}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors font-medium underline underline-offset-2"
        >
          Clear dates
        </button>
        <button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
