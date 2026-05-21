document.addEventListener('DOMContentLoaded', function() {
    if (!window.InspectionWorkStorage) {
        alert('未找到抽检数据，已返回上一页。');
        goBackToInspection();
        return;
    }

    window.InspectionWorkStorage.initialize();

    const params = new URLSearchParams(window.location.search);
    const orderNo = params.get('orderNo') || '';
    const palletCode = params.get('palletCode') || '';
    const resultType = params.get('resultType') || 'pass';
    const order = window.InspectionWorkStorage.getOrder(orderNo);
    const pallet = order ? order.pallets.find(function(item) { return item.palletCode === palletCode; }) : null;

    if (!order || !pallet) {
        alert('未找到对应托盘，已返回抽检页。');
        goBackToInspection();
        return;
    }

    bindDetailTabEvents(order, pallet);
    renderDetailPage(order, pallet, normalizeResultType(resultType));
});

function bindDetailTabEvents(order, pallet) {
    document.querySelectorAll('#detailTabBar .detail-tab-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            renderDetailPage(order, pallet, normalizeResultType(button.dataset.tab));
        });
    });
}

function renderDetailPage(order, pallet, resultType) {
    const isPass = resultType === 'pass';
    const isFail = resultType === 'fail';
    const titleText = isPass ? '合格 SN 记录' : isFail ? '不合格 SN 记录' : '抽检结果记录';
    const snItems = window.InspectionWorkStorage.getSnListByResult(order.orderNo, pallet.palletCode, resultType);
    const tabCountMap = {
        all: pallet.sns.length,
        pass: pallet.passedQty,
        fail: pallet.failedQty
    };

    document.getElementById('detailPageTitle').textContent = titleText;
    document.getElementById('detailSectionTitle').textContent = '抽检结果记录';
    document.getElementById('detailPalletCode').textContent = pallet.palletCode;
    document.getElementById('detailPalletMeta').textContent = `${order.materialName} · ${order.materialCode} · 共 ${pallet.sns.length} 件`;
    document.getElementById('detailResultBadge').textContent = pallet.status;
    syncDetailTabs(resultType, tabCountMap);

    const detailSnList = document.getElementById('detailSnList');
    if (!snItems.length) {
        const emptyLabel = isPass ? '合格' : isFail ? '不合格' : '全部';
        detailSnList.innerHTML = `<div class="empty-inline-state">当前暂无${emptyLabel} SN 记录。</div>`;
        return;
    }

    detailSnList.innerHTML = snItems.map(function(item) {
        return renderResultDetailRow(item, resultType);
    }).join('');
}

function renderResultDetailRow(snItem, resultType) {
    const actualResult = snItem.inspectionResult || '待检';
    const badgeClass = resultType === 'pass'
        ? 'pass'
        : resultType === 'fail'
            ? 'fail'
            : actualResult === '合格'
                ? 'pass'
                : actualResult === '不合格'
                    ? 'fail'
                    : 'pending';
    const badgeText = resultType === 'pass' ? '合格' : resultType === 'fail' ? '不合格' : actualResult;
    const reasonText = snItem.defectReason || '—';
    const photoText = snItem.photoUploaded ? '已上传' : '未上传';
    const remarkText = snItem.remark || '—';
    const extraRows = resultType === 'fail' || (resultType === 'all' && snItem.inspectionResult === '不合格')
        ? `
            <div class="compact-row-field"><span class="compact-row-label">原因：</span><span class="compact-row-value">${reasonText}</span></div>
            <div class="compact-row-field"><span class="compact-row-label">照片：</span><span class="compact-row-value">${photoText}</span></div>
            <div class="compact-row-field"><span class="compact-row-label">备注：</span><span class="compact-row-value">${remarkText}</span></div>
        `
        : `
            <div class="compact-row-field"><span class="compact-row-label">备注：</span><span class="compact-row-value">${remarkText}</span></div>
        `;
    const cardClass = resultType === 'pass'
        ? 'inspected-pass'
        : resultType === 'fail'
            ? 'inspected-fail'
            : snItem.inspectionResult === '不合格'
                ? 'inspected-fail'
                : snItem.inspectionResult === '合格'
                    ? 'inspected-pass'
                    : '';

    return `
        <div class="sn-card compact-row ${cardClass}">
            <div class="sn-card-head">
                <div class="compact-row-main">
                    <div class="sn-code">${snItem.snCode}</div>
                </div>
                <span class="sn-status-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="compact-row-extra">${extraRows}</div>
        </div>
    `;
}

function syncDetailTabs(activeTab, countMap) {
    document.querySelectorAll('#detailTabBar .detail-tab-btn').forEach(function(button) {
        const tab = normalizeResultType(button.dataset.tab);
        const labelMap = {
            all: '全部',
            pass: '合格',
            fail: '不合格'
        };
        button.textContent = `${labelMap[tab]} ${countMap[tab] || 0}`;
        button.classList.toggle('active', tab === activeTab);
    });
}

function normalizeResultType(resultType) {
    if (resultType === 'pass' || resultType === 'fail' || resultType === 'all') {
        return resultType;
    }

    return 'all';
}

function goBackToInspection() {
    const params = new URLSearchParams(window.location.search);
    const orderNo = params.get('orderNo') || '';
    const palletCode = params.get('palletCode') || '';
    const source = params.get('source') || '';
    const returnSource = params.get('returnSource') || '';

    if (source === 'progress') {
        const progressTarget = orderNo
            ? `抽检进度.html?orderNo=${encodeURIComponent(orderNo)}`
            : '抽检作业.html';
        window.location.href = progressTarget;
        return;
    }

    if (source === 'inspected') {
        const inspectedTarget = orderNo
            ? `已抽检托盘.html?orderNo=${encodeURIComponent(orderNo)}${returnSource ? `&source=${encodeURIComponent(returnSource)}` : ''}`
            : '抽检作业.html';
        window.location.href = inspectedTarget;
        return;
    }

    const target = orderNo
        ? `抽检结果录入.html?orderNo=${encodeURIComponent(orderNo)}${palletCode ? `&palletCode=${encodeURIComponent(palletCode)}` : ''}`
        : '抽检作业.html';
    window.location.href = target;
}
