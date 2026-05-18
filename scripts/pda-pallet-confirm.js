let currentInboundOrder = null;
let currentInboundPallet = null;
let pendingSnCode = '';
let pendingUnbindSnCode = '';
let currentPageSource = '';
let isReadonlyMode = false;

document.addEventListener('DOMContentLoaded', function() {
    if (!window.InspectionWorkStorage) {
        alert('未找到抽检数据，已返回列表页。');
        goBackToInboundExecution();
        return;
    }

    window.InspectionWorkStorage.initialize();
    const params = new URLSearchParams(window.location.search);
    const orderNo = params.get('orderNo') || '';
    const palletCode = (params.get('palletCode') || '').trim().toUpperCase();
    currentPageSource = params.get('source') || '';
    isReadonlyMode = params.get('mode') === 'view';
    currentInboundOrder = window.InspectionWorkStorage.getOrder(orderNo);

    if (!currentInboundOrder || !palletCode) {
        alert('未找到对应托盘，已返回回库确认页。');
        goBackToInboundExecution();
        return;
    }

    currentInboundPallet = currentInboundOrder.pallets.find(function(item) {
        if (isReadonlyMode) {
            return item.palletCode === palletCode;
        }

        return item.palletCode === palletCode && item.status === '待确认回库';
    }) || null;

    if (!currentInboundPallet) {
        alert('当前托盘不可继续组盘，已返回回库确认页。');
        goBackToInboundExecution();
        return;
    }

    bindPalletConfirmEvents();
    renderPalletConfirmPage();
});

function bindPalletConfirmEvents() {
    document.querySelectorAll('#inspectionResultLinks .inbound-link-row').forEach(function(row) {
        row.addEventListener('click', function() {
            openInboundDetail(row.dataset.detailType);
        });
    });

    if (!isReadonlyMode) {
        document.getElementById('scanSnBtn').addEventListener('click', handleSnScan);
        document.getElementById('unbindScannedSnBtn').addEventListener('click', openUnbindConfirmModal);
        document.getElementById('confirmPalletBtn').addEventListener('click', confirmCurrentPalletReturn);
        document.getElementById('confirmUnbindBtn').addEventListener('click', function() {
            unbindSn('scan');
        });
        document.getElementById('cancelUnbindBtn').addEventListener('click', closeUnbindConfirmModal);

        document.getElementById('snCodeInput').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                handleSnScan();
            }
        });
    }
}

function renderPalletConfirmPage() {
    document.getElementById('pageTitle').textContent = isReadonlyMode ? '查看组盘信息' : '组盘信息确认';
    document.getElementById('confirmPageBadge').textContent = currentInboundPallet.status;
    document.getElementById('currentPalletCode').textContent = currentInboundPallet.palletCode;
    document.getElementById('currentPalletMeta').textContent =
        `${currentInboundOrder.materialName} · ${currentInboundOrder.materialCode} · 原始 ${currentInboundPallet.qty} 件`;
    document.getElementById('currentPalletStatus').textContent = currentInboundPallet.status;
    document.getElementById('boundSnEntryCount').textContent = currentInboundPallet.boundQty;
    document.getElementById('unboundSnEntryCount').textContent = currentInboundPallet.unboundQty;
    document.getElementById('inspectedEntryCount').textContent = currentInboundPallet.inspectedQty;
    document.querySelector('.scan-card').classList.toggle('hidden', isReadonlyMode);
    document.querySelector('.action-bar').classList.toggle('hidden', isReadonlyMode);
    updateInboundSnHint();
}

function handleSnScan() {
    const snCode = document.getElementById('snCodeInput').value.trim().toUpperCase();
    if (!snCode) {
        alert('请先扫描 SN 码。');
        return;
    }

    const snItem = currentInboundPallet.boundSnList.find(function(item) {
        return item.snCode === snCode;
    });
    if (!snItem) {
        alert('该 SN 不在当前托盘中，无法解绑。');
        return;
    }

    pendingSnCode = snCode;
    document.getElementById('pendingSnBox').textContent = snItem.snCode;
}

function openUnbindConfirmModal() {
    const targetSnCode = (pendingSnCode || '').trim().toUpperCase();
    if (!targetSnCode) {
        alert('请先扫描要解绑的 SN。');
        return;
    }

    pendingUnbindSnCode = targetSnCode;
    document.getElementById('pendingUnbindSnCode').textContent = pendingUnbindSnCode;
    document.getElementById('unbindConfirmModal').classList.add('active');
}

function closeUnbindConfirmModal() {
    pendingUnbindSnCode = '';
    document.getElementById('pendingUnbindSnCode').textContent = '-';
    document.getElementById('unbindConfirmModal').classList.remove('active');
}

function unbindSn(source) {
    const targetSnCode = (pendingUnbindSnCode || pendingSnCode || '').trim().toUpperCase();
    if (!targetSnCode) {
        alert('请先扫描或选择要解绑的 SN。');
        return;
    }

    const result = window.InspectionWorkStorage.unbindSnFromPallet(
        currentInboundOrder.orderNo,
        currentInboundPallet.palletCode,
        targetSnCode,
        source || 'scan'
    );
    if (!result.ok) {
        alert('解绑失败，请确认 SN 是否仍绑定在当前托盘。');
        return;
    }

    refreshPalletState();
    closeUnbindConfirmModal();
    resetPendingSn();
    document.getElementById('snCodeInput').value = '';
    renderPalletConfirmPage();
    alert(`SN ${targetSnCode} 已解绑。`);
}

function confirmCurrentPalletReturn() {
    const result = window.InspectionWorkStorage.confirmPalletReturn(
        currentInboundOrder.orderNo,
        currentInboundPallet.palletCode
    );
    if (!result.ok) {
        alert('当前托盘不能确认组盘信息。');
        return;
    }

    alert(`托盘 ${currentInboundPallet.palletCode} 已确认组盘信息。`);
    window.location.href = `抽检入库.html?orderNo=${encodeURIComponent(currentInboundOrder.orderNo)}`;
}

function openInboundDetail(detailType) {
    const modeQuery = isReadonlyMode ? '&mode=view' : '';
    window.location.href =
        `抽检入库结果明细.html?orderNo=${encodeURIComponent(currentInboundOrder.orderNo)}&palletCode=${encodeURIComponent(currentInboundPallet.palletCode)}&detailType=${encodeURIComponent(detailType)}&source=confirm${currentPageSource ? `&returnSource=${encodeURIComponent(currentPageSource)}` : ''}${modeQuery}`;
}

function refreshPalletState() {
    currentInboundOrder = window.InspectionWorkStorage.getOrder(currentInboundOrder.orderNo);
    currentInboundPallet = currentInboundOrder.pallets.find(function(item) {
        return item.palletCode === currentInboundPallet.palletCode;
    }) || null;
}

function resetPendingSn() {
    pendingSnCode = '';
    document.getElementById('pendingSnBox').textContent = '待扫描 SN';
}

function goBackToInboundExecution() {
    const orderNo = currentInboundOrder ? currentInboundOrder.orderNo : new URLSearchParams(window.location.search).get('orderNo') || '';

    if (currentPageSource === 'progress') {
        const progressTarget = orderNo
            ? `抽检回库进度.html?orderNo=${encodeURIComponent(orderNo)}`
            : '抽检作业.html';
        window.location.href = progressTarget;
        return;
    }

    const target = orderNo
        ? `抽检入库.html?orderNo=${encodeURIComponent(orderNo)}`
        : '抽检作业.html';
    window.location.href = target;
}

function updateInboundSnHint() {
    const hintElement = document.getElementById('demoInboundSnHint');
    if (!hintElement) {
        return;
    }

    const snCodes = currentInboundPallet.boundSnList.map(function(item) {
        return item.snCode;
    });

    hintElement.textContent = snCodes.length
        ? `可试用 SN：${snCodes.join('、')}`
        : '当前托盘暂无可试用 SN';
}
