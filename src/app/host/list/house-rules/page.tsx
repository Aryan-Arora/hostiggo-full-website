'use client';

import { useState } from 'react';
import { Cigarette, PawPrint, PartyPopper, Clock } from 'lucide-react';
import WizardShell from '../_components/WizardShell';
import { cn } from '@/lib/utils';
import { useListingDraft } from '@/context/ListingDraftContext';

function Checkbox({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-5 h-5 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors',
        on ? 'bg-figma-navy border-figma-navy' : 'border-gray-300 bg-white',
      )}
    >
      {on && (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export default function HouseRulesPage() {
  const { draft, update } = useListingDraft();

  const [checkInTime, setCheckInTime] = useState(draft.houseRules?.check_in_time || '');
  const [checkOutTime, setCheckOutTime] = useState(draft.houseRules?.check_out_time || '');

  const [rules, setRules] = useState({
    smoking: draft.houseRules?.smoking_allowed ?? false,
    pets: draft.houseRules?.pets_allowed ?? false,
    parties: draft.houseRules?.parties_allowed ?? false,
    quietHours: draft.houseRules?.quiet_hours ?? false,
  });

  const toggle = (k: keyof typeof rules) => {
    const newRules = { ...rules, [k]: !rules[k] };
    setRules(newRules);
    update({
      houseRules: {
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        smoking_allowed: newRules.smoking,
        pets_allowed: newRules.pets,
        parties_allowed: newRules.parties,
        quiet_hours: newRules.quietHours,
      },
    });
  };

  const handleTimeChange = (type: 'check_in' | 'check_out', val: string) => {
    if (type === 'check_in') setCheckInTime(val);
    else setCheckOutTime(val);
    
    update({
      houseRules: {
        check_in_time: type === 'check_in' ? val : checkInTime,
        check_out_time: type === 'check_out' ? val : checkOutTime,
        smoking_allowed: rules.smoking,
        pets_allowed: rules.pets,
        parties_allowed: rules.parties,
        quiet_hours: rules.quietHours,
      },
    });
  };

  return (
    <WizardShell
      step={13}
      title="Set house rules"
      subtitle="Clear rules help avoid misunderstandings with guests"
    >
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Check-in / Check-out time */}
        <div className="space-y-4">
          <h3 className="text-[13px] font-semibold text-gray-800">Check-in , Check-out time</h3>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="check-in time"
              value={checkInTime}
              onChange={(e) => handleTimeChange('check_in', e.target.value)}
              className="w-full max-w-[200px] border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-figma-navy"
            />
            <input
              type="text"
              placeholder="check-out time"
              value={checkOutTime}
              onChange={(e) => handleTimeChange('check_out', e.target.value)}
              className="w-full max-w-[200px] border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-figma-navy"
            />
          </div>
        </div>

        {/* Allowed at place */}
        <div className="space-y-4">
          <h3 className="text-[13px] font-semibold text-gray-800">Select what&apos;s allowed at your place</h3>
          
          <div className="space-y-3">
            {/* Smoking */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer" onClick={() => toggle('smoking')}>
              <div className="flex items-center gap-4">
                <Cigarette className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Smoking Allowed</span>
              </div>
              <Checkbox on={rules.smoking} onClick={() => {}} />
            </div>

            {/* Pets */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer" onClick={() => toggle('pets')}>
              <div className="flex items-center gap-4">
                <PawPrint className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Pets allowed</span>
              </div>
              <Checkbox on={rules.pets} onClick={() => {}} />
            </div>

            {/* Parties */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer" onClick={() => toggle('parties')}>
              <div className="flex items-center gap-4">
                <PartyPopper className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Parties, events allowed</span>
              </div>
              <Checkbox on={rules.parties} onClick={() => {}} />
            </div>

            {/* Quiet hours */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer" onClick={() => toggle('quietHours')}>
              <div className="flex items-center gap-4">
                <Clock className="w-5 h-5 text-gray-600" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">Quiet hours</span>
                  <span className="text-xs text-figma-navy">Between 10:00 PM and 8:00 AM</span>
                </div>
              </div>
              <Checkbox on={rules.quietHours} onClick={() => {}} />
            </div>
          </div>
        </div>

      </div>
    </WizardShell>
  );
}
