import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Profile, SavedContact } from '../types';

export function generateVCardFromProfile(profile: Profile): string {
  return buildVCard({
    company: profile.company,
    email: profile.email,
    name: profile.name,
    phone: profile.phone,
    title: profile.headline,
    urls: profile.links.map((link) => link.url),
  });
}

export function generateVCardFromContact(contact: SavedContact): string {
  return buildVCard({
    company: contact.snapshot.business?.companyName,
    email: contact.snapshot.email,
    name: contact.snapshot.name,
    phone: contact.snapshot.phone,
    title: contact.snapshot.headline,
    urls: contact.snapshot.links.map((link) => link.url),
  });
}

export async function shareVCardFile(
  fileName: string,
  vcardContent: string,
): Promise<void> {
  const available = await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }

  const safeFileName = sanitizeFileName(fileName || 'contact');
  const file = new File(Paths.cache, `${safeFileName}.vcf`);

  file.write(vcardContent);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/vcard',
    UTI: 'public.vcard',
  });
}

function buildVCard({
  company,
  email,
  name,
  phone,
  title,
  urls,
}: {
  company?: string;
  email?: string;
  name: string;
  phone?: string;
  title?: string;
  urls: readonly string[];
}) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardValue(name)}`,
    title ? `TITLE:${escapeVCardValue(title)}` : null,
    company ? `ORG:${escapeVCardValue(company)}` : null,
    phone ? `TEL:${escapeVCardValue(phone)}` : null,
    email ? `EMAIL:${escapeVCardValue(email)}` : null,
    ...urls.filter(Boolean).map((url) => `URL:${escapeVCardValue(url)}`),
    'END:VCARD',
  ];

  return lines.filter((line): line is string => line !== null).join('\r\n');
}

function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .trim();
}

function sanitizeFileName(value: string): string {
  return value.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'contact';
}
