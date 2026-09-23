export type IDType = 'pan' | 'passport';
export type IDVerificationStatus = 'unverified' | 'pending' | 'verified';

export interface IDDocument {
  type: IDType;
  number: string;
  imageUrl?: string;
  status: IDVerificationStatus;
  reason?: string;
  providerReference?: string;
  submittedAt?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string;
  phoneVerified: boolean;
  isVerified: boolean;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Transgender' | 'Prefer Not To Say' | '';
  profileImage?: string;
  identityVerification?: IDDocument;
  profileCompletionPercentage: number;
}
