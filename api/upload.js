import { put } from '@vercel/blob';

// Para habilitar o recebimento de corpos binários brutos na Vercel
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename } = request.query;
    if (!filename) {
      return response.status(400).json({ error: 'Filename query parameter is required' });
    }

    // Lê o corpo da requisição como buffer binário
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return response.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN is not configured on Vercel' });
    }

    // Faz o upload direto para o Vercel Blob
    const blob = await put(filename, buffer, {
      access: 'public',
      token: token
    });

    return response.status(200).json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return response.status(500).json({ error: error.message });
  }
}
