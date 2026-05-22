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

    document.getElementById('orderNo').textContent = order.orderNo;
    document.getElementById('customerName').textContent = order.customerName;
    document.getElementById('linePort').textContent = order.linePort || '未配置';
    document.getElementById('dockName').textContent = order.dockName || '未配置';

    document.getElementById('shippedQty').textContent = order.shippedQty;
    document.getElementById('plannedQty').textContent = order.plannedQty;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressStatusText').textContent = getProgressText(order.status, progress);
    document.getElementById('shippingStatusBadge').textContent = getBadgeText(order.status);
    renderHistory(order.history || []);
    syncActionState(order);
}

function renderHistory(history) {
    const visibleHistory = (history || []).filter(function(item) {
        return item
            && item.kind === 'status'
            && ['开始发货', '暂停发货', '发货完成'].includes(item.title);
    });

    if (!visibleHistory.length) {
        document.getElementById('historyTimeline').innerHTML = '<div class="history-empty">暂无关键节点记录。</div>';
        return;
    }

    const html = visibleHistory.slice().reverse().map(item => `
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

function syncActionState(order) {
    const isRunning = order.status === 'in_progress';
    const isPaused = order.status === 'paused';
    const isCompleted = order.status === 'completed';
    const isCancelled = order.status === 'cancelled';
    const canManualComplete = (isRunning || isPaused) && order.shippedQty < order.plannedQty;

    document.getElementById('pauseShippingBtn').style.display = isRunning ? 'block' : 'none';
    document.getElementById('continueShippingBtn').style.display = isPaused ? 'block' : 'none';
    document.getElementById('manualCompleteBtn').style.display = canManualComplete ? 'block' : 'none';
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
