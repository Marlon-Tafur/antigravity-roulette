'use client';
import { useState, useEffect, useCallback, use } from 'react';
import ParticipantForm from '@/components/ParticipantForm';
import { subscribe, emit, EVENTS } from '@/lib/realtime';

export default function RegisterPage({ params }) {
    const { id } = use(params);
    const [roulette, setRoulette] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCodeInput, setIsCodeInput] = useState(false);

    // Detect if id is a 6-digit code or a roulette ID
    useEffect(() => {
        if (/^\d{6}$/.test(id)) {
            setIsCodeInput(true);
        }
    }, [id]);

    const loadData = useCallback(async () => {
        try {
            // Try to fetch by ID first, then by code
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

    // Listen for state changes
    useEffect(() => {
        if (!roulette) return;
        const rouletteId = roulette.id;

        const unsubscribe = subscribe(rouletteId, EVENTS.ROULETTE_STATE, (payload) => {
            setSession(prev => ({ ...prev, ...payload }));
        });

        // Also listen for same-tab events
        const handler = (e) => {
            if (e.detail?.type === EVENTS.ROULETTE_STATE) {
                setSession(prev => ({ ...prev, ...e.detail.payload }));
            }
        };
        window.addEventListener(`roulette_${rouletteId}`, handler);

        return () => {
            unsubscribe();
            window.removeEventListener(`roulette_${rouletteId}`, handler);
        };
    }, [roulette]);

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

        // Update session
        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roulette_id: roulette.id,
                status: 'ocupado',
                current_participant_id: participant.id,
            }),
        });

        // Emit events
        emit(roulette.id, EVENTS.NEW_PARTICIPANT, participant);
        emit(roulette.id, EVENTS.ROULETTE_STATE, { status: 'ocupado', current_participant_id: participant.id });
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

    // Roulette is busy
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
