import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// No force-dynamic — let Cloudflare cache these files so it can handle
// range requests itself (Cloudflare strips Range headers for uncached content)
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  // Sanitize — only allow safe filenames
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '');
  if (!safe) return new Response(null, { status: 400 });

  const filePath = path.join('/data', 'uploads', safe);
  if (!fs.existsSync(filePath)) return new Response(null, { status: 404 });

  const ext = path.extname(safe).toLowerCase();
  const contentType =
    ext === '.png'  ? 'image/png' :
    ext === '.gif'  ? 'image/gif' :
    ext === '.webp' ? 'image/webp' :
    ext === '.mp4'  ? 'video/mp4' :
    ext === '.webm' ? 'video/webm' :
    ext === '.mov'  ? 'video/quicktime' :
    'image/jpeg';

  const isVideo = contentType.startsWith('video/');
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  if (isVideo) {
    const rangeHeader = req.headers.get('range');

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const buffer = Buffer.alloc(chunkSize);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, chunkSize, start);
        fs.closeSync(fd);

        return new Response(buffer, {
          status: 206,
          headers: {
            'Content-Type': contentType,
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunkSize),
            'Cache-Control': 'public, max-age=604800',
          },
        });
      }
    }

    const buffer = fs.readFileSync(filePath);
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(fileSize),
        'Cache-Control': 'public, max-age=604800',
      },
    });
  }

  // Images
  const buffer = fs.readFileSync(filePath);
  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(fileSize),
      'Cache-Control': 'public, max-age=604800',
    },
  });
}
