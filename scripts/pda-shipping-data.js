// 发货作业共享数据
(function() {
    const STORAGE_KEY = 'pdaShippingOrders';
    const PRESERVE_ONCE_KEY = 'pdaShippingPreserveOnce';

    function clone(data) {
        return JSON.parse(JSON.stringify(data));
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

    function normalizePalletCode(code) {
        const text = String(code || '').trim().toUpperCase();
        const oldFormatMatch = text.match(/^TP-FH-(\d+)$/);
        if (oldFormatMatch) {
            return `TP-${oldFormatMatch[1].padStart(3, '0')}`;
        }

        const currentFormatMatch = text.match(/^TP-(\d+)$/);
        if (currentFormatMatch) {
            return `TP-${currentFormatMatch[1].padStart(3, '0')}`;
        }

        return text;
    }

    function normalizeHistoryText(text) {
        return String(text || '').replace(/TP-FH-(\d+)/g, function(match, digits) {
            return `TP-${String(digits).padStart(3, '0')}`;
        });
    }

    function normalizeHistoryTitle(title) {
        if (title === '托盘到达工位') {
            return '扫描到位托盘';
        }

        return title;
    }

    function normalizeHistoryDetail(detail) {
        const normalizedText = normalizeHistoryText(detail);
        if (normalizedText === '托盘 TP-004 已到达工位，等待拆膜与拣货。') {
            return '已扫描托盘 TP-004，展示托盘内物料信息，等待完成拆膜与下线后解绑。';
        }

        return normalizedText.replace(/托盘 (TP-\d+) 已到达工位，等待拆膜与拣货。/g, '已扫描托盘 $1，展示托盘内物料信息，等待完成拆膜与下线后解绑。');
    }

    function getPalletCodeFromHistoryDetail(detail) {
        const matched = String(detail || '').match(/(TP-\d{3})/);
        return matched ? matched[1] : '';
    }

    function buildScanHistoryBeforeUnbind(unbindItem) {
        const palletCode = getPalletCodeFromHistoryDetail(unbindItem.detail);
        if (!palletCode) {
            return null;
        }

        return {
            time: unbindItem.time,
            kind: 'pallet',
            title: '扫描到位托盘',
            detail: `已扫描托盘 ${palletCode}，展示托盘内物料信息，等待完成拆膜与下线后解绑。`
        };
    }

    function ensureHistorySequence(history) {
        if (!Array.isArray(history)) {
            return [];
        }

        const rebuilt = [];

        history.forEach(item => {
            if (item.title === '空托解绑完成') {
                const palletCode = getPalletCodeFromHistoryDetail(item.detail);
                const previousItem = rebuilt[rebuilt.length - 1];
                const previousPalletCode = previousItem ? getPalletCodeFromHistoryDetail(previousItem.detail) : '';
                const hasPreviousScan = previousItem
                    && previousItem.title === '扫描到位托盘'
                    && previousPalletCode
                    && previousPalletCode === palletCode;

                if (!hasPreviousScan) {
                    const scanItem = buildScanHistoryBeforeUnbind(item);
                    if (scanItem) {
                        rebuilt.push(scanItem);
                    }
                }
            }

            rebuilt.push(item);
        });

        return rebuilt;
    }

    function buildCompletedOrderHistory(order) {
        const completedTime = order.completedAt || order.lastActionAt || nowLabel();
        const baseDate = String(completedTime).split(' ')[0] || '';
        const pallets = (order.pallets || []).filter(item => item.status === 'unbound');
        const history = [];
        let cumulativeQty = 0;

        history.push({
            time: `${baseDate} 16:00:00`,
            kind: 'status',
            title: '开始发货',
            detail: `已选择${order.linePort || '工位1'}与${order.dockName || '发货月台1'}，托盘开始出库。`
        });

        pallets.forEach((pallet, index) => {
            const scanMinute = 8 + index * 8;
            const unbindMinute = 10 + index * 8;
            cumulativeQty += Number(pallet.boxQty) || 0;

            history.push({
                time: `${baseDate} 16:${String(scanMinute).padStart(2, '0')}:00`,
                kind: 'pallet',
                title: '扫描到位托盘',
                detail: `已扫描托盘 ${pallet.palletCode}，展示托盘内物料信息，等待完成拆膜与下线后解绑。`
            });

            history.push({
                time: `${baseDate} 16:${String(unbindMinute).padStart(2, '0')}:00`,
                kind: 'unbind',
                title: '空托解绑完成',
                detail: `托盘 ${pallet.palletCode} 已清空并解绑，本次累加已发货 ${pallet.boxQty} 箱，累计 ${Math.min(cumulativeQty, order.plannedQty)} / ${order.plannedQty}。`
            });
        });

        history.push({
            time: completedTime,
            kind: 'status',
            title: '发货完成',
            detail: '已发货数量达到计划发货数量，发货单状态已变更为已完成。'
        });

        return history;
    }

    function migrateOrders(orders) {
        let changed = false;

        orders.forEach(order => {
            const normalizedCurrentPalletCode = normalizePalletCode(order.currentPalletCode);
            if ((order.currentPalletCode || '') !== normalizedCurrentPalletCode) {
                order.currentPalletCode = normalizedCurrentPalletCode;
                changed = true;
            }

            if (Array.isArray(order.pallets)) {
                order.pallets.forEach(pallet => {
                    const normalizedPalletCode = normalizePalletCode(pallet.palletCode);
                    if (pallet.palletCode !== normalizedPalletCode) {
                        pallet.palletCode = normalizedPalletCode;
                        changed = true;
                    }
                });
            }

            if (Array.isArray(order.history)) {
                order.history.forEach(item => {
                    const normalizedTitle = normalizeHistoryTitle(item.title);
                    if (item.title !== normalizedTitle) {
                        item.title = normalizedTitle;
                        changed = true;
                    }

                    const normalizedDetail = normalizeHistoryDetail(item.detail);
                    if (item.detail !== normalizedDetail) {
                        item.detail = normalizedDetail;
                        changed = true;
                    }
                });

                const sequencedHistory = ensureHistorySequence(order.history);
                if (sequencedHistory.length !== order.history.length) {
                    order.history = sequencedHistory;
                    changed = true;
                }
            }

            if (
                order.status === 'completed'
                && Array.isArray(order.pallets)
                && order.pallets.some(item => item.status === 'unbound')
                && (!Array.isArray(order.history) || order.history.length <= 1)
            ) {
                order.history = buildCompletedOrderHistory(order);
                changed = true;
            }
        });

        return {
            orders: orders,
            changed: changed
        };
    }

    function getDefaultOrders() {
        return [
            {
                orderNo: 'FH-2026-0511-001',
                customerName: '华东直营仓',
                orderType: '整托发货',
                status: 'pending',
                plannedQty: 120,
                shippedQty: 0,
                currentPalletCode: '',
                linePort: '',
                dockName: '',
                lastActionAt: '2026/05/11 08:15:00',
                history: [],
                pallets: [
                    { palletCode: 'TP-001', materialCode: 'WL-8801', materialName: '20寸登机箱', boxQty: 40, status: 'awaiting_arrival' },
                    { palletCode: 'TP-002', materialCode: 'WL-8801', materialName: '20寸登机箱', boxQty: 40, status: 'awaiting_arrival' },
                    { palletCode: 'TP-003', materialCode: 'WL-8801', materialName: '20寸登机箱', boxQty: 40, status: 'awaiting_arrival' }
                ]
            },
            {
                orderNo: 'FH-2026-0511-002',
                customerName: '华南电商仓',
                orderType: '拆零发货',
                status: 'in_progress',
                plannedQty: 96,
                shippedQty: 32,
                currentPalletCode: '',
                linePort: '工位1',
                dockName: '发货月台1',
                lastActionAt: '2026/05/11 09:26:00',
                history: [
                    {
                        time: '2026/05/11 09:00:00',
                        kind: 'status',
                        title: '开始发货',
                        detail: '已选择工位1与发货月台1，托盘开始出库。'
                    },
                    {
                        time: '2026/05/11 09:12:00',
                        kind: 'pallet',
                        title: '扫描到位托盘',
                        detail: '已扫描托盘 TP-004，展示托盘内物料信息，等待完成拆膜与下线后解绑。'
                    },
                    {
                        time: '2026/05/11 09:16:00',
                        kind: 'unbind',
                        title: '空托解绑完成',
                        detail: '托盘 TP-004 已清空并解绑，本次累加已发货 32 箱，累计 32 / 96。'
                    }
                ],
                pallets: [
                    { palletCode: 'TP-004', materialCode: 'WL-9902', materialName: '24寸铝框旅行箱', boxQty: 32, status: 'unbound' },
                    { palletCode: 'TP-005', materialCode: 'WL-9902', materialName: '24寸铝框旅行箱', boxQty: 32, status: 'awaiting_arrival' },
                    { palletCode: 'TP-006', materialCode: 'WL-9902', materialName: '24寸铝框旅行箱', boxQty: 32, status: 'awaiting_arrival' }
                ]
            },
            {
                orderNo: 'FH-2026-0511-003',
                customerName: '西南经销商',
                orderType: '整托发货',
                status: 'paused',
                plannedQty: 80,
                shippedQty: 48,
                currentPalletCode: '',
                linePort: '工位3',
                dockName: '发货月台2',
                lastActionAt: '2026/05/11 10:02:00',
                history: [
                    {
                        time: '2026/05/11 08:48:00',
                        kind: 'status',
                        title: '开始发货',
                        detail: '已选择工位3与发货月台2，托盘开始出库。'
                    },
                    {
                        time: '2026/05/11 09:17:00',
                        kind: 'pallet',
                        title: '扫描到位托盘',
                        detail: '已扫描托盘 TP-007，展示托盘内物料信息，等待完成拆膜与下线后解绑。'
                    },
                    {
                        time: '2026/05/11 09:18:00',
                        kind: 'unbind',
                        title: '空托解绑完成',
                        detail: '托盘 TP-007 已清空并解绑，本次累加已发货 24 箱，累计 24 / 80。'
                    },
                    {
                        time: '2026/05/11 09:41:00',
                        kind: 'pallet',
                        title: '扫描到位托盘',
                        detail: '已扫描托盘 TP-008，展示托盘内物料信息，等待完成拆膜与下线后解绑。'
                    },
                    {
                        time: '2026/05/11 09:42:00',
                        kind: 'unbind',
                        title: '空托解绑完成',
                        detail: '托盘 TP-008 已清空并解绑，本次累加已发货 24 箱，累计 48 / 80。'
                    },
                    {
                        time: '2026/05/11 10:02:00',
                        kind: 'status',
                        title: '暂停发货',
                        detail: '当前发货单已暂停，可稍后继续发货。'
                    }
                ],
                pallets: [
                    { palletCode: 'TP-007', materialCode: 'WL-7308', materialName: '儿童拉杆箱', boxQty: 24, status: 'unbound' },
                    { palletCode: 'TP-008', materialCode: 'WL-7308', materialName: '儿童拉杆箱', boxQty: 24, status: 'unbound' },
                    { palletCode: 'TP-009', materialCode: 'WL-7308', materialName: '儿童拉杆箱', boxQty: 16, status: 'awaiting_arrival' },
                    { palletCode: 'TP-010', materialCode: 'WL-7308', materialName: '儿童拉杆箱', boxQty: 16, status: 'awaiting_arrival' }
                ]
            },
            {
                orderNo: 'FH-2026-0510-011',
                customerName: '华北成品仓',
                orderType: '整托发货',
                status: 'completed',
                plannedQty: 60,
                shippedQty: 60,
                currentPalletCode: '',
                linePort: '工位2',
                dockName: '发货月台2',
                lastActionAt: '2026/05/10 16:30:00',
                completedAt: '2026/05/10 16:30:00',
                history: [
                    {
                        time: '2026/05/10 16:00:00',
                        kind: 'status',
                        title: '开始发货',
                        detail: '已选择工位2与发货月台2，托盘开始出库。'
                    },
                    {
                        time: '2026/05/10 16:08:00',
                        kind: 'pallet',
                        title: '扫描到位托盘',
                        detail: '已扫描托盘 TP-011，展示托盘内物料信息，等待完成拆膜与下线后解绑。'
                    },
                    {
                        time: '2026/05/10 16:10:00',
                        kind: 'unbind',
                        title: '空托解绑完成',
                        detail: '托盘 TP-011 已清空并解绑，本次累加已发货 30 箱，累计 30 / 60。'
                    },
                    {
                        time: '2026/05/10 16:16:00',
                        kind: 'pallet',
                        title: '扫描到位托盘',
                        detail: '已扫描托盘 TP-012，展示托盘内物料信息，等待完成拆膜与下线后解绑。'
                    },
                    {
                        time: '2026/05/10 16:18:00',
                        kind: 'unbind',
                        title: '空托解绑完成',
                        detail: '托盘 TP-012 已清空并解绑，本次累加已发货 30 箱，累计 60 / 60。'
                    },
                    {
                        time: '2026/05/10 16:30:00',
                        kind: 'status',
                        title: '发货完成',
                        detail: '已发货数量达到计划发货数量，发货单状态已变更为已完成。'
                    }
                ],
                pallets: [
                    { palletCode: 'TP-011', materialCode: 'WL-5501', materialName: '商务登机箱', boxQty: 30, status: 'unbound' },
                    { palletCode: 'TP-012', materialCode: 'WL-5501', materialName: '商务登机箱', boxQty: 30, status: 'unbound' }
                ]
            },
            {
                orderNo: 'FH-2026-0510-012',
                customerName: '华中分拨中心',
                orderType: '拆零发货',
                status: 'cancelled',
                plannedQty: 72,
                shippedQty: 0,
                currentPalletCode: '',
                linePort: '',
                dockName: '',
                lastActionAt: '2026/05/10 14:05:00',
                cancelledAt: '2026/05/10 14:05:00',
                cancelReason: '客户临时取消本次发货',
                history: [
                    {
                        time: '2026/05/10 14:05:00',
                        kind: 'status',
                        title: '取消发货',
                        detail: '发货单尚未开始，已按客户要求取消发货。'
                    }
                ],
                pallets: [
                    { palletCode: 'TP-013', materialCode: 'WL-6620', materialName: 'ABS 旅行箱', boxQty: 24, status: 'awaiting_arrival' },
                    { palletCode: 'TP-014', materialCode: 'WL-6620', materialName: 'ABS 旅行箱', boxQty: 24, status: 'awaiting_arrival' },
                    { palletCode: 'TP-015', materialCode: 'WL-6620', materialName: 'ABS 旅行箱', boxQty: 24, status: 'awaiting_arrival' }
                ]
            }
        ];
    }

    function shouldPreserveExistingState() {
        const preserveFlag = sessionStorage.getItem(PRESERVE_ONCE_KEY);
        if (preserveFlag === '1') {
            sessionStorage.removeItem(PRESERVE_ONCE_KEY);
            return true;
        }

        return false;
    }

    function resetOrdersToDefault() {
        const defaults = getDefaultOrders();
        saveOrders(defaults);
        return defaults;
    }

    function readExistingOrders() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return resetOrdersToDefault();
        }

        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                throw new Error('invalid');
            }
            const migrated = migrateOrders(parsed);
            if (migrated.changed) {
                saveOrders(migrated.orders);
            }
            return migrated.orders;
        } catch (error) {
            return resetOrdersToDefault();
        }
    }

    function initializeDemoState() {
        if (!shouldPreserveExistingState()) {
            return resetOrdersToDefault();
        }

        return readExistingOrders();
    }

    function loadOrders() {
        return readExistingOrders();
    }

    function saveOrders(orders) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }

    function saveMutatedOrders(mutate) {
        const orders = loadOrders();
        const result = mutate(orders);
        saveOrders(orders);
        return result;
    }

    function getOrders() {
        return clone(loadOrders());
    }

    function getOrder(orderNo) {
        return getOrders().find(order => order.orderNo === orderNo) || null;
    }

    function getCurrentPallet(order) {
        return (order.pallets || []).find(item => item.status !== 'unbound') || null;
    }

    function getScannedPallet(order) {
        if (!order || !order.currentPalletCode) {
            return null;
        }

        return (order.pallets || []).find(item => item.palletCode === order.currentPalletCode) || null;
    }

    function getRemainingPalletCount(order) {
        return (order.pallets || []).filter(item => item.status !== 'unbound').length;
    }

    function startOrder(orderNo, linePort, dockName) {
        return saveMutatedOrders(orders => {
            const order = orders.find(item => item.orderNo === orderNo);
            if (!order) {
                return { ok: false, reason: 'not_found' };
            }

            if (order.status !== 'pending') {
                return { ok: false, reason: 'invalid_status' };
            }

            order.status = 'in_progress';
            order.linePort = linePort;
            order.dockName = dockName;
            order.lastActionAt = nowLabel();

            appendHistory(order, {
                kind: 'status',
                title: '开始发货',
                detail: `已选择${linePort}与${dockName}，托盘开始出库。`
            });

            return { ok: true, order: clone(order) };
        });
    }

    function continueOrder(orderNo, linePort, dockName) {
        return saveMutatedOrders(orders => {
            const order = orders.find(item => item.orderNo === orderNo);
            if (!order) {
                return { ok: false, reason: 'not_found' };
            }

            if (order.status !== 'paused') {
                return { ok: false, reason: 'invalid_status' };
            }

            if (linePort) {
                order.linePort = linePort;
            }

            if (dockName) {
                order.dockName = dockName;
            }

            order.status = 'in_progress';
            order.lastActionAt = nowLabel();
            appendHistory(order, {
                kind: 'status',
                title: '继续发货',
                detail: `已恢复发货，继续从${order.linePort}输送至${order.dockName}。`
            });

            return { ok: true, order: clone(order) };
        });
    }

    function pauseOrder(orderNo) {
        return saveMutatedOrders(orders => {
            const order = orders.find(item => item.orderNo === orderNo);
            if (!order) {
                return { ok: false, reason: 'not_found' };
            }

            if (order.status !== 'in_progress') {
                return { ok: false, reason: 'invalid_status' };
            }

            order.status = 'paused';
            order.lastActionAt = nowLabel();
            appendHistory(order, {
                kind: 'status',
                title: '暂停发货',
                detail: '当前发货单已暂停，可稍后继续发货。'
            });

            return { ok: true, order: clone(order) };
        });
    }

    function cancelOrder(orderNo, reason) {
        return saveMutatedOrders(orders => {
            const order = orders.find(item => item.orderNo === orderNo);
            if (!order) {
                return { ok: false, reason: 'not_found' };
            }

            if (order.status !== 'pending') {
                return { ok: false, reason: 'invalid_status' };
            }

            order.status = 'cancelled';
            order.cancelReason = reason;
            order.cancelledAt = nowLabel();
            order.lastActionAt = order.cancelledAt;

            appendHistory(order, {
                kind: 'status',
                title: '取消发货',
                detail: `发货单尚未开始，已取消发货。原因：${reason}`
            });

            return { ok: true, order: clone(order) };
        });
    }

    function scanPallet(orderNo, palletCode) {
        return saveMutatedOrders(orders => {
            const order = orders.find(item => item.orderNo === orderNo);
            if (!order) {
                return { ok: false, reason: 'not_found' };
            }

            if (order.status !== 'in_progress') {
                return { ok: false, reason: 'invalid_status' };
            }

            const safePalletCode = normalizePalletCode(palletCode);
            if (!safePalletCode) {
                return { ok: false, reason: 'empty_code' };
            }

            const pallet = (order.pallets || []).find(item => item.palletCode === safePalletCode);
            if (!pallet) {
                return { ok: false, reason: 'not_in_order' };
            }

            if (pallet.status === 'unbound') {
                return { ok: false, reason: 'already_unbound' };
            }

            order.currentPalletCode = pallet.palletCode;
            order.lastActionAt = nowLabel();
            appendHistory(order, {
                kind: 'pallet',
                title: '扫描到位托盘',
                detail: `已扫描托盘 ${pallet.palletCode}，展示托盘内物料信息，等待完成拆膜与下线后解绑。`
            });

            return { ok: true, order: clone(order), pallet: clone(pallet) };
        });
    }

    function unbindScannedPallet(orderNo) {
        return saveMutatedOrders(orders => {
            const order = orders.find(item => item.orderNo === orderNo);
            if (!order) {
                return { ok: false, reason: 'not_found' };
            }

            if (order.status !== 'in_progress') {
                return { ok: false, reason: 'invalid_status' };
            }

            const pallet = getScannedPallet(order);
            if (!pallet) {
                return { ok: false, reason: 'no_scanned_pallet' };
            }

            pallet.status = 'unbound';
            const shippedQty = Math.min(pallet.boxQty, Math.max(order.plannedQty - order.shippedQty, 0));
            order.shippedQty = Math.min(order.plannedQty, order.shippedQty + shippedQty);
            order.currentPalletCode = '';
            order.lastActionAt = nowLabel();

            appendHistory(order, {
                kind: 'unbind',
                title: '空托解绑完成',
                detail: `托盘 ${pallet.palletCode} 已清空并解绑，本次累加已发货 ${shippedQty} 箱，累计 ${order.shippedQty} / ${order.plannedQty}。`
            });

            let completed = false;
            if (order.shippedQty >= order.plannedQty) {
                order.status = 'completed';
                order.completedAt = nowLabel();
                completed = true;
                appendHistory(order, {
                    kind: 'status',
                    title: '发货完成',
                    detail: '已发货数量达到计划发货数量，发货单状态已变更为已完成。'
                });
            }

            return {
                ok: true,
                completed: completed,
                shippedQty: shippedQty,
                order: clone(order)
            };
        });
    }

    function completeOrder(orderNo, reason) {
        return saveMutatedOrders(orders => {
            const order = orders.find(item => item.orderNo === orderNo);
            if (!order) {
                return { ok: false, reason: 'not_found' };
            }

            if (order.status !== 'in_progress' && order.status !== 'paused') {
                return { ok: false, reason: 'invalid_status' };
            }

            order.status = 'completed';
            order.completedAt = nowLabel();
            order.lastActionAt = order.completedAt;
            order.manualCompleteReason = reason;

            appendHistory(order, {
                kind: 'status',
                title: '完成发货',
                detail: `实际发货 ${order.shippedQty} / ${order.plannedQty}，已按说明完成发货。说明：${reason}`
            });

            return { ok: true, order: clone(order) };
        });
    }

    window.ShippingStorage = {
        getOrders,
        getOrder,
        getCurrentPallet,
        getScannedPallet,
        getRemainingPalletCount,
        initializeDemoState,
        preserveForNextPage: function() {
            sessionStorage.setItem(PRESERVE_ONCE_KEY, '1');
        },
        startOrder,
        continueOrder,
        pauseOrder,
        cancelOrder,
        scanPallet,
        unbindScannedPallet,
        completeOrder
    };
})();
