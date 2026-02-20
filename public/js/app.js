// iSH Web Terminal - Main Application
const { Terminal } = window.Terminal;
const { FitAddon } = window.FitAddon;
const io = window.io;

document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const terminalContainer = document.getElementById('terminal');
    const keyboardToolbar = document.getElementById('keyboardToolbar');
    const customKeyboard = document.getElementById('customKeyboard');
    const keyboardToggle = document.getElementById('keyboardToggle');
    const pasteBtn = document.getElementById('pasteBtn');
    
    let terminal;
    let fitAddon;
    let isKeyboardVisible = false;
    let isCtrlPressed = false;
    let isAltPressed = false;
    let shellActive = true;
    
    // Initialize terminal with modern theme
    function initTerminal() {
        terminal = new Terminal({
            theme: {
                background: '#0d1117',
                foreground: '#e6edf3',
                cursor: '#39c5cf',
                cursorAccent: '#0d1117',
                selectionBackground: 'rgba(88, 166, 255, 0.3)',
                black: '#484f58',
                red: '#ff7b72',
                green: '#3fb950',
                yellow: '#d29922',
                blue: '#58a6ff',
                magenta: '#a371f7',
                cyan: '#39c5cf',
                white: '#b1bac4',
                brightBlack: '#6e7681',
                brightRed: '#ffa198',
                brightGreen: '#56d364',
                brightYellow: '#e3b341',
                brightBlue: '#79c0ff',
                brightMagenta: '#bc8cff',
                brightCyan: '#56d4dd',
                brightWhite: '#f0f6fc'
            },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            cursorBlink: true,
            cursorStyle: 'block',
            cursorWidth: 10,
            allowProposedApi: true,
            scrollback: 10000,
            tabStopWidth: 4,
            windowsMode: false
        });
        
        fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        
        terminal.open(terminalContainer);
        fitAddon.fit();
        
        terminal.onData((data) => {
            if (shellActive) {
                socket.emit('command', data);
            }
        });
    }
    
    // Handle socket connection
    socket.on('connect', () => {
        updateConnectionStatus(true);
    });
    
    socket.on('disconnect', () => {
        updateConnectionStatus(false);
        terminal.write('\r\n\x1b[31m✗ Disconnected from server\x1b[0m\r\n');
        shellActive = false;
    });
    
    socket.on('output', (output) => {
        terminal.write(output);
    });
    
    // Update connection status
    function updateConnectionStatus(connected) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (connected) {
            statusDot.classList.remove('offline');
            statusDot.classList.add('online');
            statusText.textContent = 'Connected';
        } else {
            statusDot.classList.remove('online');
            statusDot.classList.add('offline');
            statusText.textContent = 'Disconnected';
        }
    }
    
    // Setup keyboard buttons
    function setupKeyboard() {
        const keys = document.querySelectorAll('.key');
        
        keys.forEach(key => {
            key.addEventListener('click', () => {
                const keyValue = key.dataset.key;
                handleKeyPress(keyValue);
                key.classList.add('active');
                setTimeout(() => key.classList.remove('active'), 100);
            });
        });
    }
    
    // Handle key press from custom keyboard
    function handleKeyPress(key) {
        if (!shellActive) {
            terminal.write('\x1b[31mShell not active. Refresh to reconnect.\x1b[0m\r\n');
            return;
        }
        
        switch(key) {
            case 'esc':
                socket.emit('specialKey', 'esc');
                break;
            case 'tab':
                socket.emit('specialKey', 'tab');
                break;
            case 'ctrl':
                isCtrlPressed = !isCtrlPressed;
                document.querySelector('[data-key="ctrl"]').classList.toggle('active', isCtrlPressed);
                break;
            case 'alt':
                isAltPressed = !isAltPressed;
                document.querySelector('[data-key="alt"]').classList.toggle('active', isAltPressed);
                break;
            case 'left':
                socket.emit('specialKey', 'left');
                break;
            case 'right':
                socket.emit('specialKey', 'right');
                break;
            case 'up':
                socket.emit('specialKey', 'up');
                break;
            case 'down':
                socket.emit('specialKey', 'down');
                break;
        }
        
        if (['esc', 'tab', 'left', 'right', 'up', 'down'].includes(key)) {
            setTimeout(() => {
                isCtrlPressed = false;
                isAltPressed = false;
                document.querySelector('[data-key="ctrl"]')?.classList.remove('active');
                document.querySelector('[data-key="alt"]')?.classList.remove('active');
            }, 100);
        }
    }
    
    // Keyboard toggle
    keyboardToggle.addEventListener('click', () => {
        isKeyboardVisible = !isKeyboardVisible;
        if (isKeyboardVisible) {
            keyboardToolbar.classList.remove('hidden');
            customKeyboard.classList.remove('hidden');
            keyboardToggle.classList.add('active');
        } else {
            keyboardToolbar.classList.add('hidden');
            customKeyboard.classList.add('hidden');
            keyboardToggle.classList.remove('active');
        }
        setTimeout(() => fitAddon.fit(), 300);
    });
    
    // Paste functionality
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                terminal.write(text);
            }
        } catch (err) {
            terminal.write('\x1b[33mUnable to access clipboard\x1b[0m\r\n');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (fitAddon) {
            fitAddon.fit();
        }
    });
    
    // Initialize
    initTerminal();
    setupKeyboard();
    
    // Auto-hide keyboard on mobile
    if (window.innerWidth < 768) {
        setTimeout(() => {
            keyboardToolbar.classList.add('hidden');
            customKeyboard.classList.add('hidden');
        }, 3000);
    }
});
