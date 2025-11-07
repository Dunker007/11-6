export interface UserProfile {
  id: string;
  legalInitials: string; // CWB
  zipCode: string; // 54025
  fullName?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessInfo {
  entityType?: 'sole_proprietor' | 'llc' | 'corporation' | 'partnership';
  entityName?: string;
  ein?: string;
  stateOfIncorporation?: string;
  registeredAgent?: string;
}

export interface LegalInfo {
  profile: UserProfile;
  business?: BusinessInfo;
}

