import { useState, useEffect, useRef } from 'react';

const MiniAILogo = ({ size = 40 }) => {
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const logoRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!logoRef.current) return;
            const rect = logoRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxOffset = size * 0.055;
            const factor = Math.min(dist / 200, 1);
            const angle = Math.atan2(dy, dx);
            setEyeOffset({
                x: Math.cos(angle) * maxOffset * factor,
                y: Math.sin(angle) * maxOffset * factor,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [size]);

    const s = size;
    const cx = s / 2;
    const cy = s / 2;

    // Head dimensions - rounded rectangle
    const headW = s * 0.72;
    const headH = s * 0.56;
    const headX = cx - headW / 2;
    const headY = cy - headH / 2 + s * 0.04;
    const headR = s * 0.1; // corner radius

    // Eyes
    const eyeSpacing = s * 0.15;
    const eyeY = headY + headH * 0.42;
    const eyeW = s * 0.13;
    const eyeH = s * 0.1;
    const pupilR = s * 0.04;

    // Antenna
    const antennaX = cx;
    const antennaTopY = headY - s * 0.1;
    const antennaBotY = headY;

    // Ears
    const earW = s * 0.06;
    const earH = s * 0.14;

    return (
        <div
            ref={logoRef}
            className="flex items-center justify-center"
            style={{ width: s, height: s, minWidth: s }}
        >
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
                <defs>
                    <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="1" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Antenna stick */}
                <line
                    x1={antennaX} y1={antennaBotY}
                    x2={antennaX} y2={antennaTopY + s * 0.03}
                    stroke="hsl(var(--primary))"
                    strokeWidth={s * 0.025}
                    strokeLinecap="round"
                />
                {/* Antenna ball */}
                <circle
                    cx={antennaX} cy={antennaTopY}
                    r={s * 0.04}
                    fill="hsl(var(--primary))"
                    filter="url(#glow)"
                />

                {/* Left ear */}
                <rect
                    x={headX - earW - s * 0.01}
                    y={eyeY - earH / 2}
                    width={earW}
                    height={earH}
                    rx={s * 0.03}
                    fill="hsl(var(--primary))"
                    opacity="0.7"
                />

                {/* Right ear */}
                <rect
                    x={headX + headW + s * 0.01}
                    y={eyeY - earH / 2}
                    width={earW}
                    height={earH}
                    rx={s * 0.03}
                    fill="hsl(var(--primary))"
                    opacity="0.7"
                />

                {/* Robot head */}
                <rect
                    x={headX} y={headY}
                    width={headW} height={headH}
                    rx={headR} ry={headR}
                    fill="url(#headGrad)"
                />

                {/* Head inner border */}
                <rect
                    x={headX + s * 0.02} y={headY + s * 0.02}
                    width={headW - s * 0.04} height={headH - s * 0.04}
                    rx={headR * 0.7} ry={headR * 0.7}
                    fill="none"
                    stroke="white"
                    strokeWidth={s * 0.01}
                    opacity="0.15"
                />

                {/* Left eye socket */}
                <ellipse
                    cx={cx - eyeSpacing} cy={eyeY}
                    rx={eyeW} ry={eyeH}
                    fill="white"
                />
                {/* Left pupil */}
                <circle
                    cx={cx - eyeSpacing + eyeOffset.x * 1.5}
                    cy={eyeY + eyeOffset.y * 1.5}
                    r={pupilR}
                    fill="#1a1a2e"
                />
                {/* Left eye shine */}
                <circle
                    cx={cx - eyeSpacing + eyeOffset.x * 0.5 - pupilR * 0.5}
                    cy={eyeY + eyeOffset.y * 0.5 - pupilR * 0.6}
                    r={pupilR * 0.4}
                    fill="white"
                    opacity="0.9"
                />

                {/* Right eye socket */}
                <ellipse
                    cx={cx + eyeSpacing} cy={eyeY}
                    rx={eyeW} ry={eyeH}
                    fill="white"
                />
                {/* Right pupil */}
                <circle
                    cx={cx + eyeSpacing + eyeOffset.x * 1.5}
                    cy={eyeY + eyeOffset.y * 1.5}
                    r={pupilR}
                    fill="#1a1a2e"
                />
                {/* Right eye shine */}
                <circle
                    cx={cx + eyeSpacing + eyeOffset.x * 0.5 - pupilR * 0.5}
                    cy={eyeY + eyeOffset.y * 0.5 - pupilR * 0.6}
                    r={pupilR * 0.4}
                    fill="white"
                    opacity="0.9"
                />

                {/* Mouth - small grid/speaker lines */}
                <rect
                    x={cx - s * 0.1}
                    y={headY + headH * 0.72}
                    width={s * 0.2}
                    height={s * 0.04}
                    rx={s * 0.02}
                    fill="white"
                    opacity="0.4"
                />
            </svg>
        </div>
    );
};

export default MiniAILogo;
