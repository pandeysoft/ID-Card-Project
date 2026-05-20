import { createContext, useContext, useMemo, useState } from 'react';
import { ContactDetailScreen } from '../screens/ContactDetailScreen';
import { EditProfileScreen, type EditProfileForm } from '../screens/EditProfileScreen';
import { LeadCaptureScreen } from '../screens/LeadCaptureScreen';
import { LeadDetailScreen } from '../screens/LeadDetailScreen';
import { LeadsScreen } from '../screens/LeadsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PublicProfileScreen } from '../screens/PublicProfileScreen';
import type { Lead, Profile, SavedContact } from '../types';
import { RootTabs } from './RootTabs';

type EditProfileNavigationValue = {
  openEditProfile: (profile: Profile, onSave: (form: EditProfileForm) => Promise<void> | void) => void;
  openContactDetail: (contact: SavedContact) => void;
  openLeadDetail: (lead: Lead) => void;
  openLeadCapturePreview: () => void;
  openLeadsPreview: () => void;
  openOnboardingPreview: () => void;
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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showingLeadCapture, setShowingLeadCapture] = useState(false);
  const [showingLeads, setShowingLeads] = useState(false);
  const [showingOnboarding, setShowingOnboarding] = useState(false);
  const [publicProfileSlug, setPublicProfileSlug] = useState<string | null>(null);
  const [showingPublicProfile, setShowingPublicProfile] = useState(false);
  const value = useMemo(
    () => ({
      openEditProfile: (profile: Profile, onSave: (form: EditProfileForm) => Promise<void> | void) => {
        setEditingProfile({ profile, onSave });
      },
      openContactDetail: (contact: SavedContact) => setSelectedContact(contact),
      openLeadDetail: (lead: Lead) => setSelectedLead(lead),
      openLeadCapturePreview: () => setShowingLeadCapture(true),
      openLeadsPreview: () => setShowingLeads(true),
      openOnboardingPreview: () => setShowingOnboarding(true),
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
      ) : selectedLead ? (
        <LeadDetailScreen lead={selectedLead} onBack={() => setSelectedLead(null)} />
      ) : showingLeadCapture ? (
        <LeadCaptureScreen onClose={() => setShowingLeadCapture(false)} />
      ) : showingLeads ? (
        <LeadsScreen onClose={() => setShowingLeads(false)} />
      ) : showingOnboarding ? (
        <OnboardingScreen onClose={() => setShowingOnboarding(false)} />
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
