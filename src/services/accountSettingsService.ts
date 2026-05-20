import { supabase } from './supabase';
import type { AccountSettings, PrivacySettings, SharingSettings } from '../types';

export type UpdatePrivacySettingsInput = Partial<
  Omit<PrivacySettings, 'userId' | 'createdAt' | 'updatedAt'>
>;

export type UpdateSharingSettingsInput = Partial<
  Omit<SharingSettings, 'userId' | 'createdAt' | 'updatedAt'>
>;

export type UpdateAccountSettingsInput = {
  privacy?: UpdatePrivacySettingsInput;
  sharing?: UpdateSharingSettingsInput;
};

type PrivacySettingsRow = {
  user_id: string;
  profile_visibility: PrivacySettings['profileVisibility'];
  searchable_by_email: boolean;
  searchable_by_phone: boolean;
  created_at?: string;
  updated_at?: string;
};

type SharingSettingsRow = {
  user_id: string;
  contact_sync_enabled: boolean;
  lead_sharing_requires_consent: boolean;
  allow_vcard_export: boolean;
  created_at?: string;
  updated_at?: string;
};

const defaultPrivacySettings: Omit<PrivacySettings, 'userId'> = {
  profileVisibility: 'contacts',
  searchableByEmail: false,
  searchableByPhone: false,
};

const defaultSharingSettings: Omit<SharingSettings, 'userId'> = {
  contactSyncEnabled: false,
  leadSharingRequiresConsent: true,
  allowVCardExport: true,
};

function assertNoError(error: Error | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function getAccountSettings(userId: string): Promise<AccountSettings> {
  const [privacy, sharing] = await Promise.all([
    getPrivacySettings(userId),
    getSharingSettings(userId),
  ]);

  return {
    userId,
    privacy,
    sharing,
    updatedAt: privacy.updatedAt ?? sharing.updatedAt,
    createdAt: privacy.createdAt ?? sharing.createdAt,
  };
}

export async function updateAccountSettings(
  userId: string,
  updates: UpdateAccountSettingsInput,
): Promise<AccountSettings> {
  if (updates.privacy) {
    await updatePrivacySettings(userId, updates.privacy);
  }

  if (updates.sharing) {
    await updateSharingSettings(userId, updates.sharing);
  }

  return getAccountSettings(userId);
}

export async function getPrivacySettings(userId: string): Promise<PrivacySettings> {
  const { data, error } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .returns<PrivacySettingsRow[]>()
    .maybeSingle();

  assertNoError(error, 'Unable to load privacy settings.');
  return data ? mapPrivacySettingsRow(data) : { userId, ...defaultPrivacySettings };
}

export async function updatePrivacySettings(
  userId: string,
  updates: UpdatePrivacySettingsInput,
): Promise<PrivacySettings> {
  const nextRow = mapPrivacySettingsToRow({ userId, ...defaultPrivacySettings, ...updates });
  const { data, error } = await supabase
    .from('privacy_settings')
    .upsert(nextRow, { onConflict: 'user_id' })
    .select('*')
    .returns<PrivacySettingsRow[]>()
    .single();

  assertNoError(error, 'Unable to update privacy settings.');
  if (!data) {
    throw new Error('Unable to update privacy settings.');
  }

  return mapPrivacySettingsRow(data);
}

export async function getSharingSettings(userId: string): Promise<SharingSettings> {
  const { data, error } = await supabase
    .from('sharing_settings')
    .select('*')
    .eq('user_id', userId)
    .returns<SharingSettingsRow[]>()
    .maybeSingle();

  assertNoError(error, 'Unable to load sharing settings.');
  return data ? mapSharingSettingsRow(data) : { userId, ...defaultSharingSettings };
}

export async function updateSharingSettings(
  userId: string,
  updates: UpdateSharingSettingsInput,
): Promise<SharingSettings> {
  const nextRow = mapSharingSettingsToRow({ userId, ...defaultSharingSettings, ...updates });
  const { data, error } = await supabase
    .from('sharing_settings')
    .upsert(nextRow, { onConflict: 'user_id' })
    .select('*')
    .returns<SharingSettingsRow[]>()
    .single();

  assertNoError(error, 'Unable to update sharing settings.');
  if (!data) {
    throw new Error('Unable to update sharing settings.');
  }

  return mapSharingSettingsRow(data);
}

function mapPrivacySettingsRow(row: PrivacySettingsRow): PrivacySettings {
  return {
    userId: row.user_id,
    profileVisibility: row.profile_visibility,
    searchableByEmail: row.searchable_by_email,
    searchableByPhone: row.searchable_by_phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSharingSettingsRow(row: SharingSettingsRow): SharingSettings {
  return {
    userId: row.user_id,
    contactSyncEnabled: row.contact_sync_enabled,
    leadSharingRequiresConsent: row.lead_sharing_requires_consent,
    allowVCardExport: row.allow_vcard_export,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPrivacySettingsToRow(settings: PrivacySettings): PrivacySettingsRow {
  return {
    user_id: settings.userId,
    profile_visibility: settings.profileVisibility,
    searchable_by_email: settings.searchableByEmail,
    searchable_by_phone: settings.searchableByPhone,
  };
}

function mapSharingSettingsToRow(settings: SharingSettings): SharingSettingsRow {
  return {
    user_id: settings.userId,
    contact_sync_enabled: settings.contactSyncEnabled,
    lead_sharing_requires_consent: settings.leadSharingRequiresConsent,
    allow_vcard_export: settings.allowVCardExport,
  };
}
