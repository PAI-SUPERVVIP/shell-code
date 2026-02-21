const { Terminal } = window.Terminal;
const { FitAddon } = window.FitAddon;
const io = window.io;

document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const terminalContainer = document.getElementById('terminal');
    const toolbar = document.getElementById('toolbar');
    const keyboard = document.getElementById('keyboard');
    const keyboardToggle = document.getElementById('keyboardToggle');
    const pasteBtn = document.getElementById('pasteBtn');
    const statusTime = document.getElementById('statusTime');
    
    let terminal;
    let fitAddon;
    let isKeyboardVisible = true;
    let isShiftPressed = false;
    let isCapsLocked = false;
    let isCtrlPressed = false;
    let shellActive = true;
    
    function updateTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        statusTime.textContent = `${hours}:${minutes}`;
    }
    updateTime();
    setInterval(updateTime, 1000);
    
    function initTerminal() {
        terminal = new Terminal({
            theme: {
                background: '#000000',
                foreground: '#ffffff',
                cursor: '#30d158',
                cursorAccent: '#000000',
                selectionBackground: 'rgba(0, 122, 255, 0.4)',
                black: '#000000',
                red: '#ff453a',
                green: '#30d158',
                yellow: '#ffd60a',
                blue: '#0a84ff',
                magenta: '#bf5af2',
                cyan: '#64d2ff',
                white: '#ffffff'
            },
            fontSize: 16,
            fontFamily: "'JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', monospace",
            cursorBlink: true,
            cursorStyle: 'block',
            allowProposedApi: true,
            scrollback: 5000,
            tabStopWidth: 4
        });
        
        fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        
        terminal.open(terminalContainer);
        setTimeout(() => fitAddon.fit(), 50);
        
        terminal.focus();
        
        terminalContainer.addEventListener('click', () => {
            terminal.focus();
        });
        
        terminal.onData((data) => {
            if (shellActive) {
                socket.emit('command', data);
            }
        });
    }
    
    socket.on('connect', () => {
        const statusDot = document.querySelector('.status-dot');
        if (statusDot) {
            statusDot.classList.remove('offline');
            statusDot.classList.add('online');
        }
    });
    
    socket.on('disconnect', () => {
        shellActive = false;
    });
    
    socket.on('output', (output) => {
        terminal.write(output);
    });
    
    function handleKeyPress(key) {
        if (!shellActive) {
            terminal.write('\r\n[Shell disconnected. Refresh to reconnect.]\r\n');
            return;
        }
        
        let keyToSend = key;
        
        if ((isShiftPressed || isCapsLocked) && /^[a-z]$/.test(key)) {
            keyToSend = key.toUpperCase();
        } else if (isShiftPressed) {
            const shiftMap = {
                '`': '~', '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
                '6': '^', '7': '&', '8': '*', '9': '(', '0': ')', '-': '_',
                '=': '+', '[': '{', ']': '}', '\\': '|', ';': ':', "'": '"',
                ',': '<', '.': '>', '/': '?'
            };
            keyToSend = shiftMap[key] || key;
        }
        
        switch(key) {
            case 'backspace':
                socket.emit('specialKey', 'backspace');
                break;
            case 'tab':
                socket.emit('specialKey', 'tab');
                break;
            case 'enter':
                socket.emit('specialKey', 'enter');
                break;
            case 'shift':
                isShiftPressed = !isShiftPressed;
                document.querySelectorAll('[data-key="shift"]').forEach(btn => {
                    btn.classList.toggle('active', isShiftPressed);
                });
                break;
            case 'caps':
                isCapsLocked = !isCapsLocked;
                document.querySelector('[data-key="caps"]').classList.toggle('active', isCapsLocked);
                updateKeyCase();
                break;
            case 'ctrl':
                isCtrlPressed = !isCtrlPressed;
                document.querySelectorAll('[data-key="ctrl"]').forEach(btn => {
                    btn.classList.toggle('active', isCtrlPressed);
                });
                if (isCtrlPressed) {
                    setTimeout(() => {
                        isCtrlPressed = false;
                        document.querySelectorAll('[data-key="ctrl"]').forEach(btn => {
                            btn.classList.remove('active');
                        });
                    }, 500);
                }
                break;
            case 'alt':
                document.querySelectorAll('[data-key="alt"]').forEach(btn => {
                    btn.classList.toggle('active');
                });
                setTimeout(() => {
                    document.querySelectorAll('[data-key="alt"]').forEach(btn => {
                        btn.classList.remove('active');
                    });
                }, 200);
                break;
            case 'cmd':
                break;
            case 'fn':
                break;
            case 'esc':
            case 'ESC':
                socket.emit('specialKey', 'esc');
                break;
            case 'left':
            case 'right':
            case 'up':
            case 'down':
                socket.emit('specialKey', key);
                break;
            case ' ':
                socket.emit('command', ' ');
                break;
            default:
                if (isCtrlPressed && /^[a-z]$/.test(key)) {
                    const ctrlChar = String.fromCharCode(key.charCodeAt(0) - 96);
                    socket.emit('command', ctrlChar);
                } else {
                    socket.emit('command', keyToSend);
                }
                
                if (isShiftPressed && key !== 'shift') {
                    isShiftPressed = false;
                    document.querySelectorAll('[data-key="shift"]').forEach(btn => {
                        btn.classList.remove('active');
                    });
                }
                break;
        }
    }
    
    function updateKeyCase() {
        const letterKeys = document.querySelectorAll('.key[data-key]');
        letterKeys.forEach(btn => {
            const key = btn.dataset.key;
            if (/^[a-z]$/.test(key)) {
                const char = (isCapsLocked || isShiftPressed) ? key.toUpperCase() : key;
                btn.textContent = char;
            }
        });
    }
    
    function setupKeyboard() {
        const keys = document.querySelectorAll('.key');
        
        keys.forEach(key => {
            const handlePress = (e) => {
                e.preventDefault();
                const keyValue = key.dataset.key;
                handleKeyPress(keyValue);
                key.classList.add('active');
                setTimeout(() => key.classList.remove('active'), 80);
            };
            
            key.addEventListener('click', handlePress);
            key.addEventListener('touchstart', handlePress, { passive: false });
        });
        
        const quickKeys = document.querySelectorAll('.quick-key');
        quickKeys.forEach(key => {
            key.addEventListener('click', () => {
                const keyValue = key.dataset.key;
                if (keyValue === 'esc') {
                    socket.emit('specialKey', 'esc');
                } else if (keyValue === 'tab') {
                    socket.emit('specialKey', 'tab');
                } else if (keyValue === 'ctrl' || keyValue === 'alt') {
                    handleKeyPress(keyValue);
                } else if (['left', 'right', 'up', 'down'].includes(keyValue)) {
                    socket.emit('specialKey', keyValue);
                }
                key.classList.add('active');
                setTimeout(() => key.classList.remove('active'), 80);
            });
        });
    }
    
    keyboardToggle.addEventListener('click', () => {
        isKeyboardVisible = !isKeyboardVisible;
        if (isKeyboardVisible) {
            toolbar.classList.remove('hidden');
            keyboard.classList.remove('hidden');
            keyboardToggle.classList.add('active');
        } else {
            toolbar.classList.add('hidden');
            keyboard.classList.add('hidden');
            keyboardToggle.classList.remove('active');
        }
        setTimeout(() => fitAddon.fit(), 200);
    });
    
    pasteBtn.addEventListener('click', async () => {
        terminal.focus();
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                terminal.write(text);
            }
        } catch (err) {
            terminal.write('\r\n[Unable to access clipboard]\r\n');
        }
    });
    
    window.addEventListener('resize', () => {
        if (fitAddon) {
            setTimeout(() => fitAddon.fit(), 100);
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Backspace' || 
            e.key.startsWith('Arrow') || e.key === 'Escape') {
            return;
        }
        
        if (e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }
        
        if (document.activeElement.tagName !== 'TEXTAREA' && 
            !document.activeElement.matches('input')) {
            e.preventDefault();
        }
    });
    
    initTerminal();
    setupKeyboard();
    
    setTimeout(() => fitAddon.fit(), 500);
    
    if (window.innerWidth < 768) {
        setTimeout(() => {
            if (!isKeyboardVisible) {
                toolbar.classList.add('hidden');
                keyboard.classList.add('hidden');
            }
        }, 2000);
    }
});
