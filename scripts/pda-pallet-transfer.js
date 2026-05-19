const PALLET_TRANSFER_LANDMARK_MAP = {
    'DB-MD-A01': '人工码垛工位 A',
    'DB-MD-A02': '人工码垛工位 B',
    'DB-MD-B01': '人工码垛工位 C',
    'DB-MD-B02': '人工码垛工位 D'
};

const FIXED_GROUP_READ_POINT = '群读位';

document.addEventListener('DOMContentLoaded', function() {
    bindPalletTransferEvents();
    resetTransferPage();
});

function bindPalletTransferEvents() {
    document.getElementById('startLandmarkInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            resolveStartPoint();
        }
    });

    document.getElementById('startLandmarkInput').addEventListener('blur', function() {
        if (this.value.trim()) {
            resolveStartPoint();
        }
    });

    document.getElementById('confirmTransferCallBtn').addEventListener('click', confirmTransferCall);
}

function resolveStartPoint() {
    const landmarkCode = document.getElementById('startLandmarkInput').value.trim().toUpperCase();
    document.getElementById('startLandmarkInput').value = landmarkCode;

    if (!landmarkCode) {
        return '';
    }

    return PALLET_TRANSFER_LANDMARK_MAP[landmarkCode] || '';
}

function confirmTransferCall() {
    const landmarkCode = document.getElementById('startLandmarkInput').value.trim().toUpperCase();
    const startPoint = resolveStartPoint();

    if (!landmarkCode) {
        alert('请先扫描起点地标码。');
        return;
    }

    if (!startPoint) {
        alert('该地标码不属于人工码垛工位。');
        return;
    }

    alert(`已呼叫AGV前往${startPoint}，将托盘搬运至${FIXED_GROUP_READ_POINT}。`);
    resetTransferPage();
}

function resetTransferPage() {
    document.getElementById('startLandmarkInput').value = '';
    document.getElementById('endPointDisplay').textContent = `${FIXED_GROUP_READ_POINT}（固定）`;
    document.getElementById('startLandmarkInput').focus();
}
