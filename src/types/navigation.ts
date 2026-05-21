import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
  ContactDetail: {
    contactId: string;
  };
  EditProfile: {
    profileId: string;
  };
  LeadsPreview: undefined;
  LeadDetail: {
    leadId: string;
  };
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
