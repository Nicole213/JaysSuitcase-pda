let currentInboundOrder = null;
let isViewMode = false;

document.addEventListener('DOMContentLoaded', function() {
    if (!window.InspectionWorkStorage) {
        alert('未找到抽检数据，已返回列表页。');
        goBackToInspectionList();
        return;
    }

    window.InspectionWorkStorage.initialize();
    const params = new URLSearchParams(window.location.search);
    const orderNo = params.get('orderNo') || '';
    isViewMode = params.get('mode') === 'view';
    currentInboundOrder = window.InspectionWorkStorage.getOrder(orderNo);

    if (!currentInboundOrder) {
        alert('未找到对应抽检单，已返回列表页。');
        goBackToInspectionList();
        return;
    }

    bindInspectionInboundEvents();
    renderInboundOrder();
    restorePalletFromQuery();
});

function bindInspectionInboundEvents() {
    document.getElementById('scanPalletBtn').addEventListener('click', handlePalletScan);
    document.getElementById('confirmInboundBtn').addEventListener('click', confirmOrderReturn);
    document.getElementById('viewInspectionProgressBtn').addEventListener('click', openInboundProgressPage);

    document.getElementById('palletCodeInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handlePalletScan();
        }
    });
}

function renderInboundOrder() {
    document.getElementById('inspectionOrderNo').textContent = currentInboundOrder.orderNo;
    document.getElementById('mesOrderNo').textContent = currentInboundOrder.mesOrderNo;
    document.getElementById('materialCode').textContent = currentInboundOrder.materialCode;
    document.getElementById('materialName').textContent = currentInboundOrder.materialName;
    document.getElementById('targetLab').textContent = currentInboundOrder.targetLab;
    document.getElementById('inspectionOrderProgress').textContent =
        `${currentInboundOrder.submittedPalletCount}托/${currentInboundOrder.samplePalletCount}托`;
    document.getElementById('pageTitle').textContent = isViewMode ? '抽检详情' : '回库确认';
    document.getElementById('inboundPageBadge').textContent = isViewMode ? '只读' : currentInboundOrder.status;
    document.getElementById('scanPalletCard').classList.toggle('hidden', isViewMode);
    updateInboundPalletHint();
}

function handlePalletScan() {
    const palletCode = document.getElementById('palletCodeInput').value.trim().toUpperCase();
    if (!palletCode) {
        alert('请先扫描托盘码。');
        return;
    }

    const pallet = currentInboundOrder.pallets.find(function(item) {
        return item.palletCode === palletCode;
    });

    if (!pallet) {
        alert('该托盘不属于当前抽检单。');
        return;
    }

    if (pallet.status !== '待确认回库') {
        alert('该托盘当前不在待确认回库状态。');
        return;
    }

    window.location.href =
        `组盘信息确认.html?orderNo=${encodeURIComponent(currentInboundOrder.orderNo)}&palletCode=${encodeURIComponent(palletCode)}`;
    document.getElementById('palletCodeInput').value = '';
}

function confirmOrderReturn() {
    const result = window.InspectionWorkStorage.confirmOrderReturn(currentInboundOrder.orderNo);
    if (!result.ok) {
        if (result.reason === 'pallets_unconfirmed') {
            alert('请先完成该抽检单下全部托盘的组盘信息确认。');
            return;
        }

        alert('确认入库失败，请稍后重试。');
        return;
    }

    refreshInboundOrder();
    renderInboundOrder();
    alert(`抽检单 ${currentInboundOrder.orderNo} 已确认入库。`);
}

function refreshInboundOrder() {
    currentInboundOrder = window.InspectionWorkStorage.getOrder(currentInboundOrder.orderNo);
}

function openInboundProgressPage() {
    const modeQuery = isViewMode ? '&mode=view' : '';
    window.location.href = `抽检回库进度.html?orderNo=${encodeURIComponent(currentInboundOrder.orderNo)}${modeQuery}`;
}

function goBackToInspectionList() {
    window.location.href = '抽检作业.html';
}

function updateInboundPalletHint() {
    const hintElement = document.getElementById('demoInboundPalletHint');
    if (!hintElement) {
        return;
    }

    const palletCodes = currentInboundOrder.pallets
        .filter(function(item) {
            return item.status === '待确认回库';
        })
        .map(function(item) {
            return item.palletCode;
        });

    hintElement.textContent = palletCodes.length
        ? `可试用托盘码：${palletCodes.join('、')}`
        : '当前抽检单暂无可试用托盘码';
}
