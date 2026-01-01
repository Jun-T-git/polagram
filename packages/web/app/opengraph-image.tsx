import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Image metadata
export const alt = 'Polagram - Interactive Sequence Diagrams';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  const logoData = await readFile(join(process.cwd(), 'public', 'polagram-logo.png'));
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          background: 'linear-gradient(to bottom right, #09090b, #18181b)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          {/* Polagram Logo Icon */}
          <img
            src={logoSrc}
            width="120"
            height="120"
            style={{ marginRight: '24px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                fontSize: 80,
                fontWeight: 800,
                backgroundImage: 'linear-gradient(to right, #5F55FA, #c084fc)',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              Polagram
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: 32,
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
            wordWrap: 'break-word',
          }}
        >
          <div>Interactive Sequence Diagrams</div>
          <div>Transformation Engine</div>
        </div>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse's width and height.
      ...size,
    }
  );
}
