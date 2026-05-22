const MOLD_OUTBOUND_REGIONS = ['区域1', '区域2', '区域3'];

const MOLD_OUTBOUND_PALLETS = Object.freeze({
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

const moldOutboundIndex = createMoldOutboundIndex();

const moldOutboundState = {
    requestMoldCode: '',
    palletCode: '',
    palletMolds: [],
    selectedMoldCodes: [],
    selectedRegion: ''
};

let moldCodeAutoTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    bindMoldOutboundEvents();
    renderMoldOutboundPage();
});

function bindMoldOutboundEvents() {
    const moldCodeInput = document.getElementById('moldCodeInput');

    moldCodeInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitMoldCode();
        }
    });

    moldCodeInput.addEventListener('input', function() {
        clearTimeout(moldCodeAutoTimer);
        const moldCode = normalizeCode(moldCodeInput.value);
        if (!moldCode || !moldOutboundIndex[moldCode]) {
            return;
        }

        moldCodeAutoTimer = setTimeout(submitMoldCode, 160);
    });

    document.querySelectorAll('.region-option-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            selectRegion(button.dataset.region || '');
        });
    });

    document.getElementById('confirmOutboundBtn').addEventListener('click', openConfirmModal);
    document.getElementById('confirmOutboundSubmitBtn').addEventListener('click', submitOutbound);
    document.getElementById('cancelOutboundSubmitBtn').addEventListener('click', closeConfirmModal);
}

function submitMoldCode() {
    const moldCodeInput = document.getElementById('moldCodeInput');
    const moldCode = normalizeCode(moldCodeInput.value);

    if (!moldCode) {
        alert('请先输入模具编号。');
        moldCodeInput.focus();
        return;
    }

    const matched = moldOutboundIndex[moldCode];
    if (!matched) {
        alert('未匹配到该模具编号，请重新输入。');
        moldCodeInput.focus();
        return;
    }

    moldOutboundState.requestMoldCode = moldCode;
    moldOutboundState.palletCode = matched.palletCode;
    moldOutboundState.palletMolds = cloneMolds(MOLD_OUTBOUND_PALLETS[matched.palletCode] || []);
    moldOutboundState.selectedMoldCodes = [moldCode];
    moldOutboundState.selectedRegion = '';

    syncRegionSelection();
    renderMoldOutboundPage();
}

function toggleMoldSelection(moldCode) {
    const normalizedCode = normalizeCode(moldCode);
    if (!normalizedCode) {
        return;
    }

    if (moldOutboundState.selectedMoldCodes.includes(normalizedCode)) {
        if (moldOutboundState.selectedMoldCodes.length === 1 && moldOutboundState.requestMoldCode === normalizedCode) {
            return;
        }

        moldOutboundState.selectedMoldCodes = moldOutboundState.selectedMoldCodes.filter(function(item) {
            return item !== normalizedCode;
        });
    } else {
        moldOutboundState.selectedMoldCodes.push(normalizedCode);
    }

    renderMoldOutboundPage();
}

function selectRegion(region) {
    if (!MOLD_OUTBOUND_REGIONS.includes(region)) {
        return;
    }

    moldOutboundState.selectedRegion = region;
    syncRegionSelection();
    updateConfirmButtonState();
}

function syncRegionSelection() {
    document.querySelectorAll('.region-option-btn').forEach(function(button) {
        button.classList.toggle('is-selected', button.dataset.region === moldOutboundState.selectedRegion);
    });
}

function openConfirmModal() {
    if (!isReadyToSubmit()) {
        alert('请先完成模具选择和目的区域选择。');
        return;
    }

    document.getElementById('confirmRequestMoldCode').textContent = moldOutboundState.requestMoldCode || '-';
    document.getElementById('confirmPalletCode').textContent = moldOutboundState.palletCode || '-';
    document.getElementById('confirmMoldCount').textContent = String(moldOutboundState.selectedMoldCodes.length);
    document.getElementById('confirmRegionText').textContent = moldOutboundState.selectedRegion || '-';
    renderConfirmMoldList();
    document.getElementById('confirmOutboundModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmOutboundModal').classList.remove('active');
}

function submitOutbound() {
    if (!isReadyToSubmit()) {
        closeConfirmModal();
        alert('当前出库信息不完整，请重新确认。');
        return;
    }

    const outboundCount = moldOutboundState.selectedMoldCodes.length;
    const outboundRegion = moldOutboundState.selectedRegion;
    closeConfirmModal();
    alert(`已申请${outboundCount}个模具出库至${outboundRegion}。`);
    resetMoldOutboundPage();
}

function renderMoldOutboundPage() {
    document.getElementById('moldCodeHint').textContent = getMoldCodeHintText();
    document.getElementById('palletCodeText').textContent = moldOutboundState.palletCode || '-';
    document.getElementById('selectedMoldCount').textContent = String(moldOutboundState.selectedMoldCodes.length);
    renderMoldOptions();
    syncRegionSelection();
    updateConfirmButtonState();
}

function renderMoldOptions() {
    const moldList = document.getElementById('moldList');
    moldList.innerHTML = '';
    moldList.classList.toggle('is-empty', !moldOutboundState.palletMolds.length);

    moldOutboundState.palletMolds.forEach(function(item) {
        const isSelected = moldOutboundState.selectedMoldCodes.includes(item.moldCode);

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

    if (!moldOutboundState.selectedMoldCodes.length) {
        const emptyNode = document.createElement('div');
        emptyNode.className = 'modal-mold-chip is-empty';
        emptyNode.textContent = '暂无模具';
        confirmList.appendChild(emptyNode);
        return;
    }

    moldOutboundState.selectedMoldCodes.forEach(function(moldCode) {
        const target = moldOutboundState.palletMolds.find(function(item) {
            return item.moldCode === moldCode;
        });

        const chip = document.createElement('div');
        chip.className = 'modal-mold-chip';
        chip.textContent = target ? `${target.moldCode} / ${target.moldModel}` : moldCode;
        confirmList.appendChild(chip);
    });
}

function updateConfirmButtonState() {
    document.getElementById('confirmOutboundBtn').disabled = !isReadyToSubmit();
}

function isReadyToSubmit() {
    return Boolean(
        moldOutboundState.requestMoldCode
        && moldOutboundState.palletCode
        && moldOutboundState.selectedMoldCodes.length
        && moldOutboundState.selectedRegion
    );
}

function resetMoldOutboundPage() {
    clearTimeout(moldCodeAutoTimer);
    moldOutboundState.requestMoldCode = '';
    moldOutboundState.palletCode = '';
    moldOutboundState.palletMolds = [];
    moldOutboundState.selectedMoldCodes = [];
    moldOutboundState.selectedRegion = '';

    document.getElementById('moldCodeInput').value = '';
    closeConfirmModal();
    renderMoldOutboundPage();
    document.getElementById('moldCodeInput').focus();
}

function getMoldCodeHintText() {
    const moldCodes = Object.keys(moldOutboundIndex);
    return moldCodes.length
        ? `可试用模具编号：${moldCodes.join('、')}`
        : '可试用模具编号：-';
}

function createMoldOutboundIndex() {
    const index = {};

    Object.keys(MOLD_OUTBOUND_PALLETS).forEach(function(palletCode) {
        MOLD_OUTBOUND_PALLETS[palletCode].forEach(function(item) {
            index[item.moldCode] = {
                palletCode: palletCode,
                moldModel: item.moldModel
            };
        });
    });

    return index;
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
