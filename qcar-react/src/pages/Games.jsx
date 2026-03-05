// ============================================================
// Games.jsx — Games Hub Page
// ============================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Crown, Users, ArrowRight } from 'lucide-react';
import '../styles/Chess.css';

const games = [
    {
        id: 'chess',
        name: 'Chess',
        icon: <Crown size={48} />,
        description: 'Classic strategic board game. Play multiplayer with friends or locally. Features time controls, undo, and customizable boards.',
        players: '2 Players',
        path: '/games/chess',
        available: true,
    },
    {
        id: 'tic-tac-toe',
        name: 'Tic Tac Toe',
        icon: <Gamepad2 size={48} />,
        description: 'The classic 3×3 grid game. Simple yet fun!',
        players: '2 Players',
        path: '/games/tic-tac-toe',
        available: false,
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Games = () => {
    return (
        <div className="games-hub">
            <motion.div
                className="games-hub-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1>🎮 Games Arena</h1>
                <p>Challenge your friends to a battle of wits</p>
            </motion.div>

            <motion.div
                className="games-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {games.map((game) => (
                    <motion.div key={game.id} variants={cardVariants}>
                        <div className="game-card" style={{ opacity: game.available ? 1 : 0.5 }}>
                            <div className="game-card-icon" style={{ color: '#89a783' }}>
                                {game.icon}
                            </div>
                            <h3>{game.name}</h3>
                            <p>{game.description}</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                {game.available ? (
                                    <Link to={game.path} style={{ textDecoration: 'none' }}>
                                        <button className="game-card-btn">
                                            Play Now <ArrowRight size={16} />
                                        </button>
                                    </Link>
                                ) : (
                                    <span className="game-card-btn" style={{ opacity: 0.5, cursor: 'default' }}>
                                        Coming Soon
                                    </span>
                                )}
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Users size={14} /> {game.players}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default Games;
