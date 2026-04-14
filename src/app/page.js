'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.length === 6) {
      router.push(`/register/${code}`);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-md)' }}>🎰</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
          Antigravity Roulette
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: 'var(--space-sm)' }}>
          Ingresa el código de 6 dígitos de tu ruleta
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)', width: '100%', maxWidth: '360px' }}>
        <input
          type="text"
          className="input"
          placeholder="000000"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          style={{
            fontSize: '2rem',
            textAlign: 'center',
            letterSpacing: '0.5em',
            padding: '16px',
            width: '100%',
            fontWeight: 700,
          }}
        />
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={code.length !== 6}
          style={{ width: '100%', opacity: code.length !== 6 ? 0.5 : 1 }}
        >
          Ingresar a la Ruleta
        </button>
      </form>

      <div style={{ marginTop: 'var(--space-3xl)', display: 'flex', gap: 'var(--space-lg)' }}>
        <button className="btn btn-sm" onClick={() => router.push('/admin')}>
          ⚙️ Panel Admin
        </button>
      </div>
    </main>
  );
}
