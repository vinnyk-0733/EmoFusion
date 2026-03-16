import { useEffect, useRef, useState } from 'react';

const RobotMascot = ({ size = 120 }) => {
    const containerRef = useRef(null);
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxOffset = 4;

            // Normalize and clamp
            const factor = Math.min(distance / 200, 1);
            const angle = Math.atan2(dy, dx);

            setEyeOffset({
                x: Math.cos(angle) * maxOffset * factor,
                y: Math.sin(angle) * maxOffset * factor,
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const scale = size / 120;

    return (
        <div ref={containerRef} style={{ width: size, height: size, display: 'inline-block' }}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Antenna base */}
                <rect x="55" y="8" width="10" height="14" rx="3" fill="#4a5568" />
                {/* Antenna ball */}
                <circle cx="60" cy="8" r="5" fill="hsl(175, 80%, 50%)">
                    <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                </circle>
                {/* Antenna glow */}
                <circle cx="60" cy="8" r="8" fill="hsl(175, 80%, 50%)" opacity="0.2">
                    <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
                </circle>

                {/* Ears */}
                <rect x="12" y="38" width="8" height="24" rx="4" fill="#e53e6b" />
                <rect x="100" y="38" width="8" height="24" rx="4" fill="#e53e6b" />
                <circle cx="16" cy="38" r="3" fill="#ff6b9d" />
                <circle cx="104" cy="38" r="3" fill="#ff6b9d" />

                {/* Head - main shape */}
                <rect x="22" y="22" width="76" height="60" rx="18" fill="url(#headGradient)" />
                <rect x="22" y="22" width="76" height="60" rx="18" stroke="hsl(175, 80%, 50%)" strokeWidth="0.5" opacity="0.3" />

                {/* Visor / eye area */}
                <rect x="32" y="36" width="56" height="24" rx="10" fill="#1a202c" />
                <rect x="32" y="36" width="56" height="24" rx="10" stroke="hsl(175, 80%, 50%)" strokeWidth="0.5" opacity="0.4" />

                {/* Left eye - outer glow */}
                <circle cx={48 + eyeOffset.x * 0.3} cy={48 + eyeOffset.y * 0.3} r="9" fill="hsl(175, 80%, 50%)" opacity="0.15" />
                {/* Left eye */}
                <circle cx={48 + eyeOffset.x * 0.5} cy={48 + eyeOffset.y * 0.5} r="7" fill="hsl(175, 80%, 50%)" opacity="0.9" />
                {/* Left pupil */}
                <circle cx={48 + eyeOffset.x} cy={48 + eyeOffset.y} r="3.5" fill="#ffffff" />
                {/* Left eye shine */}
                <circle cx={46.5 + eyeOffset.x * 0.8} cy={46 + eyeOffset.y * 0.8} r="1.5" fill="#ffffff" opacity="0.8" />

                {/* Right eye - outer glow */}
                <circle cx={72 + eyeOffset.x * 0.3} cy={48 + eyeOffset.y * 0.3} r="9" fill="hsl(175, 80%, 50%)" opacity="0.15" />
                {/* Right eye */}
                <circle cx={72 + eyeOffset.x * 0.5} cy={48 + eyeOffset.y * 0.5} r="7" fill="hsl(175, 80%, 50%)" opacity="0.9" />
                {/* Right pupil */}
                <circle cx={72 + eyeOffset.x} cy={48 + eyeOffset.y} r="3.5" fill="#ffffff" />
                {/* Right eye shine */}
                <circle cx={70.5 + eyeOffset.x * 0.8} cy={46 + eyeOffset.y * 0.8} r="1.5" fill="#ffffff" opacity="0.8" />

                {/* Mouth area */}
                <rect x="44" y="66" width="32" height="6" rx="3" fill="#4a5568" opacity="0.6" />
                {/* Mouth lines */}
                <rect x="50" y="67" width="1.5" height="4" rx="0.75" fill="#2d3748" />
                <rect x="55" y="67" width="1.5" height="4" rx="0.75" fill="#2d3748" />
                <rect x="60" y="67" width="1.5" height="4" rx="0.75" fill="#2d3748" />
                <rect x="65" y="67" width="1.5" height="4" rx="0.75" fill="#2d3748" />
                <rect x="70" y="67" width="1.5" height="4" rx="0.75" fill="#2d3748" />

                {/* Top accent stripe */}
                <rect x="42" y="26" width="36" height="5" rx="2.5" fill="#f6ad55" />

                {/* Body */}
                <rect x="32" y="84" width="56" height="30" rx="10" fill="url(#bodyGradient)" />
                <rect x="32" y="84" width="56" height="30" rx="10" stroke="hsl(175, 80%, 50%)" strokeWidth="0.5" opacity="0.2" />

                {/* Chest light */}
                <circle cx="60" cy="98" r="5" fill="hsl(175, 80%, 50%)" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;0.3;0.7" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="60" cy="98" r="3" fill="hsl(175, 80%, 60%)" />

                {/* Gradients */}
                <defs>
                    <linearGradient id="headGradient" x1="22" y1="22" x2="98" y2="82" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#b8c4d4" />
                        <stop offset="50%" stopColor="#9ba8bc" />
                        <stop offset="100%" stopColor="#8694a8" />
                    </linearGradient>
                    <linearGradient id="bodyGradient" x1="32" y1="84" x2="88" y2="114" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#a0aec0" />
                        <stop offset="100%" stopColor="#8694a8" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};

export default RobotMascot;
