document.addEventListener('DOMContentLoaded', function() {
    redirectDeprecatedInspectionInboundPage();
});

function redirectDeprecatedInspectionInboundPage() {
    const params = new URLSearchParams(window.location.search);
    const orderNo = params.get('orderNo') || '';
    const target = orderNo
        ? `抽检进度.html?orderNo=${encodeURIComponent(orderNo)}`
        : '抽检作业.html';

    alert('确认回库流程已下线，抽检完成后状态即为已完成。');
    window.location.replace(target);
}
