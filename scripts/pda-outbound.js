// PDA出库作业脚本
let currentOrders = [];
let currentContainer = null;
let materials = [];

document.addEventListener('DOMContentLoaded', function() {
    // 加载出库单信息
    loadOutboundOrders();

    // 扫描容器
    document.getElementById('scanContainerBtn').addEventListener('click', scanContainer);
    document.getElementById('containerCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            scanContainer();
        }
    });

    // 清空容器输入
    document.getElementById('clearContainerBtn').addEventListener('click', function() {
        document.getElementById('containerCode').value = '';
        document.getElementById('containerCode').focus();
    });

    // 扫描物料
    document.getElementById('scanMaterialBtn').addEventListener('click', scanMaterial);
    document.getElementById('materialCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            scanMaterial();
        }
    });

    // 清空物料输入
    document.getElementById('clearMaterialBtn').addEventListener('click', function() {
        document.getElementById('materialCode').value = '';
        document.getElementById('materialCode').focus();
    });

    // 确认全部出库
    document.getElementById('confirmAllBtn').addEventListener('click', confirmAllOutbound);

    // 确认出库弹窗
    document.getElementById('confirmOutboundBtn').addEventListener('click', confirmOutbound);
    document.getElementById('cancelOutboundBtn').addEventListener('click', function() {
        closeModal('confirmModal');
    });

    // 确认回库
    document.getElementById('confirmReturnBtn').addEventListener('click', confirmReturn);
    document.getElementById('cancelReturnBtn').addEventListener('click', function() {
        closeModal('locationModal');
    });
});

function loadOutboundOrders() {
    // 模拟加载出库单数据
    currentOrders = [
        { orderNo: 'CK-2024-001', requiredQty: 50, outboundQty: 30 },
        { orderNo: 'CK-2024-002', requiredQty: 30, outboundQty: 0 }
    ];

    renderOrderList('orderList');
}

function renderOrderList(containerId) {
    const html = currentOrders.map(order => `
        <div class="order-item">
            <div class="order-no">${order.orderNo}</div>
            <div class="order-info">
                <span>需出库：${order.requiredQty}</span>
                <span>已出库：${order.outboundQty}</span>
            </div>
        </div>
    `).join('');
    document.getElementById(containerId).innerHTML = html;
}

function scanContainer() {
    const code = document.getElementById('containerCode').value.trim();
    if (!code) {
        alert('请输入容器编码');
        return;
    }

    // 模拟扫描容器
    currentContainer = {
        code: code,
        type: '塑料托盘'
    };

    // 模拟加载容器物料
    materials = [
        { 
            code: 'WL-2024-001', 
            name: '物料A', 
            currentQty: 50, 
            orderNo: 'CK-2024-001',
            requiredQty: 30,
            actualQty: 0,
            status: 'pending'
        },
        { 
            code: 'WL-2024-002', 
            name: '物料B', 
            currentQty: 30, 
            orderNo: 'CK-2024-002',
            requiredQty: 30,
            actualQty: 0,
            status: 'pending'
        }
    ];

    // 显示容器信息
    document.getElementById('currentContainer').textContent = currentContainer.code;
    document.getElementById('containerType').textContent = currentContainer.type;
    document.getElementById('containerInfo').style.display = 'block';
    document.getElementById('materialScan').style.display = 'block';
    document.getElementById('materialList').style.display = 'block';
    document.getElementById('actionBar').style.display = 'block';

    // 渲染物料列表
    renderMaterials();

    // 清空输入
    document.getElementById('containerCode').value = '';
    document.getElementById('materialCode').focus();
}

function renderMaterials() {
    const html = materials.map((m, index) => `
        <div class="material-card ${m.highlighted ? 'highlighted' : ''}">
            <div class="material-header">
                <span class="material-code">${m.code}</span>
                <span class="material-status ${m.status}">${m.status === 'pending' ? '待出库' : '已完成'}</span>
            </div>
            <div class="material-name">${m.name}</div>
            <div class="material-info">
                <label>当前数量：</label>
                <span>${m.currentQty}</span>
            </div>
            <div class="material-info">
                <label>需出库：</label>
                <span>${m.requiredQty}</span>
            </div>
            <div class="material-info">
                <label>实际出库：</label>
                <span>${m.actualQty}</span>
            </div>
            <button class="confirm-btn" onclick="showConfirmModal(${index})" ${m.status === 'completed' ? 'disabled' : ''}>
                ${m.status === 'pending' ? '确认出库' : '已完成'}
            </button>
        </div>
    `).join('');
    document.getElementById('materials').innerHTML = html;
}

function scanMaterial() {
    const code = document.getElementById('materialCode').value.trim();
    if (!code) {
        alert('请输入物料编码');
        return;
    }

    // 查找物料
    const materialIndex = materials.findIndex(m => m.code === code);
    
    if (materialIndex === -1) {
        alert('该物料无需出库');
        document.getElementById('materialCode').value = '';
        return;
    }

    const material = materials[materialIndex];
    
    // 检查是否已完成
    if (material.status === 'completed') {
        alert('该物料已完成出库');
        document.getElementById('materialCode').value = '';
        return;
    }

    // 高亮物料
    materials.forEach(m => {
        m.highlighted = (m.code === code);
    });
    renderMaterials();

    // 滚动到高亮物料
    setTimeout(() => {
        const highlighted = document.querySelector('.material-card.highlighted');
        if (highlighted) {
            highlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);

    // 显示确认出库弹窗
    showConfirmModal(materialIndex);

    // 清空输入
    document.getElementById('materialCode').value = '';
}

function showConfirmModal(index) {
    const material = materials[index];

    // 显示确认弹窗
    document.getElementById('modalOrderNo').textContent = material.orderNo;
    document.getElementById('modalMaterialCode').textContent = material.code;
    document.getElementById('modalMaterialName').textContent = material.name;
    document.getElementById('modalRequiredQty').textContent = material.requiredQty;
    document.getElementById('modalActualQty').value = material.requiredQty;

    showModal('confirmModal');

    // 保存当前物料索引
    window.currentMaterialIndex = index;

    // 聚焦到数量输入框并选中
    setTimeout(() => {
        document.getElementById('modalActualQty').select();
    }, 100);
}

function confirmOutbound() {
    const index = window.currentMaterialIndex;
    const actualQty = parseInt(document.getElementById('modalActualQty').value);

    if (isNaN(actualQty) || actualQty <= 0) {
        alert('请输入有效的出库数量');
        return;
    }

    // 更新实际出库数量
    materials[index].actualQty = actualQty;
    materials[index].status = 'completed';
    
    closeModal('confirmModal');
    renderMaterials();

    // 检查是否全部完成
    checkAllCompleted();
}

function confirmAllOutbound() {
    const pending = materials.filter(m => m.status === 'pending');
    if (pending.length > 0) {
        alert('还有物料未确认出库，请逐个确认');
        return;
    }

    // 设置弹窗中的容器信息
    document.getElementById('modalContainerCode').textContent = currentContainer.code;
    document.getElementById('modalContainerType').textContent = currentContainer.type;

    // 加载可用库位
    loadAvailableLocations();

    // 显示库位选择弹窗
    showModal('locationModal');
}

function loadAvailableLocations() {
    const select = document.getElementById('returnLocationSelect');
    select.innerHTML = '';
    
    // 模拟加载适配该容器的空库位数据
    const locations = ['1-5-12-1', '1-6-12-1', '2-5-12-1', '2-6-12-1'];
    locations.forEach((loc, index) => {
        const option = document.createElement('option');
        option.value = loc;
        option.textContent = loc + (index === 0 ? '（推荐）' : '');
        select.appendChild(option);
    });
    
    // 默认选中第一个推荐库位
    select.selectedIndex = 0;
}

function confirmReturn() {
    const location = document.getElementById('returnLocationSelect').value;
    if (!location) {
        alert('请选择回库库位');
        return;
    }

    // 模拟提交入库任务
    alert('入库任务生成成功！\n容器：' + currentContainer.code + '\n库位：' + location);

    // 关闭弹窗
    closeModal('locationModal');

    // 重置状态
    resetForm();
}

function resetForm() {
    currentContainer = null;
    materials = [];
    document.getElementById('containerInfo').style.display = 'none';
    document.getElementById('materialScan').style.display = 'none';
    document.getElementById('materialList').style.display = 'none';
    document.getElementById('actionBar').style.display = 'none';
    document.getElementById('containerCode').focus();
    
    // 重新加载出库单信息
    loadOutboundOrders();
}

function showModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}
