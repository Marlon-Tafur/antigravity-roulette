'use client';
import { useState, useEffect, useCallback, use } from 'react';
import ParticipantForm from '@/components/ParticipantForm';

export default function RegisterPage({ params }) {
    const { id } = use(params);
    const [roulette, setRoulette] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [participantName, setParticipantName] = useState('');

    const loadData = useCallback(async () => {
        try {
            const res = await fetch(`/api/roulettes/${id}`);
            if (!res.ok) {
                setError('Ruleta no encontrada');
                return;
            }
            const data = await res.json();
            setRoulette(data);

            // Fetch session
            const resSession = await fetch(`/api/sessions?roulette_id=${data.id}`);
            const sessionData = await resSession.json();
            setSession(sessionData);
        } catch (err) {
            console.error(err);
            setError('Error cargando la ruleta');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadData(); }, [loadData]);

    // Poll session status when waiting (not submitted)
    useEffect(() => {
        if (!roulette || submitted) return;
        const status = session?.status;
        if (status === 'libre') return; // Already libre, no need to poll

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/sessions?roulette_id=${roulette.id}`);
                const data = await res.json();
                setSession(data);
            } catch (e) { /* ignore */ }
        }, 3000);

        return () => clearInterval(interval);
    }, [roulette, session?.status, submitted]);

    const handleSubmit = async (formData) => {
        if (!roulette) return;

        // Create participant
        const res = await fetch('/api/participants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roulette_id: roulette.id,
                data: formData,
            }),
        });
        const participant = await res.json();

        // Update session to ocupado
        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roulette_id: roulette.id,
                status: 'ocupado',
                current_participant_id: participant.id,
            }),
        });

        // Show confirmation
        setParticipantName(formData.name || formData.nombre || '');
        setSubmitted(true);
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 'var(--space-md)',
            }}>
                <div className="loading-spinner" style={{ width: 40, height: 40 }}></div>
                <p style={{ color: 'var(--text-secondary)' }}>Cargando ruleta...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 'var(--space-md)',
                padding: 'var(--space-lg)',
                textAlign: 'center',
            }}>
                <div style={{ fontSize: '3rem' }}>😕</div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{error}</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '300px' }}>
                    Verifica el código o link e intenta de nuevo
                </p>
                <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
                    Volver al inicio
                </button>
            </div>
        );
    }

    // ✅ CONFIRMATION after form submission
    if (submitted) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 'var(--space-lg)',
                padding: 'var(--space-lg)',
                textAlign: 'center',
            }}>
                <div style={{
                    fontSize: '4rem',
                    animation: 'pulse 2s ease-in-out infinite',
                }}>🎉</div>
                <h2 style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    ¡Registro exitoso!
                </h2>
                {participantName && (
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        Bienvenido/a, <strong>{participantName}</strong>
                    </p>
                )}
                <div className="card" style={{
                    padding: 'var(--space-lg)',
                    maxWidth: '340px',
                    textAlign: 'center',
                    borderColor: 'var(--accent-primary)',
                    boxShadow: 'var(--shadow-glow)',
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>📺</div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                        Tus datos fueron enviados.<br />
                        <strong style={{ color: 'var(--text-primary)' }}>Mira la pantalla principal</strong> para ver cuando giran la ruleta.
                    </p>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                }}>
                    <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
                    Esperando resultado...
                </div>
            </div>
        );
    }

    // Roulette is busy (someone else is playing)
    const status = session?.status || 'libre';
    if (status !== 'libre') {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 'var(--space-lg)',
                padding: 'var(--space-lg)',
                textAlign: 'center',
            }}>
                <div style={{
                    fontSize: '4rem',
                    animation: status === 'girando' ? 'spin 1s linear infinite' : 'pulse 2s ease-in-out infinite',
                }}>
                    {status === 'girando' ? '🎰' : '⏳'}
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {status === 'girando' ? '¡La ruleta está girando!' : 'Esperá tu turno'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: 1.6 }}>
                    {status === 'girando'
                        ? 'Un participante está jugando en este momento. Mira la pantalla principal.'
                        : 'La ruleta está en uso. Cuando termine el turno actual, podrás completar tus datos.'}
                </p>
                <div style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    background: 'var(--color-warning-bg)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-warning)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                }}>
                    <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'var(--color-warning)' }}></span>
                    Detectando cuando esté libre…
                </div>
            </div>
        );
    }

    // Free - show form
    const formFields = roulette?.form_config?.fields || [
        { key: 'name', label: 'Nombre', type: 'text', required: true, order: 0 },
        { key: 'email', label: 'Email', type: 'email', required: true, order: 1 },
    ];

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-xl) var(--space-lg)',
        }}>
            <ParticipantForm
                fields={formFields}
                onSubmit={handleSubmit}
                rouletteName={roulette?.name || ''}
            />
        </main>
    );
}
