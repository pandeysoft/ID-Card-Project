import { createContext, useContext, useMemo, useState } from 'react';
import type { RouteProp } from '@react-navigation/native';
import { ContactDetailScreen } from '../screens/ContactDetailScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { LeadCaptureScreen } from '../screens/LeadCaptureScreen';
import { LeadDetailScreen } from '../screens/LeadDetailScreen';
import { LeadsScreen } from '../screens/LeadsScreen';
import { NetworkingScreen } from '../screens/NetworkingScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PublicProfileScreen } from '../screens/PublicProfileScreen';
import { ProfileProvider } from '../contexts';
import type { Lead, SavedContact } from '../types';
import type { RootStackParamList } from '../types/navigation';
import { RootStack } from './RootStack';

type EditProfileNavigationValue = {
  openEditProfile: (profileId: string) => void;
  openContactDetail: (contact: SavedContact) => void;
  openLeadDetail: (lead: Lead) => void;
  openLeadCapturePreview: () => void;
  openLeadsPreview: () => void;
  openNetworkingPreview: () => void;
  openOnboardingPreview: () => void;
  openPublicProfilePreview: (publicSlug?: string) => void;
};

const EditProfileNavigationContext = createContext<EditProfileNavigationValue | undefined>(undefined);

export function RootNavigator() {
  const [editingProfileParams, setEditingProfileParams] =
    useState<RootStackParamList['EditProfile'] | null>(null);
  const [selectedContactParams, setSelectedContactParams] =
    useState<RootStackParamList['ContactDetail'] | null>(null);
  const [selectedLeadParams, setSelectedLeadParams] = useState<RootStackParamList['LeadDetail'] | null>(null);
  const [showingLeadCapture, setShowingLeadCapture] = useState(false);
  const [showingLeads, setShowingLeads] = useState(false);
  const [showingNetworking, setShowingNetworking] = useState(false);
  const [showingOnboarding, setShowingOnboarding] = useState(false);
  const [publicProfileParams, setPublicProfileParams] =
    useState<RootStackParamList['PublicProfile']>();
  const [showingPublicProfile, setShowingPublicProfile] = useState(false);
  const publicProfileRoute = useMemo<RouteProp<RootStackParamList, 'PublicProfile'>>(
    () => ({
      key: 'PublicProfile',
      name: 'PublicProfile',
      params: publicProfileParams,
    }),
    [publicProfileParams],
  );
  const leadsPreviewRoute = useMemo<RouteProp<RootStackParamList, 'LeadsPreview'>>(
    () => ({
      key: 'LeadsPreview',
      name: 'LeadsPreview',
      params: undefined,
    }),
    [],
  );
  const leadDetailRoute = useMemo<RouteProp<RootStackParamList, 'LeadDetail'> | null>(
    () =>
      selectedLeadParams
        ? {
            key: `LeadDetail-${selectedLeadParams.leadId}`,
            name: 'LeadDetail',
            params: selectedLeadParams,
          }
        : null,
    [selectedLeadParams],
  );
  const contactDetailRoute = useMemo<RouteProp<RootStackParamList, 'ContactDetail'> | null>(
    () =>
      selectedContactParams
        ? {
            key: `ContactDetail-${selectedContactParams.contactId}`,
            name: 'ContactDetail',
            params: selectedContactParams,
          }
        : null,
    [selectedContactParams],
  );
  const editProfileRoute = useMemo<RouteProp<RootStackParamList, 'EditProfile'> | null>(
    () =>
      editingProfileParams
        ? {
            key: `EditProfile-${editingProfileParams.profileId}`,
            name: 'EditProfile',
            params: editingProfileParams,
          }
        : null,
    [editingProfileParams],
  );
  const value = useMemo(
    () => ({
      openEditProfile: (profileId: string) => setEditingProfileParams({ profileId }),
      openContactDetail: (contact: SavedContact) => setSelectedContactParams({ contactId: contact.id }),
      openLeadDetail: (lead: Lead) => setSelectedLeadParams({ leadId: lead.id }),
      openLeadCapturePreview: () => setShowingLeadCapture(true),
      openLeadsPreview: () => setShowingLeads(true),
      openNetworkingPreview: () => setShowingNetworking(true),
      openOnboardingPreview: () => setShowingOnboarding(true),
      openPublicProfilePreview: (publicSlug?: string) => {
        setPublicProfileParams(publicSlug ? { publicSlug } : { devPreview: true });
        setShowingPublicProfile(true);
      },
    }),
    [],
  );

  return (
    <ProfileProvider>
      <EditProfileNavigationContext.Provider value={value}>
      {editProfileRoute ? (
        <EditProfileScreen
          onCancel={() => setEditingProfileParams(null)}
          route={editProfileRoute}
        />
      ) : contactDetailRoute ? (
        <ContactDetailScreen onBack={() => setSelectedContactParams(null)} route={contactDetailRoute} />
      ) : leadDetailRoute ? (
        <LeadDetailScreen onBack={() => setSelectedLeadParams(null)} route={leadDetailRoute} />
      ) : showingLeadCapture ? (
        <LeadCaptureScreen onClose={() => setShowingLeadCapture(false)} />
      ) : showingLeads ? (
        <LeadsScreen onClose={() => setShowingLeads(false)} route={leadsPreviewRoute} />
      ) : showingNetworking ? (
        <NetworkingScreen onClose={() => setShowingNetworking(false)} />
      ) : showingOnboarding ? (
        <OnboardingScreen onClose={() => setShowingOnboarding(false)} />
      ) : showingPublicProfile ? (
        <PublicProfileScreen
          onClose={() => setShowingPublicProfile(false)}
          route={publicProfileRoute}
        />
      ) : (
        <RootStack />
      )}
      </EditProfileNavigationContext.Provider>
    </ProfileProvider>
  );
}

export function useEditProfileNavigation() {
  const value = useContext(EditProfileNavigationContext);

  if (!value) {
    throw new Error('useEditProfileNavigation must be used within RootNavigator.');
  }

  return value;
}
