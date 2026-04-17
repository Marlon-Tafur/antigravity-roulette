'use client';
import { useRef, useEffect, useState, useCallback } from 'react';

export default function RouletteWheel({ items = [], colors = [], logoUrl = '', onSpinEnd, spinning = false, onSpinStart, externalWinner }) {
    const canvasRef = useRef(null);
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState(null);
    const animFrameRef = useRef(null);
    const startTimeRef = useRef(null);

    // Sync winner with parent (clear overlay when parent resets)
    useEffect(() => {
        if (externalWinner === null || externalWinner === undefined) {
            setWinner(null);
        }
    }, [externalWinner]);

    const activeItems = items.filter(i => i.is_active !== false);
    const segmentCount = activeItems.length || 1;
    const segmentAngle = (2 * Math.PI) / segmentCount;

    const defaultColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#74b9ff', '#fd79a8', '#00b894', '#e17055'];
    const wheelColors = colors.length > 0 ? colors : defaultColors;

    const drawWheel = useCallback((ctx, width, height, currentRotation) => {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        ctx.clearRect(0, 0, width, height);

        // Outer glow
        ctx.save();
        ctx.shadowColor = 'rgba(108, 92, 231, 0.3)';
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(108, 92, 231, 0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // Draw segments
        for (let i = 0; i < segmentCount; i++) {
            const startAngle = currentRotation + i * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const color = wheelColors[i % wheelColors.length];

            // Segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            // Segment border
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner gradient overlay for depth
            const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            grad.addColorStop(0, 'rgba(255,255,255,0.15)');
            grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
            grad.addColorStop(1, 'rgba(0,0,0,0.1)');
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            // Text/emoji label — radial direction (center → outer edge)
            if (activeItems[i]) {
                ctx.save();
                const textAngle = startAngle + segmentAngle / 2;

                // Translate to center and rotate so x-axis points radially outward
                ctx.translate(centerX, centerY);
                ctx.rotate(textAngle);

                // Radial boundaries
                const innerR = radius * 0.23;   // just outside center circle
                const outerR = radius * 0.90;   // near outer edge
                const availRadial = outerR - innerR;

                // Max font size: constrained by segment arc width at mid-radius
                const maxFont = Math.min(segmentAngle * radius * 0.35, 18);

                // Change 3: only render emoji when field has a real value
                const hasEmoji = !!(activeItems[i].emoji && activeItems[i].emoji.trim() !== '');
                const label = activeItems[i].label || '';

                // Reserve space for emoji using a fixed heuristic (avoids measureText quirks with glyphs)
                const emojiFontSize = Math.max(10, maxFont);
                const emojiReserved = hasEmoji ? emojiFontSize * 1.4 : 0;

                // Change 2: auto-shrink label font until it fits remaining radial space
                const availForLabel = availRadial - emojiReserved;
                let fontSize = maxFont;
                const minFont = 7;
                if (label) {
                    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                    while (fontSize > minFont && ctx.measureText(label).width > availForLabel) {
                        fontSize -= 0.5;
                        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                    }
                }

                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                let xCursor = innerR;

                if (hasEmoji) {
                    ctx.font = `${emojiFontSize}px sans-serif`;
                    ctx.fillText(activeItems[i].emoji, xCursor, 0);
                    xCursor += emojiReserved;
                }

                if (label) {
                    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                    ctx.fillStyle = '#fff';
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 3;
                    ctx.fillText(label, xCursor, 0);
                }

                ctx.restore();
            }
        }

        // Center circle with logo
        const centerRadius = radius * 0.2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
        const centerGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, centerRadius);
        centerGrad.addColorStop(0, '#2a2a4a');
        centerGrad.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = centerGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(108, 92, 231, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Center text
        ctx.font = `bold ${centerRadius * 0.5}px Inter, sans-serif`;
        ctx.fillStyle = '#a29bfe';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎰', centerX, centerY);

        // Pointer (arrow at top)
        const pointerSize = 20;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius - 15);
        ctx.lineTo(centerX - pointerSize / 2, centerY - radius - pointerSize - 15);
        ctx.lineTo(centerX + pointerSize / 2, centerY - radius - pointerSize - 15);
        ctx.closePath();
        ctx.fillStyle = '#fd79a8';
        ctx.shadowColor = 'rgba(253, 121, 168, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();

        // Outer ring with dots
        for (let i = 0; i < 36; i++) {
            const dotAngle = (i / 36) * 2 * Math.PI;
            const dotX = centerX + Math.cos(dotAngle) * (radius + 12);
            const dotY = centerY + Math.sin(dotAngle) * (radius + 12);
            ctx.beginPath();
            ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
            ctx.fillStyle = i % 2 === 0 ? '#fdcb6e' : '#fd79a8';
            ctx.fill();
        }
    }, [activeItems, segmentAngle, segmentCount, wheelColors]);

    // Render loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        drawWheel(ctx, rect.width, rect.height, rotation);
    }, [rotation, drawWheel]);

    // Spin logic
    const spin = useCallback(() => {
        if (isSpinning || activeItems.length === 0) return;
        setIsSpinning(true);
        setWinner(null);
        onSpinStart?.();

        const winnerIndex = Math.floor(Math.random() * activeItems.length);
        const totalRotation = rotation + (Math.PI * 2 * (8 + Math.random() * 4));
        // Calculate final rotation so pointer (top) lands on winner
        const targetAngle = -(winnerIndex * segmentAngle + segmentAngle / 2) - Math.PI / 2;
        const finalRotation = totalRotation - (totalRotation % (Math.PI * 2)) + targetAngle;
        const duration = 5000 + Math.random() * 2000;
        startTimeRef.current = Date.now();
        const startRotation = rotation;
        const totalDelta = finalRotation - startRotation;

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);
            // Easing: cubic bezier out
            const eased = 1 - Math.pow(1 - progress, 4);
            const currentRotation = startRotation + totalDelta * eased;
            setRotation(currentRotation);

            if (progress < 1) {
                animFrameRef.current = requestAnimationFrame(animate);
            } else {
                setIsSpinning(false);
                const won = activeItems[winnerIndex];
                setWinner(won);
                onSpinEnd?.(won);
            }
        };

        animFrameRef.current = requestAnimationFrame(animate);
    }, [isSpinning, activeItems, rotation, segmentAngle, onSpinEnd, onSpinStart]);

    useEffect(() => {
        if (spinning && !isSpinning) {
            spin();
        }
    }, [spinning, isSpinning, spin]);

    useEffect(() => {
        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
            }
        };
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', aspectRatio: '1', cursor: isSpinning ? 'not-allowed' : 'pointer' }}
                onClick={() => !isSpinning && spin()}
            />
            {!isSpinning && activeItems.length > 0 && !winner && (
                <div style={{
                    position: 'absolute',
                    bottom: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    animation: 'pulse 2s ease-in-out infinite'
                }}>
                    Haz clic en la ruleta para girar
                </div>
            )}
            {winner && !isSpinning && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(10, 10, 15, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid var(--accent-primary)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--space-lg) var(--space-xl)',
                    textAlign: 'center',
                    animation: 'slideUp 0.5s ease-out',
                    boxShadow: '0 0 40px var(--accent-glow)',
                    zIndex: 10
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>{winner.emoji || '🎉'}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>¡Ganaste!</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginTop: '4px' }}>
                        {winner.label}
                    </div>
                </div>
            )}
            {activeItems.length === 0 && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem'
                }}>
                    Agrega ítems para comenzar
                </div>
            )}
        </div>
    );
}
