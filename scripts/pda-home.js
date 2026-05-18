// PDA首页脚本
document.addEventListener('DOMContentLoaded', function() {
    // 设置默认用户名
    document.getElementById('userName').textContent = '操作员';

    // 更新当前时间
    updateTime();
    setInterval(updateTime, 1000);

    // 退出登录
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('确认退出登录？')) {
            // 清除登录状态
            sessionStorage.removeItem('pdaIsLoggedIn');
            sessionStorage.removeItem('pdaUsername');
            // 跳转到登录页
            window.location.href = 'pages/login.html';
        }
    });

    bindPackagingEntryReset();
    bindInspectionEntryReset();
});

function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
    document.getElementById('currentTime').textContent = timeStr;
}

function bindPackagingEntryReset() {
    const packagingEntry = document.querySelector('a[href="pages/包装作业.html"]');
    if (!packagingEntry || !window.PackagingStorage || typeof window.PackagingStorage.resetOrders !== 'function') {
        return;
    }

    packagingEntry.addEventListener('click', function() {
        window.PackagingStorage.resetOrders();
    });
}

function bindInspectionEntryReset() {
    const inspectionEntry = document.querySelector('a[href="pages/抽检作业.html"]');
    if (!inspectionEntry || !window.InspectionWorkStorage || typeof window.InspectionWorkStorage.resetAll !== 'function') {
        return;
    }

    inspectionEntry.addEventListener('click', function() {
        window.InspectionWorkStorage.resetAll();
    });
}
