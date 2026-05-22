const DEFAULT_MOLD_UNPALLET_PALLETS = Object.freeze({
    'TP-MD-001': [
        { moldCode: 'MJ-1001', moldModel: '行李箱前壳模具 A型' },
        { moldCode: 'MJ-1002', moldModel: '行李箱后壳模具 A型' },
        { moldCode: 'MJ-1003', moldModel: '拉链槽模具 A型' }
    ],
    'TP-MD-002': [
        { moldCode: 'MJ-2001', moldModel: '拉杆底座模具 B型' },
        { moldCode: 'MJ-2002', moldModel: '轮罩模具 B型' },
        { moldCode: 'MJ-2003', moldModel: '角码成型模具 B型' }
    ],
    'TP-MD-004': [
        { moldCode: 'MJ-3001', moldModel: '包角注塑模具 C型' },
        { moldCode: 'MJ-3002', moldModel: '提手注塑模具 C型' },
        { moldCode: 'MJ-3003', moldModel: '轮座注塑模具 C型' },
        { moldCode: 'MJ-3004', moldModel: '锁扣注塑模具 C型' }
    ]
});

let demoPallets = createDefaultDemoPallets();

const moldUnpalletState = {
    palletCode: '',
    palletMolds: [],
    selectedMoldCodes: []
};

let palletCodeAutoTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    bindMoldUnpalletEvents();
    renderMoldUnpalletPage();
});

function bindMoldUnpalletEvents() {
    const palletCodeInput = document.getElementById('palletCodeInput');

    palletCodeInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitPalletCode();
        }
    });

    palletCodeInput.addEventListener('input', function() {
        clearTimeout(palletCodeAutoTimer);
        const palletCode = normalizeCode(palletCodeInput.value);
        if (!palletCode || !demoPallets[palletCode]) {
            return;
        }

        palletCodeAutoTimer = setTimeout(submitPalletCode, 160);
    });

    document.getElementById('submitBtn').addEventListener('click', openConfirmModal);
    document.getElementById('confirmSubmitBtn').addEventListener('click', submitUnpallet);
    document.getElementById('cancelSubmitBtn').addEventListener('click', closeConfirmModal);
}

function submitPalletCode() {
    const palletCodeInput = document.getElementById('palletCodeInput');
    const palletCode = normalizeCode(palletCodeInput.value);

    if (!palletCode) {
        alert('请先扫描托盘码。');
        palletCodeInput.focus();
        return;
    }

    if (!demoPallets[palletCode]) {
        alert('未匹配到托盘信息，请重新输入托盘码。');
        palletCodeInput.focus();
        return;
    }

    moldUnpalletState.palletCode = palletCode;
    moldUnpalletState.palletMolds = cloneMolds(demoPallets[palletCode]);
    moldUnpalletState.selectedMoldCodes = [];

    renderMoldUnpalletPage();
}

function toggleMoldSelection(moldCode) {
    const normalizedCode = normalizeCode(moldCode);
    if (!normalizedCode) {
        return;
    }

    if (moldUnpalletState.selectedMoldCodes.includes(normalizedCode)) {
        moldUnpalletState.selectedMoldCodes = moldUnpalletState.selectedMoldCodes.filter(function(item) {
            return item !== normalizedCode;
        });
    } else {
        moldUnpalletState.selectedMoldCodes.push(normalizedCode);
    }

    renderMoldUnpalletPage();
}

function openConfirmModal() {
    if (!isReadyToSubmit()) {
        alert('请先选择需要下托的模具。');
        return;
    }

    document.getElementById('confirmPalletCode').textContent = moldUnpalletState.palletCode || '-';
    document.getElementById('confirmMoldCount').textContent = String(moldUnpalletState.selectedMoldCodes.length);
    renderConfirmMoldList();
    document.getElementById('confirmSubmitModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmSubmitModal').classList.remove('active');
}

function submitUnpallet() {
    if (!isReadyToSubmit()) {
        closeConfirmModal();
        alert('当前下托信息不完整，请重新确认。');
        return;
    }

    const palletCode = moldUnpalletState.palletCode;
    const selectedCodes = moldUnpalletState.selectedMoldCodes.slice();

    demoPallets[palletCode] = demoPallets[palletCode].filter(function(item) {
        return !selectedCodes.includes(item.moldCode);
    });

    closeConfirmModal();
    alert(`托盘 ${palletCode} 已解绑 ${selectedCodes.length} 个模具。`);
    resetMoldUnpalletPage();
}

function renderMoldUnpalletPage() {
    document.getElementById('palletHint').textContent = getPalletHintText();
    document.getElementById('selectedMoldCount').textContent = String(moldUnpalletState.selectedMoldCodes.length);
    renderMoldOptions();
    updateSubmitButtonState();
}

function renderMoldOptions() {
    const moldList = document.getElementById('moldList');
    moldList.innerHTML = '';
    moldList.classList.toggle('is-idle', !moldUnpalletState.palletCode);
    moldList.classList.toggle('is-empty', Boolean(moldUnpalletState.palletCode) && !moldUnpalletState.palletMolds.length);

    moldUnpalletState.palletMolds.forEach(function(item) {
        const isSelected = moldUnpalletState.selectedMoldCodes.includes(item.moldCode);

        const moldItem = document.createElement('label');
        moldItem.className = `mold-option-item${isSelected ? ' is-selected' : ''}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'mold-option-checkbox';
        checkbox.checked = isSelected;
        checkbox.addEventListener('change', function() {
            toggleMoldSelection(item.moldCode);
        });

        const content = document.createElement('div');
        content.className = 'mold-option-content';

        const code = document.createElement('div');
        code.className = 'mold-option-code';
        code.textContent = item.moldCode;

        const model = document.createElement('div');
        model.className = 'mold-option-model';
        model.textContent = item.moldModel;

        content.appendChild(code);
        content.appendChild(model);

        moldItem.appendChild(checkbox);
        moldItem.appendChild(content);
        moldList.appendChild(moldItem);
    });
}

function renderConfirmMoldList() {
    const confirmList = document.getElementById('confirmMoldList');
    confirmList.innerHTML = '';

    if (!moldUnpalletState.selectedMoldCodes.length) {
        const emptyNode = document.createElement('div');
        emptyNode.className = 'modal-mold-chip is-empty';
        emptyNode.textContent = '暂无模具';
        confirmList.appendChild(emptyNode);
        return;
    }

    moldUnpalletState.selectedMoldCodes.forEach(function(moldCode) {
        const target = moldUnpalletState.palletMolds.find(function(item) {
            return item.moldCode === moldCode;
        });

        const chip = document.createElement('div');
        chip.className = 'modal-mold-chip';
        chip.textContent = target ? `${target.moldCode} / ${target.moldModel}` : moldCode;
        confirmList.appendChild(chip);
    });
}

function updateSubmitButtonState() {
    document.getElementById('submitBtn').disabled = !isReadyToSubmit();
}

function isReadyToSubmit() {
    return Boolean(
        moldUnpalletState.palletCode
        && moldUnpalletState.palletMolds.length
        && moldUnpalletState.selectedMoldCodes.length
    );
}

function resetMoldUnpalletPage() {
    clearTimeout(palletCodeAutoTimer);
    moldUnpalletState.palletCode = '';
    moldUnpalletState.palletMolds = [];
    moldUnpalletState.selectedMoldCodes = [];

    document.getElementById('palletCodeInput').value = '';
    closeConfirmModal();
    renderMoldUnpalletPage();
    document.getElementById('palletCodeInput').focus();
}

function getPalletHintText() {
    const palletCodes = Object.keys(demoPallets);
    return palletCodes.length
        ? `可试用托盘码：${palletCodes.join('、')}`
        : '可试用托盘码：-';
}

function createDefaultDemoPallets() {
    const result = {};

    Object.keys(DEFAULT_MOLD_UNPALLET_PALLETS).forEach(function(palletCode) {
        result[palletCode] = cloneMolds(DEFAULT_MOLD_UNPALLET_PALLETS[palletCode]);
    });

    return result;
}

function cloneMolds(list) {
    return list.map(function(item) {
        return {
            moldCode: item.moldCode,
            moldModel: item.moldModel
        };
    });
}

function normalizeCode(value) {
    return (value || '').trim().toUpperCase();
}
