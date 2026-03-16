import { useEffect, useRef, useCallback } from 'react';

const TRAIL_LENGTH = 12;
const TRAIL_FADE_SPEED = 0.06;

const CustomCursor = () => {
    const canvasRef = useRef(null);
    const mousePos = useRef({ x: -100, y: -100 });
    const trailPoints = useRef([]);
    const animFrameRef = useRef(null);
    const isVisible = useRef(false);

    const lerp = (start, end, factor) => start + (end - start) * factor;

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        if (!isVisible.current) {
            animFrameRef.current = requestAnimationFrame(animate);
            return;
        }

        const { x: targetX, y: targetY } = mousePos.current;
        const trail = trailPoints.current;

        // Add new point or smoothly update the first point
        if (trail.length === 0) {
            trail.push({ x: targetX, y: targetY, alpha: 1 });
        } else {
            // Smoothly interpolate the lead point toward cursor
            trail[0].x = lerp(trail[0].x, targetX, 0.35);
            trail[0].y = lerp(trail[0].y, targetY, 0.35);
            trail[0].alpha = 1;

            // Each subsequent point follows the one ahead of it
            for (let i = 1; i < trail.length; i++) {
                trail[i].x = lerp(trail[i].x, trail[i - 1].x, 0.3);
                trail[i].y = lerp(trail[i].y, trail[i - 1].y, 0.3);
                trail[i].alpha = 1 - (i / trail.length);
            }

            // Add new trail points if needed
            if (trail.length < TRAIL_LENGTH) {
                const last = trail[trail.length - 1];
                trail.push({ x: last.x, y: last.y, alpha: 0 });
            }
        }

        // Draw the smooth trail curve
        if (trail.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(trail[0].x, trail[0].y);

            for (let i = 1; i < trail.length - 1; i++) {
                const xc = (trail[i].x + trail[i + 1].x) / 2;
                const yc = (trail[i].y + trail[i + 1].y) / 2;
                ctx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);
            }

            // Gradient stroke along the trail
            const gradient = ctx.createLinearGradient(
                trail[0].x, trail[0].y,
                trail[trail.length - 1].x, trail[trail.length - 1].y
            );
            gradient.addColorStop(0, 'rgba(45, 212, 191, 0.8)');   // teal/primary
            gradient.addColorStop(0.5, 'rgba(45, 212, 191, 0.3)');
            gradient.addColorStop(1, 'rgba(45, 212, 191, 0)');

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }

        // Draw glowing dots along trail
        for (let i = 0; i < trail.length; i++) {
            const point = trail[i];
            const progress = i / trail.length;
            const radius = Math.max(1, (1 - progress) * 4);
            const alpha = Math.max(0, (1 - progress) * 0.7);

            ctx.beginPath();
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(45, 212, 191, ${alpha})`;
            ctx.fill();
        }

        // Draw main cursor dot with glow
        const mainX = trail[0]?.x ?? targetX;
        const mainY = trail[0]?.y ?? targetY;

        // Outer glow
        const glowGradient = ctx.createRadialGradient(mainX, mainY, 0, mainX, mainY, 18);
        glowGradient.addColorStop(0, 'rgba(45, 212, 191, 0.25)');
        glowGradient.addColorStop(1, 'rgba(45, 212, 191, 0)');
        ctx.beginPath();
        ctx.arc(mainX, mainY, 18, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Inner ring
        ctx.beginPath();
        ctx.arc(mainX, mainY, 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(mainX, mainY, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(45, 212, 191, 1)';
        ctx.fill();

        animFrameRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const onMouseMove = (e) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
            isVisible.current = true;
        };

        const onMouseLeave = () => {
            isVisible.current = false;
        };

        const onMouseEnter = () => {
            isVisible.current = true;
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseleave', onMouseLeave);
        document.addEventListener('mouseenter', onMouseEnter);

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseleave', onMouseLeave);
            document.removeEventListener('mouseenter', onMouseEnter);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [animate]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 99999,
            }}
        />
    );
};

export default CustomCursor;
