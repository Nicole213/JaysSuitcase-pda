// 包装作业列表脚本
document.addEventListener('DOMContentLoaded', function() {
    bindEvents();
    renderPage();
});

function bindEvents() {
    document.getElementById('workOrderList').addEventListener('click', function(event) {
        const target = event.target.closest('button[data-action]');
        if (!target) {
            return;
        }

        const action = target.dataset.action;
        const orderNo = target.dataset.orderNo;

        if (action === 'start' || action === 'continue') {
            handleStart(orderNo);
            return;
        }

        if (action === 'pause') {
            const result = PackagingStorage.pauseOrder(orderNo);
            if (result.ok) {
                renderPage();
                alert(`工单 ${orderNo} 已暂停。`);
            }
            return;
        }

        openExecutionPage(orderNo);
    });
}

function renderPage() {
    const orders = sortOrders(PackagingStorage.getOrders());
    const activeOrder = PackagingStorage.getCurrentActiveOrder(orders);

    renderOrderList(orders, activeOrder);
}

function renderOrderList(orders, activeOrder) {
    const html = orders.map(order => {
        const statusMeta = getStatusMeta(order.status);
        const remainingQty = Math.max(order.plannedQty - order.packedQty, 0);
        const isActive = activeOrder && activeOrder.orderNo === order.orderNo;

        return `
            <div class="order-card ${statusMeta.cardClass}${isActive ? ' is-active' : ''}">
                <div class="order-card-head">
                    <div>
                        <div class="order-no">${order.orderNo}</div>
                        <div class="order-product">${order.productName}</div>
                    </div>
                    <span class="status-badge ${statusMeta.badgeClass}">${statusMeta.label}</span>
                </div>
                <div class="order-details">
                    <div class="detail-block">
                        <span class="detail-label">计划包装</span>
                        <span class="detail-value">${order.plannedQty}</span>
                    </div>
                    <div class="detail-block">
                        <span class="detail-label">已包装 / 待完成</span>
                        <span class="detail-value">${order.packedQty} / ${remainingQty}</span>
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

    document.getElementById('workOrderList').innerHTML = html;
}

function renderActions(order) {
    if (order.status === 'pending') {
        return `<button class="small-btn primary" data-action="start" data-order-no="${order.orderNo}">开始工单</button>`;
    }

    if (order.status === 'paused') {
        return `
            <button class="small-btn primary" data-action="continue" data-order-no="${order.orderNo}">继续工单</button>
            <button class="small-btn ghost" data-action="view" data-order-no="${order.orderNo}">查看工单</button>
        `;
    }

    if (order.status === 'in_progress') {
        return `
            <button class="small-btn secondary" data-action="view" data-order-no="${order.orderNo}">进入执行</button>
            <button class="small-btn warning" data-action="pause" data-order-no="${order.orderNo}">暂停工单</button>
        `;
    }

    return `<button class="small-btn ghost" data-action="view" data-order-no="${order.orderNo}">查看详情</button>`;
}

function handleStart(orderNo) {
    const result = PackagingStorage.startOrder(orderNo);

    if (!result.ok) {
        if (result.reason === 'active_exists' && result.activeOrder) {
            alert(`当前已有进行中的工单：${result.activeOrder.orderNo}。请先暂停该工单，再开始新的工单。`);
            return;
        }

        if (result.reason === 'completed') {
            alert('该工单已完成，不能再次开始。');
            return;
        }

        alert('工单启动失败，请稍后重试。');
        return;
    }

    openExecutionPage(orderNo);
}

function getStatusMeta(status) {
    const map = {
        pending: {
            label: '待开始',
            badgeClass: 'pending',
            cardClass: ''
        },
        in_progress: {
            label: '进行中',
            badgeClass: 'in-progress',
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

function openExecutionPage(orderNo) {
    window.location.href = `包装工单执行.html?orderNo=${encodeURIComponent(orderNo)}`;
}
