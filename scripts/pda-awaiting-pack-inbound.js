// 待包装成品入库脚本
let currentTask = {
    palletCode: '',
    groundCode: ''
};

let inboundHistory = [];

document.addEventListener('DOMContentLoaded', function() {
    bindEvents();
    renderTask();
    renderHistory();
});

function bindEvents() {
    document.getElementById('scanPalletBtn').addEventListener('click', scanPalletCode);
    document.getElementById('palletCodeInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            scanPalletCode();
        }
    });

    document.getElementById('scanGroundBtn').addEventListener('click', scanGroundCode);
    document.getElementById('groundCodeInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            scanGroundCode();
        }
    });

    document.getElementById('clearPalletBtn').addEventListener('click', function() {
        document.getElementById('palletCodeInput').value = '';
        document.getElementById('palletCodeInput').focus();
    });

    document.getElementById('clearGroundBtn').addEventListener('click', function() {
        document.getElementById('groundCodeInput').value = '';
        document.getElementById('groundCodeInput').focus();
    });

    document.getElementById('confirmInboundBtn').addEventListener('click', confirmInbound);
}

function scanPalletCode() {
    const palletCode = document.getElementById('palletCodeInput').value.trim().toUpperCase();
    if (!palletCode) {
        alert('请先扫描托盘码。');
        return;
    }

    currentTask.palletCode = palletCode;
    renderTask();
    document.getElementById('groundCodeInput').focus();
}

function scanGroundCode() {
    const groundCode = document.getElementById('groundCodeInput').value.trim().toUpperCase();
    if (!groundCode) {
        alert('请先扫描地表码。');
        return;
    }

    currentTask.groundCode = groundCode;
    renderTask();
}

function confirmInbound() {
    if (!currentTask.palletCode) {
        alert('请先扫描托盘码。');
        document.getElementById('palletCodeInput').focus();
        return;
    }

    if (!currentTask.groundCode) {
        alert('请先扫描地表码。');
        document.getElementById('groundCodeInput').focus();
        return;
    }

    const record = {
        palletCode: currentTask.palletCode,
        groundCode: currentTask.groundCode,
        time: new Date().toLocaleString('zh-CN', { hour12: false })
    };

    inboundHistory.unshift(record);
    renderHistory();

    document.getElementById('successCard').style.display = 'block';
    document.getElementById('successDetailText').textContent =
        `托盘 ${record.palletCode} 已成功入库至地表码 ${record.groundCode}`;

    currentTask = {
        palletCode: '',
        groundCode: ''
    };

    document.getElementById('palletCodeInput').value = '';
    document.getElementById('groundCodeInput').value = '';
    renderTask();
    document.getElementById('palletCodeInput').focus();
}

function renderTask() {
    document.getElementById('currentPalletCode').textContent = currentTask.palletCode || '未扫描';
    document.getElementById('currentGroundCode').textContent = currentTask.groundCode || '未扫描';
    document.getElementById('taskStatusStrip').textContent = getTaskStatusText();
}

function getTaskStatusText() {
    if (currentTask.palletCode && currentTask.groundCode) {
        return '扫描完成，可确认入库';
    }

    if (currentTask.palletCode) {
        return '托盘码已扫描，请继续扫描地表码';
    }

    if (currentTask.groundCode) {
        return '地表码已扫描，请继续扫描托盘码';
    }

    return '等待扫描托盘码与地表码';
}

function renderHistory() {
    if (!inboundHistory.length) {
        document.getElementById('historyList').innerHTML =
            '<div class="history-empty">暂无入库记录，完成一托入库后将显示在这里。</div>';
        return;
    }

    const html = inboundHistory.map(function(item) {
        return `
            <div class="history-entry">
                <div class="history-entry-head">
                    <span class="history-pallet">${item.palletCode}</span>
                    <span class="history-time">${item.time}</span>
                </div>
                <div class="history-ground">入库地表码：${item.groundCode}</div>
            </div>
        `;
    }).join('');

    document.getElementById('historyList').innerHTML = html;
}
