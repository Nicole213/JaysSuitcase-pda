let currentInboundProgressOrder = null;
let isInboundViewMode = false;

document.addEventListener('DOMContentLoaded', function() {
    if (!window.InspectionWorkStorage) {
        alert('未找到抽检数据，已返回列表页。');
        goBackToInbound();
        return;
    }

    window.InspectionWorkStorage.initialize();
    const params = new URLSearchParams(window.location.search);
    const orderNo = params.get('orderNo') || '';
    isInboundViewMode = params.get('mode') === 'view';
    currentInboundProgressOrder = window.InspectionWorkStorage.getOrder(orderNo);

    if (!currentInboundProgressOrder) {
        alert('未找到对应抽检单，已返回列表页。');
        goBackToInbound();
        return;
    }

    bindInboundProgressEvents();
    renderInboundProgressPage();
});

function bindInboundProgressEvents() {
    document.getElementById('returnPalletList').addEventListener('click', function(event) {
        const target = event.target.closest('button[data-action]');
        if (!target) {
            return;
        }

        const palletCode = target.dataset.palletCode;
        const action = target.dataset.action;

        if (action === 'select') {
            window.location.href = `组盘信息确认.html?orderNo=${encodeURIComponent(currentInboundProgressOrder.orderNo)}&palletCode=${encodeURIComponent(palletCode)}&source=progress`;
            return;
        }

        if (action === 'confirm') {
            window.location.href = `组盘信息确认.html?orderNo=${encodeURIComponent(currentInboundProgressOrder.orderNo)}&palletCode=${encodeURIComponent(palletCode)}&source=progress&mode=view`;
            return;
        }

        openInboundDetail(target.dataset.detailType || 'bound', palletCode);
    });
}

function renderInboundProgressPage() {
    document.getElementById('inboundProgressBadge').textContent = isInboundViewMode ? '只读' : currentInboundProgressOrder.status;

    const html = currentInboundProgressOrder.pallets.map(function(pallet) {
        const statusMeta = getPalletStatusMeta(pallet.status);
        const isReadonlyPallet = isInboundViewMode || pallet.status === '已确认回库';

        return `
            <div class="pallet-panel-card ${statusMeta.cardClass}">
                <div class="pallet-panel-head">
                    <div>
                        <div class="pallet-panel-code">${pallet.palletCode}</div>
                        <div class="pallet-panel-sub">${currentInboundProgressOrder.materialCode} · ${currentInboundProgressOrder.materialName}</div>
                    </div>
                    <span class="pallet-status-badge ${statusMeta.badgeClass}">${pallet.status}</span>
                </div>
                <div class="pallet-inline-grid">
                    <div class="pallet-inline-item">
                        <span class="pallet-inline-label">抽检结果</span>
                        <span class="pallet-inline-value">${pallet.finalResult || '未判定'}</span>
                    </div>
                    <div class="pallet-inline-item">
                        <span class="pallet-inline-label">绑定SN</span>
                        <span class="pallet-inline-value">${pallet.boundQty}</span>
                    </div>
                    <div class="pallet-inline-item">
                        <span class="pallet-inline-label">已解绑SN</span>
                        <span class="pallet-inline-value">${pallet.unboundQty}</span>
                    </div>
                    <div class="pallet-inline-item">
                        <span class="pallet-inline-label">已抽检SN</span>
                        <span class="pallet-inline-value">${pallet.inspectedQty}</span>
                    </div>
                </div>
                <div class="pallet-panel-actions">
                    ${isReadonlyPallet
                        ? `<button class="compact-btn ghost" data-action="detail" data-detail-type="bound" data-pallet-code="${pallet.palletCode}">查看组盘信息</button>`
                        : `<button class="compact-btn secondary" data-action="select" data-pallet-code="${pallet.palletCode}">更新组盘信息</button>
                           <button class="compact-btn primary" data-action="confirm" data-pallet-code="${pallet.palletCode}">查看组盘信息</button>`}
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('returnPalletList').innerHTML = html || '<div class="empty-state-card">当前抽检单下暂无托盘。</div>';
}

function openInboundDetail(detailType, palletCode) {
    const modeQuery = isInboundViewMode ? '&mode=view' : '';
    window.location.href =
        `抽检入库结果明细.html?orderNo=${encodeURIComponent(currentInboundProgressOrder.orderNo)}&palletCode=${encodeURIComponent(palletCode)}&detailType=${encodeURIComponent(detailType)}${modeQuery}`;
}

function getPalletStatusMeta(status) {
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

    if (status === '检验中') {
        return {
            badgeClass: 'status-progress',
            cardClass: 'is-inspecting'
        };
    }

    return {
        badgeClass: 'status-pending',
        cardClass: ''
    };
}

function goBackToInbound() {
    const params = new URLSearchParams(window.location.search);
    const orderNo = params.get('orderNo') || '';
    const modeQuery = isInboundViewMode ? '&mode=view' : '';
    const target = orderNo
        ? `抽检入库.html?orderNo=${encodeURIComponent(orderNo)}${modeQuery}`
        : '抽检作业.html';
    window.location.href = target;
}
