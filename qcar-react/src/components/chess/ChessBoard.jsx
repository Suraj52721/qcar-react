// ============================================================
// ChessBoard.jsx — Interactive Chess Board with Drag & Drop + Smooth Piece Animation
// ============================================================
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ChessPiece from './ChessPiece';
import { getColor, isInCheck, findKing } from '../../lib/chessEngine';

// Board themes
const BOARD_THEMES = {
    brown: { name: 'Brown', light: '#F0D9B5', dark: '#B58863', image: null },
    green: { name: 'Green', light: '#FFFFDD', dark: '#86A666', image: null },
    blue: { name: 'Blue', light: '#DEE3E6', dark: '#788B99', image: null },
    purple: { name: 'Purple', light: '#E8DAF0', dark: '#956BA8', image: null },
    tournament: { name: 'Tournament', light: null, dark: null, image: 'tournament' },
    wood: { name: 'Wood', light: null, dark: null, image: 'walnut' },
    marble: { name: 'Marble', light: null, dark: null, image: 'marble' },
    glass: { name: 'Glass', light: null, dark: null, image: 'glass' },
    metal: { name: 'Metal', light: null, dark: null, image: 'metal' },
    neon: { name: 'Neon', light: null, dark: null, image: 'neon' },
    '8_bit': { name: '8-Bit', light: null, dark: null, image: '8_bit' },
    dash: { name: 'Dash', light: null, dark: null, image: 'dash' },
};

// Import board textures dynamically
const boardImages = import.meta.glob('/src/assets/boards/*.png', { eager: true, import: 'default' });
function getBoardImageUrl(name) {
    return boardImages[`/src/assets/boards/${name}.png`] || null;
}

// ── Piece animation layer ─────────────────────────────────────
// We track each piece by a stable ID that persists across moves.
// The ID is assigned once to a piece at its starting square and
// follows it as it moves.  We store a map: squareKey → pieceId
// and update it after every board change.

let nextPieceUid = 1;

const ChessBoard = ({
    board,
    currentTurn,
    selectedSquare,
    validMoves = [],
    lastMove,
    onSquareClick,
    onDragMove,
    flipped = false,
    boardTheme = 'brown',
    pieceTheme = 'classic',
    disabled = false,
}) => {
    const theme = BOARD_THEMES[boardTheme] || BOARD_THEMES.brown;
    const boardRef = useRef(null);

    // ── Drag state ──────────────────────────────────────────────
    const [dragPiece, setDragPiece] = useState(null);
    const [dragPos, setDragPos] = useState(null);
    const [dragOverSquare, setDragOverSquare] = useState(null);
    const dragStartRef = useRef(null);
    const isDraggingRef = useRef(false);

    // ── Piece ID tracking for animations ───────────────────────
    // Map: "row,col" → { id: number, piece: string }
    const pieceMapRef = useRef(new Map());

    // Sync piece IDs whenever board changes
    useEffect(() => {
        const prev = pieceMapRef.current;
        const next = new Map();

        // Step 1 — try to carry over existing IDs
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (!piece) continue;
                const key = `${r},${c}`;
                const old = prev.get(key);
                if (old && old.piece === piece) {
                    // Same piece on same square → keep its ID
                    next.set(key, old);
                }
            }
        }

        // Step 2 — For squares that don't have an ID yet, look for the
        // matching piece that "came from" somewhere (i.e. it was on prev
        // but not assigned above yet).
        const usedIds = new Set([...next.values()].map(v => v.id));
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (!piece || next.has(`${r},${c}`)) continue;

                // Find a previous entry of the same piece type that isn't used
                let foundEntry = null;
                for (const [, v] of prev) {
                    if (v.piece === piece && !usedIds.has(v.id)) {
                        foundEntry = v;
                        break;
                    }
                }
                if (foundEntry) {
                    usedIds.add(foundEntry.id);
                    next.set(`${r},${c}`, foundEntry);
                } else {
                    // Brand new piece (e.g. promoted pawn) → assign fresh ID
                    const entry = { id: nextPieceUid++, piece };
                    usedIds.add(entry.id);
                    next.set(`${r},${c}`, entry);
                }
            }
        }

        pieceMapRef.current = next;
    }, [board]);

    // ── Drag helpers ────────────────────────────────────────────
    const getSquareFromPoint = useCallback((clientX, clientY) => {
        if (!boardRef.current) return null;
        const rect = boardRef.current.getBoundingClientRect();
        const sz = rect.width / 8;
        let col = Math.floor((clientX - rect.left) / sz);
        let row = Math.floor((clientY - rect.top) / sz);
        if (flipped) { row = 7 - row; col = 7 - col; }
        if (row < 0 || row > 7 || col < 0 || col > 7) return null;
        return [row, col];
    }, [flipped]);

    const handlePointerDown = useCallback((e, r, c) => {
        if (disabled) return;
        const piece = board[r][c];
        if (!piece || getColor(piece) !== currentTurn) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragStartRef.current = { piece, fromR: r, fromC: c, startX: clientX, startY: clientY };
        isDraggingRef.current = false;
    }, [board, currentTurn, disabled]);

    const handlePointerMove = useCallback((e) => {
        if (!dragStartRef.current) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = clientX - dragStartRef.current.startX;
        const dy = clientY - dragStartRef.current.startY;

        if (!isDraggingRef.current && Math.sqrt(dx * dx + dy * dy) > 4) {
            isDraggingRef.current = true;
            const { piece, fromR, fromC } = dragStartRef.current;
            setDragPiece({ piece, fromR, fromC });
            onSquareClick(fromR, fromC);
        }

        if (isDraggingRef.current) {
            e.preventDefault();
            setDragPos({ x: clientX, y: clientY });
            setDragOverSquare(getSquareFromPoint(clientX, clientY));
        }
    }, [getSquareFromPoint, onSquareClick]);

    const handlePointerUp = useCallback((e) => {
        // Always capture refs before resetting them
        const wasDragging = isDraggingRef.current;
        const startInfo = dragStartRef.current;

        // Reset refs immediately so re-entrant calls don't double-fire
        dragStartRef.current = null;
        isDraggingRef.current = false;

        // Always clear visual drag state — prevents ghost getting stuck when
        // mouse leaves the board mid-drag (onMouseLeave sets ref to null but
        // doesn't clear React state, then mouseup finds ref=null and bailed)
        setDragPiece(null);
        setDragPos(null);
        setDragOverSquare(null);

        if (!wasDragging || !startInfo) return; // was just a click

        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const sq = getSquareFromPoint(clientX, clientY);
        if (sq && (sq[0] !== startInfo.fromR || sq[1] !== startInfo.fromC)) {
            onDragMove?.(startInfo.fromR, startInfo.fromC, sq[0], sq[1]);
        }
    }, [getSquareFromPoint, onDragMove]);

    // ── Check ───────────────────────────────────────────────────
    let checkSquare = null;
    if (isInCheck(board, currentTurn)) checkSquare = findKing(board, currentTurn);

    // ── Render squares (background + highlights) ─────────────
    const boardBgImage = theme.image ? getBoardImageUrl(theme.image) : null;

    const renderSquare = (r, c) => {
        const isLight = (r + c) % 2 === 0;
        const piece = board[r][c];
        const isSelected = selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
        const isValidMove = validMoves.some(m => m.to[0] === r && m.to[1] === c);
        const isValidCapture = isValidMove && piece != null;
        const isLastMove = lastMove && ((lastMove.from[0] === r && lastMove.from[1] === c) || (lastMove.to[0] === r && lastMove.to[1] === c));
        const isCheckSquare = checkSquare && checkSquare[0] === r && checkSquare[1] === c;
        const isDragOver = dragOverSquare && dragOverSquare[0] === r && dragOverSquare[1] === c;
        const isDraggedFrom = dragPiece && dragPiece.fromR === r && dragPiece.fromC === c;
        const showFile = flipped ? r === 0 : r === 7;
        const showRank = flipped ? c === 7 : c === 0;

        const classNames = [
            'chess-square',
            isSelected && 'selected',
            isValidMove && !isValidCapture && 'valid-move',
            isValidCapture && 'valid-capture',
            isLastMove && 'last-move',
            isCheckSquare && 'check-square',
            isDragOver && isValidMove && 'drag-over',
        ].filter(Boolean).join(' ');

        let bgStyle = {};
        if (!theme.image) bgStyle.backgroundColor = isLight ? theme.light : theme.dark;

        const labelColor = theme.image
            ? (isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)')
            : (isLight ? theme.dark : theme.light);

        return (
            <div
                key={`${r}-${c}`}
                className={classNames}
                style={{
                    ...bgStyle,
                    cursor: disabled ? 'default' : piece && getColor(piece) === currentTurn ? 'grab' : 'pointer',
                    opacity: isDraggedFrom ? 0.3 : 1,
                    position: 'relative',
                }}
                onClick={() => !disabled && !dragPiece && onSquareClick(r, c)}
                onMouseDown={(e) => handlePointerDown(e, r, c)}
                onTouchStart={(e) => handlePointerDown(e, r, c)}
            >
                {showRank && (
                    <span className="coord-label coord-rank" style={{ color: labelColor }}>
                        {8 - r}
                    </span>
                )}
                {showFile && (
                    <span className="coord-label coord-file" style={{ color: labelColor }}>
                        {String.fromCharCode(97 + c)}
                    </span>
                )}
                {/* Render the piece directly inside its square (no overlay needed) */}
                {piece && !isDraggedFrom && (
                    <ChessPiece piece={piece} pieceTheme={pieceTheme} />
                )}
            </div>
        );
    };

    const rows = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const actualR = flipped ? 7 - r : r;
            const actualC = flipped ? 7 - c : c;
            rows.push(renderSquare(actualR, actualC));
        }
    }

    return (
        <div
            className="chess-board-wrapper"
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onMouseLeave={handlePointerUp}
        >
            <div
                ref={boardRef}
                className="chess-board size-md"
                style={boardBgImage ? {
                    backgroundImage: `url(${boardBgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                } : {}}
            >
                {rows}
            </div>

            {/* Floating drag ghost */}
            {dragPiece && dragPos && (
                <div
                    className="chess-drag-ghost"
                    style={{
                        position: 'fixed',
                        left: dragPos.x,
                        top: dragPos.y,
                        transform: 'translate(-50%, -50%)',
                        width: boardRef.current ? boardRef.current.offsetWidth / 8 : 55,
                        height: boardRef.current ? boardRef.current.offsetWidth / 8 : 55,
                        zIndex: 9999,
                        pointerEvents: 'none',
                        filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.5))',
                    }}
                >
                    <ChessPiece piece={dragPiece.piece} pieceTheme={pieceTheme} isDragging />
                </div>
            )}
        </div>
    );
};

export default ChessBoard;
export { BOARD_THEMES };
