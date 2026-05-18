// 发货单执行脚本
let currentOrderNo = null;

document.addEventListener('DOMContentLoaded', function() {
    ShippingStorage.initializeDemoState();
    currentOrderNo = getOrderNoFromQuery();

    if (!currentOrderNo || !ShippingStorage.getOrder(currentOrderNo)) {
        alert('未找到对应发货单，已返回发货作业列表。');
        window.location.href = '发货作业.html';
        return;
    }

    bindEvents();
    renderExecutionPage();
});

function bindEvents() {
    document.getElementById('pauseShippingBtn').addEventListener('click', function() {
        const result = ShippingStorage.pauseOrder(currentOrderNo);
        if (!result.ok) {
            alert('当前发货单无法暂停。');
            return;
        }

        renderExecutionPage();
        alert('发货单已暂停。');
    });

    document.getElementById('continueShippingBtn').addEventListener('click', function() {
        const result = ShippingStorage.continueOrder(currentOrderNo);
        if (!result.ok) {
            alert('当前发货单无法继续发货。');
            return;
        }

        renderExecutionPage();
        alert('发货单已继续执行。');
    });

    document.getElementById('scanPalletBtn').addEventListener('click', function() {
        const palletCode = document.getElementById('emptyPalletCodeInput').value.trim();
        if (!palletCode) {
            alert('请先扫描到位托盘码。');
            return;
        }

        const result = ShippingStorage.scanPallet(currentOrderNo, palletCode);
        if (!result.ok) {
            if (result.reason === 'not_in_order') {
                alert('该托盘不在当前发货单内。');
                return;
            }

            if (result.reason === 'already_unbound') {
                alert('该托盘已解绑完成，请扫描下一个托盘。');
                return;
            }

            alert('当前托盘无法识别，请检查发货状态。');
            return;
        }

        document.getElementById('emptyPalletCodeInput').value = '';
        renderExecutionPage();
        alert(`托盘 ${result.pallet.palletCode} 识别成功，请核对信息后执行解绑。`);
    });

    document.getElementById('clearPalletCodeBtn').addEventListener('click', function() {
        document.getElementById('emptyPalletCodeInput').value = '';
        document.getElementById('emptyPalletCodeInput').focus();
    });

    document.getElementById('manualCompleteBtn').addEventListener('click', function() {
        const order = ShippingStorage.getOrder(currentOrderNo);
        if (!order || (order.status !== 'in_progress' && order.status !== 'paused')) {
            alert('当前发货单不可手动完成。');
            return;
        }

        document.getElementById('manualCompleteOrderNo').textContent = order.orderNo;
        document.getElementById('manualCompleteQty').textContent = `${order.shippedQty} / ${order.plannedQty}`;
        document.getElementById('manualCompleteReason').value = '';
        showModal('manualCompleteModal');
        setTimeout(() => {
            document.getElementById('manualCompleteReason').focus();
        }, 80);
    });

    document.getElementById('confirmManualCompleteBtn').addEventListener('click', function() {
        const reason = document.getElementById('manualCompleteReason').value.trim();
        if (!reason) {
            alert('请输入完成说明。');
            return;
        }

        const result = ShippingStorage.completeOrder(currentOrderNo, reason);
        if (!result.ok) {
            alert('当前发货单无法完成。');
            return;
        }

        closeModal('manualCompleteModal');
        renderExecutionPage();
        alert('发货单已完成。');
    });

    document.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', function() {
            closeModal(button.dataset.closeModal);
        });
    });
}

function renderExecutionPage() {
    const order = ShippingStorage.getOrder(currentOrderNo);
    if (!order) {
        return;
    }

    const progress = order.plannedQty === 0 ? 0 : Math.round((order.shippedQty / order.plannedQty) * 100);
    const currentPallet = ShippingStorage.getScannedPallet(order);
    const pendingPalletCodes = (order.pallets || [])
        .filter(item => item.status !== 'unbound')
        .map(item => item.palletCode);

    document.getElementById('orderNo').textContent = order.orderNo;
    document.getElementById('customerName').textContent = order.customerName;
    document.getElementById('linePort').textContent = order.linePort || '未配置';
    document.getElementById('dockName').textContent = order.dockName || '未配置';

    document.getElementById('shippedQty').textContent = order.shippedQty;
    document.getElementById('plannedQty').textContent = order.plannedQty;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressStatusText').textContent = getProgressText(order.status, progress);
    document.getElementById('shippingStatusBadge').textContent = getBadgeText(order.status);
    document.getElementById('scanPalletHints').textContent = pendingPalletCodes.length
        ? `当前发货单可测试托盘码：${pendingPalletCodes.join('、')}`
        : '当前发货单无可扫描托盘码。';

    renderCurrentPalletPanel(order, currentPallet);
    renderHistory(order.history || []);
    syncActionState(order, currentPallet);
}

function renderCurrentPalletPanel(order, pallet) {
    if (!pallet) {
        document.getElementById('currentPalletPanel').innerHTML = `
            <div class="empty-state-card">
                <div class="empty-state-title">等待扫描到位托盘</div>
            </div>
        `;
        return;
    }

    document.getElementById('currentPalletPanel').innerHTML = `
        <div class="pallet-card">
            <div class="pallet-card-head">
                <div>
                    <div class="pallet-code">${pallet.palletCode}</div>
                    <div class="pallet-material">${pallet.materialName} · ${pallet.materialCode}</div>
                </div>
                <span class="status-badge shipping-progress">待解绑</span>
            </div>
            <div class="pallet-info-list">
                <div class="info-row">
                    <label>托盘编码：</label>
                    <span>${pallet.palletCode}</span>
                </div>
                <div class="info-row">
                    <label>物料编码：</label>
                    <span>${pallet.materialCode}</span>
                </div>
                <div class="info-row">
                    <label>物料名称：</label>
                    <span>${pallet.materialName}</span>
                </div>
                <div class="info-row">
                    <label>物料数量：</label>
                    <span>${pallet.boxQty}</span>
                </div>
            </div>
            <div class="help-text pallet-help-text">请确认该托盘已完成拆膜，托盘内物料已逐箱下线后，再执行解绑。</div>
            <div class="pallet-actions">
                <button class="small-btn primary shipping-start-btn" id="confirmUnbindBtn" ${order.status !== 'in_progress' ? 'disabled' : ''}>确认解绑</button>
            </div>
        </div>
    `;

    const confirmUnbindBtn = document.getElementById('confirmUnbindBtn');
    if (confirmUnbindBtn) {
        confirmUnbindBtn.addEventListener('click', function() {
            const result = ShippingStorage.unbindScannedPallet(currentOrderNo);
            if (!result.ok) {
                alert('当前托盘无法解绑，请先扫描正确的托盘。');
                return;
            }

            renderExecutionPage();
            document.getElementById('emptyPalletCodeInput').focus();

            if (result.completed) {
                alert(`托盘解绑成功，已自动累加 ${result.shippedQty} 箱，发货单已完成。`);
                return;
            }

            alert(`托盘解绑成功，已自动累加 ${result.shippedQty} 箱，请继续扫描下一个托盘。`);
        });
    }
}

function renderHistory(history) {
    if (!history.length) {
        document.getElementById('historyTimeline').innerHTML = '<div class="history-empty">暂无操作记录，开始发货后将展示详细执行过程。</div>';
        return;
    }

    const html = history.slice().reverse().map(item => `
        <div class="history-item">
            <div class="history-dot ${item.kind}"></div>
            <div class="history-content">
                <div class="history-title-row">
                    <div class="history-title">${item.title}</div>
                    <div class="history-time">${item.time}</div>
                </div>
                <div class="history-detail">${item.detail}</div>
            </div>
        </div>
    `).join('');

    document.getElementById('historyTimeline').innerHTML = html;
}

function syncActionState(order, currentPallet) {
    const isRunning = order.status === 'in_progress';
    const isPaused = order.status === 'paused';
    const isCompleted = order.status === 'completed';
    const isCancelled = order.status === 'cancelled';
    const canManualComplete = (isRunning || isPaused) && order.shippedQty < order.plannedQty;

    document.getElementById('pauseShippingBtn').style.display = isRunning ? 'block' : 'none';
    document.getElementById('continueShippingBtn').style.display = isPaused ? 'block' : 'none';
    document.getElementById('manualCompleteBtn').style.display = canManualComplete ? 'block' : 'none';
    document.getElementById('scanPalletBtn').disabled = !isRunning;
    document.getElementById('emptyPalletCodeInput').disabled = !isRunning;
    document.getElementById('scanPalletCard').style.display = isCompleted || isCancelled ? 'none' : 'block';
}

function getProgressText(status, progress) {
    if (status === 'completed') {
        return '已完成';
    }

    if (status === 'paused') {
        return `已暂停 · 完成 ${progress}%`;
    }

    if (status === 'in_progress') {
        return `发货中 · 完成 ${progress}%`;
    }

    if (status === 'cancelled') {
        return '已取消';
    }

    return '未开始';
}

function getBadgeText(status) {
    const map = {
        pending: '待开始',
        in_progress: '发货中',
        paused: '已暂停',
        completed: '已完成',
        cancelled: '已取消'
    };

    return map[status] || '待开始';
}

function showModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function getOrderNoFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('orderNo');
}

function goBackToShippingList() {
    ShippingStorage.preserveForNextPage();
    window.location.href = '发货作业.html';
}
