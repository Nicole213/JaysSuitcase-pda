const MOLD_PALLET_RETURN_LANDMARKS = Object.freeze({
    'DB-MD-01': { palletCode: 'TP-MD-001', mode: 'bound' },
    'DB-MD-02': { palletCode: 'TP-MD-002', mode: 'bound' },
    'DB-MD-03': { palletCode: '', mode: 'empty' },
    'DB-MD-04': { palletCode: 'TP-MD-004', mode: 'bound' }
});

const moldPalletReturnState = {
    landmarkCode: '',
    matchedRecord: null
};

let landmarkAutoTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    bindMoldPalletReturnEvents();
    renderMoldPalletReturnPage();
});

function bindMoldPalletReturnEvents() {
    const landmarkCodeInput = document.getElementById('landmarkCodeInput');

    landmarkCodeInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitLandmarkCode();
        }
    });

    landmarkCodeInput.addEventListener('input', function() {
        clearTimeout(landmarkAutoTimer);
        const landmarkCode = normalizeCode(landmarkCodeInput.value);
        if (!landmarkCode || !MOLD_PALLET_RETURN_LANDMARKS[landmarkCode]) {
            return;
        }

        landmarkAutoTimer = setTimeout(submitLandmarkCode, 160);
    });

    document.getElementById('confirmInboundBtn').addEventListener('click', openConfirmModal);
    document.getElementById('confirmInboundSubmitBtn').addEventListener('click', submitInbound);
    document.getElementById('cancelInboundSubmitBtn').addEventListener('click', closeConfirmModal);
}

function submitLandmarkCode() {
    const landmarkCodeInput = document.getElementById('landmarkCodeInput');
    const landmarkCode = normalizeCode(landmarkCodeInput.value);

    if (!landmarkCode) {
        alert('请先扫描地标码。');
        landmarkCodeInput.focus();
        return;
    }

    const matchedRecord = MOLD_PALLET_RETURN_LANDMARKS[landmarkCode];
    if (!matchedRecord) {
        alert('未匹配到对应地标码，请重新输入。');
        landmarkCodeInput.focus();
        return;
    }

    moldPalletReturnState.landmarkCode = landmarkCode;
    moldPalletReturnState.matchedRecord = {
        palletCode: matchedRecord.palletCode || '',
        mode: matchedRecord.mode || 'bound'
    };

    renderMoldPalletReturnPage();
}

function openConfirmModal() {
    if (!isReadyToSubmit()) {
        alert('请先扫描地标码。');
        return;
    }

    document.getElementById('confirmLandmarkCode').textContent = moldPalletReturnState.landmarkCode || '-';
    document.getElementById('confirmInboundModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmInboundModal').classList.remove('active');
}

function submitInbound() {
    if (!isReadyToSubmit()) {
        closeConfirmModal();
        alert('当前回库信息不完整，请重新确认。');
        return;
    }

    const landmarkCode = moldPalletReturnState.landmarkCode;
    const matchedRecord = moldPalletReturnState.matchedRecord;
    closeConfirmModal();

    if (matchedRecord && matchedRecord.mode === 'empty') {
        alert(`地标码 ${landmarkCode} 已确认新空托回库。`);
    } else {
        alert(`地标码 ${landmarkCode} 已确认模具托盘回库。`);
    }

    resetMoldPalletReturnPage();
}

function renderMoldPalletReturnPage() {
    document.getElementById('landmarkHint').textContent = getLandmarkHintText();
    document.getElementById('confirmInboundBtn').disabled = !isReadyToSubmit();
}

function isReadyToSubmit() {
    return Boolean(moldPalletReturnState.landmarkCode && moldPalletReturnState.matchedRecord);
}

function getLandmarkHintText() {
    const landmarkCodes = Object.keys(MOLD_PALLET_RETURN_LANDMARKS);
    return landmarkCodes.length
        ? `可试用地标码：${landmarkCodes.join('、')}`
        : '可试用地标码：-';
}

function resetMoldPalletReturnPage() {
    clearTimeout(landmarkAutoTimer);
    moldPalletReturnState.landmarkCode = '';
    moldPalletReturnState.matchedRecord = null;

    document.getElementById('landmarkCodeInput').value = '';
    closeConfirmModal();
    renderMoldPalletReturnPage();
    document.getElementById('landmarkCodeInput').focus();
}

function normalizeCode(value) {
    return (value || '').trim().toUpperCase();
}
