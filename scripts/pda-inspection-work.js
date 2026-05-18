document.addEventListener('DOMContentLoaded', function() {
    if (!window.InspectionWorkStorage) {
        return;
    }

    window.InspectionWorkStorage.initialize();
    bindInspectionOrderListEvents();
    renderInspectionOrderList();
});

function bindInspectionOrderListEvents() {
    document.getElementById('inspectionOrderList').addEventListener('click', function(event) {
        const target = event.target.closest('button[data-action]');
        if (!target) {
            return;
        }

        const orderNo = target.dataset.orderNo;
        const action = target.dataset.action;

        if (action === 'inspect') {
            window.location.href = `成品抽检.html?orderNo=${encodeURIComponent(orderNo)}`;
            return;
        }

        if (action === 'return') {
            window.location.href = `抽检入库.html?orderNo=${encodeURIComponent(orderNo)}`;
            return;
        }

        window.location.href = `抽检入库.html?orderNo=${encodeURIComponent(orderNo)}&mode=view`;
    });
}

function renderInspectionOrderList() {
    const orders = sortInspectionOrders(window.InspectionWorkStorage.getOrders());
    const html = orders.map(renderInspectionOrderCard).join('');
    document.getElementById('inspectionOrderList').innerHTML = html || '<div class="empty-state-card">暂无成品抽检单。</div>';
}

function renderInspectionOrderCard(order) {
    const statusMeta = getInspectionStatusMeta(order.status);

    return `
        <div class="inspection-order-card ${statusMeta.cardClass}">
            <div class="inspection-order-head">
                <div>
                    <div class="inspection-order-no">${order.orderNo}</div>
                    <div class="inspection-order-sub">${order.materialName}</div>
                </div>
                <span class="inspection-status-badge ${statusMeta.badgeClass}">${order.status}</span>
            </div>
            <div class="inspection-order-grid compact-three">
                <div class="metric-chip">
                    <span class="metric-label">MES工单号</span>
                    <span class="metric-value">${order.mesOrderNo}</span>
                </div>
                <div class="metric-chip">
                    <span class="metric-label">物料编码</span>
                    <span class="metric-value">${order.materialCode}</span>
                </div>
                <div class="metric-chip">
                    <span class="metric-label">抽检托数</span>
                    <span class="metric-value">${order.samplePalletCount}</span>
                </div>
                <div class="metric-chip">
                    <span class="metric-label">目标检验室</span>
                    <span class="metric-value">${order.targetLab}</span>
                </div>
            </div>
            <div class="inspection-order-actions">
                ${renderInspectionOrderAction(order)}
            </div>
        </div>
    `;
}

function renderInspectionOrderAction(order) {
    if (order.status === '待检验' || order.status === '检验中') {
        return `<button class="compact-btn primary" data-action="inspect" data-order-no="${order.orderNo}">执行抽检</button>`;
    }

    if (order.status === '待确认回库') {
        return `<button class="compact-btn primary" data-action="return" data-order-no="${order.orderNo}">回库确认</button>`;
    }

    return `<button class="compact-btn ghost" data-action="view" data-order-no="${order.orderNo}">查看详情</button>`;
}

function sortInspectionOrders(orders) {
    const priority = {
        '检验中': 1,
        '待确认回库': 2,
        '待检验': 3,
        '已确认回库': 4
    };

    return orders.slice().sort(function(a, b) {
        const diff = (priority[a.status] || 99) - (priority[b.status] || 99);
        if (diff !== 0) {
            return diff;
        }
        return b.orderNo.localeCompare(a.orderNo);
    });
}

function getInspectionStatusMeta(status) {
    if (status === '检验中') {
        return {
            badgeClass: 'status-progress',
            cardClass: 'is-inspecting'
        };
    }

    if (status === '待确认回库') {
        return {
            badgeClass: 'status-return',
            cardClass: 'is-returning'
        };
    }

    if (status === '已确认回库') {
        return {
            badgeClass: 'status-complete',
            cardClass: 'is-completed'
        };
    }

    return {
        badgeClass: 'status-pending',
        cardClass: ''
    };
}
