// 发货作业列表脚本
let currentStartOrderNo = null;
let currentCancelOrderNo = null;
let currentStartAction = 'start';

document.addEventListener('DOMContentLoaded', function() {
    ShippingStorage.initializeDemoState();
    bindEvents();
    renderPage();
});

function bindEvents() {
    document.getElementById('shippingOrderList').addEventListener('click', function(event) {
        const target = event.target.closest('button[data-action]');
        if (!target) {
            return;
        }

        const action = target.dataset.action;
        const orderNo = target.dataset.orderNo;

        if (action === 'start') {
            openStartModal(orderNo);
            return;
        }

        if (action === 'cancel') {
            openCancelModal(orderNo);
            return;
        }

        if (action === 'pause') {
            const result = ShippingStorage.pauseOrder(orderNo);
            if (!result.ok) {
                alert('当前发货单无法暂停。');
                return;
            }

            renderPage();
            alert(`发货单 ${orderNo} 已暂停。`);
            return;
        }

        if (action === 'continue') {
            openStartModal(orderNo, 'continue');
            return;
        }

        openExecutionPage(orderNo);
    });

    document.getElementById('confirmStartShippingBtn').addEventListener('click', function() {
        const linePort = document.getElementById('linePortSelect').value;
        const dockName = document.getElementById('dockSelect').value;

        if (!linePort) {
            alert('请选择上线口。');
            return;
        }

        if (!dockName) {
            alert('请选择发货月台。');
            return;
        }

        const result = currentStartAction === 'continue'
            ? ShippingStorage.continueOrder(currentStartOrderNo, linePort, dockName)
            : ShippingStorage.startOrder(currentStartOrderNo, linePort, dockName);
        if (!result.ok) {
            alert(currentStartAction === 'continue' ? '继续发货失败，请刷新后重试。' : '开始发货失败，请刷新后重试。');
            return;
        }

        closeModal('startShippingModal');
        openExecutionPage(currentStartOrderNo);
    });

    document.getElementById('confirmCancelShippingBtn').addEventListener('click', function() {
        const reason = document.getElementById('cancelReasonInput').value.trim();
        if (!reason) {
            alert('请输入取消原因。');
            return;
        }

        const result = ShippingStorage.cancelOrder(currentCancelOrderNo, reason);
        if (!result.ok) {
            alert('仅未开始发货的发货单允许取消。');
            return;
        }

        closeModal('cancelShippingModal');
        renderPage();
        alert(`发货单 ${currentCancelOrderNo} 已取消。`);
    });

    document.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', function() {
            closeModal(button.dataset.closeModal);
        });
    });
}

function renderPage() {
    const orders = sortOrders(ShippingStorage.getOrders());
    const html = orders.map(order => {
        const statusMeta = getStatusMeta(order.status);
        const remainingQty = Math.max(order.plannedQty - order.shippedQty, 0);
        const routeLabel = order.linePort && order.dockName
            ? `${order.linePort} → ${order.dockName}`
            : '待选择作业路线';

        return `
            <div class="order-card ${statusMeta.cardClass}">
                <div class="order-card-head">
                    <div>
                        <div class="order-no">${order.orderNo}</div>
                        <div class="order-product">${order.customerName}</div>
                    </div>
                    <span class="status-badge ${statusMeta.badgeClass}">${statusMeta.label}</span>
                </div>
                <div class="route-pill ${order.linePort ? '' : 'is-empty'}">${routeLabel}</div>
                <div class="order-details shipping-order-details">
                    <div class="detail-block">
                        <span class="detail-label">计划 / 已发货</span>
                        <span class="detail-value">${order.plannedQty} / ${order.shippedQty}</span>
                    </div>
                    <div class="detail-block">
                        <span class="detail-label">待发货数量</span>
                        <span class="detail-value">${remainingQty}</span>
                    </div>
                </div>
                <div class="order-footer">
                    <div class="order-actions">
                        ${renderActions(order)}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('shippingOrderList').innerHTML = html;
}

function renderActions(order) {
    if (order.status === 'pending') {
        return `
            <button class="small-btn primary shipping-start-btn" data-action="start" data-order-no="${order.orderNo}">开始发货</button>
            <button class="small-btn ghost" data-action="cancel" data-order-no="${order.orderNo}">取消发货</button>
        `;
    }

    if (order.status === 'in_progress') {
        return `
            <button class="small-btn secondary" data-action="view" data-order-no="${order.orderNo}">进入执行</button>
            <button class="small-btn warning" data-action="pause" data-order-no="${order.orderNo}">暂停发货</button>
        `;
    }

    if (order.status === 'paused') {
        return `
            <button class="small-btn primary shipping-start-btn" data-action="continue" data-order-no="${order.orderNo}">继续发货</button>
            <button class="small-btn ghost" data-action="view" data-order-no="${order.orderNo}">查看详情</button>
        `;
    }

    return `<button class="small-btn ghost" data-action="view" data-order-no="${order.orderNo}">查看详情</button>`;
}

function openStartModal(orderNo, action) {
    const order = ShippingStorage.getOrder(orderNo);
    if (!order) {
        return;
    }

    currentStartOrderNo = orderNo;
    currentStartAction = action || 'start';
    document.getElementById('startOrderNo').textContent = order.orderNo;
    document.getElementById('startCustomerName').textContent = order.customerName;
    document.getElementById('startShippingModalTitle').textContent = currentStartAction === 'continue' ? '继续发货' : '开始发货';
    document.getElementById('confirmStartShippingBtn').textContent = currentStartAction === 'continue' ? '确认继续' : '确认开始';
    document.getElementById('linePortSelect').value = order.linePort || '';
    document.getElementById('dockSelect').value = order.dockName || '';
    showModal('startShippingModal');
}

function openCancelModal(orderNo) {
    const order = ShippingStorage.getOrder(orderNo);
    if (!order) {
        return;
    }

    currentCancelOrderNo = orderNo;
    document.getElementById('cancelOrderNo').textContent = order.orderNo;
    document.getElementById('cancelReasonInput').value = '';
    showModal('cancelShippingModal');
    setTimeout(() => {
        document.getElementById('cancelReasonInput').focus();
    }, 80);
}

function getStatusMeta(status) {
    const map = {
        pending: {
            label: '待开始',
            badgeClass: 'pending',
            cardClass: ''
        },
        in_progress: {
            label: '发货中',
            badgeClass: 'shipping-progress',
            cardClass: 'is-active'
        },
        paused: {
            label: '已暂停',
            badgeClass: 'paused',
            cardClass: 'is-paused'
        },
        completed: {
            label: '已完成',
            badgeClass: 'completed',
            cardClass: 'is-completed'
        },
        cancelled: {
            label: '已取消',
            badgeClass: 'cancelled',
            cardClass: 'is-cancelled'
        }
    };

    return map[status] || map.pending;
}

function sortOrders(orders) {
    const statusPriority = {
        in_progress: 1,
        paused: 2,
        pending: 3,
        completed: 4,
        cancelled: 5
    };

    return orders.slice().sort((a, b) => {
        const priorityDiff = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
        if (priorityDiff !== 0) {
            return priorityDiff;
        }

        const timeA = a.lastActionAt ? new Date(a.lastActionAt.replace(/\//g, '-')).getTime() : 0;
        const timeB = b.lastActionAt ? new Date(b.lastActionAt.replace(/\//g, '-')).getTime() : 0;
        return timeB - timeA;
    });
}

function showModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function openExecutionPage(orderNo) {
    ShippingStorage.preserveForNextPage();
    window.location.href = `发货单执行.html?orderNo=${encodeURIComponent(orderNo)}`;
}
