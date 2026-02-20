import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import io from 'socket.io-client';

document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const terminalContainer = document.getElementById('terminal');
    const keyboardToolbar = document.getElementById('keyboardToolbar');
    const customKeyboard = document.getElementById('customKeyboard');
    const keyboardToggle = document.getElementById('keyboardToggle');
    const pasteBtn = document.getElementById('pasteBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    let terminal;
    let fitAddon;
    let isKeyboardVisible = false;
    let isCtrlPressed = false;
    let isShiftPressed = false;
    let isAltPressed = false;
    let isCapsLock = false;
    
    // Initialize terminal
    function initTerminal() {
        terminal = new Terminal({
            theme: {
                background: '#000',
                foreground: '#fff',
                cursor: '#fff'
            },
            fontSize: 14,
            fontFamily: 'Courier New, monospace',
            cursorBlink: true
        });
        
        fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        
        terminal.open(terminalContainer);
        fitAddon.fit();
        
        terminal.onData((data) => {
            socket.emit('command', data);
        });
        
        terminal.write('Welcome to iSH Web Terminal\r\n');
        terminal.write('Type commands and press Enter to execute\r\n');
        terminal.write('Use the custom keyboard for special keys\r\n\r\n');
    }
    
    // Handle socket connection
    socket.on('connect', () => {
        updateConnectionStatus(true);
        terminal.write('→ Connected to server\r\n');
    });
    
    socket.on('disconnect', () => {
        updateConnectionStatus(false);
        terminal.write('→ Disconnected from server\r\n');
    });
    
    socket.on('output', (output) => {
        terminal.write(output + '\r\n');
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
    
    // Handle custom keyboard buttons
    function setupKeyboard() {
        const keys = document.querySelectorAll('.key');
        
        keys.forEach(key => {
            key.addEventListener('click', () => {
                const keyValue = key.dataset.key;
                handleKeyPress(keyValue);
            });
        });
    }
    
    // Handle key press
    function handleKeyPress(key) {
        switch(key) {
            case 'esc':
                terminal.write('\x1b');
                break;
            case 'tab':
                terminal.write('\t');
                break;
            case 'enter':
                terminal.write('\r');
                break;
            case 'backspace':
                terminal.write('\x7f');
                break;
            case 'space':
                terminal.write(' ');
                break;
            case 'capslock':
                isCapsLock = !isCapsLock;
                key.classList.toggle('active', isCapsLock);
                break;
            case 'shift':
                isShiftPressed = !isShiftPressed;
                key.classList.toggle('active', isShiftPressed);
                break;
            case 'ctrl':
                isCtrlPressed = !isCtrlPressed;
                break;
            case 'alt':
                isAltPressed = !isAltPressed;
                break;
            case 'left':
                terminal.write('\x1b[D');
                break;
            case 'right':
                terminal.write('\x1b[C');
                break;
            case 'up':
                terminal.write('\x1b[A');
                break;
            case 'down':
                terminal.write('\x1b[B');
                break;
            default:
                if (key) {
                    let char = key;
                    if (isCapsLock || isShiftPressed) {
                        char = char.toUpperCase();
                    } else {
                        char = char.toLowerCase();
                    }
                    terminal.write(char);
                }
                break;
        }
    }
    
    // Handle special key combinations
    function handleSpecialKeyCombination(key) {
        if (isCtrlPressed) {
            switch(key) {
                case 'c':
                    socket.emit('specialKey', 'ctrl+c');
                    break;
                case 'd':
                    socket.emit('specialKey', 'ctrl+d');
                    break;
            }
        }
    }
    
    // Keyboard toggle functionality
    keyboardToggle.addEventListener('click', () => {
        toggleKeyboard();
    });
    
    function toggleKeyboard() {
        isKeyboardVisible = !isKeyboardVisible;
        if (isKeyboardVisible) {
            keyboardToolbar.classList.remove('hidden');
            keyboardToggle.innerHTML = '<img src="icons/keyboard-hide.svg" alt="Hide Keyboard">';
        } else {
            keyboardToolbar.classList.add('hidden');
            keyboardToggle.innerHTML = '<img src="icons/keyboard.svg" alt="Show Keyboard">';
        }
    }
    
    // Paste functionality
    pasteBtn.addEventListener('click', () => {
        navigator.clipboard.readText().then(text => {
            if (text) {
                terminal.write(text + '\r');
            }
        }).catch(err => {
            console.error('Failed to read clipboard: ', err);
            alert('Unable to access clipboard. Please allow clipboard access.');
        });
    });
    
    // Clear functionality
    clearBtn.addEventListener('click', () => {
        terminal.clear();
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (fitAddon) {
            fitAddon.fit();
        }
    });
    
    // Initialize everything
    initTerminal();
    setupKeyboard();
    
    // Auto-hide keyboard on mobile
    if (window.innerWidth < 768) {
        document.addEventListener('click', (e) => {
            if (!keyboardToolbar.contains(e.target) && !keyboardToggle.contains(e.target)) {
                if (isKeyboardVisible) {
                    toggleKeyboard();
                }
            }
        });
    }
});