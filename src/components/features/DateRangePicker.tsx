import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onChange: (checkIn: Date | null, checkOut: Date | null) => void;
  onClose: () => void;
  blockedDates?: Set<string>;
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
function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface CalendarMonthProps {
  year: number;
  month: number;
  checkIn: Date | null;
  checkOut: Date | null;
  hoverDate: Date | null;
  selecting: "checkin" | "checkout";
  blockedDates: Set<string>;
  onDayClick: (d: Date) => void;
  onDayHover: (d: Date | null) => void;
  onDayMouseDown: (d: Date) => void;
}

function CalendarMonth({ year, month, checkIn, checkOut, hoverDate, selecting, blockedDates, onDayClick, onDayHover, onDayMouseDown }: CalendarMonthProps) {
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
    const isBooked = blockedDates.has(isoDate(date));
    const isDisabled = isPast || isBooked;
    const isStart = checkIn ? sameDay(date, checkIn) : false;
    const isEnd   = checkOut ? sameDay(date, checkOut) : false;
    const isHoverEnd = !checkOut && selecting === "checkout" && hoverDate ? sameDay(date, hoverDate) : false;
    const inRange = checkIn && rangeEnd ? (date > checkIn && date < rangeEnd) : false;
    const isToday = sameDay(date, today);

    cells.push(
      <button
        key={day}
        disabled={isDisabled}
        title={isBooked && !isPast ? "Already booked" : undefined}
        onClick={() => !isDisabled && onDayClick(date)}
        onMouseDown={() => !isDisabled && onDayMouseDown(date)}
        onMouseEnter={() => !isDisabled && onDayHover(date)}
        onMouseLeave={() => onDayHover(null)}
        className={cn(
          "calendar-day",
          isDisabled && "disabled",
          isBooked && !isPast && "line-through text-gray-300",
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

const EMPTY_BLOCKED = new Set<string>();

function fmtDate(d: Date | null) {
  if (!d) return "N/A";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DateRangePicker({ checkIn, checkOut, onChange, onClose, blockedDates = EMPTY_BLOCKED }: DateRangePickerProps) {
  const today = new Date();
  const [baseYear, setBaseYear] = useState(today.getFullYear());
  const [baseMonth, setBaseMonth] = useState(today.getMonth());
  const [selecting, setSelecting] = useState<"checkin"|"checkout">(checkIn ? "checkout" : "checkin");
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Click-and-drag range selection: mousedown on a day starts a drag: holding
  // and moving across days previews the range (via the existing hover
  // highlighting below), and releasing on a later day commits check-in and
  // check-out together in one gesture, instead of requiring two separate
  // taps. A plain click (mousedown+mouseup on the same day, no movement)
  // still falls through to the original tap-to-tap flow via handleDayClick.
  const dragStartRef = useRef<Date | null>(null);
  const justDraggedRef = useRef(false);

  const handleDayMouseDown = (date: Date) => {
    // Clear any stale flag from a previous drag so it can't accidentally
    // suppress a later, unrelated click.
    justDraggedRef.current = false;
    if (selecting === "checkin") dragStartRef.current = date;
  };

  useEffect(() => {
    const handleMouseUp = () => {
      const start = dragStartRef.current;
      dragStartRef.current = null;
      if (!start || !hoverDate || sameDay(start, hoverDate) || hoverDate <= start) return;
      justDraggedRef.current = true;
      onChange(start, hoverDate);
      setSelecting("checkin");
      onClose();
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverDate]);

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
    if (justDraggedRef.current) {
      // A drag just committed the range and closed the picker on mouseup;
      // suppress the click event that fires right after on the same day.
      justDraggedRef.current = false;
      return;
    }
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
      className="dropdown-panel animate-fade-in-down p-5 w-full max-h-[min(75vh,600px)] overflow-y-auto"
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
          blockedDates={blockedDates}
          onDayClick={handleDayClick} onDayHover={setHoverDate}
          onDayMouseDown={handleDayMouseDown}
        />
        <div className="w-px bg-gray-100 flex-shrink-0 self-stretch" />
        <CalendarMonth
          year={nextYear} month={nextMonth}
          checkIn={checkIn} checkOut={checkOut}
          hoverDate={hoverDate} selecting={selecting}
          blockedDates={blockedDates}
          onDayClick={handleDayClick} onDayHover={setHoverDate}
          onDayMouseDown={handleDayMouseDown}
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
