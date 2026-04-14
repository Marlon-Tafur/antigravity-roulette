'use client';
import { useState } from 'react';

export default function ParticipantForm({ fields = [], onSubmit, rouletteName = '' }) {
    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const sortedFields = [...fields].sort((a, b) => (a.order || 0) - (b.order || 0));

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(formData);
            setSubmitted(true);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-3xl) var(--space-lg)',
                textAlign: 'center',
                minHeight: '60vh',
            }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)', animation: 'slideUp 0.5s ease-out' }}>
                    🎉
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
                    ¡Datos enviados!
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: 1.6 }}>
                    Tus datos aparecerán en la pantalla principal. Mira la pantalla grande para ver tu turno.
                </p>
                <div style={{
                    marginTop: 'var(--space-xl)',
                    padding: 'var(--space-md) var(--space-lg)',
                    background: 'var(--color-info-bg)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-info)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)'
                }}>
                    <span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                    Esperando turno en la ruleta…
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-lg)',
            width: '100%',
            maxWidth: '400px',
            margin: '0 auto',
        }}>
            {rouletteName && (
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-xs)' }}>🎰</div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {rouletteName}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                        Completa tus datos para participar
                    </p>
                </div>
            )}

            {sortedFields.map(field => (
                <div key={field.key} className="input-group">
                    <label>{field.label} {field.required && <span style={{ color: 'var(--color-danger)' }}>*</span>}</label>
                    {field.type === 'textarea' ? (
                        <textarea
                            className="input"
                            placeholder={field.label}
                            required={field.required}
                            value={formData[field.key] || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                        />
                    ) : (
                        <input
                            className="input"
                            type={field.type || 'text'}
                            placeholder={field.label}
                            required={field.required}
                            value={formData[field.key] || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                        />
                    )}
                </div>
            ))}

            <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting}
                style={{ marginTop: 'var(--space-sm)' }}
            >
                {submitting ? (
                    <>
                        <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                        Enviando…
                    </>
                ) : (
                    '🎰 Participar'
                )}
            </button>
        </form>
    );
}
