import { createContext, useContext, useMemo, useState } from 'react';
import { ContactDetailScreen } from '../screens/ContactDetailScreen';
import { EditProfileScreen, type EditProfileForm } from '../screens/EditProfileScreen';
import { LeadCaptureScreen } from '../screens/LeadCaptureScreen';
import { PublicProfileScreen } from '../screens/PublicProfileScreen';
import type { Profile, SavedContact } from '../types';
import { RootTabs } from './RootTabs';

type EditProfileNavigationValue = {
  openEditProfile: (profile: Profile, onSave: (form: EditProfileForm) => Promise<void> | void) => void;
  openContactDetail: (contact: SavedContact) => void;
  openLeadCapturePreview: () => void;
  openPublicProfilePreview: (publicSlug?: string) => void;
};

type EditingProfileState = {
  profile: Profile;
  onSave: (form: EditProfileForm) => Promise<void> | void;
};

const EditProfileNavigationContext = createContext<EditProfileNavigationValue | undefined>(undefined);

export function RootNavigator() {
  const [editingProfile, setEditingProfile] = useState<EditingProfileState | null>(null);
  const [selectedContact, setSelectedContact] = useState<SavedContact | null>(null);
  const [showingLeadCapture, setShowingLeadCapture] = useState(false);
  const [publicProfileSlug, setPublicProfileSlug] = useState<string | null>(null);
  const [showingPublicProfile, setShowingPublicProfile] = useState(false);
  const value = useMemo(
    () => ({
      openEditProfile: (profile: Profile, onSave: (form: EditProfileForm) => Promise<void> | void) => {
        setEditingProfile({ profile, onSave });
      },
      openContactDetail: (contact: SavedContact) => setSelectedContact(contact),
      openLeadCapturePreview: () => setShowingLeadCapture(true),
      openPublicProfilePreview: (publicSlug?: string) => {
        setPublicProfileSlug(publicSlug ?? null);
        setShowingPublicProfile(true);
      },
    }),
    [],
  );

  return (
    <EditProfileNavigationContext.Provider value={value}>
      {editingProfile ? (
        <EditProfileScreen
          profile={editingProfile.profile}
          onCancel={() => setEditingProfile(null)}
          onSave={async (form) => {
            await editingProfile.onSave(form);
            setEditingProfile(null);
          }}
        />
      ) : selectedContact ? (
        <ContactDetailScreen contact={selectedContact} onBack={() => setSelectedContact(null)} />
      ) : showingLeadCapture ? (
        <LeadCaptureScreen onClose={() => setShowingLeadCapture(false)} />
      ) : showingPublicProfile ? (
        <PublicProfileScreen
          onClose={() => setShowingPublicProfile(false)}
          publicSlug={publicProfileSlug ?? undefined}
        />
      ) : (
        <RootTabs />
      )}
    </EditProfileNavigationContext.Provider>
  );
}

export function useEditProfileNavigation() {
  const value = useContext(EditProfileNavigationContext);

  if (!value) {
    throw new Error('useEditProfileNavigation must be used within RootNavigator.');
  }

  return value;
}
