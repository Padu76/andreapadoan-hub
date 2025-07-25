// api/secure-download.js
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    // Decode and validate token
    const tokenData = JSON.parse(
      Buffer.from(token, 'base64url').toString()
    );

    const { filename, email, expires } = tokenData;

    // Check if token has expired
    if (Date.now() > expires) {
      return res.status(401).json({ error: 'Download link has expired' });
    }

    // Get the file from Vercel Blob
    const { blobs } = await list({
      prefix: filename,
      limit: 1
    });

    if (blobs.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileBlob = blobs[0];

    // Fetch the file content
    const response = await fetch(fileBlob.url);
    const fileBuffer = await response.arrayBuffer();

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.byteLength);

    // Send the file
    res.send(Buffer.from(fileBuffer));

  } catch (error) {
    console.error('Download error:', error);
    return res.status(400).json({ error: 'Invalid token' });
  }
}