FROM codercom/code-server:4.96.2

USER root

RUN apt-get update && apt-get install -y \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN cat > /usr/lib/code-server/src/browser/pages/virtual-keyboard.js << 'EOF'
(function() {
    const keyboardCSS = `
        .vk-container {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #1e1e1e;
            border-top: 1px solid #333;
            padding: 8px 4px;
            display: none;
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .vk-container.visible { display: block; }
        .vk-row { display: flex; justify-content: center; gap: 3px; margin-bottom: 5px; }
        .vk-key {
            background: #3c3c3c;
            color: #fff;
            border: none;
            border-radius: 4px;
            min-width: 26px;
            height: 38px;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .vk-key:active { background: #5a5a5a; }
        .vk-key.wide { min-width: 40px; }
        .vk-key.space { min-width: 120px; }
        .vk-key.thai-mode { background: #2d5a3d; }
        .vk-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #007acc;
            color: white;
            border: none;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            font-size: 22px;
            cursor: pointer;
            z-index: 99998;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .vk-lang {
            position: fixed;
            bottom: 78: 20pxpx;
            right;
            background: #e55c2b;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 8px 14px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            z-index: 99998;
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = keyboardCSS;
    document.head.appendChild(style);
    
    const enKeys = [
        ['`','1','2','3','4','5','6','7','8','9','0','-','=','⌫'],
        ['Tab','q','w','e','r','t','y','u','i','o','p','[',']','\\'],
        ['Caps','a','s','d','f','g','h','j','k','l',';','\'','Enter'],
        ['Shift','z','x','c','v','b','n','m',',','.','/','Shift'],
        ['Ctrl','Alt','Space','Alt','Ctrl','←','↓','↑','→']
    ];
    
    const thKeys = [
        ['ฅ','ๅ','ๆ','ง','ฃ','ฅ','ช','ซ','ฌ','ญ','ฎ','ฏ','ฐ','⌫'],
        ['๏','ป','ฉ','อ','ฮ','ิ','ึ','ค','ต','จ','ข','ช','ฑ','ฒ'],
        ['ฤ','ฆ','ฏ','ณ','ช','ซ','ฎ','ญ','ฐ','ฑ','ฒ','ณ','Enter'],
        ['ฯ','ฎ','ฑ','ฒ','ฬ','ฮ','อ','ฯ','ฝ','ฟ','ผ','Shift'],
        ['Ctrl','Alt','Space','Alt','Ctrl','←','↓','↑','→']
    ];
    
    let isThai = false;
    let shiftPressed = false;
    
    const container = document.createElement('div');
    container.className = 'vk-container';
    
    function render() {
        container.innerHTML = '';
        const keys = isThai ? thKeys : enKeys;
        
        keys.forEach((row) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'vk-row';
            row.forEach(key => {
                const btn = document.createElement('button');
                btn.className = 'vk-key';
                if (key.length > 1) btn.classList.add('wide');
                if (key === 'Space') btn.classList.add('space');
                if (isThai) btn.classList.add('thai-mode');
                btn.textContent = key === 'Space' ? 'space' : key;
                btn.onclick = () => sendKey(key);
                rowDiv.appendChild(btn);
            });
            container.appendChild(rowDiv);
        });
    }
    
    render();
    document.body.appendChild(container);
    
    const toggle = document.createElement('button');
    toggle.className = 'vk-toggle';
    toggle.textContent = '⌨';
    toggle.onclick = () => container.classList.toggle('visible');
    document.body.appendChild(toggle);
    
    const langBtn = document.createElement('button');
    langBtn.className = 'vk-lang';
    langBtn.textContent = 'TH';
    langBtn.onclick = () => {
        isThai = !isThai;
        langBtn.textContent = isThai ? 'EN' : 'TH';
        render();
    };
    document.body.appendChild(langBtn);
    
    function sendKey(key) {
        let k = key;
        if (key === '⌫') k = 'Backspace';
        else if (key === 'Space') k = ' ';
        
        document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', {
            bubbles: true, cancelable: true, key: k
        }));
        
        setTimeout(() => {
            document.activeElement?.dispatchEvent(new KeyboardEvent('keyup', {
                bubbles: true, key: k
            }));
        }, 50);
    }
})();
EOF

RUN sed -i 's|</body>|</body><script src="/static/virtual-keyboard.js"></script>|' /usr/lib/code-server/src/browser/pages/vscode.html

USER coder

EXPOSE 8080

ENV PASSWORD="railway"
ENV PORT=8080

CMD ["code-server", "--port", "8080", "--host", "0.0.0.0", "--auth", "password"]
