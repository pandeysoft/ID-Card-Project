import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
  ContactDetail: {
    contactId: string;
  };
  EditProfile: {
    profileId: string;
  };
  LeadCapturePreview: undefined;
  LeadsPreview: undefined;
  LeadDetail: {
    leadId: string;
  };
  NetworkingPreview: undefined;
  OnboardingPreview: undefined;
  Diagnostics: undefined;
  PublicProfile:
    | {
        publicSlug?: string;
        devPreview?: boolean;
      }
    | undefined;
};

export type RootTabParamList = {
  MyCard: undefined;
  Scan: undefined;
  Contacts: undefined;
  Settings: undefined;
};
