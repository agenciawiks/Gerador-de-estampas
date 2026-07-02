import { del } from '@vercel/blob';

export default async function handler(request, response) {
  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = request.query;
    if (!url) {
      return response.status(400).json({ error: 'URL query parameter is required' });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return response.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN is not configured on Vercel' });
    }

    // Exclui o arquivo do Vercel Blob
    await del(url, {
      token: token
    });

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error("Deletion error:", error);
    return response.status(500).json({ error: error.message });
  }
}
