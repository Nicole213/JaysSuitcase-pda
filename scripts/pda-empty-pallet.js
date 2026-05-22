const EMPTY_PALLET_STATUS_MAP = {
    'TP-KT-001': { status: 'loaded' },
    'TP-KT-002': { status: 'loaded' },
    'TP-KT-003': { status: 'empty' },
    'TP-KT-004': { status: 'loaded' }
};

document.addEventListener('DOMContentLoaded', function() {
    bindEmptyPalletEvents();
    renderDemoEmptyPalletHint();
    resetEmptyPalletPage();
});

function bindEmptyPalletEvents() {
    document.getElementById('confirmEmptyPalletBtn').addEventListener('click', openEmptyPalletConfirmModal);
    document.getElementById('confirmEmptyPalletSubmitBtn').addEventListener('click', submitEmptyPalletMark);
    document.getElementById('cancelEmptyPalletSubmitBtn').addEventListener('click', closeEmptyPalletConfirmModal);

    document.getElementById('emptyPalletCodeInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            resolveEmptyPalletCode();
        }
    });

    document.getElementById('emptyPalletCodeInput').addEventListener('blur', function() {
        if (this.value.trim()) {
            resolveEmptyPalletCode();
        }
    });
}

function resolveEmptyPalletCode() {
    const palletCodeInput = document.getElementById('emptyPalletCodeInput');
    const palletCode = normalizeCode(palletCodeInput.value);

    palletCodeInput.value = palletCode;
    return palletCode;
}

function openEmptyPalletConfirmModal() {
    const palletCode = resolveEmptyPalletCode();

    if (!palletCode) {
        alert('请先扫描托盘码。');
        document.getElementById('emptyPalletCodeInput').focus();
        return;
    }

    const palletRecord = EMPTY_PALLET_STATUS_MAP[palletCode];
    if (!palletRecord) {
        alert('未匹配到托盘信息。');
        document.getElementById('emptyPalletCodeInput').focus();
        return;
    }

    if (palletRecord.status === 'empty') {
        alert('该托盘当前已为空托。');
        document.getElementById('emptyPalletCodeInput').focus();
        return;
    }

    document.getElementById('confirmEmptyPalletCode').textContent = palletCode;
    document.getElementById('confirmEmptyPalletModal').classList.add('active');
}

function closeEmptyPalletConfirmModal() {
    document.getElementById('confirmEmptyPalletModal').classList.remove('active');
}

function submitEmptyPalletMark() {
    const palletCode = document.getElementById('confirmEmptyPalletCode').textContent;
    const palletRecord = EMPTY_PALLET_STATUS_MAP[palletCode];

    if (!palletRecord) {
        closeEmptyPalletConfirmModal();
        alert('当前托盘不存在，请重新扫描。');
        resetEmptyPalletPage();
        return;
    }

    if (palletRecord.status === 'empty') {
        closeEmptyPalletConfirmModal();
        alert('该托盘当前已为空托。');
        resetEmptyPalletPage();
        return;
    }

    palletRecord.status = 'empty';
    closeEmptyPalletConfirmModal();
    alert(`托盘 ${palletCode} 已标记为空托。`);
    resetEmptyPalletPage();
}

function renderDemoEmptyPalletHint() {
    const demoPalletCodes = Object.keys(EMPTY_PALLET_STATUS_MAP);
    document.getElementById('demoEmptyPalletHint').textContent = demoPalletCodes.length
        ? `可试用托盘码：${demoPalletCodes.join('、')}`
        : '可试用托盘码：-';
}

function resetEmptyPalletPage() {
    document.getElementById('emptyPalletCodeInput').value = '';
    document.getElementById('confirmEmptyPalletCode').textContent = '-';
    closeEmptyPalletConfirmModal();
    document.getElementById('emptyPalletCodeInput').focus();
}

function normalizeCode(value) {
    return (value || '').trim().toUpperCase();
}
