const RETURN_STORAGE_KEY = 'pdaInspectionReturnDemoState';
const RETURN_VERSION_KEY = 'pdaInspectionReturnDemoStateVersion';
const RETURN_STORAGE_VERSION = '2026-05-21-inspection-return-v2';
const RETURN_LANDMARK_BINDINGS = Object.freeze({
    'DB-A01-01': 'TP-QC-301',
    'DB-A01-02': 'TP-QC-302',
    'DB-B02-01': 'TP-QC-401'
});

let currentDetailPallet = null;
let currentDetailType = 'bound';
let currentLandmarkCode = '';
let pendingUnbindSnCode = '';
let pendingRebindSnCode = '';

document.addEventListener('DOMContentLoaded', function() {
    initializeReturnState();

    const params = new URLSearchParams(window.location.search);
    const palletCode = normalizeReturnCode(params.get('palletCode') || '');
    currentDetailType = params.get('detailType') || 'bound';
    currentLandmarkCode = normalizeReturnCode(params.get('landmarkCode') || '');
    currentDetailPallet = getReturnPallet(palletCode);

    if (!currentDetailPallet) {
        alert('未找到对应托盘，已返回抽检回库页。');
        goBackToInspectionReturn();
        return;
    }

    if (!currentLandmarkCode) {
        currentLandmarkCode = normalizeReturnCode(currentDetailPallet.currentLandmark || '') || getReturnLandmarkByPallet(currentDetailPallet.palletCode);
    }

    bindReturnDetailEvents();
    renderReturnDetailPage();
});

function cloneReturnData(data) {
    return JSON.parse(JSON.stringify(data));
}

function normalizeReturnCode(value) {
    return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function getReturnNowLabel() {
    return new Date().toLocaleString('zh-CN', { hour12: false });
}

function getReturnDefaultState() {
    return {
        pallets: [
            {
                palletCode: 'TP-QC-301',
                materialCode: 'FG-CITY-28',
                materialName: '28寸城市拉杆箱',
                originalQty: 9,
                status: '待回库',
                currentLandmark: '',
                confirmedAt: '',
                boundSns: [
                    'SN-QC301-01',
                    'SN-QC301-02',
                    'SN-QC301-03',
                    'SN-QC301-04',
                    'SN-QC301-05',
                    'SN-QC301-06',
                    'SN-QC301-07',
                    'SN-QC301-08',
                    'SN-QC301-09'
                ],
                unboundSns: []
            },
            {
                palletCode: 'TP-QC-302',
                materialCode: 'FG-CITY-28',
                materialName: '28寸城市拉杆箱',
                originalQty: 9,
                status: '待回库',
                currentLandmark: '',
                confirmedAt: '',
                boundSns: [
                    'SN-QC302-02',
                    'SN-QC302-03',
                    'SN-QC302-04',
                    'SN-QC302-05',
                    'SN-QC302-06',
                    'SN-QC302-07',
                    'SN-QC302-08',
                    'SN-QC302-09'
                ],
                unboundSns: [
                    {
                        snCode: 'SN-QC302-01',
                        unboundAt: '2026/05/20 09:14:05',
                        unboundSource: 'detail'
                    }
                ]
            },
            {
                palletCode: 'TP-QC-401',
                materialCode: 'FG-LITE-24',
                materialName: '24寸轻量拉杆箱',
                originalQty: 8,
                status: '已入库',
                currentLandmark: 'DB-B02-01',
                confirmedAt: '2026/05/19 17:38:50',
                boundSns: [
                    'SN-QC401-01',
                    'SN-QC401-03',
                    'SN-QC401-04',
                    'SN-QC401-05',
                    'SN-QC401-06',
                    'SN-QC401-07',
                    'SN-QC401-08'
                ],
                unboundSns: [
                    {
                        snCode: 'SN-QC401-02',
                        unboundAt: '2026/05/19 17:22:31',
                        unboundSource: 'scan'
                    }
                ]
            }
        ]
    };
}

function loadReturnState() {
    const raw = localStorage.getItem(RETURN_STORAGE_KEY);
    if (!raw) {
        return getReturnDefaultState();
    }

    try {
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.pallets)) {
            throw new Error('invalid_state');
        }

        return parsed;
    } catch (error) {
        return getReturnDefaultState();
    }
}

function saveReturnState(state) {
    localStorage.setItem(RETURN_STORAGE_KEY, JSON.stringify(state));
}

function initializeReturnState() {
    const version = localStorage.getItem(RETURN_VERSION_KEY);
    if (version !== RETURN_STORAGE_VERSION) {
        saveReturnState(getReturnDefaultState());
        localStorage.setItem(RETURN_VERSION_KEY, RETURN_STORAGE_VERSION);
        return;
    }

    saveReturnState(loadReturnState());
}

function getReturnPallet(palletCode) {
    const normalizedCode = normalizeReturnCode(palletCode);
    const state = loadReturnState();
    const pallet = state.pallets.find(function(item) {
        return item.palletCode === normalizedCode;
    }) || null;

    return pallet ? cloneReturnData(pallet) : null;
}

function getReturnLandmarkByPallet(palletCode) {
    const targetPalletCode = normalizeReturnCode(palletCode);
    const entries = Object.entries(RETURN_LANDMARK_BINDINGS);
    const matchedEntry = entries.find(function(item) {
        return item[1] === targetPalletCode;
    });

    return matchedEntry ? matchedEntry[0] : '';
}

function mutateReturnState(mutator) {
    const state = loadReturnState();
    const result = mutator(state);
    saveReturnState(state);
    return result;
}

function bindReturnDetailEvents() {
    document.getElementById('confirmUnbindBtn').addEventListener('click', confirmReturnDetailUnbind);
    document.getElementById('cancelUnbindBtn').addEventListener('click', closeReturnUnbindConfirmModal);
    document.getElementById('confirmRebindBtn').addEventListener('click', confirmReturnDetailRebind);
    document.getElementById('cancelRebindBtn').addEventListener('click', closeReturnRebindConfirmModal);
}

function getReturnDetailItems() {
    if (!currentDetailPallet) {
        return [];
    }

    if (currentDetailType === 'unbound') {
        return cloneReturnData(currentDetailPallet.unboundSns || []);
    }

    return (currentDetailPallet.boundSns || []).map(function(snCode) {
        return { snCode: snCode };
    });
}

function renderReturnDetailPage() {
    const detailMap = {
        bound: { title: '当前绑定SN明细' },
        unbound: { title: '已解绑 SN 明细' }
    };
    const detailConfig = detailMap[currentDetailType] || detailMap.bound;
    const detailItems = getReturnDetailItems();

    document.getElementById('detailPageTitle').textContent = detailConfig.title;
    document.getElementById('detailSectionTitle').textContent = detailConfig.title;
    document.getElementById('detailPalletCode').textContent = currentDetailPallet.palletCode;
    document.getElementById('detailPalletMeta').textContent =
        `${currentDetailPallet.materialName} · ${currentDetailPallet.materialCode} · 原始 ${currentDetailPallet.originalQty} 件`;

    const detailSnList = document.getElementById('detailSnList');
    if (!detailItems.length) {
        detailSnList.innerHTML = '<div class="empty-inline-state">当前暂无记录。</div>';
        return;
    }

    detailSnList.innerHTML = detailItems.map(function(item) {
        return renderReturnDetailRow(item);
    }).join('');
}

function renderReturnDetailRow(snItem) {
    if (currentDetailType === 'bound') {
        return `
            <div class="sn-list-item">
                <div class="sn-list-main">
                    <div class="sn-list-code">${snItem.snCode}</div>
                </div>
                ${currentDetailPallet.status === '已入库'
                    ? ''
                    : `<button class="secondary-btn sn-unbind-btn" type="button" onclick="openReturnUnbindConfirmModal('${snItem.snCode}')">解绑</button>`}
            </div>
        `;
    }

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
            </div>
            ${currentDetailPallet.status === '已入库'
                ? ''
                : `<div class="compact-row-actions"><button class="compact-row-btn" type="button" onclick="openReturnRebindConfirmModal('${snItem.snCode}')">取消解绑</button></div>`}
        </div>
    `;
}

function refreshReturnDetailPallet() {
    currentDetailPallet = getReturnPallet(currentDetailPallet ? currentDetailPallet.palletCode : '');
}

function openReturnUnbindConfirmModal(snCode) {
    pendingUnbindSnCode = snCode || '';
    document.getElementById('pendingUnbindSnCode').textContent = pendingUnbindSnCode || '-';
    document.getElementById('unbindConfirmModal').classList.add('active');
}

function closeReturnUnbindConfirmModal() {
    pendingUnbindSnCode = '';
    document.getElementById('pendingUnbindSnCode').textContent = '-';
    document.getElementById('unbindConfirmModal').classList.remove('active');
}

function openReturnRebindConfirmModal(snCode) {
    pendingRebindSnCode = snCode || '';
    document.getElementById('pendingRebindSnCode').textContent = pendingRebindSnCode || '-';
    document.getElementById('rebindConfirmModal').classList.add('active');
}

function closeReturnRebindConfirmModal() {
    pendingRebindSnCode = '';
    document.getElementById('pendingRebindSnCode').textContent = '-';
    document.getElementById('rebindConfirmModal').classList.remove('active');
}

function confirmReturnDetailUnbind() {
    if (!pendingUnbindSnCode || !currentDetailPallet) {
        return;
    }

    const result = mutateReturnState(function(state) {
        const pallet = state.pallets.find(function(item) {
            return item.palletCode === currentDetailPallet.palletCode;
        });
        if (!pallet) {
            return { ok: false };
        }

        if (pallet.status === '已入库') {
            return { ok: false, reason: 'locked' };
        }

        const targetIndex = (pallet.boundSns || []).findIndex(function(item) {
            return item === pendingUnbindSnCode;
        });
        if (targetIndex === -1) {
            return { ok: false, reason: 'sn_not_found' };
        }

        const removedSnCode = pallet.boundSns.splice(targetIndex, 1)[0];
        pallet.unboundSns = pallet.unboundSns || [];
        pallet.unboundSns.unshift({
            snCode: removedSnCode,
            unboundAt: getReturnNowLabel(),
            unboundSource: 'detail'
        });

        return { ok: true };
    });

    if (!result.ok) {
        alert('解绑失败，请稍后重试。');
        return;
    }

    const successSnCode = pendingUnbindSnCode;
    closeReturnUnbindConfirmModal();
    refreshReturnDetailPallet();
    renderReturnDetailPage();
    alert(`SN ${successSnCode} 已解绑。`);
}

function confirmReturnDetailRebind() {
    if (!pendingRebindSnCode || !currentDetailPallet) {
        return;
    }

    const result = mutateReturnState(function(state) {
        const pallet = state.pallets.find(function(item) {
            return item.palletCode === currentDetailPallet.palletCode;
        });
        if (!pallet) {
            return { ok: false };
        }

        if (pallet.status === '已入库') {
            return { ok: false, reason: 'locked' };
        }

        const targetIndex = (pallet.unboundSns || []).findIndex(function(item) {
            return item.snCode === pendingRebindSnCode;
        });
        if (targetIndex === -1) {
            return { ok: false, reason: 'sn_not_found' };
        }

        const restoredItem = pallet.unboundSns.splice(targetIndex, 1)[0];
        pallet.boundSns = pallet.boundSns || [];
        pallet.boundSns.push(restoredItem.snCode);

        return { ok: true };
    });

    if (!result.ok) {
        alert('取消解绑失败，请稍后重试。');
        return;
    }

    const successSnCode = pendingRebindSnCode;
    closeReturnRebindConfirmModal();
    refreshReturnDetailPallet();
    renderReturnDetailPage();
    alert(`SN ${successSnCode} 已恢复绑定。`);
}

function goBackToInspectionReturn() {
    const params = new URLSearchParams();
    if (currentLandmarkCode) {
        params.set('landmarkCode', currentLandmarkCode);
    }
    if (currentDetailPallet && currentDetailPallet.palletCode) {
        params.set('palletCode', currentDetailPallet.palletCode);
    }

    window.location.href = `抽检回库.html${params.toString() ? `?${params.toString()}` : ''}`;
}
