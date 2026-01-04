import { useEffect, useRef } from 'react';

const CursorGlow = () => {
    const glowRef = useRef(null);

    useEffect(() => {
        const moveCursor = (e) => {
            if (glowRef.current) {
                glowRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            }
        }
        window.addEventListener('mousemove', moveCursor);
        return () => window.removeEventListener('mousemove', moveCursor);
    }, []);

    return (
        <div
            ref={glowRef}
            id="cursor-glow"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '400px', // Guessing size
                height: '400px',
                background: 'radial-gradient(circle, rgba(100,255,218,0.1) 0%, rgba(0,0,0,0) 70%)', // Design token color
                transform: 'translate(-50%, -50%)', // Center on cursor (handled by js translate too?)
                // The js does translate(x, y). If top/left is 0, we need to offset by half width/height to center.
                // Or we can simple set margin-left: -200px, margin-top: -200px
                marginLeft: '-200px',
                marginTop: '-200px',
                pointerEvents: 'none',
                zIndex: 9999,
                mixBlendMode: 'screen'
            }}
        />
    );
};

export default CursorGlow;
