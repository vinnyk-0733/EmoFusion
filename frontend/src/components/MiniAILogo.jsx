import { useState, useEffect, useRef } from 'react';

const MiniAILogo = ({ size = 42, className = '' }) => {
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
            const maxOffset = size * 0.06;
            const factor = Math.min(dist / 220, 1);
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

    const headW = s * 0.74;
    const headH = s * 0.58;
    const headX = cx - headW / 2;
    const headY = cy - headH / 2 + s * 0.04;
    const headR = s * 0.16;

    const eyeSpacing = s * 0.16;
    const eyeY = headY + headH * 0.44;
    const eyeW = s * 0.13;
    const eyeH = s * 0.11;
    const pupilR = s * 0.045;

    const antennaX = cx;
    const antennaTopY = headY - s * 0.12;
    const antennaBotY = headY;

    const earW = s * 0.055;
    const earH = s * 0.16;

    return (
        <div
            ref={logoRef}
            className={`flex items-center justify-center rounded-2xl p-1 bg-[#ffffff] dark:bg-[#1a202c] shadow-[3px_3px_8px_rgba(166,180,200,0.35),-3px_-3px_8px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_8px_rgba(8,10,16,0.7),-2px_-2px_6px_rgba(38,48,68,0.3)] transition-transform hover:scale-105 ${className}`}
            style={{ width: s, height: s, minWidth: s }}
        >
            <svg width={s * 0.85} height={s * 0.85} viewBox={`0 0 ${s} ${s}`}>
                <defs>
                    <linearGradient id="robotBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="50%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="robotEyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2dd4bf" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <filter id="robotGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
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
                    stroke="#0284c7"
                    strokeWidth={s * 0.03}
                    strokeLinecap="round"
                />
                {/* Antenna ball with glow */}
                <circle
                    cx={antennaX} cy={antennaTopY}
                    r={s * 0.045}
                    fill="#38bdf8"
                    filter="url(#robotGlow)"
                />

                {/* Left ear */}
                <rect
                    x={headX - earW - s * 0.01}
                    y={eyeY - earH / 2}
                    width={earW}
                    height={earH}
                    rx={s * 0.03}
                    fill="#0284c7"
                />

                {/* Right ear */}
                <rect
                    x={headX + headW + s * 0.01}
                    y={eyeY - earH / 2}
                    width={earW}
                    height={earH}
                    rx={s * 0.03}
                    fill="#0284c7"
                />

                {/* Robot head */}
                <rect
                    x={headX} y={headY}
                    width={headW} height={headH}
                    rx={headR} ry={headR}
                    fill="url(#robotBlueGrad)"
                />

                {/* Face Visor area */}
                <rect
                    x={headX + s * 0.06}
                    y={headY + headH * 0.22}
                    width={headW - s * 0.12}
                    height={headH * 0.52}
                    rx={headR * 0.7}
                    fill="#0f172a"
                    opacity="0.92"
                />

                {/* Left eye socket */}
                <ellipse
                    cx={cx - eyeSpacing} cy={eyeY}
                    rx={eyeW} ry={eyeH}
                    fill="url(#robotEyeGrad)"
                    filter="url(#robotGlow)"
                />
                {/* Left pupil */}
                <circle
                    cx={cx - eyeSpacing + eyeOffset.x}
                    cy={eyeY + eyeOffset.y}
                    r={pupilR}
                    fill="#0f172a"
                />
                {/* Left eye shine */}
                <circle
                    cx={cx - eyeSpacing + eyeOffset.x - pupilR * 0.4}
                    cy={eyeY + eyeOffset.y - pupilR * 0.5}
                    r={pupilR * 0.45}
                    fill="#ffffff"
                />

                {/* Right eye socket */}
                <ellipse
                    cx={cx + eyeSpacing} cy={eyeY}
                    rx={eyeW} ry={eyeH}
                    fill="url(#robotEyeGrad)"
                    filter="url(#robotGlow)"
                />
                {/* Right pupil */}
                <circle
                    cx={cx + eyeSpacing + eyeOffset.x}
                    cy={eyeY + eyeOffset.y}
                    r={pupilR}
                    fill="#0f172a"
                />
                {/* Right eye shine */}
                <circle
                    cx={cx + eyeSpacing + eyeOffset.x - pupilR * 0.4}
                    cy={eyeY + eyeOffset.y - pupilR * 0.5}
                    r={pupilR * 0.45}
                    fill="#ffffff"
                />

                {/* Friendly Smile Mouth */}
                <path
                    d={`M ${cx - s * 0.08} ${headY + headH * 0.84} Q ${cx} ${headY + headH * 0.94} ${cx + s * 0.08} ${headY + headH * 0.84}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={s * 0.02}
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
};

export default MiniAILogo;
