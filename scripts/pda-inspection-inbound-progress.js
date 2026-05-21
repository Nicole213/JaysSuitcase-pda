document.addEventListener('DOMContentLoaded', function() {
    redirectDeprecatedInspectionInboundProgressPage();
});

function redirectDeprecatedInspectionInboundProgressPage() {
    const params = new URLSearchParams(window.location.search);
    const orderNo = params.get('orderNo') || '';
    const target = orderNo
        ? `抽检进度.html?orderNo=${encodeURIComponent(orderNo)}`
        : '抽检作业.html';

    alert('回库确认进度页已下线，请在抽检进度中查看托盘完成情况。');
    window.location.replace(target);
}
