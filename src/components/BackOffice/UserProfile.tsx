import { useState, useEffect } from 'react';
import { userProfileService } from '../../services/backoffice/userProfileService';
import type { UserProfile } from '@/types/userProfile';
import '../../styles/UserProfile.css';

function UserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    const loadedProfile = userProfileService.getProfile();
    setProfile(loadedProfile);
    setIsLoading(false);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (profile) {
      const updated = userProfileService.updateProfile({
        legalInitials:
          (formData.get('legalInitials') as string) || profile.legalInitials,
        zipCode: (formData.get('zipCode') as string) || profile.zipCode,
        fullName: (formData.get('fullName') as string) || undefined,
        email: (formData.get('email') as string) || undefined,
        phone: (formData.get('phone') as string) || undefined,
      });
      setProfile(updated);
    }

    setIsEditing(false);
  };

  if (isLoading) {
    return <div className="user-profile-loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="user-profile-error">Profile not found</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h3>User Profile</h3>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="edit-btn">
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="profile-form">
          <div className="form-group">
            <label>Legal Initials *</label>
            <input
              type="text"
              name="legalInitials"
              defaultValue={profile.legalInitials}
              required
              maxLength={10}
              placeholder="CWB"
            />
          </div>

          <div className="form-group">
            <label>ZIP Code *</label>
            <input
              type="text"
              name="zipCode"
              defaultValue={profile.zipCode}
              required
              pattern="[0-9]{5}"
              placeholder="54025"
            />
          </div>

          <div className="form-group">
            <label>Full Name (Optional)</label>
            <input
              type="text"
              name="fullName"
              defaultValue={profile.fullName || ''}
              placeholder="Full legal name"
            />
          </div>

          <div className="form-group">
            <label>Email (Optional)</label>
            <input
              type="email"
              name="email"
              defaultValue={profile.email || ''}
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Phone (Optional)</label>
            <input
              type="tel"
              name="phone"
              defaultValue={profile.phone || ''}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn">
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-display">
          <div className="profile-item">
            <span className="profile-label">Legal Initials:</span>
            <span className="profile-value">{profile.legalInitials}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">ZIP Code:</span>
            <span className="profile-value">{profile.zipCode}</span>
          </div>
          {profile.fullName && (
            <div className="profile-item">
              <span className="profile-label">Full Name:</span>
              <span className="profile-value">{profile.fullName}</span>
            </div>
          )}
          {profile.email && (
            <div className="profile-item">
              <span className="profile-label">Email:</span>
              <span className="profile-value">{profile.email}</span>
            </div>
          )}
          {profile.phone && (
            <div className="profile-item">
              <span className="profile-label">Phone:</span>
              <span className="profile-value">{profile.phone}</span>
            </div>
          )}
          <div className="profile-meta">
            <span className="meta-label">Profile Created:</span>
            <span className="meta-value">
              {profile.createdAt.toLocaleDateString()}
            </span>
          </div>
          <div className="profile-meta">
            <span className="meta-label">Last Updated:</span>
            <span className="meta-value">
              {profile.updatedAt.toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
