const MOLD_PALLETIZING_LANDMARK_BINDINGS = Object.freeze({
    'DB-MD-01': 'TP-MD-001',
    'DB-MD-02': 'TP-MD-002',
    'DB-MD-03': ''
});

const MOLD_PALLETIZING_PALLETS = Object.freeze({
    'TP-MD-001': {
        molds: [
            { moldCode: 'MJ-1001', moldModel: '行李箱前壳模具 A型' },
            { moldCode: 'MJ-1002', moldModel: '行李箱后壳模具 A型' }
        ]
    },
    'TP-MD-002': {
        molds: [
            { moldCode: 'MJ-2001', moldModel: '拉杆底座模具 B型' }
        ]
    },
    'TP-MD-003': {
        molds: []
    },
    'TP-MD-004': {
        molds: [
            { moldCode: 'MJ-3001', moldModel: '包角注塑模具 C型' },
            { moldCode: 'MJ-3002', moldModel: '提手注塑模具 C型' },
            { moldCode: 'MJ-3003', moldModel: '轮座注塑模具 C型' }
        ]
    }
});

const MOLD_PALLETIZING_MOLD_MAP = Object.freeze({
    'MJ-1001': { moldModel: '行李箱前壳模具 A型' },
    'MJ-1002': { moldModel: '行李箱后壳模具 A型' },
    'MJ-1003': { moldModel: '拉链槽模具 A型' },
    'MJ-1004': { moldModel: '内衬压合模具 A型' },
    'MJ-2001': { moldModel: '拉杆底座模具 B型' },
    'MJ-2002': { moldModel: '轮罩模具 B型' },
    'MJ-2003': { moldModel: '角码成型模具 B型' },
    'MJ-3001': { moldModel: '包角注塑模具 C型' },
    'MJ-3002': { moldModel: '提手注塑模具 C型' },
    'MJ-3003': { moldModel: '轮座注塑模具 C型' },
    'MJ-3004': { moldModel: '锁扣注塑模具 C型' }
});

const moldPalletizingState = {
    landmarkCode: '',
    suggestedPalletCode: '',
    palletCode: '',
    currentMolds: [],
    pendingMolds: []
};

let landmarkAutoTimer = null;
let palletAutoTimer = null;
let moldAutoTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    bindMoldPalletizingEvents();
    renderMoldPalletizingPage();
});

function bindMoldPalletizingEvents() {
    const landmarkCodeInput = document.getElementById('landmarkCodeInput');
    const palletCodeInput = document.getElementById('palletCodeInput');
    const moldCodeInput = document.getElementById('moldCodeInput');

    landmarkCodeInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitLandmarkCode();
        }
    });

    landmarkCodeInput.addEventListener('input', function() {
        clearTimeout(landmarkAutoTimer);
        const landmarkCode = normalizeCode(landmarkCodeInput.value);
        if (!landmarkCode || !(landmarkCode in MOLD_PALLETIZING_LANDMARK_BINDINGS)) {
            return;
        }

        landmarkAutoTimer = setTimeout(submitLandmarkCode, 160);
    });

    palletCodeInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitPalletCode();
        }
    });

    palletCodeInput.addEventListener('input', function() {
        clearTimeout(palletAutoTimer);
        const palletCode = normalizeCode(palletCodeInput.value);
        if (!palletCode || !getPalletInfo(palletCode)) {
            return;
        }

        palletAutoTimer = setTimeout(submitPalletCode, 160);
    });

    moldCodeInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addPendingMold();
        }
    });

    moldCodeInput.addEventListener('input', function() {
        clearTimeout(moldAutoTimer);
        const moldCode = normalizeCode(moldCodeInput.value);
        if (!moldCode || !MOLD_PALLETIZING_MOLD_MAP[moldCode]) {
            return;
        }

        moldAutoTimer = setTimeout(addPendingMold, 160);
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

    if (!(landmarkCode in MOLD_PALLETIZING_LANDMARK_BINDINGS)) {
        alert('未匹配到对应地标码，请重新输入。');
        landmarkCodeInput.focus();
        return;
    }

    moldPalletizingState.landmarkCode = landmarkCode;
    moldPalletizingState.suggestedPalletCode = MOLD_PALLETIZING_LANDMARK_BINDINGS[landmarkCode] || '';
    document.getElementById('palletCodeInput').disabled = false;

    if (moldPalletizingState.suggestedPalletCode) {
        document.getElementById('palletCodeInput').value = moldPalletizingState.suggestedPalletCode;
        loadPalletInfo(moldPalletizingState.suggestedPalletCode);
        document.getElementById('palletCodeInput').focus();
        document.getElementById('palletCodeInput').select();
        return;
    }

    resetPalletSelection();
    renderMoldPalletizingPage();
    document.getElementById('palletCodeInput').focus();
}

function submitPalletCode() {
    if (!moldPalletizingState.landmarkCode) {
        alert('请先扫描地标码。');
        document.getElementById('landmarkCodeInput').focus();
        return;
    }

    const palletCodeInput = document.getElementById('palletCodeInput');
    const palletCode = normalizeCode(palletCodeInput.value);

    if (!palletCode) {
        alert('请先扫描托盘码。');
        palletCodeInput.focus();
        return;
    }

    if (!getPalletInfo(palletCode)) {
        alert('未匹配到托盘信息，请重新输入托盘码。');
        palletCodeInput.focus();
        return;
    }

    loadPalletInfo(palletCode);
    document.getElementById('moldCodeInput').focus();
}

function loadPalletInfo(palletCode) {
    const palletInfo = getPalletInfo(palletCode);
    if (!palletInfo) {
        return;
    }

    const nextPalletCode = normalizeCode(palletCode);
    const isPalletChanged = moldPalletizingState.palletCode !== nextPalletCode;

    moldPalletizingState.palletCode = nextPalletCode;
    moldPalletizingState.currentMolds = cloneArray(palletInfo.molds);

    if (isPalletChanged) {
        moldPalletizingState.pendingMolds = [];
        document.getElementById('moldCodeInput').value = '';
    }

    document.getElementById('palletCodeInput').value = nextPalletCode;
    document.getElementById('moldCodeInput').disabled = false;
    renderMoldPalletizingPage();
}

function addPendingMold() {
    if (!moldPalletizingState.palletCode) {
        alert('请先确认托盘码。');
        document.getElementById('palletCodeInput').focus();
        return;
    }

    const moldCodeInput = document.getElementById('moldCodeInput');
    const moldCode = normalizeCode(moldCodeInput.value);

    if (!moldCode) {
        alert('请先输入模具编号。');
        moldCodeInput.focus();
        return;
    }

    const moldInfo = MOLD_PALLETIZING_MOLD_MAP[moldCode];
    if (!moldInfo) {
        alert('未匹配到模具编号，请重新输入。');
        moldCodeInput.focus();
        return;
    }

    if (moldPalletizingState.currentMolds.some(function(item) { return item.moldCode === moldCode; })) {
        alert('该模具已在当前托盘内。');
        moldCodeInput.value = '';
        moldCodeInput.focus();
        return;
    }

    if (moldPalletizingState.pendingMolds.some(function(item) { return item.moldCode === moldCode; })) {
        alert('该模具已在本次新增列表中。');
        moldCodeInput.value = '';
        moldCodeInput.focus();
        return;
    }

    moldPalletizingState.pendingMolds.push({
        moldCode: moldCode,
        moldModel: moldInfo.moldModel
    });

    moldCodeInput.value = '';
    renderMoldPalletizingPage();
    moldCodeInput.focus();
}

function removePendingMold(moldCode) {
    moldPalletizingState.pendingMolds = moldPalletizingState.pendingMolds.filter(function(item) {
        return item.moldCode !== moldCode;
    });
    renderMoldPalletizingPage();
    document.getElementById('moldCodeInput').focus();
}

function openConfirmModal() {
    if (!isReadyToSubmit()) {
        alert('请先完成托盘确认并录入本次新增模具。');
        return;
    }

    document.getElementById('confirmLandmarkCode').textContent = moldPalletizingState.landmarkCode;
    document.getElementById('confirmPalletCode').textContent = moldPalletizingState.palletCode;
    document.getElementById('confirmExistingCount').textContent = String(moldPalletizingState.currentMolds.length);
    document.getElementById('confirmPendingCount').textContent = String(moldPalletizingState.pendingMolds.length);
    renderConfirmMoldList();
    document.getElementById('confirmInboundModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmInboundModal').classList.remove('active');
}

function submitInbound() {
    if (!isReadyToSubmit()) {
        closeConfirmModal();
        alert('当前组盘入库信息不完整，请重新确认。');
        return;
    }

    const inboundPalletCode = moldPalletizingState.palletCode;
    closeConfirmModal();
    alert(`托盘 ${inboundPalletCode} 已完成模具组盘入库。`);
    resetMoldPalletizingPage();
}

function renderMoldPalletizingPage() {
    const landmarkCodes = Object.keys(MOLD_PALLETIZING_LANDMARK_BINDINGS);
    const demoPalletCodes = Object.keys(MOLD_PALLETIZING_PALLETS);

    document.getElementById('landmarkHint').textContent = landmarkCodes.length
        ? `可试用地标码：${landmarkCodes.join('、')}`
        : '可试用地标码：-';

    document.getElementById('palletHint').textContent = getPalletHintText(demoPalletCodes);
    document.getElementById('moldHint').textContent = getMoldHintText();

    const hasPallet = Boolean(moldPalletizingState.palletCode);
    document.getElementById('moldCodeInput').disabled = !hasPallet;
    document.getElementById('confirmInboundBtn').disabled = !isReadyToSubmit();

    const summary = document.getElementById('palletSummary');
    summary.classList.toggle('is-empty', !hasPallet);
    document.getElementById('summaryPalletCode').textContent = hasPallet ? moldPalletizingState.palletCode : '待识别托盘';
    document.getElementById('summaryPalletMeta').textContent = hasPallet
        ? `当前托盘内已有 ${moldPalletizingState.currentMolds.length} 个模具`
        : '扫描地标码和托盘码后查看当前托盘内模具';

    document.getElementById('currentMoldCount').textContent = String(moldPalletizingState.currentMolds.length);
    document.getElementById('pendingMoldCount').textContent = String(moldPalletizingState.pendingMolds.length);

    renderMoldList('currentMoldList', moldPalletizingState.currentMolds, false);
    renderMoldList('pendingMoldList', moldPalletizingState.pendingMolds, true);
}

function renderMoldList(containerId, list, removable) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.classList.toggle('is-empty', !list.length);

    list.forEach(function(item) {
        const moldItem = document.createElement('div');
        moldItem.className = 'mold-item';

        const head = document.createElement('div');
        head.className = 'mold-item-head';

        const info = document.createElement('div');
        const code = document.createElement('div');
        code.className = 'mold-item-code';
        code.textContent = item.moldCode;
        const model = document.createElement('div');
        model.className = 'mold-item-model';
        model.textContent = item.moldModel;
        info.appendChild(code);
        info.appendChild(model);
        head.appendChild(info);

        if (removable) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'mold-delete-btn';
            deleteBtn.type = 'button';
            deleteBtn.textContent = '删除';
            deleteBtn.addEventListener('click', function() {
                removePendingMold(item.moldCode);
            });
            head.appendChild(deleteBtn);
        } else {
            const badge = document.createElement('span');
            badge.className = 'mold-item-badge';
            badge.textContent = '已在托';
            head.appendChild(badge);
        }

        moldItem.appendChild(head);
        container.appendChild(moldItem);
    });
}

function renderConfirmMoldList() {
    const confirmList = document.getElementById('confirmMoldList');
    confirmList.innerHTML = '';

    if (!moldPalletizingState.pendingMolds.length) {
        const emptyNode = document.createElement('div');
        emptyNode.className = 'modal-mold-chip is-empty';
        emptyNode.textContent = '暂无新增模具';
        confirmList.appendChild(emptyNode);
        return;
    }

    moldPalletizingState.pendingMolds.forEach(function(item) {
        const chip = document.createElement('div');
        chip.className = 'modal-mold-chip';
        chip.textContent = `${item.moldCode} / ${item.moldModel}`;
        confirmList.appendChild(chip);
    });
}

function getPalletHintText(demoPalletCodes) {
    if (!moldPalletizingState.landmarkCode) {
        return '请先扫描地标码';
    }

    if (moldPalletizingState.suggestedPalletCode) {
        return `系统已带出托盘码：${moldPalletizingState.suggestedPalletCode}，也可重新扫描覆盖`;
    }

    return demoPalletCodes.length
        ? `当前地标码未绑定托盘，可试用托盘码：${demoPalletCodes.join('、')}`
        : '当前地标码未绑定托盘，请手动扫描托盘码';
}

function getMoldHintText() {
    const demoMoldCodes = Object.keys(MOLD_PALLETIZING_MOLD_MAP);
    if (!moldPalletizingState.palletCode) {
        return '请先确认托盘码';
    }

    return demoMoldCodes.length
        ? `可试用模具编号：${demoMoldCodes.join('、')}`
        : '请输入模具编号';
}

function getPalletInfo(palletCode) {
    const normalizedCode = normalizeCode(palletCode);
    return MOLD_PALLETIZING_PALLETS[normalizedCode] || null;
}

function isReadyToSubmit() {
    return Boolean(
        moldPalletizingState.landmarkCode
        && moldPalletizingState.palletCode
        && moldPalletizingState.pendingMolds.length
    );
}

function resetPalletSelection() {
    moldPalletizingState.palletCode = '';
    moldPalletizingState.currentMolds = [];
    moldPalletizingState.pendingMolds = [];
    document.getElementById('palletCodeInput').value = '';
    document.getElementById('moldCodeInput').value = '';
    document.getElementById('moldCodeInput').disabled = true;
}

function resetMoldPalletizingPage() {
    clearTimeout(landmarkAutoTimer);
    clearTimeout(palletAutoTimer);
    clearTimeout(moldAutoTimer);

    moldPalletizingState.landmarkCode = '';
    moldPalletizingState.suggestedPalletCode = '';
    resetPalletSelection();

    document.getElementById('landmarkCodeInput').value = '';
    document.getElementById('palletCodeInput').disabled = true;
    closeConfirmModal();
    renderMoldPalletizingPage();
    document.getElementById('landmarkCodeInput').focus();
}

function normalizeCode(value) {
    return (value || '').trim().toUpperCase();
}

function cloneArray(list) {
    return list.map(function(item) {
        return {
            moldCode: item.moldCode,
            moldModel: item.moldModel
        };
    });
}
