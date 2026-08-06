const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export async function uploadPhoto(uri: string): Promise<string> {
  const form = new FormData();
  form.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);
  form.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.secure_url;
}
