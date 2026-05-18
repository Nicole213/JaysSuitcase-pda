let currentInspectionOrder = null;
let currentInspectionPallet = null;
let currentEditingSnCode = '';
let pendingSnResult = '';
let pendingPhotoUploaded = false;

document.addEventListener('DOMContentLoaded', function() {
    if (!window.InspectionWorkStorage) {
        alert('未找到抽检数据，已返回列表页。');
        goBackToInspectionExecution();
        return;
    }

    window.InspectionWorkStorage.initialize();
    const params = new URLSearchParams(window.location.search);
    const orderNo = params.get('orderNo') || '';
    const palletCode = (params.get('palletCode') || '').trim().toUpperCase();
    currentInspectionOrder = window.InspectionWorkStorage.getOrder(orderNo);

    if (!currentInspectionOrder || !palletCode) {
        alert('未找到对应托盘，已返回执行抽检页。');
        goBackToInspectionExecution();
        return;
    }

    currentInspectionPallet = currentInspectionOrder.pallets.find(function(item) {
        return item.palletCode === palletCode && (item.status === '待检验' || item.status === '检验中');
    }) || null;

    if (!currentInspectionPallet) {
        alert('当前托盘不可继续抽检，已返回执行抽检页。');
        goBackToInspectionExecution();
        return;
    }

    bindInspectionEntryEvents();
    renderInspectionEntryPage();
    document.getElementById('snCodeInput').focus();
});

function bindInspectionEntryEvents() {
    document.getElementById('scanSnBtn').addEventListener('click', handleSnScan);
    document.getElementById('submitInspectionBtn').addEventListener('click', submitInspection);
    document.getElementById('saveDraftBtn').addEventListener('click', saveCurrentDraft);
    document.getElementById('uploadPhotoBtn').addEventListener('click', mockUploadPhoto);
    document.getElementById('saveSnInspectionBtn').addEventListener('click', saveSnInspection);

    document.querySelectorAll('.overview-link-row').forEach(function(row) {
        row.addEventListener('click', function() {
            openDetailWithType(row.dataset.resultType);
        });
    });

    document.querySelectorAll('[data-close-modal]').forEach(function(button) {
        button.addEventListener('click', function() {
            closeModal(button.dataset.closeModal);
        });
    });

    document.querySelectorAll('#finalDecisionOptions .decision-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            const result = window.InspectionWorkStorage.updateFinalResult(
                currentInspectionOrder.orderNo,
                currentInspectionPallet.palletCode,
                button.dataset.result
            );
            if (!result.ok) {
                alert('当前托盘不能修改抽检结果。');
                return;
            }

            refreshEntryState();
            renderInspectionEntryPage();
        });
    });

    document.querySelectorAll('#snResultToggle .result-option').forEach(function(button) {
        button.addEventListener('click', function() {
            pendingSnResult = button.dataset.result;
            setActiveButtonGroup('#snResultToggle .result-option', pendingSnResult);
            syncDefectFields();
        });
    });

    document.getElementById('snCodeInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handleSnScan();
        }
    });
}

function renderInspectionEntryPage() {
    document.getElementById('inspectionEntryBadge').textContent = currentInspectionPallet.status;
    document.getElementById('currentPalletCode').textContent = currentInspectionPallet.palletCode;
    document.getElementById('currentPalletMeta').textContent =
        `${currentInspectionOrder.materialName} · ${currentInspectionOrder.materialCode} · 共 ${currentInspectionPallet.qty} 件`;
    document.getElementById('currentPalletStatusText').textContent = currentInspectionPallet.status;
    document.getElementById('passedEntryCount').textContent = currentInspectionPallet.passedQty;
    document.getElementById('failedEntryCount').textContent = currentInspectionPallet.failedQty;
    document.getElementById('demoSnHint').textContent =
        `可试用 SN：${currentInspectionPallet.sns.map(function(item) { return item.snCode; }).join('、')}`;
    document.getElementById('draftSavedInfo').textContent = currentInspectionPallet.draftSavedAt
        ? `草稿已保存：${currentInspectionPallet.draftSavedAt}`
        : '未保存草稿';
    setActiveButtonGroup('#finalDecisionOptions .decision-btn', currentInspectionPallet.finalResult || '');
}

function handleSnScan() {
    const snCode = document.getElementById('snCodeInput').value.trim().toUpperCase();
    if (!snCode) {
        alert('请先扫描 SN 码。');
        return;
    }

    const snItem = currentInspectionPallet.sns.find(function(item) {
        return item.snCode === snCode;
    });

    if (!snItem) {
        alert('该 SN 不在当前托盘内，请重新扫描。');
        return;
    }

    document.getElementById('snCodeInput').value = '';
    openSnInspectionModal(snItem);
}

function openSnInspectionModal(snItem) {
    currentEditingSnCode = snItem.snCode;
    pendingSnResult = snItem.inspectionResult || '';
    pendingPhotoUploaded = Boolean(snItem.photoUploaded);

    document.getElementById('modalSnCode').textContent = snItem.snCode;
    document.getElementById('modalMaterialInfo').textContent = `${currentInspectionOrder.materialName} / ${currentInspectionOrder.materialCode}`;
    document.getElementById('defectReasonSelect').value = snItem.defectReason || '';
    document.getElementById('inspectionRemarkInput').value = snItem.remark || '';
    document.getElementById('photoUploadTip').textContent = pendingPhotoUploaded ? '已上传 1 张照片' : '暂未上传照片';
    setActiveButtonGroup('#snResultToggle .result-option', pendingSnResult);
    syncDefectFields();
    showModal('snInspectionModal');
}

function saveSnInspection() {
    if (!currentEditingSnCode) {
        return;
    }

    if (!pendingSnResult) {
        alert('请选择检验结果。');
        return;
    }

    const defectReason = document.getElementById('defectReasonSelect').value;
    const remark = document.getElementById('inspectionRemarkInput').value.trim();

    if (pendingSnResult === '不合格' && !defectReason) {
        alert('不合格时必须选择不合格原因。');
        return;
    }

    const result = window.InspectionWorkStorage.updateSnInspection(
        currentInspectionOrder.orderNo,
        currentInspectionPallet.palletCode,
        currentEditingSnCode,
        {
            inspectionResult: pendingSnResult,
            defectReason: defectReason,
            photoUploaded: pendingPhotoUploaded,
            remark: remark
        }
    );

    if (!result.ok) {
        alert('保存失败，请重试。');
        return;
    }

    refreshEntryState();
    closeModal('snInspectionModal');
    renderInspectionEntryPage();
    document.getElementById('snCodeInput').focus();
}

function saveCurrentDraft() {
    const result = window.InspectionWorkStorage.savePalletDraft(currentInspectionOrder.orderNo, currentInspectionPallet.palletCode);
    if (!result.ok) {
        alert('当前托盘不能保存草稿。');
        return;
    }

    refreshEntryState();
    renderInspectionEntryPage();
    alert(`托盘 ${currentInspectionPallet.palletCode} 草稿已保存。`);
}

function submitInspection() {
    const result = window.InspectionWorkStorage.submitPalletInspection(currentInspectionOrder.orderNo, currentInspectionPallet.palletCode);
    if (!result.ok) {
        if (result.reason === 'missing_final_result') {
            alert('请先选择本托抽检结果。');
            return;
        }

        alert('提交失败，请稍后重试。');
        return;
    }

    alert(`托盘 ${currentInspectionPallet.palletCode} 抽检结果已提交。`);
    goBackAfterEntryComplete();
}

function refreshEntryState() {
    currentInspectionOrder = window.InspectionWorkStorage.getOrder(currentInspectionOrder.orderNo);
    currentInspectionPallet = currentInspectionOrder.pallets.find(function(item) {
        return item.palletCode === currentInspectionPallet.palletCode;
    }) || null;
}

function mockUploadPhoto() {
    pendingPhotoUploaded = true;
    document.getElementById('photoUploadTip').textContent = '已上传 1 张照片';
}

function syncDefectFields() {
    const shouldShow = pendingSnResult === '不合格';
    document.getElementById('defectReasonGroup').classList.toggle('hidden', !shouldShow);
    document.getElementById('photoUploadGroup').classList.toggle('hidden', !shouldShow);

    if (!shouldShow) {
        pendingPhotoUploaded = false;
        document.getElementById('defectReasonSelect').value = '';
        document.getElementById('photoUploadTip').textContent = '暂未上传照片';
    }
}

function setActiveButtonGroup(selector, selectedValue) {
    document.querySelectorAll(selector).forEach(function(button) {
        button.classList.toggle('active', button.dataset.result === selectedValue);
    });
}

function openDetailWithType(resultType) {
    window.location.href =
        `成品抽检结果明细.html?orderNo=${encodeURIComponent(currentInspectionOrder.orderNo)}&palletCode=${encodeURIComponent(currentInspectionPallet.palletCode)}&resultType=${encodeURIComponent(resultType)}&source=entry`;
}

function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
    }

    if (id === 'snInspectionModal') {
        currentEditingSnCode = '';
        pendingSnResult = '';
        pendingPhotoUploaded = false;
        setActiveButtonGroup('#snResultToggle .result-option', '');
        document.getElementById('defectReasonGroup').classList.add('hidden');
        document.getElementById('photoUploadGroup').classList.add('hidden');
    }
}

function goBackToInspectionExecution() {
    const params = new URLSearchParams(window.location.search);
    const orderNo = currentInspectionOrder ? currentInspectionOrder.orderNo : params.get('orderNo') || '';
    const source = params.get('source') || '';

    if (source === 'progress') {
        const progressTarget = orderNo
            ? `抽检进度.html?orderNo=${encodeURIComponent(orderNo)}`
            : '抽检作业.html';
        window.location.href = progressTarget;
        return;
    }

    const target = orderNo
        ? `成品抽检.html?orderNo=${encodeURIComponent(orderNo)}`
        : '抽检作业.html';
    window.location.href = target;
}

function goBackAfterEntryComplete() {
    const params = new URLSearchParams(window.location.search);
    const orderNo = currentInspectionOrder ? currentInspectionOrder.orderNo : params.get('orderNo') || '';
    const source = params.get('source') || '';

    if (source === 'progress') {
        const progressTarget = orderNo
            ? `抽检进度.html?orderNo=${encodeURIComponent(orderNo)}`
            : '抽检作业.html';
        window.location.href = progressTarget;
        return;
    }

    const target = orderNo
        ? `成品抽检.html?orderNo=${encodeURIComponent(orderNo)}`
        : '抽检作业.html';
    window.location.href = target;
}
