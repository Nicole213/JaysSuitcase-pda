document.addEventListener('DOMContentLoaded', function() {
    bindAgvCallEvents();
});

function bindAgvCallEvents() {
    document.getElementById('confirmAgvCallBtn').addEventListener('click', submitAgvCall);
}

function submitAgvCall() {
    const startPoint = document.getElementById('startPointSelect').value;
    const endPoint = document.getElementById('endPointSelect').value;

    if (!startPoint) {
        alert('请选择起点点位。');
        return;
    }

    if (!endPoint) {
        alert('请选择终点点位。');
        return;
    }

    if (startPoint === endPoint) {
        alert('起点点位和终点点位不能相同。');
        return;
    }

    alert(`AGV呼叫成功：${startPoint} → ${endPoint}`);
    document.getElementById('startPointSelect').value = '';
    document.getElementById('endPointSelect').value = '';
}
