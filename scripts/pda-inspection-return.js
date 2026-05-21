(function createInspectionReturnPage() {
    const STORAGE_KEY = 'pdaInspectionReturnDemoState';
    const VERSION_KEY = 'pdaInspectionReturnDemoStateVersion';
    const STORAGE_VERSION = '2026-05-21-inspection-return-v2';
    const LANDMARK_BINDINGS = Object.freeze({
        'DB-A01-01': 'TP-QC-301',
        'DB-A01-02': 'TP-QC-302',
        'DB-B02-01': 'TP-QC-401'
    });

    let demoState = null;
    let activeLandmarkCode = '';
    let suggestedPalletCode = '';
    let currentPalletCode = '';
    let pendingSnCode = '';
    let feedbackTone = 'neutral';
    let feedbackText = '等待输入地标码后自动回显托盘信息';
    let landmarkAutoTimer = null;
    let palletAutoTimer = null;
    let snAutoTimer = null;

    document.addEventListener('DOMContentLoaded', function() {
        initializeState();
        bindEvents();
        if (!restoreFromQuery()) {
            renderPage();
        }
    });

    function clone(data) {
        return JSON.parse(JSON.stringify(data));
    }

    function nowLabel() {
        return new Date().toLocaleString('zh-CN', { hour12: false });
    }

    function normalizeCode(value) {
        return typeof value === 'string' ? value.trim().toUpperCase() : '';
    }

    function getDefaultState() {
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

    function loadState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return getDefaultState();
        }

        try {
            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.pallets)) {
                throw new Error('invalid_state');
            }

            return parsed;
        } catch (error) {
            return getDefaultState();
        }
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demoState));
    }

    function resetStoredState() {
        demoState = getDefaultState();
        saveState();
        localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
    }

    function initializeState() {
        const version = localStorage.getItem(VERSION_KEY);
        if (version !== STORAGE_VERSION) {
            demoState = getDefaultState();
            saveState();
            localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
            return;
        }

        demoState = loadState();
    }

    function bindEvents() {
        const landmarkCodeInput = document.getElementById('landmarkCodeInput');
        const palletCodeInput = document.getElementById('palletCodeInput');
        const snCodeInput = document.getElementById('snCodeInput');

        document.getElementById('unbindSnBtn').addEventListener('click', openUnbindConfirmModal);
        document.getElementById('confirmInboundBtn').addEventListener('click', openInboundConfirmModal);
        document.getElementById('confirmUnbindBtn').addEventListener('click', confirmUnbindSn);
        document.getElementById('cancelUnbindBtn').addEventListener('click', closeUnbindConfirmModal);
        document.getElementById('confirmInboundModalBtn').addEventListener('click', confirmInbound);
        document.getElementById('cancelInboundBtn').addEventListener('click', closeInboundConfirmModal);
        document.querySelectorAll('.return-overview-row').forEach(function(row) {
            row.addEventListener('click', function() {
                openSnDetailPage(row.dataset.detailType || 'bound');
            });
        });

        landmarkCodeInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleLandmarkSubmit();
            }
        });

        landmarkCodeInput.addEventListener('input', function() {
            clearTimeout(landmarkAutoTimer);
            const landmarkCode = normalizeCode(landmarkCodeInput.value);

            if (!landmarkCode || !LANDMARK_BINDINGS[landmarkCode]) {
                return;
            }

            landmarkAutoTimer = setTimeout(handleLandmarkSubmit, 160);
        });

        palletCodeInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                handlePalletScan();
            }
        });

        palletCodeInput.addEventListener('input', function() {
            clearTimeout(palletAutoTimer);
            const palletCode = normalizeCode(palletCodeInput.value);

            if (!activeLandmarkCode || !palletCode || !getPallet(palletCode)) {
                return;
            }

            palletAutoTimer = setTimeout(handlePalletScan, 160);
        });

        snCodeInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSnScan();
            }
        });

        snCodeInput.addEventListener('input', function() {
            clearTimeout(snAutoTimer);
            const currentPallet = getCurrentPallet();
            const snCode = normalizeCode(snCodeInput.value);

            if (!currentPallet || currentPallet.status === '已入库' || !snCode || !currentPallet.boundSns.includes(snCode)) {
                return;
            }

            snAutoTimer = setTimeout(handleSnScan, 160);
        });
    }

    function getLandmarkCodeByPallet(palletCode) {
        const targetPalletCode = normalizeCode(palletCode);
        const entries = Object.entries(LANDMARK_BINDINGS);
        const matchedEntry = entries.find(function(item) {
            return item[1] === targetPalletCode;
        });

        return matchedEntry ? matchedEntry[0] : '';
    }

    function syncPageQuery() {
        const params = new URLSearchParams();
        if (activeLandmarkCode) {
            params.set('landmarkCode', activeLandmarkCode);
        }
        if (currentPalletCode) {
            params.set('palletCode', currentPalletCode);
        }

        const target = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState(null, '', target);
    }

    function restoreFromQuery() {
        const params = new URLSearchParams(window.location.search);
        const queryLandmarkCode = normalizeCode(params.get('landmarkCode') || '');
        const queryPalletCode = normalizeCode(params.get('palletCode') || '');
        const resolvedLandmarkCode = queryLandmarkCode || getLandmarkCodeByPallet(queryPalletCode);
        const resolvedPalletCode = queryPalletCode || (resolvedLandmarkCode ? LANDMARK_BINDINGS[resolvedLandmarkCode] : '');

        if (!resolvedLandmarkCode || !resolvedPalletCode) {
            return false;
        }

        activeLandmarkCode = resolvedLandmarkCode;
        suggestedPalletCode = LANDMARK_BINDINGS[resolvedLandmarkCode] || resolvedPalletCode;
        currentPalletCode = '';
        pendingSnCode = '';
        document.getElementById('landmarkCodeInput').value = resolvedLandmarkCode;
        document.getElementById('palletCodeInput').value = resolvedPalletCode;
        loadPallet(resolvedPalletCode, 'restore');
        return true;
    }

    function getPallet(palletCode) {
        const normalizedCode = normalizeCode(palletCode);
        return demoState.pallets.find(function(item) {
            return item.palletCode === normalizedCode;
        }) || null;
    }

    function getCurrentPallet() {
        return currentPalletCode ? getPallet(currentPalletCode) : null;
    }

    function setFeedback(tone, text) {
        feedbackTone = tone || 'neutral';
        feedbackText = text || '等待输入地标码后自动回显托盘信息';
    }

    function handleLandmarkSubmit() {
        const landmarkCode = normalizeCode(document.getElementById('landmarkCodeInput').value);
        if (!landmarkCode) {
            alert('请先输入地标码。');
            return;
        }

        const mappedPalletCode = LANDMARK_BINDINGS[landmarkCode];
        if (!mappedPalletCode) {
            setFeedback('warn', '未匹配到对应地标码，请重新输入。');
            renderPage();
            alert('未匹配到对应地标码，请重新输入。');
            return;
        }

        activeLandmarkCode = landmarkCode;
        suggestedPalletCode = mappedPalletCode;
        currentPalletCode = '';
        pendingSnCode = '';
        document.getElementById('palletCodeInput').value = mappedPalletCode;
        loadPallet(mappedPalletCode, 'auto');
    }

    function handlePalletScan() {
        if (!activeLandmarkCode) {
            alert('请先输入地标码。');
            return;
        }

        const palletCode = normalizeCode(document.getElementById('palletCodeInput').value);
        if (!palletCode) {
            alert('请先输入托盘码。');
            return;
        }

        loadPallet(palletCode, 'manual');
    }

    function loadPallet(palletCode, source) {
        const pallet = getPallet(palletCode);
        if (!pallet) {
            setFeedback('warn', `未匹配到托盘码 ${normalizeCode(palletCode)}，请重新输入。`);
            renderPage();
            alert('未匹配到托盘信息，请重新输入托盘码。');
            return;
        }

        currentPalletCode = pallet.palletCode;
        pendingSnCode = '';

        if (source === 'manual' && suggestedPalletCode && suggestedPalletCode !== pallet.palletCode) {
            setFeedback(
                'warn',
                `地标码 ${activeLandmarkCode} 系统推荐托盘 ${suggestedPalletCode}，当前已按手动输入切换为 ${pallet.palletCode}。`
            );
        } else {
            setFeedback('info', `已识别地标码 ${activeLandmarkCode}，系统自动回显托盘 ${pallet.palletCode}。`);
        }

        renderPage();
        syncPageQuery();

        if (pallet.status !== '已入库') {
            document.getElementById('snCodeInput').focus();
        }
    }

    function handleSnScan() {
        const currentPallet = getCurrentPallet();
        if (!currentPallet) {
            alert('请先确认托盘信息。');
            return;
        }

        if (currentPallet.status === '已入库') {
            alert('当前托盘已完成入库，请输入新的地标码。');
            return;
        }

        const snCode = normalizeCode(document.getElementById('snCodeInput').value);
        if (!snCode) {
            alert('请先输入 SN 码。');
            return;
        }

        if (!currentPallet.boundSns.includes(snCode)) {
            alert('该 SN 不在当前绑定列表中，请重新输入。');
            return;
        }

        pendingSnCode = snCode;
        setFeedback('info', `已锁定待解绑 SN：${snCode}，确认后可执行解绑。`);
        renderPage();
    }

    function openUnbindConfirmModal() {
        const currentPallet = getCurrentPallet();
        if (!currentPallet) {
            alert('请先确认托盘信息。');
            return;
        }

        if (currentPallet.status === '已入库') {
            alert('当前托盘已完成入库，不能再解绑。');
            return;
        }

        if (!pendingSnCode) {
            alert('请先输入需要解绑的 SN。');
            return;
        }

        document.getElementById('modalUnbindSnCode').textContent = pendingSnCode;
        document.getElementById('unbindConfirmModal').classList.add('active');
    }

    function closeUnbindConfirmModal() {
        document.getElementById('modalUnbindSnCode').textContent = '-';
        document.getElementById('unbindConfirmModal').classList.remove('active');
    }

    function confirmUnbindSn() {
        const currentPallet = getCurrentPallet();
        if (!currentPallet || !pendingSnCode) {
            closeUnbindConfirmModal();
            return;
        }

        const targetIndex = currentPallet.boundSns.findIndex(function(item) {
            return item === pendingSnCode;
        });
        if (targetIndex === -1) {
            closeUnbindConfirmModal();
            alert('该 SN 已不在当前绑定列表中。');
            return;
        }

        const removedSnCode = currentPallet.boundSns.splice(targetIndex, 1)[0];
        currentPallet.unboundSns.unshift({
            snCode: removedSnCode,
            unboundAt: nowLabel(),
            unboundSource: 'scan'
        });
        saveState();

        document.getElementById('snCodeInput').value = '';
        pendingSnCode = '';
        setFeedback('info', `SN ${removedSnCode} 已解绑，可继续输入下一个 SN。`);
        closeUnbindConfirmModal();
        renderPage();
        document.getElementById('snCodeInput').focus();
    }

    function openInboundConfirmModal() {
        const currentPallet = getCurrentPallet();
        if (!activeLandmarkCode) {
            alert('请先输入地标码。');
            return;
        }

        if (!currentPallet) {
            alert('请先确认托盘信息。');
            return;
        }

        if (currentPallet.status === '已入库') {
            alert('当前托盘已确认入库。');
            return;
        }

        document.getElementById('modalInboundLandmarkCode').textContent = activeLandmarkCode;
        document.getElementById('modalInboundPalletCode').textContent = currentPallet.palletCode;
        document.getElementById('confirmInboundModal').classList.add('active');
    }

    function closeInboundConfirmModal() {
        document.getElementById('modalInboundLandmarkCode').textContent = '-';
        document.getElementById('modalInboundPalletCode').textContent = '-';
        document.getElementById('confirmInboundModal').classList.remove('active');
    }

    function confirmInbound() {
        const currentPallet = getCurrentPallet();
        if (!currentPallet || !activeLandmarkCode) {
            closeInboundConfirmModal();
            return;
        }

        currentPallet.status = '已入库';
        currentPallet.currentLandmark = activeLandmarkCode;
        currentPallet.confirmedAt = nowLabel();
        pendingSnCode = '';
        document.getElementById('snCodeInput').value = '';
        saveState();

        setFeedback('success', `托盘 ${currentPallet.palletCode} 已确认入库至地标码 ${activeLandmarkCode}。`);
        closeInboundConfirmModal();
        resetStoredState();
        window.location.href = '抽检回库.html';
    }

    function clearCurrentSelection() {
        clearTimeout(landmarkAutoTimer);
        clearTimeout(palletAutoTimer);
        clearTimeout(snAutoTimer);
        activeLandmarkCode = '';
        suggestedPalletCode = '';
        currentPalletCode = '';
        pendingSnCode = '';
        setFeedback('neutral', '等待输入地标码后自动回显托盘信息');

        document.getElementById('landmarkCodeInput').value = '';
        document.getElementById('palletCodeInput').value = '';
        document.getElementById('snCodeInput').value = '';

        closeUnbindConfirmModal();
        closeInboundConfirmModal();
        renderPage();
        syncPageQuery();
        document.getElementById('landmarkCodeInput').focus();
    }

    function openSnDetailPage(detailType) {
        const currentPallet = getCurrentPallet();
        if (!currentPallet) {
            alert('请先输入地标码并识别托盘信息。');
            return;
        }

        const detailParams = new URLSearchParams();
        detailParams.set('palletCode', currentPallet.palletCode);
        detailParams.set('detailType', detailType || 'bound');
        const resolvedLandmarkCode = activeLandmarkCode || normalizeCode(currentPallet.currentLandmark || '') || getLandmarkCodeByPallet(currentPallet.palletCode);
        if (resolvedLandmarkCode) {
            detailParams.set('landmarkCode', resolvedLandmarkCode);
        }

        window.location.href = `抽检回库明细.html?${detailParams.toString()}`;
    }

    function renderPage() {
        const currentPallet = getCurrentPallet();
        const isLocked = currentPallet ? currentPallet.status === '已入库' : false;
        const summaryPalletCode = currentPallet ? currentPallet.palletCode : '待识别托盘';
        const summaryMeta = currentPallet
            ? `${currentPallet.materialName} · ${currentPallet.materialCode} · 原始 ${currentPallet.originalQty} 件`
            : '扫描地标码后自动带出托盘与物料信息';
        const badgeText = currentPallet ? currentPallet.status : '待扫描';
        const palletHintText = activeLandmarkCode
            ? `系统推荐托盘码：${suggestedPalletCode || '-'}${suggestedPalletCode ? '，如有偏差可手动重输' : ''}`
            : '请先输入地标码，系统将自动回显托盘码';
        const snHintText = currentPallet
            ? isLocked
                ? '当前托盘已完成入库，如需继续操作请切换新的地标码'
                : currentPallet.boundSns.length
                ? `可试用 SN：${currentPallet.boundSns.join('、')}`
                : '当前托盘暂无可解绑 SN'
            : '请先识别托盘后再输入 SN 码';
        document.getElementById('landmarkHint').textContent = `可试用地标码：${Object.keys(LANDMARK_BINDINGS).join('、')}`;
        document.getElementById('palletHint').textContent = palletHintText;
        document.getElementById('snHint').textContent = snHintText;
        document.getElementById('palletSummary').className = `summary-banner inbound-summary-banner return-summary-banner${currentPallet ? '' : ' is-empty'}${isLocked ? ' is-locked' : ''}`;
        document.getElementById('summaryPalletCode').textContent = summaryPalletCode;
        document.getElementById('summaryPalletMeta').textContent = summaryMeta;

        document.getElementById('boundCount').textContent = currentPallet ? currentPallet.boundSns.length : '0';
        document.getElementById('unboundCount').textContent = currentPallet ? currentPallet.unboundSns.length : '0';
        document.querySelectorAll('.return-overview-row').forEach(function(row) {
            row.classList.toggle('is-disabled', !currentPallet);
        });

        document.getElementById('palletCodeInput').disabled = !activeLandmarkCode;
        document.getElementById('snCodeInput').disabled = !currentPallet || isLocked;
        document.getElementById('unbindSnBtn').disabled = !currentPallet || isLocked || !pendingSnCode;
        document.getElementById('confirmInboundBtn').disabled = !activeLandmarkCode || !currentPallet || isLocked;
    }
})();
