// ============================================================
// MoveHistory.jsx — Scrollable Move Log
// ============================================================
import React, { useRef, useEffect } from 'react';

const MoveHistory = ({ moves }) => {
    const listRef = useRef(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [moves.length]);

    // Group moves into pairs (white, black)
    const pairs = [];
    for (let i = 0; i < moves.length; i += 2) {
        pairs.push({
            number: Math.floor(i / 2) + 1,
            white: moves[i],
            black: moves[i + 1] || null,
        });
    }

    return (
        <div className="move-history" ref={listRef}>
            <div className="move-history-title">Moves</div>
            {pairs.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem 0' }}>
                    No moves yet
                </div>
            ) : (
                <div className="move-history-list">
                    {pairs.map((pair, idx) => (
                        <div key={idx} className="move-row">
                            <span className="move-number">{pair.number}.</span>
                            <span className={`move-notation ${!pair.black && idx === pairs.length - 1 ? 'current' : ''}`}>
                                {pair.white?.notation || ''}
                            </span>
                            {pair.black && (
                                <span className={`move-notation ${idx === pairs.length - 1 ? 'current' : ''}`}>
                                    {pair.black.notation}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MoveHistory;
