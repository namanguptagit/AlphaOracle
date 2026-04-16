document.addEventListener('DOMContentLoaded', () => {
    const terminal = document.getElementById('terminal');
    const confidenceValue = document.getElementById('confidence-value');
    const confidenceRing = document.getElementById('confidence-ring');
    const marketIdElem = document.getElementById('market-id');
    const decisionElem = document.getElementById('execution-decision');
    const reasoningText = document.getElementById('reasoning-text');
    const liveBadge = document.getElementById('live-badge');
    const powerBtn = document.getElementById('power-btn');
    const alertBanner = document.getElementById('critical-alert');
    const alertMessage = document.getElementById('alert-message');

    let isRunning = false;

    // Fetch Initial Status
    fetch('/api/status').then(r => r.json()).then(data => {
        updatePowerState(data.running);
        if (data.tradeAmount !== undefined) {
            const amountEl = document.getElementById('trade-amount');
            if (amountEl) amountEl.textContent = '$' + data.tradeAmount.toFixed(2);
            const amountInput = document.getElementById('amount-input');
            if (amountInput) amountInput.value = data.tradeAmount.toFixed(2);
        }
    });

    // Connect to SSE
    const evtSource = new EventSource('/api/stream');

    evtSource.onmessage = function(event) {
        const data = JSON.parse(event.data);

        if (data.event === 'alert') {
            alertBanner.classList.remove('hidden');
            if(data.message) alertMessage.textContent = data.message;
            updatePowerState(false); // Engine auto-stopped on error limits
        } else if (data.event === 'log') {
            appendLog(data);
        } else if (data.event === 'decision') {
            updateDashboard(data);
        } else if (data.event === 'execution') {
            const txBox = document.getElementById('transaction-id');
            txBox.textContent = data.txId;
            txBox.style.color = '#4ade80';

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

    powerBtn.addEventListener('click', async () => {
        if (isRunning) {
            await fetch('/api/stop', { method: 'POST' });
            updatePowerState(false);
        } else {
            // hide any previous alerts
            alertBanner.classList.add('hidden');

            // Send trade amount from input before starting
            const amountInput = document.getElementById('amount-input');
            const amount = parseFloat(amountInput.value) || 0.10;
            await fetch('/api/trade-amount', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });
            const amountEl = document.getElementById('trade-amount');
            if (amountEl) amountEl.textContent = '$' + amount.toFixed(2);

            await fetch('/api/start', { method: 'POST' });
            updatePowerState(true);
        }
    });

    function updatePowerState(running) {
        isRunning = running;
        if (isRunning) {
            powerBtn.textContent = 'Stop Agent';
            powerBtn.classList.add('running');
            liveBadge.textContent = 'Live';
            liveBadge.classList.add('active');
        } else {
            powerBtn.textContent = 'Start Agent';
            powerBtn.classList.remove('running');
            liveBadge.textContent = 'Idle';
            liveBadge.classList.remove('active');
        }
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
        decisionElem.className = 'value'; // reset classes
        
        let colorHex = '#f0f0f0';
        const targetConfidence = Math.round(data.confidence * 100);

        decisionElem.textContent = data.decision;
        if (data.decision === 'BUY_YES') {
            decisionElem.classList.add('text-green');
            colorHex = '#4ade80';
        } else if (data.decision === 'BUY_NO') {
            decisionElem.classList.add('text-red');
            colorHex = '#f87171';
        } else {
            decisionElem.classList.add('text-yellow');
            colorHex = '#fbbf24';
        }

        // If below threshold, override execution display to CANCELLED
        if (targetConfidence < 75 || data.decision === 'HOLD') {
            decisionElem.textContent = 'CANCELLED';
            decisionElem.classList.add('text-yellow');
            colorHex = '#fbbf24';
        }

        // Reset TX ID for this new cycle (execution event will update it if trade goes through)
        const txBox = document.getElementById('transaction-id');
        txBox.textContent = 'N/A';
        txBox.style.color = '';

        // Animated Gauge Update
        confidenceValue.textContent = targetConfidence + '%';
        confidenceValue.style.color = colorHex;
        
        // Update conic gradient
        const deg = (targetConfidence / 100) * 360;
        confidenceRing.style.background = `conic-gradient(${colorHex} ${deg}deg, rgba(255, 255, 255, 0.05) 0deg)`;
    }
});
