// ============================================================
// BoardCustomizer.jsx — Board/Piece Theme Selector (Asset-based)
// ============================================================
import React, { useState } from 'react';
import { BOARD_THEMES } from './ChessBoard';
import { PIECE_THEMES } from './ChessPiece';
import { ChevronDown, ChevronUp, Palette } from 'lucide-react';

// Curated piece themes to show (favorites first)
const FEATURED_PIECE_THEMES = [
    'classic', 'neo', 'alpha', 'modern', 'wood', 'tournament',
    'glass', 'metal', 'ocean', 'nature', 'gothic', 'vintage',
    'club', 'marble', 'neon', 'space', 'sky', '8_bit',
    'graffiti', 'lolz', 'bubblegum', 'newspaper', 'icy_sea',
];

const BoardCustomizer = ({ boardTheme, pieceTheme, onBoardThemeChange, onPieceThemeChange }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="customizer-panel">
            <button
                className="customizer-toggle"
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    fontFamily: 'inherit', padding: 0,
                }}
            >
                <Palette size={14} /> Customize
                {expanded ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
            </button>

            {expanded && (
                <div style={{ marginTop: '0.75rem' }}>
                    <div className="customizer-title">Board</div>
                    <div className="theme-options" style={{ marginBottom: '0.75rem' }}>
                        {Object.entries(BOARD_THEMES).map(([key, theme]) => (
                            <div
                                key={key}
                                className={`theme-swatch ${boardTheme === key ? 'active' : ''}`}
                                onClick={() => onBoardThemeChange(key)}
                                title={theme.name}
                            >
                                {theme.light && theme.dark ? (
                                    <>
                                        <div className="theme-swatch-half" style={{ backgroundColor: theme.light }} />
                                        <div className="theme-swatch-half" style={{ backgroundColor: theme.dark }} />
                                    </>
                                ) : (
                                    <div className="theme-swatch-half" style={{ backgroundColor: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', fontSize: '0.5rem', color: '#fff' }}>
                                        {theme.name.slice(0, 2)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="customizer-title">Pieces</div>
                    <div className="piece-theme-options" style={{ flexWrap: 'wrap' }}>
                        {FEATURED_PIECE_THEMES.filter(t => PIECE_THEMES.includes(t)).map((key) => (
                            <button
                                key={key}
                                className={`piece-theme-btn ${pieceTheme === key ? 'active' : ''}`}
                                onClick={() => onPieceThemeChange(key)}
                            >
                                {key.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BoardCustomizer;
