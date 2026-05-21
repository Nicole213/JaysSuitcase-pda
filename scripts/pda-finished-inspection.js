let currentInspectionOrder = null;
let palletAutoTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    if (!window.InspectionWorkStorage) {
        alert('未找到抽检数据，已返回列表页。');
        goBackToInspectionList();
        return;
    }

    window.InspectionWorkStorage.initialize();
    const orderNo = getOrderNoFromQuery();
    currentInspectionOrder = window.InspectionWorkStorage.getOrder(orderNo);

    if (!currentInspectionOrder) {
        alert('未找到对应抽检单，已返回列表页。');
        goBackToInspectionList();
        return;
    }

    bindInspectionEvents();
    renderInspectionOrder();
    restorePalletFromQuery();
});

function bindInspectionEvents() {
    const palletCodeInput = document.getElementById('palletCodeInput');

    const progressBtn = document.getElementById('viewInspectionProgressBtn');
    if (progressBtn) {
        progressBtn.addEventListener('click', openInspectionProgressPage);
    }

    const relatedPalletBtn = document.getElementById('viewRelatedPalletsBtn');
    if (relatedPalletBtn) {
        relatedPalletBtn.addEventListener('click', openRelatedPalletPage);
    }

    const inspectedPalletBtn = document.getElementById('viewInspectedPalletsBtn');
    if (inspectedPalletBtn) {
        inspectedPalletBtn.addEventListener('click', openInspectedPalletPage);
    }

    palletCodeInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handlePalletScan();
        }
    });

    palletCodeInput.addEventListener('input', function() {
        clearTimeout(palletAutoTimer);
        const palletCode = palletCodeInput.value.trim().toUpperCase();
        const pallet = currentInspectionOrder.pallets.find(function(item) {
            return item.palletCode === palletCode && (item.status === '待检验' || item.status === '检验中');
        });

        if (!pallet) {
            return;
        }

        palletAutoTimer = setTimeout(handlePalletScan, 160);
    });
}

function renderInspectionOrder() {
    const isOnsite = currentInspectionOrder.inspectionType === '现场抽检';
    const typeMeta = getInspectionTypeBadgeMeta(currentInspectionOrder.inspectionType);
    document.getElementById('inspectionOrderNo').textContent = currentInspectionOrder.orderNo;
    document.getElementById('mesOrderNo').textContent = currentInspectionOrder.mesOrderNo;
    document.getElementById('materialCode').textContent = currentInspectionOrder.materialCode;
    document.getElementById('materialName').textContent = currentInspectionOrder.materialName;
    document.getElementById('inspectionPageBadge').textContent = currentInspectionOrder.status;
    document.getElementById('inspectionTypeBadge').textContent = typeMeta.label;
    document.getElementById('inspectionTypeBadge').className = `inspection-page-type-badge ${typeMeta.badgeClass}`;

    const targetLabRow = document.getElementById('targetLabRow');
    const inspectionProgressRow = document.getElementById('inspectionProgressRow');
    const relatedPalletRow = document.getElementById('relatedPalletRow');
    const inspectedPalletRow = document.getElementById('inspectedPalletRow');

    if (isOnsite) {
        targetLabRow.classList.add('hidden');
        inspectionProgressRow.classList.add('hidden');
        relatedPalletRow.classList.remove('hidden');
        inspectedPalletRow.classList.remove('hidden');
        document.getElementById('relatedPalletSummary').textContent = `${currentInspectionOrder.relatedPalletCount} 个托盘`;
        document.getElementById('inspectedPalletSummary').textContent = `${currentInspectionOrder.submittedPalletCount} 托`;
        document.getElementById('palletCodeInput').placeholder = '请扫描该现场抽检单关联的托盘码';
    } else {
        targetLabRow.classList.remove('hidden');
        inspectionProgressRow.classList.remove('hidden');
        relatedPalletRow.classList.add('hidden');
        inspectedPalletRow.classList.add('hidden');
        document.getElementById('targetLab').textContent = currentInspectionOrder.targetLab;
        document.getElementById('inspectionOrderProgress').textContent =
            `${currentInspectionOrder.submittedPalletCount}托/${currentInspectionOrder.samplePalletCount}托`;
        document.getElementById('palletCodeInput').placeholder = '请扫描当前抽检单下托盘码';
    }

    updateDemoPalletHint();
}

function handlePalletScan() {
    const palletCode = document.getElementById('palletCodeInput').value.trim().toUpperCase();
    if (!palletCode) {
        alert('请输入托盘码。');
        return;
    }

    const pallet = currentInspectionOrder.pallets.find(function(item) {
        return item.palletCode === palletCode;
    });

    if (!pallet) {
        alert('该托盘不属于当前抽检单。');
        return;
    }

    if (pallet.status === '已完成') {
        alert('该托盘已完成抽检。');
        return;
    }

    window.location.href =
        `抽检结果录入.html?orderNo=${encodeURIComponent(currentInspectionOrder.orderNo)}&palletCode=${encodeURIComponent(palletCode)}`;
    document.getElementById('palletCodeInput').value = '';
}

function openInspectionProgressPage() {
    window.location.href = `抽检进度.html?orderNo=${encodeURIComponent(currentInspectionOrder.orderNo)}`;
}

function openRelatedPalletPage() {
    window.location.href = `关联托盘信息.html?orderNo=${encodeURIComponent(currentInspectionOrder.orderNo)}`;
}

function openInspectedPalletPage() {
    window.location.href = `已抽检托盘.html?orderNo=${encodeURIComponent(currentInspectionOrder.orderNo)}&source=execution`;
}

function updateDemoPalletHint() {
    const hintElement = document.getElementById('demoPalletHint');
    if (!hintElement) {
        return;
    }

    const palletCodes = currentInspectionOrder.pallets
        .filter(function(item) {
            return item.status === '待检验' || item.status === '检验中';
        })
        .map(function(item) {
            return item.palletCode;
        });

    hintElement.textContent = palletCodes.length
        ? `可试用托盘码：${palletCodes.join('、')}`
        : '当前抽检单暂无可试用托盘码';
}

function getOrderNoFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('orderNo') || '';
}

function goBackToInspectionList() {
    window.location.href = '抽检作业.html';
}

function restorePalletFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const palletCode = (params.get('palletCode') || '').trim().toUpperCase();
    if (!palletCode) {
        return;
    }

    const palletCodeInput = document.getElementById('palletCodeInput');
    if (!palletCodeInput) {
        return;
    }

    palletCodeInput.value = palletCode;
}

function getInspectionTypeBadgeMeta(type) {
    if (type === '现场抽检') {
        return {
            label: '现场抽检',
            badgeClass: 'is-onsite'
        };
    }

    return {
        label: '检验室抽检',
        badgeClass: 'is-lab'
    };
}
