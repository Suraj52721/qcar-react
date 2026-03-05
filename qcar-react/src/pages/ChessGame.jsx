// ============================================================
// ChessGame.jsx — Main Chess Game Page
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Copy, Check, Wifi, Bot, Monitor } from 'lucide-react';
import { ChessGame as ChessEngine } from '../lib/chessEngine';
import { fromAlgebraic } from '../lib/chessEngine';
import { createGame, joinGame, sendMove, endGame, subscribeToGame } from '../lib/chessMultiplayer';
import ChessBoard from '../components/chess/ChessBoard';
import GameControls, { formatTime } from '../components/chess/GameControls';
import MoveHistory from '../components/chess/MoveHistory';
import PromotionDialog from '../components/chess/PromotionDialog';
import BoardCustomizer from '../components/chess/BoardCustomizer';
import CapturedPieces from '../components/chess/CapturedPieces';
import { useChessSounds } from '../hooks/useChessSounds';
import { useAuth } from '../context/AuthContext';
import '../styles/Chess.css';

const TIME_CONTROLS = [
    { label: '1 min', value: 60 },
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
    { label: '15 min', value: 900 },
    { label: 'No Limit', value: null },
];

const AI_LEVELS = [
    { label: 'Easy', depth: 4, maxThinkingTime: 20 },
    { label: 'Medium', depth: 8, maxThinkingTime: 40 },
    { label: 'Hard', depth: 12, maxThinkingTime: 60 },
    { label: 'Expert', depth: 16, maxThinkingTime: 80 },
];

// Chess API integration for single player
async function getAIMove(fen, depth = 12, maxThinkingTime = 50) {
    try {
        console.log('[Chess AI] Requesting move for FEN:', fen, 'depth:', depth);
        const response = await fetch('https://chess-api.com/v1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fen, depth, maxThinkingTime }),
        });
        const data = await response.json();
        console.log('[Chess AI] Response:', data);
        if (data.from && data.to) {
            const fromSq = fromAlgebraic(data.from);
            const toSq = fromAlgebraic(data.to);
            const promotion = data.promotion || null;
            return { fromR: fromSq[0], fromC: fromSq[1], toR: toSq[0], toC: toSq[1], promotion };
        }
        console.warn('[Chess AI] No valid move in response:', data);
        return null;
    } catch (err) {
        console.error('[Chess AI] API error:', err);
        return null;
    }
}

const ChessGamePage = () => {
    const { gameId: urlGameId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Game state
    const [engine, setEngine] = useState(() => new ChessEngine());
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    const [promotionPending, setPromotionPending] = useState(null);
    const [moveCount, setMoveCount] = useState(0); // Used to trigger AI moves

    // Mode: lobby | waiting | playing | local | ai
    const [mode, setMode] = useState('lobby');
    const [gameData, setGameData] = useState(null);
    const [playerColor, setPlayerColor] = useState('w');
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [isMultiplayer, setIsMultiplayer] = useState(false);
    const [timeControl, setTimeControl] = useState(600);

    // AI state
    const [aiLevel, setAiLevel] = useState(AI_LEVELS[1]); // Medium
    const [aiThinking, setAiThinking] = useState(false);
    const { playSound } = useChessSounds();
    const [aiPlayerColor, setAiPlayerColor] = useState('b'); // AI plays as black by default

    // Timers
    const [whiteTime, setWhiteTime] = useState(600);
    const [blackTime, setBlackTime] = useState(600);
    const timerRef = useRef(null);
    const lastTickRef = useRef(null);

    // Customization
    const [boardTheme, setBoardTheme] = useState(() => localStorage.getItem('chess_board_theme') || 'brown');
    const [pieceTheme, setPieceTheme] = useState(() => localStorage.getItem('chess_piece_theme') || 'classic');

    // Refs
    const unsubscribeRef = useRef(null);
    const engineRef = useRef(engine);
    engineRef.current = engine;

    const handleBoardThemeChange = (theme) => {
        setBoardTheme(theme);
        localStorage.setItem('chess_board_theme', theme);
    };
    const handlePieceThemeChange = (theme) => {
        setPieceTheme(theme);
        localStorage.setItem('chess_piece_theme', theme);
    };

    // Timer logic
    useEffect(() => {
        if (mode !== 'playing' && mode !== 'local' && mode !== 'ai') return;
        if (engine.status !== 'playing') {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        if (timeControl === null) return;

        lastTickRef.current = Date.now();
        timerRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = (now - lastTickRef.current) / 1000;
            lastTickRef.current = now;

            if (engine.currentTurn === 'w') {
                setWhiteTime(prev => {
                    const next = prev - elapsed;
                    if (next <= 0) {
                        clearInterval(timerRef.current);
                        const eng = new ChessEngine(engine.getState());
                        eng.timeout('w');
                        setEngine(eng);
                        if (isMultiplayer && gameData) endGame(gameData.id, 'timeout', 'black', 'White ran out of time');
                        return 0;
                    }
                    return next;
                });
            } else {
                setBlackTime(prev => {
                    const next = prev - elapsed;
                    if (next <= 0) {
                        clearInterval(timerRef.current);
                        const eng = new ChessEngine(engine.getState());
                        eng.timeout('b');
                        setEngine(eng);
                        if (isMultiplayer && gameData) endGame(gameData.id, 'timeout', 'white', 'Black ran out of time');
                        return 0;
                    }
                    return next;
                });
            }
        }, 100);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [mode, engine.status, engine.currentTurn, timeControl]);

    // Cleanup subscription on unmount
    useEffect(() => {
        return () => { if (unsubscribeRef.current) unsubscribeRef.current(); };
    }, []);

    // AI move trigger — uses moveCount as reliable trigger
    useEffect(() => {
        if (mode !== 'ai') return;
        const currentEngine = engineRef.current;
        if (currentEngine.status !== 'playing') return;
        if (currentEngine.currentTurn !== aiPlayerColor) return;

        console.log('[Chess AI] Triggering AI move. Turn:', currentEngine.currentTurn, 'MoveCount:', moveCount);
        setAiThinking(true);
        const fen = currentEngine.toFEN();
        let cancelled = false;

        const timer = setTimeout(async () => {
            const aiMove = await getAIMove(fen, aiLevel.depth, aiLevel.maxThinkingTime);
            if (cancelled) return;
            setAiThinking(false);

            if (aiLevel.label === 'Medium') await new Promise(r => setTimeout(r, 600));
            if (aiLevel.label === 'Hard' || aiLevel.label === 'Expert') await new Promise(r => setTimeout(r, 1000));

            const eng = engineRef.current;
            if (eng.status !== 'playing' || eng.currentTurn !== aiPlayerColor) return;

            // Determine promotion piece
            let promoPiece = null;
            if (aiMove.promotion) {
                const promoMap = { q: 'Q', r: 'R', b: 'B', n: 'N' };
                promoPiece = aiPlayerColor + (promoMap[aiMove.promotion] || 'Q');
            }

            console.log('[Chess AI] Attempting move:', aiMove, 'promo:', promoPiece);

            // Clone engine, apply move on clone
            const clonedEngine = new ChessEngine({
                ...eng.getState(),
                moveHistory: eng.moveHistory.map(m => ({ ...m })),
                positionHistory: [...eng.positionHistory],
            });
            const result = clonedEngine.makeMove(aiMove.fromR, aiMove.fromC, aiMove.toR, aiMove.toC, promoPiece);
            if (result && !result.needsPromotion) {
                console.log('[Chess AI] Move applied:', result.notation);
                setEngine(clonedEngine);
                setMoveCount(c => c + 1);
                setSelectedSquare(null);
                setValidMoves([]);
                playMoveSound(clonedEngine, result);
            } else {
                console.warn('[Chess AI] Move failed or needs promotion:', result);
            }
        }, 400);

        return () => { cancelled = true; clearTimeout(timer); };
    }, [mode, moveCount, aiPlayerColor, aiLevel]);

    // --- Game creation handlers ---
    const handleCreateGame = async () => {
        try {
            setError('');
            const userId = user?.uid || 'anon_' + Math.random().toString(36).slice(2);
            const tc = timeControl || 9999;
            const game = await createGame(userId, tc);
            setGameData(game);
            setPlayerColor('w');
            setIsMultiplayer(true);
            setMode('waiting');
            if (timeControl) { setWhiteTime(timeControl); setBlackTime(timeControl); }

            const unsub = subscribeToGame(game.id, (updatedGame) => {
                setGameData(updatedGame);
                if (updatedGame.status === 'playing') setMode('playing');
                if (updatedGame.move_history?.length > 0) {
                    const cur = engineRef.current;
                    if (updatedGame.move_history.length > cur.moveHistory.length) {
                        const newEng = new ChessEngine();
                        const lastM = updatedGame.move_history[updatedGame.move_history.length - 1];
                        for (let i = 0; i < updatedGame.move_history.length - 1; i++) {
                            const m = updatedGame.move_history[i];
                            newEng.makeMove(m.from[0], m.from[1], m.to[0], m.to[1], m.promotion || null);
                        }
                        const moveResult = newEng.makeMove(lastM.from[0], lastM.from[1], lastM.to[0], lastM.to[1], lastM.promotion || null);
                        setEngine(newEng);
                        setSelectedSquare(null);
                        setValidMoves([]);
                        if (newEng.currentTurn === playerColor && moveResult) {
                            playMoveSound(newEng, moveResult);
                        }
                    }
                }
                if (updatedGame.white_time_remaining != null) setWhiteTime(updatedGame.white_time_remaining);
                if (updatedGame.black_time_remaining != null) setBlackTime(updatedGame.black_time_remaining);
                if (updatedGame.status && updatedGame.status !== 'playing' && updatedGame.status !== 'waiting') {
                    const cur = engineRef.current;
                    if (cur.status === 'playing') {
                        const eng = new ChessEngine(cur.getState());
                        eng.status = updatedGame.status;
                        eng.winner = updatedGame.winner === 'white' ? 'w' : updatedGame.winner === 'black' ? 'b' : null;
                        eng.resultReason = updatedGame.result_reason;
                        setEngine(eng);
                    }
                }
            });
            unsubscribeRef.current = unsub;
        } catch (err) { setError(err.message || 'Failed to create game'); }
    };

    const handleJoinGame = async () => {
        try {
            setError('');
            if (!joinCode.trim()) { setError('Enter a game code'); return; }
            const userId = user?.uid || 'anon_' + Math.random().toString(36).slice(2);
            const game = await joinGame(joinCode.trim(), userId);
            setGameData(game);
            setPlayerColor('b');
            setIsMultiplayer(true);
            setMode('playing');
            if (game.time_control) {
                setWhiteTime(game.white_time_remaining || game.time_control);
                setBlackTime(game.black_time_remaining || game.time_control);
                setTimeControl(game.time_control >= 9999 ? null : game.time_control);
            }

            const unsub = subscribeToGame(game.id, (updatedGame) => {
                setGameData(updatedGame);
                if (updatedGame.move_history?.length > 0) {
                    const cur = engineRef.current;
                    if (updatedGame.move_history.length > cur.moveHistory.length) {
                        const newEng = new ChessEngine();
                        const lastM = updatedGame.move_history[updatedGame.move_history.length - 1];
                        for (let i = 0; i < updatedGame.move_history.length - 1; i++) {
                            const m = updatedGame.move_history[i];
                            newEng.makeMove(m.from[0], m.from[1], m.to[0], m.to[1], m.promotion || null);
                        }
                        const moveResult = newEng.makeMove(lastM.from[0], lastM.from[1], lastM.to[0], lastM.to[1], lastM.promotion || null);
                        setEngine(newEng);
                        setSelectedSquare(null);
                        setValidMoves([]);
                        if (newEng.currentTurn === playerColor && moveResult) {
                            playMoveSound(newEng, moveResult);
                        }
                    }
                }
                if (updatedGame.white_time_remaining != null) setWhiteTime(updatedGame.white_time_remaining);
                if (updatedGame.black_time_remaining != null) setBlackTime(updatedGame.black_time_remaining);
                if (updatedGame.status && updatedGame.status !== 'playing' && updatedGame.status !== 'waiting') {
                    const cur = engineRef.current;
                    if (cur.status === 'playing') {
                        const eng = new ChessEngine(cur.getState());
                        eng.status = updatedGame.status;
                        eng.winner = updatedGame.winner === 'white' ? 'w' : updatedGame.winner === 'black' ? 'b' : null;
                        eng.resultReason = updatedGame.result_reason;
                        setEngine(eng);
                    }
                }
            });
            unsubscribeRef.current = unsub;
        } catch (err) { setError(err.message || 'Failed to join game'); }
    };

    const handleLocalGame = () => {
        setEngine(new ChessEngine());
        setIsMultiplayer(false);
        setMode('local');
        if (timeControl) { setWhiteTime(timeControl); setBlackTime(timeControl); }
        playSound('gameStart');
    };

    const handleAIGame = () => {
        setEngine(new ChessEngine());
        setIsMultiplayer(false);
        setMode('ai');
        if (timeControl) { setWhiteTime(timeControl); setBlackTime(timeControl); }
        playSound('gameStart');
    };

    // Move executor — shared by click and drag
    const executeMove = useCallback((fromR, fromC, toR, toC) => {
        const eng = engineRef.current;
        if (eng.status !== 'playing') return;
        if (mode === 'ai' && eng.currentTurn === aiPlayerColor) return;
        if (isMultiplayer && eng.currentTurn !== playerColor) return;

        // Clone engine before mutating to avoid stale state issues
        const clonedEngine = new ChessEngine({
            ...eng.getState(),
            moveHistory: eng.moveHistory.map(m => ({ ...m })),
            positionHistory: [...eng.positionHistory],
        });

        const result = clonedEngine.makeMove(fromR, fromC, toR, toC);
        if (result && result.needsPromotion) {
            setPromotionPending({ from: [fromR, fromC], to: [toR, toC] });
            setSelectedSquare(null);
            setValidMoves([]);
            return;
        }
        if (result) {
            setEngine(clonedEngine);
            setMoveCount(c => c + 1);
            setSelectedSquare(null);
            setValidMoves([]);
            playMoveSound(clonedEngine, result);

            if (isMultiplayer && gameData) {
                const mh = clonedEngine.moveHistory.map(m => ({ from: m.from, to: m.to, notation: m.notation, promotion: m.promotion || null }));
                sendMove(gameData.id, result, clonedEngine.board, clonedEngine.currentTurn === 'w' ? 'white' : 'black', mh, whiteTime, blackTime);
                if (clonedEngine.status !== 'playing') {
                    endGame(gameData.id, clonedEngine.status, clonedEngine.winner === 'w' ? 'white' : 'black', clonedEngine.resultReason);
                }
            }
        }
    }, [mode, aiPlayerColor, isMultiplayer, playerColor, gameData, whiteTime, blackTime]);

    // Square click handler
    const handleSquareClick = useCallback((r, c) => {
        if (engine.status !== 'playing') return;
        if (mode === 'ai' && engine.currentTurn === aiPlayerColor) return;
        if (isMultiplayer && engine.currentTurn !== playerColor) return;

        const piece = engine.board[r][c];

        if (selectedSquare) {
            // Try move
            const [fr, fc] = selectedSquare;
            if (fr === r && fc === c) { setSelectedSquare(null); setValidMoves([]); return; }

            const isValid = validMoves.some(m => m.to[0] === r && m.to[1] === c);
            if (isValid) {
                executeMove(fr, fc, r, c);
                return;
            }

            // Click on own piece — select it
            if (piece && ((engine.currentTurn === 'w' && piece[0] === 'w') || (engine.currentTurn === 'b' && piece[0] === 'b'))) {
                setSelectedSquare([r, c]);
                setValidMoves(engine.getValidMoves(r, c));
                return;
            }

            setSelectedSquare(null);
            setValidMoves([]);
        } else {
            if (piece && ((engine.currentTurn === 'w' && piece[0] === 'w') || (engine.currentTurn === 'b' && piece[0] === 'b'))) {
                setSelectedSquare([r, c]);
                setValidMoves(engine.getValidMoves(r, c));
            }
        }
    }, [engine, selectedSquare, validMoves, mode, aiPlayerColor, isMultiplayer, playerColor, executeMove]);

    // Drag-and-drop move handler
    const handleDragMove = useCallback((fromR, fromC, toR, toC) => {
        executeMove(fromR, fromC, toR, toC);
    }, [executeMove]);

    // Promotion selection
    const handlePromotion = (promotionPiece) => {
        if (!promotionPending) return;
        const { from, to } = promotionPending;
        const rebuildEngine = new ChessEngine();
        for (const m of engine.moveHistory) rebuildEngine.makeMove(m.from[0], m.from[1], m.to[0], m.to[1], m.promotion || null);
        const result = rebuildEngine.makeMove(from[0], from[1], to[0], to[1], promotionPiece);
        if (result) {
            setEngine(rebuildEngine);
            playMoveSound(rebuildEngine, result);
            if (isMultiplayer && gameData) {
                const mh = rebuildEngine.moveHistory.map(m => ({ from: m.from, to: m.to, notation: m.notation, promotion: m.promotion || null }));
                sendMove(gameData.id, result, rebuildEngine.board, rebuildEngine.currentTurn === 'w' ? 'white' : 'black', mh, whiteTime, blackTime);
                if (rebuildEngine.status !== 'playing') {
                    endGame(gameData.id, rebuildEngine.status, rebuildEngine.winner === 'w' ? 'white' : 'black', rebuildEngine.resultReason);
                }
            }
        }
        setPromotionPending(null);
    };

    const handleUndo = () => {
        if (isMultiplayer) return;
        const eng = engineRef.current;
        const cloned = new ChessEngine({
            ...eng.getState(),
            moveHistory: eng.moveHistory.map(m => ({ ...m })),
            positionHistory: [...eng.positionHistory],
        });
        // In AI mode, undo both player and AI move
        if (mode === 'ai' && cloned.moveHistory.length >= 2) {
            cloned.undo();
            cloned.undo();
        } else {
            cloned.undo();
        }
        setEngine(cloned);
        setMoveCount(c => c + 1);
        setSelectedSquare(null);
        setValidMoves([]);
    };

    const handleResign = () => {
        const eng = engineRef.current;
        const color = isMultiplayer ? playerColor : (mode === 'ai' ? (aiPlayerColor === 'b' ? 'w' : 'b') : eng.currentTurn);
        const cloned = new ChessEngine({
            ...eng.getState(),
            moveHistory: eng.moveHistory.map(m => ({ ...m })),
            positionHistory: [...eng.positionHistory],
        });
        cloned.resign(color);
        setEngine(cloned);
        if (isMultiplayer && gameData) {
            endGame(gameData.id, 'resigned', cloned.winner === 'w' ? 'white' : 'black', cloned.resultReason);
        }
    };

    const handleNewGame = () => {
        if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null; }
        setEngine(new ChessEngine());
        setGameData(null);
        setSelectedSquare(null);
        setValidMoves([]);
        setPromotionPending(null);
        setError('');
        setMode('lobby');
        setIsMultiplayer(false);
        setAiThinking(false);
        if (timeControl) { setWhiteTime(timeControl); setBlackTime(timeControl); }
    };

    const handleCopyCode = () => {
        if (gameData?.game_code) {
            navigator.clipboard.writeText(gameData.game_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const lastMove = engine.getLastMove();
    const flipped = (isMultiplayer && playerColor === 'b') || (mode === 'ai' && aiPlayerColor === 'w');
    const humanColor = mode === 'ai' ? (aiPlayerColor === 'b' ? 'w' : 'b') : null;

    // ---- LOBBY ----
    if (mode === 'lobby') {
        return (
            <div className="chess-page">
                <div className="chess-lobby">
                    <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>♔ Chess</motion.h1>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ width: '100%' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Time Control
                            </div>
                            <div className="time-selector">
                                {TIME_CONTROLS.map(tc => (
                                    <button
                                        key={tc.label}
                                        className={`time-btn ${timeControl === tc.value ? 'active' : ''}`}
                                        onClick={() => { setTimeControl(tc.value); if (tc.value) { setWhiteTime(tc.value); setBlackTime(tc.value); } }}
                                    >
                                        {tc.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div className="lobby-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        {/* Single Player */}
                        <button className="lobby-btn lobby-btn-primary" onClick={handleAIGame}>
                            <Bot size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                            Play vs AI
                        </button>

                        {/* AI Level Selector */}
                        <div style={{ marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                            <div className="time-selector">
                                {AI_LEVELS.map(level => (
                                    <button
                                        key={level.label}
                                        className={`time-btn ${aiLevel.label === level.label ? 'active' : ''}`}
                                        onClick={() => setAiLevel(level)}
                                    >
                                        {level.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                            <span style={{ fontSize: '0.8rem' }}>MULTIPLAYER</span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        </div>

                        <button className="lobby-btn lobby-btn-secondary" onClick={handleCreateGame}>
                            ⚔️ Create Online Game
                        </button>

                        <div className="lobby-input-group">
                            <input
                                className="lobby-input"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="Enter game code"
                                maxLength={6}
                            />
                            <button className="lobby-btn lobby-btn-secondary" onClick={handleJoinGame} style={{ minWidth: '100px' }}>
                                Join
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                            <span style={{ fontSize: '0.8rem' }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        </div>

                        <button className="lobby-btn lobby-btn-local" onClick={handleLocalGame}>
                            <Monitor size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                            Play Locally
                        </button>
                    </motion.div>

                    {error && <motion.div className="chess-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.div>}

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <button
                            onClick={() => navigate('/games')}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontFamily: 'inherit' }}
                        >
                            <ArrowLeft size={14} /> Back to Games
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ---- WAITING ----
    if (mode === 'waiting') {
        return (
            <div className="chess-page">
                <div className="chess-lobby">
                    <motion.div className="waiting-room" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Waiting for opponent…</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>Share this code with your friend:</p>
                        <div className="game-code-display">{gameData?.game_code}</div>
                        <button
                            onClick={handleCopyCode}
                            style={{ background: 'rgba(137,167,131,0.15)', border: '1px solid rgba(137,167,131,0.3)', color: '#89a783', padding: '0.5rem 1.5rem', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontFamily: 'inherit', marginTop: '1rem' }}
                        >
                            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Code</>}
                        </button>
                        <div style={{ marginTop: '2rem' }}>
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>
                                <Wifi size={16} /> Listening for connection...
                            </motion.div>
                        </div>
                        <button onClick={handleNewGame}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', marginTop: '2rem', fontSize: '0.85rem', fontFamily: 'inherit' }}>Cancel</button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ---- GAME VIEW ----
    return (
        <div className="chess-page">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="chess-game-container">
                {/* Board Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                    {/* Top player */}
                    <div className={`player-info ${engine.currentTurn === (flipped ? 'w' : 'b') ? 'active-turn' : ''}`} style={{ width: '100%', maxWidth: '440px' }}>
                        <div className={`player-avatar ${flipped ? 'white' : 'black'}`}>{flipped ? 'W' : 'B'}</div>
                        <span className="player-name">
                            {mode === 'ai' && (flipped ? 'w' : 'b') === aiPlayerColor ? '🤖 AI' : (flipped ? 'White' : 'Black')}
                            {isMultiplayer && playerColor === (flipped ? 'w' : 'b') && ' (You)'}
                        </span>
                        {timeControl && (
                            <div className={`chess-timer ${engine.currentTurn === (flipped ? 'w' : 'b') ? 'active' : 'inactive'} ${(flipped ? whiteTime : blackTime) < 30 && engine.currentTurn === (flipped ? 'w' : 'b') ? 'low-time' : ''}`}>
                                {formatTime(flipped ? whiteTime : blackTime)}
                            </div>
                        )}
                    </div>

                    <ChessBoard
                        board={engine.board}
                        currentTurn={engine.currentTurn}
                        selectedSquare={selectedSquare}
                        validMoves={validMoves}
                        lastMove={lastMove}
                        onSquareClick={handleSquareClick}
                        onDragMove={handleDragMove}
                        flipped={flipped}
                        boardTheme={boardTheme}
                        pieceTheme={pieceTheme}
                        disabled={engine.status !== 'playing' || aiThinking}
                    />

                    {/* Bottom player */}
                    <div className={`player-info ${engine.currentTurn === (flipped ? 'b' : 'w') ? 'active-turn' : ''}`} style={{ width: '100%', maxWidth: '440px' }}>
                        <div className={`player-avatar ${flipped ? 'black' : 'white'}`}>{flipped ? 'B' : 'W'}</div>
                        <span className="player-name">
                            {mode === 'ai' && (flipped ? 'b' : 'w') === aiPlayerColor ? '🤖 AI' : (flipped ? 'Black' : 'White')}
                            {isMultiplayer && playerColor === (flipped ? 'b' : 'w') && ' (You)'}
                        </span>
                        {timeControl && (
                            <div className={`chess-timer ${engine.currentTurn === (flipped ? 'b' : 'w') ? 'active' : 'inactive'} ${(flipped ? blackTime : whiteTime) < 30 && engine.currentTurn === (flipped ? 'b' : 'w') ? 'low-time' : ''}`}>
                                {formatTime(flipped ? blackTime : whiteTime)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Side Panel */}
                <div className="chess-side-panel">
                    {isMultiplayer && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                            <Wifi size={12} style={{ color: '#89a783' }} /> Online • Code: {gameData?.game_code}
                        </div>
                    )}

                    {mode === 'ai' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                            <Bot size={12} style={{ color: '#89a783' }} /> vs AI ({aiLevel.label})
                        </div>
                    )}

                    {/* AI thinking indicator */}
                    {aiThinking && (
                        <div className="ai-thinking">
                            <div className="ai-thinking-dot" />
                            <div className="ai-thinking-dot" />
                            <div className="ai-thinking-dot" />
                            <span>AI is thinking…</span>
                        </div>
                    )}

                    <GameControls
                        whiteTime={whiteTime}
                        blackTime={blackTime}
                        currentTurn={engine.currentTurn}
                        status={engine.status}
                        winner={engine.winner}
                        resultReason={engine.resultReason}
                        playerColor={playerColor}
                        isMultiplayer={isMultiplayer}
                        onUndo={handleUndo}
                        onResign={handleResign}
                        onNewGame={handleNewGame}
                        canUndo={!isMultiplayer && engine.moveHistory.length > 0 && engine.status === 'playing' && !aiThinking}
                    />

                    <CapturedPieces moveHistory={engine.moveHistory} pieceTheme={pieceTheme} />

                    <MoveHistory moves={engine.moveHistory} />
                    <BoardCustomizer
                        boardTheme={boardTheme}
                        pieceTheme={pieceTheme}
                        onBoardThemeChange={handleBoardThemeChange}
                        onPieceThemeChange={handlePieceThemeChange}
                    />
                </div>
            </motion.div>

            <AnimatePresence>
                {promotionPending && (
                    <PromotionDialog
                        color={engine.currentTurn}
                        pieceTheme={pieceTheme}
                        onSelect={handlePromotion}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChessGamePage;
