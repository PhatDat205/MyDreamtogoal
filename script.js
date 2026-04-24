const YEAR = 2026;
const STORAGE_HOURLY = 'myDream_hourly';

function getDaysInMonth(month) {
    return new Date(YEAR, month, 0).getDate();
}

function generateWeeks(month) {
    const days = getDaysInMonth(month);
    const weeks = [];
    let day = 1;
    let weekNum = 1;
    while (day <= days) {
        const end = Math.min(day + 6, days);
        weeks.push({ num: weekNum, start: day, end: end });
        day = end + 1;
        weekNum++;
    }
    return weeks;
}

function renderWeeks(month) {
    const container = document.getElementById('weeks-container');
    container.innerHTML = '';
    const weeks = generateWeeks(month);
    weeks.forEach(w => {
        const div = document.createElement('div');
        div.className = 'week-input';
        div.innerHTML = `
            <label>Tuần ${w.num} (ngày ${w.start} - ${w.end}): </label>
            <input type="number" class="week-hour" value="" min="0" step="0.5">
        `;
        container.appendChild(div);
    });
}

function saveCurrentMonthData() {
    const month = parseInt(document.getElementById('month-select').value);
    const weekInputs = document.querySelectorAll('.week-hour');
    const weeksData = Array.from(weekInputs).map(inp => inp.value.trim() === '' ? null : parseFloat(inp.value) || 0);

    const data = {
        night: parseFloat(document.getElementById('night').value) || 0,
        bonus: parseFloat(document.getElementById('bonus').value) || 0,
        llTimes: parseInt(document.getElementById('ll-times').value) || 0,
        weeks: weeksData
    };
    localStorage.setItem(`myDream_2026_${month}`, JSON.stringify(data));
}

function loadMonthData(month) {
    const saved = localStorage.getItem(`myDream_2026_${month}`);
    const nightEl = document.getElementById('night');
    const bonusEl = document.getElementById('bonus');
    const llEl = document.getElementById('ll-times');

    if (saved) {
        const data = JSON.parse(saved);
        nightEl.value = data.night || 0;
        bonusEl.value = data.bonus || 0;
        llEl.value = data.llTimes || 0;

        const weekInputs = document.querySelectorAll('.week-hour');
        if (data.weeks) {
            data.weeks.forEach((val, i) => {
                if (weekInputs[i]) weekInputs[i].value = val === null ? '' : val;
            });
        }
    } else {
        // Reset về 0 khi tháng chưa có dữ liệu
        nightEl.value = 0;
        bonusEl.value = 0;
        llEl.value = 0;
    }
}

// Hàm tính toán chính (Gọi mỗi khi có thay đổi input)
function updateCalculation() {
    saveCurrentMonthData(); // Tự động lưu ngầm

    const weekInputs = document.querySelectorAll('.week-hour');
    let baseHours = 0;
    let filledCount = 0;

    weekInputs.forEach(input => {
        const val = input.value.trim() === '' ? 0 : parseFloat(input.value) || 0;
        baseHours += val;
        if (input.value.trim() !== '') filledCount++;
    });

    const totalWeeks = weekInputs.length;
    const remainingHours = Math.max(0, 120 - baseHours);
    const remainingWeeks = totalWeeks - filledCount;
    const predicted = remainingWeeks > 0 ? Math.round(remainingHours / remainingWeeks * 2) / 2 : 0;

    // Cập nhật giao diện bên phải
    document.getElementById('total-base-display').textContent = baseHours.toFixed(1);
    document.getElementById('remaining-display').textContent = remainingHours.toFixed(1);
    document.getElementById('weeks-remaining-display').textContent = remainingWeeks;

    // Progress + trạng thái
    let percent = Math.min(100, (baseHours / 120) * 100);
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = percent + '%';

    let statusText = baseHours >= 117 && baseHours <= 123 ? '✅ Tốt - Đúng giờ công' :
                     baseHours < 117 ? '🔵 Ít giờ công' : '🔴 Quá giờ công';
    document.getElementById('status-text').innerHTML = statusText;
    progressBar.style.background = (baseHours >= 117 && baseHours <= 123) ? '#10b981' : (baseHours < 117 ? '#3b82f6' : '#ef4444');

    // DỰ ĐOÁN
    const predictionList = document.getElementById('prediction-list');
    let html = '';
    if (remainingWeeks > 0) {
        const unfilledWeeks = [];
        weekInputs.forEach((inp, idx) => {
            if (inp.value.trim() === '') {
                unfilledWeeks.push(idx + 1);
            }
        });
        unfilledWeeks.forEach(w => {
            html += `Tuần ${w}: <strong>${predicted.toFixed(1)}</strong> giờ<br>`;
        });
    } else {
        html = '✅ Đã đạt tối đa 120 giờ!';
    }
    predictionList.innerHTML = html;

    // ================= TÍNH LƯƠNG (ĐÃ SỬA LOGIC) =================
    const hourly = parseFloat(document.getElementById('hourly').value) || 0;
    const night = parseFloat(document.getElementById('night').value) || 0;
    const bonus = parseFloat(document.getElementById('bonus').value) || 0;
    const llTimes = parseInt(document.getElementById('ll-times').value) || 0;

    // Vì giờ lễ đã nằm trong tổng giờ tuần (đã được tính x1)
    // Nên ở đây chỉ cần cộng thêm phần dư là nhân 2 (để x1 + x2 = x3)
    const nightContrib = night * 0.5;
    const bonusContrib = bonus * 2; 

    const totalEquivHours = baseHours + nightContrib + bonusContrib;
    const hoursSalary = totalEquivHours * hourly;
    const llSalary = llTimes * 15000;
    const totalSalary = hoursSalary + llSalary;

    const formatter = new Intl.NumberFormat('vi-VN');
    document.getElementById('salary-hours').textContent = formatter.format(Math.round(hoursSalary)) + ' VND';
    document.getElementById('salary-ll').textContent = formatter.format(llSalary) + ' VND';
    document.getElementById('salary-total').textContent = formatter.format(Math.round(totalSalary)) + ' VND';
    document.getElementById('salary-final').textContent = formatter.format(Math.round(totalSalary)) + ' VND';

    // Hiện nút lưu dữ liệu nếu đã nhập đủ các tuần
    const saveBtn = document.getElementById('save-month-btn');
    if (saveBtn) {
        saveBtn.style.display = filledCount === totalWeeks ? 'inline-block' : 'none';
    }
}

// ==================== KHỞI ĐỘNG ====================
window.onload = () => {
    const savedHourly = localStorage.getItem(STORAGE_HOURLY);
    if (savedHourly) document.getElementById('hourly').value = savedHourly;

    const monthSelect = document.getElementById('month-select');
    let currentMonth = parseInt(monthSelect.value);

    renderWeeks(currentMonth);
    loadMonthData(currentMonth);
    updateCalculation();

    // Tự động cập nhật khi nhập
    document.addEventListener('input', e => {
        if (['hourly','night','bonus','ll-times'].includes(e.target.id) || e.target.classList.contains('week-hour')) {
            updateCalculation();

            if (e.target.id === 'hourly' && document.getElementById('lock-hourly').checked) {
                localStorage.setItem(STORAGE_HOURLY, e.target.value);
            }
        }
    });

    // Khóa lương giờ
    document.getElementById('lock-hourly').addEventListener('change', () => {
        if (document.getElementById('lock-hourly').checked) {
            localStorage.setItem(STORAGE_HOURLY, document.getElementById('hourly').value);
        }
    });

    // Đổi tháng
    monthSelect.addEventListener('change', () => {
        currentMonth = parseInt(monthSelect.value);
        renderWeeks(currentMonth);
        loadMonthData(currentMonth);
        updateCalculation();
    });

    // Nút Lưu tháng
    document.getElementById('save-month-btn').addEventListener('click', () => {
        saveCurrentMonthData();
        const msg = document.getElementById('save-message');
        msg.innerHTML = '✅ Đã lưu dữ liệu tháng này thành công!<br>Bạn có thể chuyển sang tháng khác.';
        setTimeout(() => { msg.innerHTML = ''; }, 4000);
    });
};
