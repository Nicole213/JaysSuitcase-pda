// PDA入库作业脚本
let currentOrder = null;
let currentContainer = null;
let scannedMaterials = [];

document.addEventListener('DOMContentLoaded', function() {
    // 加载入库单信息
    loadInboundOrder();

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

    // 添加物料
    document.getElementById('addMaterialBtn').addEventListener('click', addMaterial);

    // 确认组盘
    document.getElementById('confirmBtn').addEventListener('click', confirmPallet);

    // 确认入库
    document.getElementById('confirmLocationBtn').addEventListener('click', confirmInbound);
    document.getElementById('cancelLocationBtn').addEventListener('click', function() {
        closeModal('locationModal');
    });
});

function loadInboundOrder() {
    // 模拟加载入库单数据
    currentOrder = {
        orderNo: 'RK-2024-001',
        plannedQty: 100,
        inboundQty: 60,
        pendingQty: 40
    };

    document.getElementById('orderNo').textContent = currentOrder.orderNo;
    document.getElementById('plannedQty').textContent = currentOrder.plannedQty;
    document.getElementById('inboundQty').textContent = currentOrder.inboundQty;
    document.getElementById('pendingQty').textContent = currentOrder.pendingQty;
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
        recommendMaterials: [
            { code: 'WL-2024-001', name: '物料A', qty: 20 },
            { code: 'WL-2024-002', name: '物料B', qty: 20 }
        ]
    };

    // 显示容器信息
    document.getElementById('currentContainer').textContent = currentContainer.code;
    document.getElementById('containerInfo').style.display = 'block';
    document.getElementById('materialScan').style.display = 'block';
    document.getElementById('actionBar').style.display = 'block';

    // 显示推荐物料
    renderRecommendMaterials();

    // 清空输入并聚焦到物料扫描
    document.getElementById('containerCode').value = '';
    document.getElementById('materialCode').focus();
}

function renderRecommendMaterials() {
    const html = currentContainer.recommendMaterials.map(m => `
        <div class="material-item">
            <div class="item-header">
                <span class="item-code">${m.code}</span>
                <span class="item-qty">${m.qty}</span>
            </div>
            <div class="item-name">${m.name}</div>
        </div>
    `).join('');
    document.getElementById('recommendList').innerHTML = html;
}

function scanMaterial() {
    const code = document.getElementById('materialCode').value.trim();
    if (!code) {
        alert('请输入物料编码');
        return;
    }

    // 模拟查询物料信息
    const material = {
        code: code,
        name: '物料名称-' + code
    };

    // 不清空物料编码输入框，只重置数量并聚焦
    document.getElementById('quantity').value = '1';
    document.getElementById('quantity').focus();
}

function addMaterial() {
    const code = document.getElementById('materialCode').value.trim();
    const qty = parseInt(document.getElementById('quantity').value);

    if (!code) {
        alert('请先扫描物料编码');
        return;
    }

    if (!qty || qty <= 0) {
        alert('请输入有效数量');
        return;
    }

    // 添加到已扫描列表
    scannedMaterials.push({
        code: code,
        name: '物料名称-' + code,
        qty: qty
    });

    // 显示已扫描物料
    document.getElementById('scannedMaterials').style.display = 'block';
    renderScannedMaterials();

    // 清空输入
    document.getElementById('materialCode').value = '';
    document.getElementById('quantity').value = '1';
    document.getElementById('materialCode').focus();
}

function renderScannedMaterials() {
    const html = scannedMaterials.map((m, index) => `
        <div class="scanned-item">
            <div class="item-info">
                <div class="item-code">${m.code}</div>
                <div class="item-name">${m.name}</div>
            </div>
            <span class="item-qty">×${m.qty}</span>
            <button class="delete-btn" onclick="deleteMaterial(${index})">删除</button>
        </div>
    `).join('');
    document.getElementById('materialList').innerHTML = html;
}

function deleteMaterial(index) {
    scannedMaterials.splice(index, 1);
    renderScannedMaterials();
    if (scannedMaterials.length === 0) {
        document.getElementById('scannedMaterials').style.display = 'none';
    }
}

function confirmPallet() {
    if (scannedMaterials.length === 0) {
        alert('请先扫描物料');
        return;
    }

    // 加载可用库位
    loadAvailableLocations();

    // 显示库位选择弹窗
    showModal('locationModal');
}

function loadAvailableLocations() {
    const select = document.getElementById('locationSelect');
    select.innerHTML = '';
    
    // 模拟加载库位数据
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

function confirmInbound() {
    const location = document.getElementById('locationSelect').value;
    if (!location) {
        alert('请选择入库库位');
        return;
    }

    // 模拟提交入库
    alert('入库成功！\n容器：' + currentContainer.code + '\n库位：' + location);

    // 重置状态
    resetForm();
    closeModal('locationModal');
}

function resetForm() {
    currentContainer = null;
    scannedMaterials = [];
    document.getElementById('containerInfo').style.display = 'none';
    document.getElementById('materialScan').style.display = 'none';
    document.getElementById('scannedMaterials').style.display = 'none';
    document.getElementById('actionBar').style.display = 'none';
    document.getElementById('fullPallet').checked = false;
    document.getElementById('containerCode').focus();
    
    // 重新加载入库单信息
    loadInboundOrder();
}

function showModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}
