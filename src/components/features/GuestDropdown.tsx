import { User, Baby, BedDouble, PawPrint } from "lucide-react";
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
  sublabel?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

function CounterRow({ icon, label, sublabel, value, min = 0, max = 20, onChange }: CounterRowProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3.5">
        <div className="w-7 flex items-center justify-center text-gray-800 flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[16px] font-semibold text-gray-900 leading-tight">{label}</p>
          {sublabel && <p className="text-[13px] text-gray-400 mt-0.5">{sublabel}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-lg font-medium leading-none text-white transition-all",
            value <= min
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-[#0f4c81] hover:bg-[#0a3a63] active:scale-95"
          )}
        >
          −
        </button>
        <span className="w-5 text-center text-[16px] font-semibold text-gray-900 tabular-nums">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-lg font-medium leading-none text-white transition-all",
            value >= max
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-[#0f4c81] hover:bg-[#0a3a63] active:scale-95"
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
    <div className="dropdown-panel animate-fade-in-down w-[380px] max-w-[92vw] rounded-3xl p-6">
      <CounterRow
        icon={<User className="w-6 h-6" strokeWidth={1.7} />}
        label="Adults"
        sublabel="Ages 18 or above"
        value={guests.adults}
        min={1}
        max={16}
        onChange={(v) => set("adults", v)}
      />
      <CounterRow
        icon={<Baby className="w-6 h-6" strokeWidth={1.7} />}
        label="Children"
        sublabel="Ages 0-17"
        value={guests.children}
        max={8}
        onChange={(v) => set("children", v)}
      />
      <CounterRow
        icon={<BedDouble className="w-6 h-6" strokeWidth={1.7} />}
        label="Room"
        value={guests.rooms}
        min={1}
        max={10}
        onChange={(v) => set("rooms", v)}
      />

      {/* Pets toggle */}
      <div className="border-t border-gray-200 mt-2 pt-4 flex items-center justify-between pb-2">
        <div className="flex items-center gap-3.5">
          <div className="w-7 flex items-center justify-center text-gray-800 flex-shrink-0">
            <PawPrint className="w-6 h-6" strokeWidth={1.7} />
          </div>
          <p className="text-[16px] font-semibold text-gray-900 leading-tight">Pets with you?</p>
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
        className="w-full mt-4 bg-primary-gradient hover:opacity-90 active:scale-[0.99] text-white py-3 rounded-xl font-semibold text-[16px] transition-all shadow-sm"
      >
        Done
      </button>
    </div>
  );
}
