// ============================================================
// CapturedPieces.jsx — Display captured pieces for each side
// ============================================================
import React from 'react';
import { getPieceImageUrl } from './ChessPiece';

// Piece values for sorting
const PIECE_VALUES = { Q: 9, R: 5, B: 3, N: 3, P: 1 };

const CapturedPieces = ({ moveHistory, pieceTheme = 'classic' }) => {
    // Extract captured pieces from move history
    const captured = { w: [], b: [] }; // w = white pieces captured (by black), b = black pieces captured (by white)

    for (const move of moveHistory) {
        if (move.capture) {
            const capturedColor = move.capture[0]; // 'w' or 'b'
            const capturedType = move.capture[1]; // P, N, B, R, Q, K
            captured[capturedColor].push({ piece: move.capture, type: capturedType });
        }
    }

    // Sort by value (high to low)
    const sortByValue = (a, b) => (PIECE_VALUES[b.type] || 0) - (PIECE_VALUES[a.type] || 0);
    captured.w.sort(sortByValue);
    captured.b.sort(sortByValue);

    // Calculate material advantage
    const whiteMaterial = captured.b.reduce((sum, p) => sum + (PIECE_VALUES[p.type] || 0), 0);
    const blackMaterial = captured.w.reduce((sum, p) => sum + (PIECE_VALUES[p.type] || 0), 0);
    const advantage = whiteMaterial - blackMaterial;

    const renderPieces = (pieces, label) => (
        <div className="captured-row">
            <div className="captured-pieces-icons">
                {pieces.length === 0 ? (
                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }}>—</span>
                ) : (
                    pieces.map((p, i) => {
                        const imgUrl = getPieceImageUrl(p.piece, pieceTheme);
                        return (
                            <div key={i} className="captured-piece-icon">
                                {imgUrl ? (
                                    <img src={imgUrl} alt={p.piece} draggable={false} />
                                ) : (
                                    <span>{p.type}</span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    return (
        <div className="captured-panel">
            <div className="captured-title">Captured</div>
            <div className="captured-section">
                <span className="captured-label">♙</span>
                {renderPieces(captured.b, 'White captured')}
                {advantage > 0 && <span className="material-advantage">+{advantage}</span>}
            </div>
            <div className="captured-section">
                <span className="captured-label">♟</span>
                {renderPieces(captured.w, 'Black captured')}
                {advantage < 0 && <span className="material-advantage">+{Math.abs(advantage)}</span>}
            </div>
        </div>
    );
};

export default CapturedPieces;
