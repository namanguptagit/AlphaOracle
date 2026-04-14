document.addEventListener('DOMContentLoaded', () => {
    const terminal = document.getElementById('terminal');
    const confidenceValue = document.getElementById('confidence-value');
    const confidenceRing = document.getElementById('confidence-ring');
    const marketIdElem = document.getElementById('market-id');
    const decisionElem = document.getElementById('execution-decision');
    const reasoningText = document.getElementById('reasoning-text');

    // Connect to SSE
    const evtSource = new EventSource('/api/stream');

    evtSource.onmessage = function(event) {
        const data = JSON.parse(event.data);

        if (data.event === 'log') {
            appendLog(data);
        } else if (data.event === 'decision') {
            updateDashboard(data);
        } else if (data.event === 'execution') {
            const txBox = document.getElementById('transaction-id');
            txBox.textContent = data.txId;
            txBox.style.color = '#00ff88'; // glow green

            // Inject into Ledger
            const marketDesc = document.getElementById('market-id').textContent;
            addLedgerItem(marketDesc, data.txId);
        }
    };

    function addLedgerItem(marketDesc, txHash) {
        const list = document.getElementById('ledger-list');
        const emptyMsg = document.querySelector('.ledger-empty');
        if (emptyMsg) emptyMsg.remove();

        const item = document.createElement('div');
        item.className = 'ledger-item';
        
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                        now.getMinutes().toString().padStart(2, '0');

        item.innerHTML = `
            <div class="l-header">
                <span class="l-market" title="${marketDesc}">${marketDesc}</span>
                <span class="l-time">${timeStr}</span>
            </div>
            <div class="l-hash">${txHash}</div>
        `;

        // Add to top of list
        list.insertBefore(item, list.firstChild);
    }

    function appendLog(data) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';

        const timeString = new Date(data.timestamp).toLocaleTimeString();
        
        let msgHtml = `<span class="log-time">[${timeString}]</span>`;
        msgHtml += `<span class="log-module log-${data.module}">[${data.module}]</span>`;
        msgHtml += `<span>${data.message} ${data.error ? " - " + data.error : ""}</span>`;
        
        logEntry.innerHTML = msgHtml;
        terminal.appendChild(logEntry);
        
        // Auto scroll to bottom
        terminal.scrollTop = terminal.scrollHeight;

        // Keep terminal size manageable
        if (terminal.childElementCount > 200) {
            terminal.removeChild(terminal.firstChild);
        }
    }

    function updateDashboard(data) {
        // Market ID
        marketIdElem.textContent = data.market_id;

        // Reasoning
        reasoningText.textContent = data.reasoning;

        // Decision styling
        decisionElem.textContent = data.decision;
        decisionElem.className = 'value'; // reset classes
        
        let colorHex = '#e2e8f0'; // default white/gray
        
        if (data.decision === 'BUY_YES') {
            decisionElem.classList.add('text-green');
            colorHex = '#00ff88'; // var(--neon-green)
        } else if (data.decision === 'BUY_NO') {
            decisionElem.classList.add('text-red');
            colorHex = '#ff3366'; // var(--neon-red)
        } else {
            decisionElem.classList.add('text-yellow');
            colorHex = '#ffcc00'; // var(--neon-yellow)
        }

        // Animated Gauge Update
        const targetConfidence = Math.round(data.confidence * 100);
        confidenceValue.textContent = targetConfidence + '%';
        confidenceValue.style.color = colorHex;
        
        // Update conic gradient
        const deg = (targetConfidence / 100) * 360;
        confidenceRing.style.background = `conic-gradient(${colorHex} ${deg}deg, rgba(255, 255, 255, 0.05) 0deg)`;
    }
});
