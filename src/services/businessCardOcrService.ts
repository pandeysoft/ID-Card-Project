export type ExtractedBusinessCard = {
  name: string;
  title: string;
  company: string;
  emails: string[];
  phones: string[];
  websites: string[];
  address: string;
};

export async function extractBusinessCardFromImage(
  imageUri: string,
): Promise<ExtractedBusinessCard> {
  if (!imageUri.trim()) {
    throw new Error('Image URI is required for business card extraction.');
  }

  await delay(650);

  return {
    name: 'Maya Reed',
    title: 'Partnerships Lead',
    company: 'Northstar Labs',
    emails: ['maya@northstarlabs.com'],
    phones: ['+1 512 555 0184'],
    websites: ['https://northstarlabs.com'],
    address: 'Austin, TX',
  };
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
