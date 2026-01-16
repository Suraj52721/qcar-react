const ConnectionWire = ({ start, end, active }) => {
    if (!active || !start || !end) return null;

    // Calculate control points for a smooth Bezier curve
    const dx = end.x - start.x;
    const controlPoint1 = { x: start.x + dx * 0.5, y: start.y };
    const controlPoint2 = { x: end.x - dx * 0.5, y: end.y };

    const pathD = `M ${start.x} ${start.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${end.x} ${end.y}`;

    return (
        <svg style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 999
        }}>
            <path
                d={pathD}
                stroke="#89a783"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 0.3 }}
                style={{
                    filter: 'drop-shadow(0 0 5px #89a783)'
                }}
            />
            <circle cx={start.x} cy={start.y} r="4" fill="#89a783" />
            <circle cx={end.x} cy={end.y} r="4" fill="#89a783" />
        </svg>
    );
};

export default ConnectionWire;
