document.addEventListener('DOMContentLoaded', function() {
    redirectDeprecatedInspectionInboundDetailPage();
});

function redirectDeprecatedInspectionInboundDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const orderNo = params.get('orderNo') || '';
    const palletCode = (params.get('palletCode') || '').trim().toUpperCase();
    const target = orderNo
        ? `成品抽检结果明细.html?orderNo=${encodeURIComponent(orderNo)}${palletCode ? `&palletCode=${encodeURIComponent(palletCode)}` : ''}&resultType=all&source=progress`
        : '抽检作业.html';

    alert('回库确认明细页已下线，请在抽检结果明细中查看托盘记录。');
    window.location.replace(target);
}
