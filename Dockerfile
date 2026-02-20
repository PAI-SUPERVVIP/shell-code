FROM codercom/code-server:4.96.2

USER root

RUN apt-get update && apt-get install -y \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY vscode-extension /home/coder/.code-server/extensions/opencode-terminal

RUN code-server --install-extension /home/coder/.code-server/extensions/opencode-terminal || true

RUN mkdir -p /home/coder/.local/bin && \
    wget -q https://github.com/coder/code-server/releases/download/v4.96.2/code-server-4.96.2-linux-amd64.tar.gz -O /tmp/code-server.tar.gz && \
    tar -xzf /tmp/code-server.tar.gz -C /tmp && \
    cp /tmp/code-server-4.96.2-linux-amd64/bin/code-server /home/coder/.local/bin/ && \
    rm -rf /tmp/code-server*

RUN sed -i 's/<\/body>/<script src="\/static\/virtual-keyboard.js"><\/script><\/body>/g' /usr/lib/code-server/src/browser/pages/vscode.html || true

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
        .vk-row { display: flex; justify-content: center; gap: 4px; margin-bottom: 6px; }
        .vk-key {
            background: #3c3c3c;
            color: #fff;
            border: none;
            border-radius: 4px;
            min-width: 36px;
            height: 42px;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .vk-key:active { background: #5a5a5a; }
        .vk-key.wide { min-width: 56px; }
        .vk-key.space { min-width: 180px; }
        .vk-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #007acc;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 24px;
            cursor: pointer;
            z-index: 99998;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = keyboardCSS;
    document.head.appendChild(style);
    
    const keys = [
        ['`','1','2','3','4','5','6','7','8','9','0','-','=','⌫'],
        ['Tab','q','w','e','r','t','y','u','i','o','p','[',']','\\'],
        ['Caps','a','s','d','f','g','h','j','k','l',';','\'','Enter'],
        ['Shift','z','x','c','v','b','n','m',',','.','/','Shift'],
        ['Ctrl','Alt','Space','Alt','Ctrl','←','↓','↑','→']
    ];
    
    const container = document.createElement('div');
    container.className = 'vk-container';
    
    keys.forEach((row, ri) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'vk-row';
        row.forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'vk-key';
            if (key.length > 1) btn.classList.add('wide');
            if (key === 'Space') btn.classList.add('space');
            btn.textContent = key === 'Space' ? 'space' : key;
            btn.onclick = () => sendKey(key);
            rowDiv.appendChild(btn);
        });
        container.appendChild(rowDiv);
    });
    document.body.appendChild(container);
    
    const toggle = document.createElement('button');
    toggle.className = 'vk-toggle';
    toggle.textContent = '⌨';
    toggle.onclick = () => container.classList.toggle('visible');
    document.body.appendChild(toggle);
    
    function sendKey(key) {
        const event = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: key === '⌫' ? 'Backspace' : key === 'Space' ? ' ' : key,
            keyCode: key === 'Enter' ? 13 : key === 'Tab' ? 9 : key === 'Escape' ? 27 : key.charCodeAt(0)
        });
        document.activeElement.dispatchEvent(event);
    }
    
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('vk') === '1') {
        container.classList.add('visible');
    }
})();
`;

USER coder

EXPOSE 8080

ENV PASSWORD="railway"
ENV PORT=8080

CMD ["code-server", "--port", "8080", "--host", "0.0.0.0", "--auth", "password"]
