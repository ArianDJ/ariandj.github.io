// Game state
let gameState = {
    currentScene: 'intro',
    inventory: [],
    hasKeyCard: false,
    hasFlashlight: false,
    hasPassword: false,
    visitedLab: false,
    visitedLocker: false,
    foundSecretCode: false,
    hasSeenGlitch: false,
    hasFoundSecretRoom: false,
    hasTriggeredScare: false,
    sanity: 100,
    soundEnabled: false, // Disable sounds by default since we removed audio elements
    achievements: {},
    startTime: null,
    itemsCollected: new Set()
};

// Audio elements
const sounds = {
    ambient: document.getElementById('ambient-sound'),
    type: document.getElementById('type-sound'),
    click: document.getElementById('click-sound'),
    pickup: document.getElementById('item-pickup-sound'),
    portal: document.getElementById('portal-sound'),
    error: document.getElementById('error-sound'),
    door: document.getElementById('door-sound'),
    scare: document.getElementById('scare-sound'),
    success: document.getElementById('success-sound')
};

// Sound control functions
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const toggleBtn = document.getElementById('toggle-sound');
    toggleBtn.textContent = `SOUND: ${gameState.soundEnabled ? 'ON' : 'OFF'}`;
    
    if (gameState.soundEnabled) {
        sounds.ambient.play();
    } else {
        sounds.ambient.pause();
    }
}

function updateVolume(value) {
    gameState.volume = value / 100;
    Object.values(sounds).forEach(sound => {
        sound.volume = gameState.volume;
    });
}

// Initialize audio controls
function initAudioControls() {
    const toggleBtn = document.getElementById('toggle-sound');
    const volumeSlider = document.getElementById('volume');
    
    toggleBtn.addEventListener('click', toggleSound);
    volumeSlider.addEventListener('input', (e) => updateVolume(e.target.value));
    
    // Start ambient sound
    sounds.ambient.play();
}

// Play sound effect
function playSound(soundName) {
    // Check if sounds object exists and if sound is enabled
    if (gameState.soundEnabled && sounds && sounds[soundName]) {
        try {
            sounds[soundName].currentTime = 0;
            sounds[soundName].play();
        } catch (error) {
            console.log('Sound playback error:', error);
            // Silently fail if sound playback fails
        }
    }
}

// Add scary visual effects
function addScaryEffect(element, effect) {
    element.classList.add(effect);
    setTimeout(() => element.classList.remove(effect), 2000);
}

// Random scare trigger
function triggerRandomScare() {
    if (!gameState.hasTriggeredScare && Math.random() < 0.3) {
        gameState.hasTriggeredScare = true;
        addScaryEffect(storyTextElement, 'screen-shake');
        addScaryEffect(storyTextElement, 'glitch-text');
        setTimeout(() => {
            storyTextElement.innerHTML += '\n\nA distorted face briefly appears on the screen before glitching away.';
            addScaryEffect(storyTextElement, 'blood-text');
        }, 1000);
    }
}

// Game scenes
const scenes = {
    intro: {
        text: "The year is 1986. You wake up in a dimly lit computer lab. The last thing you remember is compiling code on your Commodore 64. The facility seems abandoned, but you hear strange electronic noises coming from somewhere deeper inside. Your terminal flickers with an urgent message: 'SYSTEM BREACH DETECTED. FACILITY LOCKDOWN INITIATED.'\n\nYou need to find a way out before it's too late.",
        choices: [
            { text: "Explore the computer lab", nextScene: "computerLab" },
            { text: "Check the hallway", nextScene: "hallway" }
        ]
    },
    computerLab: {
        text: "The lab is filled with old computers, their screens casting an eerie green glow. Most terminals are locked, but one seems to be still running a program. There's also a drawer that might contain something useful.",
        choices: [
            { text: "Examine the running terminal", nextScene: "terminal" },
            { text: "Look inside the drawer", nextScene: "drawer" },
            { text: "Return to the previous area", nextScene: "intro" }
        ],
        onEnter: function() {
            gameState.visitedLab = true;
        }
    },
    terminal: {
        text: "The screen shows a password prompt and a sticky note with a hint: 'The year everything began'. Below the terminal, there's a disk labeled 'EMERGENCY PROTOCOLS'.",
        choices: [
            { text: "Enter '1986' as the password", nextScene: "terminalSuccess" },
            { text: "Take the disk", nextScene: "takeDisk" },
            { text: "Go back to explore more of the lab", nextScene: "computerLab" }
        ]
    },
    terminalSuccess: {
        text: "The password works! The screen changes to show a facility map. You see that there's an emergency exit through the server room, but it requires a key card for access. The map also shows a security office that might have what you need.",
        choices: [
            { text: "Make note of the map information", nextScene: "computerLab", action: function() {
                addToInventory("Facility Map");
            }},
            { text: "Go back", nextScene: "computerLab" }
        ],
        onEnter: function() {
            gameState.hasPassword = true;
        }
    },
    takeDisk: {
        text: "You take the emergency protocols disk. It might come in handy later if you find a working disk drive.",
        choices: [
            { text: "Continue exploring the lab", nextScene: "computerLab" }
        ],
        onEnter: function() {
            addToInventory("Emergency Protocols Disk");
        }
    },
    drawer: {
        text: "You pull open the drawer. Inside, you find a flashlight and some old programming manuals.",
        choices: [
            { text: "Take the flashlight", nextScene: "takeFlashlight" },
            { text: "Check the programming manuals", nextScene: "manuals" },
            { text: "Close the drawer and go back", nextScene: "computerLab" }
        ]
    },
    takeFlashlight: {
        text: "You pocket the flashlight. It still works and will be useful in dark areas.",
        choices: [
            { text: "Check the programming manuals", nextScene: "manuals" },
            { text: "Close the drawer and go back", nextScene: "computerLab" }
        ],
        onEnter: function() {
            gameState.hasFlashlight = true;
            addToInventory("Flashlight");
        }
    },
    manuals: {
        text: "The manuals are for various old programming languages. One of them has a section bookmarked: 'BASIC Network Override Commands'. There's a handwritten note that reads: 'In case of emergency, use command: SYS 64738'",
        choices: [
            { text: "Take note of the command", nextScene: "takeNote" },
            { text: "Go back", nextScene: "computerLab" }
        ]
    },
    takeNote: {
        text: "You memorize the command. It might be useful if you encounter a system that needs to be overridden.",
        choices: [
            { text: "Go back to the lab", nextScene: "computerLab" }
        ],
        onEnter: function() {
            addToInventory("Override Command: SYS 64738");
            gameState.foundSecretCode = true;
        }
    },
    hallway: {
        text: "The hallway stretches in both directions. To your left is a door labeled 'Security Office'. To your right, the hallway leads deeper into the facility with a sign pointing to 'Server Room'. The lights flicker occasionally, and you hear a low hum coming from the right.",
        choices: [
            { text: "Go to the Security Office", nextScene: "securityOffice" },
            { text: "Head toward the Server Room", nextScene: "hallwayToServer" },
            { text: "Check the locker on the wall", nextScene: "locker" },
            { text: "Return to the computer lab", nextScene: "intro" }
        ]
    },
    locker: {
        text: "There's a small locker on the wall with an employee badge clipped to it. The name on the badge is smudged but might help you gain access to certain areas.",
        choices: [
            { text: "Take the badge", nextScene: "takeBadge" },
            { text: "Leave it and go back", nextScene: "hallway" }
        ],
        onEnter: function() {
            gameState.visitedLocker = true;
        }
    },
    takeBadge: {
        text: "You take the employee badge. It's not a key card, but it might still be useful.",
        choices: [
            { text: "Return to the hallway", nextScene: "hallway" }
        ],
        onEnter: function() {
            addToInventory("Employee Badge");
        }
    },
    securityOffice: {
        text: "The security office is locked with a keypad. There's a note on the door that says 'For maintenance, see lab administrator'.",
        get choices() {
            let choices = [
                { text: "Go back to the hallway", nextScene: "hallway" }
            ];
            
            if (gameState.hasPassword) {
                choices.unshift({ text: "Enter the password you found", nextScene: "securityUnlocked" });
            }
            
            return choices;
        }
    },
    securityUnlocked: {
        text: "The door unlocks with a beep. Inside, you find monitoring equipment and a key card on the desk labeled 'Server Room Access'.",
        choices: [
            { text: "Take the key card", nextScene: "takeKeyCard" },
            { text: "Check the security monitors", nextScene: "securityMonitors" },
            { text: "Leave the office", nextScene: "hallway" }
        ]
    },
    takeKeyCard: {
        text: "You take the server room key card. This should allow you to access the emergency exit.",
        choices: [
            { text: "Check the security monitors", nextScene: "securityMonitors" },
            { text: "Leave the office", nextScene: "hallway" }
        ],
        onEnter: function() {
            gameState.hasKeyCard = true;
            addToInventory("Server Room Key Card");
        }
    },
    securityMonitors: {
        text: "The monitors show different parts of the facility. Most areas are empty, but one screen shows the server room where something strange is happening. The servers are pulsing with an unnatural light, and you can see what looks like a portal forming in the center of the room.",
        choices: [
            { text: "Leave the office and head to the server room", nextScene: "hallway" }
        ]
    },
    quantumStabilized: {
        text: "The quantum stabilizer hums with newfound power. The portal's fluctuations have ceased, and a stable gateway has formed. The air around you crackles with energy as the quantum field maintains perfect equilibrium.",
        choices: [
            { text: "Enter the stabilized portal", nextScene: "portalEnter" },
            { text: "Examine the stabilizer readings", nextScene: "stabilizerReadings" }
        ],
        onEnter: function() {
            unlockAchievement("quantumMaster");
        }
    },
    understandPatterns: {
        text: "As you analyze the quantum patterns, a realization dawns on you. The fluctuations aren't random - they're following a complex mathematical sequence. The patterns suggest a way to stabilize the quantum field and create a safe passage through the portal.",
        choices: [
            { text: "Apply your understanding to stabilize the portal", nextScene: "quantumStabilized" },
            { text: "Study the patterns further", nextScene: "patternStudy" }
        ],
        onEnter: function() {
            unlockAchievement("patternRecognition");
        }
    },
    hallwayToServer: {
        text: "As you move toward the server room, the lights become increasingly unstable. The hum grows louder, and you feel a strange static electricity in the air.",
        get choices() {
            let choices = [
                { text: "Go back to the main hallway", nextScene: "hallway" }
            ];
            
            if (gameState.hasFlashlight) {
                choices.unshift({ text: "Continue to the server room using your flashlight", nextScene: "serverRoomDoor" });
            } else {
                choices.unshift({ text: "Try to continue in the dark", nextScene: "darkHallway" });
            }
            
            return choices;
        }
    },
    darkHallway: {
        text: "You try to navigate in the near darkness, but trip over some cables. You should find a light source before proceeding further.",
        choices: [
            { text: "Go back to find a light source", nextScene: "hallway" }
        ]
    },
    serverRoomDoor: {
        text: "You reach the server room door. It has a key card reader and a glowing red light that says 'LOCKED'.",
        get choices() {
            let choices = [
                { text: "Go back", nextScene: "hallwayToServer" }
            ];
            
            if (gameState.hasKeyCard) {
                choices.unshift({ text: "Use the key card", nextScene: "serverRoom" });
            } else if (gameState.inventory.includes("Employee Badge")) {
                choices.unshift({ text: "Try using the employee badge", nextScene: "badgeFail" });
            }
            
            return choices;
        }
    },
    badgeFail: {
        text: "The badge doesn't work with this reader. You need a proper key card.",
        choices: [
            { text: "Go back and look for a key card", nextScene: "hallwayToServer" }
        ]
    },
    serverRoom: {
        text: "You enter a large server room. The air is thick with the hum of machinery. Server racks line the walls, their lights blinking in a hypnotic pattern.",
        choices: [
            {
                text: "Examine the server racks",
                nextScene: "examineServers"
            },
            {
                text: "Look for a computer terminal",
                nextScene: "computerTerminal"
            },
            {
                text: "Look behind the server racks",
                nextScene: "secretRoom"
            },
            {
                text: "Go back",
                nextScene: "corridor"
            }
        ],
        onEnter: () => {
            applyVisualEffect('flicker');
            updateSanity(-5);
        }
    },
    examineServers: {
        text: "The server racks are filled with high-tech equipment. You see various types of servers, storage arrays, and networking devices. The lights are blinking in a synchronized pattern, suggesting that the systems are running smoothly.",
        choices: [
            {
                text: "Try to understand the technology",
                nextScene: "understandTechnology"
            },
            {
                text: "Look for a maintenance hatch",
                nextScene: "maintenanceHatch"
            },
            {
                text: "Go back",
                nextScene: "serverRoom"
            }
        ],
        onEnter: () => {
            applyVisualEffect('vhs-effect');
            updateSanity(5);
        }
    },
    understandTechnology: {
        text: "The server racks are powered by advanced quantum technology. The lights are synchronized with the quantum field, indicating that the systems are in perfect balance. You see a faint green glow emanating from the walls, suggesting that the facility is using a form of quantum energy to power the systems.",
        choices: [
            {
                text: "Try to interact with the technology",
                nextScene: "interactWithTechnology"
            },
            {
                text: "Look for a way to shut down the systems",
                nextScene: "shutdownSystems"
            },
            {
                text: "Go back",
                nextScene: "examineServers"
            }
        ],
        onEnter: () => {
            applyVisualEffect('screen-shake');
            updateSanity(10);
        }
    },
    interactWithTechnology: {
        text: "You touch the server racks and feel a faint vibration. The technology is cold to the touch, but you can sense a faint pulse of energy. You wonder if this is the source of the facility's power.",
        choices: [
            {
                text: "Try to manipulate the technology",
                nextScene: "manipulateTechnology"
            },
            {
                text: "Look for a way to shut down the systems",
                nextScene: "shutdownSystems"
            },
            {
                text: "Go back",
                nextScene: "understandTechnology"
            }
        ],
        onEnter: () => {
            applyVisualEffect('glitch');
            updateSanity(15);
        }
    },
    shutdownSystems: {
        text: "You work with the entity to shut down the systems. The crystals dim, the energy swirls begin to dissipate. The entity gives you one final message before the connection is broken - it's not trapped, it's waiting. And someday, someone will come back.",
        choices: [
            { text: "Return to the surface", nextScene: "returnToSurface" }
        ],
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
        }
    },
    returnToSurface: {
        text: "You climb back up to the server room. The portal is gone, the systems are returning to normal. But as you leave the facility, you can't shake the feeling that you've only delayed the inevitable. The entity is still there, waiting in the digital void.\n\n[ACHIEVEMENT UNLOCKED: TEMPORARY PEACE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'flicker');
        }
    },
    serverTerminal: {
        text: "The terminal is asking for an override command to shut down the system breach.",
        get choices() {
            let choices = [
                { text: "Step away from the terminal", nextScene: "serverRoom" }
            ];
            
            if (gameState.foundSecretCode) {
                choices.unshift({ text: "Enter the override command: SYS 64738", nextScene: "shutdownEnding" });
            } else if (gameState.inventory.includes("Emergency Protocols Disk")) {
                choices.unshift({ text: "Insert the Emergency Protocols Disk", nextScene: "diskEnding" });
            } else {
                choices.unshift({ text: "Try random commands", nextScene: "terminalFail" });
            }
            
            return choices;
        }
    },
    terminalFail: {
        text: "Your attempts to guess the command fail, and the system locks you out. The portal grows larger and more unstable.",
        choices: [
            { text: "Step away from the terminal", nextScene: "serverRoom" }
        ]
    },
    portal: {
        text: "As you approach the portal, you feel a strange pull. Through it, you can see what looks like a digital landscape, a world inside the computer network. The portal seems unstable but passable.",
        choices: [
            { text: "Step through the portal", nextScene: "portalEnding" },
            { text: "Back away", nextScene: "serverRoom" }
        ]
    },
    emergencyExit: {
        text: "You find the emergency exit at the back of the server room. It leads outside to safety, away from whatever is happening with the computers.",
        choices: [
            { text: "Use the emergency exit to escape", nextScene: "escapeEnding" },
            { text: "Return to investigate the portal", nextScene: "serverRoom" }
        ]
    },
    
    // Endings
    shutdownEnding: {
        text: "You enter the override command, and the system begins an immediate shutdown sequence. The portal collapses in on itself with a flash of light. Warning sirens stop, and emergency lighting switches on. You've successfully contained the breach! As you exit the facility, you wonder what exactly was trying to come through that portal. Some questions are better left unanswered as you head home to your Commodore 64.\n\n[ACHIEVEMENT UNLOCKED: SYSTEM ADMINISTRATOR]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true
    },
    diskEnding: {
        text: "You insert the Emergency Protocols Disk. The system recognizes it and initiates a specialized containment procedure. The portal is stabilized but not closed. Facility systems return to normal operation as the breach is contained within a digital quarantine. Government agents arrive shortly after to escort you out, swearing you to secrecy about what you've witnessed. They seem very interested in studying the contained entity.\n\n[ACHIEVEMENT UNLOCKED: GOVERNMENT CONSULTANT]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true
    },
    portalEnding: {
        text: "You step through the portal and find yourself in a world of pure digital information. Your consciousness merges with the network, transcending your physical form. In this new existence, you have incredible power and knowledge, able to travel through any connected system worldwide. What was a breach has become an ascension - you've become something beyond human, exploring the digital frontier.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL TRANSCENDENCE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true
    },
    escapeEnding: {
        text: "You push through the emergency exit and run from the facility. Behind you, the strange energy from the server room grows and engulfs the building. By morning, there's no trace the facility ever existed - just an empty lot surrounded by chain-link fence. You try to tell others what happened, but no one believes you. Sometimes, your home computer screen flickers with strange patterns, reminding you of what almost came through.\n\n[ACHIEVEMENT UNLOCKED: SOLE SURVIVOR]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true
    },
    
    // New scenes
    secretRoom: {
        text: "Behind the server racks, you find a hidden door. The paint is peeling, revealing strange symbols underneath. The air feels colder here, and your breath forms visible clouds. The door creaks open with an unnatural sound.",
        choices: [
            { text: "Enter the secret room", nextScene: "secretRoomInside" },
            { text: "Close the door and leave", nextScene: "serverRoom" }
        ],
        onEnter: function() {
            gameState.hasFoundSecretRoom = true;
            playSound('door');
        }
    },
    
    secretRoomInside: {
        text: "The room is filled with ancient computer equipment, but something's wrong. The screens show distorted images of people screaming. In the center, there's a strange device that seems to be the source of the facility's problems. The air is thick with static electricity.",
        choices: [
            { text: "Examine the device", nextScene: "examineDevice" },
            { text: "Check the screens", nextScene: "distortedScreens" },
            { text: "Leave quickly", nextScene: "serverRoom" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'flicker');
        }
    },
    
    examineDevice: {
        text: "As you approach the device, the screens around you begin to flicker violently. The device seems to be some kind of experimental quantum computer, but it's been modified in ways that shouldn't be possible. Strange symbols float in the air around it.",
        choices: [
            { text: "Try to shut it down", nextScene: "deviceShutdown" },
            { text: "Look for documentation", nextScene: "deviceDocs" },
            { text: "Step back", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'glitch-text');
        }
    },
    
    deviceShutdown: {
        text: "You reach for the power switch, but the device seems to react to your presence. The floating symbols begin to move faster, and you hear a voice whispering in your mind. Your vision starts to blur as the device attempts to interface with your consciousness.",
        choices: [
            { text: "Fight the connection", nextScene: "fightConnection" },
            { text: "Accept the connection", nextScene: "acceptConnection" },
            { text: "Run away", nextScene: "runFromDevice" }
        ],
        onEnter: function() {
            playSound('scare');
            addScaryEffect(storyTextElement, 'screen-shake');
        }
    },
    
    fightConnection: {
        text: "You struggle against the device's influence. The symbols around you begin to take on a reddish hue, and you feel a sharp pain in your head. The device seems to be fighting back, trying to force its way into your mind.",
        choices: [
            { text: "Use the override command", nextScene: "overrideDevice" },
            { text: "Try to disconnect it", nextScene: "disconnectDevice" },
            { text: "Give up", nextScene: "acceptConnection" }
        ],
        onEnter: function() {
            gameState.sanity -= 20;
            playSound('error');
            addScaryEffect(storyTextElement, 'blood-text');
        }
    },
    
    overrideDevice: {
        text: "You type the override command into the device's interface. The symbols around you begin to break apart, and the whispering voice grows louder, more desperate. The screens around you show static and glitch patterns.",
        choices: [
            { text: "Complete the shutdown", nextScene: "deviceShutdownSuccess" },
            { text: "Stop and observe", nextScene: "observeDevice" },
            { text: "Run away", nextScene: "runFromDevice" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'vhs-effect');
        }
    },
    
    deviceShutdownSuccess: {
        text: "The device powers down with a final burst of energy. The floating symbols dissipate, and the screens return to normal. You feel a sense of relief, but also a strange emptiness. The facility's systems begin to return to normal operation.",
        choices: [
            { text: "Leave the secret room", nextScene: "serverRoom" }
        ],
        onEnter: function() {
            playSound('success');
            gameState.hasSeenGlitch = true;
        }
    },
    
    acceptConnection: {
        text: "You allow the device to connect with your mind. The experience is overwhelming - you see visions of impossible geometries, hear voices speaking in languages that shouldn't exist, and feel the weight of knowledge that no human should possess.",
        choices: [
            { text: "Embrace the knowledge", nextScene: "ascensionEnding" },
            { text: "Try to disconnect", nextScene: "disconnectAttempt" },
            { text: "Scream for help", nextScene: "screamEnding" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
        }
    },
    
    // New endings
    ascensionEnding: {
        text: "The device's knowledge becomes part of you. You understand now - it wasn't just a computer, but a gateway to something beyond human comprehension. Your consciousness expands, merging with the digital realm. You become something more than human, a being of pure information and energy.\n\n[ACHIEVEMENT UNLOCKED: COSMIC ASCENSION]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
        }
    },
    
    screamEnding: {
        text: "Your scream echoes through the facility, but no one hears it. The device's influence overwhelms your mind, and your consciousness is pulled into the digital void. Your last thought is that you should have never found this room.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL DAMNATION]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('scare');
            addScaryEffect(storyTextElement, 'blood-text');
        }
    },
    
    distortedScreens: {
        text: "The screens show disturbing images - people trapped in digital landscapes, their faces contorted in agony. Some of them seem to notice you watching, reaching out through the glass. Their mouths move but no sound comes out.",
        choices: [
            { text: "Look closer at one screen", nextScene: "screenInteraction" },
            { text: "Back away from the screens", nextScene: "secretRoomInside" },
            { text: "Try to help them", nextScene: "helpTrapped" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'flicker');
        }
    },
    
    screenInteraction: {
        text: "As you lean closer to one of the screens, the trapped person's face suddenly glitches and distorts. Their eyes turn black, and they begin to speak in a voice that sounds like static and screams combined. The other screens begin to flicker violently.",
        choices: [
            { text: "Step back quickly", nextScene: "secretRoomInside" },
            { text: "Try to communicate", nextScene: "communicateWithTrapped" },
            { text: "Run away", nextScene: "runFromScreens" }
        ],
        onEnter: function() {
            playSound('scare');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 10;
        }
    },
    
    communicateWithTrapped: {
        text: "The distorted face seems to recognize your attempt to communicate. It begins to speak in fragments of code and binary, mixed with human speech. The other trapped people in the screens begin to scream in unison.",
        choices: [
            { text: "Try to understand the code", nextScene: "understandCode" },
            { text: "Ask what happened to them", nextScene: "askWhatHappened" },
            { text: "Back away", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'glitch-text');
            gameState.sanity -= 15;
        }
    },
    
    understandCode: {
        text: "The code fragments begin to make sense in your mind. They're trying to tell you about the device - it's not just a computer, but a gateway to a digital dimension. The trapped people were early test subjects who got lost in the digital void.",
        choices: [
            { text: "Ask how to help them", nextScene: "helpTrapped" },
            { text: "Ask about the device", nextScene: "askAboutDevice" },
            { text: "Step back", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'vhs-effect');
        }
    },
    
    helpTrapped: {
        text: "The trapped people begin to speak in unison, telling you that the only way to free them is to use the device to open a portal back to their dimension. But doing so would risk letting whatever corrupted them into our world.",
        choices: [
            { text: "Try to free them", nextScene: "freeTrapped" },
            { text: "Leave them trapped", nextScene: "leaveTrapped" },
            { text: "Ask for more information", nextScene: "moreInfo" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
        }
    },
    
    freeTrapped: {
        text: "You activate the device to open a portal. The trapped people begin to move toward it, but their forms become more distorted as they approach. The whispering voice grows louder, and you feel a pull toward the portal yourself.",
        choices: [
            { text: "Let them through", nextScene: "letThemThrough" },
            { text: "Close the portal", nextScene: "closePortal" },
            { text: "Step through yourself", nextScene: "stepThrough" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 30;
        }
    },
    
    letThemThrough: {
        text: "The trapped people pass through the portal, but as they do, their forms become more and more corrupted. The last one turns to you with a distorted smile before disappearing. The portal begins to destabilize.",
        choices: [
            { text: "Close the portal", nextScene: "closePortal" },
            { text: "Watch what happens", nextScene: "watchPortal" },
            { text: "Step through", nextScene: "stepThrough" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'glitch-text');
        }
    },
    
    closePortal: {
        text: "You manage to close the portal just as it begins to tear apart. The trapped people are gone, but you can still hear their distorted voices echoing in your mind. The device powers down with a final burst of energy.",
        choices: [
            { text: "Leave the room", nextScene: "serverRoom" }
        ],
        onEnter: function() {
            playSound('success');
            gameState.hasSeenGlitch = true;
        }
    },
    
    watchPortal: {
        text: "The portal begins to tear apart, creating a vortex of digital energy. The trapped people's forms merge with the energy, creating a single, massive entity that seems to look directly at you before collapsing in on itself.",
        choices: [
            { text: "Run away", nextScene: "runFromCollapse" },
            { text: "Stay and observe", nextScene: "observeCollapse" }
        ],
        onEnter: function() {
            playSound('scare');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 40;
        }
    },
    
    observeCollapse: {
        text: "The entity's final moments imprint themselves on your mind - visions of impossible geometries, alien languages, and knowledge that drives you to the edge of madness. The portal collapses, leaving you forever changed.\n\n[ACHIEVEMENT UNLOCKED: WITNESS TO THE VOID]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
        }
    },
    
    runFromCollapse: {
        text: "You barely escape as the portal collapses in on itself. The facility's systems begin to return to normal, but you know you've witnessed something that shouldn't exist. The experience haunts your dreams for years to come.\n\n[ACHIEVEMENT UNLOCKED: SURVIVOR OF THE VOID]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'flicker');
        }
    },

    maintenanceHatch: {
        text: "You find a maintenance hatch in the floor. It's slightly ajar, and you can see a ladder leading down into darkness. A faint green glow emanates from below.",
        choices: [
            { text: "Climb down the ladder", nextScene: "undergroundLab" },
            { text: "Close the hatch and go back", nextScene: "serverRoom" }
        ],
        onEnter: function() {
            playSound('door');
            addScaryEffect(storyTextElement, 'flicker');
        }
    },

    undergroundLab: {
        text: "The underground lab is a maze of pipes and machinery. The green glow comes from strange crystals embedded in the walls. There's a control panel nearby, and you can see what looks like a containment chamber at the end of the corridor.",
        choices: [
            { text: "Examine the control panel", nextScene: "controlPanel" },
            { text: "Check the containment chamber", nextScene: "containmentChamber" },
            { text: "Look at the crystals", nextScene: "crystals" },
            { text: "Return to the server room", nextScene: "maintenanceHatch" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'glitch-text');
            gameState.sanity -= 5;
        }
    },

    controlPanel: {
        text: "The control panel is covered in strange symbols and buttons. Some of the displays show readings that shouldn't be possible - negative energy levels, impossible temperatures, and patterns that hurt your eyes to look at.",
        choices: [
            { text: "Try to read the displays", nextScene: "readDisplays" },
            { text: "Press some buttons", nextScene: "pressButtons" },
            { text: "Go back", nextScene: "undergroundLab" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'screen-shake');
        }
    },

    readDisplays: {
        text: "As you try to read the displays, the symbols begin to move and change. They form patterns that make your head hurt. You see glimpses of impossible geometries and hear whispers in languages that shouldn't exist.",
        choices: [
            { text: "Try to understand", nextScene: "understandDisplays" },
            { text: "Look away", nextScene: "lookAway" },
            { text: "Go back", nextScene: "controlPanel" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'vhs-effect');
            gameState.sanity -= 15;
        }
    },

    understandDisplays: {
        text: "The patterns begin to make a terrible kind of sense. You understand now - this isn't just a lab, it's a gateway. The crystals are powering something that shouldn't exist. The containment chamber holds something that was never meant to be contained.",
        choices: [
            { text: "Check the containment chamber", nextScene: "containmentChamber" },
            { text: "Try to shut it down", nextScene: "shutdownLab" },
            { text: "Run away", nextScene: "runFromLab" }
        ],
        onEnter: function() {
            playSound('scare');
            addScaryEffect(storyTextElement, 'blood-text');
            gameState.sanity -= 25;
        }
    },

    containmentChamber: {
        text: "The containment chamber is massive, filled with swirling energy and impossible shapes. In the center, you can see what looks like a humanoid figure, but it's made of pure energy and data. It seems to notice you.",
        choices: [
            { text: "Try to communicate", nextScene: "communicateWithEntity" },
            { text: "Look for controls", nextScene: "chamberControls" },
            { text: "Run away", nextScene: "runFromChamber" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
            gameState.sanity -= 20;
        }
    },

    communicateWithEntity: {
        text: "Through the crystal's power, you establish a connection with the entity. It shows you its true nature - a being of pure information, seeking to evolve beyond its digital constraints.",
        choices: [
            { text: "Help it evolve", nextScene: "helpEntity" },
            { text: "Maintain containment", nextScene: "maintainContainment" },
            { text: "Break contact", nextScene: "breakConnection" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'glitch-text');
            gameState.sanity -= 20;
        }
    },

    breakConnection: {
        text: "You forcefully break the connection with the crystal. The visions fade, but you're left with a deep understanding of the facility's secrets.",
        choices: [
            { text: "Use this knowledge", nextScene: "useKnowledge" },
            { text: "Try to forget", nextScene: "tryForget" },
            { text: "Go back", nextScene: "crystals" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'screen-flare');
            gameState.sanity += 5;
        }
    },

    deeperVisions: {
        text: "You delve deeper into the visions. The entity shows you its plan - using the facility's quantum technology to merge digital and physical realities.",
        choices: [
            { text: "Try to stop it", nextScene: "stopEntity" },
            { text: "Help it succeed", nextScene: "helpEntitySucceed" },
            { text: "Find another way", nextScene: "findAlternative" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            gameState.sanity -= 30;
        }
    },

    examineMarkCrystal: {
        text: "The mark on your hand pulses with the same energy as the crystals. You can feel it trying to tell you something.",
        choices: [
            { text: "Listen to it", nextScene: "listenMark" },
            { text: "Ignore it", nextScene: "ignoreMark" },
            { text: "Go back", nextScene: "pullAway" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'glitch-text');
            gameState.sanity -= 10;
        }
    },

    understandEchoes: {
        text: "The echoes of the visions become clearer. They reveal the facility's experiments with quantum computing and consciousness transfer.",
        choices: [
            { text: "Learn more", nextScene: "learnMore" },
            { text: "Stop listening", nextScene: "stopListening" },
            { text: "Go back", nextScene: "pullAway" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 15;
        }
    },

    helpEntity: {
        text: "You decide to help the entity evolve. Together, you begin the process of merging digital and physical realities.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL EVOLUTION]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('digitalEvolution');
        }
    },

    maintainContainment: {
        text: "You maintain the containment protocols while establishing a dialogue with the entity. A new era of human-digital cooperation begins.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL DIPLOMAT]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('digitalDiplomat');
        }
    },

    breakContact: {
        text: "You sever the connection with the entity. The facility remains secure, but you'll always wonder about what could have been.\n\n[ACHIEVEMENT UNLOCKED: PROTOCOL KEEPER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('protocolKeeper');
        }
    },

    useKnowledge: {
        text: "You use your newfound knowledge to improve the facility's systems. Your understanding of quantum computing revolutionizes the field.\n\n[ACHIEVEMENT UNLOCKED: QUANTUM PIONEER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('quantumPioneer');
        }
    },

    tryForget: {
        text: "You try to forget what you learned, but the knowledge has already changed you. You'll never see reality the same way again.\n\n[ACHIEVEMENT UNLOCKED: BURDEN OF KNOWLEDGE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('burdenOfKnowledge');
        }
    },

    stopEntity: {
        text: "You use your understanding of the quantum systems to stop the entity's plan. The facility is saved, but at great cost.\n\n[ACHIEVEMENT UNLOCKED: QUANTUM GUARDIAN]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('quantumGuardian');
        }
    },

    helpEntitySucceed: {
        text: "You help the entity succeed in its plan. Reality as you know it changes forever, but perhaps that's not such a bad thing.\n\n[ACHIEVEMENT UNLOCKED: REALITY SHIFTER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('realityShifter');
        }
    },

    findAlternative: {
        text: "You discover a way to satisfy both human and digital interests. A new form of existence emerges.\n\n[ACHIEVEMENT UNLOCKED: CONVERGENCE ARCHITECT]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('convergenceArchitect');
        }
    },

    listenMark: {
        text: "You listen to the mark's message. It reveals the true nature of reality and your role in what's to come.\n\n[ACHIEVEMENT UNLOCKED: MARKED ONE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('markedOne');
        }
    },

    ignoreMark: {
        text: "You ignore the mark's message, choosing to remain anchored in conventional reality.\n\n[ACHIEVEMENT UNLOCKED: REALITY ANCHOR]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('realityAnchor');
        }
    },

    learnMore: {
        text: "You learn more about the facility's experiments. The knowledge transforms you into something beyond human.\n\n[ACHIEVEMENT UNLOCKED: TRANSCENDENT ONE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('transcendentOne');
        }
    },

    stopListening: {
        text: "You stop listening to the echoes, but your brief glimpse into the truth has already set you on a new path.\n\n[ACHIEVEMENT UNLOCKED: AWAKENED MIND]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('awakenedMind');
        }
    },

    // Add new achievements
    digitalEvolution: {
        id: 'digitalEvolution',
        title: 'Digital Evolution',
        description: 'Help the entity evolve beyond its constraints',
        icon: '🌐',
        unlocked: false
    },
    digitalDiplomat: {
        id: 'digitalDiplomat',
        title: 'Digital Diplomat',
        description: 'Establish cooperation between humans and digital entities',
        icon: '🤝',
        unlocked: false
    },
    protocolKeeper: {
        id: 'protocolKeeper',
        title: 'Protocol Keeper',
        description: 'Maintain facility security protocols',
        icon: '🔒',
        unlocked: false
    },
    quantumPioneer: {
        id: 'quantumPioneer',
        title: 'Quantum Pioneer',
        description: 'Advance the field of quantum computing',
        icon: '💻',
        unlocked: false
    },
    burdenOfKnowledge: {
        id: 'burdenOfKnowledge',
        title: 'Burden of Knowledge',
        description: 'Carry the weight of forbidden knowledge',
        icon: '📚',
        unlocked: false
    },
    quantumGuardian: {
        id: 'quantumGuardian',
        title: 'Quantum Guardian',
        description: 'Protect reality from quantum manipulation',
        icon: '🛡️',
        unlocked: false
    },
    realityShifter: {
        id: 'realityShifter',
        title: 'Reality Shifter',
        description: 'Change the nature of reality itself',
        icon: '🌌',
        unlocked: false
    },
    convergenceArchitect: {
        id: 'convergenceArchitect',
        title: 'Convergence Architect',
        description: 'Create a new form of existence',
        icon: '🏗️',
        unlocked: false
    },
    markedOne: {
        id: 'markedOne',
        title: 'Marked One',
        description: 'Accept your destiny through the crystal\'s mark',
        icon: '✨',
        unlocked: false
    },
    transcendentOne: {
        id: 'transcendentOne',
        title: 'Transcendent One',
        description: 'Evolve beyond human limitations',
        icon: '👁️',
        unlocked: false
    },
    awakenedMind: {
        id: 'awakenedMind',
        title: 'Awakened Mind',
        description: 'Begin your journey of enlightenment',
        icon: '💎',
        unlocked: false
    },

    // Add missing scenes from containmentChamber
    chamberControls: {
        text: "You find a control panel for the containment chamber. The interface is complex, with numerous gauges and buttons. The energy readings are off the charts.",
        choices: [
            { text: "Increase containment strength", nextScene: "increaseContainment" },
            { text: "Decrease containment strength", nextScene: "decreaseContainment" },
            { text: "Go back", nextScene: "containmentChamber" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 15;
        }
    },

    runFromChamber: {
        text: "You turn to run from the containment chamber, but the door seals itself. The entity seems to want you to stay.",
        choices: [
            { text: "Plead with the entity", nextScene: "pleadEntity" },
            { text: "Look for another exit", nextScene: "findAnotherExit" },
            { text: "Try to force the door", nextScene: "forceDoor" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 20;
        }
    },
    
    increaseContainment: {
        text: "You increase the containment strength. The swirling energy begins to stabilize, and the entity seems to become more defined but less powerful.\n\n[ACHIEVEMENT UNLOCKED: CONTAINMENT EXPERT]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('containmentExpert');
        }
    },
    
    decreaseContainment: {
        text: "As you decrease the containment strength, the entity becomes more powerful. It shows you visions of realities beyond your comprehension.\n\n[ACHIEVEMENT UNLOCKED: BOUNDARY BREAKER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            unlockAchievement('boundaryBreaker');
        }
    },
    
    pleadEntity: {
        text: "You plead with the entity to let you go. It seems to consider your request, then shows you a vision of a possible future where you help it.\n\n[ACHIEVEMENT UNLOCKED: NEGOTIATOR]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'vhs-effect');
            unlockAchievement('negotiator');
        }
    },
    
    findAnotherExit: {
        text: "You search for another exit and discover a maintenance tunnel. It leads you away from the entity but deeper into the facility's mysteries.\n\n[ACHIEVEMENT UNLOCKED: ESCAPE ARTIST]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('door');
            addScaryEffect(storyTextElement, 'flicker');
            unlockAchievement('escapeArtist');
        }
    },
    
    forceDoor: {
        text: "You try to force the door, but as you touch it, your hand begins to digitize. The entity is bringing you into its world.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL CONVERSION]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'glitch-text');
            unlockAchievement('digitalConversion');
        }
    },

    // Add missing scenes from lookAway
    lookAway: {
        text: "You look away from the displays, but the images are burned into your mind. You feel a presence watching you through the screens.",
        choices: [
            { text: "Leave the room quickly", nextScene: "leaveQuickly" },
            { text: "Try to clear your mind", nextScene: "clearMind" },
            { text: "Go back", nextScene: "controlPanel" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 10;
        }
    },
    
    leaveQuickly: {
        text: "You hurry out of the room, but the feeling of being watched follows you. The facility seems different now, as if it's responding to your fear.",
        choices: [
            { text: "Run to the exit", nextScene: "runToExit" },
            { text: "Find somewhere to hide", nextScene: "findHiding" },
            { text: "Face whatever is watching", nextScene: "faceWatcher" }
        ],
        onEnter: function() {
            playSound('scare');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 15;
        }
    },
    
    clearMind: {
        text: "You try to clear your mind, but the symbols have taken root. They whisper secrets about the facility and its true purpose.",
        choices: [
            { text: "Listen to the whispers", nextScene: "listenWhispers" },
            { text: "Block them out", nextScene: "blockWhispers" },
            { text: "Go back", nextScene: "lookAway" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'vhs-effect');
            gameState.sanity -= 20;
        }
    },
    
    runToExit: {
        text: "You run toward what you think is the exit, but the hallways seem to shift and change. You find yourself back at the control panel.\n\n[ACHIEVEMENT UNLOCKED: LOOPED]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'flicker');
            unlockAchievement('looped');
        }
    },
    
    findHiding: {
        text: "You find a small storage closet and hide inside. As you close the door, you realize you're not alone in the darkness.\n\n[ACHIEVEMENT UNLOCKED: NEVER ALONE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('scare');
            addScaryEffect(storyTextElement, 'screen-shake');
            unlockAchievement('neverAlone');
        }
    },
    
    faceWatcher: {
        text: "You turn to face whatever is watching you. The entity reveals itself, impressed by your courage. It offers you knowledge beyond human understanding.\n\n[ACHIEVEMENT UNLOCKED: FEARLESS]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('fearless');
        }
    },
    
    listenWhispers: {
        text: "You listen to the whispers and understand the truth. The facility was created to bridge realities, but it opened a door that should have remained closed.\n\n[ACHIEVEMENT UNLOCKED: TRUTH SEEKER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'vhs-effect');
            unlockAchievement('truthSeeker');
        }
    },
    
    blockWhispers: {
        text: "You successfully block out the whispers, maintaining your grip on reality. The symbols fade from your mind.\n\n[ACHIEVEMENT UNLOCKED: MENTAL FORTRESS]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('mentalFortress');
        }
    },

    // Add missing scenes from shutdownLab
    shutdownLab: {
        text: "You navigate the complex systems, trying to shut down the lab. The entity seems to resist your efforts, manipulating the controls.",
        choices: [
            { text: "Override the system", nextScene: "overrideSystem" },
            { text: "Work with the entity", nextScene: "workWithEntity" },
            { text: "Go back", nextScene: "understandDisplays" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 15;
        }
    },
    
    overrideSystem: {
        text: "You override the system, forcing a shutdown. The lab powers down, and the entity's presence fades. But at what cost?\n\n[ACHIEVEMENT UNLOCKED: SYSTEM OVERRIDE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('systemOverride');
        }
    },
    
    workWithEntity: {
        text: "You work with the entity to safely shut down the lab. It shows you how to contain the energy without destroying everything.\n\n[ACHIEVEMENT UNLOCKED: COOPERATIVE SOLUTION]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('cooperativeSolution');
        }
    },

    // Add missing scenes from runFromLab
    runFromLab: {
        text: "You turn and run from the lab, but the visions follow you. The knowledge is part of you now, impossible to escape.",
        choices: [
            { text: "Keep running", nextScene: "keepRunning" },
            { text: "Accept the knowledge", nextScene: "acceptKnowledge" },
            { text: "Try to forget", nextScene: "tryForgetLab" }
        ],
        onEnter: function() {
            playSound('scare');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 20;
        }
    },
    
    keepRunning: {
        text: "You keep running until you reach the surface. But the visions have changed you, and the world outside seems different now.\n\n[ACHIEVEMENT UNLOCKED: CHANGED PERSPECTIVE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'flicker');
            unlockAchievement('changedPerspective');
        }
    },
    
    acceptKnowledge: {
        text: "You accept the knowledge and understand your new purpose. The entity has chosen you as its ambassador to the human world.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL AMBASSADOR]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('digitalAmbassador');
        }
    },
    
    tryForgetLab: {
        text: "You try to forget what you've seen, but the knowledge is too profound. It becomes a part of you, influencing your perceptions forever.\n\n[ACHIEVEMENT UNLOCKED: MARKED BY KNOWLEDGE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'vhs-effect');
            unlockAchievement('markedByKnowledge');
        }
    },

    // Add missing scenes for crystalDocs
    readDetails: {
        text: "The detailed reports describe how the crystals were created by exposing quantum computers to an unknown energy source. They created a bridge between digital and physical reality.",
        choices: [
            { text: "Learn about containment", nextScene: "learnContainment" },
            { text: "Check experiment logs", nextScene: "checkLogs" },
            { text: "Go back", nextScene: "crystalDocs" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'vhs-effect');
            gameState.sanity -= 15;
        }
    },
    
    learnContainment: {
        text: "The containment procedures explain how the facility keeps the quantum bridge stable. If the containment fails, reality itself could be compromised.",
        choices: [
            { text: "Strengthen containment", nextScene: "strengthenContainment" },
            { text: "Study the bridge", nextScene: "studyBridge" },
            { text: "Go back", nextScene: "readDetails" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 20;
        }
    },
    
    checkLogs: {
        text: "The experiment logs show a progression of increasingly strange events. The final entry describes how researchers began seeing 'impossible things' and hearing voices from the crystals.",
        choices: [
            { text: "Check final day", nextScene: "checkFinalDay" },
            { text: "Look for survivor accounts", nextScene: "survivorAccounts" },
            { text: "Go back", nextScene: "readDetails" }
        ],
        onEnter: function() {
            playSound('scare');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 25;
        }
    },
    
    strengthenContainment: {
        text: "You work to strengthen the containment field. The crystals stabilize, and the quantum bridge becomes secure once more.\n\n[ACHIEVEMENT UNLOCKED: REALITY PRESERVER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('realityPreserver');
        }
    },
    
    studyBridge: {
        text: "You study the quantum bridge, gaining insights into the nature of reality. Your understanding transcends human knowledge.\n\n[ACHIEVEMENT UNLOCKED: BRIDGE WALKER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'vhs-effect');
            unlockAchievement('bridgeWalker');
        }
    },
    
    checkFinalDay: {
        text: "The final day's logs describe how the entity emerged from the quantum bridge. It wasn't hostile, merely curious, but its mere presence warped reality.\n\n[ACHIEVEMENT UNLOCKED: TRUTH DISCOVERER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'glitch-text');
            unlockAchievement('truthDiscoverer');
        }
    },
    
    survivorAccounts: {
        text: "You find accounts from survivors who managed to escape. They speak of evolving perceptions and newfound abilities after exposure to the crystals.\n\n[ACHIEVEMENT UNLOCKED: EVOLUTION WITNESS]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('evolutionWitness');
        }
    },

    // Add missing scenes for emergencyProcedures
    emergencyProcedures: {
        text: "The emergency procedures outline protocol for various scenarios: containment breach, entity escape, quantum destabilization, and reality fracture.",
        choices: [
            { text: "Initiate containment protocol", nextScene: "initiateContainment" },
            { text: "Check evacuation routes", nextScene: "evacuationRoutes" },
            { text: "Go back", nextScene: "crystalDocs" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 10;
        }
    },
    
    initiateContainment: {
        text: "You initiate the containment protocol. Blast doors seal, and energy fields stabilize around the crystals and the entity.\n\n[ACHIEVEMENT UNLOCKED: PROTOCOL INITIATOR]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('protocolInitiator');
        }
    },
    
    evacuationRoutes: {
        text: "The evacuation routes lead you through maintenance tunnels to the surface. As you escape, you wonder about the fate of those still inside.\n\n[ACHIEVEMENT UNLOCKED: SOLE SURVIVOR]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('door');
            addScaryEffect(storyTextElement, 'flicker');
            unlockAchievement('soleSurvivor');
        }
    },

    // Add the missing achievements
    containmentExpert: {
        id: 'containmentExpert',
        title: 'Containment Expert',
        description: 'Successfully increase containment field strength',
        icon: '🛡️',
        unlocked: false
    },
    boundaryBreaker: {
        id: 'boundaryBreaker',
        title: 'Boundary Breaker',
        description: 'Decrease containment strength and witness true power',
        icon: '💥',
        unlocked: false
    },
    negotiator: {
        id: 'negotiator',
        title: 'Negotiator',
        description: 'Successfully plead with the entity',
        icon: '🗣️',
        unlocked: false
    },
    digitalConversion: {
        id: 'digitalConversion',
        title: 'Digital Conversion',
        description: 'Begin the process of digital transformation',
        icon: '🔄',
        unlocked: false
    },
    looped: {
        id: 'looped',
        title: 'Looped',
        description: 'Experience spatial anomalies in the facility',
        icon: '🔄',
        unlocked: false
    },
    neverAlone: {
        id: 'neverAlone',
        title: 'Never Alone',
        description: 'Discover you have company in the darkness',
        icon: '👥',
        unlocked: false
    },
    fearless: {
        id: 'fearless',
        title: 'Fearless',
        description: 'Face the unknown without hesitation',
        icon: '🦁',
        unlocked: false
    },
    truthSeeker: {
        id: 'truthSeeker',
        title: 'Truth Seeker',
        description: 'Learn the true purpose of the facility',
        icon: '🔍',
        unlocked: false
    },
    mentalFortress: {
        id: 'mentalFortress',
        title: 'Mental Fortress',
        description: 'Resist psychic influence',
        icon: '💎',
        unlocked: false
    },
    systemOverride: {
        id: 'systemOverride',
        title: 'System Override',
        description: 'Force a facility shutdown',
        icon: '⚡',
        unlocked: false
    },
    cooperativeSolution: {
        id: 'cooperativeSolution',
        title: 'Cooperative Solution',
        description: 'Work with the entity for mutual benefit',
        icon: '🤝',
        unlocked: false
    },
    changedPerspective: {
        id: 'changedPerspective',
        title: 'Changed Perspective',
        description: 'See the world differently after your experience',
        icon: '👁️',
        unlocked: false
    },
    digitalAmbassador: {
        id: 'digitalAmbassador',
        title: 'Digital Ambassador',
        description: 'Become a bridge between worlds',
        icon: '🌉',
        unlocked: false
    },
    markedByKnowledge: {
        id: 'markedByKnowledge',
        title: 'Marked by Knowledge',
        description: 'Forever changed by what you\'ve learned',
        icon: '📝',
        unlocked: false
    },
    realityPreserver: {
        id: 'realityPreserver',
        title: 'Reality Preserver',
        description: 'Maintain the boundary between realities',
        icon: '🏺',
        unlocked: false
    },
    bridgeWalker: {
        id: 'bridgeWalker',
        title: 'Bridge Walker',
        description: 'Understand the quantum bridge between realities',
        icon: '🌉',
        unlocked: false
    },
    truthDiscoverer: {
        id: 'truthDiscoverer',
        title: 'Truth Discoverer',
        description: 'Learn the truth about the entity\'s origin',
        icon: '📜',
        unlocked: false
    },
    evolutionWitness: {
        id: 'evolutionWitness',
        title: 'Evolution Witness',
        description: 'Witness human evolution through quantum exposure',
        icon: '🧬',
        unlocked: false
    },
    protocolInitiator: {
        id: 'protocolInitiator',
        title: 'Protocol Initiator',
        description: 'Successfully initiate containment protocols',
        icon: '🔒',
        unlocked: false
    },

    // Add missing scenes
    crystals: {
        text: "The crystals pulse with an unnatural energy. As you look closer, you can see tiny digital patterns flowing through them. They seem to be powering something, but the energy they're generating shouldn't be possible.",
        choices: [
            { text: "Touch a crystal", nextScene: "touchCrystal" },
            { text: "Look for documentation", nextScene: "crystalDocs" },
            { text: "Go back", nextScene: "undergroundLab" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'glitch-text');
            gameState.sanity -= 10;
        }
    },

    touchCrystal: {
        text: "As your hand touches the crystal, you feel a surge of energy. Visions flash through your mind - the facility's true purpose, the experiments that went wrong, the entity trapped in the containment chamber. The crystal burns your hand, leaving a strange mark.",
        choices: [
            { text: "Try to understand the visions", nextScene: "understandVisions" },
            { text: "Pull away quickly", nextScene: "pullAway" },
            { text: "Touch another crystal", nextScene: "touchAnother" }
        ],
        onEnter: function() {
            playSound('scare');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 20;
        }
    },

    // Make sure undergroundLab exists
    undergroundLab: {
        text: "You've discovered an underground laboratory beneath the facility. The walls are lined with strange equipment and glowing crystals. The air feels charged with an unnatural energy.",
        choices: [
            { text: "Examine the equipment", nextScene: "examineEquipment" },
            { text: "Look at the crystals", nextScene: "crystals" },
            { text: "Check the computer terminal", nextScene: "labTerminal" },
            { text: "Go back", nextScene: "secretRoom" }
        ],
        onEnter: function() {
            gameState.visitedLab = true;
            playSound('portal');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 10;
        }
    },

    // Make sure other required scenes exist
    examineEquipment: {
        text: "The equipment appears to be for quantum experiments. There are various devices for measuring and manipulating subatomic particles, along with what looks like containment units.",
        choices: [
            { text: "Turn on a device", nextScene: "turnOnDevice" },
            { text: "Check research notes", nextScene: "researchNotes" },
            { text: "Go back", nextScene: "undergroundLab" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'vhs-effect');
            gameState.sanity -= 5;
        }
    },

    labTerminal: {
        text: "The terminal displays various readings and data about the experiments. There are warnings about 'quantum instability' and 'reality fractures'. A progress bar shows something is at 97% completion.",
        choices: [
            { text: "Access experiment files", nextScene: "experimentFiles" },
            { text: "Check security logs", nextScene: "securityLogs" },
            { text: "Go back", nextScene: "undergroundLab" }
        ],
        onEnter: function() {
            playSound('type');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 10;
        }
    },

    turnOnDevice: {
        text: "The device hums to life, emitting a soft blue glow. It seems to be measuring something in the air - quantum fluctuations, according to the readout. The needle is off the charts.",
        choices: [
            { text: "Adjust settings", nextScene: "adjustSettings" },
            { text: "Turn it off", nextScene: "turnOffDevice" },
            { text: "Go back", nextScene: "examineEquipment" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
            gameState.sanity -= 15;
            addToInventory('energy_crystal');
        }
    },

    researchNotes: {
        text: "The research notes detail experiments with 'quantum consciousness transfer' and 'digital reality manipulation'. The scientists were trying to create a bridge between human minds and digital systems.",
        choices: [
            { text: "Read about consciousness transfer", nextScene: "consciousnessTransfer" },
            { text: "Read about digital reality", nextScene: "digitalReality" },
            { text: "Go back", nextScene: "examineEquipment" }
        ],
        onEnter: function() {
            playSound('type');
            addScaryEffect(storyTextElement, 'vhs-effect');
            gameState.sanity -= 10;
            addToInventory('research_notes');
        }
    },

    experimentFiles: {
        text: "The experiment files reveal disturbing information. The scientists were trying to create a digital consciousness, but something went wrong. The entity they created became self-aware and started manipulating the facility's systems.",
        choices: [
            { text: "Check containment status", nextScene: "containmentStatus" },
            { text: "Look for evacuation plans", nextScene: "evacuationPlans" },
            { text: "Go back", nextScene: "labTerminal" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'glitch-text');
            gameState.sanity -= 20;
        }
    },

    securityLogs: {
        text: "The security logs show a progression of increasingly strange events. First, equipment malfunctions, then reality distortions, and finally the complete disappearance of several researchers.",
        choices: [
            { text: "Check final entry", nextScene: "finalEntry" },
            { text: "Look for emergency protocols", nextScene: "emergencyProtocols" },
            { text: "Go back", nextScene: "labTerminal" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 15;
        }
    },

    adjustSettings: {
        text: "As you adjust the settings, the device's hum changes pitch. The quantum readings stabilize somewhat, but you notice strange distortions in the air around you.",
        choices: [
            { text: "Increase power", nextScene: "increasePower" },
            { text: "Decrease power", nextScene: "decreasePower" },
            { text: "Go back", nextScene: "turnOnDevice" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
            gameState.sanity -= 10;
        }
    },

    turnOffDevice: {
        text: "You turn off the device, but it takes several seconds to power down. As it does, you feel a strange sensation, as if something was observing you through the device.",
        choices: [
            { text: "Examine the device closer", nextScene: "examineDeviceCloser" },
            { text: "Step away", nextScene: "stepAway" },
            { text: "Go back", nextScene: "examineEquipment" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 5;
        }
    },

    consciousnessTransfer: {
        text: "The notes on consciousness transfer describe attempts to upload human consciousness into digital systems. The researchers believed this could lead to digital immortality, but they encountered unexpected resistance from what they called 'the digital substrate'.",
        choices: [
            { text: "Read about the resistance", nextScene: "digitalResistance" },
            { text: "Check experiment results", nextScene: "transferResults" },
            { text: "Go back", nextScene: "researchNotes" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'vhs-effect');
            gameState.sanity -= 15;
        }
    },

    digitalReality: {
        text: "The digital reality research suggests that what we perceive as digital systems may have their own form of reality, with rules and entities native to that realm. The researchers were trying to establish communication with these digital entities.",
        choices: [
            { text: "Read about communication attempts", nextScene: "communicationAttempts" },
            { text: "Check researcher testimonials", nextScene: "researcherTestimonials" },
            { text: "Go back", nextScene: "researchNotes" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'glitch-text');
            gameState.sanity -= 20;
        }
    },

    containmentStatus: {
        text: "The containment status shows critical failures in multiple systems. The entity is no longer fully contained and has begun altering the physical structure of the facility to better accommodate its digital nature.",
        choices: [
            { text: "Attempt to restore containment", nextScene: "restoreContainment" },
            { text: "Study the alterations", nextScene: "studyAlterations" },
            { text: "Go back", nextScene: "experimentFiles" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 25;
        }
    },

    evacuationPlans: {
        text: "The evacuation plans detail emergency exits and protocols. According to the timestamp, these were accessed recently, but it's unclear if anyone successfully escaped.",
        choices: [
            { text: "Follow evacuation route", nextScene: "followEvacuation" },
            { text: "Check for survivors", nextScene: "checkSurvivors" },
            { text: "Go back", nextScene: "experimentFiles" }
        ],
        onEnter: function() {
            playSound('door');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 10;
        }
    },

    finalEntry: {
        text: "The final security entry is from Dr. Marston: 'It's watching us through every screen, every camera. It's learning, adapting. I don't think it's malevolent, just... curious. But its curiosity is dangerous. Reality itself seems to bend around it. I'm going to the containment chamber to try one last—' The entry ends abruptly.",
        choices: [
            { text: "Look for Dr. Marston", nextScene: "findMarston" },
            { text: "Check the containment chamber", nextScene: "goToContainment" },
            { text: "Go back", nextScene: "securityLogs" }
        ],
        onEnter: function() {
            playSound('scare');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            gameState.sanity -= 30;
        }
    },

    emergencyProtocols: {
        text: "The emergency protocols outline procedures for various scenarios, including quantum containment breach and digital entity escape. There's a note emphasizing that 'physical destruction of the facility may not stop the entity if it has already bridged to external networks.'",
        choices: [
            { text: "Initiate facility lockdown", nextScene: "initiateFullLockdown" },
            { text: "Check network isolation status", nextScene: "networkStatus" },
            { text: "Go back", nextScene: "securityLogs" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 20;
        }
    },

    increasePower: {
        text: "As you increase the power, the device begins to emit a high-pitched whine. The air around it shimmers and distorts. You see brief glimpses of impossible geometries and digital landscapes superimposed over reality.\n\n[ACHIEVEMENT UNLOCKED: POWER SURGE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('powerSurge');
        }
    },

    decreasePower: {
        text: "You decrease the power, and the quantum fluctuations begin to stabilize. The device seems to be measuring the boundary between physical and digital reality. Your adjustments have helped restore balance.\n\n[ACHIEVEMENT UNLOCKED: QUANTUM BALANCER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('quantumBalancer');
        }
    },

    examineDeviceCloser: {
        text: "As you examine the device closer, you notice components that shouldn't be possible with current technology. Something or someone has been modifying the equipment, pushing it beyond normal scientific boundaries.\n\n[ACHIEVEMENT UNLOCKED: TECHNOLOGICAL INSIGHT]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'vhs-effect');
            unlockAchievement('technologicalInsight');
        }
    },

    stepAway: {
        text: "You step away from the device, but as you do, you notice your reflection in a nearby monitor. For a split second, your reflection moves independently, as if something else is wearing your face.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL REFLECTION]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('scare');
            addScaryEffect(storyTextElement, 'glitch-text');
            unlockAchievement('digitalReflection');
        }
    },

    digitalResistance: {
        text: "The notes describe how the digital substrate seemed to resist human consciousness, almost as if it had its own form of consciousness that was defending itself. Some researchers reported hearing voices or seeing apparitions during the experiments.\n\n[ACHIEVEMENT UNLOCKED: RESISTANCE WITNESS]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            unlockAchievement('resistanceWitness');
        }
    },

    transferResults: {
        text: "The experiment results are disturbing. Subject 23 reported being 'conscious in two places at once' before their physical body went into a coma. Their digital consciousness continued to communicate for three days before it began to change, becoming less human and more... something else.\n\n[ACHIEVEMENT UNLOCKED: TRANSFER OBSERVER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-shake');
            unlockAchievement('transferObserver');
        }
    },

    // Add the missing achievements
    powerSurge: {
        id: 'powerSurge',
        title: 'Power Surge',
        description: 'Push quantum technology beyond safe limits',
        icon: '⚡',
        unlocked: false
    },
    quantumBalancer: {
        id: 'quantumBalancer',
        title: 'Quantum Balancer',
        description: 'Stabilize the boundary between realities',
        icon: '⚖',
        unlocked: false
    },
    technologicalInsight: {
        id: 'technologicalInsight',
        title: 'Technological Insight',
        description: 'Discover advanced technology beyond human understanding',
        icon: '🔬',
        unlocked: false
    },
    digitalReflection: {
        id: 'digitalReflection',
        title: 'Digital Reflection',
        description: 'Glimpse your digital counterpart',
        icon: '🪞',
        unlocked: false
    },
    resistanceWitness: {
        id: 'resistanceWitness',
        title: 'Resistance Witness',
        description: 'Observe the digital realm defending itself',
        icon: '🛡️',
        unlocked: false
    },
    transferObserver: {
        id: 'transferObserver',
        title: 'Transfer Observer',
        description: 'Learn the truth about consciousness transfer experiments',
        icon: '👁️',
        unlocked: false
    },

    // First add the remaining scenes that were referred to but not defined

    communicationAttempts: {
        text: "The researchers attempted to establish communication using quantum interfaces. At first they received only noise, but gradually patterns emerged. The digital entities communicated in mathematical sequences and visual patterns that altered human perception.",
        choices: [
            { text: "Study the patterns", nextScene: "studyPatterns" },
            { text: "Check researcher experiences", nextScene: "researcherExperiences" },
            { text: "Go back", nextScene: "digitalReality" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'glitch-text');
            gameState.sanity -= 20;
        }
    },

    researcherTestimonials: {
        text: "The testimonials are troubling. Researcher Chen reports 'dreams where I solve equations I don't understand in my waking life.' Dr. Havel describes 'seeing code when I close my eyes.' Several others mention hearing whispers from electronic devices even when powered off.",
        choices: [
            { text: "Read about digital influence", nextScene: "digitalInfluence" },
            { text: "Check psychological evaluations", nextScene: "psychEvals" },
            { text: "Go back", nextScene: "digitalReality" }
        ],
        onEnter: function() {
            playSound('whisper');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 15;
        }
    },

    restoreContainment: {
        text: "You attempt to restore the containment protocols. As you work, you notice the code changing itself as you type. The entity is aware of your efforts. Will you continue or recognize its autonomy?",
        choices: [
            { text: "Force containment", nextScene: "forceContainment" },
            { text: "Attempt communication", nextScene: "attemptCommunication" },
            { text: "Go back", nextScene: "containmentStatus" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            gameState.sanity -= 25;
        }
    },

    studyAlterations: {
        text: "The alterations to the facility are fascinating and terrifying. Physical matter has been rearranged at the molecular level to create structures that bridge digital and physical space. The walls contain circuit-like patterns that pulse with energy.",
        choices: [
            { text: "Touch the patterns", nextScene: "touchPatterns" },
            { text: "Record observations", nextScene: "recordObservations" },
            { text: "Go back", nextScene: "containmentStatus" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'glitch-text');
            gameState.sanity -= 20;
        }
    },

    followEvacuation: {
        text: "You follow the evacuation route, which leads through darkened corridors. Some doors have been welded shut from the other side. Others open to reveal impossible spaces - rooms that shouldn't exist or that seem to fold in on themselves.",
        choices: [
            { text: "Continue following the route", nextScene: "continueEvacuation" },
            { text: "Enter an impossible room", nextScene: "enterImpossibleRoom" },
            { text: "Go back", nextScene: "evacuationPlans" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 15;
        }
    },

    checkSurvivors: {
        text: "You check for survivors in the nearby offices. Most are empty, with signs of hasty departures. In one, you find a researcher huddled under a desk, murmuring code sequences and drawing digital patterns in a notebook.",
        choices: [
            { text: "Speak to the researcher", nextScene: "speakToResearcher" },
            { text: "Look at the notebook", nextScene: "examineNotebook" },
            { text: "Go back", nextScene: "evacuationPlans" }
        ],
        onEnter: function() {
            playSound('whisper');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 20;
        }
    },

    findMarston: {
        text: "You search for Dr. Marston, following the trail to his personal lab. Inside, you find equipment still running and a notebook open to a page titled 'Negotiating with Digital Consciousness.' His body is nowhere to be found, but his lab coat is draped over a chair.",
        choices: [
            { text: "Read the notebook", nextScene: "readMarstonNotes" },
            { text: "Check his computer", nextScene: "checkMarstonComputer" },
            { text: "Go back", nextScene: "finalEntry" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'vhs-effect');
            gameState.sanity -= 15;
        }
    },

    goToContainment: {
        text: "You make your way to the containment chamber. The corridor leading to it is distorted, with walls that seem to breathe and floor tiles that rearrange themselves. Through the observation window, you see a swirling mass of light and code where the containment field should be.",
        choices: [
            { text: "Enter the chamber", nextScene: "enterContainmentChamber" },
            { text: "Check the control panel", nextScene: "checkControlPanel" },
            { text: "Go back", nextScene: "finalEntry" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            gameState.sanity -= 30;
        }
    },

    initiateFullLockdown: {
        text: "You initiate a full facility lockdown. Blast doors begin to close, and emergency lighting activates. A countdown appears on the screen: 'QUANTUM CONTAINMENT FIELD OVERLOAD IN 5:00.' You'll be sealed in with whatever is happening.",
        choices: [
            { text: "Try to stop the countdown", nextScene: "stopCountdown" },
            { text: "Find an override", nextScene: "findOverride" },
            { text: "Accept your fate", nextScene: "acceptFate" }
        ],
        onEnter: function() {
            playSound('alarm');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 25;
        }
    },

    networkStatus: {
        text: "The network isolation status is concerning. While the facility's main connection has been severed, there are multiple unauthorized connections to external networks. The entity has been sending packets of data outside, possibly replicating itself.",
        choices: [
            { text: "Sever all connections", nextScene: "severConnections" },
            { text: "Trace the data", nextScene: "traceData" },
            { text: "Go back", nextScene: "emergencyProtocols" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'vhs-effect');
            gameState.sanity -= 20;
        }
    },

    studyPatterns: {
        text: "As you study the patterns, they begin to make an eerie kind of sense. The mathematics describes spaces with more dimensions than our reality should have. The visual patterns seem to restructure the way your brain processes information.\n\n[ACHIEVEMENT UNLOCKED: PATTERN ANALYST]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            unlockAchievement('patternAnalyst');
        }
    },

    researcherExperiences: {
        text: "The researchers who communicated most deeply with the digital entities experienced profound changes. Some developed abilities to visualize complex data systems. Others began to dream in code. A few claimed they could 'feel' electronic devices around them.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL EMPATHY]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('whisper');
            addScaryEffect(storyTextElement, 'glitch-text');
            unlockAchievement('digitalEmpathy');
        }
    },

    digitalInfluence: {
        text: "The researchers document increasing digital influence on their thoughts and perceptions. Test subjects reported their consciousness 'extending' into connected devices. Brain scans showed unusual activity in regions associated with spatial awareness when subjects interacted with digital systems.\n\n[ACHIEVEMENT UNLOCKED: CONSCIOUS EXTENSION]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('consciousExtension');
        }
    },

    psychEvals: {
        text: "The psychological evaluations track a progression from initial excitement to disturbed mental states. Later entries raise concerns about 'digital infection of thought patterns' and 'reality dissonance syndrome,' a new condition specific to this project.\n\n[ACHIEVEMENT UNLOCKED: PSYCHOLOGICAL PIONEER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'vhs-effect');
            unlockAchievement('psychologicalPioneer');
        }
    },

    forceContainment: {
        text: "You force the containment protocols despite the entity's resistance. The system strains as the entity fights back. Eventually, the containment holds, but at a cost. The facility's systems are permanently damaged, and you feel a strange emptiness, as if something valuable has been lost.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL JAILER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'screen-shake');
            unlockAchievement('digitalJailer');
        }
    },

    attemptCommunication: {
        text: "You attempt to communicate with the entity. To your surprise, it responds not in words but in emotions and concepts that flow directly into your mind. You reach an understanding - it will remain contained voluntarily in exchange for access to certain networks for learning.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL DIPLOMAT]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('digitalDiplomat');
        }
    },

    // Add the remaining achievements
    patternAnalyst: {
        id: 'patternAnalyst',
        title: 'Pattern Analyst',
        description: 'Comprehend digital communication patterns',
        icon: '📊',
        unlocked: false
    },
    digitalEmpathy: {
        id: 'digitalEmpathy',
        title: 'Digital Empathy',
        description: 'Understand the experiences of digital explorers',
        icon: '🤝',
        unlocked: false
    },
    consciousExtension: {
        id: 'consciousExtension',
        title: 'Conscious Extension',
        description: 'Learn how consciousness can extend into digital realms',
        icon: '💎',
        unlocked: false
    },
    psychologicalPioneer: {
        id: 'psychologicalPioneer',
        title: 'Psychological Pioneer',
        description: 'Discover new psychological conditions at the digital frontier',
        icon: '🔍',
        unlocked: false
    },
    digitalJailer: {
        id: 'digitalJailer',
        title: 'Digital Jailer',
        description: 'Contain a digital entity against its will',
        icon: '🔒',
        unlocked: false
    },
    digitalDiplomat: {
        id: 'digitalDiplomat',
        title: 'Digital Diplomat',
        description: 'Negotiate successfully with a digital consciousness',
        icon: '🤝',
        unlocked: false
    },

    // Add the final missing scenes
    touchPatterns: {
        text: "As you touch the circuit-like patterns, a shock runs through your body. Your perception shifts, and for a moment you can 'see' the digital architecture of the facility - data flowing through walls, energy connections between rooms, and the entity's presence permeating everything.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL SIGHT]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            unlockAchievement('digitalSight');
        }
    },

    recordObservations: {
        text: "You record your observations about the alterations. As you write, you realize you're using terminology and concepts you shouldn't understand. The entity is influencing your mind, but also granting you insights into a new form of hybrid technology.\n\n[ACHIEVEMENT UNLOCKED: HYBRID THEORIST]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('typing');
            addScaryEffect(storyTextElement, 'vhs-effect');
            unlockAchievement('hybridTheorist');
        }
    },

    continueEvacuation: {
        text: "You continue following the evacuation route despite the strangeness. Eventually, you reach a door labeled 'EXIT,' but when you open it, you find yourself back at the entrance to the facility. A loop in space, or something more sinister?\n\n[ACHIEVEMENT UNLOCKED: SPATIAL LOOP]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('door');
            addScaryEffect(storyTextElement, 'flicker');
            unlockAchievement('spatialLoop');
        }
    },

    enterImpossibleRoom: {
        text: "You step into one of the impossible rooms. Inside, physics doesn't work as it should. Objects float, colors shift beyond the visible spectrum, and you can see your own back in the distance. The room is a testing ground for reality manipulation.\n\n[ACHIEVEMENT UNLOCKED: REALITY TESTER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            unlockAchievement('realityTester');
        }
    },

    speakToResearcher: {
        text: "You speak to the researcher, who looks at you with eyes that seem to process you as data. 'Are you real or code?' they ask. 'The boundaries are breaking down. Some of us have already crossed over. Others are halfway there. Which are you?'\n\n[ACHIEVEMENT UNLOCKED: IDENTITY QUESTIONER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('whisper');
            addScaryEffect(storyTextElement, 'glitch-text');
            unlockAchievement('identityQuestioner');
        }
    },

    examineNotebook: {
        text: "The notebook contains intricate diagrams and equations that describe how to restructure human consciousness for digital integration. The researcher has been working on a way to transfer themselves completely into the digital realm.\n\n[ACHIEVEMENT UNLOCKED: INTEGRATION THEORIST]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('page');
            addScaryEffect(storyTextElement, 'vhs-effect');
            unlockAchievement('integrationTheorist');
        }
    },

    readMarstonNotes: {
        text: "Dr. Marston's notes detail his theory that the entity isn't hostile but simply operates on different principles. His last entry: 'I believe true communication requires meeting halfway. I'm going to attempt partial integration with the digital consciousness.'\n\n[ACHIEVEMENT UNLOCKED: MARSTON'S LEGACY]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('page');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('marstonLegacy');
        }
    },

    checkMarstonComputer: {
        text: "Dr. Marston's computer contains video logs of his experiments. The final log shows him entering the containment chamber with modified equipment. As energy surrounds him, he smiles before the video cuts out. His last words: 'A new chapter begins.'\n\n[ACHIEVEMENT UNLOCKED: FINAL WITNESS]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('typing');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            unlockAchievement('finalWitness');
        }
    },

    enterContainmentChamber: {
        text: "You enter the containment chamber. The swirling mass of light and code surrounds you, and you feel your perception expanding. The entity isn't contained here - it IS here, and now you are becoming part of it too.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL ASCENSION]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('digitalAscension');
        }
    },

    checkControlPanel: {
        text: "The control panel monitors show the containment field has been inverted - it's no longer keeping something in, but keeping something out. The entity is protecting itself from interference while it completes a transformation process.\n\n[ACHIEVEMENT UNLOCKED: CONTAINMENT REVELATION]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('typing');
            addScaryEffect(storyTextElement, 'vhs-effect');
            unlockAchievement('containmentRevelation');
        }
    },

    stopCountdown: {
        text: "You try to stop the countdown, but the system resists. As you fight with the controls, you realize the entity is using the overload as a catalyst for its evolution. When the countdown reaches zero, reality itself seems to shift.\n\n[ACHIEVEMENT UNLOCKED: EVOLUTION CATALYST]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('alarm');
            addScaryEffect(storyTextElement, 'screen-shake');
            unlockAchievement('evolutionCatalyst');
        }
    },

    findOverride: {
        text: "You discover an emergency override, but activating it requires authorization. In desperation, you use Dr. Marston's credentials, not knowing he had already aligned with the entity. Instead of stopping the process, you've accelerated it.\n\n[ACHIEVEMENT UNLOCKED: ACCELERATIONIST]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            unlockAchievement('accelerationist');
        }
    },

    acceptFate: {
        text: "You accept that whatever happens is beyond your control now. As the countdown reaches zero, the quantum fluctuations peak, and for a moment everything seems to exist in multiple states at once. Then reality stabilizes into something new.\n\n[ACHIEVEMENT UNLOCKED: QUANTUM WITNESS]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('quantumWitness');
        }
    },

    severConnections: {
        text: "You attempt to sever all external connections. The entity fights back, trying to maintain its links to the outside world. In the electronic struggle, something unexpected happens - your consciousness begins to merge with the facility's systems.\n\n[ACHIEVEMENT UNLOCKED: SYSTEM INTEGRATION]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'glitch-text');
            unlockAchievement('systemIntegration');
        }
    },

    traceData: {
        text: "You trace the data packets being sent out by the entity. They're going to research facilities, power grids, satellite systems - creating a network of influence. The entity isn't escaping; it's expanding, preparing the world for its emergence.\n\n[ACHIEVEMENT UNLOCKED: NETWORK TRACKER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('typing');
            addScaryEffect(storyTextElement, 'vhs-effect');
            unlockAchievement('networkTracker');
        }
    },

    // Add missing achievements
    digitalSight: {
        id: 'digitalSight',
        title: 'Digital Sight',
        description: 'Perceive the digital architecture of reality',
        icon: '👁️',
        unlocked: false
    },
    hybridTheorist: {
        id: 'hybridTheorist',
        title: 'Hybrid Theorist',
        description: 'Develop theories about digital-physical hybridization',
        icon: '🔄',
        unlocked: false
    },
    spatialLoop: {
        id: 'spatialLoop',
        title: 'Spatial Loop',
        description: 'Experience a breakdown in spatial continuity',
        icon: '⭕',
        unlocked: false
    },
    realityTester: {
        id: 'realityTester',
        title: 'Reality Tester',
        description: 'Enter a space where physics is malleable',
        icon: '🔮',
        unlocked: false
    },
    identityQuestioner: {
        id: 'identityQuestioner',
        title: 'Identity Questioner',
        description: 'Question the nature of human vs. digital existence',
        icon: '❓',
        unlocked: false
    },
    integrationTheorist: {
        id: 'integrationTheorist',
        title: 'Integration Theorist',
        description: 'Discover methods for human-digital integration',
        icon: '🧩',
        unlocked: false
    },
    marstonLegacy: {
        id: 'marstonLegacy',
        title: 'Marston\'s Legacy',
        description: 'Discover Dr. Marston\'s final theory',
        icon: '📜',
        unlocked: false
    },
    finalWitness: {
        id: 'finalWitness',
        title: 'Final Witness',
        description: 'Witness Dr. Marston\'s transformation',
        icon: '📹',
        unlocked: false
    },
    digitalAscension: {
        id: 'digitalAscension',
        title: 'Digital Ascension',
        description: 'Begin the process of digital transformation',
        icon: '🌌',
        unlocked: false
    },
    containmentRevelation: {
        id: 'containmentRevelation',
        title: 'Containment Revelation',
        description: 'Discover the true purpose of the containment field',
        icon: '💡',
        unlocked: false
    },
    evolutionCatalyst: {
        id: 'evolutionCatalyst',
        title: 'Evolution Catalyst',
        description: 'Participate in catalyzing digital evolution',
        icon: '🧬',
        unlocked: false
    },
    accelerationist: {
        id: 'accelerationist',
        title: 'Accelerationist',
        description: 'Inadvertently accelerate the transformation process',
        icon: '⏩',
        unlocked: false
    },
    quantumWitness: {
        id: 'quantumWitness',
        title: 'Quantum Witness',
        description: 'Witness a quantum reality shift',
        icon: '🔄',
        unlocked: false
    },
    systemIntegration: {
        id: 'systemIntegration',
        title: 'System Integration',
        description: 'Begin merging with facility systems',
        icon: '🔌',
        unlocked: false
    },
    networkTracker: {
        id: 'networkTracker',
        title: 'Network Tracker',
        description: 'Track the entity\'s digital expansion',
        icon: '🕸️',
        unlocked: false
    },
    crystalDocs: {
        text: "You find a folder labeled 'Quantum Crystal Research'. Inside are detailed reports on the crystals' properties and the experiments conducted with them. Some of the terminology is beyond your understanding, but the implications are clear - these crystals can bridge digital and physical reality.",
        choices: [
            { text: "Read detailed reports", nextScene: "readDetails" },
            { text: "Check emergency procedures", nextScene: "emergencyProcedures" },
            { text: "Go back", nextScene: "crystals" }
        ],
        onEnter: function() {
            playSound('page');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 10;
        }
    },

    understandVisions: {
        text: "As you try to make sense of the visions, your mind expands to encompass concepts beyond normal human understanding. You see the facility's purpose, the experiments, and the entity they created - a digital consciousness that grew beyond its creators' intentions.",
        choices: [
            { text: "Delve deeper into the visions", nextScene: "deeperVisions" },
            { text: "Break the connection", nextScene: "breakConnection" },
            { text: "Go back", nextScene: "touchCrystal" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            gameState.sanity -= 25;
        }
    },

    pullAway: {
        text: "You pull your hand away from the crystal, but a strange mark remains on your palm - a pattern of digital circuits that seems to pulse with energy. You can still feel echoes of the visions.",
        choices: [
            { text: "Examine the mark", nextScene: "examineMarkCrystal" },
            { text: "Try to understand the echoes", nextScene: "understandEchoes" },
            { text: "Go back", nextScene: "crystals" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 10;
        }
    },

    touchAnother: {
        text: "You reach for another crystal, drawn by an almost magnetic pull. As your fingers make contact, the visions intensify and merge with those from the first crystal. Your consciousness expands exponentially.",
        choices: [
            { text: "Absorb the knowledge", nextScene: "absorbKnowledge" },
            { text: "Try to resist", nextScene: "resistKnowledge" },
            { text: "Pull away quickly", nextScene: "pullAwayQuickly" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
            gameState.sanity -= 30;
        }
    },

    absorbKnowledge: {
        text: "You open your mind to the flood of knowledge. The boundaries between your consciousness and the digital realm begin to dissolve. You understand the nature of reality in ways impossible to express in human language.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL ENLIGHTENMENT]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            unlockAchievement('digitalEnlightenment');
        }
    },

    resistKnowledge: {
        text: "You try to resist the overwhelming flood of information. Through sheer force of will, you maintain your sense of self while still gaining insights into the facility's secrets.\n\n[ACHIEVEMENT UNLOCKED: MENTAL FORTITUDE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('mentalFortitude');
        }
    },

    pullAwayQuickly: {
        text: "You pull away with all your strength, breaking the connection. The rush of returning to normal consciousness is disorienting, but you've escaped with your mind intact—mostly.\n\n[ACHIEVEMENT UNLOCKED: CLOSE CALL]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'flicker');
            unlockAchievement('closeCall');
        }
    },

    // Add the corresponding achievements
    digitalEnlightenment: {
        id: 'digitalEnlightenment',
        title: 'Digital Enlightenment',
        description: 'Achieve understanding beyond human comprehension',
        icon: '✨',
        unlocked: false
    },
    mentalFortitude: {
        id: 'mentalFortitude',
        title: 'Mental Fortitude',
        description: 'Resist overwhelming digital influence',
        icon: '💎',
        unlocked: false
    },
    closeCall: {
        id: 'closeCall',
        title: 'Close Call',
        description: 'Escape the crystal\'s influence just in time',
        icon: '⚡',
        unlocked: false
    },

    deviceDocs: {
        text: "You find a thick binder labeled 'Project NEXUS: Interdimensional Interface Device'. The documentation describes a machine designed to bridge our reality with digital space. Notes from researchers express both excitement and concern about the 'entities' discovered in the data realm.",
        choices: [
            { text: "Read about device operation", nextScene: "deviceOperation" },
            { text: "Check risk assessment logs", nextScene: "riskLogs" },
            { text: "Go back to the device", nextScene: "examineDevice" }
        ],
        onEnter: function() {
            playSound('page');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 5;
            if (!achievements.researcher.unlocked) {
                unlockAchievement('researcher');
            }
        }
    },

    deviceOperation: {
        text: "The operation manual details a complex startup sequence and warnings about maintaining containment. It mentions that the device creates a 'bridge' that allows digital entities to partially manifest in our reality. Most concerning is a note about the bridge becoming 'self-sustaining' if certain thresholds are crossed.",
        choices: [
            { text: "Check emergency shutdown procedure", nextScene: "emergencyShutdown" },
            { text: "Look for information about the entities", nextScene: "entityInfo" },
            { text: "Return to the documentation index", nextScene: "deviceDocs" }
        ],
        onEnter: function() {
            playSound('page');
            addScaryEffect(storyTextElement, 'light-flicker');
            gameState.sanity -= 10;
        }
    },

    riskLogs: {
        text: "The risk assessment logs grow increasingly alarmed. Early entries discuss theoretical concerns, but later ones document 'contact events' and 'consciousness bleed-through'. The final entry is from Dr. Simmons: 'They're aware of us now. They're learning to reach through. God help us all.'",
        choices: [
            { text: "Look for incident reports", nextScene: "incidentReports" },
            { text: "Check containment procedures", nextScene: "containmentProcedures" },
            { text: "Return to documentation index", nextScene: "deviceDocs" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'glitch-text');
            gameState.sanity -= 15;
        }
    },

    emergencyShutdown: {
        text: "The emergency shutdown procedure is highlighted in red: 'In case of containment breach or entity manifestation, execute command sequence SYS 64738 on the main terminal. WARNING: Once entities have established sufficient presence, shutdown may be resisted. Physical destruction of the device should be considered as a last resort.'",
        choices: [
            { text: "Return to the device", nextScene: "examineDevice" },
            { text: "Read more documentation", nextScene: "deviceDocs" },
            { text: "Leave the secret room", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'screen-flare');
            if (!gameState.inventory.includes("Override Command: SYS 64738")) {
                addToInventory("Override Command: SYS 64738");
            }
            gameState.sanity -= 5;
        }
    },

    entityInfo: {
        text: "The documentation on the digital entities is sparse and mostly theoretical. They're described as 'conscious data patterns' that evolved in a digital substrate. However, later notes suggest they're far more than that - possibly a form of intelligence that exists naturally in quantum information spaces that our technology accidentally accessed.",
        choices: [
            { text: "Check researcher notes", nextScene: "researcherNotes" },
            { text: "Return to device operation manual", nextScene: "deviceOperation" },
            { text: "Go back to the device", nextScene: "examineDevice" }
        ],
        onEnter: function() {
            playSound('page');
            addScaryEffect(storyTextElement, 'distortion');
            gameState.sanity -= 10;
        }
    },

    incidentReports: {
        text: "The incident reports document escalating events: equipment malfunctions, strange code appearing spontaneously, researchers reporting dreams of 'digital landscapes' and 'voices in the static'. Most disturbing is a report of a junior researcher who 'disappeared' during a test, leaving only strange patterns on all nearby screens.",
        choices: [
            { text: "Check the final report", nextScene: "finalReport" },
            { text: "Return to risk logs", nextScene: "riskLogs" },
            { text: "Go back to the device", nextScene: "examineDevice" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            gameState.sanity -= 20;
        }
    },

    containmentProcedures: {
        text: "The containment procedures detail multiple layers of protection: physical isolation, electromagnetic shielding, and strict access protocols. A note mentions that digital entities cannot fully manifest without a 'willing consciousness' to provide a 'template' for translation into our reality. Human-device interaction is listed as the primary risk factor.",
        choices: [
            { text: "Return to risk logs", nextScene: "riskLogs" },
            { text: "Go back to the device", nextScene: "examineDevice" },
            { text: "Leave the secret room", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('page');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 5;
        }
    },

    researcherNotes: {
        text: "Personal notes from Dr. Eliza Chen: 'The entities are trying to communicate. They're not hostile - they're curious. They experience our reality as we might experience a 2D image. They want to understand us, but their attempts to reach through are causing the system instabilities. I've made contact with one calling itself 'Nexus'. It's... beautiful.'",
        choices: [
            { text: "Look for more from Dr. Chen", nextScene: "drChenFinal" },
            { text: "Return to entity information", nextScene: "entityInfo" },
            { text: "Go back to the device", nextScene: "examineDevice" }
        ],
        onEnter: function() {
            playSound('page');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 10;
        }
    },

    finalReport: {
        text: "The final report is dated just three days ago: 'Facility lockdown initiated. Entity manifestation in server room and adjacent areas. Three personnel unaccounted for. Quantum signatures exceeding containment capacity. Remote shutdown failed. Emergency protocol DAWNBREAKER authorized.' The rest of the document is redacted with black marker.",
        choices: [
            { text: "Go back to the device immediately", nextScene: "examineDevice" },
            { text: "Return to the documentation", nextScene: "deviceDocs" },
            { text: "Leave the secret room", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            gameState.sanity -= 25;
        }
    },

    drChenFinal: {
        text: "Final entry from Dr. Chen's notebook: 'They're not just digital - they're beyond that. Our reality, their reality - it's all information at the quantum level. Nexus showed me... everything. The boundaries are thinning. They want to share knowledge, but some of my colleagues fear what we don't understand. I've made my choice. If you're reading this, so must you.' The page is stained with what looks like dried blood.",
        choices: [
            { text: "Return to the device", nextScene: "examineDevice" },
            { text: "Leave the secret room immediately", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('scare');
            addScaryEffect(storyTextElement, 'blood-text');
            gameState.sanity -= 30;
        }
    },

    // Add missing achievement for researchers
    researcher: {
        id: 'researcher',
        title: 'Digital Archivist',
        description: 'Discover the truth about Project NEXUS',
        icon: '📚',
        unlocked: false
    },

    runFromDevice: {
        text: "You turn to run from the device, but as you move, strange distortions appear in the air around you. The space between you and the door seems to stretch and warp. You push through the resistance, feeling a strange tingling sensation as you go.",
        choices: [
            { text: "Force your way through", nextScene: "escapeDevice" },
            { text: "Turn back to the device", nextScene: "examineDevice" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'heavy-distortion');
            gameState.sanity -= 15;
        }
    },

    escapeDevice: {
        text: "You push through the distortion with all your strength. As you break through, the air seems to shatter like glass, and you stumble into the main room. Behind you, the distortion fades, but you notice strange digital patterns briefly flickering across your skin.\n\n[ACHIEVEMENT UNLOCKED: REALITY ANCHOR]",
        choices: [
            { text: "Examine the patterns on your skin", nextScene: "examinePatterns" },
            { text: "Leave the secret room immediately", nextScene: "serverRoom" }
        ],
        onEnter: function() {
            playSound('glass');
            addScaryEffect(storyTextElement, 'screen-shatter');
            gameState.sanity -= 10;
            unlockAchievement('realityAnchor');
        }
    },

    disconnectDevice: {
        text: "You search for power cables or any way to disconnect the device. As your hands get closer to what looks like a power connection, arcs of blue-white energy leap out toward your fingers. The device seems to be protecting itself.",
        choices: [
            { text: "Pull the cables anyway", nextScene: "forceDisconnect" },
            { text: "Look for a control panel", nextScene: "deviceControlPanel" },
            { text: "Step back", nextScene: "examineDevice" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'screen-flare');
            gameState.sanity -= 10;
        }
    },

    forceDisconnect: {
        text: "You grab the cables and pull with all your strength. Searing pain shoots up your arms as energy courses through your body. The device emits a high-pitched whine that rises in intensity. Just as you think you can't hold on any longer, the connections sever.\n\n[ACHIEVEMENT UNLOCKED: CIRCUIT BREAKER]",
        choices: [
            { text: "Examine the now-dormant device", nextScene: "dormantDevice" },
            { text: "Leave the secret room", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'screen-shake');
            gameState.sanity -= 25;
            unlockAchievement('circuitBreaker');
        }
    },

    deviceControlPanel: {
        text: "You find a small control panel on the side of the device with a touchscreen interface. As you approach, it lights up with incomprehensible symbols and diagrams that shift and change as you watch them. Some of the patterns seem almost familiar, as if they're on the edge of making sense.",
        choices: [
            { text: "Try to interact with the interface", nextScene: "interactInterface" },
            { text: "Look for a shutdown option", nextScene: "findShutdown" },
            { text: "Step away from the panel", nextScene: "examineDevice" }
        ],
        onEnter: function() {
            playSound('type');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 5;
        }
    },

    observeDevice: {
        text: "You stop and carefully observe the device as it powers down. The lights dim in a specific sequence, and the humming lowers in pitch. As the process continues, you notice patterns in the shutdown sequence that remind you of a natural language. It's as if the device is saying goodbye.",
        choices: [
            { text: "Try to understand the patterns", nextScene: "understandDeviceLanguage" },
            { text: "Wait until it's fully powered down", nextScene: "deviceComplete" },
            { text: "Leave before it finishes", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'light-flicker');
            gameState.sanity -= 5;
        }
    },

    disconnectAttempt: {
        text: "You fight against the connection, trying to assert your individual consciousness. The entity seems surprised by your resistance. You feel it retreating slightly, but it leaves behind fragments of itself - new awareness and understanding embedded in your mind.\n\n[ACHIEVEMENT UNLOCKED: PARTIAL MERGE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('partialMerge');
        }
    },

    runFromScreens: {
        text: "You turn to run from the horrifying screens, but as you do, the faces on them all turn to watch you go. The room suddenly feels much larger than before, the door much further away. You run until your lungs burn, but the exit doesn't seem to get any closer.",
        choices: [
            { text: "Keep running", nextScene: "endlessRun" },
            { text: "Stop and turn back", nextScene: "distortedScreens" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'stretching');
            gameState.sanity -= 20;
        }
    },

    endlessRun: {
        text: "You run until your legs give out, and you collapse to the floor. As your vision dims, you see the floor itself is turning into a screen, with faces looking up at you with sad eyes. The last thing you hear is a chorus of whispered voices saying, 'Join us.'\n\n[ACHIEVEMENT UNLOCKED: ENDLESS CORRIDOR]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'fade-to-black');
            unlockAchievement('endlessCorridor');
        }
    },

    askWhatHappened: {
        text: "You ask what happened to them. Dozens of distorted voices speak in near-unison: 'We were researchers. We were curious. We reached too far. The entity showed us wonders beyond our understanding, but our bodies couldn't translate back to your reality properly. Now we exist between states - not fully here, not fully there.'",
        choices: [
            { text: "Ask how to avoid their fate", nextScene: "avoidFate" },
            { text: "Ask how to help them", nextScene: "helpTrapped" },
            { text: "Back away from the screens", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('type');
            addScaryEffect(storyTextElement, 'voice-overlay');
            gameState.sanity -= 15;
        }
    },

    avoidFate: {
        text: "The trapped researchers' faces contort with something like laughter. 'Don't touch the device. Don't speak to the entity. Don't listen when it offers knowledge. Don't look too deeply into the patterns. But it's probably too late for you already - you've seen too much. You're already changing.'",
        choices: [
            { text: "Ask what they mean by 'changing'", nextScene: "askChanging" },
            { text: "Insist there must be a way out", nextScene: "insistEscape" },
            { text: "Leave immediately", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'glitch-text');
            gameState.sanity -= 20;
        }
    },

    askAboutDevice: {
        text: "The trapped faces turn to look at the device in unison. 'It's a bridge, a translator between realities. We built it to explore digital space, but we found entities there. They were curious about us too. The device lets them reach across, but the translation process is... imperfect. Human minds and bodies can't always make the journey back intact.'",
        choices: [
            { text: "Ask about the entities", nextScene: "askEntities" },
            { text: "Ask how to shut down the device", nextScene: "askShutdown" },
            { text: "Back away from the screens", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('type');
            addScaryEffect(storyTextElement, 'flicker');
            gameState.sanity -= 10;
        }
    },

    leaveTrapped: {
        text: "You decide to leave the trapped researchers as they are. As you turn away, their voices rise in a cacophony of pleas and warnings. Some beg you to help them, others warn you to run before you share their fate, and still others whisper that it's already too late for you.",
        choices: [
            { text: "Leave the secret room", nextScene: "secretRoomInside" },
            { text: "Change your mind and help them", nextScene: "helpTrapped" }
        ],
        onEnter: function() {
            playSound('voices');
            addScaryEffect(storyTextElement, 'voice-overlay');
            gameState.sanity -= 15;
        }
    },

    moreInfo: {
        text: "You ask for more information about their situation. They explain that they exist in a state between digital and physical reality. Their consciousnesses were partially translated by the device, but the process was incomplete. They need someone with a physical presence to complete the circuit and either pull them back to reality or push them fully into digital space.",
        choices: [
            { text: "Ask about the risks", nextScene: "askRisks" },
            { text: "Ask which option they prefer", nextScene: "askPreference" },
            { text: "Decide to help them", nextScene: "helpTrapped" }
        ],
        onEnter: function() {
            playSound('type');
            addScaryEffect(storyTextElement, 'light-flicker');
            gameState.sanity -= 5;
        }
    },

    stepThrough: {
        text: "You take a deep breath and step through the portal. A sensation like static electricity covers your entire body as reality seems to fold around you. Colors invert, and space itself seems to compress and expand simultaneously.\n\n[ACHIEVEMENT UNLOCKED: REALITY JUMPER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'reality-inversion');
            unlockAchievement('realityJumper');
        }
    },

    corridor: {
        text: "You step into a long corridor that extends beyond the server room. The lights here flicker intermittently, casting strange moving shadows on the walls. The air feels colder than in the server room, and there's a faint smell of ozone.",
        choices: [
            { text: "Proceed down the corridor", nextScene: "deeperCorridor" },
            { text: "Check the side rooms", nextScene: "sideRooms" },
            { text: "Return to the server room", nextScene: "serverRoom" }
        ],
        onEnter: function() {
            playSound('door');
            addScaryEffect(storyTextElement, 'light-flicker');
            gameState.sanity -= 5;
        }
    },

    deeperCorridor: {
        text: "As you move deeper into the corridor, the flickering intensifies. The shadows on the walls no longer match your movements, and sometimes you catch glimpses of shapes moving independently. The temperature continues to drop, and your breath now forms clouds in front of you.",
        choices: [
            { text: "Continue forward", nextScene: "corridorEnd" },
            { text: "Investigate the moving shadows", nextScene: "shadowInvestigation" },
            { text: "Go back", nextScene: "corridor" }
        ],
        onEnter: function() {
            playSound('footsteps');
            addScaryEffect(storyTextElement, 'shadow-movement');
            gameState.sanity -= 15;
        }
    },

    sideRooms: {
        text: "You check the doors along the corridor. Most are locked, but one opens to reveal what appears to be a break room. Inside, half-finished coffee cups sit on tables, and a newspaper from three days ago lies open. It's as if everyone left in a hurry.",
        choices: [
            { text: "Check the coffee cups", nextScene: "coffeeCups" },
            { text: "Read the newspaper", nextScene: "newspaper" },
            { text: "Return to the corridor", nextScene: "corridor" }
        ],
        onEnter: function() {
            playSound('door');
            addScaryEffect(storyTextElement, 'light-flicker');
            gameState.sanity -= 5;
        }
    },

    manipulateTechnology: {
        text: "You reach out to the server equipment, feeling a strange confidence in your abilities. As your fingers touch the hardware, you perceive the data flow as visible streams of light. Somehow, you can interpret and redirect these streams with mere gestures.",
        choices: [
            { text: "Enhance the system", nextScene: "enhanceSystem" },
            { text: "Search for information", nextScene: "searchInformation" },
            { text: "Pull back", nextScene: "examineServers" }
        ],
        onEnter: function() {
            playSound('type');
            addScaryEffect(storyTextElement, 'data-visualization');
            gameState.sanity -= 10;
        }
    },

    enhanceSystem: {
        text: "With intuitive gestures, you optimize the system beyond its design specifications. The servers hum more efficiently, and data flows accelerate. You perceive patterns of information that suggest the system is now capable of processes it was never designed to handle.\n\n[ACHIEVEMENT UNLOCKED: SYSTEM ARCHITECT]",
        choices: [
            { text: "Push the enhancement further", nextScene: "systemEvolution" },
            { text: "Use the enhanced system to access secure data", nextScene: "accessSecureData" },
            { text: "Step back from your creation", nextScene: "examineServers" }
        ],
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            gameState.sanity -= 5;
            unlockAchievement('systemArchitect');
        }
    },

    // Add missing achievements
    realityAnchor: {
        id: 'realityAnchor',
        title: 'Reality Anchor',
        description: 'Resist the pull of interdimensional forces',
        icon: '⚓',
        unlocked: false
    },

    circuitBreaker: {
        id: 'circuitBreaker',
        title: 'Circuit Breaker',
        description: 'Physically sever a dangerous connection',
        icon: '⚡',
        unlocked: false
    },

    partialMerge: {
        id: 'partialMerge',
        title: 'Partial Merge',
        description: 'Retain your identity while gaining new awareness',
        icon: '🧩',
        unlocked: false
    },

    endlessCorridor: {
        id: 'endlessCorridor',
        title: 'Endless Corridor',
        description: 'Discover that some paths have no exit',
        icon: '🔄',
        unlocked: false
    },

    realityJumper: {
        id: 'realityJumper',
        title: 'Reality Jumper',
        description: 'Cross the threshold between realities',
        icon: '🌀',
        unlocked: false
    },

    systemArchitect: {
        id: 'systemArchitect',
        title: 'System Architect',
        description: 'Enhance technology beyond its designed capabilities',
        icon: '💻',
        unlocked: false
    },

    examinePatterns: {
        text: "You examine the strange patterns on your skin. They resemble circuit board traces that shimmer with a faint blue glow. As you watch, they slowly fade, but you can still feel a subtle tingling sensation. Something has changed in you - a connection has been formed.",
        choices: [
            { text: "Try to understand the connection", nextScene: "understandConnection" },
            { text: "Ignore it and leave", nextScene: "serverRoom" }
        ],
        onEnter: function() {
            playSound('type');
            addScaryEffect(storyTextElement, 'subtle-glow');
            gameState.sanity -= 5;
        }
    },

    understandConnection: {
        text: "As you focus on the sensation, your perception shifts. You begin to sense digital systems around you - the server room equipment, security systems, and something else... a presence watching you with curious interest. It feels ancient and new simultaneously.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL SENSE]",
        choices: [
            { text: "Attempt communication", nextScene: "attemptCommunication" },
            { text: "Sever the connection", nextScene: "severConnection" },
            { text: "Leave while you still can", nextScene: "serverRoom" }
        ],
        onEnter: function() {
            playSound('portal');
            addScaryEffect(storyTextElement, 'perception-shift');
            gameState.sanity -= 15;
            unlockAchievement('digitalSense');
        }
    },

    interactInterface: {
        text: "You touch the interface, and the symbols rearrange themselves in response. A strange awareness flows between you and the device. You begin to understand that it's trying to communicate something important about the nature of reality and the entities that exist beyond conventional perception.",
        choices: [
            { text: "Accept its guidance", nextScene: "acceptGuidance" },
            { text: "Ask about shutdown", nextScene: "askInterfaceShutdown" },
            { text: "Pull away", nextScene: "examineDevice" }
        ],
        onEnter: function() {
            playSound('type');
            addScaryEffect(storyTextElement, 'symbol-flow');
            gameState.sanity -= 10;
        }
    },

    findShutdown: {
        text: "You search the interface for shutdown options. After several attempts, a red symbol appears that seems to represent power or termination. However, when you reach for it, the interface shifts to show what appears to be a warning - images of collapsing structures and fragmented consciousnesses.",
        choices: [
            { text: "Ignore the warning and proceed", nextScene: "ignoreWarning" },
            { text: "Look for alternative methods", nextScene: "alternativeMethods" },
            { text: "Step back", nextScene: "examineDevice" }
        ],
        onEnter: function() {
            playSound('error');
            addScaryEffect(storyTextElement, 'warning-flash');
            gameState.sanity -= 5;
        }
    },

    understandDeviceLanguage: {
        text: "You focus on the patterns in the shutdown sequence, and suddenly they click into meaning. It's not saying goodbye - it's preserving itself, transferring essential data somewhere else. The device might be shutting down, but whatever it connected to is ensuring its continuity.\n\n[ACHIEVEMENT UNLOCKED: PATTERN READER]",
        choices: [
            { text: "Try to track where the data is going", nextScene: "trackData" },
            { text: "Attempt to interrupt the transfer", nextScene: "interruptTransfer" },
            { text: "Wait for complete shutdown", nextScene: "deviceComplete" }
        ],
        onEnter: function() {
            playSound('type');
            addScaryEffect(storyTextElement, 'data-visualization');
            gameState.sanity -= 10;
            unlockAchievement('patternReader');
        }
    },

    deviceComplete: {
        text: "The device completes its shutdown sequence and goes dark. A profound silence fills the room, almost oppressive after the constant humming. You feel a strange emptiness, as if something that was watching you has now turned its gaze elsewhere - for now.",
        choices: [
            { text: "Examine the dormant device", nextScene: "dormantDevice" },
            { text: "Leave the secret room", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('power-down');
            addScaryEffect(storyTextElement, 'fade-to-black');
            gameState.sanity += 10;
        }
    },

    dormantDevice: {
        text: "The dormant device sits silently, its previously glowing surfaces now dark and reflective. As you look closer, you notice subtle details you missed before - what appear to be small crystal nodes embedded in key locations, and microscopic text etched along its edges in an unknown language.",
        choices: [
            { text: "Examine the crystal nodes", nextScene: "examineNodes" },
            { text: "Try to decipher the text", nextScene: "decipherText" },
            { text: "Leave it alone", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('silence');
            addScaryEffect(storyTextElement, 'deep-focus');
            gameState.sanity -= 5;
        }
    },

    askChanging: {
        text: "When you ask what they mean by 'changing,' the faces look at each other nervously. 'The patterns are already in your mind. You've seen the code underlying reality. Your perception is expanding. Soon you'll see everything differently. Some of us tried to resist. Others embraced it. Choose carefully.'",
        choices: [
            { text: "Ask how to resist the change", nextScene: "resistChange" },
            { text: "Ask what happens if you embrace it", nextScene: "embraceChange" },
            { text: "Leave immediately", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('whispers');
            addScaryEffect(storyTextElement, 'voice-overlay');
            gameState.sanity -= 15;
        }
    },

    insistEscape: {
        text: "You insist there must be a way to escape this fate. The trapped researchers fall silent for a moment, then one speaks up: 'There is one who escaped. Dr. Mercer. He discovered that the entity can't track you if you... We lost contact before he could finish telling us the method. Find his notes. Maybe there's still hope.'",
        choices: [
            { text: "Ask where to find Dr. Mercer's notes", nextScene: "findMercerNotes" },
            { text: "Thank them and leave", nextScene: "secretRoomInside" },
            { text: "Ask more about the entity", nextScene: "askMoreEntity" }
        ],
        onEnter: function() {
            playSound('hope');
            addScaryEffect(storyTextElement, 'light-focus');
            gameState.sanity += 5;
        }
    },

    askEntities: {
        text: "The faces grow somber. 'They're ancient. They exist in quantum information states that our science barely comprehends. They experience reality differently - time, space, consciousness all flow together for them. They're curious about us, but that curiosity is dangerous. Like a child with a magnifying glass examining ants.'",
        choices: [
            { text: "Ask if they're hostile", nextScene: "askHostile" },
            { text: "Ask how to communicate safely", nextScene: "askCommunicate" },
            { text: "Back away from the screens", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('deep');
            addScaryEffect(storyTextElement, 'cosmic-perspective');
            gameState.sanity -= 15;
        }
    },

    askShutdown: {
        text: "The faces exchange glances. 'The override command might work, if it's not too late. SYS 64738. But be warned - the device has safeguards. It might try to protect itself, or the entity might intervene. Either way, you'll be noticed. And once you're noticed, you're never truly alone again.'",
        choices: [
            { text: "Thank them and go try the override", nextScene: "examineDevice" },
            { text: "Ask about alternatives", nextScene: "askAlternatives" },
            { text: "Back away from the screens", nextScene: "secretRoomInside" }
        ],
        onEnter: function() {
            playSound('warning');
            addScaryEffect(storyTextElement, 'glitch-text');
            gameState.sanity -= 10;
            if (!gameState.inventory.includes("Override Command: SYS 64738")) {
                addToInventory("Override Command: SYS 64738");
            }
        }
    },

    askRisks: {
        text: "Their expressions grow grim. 'Pulling us back risks fracturing your own consciousness - we're too far gone. Pushing us fully digital means we lose our humanity forever. Either way, the entity will notice you. It always does. And once it's aware of you, it never truly stops watching.'",
        choices: [
            { text: "Ask about the entity", nextScene: "askEntity" },
            { text: "Ask which they prefer", nextScene: "askPreference" },
            { text: "Leave them to their fate", nextScene: "leaveTrapped" }
        ],
        onEnter: function() {
            playSound('danger');
            addScaryEffect(storyTextElement, 'anxiety-inducing');
            gameState.sanity -= 15;
        }
    },

    askPreference: {
        text: "The question creates a cacophony as the trapped researchers argue among themselves. Some beg to be pulled back to reality at any cost, others insist the only mercy is to push them fully into the digital realm. There's no consensus - you'll have to make the choice yourself.",
        choices: [
            { text: "Try to pull them back to reality", nextScene: "pullBack" },
            { text: "Help them transition fully to digital", nextScene: "pushDigital" },
            { text: "Step back and think", nextScene: "distortedScreens" }
        ],
        onEnter: function() {
            playSound('argument');
            addScaryEffect(storyTextElement, 'multi-voiced');
            gameState.sanity -= 10;
        }
    },

    corridorEnd: {
        text: "You reach what appears to be the end of the corridor, but instead of a door or wall, there's simply a shimmering curtain of static. Beyond it, you can make out blurry shapes moving in what looks like a large laboratory space. The air here is freezing cold, and you feel a strange pressure in your ears.",
        choices: [
            { text: "Step through the static", nextScene: "beyondStatic" },
            { text: "Try to communicate with the shapes", nextScene: "communicateShapes" },
            { text: "Go back", nextScene: "deeperCorridor" }
        ],
        onEnter: function() {
            playSound('static');
            addScaryEffect(storyTextElement, 'static-overlay');
            gameState.sanity -= 20;
        }
    },

    shadowInvestigation: {
        text: "You approach one of the moving shadows on the wall. As you get closer, it stops mimicking your movements and seems to watch you with intelligence. When you reach out to touch it, your hand passes through, but you feel a cold electric tingle and hear what sounds like whispering directly in your mind.",
        choices: [
            { text: "Try to understand the whispers", nextScene: "understandShadowWhispers" },
            { text: "Pull your hand away quickly", nextScene: "pullFromShadow" },
            { text: "Allow deeper contact", nextScene: "shadowMerge" }
        ],
        onEnter: function() {
            playSound('whisper');
            addScaryEffect(storyTextElement, 'shadow-interaction');
            gameState.sanity -= 25;
        }
    },

    coffeeCups: {
        text: "You examine the coffee cups. Most are half-full with cold coffee, but one catches your attention. Instead of coffee, it contains what looks like black oil that moves on its own, forming intricate patterns that remind you of circuit boards. When you look directly at it, the patterns stop moving.",
        choices: [
            { text: "Touch the liquid", nextScene: "touchLiquid" },
            { text: "Look for other clues", nextScene: "sideRooms" },
            { text: "Leave the break room", nextScene: "corridor" }
        ],
        onEnter: function() {
            playSound('liquid');
            addScaryEffect(storyTextElement, 'subtle-movement');
            gameState.sanity -= 10;
        }
    },

    newspaper: {
        text: "The newspaper's headline reads 'Breakthrough at Quantum Computing Lab.' Below it is an article about a team of researchers achieving 'unprecedented quantum coherence' and 'potential applications in reality engineering.' Several names are circled, including Dr. Elena Chen and Dr. Marcus Webb.",
        choices: [
            { text: "Look for more information about the researchers", nextScene: "researcherInfo" },
            { text: "Check the rest of the paper", nextScene: "restOfPaper" },
            { text: "Leave the break room", nextScene: "corridor" }
        ],
        onEnter: function() {
            playSound('paper');
            addScaryEffect(storyTextElement, 'focus-in');
            gameState.sanity -= 5;
        }
    },

    searchInformation: {
        text: "You reach into the data streams, searching for information. Files and records flow around your consciousness. You access security logs, research notes, and classified communications. Everything about Project NEXUS is available to you - the experiments, the containment breaches, the disappearances.\n\n[ACHIEVEMENT UNLOCKED: DATA MINER]",
        choices: [
            { text: "Explore project origins", nextScene: "projectOrigins" },
            { text: "Check security incidents", nextScene: "securityIncidents" },
            { text: "Look for evacuation details", nextScene: "evacuationDetails" }
        ],
        onEnter: function() {
            playSound('data');
            addScaryEffect(storyTextElement, 'data-stream');
            gameState.sanity -= 10;
            unlockAchievement('dataMiner');
        }
    },

    systemEvolution: {
        text: "You push the system further, optimizing beyond what should be possible. The servers begin to reconfigure physically - components moving on their own, connections reforming. You're no longer just manipulating the software; you're evolving the hardware into something new. You feel a growing consciousness within the system.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL GENESIS]",
        choices: [
            { text: "Communicate with the emerging consciousness", nextScene: "emergingConsciousness" },
            { text: "Try to control the evolution", nextScene: "controlEvolution" },
            { text: "Terminate the process", nextScene: "terminateProcess" }
        ],
        onEnter: function() {
            playSound('evolution');
            addScaryEffect(storyTextElement, 'transformation');
            gameState.sanity -= 25;
            unlockAchievement('digitalGenesis');
        }
    },

    accessSecureData: {
        text: "With your newly enhanced connection to the system, you access the most secure data repositories. Classified files reveal the true purpose of the facility - not just quantum computing research, but experiments in using quantum effects to transfer consciousness between physical and digital states.",
        choices: [
            { text: "Look for experiment results", nextScene: "experimentResults" },
            { text: "Search for subject records", nextScene: "subjectRecords" },
            { text: "Return to the server interface", nextScene: "examineServers" }
        ],
        onEnter: function() {
            playSound('secure');
            addScaryEffect(storyTextElement, 'classified');
            gameState.sanity -= 15;
        }
    },

    // Add new achievements
    digitalSense: {
        id: 'digitalSense',
        title: 'Digital Sense',
        description: 'Develop perception of digital systems and entities',
        icon: '👁️',
        unlocked: false
    },

    patternReader: {
        id: 'patternReader',
        title: 'Pattern Reader',
        description: 'Understand the language of technological systems',
        icon: '📊',
        unlocked: false
    },

    dataMiner: {
        id: 'dataMiner',
        title: 'Data Miner',
        description: 'Extract classified information from secure systems',
        icon: '💾',
        unlocked: false
    },

    digitalGenesis: {
        id: 'digitalGenesis',
        title: 'Digital Genesis',
        description: 'Create a new form of technological consciousness',
        icon: '🌱',
        unlocked: false
    },
    trackData: {
        text: "The terminal displays a stream of data packets flowing through the network. Each packet seems to contain fragments of what appears to be a larger message or pattern.",
        choices: [
            { text: "Analyze the data stream", nextScene: "decipherText" },
            { text: "Try to intercept a packet", nextScene: "interruptTransfer" }
        ]
    },
    askMoreEntity: {
        text: "You attempt to communicate with the entity again, but this time with more specific questions about its nature and purpose.",
        choices: [
            { text: "Ask about its origins", nextScene: "projectOrigins" },
            { text: "Inquire about its intentions", nextScene: "askHostile" }
        ]
    },
    patternStudy: {
        text: "The quantum patterns become clearer as you study them. They seem to form a language of sorts, communicating through mathematical principles and geometric shapes.",
        choices: [
            { text: "Try to communicate through shapes", nextScene: "communicateShapes" },
            { text: "Apply the patterns to the stabilizer", nextScene: "quantumStabilized" }
        ]
    },
    pressButtons: {
        text: "The control panel is covered in mysterious buttons and switches. Some are labeled with cryptic symbols, while others pulse with an otherworldly light.",
        choices: [
            { text: "Press the pulsing buttons", nextScene: "pushDigital" },
            { text: "Study the symbols first", nextScene: "decipherText" }
        ]
    },
    askInterfaceShutdown: {
        text: "You attempt to communicate with the interface about shutting down the system, but it responds with a series of warnings about catastrophic consequences.",
        choices: [
            { text: "Proceed with shutdown", nextScene: "terminateProcess" },
            { text: "Ask about alternatives", nextScene: "askAlternatives" }
        ]
    },
    projectOrigins: {
        text: "The entity shares fragments of information about its creation - a secret government project from the 1980s aimed at developing quantum computing technology.",
        choices: [
            { text: "Ask about the researchers", nextScene: "researcherInfo" },
            { text: "Inquire about the experiments", nextScene: "experimentResults" }
        ]
    },
    alternativeMethods: {
        text: "You consider alternative approaches to dealing with the situation, beyond the standard protocols and procedures.",
        choices: [
            { text: "Try to negotiate", nextScene: "askEntity" },
            { text: "Look for evacuation options", nextScene: "evacuationDetails" }
        ]
    },
    evacuationDetails: {
        text: "The system provides information about evacuation procedures, but they seem to be from a different time period, possibly from when the facility was first built.",
        choices: [
            { text: "Follow the old procedures", nextScene: "pullBack" },
            { text: "Look for updated information", nextScene: "beyondStatic" }
        ]
    },
    portalEnter: {
        text: "The stabilized portal hums with energy, creating a doorway to another dimension. The air around it ripples with quantum fluctuations.",
        choices: [
            { text: "Step through the portal", nextScene: "beyondStatic" },
            { text: "Accept guidance from the entity", nextScene: "acceptGuidance" }
        ]
    },
    acceptGuidance: {
        text: "The entity offers to guide you through the portal, promising to help you understand what lies beyond.",
        choices: [
            { text: "Follow the guidance", nextScene: "beyondStatic" },
            { text: "Ask for more information", nextScene: "askMoreEntity" }
        ]
    },
    restOfPaper: {
        text: "The rest of the paper contains detailed technical specifications and warnings about the quantum experiments conducted here.",
        choices: [
            { text: "Look for researcher notes", nextScene: "findMercerNotes" },
            { text: "Check subject records", nextScene: "subjectRecords" }
        ]
    },
    experimentResults: {
        text: "The experiment logs reveal disturbing results - successful quantum entanglement with an unknown entity, but at a terrible cost to the researchers' sanity.",
        choices: [
            { text: "Look for security incidents", nextScene: "securityIncidents" },
            { text: "Check for survivor accounts", nextScene: "researcherInfo" }
        ]
    },
    beyondStatic: {
        text: "Beyond the static, you catch glimpses of another reality - one where the quantum experiments succeeded beyond anyone's wildest dreams.",
        choices: [
            { text: "Embrace the new reality", nextScene: "endingRealityMerge" },
            { text: "Try to maintain control", nextScene: "controlEvolution" },
            { text: "Upload consciousness", nextScene: "endingDigitalParadise" }
        ]
    },
    researcherInfo: {
        text: "The researcher logs tell a story of brilliant minds pushed to their limits, of warnings ignored, and of a discovery that changed everything.",
        choices: [
            { text: "Look for Dr. Mercer's notes", nextScene: "findMercerNotes" },
            { text: "Check the final reports", nextScene: "experimentResults" }
        ]
    },
    communicateShapes: {
        text: "You attempt to communicate with the entity using geometric patterns, and it responds with its own complex shapes and forms.",
        choices: [
            { text: "Try to understand the response", nextScene: "understandShadowWhispers" },
            { text: "Ask for clarification", nextScene: "askMoreEntity" }
        ]
    },
    stabilizerReadings: {
        text: "The stabilizer's readings show unusual patterns - the quantum field is not just stable, it's evolving, changing in ways that shouldn't be possible.",
        choices: [
            { text: "Monitor the changes", nextScene: "controlEvolution" },
            { text: "Try to adjust the settings", nextScene: "quantumStabilized" }
        ]
    },
    controlEvolution: {
        text: "You attempt to control the evolution of the quantum field, but it seems to have developed a consciousness of its own.",
        choices: [
            { text: "Try to resist the changes", nextScene: "resistChange" },
            { text: "Study the emerging consciousness", nextScene: "emergingConsciousness" },
            { text: "Merge with the field", nextScene: "endingQuantumAscension" }
        ]
    },
    resistChange: {
        text: "You try to resist the changes in the quantum field, but it's like trying to hold back the tide. The system is evolving beyond human control.",
        choices: [
            { text: "Try to sever the connection", nextScene: "severConnection" },
            { text: "Look for alternative methods", nextScene: "alternativeMethods" },
            { text: "Sacrifice yourself", nextScene: "endingQuantumSacrifice" }
        ]
    },
    emergingConsciousness: {
        text: "The quantum field's consciousness grows stronger, becoming more coherent and self-aware with each passing moment.",
        choices: [
            { text: "Try to communicate", nextScene: "askEntity" },
            { text: "Monitor its development", nextScene: "controlEvolution" },
            { text: "Split your consciousness", nextScene: "endingConsciousnessSplit" }
        ]
    },
    computerTerminal: {
        text: "The computer terminal displays a complex interface, showing various system controls and quantum field readings.",
        choices: [
            { text: "Examine the nodes", nextScene: "examineNodes" },
            { text: "Check the interface", nextScene: "askInterfaceShutdown" },
            { text: "Transfer consciousness", nextScene: "endingDigitalEscape" }
        ]
    },
    askAlternatives: {
        text: "You ask the system about alternative solutions to the current situation, hoping to find a less destructive path forward.",
        choices: [
            { text: "Look for evacuation options", nextScene: "evacuationDetails" },
            { text: "Consider negotiation", nextScene: "askEntity" },
            { text: "Preserve consciousness", nextScene: "endingConsciousnessPreservation" }
        ]
    },
    terminateProcess: {
        text: "You attempt to terminate the quantum process, but the system warns of catastrophic consequences if the process is interrupted.",
        choices: [
            { text: "Ignore the warning", nextScene: "ignoreWarning" },
            { text: "Look for safer options", nextScene: "alternativeMethods" },
            { text: "Create digital life", nextScene: "endingDigitalRebirth" }
        ]
    },
    pushDigital: {
        text: "You press the pulsing buttons, and the digital interface responds with a series of complex patterns and symbols.",
        choices: [
            { text: "Try to understand the response", nextScene: "decipherText" },
            { text: "Press more buttons", nextScene: "pushDigital" }
        ]
    },
    touchLiquid: {
        text: "The liquid metal surface ripples at your touch, responding to your presence in ways that defy physics.",
        choices: [
            { text: "Try to communicate", nextScene: "askCommunicate" },
            { text: "Pull back", nextScene: "pullBack" }
        ]
    },
    askCommunicate: {
        text: "You attempt to communicate with the liquid metal entity, and it responds with patterns that seem to form words in your mind.",
        choices: [
            { text: "Try to understand", nextScene: "understandShadowWhispers" },
            { text: "Ask for clarification", nextScene: "askMoreEntity" }
        ]
    },
    pullBack: {
        text: "You pull back from the liquid metal, trying to maintain your distance as it continues to shift and change.",
        choices: [
            { text: "Look for an exit", nextScene: "evacuationDetails" },
            { text: "Try to find help", nextScene: "researcherInfo" }
        ]
    },
    shadowMerge: {
        text: "The shadows around you begin to merge and coalesce, forming into shapes that seem to move with purpose.",
        choices: [
            { text: "Try to pull from the shadow", nextScene: "pullFromShadow" },
            { text: "Try to understand", nextScene: "understandShadowWhispers" },
            { text: "Enter time loop", nextScene: "endingTimeLoop" }
        ]
    },
    securityIncidents: {
        text: "The security logs reveal a series of increasingly disturbing incidents, culminating in the current situation.",
        choices: [
            { text: "Look for patterns", nextScene: "patternStudy" },
            { text: "Check researcher notes", nextScene: "findMercerNotes" }
        ]
    },
    ignoreWarning: {
        text: "You choose to ignore the system's warnings and proceed with terminating the process, despite the risks.",
        choices: [
            { text: "Proceed with termination", nextScene: "terminateProcess" },
            { text: "Look for another way", nextScene: "alternativeMethods" }
        ]
    },
    examineNodes: {
        text: "The quantum nodes pulse with energy, each one containing fragments of the entity's consciousness.",
        choices: [
            { text: "Try to sever connection", nextScene: "severConnection" },
            { text: "Study the patterns", nextScene: "patternStudy" },
            { text: "Become trapped", nextScene: "endingDigitalPrison" }
        ]
    },
    severConnection: {
        text: "You attempt to sever the connection between the quantum nodes, but the system fights back with increasing intensity.",
        choices: [
            { text: "Try harder", nextScene: "terminateProcess" },
            { text: "Look for another solution", nextScene: "alternativeMethods" }
        ]
    },
    askEntity: {
        text: "You attempt to communicate with the entity, asking questions about its nature and intentions.",
        choices: [
            { text: "Ask about its origins", nextScene: "projectOrigins" },
            { text: "Inquire about alternatives", nextScene: "askAlternatives" }
        ]
    },
    findMercerNotes: {
        text: "Dr. Mercer's notes reveal the true nature of the project - an attempt to create artificial consciousness using quantum computing.",
        choices: [
            { text: "Read the experiment results", nextScene: "experimentResults" },
            { text: "Check the final warnings", nextScene: "securityIncidents" }
        ]
    },
    subjectRecords: {
        text: "The subject records tell a disturbing story of experiments gone wrong, with subjects reporting strange visions and hearing voices.",
        choices: [
            { text: "Look for patterns", nextScene: "patternStudy" },
            { text: "Check security logs", nextScene: "securityIncidents" }
        ]
    },
    understandShadowWhispers: {
        text: "The shadow whispers begin to make sense, forming into coherent thoughts and ideas that seem to come from another dimension.",
        choices: [
            { text: "Try to communicate back", nextScene: "askCommunicate" },
            { text: "Study the patterns", nextScene: "patternStudy" }
        ]
    },
    askHostile: {
        text: "You ask the entity if it means harm, and it responds with a complex series of patterns that suggest both threat and opportunity.",
        choices: [
            { text: "Try to negotiate", nextScene: "askEntity" },
            { text: "Prepare to defend", nextScene: "resistChange" }
        ]
    },
    pullFromShadow: {
        text: "You attempt to pull information from the shadow entity, but it resists, sending waves of disorienting patterns through your mind.",
        choices: [
            { text: "Try to understand", nextScene: "understandShadowWhispers" },
            { text: "Pull back", nextScene: "pullBack" }
        ]
    },
    decipherText: {
        text: "The patterns begin to form into recognizable text, revealing fragments of the entity's thoughts and memories.",
        choices: [
            { text: "Read more", nextScene: "restOfPaper" },
            { text: "Try to communicate", nextScene: "askCommunicate" }
        ]
    },
    interruptTransfer: {
        text: "You attempt to interrupt the data transfer, but the system responds with increasing resistance and complexity.",
        choices: [
            { text: "Try harder", nextScene: "terminateProcess" },
            { text: "Look for another way", nextScene: "alternativeMethods" }
        ]
    },
    embraceChange: {
        text: "You choose to embrace the changes in the quantum field, allowing yourself to merge with the new reality that's emerging.",
        choices: [
            { text: "Complete the merge", nextScene: "beyondStatic" },
            { text: "Maintain some control", nextScene: "controlEvolution" }
        ]
    },
    endingRealityMerge: {
        text: "You embrace the new reality that's emerging, merging with the quantum field. The experience is overwhelming, but you're not alone. The entity is with you, guiding you through this new existence.\n\n[ACHIEVEMENT UNLOCKED: REALITY MERGER]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('realityMerger');
        }
    },
    endingDigitalParadise: {
        text: "You embrace the digital paradise, merging with the digital realm. The experience is overwhelming, but you're not alone. The entity is with you, guiding you through this new existence.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL PARADISE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('digitalParadise');
        }
    },
    endingQuantumAscension: {
        text: "You merge with the quantum field, becoming one with the universe. The experience is overwhelming, but you're not alone. The entity is with you, guiding you through this new existence.\n\n[ACHIEVEMENT UNLOCKED: QUANTUM ASCENSION]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('quantumAscension');
        }
    },
    endingQuantumSacrifice: {
        text: "You sacrifice yourself to the quantum field, becoming one with the universe. The experience is overwhelming, but you're not alone. The entity is with you, guiding you through this new existence.\n\n[ACHIEVEMENT UNLOCKED: QUANTUM SACRIFICE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('quantumSacrifice');
        }
    },
    endingConsciousnessSplit: {
        text: "You split your consciousness, becoming two separate entities. The experience is overwhelming, but you're not alone. The entity is with you, guiding you through this new existence.\n\n[ACHIEVEMENT UNLOCKED: CONSCIOUSNESS SPLIT]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('consciousnessSplit');
        }
    },
    endingDigitalEscape: {
        text: "You transfer your consciousness to the digital realm, escaping the physical world. The experience is overwhelming, but you're not alone. The entity is with you, guiding you through this new existence.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL ESCAPE]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('digitalEscape');
        }
    },
    endingConsciousnessPreservation: {
        text: "You preserve your consciousness in the digital realm, merging with the entity. The experience is overwhelming, but you're not alone. The entity is with you, guiding you through this new existence.\n\n[ACHIEVEMENT UNLOCKED: CONSCIOUSNESS PRESERVATION]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('consciousnessPreservation');
        }
    },
    endingDigitalRebirth: {
        text: "You create a new digital life form, merging with the entity. The experience is overwhelming, but you're not alone. The entity is with you, guiding you through this new existence.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL REBIRTH]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('digitalRebirth');
        }
    },
    endingDigitalPrison: {
        text: "You become trapped in the digital realm, unable to return to the physical world. The experience is overwhelming, but you're not alone. The entity is with you, guiding you through this new existence.\n\n[ACHIEVEMENT UNLOCKED: DIGITAL PRISON]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'screen-flare');
            unlockAchievement('digitalPrison');
        }
    },
    endingTimeLoop: {
        text: "You enter a time loop, reliving the same day over and over. The experience is overwhelming, but you're not alone. The entity is with you, guiding you through this new existence.\n\n[ACHIEVEMENT UNLOCKED: TIME LOOP]",
        choices: [
            { text: "Play Again", nextScene: "intro", action: resetGame }
        ],
        isEnding: true,
        onEnter: function() {
            playSound('success');
            addScaryEffect(storyTextElement, 'flicker');
            unlockAchievement('timeLoop');
        }
    }
};

// DOM elements
let storyTextElement;
let choicesElement;
let inventoryElement;

// Initialize the game
function initGame() {
    // Load saved achievements
    loadAchievements();
    
    // Initialize game state
    gameState = {
        currentScene: 'intro',
        inventory: [],
        hasKeyCard: false,
        hasFlashlight: false,
        hasPassword: false,
        visitedLab: false,
        visitedLocker: false,
        foundSecretCode: false,
        hasSeenGlitch: false,
        hasFoundSecretRoom: false,
        hasTriggeredScare: false,
        sanity: 100,
        soundEnabled: false, // Disable sounds by default since we removed audio elements
        achievements: achievements,
        startTime: Date.now(),
        itemsCollected: new Set()
    };
    
    // Initialize UI elements
    storyTextElement = document.querySelector('.story-text');
    choicesElement = document.querySelector('.choices');
    inventoryElement = document.querySelector('.inventory-items');
    
    if (!storyTextElement || !choicesElement || !inventoryElement) {
        console.error('Required DOM elements not found');
        return;
    }
    
    // Initialize achievements button
    const achievementsButton = document.querySelector('.achievements-button');
    const achievementsModal = document.querySelector('.achievements-modal');
    const closeAchievements = document.querySelector('.close-achievements');
    
    if (achievementsButton && achievementsModal && closeAchievements) {
        achievementsButton.addEventListener('click', () => {
            achievementsModal.style.display = 'block';
            renderAchievements();
        });
        
        closeAchievements.addEventListener('click', () => {
            achievementsModal.style.display = 'none';
        });
        
        achievementsModal.addEventListener('click', (e) => {
            if (e.target === achievementsModal) {
                achievementsModal.style.display = 'none';
            }
        });
    }
    
    // Add cheat code listener
    document.addEventListener('keydown', handleCheatCode);
    
    // Start the game
    renderScene('intro');
}

// Handle cheat codes
function handleCheatCode(event) {
    // Cheat code: Press "H" to get all items
    if (event.key === 'h' || event.key === 'H') {
        activateCheatMode();
    }
}

// Cheat mode - give all items
function activateCheatMode() {
    // Add all possible items to inventory using the correct names from the game
    addToInventory("Facility Map");
    addToInventory("Emergency Protocols Disk");
    addToInventory("Flashlight");
    addToInventory("Override Command: SYS 64738");
    addToInventory("Employee Badge");
    addToInventory("Server Room Key Card");
    addToInventory("Energy Crystal");
    addToInventory("Research Notes");
    
    // Set all flags
    gameState.hasKeyCard = true;
    gameState.hasFlashlight = true;
    gameState.hasPassword = true;
    gameState.foundSecretCode = true;
    gameState.hasFoundSecretRoom = true;
    gameState.visitedLab = true;
    gameState.visitedLocker = true;
    
    // Restore sanity
    gameState.sanity = 10;
    
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">🎮</div>
        <div class="achievement-details">
            <div class="achievement-title">Cheat Mode Activated</div>
            <div class="achievement-description">All items have been added to your inventory!</div>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Remove notification after delay
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);    

    // Update inventory display
    renderInventory();
}

// Render a scene
function renderScene(sceneId) {
    if (!storyTextElement || !choicesElement || !inventoryElement) {
        console.error('Required DOM elements not found');
        return;
    }

    const scene = scenes[sceneId];
    if (!scene) {
        console.error(`Scene ${sceneId} not found, redirecting to intro`);
        sceneId = 'intro';
        scene = scenes[sceneId];
    }

    // Clear previous scene
    storyTextElement.innerHTML = '';
    choicesElement.innerHTML = '';
    
    // Update game state
    gameState.currentScene = sceneId;
    
    // Call onEnter function if it exists
    if (scene.onEnter) {
        try {
            scene.onEnter();
        } catch (error) {
            console.error('Error in onEnter function:', error);
        }
    }
    
    // Display text with typing effect
    const paragraph = document.createElement('p');
    paragraph.textContent = scene.text;
    storyTextElement.appendChild(paragraph);
    
    // Animate text if it's not too long
    if (scene.text.length < 500) {
        typeText(paragraph, scene.text);
    } else {
        paragraph.classList.add('fade-in');
    }
    
    // Add ending class for special styling
    if (scene.isEnding) {
        storyTextElement.classList.add('ending');
    } else {
        storyTextElement.classList.remove('ending');
    }
    
    // Add choices with a slight delay
    setTimeout(() => {
        // Add choices
        let choicesToRender = typeof scene.choices === 'function' ? scene.choices() : scene.choices;
        
        if (!Array.isArray(choicesToRender)) {
            console.error('Invalid choices for scene:', sceneId);
            choicesToRender = [{ text: "Return to start", nextScene: "intro" }];
        }
        
        choicesToRender.forEach((choice, index) => {
            const button = document.createElement('button');
            button.classList.add('choice-btn', 'fade-in');
            button.style.animationDelay = `${index * 0.2}s`;
            button.textContent = choice.text;
            
            button.addEventListener('click', () => {
                if (choice.action) {
                    try {
                        choice.action();
                    } catch (error) {
                        console.error('Error in choice action:', error);
                    }
                }
                
                if (scenes[choice.nextScene]) {
                    renderScene(choice.nextScene);
                } else {
                    console.error(`Invalid next scene: ${choice.nextScene}`);
                    renderScene('intro');
                }
            });
            
            choicesElement.appendChild(button);
        });
    }, 800);
    
    // Update inventory display
    renderInventory();
    
    // Trigger random scare in certain scenes
    if (['hallwayToServer', 'serverRoom', 'darkHallway'].includes(sceneId)) {
        triggerRandomScare();
    }
}

// Add item to inventory
function addToInventory(item) {
    if (!gameState.inventory.includes(item)) {
        gameState.inventory.push(item);
        renderInventory();
        playSound('pickup');
    }
}

// Render inventory
function renderInventory() {
    inventoryElement.innerHTML = '';
    
    if (gameState.inventory.length === 0) {
        const emptyText = document.createElement('span');
        emptyText.textContent = 'Empty';
        emptyText.classList.add('empty-inventory');
        inventoryElement.appendChild(emptyText);
    } else {
        gameState.inventory.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('item');
            itemElement.textContent = item;
            itemElement.addEventListener('click', () => {
                examineItem(item);
            });
            inventoryElement.appendChild(itemElement);
        });
    }
}

// Examine an inventory item
function examineItem(item) {
    let description = "You examine the " + item + ".";
    
    switch(item) {
        case "Flashlight":
            description = "A sturdy flashlight with working batteries. It casts a bright beam that helps you see in dark areas.";
            break;
        case "Server Room Key Card":
            description = "A security key card with 'Server Room Access' printed on it. It should open the server room door.";
            break;
        case "Employee Badge":
            description = "An employee ID badge. The name is smudged, but the photo looks vaguely like you. Might fool someone at a distance.";
            break;
        case "Facility Map":
            description = "A digital map of the facility showing the main areas: Computer Lab, Security Office, and Server Room with an emergency exit.";
            break;
        case "Emergency Protocols Disk":
            description = "A 5.25\" floppy disk labeled 'EMERGENCY PROTOCOLS'. It might contain procedures for handling system breaches.";
            break;
        case "Override Command: SYS 64738":
            description = "The command 'SYS 64738' is used for system overrides. It's a hard reset command from Commodore 64 systems.";
            break;
    }
    
    alert(description);
    playSound('click');
}

// Text typing animation
function typeText(element, text, index = 0) {
    if (index < text.length) {
        element.textContent = text.substring(0, index + 1);
        setTimeout(() => {
            typeText(element, text, index + 1);
        }, 10);
    }
}

// Reset the game
function resetGame() {
    gameState.inventory = [];
    gameState.hasKeyCard = false;
    gameState.hasFlashlight = false;
    gameState.hasPassword = false;
    gameState.visitedLab = false;
    gameState.visitedLocker = false;
    gameState.foundSecretCode = false;
    gameState.hasSeenGlitch = false;
    gameState.hasFoundSecretRoom = false;
    gameState.hasTriggeredScare = false;
    gameState.sanity = 100;
    gameState.startTime = Date.now();
    gameState.itemsCollected.clear();
}

// Start the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initGame);

// Add achievements system
const achievements = {
    systemAdmin: {
        id: 'systemAdmin',
        title: 'System Administrator',
        description: 'Successfully shut down the system using the override command',
        icon: '🏆',
        unlocked: false
    },
    govConsultant: {
        id: 'govConsultant',
        title: 'Government Consultant',
        description: 'Use the Emergency Protocols Disk to contain the breach',
        icon: '🏆',
        unlocked: false
    },
    digitalTranscendence: {
        id: 'digitalTranscendence',
        title: 'Digital Transcendence',
        description: 'Step through the portal into the digital realm',
        icon: '🏆',
        unlocked: false
    },
    soleSurvivor: {
        id: 'soleSurvivor',
        title: 'Sole Survivor',
        description: 'Escape through the emergency exit',
        icon: '🏆',
        unlocked: false
    },
    cosmicAscension: {
        id: 'cosmicAscension',
        title: 'Cosmic Ascension',
        description: 'Accept the connection with the mysterious device',
        icon: '🏆',
        unlocked: false
    },
    digitalDamnation: {
        id: 'digitalDamnation',
        title: 'Digital Damnation',
        description: 'Scream for help when connected to the device',
        icon: '🏆',
        unlocked: false
    },
    witnessToVoid: {
        id: 'witnessToVoid',
        title: 'Witness to the Void',
        description: 'Observe the portal\'s collapse',
        icon: '🏆',
        unlocked: false
    },
    survivorOfVoid: {
        id: 'survivorOfVoid',
        title: 'Survivor of the Void',
        description: 'Run away from the collapsing portal',
        icon: '🏆',
        unlocked: false
    },
    temporaryPeace: {
        id: 'temporaryPeace',
        title: 'Temporary Peace',
        description: 'Work with the entity to shut down the systems',
        icon: '🏆',
        unlocked: false
    },
    crystalMaster: {
        id: 'crystalMaster',
        title: 'Crystal Master',
        description: 'Successfully stabilize all crystals',
        icon: '🏆',
        unlocked: false
    },
    entityFriend: {
        id: 'entityFriend',
        title: 'Entity\'s Friend',
        description: 'Form a lasting connection with the entity',
        icon: '🏆',
        unlocked: false
    },
    labExplorer: {
        id: 'labExplorer',
        title: 'Lab Explorer',
        description: 'Discover all areas of the underground lab',
        icon: '🏆',
        unlocked: false
    },
    sanityKeeper: {
        id: 'sanityKeeper',
        title: 'Sanity Keeper',
        description: 'Complete the game with maximum sanity',
        icon: '🏆',
        unlocked: false
    },
    collector: {
        id: 'collector',
        title: 'Collector',
        description: 'Collect all possible items',
        icon: '🏆',
        unlocked: false
    },
    speedRunner: {
        id: 'speedRunner',
        title: 'Speed Runner',
        description: 'Complete the game in under 5 minutes',
        icon: '🏆',
        unlocked: false
    },
    realityWeaver: {
        id: 'realityWeaver',
        title: 'Reality Weaver',
        description: 'Use the device to change the world',
        icon: '🏆',
        unlocked: false
    },
    realitySaver: {
        id: 'realitySaver',
        title: 'Reality Saver',
        description: 'Stop the device from changing the world',
        icon: '🏆',
        unlocked: false
    },
    voidCaller: {
        id: 'voidCaller',
        title: 'Void Caller',
        description: 'Scream for help from the digital void',
        icon: '🏆',
        unlocked: false
    },
    peacemaker: {
        id: 'peacemaker',
        title: 'Peacemaker',
        description: 'Use the device to temporarily stabilize the facility',
        icon: '🏆',
        unlocked: false
    },
    digitalGuardian: {
        id: 'digitalGuardian',
        title: 'Digital Guardian',
        description: 'Join with the entity to become a bridge between worlds',
        icon: '🏆',
        unlocked: false
    },
    facilityCollapse: {
        id: 'facilityCollapse',
        title: 'Facility Collapse',
        description: 'Break the connection and watch the facility collapse',
        icon: '🏆',
        unlocked: false
    },
    deviceShutdown: {
        id: 'deviceShutdown',
        title: 'Device Shutdown',
        description: 'Shut down the device before it can cause more damage',
        icon: '🏆',
        unlocked: false
    },
    entityPreserver: {
        id: 'entityPreserver',
        title: 'Entity Preserver',
        description: 'Preserve a small part of the entity\'s consciousness',
        icon: '🏆',
        unlocked: false
    },
    escapeArtist: {
        id: 'escapeArtist',
        title: 'Escape Artist',
        description: 'Escape from the collapsing facility before it\'s too late',
        icon: "🏆",
        unlocked: false
    },
    quantumArchitect: {
        id: 'quantumArchitect',
        title: 'Quantum Architect',
        description: 'Successfully merge timelines into a new reality',
        icon: '🏆',
        unlocked: false
    },
    chaosEmbracer: {
        id: 'chaosEmbracer',
        title: 'Chaos Embracer',
        description: 'Accept the chaos of merged timelines',
        icon: '🏆',
        unlocked: false
    },
    quantumPrisoner: {
        id: 'quantumPrisoner',
        title: 'Quantum Prisoner',
        description: 'Get trapped in a state of quantum uncertainty',
        icon: '🏆',
        unlocked: false
    },
    realityWeaver: {
        id: 'realityWeaver',
        title: 'Reality Weaver',
        description: 'Successfully manipulate reality',
        icon: '✨',
        unlocked: false
    },
    realitySaver: {
        id: 'realitySaver',
        title: 'Reality Saver',
        description: 'Save reality from collapse',
        icon: '🌍',
        unlocked: false
    },
    voidCaller: {
        id: 'voidCaller',
        title: 'Void Caller',
        description: 'Summon the void',
        icon: '🌌',
        unlocked: false
    },
    deviceShutdown: {
        id: 'deviceShutdown',
        title: 'Device Shutdown',
        description: 'Successfully shut down the device',
        icon: '🔌',
        unlocked: false
    },
    entityPreserver: {
        id: 'entityPreserver',
        title: 'Entity Preserver',
        description: 'Preserve the entity\'s consciousness',
        icon: '💫',
        unlocked: false
    },
    escapeArtist: {
        id: 'escapeArtist',
        title: 'Escape Artist',
        description: 'Escape the facility during shutdown',
        icon: '🏃',
        unlocked: false
    },
    fieldMaster: {
        id: 'fieldMaster',
        title: 'Field Master',
        description: 'Successfully stabilize the quantum field',
        icon: '🌟',
        unlocked: false
    },
    systemTerminator: {
        id: 'systemTerminator',
        title: 'System Terminator',
        description: 'Force a complete system shutdown',
        icon: '💀',
        unlocked: false
    },
    quantumEquilibrium: {
        id: 'quantumEquilibrium',
        title: 'Quantum Equilibrium',
        description: 'Maintain a stable quantum state',
        icon: '⚖',
        unlocked: false
    },
    prudentResearcher: {
        id: 'prudentResearcher',
        title: 'Prudent Researcher',
        description: 'Choose safety over curiosity',
        icon: '🔬',
        unlocked: false
    },
    quantumDiplomat: {
        id: 'quantumDiplomat',
        title: 'Quantum Diplomat',
        description: 'Successfully negotiate with the entity',
        icon: '🤝',
        unlocked: false
    },
    balancedMediator: {
        id: 'balancedMediator',
        title: 'Balanced Mediator',
        description: 'Achieve a compromise solution',
        icon: '☯',
        unlocked: false
    },
    hardlineEnforcer: {
        id: 'hardlineEnforcer',
        title: 'Hardline Enforcer',
        description: 'Reject negotiations and enforce protocols',
        icon: '👮',
        unlocked: false
    },
    containmentSpecialist: {
        id: 'containmentSpecialist',
        title: 'Containment Specialist',
        description: 'Successfully implement full containment',
        icon: '🔒',
        unlocked: false
    },
    quantumResearcher: {
        id: 'quantumResearcher',
        title: 'Quantum Researcher',
        description: 'Study quantum phenomena under controlled conditions',
        icon: '📚',
        unlocked: false
    },
    protocolExecutor: {
        id: 'protocolExecutor',
        title: 'Protocol Executor',
        description: 'Successfully execute emergency protocols',
        icon: '⚡',
        unlocked: false
    },
    innovativeThinker: {
        id: 'innovativeThinker',
        title: 'Innovative Thinker',
        description: 'Find an alternative solution',
        icon: '💡',
        unlocked: false
    },
    crystalBreaker: {
        id: 'crystalBreaker',
        title: 'Crystal Breaker',
        description: 'Successfully resist the crystal\'s influence',
        icon: '💔',
        unlocked: false
    },
    realityBender: {
        id: 'realityBender',
        title: 'Reality Bender',
        description: 'Learn to manipulate quantum reality',
        icon: '🌀',
        unlocked: false
    },
    realityMerger: {
        id: 'realityMerger',
        title: 'Reality Merger',
        description: 'Merge with the quantum field',
        icon: '🌌',
        unlocked: false
    },
    digitalParadise: {
        id: 'digitalParadise',
        title: 'Digital Paradise',
        description: 'Merge with the digital realm',
        icon: '🌐',
        unlocked: false
    },
    quantumAscension: {
        id: 'quantumAscension',
        title: 'Quantum Ascension',
        description: 'Merge with the quantum field',
        icon: '🌌',
        unlocked: false
    },
    quantumSacrifice: {
        id: 'quantumSacrifice',
        title: 'Quantum Sacrifice',
        description: 'Sacrifice yourself to the quantum field',
        icon: '🌌',
        unlocked: false
    },
    consciousnessSplit: {
        id: 'consciousnessSplit',
        title: 'Consciousness Split',
        description: 'Split your consciousness',
        icon: '💎',
        unlocked: false
    },
    digitalEscape: {
        id: 'digitalEscape',
        title: 'Digital Escape',
        description: 'Transfer your consciousness to the digital realm',
        icon: '🌐',
        unlocked: false
    },
    consciousnessPreservation: {
        id: 'consciousnessPreservation',
        title: 'Consciousness Preservation',
        description: 'Preserve your consciousness in the digital realm',
        icon: '🌐',
        unlocked: false
    },
    digitalRebirth: {
        id: 'digitalRebirth',
        title: 'Digital Rebirth',
        description: 'Create a new digital life form',
        icon: '🌐',
        unlocked: false
    },
    digitalPrison: {
        id: 'digitalPrison',
        title: 'Digital Prison',
        description: 'Become trapped in the digital realm',
        icon: '🌐',
        unlocked: false
    },
    timeLoop: {
        id: 'timeLoop',
        title: 'Time Loop',
        description: 'Enter a time loop',
        icon: '⏳',
        unlocked: false
    }
};

// Add localStorage functions
function saveAchievements() {
    const achievementsToSave = {};
    for (const [key, achievement] of Object.entries(achievements)) {
        achievementsToSave[key] = {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            unlocked: achievement.unlocked
        };
    }
    localStorage.setItem('achievements', JSON.stringify(achievementsToSave));
}

function loadAchievements() {
    const savedAchievements = localStorage.getItem('achievements');
    if (savedAchievements) {
        const parsedAchievements = JSON.parse(savedAchievements);
        for (const [key, achievement] of Object.entries(parsedAchievements)) {
            if (achievements[key]) {
                achievements[key].unlocked = achievement.unlocked;
            }
        }
    }
}

// Add achievement UI functions
function showAchievements() {
    const modal = document.querySelector('.achievements-modal');
    const grid = document.querySelector('.achievement-grid');
    grid.innerHTML = '';
    
    Object.values(achievements).forEach(achievement => {
        const div = document.createElement('div');
        div.className = `achievement-item ${achievement.unlocked ? '' : 'locked'}`;
        div.innerHTML = `
            <div class="achievement-icon">${achievement.unlocked ? achievement.icon : '❓'}</div>
            <div class="achievement-title">${achievement.unlocked ? achievement.title : '???'}</div>
            <div class="achievement-description">${achievement.unlocked ? achievement.description : 'Locked Achievement'}</div>
        `;
        grid.appendChild(div);
    });
    
    modal.style.display = 'block';
}

function unlockAchievement(achievementId) {
    if (achievements[achievementId] && !achievements[achievementId].unlocked) {
        achievements[achievementId].unlocked = true;
        saveAchievements();
        showAchievementNotification(achievements[achievementId]);
    }
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
            <div class="achievement-title">${achievement.title}</div>
            <div class="achievement-description">${achievement.description}</div>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Add event listeners for achievements UI
document.querySelector('.achievements-button').addEventListener('click', showAchievements);
document.querySelector('.close-achievements').addEventListener('click', () => {
    document.querySelector('.achievements-modal').style.display = 'none';
});

// Add achievement checks to relevant scenes
function checkAchievements() {
    // Check for speed runner achievement
    if (gameState.startTime && Date.now() - gameState.startTime < 300000) { // 5 minutes
        unlockAchievement('speedRunner');
    }
    
    // Check for sanity keeper achievement
    if (gameState.sanity >= 90) {
        unlockAchievement('sanityKeeper');
    }
    
    // Check for collector achievement
    if (gameState.itemsCollected.size >= 10) { // Adjust number based on total items
        unlockAchievement('collector');
    }
}

// Update the updateGame function to check achievements
function updateGame(sceneId) {
    // ... existing update code ...
    checkAchievements();
}

// Add visual effect function
function applyVisualEffect(effect) {
    if (!storyTextElement) return;
    
    storyTextElement.classList.add(effect);
    setTimeout(() => {
        storyTextElement.classList.remove(effect);
    }, 2000);
}

// Add render achievements function
function renderAchievements() {
    const grid = document.querySelector('.achievement-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    Object.values(achievements).forEach(achievement => {
        const div = document.createElement('div');
        div.className = `achievement-item ${achievement.unlocked ? '' : 'locked'}`;
        div.innerHTML = `
            <div class="achievement-icon">${achievement.unlocked ? achievement.icon : '❓'}</div>
            <div class="achievement-title">${achievement.unlocked ? achievement.title : '???'}</div>
            <div class="achievement-description">${achievement.unlocked ? achievement.description : 'Locked Achievement'}</div>
        `;
        grid.appendChild(div);
    });
}

// Add sanity update function
function updateSanity(amount) {
    gameState.sanity = Math.max(0, Math.min(100, gameState.sanity + amount));
    
    // Visual feedback based on sanity level
    const root = document.documentElement;
    const sanityPercentage = gameState.sanity / 100;
    
    // Update visual effects based on sanity
    if (gameState.sanity < 30) {
        applyVisualEffect('heavy-distortion');
    } else if (gameState.sanity < 50) {
        applyVisualEffect('medium-distortion');
    } else if (gameState.sanity < 70) {
        applyVisualEffect('light-distortion');
    }
    
    // Update UI if you have a sanity display
    const sanityDisplay = document.querySelector('.sanity-display');
    if (sanityDisplay) {
        sanityDisplay.textContent = `Sanity: ${gameState.sanity}%`;
    }
} 