// ============================================================
// chessMultiplayer.js — Supabase Realtime Chess Multiplayer
// ============================================================
import { supabase } from './supabase';
import { INITIAL_BOARD } from './chessEngine';

// Generate a random 6-char game code
function generateGameCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// Create a new game
export async function createGame(userId, timeControl = 600) {
    const gameCode = generateGameCode();
    const { data, error } = await supabase
        .from('chess_games')
        .insert({
            game_code: gameCode,
            white_player_id: userId,
            board_state: INITIAL_BOARD,
            move_history: [],
            current_turn: 'white',
            status: 'waiting',
            white_time_remaining: timeControl,
            black_time_remaining: timeControl,
            time_control: timeControl,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Join a game by code
export async function joinGame(gameCode, userId) {
    // First find the game
    const { data: game, error: findError } = await supabase
        .from('chess_games')
        .select('*')
        .eq('game_code', gameCode.toUpperCase())
        .single();

    if (findError || !game) throw new Error('Game not found');
    if (game.status !== 'waiting') throw new Error('Game already started or finished');
    if (game.white_player_id === userId) throw new Error('Cannot join your own game');

    // Update game with black player and set status to playing
    const { data, error } = await supabase
        .from('chess_games')
        .update({
            black_player_id: userId,
            status: 'playing',
        })
        .eq('id', game.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get a game by ID
export async function getGame(gameId) {
    const { data, error } = await supabase
        .from('chess_games')
        .select('*')
        .eq('id', gameId)
        .single();

    if (error) throw error;
    return data;
}

// Get a game by code
export async function getGameByCode(gameCode) {
    const { data, error } = await supabase
        .from('chess_games')
        .select('*')
        .eq('game_code', gameCode.toUpperCase())
        .single();

    if (error) throw error;
    return data;
}

// Send a move
export async function sendMove(gameId, move, boardState, currentTurn, moveHistory, whiteTime, blackTime) {
    const { data, error } = await supabase
        .from('chess_games')
        .update({
            board_state: boardState,
            current_turn: currentTurn,
            move_history: moveHistory,
            white_time_remaining: Math.round(whiteTime),
            black_time_remaining: Math.round(blackTime),
        })
        .eq('id', gameId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// End the game
export async function endGame(gameId, status, winner, resultReason) {
    const { data, error } = await supabase
        .from('chess_games')
        .update({
            status,
            winner,
            result_reason: resultReason,
        })
        .eq('id', gameId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Subscribe to game updates via Realtime
export function subscribeToGame(gameId, callback) {
    const channel = supabase
        .channel(`chess_game_${gameId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'chess_games',
                filter: `id=eq.${gameId}`,
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// Get recent open games
export async function getOpenGames() {
    const { data, error } = await supabase
        .from('chess_games')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) throw error;
    return data || [];
}
