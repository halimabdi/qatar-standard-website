import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  // Sanitize — only allow safe filenames
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '');
  if (!safe) return new NextResponse(null, { status: 400 });

  const filePath = path.join('/data/uploads', safe);
  if (!fs.existsSync(filePath)) return new NextResponse(null, { status: 404 });

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(safe).toLowerCase();
  const contentType =
    ext === '.png' ? 'image/png' :
    ext === '.gif' ? 'image/gif' :
    ext === '.webp' ? 'image/webp' :
    'image/jpeg';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=604800',
    },
  });
}
