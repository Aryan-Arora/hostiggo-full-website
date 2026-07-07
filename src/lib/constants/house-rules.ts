/**
 * Common house rules presets for quick addition
 */
export const COMMON_HOUSE_RULES = [
  'No smoking',
  'No pets',
  'No loud noise after 10 PM',
  'No parties or gatherings',
  'No unregistered guests',
  'Check-in after 2 PM, Check-out before 11 AM',
  'Guests must be 18+',
  'No short-term rentals',
  'No outside visitors without permission',
  'Keep property clean and tidy',
  'No cooking strong-smelling food',
  'Respect quiet hours (10 PM - 8 AM)',
];

/**
 * Safety feature descriptions and recommendations
 */
export const SAFETY_FEATURE_INFO = {
  exterior_security_camera: {
    title: 'Exterior security camera',
    emoji: '📹',
    description: 'Security cameras monitoring the exterior of the property',
    placement: 'Entrance, courtyard, or garden areas',
  },
  noise_level_monitoring_device: {
    title: 'Noise level monitoring device',
    emoji: '🔊',
    description: 'Device to monitor and detect excessive noise levels',
    placement: 'Living areas',
  },
  weapon_on_property: {
    title: 'Weapon(s) on property',
    emoji: '🔫',
    description: 'Any weapons or firearms present on the property',
    placement: 'Secure storage',
  },
  smoke_alarm: {
    title: 'Smoke alarm',
    emoji: '🚨',
    description: 'Functional smoke detection systems in the property',
    placement: 'All rooms and hallways',
  },
  first_aid_kit: {
    title: 'First aid kit',
    emoji: '🩹',
    description: 'First aid supplies and medical equipment available',
    placement: 'Easy-to-find location',
  },
  fire_extinguisher: {
    title: 'Fire extinguisher',
    emoji: '🧯',
    description: 'Fire extinguishing equipment on premises',
    placement: 'Kitchen and common areas',
  },
  emergency_contacts: {
    title: 'Emergency contacts',
    emoji: '📞',
    description: 'Emergency contact information provided to guests',
    placement: 'Visible location like welcome guide',
  },
  cctv: {
    title: 'CCTV',
    emoji: '📷',
    description: 'Closed-circuit television security system',
    placement: 'Common areas only',
  },
  smart_lock: {
    title: 'Smart lock',
    emoji: '🔒',
    description: 'Electronic or smart lock system for entry',
    placement: 'Main entrance',
  },
};

/**
 * Get safety feature info by name
 */
export function getSafetyFeatureInfo(featureName: string) {
  const key = featureName.toLowerCase().replace(/\s+/g, '_');
  return SAFETY_FEATURE_INFO[key as keyof typeof SAFETY_FEATURE_INFO];
}

/**
 * Get emoji for safety feature
 */
export function getSafetyFeatureEmoji(featureName: string): string {
  const info = getSafetyFeatureInfo(featureName);
  return info?.emoji || '✓';
}
