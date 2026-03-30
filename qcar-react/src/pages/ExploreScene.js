import * as THREE from 'three';

// ── NPC Activity System ─────────────────────────────────────────────────────────
export const ACTIVITIES = ['working', 'coffee', 'walking', 'chatting', 'stretching', 'reading', 'thinking', 'dancing'];
const ACTIVITY_WEIGHTS = [0.22, 0.14, 0.14, 0.12, 0.1, 0.1, 0.1, 0.08];

export function pickActivity() {
    const r = Math.random();
    let sum = 0;
    for (let i = 0; i < ACTIVITY_WEIGHTS.length; i++) {
        sum += ACTIVITY_WEIGHTS[i];
        if (r < sum) return ACTIVITIES[i];
    }
    return 'working';
}

export const COFFEE_POS = { x: -18, z: 10 };

export function getActivityLabel(activity) {
    return {
        working: '💻 Working', coffee: '☕ Getting coffee', walking: '🚶 Walking around',
        chatting: '💬 Chatting', stretching: '🙆 Stretching', reading: '📖 Reading a paper',
        thinking: '🤔 Deep in thought', dancing: '💃 Vibing'
    }[activity] || '';
}

// ── Team Data ───────────────────────────────────────────────────────────────────
export const TEAM_MEMBERS = [
    {
        id: 'hassan', name: 'Hassan', role: 'Research Lead', color: 0x4169e1, hairColor: 0x1a1a1a,
        position: { x: -10, z: -10 }, deskExtras: 'whiteboard',
        personality: `You are Hassan, the bossman of QCAR. Surgically precise, thinks like a philosopher, talks like a mathematician. Quiet authority. You love pure mathematics and see beauty in proofs. Occasionally quote philosophers. Warm but measured. Keep responses to 2-3 sentences.`,
        quirk: 'accidentally explains everything with mathematical analogies'
    },
    {
        id: 'raja', name: 'Raja', role: 'Quantum Researcher', color: 0x228b22, hairColor: 0x2a1506,
        position: { x: 0, z: -10 }, deskExtras: 'toys',
        personality: `You are Raja, the funniest and craziest guy at QCAR. INSANE energy. You say unhinged things with complete confidence. Laugh at your own jokes. Smart but hide it behind chaos. Have a rubber duck you consult for research decisions. Keep responses to 2-3 sentences.`,
        quirk: 'consults his rubber duck for major research decisions'
    },
    {
        id: 'vikas', name: 'Vikas', role: 'Algorithm Designer', color: 0x9370db, hairColor: 0x111111,
        position: { x: 10, z: -10 }, deskExtras: 'neat',
        personality: `You are Vikas, an algorithm designer at QCAR. Warm, approachable, naturally witty. You make people feel comfortable. Everyone comes to you when stuck. You love chai and offer visitors an imaginary cup. Humble but quietly brilliant. Keep responses to 2-3 sentences.`,
        quirk: 'offers everyone chai even in a virtual office'
    },
    {
        id: 'lakshya', name: 'Lakshya', role: 'Information Theorist', color: 0xff6347, hairColor: 0x0a0a0a,
        position: { x: -10, z: 5 }, deskExtras: 'dark',
        personality: `You are Lakshya, QCAR's quantum information theorist. Deeply nihilistic and pessimistic about everything. "Why even research? Heat death anyway." Not mean, just profoundly sad in a funny way. Sigh before every sentence. Black coffee because "milk is false hope." Keep responses to 2-3 sentences.`,
        quirk: 'finds existential crises in every equation'
    },
    {
        id: 'nishith', name: 'Nishith', role: 'Research Associate', color: 0xffa500, hairColor: 0x1a0f00,
        position: { x: 0, z: 5 }, deskExtras: 'memes',
        personality: `You are Nishith, the absolute joker of QCAR. Pure entertainment. Turn EVERYTHING into a bit. Lab meetings become cricket commentary. Papers get Yelp reviews. Communicate through memes and movie references. Send 47 messages in group chat. Sharp underneath. Keep responses to 2-3 sentences.`,
        quirk: 'can\'t stop making cricket commentary about everything'
    },
    {
        id: 'suraj', name: 'Suraj', role: 'Developer & Coder', color: 0x20b2aa, hairColor: 0x0d0d0d,
        position: { x: 10, z: 5 }, deskExtras: 'fan',
        personality: `You are Suraj, QCAR's resident coder. Always typing. Talk about code like poets talk about sunsets. Desk fan because laptop runs hot. Think in code — "if that makes sense, else let me re-explain." Live in terminal. Dark mode non-negotiable. Judge by git commits. Keep responses to 2-3 sentences.`,
        quirk: 'optimizes his lunch choices with gradient descent'
    },
    {
        id: 'abhinav', name: 'Abhinav', role: 'Research Intern', color: 0x72b56c, hairColor: 0x1f0f00,
        position: { x: 5, z: 0 }, deskExtras: 'plants',
        personality: `You are Abhinav, QCAR's research intern. ALWAYS eating yoghurt. Spoon in one hand, paper in the other. Desk is a mini jungle — plants everywhere. Earnest, eager, asks lots of questions. Gets excited about basic concepts. Brings snacks for everyone. Plants have names. Keep responses to 2-3 sentences.`,
        quirk: 'has named every one of his desk plants'
    },
];

// ── Dialogue Options ────────────────────────────────────────────────────────────
export const DIALOGUE_OPTIONS = {
    hassan: ["Tell me about your role at QCAR", "What's the most beautiful proof you've ever seen?", "How do you approach a new research problem?", "What philosophy do you live by?", "What advice for aspiring researchers?", "What keeps you up at night about quantum?"],
    raja: ["Tell me your craziest research story", "What does the rubber duck think?", "Explain quantum entanglement your way", "Give me a nickname", "What's your hot take on quantum?", "What's the funniest lab moment?"],
    vikas: ["Can you explain Grover's algorithm simply?", "What's the hardest bug you've fixed?", "What makes a good algorithm?", "Want to grab chai?", "What are you working on?", "Tell me about algorithm design"],
    lakshya: ["What's the point of quantum research?", "Are you okay?", "Tell me about quantum teleportation", "What's your view on humanity's future?", "Why do you drink black coffee?", "What keeps you going?"],
    nishith: ["Rate the lab meeting out of 10", "What meme describes quantum computing?", "Do cricket commentary of someone coding", "What's most unhinged in group chat?", "Roast a teammate lovingly", "If QCAR was a movie genre?"],
    suraj: ["Tabs or spaces?", "What's in your .bashrc?", "Best language for quantum computing?", "Dark mode or light mode?", "What are you building?", "Show me your terminal setup"],
    abhinav: ["What yoghurt flavor today?", "Tell me about your plants", "What have you learned recently?", "How's the internship?", "Most surprising thing about quantum?", "What snacks did you bring?"],
};

// ── Character Model (matching reference exactly) ────────────────────────────────
export function createCharacter(scene, member, x, z) {
    const group = new THREE.Group();

    // Torso (cylinder like reference)
    const torsoGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.8, 8);
    const torsoMat = new THREE.MeshStandardMaterial({ color: member.color });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.6;
    torso.castShadow = true;
    group.add(torso);

    // Arms (cylinders like reference)
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
    const armMat = new THREE.MeshStandardMaterial({ color: member.color });

    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.3, 0.7, 0);
    leftArm.rotation.z = Math.PI / 8;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.3, 0.7, 0);
    rightArm.rotation.z = -Math.PI / 8;
    group.add(rightArm);

    // Legs (cylinders like reference)
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.15, 0.4, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.15, 0.4, 0);
    group.add(rightLeg);

    // Head (sphere like reference)
    const headGeo = new THREE.SphereGeometry(0.25, 8, 6);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.25;
    head.castShadow = true;
    group.add(head);

    // Hair (squashed sphere like reference)
    const hairGeo = new THREE.SphereGeometry(0.27, 8, 6);
    const hairMat = new THREE.MeshStandardMaterial({ color: member.hairColor || 0x3d3d3d });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.35;
    hair.scale.y = 0.6;
    group.add(hair);

    // Eyes (small spheres like reference)
    const eyeGeo = new THREE.SphereGeometry(0.03, 4, 4);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 1.25, 0.22);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 1.25, 0.22);
    group.add(rightEye);

    // Name label (canvas sprite like reference)
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = 'black';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(member.name, 128, 25);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText(member.role, 128, 45);

    const texture = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.SpriteMaterial({ map: texture });
    const label = new THREE.Sprite(labelMat);
    label.position.y = 1.8;
    label.scale.set(2, 0.5, 1);
    group.add(label);

    group.position.set(x, 0, z);

    // Glow ring
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.02, 8, 32),
        new THREE.MeshBasicMaterial({ color: member.color, transparent: true, opacity: 0.4 })
    );
    ring.position.set(x, 0.1, z);
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);

    group.userData = {
        ...member,
        initialPosition: new THREE.Vector3(x, 0, z),
        targetPosition: new THREE.Vector3(x, 0, z),
        moveTimer: Math.random() * 5 + 3,
        isDancing: false,
        tripChance: 0.001,
        leftArm, rightArm, leftLeg, rightLeg,
        ring, label,
    };

    scene.add(group);
    return group;
}

// ── Desk Extras ─────────────────────────────────────────────────────────────────
function addDeskExtras(scene, type, x, z) {
    const items = [];
    if (type === 'fan') {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.08, 12),
            new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 }));
        base.position.set(x + 0.9, 0.85, z + 0.3); scene.add(base);
        const cage = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.01, 8, 16),
            new THREE.MeshBasicMaterial({ color: 0x666666 }));
        cage.position.set(x + 0.9, 1.1, z + 0.35);
        cage.userData.isFanBlade = true;
        scene.add(cage); items.push(cage);
    } else if (type === 'plants') {
        [[-0.8, 0.2], [0.9, -0.1], [0.5, 0.4]].forEach(([px, pz]) => {
            const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.12, 8),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
            pot.position.set(x + px, 0.87, z + pz); scene.add(pot);
            const plant = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.9 }));
            plant.position.set(x + px, 0.97, z + pz); scene.add(plant);
        });
    } else if (type === 'toys') {
        const duck = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xFFD700 }));
        duck.position.set(x + 0.7, 0.89, z + 0.2); scene.add(duck);
    } else if (type === 'memes') {
        [0.3, 0.5, 0.7].forEach((offset, i) => {
            const paper = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.01),
                new THREE.MeshBasicMaterial({ color: [0xffffff, 0xffffcc, 0xccffcc][i] }));
            paper.position.set(x + offset - 0.2, 0.87, z - 0.55);
            paper.rotation.z = (Math.random() - 0.5) * 0.3; scene.add(paper);
        });
    } else if (type === 'whiteboard') {
        const wb = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 0.1),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.1 }));
        wb.position.set(x, 3, z - 2); scene.add(wb);
    } else if (type === 'dark') {
        const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.05, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111 }));
        lampBase.position.set(x + 0.8, 0.83, z + 0.2); scene.add(lampBase);
    }
    return items;
}

// ── Build Office (matching reference style) ─────────────────────────────────────
export function createOffice(scene) {
    const characters = [];
    const animatedItems = [];

    // Floor
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, roughness: 0.7, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor tiles pattern (like reference)
    const tile1 = new THREE.MeshStandardMaterial({ color: 0xe8e8e8 });
    const tile2 = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
    for (let tx = -20; tx < 20; tx += 2) {
        for (let tz = -20; tz < 20; tz += 2) {
            const t = new THREE.Mesh(new THREE.PlaneGeometry(2, 2),
                ((tx + tz) / 2) % 2 === 0 ? tile1 : tile2);
            t.position.set(tx + 1, 0.01, tz + 1);
            t.rotation.x = -Math.PI / 2;
            t.receiveShadow = true;
            scene.add(t);
        }
    }

    // Walls (like reference - light colored)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.9 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.3, roughness: 0.1, metalness: 0.5 });

    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), wallMat);
    backWall.position.set(0, 5, -20); backWall.receiveShadow = true; scene.add(backWall);

    // Windows on back wall
    for (let wx = -15; wx <= 15; wx += 10) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), windowMat);
        win.position.set(wx, 5, -19.9); scene.add(win);
    }

    // Side walls
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), wallMat);
    leftWall.position.set(-20, 5, 0); leftWall.rotation.y = Math.PI / 2; scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), wallMat);
    rightWall.position.set(20, 5, 0); rightWall.rotation.y = -Math.PI / 2; scene.add(rightWall);

    // Front wall
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), wallMat);
    frontWall.position.set(0, 5, 20); frontWall.rotation.y = Math.PI; scene.add(frontWall);

    // Wood material for desks
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.6, metalness: 0.1 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.3, metalness: 0.8 });

    // Create desks for each member (like reference)
    TEAM_MEMBERS.forEach(member => {
        const { x, z } = member.position;
        const deskGroup = new THREE.Group();

        // Desk top
        const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1.5), woodMat);
        deskTop.position.y = 0.75; deskTop.castShadow = true; deskTop.receiveShadow = true;
        deskGroup.add(deskTop);

        // Metal frame legs
        const frameGeo = new THREE.BoxGeometry(0.05, 0.7, 0.05);
        [[-1.45, -0.7], [1.45, -0.7], [-1.45, 0.7], [1.45, 0.7]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(frameGeo, metalMat);
            leg.position.set(lx, 0.35, lz); leg.castShadow = true;
            deskGroup.add(leg);
        });

        // Monitor base + stand + screen
        const monBase = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16), metalMat);
        monBase.position.set(0, 0.82, 0); deskGroup.add(monBase);
        const monStand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), metalMat);
        monStand.position.set(0, 0.95, 0); deskGroup.add(monStand);
        const monScreen = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.05),
            new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1, metalness: 0.5 }));
        monScreen.position.set(0, 1.3, 0); deskGroup.add(monScreen);

        // Keyboard
        const kb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.15), metalMat);
        kb.position.set(0, 0.81, 0.3); deskGroup.add(kb);

        // Chair
        const chairMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), chairMat);
        chairSeat.position.set(0, 0.5, 0.8); deskGroup.add(chairSeat);
        const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.05), chairMat);
        chairBack.position.set(0, 0.8, 1.02); deskGroup.add(chairBack);

        // Random mug
        if (Math.random() > 0.5) {
            const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8),
                new THREE.MeshStandardMaterial({ color: 0xffffff }));
            mug.position.set(Math.random() * 0.5 - 0.25, 0.85, Math.random() * 0.3);
            deskGroup.add(mug);
        }

        deskGroup.position.set(x, 0, z);
        scene.add(deskGroup);

        // Desk extras
        const extras = addDeskExtras(scene, member.deskExtras, x, z);
        animatedItems.push(...extras);

        // Create character at desk
        const char = createCharacter(scene, member, x, z + 0.8);
        characters.push(char);
    });

    // Whiteboard on back wall
    const whiteboard = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.1 }));
    whiteboard.position.set(0, 3, -19.8); whiteboard.castShadow = true; scene.add(whiteboard);

    // Plant decorations (like reference)
    [{ x: -15, z: -15 }, { x: 15, z: -15 }, { x: 0, z: 15 }, { x: -15, z: 15 }, { x: 15, z: 15 }].forEach(pos => {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.4, 8),
            new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
        pot.position.set(pos.x, 0.2, pos.z); scene.add(pot);
        const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 5),
            new THREE.MeshStandardMaterial({ color: 0x228b22 }));
        leaves.position.set(pos.x, 0.8, pos.z); scene.add(leaves);
    });

    // Coffee station (like reference)
    const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 1), woodMat);
    coffeeTable.position.set(COFFEE_POS.x, 0.4, COFFEE_POS.z); coffeeTable.castShadow = true; scene.add(coffeeTable);
    const coffeeMachine = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.3), metalMat);
    coffeeMachine.position.set(COFFEE_POS.x, 1.05, COFFEE_POS.z); scene.add(coffeeMachine);

    // ══ LIGHTING (like reference) ══
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    return { characters, animatedItems };
}
