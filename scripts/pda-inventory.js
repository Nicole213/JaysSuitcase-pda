// PDA盘点作业脚本
let currentPlan = null;
let currentContainer = null;
let materials = [];

document.addEventListener('DOMContentLoaded', function() {
    // 加载盘点计划
    loadInventoryPlan();

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
    document.getElementById('addMaterialBtn').addEventListener('click', function() {
        showModal('addMaterialModal');
    });

    // 完成盘点
    document.getElementById('completeBtn').addEventListener('click', completeInventory);

    // 盘点数量弹窗
    document.getElementById('confirmInventoryBtn').addEventListener('click', confirmInventory);
    document.getElementById('cancelInventoryBtn').addEventListener('click', function() {
        closeModal('inventoryModal');
    });

    // 添加物料弹窗
    document.getElementById('confirmAddBtn').addEventListener('click', confirmAddMaterial);
    document.getElementById('cancelAddBtn').addEventListener('click', function() {
        closeModal('addMaterialModal');
    });

    // 确认入库
    document.getElementById('confirmLocationBtn').addEventListener('click', confirmReturn);
    document.getElementById('cancelLocationBtn').addEventListener('click', function() {
        closeModal('locationModal');
    });
});

function loadInventoryPlan() {
    // 模拟加载盘点计划
    currentPlan = {
        planNo: 'PD-2024-002',
        scope: '指定库区',
        owner: '李四'
    };

    document.getElementById('planNo').textContent = currentPlan.planNo;
    document.getElementById('planScope').textContent = currentPlan.scope;
    document.getElementById('planOwner').textContent = currentPlan.owner;
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
        type: '塑料托盘',
        location: '1-5-12-1'
    };

    // 模拟加载容器物料
    materials = [
        { 
            code: 'WL-2024-001', 
            name: '物料A', 
            bookQty: 50, 
            inventoryQty: null,
            isInventoried: false,
            status: 'pending'
        },
        { 
            code: 'WL-2024-002', 
            name: '物料B', 
            bookQty: 30, 
            inventoryQty: null,
            isInventoried: false,
            status: 'pending'
        }
    ];

    // 显示容器信息
    document.getElementById('currentContainer').textContent = currentContainer.code;
    document.getElementById('containerType').textContent = currentContainer.type;
    document.getElementById('containerLocation').textContent = currentContainer.location;
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
    const html = materials.map((m, index) => {
        const diff = m.inventoryQty !== null ? m.inventoryQty - m.bookQty : 0;
        const diffClass = diff > 0 ? 'diff-positive' : (diff < 0 ? 'diff-negative' : '');
        const diffText = diff > 0 ? '+' + diff : diff;
        const isNewTag = m.isNew ? '<span style="color: #ff9800; font-size: 12px; margin-left: 4px;">(新增)</span>' : '';
        
        // 计算盘点结果
        let inventoryResult = '-';
        let resultClass = '';
        if (m.inventoryQty !== null) {
            if (diff > 0) {
                inventoryResult = '盘盈';
                resultClass = 'diff-positive';
            } else if (diff < 0) {
                inventoryResult = '盘亏';
                resultClass = 'diff-negative';
            } else {
                inventoryResult = '正常';
                resultClass = '';
            }
        }

        return `
            <div class="material-card ${m.highlighted ? 'highlighted' : ''} ${m.isInventoried ? 'inventoried' : ''}">
                <div class="material-header">
                    <span class="material-code">${m.code}${isNewTag}</span>
                    <span class="material-status ${m.status}">${m.isInventoried ? '已盘点' : '待盘点'}</span>
                </div>
                <div class="material-name">${m.name}</div>
                <div class="material-info">
                    <label>账面数量：</label>
                    <span>${m.bookQty}</span>
                </div>
                <div class="material-info">
                    <label>盘点数量：</label>
                    <span>${m.inventoryQty !== null ? m.inventoryQty : '-'}</span>
                </div>
                ${m.inventoryQty !== null ? `
                <div class="material-info">
                    <label>盘点差异：</label>
                    <span class="${diffClass}">${diffText}</span>
                </div>
                <div class="material-info">
                    <label>盘点结果：</label>
                    <span class="${resultClass}">${inventoryResult}</span>
                </div>
                ` : ''}
                <button class="inventory-btn" onclick="showInventoryModal(${index})" ${m.isInventoried ? 'disabled' : ''}>
                    ${m.isInventoried ? '已盘点' : '盘点'}
                </button>
            </div>
        `;
    }).join('');
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
        // 扫描到计划盘点范围以外的物料，自动添加新物料
        materials.push({
            code: code,
            name: '物料名称-' + code,
            bookQty: 0,
            inventoryQty: null,
            isInventoried: false,
            status: 'pending',
            isNew: true  // 标记为新增物料
        });
        
        renderMaterials();
        
        // 显示新物料的盘点弹窗
        showInventoryModal(materials.length - 1);
    } else {
        const material = materials[materialIndex];
        
        // 检查是否已盘点
        if (material.isInventoried) {
            if (!confirm('该物料已盘点，是否重新盘点？')) {
                document.getElementById('materialCode').value = '';
                return;
            }
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

        // 显示盘点弹窗
        showInventoryModal(materialIndex);
    }

    // 清空输入
    document.getElementById('materialCode').value = '';
}

function showInventoryModal(index) {
    const material = materials[index];
    
    document.getElementById('modalMaterialCode').textContent = material.code;
    document.getElementById('modalMaterialName').textContent = material.name;
    document.getElementById('modalBookQty').textContent = material.bookQty;
    
    // 如果是新增物料，盘点数量为空；否则默认为账面数量
    if (material.isNew) {
        document.getElementById('inventoryQty').value = '';
    } else {
        document.getElementById('inventoryQty').value = material.inventoryQty !== null ? material.inventoryQty : material.bookQty;
    }

    showModal('inventoryModal');

    // 保存当前物料索引
    window.currentMaterialIndex = index;

    // 聚焦到数量输入框
    setTimeout(() => {
        const input = document.getElementById('inventoryQty');
        input.focus();
        if (input.value) {
            input.select();
        }
    }, 100);
}

function confirmInventory() {
    const index = window.currentMaterialIndex;
    const qtyInput = document.getElementById('inventoryQty').value;

    if (qtyInput === '' || qtyInput === null) {
        alert('请输入盘点数量');
        return;
    }

    const qty = parseInt(qtyInput);

    if (isNaN(qty) || qty < 0) {
        alert('请输入有效数量');
        return;
    }

    materials[index].inventoryQty = qty;
    materials[index].isInventoried = true;
    materials[index].status = 'completed';
    materials[index].highlighted = false;  // 取消高亮
    
    closeModal('inventoryModal');
    renderMaterials();
}

function confirmAddMaterial() {
    const code = document.getElementById('newMaterialCode').value.trim();
    const qty = parseInt(document.getElementById('newMaterialQty').value);

    if (!code) {
        alert('请扫描物料编码');
        return;
    }

    if (isNaN(qty) || qty <= 0) {
        alert('请输入有效数量');
        return;
    }

    // 添加新物料
    materials.push({
        code: code,
        name: '物料名称-' + code,
        bookQty: 0,
        inventoryQty: qty,
        isInventoried: true,
        status: 'completed'
    });

    closeModal('addMaterialModal');
    renderMaterials();

    // 清空输入
    document.getElementById('newMaterialCode').value = '';
    document.getElementById('newMaterialQty').value = '1';
}

function completeInventory() {
    const pending = materials.filter(m => !m.isInventoried);
    if (pending.length > 0) {
        if (!confirm(`还有${pending.length}个物料未盘点，确认完成盘点？\n未盘点的物料将按盘点数量为0处理。`)) {
            return;
        }
        
        // 将未盘点的物料盘点数量设置为0
        pending.forEach(m => {
            m.inventoryQty = 0;
            m.isInventoried = true;
            m.status = 'completed';
        });
        
        // 更新物料列表显示
        renderMaterials();
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
    const select = document.getElementById('locationSelect');
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
    const location = document.getElementById('locationSelect').value;
    if (!location) {
        alert('请选择入库库位');
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
}

function showModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}
