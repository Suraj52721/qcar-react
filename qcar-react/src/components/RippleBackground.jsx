import React, { useEffect, useRef } from 'react';

const RippleBackground = () => {
    const canvasRef = useRef(null);
    const ripplesRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const DOT_SPACING = 5;
        const DOT_RADIUS = 0.8;
        const RIPPLE_SPEED = 6;
        const RIPPLE_DECAY = 0.02;
        const MAX_RIPPLE_RADIUS = 600;
        const WAVE_WIDTH = 50;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        resize();

        // Smoother interaction: Create ripples based on movement distance
        let lastX = 0;
        let lastY = 0;
        let lastTime = 0;

        const handleMouseMove = (e) => {
            const now = Date.now();
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Trigger ripple if moved enough or enough time passed
            if (dist > 20 || (now - lastTime > 50 && dist > 2)) {
                ripplesRef.current.push({
                    x: e.clientX,
                    y: e.clientY,
                    radius: 0,
                    strength: Math.min(dist / 50 + 0.5, 1.5),
                });
                lastX = e.clientX;
                lastY = e.clientY;
                lastTime = now;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);

        const draw = () => {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);

            // Update ripples
            for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
                const ripple = ripplesRef.current[i];
                ripple.radius += RIPPLE_SPEED;
                ripple.strength -= RIPPLE_DECAY;

                if (ripple.strength <= 0 || ripple.radius > MAX_RIPPLE_RADIUS) {
                    ripplesRef.current.splice(i, 1);
                }
            }

            const rows = Math.ceil(height / DOT_SPACING);
            const cols = Math.ceil(width / DOT_SPACING);

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x = c * DOT_SPACING + (DOT_SPACING / 2);
                    const y = r * DOT_SPACING + (DOT_SPACING / 2);

                    let activeStrength = 0;
                    let displacementX = 0;
                    let displacementY = 0;

                    // Superposition of ripples
                    for (const ripple of ripplesRef.current) {
                        const dx = x - ripple.x;
                        const dy = y - ripple.y;
                        const distToCenter = Math.sqrt(dx * dx + dy * dy);

                        // Gaussian Pulse Function
                        const distDiff = distToCenter - ripple.radius;

                        // Only calculate if near the wavefront
                        if (Math.abs(distDiff) < WAVE_WIDTH * 2) {
                            const gaussian = Math.exp(- (distDiff * distDiff) / (2 * (WAVE_WIDTH / 2) * (WAVE_WIDTH / 2)));
                            activeStrength += gaussian * ripple.strength;

                            // Calculate displacement (shockwave effect)
                            if (distToCenter > 0) {
                                const pushFactor = gaussian * ripple.strength * 20; // Max displacement px
                                displacementX += (dx / distToCenter) * pushFactor;
                                displacementY += (dy / distToCenter) * pushFactor;
                            }
                        }
                    }

                    // Clamp strength
                    activeStrength = Math.min(activeStrength, 2.0);

                    // Base state
                    const baseOpacity = 0.15;
                    const finalOpacity = Math.min(baseOpacity + (activeStrength * 0.6), 1);

                    // Zoom effect - smoother
                    const scale = 1.0 + (activeStrength * 0.4);

                    // Apply displacement
                    const finalX = x + displacementX;
                    const finalY = y + displacementY;

                    ctx.beginPath();
                    ctx.arc(finalX, finalY, DOT_RADIUS * scale, 0, Math.PI * 2);

                    // Color mixing
                    if (activeStrength > 0.1) {
                        ctx.fillStyle = `rgba(137, 167, 131, ${finalOpacity})`;
                    } else {
                        ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
                    }

                    ctx.fill();
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                filter: 'blur(0.5px)',
            }}
        />
    );
};

export default RippleBackground;
