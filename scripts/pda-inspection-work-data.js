(function createInspectionWorkStorage() {
    const STORAGE_KEY = 'pdaInspectionWorkDemoState';
    const VERSION_KEY = 'pdaInspectionWorkDemoStateVersion';
    const STORAGE_VERSION = '2026-05-15-inspection-order-v3';
    const TARGET_LAB_MAP = {
        '成品检验室A': '检验室1',
        '成品检验室B': '检验室2',
        '成品检验室C': '检验室3',
        '检验室A': '检验室1',
        '检验室B': '检验室2',
        '检验室C': '检验室3',
        '检验室1': '检验室1',
        '检验室2': '检验室2',
        '检验室3': '检验室3'
    };

    function clone(data) {
        return JSON.parse(JSON.stringify(data));
    }

    function nowLabel() {
        return new Date().toLocaleString('zh-CN', { hour12: false });
    }

    function createSn(snCode, spec, location, inspectionResult, defectReason, photoUploaded, remark, unbound) {
        return {
            snCode,
            spec: spec || '',
            location: location || '',
            inspectionResult: inspectionResult || '',
            defectReason: defectReason || '',
            photoUploaded: Boolean(photoUploaded),
            remark: remark || '',
            unbound: Boolean(unbound),
            unboundAt: '',
            unboundSource: ''
        };
    }

    function createPallet(palletCode, qty, status, finalResult, sns, extra) {
        return {
            palletCode,
            qty,
            status,
            finalResult: finalResult || '',
            submittedAt: '',
            draftSavedAt: '',
            groupInfoConfirmed: false,
            groupInfoConfirmedAt: '',
            returnConfirmedAt: '',
            sns: sns || [],
            ...extra
        };
    }

    function getDefaultState() {
        const order1Pallet1 = createPallet('TP-QC-101', 12, '待检验', '', [
            createSn('SN-QC101-01', '黑色', 'A区-01'),
            createSn('SN-QC101-02', '黑色', 'A区-01'),
            createSn('SN-QC101-03', '银色', 'A区-01'),
            createSn('SN-QC101-04', '银色', 'A区-01'),
            createSn('SN-QC101-05', '灰色', 'A区-01'),
            createSn('SN-QC101-06', '灰色', 'A区-01')
        ]);
        const order1Pallet2 = createPallet('TP-QC-102', 10, '待检验', '', [
            createSn('SN-QC102-01', '黑色', 'A区-02'),
            createSn('SN-QC102-02', '黑色', 'A区-02'),
            createSn('SN-QC102-03', '银色', 'A区-02'),
            createSn('SN-QC102-04', '银色', 'A区-02'),
            createSn('SN-QC102-05', '灰色', 'A区-02')
        ]);

        const order2Pallet1 = createPallet('TP-QC-201', 15, '待确认回库', '合格', [
            createSn('SN-QC201-01', '曜石黑', 'B区-01', '合格', '', false, '外观正常'),
            createSn('SN-QC201-02', '曜石黑', 'B区-01', '合格'),
            createSn('SN-QC201-03', '深海蓝', 'B区-01', '合格'),
            createSn('SN-QC201-04', '深海蓝', 'B区-01')
        ], {
            submittedAt: '2026/05/14 08:46:10'
        });
        const order2Pallet2 = createPallet('TP-QC-202', 15, '检验中', '不合格', [
            createSn('SN-QC202-01', '曜石黑', 'B区-02', '不合格', '外观瑕疵', true, '箱体右侧划伤'),
            createSn('SN-QC202-02', '曜石黑', 'B区-02', '合格'),
            createSn('SN-QC202-03', '深海蓝', 'B区-02'),
            createSn('SN-QC202-04', '深海蓝', 'B区-02')
        ], {
            draftSavedAt: '2026/05/14 09:12:35'
        });
        const order2Pallet3 = createPallet('TP-QC-203', 14, '待检验', '', [
            createSn('SN-QC203-01', '岩灰色', 'B区-03'),
            createSn('SN-QC203-02', '岩灰色', 'B区-03'),
            createSn('SN-QC203-03', '曜石黑', 'B区-03'),
            createSn('SN-QC203-04', '曜石黑', 'B区-03')
        ]);

        const order3Pallet1 = createPallet('TP-QC-301', 9, '待确认回库', '合格', [
            createSn('SN-QC301-01', '流沙金', 'C区-01', '合格'),
            createSn('SN-QC301-02', '流沙金', 'C区-01', '合格'),
            createSn('SN-QC301-03', '深空灰', 'C区-01', '合格')
        ], {
            submittedAt: '2026/05/13 17:05:20'
        });
        const order3Pallet2 = createPallet('TP-QC-302', 9, '待确认回库', '不合格', [
            createSn('SN-QC302-01', '流沙金', 'C区-02', '不合格', '包装不合格', true, '内衬挤压'),
            createSn('SN-QC302-02', '流沙金', 'C区-02', '合格'),
            createSn('SN-QC302-03', '深空灰', 'C区-02', '合格')
        ], {
            submittedAt: '2026/05/13 17:11:42'
        });

        const order4Pallet1 = createPallet('TP-QC-401', 8, '已确认回库', '合格', [
            createSn('SN-QC401-01', '香槟金', 'D区-01', '合格'),
            createSn('SN-QC401-02', '香槟金', 'D区-01', '合格', '', false, '', true),
            createSn('SN-QC401-03', '曜夜蓝', 'D区-01', '合格')
        ], {
            submittedAt: '2026/05/12 16:18:20',
            returnConfirmedAt: '2026/05/13 08:52:00'
        });
        order4Pallet1.sns[1].unboundAt = '2026/05/13 08:36:18';
        order4Pallet1.sns[1].unboundSource = 'scan';

        const order4Pallet2 = createPallet('TP-QC-402', 8, '已确认回库', '合格', [
            createSn('SN-QC402-01', '香槟金', 'D区-02', '合格'),
            createSn('SN-QC402-02', '曜夜蓝', 'D区-02', '合格'),
            createSn('SN-QC402-03', '曜夜蓝', 'D区-02', '合格')
        ], {
            submittedAt: '2026/05/12 16:26:40',
            returnConfirmedAt: '2026/05/13 09:08:55'
        });

        return {
            orders: [
                {
                    orderNo: 'CJ20260514001',
                    mesOrderNo: 'MES-WO-20260514-001',
                    materialCode: 'FG-TRAVEL-20',
                    materialName: '20寸登机箱',
                    targetLab: '检验室1',
                    returnConfirmed: false,
                    returnConfirmedAt: '',
                    pallets: [order1Pallet1, order1Pallet2]
                },
                {
                    orderNo: 'CJ20260514002',
                    mesOrderNo: 'MES-WO-20260514-002',
                    materialCode: 'FG-BUSINESS-24',
                    materialName: '24寸商务拉杆箱',
                    targetLab: '检验室2',
                    returnConfirmed: false,
                    returnConfirmedAt: '',
                    pallets: [order2Pallet1, order2Pallet2, order2Pallet3]
                },
                {
                    orderNo: 'CJ20260513005',
                    mesOrderNo: 'MES-WO-20260513-011',
                    materialCode: 'FG-CITY-28',
                    materialName: '28寸城市拉杆箱',
                    targetLab: '检验室3',
                    returnConfirmed: false,
                    returnConfirmedAt: '',
                    pallets: [order3Pallet1, order3Pallet2]
                },
                {
                    orderNo: 'CJ20260512003',
                    mesOrderNo: 'MES-WO-20260512-006',
                    materialCode: 'FG-LITE-24',
                    materialName: '24寸轻量拉杆箱',
                    targetLab: '检验室1',
                    returnConfirmed: true,
                    returnConfirmedAt: '2026/05/13 09:16:20',
                    pallets: [order4Pallet1, order4Pallet2]
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
            if (!parsed || !Array.isArray(parsed.orders)) {
                throw new Error('invalid_state');
            }
            return parsed;
        } catch (error) {
            return getDefaultState();
        }
    }

    function saveState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function getNormalizedTargetLab(order, index) {
        const normalized = TARGET_LAB_MAP[order.targetLab];
        if (normalized) {
            return normalized;
        }

        const fallbackByOrderNo = {
            CJ20260514001: '检验室1',
            CJ20260514002: '检验室2',
            CJ20260513005: '检验室3',
            CJ20260512003: '检验室1'
        };

        return fallbackByOrderNo[order.orderNo] || `检验室${(index % 3) + 1}`;
    }

    function normalizeState(state) {
        const safeState = state && Array.isArray(state.orders) ? state : getDefaultState();
        safeState.orders = safeState.orders.map(function(order, index) {
            return {
                ...order,
                targetLab: getNormalizedTargetLab(order, index),
                pallets: (Array.isArray(order.pallets) ? order.pallets : []).map(function(pallet) {
                    const isReturned = pallet.status === '已确认回库';
                    return {
                        groupInfoConfirmed: isReturned,
                        groupInfoConfirmedAt: isReturned ? (pallet.returnConfirmedAt || order.returnConfirmedAt || '') : '',
                        ...pallet
                    };
                }).map(function(pallet) {
                    if (!order.returnConfirmed && pallet.status === '已确认回库') {
                        return {
                            ...pallet,
                            status: '待确认回库',
                            groupInfoConfirmed: true,
                            groupInfoConfirmedAt: pallet.groupInfoConfirmedAt || pallet.returnConfirmedAt || '',
                            returnConfirmedAt: ''
                        };
                    }

                    return pallet;
                })
            };
        });

        return safeState;
    }

    function resetAll() {
        saveState(getDefaultState());
        localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
    }

    function initialize() {
        const version = localStorage.getItem(VERSION_KEY);
        if (version !== STORAGE_VERSION) {
            const migratedState = normalizeState(loadState());
            saveState(migratedState);
            localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
            return;
        }

        const state = normalizeState(loadState());
        saveState(state);
    }

    function deriveOrderStatus(order) {
        if (order.returnConfirmed) {
            return '已确认回库';
        }

        const palletStatuses = (order.pallets || []).map(item => item.status);
        const hasPending = palletStatuses.some(item => item === '待检验');
        const hasInspecting = palletStatuses.some(item => item === '检验中');
        const hasReturning = palletStatuses.some(item => item === '待确认回库' || item === '已确认回库');

        if (!hasInspecting && !hasReturning && hasPending) {
            return '待检验';
        }

        if (hasPending || hasInspecting) {
            return '检验中';
        }

        return '待确认回库';
    }

    function hydratePallet(pallet) {
        const cloned = clone(pallet);
        cloned.groupInfoConfirmed = Boolean(cloned.groupInfoConfirmed);
        cloned.groupInfoConfirmedAt = cloned.groupInfoConfirmedAt || '';
        cloned.sns = (cloned.sns || []).map(item => ({
            snCode: '',
            spec: '',
            location: '',
            inspectionResult: '',
            defectReason: '',
            photoUploaded: false,
            remark: '',
            unbound: false,
            unboundAt: '',
            unboundSource: '',
            ...item
        }));
        cloned.boundSnList = cloned.sns.filter(item => !item.unbound);
        cloned.unboundSnList = cloned.sns.filter(item => item.unbound);
        cloned.inspectedSnList = cloned.sns.filter(item => item.inspectionResult);
        cloned.boundQty = cloned.boundSnList.length;
        cloned.unboundQty = cloned.unboundSnList.length;
        cloned.inspectedQty = cloned.inspectedSnList.length;
        cloned.passedQty = cloned.sns.filter(item => item.inspectionResult === '合格').length;
        cloned.failedQty = cloned.sns.filter(item => item.inspectionResult === '不合格').length;
        return cloned;
    }

    function hydrateOrder(order) {
        const cloned = clone(order);
        cloned.pallets = (cloned.pallets || []).map(hydratePallet);
        cloned.samplePalletCount = cloned.pallets.length;
        cloned.submittedPalletCount = cloned.pallets.filter(item => item.status === '待确认回库' || item.status === '已确认回库').length;
        cloned.returnedPalletCount = cloned.pallets.filter(item => item.status === '已确认回库').length;
        cloned.failedSnQty = cloned.pallets.reduce((total, item) => total + item.failedQty, 0);
        cloned.inspectedSnQty = cloned.pallets.reduce((total, item) => total + item.inspectedQty, 0);
        cloned.status = deriveOrderStatus(cloned);
        return cloned;
    }

    function getOrders() {
        return loadState().orders.map(hydrateOrder);
    }

    function getOrder(orderNo) {
        const order = loadState().orders.find(item => item.orderNo === orderNo);
        return order ? hydrateOrder(order) : null;
    }

    function mutateState(mutator) {
        const state = loadState();
        const result = mutator(state);
        saveState(state);
        return result;
    }

    function getMutableOrder(state, orderNo) {
        return state.orders.find(item => item.orderNo === orderNo) || null;
    }

    function getMutablePallet(state, orderNo, palletCode) {
        const order = getMutableOrder(state, orderNo);
        if (!order) {
            return null;
        }

        return order.pallets.find(item => item.palletCode === palletCode) || null;
    }

    function markPalletInspecting(pallet) {
        if (pallet.status === '待检验') {
            pallet.status = '检验中';
        }
    }

    function updateSnInspection(orderNo, palletCode, snCode, payload) {
        return mutateState(state => {
            const pallet = getMutablePallet(state, orderNo, palletCode);
            if (!pallet) {
                return { ok: false, reason: 'pallet_not_found' };
            }

            if (pallet.status === '待确认回库' || pallet.status === '已确认回库') {
                return { ok: false, reason: 'pallet_locked' };
            }

            const snItem = (pallet.sns || []).find(item => item.snCode === snCode);
            if (!snItem) {
                return { ok: false, reason: 'sn_not_found' };
            }

            markPalletInspecting(pallet);
            snItem.inspectionResult = payload.inspectionResult || '';
            snItem.defectReason = payload.defectReason || '';
            snItem.photoUploaded = Boolean(payload.photoUploaded);
            snItem.remark = payload.remark || '';

            return {
                ok: true,
                order: hydrateOrder(getMutableOrder(state, orderNo)),
                pallet: hydratePallet(pallet)
            };
        });
    }

    function updateFinalResult(orderNo, palletCode, result) {
        return mutateState(state => {
            const pallet = getMutablePallet(state, orderNo, palletCode);
            if (!pallet) {
                return { ok: false, reason: 'pallet_not_found' };
            }

            if (pallet.status === '待确认回库' || pallet.status === '已确认回库') {
                return { ok: false, reason: 'pallet_locked' };
            }

            markPalletInspecting(pallet);
            pallet.finalResult = result || '';

            return {
                ok: true,
                order: hydrateOrder(getMutableOrder(state, orderNo)),
                pallet: hydratePallet(pallet)
            };
        });
    }

    function savePalletDraft(orderNo, palletCode) {
        return mutateState(state => {
            const pallet = getMutablePallet(state, orderNo, palletCode);
            if (!pallet) {
                return { ok: false, reason: 'pallet_not_found' };
            }

            if (pallet.status === '待确认回库' || pallet.status === '已确认回库') {
                return { ok: false, reason: 'pallet_locked' };
            }

            markPalletInspecting(pallet);
            pallet.draftSavedAt = nowLabel();

            return {
                ok: true,
                order: hydrateOrder(getMutableOrder(state, orderNo)),
                pallet: hydratePallet(pallet)
            };
        });
    }

    function submitPalletInspection(orderNo, palletCode) {
        return mutateState(state => {
            const pallet = getMutablePallet(state, orderNo, palletCode);
            if (!pallet) {
                return { ok: false, reason: 'pallet_not_found' };
            }

            if (pallet.status === '已确认回库') {
                return { ok: false, reason: 'pallet_locked' };
            }

            if (!pallet.finalResult) {
                return { ok: false, reason: 'missing_final_result' };
            }

            pallet.status = '待确认回库';
            pallet.submittedAt = nowLabel();

            const order = hydrateOrder(getMutableOrder(state, orderNo));
            return {
                ok: true,
                order,
                pallet: hydratePallet(pallet)
            };
        });
    }

    function getPallet(orderNo, palletCode) {
        const order = getOrder(orderNo);
        if (!order) {
            return null;
        }
        return order.pallets.find(item => item.palletCode === palletCode) || null;
    }

    function getSnListByResult(orderNo, palletCode, resultType) {
        const pallet = getPallet(orderNo, palletCode);
        if (!pallet) {
            return [];
        }

        if (resultType === 'pass') {
            return clone(pallet.sns.filter(item => item.inspectionResult === '合格'));
        }

        if (resultType === 'fail') {
            return clone(pallet.sns.filter(item => item.inspectionResult === '不合格'));
        }

        return clone(pallet.sns);
    }

    function getInspectionInboundSnList(orderNo, palletCode, detailType) {
        const pallet = getPallet(orderNo, palletCode);
        if (!pallet) {
            return [];
        }

        if (detailType === 'bound') {
            return clone(pallet.boundSnList);
        }

        if (detailType === 'unbound') {
            return clone(pallet.unboundSnList);
        }

        if (detailType === 'inspected') {
            return clone(pallet.inspectedSnList);
        }

        return [];
    }

    function unbindSnFromPallet(orderNo, palletCode, snCode, source) {
        return mutateState(state => {
            const pallet = getMutablePallet(state, orderNo, palletCode);
            if (!pallet) {
                return { ok: false, reason: 'pallet_not_found' };
            }

            if (pallet.status !== '待确认回库') {
                return { ok: false, reason: 'invalid_pallet_status' };
            }

            const snItem = (pallet.sns || []).find(item => item.snCode === snCode);
            if (!snItem || snItem.unbound) {
                return { ok: false, reason: 'sn_not_found' };
            }

            snItem.unbound = true;
            snItem.unboundAt = nowLabel();
            snItem.unboundSource = source || 'manual';

            return {
                ok: true,
                order: hydrateOrder(getMutableOrder(state, orderNo)),
                pallet: hydratePallet(pallet)
            };
        });
    }

    function rebindSnToPallet(orderNo, palletCode, snCode) {
        return mutateState(state => {
            const order = getMutableOrder(state, orderNo);
            const pallet = getMutablePallet(state, orderNo, palletCode);
            if (!order || !pallet) {
                return { ok: false, reason: 'pallet_not_found' };
            }

            if (order.returnConfirmed || pallet.status === '已确认回库') {
                return { ok: false, reason: 'pallet_locked' };
            }

            const snItem = (pallet.sns || []).find(item => item.snCode === snCode);
            if (!snItem || !snItem.unbound) {
                return { ok: false, reason: 'sn_not_found' };
            }

            snItem.unbound = false;
            snItem.unboundAt = '';
            snItem.unboundSource = '';

            return {
                ok: true,
                order: hydrateOrder(order),
                pallet: hydratePallet(pallet)
            };
        });
    }

    function confirmPalletReturn(orderNo, palletCode) {
        return mutateState(state => {
            const pallet = getMutablePallet(state, orderNo, palletCode);
            if (!pallet) {
                return { ok: false, reason: 'pallet_not_found' };
            }

            if (pallet.status !== '待确认回库') {
                return { ok: false, reason: 'invalid_pallet_status' };
            }

            pallet.groupInfoConfirmed = true;
            pallet.groupInfoConfirmedAt = nowLabel();

            return {
                ok: true,
                order: hydrateOrder(getMutableOrder(state, orderNo)),
                pallet: hydratePallet(pallet)
            };
        });
    }

    function confirmOrderReturn(orderNo) {
        return mutateState(state => {
            const order = getMutableOrder(state, orderNo);
            if (!order) {
                return { ok: false, reason: 'order_not_found' };
            }

            const hasUnconfirmed = (order.pallets || []).some(function(item) {
                return item.status !== '待确认回库' || !item.groupInfoConfirmed;
            });
            if (hasUnconfirmed) {
                return { ok: false, reason: 'pallets_unconfirmed' };
            }

            order.returnConfirmed = true;
            order.returnConfirmedAt = nowLabel();
            (order.pallets || []).forEach(function(pallet) {
                pallet.status = '已确认回库';
                pallet.returnConfirmedAt = order.returnConfirmedAt;
                pallet.groupInfoConfirmed = true;
                if (!pallet.groupInfoConfirmedAt) {
                    pallet.groupInfoConfirmedAt = order.returnConfirmedAt;
                }
            });

            return {
                ok: true,
                order: hydrateOrder(order)
            };
        });
    }

    window.InspectionWorkStorage = {
        initialize,
        resetAll,
        getOrders,
        getOrder,
        getPallet,
        updateSnInspection,
        updateFinalResult,
        savePalletDraft,
        submitPalletInspection,
        getSnListByResult,
        getInspectionInboundSnList,
        unbindSnFromPallet,
        rebindSnToPallet,
        confirmPalletReturn,
        confirmOrderReturn
    };
})();
