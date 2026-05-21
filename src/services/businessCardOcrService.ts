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

  // TODO: Wire a real OCR provider here. Beta builds must not create fake parsed contacts.
  throw new Error('Business card OCR is coming soon.');
}
