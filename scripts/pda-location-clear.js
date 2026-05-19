const LOCATION_CLEAR_LANDMARK_MAP = {
    'DB-A01-01': 'A01-01 地标位',
    'DB-A01-02': 'A01-02 地标位',
    'DB-B02-01': 'B02-01 地标位',
    'DB-C03-01': 'C03-01 地标位'
};

document.addEventListener('DOMContentLoaded', function() {
    bindLocationClearEvents();
    resetLocationClearPage();
});

function bindLocationClearEvents() {
    document.getElementById('landmarkCodeInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            resolveLandmarkCode();
        }
    });

    document.getElementById('landmarkCodeInput').addEventListener('blur', function() {
        if (this.value.trim()) {
            resolveLandmarkCode();
        }
    });

    document.getElementById('confirmLocationClearBtn').addEventListener('click', confirmLocationClear);
}

function resolveLandmarkCode() {
    const landmarkCode = document.getElementById('landmarkCodeInput').value.trim().toUpperCase();
    const matchedLabel = LOCATION_CLEAR_LANDMARK_MAP[landmarkCode] || '';

    document.getElementById('landmarkCodeInput').value = landmarkCode;
    return matchedLabel;
}

function confirmLocationClear() {
    const landmarkCode = document.getElementById('landmarkCodeInput').value.trim().toUpperCase();
    const matchedLabel = resolveLandmarkCode();

    if (!landmarkCode) {
        alert('请先扫描地标码。');
        return;
    }

    if (!matchedLabel) {
        alert('未匹配到有效地标码。');
        return;
    }

    alert(`已将 ${landmarkCode} 的系统状态更新为无托盘。`);
    resetLocationClearPage();
}

function resetLocationClearPage() {
    document.getElementById('landmarkCodeInput').value = '';
    document.getElementById('landmarkCodeInput').focus();
}
