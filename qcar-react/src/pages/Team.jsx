import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

const CLIQUE_NAMES = ['hassan', 'vikas', 'lakshya', 'raja'];

// Scroll phase thresholds (fraction of 0–1)
const P1 = 0.38;   // end of graph → horizontal
const P2 = 0.68;   // end of horizontal → vertical
// P3: P2 → 1.0 = descriptions

const eio  = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
const c01  = t => Math.max(0, Math.min(1, t));
const mr   = (v, lo, hi) => c01((v - lo) / (hi - lo));
const lerp = (a, b, t)   => a + (b - a) * t;

// ─── TeamModal ────────────────────────────────────────────────────────────────
const TeamModal = ({ profile, onClose }) => {
    if (!profile) return null;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(8px)',
                zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px'
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#0a0a0a',
                    border: '1px solid #89a783',
                    borderRadius: '16px',
                    padding: '40px',
                    maxWidth: '600px', width: '100%',
                    position: 'relative',
                    boxShadow: '0 0 40px rgba(137,167,131,0.3)',
                    maxHeight: '90vh', overflowY: 'auto'
                }}
                className="no-scrollbar"
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'rgba(10,10,10,0.85)',
                        backdropFilter: 'blur(6px)',
                        borderRadius: '50%', width: '40px', height: '40px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '22px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1101
                    }}
                >&times;</button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '120px', height: '120px', borderRadius: '50%',
                        background: 'linear-gradient(135deg,#89a783 0%,#1d4f40 100%)',
                        marginBottom: '1.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#000', fontWeight: 'bold', fontSize: '2.5rem',
                        boxShadow: '0 0 20px rgba(137,167,131,0.4)',
                        overflow: 'hidden'
                    }}>
                        {profile.photoURL
                            ? <img src={profile.photoURL} alt={profile.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            : profile.name?.charAt(0) || '?'}
                    </div>
                    <h2 style={{ fontSize:'2rem', color:'#fff', marginBottom:'0.5rem', fontFamily:'var(--font-main)' }}>{profile.name}</h2>
                    <h3 style={{ fontSize:'1rem', color:'#89a783', textTransform:'uppercase', letterSpacing:'0.1em' }}>{profile.role}</h3>
                </div>

                <div style={{ textAlign:'left' }}>
                    {profile.background && (
                        <div style={{ marginBottom:'1.5rem' }}>
                            <h4 style={{ color:'#89a783', fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.5rem' }}>Background</h4>
                            <p style={{ color:'#ddd', lineHeight:1.6 }}>{profile.background}</p>
                        </div>
                    )}
                    {profile.expertise && (
                        <div style={{ marginBottom:'1.5rem' }}>
                            <h4 style={{ color:'#89a783', fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.5rem' }}>Expertise</h4>
                            <p style={{ color:'#ddd', lineHeight:1.6 }}>{profile.expertise}</p>
                        </div>
                    )}
                    {profile.currentWork && (
                        <div style={{ marginBottom:'1.5rem' }}>
                            <h4 style={{ color:'#89a783', fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.5rem' }}>Current Work</h4>
                            <p style={{ color:'#ddd', lineHeight:1.6 }}>{profile.currentWork}</p>
                        </div>
                    )}
                    {profile.achievements && (
                        <div style={{ marginBottom:'1.5rem' }}>
                            <h4 style={{ color:'#89a783', fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.5rem' }}>Key Achievements</h4>
                            <p style={{ color:'#ddd', lineHeight:1.6 }}>{profile.achievements}</p>
                        </div>
                    )}
                </div>
                <div style={{ marginTop:'2rem', fontSize:'0.9rem', color:'#666', textAlign:'center' }}>* Active Research Member</div>
            </motion.div>
        </motion.div>
    );
};

// ─── Team ─────────────────────────────────────────────────────────────────────
const Team = () => {
    const [profiles, setProfiles]         = useState([]);
    const [activeProfile, setActiveProfile] = useState(null);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [dims, setDims]                 = useState({ w: 0, h: 0 });
    const [prog, setProg]                 = useState(0);

    const sectionRef = useRef(null);
    const obsRef     = useRef(null);
    const rafRef     = useRef(null);
    const targetRef  = useRef(0);
    const progRef    = useRef(0);

    // ResizeObserver on sticky div
    const setStickyRef = useCallback(node => {
        if (obsRef.current) { obsRef.current.disconnect(); obsRef.current = null; }
        if (!node) return;
        const obs = new ResizeObserver(([e]) => {
            setDims({ w: e.contentRect.width, h: e.contentRect.height });
        });
        obs.observe(node);
        obsRef.current = obs;
    }, []);

    // Scroll tracking via RAF lerp — reads window scroll against the outer section
    useEffect(() => {
        const onScroll = () => {
            const el = sectionRef.current;
            if (!el) return;
            const { top } = el.getBoundingClientRect();
            const scrollable = el.offsetHeight - window.innerHeight;
            if (scrollable <= 0) return;
            targetRef.current = c01(-top / scrollable);
        };
        const loop = () => {
            const curr = progRef.current;
            const next = curr + (targetRef.current - curr) * 0.1;
            if (Math.abs(next - curr) > 0.0003) {
                progRef.current = next;
                setProg(next);
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        rafRef.current = requestAnimationFrame(loop);
        return () => {
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // Firestore
    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, 'users')), snap => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .filter(p => p.name && p.role);
            setProfiles(data);
            setLoading(false);
        }, err => { setError(err.message); setLoading(false); });
        return () => unsub();
    }, []);

    // ── Partition members ──────────────────────────────────────────────────────
    const isCliqueP = p => CLIQUE_NAMES.some(n => p.name.toLowerCase().includes(n));
    const cliqueMembers = profiles.filter(isCliqueP).slice(0, 4);
    const treeMembers   = profiles.filter(p => !isCliqueP(p));

    const { w, h } = dims;

    // ── Responsive node radii (scale with viewport) ────────────────────────────
    const NR_G = w > 0 ? Math.min(62, w * 0.050, h * 0.068) : 62;
    const NR_H = NR_G * 0.92;
    const NR_V = NR_G * 0.55;

    // ── Graph positions ────────────────────────────────────────────────────────
    const cx = w / 2;
    const cy = h * 0.44;
    const cR  = Math.min(150, h * 0.19, w * 0.13);
    const cRx = cR * 1.55;   // wider horizontal axis → ellipse
    const cRy = cR * 0.90;   // shorter vertical axis → ellipse

    const circlePos = [-90, 0, 90, 180].map(deg => {
        const rad = deg * Math.PI / 180;
        return { x: cx + cRx * Math.cos(rad), y: cy + cRy * Math.sin(rad) };
    });

    const cliqueBotY = cy + cRy + NR_G;
    // Gap between clique and tree — clamp so tree always fits on screen
    const branchY = Math.min(h * 0.72, cliqueBotY + 110);

    // Tree rows — auto-wrap into multiple rows when members don't fit horizontally
    const treePad       = NR_G * 0.4;                                   // side margin
    const treeAvailW    = w - treePad * 2;
    // Step between node centres: prefer 3.4×NR_G, shrink only if too many nodes
    const treeStep      = Math.min(NR_G * 3.4, treeAvailW / Math.max(treeMembers.length - 1, 1));
    const maxPerRow     = Math.max(1, Math.floor(treeAvailW / treeStep));
    const treeRowCount  = Math.ceil(treeMembers.length / maxPerRow);
    const treeRowHeight = NR_G * 2.6;
    const treeTopY      = Math.min(h - treeRowCount * treeRowHeight - 20,
                                   branchY + (h - branchY) * 0.55);

    // Build tree node positions (may span multiple rows)
    const treeNodePositions = treeMembers.map((_, i) => {
        const row      = Math.floor(i / maxPerRow);
        const col      = i % maxPerRow;
        const rowN     = Math.min(maxPerRow, treeMembers.length - row * maxPerRow);
        const rowTotalW = (rowN - 1) * treeStep;
        return {
            x: rowN === 1 ? cx : cx - rowTotalW / 2 + col * treeStep,
            y: Math.min(h - NR_G - 20, treeTopY + row * treeRowHeight),
        };
    });
    // All nodes with their graph positions, clique first
    const allNodes = [
        ...cliqueMembers.map((p, i) => ({
            ...p,
            gpx: circlePos[i]?.x ?? cx,
            gpy: circlePos[i]?.y ?? cy,
            isClique: true,
        })),
        ...treeMembers.map((p, i) => ({
            ...p,
            gpx: treeNodePositions[i]?.x ?? cx,
            gpy: treeNodePositions[i]?.y ?? h * 0.8,
            isClique: false,
        })),
    ];

    const N = allNodes.length;

    // ── Horizontal positions ───────────────────────────────────────────────────
    const hPad     = Math.max(NR_H + 24, w * 0.04);   // ensure edge nodes don't clip
    const hSpacing = N > 1 ? (w - hPad * 2) / (N - 1) : 0;
    const hY       = h * 0.5;

    // ── Vertical positions ─────────────────────────────────────────────────────
    const titleClear = 95;
    const rawRow     = N > 0 ? (h - titleClear - 30) / N : 80;
    const vNR        = Math.min(NR_V, rawRow * 0.38);
    const vTopPad    = titleClear + vNR + 8;
    const vBotPad    = vNR + 24;
    const vSpacing   = N > 1 ? (h - vTopPad - vBotPad) / (N - 1) : 0;
    const vStartY    = vTopPad;
    const vX         = Math.max(55, w * 0.05) + vNR;

    // ── Phase progress ─────────────────────────────────────────────────────────
    const t1 = eio(mr(prog, 0, P1));
    const t2 = eio(mr(prog, P1, P2));

    // ── SVG graph data ─────────────────────────────────────────────────────────
    const cliqueNodesG = cliqueMembers.map((_, i) => ({ px: circlePos[i]?.x ?? cx, py: circlePos[i]?.y ?? cy }));
    const cliqueEdges  = [];
    for (let i = 0; i < cliqueNodesG.length; i++)
        for (let j = i + 1; j < cliqueNodesG.length; j++)
            cliqueEdges.push([cliqueNodesG[i], cliqueNodesG[j]]);

    const ringR        = cRx + 80;
    const graphOpacity = 1 - t1;   // SVG graph lines fade during phase 1

    const descWidth    = Math.max(260, Math.min(w * 0.60, w - vX - vNR * 2 - 40));
    const ready        = w > 0 && h > 0 && N > 0;

    return (
        <section
            ref={sectionRef}
            style={{ height: '380vh', position: 'relative' }}
        >
            <style>{`
                @keyframes spin-ring {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes pulse-glow {
                    0%,100% { opacity: 0.15; }
                    50%     { opacity: 0.35; }
                }
                .tn-inner {
                    width: 100%; height: 100%;
                    border-radius: 50%;
                    overflow: hidden;
                    display: flex; align-items: center; justify-content: center;
                    transition: transform 0.22s ease, box-shadow 0.22s ease;
                }
                .tn-inner:hover { transform: scale(1.1); }
            `}</style>

            {/* ── Sticky viewport (100vh) ── */}
            <div
                ref={setStickyRef}
                style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}
            >
                {/* Title */}
                <div style={{
                    position: 'absolute', top: '3vh', left: '50%',
                    transform: 'translateX(-50%)', zIndex: 20, textAlign: 'center',
                    pointerEvents: 'none'
                }}>
                    <h4 style={{ fontSize: '2.6rem', fontWeight: 'bold', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1, margin: 50 }}>
                        THE TEAM
                    </h4>
                </div>

                

                {/* States */}
                {loading && (
                    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'#666', fontSize:'1.5rem' }}>
                        Loading researchers...
                    </div>
                )}
                {error && (
                    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'#ef4444', textAlign:'center' }}>
                        Error: {error}
                    </div>
                )}
                {!loading && !error && N === 0 && (
                    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'#666', textAlign:'center' }}>
                        No researchers found.<br/>
                        <span style={{ fontSize:'0.9rem', opacity:0.7 }}>Go to Dashboard › Settings to add your profile.</span>
                    </div>
                )}

                {ready && (
                    <>
                        {/* ── SVG: graph connections (fades away during phase 1) ── */}
                        <svg
                            width={w} height={h}
                            style={{ position:'absolute', top:0, left:0, pointerEvents:'none', zIndex:1, opacity: graphOpacity }}
                        >
                            <defs>
                                <filter id="glowG" x="-60%" y="-60%" width="220%" height="220%">
                                    <feGaussianBlur stdDeviation="5" result="b"/>
                                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                                </filter>
                            </defs>

                            {/* Outer rotating dashed ring */}
                            <circle
                                cx={cx} cy={cy} r={ringR}
                                fill="rgba(137,167,131,0.03)"
                                stroke="rgba(137,167,131,0.12)"
                                strokeWidth="1" strokeDasharray="10 8"
                                style={{ animation:'spin-ring 30s linear infinite', transformOrigin:`${cx}px ${cy}px`, transformBox:'fill-box' }}
                            />
                            <text x={cx} y={cy - ringR - 16} textAnchor="middle"
                                fill="rgba(137,167,131,0.4)" fontSize="10" letterSpacing="0.22em" fontFamily="var(--font-main)">
                                CORE CLIQUE
                            </text>

                            {/* The loop ellipse */}
                            <ellipse cx={cx} cy={cy} rx={cRx} ry={cRy}
                                fill="rgba(137,167,131,0.04)" stroke="none"
                                style={{ animation:'pulse-glow 4s ease-in-out infinite' }}
                            />
                            <ellipse cx={cx} cy={cy} rx={cRx} ry={cRy}
                                fill="none" stroke="rgba(137,167,131,0.55)"
                                strokeWidth="2" filter="url(#glowG)"
                            />

                            {/* K4 cross-edges */}
                            {cliqueEdges.map(([a, b], i) => (
                                <line key={i} x1={a.px} y1={a.py} x2={b.px} y2={b.py}
                                    stroke="rgba(137,167,131,0.25)" strokeWidth="1" />
                            ))}

                            {/* Trunk */}
                            {cliqueNodesG.length > 0 && treeMembers.length > 0 && (
                                <line x1={cx} y1={cy + cRy + NR_G} x2={cx} y2={branchY}
                                    stroke="rgba(137,167,131,0.22)" strokeWidth="1.5" strokeDasharray="7 5" />
                            )}
                            {/* Horizontal branch (first row only) */}
                            {treeNodePositions.length > 1 && (
                                <line
                                    x1={treeNodePositions[0].x} y1={branchY}
                                    x2={treeNodePositions[Math.min(maxPerRow, treeNodePositions.length) - 1].x} y2={branchY}
                                    stroke="rgba(137,167,131,0.22)" strokeWidth="1.5" strokeDasharray="7 5"
                                />
                            )}
                            {/* Drops to each tree node */}
                            {treeNodePositions.map((pos, i) => (
                                <line key={i} x1={pos.x} y1={branchY} x2={pos.x} y2={pos.y - NR_G}
                                    stroke="rgba(137,167,131,0.22)" strokeWidth="1.5" strokeDasharray="7 5" />
                            ))}
                        </svg>

                        {/* ── Horizontal connector line (visible mid-phase 1 → fades in phase 2) ── */}
                        <div style={{
                            position: 'absolute',
                            top: hY, left: hPad,
                            width: Math.max(0, w - hPad * 2), height: 1,
                            background: 'linear-gradient(to right, transparent, rgba(137,167,131,0.35) 15%, rgba(137,167,131,0.35) 85%, transparent)',
                            opacity: t1 * (1 - t2),
                            pointerEvents: 'none', zIndex: 1,
                            transform: 'translateY(-0.5px)'
                        }} />

                        {/* ── Vertical connector line (visible in phase 2+) ── */}
                        <div style={{
                            position: 'absolute',
                            left: vX, top: vStartY,
                            width: 1,
                            height: Math.max(0, vSpacing * (N - 1)),
                            background: 'linear-gradient(to bottom, transparent, rgba(137,167,131,0.3) 10%, rgba(137,167,131,0.3) 90%, transparent)',
                            opacity: t2,
                            pointerEvents: 'none', zIndex: 1,
                            transform: 'translateX(-0.5px)'
                        }} />

                        {/* ── Nodes ── */}
                        {allNodes.map((node, i) => {
                            // Stagger for phase 2 (each node starts slightly later)
                            const p2range  = P2 - P1;
                            const stagger  = N > 1 ? (p2range * 0.18) / (N - 1) : 0;
                            const t2i      = eio(mr(prog, P1 + i * stagger, P2));
                            const t3i      = eio(mr(prog, P2 + i * 0.025 * (1 - P2), 1.0));

                            // Per-node radius
                            const r = lerp(lerp(NR_G, NR_H, t1), vNR, t2i);

                            // Horizontal pos for this node
                            const hx = N === 1 ? cx : hPad + i * hSpacing;

                            // Vertical pos for this node
                            const vy = vStartY + i * vSpacing;

                            // Position: graph → horizontal → vertical
                            const x1 = lerp(node.gpx, hx, t1);
                            const y1 = lerp(node.gpy, hY, t1);
                            const x2 = lerp(x1, vX, t2i);
                            const y2 = lerp(y1, vy, t2i);

                            const isC = node.isClique;

                            return (
                                <div
                                    key={node.id}
                                    style={{
                                        position: 'absolute', left: 0, top: 0,
                                        transform: `translate(${x2 - r}px, ${y2 - r}px)`,
                                        width: r * 2, height: r * 2,
                                        zIndex: 10,
                                    }}
                                >
                                    {/* Clique pulse ring (fades with graph) */}
                                    {isC && (
                                        <div style={{
                                            position: 'absolute',
                                            inset: -12,
                                            borderRadius: '50%',
                                            border: '1.5px solid rgba(137,167,131,0.28)',
                                            opacity: graphOpacity,
                                            animation: 'pulse-glow 3s ease-in-out infinite',
                                            pointerEvents: 'none',
                                        }} />
                                    )}

                                    {/* Circle (photo / initial) */}
                                    <div
                                        className="tn-inner"
                                        onClick={() => setActiveProfile(node)}
                                        style={{
                                            background: isC
                                                ? 'linear-gradient(135deg,#89a783 0%,#1d4f40 100%)'
                                                : 'linear-gradient(135deg,#2a2a2a 0%,#161616 100%)',
                                            border: isC ? '2px solid #89a783' : '1px solid rgba(255,255,255,0.13)',
                                            boxShadow: isC ? '0 0 22px rgba(137,167,131,0.45)' : '0 0 8px rgba(0,0,0,0.4)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {node.photoURL
                                            ? <img src={node.photoURL} alt={node.name}
                                                style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                            : <span style={{
                                                color: isC ? '#000' : '#aaa',
                                                fontWeight: 'bold',
                                                fontSize: Math.max(14, r * 0.5)
                                              }}>
                                                {node.name?.charAt(0) || '?'}
                                              </span>
                                        }
                                    </div>

                                    {/* Name label below circle — visible in graph + horizontal phases */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%', left: '50%',
                                        transform: 'translateX(-50%)',
                                        marginTop: 8,
                                        textAlign: 'center',
                                        opacity: (1 - t2i) * (1 - t3i),
                                        whiteSpace: 'nowrap',
                                        pointerEvents: 'none',
                                    }}>
                                        <div style={{ color:'#fff', fontSize: Math.max(11, r * 0.21), fontWeight: 600, fontFamily:'var(--font-main)' }}>
                                            {node.name}
                                        </div>
                                        <div style={{ color:'#89a783', fontSize: Math.max(10, r * 0.17), opacity: 0.85 }}>
                                            {node.role}
                                        </div>
                                    </div>

                                    {/* Description panel — bounded to its row, no overflow */}
                                    <div style={{
                                        position: 'absolute',
                                        left: r * 2 + 18,
                                        // Align top to row top boundary
                                        top: r - vSpacing / 2 + 6,
                                        // Exact row height minus small gap
                                        height: Math.max(r * 2, vSpacing - 12),
                                        width: descWidth,
                                        overflow: 'hidden',
                                        opacity: t3i,
                                        transform: `translateX(${lerp(28, 0, t3i)}px)`,
                                        pointerEvents: t3i > 0.4 ? 'auto' : 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                    }}>
                                        {/* Short horizontal connector */}
                                        <div style={{
                                            position: 'absolute',
                                            left: -18, top: '50%',
                                            width: 14, height: 1,
                                            background: `rgba(137,167,131,${0.45 * t3i})`,
                                            transform: 'translateY(-50%)',
                                        }} />

                                        <div style={{
                                            color: '#fff',
                                            fontSize: Math.max(15, vNR * 0.48),
                                            fontWeight: 700,
                                            marginBottom: 3,
                                            fontFamily: 'var(--font-main)',
                                            lineHeight: 1.2,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {node.name}
                                        </div>
                                        <div style={{
                                            color: '#89a783',
                                            fontSize: 11,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em',
                                            marginBottom: 6,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            flexShrink: 0,
                                        }}>
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {node.role}
                                            </span>
                                            {node.isClique && (
                                                <span style={{
                                                    flexShrink: 0,
                                                    background: 'rgba(137,167,131,0.15)',
                                                    border: '1px solid rgba(137,167,131,0.3)',
                                                    borderRadius: 4, padding: '1px 5px',
                                                    fontSize: 9, letterSpacing: '0.1em'
                                                }}>
                                                    CORE
                                                </span>
                                            )}
                                        </div>
                                        {node.description && (
                                            <div style={{
                                                color: 'rgba(255,255,255,0.62)',
                                                fontSize: 12, lineHeight: 1.45,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                            }}>
                                                {node.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* ── Row separator lines (visible in vertical phase) ── */}
                        {t2 > 0.05 && allNodes.slice(0, -1).map((_, i) => (
                            <div
                                key={`sep-${i}`}
                                style={{
                                    position: 'absolute',
                                    left: vX - vNR - 16,
                                    top: vStartY + i * vSpacing + vSpacing / 2,
                                    width: w - (vX - vNR - 16) - 24,
                                    height: 1,
                                    background: 'rgba(255,255,255,0.045)',
                                    opacity: t2,
                                    pointerEvents: 'none',
                                    zIndex: 2,
                                }}
                            />
                        ))}
                    </>
                )}
            </div>

            <AnimatePresence>
                {activeProfile && (
                    <TeamModal profile={activeProfile} onClose={() => setActiveProfile(null)} />
                )}
            </AnimatePresence>
        </section>
    );
};

export default Team;
