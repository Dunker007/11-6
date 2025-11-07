import type { UserProfile, BusinessInfo, LegalInfo } from '@/types/userProfile';

const USER_PROFILE_KEY = 'dlx_user_profile';
const BUSINESS_INFO_KEY = 'dlx_business_info';

export class UserProfileService {
  private static instance: UserProfileService;
  private profile: UserProfile | null = null;
  private businessInfo: BusinessInfo | null = null;

  private constructor() {
    this.loadData();
  }

  static getInstance(): UserProfileService {
    if (!UserProfileService.instance) {
      UserProfileService.instance = new UserProfileService();
    }
    return UserProfileService.instance;
  }

  private loadData(): void {
    try {
      const profileData = localStorage.getItem(USER_PROFILE_KEY);
      if (profileData) {
        const profile: UserProfile = JSON.parse(profileData);
        profile.createdAt = new Date(profile.createdAt);
        profile.updatedAt = new Date(profile.updatedAt);
        this.profile = profile;
      } else {
        // Initialize with default values
        this.profile = {
          id: crypto.randomUUID(),
          legalInitials: 'CWB',
          zipCode: '54025',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.saveProfile();
      }

      const businessData = localStorage.getItem(BUSINESS_INFO_KEY);
      if (businessData) {
        this.businessInfo = JSON.parse(businessData);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Initialize with defaults on error
      this.profile = {
        id: crypto.randomUUID(),
        legalInitials: 'CWB',
        zipCode: '54025',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  private saveProfile(): void {
    if (this.profile) {
      try {
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(this.profile));
      } catch (error) {
        console.error('Failed to save user profile:', error);
      }
    }
  }

  private saveBusinessInfo(): void {
    if (this.businessInfo) {
      try {
        localStorage.setItem(BUSINESS_INFO_KEY, JSON.stringify(this.businessInfo));
      } catch (error) {
        console.error('Failed to save business info:', error);
      }
    }
  }

  getProfile(): UserProfile | null {
    return this.profile;
  }

  updateProfile(updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>): UserProfile {
    if (!this.profile) {
      throw new Error('Profile not initialized');
    }

    this.profile = {
      ...this.profile,
      ...updates,
      updatedAt: new Date(),
    };
    this.saveProfile();
    return this.profile;
  }

  getBusinessInfo(): BusinessInfo | null {
    return this.businessInfo;
  }

  updateBusinessInfo(updates: Partial<BusinessInfo>): BusinessInfo {
    if (!this.businessInfo) {
      this.businessInfo = {};
    }

    this.businessInfo = {
      ...this.businessInfo,
      ...updates,
    };
    this.saveBusinessInfo();
    return this.businessInfo;
  }

  getLegalInfo(): LegalInfo {
    return {
      profile: this.profile!,
      business: this.businessInfo || undefined,
    };
  }

  // Helper methods for document generation
  getFormattedName(): string {
    if (this.profile?.fullName) {
      return this.profile.fullName;
    }
    return this.profile?.legalInitials || 'CWB';
  }

  getFormattedAddress(): string {
    // Just zip code for now, can be expanded
    return `ZIP: ${this.profile?.zipCode || '54025'}`;
  }
}

export const userProfileService = UserProfileService.getInstance();

