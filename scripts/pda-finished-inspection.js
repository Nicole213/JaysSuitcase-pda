let currentInspectionOrder = null;

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
    document.getElementById('scanPalletBtn').addEventListener('click', handlePalletScan);
    document.getElementById('viewInspectionProgressBtn').addEventListener('click', openInspectionProgressPage);

    document.getElementById('palletCodeInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handlePalletScan();
        }
    });
}

function renderInspectionOrder() {
    document.getElementById('inspectionOrderNo').textContent = currentInspectionOrder.orderNo;
    document.getElementById('mesOrderNo').textContent = currentInspectionOrder.mesOrderNo;
    document.getElementById('materialCode').textContent = currentInspectionOrder.materialCode;
    document.getElementById('materialName').textContent = currentInspectionOrder.materialName;
    document.getElementById('targetLab').textContent = currentInspectionOrder.targetLab;
    document.getElementById('inspectionOrderProgress').textContent =
        `${currentInspectionOrder.submittedPalletCount}托/${currentInspectionOrder.samplePalletCount}托`;
    document.getElementById('inspectionPageBadge').textContent = currentInspectionOrder.status;
    updateDemoPalletHint();
}

function handlePalletScan() {
    const palletCode = document.getElementById('palletCodeInput').value.trim().toUpperCase();
    if (!palletCode) {
        alert('请先扫描托盘码。');
        return;
    }

    const pallet = currentInspectionOrder.pallets.find(function(item) {
        return item.palletCode === palletCode;
    });

    if (!pallet) {
        alert('该托盘不属于当前抽检单。');
        return;
    }

    if (pallet.status === '待确认回库' || pallet.status === '已确认回库') {
        alert('该托盘已完成抽检提交，请在回库确认中继续处理。');
        return;
    }

    window.location.href =
        `抽检结果录入.html?orderNo=${encodeURIComponent(currentInspectionOrder.orderNo)}&palletCode=${encodeURIComponent(palletCode)}`;
    document.getElementById('palletCodeInput').value = '';
}

function openInspectionProgressPage() {
    window.location.href = `抽检进度.html?orderNo=${encodeURIComponent(currentInspectionOrder.orderNo)}`;
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
