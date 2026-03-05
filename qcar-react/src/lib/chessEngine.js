// ============================================================
// chessEngine.js — Full Chess Engine
// ============================================================
// Piece codes: wP wN wB wR wQ wK | bP bN bB bR bQ bK | null=empty

const INITIAL_BOARD = [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
];

function cloneBoard(board) {
    return board.map(row => [...row]);
}

function getColor(piece) {
    return piece ? piece[0] : null;
}

function getType(piece) {
    return piece ? piece[1] : null;
}

function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// Convert to algebraic notation
function toAlgebraic(r, c) {
    return String.fromCharCode(97 + c) + (8 - r);
}

function fromAlgebraic(sq) {
    return [8 - parseInt(sq[1]), sq.charCodeAt(0) - 97];
}

// Find king position
function findKing(board, color) {
    const king = color + 'K';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === king) return [r, c];
        }
    }
    return null;
}

// Check if a square is attacked by the opponent
function isSquareAttacked(board, r, c, byColor) {
    // Pawn attacks
    const pawnDir = byColor === 'w' ? 1 : -1;
    if (inBounds(r + pawnDir, c - 1) && board[r + pawnDir][c - 1] === byColor + 'P') return true;
    if (inBounds(r + pawnDir, c + 1) && board[r + pawnDir][c + 1] === byColor + 'P') return true;

    // Knight attacks
    const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    for (const [dr, dc] of knightMoves) {
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc) && board[nr][nc] === byColor + 'N') return true;
    }

    // King attacks
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (inBounds(nr, nc) && board[nr][nc] === byColor + 'K') return true;
        }
    }

    // Sliding: rook/queen (straights)
    const straights = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dr, dc] of straights) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc)) {
            const p = board[nr][nc];
            if (p) {
                if (getColor(p) === byColor && (getType(p) === 'R' || getType(p) === 'Q')) return true;
                break;
            }
            nr += dr; nc += dc;
        }
    }

    // Sliding: bishop/queen (diagonals)
    const diagonals = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (const [dr, dc] of diagonals) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc)) {
            const p = board[nr][nc];
            if (p) {
                if (getColor(p) === byColor && (getType(p) === 'B' || getType(p) === 'Q')) return true;
                break;
            }
            nr += dr; nc += dc;
        }
    }

    return false;
}

function isInCheck(board, color) {
    const kingPos = findKing(board, color);
    if (!kingPos) return false;
    const opponent = color === 'w' ? 'b' : 'w';
    return isSquareAttacked(board, kingPos[0], kingPos[1], opponent);
}

// Get raw pseudo-legal moves for a piece (without check filtering)
function getPseudoMoves(board, r, c, castling, enPassant) {
    const piece = board[r][c];
    if (!piece) return [];
    const color = getColor(piece);
    const type = getType(piece);
    const opponent = color === 'w' ? 'b' : 'w';
    const moves = [];

    const addMove = (tr, tc, flags = {}) => {
        if (!inBounds(tr, tc)) return;
        const target = board[tr][tc];
        if (target && getColor(target) === color) return;
        moves.push({ from: [r, c], to: [tr, tc], capture: target, ...flags });
    };

    if (type === 'P') {
        const dir = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;
        const promoRow = color === 'w' ? 0 : 7;

        // Forward
        if (inBounds(r + dir, c) && !board[r + dir][c]) {
            if (r + dir === promoRow) {
                ['Q', 'R', 'B', 'N'].forEach(p => moves.push({ from: [r, c], to: [r + dir, c], promotion: color + p }));
            } else {
                moves.push({ from: [r, c], to: [r + dir, c] });
                // Double push
                if (r === startRow && !board[r + 2 * dir][c]) {
                    moves.push({ from: [r, c], to: [r + 2 * dir, c], doublePush: true });
                }
            }
        }
        // Captures
        for (const dc of [-1, 1]) {
            const tr = r + dir, tc = c + dc;
            if (!inBounds(tr, tc)) continue;
            if (board[tr][tc] && getColor(board[tr][tc]) === opponent) {
                if (tr === promoRow) {
                    ['Q', 'R', 'B', 'N'].forEach(p => moves.push({ from: [r, c], to: [tr, tc], capture: board[tr][tc], promotion: color + p }));
                } else {
                    moves.push({ from: [r, c], to: [tr, tc], capture: board[tr][tc] });
                }
            }
            // En passant
            if (enPassant && enPassant[0] === tr && enPassant[1] === tc) {
                moves.push({ from: [r, c], to: [tr, tc], enPassant: true, capture: board[r][tc] });
            }
        }
    } else if (type === 'N') {
        const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        for (const [dr, dc] of knightMoves) addMove(r + dr, c + dc);
    } else if (type === 'K') {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                addMove(r + dr, c + dc);
            }
        }
        // Castling
        if (castling) {
            const row = color === 'w' ? 7 : 0;
            if (r === row && c === 4) {
                // Kingside
                if (castling[color + 'K'] && board[row][5] === null && board[row][6] === null && board[row][7] === color + 'R') {
                    if (!isSquareAttacked(board, row, 4, opponent) &&
                        !isSquareAttacked(board, row, 5, opponent) &&
                        !isSquareAttacked(board, row, 6, opponent)) {
                        moves.push({ from: [r, c], to: [row, 6], castling: 'K' });
                    }
                }
                // Queenside
                if (castling[color + 'Q'] && board[row][3] === null && board[row][2] === null && board[row][1] === null && board[row][0] === color + 'R') {
                    if (!isSquareAttacked(board, row, 4, opponent) &&
                        !isSquareAttacked(board, row, 3, opponent) &&
                        !isSquareAttacked(board, row, 2, opponent)) {
                        moves.push({ from: [r, c], to: [row, 2], castling: 'Q' });
                    }
                }
            }
        }
    } else {
        // Sliding pieces: B, R, Q
        const dirs = [];
        if (type === 'R' || type === 'Q') dirs.push([0, 1], [0, -1], [1, 0], [-1, 0]);
        if (type === 'B' || type === 'Q') dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
        for (const [dr, dc] of dirs) {
            let nr = r + dr, nc = c + dc;
            while (inBounds(nr, nc)) {
                const target = board[nr][nc];
                if (target) {
                    if (getColor(target) === opponent) {
                        moves.push({ from: [r, c], to: [nr, nc], capture: target });
                    }
                    break;
                }
                moves.push({ from: [r, c], to: [nr, nc] });
                nr += dr; nc += dc;
            }
        }
    }

    return moves;
}

// Apply a move to a board (returns new board)
function applyMove(board, move) {
    const newBoard = cloneBoard(board);
    const piece = newBoard[move.from[0]][move.from[1]];

    newBoard[move.from[0]][move.from[1]] = null;

    if (move.promotion) {
        newBoard[move.to[0]][move.to[1]] = move.promotion;
    } else {
        newBoard[move.to[0]][move.to[1]] = piece;
    }

    // En passant capture
    if (move.enPassant) {
        newBoard[move.from[0]][move.to[1]] = null;
    }

    // Castling — move the rook
    if (move.castling) {
        const row = move.from[0];
        if (move.castling === 'K') {
            newBoard[row][5] = newBoard[row][7];
            newBoard[row][7] = null;
        } else {
            newBoard[row][3] = newBoard[row][0];
            newBoard[row][0] = null;
        }
    }

    return newBoard;
}

// Get all legal moves for a color
function getLegalMoves(board, color, castling, enPassant) {
    const allMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] && getColor(board[r][c]) === color) {
                const pseudoMoves = getPseudoMoves(board, r, c, castling, enPassant);
                for (const move of pseudoMoves) {
                    const newBoard = applyMove(board, move);
                    if (!isInCheck(newBoard, color)) {
                        allMoves.push(move);
                    }
                }
            }
        }
    }
    return allMoves;
}

// Get legal moves for a specific square
function getValidMovesForSquare(board, r, c, castling, enPassant) {
    const piece = board[r][c];
    if (!piece) return [];
    const color = getColor(piece);
    const pseudoMoves = getPseudoMoves(board, r, c, castling, enPassant);
    return pseudoMoves.filter(move => {
        const newBoard = applyMove(board, move);
        return !isInCheck(newBoard, color);
    });
}

// Convert move to algebraic notation
function moveToNotation(board, move, allLegalMoves) {
    const piece = board[move.from[0]][move.from[1]];
    const type = getType(piece);
    const destSq = toAlgebraic(move.to[0], move.to[1]);

    if (move.castling === 'K') return 'O-O';
    if (move.castling === 'Q') return 'O-O-O';

    let notation = '';

    if (type === 'P') {
        if (move.capture || move.enPassant) {
            notation = String.fromCharCode(97 + move.from[1]) + 'x';
        }
        notation += destSq;
        if (move.promotion) {
            notation += '=' + getType(move.promotion);
        }
    } else {
        notation = type;
        // Disambiguate
        const similar = allLegalMoves.filter(m =>
            m !== move &&
            board[m.from[0]][m.from[1]] === piece &&
            m.to[0] === move.to[0] && m.to[1] === move.to[1]
        );
        if (similar.length > 0) {
            const sameFile = similar.some(m => m.from[1] === move.from[1]);
            const sameRank = similar.some(m => m.from[0] === move.from[0]);
            if (!sameFile) {
                notation += String.fromCharCode(97 + move.from[1]);
            } else if (!sameRank) {
                notation += (8 - move.from[0]);
            } else {
                notation += String.fromCharCode(97 + move.from[1]) + (8 - move.from[0]);
            }
        }
        if (move.capture) notation += 'x';
        notation += destSq;
    }

    // Check/checkmate suffix
    const color = getColor(piece);
    const opponent = color === 'w' ? 'b' : 'w';
    const newBoard = applyMove(board, move);
    if (isInCheck(newBoard, opponent)) {
        // Is it checkmate?
        const oppMoves = getLegalMoves(newBoard, opponent,
            { wK: true, wQ: true, bK: true, bQ: true }, null);
        notation += oppMoves.length === 0 ? '#' : '+';
    }

    return notation;
}

// Check for insufficient material
function isInsufficientMaterial(board) {
    const pieces = { w: [], b: [] };
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p) {
                pieces[getColor(p)].push({ type: getType(p), r, c });
            }
        }
    }
    const wp = pieces.w, bp = pieces.b;
    // K vs K
    if (wp.length === 1 && bp.length === 1) return true;
    // K+B vs K or K+N vs K
    if (wp.length === 1 && bp.length === 2) {
        if (bp.some(p => p.type === 'B' || p.type === 'N')) return true;
    }
    if (bp.length === 1 && wp.length === 2) {
        if (wp.some(p => p.type === 'B' || p.type === 'N')) return true;
    }
    // K+B vs K+B (same color bishops)
    if (wp.length === 2 && bp.length === 2) {
        const wb = wp.find(p => p.type === 'B');
        const bb = bp.find(p => p.type === 'B');
        if (wb && bb && (wb.r + wb.c) % 2 === (bb.r + bb.c) % 2) return true;
    }
    return false;
}

// ============================================================
// ChessGame class — full game state manager
// ============================================================
export class ChessGame {
    constructor(state = null) {
        if (state) {
            this.board = state.board.map(row => [...row]);
            this.currentTurn = state.currentTurn;
            this.castling = { ...state.castling };
            this.enPassant = state.enPassant ? [...state.enPassant] : null;
            this.moveHistory = state.moveHistory.map(m => ({ ...m }));
            this.status = state.status;
            this.winner = state.winner;
            this.resultReason = state.resultReason;
            this.halfMoveClock = state.halfMoveClock || 0;
            this.positionHistory = state.positionHistory ? [...state.positionHistory] : [];
        } else {
            this.reset();
        }
    }

    reset() {
        this.board = INITIAL_BOARD.map(row => [...row]);
        this.currentTurn = 'w';
        this.castling = { wK: true, wQ: true, bK: true, bQ: true };
        this.enPassant = null;
        this.moveHistory = [];
        this.status = 'playing'; // 'playing' | 'checkmate' | 'stalemate' | 'draw' | 'resigned' | 'timeout'
        this.winner = null;
        this.resultReason = null;
        this.halfMoveClock = 0;
        this.positionHistory = [this.boardToString()];
    }

    boardToString() {
        return this.board.map(row => row.map(p => p || '--').join('')).join('/');
    }

    getValidMoves(r, c) {
        const piece = this.board[r][c];
        if (!piece || getColor(piece) !== this.currentTurn) return [];
        if (this.status !== 'playing') return [];
        return getValidMovesForSquare(this.board, r, c, this.castling, this.enPassant);
    }

    getAllLegalMoves() {
        return getLegalMoves(this.board, this.currentTurn, this.castling, this.enPassant);
    }

    makeMove(fromR, fromC, toR, toC, promotionPiece = null) {
        if (this.status !== 'playing') return null;

        const piece = this.board[fromR][fromC];
        if (!piece || getColor(piece) !== this.currentTurn) return null;

        let validMoves = this.getValidMoves(fromR, fromC);
        let move = validMoves.find(m => m.to[0] === toR && m.to[1] === toC);

        if (!move) return null;

        // Handle promotion
        if (move.promotion !== undefined) {
            // If there's no promotion piece and the move needs one, check if we need a choice
            const promoMoves = validMoves.filter(m => m.to[0] === toR && m.to[1] === toC);
            if (promoMoves.length > 1) {
                if (promotionPiece) {
                    move = promoMoves.find(m => m.promotion === promotionPiece);
                    if (!move) return null;
                } else {
                    // Return 'needs_promotion' signal
                    return { needsPromotion: true, from: [fromR, fromC], to: [toR, toC] };
                }
            }
        }

        // Get all legal moves for notation disambiguation
        const allLegalMoves = this.getAllLegalMoves();
        const notation = moveToNotation(this.board, move, allLegalMoves);

        // Save state for undo
        const undoState = {
            board: cloneBoard(this.board),
            castling: { ...this.castling },
            enPassant: this.enPassant ? [...this.enPassant] : null,
            halfMoveClock: this.halfMoveClock,
        };

        // Apply the move
        this.board = applyMove(this.board, move);

        // Update castling rights
        const color = getColor(piece);
        if (getType(piece) === 'K') {
            this.castling[color + 'K'] = false;
            this.castling[color + 'Q'] = false;
        }
        if (getType(piece) === 'R') {
            if (fromC === 0) this.castling[color + 'Q'] = false;
            if (fromC === 7) this.castling[color + 'K'] = false;
        }
        // If a rook is captured
        if (move.capture && getType(move.capture) === 'R') {
            const capColor = getColor(move.capture);
            if (toC === 0) this.castling[capColor + 'Q'] = false;
            if (toC === 7) this.castling[capColor + 'K'] = false;
        }

        // Update en passant target
        this.enPassant = null;
        if (move.doublePush) {
            const epRow = color === 'w' ? fromR - 1 : fromR + 1;
            this.enPassant = [epRow, fromC];
        }

        // Update half-move clock
        if (getType(piece) === 'P' || move.capture) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }

        // Record move
        const moveRecord = {
            ...move,
            notation,
            piece,
            undoState,
            moveNumber: Math.floor(this.moveHistory.length / 2) + 1,
        };
        this.moveHistory.push(moveRecord);

        // Switch turn
        this.currentTurn = this.currentTurn === 'w' ? 'b' : 'w';

        // Record position for repetition
        this.positionHistory.push(this.boardToString());

        // Check game end conditions
        this.checkGameEnd();

        return moveRecord;
    }

    checkGameEnd() {
        const legalMoves = getLegalMoves(this.board, this.currentTurn, this.castling, this.enPassant);

        if (legalMoves.length === 0) {
            if (isInCheck(this.board, this.currentTurn)) {
                this.status = 'checkmate';
                this.winner = this.currentTurn === 'w' ? 'b' : 'w';
                this.resultReason = 'Checkmate';
            } else {
                this.status = 'stalemate';
                this.resultReason = 'Stalemate';
            }
            return;
        }

        if (isInsufficientMaterial(this.board)) {
            this.status = 'draw';
            this.resultReason = 'Insufficient material';
            return;
        }

        if (this.halfMoveClock >= 100) {
            this.status = 'draw';
            this.resultReason = '50-move rule';
            return;
        }

        // Threefold repetition
        const currentPos = this.boardToString();
        const count = this.positionHistory.filter(p => p === currentPos).length;
        if (count >= 3) {
            this.status = 'draw';
            this.resultReason = 'Threefold repetition';
            return;
        }
    }

    undo() {
        if (this.moveHistory.length === 0) return false;
        const last = this.moveHistory.pop();
        this.board = last.undoState.board;
        this.castling = last.undoState.castling;
        this.enPassant = last.undoState.enPassant;
        this.halfMoveClock = last.undoState.halfMoveClock;
        this.currentTurn = this.currentTurn === 'w' ? 'b' : 'w';
        this.positionHistory.pop();
        this.status = 'playing';
        this.winner = null;
        this.resultReason = null;
        return true;
    }

    resign(color) {
        this.status = 'resigned';
        this.winner = color === 'w' ? 'b' : 'w';
        this.resultReason = (color === 'w' ? 'White' : 'Black') + ' resigned';
    }

    timeout(color) {
        this.status = 'timeout';
        this.winner = color === 'w' ? 'b' : 'w';
        this.resultReason = (color === 'w' ? 'White' : 'Black') + ' ran out of time';
    }

    isCheck() {
        return isInCheck(this.board, this.currentTurn);
    }

    getLastMove() {
        return this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null;
    }

    toFEN() {
        const pieceMap = { wK: 'K', wQ: 'Q', wR: 'R', wB: 'B', wN: 'N', wP: 'P', bK: 'k', bQ: 'q', bR: 'r', bB: 'b', bN: 'n', bP: 'p' };
        let fen = '';
        for (let r = 0; r < 8; r++) {
            let empty = 0;
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece) {
                    if (empty > 0) { fen += empty; empty = 0; }
                    fen += pieceMap[piece] || '?';
                } else {
                    empty++;
                }
            }
            if (empty > 0) fen += empty;
            if (r < 7) fen += '/';
        }
        fen += ' ' + this.currentTurn;
        let castleStr = '';
        if (this.castling.wK) castleStr += 'K';
        if (this.castling.wQ) castleStr += 'Q';
        if (this.castling.bK) castleStr += 'k';
        if (this.castling.bQ) castleStr += 'q';
        fen += ' ' + (castleStr || '-');
        // Only include en passant if an enemy pawn can actually capture
        let epValid = false;
        if (this.enPassant) {
            const [epR, epC] = this.enPassant;
            const enemy = this.currentTurn; // It's now the opponent's turn
            const pawnDir = enemy === 'w' ? 1 : -1; // direction the capturing pawn came from
            // Check if an enemy pawn is adjacent to capture
            if (inBounds(epR + pawnDir, epC - 1) && this.board[epR + pawnDir][epC - 1] === enemy + 'P') epValid = true;
            if (inBounds(epR + pawnDir, epC + 1) && this.board[epR + pawnDir][epC + 1] === enemy + 'P') epValid = true;
        }
        if (epValid) {
            fen += ' ' + toAlgebraic(this.enPassant[0], this.enPassant[1]);
        } else {
            fen += ' -';
        }
        const fullMoves = Math.floor(this.moveHistory.length / 2) + 1;
        fen += ' ' + this.halfMoveClock + ' ' + fullMoves;
        return fen;
    }

    getState() {
        return {
            board: this.board.map(row => [...row]),
            currentTurn: this.currentTurn,
            castling: { ...this.castling },
            enPassant: this.enPassant,
            moveHistory: this.moveHistory.map(m => ({
                from: m.from,
                to: m.to,
                notation: m.notation,
                piece: m.piece,
                capture: m.capture,
                promotion: m.promotion,
                castling: m.castling,
                enPassant: m.enPassant,
            })),
            status: this.status,
            winner: this.winner,
            resultReason: this.resultReason,
            halfMoveClock: this.halfMoveClock,
        };
    }
}

export { INITIAL_BOARD, cloneBoard, getColor, getType, toAlgebraic, fromAlgebraic, findKing, isInCheck };
