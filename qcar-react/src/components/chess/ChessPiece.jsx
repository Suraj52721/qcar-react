// ============================================================
// ChessPiece.jsx — PNG Asset-based Chess Piece Renderer
// ============================================================
import React from 'react';

// Available piece themes (corresponding to folders in assets/pieces/)
const PIECE_THEMES = [
    'classic', 'neo', 'alpha', 'wood', 'tournament', 'modern',
    'glass', 'metal', 'ocean', 'nature', 'gothic', 'vintage',
    'club', 'book', 'cases', 'space', 'sky', 'marble',
    'neon', 'graffiti', 'lolz', 'icy_sea', 'newspaper',
    'bubblegum', '8_bit', 'light', 'dash', 'neo_wood',
    'condal', 'maya', 'tigers', 'bases', 'game_room',
    'blindfold', '3d_chesskid', '3d_plastic', '3d_staunton', '3d_wood',
];

// Map piece code (e.g., 'wK') to filename (e.g., 'wk.png')
function getPieceFilename(pieceCode) {
    return pieceCode.toLowerCase() + '.png';
}

// Dynamically import piece images using Vite's import.meta.glob
const pieceImages = import.meta.glob('/src/assets/pieces/**/*.png', { eager: true, import: 'default' });

function getPieceImageUrl(pieceCode, theme = 'classic') {
    const filename = getPieceFilename(pieceCode);
    const path = `/src/assets/pieces/${theme}/${filename}`;
    return pieceImages[path] || null;
}

const ChessPiece = ({ piece, pieceTheme = 'classic', isDragging = false }) => {
    if (!piece) return null;

    const imgUrl = getPieceImageUrl(piece, pieceTheme);
    if (!imgUrl) return null;

    return (
        <div className={`chess-piece${isDragging ? ' dragging' : ''}`}>
            <img
                src={imgUrl}
                alt={piece}
                draggable={false}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.4))',
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
};

export default ChessPiece;
export { PIECE_THEMES, getPieceImageUrl };
