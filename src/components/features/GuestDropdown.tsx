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
    <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-figma-navy/5 rounded-xl flex items-center justify-center text-figma-navy flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-gray-800 leading-tight">{label}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={cn(
            "w-8 h-8 rounded-full border flex items-center justify-center text-base transition-all font-light leading-none",
            value <= min
              ? "border-gray-200 text-gray-300 cursor-not-allowed"
              : "border-gray-300 text-gray-600 hover:border-figma-navy/40 hover:text-figma-navy active:scale-95"
          )}
        >
          −
        </button>
        <span className="w-5 text-center text-[13px] font-bold text-gray-800 tabular-nums">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={cn(
            "w-8 h-8 rounded-full border flex items-center justify-center text-base transition-all font-light leading-none",
            value >= max
              ? "border-gray-200 text-gray-300 cursor-not-allowed"
              : "border-gray-300 text-gray-600 hover:border-figma-navy/40 hover:text-figma-navy active:scale-95"
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
    <div className="dropdown-panel animate-fade-in-down w-[320px] max-w-[92vw] p-4">
      <CounterRow
        icon={<Users className="w-4 h-4" />}
        label="Adults"
        sublabel="Age 13 or above"
        value={guests.adults}
        min={1}
        max={16}
        onChange={(v) => set("adults", v)}
      />
      <CounterRow
        icon={<Baby className="w-4 h-4" />}
        label="Children"
        sublabel="Ages 2–12"
        value={guests.children}
        max={8}
        onChange={(v) => set("children", v)}
      />
      <CounterRow
        icon={<DoorOpen className="w-4 h-4" />}
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
          <div className="w-9 h-9 bg-figma-navy/5 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
            🐾
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-800 leading-tight">Pets with you?</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Service animals allowed</p>
          </div>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={guests.pets}
            onChange={(e) => set("pets", e.target.checked)}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-2 bg-figma-navy hover:bg-figma-navy/90 active:bg-figma-navy text-white py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
      >
        Done
      </button>
    </div>
  );
}
