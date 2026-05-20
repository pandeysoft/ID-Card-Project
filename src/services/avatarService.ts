import { supabase } from './supabase';

const avatarBucket = 'profile-avatars';
const maxAvatarBytes = 5 * 1024 * 1024;
const allowedAvatarTypes: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export async function uploadProfileAvatar(
  userId: string,
  profileId: string,
  imageUri: string,
): Promise<string> {
  const response = await fetch(imageUri);

  if (!response.ok) {
    throw new Error('Unable to read selected avatar.');
  }

  const blob = await response.blob();
  const { contentType, extension } = validateAvatarUpload(imageUri, blob);
  const imageData = await blob.arrayBuffer();
  const path = `${userId}/${profileId}/avatar-${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from(avatarBucket)
    .upload(path, imageData, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error('Unable to upload avatar.');
  }

  return path;
}

export function getAvatarPublicUrl(path: string): string {
  const { data } = supabase.storage.from(avatarBucket).getPublicUrl(path);
  return data.publicUrl;
}

function validateAvatarUpload(
  imageUri: string,
  blob: Blob,
): { contentType: string; extension: string } {
  if (!Number.isFinite(blob.size) || blob.size <= 0) {
    throw new Error('Avatar file size could not be verified.');
  }

  if (blob.size > maxAvatarBytes) {
    throw new Error('Avatar must be 5MB or smaller.');
  }

  const extension = getAvatarExtension(imageUri, blob.type);

  if (!extension) {
    throw new Error('Avatar file type could not be verified.');
  }

  const contentType = allowedAvatarTypes[extension];

  if (!contentType) {
    throw new Error('Avatar must be a JPG, PNG, or WebP image.');
  }

  if (blob.type && !Object.values(allowedAvatarTypes).includes(blob.type.toLowerCase())) {
    throw new Error('Avatar must be a JPG, PNG, or WebP image.');
  }

  return { contentType, extension };
}

function getAvatarExtension(imageUri: string, mimeType: string) {
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType === 'image/jpeg') {
    return 'jpg';
  }

  if (normalizedMimeType === 'image/png') {
    return 'png';
  }

  if (normalizedMimeType === 'image/webp') {
    return 'webp';
  }

  return imageUri.split('?')[0]?.split('.').pop()?.toLowerCase();
}
