// ============================================================
// GameControls.jsx — Timer, Undo, Resign, Status
// ============================================================
import React from 'react';
import { RotateCcw, Flag, Handshake, RefreshCw } from 'lucide-react';

function formatTime(seconds) {
    if (seconds == null || seconds < 0) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

const GameControls = ({
    whiteTime,
    blackTime,
    currentTurn,
    status,
    winner,
    resultReason,
    playerColor,
    isMultiplayer,
    onUndo,
    onResign,
    onNewGame,
    canUndo,
}) => {
    const isGameOver = status !== 'playing' && status !== 'waiting';

    // Status banner
    let statusText = null;
    if (status === 'checkmate') {
        statusText = `Checkmate! ${winner === 'w' ? 'White' : 'Black'} wins`;
    } else if (status === 'stalemate') {
        statusText = 'Draw — Stalemate';
    } else if (status === 'draw') {
        statusText = `Draw — ${resultReason}`;
    } else if (status === 'resigned') {
        statusText = `${resultReason}`;
    } else if (status === 'timeout') {
        statusText = `${resultReason}`;
    }

    return (
        <div className="game-controls">
            {/* Status banner */}
            {statusText && (
                <div className={`game-status-banner ended`}>
                    {statusText}
                </div>
            )}

            {/* Check indicator */}
            {!isGameOver && status === 'playing' && (
                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', padding: '0.25rem' }}>
                    {currentTurn === 'w' ? 'White' : 'Black'} to move
                </div>
            )}

            {/* Control buttons */}
            {!isGameOver && status === 'playing' && (
                <div className="control-row">
                    <button
                        className="control-btn"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo last move"
                    >
                        <RotateCcw size={16} /> Undo
                    </button>
                    <button
                        className="control-btn danger"
                        onClick={onResign}
                        title="Resign"
                    >
                        <Flag size={16} /> Resign
                    </button>
                </div>
            )}

            {/* New game button */}
            {isGameOver && (
                <button
                    className="control-btn"
                    onClick={onNewGame}
                    style={{ width: '100%' }}
                >
                    <RefreshCw size={16} /> New Game
                </button>
            )}
        </div>
    );
};

export default GameControls;
export { formatTime };
