// 包装工单执行脚本
let currentOrderNo = null;
let currentOutboundType = '待包装成品';
let palletReturnDemoIndex = -1;

const palletReturnDemoScenarios = [
    {
        returnType: 'empty',
        displayLabel: '空托',
        supplyType: '待包装成品',
        palletCode: 'TP-A03-021',
        remainingQty: '',
        remainingSnList: []
    },
    {
        returnType: 'partial',
        displayLabel: '带余料回库-包装纸箱',
        supplyType: '包装纸箱',
        palletCode: 'TP-A03-022',
        remainingQty: '6',
        remainingSnList: []
    },
    {
        returnType: 'partial',
        displayLabel: '带余料回库-待包装成品',
        supplyType: '待包装成品',
        palletCode: 'TP-A03-023',
        remainingQty: '',
        remainingSnList: ['SN-CP-20260519-001', 'SN-CP-20260519-002', 'SN-CP-20260519-003', 'SN-CP-20260519-004']
    }
];

document.addEventListener('DOMContentLoaded', function() {
    currentOrderNo = getOrderNoFromQuery();

    if (!currentOrderNo) {
        const activeOrder = PackagingStorage.getCurrentActiveOrder();
        currentOrderNo = activeOrder ? activeOrder.orderNo : null;
    }

    if (!currentOrderNo || !PackagingStorage.getOrder(currentOrderNo)) {
        alert('未找到对应工单，已返回包装作业列表。');
        window.location.href = '包装作业.html';
        return;
    }

    bindExecutionEvents();
    renderExecutionPage();
});

function bindExecutionEvents() {
    document.getElementById('requestProductBtn').addEventListener('click', function() {
        openOutboundModal('待包装成品');
    });

    document.getElementById('requestMaterialBtn').addEventListener('click', function() {
        openOutboundModal('包装纸箱');
    });

    document.getElementById('confirmOutboundRequestBtn').addEventListener('click', function() {
        const groundCode = document.getElementById('groundCodeInput').value.trim();
        if (!groundCode) {
            alert('请扫描地标码。');
            return;
        }

        const result = PackagingStorage.addOutbound(currentOrderNo, currentOutboundType, groundCode);
        if (!result.ok) {
            alert('当前工单未处于进行中，无法申请出库。');
            return;
        }

        closeModal('outboundModal');
        renderExecutionPage();
        alert(`${currentOutboundType}托盘已申请出库至地标码 ${groundCode}。`);
    });

    document.getElementById('returnPalletBtn').addEventListener('click', function() {
        const order = PackagingStorage.getOrder(currentOrderNo);
        if (!order || order.status !== 'in_progress') {
            alert('仅进行中的工单可申请托盘回库。');
            return;
        }

        const scenario = getNextPalletReturnScenario();
        document.getElementById('returnGroundCodeInput').value = '';
        document.getElementById('remainingQtyInput').value = '';
        document.getElementById('remainingQtyGroup').style.display = 'none';
        document.getElementById('remainingSnGroup').style.display = 'none';
        document.getElementById('remainingSnList').innerHTML = '';
        document.getElementById('continueSupplyCheckbox').checked = false;
        document.getElementById('continueSupplyGroup').style.display = 'none';
        setContinueSupplyType(scenario.supplyType);
        renderPalletReturnScenario(scenario);
        showModal('palletReturnModal');
        setTimeout(() => {
            document.getElementById('returnGroundCodeInput').focus();
        }, 80);
    });

    document.getElementById('continueSupplyCheckbox').addEventListener('change', function(event) {
        document.getElementById('continueSupplyGroup').style.display = event.target.checked ? 'block' : 'none';
    });

    document.querySelectorAll('.supply-type-option-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            setContinueSupplyType(button.dataset.supplyType || '待包装成品');
        });
    });

    document.getElementById('confirmPalletReturnBtn').addEventListener('click', function() {
        const groundCode = document.getElementById('returnGroundCodeInput').value.trim();
        const currentScenario = getCurrentPalletReturnScenario();
        const palletCode = currentScenario.palletCode || '';
        const returnType = currentScenario.returnType;
        const continueSupply = document.getElementById('continueSupplyCheckbox').checked;
        const supplyType = document.getElementById('continueSupplyType').value;

        if (!groundCode) {
            alert('请扫描地标码。');
            return;
        }

        if (!palletCode) {
            alert('系统未识别到托盘码，请稍后重试。');
            return;
        }

        let remainingQty = null;
        if (returnType === 'partial') {
            remainingQty = getScenarioRemainingQty(currentScenario);
            if (!Number.isFinite(remainingQty) || remainingQty <= 0 || !Number.isInteger(remainingQty)) {
                alert('系统未识别到有效余料信息，请稍后重试。');
                return;
            }
        }

        const result = PackagingStorage.addPalletReturn(
            currentOrderNo,
            groundCode,
            palletCode,
            returnType,
            remainingQty,
            continueSupply,
            supplyType
        );

        if (!result.ok) {
            if (result.reason === 'invalid_remaining_qty') {
                alert('系统识别的余料数量异常，请稍后重试。');
                return;
            }

            alert('当前工单未处于进行中，无法回库。');
            return;
        }

        closeModal('palletReturnModal');
        renderExecutionPage();

        if (result.completed) {
            document.getElementById('completeOrderNo').textContent = result.order.orderNo;
            document.getElementById('completeQty').textContent = `${result.order.packedQty} / ${result.order.plannedQty}`;
            showModal('completeModal');
            return;
        }

        const message = continueSupply
            ? `托盘已回库，已完成托盘解绑并累计已包装 ${result.unboundQty} 件，同时已继续补给新材料。`
            : `托盘已回库，已完成托盘解绑并累计已包装 ${result.unboundQty} 件。`;
        alert(message);
    });

    document.getElementById('confirmPackQtyBtn').addEventListener('click', function() {
        const qty = parseInt(document.getElementById('packQtyInput').value, 10);
        const result = PackagingStorage.recordPackedQty(currentOrderNo, qty);

        if (!result.ok) {
            alert('登记失败，请确认工单状态与数量输入。');
            return;
        }

        closeModal('packQtyModal');
        renderExecutionPage();

        if (result.completed) {
            document.getElementById('completeOrderNo').textContent = result.order.orderNo;
            document.getElementById('completeQty').textContent = `${result.order.packedQty} / ${result.order.plannedQty}`;
            showModal('completeModal');
            return;
        }

        alert(`已登记 ${qty} 件，当前累计 ${result.order.packedQty} / ${result.order.plannedQty}。`);
    });

    document.getElementById('pauseOrderBtn').addEventListener('click', function() {
        const result = PackagingStorage.pauseOrder(currentOrderNo);
        if (!result.ok) {
            alert('当前工单无法暂停。');
            return;
        }

        renderExecutionPage();
        alert('工单已暂停，可返回列表开始其他工单。');
    });

    document.getElementById('continueOrderBtn').addEventListener('click', function() {
        const result = PackagingStorage.startOrder(currentOrderNo);
        if (!result.ok) {
            if (result.reason === 'active_exists' && result.activeOrder) {
                alert(`当前已有进行中的工单：${result.activeOrder.orderNo}。请先暂停该工单，再继续本工单。`);
                return;
            }

            alert('工单继续失败，请稍后重试。');
            return;
        }

        renderExecutionPage();
        alert('工单已恢复执行。');
    });

    document.getElementById('completeBackToListBtn').addEventListener('click', function() {
        window.location.href = '包装作业.html';
    });

    document.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', function() {
            closeModal(button.dataset.closeModal);
        });
    });
}

function renderExecutionPage() {
    const order = PackagingStorage.getOrder(currentOrderNo);
    if (!order) {
        return;
    }

    const remainingQty = Math.max(order.plannedQty - order.packedQty, 0);
    const progress = order.plannedQty === 0 ? 0 : Math.round((order.packedQty / order.plannedQty) * 100);

    document.getElementById('orderNo').textContent = order.orderNo;
    document.getElementById('productName').textContent = order.productName;
    document.getElementById('productCode').textContent = order.productCode;

    document.getElementById('packedQty').textContent = order.packedQty;
    document.getElementById('plannedQty').textContent = order.plannedQty;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressStatusText').textContent = getProgressText(order.status, progress);

    document.getElementById('productOutboundCount').textContent = order.productOutboundCount;
    document.getElementById('materialOutboundCount').textContent = order.materialOutboundCount;
    document.getElementById('palletReturnCount').textContent = order.palletReturnCount;

    renderHistory(order.history || []);
    syncActionState(order);
}

function renderHistory(history) {
    if (!history.length) {
        document.getElementById('historyTimeline').innerHTML = '<div class="history-empty">暂无操作记录，开始工单后将展示包装执行过程。</div>';
        return;
    }

    const html = history.slice().reverse().map(item => `
        <div class="history-item">
            <div class="history-dot ${item.kind}"></div>
            <div class="history-content">
                <div class="history-title-row">
                    <div class="history-title">${item.title}</div>
                    <div class="history-time">${item.time}</div>
                </div>
                <div class="history-detail">${item.detail}</div>
            </div>
        </div>
    `).join('');

    document.getElementById('historyTimeline').innerHTML = html;
}

function syncActionState(order) {
    const isRunning = order.status === 'in_progress';
    const isPaused = order.status === 'paused';
    const isCompleted = order.status === 'completed';
    const badge = document.getElementById('executionStatusBadge');

    document.getElementById('requestProductBtn').disabled = !isRunning;
    document.getElementById('requestMaterialBtn').disabled = !isRunning;
    document.getElementById('returnPalletBtn').disabled = !isRunning;
    document.getElementById('pauseOrderBtn').style.display = isRunning ? 'block' : 'none';
    document.getElementById('continueOrderBtn').style.display = isPaused ? 'block' : 'none';
    badge.textContent = getBadgeText(order.status);
}

function openOutboundModal(typeLabel) {
    const order = PackagingStorage.getOrder(currentOrderNo);
    if (!order || order.status !== 'in_progress') {
        alert('仅进行中的工单可申请出库。');
        return;
    }

    currentOutboundType = typeLabel;
    document.getElementById('outboundModalTitle').textContent =
        typeLabel === '待包装成品' ? '申请待包装成品出库' : '申请包装纸箱出库';
    document.getElementById('outboundOrderNo').textContent = order.orderNo;
    document.getElementById('groundCodeInput').value = '';
    document.getElementById('outboundHint').textContent =
        typeLabel === '待包装成品'
            ? '确认后将出库 1 个待包装成品托盘到指定地标码处'
            : '确认后将出库 1 个包装纸箱托盘到指定地标码处';
    showModal('outboundModal');
    setTimeout(() => {
        document.getElementById('groundCodeInput').focus();
    }, 80);
}

function getNextPalletReturnScenario() {
    palletReturnDemoIndex = (palletReturnDemoIndex + 1) % palletReturnDemoScenarios.length;
    return palletReturnDemoScenarios[palletReturnDemoIndex];
}

function getCurrentPalletReturnScenario() {
    if (palletReturnDemoIndex < 0) {
        return palletReturnDemoScenarios[0];
    }

    return palletReturnDemoScenarios[palletReturnDemoIndex];
}

function renderPalletReturnScenario(scenario) {
    document.getElementById('palletReturnTypeDisplay').value = scenario.displayLabel;

    if (scenario.returnType !== 'partial') {
        document.getElementById('remainingQtyInput').value = '';
        document.getElementById('remainingQtyGroup').style.display = 'none';
        document.getElementById('remainingSnGroup').style.display = 'none';
        document.getElementById('remainingSnList').innerHTML = '';
        return;
    }

    if (scenario.supplyType === '包装纸箱') {
        document.getElementById('remainingQtyInput').value = scenario.remainingQty;
        document.getElementById('remainingQtyGroup').style.display = 'block';
        document.getElementById('remainingSnGroup').style.display = 'none';
        document.getElementById('remainingSnList').innerHTML = '';
        return;
    }

    document.getElementById('remainingQtyInput').value = '';
    document.getElementById('remainingQtyGroup').style.display = 'none';
    document.getElementById('remainingSnGroup').style.display = 'block';
    document.getElementById('remainingSnList').innerHTML = buildRemainingSnTable(scenario.remainingSnList);
}

function setContinueSupplyType(type) {
    const nextType = type === '包装纸箱' ? '包装纸箱' : '待包装成品';
    document.getElementById('continueSupplyType').value = nextType;

    document.querySelectorAll('.supply-type-option-btn').forEach(function(button) {
        button.classList.toggle('is-selected', button.dataset.supplyType === nextType);
    });
}

function getScenarioRemainingQty(scenario) {
    if (scenario.supplyType === '包装纸箱') {
        return Number(scenario.remainingQty);
    }

    return Array.isArray(scenario.remainingSnList) ? scenario.remainingSnList.length : 0;
}

function buildRemainingSnTable(snList) {
    if (!snList.length) {
        return '<div class="empty-inline-state">当前暂无余料sn码。</div>';
    }

    const rows = snList.map(function(sn) {
        return `<div class="readonly-sn-row">${sn}</div>`;
    }).join('');

    return `
        <div class="readonly-sn-head">余料sn码</div>
        <div class="readonly-sn-body">${rows}</div>
    `;
}

function getProgressText(status, progress) {
    if (status === 'completed') {
        return '已完成';
    }

    if (status === 'paused') {
        return `已暂停 · 完成 ${progress}%`;
    }

    if (status === 'in_progress') {
        return `执行中 · 完成 ${progress}%`;
    }

    return '未开始';
}

function getBadgeText(status) {
    const map = {
        pending: '待开始',
        in_progress: '进行中',
        paused: '已暂停',
        completed: '已完成'
    };

    return map[status] || '待开始';
}

function showModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function getOrderNoFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('orderNo');
}
