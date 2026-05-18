let currentProgressOrder = null;

document.addEventListener('DOMContentLoaded', function() {
    if (!window.InspectionWorkStorage) {
        alert('未找到抽检数据，已返回列表页。');
        goBackToInspection();
        return;
    }

    window.InspectionWorkStorage.initialize();
    const orderNo = getOrderNoFromQuery();
    currentProgressOrder = window.InspectionWorkStorage.getOrder(orderNo);

    if (!currentProgressOrder) {
        alert('未找到对应抽检单，已返回列表页。');
        goBackToInspection();
        return;
    }

    bindProgressEvents();
    renderProgressPage();
});

function bindProgressEvents() {
    document.getElementById('inspectionPalletList').addEventListener('click', function(event) {
        const target = event.target.closest('button[data-action]');
        if (!target) {
            return;
        }

        const palletCode = target.dataset.palletCode;
        const action = target.dataset.action;

        if (action === 'select') {
            window.location.href = `抽检结果录入.html?orderNo=${encodeURIComponent(currentProgressOrder.orderNo)}&palletCode=${encodeURIComponent(palletCode)}&source=progress`;
            return;
        }

        const detailType = target.dataset.detailType || 'pass';
        window.location.href = `成品抽检结果明细.html?orderNo=${encodeURIComponent(currentProgressOrder.orderNo)}&palletCode=${encodeURIComponent(palletCode)}&resultType=${encodeURIComponent(detailType)}&source=progress`;
    });
}

function renderProgressPage() {
    document.getElementById('inspectionProgressBadge').textContent = currentProgressOrder.status;

    const html = currentProgressOrder.pallets.map(function(pallet) {
        const statusMeta = getPalletStatusMeta(pallet.status);
        const editable = pallet.status === '待检验' || pallet.status === '检验中';
        const actionLabel = pallet.status === '检验中' ? '继续抽检' : '执行抽检';
        return `
            <div class="pallet-panel-card ${statusMeta.cardClass}">
                <div class="pallet-panel-head">
                    <div>
                        <div class="pallet-panel-code">${pallet.palletCode}</div>
                        <div class="pallet-panel-sub">${currentProgressOrder.materialCode} · ${currentProgressOrder.materialName}</div>
                    </div>
                    <span class="pallet-status-badge ${statusMeta.badgeClass}">${pallet.status}</span>
                </div>
                <div class="pallet-inline-grid">
                    <div class="pallet-inline-item">
                        <span class="pallet-inline-label">物料数量</span>
                        <span class="pallet-inline-value">${pallet.sns.length}</span>
                    </div>
                    <div class="pallet-inline-item">
                        <span class="pallet-inline-label">已检验</span>
                        <span class="pallet-inline-value">${pallet.inspectedQty}</span>
                    </div>
                    <div class="pallet-inline-item">
                        <span class="pallet-inline-label">合格/不合格</span>
                        <span class="pallet-inline-value">${pallet.passedQty}/${pallet.failedQty}</span>
                    </div>
                    <div class="pallet-inline-item">
                        <span class="pallet-inline-label">本托结果</span>
                        <span class="pallet-inline-value">${pallet.finalResult || '未判定'}</span>
                    </div>
                </div>
                <div class="pallet-panel-actions">
                    ${editable
                        ? `<button class="compact-btn primary" data-action="select" data-pallet-code="${pallet.palletCode}">${actionLabel}</button>`
                        : `<button class="compact-btn ghost" data-action="detail" data-detail-type="all" data-pallet-code="${pallet.palletCode}">查看结果</button>`}
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('inspectionPalletList').innerHTML = html || '<div class="empty-state-card">当前抽检单下暂无托盘。</div>';
}

function getPalletStatusMeta(status) {
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

function getOrderNoFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('orderNo') || '';
}

function goBackToInspection() {
    const orderNo = getOrderNoFromQuery();
    const target = orderNo
        ? `成品抽检.html?orderNo=${encodeURIComponent(orderNo)}`
        : '抽检作业.html';
    window.location.href = target;
}
