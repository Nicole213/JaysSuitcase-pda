document.addEventListener('DOMContentLoaded', function() {
    redirectDeprecatedPalletConfirmPage();
});

function redirectDeprecatedPalletConfirmPage() {
    const params = new URLSearchParams(window.location.search);
    const orderNo = params.get('orderNo') || '';
    const palletCode = (params.get('palletCode') || '').trim().toUpperCase();
    const target = orderNo
        ? `成品抽检结果明细.html?orderNo=${encodeURIComponent(orderNo)}${palletCode ? `&palletCode=${encodeURIComponent(palletCode)}` : ''}&resultType=all&source=progress`
        : '抽检作业.html';

    alert('组盘确认流程已下线，托盘抽检提交后即视为已完成。');
    window.location.replace(target);
}
