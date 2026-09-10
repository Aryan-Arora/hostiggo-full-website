import { Users, Baby, DoorOpen } from "lucide-react";
import type { GuestCount } from "@/types";
import { cn } from "@/lib/utils";

interface GuestDropdownProps {
  guests: GuestCount;
  onChange: (guests: GuestCount) => void;
  onClose: () => void;
}

interface CounterRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

function CounterRow({ icon, label, sublabel, value, min = 0, max = 20, onChange }: CounterRowProps) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center text-figma-navy flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-gray-800 leading-tight">{label}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-base transition-all font-medium leading-none",
            value <= min
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-figma-navy text-white shadow-md hover:bg-figma-navy/90 active:scale-95 cursor-pointer"
          )}
        >
          −
        </button>
        <span className="w-5 text-center text-[13px] font-bold text-gray-800 tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-base transition-all font-medium leading-none",
            value >= max
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-figma-navy text-white shadow-md hover:bg-figma-navy/90 active:scale-95 cursor-pointer"
          )}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function GuestDropdown({ guests, onChange, onClose }: GuestDropdownProps) {
  const set = (key: keyof GuestCount, val: number | boolean) =>
    onChange({ ...guests, [key]: val });

  return (
    <div className="dropdown-panel shadow-2xl rounded-2xl border border-gray-100 animate-fade-in-down w-[320px] max-w-[92vw] p-5">
      <CounterRow
        icon={<Users className="w-5 h-5" />}
        label="Adults"
        sublabel="Ages 18 or above"
        value={guests.adults}
        min={1}
        max={16}
        onChange={(v) => set("adults", v)}
      />
      <CounterRow
        icon={<Baby className="w-5 h-5" />}
        label="Children"
        sublabel="Ages 0-17"
        value={guests.children}
        max={8}
        onChange={(v) => set("children", v)}
      />
      <CounterRow
        icon={<DoorOpen className="w-5 h-5" />}
        label="Room"
        sublabel="1 or more"
        value={guests.rooms}
        min={1}
        max={10}
        onChange={(v) => set("rooms", v)}
      />

      {/* Pets toggle */}
      <div className="flex items-center justify-between py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center text-lg flex-shrink-0">
            🐾
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-800 leading-tight">Pets with you?</p>
          </div>
        </div>
        <label className="toggle-switch cursor-pointer">
          <input
            type="checkbox"
            checked={guests.pets}
            onChange={(e) => set("pets", e.target.checked)}
          />
          <span className={cn("toggle-slider", guests.pets && "!bg-figma-navy")} />
        </label>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full mt-3 bg-figma-navy hover:bg-figma-navy/90 active:bg-figma-navy text-white py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm cursor-pointer"
      >
        Done
      </button>
    </div>
  );
}
