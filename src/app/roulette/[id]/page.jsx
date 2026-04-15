'use client';
import { useState, useEffect, useCallback, use } from 'react';
import RouletteWheel from '@/components/RouletteWheel';
import QRCode from '@/components/QRCode';

export default function RoulettePage({ params }) {
    const { id } = use(params);
    const [roulette, setRoulette] = useState(null);
    const [items, setItems] = useState([]);
    const [session, setSession] = useState(null);
    const [participant, setParticipant] = useState(null);
    const [spinning, setSpinning] = useState(false);
    const [winner, setWinner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

    // Load roulette data
    const loadData = useCallback(async () => {
        try {
            const [resRoulette, resItems, resSession] = await Promise.all([
                fetch(`/api/roulettes/${id}`),
                fetch(`/api/items?roulette_id=${id}`),
                fetch(`/api/sessions?roulette_id=${id}`),
            ]);

            if (!resRoulette.ok) {
                // Try by code
                const resByCode = await fetch(`/api/roulettes/${id}`);
                if (!resByCode.ok) { setError('Ruleta no encontrada'); return; }
                const data = await resByCode.json();
                setRoulette(data);
            } else {
                setRoulette(await resRoulette.json());
            }

            const itemsData = await resItems.json();
            setItems(Array.isArray(itemsData) ? itemsData : []);

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

    // Poll for session changes (works across devices)
    useEffect(() => {
        if (!roulette) return;
        const rouletteId = roulette.id;

        const pollSession = async () => {
            try {
                const res = await fetch(`/api/sessions?roulette_id=${rouletteId}`);
                const sessionData = await res.json();

                setSession(prev => {
                    const prevStatus = prev?.status;
                    const newStatus = sessionData?.status;
                    const prevParticipant = prev?.current_participant_id;
                    const newParticipant = sessionData?.current_participant_id;

                    // New participant arrived
                    if (newStatus === 'ocupado' && newParticipant && newParticipant !== prevParticipant) {
                        // Fetch participant data
                        fetch(`/api/participants?roulette_id=${rouletteId}`)
                            .then(r => r.json())
                            .then(participants => {
                                if (Array.isArray(participants)) {
                                    const latest = participants.find(p => p.id === newParticipant) || participants[participants.length - 1];
                                    if (latest) {
                                        setParticipant(latest);
                                        setWinner(null);
                                    }
                                }
                            });
                    }

                    // Session reset to libre
                    if (newStatus === 'libre' && prevStatus !== 'libre') {
                        setParticipant(null);
                        setWinner(null);
                    }

                    return sessionData;
                });
            } catch (e) { /* ignore */ }
        };

        // Initial poll
        pollSession();
        // Poll every 3 seconds
        const interval = setInterval(pollSession, 3000);

        return () => clearInterval(interval);
    }, [roulette]);

    // Handle spin
    const handleSpin = useCallback(() => {
        if (spinning) return;
        setSpinning(true);
        setWinner(null);
        // Update session to 'girando'
        fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roulette_id: id, status: 'girando' }),
        });
    }, [id, spinning]);

    const handleSpinEnd = useCallback(async (wonItem) => {
        setSpinning(false);
        setWinner(wonItem);

        // Save result
        if (participant && wonItem) {
            await fetch('/api/results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roulette_id: id,
                    participant_id: participant.id,
                    item_won: wonItem.label,
                }),
            });
        }

        // Update session back to ocupado
        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roulette_id: id, status: 'ocupado' }),
        });
    }, [id, participant]);

    // Reset for next participant
    const handleReset = useCallback(async () => {
        setParticipant(null);
        setWinner(null);
        setSpinning(false);

        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roulette_id: id, status: 'libre', current_participant_id: null }),
        });
    }, [id]);

    // Play again with same participant
    const handlePlayAgain = () => {
        setWinner(null);
        handleSpin();
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner" style={{ width: 40, height: 40 }}></div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div style={{ fontSize: '3rem' }}>❌</div>
                <h2>{error}</h2>
            </div>
        );
    }

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            padding: 'var(--space-lg)',
            gap: 'var(--space-xl)',
            overflow: 'hidden',
        }}>
            {/* Left side - Roulette */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-lg)',
            }}>
                {/* Event name */}
                <h1 style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textAlign: 'center',
                }}>
                    {roulette?.name || 'Ruleta'}
                </h1>

                {/* Participant info */}
                {participant && (
                    <div className="card" style={{
                        padding: 'var(--space-md) var(--space-lg)',
                        textAlign: 'center',
                        animation: 'slideUp 0.5s ease-out',
                        borderColor: 'var(--accent-primary)',
                        boxShadow: 'var(--shadow-glow)',
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                            Participante Activo
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                            {participant.data?.name || participant.data?.nombre || 'Participante'}
                        </div>
                        {participant.data?.email && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{participant.data.email}</div>
                        )}
                    </div>
                )}

                {/* Roulette Wheel */}
                <div style={{ width: '100%', maxWidth: '450px' }}>
                    <RouletteWheel
                        items={items}
                        colors={roulette?.colors}
                        logoUrl={roulette?.logo_url}
                        onSpinEnd={handleSpinEnd}
                        spinning={spinning}
                        onSpinStart={() => setSpinning(true)}
                        externalWinner={winner}
                    />
                </div>

                {/* Action buttons */}
                {participant && !spinning && (
                    <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {winner && (
                            <button className="btn btn-primary btn-lg" onClick={handlePlayAgain}>
                                🔄 Volver a jugar
                            </button>
                        )}
                        {!winner && !spinning && (
                            <button className="btn btn-primary btn-lg" onClick={handleSpin}>
                                🎰 Girar Ruleta
                            </button>
                        )}
                        <button className="btn btn-lg" onClick={handleReset}>
                            ⏭ Actualizar (Siguiente)
                        </button>
                    </div>
                )}

                {/* Waiting state */}
                {!participant && (
                    <div style={{
                        textAlign: 'center',
                        padding: 'var(--space-lg)',
                        color: 'var(--text-secondary)',
                    }}>
                        <div className="animate-pulse" style={{ fontSize: '1rem' }}>
                            ⏳ Esperando participante...
                        </div>
                        <p style={{ fontSize: '0.85rem', marginTop: 'var(--space-sm)', color: 'var(--text-muted)' }}>
                            Escanea el QR o ingresa el código para participar
                        </p>
                    </div>
                )}
            </div>

            {/* Right side - QR */}
            <div style={{
                width: '220px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: 'var(--space-xl)',
                gap: 'var(--space-md)',
            }}>
                <QRCode
                    url={`${appUrl}/register/${id}`}
                    code={roulette?.code_6d || '------'}
                    size={160}
                />

                {/* Session status */}
                <div style={{ textAlign: 'center' }}>
                    <span className={`badge ${session?.status === 'libre' ? 'badge-success' : session?.status === 'girando' ? 'badge-warning' : 'badge-info'}`}>
                        {session?.status === 'libre' ? '🟢 Libre' : session?.status === 'girando' ? '🔄 Girando' : '🔵 Ocupado'}
                    </span>
                </div>
            </div>
        </main>
    );
}
