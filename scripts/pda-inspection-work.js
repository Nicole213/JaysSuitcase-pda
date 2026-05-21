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
        const order = window.InspectionWorkStorage.getOrder(orderNo);

        if (action === 'inspect') {
            window.location.href = `成品抽检.html?orderNo=${encodeURIComponent(orderNo)}`;
            return;
        }

        if (order && order.inspectionType === '现场抽检') {
            window.location.href = `已抽检托盘.html?orderNo=${encodeURIComponent(orderNo)}&source=list`;
            return;
        }

        window.location.href = `抽检进度.html?orderNo=${encodeURIComponent(orderNo)}`;
    });
}

function renderInspectionOrderList() {
    const orders = sortInspectionOrders(window.InspectionWorkStorage.getOrders());
    const html = orders.map(renderInspectionOrderCard).join('');
    document.getElementById('inspectionOrderList').innerHTML = html || '<div class="empty-state-card">暂无成品抽检单。</div>';
}

function renderInspectionOrderCard(order) {
    const statusMeta = getInspectionStatusMeta(order.status);
    const typeMeta = getInspectionTypeMeta(order.inspectionType);
    const isOnsite = order.inspectionType === '现场抽检';
    const gridClass = isOnsite ? 'compact-two' : 'compact-three';
    const metrics = isOnsite
        ? `
                <div class="metric-chip">
                    <span class="metric-label">关联订单号</span>
                    <span class="metric-value">${order.mesOrderNo}</span>
                </div>
                <div class="metric-chip">
                    <span class="metric-label">关联托盘数</span>
                    <span class="metric-value">${order.relatedPalletCount}</span>
                </div>
          `
        : `
                <div class="metric-chip">
                    <span class="metric-label">关联订单号</span>
                    <span class="metric-value">${order.mesOrderNo}</span>
                </div>
                <div class="metric-chip">
                    <span class="metric-label">抽检托数</span>
                    <span class="metric-value">${order.samplePalletCount}</span>
                </div>
                <div class="metric-chip">
                    <span class="metric-label">目标检验室</span>
                    <span class="metric-value">${order.targetLab}</span>
                </div>
          `;

    return `
        <div class="inspection-order-card ${statusMeta.cardClass} ${typeMeta.cardClass}">
            <span class="inspection-type-pill ${typeMeta.pillClass}">${typeMeta.label}</span>
            <div class="inspection-order-head">
                <div>
                    <div class="inspection-order-no">${order.orderNo}</div>
                    <div class="inspection-order-sub">${order.materialCode}-${order.materialName}</div>
                </div>
                <span class="inspection-status-badge ${statusMeta.badgeClass}">${order.status}</span>
            </div>
            <div class="inspection-order-grid ${gridClass}">
                ${metrics}
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

    return `<button class="compact-btn ghost" data-action="view" data-order-no="${order.orderNo}">查看详情</button>`;
}

function sortInspectionOrders(orders) {
    const priority = {
        '检验中': 1,
        '待检验': 2,
        '已完成': 3
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

    if (status === '已完成') {
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

function getInspectionTypeMeta(type) {
    if (type === '现场抽检') {
        return {
            label: '现场抽检',
            pillClass: 'is-onsite',
            cardClass: 'type-onsite'
        };
    }

    return {
        label: '检验室抽检',
        pillClass: 'is-lab',
        cardClass: 'type-lab'
    };
}
