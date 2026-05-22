const STOCK_PALLETIZING_SN_MAP = {
    'SN-CH-20260522-001': {
        materialCode: 'WL-CH-001',
        materialName: '20寸拉杆箱'
    },
    'SN-CH-20260522-002': {
        materialCode: 'WL-CH-002',
        materialName: '24寸拉杆箱'
    },
    'SN-CH-20260522-003': {
        materialCode: 'WL-CH-003',
        materialName: '28寸拉杆箱'
    },
    'SN-CH-20260522-004': {
        materialCode: 'WL-CH-004',
        materialName: '登机箱套装'
    }
};

const palletizingState = {
    palletCode: '',
    snCode: '',
    materialCode: '',
    materialName: ''
};

document.addEventListener('DOMContentLoaded', function() {
    bindStockPalletizingEvents();
    renderDemoSnHint();
    resetStockPalletizingPage();
});

function bindStockPalletizingEvents() {
    document.getElementById('confirmPalletizingBtn').addEventListener('click', openConfirmModal);
    document.getElementById('confirmSubmitBtn').addEventListener('click', submitStockPalletizing);
    document.getElementById('cancelSubmitBtn').addEventListener('click', closeConfirmModal);

    document.getElementById('palletCodeInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            scanPalletCode();
        }
    });

    document.getElementById('snCodeInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            scanSnCode();
        }
    });

    document.getElementById('palletCodeInput').addEventListener('blur', function() {
        if (this.value.trim()) {
            scanPalletCode();
        }
    });

    document.getElementById('snCodeInput').addEventListener('blur', function() {
        if (this.value.trim()) {
            scanSnCode();
        }
    });
}

function scanPalletCode() {
    const palletCodeInput = document.getElementById('palletCodeInput');
    const nextPalletCode = normalizeCode(palletCodeInput.value);

    if (!nextPalletCode) {
        alert('请先扫描托盘码。');
        palletCodeInput.focus();
        return;
    }

    const isNewPallet = nextPalletCode !== palletizingState.palletCode;
    palletizingState.palletCode = nextPalletCode;
    palletCodeInput.value = nextPalletCode;

    if (isNewPallet) {
        clearSnAndMaterial();
    }

    document.getElementById('snCodeInput').disabled = false;
    document.getElementById('snCodeInput').focus();
    updateConfirmButtonState();
}

function scanSnCode() {
    const palletCode = palletizingState.palletCode || normalizeCode(document.getElementById('palletCodeInput').value);
    const snCodeInput = document.getElementById('snCodeInput');
    const snCode = normalizeCode(snCodeInput.value);

    if (!palletCode) {
        alert('请先扫描托盘码。');
        document.getElementById('palletCodeInput').focus();
        return;
    }

    if (!snCode) {
        alert('请先扫描SN码。');
        snCodeInput.focus();
        return;
    }

    const matchedMaterial = STOCK_PALLETIZING_SN_MAP[snCode];
    if (!matchedMaterial) {
        alert('未查询到该SN码对应的物料信息。');
        clearSnAndMaterial();
        snCodeInput.focus();
        return;
    }

    palletizingState.palletCode = palletCode;
    palletizingState.snCode = snCode;
    palletizingState.materialCode = matchedMaterial.materialCode;
    palletizingState.materialName = matchedMaterial.materialName;

    snCodeInput.value = snCode;
    renderMaterialInfo();
    updateConfirmButtonState();
}

function openConfirmModal() {
    if (!isReadyToSubmit()) {
        alert('请先完成托盘码和SN码扫描。');
        return;
    }

    document.getElementById('confirmPalletCode').textContent = palletizingState.palletCode;
    document.getElementById('confirmSnCode').textContent = palletizingState.snCode;
    document.getElementById('confirmMaterialCode').textContent = palletizingState.materialCode;
    document.getElementById('confirmMaterialName').textContent = palletizingState.materialName;
    document.getElementById('confirmPalletizingModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmPalletizingModal').classList.remove('active');
}

function submitStockPalletizing() {
    if (!isReadyToSubmit()) {
        closeConfirmModal();
        alert('当前组盘信息不完整，请重新扫描。');
        return;
    }

    closeConfirmModal();
    alert(`托盘 ${palletizingState.palletCode} 已完成组盘。`);
    resetStockPalletizingPage();
}

function renderDemoSnHint() {
    const demoSnCodes = Object.keys(STOCK_PALLETIZING_SN_MAP);
    document.getElementById('demoSnHint').textContent = demoSnCodes.length
        ? `可试用SN码：${demoSnCodes.join('、')}`
        : '可试用SN码：-';
}

function renderMaterialInfo() {
    document.getElementById('materialCodeText').textContent = palletizingState.materialCode || '-';
    document.getElementById('materialNameText').textContent = palletizingState.materialName || '-';
}

function updateConfirmButtonState() {
    document.getElementById('confirmPalletizingBtn').disabled = !isReadyToSubmit();
}

function isReadyToSubmit() {
    return Boolean(
        palletizingState.palletCode
        && palletizingState.snCode
        && palletizingState.materialCode
        && palletizingState.materialName
    );
}

function clearSnAndMaterial() {
    palletizingState.snCode = '';
    palletizingState.materialCode = '';
    palletizingState.materialName = '';
    document.getElementById('snCodeInput').value = '';
    renderMaterialInfo();
}

function resetStockPalletizingPage() {
    palletizingState.palletCode = '';
    clearSnAndMaterial();
    document.getElementById('palletCodeInput').value = '';
    document.getElementById('snCodeInput').disabled = true;
    closeConfirmModal();
    updateConfirmButtonState();
    document.getElementById('palletCodeInput').focus();
}

function normalizeCode(value) {
    return (value || '').trim().toUpperCase();
}
