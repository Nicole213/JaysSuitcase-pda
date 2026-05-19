// 待包装成品入库脚本
let currentGroundCode = '';

document.addEventListener('DOMContentLoaded', function() {
    bindEvents();
});

function bindEvents() {
    document.getElementById('groundCodeInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            updateGroundCode();
        }
    });

    document.getElementById('clearGroundBtn').addEventListener('click', function() {
        currentGroundCode = '';
        document.getElementById('groundCodeInput').value = '';
        document.getElementById('groundCodeInput').focus();
    });

    document.getElementById('confirmInboundBtn').addEventListener('click', confirmInbound);
}

function updateGroundCode() {
    const groundCode = document.getElementById('groundCodeInput').value.trim().toUpperCase();
    currentGroundCode = groundCode;
    document.getElementById('groundCodeInput').value = groundCode;
    return groundCode;
}

function confirmInbound() {
    const groundCode = updateGroundCode();

    if (!groundCode) {
        alert('请先扫描地标码。');
        document.getElementById('groundCodeInput').focus();
        return;
    }

    document.getElementById('successCard').style.display = 'block';
    document.getElementById('successDetailText').textContent =
        `待包装成品已成功入库至地标码 ${groundCode}`;

    currentGroundCode = '';
    document.getElementById('groundCodeInput').value = '';
    document.getElementById('groundCodeInput').focus();
}
