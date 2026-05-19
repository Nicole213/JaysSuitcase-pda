// 包装作业共享数据
(function() {
    const STORAGE_KEY = 'pdaPackagingOrders';
    const DEFAULT_PALLET_QTY = 20;

    function clone(data) {
        return JSON.parse(JSON.stringify(data));
    }

    function replaceDisplayCopy(value) {
        return typeof value === 'string' ? value.replaceAll('地表', '地标') : value;
    }

    function normalizeOrder(order) {
        if (typeof order.palletReturnCount !== 'number') {
            order.palletReturnCount = Number(order.emptyReturnCount) || 0;
        }

        if (!Array.isArray(order.history)) {
            order.history = [];
        } else {
            order.history = order.history.map(function(item) {
                return Object.assign({}, item, {
                    title: replaceDisplayCopy(item.title),
                    detail: replaceDisplayCopy(item.detail)
                });
            });
        }

        return order;
    }

    function nowLabel() {
        return new Date().toLocaleString('zh-CN', {
            hour12: false
        });
    }

    function appendHistory(order, entry) {
        if (!Array.isArray(order.history)) {
            order.history = [];
        }

        order.history.push({
            time: nowLabel(),
            kind: entry.kind || 'status',
            title: entry.title,
            detail: entry.detail
        });
    }

    function getDefaultOrders() {
        return [
            {
                orderNo: 'BZ-2026-0510-001',
                status: 'pending',
                productCode: 'CP-8801',
                productName: '20寸登机箱套装',
                lineName: '包装线 A',
                stationName: 'A-01 工位',
                shiftName: '白班',
                plannedQty: 120,
                packedQty: 0,
                productOutboundCount: 0,
                materialOutboundCount: 0,
                palletReturnCount: 0,
                lastActionAt: '2026/05/09 08:10:00',
                history: []
            },
            {
                orderNo: 'BZ-2026-0510-004',
                status: 'in_progress',
                productCode: 'CP-8838',
                productName: '28寸拉链旅行箱',
                lineName: '包装线 A',
                stationName: 'A-03 工位',
                shiftName: '白班',
                plannedQty: 100,
                packedQty: 40,
                productOutboundCount: 2,
                materialOutboundCount: 1,
                palletReturnCount: 1,
                lastActionAt: '2026/05/09 10:06:00',
                history: [
                    {
                        time: '2026/05/09 09:05:00',
                        kind: 'status',
                        title: '开始工单',
                        detail: '工单已进入包装执行状态，包装工位 A-03 开始作业。'
                    },
                    {
                        time: '2026/05/09 09:18:00',
                        kind: 'outbound',
                        title: '申请待包装成品出库',
                        detail: '地标码 DB-A03-01，已出库 1 个待包装成品托盘。'
                    },
                    {
                        time: '2026/05/09 09:26:00',
                        kind: 'outbound',
                        title: '申请包装纸箱出库',
                        detail: '地标码 DB-A03-02，已出库 1 个包装纸箱托盘。'
                    },
                    {
                        time: '2026/05/09 09:48:00',
                        kind: 'pack',
                        title: '登记已包装数量',
                        detail: '本次登记 20 件，累计已包装 20 / 100。'
                    },
                    {
                        time: '2026/05/09 10:06:00',
                        kind: 'return',
                        title: '申请托盘回库',
                        detail: '地标码 DB-A03-03，托盘码 TP-A03-009 按系统默认 20 件/托计算，已作为空托回库，本次解绑并累计已包装 20 件。'
                    }
                ]
            },
            {
                orderNo: 'BZ-2026-0510-002',
                status: 'paused',
                productCode: 'CP-8826',
                productName: '24寸铝框旅行箱',
                lineName: '包装线 B',
                stationName: 'B-03 工位',
                shiftName: '白班',
                plannedQty: 80,
                packedQty: 36,
                productOutboundCount: 2,
                materialOutboundCount: 1,
                palletReturnCount: 1,
                lastActionAt: '2026/05/09 09:12:00',
                history: [
                    {
                        time: '2026/05/09 08:00:00',
                        kind: 'status',
                        title: '开始工单',
                        detail: '工单已进入包装执行状态，包装工位 B-03 开始作业。'
                    },
                    {
                        time: '2026/05/09 08:18:00',
                        kind: 'outbound',
                        title: '申请待包装成品出库',
                        detail: '地标码 DB-B03-01，已出库 1 个待包装成品托盘。'
                    },
                    {
                        time: '2026/05/09 08:26:00',
                        kind: 'outbound',
                        title: '申请包装纸箱出库',
                        detail: '地标码 DB-B03-02，已出库 1 个包装纸箱托盘。'
                    },
                    {
                        time: '2026/05/09 08:55:00',
                        kind: 'pack',
                        title: '登记已包装数量',
                        detail: '本次登记 36 件，累计已包装 36 / 80。'
                    },
                    {
                        time: '2026/05/09 09:12:00',
                        kind: 'status',
                        title: '暂停工单',
                        detail: '当前工单已暂停，可在工单列表中继续执行。'
                    }
                ]
            },
            {
                orderNo: 'BZ-2026-0510-003',
                status: 'pending',
                productCode: 'CP-8852',
                productName: '儿童拉杆箱礼盒版',
                lineName: '包装线 C',
                stationName: 'C-02 工位',
                shiftName: '夜班',
                plannedQty: 160,
                packedQty: 0,
                productOutboundCount: 0,
                materialOutboundCount: 0,
                palletReturnCount: 0,
                lastActionAt: '2026/05/09 07:40:00',
                history: []
            },
            {
                orderNo: 'BZ-2026-0508-009',
                status: 'completed',
                productCode: 'CP-8709',
                productName: '商务双杯架登机箱',
                lineName: '包装线 A',
                stationName: 'A-02 工位',
                shiftName: '白班',
                plannedQty: 60,
                packedQty: 60,
                productOutboundCount: 2,
                materialOutboundCount: 1,
                palletReturnCount: 2,
                lastActionAt: '2026/05/08 17:30:00',
                completedAt: '2026/05/08 17:30:00',
                history: [
                    {
                        time: '2026/05/08 15:12:00',
                        kind: 'pack',
                        title: '登记已包装数量',
                        detail: '本次登记 60 件，累计已包装 60 / 60。'
                    },
                    {
                        time: '2026/05/08 17:30:00',
                        kind: 'status',
                        title: '工单完成',
                        detail: '已包装数量达到计划包装数量，工单状态已变更为已完成。'
                    }
                ]
            },
            {
                orderNo: 'BZ-2026-0507-006',
                status: 'cancelled',
                productCode: 'CP-8695',
                productName: '商务前开盖登机箱',
                lineName: '包装线 D',
                stationName: 'D-01 工位',
                shiftName: '白班',
                plannedQty: 50,
                packedQty: 0,
                productOutboundCount: 0,
                materialOutboundCount: 0,
                palletReturnCount: 0,
                lastActionAt: '2026/05/07 11:20:00',
                cancelledAt: '2026/05/07 11:20:00',
                history: [
                    {
                        time: '2026/05/07 11:20:00',
                        kind: 'status',
                        title: '工单取消',
                        detail: '该工单已取消，本次不再继续包装执行。'
                    }
                ]
            }
        ];
    }

    function loadOrders() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const defaults = getDefaultOrders();
            saveOrders(defaults);
            return defaults;
        }

        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                throw new Error('invalid');
            }
            return parsed.map(normalizeOrder);
        } catch (error) {
            const defaults = getDefaultOrders();
            saveOrders(defaults);
            return defaults;
        }
    }

    function saveOrders(orders) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }

    function resetOrders() {
        const defaults = getDefaultOrders();
        saveOrders(defaults);
        return clone(defaults);
    }

    function getOrders() {
        return clone(loadOrders());
    }

    function getOrder(orderNo) {
        return getOrders().find(order => order.orderNo === orderNo) || null;
    }

    function getCurrentActiveOrder(orders) {
        const source = orders || getOrders();
        return source.find(order => order.status === 'in_progress') || null;
    }

    function saveMutatedOrders(mutate) {
        const orders = loadOrders();
        const result = mutate(orders);
        saveOrders(orders);
        return result;
    }

    function startOrder(orderNo) {
        return saveMutatedOrders(orders => {
            const activeOrder = orders.find(order => order.status === 'in_progress' && order.orderNo !== orderNo);
            if (activeOrder) {
                return {
                    ok: false,
                    reason: 'active_exists',
                    activeOrder: clone(activeOrder)
                };
            }

            const order = orders.find(item => item.orderNo === orderNo);
            if (!order) {
                return {
                    ok: false,
                    reason: 'not_found'
                };
            }

            if (order.status === 'completed') {
                return {
                    ok: false,
                    reason: 'completed'
                };
            }

            const wasPaused = order.status === 'paused';
            order.status = 'in_progress';
            order.lastActionAt = nowLabel();
            appendHistory(order, {
                kind: 'status',
                title: wasPaused ? '继续工单' : '开始工单',
                detail: wasPaused
                    ? '工单已恢复执行，可继续申请物料出库与托盘回库。'
                    : '工单已进入包装执行状态，可开始进行包装作业。'
            });

            return {
                ok: true,
                order: clone(order)
            };
        });
    }

    function pauseOrder(orderNo) {
        return saveMutatedOrders(orders => {
            const order = orders.find(item => item.orderNo === orderNo);
            if (!order) {
                return {
                    ok: false,
                    reason: 'not_found'
                };
            }

            if (order.status !== 'in_progress') {
                return {
                    ok: false,
                    reason: 'not_in_progress'
                };
            }

            order.status = 'paused';
            order.lastActionAt = nowLabel();
            appendHistory(order, {
                kind: 'status',
                title: '暂停工单',
                detail: '当前工单已暂停，若需切换执行其他工单，请前往工单列表重新开始。'
            });

            return {
                ok: true,
                order: clone(order)
            };
        });
    }

    function addOutbound(orderNo, typeLabel, groundCode) {
        return saveMutatedOrders(orders => {
            const order = orders.find(item => item.orderNo === orderNo);
            if (!order) {
                return { ok: false, reason: 'not_found' };
            }

            if (order.status !== 'in_progress') {
                return { ok: false, reason: 'not_in_progress' };
            }

            if (typeLabel === '待包装成品') {
                order.productOutboundCount += 1;
            } else {
                order.materialOutboundCount += 1;
            }

            order.lastActionAt = nowLabel();
            appendHistory(order, {
                kind: 'outbound',
                title: typeLabel === '待包装成品' ? '申请待包装成品出库' : '申请包装纸箱出库',
                detail: `地标码 ${groundCode}，已出库 1 个${typeLabel}托盘。`
            });

            return { ok: true, order: clone(order) };
        });
    }

    function addPalletReturn(orderNo, groundCode, palletCode, returnType, remainingQty, continueSupply, supplyType) {
        return saveMutatedOrders(orders => {
            const order = orders.find(item => item.orderNo === orderNo);
            if (!order) {
                return { ok: false, reason: 'not_found' };
            }

            if (order.status !== 'in_progress') {
                return { ok: false, reason: 'not_in_progress' };
            }

            const isPartialReturn = returnType === 'partial';
            const safeRemainingQty = isPartialReturn ? Number(remainingQty) : 0;
            const safePalletQty = DEFAULT_PALLET_QTY;

            if (isPartialReturn) {
                if (!Number.isFinite(safeRemainingQty) || safeRemainingQty <= 0 || !Number.isInteger(safeRemainingQty)) {
                    return { ok: false, reason: 'invalid_remaining_qty' };
                }

                if (safeRemainingQty > safePalletQty) {
                    return { ok: false, reason: 'invalid_remaining_qty' };
                }
            }

            const unboundQty = isPartialReturn ? safePalletQty - safeRemainingQty : safePalletQty;

            order.palletReturnCount += 1;
            order.packedQty = Math.min(order.plannedQty, order.packedQty + unboundQty);
            order.lastActionAt = nowLabel();

            appendHistory(order, {
                kind: 'return',
                title: '申请托盘回库',
                detail: isPartialReturn
                    ? `地标码 ${groundCode}，托盘码 ${palletCode} 按系统默认 ${safePalletQty} 件/托计算，余料 ${safeRemainingQty} 件回库未解绑，本次解绑并累计已包装 ${unboundQty} 件。`
                    : `地标码 ${groundCode}，托盘码 ${palletCode} 按系统默认 ${safePalletQty} 件/托计算，已作为空托回库，本次解绑并累计已包装 ${unboundQty} 件。`
            });

            if (continueSupply) {
                if (supplyType === '待包装成品') {
                    order.productOutboundCount += 1;
                } else {
                    order.materialOutboundCount += 1;
                }

                appendHistory(order, {
                    kind: 'outbound',
                    title: '托盘回库后继续补给',
                    detail: `已自动补给 1 个${supplyType}托盘至地标码 ${groundCode}。`
                });
            }

            let completed = false;
            if (order.packedQty >= order.plannedQty) {
                order.status = 'completed';
                order.completedAt = nowLabel();
                completed = true;
                appendHistory(order, {
                    kind: 'status',
                    title: '工单完成',
                    detail: '已包装数量达到计划包装数量，工单状态已变更为已完成。'
                });
            }

            return {
                ok: true,
                completed: completed,
                unboundQty: unboundQty,
                order: clone(order)
            };
        });
    }

    function recordPackedQty(orderNo, qty) {
        return saveMutatedOrders(orders => {
            const order = orders.find(item => item.orderNo === orderNo);
            if (!order) {
                return { ok: false, reason: 'not_found' };
            }

            if (order.status !== 'in_progress') {
                return { ok: false, reason: 'not_in_progress' };
            }

            const safeQty = Number(qty);
            if (!Number.isFinite(safeQty) || safeQty <= 0) {
                return { ok: false, reason: 'invalid_qty' };
            }

            order.packedQty = Math.min(order.plannedQty, order.packedQty + safeQty);
            order.lastActionAt = nowLabel();
            appendHistory(order, {
                kind: 'pack',
                title: '登记已包装数量',
                detail: `本次登记 ${safeQty} 件，累计已包装 ${order.packedQty} / ${order.plannedQty}。`
            });

            let completed = false;
            if (order.packedQty >= order.plannedQty) {
                order.status = 'completed';
                order.completedAt = nowLabel();
                completed = true;
                appendHistory(order, {
                    kind: 'status',
                    title: '工单完成',
                    detail: '已包装数量达到计划包装数量，工单状态已变更为已完成。'
                });
            }

            return {
                ok: true,
                completed: completed,
                order: clone(order)
            };
        });
    }

    window.PackagingStorage = {
        getOrders,
        getOrder,
        getCurrentActiveOrder,
        resetOrders,
        startOrder,
        pauseOrder,
        addOutbound,
        addPalletReturn,
        recordPackedQty
    };
})();
