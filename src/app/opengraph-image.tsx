import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

export const alt = 'Silch - Generate private, one-time payment links on Solana'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const geistFont = await readFile(
    join(process.cwd(), 'src/assets/Geist-SemiBold.otf'),
  )

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#f8f8f8',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        fontFamily: '"Courier New", monospace',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
            border: '1px solid #000',
          }}
        ></div>
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            margin: '0 0 16px 0',
            color: '#1a1a1a',
            lineHeight: '1.1',
            letterSpacing: '-0.05em',
          }}
        >
          Silch.
        </h1>
        <p
          style={{
            fontSize: '40px',
            color: '#1a1a1a',
            margin: '0 0 32px 0',
            fontWeight: '500',
            letterSpacing: '-0.05em',
          }}
        >
          Private Payments with Proof
        </p>
        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginTop: '24px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: '#666666',
                fontWeight: '500',
                letterSpacing: '0.5px',
              }}
            >
              No wallet tracking
            </span>
          </div>
          <div
            style={{
              width: '2px',
              height: '20px',
              backgroundColor: '#cccccc',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: '#666666',
                fontWeight: '500',
                letterSpacing: '0.5px',
              }}
            >
              No public history
            </span>
          </div>
          <div
            style={{
              width: '2px',
              height: '20px',
              backgroundColor: '#cccccc',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: '#666666',
                fontWeight: '500',
                letterSpacing: '0.5px',
              }}
            >
              ZK verified
            </span>
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'Geist-SemiBold',
          data: geistFont,
          style: 'normal',
          weight: 600,
        },
      ],
    },
  )
}
