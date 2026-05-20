import { supabase } from './supabase';

const avatarBucket = 'profile-avatars';

export async function uploadProfileAvatar(
  userId: string,
  profileId: string,
  imageUri: string,
): Promise<string> {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const imageData = await blob.arrayBuffer();
  const extension = imageUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const path = `${userId}/${profileId}-${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from(avatarBucket)
    .upload(path, imageData, {
      contentType: blob.type || 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(error.message || 'Unable to upload avatar.');
  }

  return path;
}

export function getAvatarPublicUrl(path: string): string {
  const { data } = supabase.storage.from(avatarBucket).getPublicUrl(path);
  return data.publicUrl;
}
