// PDA登录页面脚本
document.addEventListener('DOMContentLoaded', function() {
    // 获取表单元素
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // 从本地存储加载记住的手机号
    const savedUsername = localStorage.getItem('pdaRememberedUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        rememberMeCheckbox.checked = true;
    }

    // 自动聚焦到用户名输入框
    usernameInput.focus();

    // 表单提交处理
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // 基本验证
        if (!username) {
            showMessage('请输入手机号码', 'error');
            usernameInput.focus();
            return;
        }

        // 验证手机号码格式
        if (!/^1[3-9]\d{9}$/.test(username)) {
            showMessage('请输入正确的手机号码', 'error');
            usernameInput.focus();
            return;
        }

        if (!password) {
            showMessage('请输入密码', 'error');
            passwordInput.focus();
            return;
        }

        // 模拟登录验证
        if (validateLogin(username, password)) {
            // 记住手机号功能
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('pdaRememberedUsername', username);
            } else {
                localStorage.removeItem('pdaRememberedUsername');
            }

            // 保存登录状态
            sessionStorage.setItem('pdaIsLoggedIn', 'true');
            sessionStorage.setItem('pdaUsername', username);

            showMessage('登录成功', 'success');

            // 延迟跳转到主页
            setTimeout(function() {
                window.location.href = '../index.html';
            }, 800);
        } else {
            showMessage('手机号码或密码错误', 'error');
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    // Enter键快捷登录
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });

    // 只允许输入数字
    usernameInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
    });
});

// 模拟登录验证
function validateLogin(username, password) {
    // 这里是模拟验证，实际应该调用后端API
    const validUsers = [
        { username: '13100000000', password: '123456' },
        { username: '13200000000', password: '123456' },
        { username: '13300000000', password: '123456' }
    ];

    return validUsers.some(user => 
        user.username === username && user.password === password
    );
}

// 显示消息提示
function showMessage(message, type) {
    // 移除已存在的消息
    const existingMessage = document.querySelector('.message-toast');
    if (existingMessage) {
        existingMessage.remove();
    }

    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-toast message-${type}`;
    messageDiv.textContent = message;

    // 添加样式
    const style = document.createElement('style');
    if (!document.querySelector('#message-toast-style')) {
        style.id = 'message-toast-style';
        style.textContent = `
            .message-toast {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 14px 24px;
                border-radius: 10px;
                font-size: 15px;
                font-weight: 600;
                z-index: 9999;
                animation: slideDown 0.3s ease-out;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                max-width: 90%;
            }

            .message-success {
                background: #4caf50;
                color: white;
            }

            .message-error {
                background: #f44336;
                color: white;
            }

            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 添加到页面
    document.body.appendChild(messageDiv);

    // 2秒后自动移除
    setTimeout(function() {
        messageDiv.style.animation = 'slideDown 0.3s ease-out reverse';
        setTimeout(function() {
            messageDiv.remove();
        }, 300);
    }, 2000);
}
