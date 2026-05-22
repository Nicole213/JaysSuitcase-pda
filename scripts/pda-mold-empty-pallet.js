const MOLD_EMPTY_PALLET_REGIONS = ['区域1', '区域2', '区域3'];

let selectedMoldRegion = '';

document.addEventListener('DOMContentLoaded', function() {
    bindMoldEmptyPalletEvents();
    resetMoldEmptyPalletPage();
});

function bindMoldEmptyPalletEvents() {
    document.querySelectorAll('.region-option-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            selectMoldRegion(button.dataset.region || '');
        });
    });

    document.getElementById('confirmMoldOutboundBtn').addEventListener('click', openMoldOutboundConfirmModal);
    document.getElementById('confirmMoldOutboundSubmitBtn').addEventListener('click', submitMoldOutbound);
    document.getElementById('cancelMoldOutboundSubmitBtn').addEventListener('click', closeMoldOutboundConfirmModal);
}

function selectMoldRegion(region) {
    if (!MOLD_EMPTY_PALLET_REGIONS.includes(region)) {
        return;
    }

    selectedMoldRegion = region;
    syncMoldRegionSelection();
    updateMoldOutboundButtonState();
}

function syncMoldRegionSelection() {
    document.querySelectorAll('.region-option-btn').forEach(function(button) {
        button.classList.toggle('is-selected', button.dataset.region === selectedMoldRegion);
    });
}

function updateMoldOutboundButtonState() {
    document.getElementById('confirmMoldOutboundBtn').disabled = !selectedMoldRegion;
}

function openMoldOutboundConfirmModal() {
    if (!selectedMoldRegion) {
        alert('请先选择目的区域。');
        return;
    }

    document.getElementById('confirmRegionText').textContent = selectedMoldRegion;
    document.getElementById('confirmMoldOutboundModal').classList.add('active');
}

function closeMoldOutboundConfirmModal() {
    document.getElementById('confirmMoldOutboundModal').classList.remove('active');
}

function submitMoldOutbound() {
    if (!selectedMoldRegion) {
        closeMoldOutboundConfirmModal();
        alert('当前未选择目的区域，请重新选择。');
        return;
    }

    closeMoldOutboundConfirmModal();
    alert(`模具空托已呼叫出库至${selectedMoldRegion}。`);
    resetMoldEmptyPalletPage();
}

function resetMoldEmptyPalletPage() {
    selectedMoldRegion = '';
    document.getElementById('confirmRegionText').textContent = '-';
    syncMoldRegionSelection();
    updateMoldOutboundButtonState();
    closeMoldOutboundConfirmModal();
}
