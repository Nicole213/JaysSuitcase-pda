let currentRelatedOrder = null;

document.addEventListener('DOMContentLoaded', function() {
    if (!window.InspectionWorkStorage) {
        alert('未找到抽检数据，已返回列表页。');
        goBackToInspectionExecution();
        return;
    }

    window.InspectionWorkStorage.initialize();
    const orderNo = getOrderNoFromQuery();
    currentRelatedOrder = window.InspectionWorkStorage.getOrder(orderNo);

    if (!currentRelatedOrder) {
        alert('未找到对应抽检单，已返回列表页。');
        goBackToInspectionExecution();
        return;
    }

    renderRelatedPalletPage();
});

function renderRelatedPalletPage() {
    document.getElementById('relatedPalletBadge').textContent = `${currentRelatedOrder.relatedPalletCount} 托`;

    const html = currentRelatedOrder.relatedPallets.map(function(item) {
        return `
            <div class="pallet-panel-card related-pallet-card">
                <div class="pallet-panel-head">
                    <div>
                        <div class="pallet-panel-code">${item.palletCode}</div>
                        <div class="pallet-panel-sub">${item.materialCode} · ${item.materialName}</div>
                    </div>
                </div>
                <div class="pallet-inline-grid">
                    <div class="pallet-inline-item">
                        <span class="pallet-inline-label">通道编码</span>
                        <span class="pallet-inline-value">${item.channelCode}</span>
                    </div>
                    <div class="pallet-inline-item">
                        <span class="pallet-inline-label">库位编码</span>
                        <span class="pallet-inline-value">${item.locationCode}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('relatedPalletList').innerHTML = html || '<div class="empty-state-card">当前抽检单暂无关联托盘信息。</div>';
}

function getOrderNoFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('orderNo') || '';
}

function goBackToInspectionExecution() {
    const orderNo = getOrderNoFromQuery();
    const target = orderNo
        ? `成品抽检.html?orderNo=${encodeURIComponent(orderNo)}`
        : '抽检作业.html';
    window.location.href = target;
}
