let currentInspectedOrder = null;
let currentInspectedSource = '';

document.addEventListener('DOMContentLoaded', function() {
    if (!window.InspectionWorkStorage) {
        alert('未找到抽检数据，已返回列表页。');
        goBackToInspectionExecution();
        return;
    }

    window.InspectionWorkStorage.initialize();
    currentInspectedSource = getSourceFromQuery();
    const orderNo = getOrderNoFromQuery();
    currentInspectedOrder = window.InspectionWorkStorage.getOrder(orderNo);

    if (!currentInspectedOrder) {
        alert('未找到对应抽检单，已返回列表页。');
        goBackToInspectionExecution();
        return;
    }

    bindInspectedPalletEvents();
    renderInspectedPalletPage();
});

function bindInspectedPalletEvents() {
    document.getElementById('inspectedPalletList').addEventListener('click', function(event) {
        const target = event.target.closest('button[data-action]');
        if (!target) {
            return;
        }

        const palletCode = target.dataset.palletCode || '';
        window.location.href =
            `成品抽检结果明细.html?orderNo=${encodeURIComponent(currentInspectedOrder.orderNo)}&palletCode=${encodeURIComponent(palletCode)}&resultType=all&source=inspected${currentInspectedSource ? `&returnSource=${encodeURIComponent(currentInspectedSource)}` : ''}`;
    });
}

function renderInspectedPalletPage() {
    const completedPallets = currentInspectedOrder.pallets.filter(function(item) {
        return item.status === '已完成';
    });

    document.getElementById('inspectedPageBadge').textContent = `${completedPallets.length} 托`;

    const html = completedPallets.map(function(pallet) {
        return `
            <div class="pallet-panel-card is-completed">
                <div class="pallet-panel-head">
                    <div>
                        <div class="pallet-panel-code">${pallet.palletCode}</div>
                        <div class="pallet-panel-sub">${currentInspectedOrder.materialCode} · ${currentInspectedOrder.materialName}</div>
                    </div>
                    <span class="pallet-status-badge status-complete">${pallet.status}</span>
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
                    <button class="compact-btn ghost" data-action="detail" data-pallet-code="${pallet.palletCode}">查看结果</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('inspectedPalletList').innerHTML = html || '<div class="empty-state-card">当前暂无已完成抽检的托盘。</div>';
}

function getOrderNoFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('orderNo') || '';
}

function getSourceFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('source') || '';
}

function goBackToInspectionExecution() {
    const orderNo = getOrderNoFromQuery();
    const target = currentInspectedSource === 'list'
        ? '抽检作业.html'
        : orderNo
            ? `成品抽检.html?orderNo=${encodeURIComponent(orderNo)}`
            : '抽检作业.html';
    window.location.href = target;
}
