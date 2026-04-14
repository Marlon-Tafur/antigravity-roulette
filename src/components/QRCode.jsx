'use client';
import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

export default function QRCode({ url, code, size = 180 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current && url) {
            QRCodeLib.toCanvas(canvasRef.current, url, {
                width: size,
                margin: 2,
                color: {
                    dark: '#f0f0f8',
                    light: '#1a1a2e',
                },
                errorCorrectionLevel: 'M',
            });
        }
    }, [url, size]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-md)',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
        }}>
            <canvas ref={canvasRef} style={{ borderRadius: 'var(--radius-sm)' }} />
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    Escanea o ingresa el código
                </div>
                <div style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    color: 'var(--text-accent)',
                    fontFamily: 'monospace'
                }}>
                    {code}
                </div>
            </div>
        </div>
    );
}
