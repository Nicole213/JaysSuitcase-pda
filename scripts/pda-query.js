// PDA库存查询脚本
document.addEventListener('DOMContentLoaded', function() {
    // 标签页切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            // 切换标签页样式
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // 切换内容
            tabContents.forEach(c => c.classList.remove('active'));
            document.getElementById(tab + 'Tab').classList.add('active');

            // 聚焦到对应输入框
            if (tab === 'material') {
                document.getElementById('materialCode').focus();
            } else if (tab === 'container') {
                document.getElementById('containerCode').focus();
            } else if (tab === 'location') {
                document.getElementById('locationRow').focus();
            }
        });
    });

    // 按物料查询
    document.getElementById('searchMaterialBtn').addEventListener('click', searchByMaterial);
    document.getElementById('materialCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchByMaterial();
        }
    });

    document.getElementById('clearMaterialBtn').addEventListener('click', function() {
        document.getElementById('materialCode').value = '';
        document.getElementById('materialResult').style.display = 'none';
        document.getElementById('materialCode').focus();
    });

    // 按容器查询
    document.getElementById('searchContainerBtn').addEventListener('click', searchByContainer);
    document.getElementById('containerCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchByContainer();
        }
    });

    document.getElementById('clearContainerBtn').addEventListener('click', function() {
        document.getElementById('containerCode').value = '';
        document.getElementById('containerResult').style.display = 'none';
        document.getElementById('containerCode').focus();
    });

    // 按库位查询
    document.getElementById('searchLocationBtn').addEventListener('click', searchByLocation);

    // 库位输入框自动跳转
    const locationInputs = ['locationRow', 'locationCol', 'locationLevel', 'locationDepth'];
    locationInputs.forEach((id, index) => {
        const input = document.getElementById(id);
        input.addEventListener('input', function() {
            if (this.value.length >= parseInt(this.maxLength)) {
                if (index < locationInputs.length - 1) {
                    document.getElementById(locationInputs[index + 1]).focus();
                }
            }
        });
    });
});

function searchByMaterial() {
    const code = document.getElementById('materialCode').value.trim();
    if (!code) {
        alert('请输入物料编码');
        return;
    }

    // 模拟查询物料库存
    const result = {
        code: code,
        name: '物料名称-' + code,
        totalQty: 150,
        locations: [
            { location: '1-5-12-1', container: 'TP-001', qty: 50 },
            { location: '1-6-12-1', container: 'TP-002', qty: 50 },
            { location: '2-5-12-1', container: 'TP-003', qty: 50 }
        ]
    };

    // 显示查询结果
    document.getElementById('resultMaterialCode').textContent = result.code;
    document.getElementById('resultMaterialName').textContent = result.name;
    document.getElementById('resultTotalQty').textContent = result.totalQty;

    const locationsHtml = result.locations.map(loc => `
        <div class="location-item">
            <div class="location-header">
                <span class="location-code">${loc.location}</span>
                <span class="location-qty">×${loc.qty}</span>
            </div>
            <div class="location-info">
                <span>容器：${loc.container}</span>
            </div>
        </div>
    `).join('');
    document.getElementById('materialLocations').innerHTML = locationsHtml;

    document.getElementById('materialResult').style.display = 'block';
}

function searchByContainer() {
    const code = document.getElementById('containerCode').value.trim();
    if (!code) {
        alert('请输入容器编码');
        return;
    }

    // 模拟查询容器信息
    const result = {
        code: code,
        type: '塑料托盘',
        location: '1-5-12-1',
        status: '占用',
        materials: [
            { code: 'WL-2024-001', name: '物料A', qty: 50 },
            { code: 'WL-2024-002', name: '物料B', qty: 30 }
        ]
    };

    // 显示查询结果
    document.getElementById('resultContainerCode').textContent = result.code;
    document.getElementById('resultContainerType').textContent = result.type;
    document.getElementById('resultLocation').textContent = result.location;
    document.getElementById('resultStatus').textContent = result.status;

    const materialsHtml = result.materials.map(m => `
        <div class="material-item">
            <div class="item-header">
                <span class="item-code">${m.code}</span>
                <span class="item-qty">×${m.qty}</span>
            </div>
            <div class="item-name">${m.name}</div>
        </div>
    `).join('');
    document.getElementById('containerMaterials').innerHTML = materialsHtml;

    document.getElementById('containerResult').style.display = 'block';
}

function searchByLocation() {
    const row = document.getElementById('locationRow').value.trim();
    const col = document.getElementById('locationCol').value.trim();
    const level = document.getElementById('locationLevel').value.trim();
    const depth = document.getElementById('locationDepth').value.trim();

    if (!row || !col || !level || !depth) {
        alert('请输入完整的库位编码');
        return;
    }

    const locationCode = `${row}-${col}-${level}-${depth}`;

    // 模拟查询库位信息
    const result = {
        code: locationCode,
        area: '库区A',
        status: '有货',
        container: 'TP-001',
        materials: [
            { code: 'WL-2024-001', name: '物料A', qty: 50 },
            { code: 'WL-2024-002', name: '物料B', qty: 30 }
        ]
    };

    // 显示查询结果
    document.getElementById('resultLocationCode').textContent = result.code;
    document.getElementById('resultArea').textContent = result.area;
    document.getElementById('resultLocationStatus').textContent = result.status;
    document.getElementById('resultLocationContainer').textContent = result.container;

    const materialsHtml = result.materials.map(m => `
        <div class="material-item">
            <div class="item-header">
                <span class="item-code">${m.code}</span>
                <span class="item-qty">×${m.qty}</span>
            </div>
            <div class="item-name">${m.name}</div>
        </div>
    `).join('');
    document.getElementById('locationMaterials').innerHTML = materialsHtml;

    document.getElementById('locationResult').style.display = 'block';
}
