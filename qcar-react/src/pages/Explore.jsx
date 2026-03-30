import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createOffice, TEAM_MEMBERS, COFFEE_POS, DIALOGUE_OPTIONS, pickActivity, getActivityLabel } from './ExploreScene';
import '../styles/Explore.css';

// ── Gemini API with retry ───────────────────────────────────────────────────────
const GEMINI_API_KEY = 'AIzaSyCnW3EIJoTrB6ueUqi2DHNkYMl3RFBMFiI';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function geminiChat(prompt, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (err) {
            if (err.message?.includes('429') && i < retries - 1) {
                await new Promise(r => setTimeout(r, Math.pow(2, i + 1) * 1000 + Math.random() * 1000));
                continue;
            }
            throw err;
        }
    }
}

// Fallback responses
const FALLBACKS = {
    hassan: ["Let me think about that with precision... The answer lies in the structure of the problem itself.", "As Wittgenstein said, the limits of my language mean the limits of my world. But let me try to expand both."],
    raja: ["HAHA okay so listen — I asked my rubber duck about this and even HE was confused!", "Bro you're asking ME? I once tried to explain quantum mechanics using a pizza menu. Let me think..."],
    vikas: ["Good question! Here, have some chai while I think... okay so basically...", "I spent three hours on something similar last week. Let me break it down simply for you."],
    lakshya: ["*sigh* Nothing matters in the grand scheme... but I suppose I can answer.", "The universe is indifferent to our curiosity. Yet here I am, answering. What a time to exist."],
    nishith: ["Okay okay WAIT — this is like that scene from Interstellar but make it academia 😂", "Bro I literally made a meme about this yesterday. Hold on —"],
    suraj: ["Oh I actually wrote a script for this! Well, sort of. Let me explain the logic...", "That's a coding problem in disguise. Give me 5 minutes and a terminal."],
    abhinav: ["Oh wow! *puts down yoghurt spoon* I actually just read about this!", "Wait let me check my notes... okay so from what I understand..."],
};

const GREETINGS = {
    hassan: "Ah. Come in. I was working through a proof — but precision requires breaks. What's on your mind?",
    raja: "YOOOO what's good!! Sit down — wait that's Vikas's chair, just stand. What's up? 😂",
    vikas: "Hey! Perfect timing, I just made chai in my head. Virtual cup? What can I help with?",
    lakshya: "*sigh* A visitor. The void has sent you my way. What do you want? Not that anything matters.",
    nishith: "LADIES AND GENTLEMEN, WE HAVE A VISITOR! 🎉 Welcome to the show!",
    suraj: "Hey! One sec... *typing furiously* ...okay done, just pushed a commit. What's going on?",
    abhinav: "Hi!! *waves with yoghurt spoon* Sorry about the mess, my plants needed watering. What's up? 🌱",
};

// ── Floating Text ───────────────────────────────────────────────────────────────
function createFloatingText(text, worldPos, camera) {
    const screenPos = worldPos.clone();
    screenPos.project(camera);
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
    const div = document.createElement('div');
    div.className = 'floating-text';
    div.textContent = text;
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
}

// ── Main Component ──────────────────────────────────────────────────────────────
const Explore = () => {
    const canvasRef = useRef(null);
    const minimapRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const sceneRef = useRef(null);
    const keysRef = useRef({});
    const mouseXRef = useRef(0);
    const playerRef = useRef({ position: new THREE.Vector3(0, 1.6, 5), velocity: new THREE.Vector3(), speed: 0.1, isDancing: false });
    const charactersRef = useRef([]);
    const animItemsRef = useRef([]);
    const frameRef = useRef(null);
    const currentCharRef = useRef(null);
    const lastTimeRef = useRef(0);

    const [loading, setLoading] = useState(true);
    const [nearNpc, setNearNpc] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatNpc, setChatNpc] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatHistories] = useState(() => new Map());
    const [npcActivity, setNpcActivity] = useState('');
    const [dialogueOpts, setDialogueOpts] = useState([]);

    const chatRef = useRef(null);
    const inputRef = useRef(null);

    // ── Initialize ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // Append renderer canvas into the container div (don't replace — breaks React)
        canvas.innerHTML = '';
        canvas.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f5);
        scene.fog = new THREE.Fog(0xf5f5f5, 10, 50);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1.6, 5);
        cameraRef.current = camera;

        const { characters, animatedItems } = createOffice(scene);
        charactersRef.current = characters;
        animItemsRef.current = animatedItems;

        setTimeout(() => setLoading(false), 1800);

        // Pointer lock on click
        renderer.domElement.addEventListener('click', () => {
            if (!currentCharRef.current) {
                renderer.domElement.requestPointerLock();
            }
        });

        // Mouse look (horizontal only, like reference)
        const onMouseMove = (e) => {
            if (document.pointerLockElement === renderer.domElement && !currentCharRef.current) {
                mouseXRef.current += e.movementX * 0.002;
            }
        };
        document.addEventListener('mousemove', onMouseMove);

        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);

        // ── Animation loop (matching reference exactly) ──
        const animate = (currentTime) => {
            frameRef.current = requestAnimationFrame(animate);
            const deltaTime = (currentTime - lastTimeRef.current) / 1000;
            lastTimeRef.current = currentTime;
            if (deltaTime > 0.1) return; // skip big deltas

            const player = playerRef.current;
            const keys = keysRef.current;

            // ── Player movement (like reference: velocity-based in camera direction) ──
            player.velocity.set(0, 0, 0);
            if (!player.isDancing && !currentCharRef.current) {
                if (keys['w']) player.velocity.z = player.speed;
                if (keys['s']) player.velocity.z = -player.speed;
                if (keys['a']) player.velocity.x = -player.speed;
                if (keys['d']) player.velocity.x = player.speed;
            }

            // Arrow key camera (like reference)
            const lookSpeed = 0.05;
            if (!currentCharRef.current) {
                if (keys['ArrowLeft']) mouseXRef.current += lookSpeed;
                if (keys['ArrowRight']) mouseXRef.current -= lookSpeed;
            }

            // Camera rotation (horizontal only, like reference)
            if (!player.isDancing && !currentCharRef.current) {
                camera.rotation.y = mouseXRef.current;
                camera.rotation.x = 0;
            }

            // Apply movement in camera direction (like reference)
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(camera.quaternion);
            forward.y = 0;
            forward.normalize();
            const right = new THREE.Vector3(1, 0, 0);
            right.applyQuaternion(camera.quaternion);
            right.y = 0;
            right.normalize();

            player.position.add(forward.multiplyScalar(player.velocity.z));
            player.position.add(right.multiplyScalar(player.velocity.x));

            // Keep in bounds
            player.position.x = Math.max(-18, Math.min(18, player.position.x));
            player.position.z = Math.max(-18, Math.min(18, player.position.z));

            // Dance animation (like reference)
            if (player.isDancing && !currentCharRef.current) {
                camera.position.y = player.position.y + Math.sin(Date.now() * 0.01) * 0.2;
                camera.rotation.z = Math.sin(Date.now() * 0.01) * 0.1;
                camera.rotation.y = mouseXRef.current;
                camera.rotation.x = 0;
            } else {
                camera.position.copy(player.position);
                camera.rotation.z = 0;
                if (!currentCharRef.current) {
                    camera.rotation.y = mouseXRef.current;
                    camera.rotation.x = 0;
                }
            }

            // ── NPC movement AI (like reference exactly) ──
            characters.forEach(character => {
                const ud = character.userData;

                // Random tripping (like reference)
                if (Math.random() < ud.tripChance && !ud.isDancing) {
                    character.rotation.x = Math.PI / 4;
                    character.position.y = 0.3;
                    createFloatingText("Oof!", character.position, camera);
                    setTimeout(() => { character.rotation.x = 0; character.position.y = 0; }, 1000);
                    ud.tripChance = 0;
                    setTimeout(() => { ud.tripChance = 0.001; }, 5000);
                }

                // If in conversation, face player
                if (character === currentCharRef.current) {
                    const lookTarget = new THREE.Vector3(player.position.x, character.position.y, player.position.z);
                    character.lookAt(lookTarget);
                    character.rotation.x = 0;
                    character.rotation.z = 0;
                    return;
                }

                // Dancing (like reference)
                if (ud.isDancing) {
                    character.rotation.y += 0.1;
                    character.position.y = Math.abs(Math.sin(Date.now() * 0.01)) * 0.3;
                    ud.leftArm.rotation.z = Math.sin(Date.now() * 0.01) * 0.5 + Math.PI / 8;
                    ud.rightArm.rotation.z = -Math.sin(Date.now() * 0.01) * 0.5 - Math.PI / 8;
                    return;
                }

                // Random dance party (like reference)
                if (Math.random() < 0.001) {
                    ud.isDancing = true;
                    createFloatingText("🎵", character.position, camera);
                    setTimeout(() => { ud.isDancing = false; }, 3000);
                }

                // Movement timer (like reference)
                ud.moveTimer -= deltaTime;
                if (ud.moveTimer <= 0) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 3 + Math.random() * 5;
                    ud.targetPosition = new THREE.Vector3(
                        ud.initialPosition.x + Math.cos(angle) * dist,
                        0,
                        ud.initialPosition.z + Math.sin(angle) * dist
                    );
                    ud.targetPosition.x = Math.max(-18, Math.min(18, ud.targetPosition.x));
                    ud.targetPosition.z = Math.max(-18, Math.min(18, ud.targetPosition.z));
                    ud.moveTimer = 5 + Math.random() * 5;
                }

                // Move toward target (like reference)
                const direction = new THREE.Vector3().subVectors(ud.targetPosition, character.position);
                direction.y = 0;
                const dist = direction.length();
                if (dist > 0.1) {
                    direction.normalize();
                    character.position.add(direction.multiplyScalar(0.02));
                    character.lookAt(ud.targetPosition);
                    character.rotation.x = 0;
                    character.rotation.z = 0;
                    // Walking bob (like reference)
                    character.position.y = Math.abs(Math.sin(Date.now() * 0.005)) * 0.05;
                }
            });

            // Spin Suraj's fan
            animatedItems.forEach(item => {
                if (item.userData?.isFanBlade) item.rotation.z += deltaTime * 12;
            });

            // Check nearby NPCs
            let nearest = null;
            let minDist = Infinity;
            characters.forEach(char => {
                const d = player.position.distanceTo(char.position);
                if (d < 3 && d < minDist) { minDist = d; nearest = char; }
            });

            // Update state (throttled)
            if (frameRef.current % 5 === 0) {
                setNearNpc(nearest);
                setNpcActivity(nearest ? getActivityLabel(nearest.userData.activity || 'working') : '');
            }

            renderer.render(scene, camera);
        };
        animate(0);

        return () => {
            cancelAnimationFrame(frameRef.current);
            window.removeEventListener('resize', onResize);
            document.removeEventListener('mousemove', onMouseMove);
            renderer.dispose();
        };
    }, []);

    // ── Keyboard (like reference: check activeElement) ───────────────────────────
    useEffect(() => {
        const onKeyDown = (e) => {
            // Don't capture when typing in input
            if (document.activeElement === inputRef.current) {
                if (e.key === 'Escape') closeChat();
                return;
            }

            keysRef.current[e.key.toLowerCase()] = true;
            keysRef.current[e.key] = true;

            if (e.key.toLowerCase() === 'e' && nearNpc && !chatOpen) {
                e.preventDefault();
                openChat(nearNpc);
            }

            if (e.key === ' ' && !chatOpen) {
                e.preventDefault();
                playerRef.current.isDancing = true;
                if (cameraRef.current) createFloatingText("💃🕺", playerRef.current.position, cameraRef.current);
            }

            if (e.key === 'Escape') {
                if (chatOpen) closeChat();
                if (document.pointerLockElement === rendererRef.current?.domElement) {
                    document.exitPointerLock();
                }
            }

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
        };

        const onKeyUp = (e) => {
            if (document.activeElement === inputRef.current) return;
            keysRef.current[e.key.toLowerCase()] = false;
            keysRef.current[e.key] = false;
            if (e.key === ' ' && !chatOpen) playerRef.current.isDancing = false;
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
    }, [nearNpc, chatOpen]);

    // ── Minimap ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (loading) return;
        const canvas = minimapRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = 170; canvas.height = 170;
        let mmFrame;
        const draw = () => {
            mmFrame = requestAnimationFrame(draw);
            const player = playerRef.current;
            ctx.clearRect(0, 0, 170, 170);
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, 170, 170);
            const scale = 170 / 44, ox = 22, oz = 22;
            ctx.strokeStyle = 'rgba(100,100,100,0.5)'; ctx.lineWidth = 1;
            ctx.strokeRect((ox - 20) * scale, (oz - 20) * scale, 40 * scale, 40 * scale);
            // Coffee
            ctx.fillStyle = 'rgba(255,170,85,0.5)';
            ctx.beginPath(); ctx.arc((ox + COFFEE_POS.x) * scale, (oz + COFFEE_POS.z) * scale, 3, 0, Math.PI * 2); ctx.fill();
            // NPCs
            charactersRef.current.forEach(char => {
                const ud = char.userData;
                ctx.fillStyle = `#${ud.color.toString(16).padStart(6, '0')}`;
                const nx = (ox + char.position.x) * scale, nz = (oz + char.position.z) * scale;
                ctx.beginPath(); ctx.arc(nx, nz, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '7px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText(ud.name, nx, nz + 10);
            });
            // Player
            const px = (ox + player.position.x) * scale, pz = (oz + player.position.z) * scale;
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, pz, 4, 0, Math.PI * 2); ctx.fill();
            const dX = px + Math.sin(-mouseXRef.current + Math.PI) * 10, dZ = pz + Math.cos(-mouseXRef.current + Math.PI) * 10;
            ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(px, pz); ctx.lineTo(dX, dZ); ctx.stroke();
        };
        draw();
        return () => cancelAnimationFrame(mmFrame);
    }, [loading]);

    useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages, isTyping]);

    // ── Chat ────────────────────────────────────────────────────────────────────
    const getRandomOptions = useCallback((npcId) => {
        const all = DIALOGUE_OPTIONS[npcId] || [];
        return [...all].sort(() => Math.random() - 0.5).slice(0, 4);
    }, []);

    const openChat = useCallback((charGroup) => {
        const ud = charGroup.userData;
        setChatOpen(true); setChatNpc(ud);
        currentCharRef.current = charGroup;
        // Exit pointer lock
        if (document.pointerLockElement === rendererRef.current?.domElement) document.exitPointerLock();

        const history = chatHistories.get(ud.id) || [];
        const greeting = GREETINGS[ud.id] || `Hey! I'm ${ud.name}.`;
        const initial = [{ role: 'system', text: `You walked up to ${ud.name}'s desk.` }, { role: 'npc', text: greeting }];
        setMessages(history.length > 0 ? history : initial);
        if (!history.length) chatHistories.set(ud.id, initial);
        setDialogueOpts(getRandomOptions(ud.id));
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [chatHistories, getRandomOptions]);

    const closeChat = useCallback(() => {
        setChatOpen(false);
        if (chatNpc) chatHistories.set(chatNpc.id, messages);
        setChatNpc(null);
        currentCharRef.current = null;
        setDialogueOpts([]);
    }, [chatNpc, messages, chatHistories]);

    const askQuestion = useCallback(async (question) => {
        if (!question.trim() || isTyping || !chatNpc) return;
        const newMsgs = [...messages, { role: 'user', text: question }];
        setMessages(newMsgs); setIsTyping(true); setDialogueOpts([]);

        try {
            const ctx = newMsgs.filter(m => m.role !== 'system').map(m => `${m.role === 'user' ? 'User' : chatNpc.name}: ${m.text}`).join('\n');
            const prompt = `${chatNpc.personality}\n\nConversation so far:\n${ctx}\n\n${chatNpc.name}'s response:`;
            const response = await geminiChat(prompt);
            const updated = [...newMsgs, { role: 'npc', text: response }];
            setMessages(updated); chatHistories.set(chatNpc.id, updated);
        } catch {
            const fbs = FALLBACKS[chatNpc.id] || ["Let me think about that..."];
            const fb = [...newMsgs, { role: 'npc', text: fbs[Math.floor(Math.random() * fbs.length)] }];
            setMessages(fb); chatHistories.set(chatNpc.id, fb);
        } finally {
            setIsTyping(false);
            if (chatNpc) setDialogueOpts(getRandomOptions(chatNpc.id));
        }
    }, [isTyping, chatNpc, messages, chatHistories, getRandomOptions]);

    const sendMessage = useCallback(() => {
        if (!inputText.trim()) return;
        askQuestion(inputText.trim());
        setInputText('');
    }, [inputText, askQuestion]);

    return (
        <div className="explore-container">
            <div ref={canvasRef} className="explore-canvas-container" />
            {loading && (
                <div className="explore-loading">
                    <h2>QCAR Office</h2>
                    <p style={{ fontSize: '20px' }}>🧠 Meet the Team</p>
                    <div className="explore-loading-bar"><div className="explore-loading-bar-fill" /></div>
                    <p style={{ color: '#666', fontSize: '0.8rem' }}>LOADING WORKSPACE...</p>
                </div>
            )}
            {!loading && (
                <div className="explore-hud">
                    {!chatOpen && (
                        <>
                            <div className="explore-info-panel">
                                <h2>QCAR Office</h2>
                                <p>Use <kbd>WASD</kbd> to move around</p>
                                <p>Arrow keys or mouse to look</p>
                                <p>Press <kbd>E</kbd> to interact</p>
                                <p>Press <kbd>SPACE</kbd> to dance</p>
                                <p>Press <kbd>ESC</kbd> to close / release mouse</p>
                                <p style={{ opacity: 0.7, marginTop: 8 }}>💡 Click to lock mouse for looking</p>
                            </div>
                            <div className="explore-minimap"><canvas ref={minimapRef} /></div>
                        </>
                    )}
                    <Link to="/" className="explore-back-btn">← EXIT</Link>
                    {nearNpc && !chatOpen && (
                        <div className="explore-interact-prompt">
                            Press E to talk to {nearNpc.userData?.name || nearNpc.name}
                        </div>
                    )}
                    {chatOpen && chatNpc && (
                        <div className="explore-chat-dialog-bottom">
                            <h3 className="chat-npc-name">{chatNpc.name} — {chatNpc.role}</h3>
                            <div className="explore-chat-messages" ref={chatRef}>
                                {messages.map((msg, i) => (<div key={i} className={`chat-msg ${msg.role}`}>{msg.text}</div>))}
                                {isTyping && <div className="chat-msg npc"><div className="typing-dots"><span /><span /><span /></div></div>}
                            </div>
                            {!isTyping && dialogueOpts.length > 0 && (
                                <div className="explore-dialogue-options">
                                    {dialogueOpts.map((opt, i) => (
                                        <div key={i} className="dialogue-option" onClick={() => askQuestion(opt)}>{opt}</div>
                                    ))}
                                </div>
                            )}
                            <div className="custom-question-area">
                                <p className="chat-divider">━━━ Or ask your own question ━━━</p>
                                <input ref={inputRef} type="text" value={inputText} onChange={e => setInputText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                                    placeholder={`Ask anything! e.g., "What's your favorite part of research?"`}
                                    disabled={isTyping} maxLength={200} className="custom-question-input" />
                                <button className="custom-question-submit" onClick={sendMessage}
                                    disabled={isTyping || !inputText.trim()}>Ask Question</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Explore;
