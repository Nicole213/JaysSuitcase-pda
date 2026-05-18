let pendingUnbindSnCode = '';
let pendingRebindSnCode = '';
let currentDetailOrder = null;
let currentDetailPallet = null;
let currentDetailType = 'bound';
let currentViewMode = false;
let currentDetailSource = '';
let currentReturnSource = '';

document.addEventListener('DOMContentLoaded', function() {
    if (!window.InspectionWorkStorage) {
        alert('未找到抽检入库数据，已返回上一页。');
        goBackToInspectionInbound();
        return;
    }

    window.InspectionWorkStorage.initialize();

    const params = new URLSearchParams(window.location.search);
    const orderNo = params.get('orderNo') || '';
    const palletCode = params.get('palletCode') || '';
    currentDetailType = params.get('detailType') || 'bound';
    currentViewMode = params.get('mode') === 'view';
    currentDetailSource = params.get('source') || '';
    currentReturnSource = params.get('returnSource') || '';
    currentDetailOrder = window.InspectionWorkStorage.getOrder(orderNo);
    currentDetailPallet = currentDetailOrder
        ? currentDetailOrder.pallets.find(function(item) { return item.palletCode === palletCode; })
        : null;

    if (!currentDetailOrder || !currentDetailPallet) {
        alert('未找到对应托盘，已返回回库确认页。');
        goBackToInspectionInbound();
        return;
    }

    bindInboundDetailEvents();
    renderInboundDetailPage();
});

function bindInboundDetailEvents() {
    document.getElementById('confirmUnbindBtn').addEventListener('click', confirmDetailUnbind);
    document.getElementById('cancelUnbindBtn').addEventListener('click', closeUnbindConfirmModal);
    document.getElementById('confirmRebindBtn').addEventListener('click', confirmDetailRebind);
    document.getElementById('cancelRebindBtn').addEventListener('click', closeRebindConfirmModal);
}

function renderInboundDetailPage() {
    const detailMap = {
        bound: { title: '当前绑定SN明细' },
        unbound: { title: '已解绑 SN 明细' },
        inspected: { title: '已抽检 SN 明细' }
    };
    const detailConfig = detailMap[currentDetailType] || detailMap.bound;
    const snItems = window.InspectionWorkStorage.getInspectionInboundSnList(
        currentDetailOrder.orderNo,
        currentDetailPallet.palletCode,
        currentDetailType
    );

    document.getElementById('detailPageTitle').textContent = detailConfig.title;
    document.getElementById('detailSectionTitle').textContent = detailConfig.title;
    document.getElementById('detailPalletCode').textContent = currentDetailPallet.palletCode;
    document.getElementById('detailPalletMeta').textContent =
        `${currentDetailOrder.materialName} · ${currentDetailOrder.materialCode} · 原始 ${currentDetailPallet.qty} 件`;
    document.getElementById('detailResultBadge').textContent = currentDetailPallet.status;

    const detailSnList = document.getElementById('detailSnList');
    if (!snItems.length) {
        detailSnList.innerHTML = `<div class="empty-inline-state">当前暂无记录。</div>`;
        return;
    }

    detailSnList.innerHTML = snItems.map(function(item) {
        return renderInboundDetailRow(item);
    }).join('');
}

function renderInboundDetailRow(snItem) {
    if (currentDetailType === 'bound') {
        return `
            <div class="sn-list-item">
                <div class="sn-list-main">
                    <div class="sn-list-code">${snItem.snCode}</div>
                </div>
                ${currentViewMode || currentDetailPallet.status !== '待确认回库'
                    ? ''
                    : `<button class="secondary-btn sn-unbind-btn" type="button" onclick="openUnbindConfirmModal('${snItem.snCode}')">解绑</button>`}
            </div>
        `;
    }

    if (currentDetailType === 'unbound') {
        return `
            <div class="sn-card compact-row inspected-fail">
                <div class="sn-card-head">
                    <div class="compact-row-main">
                        <div class="sn-code">${snItem.snCode}</div>
                    </div>
                    <span class="sn-status-badge fail">已解绑</span>
                </div>
                <div class="compact-row-extra">
                    <div class="compact-row-field"><span class="compact-row-label">解绑时间：</span><span class="compact-row-value">${snItem.unboundAt || '—'}</span></div>
                    <div class="compact-row-field"><span class="compact-row-label">解绑方式：</span><span class="compact-row-value">${snItem.unboundSource || '—'}</span></div>
                </div>
                ${currentViewMode || currentDetailOrder.status === '已确认回库'
                    ? ''
                    : `<div class="compact-row-actions"><button class="compact-row-btn" type="button" onclick="openRebindConfirmModal('${snItem.snCode}')">取消解绑</button></div>`}
            </div>
        `;
    }

    const actualResult = snItem.inspectionResult || '待检';
    const badgeClass = actualResult === '不合格'
        ? 'fail'
        : actualResult === '合格'
            ? 'pass'
            : 'pending';
    const badgeText = actualResult;
    const reasonText = snItem.defectReason || '—';
    const photoText = snItem.photoUploaded ? '已上传' : '未上传';
    const remarkText = snItem.remark || '—';
    const extraRows = actualResult === '不合格'
        ? `
            <div class="compact-row-field"><span class="compact-row-label">原因：</span><span class="compact-row-value">${reasonText}</span></div>
            <div class="compact-row-field"><span class="compact-row-label">照片：</span><span class="compact-row-value">${photoText}</span></div>
            <div class="compact-row-field"><span class="compact-row-label">备注：</span><span class="compact-row-value">${remarkText}</span></div>
        `
        : `
            <div class="compact-row-field"><span class="compact-row-label">备注：</span><span class="compact-row-value">${remarkText}</span></div>
        `;
    const canUnbindFromInspected = !currentViewMode
        && currentDetailPallet.status === '待确认回库'
        && !snItem.unbound;
    return `
        <div class="sn-card compact-row ${actualResult === '不合格' ? 'inspected-fail' : actualResult === '合格' ? 'inspected-pass' : ''}">
            <div class="sn-card-head">
                <div class="compact-row-main">
                    <div class="sn-code">${snItem.snCode}</div>
                </div>
                <span class="sn-status-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="compact-row-extra">${extraRows}</div>
            ${canUnbindFromInspected
                ? `<div class="compact-row-actions"><button class="compact-row-btn" type="button" onclick="openUnbindConfirmModal('${snItem.snCode}')">解绑</button></div>`
                : ''}
        </div>
    `;
}

function openUnbindConfirmModal(snCode) {
    pendingUnbindSnCode = snCode || '';
    document.getElementById('pendingUnbindSnCode').textContent = pendingUnbindSnCode || '-';
    document.getElementById('unbindConfirmModal').classList.add('active');
}

function closeUnbindConfirmModal() {
    pendingUnbindSnCode = '';
    document.getElementById('pendingUnbindSnCode').textContent = '-';
    document.getElementById('unbindConfirmModal').classList.remove('active');
}

function openRebindConfirmModal(snCode) {
    pendingRebindSnCode = snCode || '';
    document.getElementById('pendingRebindSnCode').textContent = pendingRebindSnCode || '-';
    document.getElementById('rebindConfirmModal').classList.add('active');
}

function closeRebindConfirmModal() {
    pendingRebindSnCode = '';
    document.getElementById('pendingRebindSnCode').textContent = '-';
    document.getElementById('rebindConfirmModal').classList.remove('active');
}

function confirmDetailUnbind() {
    if (!pendingUnbindSnCode) {
        return;
    }

    const result = window.InspectionWorkStorage.unbindSnFromPallet(
        currentDetailOrder.orderNo,
        currentDetailPallet.palletCode,
        pendingUnbindSnCode,
        'detail'
    );
    if (!result.ok) {
        alert('解绑失败，请稍后重试。');
        return;
    }

    closeUnbindConfirmModal();
    alert(`SN ${pendingUnbindSnCode} 已解绑。`);
    reloadCurrentDetailPage();
}

function confirmDetailRebind() {
    if (!pendingRebindSnCode) {
        return;
    }

    const result = window.InspectionWorkStorage.rebindSnToPallet(
        currentDetailOrder.orderNo,
        currentDetailPallet.palletCode,
        pendingRebindSnCode
    );
    if (!result.ok) {
        alert('取消解绑失败，请稍后重试。');
        return;
    }

    closeRebindConfirmModal();
    alert(`SN ${pendingRebindSnCode} 已恢复绑定。`);
    reloadCurrentDetailPage();
}

function reloadCurrentDetailPage() {
    const sourceQuery = currentDetailSource ? `&source=${encodeURIComponent(currentDetailSource)}` : '';
    const modeQuery = currentViewMode ? '&mode=view' : '';
    window.location.href =
        `抽检入库结果明细.html?orderNo=${encodeURIComponent(currentDetailOrder.orderNo)}&palletCode=${encodeURIComponent(currentDetailPallet.palletCode)}&detailType=${encodeURIComponent(currentDetailType)}${modeQuery}${sourceQuery}`;
}

function goBackToInspectionInbound() {
    if (currentDetailSource === 'confirm') {
        const modeQuery = currentViewMode ? '&mode=view' : '';
        const confirmTarget =
            `组盘信息确认.html?orderNo=${encodeURIComponent(currentDetailOrder ? currentDetailOrder.orderNo : '')}&palletCode=${encodeURIComponent(currentDetailPallet ? currentDetailPallet.palletCode : '')}${currentReturnSource ? `&source=${encodeURIComponent(currentReturnSource)}` : ''}${modeQuery}`;
        window.location.href = confirmTarget;
        return;
    }

    if (currentDetailSource === 'progress') {
        const progressTarget =
            `抽检回库进度.html?orderNo=${encodeURIComponent(currentDetailOrder ? currentDetailOrder.orderNo : '')}${currentViewMode ? '&mode=view' : ''}`;
        window.location.href = progressTarget;
        return;
    }

    const target =
        `抽检入库.html?orderNo=${encodeURIComponent(currentDetailOrder ? currentDetailOrder.orderNo : '')}&palletCode=${encodeURIComponent(currentDetailPallet ? currentDetailPallet.palletCode : '')}${currentViewMode ? '&mode=view' : ''}`;
    window.location.href = target;
}
