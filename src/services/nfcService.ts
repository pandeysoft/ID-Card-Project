export type NfcPayload = {
  type: 'url';
  value: string;
  records: readonly NfcPayloadRecord[];
  preparedAt: string;
};

export type NfcPayloadRecord = {
  type: 'uri';
  value: string;
};

export type NfcWriteResult = {
  success: boolean;
  mocked: boolean;
  message: string;
  payload: NfcPayload;
};

export async function isNfcSupported(): Promise<boolean> {
  return false;
}

export function prepareNfcPayload(profileUrl: string): NfcPayload {
  const normalizedUrl = normalizeProfileUrl(profileUrl);

  return {
    type: 'url',
    value: normalizedUrl,
    records: [
      {
        type: 'uri',
        value: normalizedUrl,
      },
    ],
    preparedAt: new Date().toISOString(),
  };
}

export async function writeProfileUrlToNfc(profileUrl: string): Promise<NfcWriteResult> {
  const payload = prepareNfcPayload(profileUrl);
  const supported = await isNfcSupported();

  if (!supported) {
    return {
      success: false,
      mocked: true,
      message: 'NFC writing is not available in this build yet.',
      payload,
    };
  }

  return {
    success: true,
    mocked: true,
    message: 'NFC payload prepared.',
    payload,
  };
}

export async function readProfileUrlFromNfc(): Promise<string | null> {
  const supported = await isNfcSupported();

  if (!supported) {
    return null;
  }

  return null;
}

function normalizeProfileUrl(profileUrl: string): string {
  const trimmedUrl = profileUrl.trim();

  if (!trimmedUrl) {
    throw new Error('Profile URL is required for NFC sharing.');
  }

  try {
    const url = new URL(trimmedUrl);

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('Profile URL must start with http:// or https://.');
    }

    return url.toString();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Profile URL')) {
      throw error;
    }

    throw new Error('Enter a valid profile URL before writing to NFC.');
  }
}
