// ============================================================
// PromotionDialog.jsx — Pawn Promotion Picker (PNG assets)
// ============================================================
import React from 'react';
import { getPieceImageUrl } from './ChessPiece';

const PromotionDialog = ({ color, pieceTheme = 'classic', onSelect }) => {
    const pieces = ['Q', 'R', 'B', 'N'];

    return (
        <div className="promotion-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="promotion-dialog">
                <h3>Promote pawn to:</h3>
                <div className="promotion-options">
                    {pieces.map((type) => {
                        const pieceKey = color + type;
                        const imgUrl = getPieceImageUrl(pieceKey, pieceTheme);
                        return (
                            <button
                                key={type}
                                className="promotion-option"
                                onClick={() => onSelect(pieceKey)}
                                title={type === 'Q' ? 'Queen' : type === 'R' ? 'Rook' : type === 'B' ? 'Bishop' : 'Knight'}
                            >
                                {imgUrl && <img src={imgUrl} alt={pieceKey} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PromotionDialog;
