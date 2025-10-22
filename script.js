// ============================================================
// نظام المؤشر البصري الدائم للاشتراك - في البداية لضمان التوفر
// ============================================================

// تحديث المؤشر البصري للاشتراك - نسخة مبسطة ومضمونة
async function updateVisualSubscriptionIndicator() {
    try {
        console.log('🔄 Updating visual subscription indicator...');
        
        // الحصول على البيانات من الإعدادات مباشرة
        const settingsElement = document.getElementById('licenseDaysLeft');
        if (!settingsElement) {
            console.log('❌ Settings element not found');
            return;
        }
        
        const settingsText = settingsElement.textContent;
        console.log('📊 Settings text:', settingsText);
        
        // استخراج عدد الأيام من نص الإعدادات
        const daysMatch = settingsText.match(/(\d+)/);
        const daysLeft = daysMatch ? parseInt(daysMatch[1]) : null;
        console.log('📅 Extracted days:', daysLeft);
        
        // عناصر الواجهة
        const bar = document.getElementById('subscriptionBar');
        const indicator = document.getElementById('subscriptionIndicator');
        const daysEl = document.getElementById('subDays');
        const labelEl = document.getElementById('subLabel');
        
        if (!bar || !indicator || !daysEl || !labelEl) {
            console.log('❌ Visual indicator elements not found');
            return;
        }
        
        const currentLang = document.documentElement.lang || currentLanguage || 'ar';
        const isEn = currentLang === 'en';
        
        // إذا لم توجد أيام أو كان النص يحتوي على --
        if (daysLeft === null || settingsText.includes('--')) {
            console.log('⚠️ No valid days found, showing inactive');
            bar.className = 'inactive';
            indicator.className = 'subscription-indicator inactive';
            daysEl.textContent = '--';
            labelEl.textContent = isEn ? 'Not Active' : 'غير مفعل';
            return;
        }
        
        // تحديد الحالة والألوان
        let statusClass = 'safe';
        let statusText = isEn ? 'Active' : 'نشط';
        
        if (daysLeft <= 0) {
            statusClass = 'danger';
            statusText = isEn ? 'Expired' : 'منتهي';
            daysEl.textContent = '0';
            labelEl.textContent = isEn ? 'Expired!' : 'منتهي!';
        } else if (daysLeft <= 3) {
            statusClass = 'danger';
            statusText = isEn ? 'Urgent!' : 'عاجل!';
            daysEl.textContent = daysLeft;
            labelEl.textContent = isEn ? (daysLeft === 1 ? 'day' : 'days') : 'يوم';
        } else if (daysLeft <= 7) {
            statusClass = 'warn';
            statusText = isEn ? 'Expiring Soon' : 'ينتهي قريباً';
            daysEl.textContent = daysLeft;
            labelEl.textContent = isEn ? 'days' : 'أيام';
        } else {
            statusClass = 'safe';
            statusText = isEn ? 'Active' : 'نشط';
            daysEl.textContent = daysLeft;
            labelEl.textContent = isEn ? 'days' : 'يوم';
        }
        
        // تطبيق الألوان
        bar.className = statusClass;
        indicator.className = `subscription-indicator ${statusClass}`;
        
        console.log('✅ Visual indicator updated successfully:', {
            daysLeft,
            statusClass,
            statusText
        });
        
    } catch (error) {
        console.error('❌ Error updating visual subscription indicator:', error);
    }
}

// دالة تحديث مشتركة لضمان التزامن بين الإعدادات والمؤشر البصري
async function updateSubscriptionDisplays() {
    console.log('Updating both subscription displays...');
    if (typeof updateSettingsLicenseDisplay === 'function') {
        await updateSettingsLicenseDisplay();
    }
    updateVisualSubscriptionIndicator();
    console.log('Both displays updated successfully');
}

// فتح تقارير الأرباح
function showProfitReports() { 
    // التحقق من كلمة السر أولاً
    if (!checkReportPassword()) {
        return;
    }
    
    try { 
        showModal('profitReportsModal'); 
        renderProfitReports(); 
        translateProfitReports();
    } catch(e) { console.warn(e); } 
}
// فتح تقرير رأس المال
function showInventoryCapital() { 
    // التحقق من كلمة السر أولاً
    if (!checkReportPassword()) {
        return;
    }
    
    try { 
        showModal('inventoryCapitalModal'); 
        renderInventoryCapital(); 
        translateInventoryCapital();
    } catch(e) { console.warn(e); } 
}

// فتح تقرير النفقات
function showExpensesReport() { 
    // التحقق من كلمة السر أولاً
    if (!checkReportPassword()) {
        return;
    }
    
    try { 
        showModal('expensesReportModal'); 
        renderExpensesReport(); 
        translateExpensesReport();
        // ترجمة إضافية لجميع العناصر في modal
        translateExpensesModalElements();
    } catch(e) { console.warn(e); } 
}

// ترجمة جميع عناصر modal النفقات
function translateExpensesModalElements() {
    const t = (k) => getText(k);
    
    // ترجمة جميع العناصر التي تحتوي على data-i18n
    document.querySelectorAll('#expensesReportModal [data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key && t(key)) {
            el.textContent = t(key);
        }
    });
    
    // ترجمة placeholders
    document.querySelectorAll('#expensesReportModal [data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key && t(key)) {
            el.placeholder = t(key);
        }
    });
}

// عرض تقرير النفقات
function renderExpensesReport() {
    try {
        // جلب بيانات النفقات من حركات الصندوق
        const expenses = getExpensesData();
        const filtered = applyExpensesFilters(expenses);
        
        // عرض البيانات
        displayExpensesTable(filtered);
        updateExpensesSummary(filtered);
        
        // إعداد الفلاتر
        setupExpensesFilters();
        
    } catch(e) { 
        console.warn('Error rendering expenses report:', e); 
    }
}

// جلب بيانات النفقات من حركات الصندوق
function getExpensesData() {
    try {
        const cashDrawer = loadFromStorage('cashDrawer', { transactions: [] });
        const transactions = cashDrawer.transactions || [];
        
        // تصفية النفقات فقط (expense, adjustment out)
        const expenses = transactions.filter(tr => {
            const type = String(tr.type || '').toLowerCase();
            return type === 'expense' || 
                   (type === 'adjustment' && (tr.amountUSD < 0 || tr.amountLBP < 0));
        });
        
        // تحويل البيانات إلى صيغة تقرير النفقات
        return expenses.map(tr => {
            // التعامل مع أنواع مختلفة من البيانات
            let amount = 0;
            let currency = 'USD';
            
            if (tr.type === 'adjustment') {
                // معاملات adjustment تستخدم amountUSD و amountLBP
                const amountUSD = Math.abs(tr.amountUSD || 0);
                const amountLBP = Math.abs(tr.amountLBP || 0);
                
                if (amountUSD > 0) {
                    amount = amountUSD;
                    currency = 'USD';
                } else if (amountLBP > 0) {
                    amount = amountLBP;
                    currency = 'LBP';
                }
            } else {
                // معاملات expense تستخدم amount و currency
                amount = Math.abs(tr.amount || 0);
                currency = tr.currency || 'USD';
            }
            
            // حساب المبلغ بالدولار
            let expenseUSD = 0;
            let exchangeRate = tr.exchange_rate || settings?.exchangeRate || 89500;
            
            if (currency === 'USD') {
                expenseUSD = amount;
            } else if (currency === 'LBP') {
                expenseUSD = amount / exchangeRate;
            }
            
            // التأكد من أن المبلغ صحيح
            if (isNaN(expenseUSD) || expenseUSD < 0) {
                expenseUSD = 0;
            }
            
            return {
                id: tr.id || Date.now() + Math.random(),
                date: tr.timestamp || tr.date || new Date().toISOString(),
                category: tr.category || 'عام',
                description: tr.description || tr.note || '',
                originalAmount: amount,
                originalCurrency: currency,
                exchangeRate: currency === 'LBP' ? exchangeRate : null,
                expenseUSD: expenseUSD,
                user: tr.user || 'نظام'
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
        
    } catch(e) { 
        console.warn('Error getting expenses data:', e); 
        return []; 
    }
}

// تطبيق فلاتر النفقات
function applyExpensesFilters(expenses) {
    const fromDate = document.getElementById('expensesFromDate')?.value;
    const category = document.getElementById('expensesCategoryFilter')?.value;
    const user = document.getElementById('expensesUserFilter')?.value;
    const search = document.getElementById('expensesSearch')?.value?.toLowerCase();
    
    let filtered = [...(expenses || [])];
    
    // فلتر التاريخ (من التاريخ المحدد حتى الآن)
    if (fromDate) {
        filtered = filtered.filter(e => {
            try {
                return new Date(e.date) >= new Date(fromDate);
            } catch (error) {
                return false;
            }
        });
    }
    
    // فلتر التصنيف
    if (category && category !== 'all') {
        filtered = filtered.filter(e => e.category === category);
    }
    
    // فلتر المستخدم
    if (user && user !== 'all') {
        filtered = filtered.filter(e => e.user === user);
    }
    
    // فلتر البحث
    if (search) {
        filtered = filtered.filter(e => 
            (e.description || '').toLowerCase().includes(search) ||
            (e.category || '').toLowerCase().includes(search)
        );
    }
    
    return filtered;
}

// عرض جدول النفقات
function displayExpensesTable(expenses) {
    const tbody = document.getElementById('expensesTable');
    if (!tbody) return;
    
    if (!expenses || expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#6c757d;">لا توجد نفقات</td></tr>';
        return;
    }
    
    tbody.innerHTML = expenses.map(expense => {
        const date = new Date(expense.date).toLocaleString();
        const originalAmount = expense.originalCurrency === 'USD' 
            ? `$${Math.abs(expense.originalAmount).toFixed(2)}`
            : `${Math.abs(expense.originalAmount).toLocaleString()} ل.ل`;
        const exchangeRate = expense.exchangeRate ? expense.exchangeRate.toLocaleString() : '-';
        
        // ترجمة الوصف
        const translatedDescription = (expense.description === 'تعديل يدوي للصندوق من الإعدادات' || expense.description === 'Manual cashbox adjustment from Settings') 
            ? getText('cashbox-manual-adjustment') 
            : expense.description;
        
        // ترجمة التصنيف
        const translatedCategory = (expense.category === 'عام') 
            ? (currentLanguage === 'en' ? 'General' : 'عام')
            : expense.category;
        
        return `
        <tr style="font-size: 11px;">
            <td style="padding: 4px; white-space: nowrap;">${date}</td>
            <td style="padding: 4px; white-space: nowrap;">${translatedCategory}</td>
            <td style="padding: 4px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${translatedDescription}">${translatedDescription}</td>
            <td style="padding: 4px; text-align: right; white-space: nowrap;">${originalAmount}</td>
            <td style="padding: 4px; text-align: center; white-space: nowrap;">${exchangeRate}</td>
            <td style="padding: 4px; text-align: right; font-weight: bold; white-space: nowrap;">$${(expense.expenseUSD || 0).toFixed(2)}</td>
            <td style="padding: 4px; white-space: nowrap;">${expense.user || 'نظام'}</td>
        </tr>`;
    }).join('');
}

// تحديث ملخص النفقات
function updateExpensesSummary(expenses) {
    const totalElement = document.getElementById('expensesTotalAmount');
    if (!totalElement) return;
    
    const total = expenses.reduce((sum, expense) => {
        const amount = parseFloat(expense.expenseUSD) || 0;
        return sum + amount;
    }, 0);
    
    totalElement.textContent = `$${total.toFixed(2)}`;
    
    // تحديث لون المجموع
    if (total > 0) {
        totalElement.style.color = '#dc3545'; // أحمر للنفقات
    } else {
        totalElement.style.color = '#28a745'; // أخضر للقيم الإيجابية
    }
}

// دالة لتسجيل نفقة تلقائية عند إضافة منتج
function recordProductSupplyExpense(productName, quantity, unitCost, currency = 'USD') {
    try {
        const totalCost = quantity * unitCost;
        
        // تحميل بيانات الصندوق
        const cashDrawer = loadFromStorage('cashDrawer', { transactions: [] });
        if (!cashDrawer.transactions) {
            cashDrawer.transactions = [];
        }
        
        // تحديد الوصف حسب اللغة
        const description = getText('expense-auto-product-add')
            .replace('{productName}', productName)
            .replace('{quantity}', quantity)
            .replace('{cost}', unitCost.toFixed(2));
        
        // إنشاء معاملة النفقة
        const expenseTransaction = {
            timestamp: new Date().toISOString(),
            type: 'expense',
            amount: totalCost,
            currency: currency,
            category: getText('expense-category-products'),
            description: description,
            note: description,
            user: (currentUser && currentUser.name) || 'النظام',
            exchange_rate: settings.exchangeRate || 89500,
            balanceAfter: {
                USD: cashDrawer.cashUSD || 0,
                LBP: cashDrawer.cashLBP || 0
            }
        };
        
        // إضافة المعاملة
        cashDrawer.transactions.push(expenseTransaction);
        cashDrawer.lastUpdate = new Date().toISOString();
        
        // حفظ البيانات
        saveToStorage('cashDrawer', cashDrawer);
        
        console.log('✅ تم تسجيل نفقة توريد المنتج تلقائياً:', {
            product: productName,
            quantity: quantity,
            unitCost: unitCost,
            totalCost: totalCost,
            currency: currency
        });
        
        return true;
    } catch (error) {
        console.error('خطأ في تسجيل نفقة توريد المنتج:', error);
        return false;
    }
}

// إعداد فلاتر النفقات
function setupExpensesFilters() {
    const expenses = getExpensesData();
    
    // إعداد فلاتر التصنيف
    const categoryFilter = document.getElementById('expensesCategoryFilter');
    if (categoryFilter) {
        const categories = [...new Set(expenses.map(e => e.category))];
        categoryFilter.innerHTML = '<option value="all" data-i18n="expenses-category-all"></option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            // ترجمة التصنيف للعرض
            let translatedCat = cat;
            if (cat === 'عام') {
                translatedCat = currentLanguage === 'en' ? 'General' : 'عام';
            } else if (cat === getText('expense-category-products')) {
                translatedCat = getText('expense-category-products');
            }
            option.textContent = translatedCat;
            categoryFilter.appendChild(option);
        });
        // ترجمة الخيار الأول بعد إضافته
        const firstOption = categoryFilter.querySelector('option[data-i18n="expenses-category-all"]');
        if (firstOption) firstOption.textContent = getText('expenses-category-all');
    }
    
    // إعداد فلاتر المستخدمين
    const userFilter = document.getElementById('expensesUserFilter');
    if (userFilter) {
        const users = [...new Set(expenses.map(e => e.user))];
        userFilter.innerHTML = '<option value="all" data-i18n="expenses-user-all"></option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            userFilter.appendChild(option);
        });
        // ترجمة الخيار الأول بعد إضافته
        const firstOption = userFilter.querySelector('option[data-i18n="expenses-user-all"]');
        if (firstOption) firstOption.textContent = getText('expenses-user-all');
    }
}

// ترجمة تقرير النفقات
function translateExpensesReport() {
    const t = (k) => getText(k);
    
    // ترجمة العناوين
    const headers = document.querySelectorAll('#expensesReportModal thead th');
    if (headers && headers.length >= 7) {
        headers[0].textContent = t('expenses-date-time');
        headers[1].textContent = t('expenses-category');
        headers[2].textContent = t('expenses-description');
        headers[3].textContent = t('expenses-original-amount');
        headers[4].textContent = t('expenses-exchange-rate');
        headers[5].textContent = t('expenses-amount-usd');
        headers[6].textContent = t('expenses-user');
    }
    
    // ترجمة عناصر أخرى في modal
    const modalTitle = document.querySelector('#expensesReportModal .modal-header h3 span[data-i18n="expenses-report-title"]');
    if (modalTitle) modalTitle.textContent = t('expenses-report-title');
    
    const totalLabel = document.querySelector('#expensesReportModal span[data-i18n="expenses-total"]');
    if (totalLabel) totalLabel.textContent = t('expenses-total');
    
    const categoryAll = document.querySelector('#expensesReportModal option[data-i18n="expenses-category-all"]');
    if (categoryAll) categoryAll.textContent = t('expenses-category-all');
    
    const userAll = document.querySelector('#expensesReportModal option[data-i18n="expenses-user-all"]');
    if (userAll) userAll.textContent = t('expenses-user-all');
    
    const searchPlaceholder = document.querySelector('#expensesReportModal input[data-i18n-placeholder="expenses-search-placeholder"]');
    if (searchPlaceholder) searchPlaceholder.placeholder = t('expenses-search-placeholder');
    
    const applyBtn = document.querySelector('#expensesReportModal button[data-i18n="cashbox-apply-filter"]');
    if (applyBtn) applyBtn.textContent = t('cashbox-apply-filter');
    
    const resetBtn = document.querySelector('#expensesReportModal button[data-i18n="cashbox-reset-filter"]');
    if (resetBtn) resetBtn.textContent = t('cashbox-reset-filter');
    
    const exportBtn = document.querySelector('#expensesReportModal button[data-i18n="expenses-export-csv"]');
    if (exportBtn) exportBtn.textContent = t('expenses-export-csv');
    
    const loadMoreBtn = document.querySelector('#expensesReportModal button[data-i18n="cashbox-load-more"]');
    if (loadMoreBtn) {
        const icon = loadMoreBtn.querySelector('i');
        loadMoreBtn.innerHTML = (icon ? icon.outerHTML + ' ' : '') + t('cashbox-load-more');
    }
}

// تصدير تقرير النفقات إلى CSV
function exportExpensesCsv() {
    const expenses = getExpensesData();
    const filtered = applyExpensesFilters(expenses);
    const isEn = (document.documentElement.lang || 'ar') === 'en';
    
    const headers = isEn 
        ? ['Date & Time', 'Category', 'Description', 'Original Amount', 'Exchange Rate', 'Expense (USD)', 'User']
        : ['التاريخ والوقت', 'التصنيف', 'الوصف', 'المبلغ الأصلي', 'سعر الصرف', 'المصروف (USD)', 'المستخدم'];
    
    const rows = [headers];
    
    filtered.forEach(expense => {
        const date = new Date(expense.date).toLocaleString();
        const originalAmount = expense.originalCurrency === 'USD' 
            ? `$${Math.abs(expense.originalAmount).toFixed(2)}`
            : `${Math.abs(expense.originalAmount).toLocaleString()} LBP`;
        const exchangeRate = expense.exchangeRate ? expense.exchangeRate.toString() : '';
        
        // ترجمة التصنيف للتصدير
        const translatedCategory = (expense.category === 'عام') 
            ? (isEn ? 'General' : 'عام')
            : expense.category;
        
        // ترجمة الوصف للتصدير
        const translatedDescription = (expense.description === 'تعديل يدوي للصندوق من الإعدادات' || expense.description === 'Manual cashbox adjustment from Settings') 
            ? (isEn ? 'Manual cashbox adjustment from Settings' : 'تعديل يدوي للصندوق من الإعدادات')
            : expense.description;
        
        rows.push([
            date,
            translatedCategory,
            translatedDescription,
            originalAmount,
            exchangeRate,
            expense.expenseUSD.toFixed(2),
            expense.user
        ]);
    });
    
    // إضافة إجمالي
    const total = filtered.reduce((sum, expense) => sum + expense.expenseUSD, 0);
    rows.push(['', '', '', '', '', total.toFixed(2), '']);
    
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isEn ? 'expenses_report.csv' : 'تقرير_النفقات.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// حساب فترات التاريخ
function getDateRange(preset) {
    console.log(`📋 طلب نطاق تاريخ للفترة: "${preset}"`);
    const today = new Date();
    
    // حساب بداية ونهاية الأسبوع بطريقة محسنة
    const startOfWeek = (() => {
        const d = new Date(today);
        // حساب أيام الأسبوع: الأحد=0, الاثنين=1, ..., السبت=6
        const currentDay = d.getDay();
        // حساب الأيام للرجوع إلى بداية الأسبوع (الاثنين)
        // إذا كان الأحد (0) نرجع 6 أيام للخلف
        // إذا كان الاثنين (1) نرجع 0 أيام
        // إذا كان الثلاثاء (2) نرجع 1 يوم للخلف ... إلخ
        const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
        
        d.setDate(d.getDate() - daysToSubtract);
        d.setHours(0, 0, 0, 0);
        
        console.log(`🗓️ حساب بداية الأسبوع: اليوم الحالي ${today.toLocaleDateString()} (${['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][currentDay]}), بداية الأسبوع: ${d.toLocaleDateString()}`);
        
        return d;
    })();
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    console.log(`📅 نطاق الأسبوع الحالي: ${startOfWeek.toLocaleDateString()} إلى ${endOfWeek.toLocaleDateString()}`);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0, 23,59,59,999);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth()-1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23,59,59,999);
    switch(preset){
        case 'today': {
            // استخدام الوقت المحلي الحالي تماماً دون تحويل UTC
            const now = new Date();
            
            // إنشاء بداية اليوم (00:00:00.000) باستخدام المنطقة الزمنية المحلية
            const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            
            // إنشاء نهاية اليوم (23:59:59.999) باستخدام المنطقة الزمنية المحلية
            const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            
            console.log(`📅 حساب "اليوم": ${now.toLocaleDateString()} (${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')})`);
            console.log(`📅 نطاق اليوم: ${startToday.toLocaleDateString()} ${startToday.getHours()}:${String(startToday.getMinutes()).padStart(2, '0')} إلى ${endToday.toLocaleDateString()} ${endToday.getHours()}:${String(endToday.getMinutes()).padStart(2, '0')}`);
            console.log(`📅 نطاق اليوم (ISO): من ${startToday.toISOString()} إلى ${endToday.toISOString()}`);
            
            return [startToday, endToday];
        }
        case 'this_week': 
        case 'this-week': return [startOfWeek, endOfWeek];
        case 'last_week': { const s = new Date(startOfWeek); s.setDate(s.getDate()-7); const e = new Date(endOfWeek); e.setDate(e.getDate()-7); return [s,e]; }
        case 'this_month': 
        case 'this-month': return [startOfMonth, endOfMonth];
        case 'last_month': 
        case 'last-month': return [lastMonthStart, lastMonthEnd];
        default: 
            console.log(`⚠️ فترة غير معروفة: "${preset}" - استخدام هذا الشهر كافتراضي`);
            return [startOfMonth, endOfMonth];
    }
}

function renderProfitReports() {
    console.log('🔍 بدء حساب تقرير الربح المحدث...');
    
    const preset = document.getElementById('profitPreset')?.value || 'today';
    console.log(`🎯 القيمة المحددة للفترة: "${preset}"`);
    const paymentFilter = document.getElementById('profitPaymentFilter')?.value || 'all';
    const pageSizeSel = document.getElementById('profitPageSize');
    const pageSize = parseInt(pageSizeSel?.value || localStorage.getItem('profit.pageSize') || '15') || 15;
    localStorage.setItem('profit.pageSize', String(pageSize));
    
    // احتساب نطاق التاريخ بطريقة دقيقة
    let [from, to] = getDateRange(preset);
    // إظهار حقول التاريخ فقط عند اختيار مخصص
    const fromEl = document.getElementById('profitFrom');
    const toEl = document.getElementById('profitTo');
    if (fromEl && toEl) {
        const custom = preset === 'custom';
        fromEl.style.display = custom ? '' : 'none';
        toEl.style.display = custom ? '' : 'none';
        if (custom) {
            const fV = fromEl.value ? new Date(fromEl.value) : from;
            const tV = toEl.value ? new Date(toEl.value) : to;
            from = fV; to = tV;
        }
    }
    // تأكد من صحة التواريخ
    if (!(from instanceof Date) || isNaN(from.getTime())) { 
        from = new Date(); 
        from.setHours(0, 0, 0, 0); 
    }
    if (!(to instanceof Date) || isNaN(to.getTime())) { 
        to = new Date(); 
        to.setHours(23, 59, 59, 999); 
    }
    
    // توحيد نطاق التاريخ لتجنب مشاكل التوقيت
    const fromDate = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0);
    const toDate = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
    
    // استخدام التوقيت المحلي للتشخيص
    console.log(`📅 نطاق التقرير المحلي: من ${fromDate.toLocaleDateString()} ${fromDate.getHours()}:${String(fromDate.getMinutes()).padStart(2, '0')} إلى ${toDate.toLocaleDateString()} ${toDate.getHours()}:${String(toDate.getMinutes()).padStart(2, '0')}`);
    console.log(`📊 الفترة المحددة: ${preset} - اليوم الحالي: ${new Date().toLocaleDateString()}`);
    
    // دالة محسنة للتحقق من صحة التواريخ
    function parseSaleDate(sale) {
        const saleDateValue = sale.timestamp || sale.date || sale.returnDate;
        
        if (!saleDateValue) {
            return null; // لا يوجد تاريخ للمبيع
        }
        
        try {
            let parsedDate;
            
            if (typeof saleDateValue === 'string' && saleDateValue.includes('T')) {
                // timestamp محلي بدون timezone
                if (!saleDateValue.includes('Z') && !saleDateValue.includes('+') && !saleDateValue.includes('-', 10)) {
                    const parts = saleDateValue.split('T');
                    if (parts.length === 2) {
                        const [datePart, timePart] = parts;
                        const [year, month, day] = datePart.split('-').map(Number);
                        const timeWithMs = timePart.includes('.') ? timePart : timePart + '.000';
                        const [timeOnly, ms] = timeWithMs.split('.');
                        const [hours, minutes, seconds] = timeOnly.split(':').map(Number);
                        parsedDate = new Date(year, month - 1, day, hours, minutes, seconds, Number(ms.padEnd(3, '0')));
                    } else {
                        parsedDate = new Date(saleDateValue);
                    }
                } else {
                    parsedDate = new Date(saleDateValue);
                }
            } else {
                parsedDate = new Date(saleDateValue);
            }
            
            return isNaN(parsedDate.getTime()) ? null : parsedDate;
        } catch (error) {
            console.warn('خطأ في تحليل تاريخ البيع:', sale, error);
            return null;
        }
    }
    
    // دالة محسنة للتحقق من النطاق الزمني مع تشخيص مفصل
    const isSaleInRange = (sale) => {
        const saleDate = parseSaleDate(sale);
        if (!saleDate) {
            console.log(`❌ بيع بدون تاريخ صحيح:`, sale);
            return false; // تجاهل المبيعات بدون تاريخ صحيح
        }
        
        // مقارنة دقيقة للتواريخ - استخدام window الصحيح للمنطقة الزمنية المحلية
        // start_of_day <= sale_date < start_of_next_day للمنطقة الزمنية المحلية
        const saleYear = saleDate.getFullYear();
        const saleMonth = saleDate.getMonth();
        const saleDay = saleDate.getDate();
        
        const fromYear = fromDate.getFullYear();
        const fromMonth = fromDate.getMonth();
        const fromDay = fromDate.getDate();
        
        const toYear = toDate.getFullYear();
        const toMonth = toDate.getMonth();
        const toDay = toDate.getDate();
        
        // إنشاء بداية ونهاية النطاق بالمنطقة الزمنية المحلية
        const rangeStart = new Date(fromYear, fromMonth, fromDay, 0, 0, 0, 0);
        const rangeEnd = new Date(toYear, toMonth, toDay, 23, 59, 59, 999);
        
        // التحقق من أن وقت البيع ضمن النطاق المحلي
        const isInRange = saleDate >= rangeStart && saleDate <= rangeEnd;
        
        // تشخيص مفصل للبيع باستخدام التوقيت المحلي
        if (sale.invoiceNumber) {
            // استخدام التوقيت المحلي بدلاً من ISO لتجنب مشاكل UTC
            const saleDateStr = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;
            const fromDateStr = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;
            const toDateStr = `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, '0')}-${String(toDate.getDate()).padStart(2, '0')}`;
            
            console.log(`🔍 فحص بيع ${sale.invoiceNumber}: ${saleDateStr} (من ${fromDateStr} إلى ${toDateStr}) - ضمن النطاق: ${isInRange}`);
            
            if (!isInRange) {
                console.log(`❌ بيع خارج النطاق: ${sale.invoiceNumber}`, {
                    saleDateLocal: saleDateStr,
                    saleTimestamp: sale.timestamp || sale.date,
                    fromDateLocal: fromDateStr,
                    toDateLocal: toDateStr,
                    preset: preset,
                    before: saleDate < fromDate,
                    after: saleDate > toDate,
                    saleTime: saleDate.getHours() + ':' + String(saleDate.getMinutes()).padStart(2, '0'),
                    fromTime: fromDate.getHours() + ':' + String(fromDate.getMinutes()).padStart(2, '0'),
                    toTime: toDate.getHours() + ':' + String(toDate.getMinutes()).padStart(2, '0')
                });
            }
        }
        
        return isInRange;
    };
    
    // تصفية المبيعات بناءً على النطاق الزمني والفلتر المحدد
    let filteredSales = sales.filter(sale => {
        // التحقق من صحة البيع أولاً
        if (!sale || !sale.items || !Array.isArray(sale.items) || sale.items.length === 0) {
            return false; // تجاهل المبيعات غير الصالحة
        }
        
        // التحقق من النطاق الزمني
        if (!isSaleInRange(sale)) {
            return false; // خارج النطاق الزمني
        }
        
        // التحقق من فلتر طريقة الدفع
        if (paymentFilter !== 'all') {
            if (paymentFilter === 'cash' && !/نقدي|Cash/i.test(sale.paymentMethod)) {
                return false;
            }
            if (paymentFilter === 'credit' && !/دين|credit/i.test(sale.paymentMethod)) {
                return false;
            }
            if (paymentFilter === 'partial' && !sale.partialDetails) {
                return false;
            }
        }
        
        return true;
    });
    
    console.log(`📊 عدد المبيعات الصالحة بعد التصفية: ${filteredSales.length}`);
    
    // التحقق من وجود مبيعات فعلية في الفترة المحددة
    if (filteredSales.length === 0) {
        console.log('⚠️ لا توجد مبيعات في الفترة المحددة');
        // عرض رسالة للمستخدم في حالة عدم وجود مبيعات
        const tbody = document.getElementById('profitTable');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">لا توجد مبيعات في الفترة المحددة</td></tr>';
        }
        // إعادة تعيين الملخص ليعكس عدم وجود مبيعات
        const sumEl = document.getElementById('profitSummary');
        if (sumEl) {
            sumEl.innerHTML = `
                <div class="profit-summary-item">
                    <div class="profit-summary-title" data-i18n="gross-sales">Gross Sales</div>
                    <div class="profit-summary-value">${formatCurrency(0,'USD')}</div>
                </div>
                <div class="profit-summary-item">
                    <div class="profit-summary-title" data-i18n="total-cogs">Total COGS</div>
                    <div class="profit-summary-value">${formatCurrency(0,'USD')}</div>
                </div>
                <div class="profit-summary-item">
                    <div class="profit-summary-title" data-i18n="net-profit">Net Profit</div>
                    <div class="profit-summary-value">${formatCurrency(0,'USD')}</div>
                </div>
                <div class="profit-summary-item">
                    <div class="profit-summary-title" data-i18n="invoices">Invoices</div>
                    <div class="profit-summary-value">0</div>
                </div>
                <div class="profit-summary-item">
                    <div class="profit-summary-title" data-i18n="refunds">Refunds</div>
                    <div class="profit-summary-value">0</div>
                </div>
            `;
            // تطبيق الترجمات على العناوين
            const titles = sumEl.querySelectorAll('.profit-summary-title[data-i18n]');
            titles.forEach(title => {
                const key = title.getAttribute('data-i18n');
                title.textContent = getText(key);
            });
        }
        return; // إيقاف المعالجة عند عدم وجود مبيعات
    }
    // === منطق الحساب الجديد المبني على البيانات الفعلية ===
    
    // === دالة موحدة لحساب السعر النهائي مع التحويل الصحيح للعملة ===
    function getItemFinalPrice(item) {
        // أولوية للأسعار المحدثة
        if (item.finalPriceUSD !== null && item.finalPriceUSD !== undefined) {
            return parseFloat(item.finalPriceUSD) || 0;
        }
        
        // استخدام السعر الأساسي
        if (item.priceUSD !== null && item.priceUSD !== undefined) {
            return parseFloat(item.priceUSD) || 0;
        }
        
        // البحث عن المنتج في قاعدة البيانات
        const product = products.find(p => p.id === item.id);
        if (product && product.priceUSD) {
            return parseFloat(product.priceUSD) || 0;
        }
        
        return 0;
    }
    
    // === دالة موحدة لحساب تكلفة العنصر مع التحويل الصحيح للعملة ===
    function getItemCost(item) {
        // أولوية لتكلفة العنصر المحددة
        if (item.costUSD !== null && item.costUSD !== undefined && item.costUSD > 0) {
            return parseFloat(item.costUSD);
        }
        
        // البحث عن المنتج في قاعدة البيانات
        const product = products.find(p => p.id === item.id);
        if (product && product.costUSD) {
            return parseFloat(product.costUSD) || 0;
        }
        
        return 0;
    }
    
    // متغيرات الحساب الإجمالي - سيتم إعادة حسابها من الجدول
    let totalGrossSales = 0;
    let totalCostOfGoods = 0;
    let totalInvoices = 0;
    let totalRefunds = 0;
    
    // هيكل البيانات للأيام - سيكون فارغاً حتى نحصل على بيانات فعلية
    const dailyData = {};
    
    console.log(`🔄 بدء معالجة ${filteredSales.length} مبيع صالح...`);
    
    // معالجة كل مبيع بشكل منفصل
    filteredSales.forEach((sale, index) => {
        try {
            // التحقق من صحة البيع أولاً
            if (!sale || !sale.items || !Array.isArray(sale.items) || sale.items.length === 0) {
                console.warn(`تجاهل مبيع ${index + 1}: بدون عناصر صالحة`, sale);
                return;
            }
            
            // تحديد ما إذا كان مرتجع
            const isRefund = sale.returned === true;
            const sign = isRefund ? -1 : 1;
            
            // الحصول على تاريخ البيع الصحيح
            const saleDate = parseSaleDate(sale);
            if (!saleDate) {
                console.warn(`تجاهل مبيع ${index + 1}: تاريخ غير صحيح`, sale);
                return;
            }
            
            // تحديد مفتاح اليوم باستخدام التوقيت المحلي
            const dayKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;
            
            console.log(`📅 إنشاء مفتاح اليوم: ${dayKey} من تاريخ البيع: ${saleDate.toLocaleDateString()}`);
            
            // تهيئة بيانات اليوم إذا لم تكن موجودة
            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {
                    date: dayKey,
                    invoiceCount: 0,
                    refundCount: 0,
                    grossSales: 0,
                    costOfGoods: 0,
                    netProfit: 0,
                    sales: []
                };
            }
            
            // حساب مبالغ هذا البيع
            let saleGross = 0;
            let saleCost = 0;
            let hasValidItems = false;
            
            // معالجة كل عنصر في البيع
            sale.items.forEach(item => {
                const quantity = parseInt(item.quantity) || 1;
                const itemPrice = getItemFinalPrice(item);
                const itemCost = getItemCost(item);
                
                // تطبيق المعادلات الصحيحة
                // sales_total = SUM(line.qty * line.price_after_discount_tax_included)
                // cost_total = SUM(line.qty * line.cost)
                const totalPrice = itemPrice * quantity;
                const totalCost = itemCost * quantity;
                
                saleGross += totalPrice;
                saleCost += totalCost;
                hasValidItems = true;
                
                console.log(`📊 عنصر: ${item.name || item.id}, كمية: ${quantity}, سعر: ${itemPrice.toFixed(2)}$, تكلفة: ${itemCost.toFixed(2)}$, إجمالي: ${totalPrice.toFixed(2)}$, تكلفة إجمالية: ${totalCost.toFixed(2)}$`);
            });
            
            // إذا كان هناك عناصر صالحة، أضف البيانات
            if (hasValidItems) {
                // تطبيق الإشارة للمرتجع
                const finalGross = saleGross * sign;
                const finalCost = saleCost * sign;
                
                // تحديث بيانات اليوم
                dailyData[dayKey].grossSales += finalGross;
                dailyData[dayKey].costOfGoods += finalCost;
                dailyData[dayKey].netProfit = dailyData[dayKey].grossSales - dailyData[dayKey].costOfGoods;
                
                if (isRefund) {
                    dailyData[dayKey].refundCount++;
                    totalRefunds++;
                } else {
                    dailyData[dayKey].invoiceCount++;
                    totalInvoices++;
                }
                
                // إضافة البيع إلى قائمة مبيعات اليوم
                dailyData[dayKey].sales.push({
                    invoiceNumber: sale.invoiceNumber || `INV-${sale.id}`,
                    timestamp: saleDate,
                    gross: finalGross,
                    cost: finalCost,
                    profit: finalGross - finalCost,
                    isRefund: isRefund
                });
                
                // تحديث الإجمالي العام
                totalGrossSales += finalGross;
                totalCostOfGoods += finalCost;
                
                console.log(`✅ تم معالجة ${isRefund ? 'مرتجع' : 'بيع'} ${sale.invoiceNumber || sale.id}: إجمالي ${finalGross.toFixed(2)}$ تكلفة ${finalCost.toFixed(2)}$`);
            }
        } catch (error) {
            console.error(`خطأ في معالجة المبيع ${index + 1}:`, error, sale);
        }
    });
    
    // === الحل الجذري: حساب المجاميع من نفس البيانات المعروضة في الجدول ===
    
    // الحصول على الأيام التي تحتوي على بيانات فعلية فقط (نفس منطق الجدول)
    const validDays = Object.values(dailyData).filter(day => {
        // اليوم صالح فقط إذا كان لديه مبيعات فعلية أو إيرادات
        return day.invoiceCount > 0 || day.grossSales > 0 || day.refundCount > 0;
    });
    
    // ترتيب الأيام من الأحدث للأقدم
    validDays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`📋 عرض ${validDays.length} يوم مع بيانات فعلية`);
    
    // === حساب المجاميع من نفس البيانات المعروضة في الجدول ===
    
    // إعادة حساب المجاميع من صفوف الجدول الفعلية فقط
    totalGrossSales = 0;
    totalCostOfGoods = 0;
    totalInvoices = 0;
    totalRefunds = 0;
    
    // حساب المجاميع من نفس البيانات المعروضة في الجدول
    validDays.forEach(day => {
        totalGrossSales += day.grossSales;
        totalCostOfGoods += day.costOfGoods;
        totalInvoices += day.invoiceCount;
        totalRefunds += day.refundCount;
    });
    
    // حساب الربح الصافي الإجمالي
    const totalNetProfit = totalGrossSales - totalCostOfGoods;
    
    console.log(`📊 ملخص التقرير النهائي (محسوب من نفس بيانات الجدول):`, {
        totalGrossSales: totalGrossSales.toFixed(2),
        totalCostOfGoods: totalCostOfGoods.toFixed(2),
        totalNetProfit: totalNetProfit.toFixed(2),
        totalInvoices: totalInvoices,
        totalRefunds: totalRefunds,
        daysWithSales: validDays.length
    });
    
    // عرض الملخص باستخدام البيانات المحسوبة من نفس بيانات الجدول
    const sumEl = document.getElementById('profitSummary');
    if (sumEl) {
        const netClass = totalNetProfit >= 0 ? 'positive' : 'negative';
        sumEl.innerHTML = `
            <div class="profit-summary-item">
                <div class="profit-summary-title" data-i18n="gross-sales">Gross Sales</div>
                <div class="profit-summary-value">${formatCurrency(totalGrossSales,'USD')}</div>
            </div>
            <div class="profit-summary-item">
                <div class="profit-summary-title" data-i18n="total-cogs">Total COGS</div>
                <div class="profit-summary-value">${formatCurrency(totalCostOfGoods,'USD')}</div>
            </div>
            <div class="profit-summary-item">
                <div class="profit-summary-title" data-i18n="net-profit">Net Profit</div>
                <div class="profit-summary-value ${netClass}">${formatCurrency(totalNetProfit,'USD')}</div>
            </div>
            <div class="profit-summary-item">
                <div class="profit-summary-title" data-i18n="invoices">Invoices</div>
                <div class="profit-summary-value">${totalInvoices}</div>
            </div>
            <div class="profit-summary-item">
                <div class="profit-summary-title" data-i18n="refunds">Refunds</div>
                <div class="profit-summary-value">${totalRefunds}</div>
            </div>
        `;
        
        // تطبيق الترجمات على العناوين
        const titles = sumEl.querySelectorAll('.profit-summary-title[data-i18n]');
        titles.forEach(title => {
            const key = title.getAttribute('data-i18n');
            title.textContent = getText(key);
        });
    }
    
    // تطبيق التنقل بالصفحات
    const totalDays = validDays.length;
    const totalPages = Math.max(1, Math.ceil(totalDays / pageSize));
    let currentPage = parseInt(sessionStorage.getItem('profit.currentPage') || '1') || 1;
    currentPage = Math.max(1, Math.min(totalPages, currentPage));
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageDays = validDays.slice(start, end);
    
    // عرض الجدول
    const tbody = document.getElementById('profitTable');
    if (tbody) {
        if (pageDays.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">لا توجد بيانات للعرض</td></tr>';
        } else {
            tbody.innerHTML = pageDays.map(day => {
                const totalInvoices = day.invoiceCount + day.refundCount;
                return `
                    <tr>
                        <td>${day.date}</td>
                        <td>${totalInvoices}</td>
                        <td>${formatCurrency(day.grossSales, 'USD')}</td>
                        <td>${formatCurrency(day.costOfGoods, 'USD')}</td>
                        <td>${formatCurrency(day.netProfit, 'USD')}</td>
                    </tr>
                `;
            }).join('');
        }
    }
    
    // === التحقق من التطابق الدقيق بين المجاميع والجدول ===
    
    // حساب المجاميع من صفوف الجدول المعروضة للتأكد من التطابق
    let tableGrossSales = 0;
    let tableCostOfGoods = 0;
    let tableInvoices = 0;
    let tableRefunds = 0;
    
    validDays.forEach(day => {
        tableGrossSales += day.grossSales;
        tableCostOfGoods += day.costOfGoods;
        tableInvoices += day.invoiceCount;
        tableRefunds += day.refundCount;
    });
    
    const tableNetProfit = tableGrossSales - tableCostOfGoods;
    
    // التحقق من التطابق الدقيق
    const grossMatch = Math.abs(totalGrossSales - tableGrossSales) < 0.01;
    const costMatch = Math.abs(totalCostOfGoods - tableCostOfGoods) < 0.01;
    const profitMatch = Math.abs(totalNetProfit - tableNetProfit) < 0.01;
    const invoiceMatch = totalInvoices === tableInvoices;
    const refundMatch = totalRefunds === tableRefunds;
    
    console.log(`🔍 التحقق من التطابق الدقيق:`, {
        'المجاميع من الملخص': {
            grossSales: totalGrossSales.toFixed(2),
            costOfGoods: totalCostOfGoods.toFixed(2),
            netProfit: totalNetProfit.toFixed(2),
            invoices: totalInvoices,
            refunds: totalRefunds
        },
        'المجاميع من الجدول': {
            grossSales: tableGrossSales.toFixed(2),
            costOfGoods: tableCostOfGoods.toFixed(2),
            netProfit: tableNetProfit.toFixed(2),
            invoices: tableInvoices,
            refunds: tableRefunds
        },
        'التطابق': {
            grossSales: grossMatch ? '✅' : '❌',
            costOfGoods: costMatch ? '✅' : '❌',
            netProfit: profitMatch ? '✅' : '❌',
            invoices: invoiceMatch ? '✅' : '❌',
            refunds: refundMatch ? '✅' : '❌'
        }
    });
    
    if (!grossMatch || !costMatch || !profitMatch || !invoiceMatch || !refundMatch) {
        console.error('❌ خطأ: المجاميع لا تطابق الجدول!');
        console.error('المجاميع من الملخص:', totalGrossSales, totalCostOfGoods, totalNetProfit, totalInvoices, totalRefunds);
        console.error('المجاميع من الجدول:', tableGrossSales, tableCostOfGoods, tableNetProfit, tableInvoices, tableRefunds);
    } else {
        console.log('✅ تم التحقق: المجاميع تطابق الجدول بالضبط (سنت بسنت)');
    }
    // عداد وترقيم
    const info = document.getElementById('profitCountInfo');
    if (info) {
        const endRange = Math.min(totalDays, start + pageSize);
        info.textContent = `عرض ${start + 1}–${endRange} من إجمالي ${totalDays}`;
    }
    
    const pager = document.getElementById('profitPager');
    if (pager) {
        // بناء أزرار
        let controls = document.getElementById('profitPagerControls');
        if (!controls) { controls = document.createElement('div'); controls.id='profitPagerControls'; controls.style.display='inline-flex'; controls.style.gap='6px'; pager.appendChild(controls); }
        controls.innerHTML='';
        function btn(lbl,p,dis){ const b=document.createElement('button'); b.textContent=lbl; b.className='action-btn'; b.disabled=!!dis; b.onclick=()=>{ sessionStorage.setItem('profit.currentPage', String(p)); renderProfitReports(); }; return b; }
        controls.appendChild(btn('الأول',1,currentPage===1));
        controls.appendChild(btn('السابق',Math.max(1,currentPage-1),currentPage===1));
        const win=5; const sp=Math.max(1,currentPage-Math.floor(win/2)); const ep=Math.min(totalPages,sp+win-1);
        for(let p=sp;p<=ep;p++){ const b=btn(String(p),p,p===currentPage); if(p===currentPage){ b.style.background='#3b82f6'; b.style.color='#fff'; } controls.appendChild(b); }
        controls.appendChild(btn('التالي',Math.min(totalPages,currentPage+1),currentPage===totalPages));
        controls.appendChild(btn('الأخير',totalPages,currentPage===totalPages));
    }
}

function renderInventoryCapital() {
    const pageSizeSel = document.getElementById('capitalPageSize');
    const pageSize = parseInt(pageSizeSel?.value || localStorage.getItem('capital.pageSize') || '15') || 15;
    localStorage.setItem('capital.pageSize', String(pageSize));
    const rows = products.map(p => ({
        name: p.name,
        qty: p.stock || 0,
        unitCost: p.costUSD || 0,
        value: (p.stock || 0) * (p.costUSD || 0)
    })).sort((a,b)=> b.value - a.value);
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    let currentPage = parseInt(sessionStorage.getItem('capital.currentPage')||'1')||1;
    currentPage = Math.max(1, Math.min(totalPages, currentPage));
    const start = (currentPage-1)*pageSize;
    const pageRows = rows.slice(start, start+pageSize);
    const tbody = document.getElementById('capitalTable');
    if (tbody) tbody.innerHTML = pageRows.map(r => `<tr><td>${r.name}</td><td>${r.qty}</td><td>${formatCurrency(r.unitCost,'USD')}</td><td>${formatCurrency(r.value,'USD')}</td></tr>`).join('');
    const sum = rows.reduce((s,r)=> s+r.value, 0);
    const sumEl = document.getElementById('capitalSummary');
    if (sumEl) {
        sumEl.innerHTML = `
            <div class="capital-summary-item">
                <div class="capital-summary-title" data-i18n="total-capital">إجمالي رأس المال</div>
                <div class="capital-summary-value">${formatCurrency(sum,'USD')}</div>
            </div>
        `;
        
        // تطبيق الترجمات على العناوين
        const titles = sumEl.querySelectorAll('.capital-summary-title[data-i18n]');
        titles.forEach(title => {
            const key = title.getAttribute('data-i18n');
            title.textContent = getText(key);
        });
    }
    const info = document.getElementById('capitalCountInfo');
    if (info) info.textContent = `عرض ${start+1}–${Math.min(total, start+pageSize)} من إجمالي ${total}`;
    const pager = document.getElementById('capitalPager');
    if (pager) {
        let controls = document.getElementById('capitalPagerControls');
        if (!controls) { controls = document.createElement('div'); controls.id='capitalPagerControls'; controls.style.display='inline-flex'; controls.style.gap='6px'; pager.appendChild(controls); }
        controls.innerHTML='';
        function btn(lbl,p,dis){ const b=document.createElement('button'); b.textContent=lbl; b.className='action-btn'; b.disabled=!!dis; b.onclick=()=>{ sessionStorage.setItem('capital.currentPage', String(p)); renderInventoryCapital(); }; return b; }
        controls.appendChild(btn('الأول',1,currentPage===1));
        controls.appendChild(btn('السابق',Math.max(1,currentPage-1),currentPage===1));
        const totalPages2 = totalPages; const win=5; const sp=Math.max(1,currentPage-Math.floor(win/2)); const ep=Math.min(totalPages2,sp+win-1);
        for(let p=sp;p<=ep;p++){ const b=btn(String(p),p,p===currentPage); if(p===currentPage){ b.style.background='#3b82f6'; b.style.color='#fff'; } controls.appendChild(b); }
        controls.appendChild(btn('التالي',Math.min(totalPages2,currentPage+1),currentPage===totalPages2));
        controls.appendChild(btn('الأخير',totalPages2,currentPage===totalPages2));
    }
}

function exportProfitCSV(){
    try{
        const rows = document.querySelectorAll('#profitTable tr');
        let csv = 'Date,Invoices,Gross,COGS,Net\n';
        rows.forEach(r=>{ const c=r.querySelectorAll('td'); if(c.length) csv += `${c[0].textContent},${c[1].textContent},${c[2].textContent},${c[3].textContent},${c[4].textContent}\n`; });
        const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='profit_report.csv'; a.click(); URL.revokeObjectURL(url);
    }catch(e){ console.warn(e); }
}
function exportProfitPDF(){
    console.log('🖨️ بدء طباعة تقرير الأرباح...');
    
    try {
        // إنشاء نافذة طباعة محسنة لتقرير الأرباح
        const printWindow = window.open('', '_blank', 'width=800,height=1000');
        
        if (!printWindow) {
            console.error('❌ فشل في فتح نافذة الطباعة');
            showMessage('فشل في فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة.', 'error');
            return;
        }
        
        // الحصول على محتوى التقرير
        const profitSummary = document.getElementById('profitSummary');
        const profitTable = document.getElementById('profitTable');
        
        if (!profitSummary || !profitTable) {
            console.error('❌ لم يتم العثور على محتوى التقرير');
            showMessage('خطأ: لم يتم العثور على محتوى التقرير', 'error');
            printWindow.close();
            return;
        }
        
        const reportHTML = `
        <!DOCTYPE html>
        <html dir="${document.documentElement.dir || 'rtl'}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير الأرباح - ${settings.storeName || 'POS System'}</title>
            <style>
                @page { 
                    size: A4; 
                    margin: 20mm; 
                }
                body { 
                    font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    color: #333; 
                    line-height: 1.6;
                }
                .report-header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #333; 
                    padding-bottom: 20px; 
                }
                .report-title { 
                    font-size: 24px; 
                    font-weight: bold; 
                    margin-bottom: 10px; 
                }
                .report-date { 
                    font-size: 14px; 
                    color: #666; 
                }
                .summary-section { 
                    margin-bottom: 30px; 
                    padding: 20px; 
                    background: #f8f9fa; 
                    border-radius: 8px; 
                }
                .summary-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                    gap: 20px; 
                }
                .summary-item { 
                    text-align: center; 
                    padding: 15px; 
                    background: white; 
                    border-radius: 6px; 
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
                }
                .summary-title { 
                    font-size: 14px; 
                    color: #666; 
                    margin-bottom: 8px; 
                }
                .summary-value { 
                    font-size: 20px; 
                    font-weight: bold; 
                    color: #333; 
                }
                .table-section { 
                    margin-top: 30px; 
                }
                .table-title { 
                    font-size: 18px; 
                    font-weight: bold; 
                    margin-bottom: 15px; 
                }
                .report-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 20px; 
                }
                .report-table th, 
                .report-table td { 
                    padding: 12px; 
                    text-align: left; 
                    border: 1px solid #ddd; 
                }
                .report-table th { 
                    background: #f8f9fa; 
                    font-weight: bold; 
                }
                .report-table tr:nth-child(even) { 
                    background: #f8f9fa; 
                }
                .footer { 
                    margin-top: 30px; 
                    text-align: center; 
                    font-size: 12px; 
                    color: #666; 
                    border-top: 1px solid #ddd; 
                    padding-top: 20px; 
                }
                @media print { 
                    body { 
                        margin: 0; 
                        padding: 0; 
                    }
                    .summary-grid { 
                        grid-template-columns: repeat(5, 1fr); 
                    }
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <div class="report-title">تقرير الأرباح</div>
                <div class="report-date">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</div>
            </div>
            
            <div class="summary-section">
                <div class="summary-grid">
                    ${profitSummary.innerHTML}
                </div>
            </div>
            
            <div class="table-section">
                <div class="table-title">تفاصيل الأرباح اليومية</div>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>عدد الفواتير</th>
                            <th>إجمالي المبيعات</th>
                            <th>إجمالي الكلفة</th>
                            <th>صافي الربح</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${profitTable.innerHTML}
                    </tbody>
                </table>
            </div>
            
            <div class="footer">
                <p>تم إنشاء التقرير بواسطة: ${settings.storeName || 'POS System'}</p>
                <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')}</p>
            </div>
        </body>
        </html>
        `;
        
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        
        // انتظار تحميل المحتوى ثم الطباعة
        printWindow.onload = function() {
            console.log('✅ تم تحميل محتوى التقرير، بدء الطباعة...');
            setTimeout(() => {
                try {
                    printWindow.focus();
                    printWindow.print();
                    
                    // إغلاق النافذة بعد الطباعة
                    setTimeout(() => {
                        printWindow.close();
                        console.log('✅ تم إغلاق نافذة الطباعة');
                    }, 1000);
                } catch (printError) {
                    console.error('❌ خطأ في الطباعة:', printError);
                    showMessage('خطأ في الطباعة: ' + printError.message, 'error');
                    printWindow.close();
                }
            }, 500);
        };
        
        // معالجة الأخطاء
        printWindow.onerror = function(error) {
            console.error('❌ خطأ في نافذة الطباعة:', error);
            showMessage('خطأ في نافذة الطباعة', 'error');
            printWindow.close();
        };
        
    } catch (error) {
        console.error('❌ خطأ عام في طباعة التقرير:', error);
        showMessage('خطأ في طباعة التقرير: ' + error.message, 'error');
    }
}
// تعديل سعر عنصر في العربة وإظهار مقدار الخصم
// Enhanced price editing flow: allow typing freely, validate on blur/enter/confirm
function updateItemCustomPrice(index, value, options = {}) {
    // options: {confirmFlow:false} internal flag
    const item = cart[index];
    if (!item) return;
    const currencySel = document.getElementById('currency');
    const currency = currencySel ? currencySel.value : 'USD';

    // store previous price for possible rollback
    if (typeof item._previousPriceUSD !== 'number') {
        item._previousPriceUSD = (typeof item.customPriceUSD === 'number') ? item.customPriceUSD : getProductPrice(item, item.selectedPriceType || currentPriceType, 'USD');
    }

    // do not block typing: just set a temp typed value on the item for display
    const typedRaw = String(value || '').trim();
    // parse numeric value safely
    const parsedNumber = Number(String(typedRaw).replace(/[^0-9.]/g, ''));
    const typedNumeric = isNaN(parsedNumber) ? null : parsedNumber;

    // when called from oninput, just set a temporary display value and return
    if (!options || !options.confirmFlow) {
        // set a transient property to reflect in UI rendering if needed
        item._typedPriceDisplay = typedRaw;
        // do not set item.customPriceUSD yet
        // if typedNumeric is null, do not update
        if (typedNumeric == null) return;
        // set a working value for immediate preview but do not validate
        item._workingPriceUSD = (currency === 'USD') ? typedNumeric : (typedNumeric / (settings.exchangeRate || 1));
        // DO NOT re-render the whole cart here (that causes the input to re-render and blur while typing)
        // Instead rely on autosizePriceInput(...) already called by the input event to adjust width.
        return;
    }

    // confirmFlow: user pressed Enter/blur or saved -> perform validation and commit
    const newNum = typedNumeric == null ? 0 : typedNumeric;
    const newPriceUSD = currency === 'USD' ? newNum : (newNum / (settings.exchangeRate || 1));
    const basePriceUSD = getProductPrice(item, item.selectedPriceType || currentPriceType, 'USD');
    const cost = item.costUSD || 0;

    // if new price is less than cost, show modal confirm
    if (cost && newPriceUSD < cost) {
        // prepare modal
        const modal = document.getElementById('priceWarningModal');
        const text = document.getElementById('priceWarningText');
        if (text) text.textContent = (document.documentElement.lang || 'ar') === 'en'
            ? `Warning: The price you entered (${formatCurrency(newNum, currency)}) is below cost (${formatCurrency(cost, 'USD')}). Proceed?` 
            : `تنبيه: السعر الذي أدخلته (${formatCurrency(newNum, currency)}) أقل من سعر الكلفة (${formatCurrency(cost, 'USD')}). هل تريد المتابعة؟`;
        // show modal
        if (modal) modal.style.display = 'block';

        // handlers
        const yesBtn = document.getElementById('priceWarningYes');
        const noBtn = document.getElementById('priceWarningNo');
        const closeBtn = document.getElementById('closePriceWarningModal');

        function cleanup() {
            if (modal) modal.style.display = 'none';
            if (yesBtn) yesBtn.onclick = null;
            if (noBtn) noBtn.onclick = null;
            if (closeBtn) closeBtn.onclick = null;
        }

        if (yesBtn) yesBtn.onclick = function(){
            // accept new price
            item.customPriceUSD = newPriceUSD;
            // remove temp fields
            delete item._workingPriceUSD; delete item._typedPriceDisplay; delete item._previousPriceUSD;
            cleanup(); updateCart();
        };
        if (noBtn) noBtn.onclick = function(){
            // rollback to previous price
            item.customPriceUSD = item._previousPriceUSD;
            delete item._workingPriceUSD; delete item._typedPriceDisplay; delete item._previousPriceUSD;
            cleanup(); updateCart();
        };
        if (closeBtn) closeBtn.onclick = function(){
            // treat as cancel
            if (noBtn) noBtn.onclick();
        };

        return;
    }

    // otherwise commit silently
    console.log(`🔄 تحديث السعر المخصص للمنتج ${item.name}: من $${item.customPriceUSD || 'غير محدد'} إلى $${newPriceUSD}`);
    item.customPriceUSD = newPriceUSD;
    delete item._workingPriceUSD; delete item._typedPriceDisplay; delete item._previousPriceUSD;
    console.log(`✅ تم حفظ السعر المخصص: $${item.customPriceUSD}`);
    updateCart();
    console.log(`🔄 تم تحديث العربة بعد تعديل السعر`);
}

// ضبط عرض حقل السعر ديناميكياً حسب طول الرقم
function autosizePriceInput(el) {
    if (!el) return;
    const len = String(el.value || '').length;
    // وفر مساحة إضافية للاحقة العملة داخل الحقل
    const ch = Math.max(7, Math.min(16, len + 4));
    el.style.width = ch + 'ch';
}

// دالة لزيادة السعر
function increasePrice(index) {
    const el = document.getElementById(`customPrice_${index}`);
    if (!el) return;
    
    const currentValue = parseFloat(el.value) || 0;
    const newValue = currentValue + 1;
    el.value = newValue;
    autosizePriceInput(el);
    updateItemCustomPrice(index, el.value);
}

// دالة لتقليل السعر
function decreasePrice(index) {
    const el = document.getElementById(`customPrice_${index}`);
    if (!el) return;
    
    const currentValue = parseFloat(el.value) || 0;
    const newValue = Math.max(0, currentValue - 1);
    el.value = newValue;
    autosizePriceInput(el);
    updateItemCustomPrice(index, el.value);
}

// تسجيل حركة مخزون بسيطة (بيع/استرجاع)
function recordStockMovement(type, productId, quantity, invoiceNumber, note) {
    try {
        const movements = loadFromStorage('stockMovements', []);
        movements.push({
            timestamp: new Date().toISOString(),
            type, // 'sale' | 'refund' | 'adjustment'
            productId,
            quantity,
            invoiceNumber,
            note
        });
        saveToStorage('stockMovements', movements);
    } catch (e) {
        console.warn('recordStockMovement failed:', e);
    }
}

// إظهار/إخفاء حقل تعديل السعر
function togglePriceEdit(index) {
    const wrap = document.getElementById(`editPriceWrap_${index}`);
    if (!wrap) return;
    const visible = wrap.style.display !== 'none';
    wrap.style.display = visible ? 'none' : 'flex';
    if (!visible) {
        const input = document.getElementById(`customPrice_${index}`);
        if (input) {
            input.focus();
            input.select();
        }
    }
}

// تحرير سريع عبر نافذة منبثقة (مناسب للزوم المنخفض)
// بيانات النظام
let currentUser = null;
let currentPriceType = 'retail'; // retail, wholesale, vip
let currentLanguage = 'ar'; // ar, en

// نظام تحذير الاشتراك
let lastWarningTime = 0;
const WARNING_INTERVAL = 30 * 60 * 1000; // 30 دقيقة بالميلي ثانية

// دالة التحقق من تحذيرات الاشتراك
function checkSubscriptionWarnings() {
    const state = loadLicenseState();
    if (!state.activated || state.lifetime) return;
    
    const daysLeft = computeDaysLeft(state);
    const now = Date.now();
    
    // التحقق من التحذير كل 30 دقيقة
    if (daysLeft <= 10 && daysLeft > 0 && (now - lastWarningTime) >= WARNING_INTERVAL) {
        const currentLang = document.documentElement.lang || currentLanguage || 'ar';
        const isEn = currentLang === 'en';
        
        let message, title;
        if (daysLeft <= 3) {
            title = isEn ? 'URGENT: Subscription Expires Soon!' : 'عاجل: الاشتراك ينتهي قريباً!';
            message = isEn 
                ? `Your subscription expires in ${daysLeft} day(s)! Contact +96171783701 immediately.`
                : `اشتراكك ينتهي خلال ${daysLeft} يوم! اتصل بـ +96171783701 فوراً.`;
        } else if (daysLeft <= 7) {
            title = isEn ? 'Warning: Subscription Expires Soon!' : 'تحذير: الاشتراك ينتهي قريباً!';
            message = isEn 
                ? `Your subscription expires in ${daysLeft} days. Contact +96171783701 to renew.`
                : `اشتراكك ينتهي خلال ${daysLeft} أيام. اتصل بـ +96171783701 للتجديد.`;
        } else {
            title = isEn ? 'Reminder: Subscription Expires Soon' : 'تذكير: الاشتراك ينتهي قريباً';
            message = isEn 
                ? `Your subscription expires in ${daysLeft} days. Contact +96171783701 to renew.`
                : `اشتراكك ينتهي خلال ${daysLeft} أيام. اتصل بـ +96171783701 للتجديد.`;
        }
        
        // إظهار الإشعار
        showNotification(message, 'warning', 10000);
        
        // تحديث وقت آخر تحذير
        lastWarningTime = now;
        
        // حفظ وقت التحذير في localStorage
        localStorage.setItem('lastWarningTime', lastWarningTime.toString());
    }
}

// تحميل وقت آخر تحذير عند بدء النظام
function loadLastWarningTime() {
    try {
        const saved = localStorage.getItem('lastWarningTime');
        if (saved) {
            lastWarningTime = parseInt(saved);
        }
    } catch (e) {
        console.warn('Could not load last warning time:', e);
    }
}

// دالة لإنشاء ترخيص تجريبي للاختبار - معطلة لإزالة الفترة التجريبية
// function createTestLicense(daysLeft = 5) {
//     const now = new Date();
//     const endDate = new Date(now.getTime() + (daysLeft * 24 * 60 * 60 * 1000));
//     
//     const testState = {
//         activated: true,
//         type: 'TRIAL',
//         start_at: now.toISOString(),
//         end_at: endDate.toISOString(),
//         lifetime: false,
//         used_codes: ['test'],
//         days_left: daysLeft,
//         last_tick_utc: now.toISOString()
//     };
//     
//     console.log('Creating test license:', testState);
//     saveLicenseState(testState);
//     
//     // التأكد من تحديث العرض
//     setTimeout(() => {
//         updateSettingsLicenseDisplay();
//         console.log('License display updated');
//     }, 100);
//     
//     console.log(`Test license created with ${daysLeft} days left`);
// }

// دالة لاختبار النظام يدوياً - معطلة لإزالة الفترة التجريبية
function testLicenseSystem() {
    console.log('Testing license system...');
    const state = loadLicenseState();
    console.log('Current license state:', state);
    
    const el = document.getElementById('licenseDaysLeft');
    console.log('License display element:', el);
    
    if (el) {
        console.log('Current element text:', el.textContent);
        console.log('Current element class:', el.className);
    }
    
    // إنشاء ترخيص تجريبي - معطل
    // createTestLicense(8);
    
    // التحقق مرة أخرى
    setTimeout(() => {
        const newState = loadLicenseState();
        console.log('New license state:', newState);
        
        if (el) {
            console.log('New element text:', el.textContent);
            console.log('New element class:', el.className);
        }
    }, 200);
}

// دالة لاختبار مباشر
// دالة اختبار معطلة - لإزالة الفترة التجريبية
// function testDirect() {
//     console.log('=== DIRECT TEST ===');
//     
//     // إنشاء ترخيص
//     const now = new Date();
//     const endDate = new Date(now.getTime() + (8 * 24 * 60 * 60 * 1000));
//     
//     const testState = {
//         activated: true,
//         type: 'TRIAL',
//         start_at: now.toISOString(),
//         end_at: endDate.toISOString(),
//         lifetime: false,
//         used_codes: ['test'],
//         days_left: 8,
//         last_tick_utc: now.toISOString()
//     };
//     
//     console.log('Test state:', testState);
//     
//     // حفظ مباشر
//     localStorage.setItem('license_state', JSON.stringify(testState));
//     console.log('Saved to localStorage');
//     
//     // تحديث العرض مباشرة
//     const el = document.getElementById('licenseDaysLeft');
//     if (el) {
//         el.textContent = '8 يوم متبقي';
//         el.className = 'license-days warn';
//         console.log('Updated element directly');
//         console.log('Element text:', el.textContent);
//         console.log('Element class:', el.className);
//     } else {
//         console.error('Element not found!');
//     }
// }

// ---------------- License management ----------------
const LICENSE_STATE_KEY = 'license_state';
const ACTIVATION_TOKEN_KEY = 'delta_activation_token'; // مفتاح التفعيل الجديد

// دالة مركزية للتحقق من التفعيل
function isActivated() {
    try {
        // التحقق من وجود التوكن
        const token = localStorage.getItem(ACTIVATION_TOKEN_KEY);
        if (!token) {
            console.log('❌ لا يوجد توكن تفعيل');
            return false;
        }
        
        // التحقق من صحة التوكن
        const tokenData = JSON.parse(token);
        if (!tokenData || !tokenData.activated) {
            console.log('❌ توكن التفعيل غير صالح');
            return false;
        }
        
        // التحقق من انتهاء الصلاحية (إذا لم يكن مدى الحياة)
        if (!tokenData.lifetime && tokenData.end_at) {
            const now = new Date();
            const endDate = new Date(tokenData.end_at);
            if (now > endDate) {
                console.log('❌ توكن التفعيل منتهي الصلاحية');
                return false;
            }
        }
        
        console.log('✅ النظام مفعّل');
        return true;
    } catch (error) {
        console.error('خطأ في التحقق من التفعيل:', error);
        return false;
    }
}

// دالة لإنشاء توكن التفعيل
function createActivationToken(licenseData) {
    try {
        const tokenData = {
            activated: true,
            type: licenseData.type,
            start_at: licenseData.start_at,
            end_at: licenseData.end_at,
            lifetime: licenseData.lifetime,
            created_at: new Date().toISOString()
        };
        
        localStorage.setItem(ACTIVATION_TOKEN_KEY, JSON.stringify(tokenData));
        console.log('✅ تم إنشاء توكن التفعيل');
        return true;
    } catch (error) {
        console.error('خطأ في إنشاء توكن التفعيل:', error);
        return false;
    }
}

// دالة لمسح توكن التفعيل
function clearActivationToken() {
    try {
        localStorage.removeItem(ACTIVATION_TOKEN_KEY);
        console.log('✅ تم مسح توكن التفعيل');
        return true;
    } catch (error) {
        console.error('خطأ في مسح توكن التفعيل:', error);
        return false;
    }
}

// حارس التفعيل عند تحميل الصفحة
function checkActivationOnPageLoad() {
    console.log('🔍 فحص التفعيل عند تحميل الصفحة...');
    
    // إذا لم يكن النظام مفعلاً، تأكد من عرض شاشة التفعيل
    if (!isActivated()) {
        console.log('❌ النظام غير مفعّل - عرض شاشة التفعيل');
        
        // إخفاء الشاشة الرئيسية إذا كانت ظاهرة
        const mainScreen = document.getElementById('mainScreen');
        const loginScreen = document.getElementById('loginScreen');
        const activationCard = document.getElementById('activationCard');
        
        if (mainScreen) {
            mainScreen.classList.remove('active');
        }
        
        if (loginScreen) {
            loginScreen.classList.add('active');
        }
        
        if (activationCard) {
            activationCard.style.display = '';
        }
        
        // تعطيل زر تسجيل الدخول مؤقتاً
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        if (loginBtn) {
            loginBtn.style.opacity = '0.5';
            loginBtn.style.cursor = 'not-allowed';
            loginBtn.title = 'النظام غير مفعّل - يرجى إدخال كود التفعيل أولاً';
        }
        
        // رسالة توضيحية
        const currentLang = document.documentElement.lang || localStorage.getItem('appLanguage') || 'ar';
        const isEn = currentLang === 'en';
        
        const message = isEn 
            ? '🔒 System requires activation. Please enter activation code to continue.'
            : '🔒 يتطلب النظام تفعيلاً. يرجى إدخال كود التفعيل للمتابعة.';
        
        // عرض رسالة تأخير لتجنب التداخل مع تحميل الصفحة
        setTimeout(() => {
            showMessage(message, 'warning');
        }, 1000);
        
    } else {
        console.log('✅ النظام مفعّل - متابعة التحميل العادي');
        
        // تفعيل زر تسجيل الدخول
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        if (loginBtn) {
            loginBtn.style.opacity = '1';
            loginBtn.style.cursor = 'pointer';
            loginBtn.title = '';
        }
    }
}

// حارس التفعيل المستمر أثناء الجلسة
function checkActivationDuringSession() {
    // التحقق فقط إذا كان المستخدم مسجل دخول
    if (!currentUser) {
        return;
    }
    
    // التحقق من التفعيل
    if (!isActivated()) {
        console.log('🚨 فقدان التفعيل أثناء الجلسة - تسجيل خروج فوري');
        
        // رسالة تحذير
        const currentLang = document.documentElement.lang || localStorage.getItem('appLanguage') || 'ar';
        const isEn = currentLang === 'en';
        
        const message = isEn 
            ? '🚨 System activation lost! Logging out automatically.'
            : '🚨 فقدان تفعيل النظام! سيتم تسجيل الخروج تلقائياً.';
        
        showMessage(message, 'error');
        
        // تسجيل خروج فوري
        setTimeout(() => {
            logout();
            
            // التأكد من عرض شاشة التفعيل
            const activationCard = document.getElementById('activationCard');
            if (activationCard) {
                activationCard.style.display = '';
            }
        }, 2000);
    }
}

// نظام التخزين الآمن للترخيص (مستقل عن localStorage)
class SecureLicenseStorage {
    constructor() {
        this.storageKey = 'catch_pos_license';
        this.fileName = 'license.dat';
    }

    // حفظ الترخيص في ملف محلي
    async saveLicense(licenseData) {
        try {
            // حفظ في localStorage
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(licenseData));
                console.log('License saved to localStorage');
            } catch (e) {
                console.warn('LocalStorage save failed:', e);
            }
            
            // نسخ احتياطي في sessionStorage
            try {
                sessionStorage.setItem(this.storageKey, JSON.stringify(licenseData));
                console.log('License saved to sessionStorage');
            } catch (e) {
                console.warn('SessionStorage save failed:', e);
            }
            
            console.log('License saved securely');
            return true;
        } catch (e) {
            console.error('Failed to save license securely:', e);
            return false;
        }
    }

    // تحميل الترخيص من الملف المحلي
    async loadLicense() {
        try {
            // محاولة تحميل من localStorage أولاً
            try {
                const localData = localStorage.getItem(this.storageKey);
                if (localData) {
                    const parsed = JSON.parse(localData);
                    if (parsed && parsed.activated) {
                        console.log('License loaded from localStorage');
                        return parsed;
                    }
                }
            } catch (e) {
                console.warn('LocalStorage load failed:', e);
            }

            // محاولة تحميل من sessionStorage كنسخة احتياطية
            try {
                const sessionData = sessionStorage.getItem(this.storageKey);
                if (sessionData) {
                    const parsed = JSON.parse(sessionData);
                    if (parsed && parsed.activated) {
                        console.log('License loaded from sessionStorage');
                        // نسخ إلى localStorage
                        this.saveLicense(parsed);
                        return parsed;
                    }
                }
            } catch (e) {
                console.warn('SessionStorage load failed:', e);
            }

            console.log('No valid license found');
            return null;
        } catch (e) {
            console.error('Failed to load license:', e);
            return null;
        }
    }

    // حفظ في IndexedDB (معطل مؤقتاً)
    async saveToIndexedDB(data) {
        // تعطيل IndexedDB مؤقتاً لتجنب المشاكل
        console.log('IndexedDB save disabled temporarily');
        return false;
    }

    // تحميل من IndexedDB (معطل مؤقتاً)
    async loadFromIndexedDB() {
        // تعطيل IndexedDB مؤقتاً لتجنب المشاكل
        console.log('IndexedDB load disabled temporarily');
        return null;
    }

}

// إنشاء مثيل من التخزين الآمن
const secureStorage = new SecureLicenseStorage();

// دالة لضمان تحميل الترخيص الآمن عند بدء النظام
async function ensureSecureLicenseLoaded() {
    try {
        // محاولة تحميل من التخزين الآمن
        const secureLicense = await secureStorage.loadLicense();
        if (secureLicense && secureLicense.activated) {
            // نسخ إلى localStorage إذا لم يكن موجوداً
            const currentLicense = loadFromStorage(LICENSE_STATE_KEY, defaultLicenseState());
            if (!currentLicense.activated) {
                saveToStorage(LICENSE_STATE_KEY, secureLicense);
                console.log('Secure license restored to localStorage');
            }
            return true;
        }
        return false;
    } catch (e) {
        console.error('Error ensuring secure license:', e);
        return false;
    }
}

function defaultLicenseState() {
    return {
        activated: false,
        type: null,
        code: null,
        start_at: null,
        end_at: null,
        lifetime: false,
        days_left: null,
        used_codes: [],
        last_tick_utc: null
    };
}

async function loadLicenseState() {
    try {
        // محاولة تحميل من التخزين الآمن أولاً
        const secureLicense = await secureStorage.loadLicense();
        if (secureLicense) {
            // نسخ إلى localStorage للتوافق مع النظام الحالي
            saveToStorage(LICENSE_STATE_KEY, secureLicense);
            return secureLicense;
        }
    } catch (e) {
        console.warn('Failed to load from secure storage:', e);
    }
    
    // إذا لم يوجد في التخزين الآمن، جرب localStorage
    const localLicense = loadFromStorage(LICENSE_STATE_KEY, defaultLicenseState());
    
    // إذا كان مفعلاً في localStorage، انسخه إلى التخزين الآمن
    if (localLicense && localLicense.activated) {
        try {
            await secureStorage.saveLicense(localLicense);
        } catch (e) {
            console.warn('Failed to save to secure storage:', e);
        }
    }
    
    return localLicense;
}

async function saveLicenseState(state) {
    state = Object.assign(defaultLicenseState(), state);
    
    // حفظ في localStorage (للتوافق مع النظام الحالي)
    saveToStorage(LICENSE_STATE_KEY, state);
    
    // حفظ في التخزين الآمن
    if (state.activated) {
        try {
            await secureStorage.saveLicense(state);
        } catch (e) {
            console.warn('Failed to save to secure storage:', e);
        }
    }
}

// دالة للتحقق من كلمة سر التقارير
function checkReportPassword() {
    const currentLang = document.documentElement.lang || localStorage.getItem('appLanguage') || 'ar';
    const isEn = currentLang === 'en';
    
    const passwordPrompt = isEn 
        ? 'Enter password to view reports:'
        : 'أدخل كلمة السر لعرض التقارير:';
    
    const enteredPassword = prompt(passwordPrompt);
    
    // التحقق من كلمة السر
    if (enteredPassword !== '00') {
        const errorMsg = isEn 
            ? '❌ Incorrect password. Access denied.'
            : '❌ كلمة السر غير صحيحة. تم رفض الوصول.';
        showMessage(errorMsg, 'error');
        return false;
    }
    
    return true;
}

// دالة مسح جميع البيانات التشغيلية
function clearAllOperationalData() {
    const currentLang = document.documentElement.lang || localStorage.getItem('appLanguage') || 'ar';
    const isEn = currentLang === 'en';
    
    // طلب كلمة السر أولاً
    const passwordPrompt = isEn 
        ? 'Enter password to clear all data:'
        : 'أدخل كلمة السر لمسح جميع البيانات:';
    
    const enteredPassword = prompt(passwordPrompt);
    
    // التحقق من كلمة السر
    if (enteredPassword !== 'USER') {
        const errorMsg = isEn 
            ? '❌ Incorrect password. Access denied.'
            : '❌ كلمة السر غير صحيحة. تم رفض الوصول.';
        showMessage(errorMsg, 'error');
        return;
    }
    
    // طلب تأكيد من المستخدم
    const confirmMessage = isEn 
        ? '⚠️ WARNING: This will delete ALL operational data (sales, customers, suppliers, invoices, reports, etc.) while keeping system settings and license intact.\n\nAre you sure you want to continue?'
        : '⚠️ تحذير: سيتم حذف جميع البيانات التشغيلية (المبيعات، العملاء، الموردين، الفواتير، التقارير، إلخ) مع الاحتفاظ بإعدادات النظام والترخيص.\n\nهل أنت متأكد من المتابعة؟';
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        console.log('🧹 بدء مسح البيانات التشغيلية...');
        
        // قائمة المفاتيح التي يجب مسحها (البيانات التشغيلية)
        const operationalKeys = [
            'products',           // المنتجات
            'customers',          // العملاء
            'sales',              // المبيعات
            'suppliers',          // الموردين
            'purchases',          // المشتريات
            'supplierPayments',   // دفعات الموردين
            'purchaseReturns',    // إرجاعات الشراء
            'supplierLedger',     // سجل الموردين
            'stockMovements',     // حركات المخزون
            'salesLogs',          // سجلات المبيعات
            'customerLogs',       // سجلات العملاء
            'cashDrawer',         // الصندوق (إعادة تعيين للنقدية الافتراضية)
            'cart',               // سلة التسوق
            'lastCartFocusIndex', // مؤشر السلة
            'profit.pageSize',    // إعدادات التقارير
            'capital.pageSize',   // إعدادات التقارير
            'lastWarningTime'     // وقت التحذير الأخير
        ];
        
        // مسح البيانات التشغيلية
        let clearedCount = 0;
        operationalKeys.forEach(key => {
            try {
                localStorage.removeItem(key);
                clearedCount++;
                console.log(`✅ تم مسح: ${key}`);
            } catch (e) {
                console.warn(`⚠️ فشل في مسح: ${key}`, e);
            }
        });
        
        // إعادة تعيين المتغيرات في الذاكرة
        products = [];
        customers = [];
        sales = [];
        suppliers = [];
        purchases = [];
        supplierPayments = [];
        purchaseReturns = [];
        supplierLedger = [];
        cart = [];
        lastCartFocusIndex = null;
        
        // إعادة تعيين الصندوق للقيم الافتراضية
        cashDrawer = {
            cashUSD: 100.00,
            cashLBP: 0,
            transactions: [],
            lastUpdate: new Date().toISOString()
        };
        saveToStorage('cashDrawer', cashDrawer);
        
        // تحديث واجهة المستخدم
        updateProductsDisplay();
        updateCustomersDisplay();
        updateSalesDisplay();
        updateSuppliersDisplay();
        updateCashDrawerDisplay();
        
        // رسالة النجاح
        const successMessage = isEn 
            ? `✅ All operational data cleared successfully!\n\nCleared ${clearedCount} data sets.\nSystem settings and license preserved.`
            : `✅ تم مسح جميع البيانات التشغيلية بنجاح!\n\nتم مسح ${clearedCount} مجموعة بيانات.\nتم الاحتفاظ بإعدادات النظام والترخيص.`;
        
        showMessage(successMessage, 'success');
        
        console.log(`✅ تم مسح ${clearedCount} مجموعة بيانات بنجاح`);
        
    } catch (error) {
        console.error('❌ خطأ في مسح البيانات:', error);
        const errorMessage = isEn 
            ? '❌ Error occurred while clearing data. Please try again.'
            : '❌ حدث خطأ أثناء مسح البيانات. يرجى المحاولة مرة أخرى.';
        showMessage(errorMessage, 'error');
    }
}

// دالة لإعادة تعيين الترخيص والخروج
async function resetLicenseAndLogout() {
    // طلب كلمة السر أولاً
    const currentLang = document.documentElement.lang || localStorage.getItem('appLanguage') || 'ar';
    const isEn = currentLang === 'en';
    
    const passwordPrompt = isEn 
        ? 'Enter admin password to reset license:'
        : 'أدخل كلمة سر المدير لإعادة تعيين الترخيص:';
    
    const enteredPassword = prompt(passwordPrompt);
    
    // التحقق من كلمة السر
    if (enteredPassword !== 'ADMIN') {
        const errorMsg = isEn 
            ? '❌ Incorrect password. Access denied.'
            : '❌ كلمة السر غير صحيحة. تم رفض الوصول.';
        showMessage(errorMsg, 'error');
        return;
    }
    
    // تأكيد من المستخدم بعد التحقق من كلمة السر
    const confirmMsg = isEn 
        ? 'Password verified. Are you sure you want to reset the license? This will clear all activation data and you will need to enter a new activation code.'
        : 'تم التحقق من كلمة السر. هل أنت متأكد من إعادة تعيين الترخيص؟ سيتم مسح جميع بيانات التفعيل وستحتاج لإدخال كود تفعيل جديد.';
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    try {
        // مسح جميع بيانات التفعيل
        const licenseKeys = [
            'license_state',
            'catch_pos_license', 
            'lastWarningTime',
            'activationDate',
            'trialStartDate',
            'licenseKey',
            'expiryDate',
            'delta_activation_token' // إضافة التوكن الجديد
        ];
        
        // مسح localStorage
        licenseKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // مسح أي مفاتيح إضافية
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
            if (key.toLowerCase().includes('license') || 
                key.toLowerCase().includes('activation') ||
                key.toLowerCase().includes('catch_pos') ||
                key.toLowerCase().includes('delta_activation_token')) {
                localStorage.removeItem(key);
            }
        });
        
        // مسح sessionStorage
        licenseKeys.forEach(key => {
            sessionStorage.removeItem(key);
        });
        
        // مسح IndexedDB
        if ('indexedDB' in window) {
            try {
                const dbNames = ['catch_pos_license', 'licenseDB', 'catch_pos'];
                dbNames.forEach(dbName => {
                    indexedDB.deleteDatabase(dbName);
                });
            } catch (e) {
                console.log('IndexedDB cleanup:', e);
            }
        }
        
        console.log('✅ License data cleared successfully');
        
        // رسالة نجاح
        const successMsg = isEn 
            ? '✅ Admin verified! License reset successfully! Redirecting to login page...'
            : '✅ تم التحقق من المدير! تم إعادة تعيين الترخيص بنجاح! جاري التوجيه لصفحة الدخول...';
        
        showMessage(successMsg, 'success');
        
        // الخروج من النظام بعد ثانيتين
        setTimeout(() => {
            // مسح بيانات تسجيل الدخول أيضاً
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('currentUser');
            
            // إعادة تحميل الصفحة للعودة لصفحة التفعيل
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('Error resetting license:', error);
        const errorMsg = isEn 
            ? '❌ Error resetting license. Please try again.'
            : '❌ خطأ في إعادة تعيين الترخيص. يرجى المحاولة مرة أخرى.';
        showMessage(errorMsg, 'error');
    }
}

function parseActivationCode(codeRaw) {
    if (!codeRaw) return null;
    const code = String(codeRaw || '').trim().toUpperCase();
    const patterns = [
        { type: 'YEAR', re: /^Y{10}\d{9}$/ , days: 364 },
        // Accept either 10 or 11 'M' letters to be tolerant of input (some codes use 10)
        { type: 'MONTH', re: /^M{10,11}\d{9}$/ , days: 30 },
        { type: 'TRIAL', re: /^T{11}\d{9}$/ , days: 1 },
        { type: 'LIFETIME', re: /^L{10}\d{9}$/ , days: null },
        // كود التفعيل اليومي للاختبار
        { type: 'DAILY_TEST', re: /^1111111111123456789$/ , days: 1 },
        // كود التفعيل لمدة 25 يوم
        { type: '25DAY', re: /^24D123456789$/ , days: 25 }
    ];
    for (const p of patterns) {
        if (p.re.test(code)) return { type: p.type, code, days: p.days };
    }
    return null;
}

function activateWithCode(codeRaw) {
    const parsed = parseActivationCode(codeRaw);
    if (!parsed) return { ok:false, msg: getText('invalid-code') || 'Invalid code.' };
    const now = new Date();
    const state = loadLicenseState();
    // Allow reuse of the same code locally (user requested stacking even when same code re-entered)

    let newStart = now.toISOString();
    let newEnd = null;
    let lifetime = false;
    if (parsed.type === 'LIFETIME') {
        lifetime = true;
        newEnd = null;
    } else if (parsed.type === 'DAILY_TEST') {
        // كود التفعيل اليومي للاختبار - يوم واحد فقط
        const daysToAdd = parsed.days; // 1 يوم
        const end = new Date(now);
        end.setUTCDate(end.getUTCDate() + daysToAdd);
        newEnd = end.toISOString();
        console.log('🧪 تم تفعيل كود الاختبار اليومي - يوم واحد');
    } else if (parsed.type === '25DAY') {
        // كود التفعيل لمدة 25 يوم
        const daysToAdd = parsed.days; // 25 يوم
        const end = new Date(now);
        end.setUTCDate(end.getUTCDate() + daysToAdd);
        newEnd = end.toISOString();
        console.log('🎉 تم تفعيل كود الـ25 يوم - صالح لمدة 25 يوم');
    } else {
        const daysToAdd = parsed.days;
        const end = new Date(now);
        end.setUTCDate(end.getUTCDate() + daysToAdd);
        newEnd = end.toISOString();
    }

    // If renewing a period type and existing subscription active -> stack on top
    if (!lifetime && state.activated && !state.lifetime && state.end_at) {
        const currentEnd = new Date(state.end_at);
        const nowUtc = new Date();
        if (currentEnd > nowUtc) {
            // extend from current end
            const stackedEnd = new Date(currentEnd);
            stackedEnd.setUTCDate(stackedEnd.getUTCDate() + parsed.days);
            newStart = state.start_at || newStart;
            newEnd = stackedEnd.toISOString();
        }
    }

    // update state
    state.activated = true;
    state.type = parsed.type;
    state.code = parsed.code;
    state.start_at = newStart;
    state.end_at = newEnd;
    state.lifetime = !!lifetime;
    state.last_tick_utc = new Date().toISOString();
    state.used_codes = Array.isArray(state.used_codes) ? state.used_codes : [];
    // store only an identifier of used code (hash-like) not the raw code
    try {
        // simple SHA-1 using Web Crypto if available
        if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
            const enc = new TextEncoder();
            const data = enc.encode(parsed.code);
            window.crypto.subtle.digest('SHA-1', data).then(hashBuf => {
                const hashArr = Array.from(new Uint8Array(hashBuf));
                const hashHex = hashArr.map(b => b.toString(16).padStart(2,'0')).join('');
                state.used_codes.push(hashHex);
                saveLicenseState(state);
            }).catch(e => { state.used_codes.push('*'); saveLicenseState(state); });
        } else {
            state.used_codes.push('*');
        }
    } catch (e) { state.used_codes.push('*'); }
    // compute days_left
    state.days_left = computeDaysLeft(state);
    saveLicenseState(state);
    
    // إنشاء توكن التفعيل الجديد
    const licenseData = {
        activated: true,
        type: state.type,
        start_at: state.start_at,
        end_at: state.end_at,
        lifetime: state.lifetime
    };
    
    if (createActivationToken(licenseData)) {
        console.log('✅ تم إنشاء توكن التفعيل بنجاح');
    } else {
        console.warn('⚠️ فشل في إنشاء توكن التفعيل');
    }
    
    return { ok:true, state };
}

function computeDaysLeft(state) {
    if (!state) return null;
    if (state.lifetime) return null;
    if (!state.end_at) return 0;
    const now = new Date();
    const end = new Date(state.end_at);
    const diffMs = end.getTime() - now.getTime();
    const days = Math.floor(diffMs / (1000*60*60*24));
    return Math.max(0, days);
}

function dailyTick() {
    const state = loadLicenseState();
    const now = new Date();
    const todayUtcStr = now.toISOString().split('T')[0];
    const lastTick = state.last_tick_utc ? (state.last_tick_utc.split('T')[0]) : null;
    // if clock went backwards, do nothing
    if (lastTick && todayUtcStr < lastTick) {
        // ignore tampering
        return state;
    }
    if (!lastTick || todayUtcStr > lastTick) {
        // recalc
        state.days_left = computeDaysLeft(state);
        state.last_tick_utc = now.toISOString();
        saveLicenseState(state);
    }
    return state;
}

async function isLicenseActive() {
    const state = await loadLicenseState();
    if (!state.activated) return false;
    if (state.lifetime) return true;
    if (!state.end_at) return false;
    const now = new Date();
    const end = new Date(state.end_at);
    return now <= end;
}

async function showActivationUIIfNeeded() {
    const state = dailyTick();
    const activationCard = document.getElementById('activationCard');
    const activateBtn = document.getElementById('activateBtn');
    if (!(await isLicenseActive())) {
        // show activation on login screen
        if (activationCard) activationCard.style.display = '';
        if (activateBtn) activateBtn.style.display = 'inline-block';
    } else {
        if (activationCard) activationCard.style.display = 'none';
        if (activateBtn) activateBtn.style.display = 'none';
    }
    updateSettingsLicenseDisplay();
}

async function updateSettingsLicenseDisplay() {
    console.log('updateSettingsLicenseDisplay called');
    
    // انتظار حتى يكون العنصر متاحاً
    const el = document.getElementById('licenseDaysLeft');
    if (!el) {
        console.warn('licenseDaysLeft element not found, retrying...');
        setTimeout(updateSettingsLicenseDisplay, 200);
        return;
    }
    
    let state = await loadLicenseState();
    console.log('License state:', state);
    
    // لا يوجد ترخيص تجريبي تلقائي - النظام يتطلب كود تفعيل إلزامي
    // if (!state.activated) {
    //     console.log('No license found, creating test license...');
    //     const now = new Date();
    //     const endDate = new Date(now.getTime() + (8 * 24 * 60 * 60 * 1000));
    //     
    //     state = {
    //         activated: true,
    //         type: 'TRIAL',
    //         start_at: now.toISOString(),
    //         end_at: endDate.toISOString(),
    //         lifetime: false,
    //         used_codes: ['test'],
    //         days_left: 8,
    //         last_tick_utc: now.toISOString()
    //     };
    //     
    //     await saveLicenseState(state);
    //     console.log('Test license created:', state);
    // }
    
    // تحديد اللغة الحالية بشكل أكثر دقة
    const currentLang = document.documentElement.lang || 
                       localStorage.getItem('appLanguage') || 
                       currentLanguage || 'ar';
    const isEn = currentLang === 'en';
    console.log('Current language:', currentLang, 'isEn:', isEn);
    
    if (!state.activated) {
        console.log('License not activated, showing activation required message');
        el.textContent = isEn ? 'Not Activated - Activation Code Required' : 'غير مفعّل - يتطلب كود تفعيل';
        el.className = 'license-days inactive';
        return;
    }
    if (state.lifetime) {
        console.log('Lifetime license detected');
        el.textContent = isEn ? 'Activated: Lifetime' : 'مفعّل: مدى الحياة';
        el.className = 'license-days safe';
        return;
    }
    
    const daysLeft = computeDaysLeft(state);
    console.log('Days left calculated:', daysLeft);
    
    // التحقق من صحة القيمة
    if (daysLeft === null || daysLeft === undefined) {
        console.log('Days left is null/undefined, showing unavailable message');
        el.textContent = isEn ? 'Subscription status unavailable' : 'حالة الاشتراك غير متاحة';
        el.className = 'license-days inactive';
        return;
    }
    
    state.days_left = daysLeft;
    saveLicenseState(state);
    
    // عرض الأيام المتبقية بشكل أوضح مع دعم الجمع
    if (daysLeft === 0) {
        el.textContent = isEn ? 'Subscription Expired!' : 'انتهى الاشتراك!';
        el.className = 'license-days danger';
    } else {
        // دعم الجمع للنصوص
        const dayText = isEn 
            ? (daysLeft === 1 ? 'day' : 'days')
            : 'يوم';
        
        el.textContent = isEn 
            ? `${daysLeft} ${dayText} left` 
            : `${daysLeft} ${dayText} متبقي`;
        
        // تحديد لون التحذير
        if (daysLeft <= 3) {
            el.className = 'license-days danger';
        } else if (daysLeft <= 10) {
            el.className = 'license-days warn';
        } else {
            el.className = 'license-days safe';
        }
    }
    
    // التحقق من التحذيرات
    checkSubscriptionWarnings();
    if (daysLeft === 0 && !state.lifetime) {
        // expired -> force activation screen
        showExpiredAndForceActivation();
    }
    
    // تحديث المؤشر البصري الدائم مباشرة
    if (typeof updateVisualSubscriptionIndicator === 'function') {
        updateVisualSubscriptionIndicator();
    }
    
    console.log('Final element text:', el.textContent);
    console.log('Final element class:', el.className);
    console.log('=== License Display Update Complete ===');
}

function showExpiredAndForceActivation() {
    // hide main screen and show login
    document.getElementById('mainScreen').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
    const activationCard = document.getElementById('activationCard');
    if (activationCard) activationCard.style.display = '';
    const msgEl = document.getElementById('activationMessage');
    const currentLang = document.documentElement.lang || currentLanguage || 'ar';
    const isEn = currentLang === 'en';
    if (msgEl) { msgEl.style.display = ''; msgEl.textContent = isEn ? 'Subscription expired. Please enter a new code.' : 'انتهى الاشتراك، الرجاء إدخال كود جديد.'; }
}

// دالة لإصلاح الزر مباشرة
function fixCashMovementButton() {
    const cashMovementBtn = document.querySelector('#openCashMove');
    if (cashMovementBtn) {
        const currentLang = document.documentElement.lang || 'ar';
        const isEn = currentLang === 'en';
        const text = isEn ? 'Cash Movement' : 'حركة الصندوق';
        
        // إزالة النص القديم والاحتفاظ بالأيقونة
        const icon = cashMovementBtn.querySelector('i');
        cashMovementBtn.innerHTML = '';
        if (icon) {
            cashMovementBtn.appendChild(icon);
        }
        cashMovementBtn.appendChild(document.createTextNode(' ' + text));
        
        console.log('Fixed cash movement button:', text);
        return text;
    } else {
        console.log('Cash movement button not found');
        return null;
    }
}

// دالة لتحديث ترجمة الزر عند تغيير اللغة
function updateCashMovementButtonTranslation() {
    const cashMovementBtn = document.querySelector('#openCashMove');
    if (cashMovementBtn) {
        const currentLang = document.documentElement.lang || 'ar';
        const isEn = currentLang === 'en';
        const text = isEn ? 'Cash Movement' : 'حركة الصندوق';
        
        // تحديث النص فقط
        const textNode = cashMovementBtn.childNodes[cashMovementBtn.childNodes.length - 1];
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            textNode.textContent = ' ' + text;
        } else {
            // إذا لم يوجد نص، أضفه
            cashMovementBtn.appendChild(document.createTextNode(' ' + text));
        }
        
        console.log('Updated cash movement button translation:', text);
    }
}

// دالة لإصلاح نافذة حركة الصندوق
function fixCashMoveModal() {
    const currentLang = document.documentElement.lang || 'ar';
    const isEn = currentLang === 'en';
    
    // إصلاح placeholder
    const descInput = document.getElementById('cashMoveNote');
    if (descInput) {
        const placeholder = isEn ? 'e.g.: purchase supplies/transfer to safe...' : 'مثال: شراء مستلزمات/نقل للخزنة ...';
        descInput.placeholder = placeholder;
        console.log('Fixed cash move modal placeholder:', placeholder);
    }
    
    // إصلاح العنوان
    const title = document.querySelector('#cashMoveModal .modal-header h3');
    if (title) {
        title.textContent = isEn ? 'Cash Movement' : 'حركة الصندوق';
    }
    
    // إصلاح الأزرار
    const confirmBtn = document.getElementById('confirmCashMove');
    if (confirmBtn) {
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> ' + (isEn ? 'Confirm' : 'تأكيد');
    }
    
    const cancelBtn = document.querySelector('#cashMoveModal .cancel-btn');
    if (cancelBtn) {
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> ' + (isEn ? 'Cancel' : 'إلغاء');
    }
    
    // إصلاح خيارات القائمة المنسدلة
    const selectOptions = document.querySelectorAll('#cashMoveType option');
    if (selectOptions.length >= 3) {
        if (isEn) {
            selectOptions[0].textContent = 'Deposit (Input)';
            selectOptions[1].textContent = 'Expense (Output)';
            selectOptions[2].textContent = 'Transfer';
        } else {
            selectOptions[0].textContent = 'إيداع (الادخال)';
            selectOptions[1].textContent = 'إخراج (التخريح)';
            selectOptions[2].textContent = 'نقل (التحويل)';
        }
    }
    
    console.log('Fixed cash move modal translations');
}

// UI bindings for activation
document.addEventListener('DOMContentLoaded', function(){
    // حارس التفعيل - التحقق من التفعيل عند تحميل الصفحة
    checkActivationOnPageLoad();
    
    // إصلاح فوري للزر
    fixCashMovementButton();
    
    // ضمان تحميل الترخيص الآمن أولاً
    ensureSecureLicenseLoaded().catch(e => console.warn('Failed to load secure license:', e));
    
    // تحميل وقت آخر تحذير
    loadLastWarningTime();
    
    // إعداد مؤقت للتحقق من التحذيرات كل دقيقة
    setInterval(checkSubscriptionWarnings, 60000); // كل دقيقة
    
    // حارس التفعيل المستمر - التحقق كل 30 ثانية أثناء الاستخدام
    setInterval(checkActivationDuringSession, 30000); // كل 30 ثانية
    
    // ضمان تحديث عرض الترخيص عند تحميل الصفحة
    setTimeout(() => {
        updateSettingsLicenseDisplay();
    }, 1000);
    
    // إصلاح إضافي للزر
    setTimeout(() => {
        fixCashMovementButton();
    }, 500);
    
    // إصلاح أزرار الإعدادات عند تحميل الصفحة
    setTimeout(() => {
        if (typeof window.fixSettingsButtonsText === 'function') {
            window.fixSettingsButtonsText();
        }
    }, 1500);
    
    // إصلاح إضافي بعد فترة أطول
    setTimeout(() => {
        if (typeof window.fixSettingsButtonsText === 'function') {
            window.fixSettingsButtonsText();
        }
    }, 3000);
    
    // تحديث عرض الترخيص عند فتح صفحة الإعدادات
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'settingsBtn') {
            setTimeout(() => {
                updateSettingsLicenseDisplay();
                fixSettingsElements();
                // إصلاح نص الأزرار عند تحميل الصفحة
                if (typeof window.fixSettingsButtonsText === 'function') {
                    window.fixSettingsButtonsText();
                }
                
                // إصلاح إضافي بعد فترة أطول
                setTimeout(() => {
                    if (typeof window.fixSettingsButtonsText === 'function') {
                        window.fixSettingsButtonsText();
                    }
                }, 1000);
            }, 300);
        }
    });
    
    // show activation when needed
    showActivationUIIfNeeded().catch(e => console.warn('Failed to check activation:', e));
    // Open modal button
    const openModalBtn = document.getElementById('openActivationModalBtn');
    const activationModal = document.getElementById('activationModal');
    const closeModalBtn = document.getElementById('closeActivationModal');
    const activationApplyBtn = document.getElementById('activationApplyBtn');
    const activationCancelBtn = document.getElementById('activationCancelBtn');
    const activationPwd = document.getElementById('activationPasswordInput');
    const activationModalMsg = document.getElementById('activationModalMsg');

    let activationIntent = 'activate'; // 'activate' | 'renew'
    function openActivationModal(intent = 'activate') {
        activationIntent = intent;
        if (activationModal) activationModal.style.display = 'block';
        if (activationPwd) { activationPwd.value = ''; activationPwd.focus(); }
        if (activationModalMsg) { activationModalMsg.style.display = 'none'; activationModalMsg.textContent = ''; }
    }
    function closeActivationModal() {
        activationIntent = 'activate';
        if (activationModal) activationModal.style.display = 'none';
        if (activationPwd) activationPwd.value = '';
        if (activationModalMsg) { activationModalMsg.style.display = 'none'; activationModalMsg.textContent = ''; }
    }

    if (openModalBtn) openModalBtn.addEventListener('click', function(){ openActivationModal('activate'); });
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeActivationModal);
    if (activationCancelBtn) activationCancelBtn.addEventListener('click', closeActivationModal);

    if (activationApplyBtn) activationApplyBtn.addEventListener('click', async function(){
        if (!activationPwd) return;
        const codeRaw = String(activationPwd.value || '').trim();
        if (!codeRaw) {
            if (activationModalMsg) { activationModalMsg.style.display = ''; activationModalMsg.textContent = (currentLanguage==='ar' ? 'الرجاء إدخال الكود.' : 'Please enter the code.'); }
            return;
        }

        // (removed verbose format help per user request) proceed to attempt activation
        const parsed = parseActivationCode(codeRaw);

        // Immediately clear input from DOM to reduce exposure
        try { activationPwd.value = ''; } catch(e) {}

        // compute hash of code to check duplicates in stored used_codes
        let hashHex = null;
        try {
            if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
                const enc = new TextEncoder();
                const data = enc.encode(parsed.code);
                const hashBuf = await window.crypto.subtle.digest('SHA-1', data);
                const hashArr = Array.from(new Uint8Array(hashBuf));
                hashHex = hashArr.map(b => b.toString(16).padStart(2,'0')).join('');
            }
        } catch (e) { hashHex = null; }

        // Allow reuse of same code: do not block if a local used_codes entry exists.
        // We still compute hashHex above for recording later, but do not prevent activation.

        // perform activation
        const res = activateWithCode(codeRaw);
        if (!res.ok) {
            if (activationModalMsg) { activationModalMsg.style.display = ''; activationModalMsg.textContent = (currentLanguage==='ar' ? 'الكود غير صالح.' : 'Invalid code.'); }
            return;
        }

        // success: update UI
        closeActivationModal();
        showMessage((currentLanguage==='ar' ? 'تم التفعيل: ' : 'Activated: ') + (res.state.type || ''), 'success');
        if (activationIntent === 'activate') {
            try { document.getElementById('loginScreen').classList.remove('active'); } catch(e){}
            try { document.getElementById('mainScreen').classList.add('active'); } catch(e){}
        }
        updateSettingsLicenseDisplay();
        activationIntent = 'activate';
    });

    // bind Renew button in settings
    const renewBtn = document.getElementById('renewLicenseBtn');
    if (renewBtn) renewBtn.addEventListener('click', function(){
        // open secure modal for entering renewal code
        openActivationModal('renew');
    });
});


// نظام الترجمة الديناميكي
const translations = {
    ar: {
        // الشريط العلوي
        'system-title': 'CATCH POS SYSTEM',
        'hide-menu': 'إخفاء القائمة',
        'show-menu': 'إظهار القائمة',
        'cash-register': 'الصندوق',
        'welcome': 'مرحباً، المدير',
        'logout': 'خروج',
        'language': 'العربية',
        
        // القائمة الجانبية
        'dashboard': 'لوحة التحكم',
        'pos': 'نقطة البيع',
        'products': 'المنتجات',
        'sales': 'المبيعات',
        'customers': 'العملاء',
        'suppliers': 'الموردين',
        'purchases': 'المشتريات',
        'reports': 'التقارير',
        'settings': 'الإعدادات',
        
        // نقطة البيع
        'currency': 'العملة',
        'price-type': 'نوع السعر',
        'retail': 'مفرق',
        'wholesale': 'جملة',
        'vip': 'زبون مميز',
        'exchange-rate': 'سعر الصرف',
        'search-product': 'ابحث عن منتج بالاسم أو الباركود...',
        'cart': 'العربة',
        'subtotal': 'المجموع الفرعي',
        'final-total': 'المجموع النهائي',
        'payment-method': 'طريقة الدفع',
        'cash-payment': 'دفع كامل (نقدي)',
        'partial-payment': 'دفع جزئي (دين)',
        'process-payment': 'إتمام الدفع',
        'clear-cart': 'مسح العربة',
        
        // نظام البيع بالدين
        'credit-sale': 'بيع بالدين',
        'credit-sale-desc': 'البيع كاملاً على الحساب',
        'choose-customer-label': 'اختر العميل:',
        'customer-credit': 'دين العميل',
        'credit-limit': 'الحد الائتماني',
        'remaining-credit': 'الائتمان المتبقي',
        // POS Partial Payment
        'choose-customer': 'اختر عميل...',
        'current-debt': 'دين حالي',
        'add-previous-account': 'إضافة حساب سابق',
        'previous-account': 'حساب سابق',
        'search-customer': 'ابحث عن عميل...',
        'customers-found': 'عميل موجود',
        'no-customers-found': 'لم يتم العثور على عملاء',
        'actions': 'الإجراءات',
        'print-barcode': 'طباعة باركود',
        'print-quantity': 'كمية الطباعة:',
        'barcode-size': 'حجم الباركود:',
        'small': 'صغير',
        'medium': 'متوسط',
        'large': 'كبير',
        'print': 'طباعة',
        'inventory-capital': 'رأس مال المخزون',
        'inventory-capital-desc': 'قيمة المخزون وتكلفته',
        'expenses-report': 'النفقات',
        'expenses-report-desc': 'تقرير شامل للنفقات والمصروفات',
        'expenses-report-card': 'النفقات',
        'profit-reports': 'تقارير الأرباح',
        'profit-reports-desc': 'الأرباح، الخسائر، وتدفق النقد',
        'refunds': 'المرتجعات',
        'invoices': 'الفواتير',
        'net-profit': 'صافي الربح',
        'total-cogs': 'إجمالي الكلفة',
        'gross-sales': 'إجمالي المبيعات',
        'inventory-value': 'قيمة المخزون',
        'unit-cost': 'كلفة الوحدة',
        'total-capital': 'إجمالي رأس المال',
        'update': 'تحديث',
        'credit-available': 'ائتمان متاح',
        'credit-exceeded': 'تجاوز الحد الائتماني',
        'confirm-credit-sale': 'هل أنت متأكد من البيع بالدين؟',
        'credit-sale-success': 'تم البيع بالدين بنجاح',
        
        // صفحة المبيعات
        'sales-management': 'إدارة المبيعات',
        'invoice-number': 'رقم الفاتورة',
        'date': 'التاريخ',
        'customer': 'العميل',
        'amount': 'المبلغ',
        'payment-method': 'طريقة الدفع',
        'status': 'الحالة',
        'actions': 'الإجراءات',
        'discounts': 'الخصومات',
        'completed': 'مكتملة',
        'returned': 'مرجعة',
        'partial': 'مرجعة جزئياً',
        'cash': 'نقدي',
        'card': 'بطاقة',
        'regular-customer': 'عميل عادي',
        'view': 'عرض',
        'print': 'طباعة',
        'refund': 'استرجاع',
        'edit': 'تعديل',
        'edit-supplier': 'تعديل المورد',
        'save': 'حفظ',
        'save_pay': 'حفظ وادفع الآن',
        'save-changes': 'حفظ التعديلات',
        'confirm-return': 'تأكيد الإرجاع',
        'confirm-payment': 'تأكيد الدفع',
        'confirm': 'تأكيد',
        'supplier-name': 'اسم المورد',
        'email': 'البريد الإلكتروني',
        'phone-number': 'رقم الهاتف',
        'address': 'العنوان',
        'contact-person': 'الشخص المسؤول',
        'payment-method': 'طريقة الدفع:',
        'price-type': 'نوع السعر:',
        'currency': 'العملة:',
        'product-name': 'اسم المنتج',
        'category': 'التصنيف',
        'quantity': 'الكمية',
        'barcode': 'الباركود',
        'stock': 'المخزون',
        'customer-name': 'اسم العميل',
        'delete': 'حذف',
        'log': 'السجل',
        'pay-debt': 'تسديد دين',
        'all-sales': 'جميع المبيعات',
        'completed-only': 'مكتملة فقط',
        'returned-only': 'مرجعة فقط',
        'partial-only': 'مرجعة جزئياً',
        'filter': 'تصفية',
        'reset': 'إعادة تعيين',
        'search-sales': 'ابحث داخل المبيعات...',
        'from-date': 'من تاريخ',
        'to-date': 'إلى تاريخ',
        
        // صفحة التقارير
        'reports': 'التقارير',
        'sales-report': 'تقرير المبيعات',
        'inventory-report': 'تقرير المخزون',
        'customers-report': 'تقرير العملاء',
        'financial-report': 'التقرير المالي',
        'sales-report-desc': 'تقرير شامل عن المبيعات والإيرادات',
        'inventory-report-desc': 'حالة المخزون والمنتجات',
        'customers-report-desc': 'إحصائيات العملاء ومشترياتهم',
        'financial-report-desc': 'الأرباح والخسائر والتدفق النقدي',
        'view-report': 'عرض التقرير',
        
        // Mixed cash payment
        'complete-remainder': 'إكمال بالليرة',
        'will-complete-lbp': 'سيُكمل المتبقي بالليرة عند إتمام الدفع',
        'no-remainder': 'لا يوجد متبقي لإكماله',
        
        // Empty cart
        'cart-empty': '🛒 العربة فارغة',
        'click-to-add': 'انقر على المنتجات لإضافتها',
        'not_specified': 'غير محدد',
        
        // الرسائل
        'success': 'نجح',
        'error': 'خطأ',
        'menu-hidden': 'تم إخفاء القائمة',
        'menu-shown': 'تم إظهار القائمة',
        'language-changed': 'تم تغيير اللغة',
        'confirm-logout': 'هل أنت متأكد من تسجيل الخروج؟',
        'logout-success': 'تم تسجيل الخروج بنجاح',
        'reset-license': 'إعادة تعيين الترخيص',

        // شاشة الدخول
        'login-title': 'نظام إدارة المبيعات',
        'login-subtitle': 'CATCH POS SYSTEM',
        'username': 'اسم المستخدم',
        'password': 'كلمة المرور',
        'login': 'تسجيل الدخول',
        'demo-data': 'بيانات التجربة:',

        // الفواتير
        'invoices-management': 'إدارة الفواتير',
        'filter-date': 'فلترة',

        // التقارير - الفترات
        'today': 'اليوم',
        'yesterday': 'أمس',
        'this-week': 'هذا الأسبوع',
        'last-7-days': 'آخر 7 أيام',
        'this-month': 'هذا الشهر',
        'last-30-days': 'آخر 30 يوم',
        'this-year': 'هذه السنة',
        'custom': 'مخصص',
        'apply': 'تطبيق',
        'sales-history': 'سجل المبيعات',
        'operations': 'عملية',
        'date-time': 'التاريخ والوقت',
        'method': 'الطريقة',
        'user': 'المستخدم',
        'no-records': 'لا يوجد سجلات',
        // رسائل إضافية
        'pay-debt-success': 'تم تسجيل التسديد بنجاح',
        // نافذة تسديد دين
        'pay-debt-title': 'تسديد دين العميل',
        'pay-debt-customer': 'العميل',
        'pay-debt-current': 'الدين الحالي',
        'pay-debt-amount': 'المبلغ المدفوع',
        'pay-debt-currency': 'عملة الدفع',
        'confirm-pay-debt': 'تأكيد التسديد',
        'cancel-generic': 'إلغاء',
        'currency-usd': 'دولار ($)',
        'currency-lbp': 'ليرة (ل.ل)',
        'debt-word': 'دين',
        // تأكيدات
        'confirm-delete-customer': 'هل أنت متأكد من حذف هذا العميل؟',
        // رسائل نجاح إضافية
        'customer-deleted': 'تم حذف العميل',
        // رسائل الترخيص
        'activated-lifetime': 'مفعّل: مدى الحياة',
        'license-not-active': 'الأيام المتبقية لانتهاء الاشتراك: -- يوم',
        'activation-code-placeholder': 'أدخل كود التفعيل',
        'enter-activation-code': 'أدخل كود التفعيل',
        // إعدادات إضافية
        'support-phone': 'رقم الدعم',
        'support-phone-desc': 'رقم الدعم الرسمي للنظام',
        'nav_cashbox': 'سجل الصندوق',
        'cash-movement': 'حركة الصندوق',
        'cash_move_title': 'حركة الصندوق',
        'cash_move_type': 'النوع',
        'cash_move_amount': 'المبلغ',
        'cash_move_currency': 'العملة',
        'cash_move_description': 'وصف',
        'cash_move_confirm': 'تأكيد',
        'cash_move_cancel': 'إلغاء',
        'cash_move_expense': 'إخراج (مصاريف)',
        'cash_move_deposit': 'إيداع للصندوق',
        'cash_move_transfer': 'نقل إلى الخزنة',
        'cash_move_placeholder': 'مثال: شراء مستلزمات/نقل للخزنة ...',
        'save-store-info': 'حفظ معلومات المتجر',
        'renew-license': 'استيراد/تجديد ملف التفعيل',
        'store-name': 'اسم المتجر',
        'store-address': 'عنوان المتجر',
        'store-phone': 'هاتف المتجر',
        'show-time-all-sales': 'إظهار الوقت لجميع المبيعات (وليس فقط النقدية)',
        'show-time-all-sales-desc': 'عند التفعيل، سيظهر التاريخ والوقت لجميع المعاملات في جدول المبيعات والفواتير',
        'activated-until': 'مفعّل حتى: {date} — متبقّي: {days} يوم',
        
        // Pagination
        'pagination-items-per-page': 'عدد العناصر لكل صفحة:',
        'pagination-first': 'الصفحة الأولى',
        'pagination-previous': 'السابق',
        'pagination-next': 'التالي',
        'pagination-last': 'الصفحة الأخيرة',
        'pagination-showing': 'عرض',
        'pagination-of': 'من',
        'pagination-no-items': 'لا توجد عناصر',
        'pagination-page': 'صفحة',
        'pagination-all': 'الكل',
        
        // Expense Categories
        'expense-category-products': 'توريد منتجات',
        'expense-auto-product-add': 'توريد تلقائي: {productName} ({quantity} وحدة × {cost}$)',
        
        // Add Quantity Feature
        'add-new-quantity': 'إضافة كمية جديدة',
        'new-quantity': 'الكمية الجديدة',
        'new-cost-per-unit': 'الكلفة الجديدة للوحدة (USD)',
        'new-cost-calculation': 'حساب الكلفة الجديدة:'
    },
    en: {
        // Header
        'system-title': 'CATCH POS SYSTEM',
        'hide-menu': 'Hide Menu',
        'show-menu': 'Show Menu',
        'cash-register': 'Cash Register',
        'welcome': 'Welcome, Manager',
        'logout': 'Logout',
        'language': 'English',
        
        // Sidebar
        'dashboard': 'Dashboard',
        'pos': 'Point of Sale',
        'products': 'Products',
        'sales': 'Sales',
        'customers': 'Customers',
        'suppliers': 'Suppliers',
        'purchases': 'Purchases',
        'reports': 'Reports',
        'settings': 'Settings',
        
        // Point of Sale
        'currency': 'Currency',
        'price-type': 'Price Type',
        'retail': 'Retail',
        'wholesale': 'Wholesale',
        'vip': 'VIP Customer',
        'exchange-rate': 'Exchange Rate',
        'search-product': 'Search product by name or barcode...',
        'cart': 'Cart',
        'subtotal': 'Subtotal',
        'final-total': 'Final Total',
        'payment-method': 'Payment Method',
        'cash-payment': 'Full Payment (Cash)',
        'partial-payment': 'Partial Payment (Credit)',
        'process-payment': 'Process Payment',
        'clear-cart': 'Clear Cart',
        
        // Credit Sales System
        'credit-sale': 'Credit Sale',
        'credit-sale-desc': 'Full on account sale',
        'choose-customer-label': 'Select Customer:',
        'customer-credit': 'Customer Credit',
        'credit-limit': 'Credit Limit',
        'remaining-credit': 'Remaining Credit',
        'credit-available': 'Credit Available',
        'credit-exceeded': 'Credit Limit Exceeded',
        'confirm-credit-sale': 'Are you sure about the credit sale?',
        'credit-sale-success': 'Credit sale completed successfully',
        
        // Sales Page
        'sales-management': 'Sales Management',
        'invoice-number': 'Invoice #',
        'date': 'Date',
        'customer': 'Customer',
        'amount': 'Amount',
        'payment-method': 'Payment Method',
        'status': 'Status',
        'actions': 'Actions',
        'discounts': 'Discounts',
        'completed': 'Completed',
        'returned': 'Returned',
        'partial': 'Partially Returned',
        'cash': 'Cash',
        'card': 'Card',
        'regular-customer': 'Regular Customer',
        'view': 'View',
        'print': 'Print',
        'refund': 'Refund',
        'edit': 'Edit',
        'edit-supplier': 'Edit Supplier',
        'save': 'Save',
        'save_pay': 'Save and Pay Now',
        'save-changes': 'Save Changes',
        'confirm-return': 'Confirm Return',
        'confirm-payment': 'Confirm Payment',
        'confirm': 'Confirm',
        'supplier-name': 'Supplier Name',
        'email': 'Email',
        'phone-number': 'Phone Number',
        'address': 'Address',
        'contact-person': 'Contact Person',
        'payment-method': 'Payment Method:',
        'price-type': 'Price Type:',
        'currency': 'Currency:',
        'product-name': 'Product Name',
        'category': 'Category',
        'quantity': 'Quantity',
        'barcode': 'Barcode',
        'stock': 'Stock',
        'customer-name': 'Customer Name',
        'delete': 'Delete',
        'log': 'Log',
        'pay-debt': 'Pay Debt',
        'all-sales': 'All Sales',
        'completed-only': 'Completed Only',
        'returned-only': 'Returned Only',
        'partial-only': 'Partially Returned Only',
        'filter': 'Filter',
        'reset': 'Reset',
        'search-sales': 'Search in sales...',
        'from-date': 'From Date',
        'to-date': 'To Date',
        
        // Reports Page
        'reports': 'Reports',
        'sales-report': 'Sales Report',
        'inventory-report': 'Inventory Report',
        'customers-report': 'Customers Report',
        'financial-report': 'Financial Report',
        'sales-report-desc': 'Comprehensive report on sales and revenues',
        'inventory-report-desc': 'Inventory and product status',
        'customers-report-desc': 'Customer statistics and their purchases',
        'financial-report-desc': 'Profits, losses, and cash flow',
        'view-report': 'View Report',
        
        // Mixed cash payment
        'complete-remainder': 'Complete in LBP',
        'will-complete-lbp': 'Remainder will be completed in LBP at checkout',
        'no-remainder': 'No remainder to complete',
        
        // Empty cart
        'cart-empty': '🛒 Cart is empty',
        'click-to-add': 'Click products to add',
        'not_specified': 'Not specified',
        
        // Messages
        'success': 'Success',
        'error': 'Error',
        'menu-hidden': 'Menu hidden',
        'menu-shown': 'Menu shown',
        'language-changed': 'Language changed',
        'confirm-logout': 'Are you sure you want to logout?',
        'logout-success': 'Logged out successfully',
        'reset-license': 'Reset License',

        // Login screen
        'login-title': 'Sales Management System',
        'login-subtitle': 'CATCH POS SYSTEM',
        'username': 'Username',
        'password': 'Password',
        'login': 'Login',
        'demo-data': 'Demo credentials:',

        // Invoices
        'invoices-management': 'Invoices Management',
        'filter-date': 'Filter',

        // Reports presets
        'today': 'Today',
        'yesterday': 'Yesterday',
        'this-week': 'This Week',
        'last-7-days': 'Last 7 Days',
        'this-month': 'This Month',
        'last-30-days': 'Last 30 Days',
        'this-year': 'This Year',
        'custom': 'Custom',
        'apply': 'Apply',
        'sales-history': 'Sales History',
        'operations': 'operations',
        'date-time': 'Date & Time',
        'method': 'Method',
        'user': 'User',
        'no-records': 'No records',
        // Extra messages
        'pay-debt-success': 'Payment recorded successfully',
        // Pay Debt modal
        'pay-debt-title': 'Pay Customer Debt',
        'pay-debt-customer': 'Customer',
        'pay-debt-current': 'Current Debt',
        'pay-debt-amount': 'Paid Amount',
        'pay-debt-currency': 'Pay Currency',
        'confirm-pay-debt': 'Confirm Payment',
        'cancel-generic': 'Cancel',
        'currency-usd': 'US Dollar ($)',
        'currency-lbp': 'Lebanese Pound (LBP)',
        'debt-word': 'Debt',
        // POS Partial Payment
        'choose-customer': 'Select customer...',
        'current-debt': 'Current Debt',
        'add-previous-account': 'Add Previous Balance',
        'previous-account': 'Previous Account',
        'search-customer': 'Search customer...',
        'customers-found': 'customers found',
        'no-customers-found': 'No customers found',
        'actions': 'Actions',
        'print-barcode': 'Print Barcode',
        'print-quantity': 'Print Quantity:',
        'barcode-size': 'Barcode Size:',
        'small': 'Small',
        'medium': 'Medium',
        'large': 'Large',
        'print': 'Print',
        'inventory-capital': 'Inventory Capital',
        'inventory-capital-desc': 'Current inventory value and cost',
        'expenses-report': 'Expenses',
        'expenses-report-desc': 'Comprehensive expenses and expenditures report',
        'expenses-report-card': 'Expenses',
        'profit-reports': 'Profit Reports',
        'profit-reports-desc': 'Profits, losses, and cash flow',
        'refunds': 'Refunds',
        'invoices': 'Invoices',
        'net-profit': 'Net Profit',
        'total-cogs': 'Total COGS',
        'gross-sales': 'Gross Sales',
        'inventory-value': 'Inventory Value',
        'unit-cost': 'Unit Cost',
        'total-capital': 'Total Capital',
        'update': 'Update',
        // Confirmations
        'confirm-delete-customer': 'Are you sure you want to delete this customer?',
        // Success messages
        'customer-deleted': 'Customer deleted',
        // License messages
        'activated-lifetime': 'Activated: Lifetime',
        'license-not-active': 'Days left: --',
        'activation-code-placeholder': 'Enter activation code',
        'enter-activation-code': 'Enter Activation Code',
        // Additional settings
        'support-phone': 'Support Phone',
        'support-phone-desc': 'Official system support number',
        'nav_cashbox': 'History Cashbox',
        'cash-movement': 'Cash Movement',
        'cash_move_title': 'Cash Movement',
        'cash_move_type': 'Type',
        'cash_move_amount': 'Amount',
        'cash_move_currency': 'Currency',
        'cash_move_description': 'Description',
        'cash_move_confirm': 'Confirm',
        'cash_move_cancel': 'Cancel',
        'cash_move_expense': 'Expense',
        'cash_move_deposit': 'Deposit',
        'cash_move_transfer': 'Transfer',
        'cash_move_placeholder': 'e.g.: purchase supplies/transfer to safe...',
        'save-store-info': 'Save Store Info',
        'renew-license': 'Import/Renew License File',
        'store-name': 'Store Name',
        'store-address': 'Store Address',
        'store-phone': 'Store Phone',
        'show-time-all-sales': 'Show time for all sales (not just cash)',
        'show-time-all-sales-desc': 'When enabled, date and time will be displayed for all transactions in sales table and invoices',
        'activated-until': 'Activated until: {date} — Left: {days} days',
        
        // Pagination
        'pagination-items-per-page': 'Items per page:',
        'pagination-first': 'First Page',
        'pagination-previous': 'Previous',
        'pagination-next': 'Next',
        'pagination-last': 'Last Page',
        'pagination-showing': 'Showing',
        'pagination-of': 'of',
        'pagination-no-items': 'No items',
        'pagination-page': 'Page',
        'pagination-all': 'All',
        
        // Expense Categories
        'expense-category-products': 'Product Supply',
        'expense-auto-product-add': 'Auto supply: {productName} ({quantity} units × ${cost})',
        
        // Add Quantity Feature
        'add-new-quantity': 'Add New Quantity',
        'new-quantity': 'New Quantity',
        'new-cost-per-unit': 'New Cost Per Unit (USD)',
        'new-cost-calculation': 'New Cost Calculation:'
    }
};

// دالة الحصول على النص المترجم
function getText(key) {
    return translations[currentLanguage][key] || key;
}

// دالة للحصول على الوقت المحلي كـ ISO string
function getLocalDateTimeISO() {
    const now = new Date();
    // إنشاء timestamp محلي بدون تحويل timezone
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
}

// دالة للحصول على التاريخ المحلي فقط (YYYY-MM-DD)
function getLocalDateString(date = null) {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// دالة لتنسيق التاريخ والوقت
function formatDateTime(dateString, paymentMethod = null) {
    if (!dateString) return '';
    
    // استخدام التاريخ والوقت المباشر لحظة إنشاء البيع
    let date;
    if (dateString.includes('T')) {
        // إذا كان يحتوي على timestamp (مع أو بدون timezone)
        if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
            // timestamp مع timezone
            date = new Date(dateString);
        } else {
            // timestamp محلي بدون timezone - تعامله كوقت محلي مباشرة
            // تحليل timestamp محلي بدون تحويل timezone
            const parts = dateString.split('T');
            if (parts.length === 2) {
                const [datePart, timePart] = parts;
                const [year, month, day] = datePart.split('-').map(Number);
                const timeWithMs = timePart.includes('.') ? timePart : timePart + '.000';
                const [timeOnly, ms] = timeWithMs.split('.');
                const [hours, minutes, seconds] = timeOnly.split(':').map(Number);
                date = new Date(year, month - 1, day, hours, minutes, seconds, Number(ms.padEnd(3, '0')));
            } else {
                date = new Date(dateString);
            }
        }
    } else {
        // إذا كان التاريخ فقط، استخدم الوقت الحالي المحلي
        const now = new Date();
        const localTimeString = now.toTimeString().split(' ')[0]; // HH:MM:SS
        date = new Date(`${dateString}T${localTimeString}`);
    }
    
    if (isNaN(date.getTime())) return dateString; // إذا كان التاريخ غير صحيح، أرجعه كما هو
    
    const isEn = (document.documentElement.lang || 'ar') === 'en';
    
    // عرض الوقت لجميع المبيعات للتأكد من الدقة
    const showTime = true; // عرض الوقت دائماً لضمان الدقة 100%
    
    if (showTime) {
        // إظهار التاريخ والوقت
        if (isEn) {
            // الإنجليزية: YYYY-MM-DD, HH:mm:ss
            const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
            const timeStr = date.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
            return `${dateStr}, ${timeStr}`;
        } else {
            // العربية: YYYY-MM-DD، HH:mm:ss
            const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
            const timeStr = date.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // استخدام المنطقة الزمنية المحلية
            });
            return `${dateStr}، ${timeStr}`;
        }
    } else {
        // إظهار التاريخ فقط
        if (isEn) {
            return date.toLocaleDateString('en-CA'); // YYYY-MM-DD
        } else {
            return date.toLocaleDateString('en-CA'); // YYYY-MM-DD (نفس التنسيق للعربية)
        }
    }
}

// دالة تغيير اللغة
function changeLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // حفظ اللغة المختارة
    try { localStorage.setItem('appLanguage', lang); } catch(e) {}

    // استدعاء مترجم الواجهة الآخر إن وجد (لتغطية عناصر إضافية)
    if (typeof window.translateUI === 'function') {
        try { window.translateUI(lang); } catch(e) {}
    }
    
    // تطبيق الترجمات على جميع العناصر
    applyTranslations();
    
    // تحديث عرض الترخيص بعد الترجمة
    setTimeout(async () => {
        await updateSettingsLicenseDisplay();
        if (typeof updateVisualSubscriptionIndicator === 'function') {
            updateVisualSubscriptionIndicator();
        }
    }, 100);
    
    // إصلاح عناصر الإعدادات
    setTimeout(() => {
        const supportPhoneDesc = document.querySelector('[data-i18n="support-phone-desc"]');
        if (supportPhoneDesc) {
            supportPhoneDesc.textContent = getText('support-phone-desc');
        }
        
        const navCashbox = document.querySelector('[data-i18n="nav_cashbox"]');
        if (navCashbox) {
            navCashbox.textContent = getText('nav_cashbox');
        }
        
        const cashMovement = document.querySelector('[data-i18n="cash-movement"]');
        if (cashMovement) {
            cashMovement.textContent = getText('cash-movement');
        }
        
        // إصلاح مباشر للزر
        updateCashMovementButtonTranslation();
        
        // إصلاح أزرار الإعدادات
        const saveStoreBtn = document.querySelector('#saveStoreInfo span');
        if (saveStoreBtn) {
            saveStoreBtn.textContent = getText('save-store-info');
        }
        
        const renewBtn = document.querySelector('#renewLicenseBtn span');
        if (renewBtn) {
            renewBtn.textContent = getText('renew-license');
        }
        
        // إصلاح تسميات معلومات المتجر
        const storeNameLabel = document.querySelector('label[data-i18n="store-name"]');
        if (storeNameLabel) {
            storeNameLabel.textContent = getText('store-name');
        }
        
        const storeAddressLabel = document.querySelector('label[data-i18n="store-address"]');
        if (storeAddressLabel) {
            storeAddressLabel.textContent = getText('store-address');
        }
        
        const storePhoneLabel = document.querySelector('label[data-i18n="store-phone"]');
        if (storePhoneLabel) {
            storePhoneLabel.textContent = getText('store-phone');
        }
        
        // إصلاح نص الأزرار
        setTimeout(() => {
            if (typeof window.fixSettingsButtonsText === 'function') {
                window.fixSettingsButtonsText();
            }
        }, 100);
        
        // إصلاح إضافي بعد فترة أطول
        setTimeout(() => {
            if (typeof window.fixSettingsButtonsText === 'function') {
                window.fixSettingsButtonsText();
            }
        }, 500);
    }, 200);
    
    // تحديث نظام البحث المتقدم للعملاء
    if (typeof updateCustomerSearchTranslation === 'function') {
        try { updateCustomerSearchTranslation(); } catch(e) {}
    }
    
    // تحديث placeholder للبحث
    const customerSearch = document.getElementById('customerSearch');
    if (customerSearch) {
        customerSearch.placeholder = getText('search-customer');
    }
    
    // تحديث placeholder للبحث في البيع بالدين
    const creditCustomerSearch = document.getElementById('creditCustomerSearch');
    if (creditCustomerSearch) {
        creditCustomerSearch.placeholder = getText('search-customer');
    }

    // تطبيق الترجمات المعتمدة على getText
    try { applyTranslations(); } catch(e) {}
    try { translateCustomerActionButtons(); } catch(e) {}
    try { translateProductActionButtons(); } catch(e) {}
    try { translateReports(); } catch(e) {}
    try { translateProfitReports(); } catch(e) {}
    try { translateInventoryCapital(); } catch(e) {}
    try { translateExpensesReport(); } catch(e) {}
    try { translateEditCustomerModal(); } catch(e) {}
    try { translateAddCustomerModal(); } catch(e) {}
    try { translateProductActionButtons(); } catch(e) {}
    try { translateInlineEditPriceButtons(); } catch(e) {}
    try { translateAddProductModal(); } catch(e) {}
    try { translatePurchasesPage(); } catch(e) {}
    try { translatePurchaseModal(); } catch(e) {}
    try { translatePurchaseActionButtons(); } catch(e) {}
    try { translateSuppliersPage(); } catch(e) {}
    try { translateSupplierPaymentModal(); } catch(e) {}
    try { translateSupplierActionButtons(); } catch(e) {}
    try { translateCashboxHistoryUI(); } catch(e) {}

    // مزامنة اختيار الواجهة
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = lang;
    }

    // إشعار
    showMessage(getText('language-changed'), 'success');
    
    // إعادة تحديث عرض الترخيص بعد تغيير اللغة
    setTimeout(() => {
        updateSettingsLicenseDisplay();
    }, 100);
}

// دالة تطبيق الترجمات على جميع العناصر
function applyTranslations() {
    // ترجمة النصوص في الشريط العلوي
    translateElements();
    
    // ترجمة القائمة الجانبية
    translateNavigation();
    
    // تحديث ترجمة pagination للمنتجات إذا كانت موجودة
    if (typeof updateProductsPaginationUI === 'function') {
        try {
            updateProductsPaginationUI();
        } catch(e) {
            // تجاهل الخطأ إذا كانت الصفحة غير محملة
        }
    }
    
    // تحديث عرض حالة الترخيص مع تأخير لضمان جاهزية العناصر
    setTimeout(() => {
        updateSettingsLicenseDisplay();
    }, 50);
    
    // إصلاح عناصر الإعدادات
    setTimeout(() => {
        const supportPhoneDesc = document.querySelector('[data-i18n="support-phone-desc"]');
        if (supportPhoneDesc) {
            supportPhoneDesc.textContent = getText('support-phone-desc');
        }
        
        const supportPhone = document.querySelector('[data-i18n="support-phone"]');
        if (supportPhone) {
            supportPhone.textContent = getText('support-phone');
        }
        
        const navCashbox = document.querySelector('[data-i18n="nav_cashbox"]');
        if (navCashbox) {
            navCashbox.textContent = getText('nav_cashbox');
        }
        
        const cashMovement = document.querySelector('[data-i18n="cash-movement"]');
        if (cashMovement) {
            cashMovement.textContent = getText('cash-movement');
        }
        
        // إصلاح مباشر للزر
        updateCashMovementButtonTranslation();
    }, 100);
    
    // ترجمة نقطة البيع
    translatePOS();
    
    // ترجمة صفحة المبيعات
    translateSales();
    
    // ترجمة صفحة التقارير
    translateReports();
    
    // ترجمة فلاتر التقارير
    translateReportPresets();

    // ترجمة صفحة الفواتير
    translateInvoices();

    // ترجمة الرسائل
    translateMessages();
}

// دالة ترجمة العناصر العامة
function translateElements() {
    // ترجمة جميع العناصر التي تحتوي على data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key && getText(key)) {
            el.textContent = getText(key);
        }
    });
    
    // ترجمة placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key && getText(key)) {
            el.placeholder = getText(key);
        }
    });
    
    // ترجمة title attributes (tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key && getText(key)) {
            el.title = getText(key);
        }
    });
    
    // ترجمة عنوان النظام
    const systemTitle = document.querySelector('.logo-small span');
    if (systemTitle) {
        systemTitle.textContent = getText('system-title');
    }
    
    // ترجمة زر التحكم في القائمة
    const navToggleBtn = document.getElementById('navToggleBtn');
    if (navToggleBtn) {
        const span = navToggleBtn.querySelector('span');
        if (span) {
            const isCollapsed = document.querySelector('.sidebar').classList.contains('collapsed');
            span.textContent = isCollapsed ? getText('show-menu') : getText('hide-menu');
        }
    }
    
    // ترجمة الصندوق
    const cashRegister = document.querySelector('.cash-indicator span');
    if (cashRegister) {
        cashRegister.textContent = getText('cash-register');
    }
    
    // ترجمة اسم المستخدم
    const currentUser = document.getElementById('currentUser');
    if (currentUser) {
        currentUser.textContent = getText('welcome');
    }
    
    // ترجمة زر الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> ${getText('logout')}`;
    }

    // شاشة تسجيل الدخول
    const loginTitle = document.querySelector('#loginScreen .logo h1');
    if (loginTitle) loginTitle.textContent = getText('login-title');
    const loginSubtitle = document.querySelector('#loginScreen .logo p');
    if (loginSubtitle) loginSubtitle.textContent = getText('login-subtitle');
    const usernameLbl = document.querySelector('label[for="username"]');
    if (usernameLbl) usernameLbl.textContent = getText('username');
    const passwordLbl = document.querySelector('label[for="password"]');
    if (passwordLbl) passwordLbl.textContent = getText('password');
    const loginBtn = document.querySelector('#loginForm .login-btn');
    if (loginBtn) { const icon = loginBtn.querySelector('i'); loginBtn.textContent = getText('login'); if (icon) loginBtn.prepend(icon); }
    const demoInfoH4 = document.querySelector('#loginScreen .demo-info h4');
    if (demoInfoH4) demoInfoH4.textContent = getText('demo-data');
}

// دالة ترجمة القائمة الجانبية
function translateNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const translations_map = {
        'dashboard': 'dashboard',
        'pos': 'pos',
        'products': 'products',
        'sales': 'sales',
        'customers': 'customers',
        'purchases': 'purchases',
        'suppliers': 'suppliers',
        'reports': 'reports',
        'settings': 'settings'
    };
    
    navItems.forEach(item => {
        const screen = item.getAttribute('data-screen');
        const span = item.querySelector('span');
        if (span && translations_map[screen]) {
            span.textContent = getText(translations_map[screen]);
        }
    });
}

// دالة ترجمة نقطة البيع
function translatePOS() {
    // ترجمة عناصر نقطة البيع
    const currencyLabelEl = document.querySelector('label[for="currency"]') || (document.getElementById('currency')?.closest('.control-group')?.querySelector('label'));
    const priceTypeLabelEl = document.querySelector('label[for="priceType"]') || (document.getElementById('priceType')?.closest('.control-group')?.querySelector('label'));
    const paymentMethodLabelEl = document.querySelector('label[for="paymentMethod"]') || (document.getElementById('paymentMethod')?.closest('.control-group')?.querySelector('label'));

    const posElements = {
        'currency': currencyLabelEl,
        'priceType': priceTypeLabelEl,
        'exchangeRate': document.getElementById('exchangeRate'),
        'productSearch': document.getElementById('productSearch'),
        'cart': document.querySelector('.cart-section h3'),
        'finalTotal': document.querySelector('#finalTotal').previousElementSibling,
        'paymentMethod': paymentMethodLabelEl,
        'processPayment': document.getElementById('processPayment'),
        'clearCart': document.getElementById('clearCart')
    };
    
    if (posElements.currency) posElements.currency.textContent = getText('currency');
    if (posElements.priceType) posElements.priceType.textContent = getText('price-type');
    if (posElements.exchangeRate) {
        const rateSuffix = (currentLanguage === 'en') ? 'LBP' : 'ل.ل';
        const rateVal = (settings && settings.exchangeRate) ? Number(settings.exchangeRate) : 89500;
        posElements.exchangeRate.textContent = `${getText('exchange-rate')}: ${rateVal.toLocaleString()} ${rateSuffix}`;
    }
    if (posElements.productSearch) posElements.productSearch.placeholder = getText('search-product');
    if (posElements.cart) posElements.cart.innerHTML = `<i class="fas fa-shopping-cart"></i> ${getText('cart')}`;
    if (posElements.finalTotal) posElements.finalTotal.textContent = getText('final-total');
    if (posElements.paymentMethod) posElements.paymentMethod.textContent = getText('payment-method');
    if (posElements.processPayment) posElements.processPayment.innerHTML = `<i class="fas fa-credit-card"></i> ${getText('process-payment')}`;
    if (posElements.clearCart) posElements.clearCart.innerHTML = `<i class="fas fa-trash"></i> ${getText('clear-cart')}`;
    
    // ترجمة Placeholder لحقل المبلغ المدفوع في الدفع النقدي
    const amountPaidInput = document.getElementById('amountPaid');
    if (amountPaidInput) amountPaidInput.placeholder = getText('amount');
    // ترجمة Placeholder لحقل المبلغ في الدفع الجزئي
    const partialAmountInput = document.getElementById('partialAmount');
    if (partialAmountInput) partialAmountInput.placeholder = getText('pay-debt-amount') || getText('amount');

    // ترجمة خيارات طريقة الدفع
    const paymentMethodSelect = document.getElementById('paymentMethod');
    if (paymentMethodSelect) {
        const options = paymentMethodSelect.querySelectorAll('option');
        if (options[0]) options[0].textContent = getText('cash-payment');
        if (options[1]) options[1].textContent = getText('credit-sale');
        if (options[2]) options[2].textContent = getText('partial-payment');
    }
    // ترجمة خيارات نوع السعر
    const priceTypeSelect = document.getElementById('priceType');
    if (priceTypeSelect) {
        const pOpts = priceTypeSelect.querySelectorAll('option');
        if (pOpts[0]) pOpts[0].textContent = `${getText('retail')} 🏪`;
        if (pOpts[1]) pOpts[1].textContent = `${getText('wholesale')} 📦`;
        if (pOpts[2]) pOpts[2].textContent = `${getText('vip')} ⭐`;
    }
    // ترجمة خيارات العملة في أعلى نقطة البيع
    const currencySelect = document.getElementById('currency');
    if (currencySelect && currencySelect.options.length >= 2) {
        currencySelect.options[0].textContent = getText('currency-usd');
        currencySelect.options[1].textContent = getText('currency-lbp');
    }
    // ترجمة حقول عملة الدفع في الأقسام الداخلية إن وُجدت
    const payCurrency = document.getElementById('paymentCurrency');
    if (payCurrency && payCurrency.options.length >= 2) {
        payCurrency.options[0].textContent = getText('currency-usd');
        payCurrency.options[1].textContent = getText('currency-lbp');
    }
    const partialCurrency = document.getElementById('partialCurrency');
    if (partialCurrency && partialCurrency.options.length >= 2) {
        partialCurrency.options[0].textContent = getText('currency-usd');
        partialCurrency.options[1].textContent = getText('currency-lbp');
    }
    
    // ترجمة عناصر البيع بالدين
    const creditSaleSection = document.querySelector('#creditSaleSection .credit-feature-highlight h3');
    if (creditSaleSection) creditSaleSection.textContent = getText('credit-sale');
    
    const creditSaleDesc = document.querySelector('#creditSaleSection .credit-feature-highlight p');
    if (creditSaleDesc) creditSaleDesc.textContent = getText('credit-sale-desc');
    
    const creditCustomerLabel = document.querySelector('#creditSaleSection label');
    if (creditCustomerLabel) creditCustomerLabel.textContent = getText('choose-customer-label');
    
}

// دالة ترجمة صفحة المبيعات
function translateSales() {
    // ترجمة عنوان صفحة المبيعات
    const salesHeader = document.querySelector('#sales .page-header h2');
    if (salesHeader) {
        salesHeader.innerHTML = `<i class="fas fa-receipt"></i> ${getText('sales-management')}`;
    }
    
    // ترجمة أزرار الفلترة
    const filterBtn = document.getElementById('filterSales');
    if (filterBtn) filterBtn.textContent = getText('filter');
    
    const resetBtn = document.getElementById('resetFilter');
    if (resetBtn) resetBtn.textContent = getText('reset');

    // ترجمة حقل البحث داخل المبيعات
    const salesSearch = document.getElementById('salesSearch');
    if (salesSearch) salesSearch.placeholder = getText('search-sales');
    
    // ترجمة خيارات الفلترة
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        const options = statusFilter.querySelectorAll('option');
        if (options[0]) options[0].textContent = getText('all-sales');
        if (options[1]) options[1].textContent = getText('completed-only');
        if (options[2]) options[2].textContent = getText('returned-only');
        if (options[3]) options[3].textContent = getText('partial-only');
    }
    
    // ترجمة رؤوس الجدول (ثمانية أعمدة بما فيها الخصومات)
    const salesTheadHeaders = document.querySelectorAll('#sales thead th');
    if (salesTheadHeaders && salesTheadHeaders.length >= 8) {
        salesTheadHeaders[0].textContent = getText('invoice-number');
        salesTheadHeaders[1].textContent = getText('date');
        salesTheadHeaders[2].textContent = getText('customer');
        salesTheadHeaders[3].textContent = getText('amount');
        salesTheadHeaders[4].textContent = getText('payment-method');
        salesTheadHeaders[5].textContent = getText('discounts');
        salesTheadHeaders[6].textContent = getText('status');
        salesTheadHeaders[7].textContent = getText('actions');
    }
    
    // ترجمة بيانات الجدول
    translateSalesTableData();
}

// دالة ترجمة بيانات جدول المبيعات
function translateSalesTableData() {
    const salesRows = document.querySelectorAll('#salesTable tr');
    salesRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            // ترجمة طريقة الدفع داخل الجدول (نقدي/بطاقة/دفع جزئي/بيع بالدين)
            if (cells[4]) {
                const rawPay = (cells[4].textContent || '').trim();
                if (rawPay === 'نقدي' || rawPay.toLowerCase() === 'cash') {
                    cells[4].textContent = getText('cash');
                } else if (rawPay === 'بطاقة' || rawPay.toLowerCase() === 'card') {
                    cells[4].textContent = getText('card');
                } else if (rawPay.includes('دفع جزئي') || /partial/i.test(rawPay)) {
                    cells[4].textContent = getText('partial-payment');
                } else if (rawPay.includes('بيع بالدين') || /credit sale/i.test(rawPay) || /credit/i.test(rawPay)) {
                    cells[4].textContent = getText('credit-sale');
                }
            }
            
            // ترجمة الحالة (العمود السابع، مع شارة حالة داخلية)
            const statusCell = cells[6] || cells[5];
            if (statusCell) {
                const badge = statusCell.querySelector('.status-badge') || statusCell;
                const statusText = (badge.textContent || '').trim();
                if (statusText === 'مكتملة' || statusText === 'Completed') {
                    badge.textContent = getText('completed');
                } else if (statusText === 'مرجعة' || statusText === 'مرجعة كاملة' || statusText === 'Returned') {
                    badge.textContent = getText('returned');
                } else if (statusText === 'مرجعة جزئياً' || statusText === 'Partially Returned') {
                    badge.textContent = getText('partial');
                }
            }
            
            // ترجمة اسم العميل
            if (cells[2]) {
                const customerText = cells[2].textContent;
                if (customerText === 'عميل عادي') cells[2].textContent = getText('regular-customer');
            }
            
            // ترجمة أزرار الإجراءات (حسب الصنف/الأيقونة وليس النص)
            if (cells[7] || cells[6]) {
                const actionsCell = cells[7] || cells[6];
                const actionBtns = actionsCell.querySelectorAll('button');
                actionBtns.forEach(btn => {
                    const icon = btn.querySelector('i');
                    if (btn.classList.contains('return-btn')) {
                        btn.innerHTML = `<i class="fas fa-undo"></i> ${getText('refund')}`;
                    } else if (btn.classList.contains('view-btn')) {
                        btn.innerHTML = `<i class="fas fa-eye"></i> ${getText('view')}`;
                    } else if (icon && icon.classList.contains('fa-print')) {
                        btn.innerHTML = `<i class="fas fa-print"></i> ${getText('print')}`;
                    } else if (btn.disabled) {
                        // زر معطل لبيعة مُرجعة
                        btn.innerHTML = `<i class="fas fa-check"></i> ${getText('returned')}`;
                    }
                });
            }
        }
    });
}

// ترجمة أزرار جدول العملاء (تعديل/حذف/السجل/تسديد دين)
function translateCustomerActionButtons() {
    try {
        const rows = document.querySelectorAll('#customersTable tr');
        rows.forEach(row => {
            const actionsCell = row.querySelector('td:last-child');
            if (!actionsCell) return;
            
            // ترجمة زر Actions الرئيسي
            const toggleBtn = actionsCell.querySelector('.actions-toggle-btn');
            if (toggleBtn) {
                toggleBtn.innerHTML = `<i class="fas fa-ellipsis-v"></i> ${getText('actions')}`;
            }
            
            // ترجمة أزرار القائمة المنسدلة
            const editBtn = actionsCell.querySelector('.dropdown-action-btn.edit-btn');
            if (editBtn) editBtn.innerHTML = `<i class="fas fa-edit"></i> ${getText('edit')}`;
            
            const deleteBtn = actionsCell.querySelector('.dropdown-action-btn.delete-btn');
            if (deleteBtn) deleteBtn.innerHTML = `<i class="fas fa-trash"></i> ${getText('delete')}`;
            
            const logBtn = actionsCell.querySelector('.dropdown-action-btn.customer-log-btn');
            if (logBtn) logBtn.innerHTML = `<i class="fas fa-list"></i> ${getText('log')}`;
            
            const payBtn = actionsCell.querySelector('.dropdown-action-btn.pay-debt-btn');
            if (payBtn) payBtn.innerHTML = `<i class="fas fa-dollar-sign"></i> ${getText('pay-debt')}`;
        });
    } catch(_) {}
}

// ترجمة أزرار جدول المنتجات (تعديل/طباعة باركود/حذف)
function translateProductActionButtons() {
    try {
        const rows = document.querySelectorAll('#productsTable tr');
        rows.forEach(row => {
            const actionsCell = row.querySelector('td:last-child');
            if (!actionsCell) return;
            
            const editBtn = actionsCell.querySelector('.edit-btn');
            if (editBtn) editBtn.innerHTML = `<i class="fas fa-edit"></i> ${getText('edit')}`;
            
            const printBtn = actionsCell.querySelector('.print-barcode-btn');
            if (printBtn) printBtn.innerHTML = `<i class="fas fa-barcode"></i> ${getText('print-barcode')}`;
            
            const deleteBtn = actionsCell.querySelector('.delete-btn');
            if (deleteBtn) deleteBtn.innerHTML = `<i class="fas fa-trash"></i> ${getText('delete')}`;
        });
    } catch(_) {}
}

// ترجمة نافذة Profit Reports
function translateProfitReports() {
    try {
        // ترجمة العناوين في الملخص
        const summaryTitles = document.querySelectorAll('#profitSummary .profit-summary-title[data-i18n]');
        summaryTitles.forEach(title => {
            const key = title.getAttribute('data-i18n');
            title.textContent = getText(key);
        });
        
        // ترجمة رؤوس الجدول
        const tableHeaders = document.querySelectorAll('#profitReportsModal .data-table th[data-i18n]');
        tableHeaders.forEach(header => {
            const key = header.getAttribute('data-i18n');
            header.textContent = getText(key);
        });
        
        // ترجمة الأزرار والفلاتر
        const applyBtn = document.querySelector('#profitReportsModal .filter-btn[data-i18n="apply"]');
        if (applyBtn) applyBtn.textContent = getText('apply');
        
        const csvBtn = document.querySelector('#profitReportsModal .report-btn[onclick="exportProfitCSV()"]');
        if (csvBtn) csvBtn.innerHTML = `<i class="fas fa-file-csv"></i> CSV`;
        
        const pdfBtn = document.querySelector('#profitReportsModal .report-btn[onclick="exportProfitPDF()"]');
        if (pdfBtn) pdfBtn.innerHTML = `<i class="fas fa-file-pdf"></i> PDF`;
        
    } catch(_) {}
}

// ترجمة نافذة Inventory Capital
function translateInventoryCapital() {
    try {
        // ترجمة العناوين في الملخص
        const summaryTitles = document.querySelectorAll('#capitalSummary .capital-summary-title[data-i18n]');
        summaryTitles.forEach(title => {
            const key = title.getAttribute('data-i18n');
            title.textContent = getText(key);
        });
        
        // ترجمة رؤوس الجدول
        const tableHeaders = document.querySelectorAll('#inventoryCapitalModal .data-table th[data-i18n]');
        tableHeaders.forEach(header => {
            const key = header.getAttribute('data-i18n');
            header.textContent = getText(key);
        });
        
        // ترجمة الأزرار
        const updateBtn = document.querySelector('#inventoryCapitalModal .report-btn[data-i18n="update"]');
        if (updateBtn) updateBtn.textContent = getText('update');
        
        const csvBtn = document.querySelector('#inventoryCapitalModal .report-btn[onclick="exportCapitalCSV()"]');
        if (csvBtn) csvBtn.innerHTML = `<i class="fas fa-file-csv"></i> CSV`;
        
    } catch(_) {}
}
// دالة ترجمة صفحة التقارير
function translateReports() {
    // ترجمة عنوان صفحة التقارير
    const reportsHeader = document.querySelector('#reports .page-header h2');
    if (reportsHeader) {
        reportsHeader.innerHTML = `<i class="fas fa-chart-bar"></i> ${getText('reports')}`;
    }
    
    // ترجمة بطاقات التقارير (مطابقة حسب الزر داخل البطاقة بدلاً من الفهرس)
    const reportMap = [
        { selector: 'button[onclick="showSalesReport()"]', titleKey: 'sales-report', descKey: 'sales-report-desc' },
        { selector: 'button[onclick="showInventoryReport()"]', titleKey: 'inventory-report', descKey: 'inventory-report-desc' },
        { selector: 'button[onclick="showCustomersReport()"]', titleKey: 'customers-report', descKey: 'customers-report-desc' },
        { selector: 'button[onclick="showFinancialReport()"]', titleKey: 'financial-report', descKey: 'financial-report-desc' },
        // بطاقات إضافية: Profit Reports و Inventory Capital
        { selector: 'button[onclick="showProfitReports()"]', titleKey: 'profit-reports', descKey: 'profit-reports-desc' },
        { selector: 'button[onclick="showInventoryCapital()"]', titleKey: 'inventory-capital', descKey: 'inventory-capital-desc' }
    ];

    reportMap.forEach(({ selector, titleKey, descKey }) => {
        const btn = document.querySelector(`#reports .report-card ${selector}`);
        if (!btn) return;
        const card = btn.closest('.report-card');
        if (!card) return;
        const titleEl = card.querySelector('h3');
        const descEl = card.querySelector('p');
        const icon = titleEl ? titleEl.querySelector('i') : null;
        if (titleEl) { 
            // تحديث النص مع الحفاظ على الأيقونة
            const span = titleEl.querySelector('span[data-i18n]');
            if (span) {
                span.textContent = getText(titleKey);
            } else {
                titleEl.textContent = ` ${getText(titleKey)}`; 
                if (icon) titleEl.prepend(icon); 
            }
        }
        if (descEl) { 
            // تحديث النص مع الحفاظ على data-i18n
            if (descEl.hasAttribute('data-i18n')) {
                descEl.textContent = getText(descKey);
            } else {
                descEl.textContent = getText(descKey); 
            }
        }
        if (btn) { btn.textContent = getText('view-report'); }
    });
}

// ترجمة زر تعديل السعر داخل بطاقة المنتج
function translateInlineEditPriceButtons() {
    const isEn = (document.documentElement.lang || 'ar') === 'en';
    const buttons = document.querySelectorAll('.edit-price-btn');
    buttons.forEach(btn => {
        btn.title = isEn ? 'Edit Price' : 'تعديل السعر';
        btn.innerHTML = `<i class="fas fa-edit"></i> ${isEn ? 'Edit Price' : 'تعديل السعر'}`;
        btn.style.whiteSpace = 'nowrap';
    });
}

// ترجمة صفحة المشتريات (العنوان والأزرار والرؤوس)
function translatePurchasesPage() {
    const lang = document.documentElement.lang || 'ar';
    const header = document.querySelector('#purchases .page-header h2');
    if (header) { const icon = header.querySelector('i'); header.textContent = ' ' + (lang==='en' ? 'Purchase Invoice' : 'فاتورة شراء'); if (icon) header.prepend(icon); }
    const newBtn = document.getElementById('newPurchaseBtn');
    if (newBtn) { const icon = newBtn.querySelector('i'); newBtn.textContent = (lang==='en' ? 'New Invoice' : 'فاتورة جديدة'); if (icon) newBtn.prepend(icon); }
    const ths = document.querySelectorAll('#purchases thead th');
    if (ths && ths.length >= 9) {
        const labelsAr = ['التاريخ','المورّد','العملة','الإجمالي','المدفوع','المتبقي','الاستحقاق','الحالة','الإجراءات'];
        const labelsEn = ['Date','Supplier','Currency','Total','Paid','Remaining','Due','Status','Actions'];
        const labels = lang==='en' ? labelsEn : labelsAr;
        ths.forEach((th,i)=> th.textContent = labels[i]);
    }
    translatePurchaseActionButtons();
}

// ترجمة أزرار جدول المشتريات
function translatePurchaseActionButtons() {
    const lang = document.documentElement.lang || 'ar';
    document.querySelectorAll('#purchasesTable tr').forEach(row => {
        const actionsCell = row.querySelector('td:last-child');
        if (!actionsCell) return;
        const viewBtn = actionsCell.querySelector('.view-btn');
        if (viewBtn) viewBtn.innerHTML = `<i class="fas fa-eye"></i> ${lang==='en'?'View':'عرض'}`;
        const retBtn = actionsCell.querySelector('.return-btn');
        if (retBtn) retBtn.innerHTML = `<i class="fas fa-undo"></i> ${lang==='en'?'Return':'إرجاع'}`;
    });
}

// ترجمة نافذة فاتورة الشراء (إنشاء/تعديل)
function translatePurchaseModal() {
    const lang = document.documentElement.lang || 'ar';
    const t = lang==='en' ? {
        title: 'Purchase Invoice',
        supplier: 'Supplier',
        bill_date: 'Invoice Date',
        due_date: 'Due Date',
        currency: 'Currency',
        rate: 'LBP rate at creation',
        items: 'Items',
        add_item: 'Add Item',
        total: 'Total',
        save: 'Save',
        save_pay: 'Save and Pay Now',
        cancel: 'Cancel',
        item_price_ph: 'Purchase price'
    } : {
        title: 'فاتورة شراء',
        supplier: 'المورّد',
        bill_date: 'تاريخ الفاتورة',
        due_date: 'تاريخ الاستحقاق',
        currency: 'العملة',
        rate: 'سعر صرف الليرة وقت الإنشاء',
        items: 'البنود',
        add_item: 'إضافة بند',
        total: 'الإجمالي',
        save: 'حفظ',
        save_pay: 'حفظ وادفع الآن',
        cancel: 'إلغاء',
        item_price_ph: 'سعر الشراء'
    };
    const modal = document.getElementById('purchaseModal');
    if (!modal) return;
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = t.title;
    const groups = modal.querySelectorAll('.report-body .form-group');
    if (groups && groups.length >= 6) {
        groups[0].querySelector('label').textContent = t.supplier;
        groups[1].querySelector('label').textContent = t.bill_date;
        groups[2].querySelector('label').textContent = t.due_date;
        groups[3].querySelector('label').textContent = t.currency;
        groups[4].querySelector('label').textContent = t.rate;
        groups[5].querySelector('label').textContent = t.items;
        const addBtn = groups[5].querySelector('#addPurchaseItem');
        if (addBtn) { const icon = addBtn.querySelector('i'); addBtn.textContent = ' ' + t.add_item; if (icon) addBtn.prepend(icon); }
    }
    const totalLbl = modal.querySelector('.report-body .form-group:nth-of-type(7) label');
    if (totalLbl) totalLbl.textContent = t.total;
    const actions = modal.querySelectorAll('.modal-actions button');
    if (actions && actions.length >= 3) {
        actions[0].textContent = t.save;
        actions[1].textContent = t.save_pay;
        actions[2].textContent = t.cancel;
    }
    // تحديث placeholder لسعر الشراء في صفوف العناصر الحالية
    modal.querySelectorAll('.purchase-item-price').forEach(inp => {
        inp.placeholder = t.item_price_ph;
    });
}
// ترجمة واجهة نافذة استرجاع المبيعة
function translateReturnModalUI() {
    const lang = document.documentElement.lang || 'ar';
    const t = lang === 'en' ? {
        title: 'Return Sale',
        sale_details: 'Sale Details',
        invoice_no: 'Invoice #',
        customer: 'Customer',
        total: 'Total',
        pay_method: 'Payment Method',
        options: 'Return Options',
        type_label: 'Return Type:',
        type_full: 'Full Return',
        type_partial: 'Partial Return',
        reason_label: 'Return Reason:',
        reason_defective: 'Defective',
        reason_wrong: 'Wrong Item',
        reason_change: 'Customer Changed Mind',
        reason_size: 'Size Issue',
        reason_other: 'Other',
        notes: 'Additional Notes',
        summary: 'Return Summary',
        refunded_amount: 'Refunded Amount:',
        refund_method: 'Refund Method:',
        confirm: 'Confirm Return',
        cancel: 'Cancel'
    } : {
        title: 'استرجاع المبيعة',
        sale_details: 'تفاصيل المبيعة',
        invoice_no: 'رقم الفاتورة',
        customer: 'العميل',
        total: 'المبلغ الإجمالي',
        pay_method: 'طريقة الدفع',
        options: 'خيارات الاسترجاع',
        type_label: 'نوع الاسترجاع:',
        type_full: 'استرجاع كامل',
        type_partial: 'استرجاع جزئي',
        reason_label: 'سبب الاسترجاع:',
        reason_defective: 'منتج معيب',
        reason_wrong: 'منتج خاطئ',
        reason_change: 'تغيير رأي العميل',
        reason_size: 'مشكلة في الحجم',
        reason_other: 'أخرى',
        notes: 'ملاحظات إضافية',
        summary: 'ملخص الاسترجاع',
        refunded_amount: 'المبلغ المسترجع:',
        refund_method: 'طريقة الإرجاع:',
        confirm: 'تأكيد الاسترجاع',
        cancel: 'إلغاء'
    };

    const modal = document.getElementById('returnSaleModal');
    if (!modal) return;
    const header = modal.querySelector('.modal-header h3');
    if (header) header.innerHTML = (lang === 'en' ? '<i class="fas fa-undo"></i> ' : '<i class="fas fa-undo"></i> ') + t.title;

    const detailsTitle = modal.querySelector('.return-info .sale-details h4');
    if (detailsTitle) detailsTitle.textContent = t.sale_details;
    const detailsLabels = modal.querySelectorAll('.sale-details .detail-row span:first-child');
    if (detailsLabels && detailsLabels.length >= 4) {
        detailsLabels[0].textContent = t.invoice_no + ':';
        detailsLabels[1].textContent = t.customer + ':';
        detailsLabels[2].textContent = t.total + ':';
        detailsLabels[3].textContent = t.pay_method + ':';
    }

    const optionsTitle = modal.querySelector('.return-options h4');
    if (optionsTitle) optionsTitle.textContent = t.options;
    const typeLabel = modal.querySelector('#returnType')?.closest('.form-group')?.querySelector('label');
    if (typeLabel) typeLabel.textContent = t.type_label;
    const returnType = document.getElementById('returnType');
    if (returnType && returnType.options.length >= 2) {
        returnType.options[0].textContent = t.type_full;
        returnType.options[1].textContent = t.type_partial;
    }
    const reasonLabel = modal.querySelector('#returnReason')?.closest('.form-group')?.querySelector('label');
    if (reasonLabel) reasonLabel.textContent = t.reason_label;
    const reasonSel = document.getElementById('returnReason');
    if (reasonSel && reasonSel.options.length >= 5) {
        reasonSel.options[0].textContent = t.reason_defective;
        reasonSel.options[1].textContent = t.reason_wrong;
        reasonSel.options[2].textContent = t.reason_change;
        reasonSel.options[3].textContent = t.reason_size;
        reasonSel.options[4].textContent = t.reason_other;
    }
    const notesLabel = modal.querySelector('#returnNotes')?.closest('.form-group')?.querySelector('label');
    if (notesLabel) notesLabel.textContent = t.notes;

    const summaryTitle = modal.querySelector('.return-summary h4');
    if (summaryTitle) summaryTitle.textContent = t.summary;
    const summaryLabels = modal.querySelectorAll('.return-summary .summary-row span:first-child');
    if (summaryLabels && summaryLabels.length >= 2) {
        summaryLabels[0].textContent = t.refunded_amount;
        summaryLabels[1].textContent = t.refund_method;
    }

    // أزرار التذييل
    const footerBtns = modal.querySelectorAll('.modal-actions button');
    if (footerBtns && footerBtns.length >= 2) {
        const confirmBtn = footerBtns[0];
        const cancelBtn = footerBtns[1];
        const confirmIcon = confirmBtn.querySelector('i');
        const cancelIcon = cancelBtn.querySelector('i');
        confirmBtn.textContent = t.confirm;
        cancelBtn.textContent = t.cancel;
        if (confirmIcon) confirmBtn.prepend(confirmIcon);
        if (cancelIcon) cancelBtn.prepend(cancelIcon);
    }
}

// ترجمة إعدادات التقارير: الفترات والأزرار
function translateReportPresets() {
    const preset = document.getElementById('reportPreset');
    if (preset && preset.options.length >= 8) {
        preset.options[0].textContent = getText('today');
        preset.options[1].textContent = getText('yesterday');
        preset.options[2].textContent = getText('this-week');
        preset.options[3].textContent = getText('last-7-days');
        preset.options[4].textContent = getText('this-month');
        preset.options[5].textContent = getText('last-30-days');
        preset.options[6].textContent = getText('this-year');
        preset.options[7].textContent = getText('custom');
    }
    const applyBtn = document.getElementById('applyReportFilter');
    if (applyBtn) applyBtn.textContent = getText('apply');
    const openHist = document.getElementById('openSalesHistory');
    if (openHist) { const icon = openHist.querySelector('i'); openHist.textContent = getText('sales-history'); if (icon) openHist.prepend(icon); }
}

// ترجمة واجهة سجل الصندوق (الرؤوس، الفلاتر، العنوان، زر تحميل المزيد)
function translateCashboxHistoryUI() {
    const t = (k)=> getText(k);
    // عنوان الصفحة
    const header = document.querySelector('#cashboxHistory .page-header h2 span[data-i18n="cashbox-history"]');
    if (header) header.textContent = t('cashbox-history');
    // الفلاتر
    const typeSel = document.getElementById('cashboxTypeFilter');
    if (typeSel && typeSel.options.length >= 4) {
        typeSel.options[0].textContent = t('cashbox-all-types');
        typeSel.options[1].textContent = t('cashbox-deposit');
        typeSel.options[2].textContent = t('cashbox-expense');
        typeSel.options[3].textContent = t('cashbox-transfer');
    }
    const currSel = document.getElementById('cashboxCurrencyFilter');
    if (currSel && currSel.options.length >= 3) {
        currSel.options[0].textContent = t('cashbox-all-currencies');
    }
    const search = document.getElementById('cashboxSearch');
    if (search) search.placeholder = t('cashbox-search-placeholder');
    const applyBtn = document.getElementById('cashboxApplyFilter');
    if (applyBtn) applyBtn.textContent = t('cashbox-apply-filter');
    const resetBtn = document.getElementById('cashboxResetFilter');
    if (resetBtn) resetBtn.textContent = t('cashbox-reset-filter');
    const exportBtn = document.getElementById('cashboxExportCsv');
    if (exportBtn) exportBtn.textContent = t('cashbox-export-csv');
    // رؤوس الجدول
    const heads = document.querySelectorAll('#cashboxHistory thead th');
    if (heads && heads.length >= 6) {
        heads[0].textContent = t('cashbox-type');
        heads[1].textContent = t('cashbox-amount-usd');
        heads[2].textContent = t('cashbox-amount-lbp');
        heads[3].textContent = t('cashbox-date-time');
        heads[4].textContent = t('cashbox-description');
        heads[5].textContent = t('cashbox-user');
    }
    const loadMoreBtn = document.getElementById('loadMoreCashboxBtn');
    if (loadMoreBtn) loadMoreBtn.innerHTML = `<i class="fas fa-chevron-down"></i> ${t('cashbox-load-more')}`;
}

// ترجمة صفحة الموردين (العنوان، الأزرار، رؤوس الجدول والبحث)
function translateSuppliersPage() {
    const lang = document.documentElement.lang || 'ar';
    const header = document.querySelector('#suppliers .page-header h2');
    if (header) { const icon = header.querySelector('i'); header.textContent = ' ' + (lang==='en' ? 'Suppliers Management' : 'إدارة الموردين'); if (icon) header.prepend(icon); }
    const addBtn = document.getElementById('addSupplierBtn');
    if (addBtn) { const icon = addBtn.querySelector('i'); addBtn.textContent = (lang==='en' ? 'Add Supplier' : 'إضافة مورد'); if (icon) addBtn.prepend(icon); }
    const payBtn = document.getElementById('openSupplierPaymentBtn');
    if (payBtn) { const icon = payBtn.querySelector('i'); payBtn.textContent = (lang==='en' ? 'Pay Supplier' : 'دفع لمورّد'); if (icon) payBtn.prepend(icon); }
    const search = document.getElementById('suppliersSearch');
    if (search) search.placeholder = (lang==='en' ? 'Search in suppliers...' : 'ابحث داخل الموردين...');
    const ths = document.querySelectorAll('#suppliers thead th');
    if (ths && ths.length >= 6) {
        const labelsAr = ['اسم المورد','البريد الإلكتروني','الهاتف','العنوان','الشخص المسؤول','الإجراءات'];
        const labelsEn = ['Supplier Name','Email','Phone','Address','Contact Person','Actions'];
        const labels = lang==='en' ? labelsEn : labelsAr;
        ths.forEach((th,i)=> th.textContent = labels[i]);
    }
    translateSupplierActionButtons();
}

// ترجمة أزرار صفوف الموردين
function translateSupplierActionButtons() {
    document.querySelectorAll('#suppliersTable tr').forEach(row => {
        const actionsCell = row.querySelector('td:last-child');
        if (!actionsCell) return;
        const editBtn = actionsCell.querySelector('.edit-btn');
        if (editBtn) editBtn.innerHTML = `<i class="fas fa-edit"></i> ${getText('edit')}`;
        const delBtn = actionsCell.querySelector('.delete-btn');
        if (delBtn) delBtn.innerHTML = `<i class=\"fas fa-trash\"></i> ${getText('delete')}`;
    });
}

// ترجمة نافذة دفع مورد
function translateSupplierPaymentModal() {
    const lang = document.documentElement.lang || 'ar';
    const t = lang==='en' ? {
        title: 'Pay Supplier',
        supplier: 'Supplier',
        amount: 'Amount',
        currency: 'Currency',
        method: 'Payment Method',
        note: 'Note',
        confirm: 'Confirm Payment',
        cancel: 'Cancel',
        usd: 'USD',
        lbp: 'LBP',
        cash: 'Cash',
        card: 'Card',
        transfer: 'Transfer'
    } : {
        title: 'دفع لمورّد',
        supplier: 'المورّد',
        amount: 'المبلغ',
        currency: 'العملة',
        method: 'طريقة الدفع',
        note: 'ملاحظة',
        confirm: 'تأكيد الدفع',
        cancel: 'إلغاء',
        usd: 'USD',
        lbp: 'LBP',
        cash: 'نقد',
        card: 'بطاقة',
        transfer: 'تحويل'
    };
    const modal = document.getElementById('supplierPaymentModal');
    if (!modal) return;
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = t.title;
    const labels = modal.querySelectorAll('.report-body .form-group label');
    if (labels && labels.length >= 5) {
        labels[0].textContent = t.supplier;
        labels[1].textContent = t.amount;
        labels[2].textContent = t.currency;
        labels[3].textContent = t.method;
        labels[4].textContent = t.note;
    }
    const currencySel = document.getElementById('spCurrency');
    if (currencySel && currencySel.options.length >= 2) {
        currencySel.options[0].textContent = t.usd;
        currencySel.options[1].textContent = t.lbp;
    }
    const methodSel = document.getElementById('spMethod');
    if (methodSel && methodSel.options.length >= 3) {
        methodSel.options[0].textContent = t.cash;
        methodSel.options[1].textContent = t.card;
        methodSel.options[2].textContent = t.transfer;
    }
    const actions = modal.querySelectorAll('.modal-actions button');
    if (actions && actions.length >= 2) {
        const ok = actions[0];
        const cancel = actions[1];
        if (ok) { const icon = ok.querySelector('i'); ok.textContent = ' ' + t.confirm; if (icon) ok.prepend(icon); }
        if (cancel) cancel.textContent = t.cancel;
    }
}

// دالة ترجمة الرسائل
function translateMessages() {
    // حفظ الدالة الأصلية
    if (!window.originalShowMessage) {
        window.originalShowMessage = showMessage;
    }
    
    // تحديث دالة showMessage لتستخدم الترجمات
    window.showMessage = function(message, type = 'success') {
        const translatedMessage = translations[currentLanguage][message] || message;
        window.originalShowMessage(translatedMessage, type);
    };
}

// دالة للحصول على المنتجات المحدثة دائماً
function getCurrentProducts() {
    return loadFromStorage('products', [
    {
        id: 1,
        name: 'كوكاكولا',
        category: 'مشروبات',
        costUSD: 0.60,
        prices: {
            retail: { USD: 1.00, LBP: 89500 },      // مفرق
            wholesale: { USD: 0.85, LBP: 76000 },  // جملة
            vip: { USD: 0.90, LBP: 80500 }         // زبون مميز
        },
        // للتوافق مع الكود القديم
        priceUSD: 1.00,
        priceLBP: 89500,
        stock: 100,
        minStock: 10,
        barcode: '1234567890123',
        supplier: 'شركة المشروبات العالمية'
    },
    {
        id: 2,
        name: 'خبز عربي',
        category: 'مخبوزات',
        costUSD: 0.30,
        prices: {
            retail: { USD: 0.50, LBP: 45000 },      // مفرق
            wholesale: { USD: 0.40, LBP: 36000 },  // جملة
            vip: { USD: 0.45, LBP: 40500 }         // زبون مميز
        },
        // للتوافق مع الكود القديم
        priceUSD: 0.50,
        priceLBP: 45000,
        stock: 50,
        minStock: 5,
        barcode: '2345678901234',
        supplier: 'مخبز الأمل'
    },
    {
        id: 3,
        name: 'شيبس',
        category: 'وجبات خفيفة',
        costUSD: 0.40,
        prices: {
            retail: { USD: 0.75, LBP: 67000 },      // مفرق
            wholesale: { USD: 0.65, LBP: 58000 },  // جملة
            vip: { USD: 0.70, LBP: 62500 }         // زبون مميز
        },
        // للتوافق مع الكود القديم
        priceUSD: 0.75,
        priceLBP: 67000,
        stock: 80,
        minStock: 15,
        barcode: '3456789012345',
        supplier: 'مصنع الوجبات'
    },
    {
        id: 4,
        name: 'ماء',
        category: 'مشروبات',
        costUSD: 0.10,
        prices: {
            retail: { USD: 0.25, LBP: 22000 },      // مفرق
            wholesale: { USD: 0.20, LBP: 18000 },  // جملة
            vip: { USD: 0.22, LBP: 20000 }         // زبون مميز
        },
        // للتوافق مع الكود القديم
        priceUSD: 0.25,
        priceLBP: 22000,
        stock: 200,
        minStock: 20,
        barcode: '4567890123456',
        supplier: 'شركة المياه النقية'
    },
    {
        id: 5,
        name: 'pasta',
        category: 'أطعمة',
        costUSD: 0.80,
        prices: {
            retail: { USD: 1.50, LBP: 134250 },      // مفرق
            wholesale: { USD: 1.20, LBP: 107400 },  // جملة
            vip: { USD: 1.35, LBP: 120825 }         // زبون مميز
        },
        // للتوافق مع الكود القديم
        priceUSD: 1.50,
        priceLBP: 134250,
        stock: 5,
        minStock: 2,
        barcode: '5678901234567',
        supplier: 'شركة الأطعمة الإيطالية'
    },
    {
        id: 6,
        name: 'Accessory 1',
        category: 'إكسسوارات',
        costUSD: 2.00,
        prices: {
            retail: { USD: 3.50, LBP: 313250 },      // مفرق
            wholesale: { USD: 2.80, LBP: 250600 },  // جملة
            vip: { USD: 3.15, LBP: 281925 }         // زبون مميز
        },
        // للتوافق مع الكود القديم
        priceUSD: 3.50,
        priceLBP: 313250,
        stock: 1,
        minStock: 1,
        barcode: '6789012345678',
        supplier: 'شركة الإكسسوارات'
    },
    {
        id: 7,
        name: 'JUUSI',
        category: 'مشروبات',
        costUSD: 0.50,
        prices: {
            retail: { USD: 1.00, LBP: 89500 },      // مفرق
            wholesale: { USD: 0.80, LBP: 71600 },  // جملة
            vip: { USD: 0.90, LBP: 80550 }         // زبون مميز
        },
        // للتوافق مع الكود القديم
        priceUSD: 1.00,
        priceLBP: 89500,
        stock: 14,
        minStock: 5,
        barcode: '7890123456789',
        supplier: 'شركة المشروبات'
    }
]);
}

// متغير للمنتجات (سيتم استبداله بالدالة)
let products = getCurrentProducts();
let customers = loadFromStorage('customers', [
    {
        id: 1,
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        phone: '71123456',
        address: 'الأشرفية، بيروت',
        totalPurchases: 250.00,
        loyaltyPoints: 125,
        dateJoined: '2024-01-01',
        creditBalance: 0.00, // الدين المستحق
        currentDebt: 0.00, // الدين الحالي
        creditLimit: 1000.00, // الحد الأقصى للدين
        creditHistory: [] // تاريخ المعاملات الآجلة
    },
    {
        id: 2,
        name: 'فاطمة علي',
        email: 'fatima@example.com',
        phone: '70987654',
        address: 'الحمرا، بيروت',
        totalPurchases: 180.00,
        loyaltyPoints: 90,
        dateJoined: '2024-01-10',
        creditBalance: 25.00, // لديها دين
        currentDebt: 25.00, // الدين الحالي
        creditLimit: 500.00,
        creditHistory: [
            {
                date: '2024-01-15',
                type: 'purchase',
                amount: 25.00,
                description: 'مشتريات متنوعة'
            }
        ]
    },
    {
        id: 3,
        name: 'محمد السعيد',
        email: 'mohamed@example.com',
        phone: '0555123456',
        address: 'حماة، سوريا',
        totalPurchases: 0.00,
        loyaltyPoints: 0,
        dateJoined: '2024-01-01',
        creditBalance: 0.00,
        currentDebt: 0.00,
        creditLimit: 2000.00,
        creditHistory: []
    },
    {
        id: 4,
        name: 'سارة أحمد',
        email: 'sara@example.com',
        phone: '0999888777',
        address: 'اللاذقية، سوريا',
        totalPurchases: 400.00,
        loyaltyPoints: 200,
        dateJoined: '2024-01-10',
        creditBalance: 300.00,
        currentDebt: 300.00,
        creditLimit: 800.00,
        creditHistory: [
            {
                date: '2024-01-15',
                type: 'purchase',
                amount: 300.00,
                description: 'مشتريات متنوعة'
            }
        ]
    }
]);

let sales = loadFromStorage('sales', [
    {
        id: 1,
        invoiceNumber: 'INV-001',
        date: '2024-01-15',
        customer: 'أحمد محمد',
        customerId: 1,
        amount: 15.50,
        paymentMethod: 'نقدي',
        items: [
            {id: 1, name: 'كوكاكولا', quantity: 2, price: 1.00},
            {id: 3, name: 'شيبس', quantity: 1, price: 0.75}
        ]
    },
    {
        id: 2,
        invoiceNumber: 'INV-002',
        date: '2024-01-15',
        customer: 'عميل عادي',
        customerId: null,
        amount: 8.25,
        paymentMethod: 'بطاقة',
        items: [
            {id: 2, name: 'خبز عربي', quantity: 3, price: 0.50},
            {id: 4, name: 'ماء', quantity: 2, price: 0.25}
        ]
    }
]);

let suppliers = loadFromStorage('suppliers', [
    {
        id: 1,
        name: 'شركة المشروبات العالمية',
        email: 'info@beverages.com',
        phone: '01-345678',
        address: 'الدورة، بيروت',
        contactPerson: 'خالد أحمد'
    },
    {
        id: 2,
        name: 'مخبز الأمل',
        email: 'bakery@hope.com',
        phone: '03-456789',
        address: 'طرابلس، لبنان',
        contactPerson: 'محمد حسن'
    }
]);

let cart = [];
let lastCartFocusIndex = null; // لتتبع آخر عنصر تم تعديل كميته
let settings = loadFromStorage('settings', {
    exchangeRate: 89500,
    taxRate: 0, // إزالة الضريبة
    storeName: 'متجري الإلكتروني',
    storeAddress: 'بيروت، لبنان',
    storePhone: '01-234567',
    autoBackup: true,
    lowStockAlert: true,
    lowStockThreshold: 10, // حد تحذير المخزون
    printAfterSale: true
});

// المشتريات والدفعات وإرجاعات الشراء
let purchases = loadFromStorage('purchases', []);
let supplierPayments = loadFromStorage('supplierPayments', []);
let purchaseReturns = loadFromStorage('purchaseReturns', []);
// سجل الموردين (دفتر الأستاذ)
let supplierLedger = loadFromStorage('supplierLedger', []);

function convertAmountUsingRate(amount, fromCurrency, toCurrency, rate) {
    if (!isFinite(Number(amount))) return 0;
    if (fromCurrency === toCurrency) return Number(amount);
    if (fromCurrency === 'USD' && toCurrency === 'LBP') return Number(amount) * rate;
    if (fromCurrency === 'LBP' && toCurrency === 'USD') return Number(amount) / rate;
    return Number(amount);
}

function toUSD(amount, currency, rate) {
    return convertAmountUsingRate(amount, currency, 'USD', rate);
}

function recalcPurchaseStatus(p) {
    const remaining = Math.max(0, (p.totalUSD || 0) - (p.paidUSD || 0));
    p.remainingUSD = remaining;
    if (remaining <= 0.0001) p.status = 'paid';
    else if (p.paidUSD > 0) p.status = 'partial';
    else p.status = 'unpaid';
    return p;
}

function getSupplierBalanceUSD(supplierId) {
    const sumBills = purchases.filter(b => b.supplierId === supplierId)
        .reduce((s, b) => s + Math.max(0, (b.totalUSD || 0) - (b.paidUSD || 0)), 0);
    return sumBills;
}

function recordSupplierPaymentCash(amount, currency, method, note) {
    const amt = Number(amount) || 0;
    if (amt <= 0) return;
    if (currency === 'USD') {
        cashDrawer.cashUSD = (cashDrawer.cashUSD || 0) - amt;
    } else {
        cashDrawer.cashLBP = (cashDrawer.cashLBP || 0) - Math.round(amt);
    }
    cashDrawer.transactions.push({
        timestamp: new Date().toISOString(),
        type: 'supplier_payment',
        amount: amt,
        currency: currency,
        description: note || 'Supplier payment',
        user: (currentUser && currentUser.name) || 'user'
    });
    cashDrawer.lastUpdate = new Date().toISOString();
    saveToStorage('cashDrawer', cashDrawer);
}

function openSupplierPayment() {
    const sel = document.getElementById('spSupplier');
    const list = document.getElementById('spSupplierList');
    const search = document.getElementById('spSupplierSearch');
    if (sel) sel.innerHTML = suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
    // initialize combo
    const renderList = (term='') => {
        if (!list) return;
        const t = (term||'').trim().toLowerCase();
        const filtered = suppliers.filter(s => {
            const name = (s.name||'').toLowerCase();
            const mail = (s.email||'').toLowerCase();
            return !t || name.includes(t) || mail.includes(t);
        });
        if (filtered.length === 0) {
            list.innerHTML = `<div class="sp-supplier-item">لا نتائج</div>`;
        } else {
            list.innerHTML = filtered.map(s=>`<div class="sp-supplier-item" data-id="${s.id}"><span>${s.name}</span><span class="email">${s.email||''}</span></div>`).join('');
        }
        list.style.display = 'block';
        // bind click
        list.querySelectorAll('.sp-supplier-item').forEach(item => {
            item.onclick = function(){
                const id = parseInt(this.dataset.id);
                if (sel) sel.value = String(id);
                if (search) search.value = suppliers.find(s=>s.id===id)?.name || '';
                list.style.display = 'none';
                renderOpenBillsForSupplier(id);
            };
        });
    };
    if (search) {
        search.value = suppliers[0]?.name || '';
        search.onfocus = () => renderList(search.value);
        search.oninput = () => renderList(search.value);
        search.onclick = () => renderList(search.value);
    }
    document.addEventListener('click', function(e){
        if (!document.getElementById('spSupplierCombo')?.contains(e.target)) {
            if (list) list.style.display = 'none';
        }
    }, { once: false });
    // لم يعد هناك Open Bills للعرض، فقط تحديث اسم الحقل عند التغيير
    sel && (sel.onchange = function(){
        const selName = suppliers.find(s=> s.id === parseInt(this.value))?.name || '';
        if (search) search.value = selName;
    });
    document.getElementById('spAmount').value = '';
    document.getElementById('spCurrency').value = 'USD';
    document.getElementById('spMethod').value = 'cash';
    const confirmBtn = document.getElementById('confirmSupplierPayment');
    if (confirmBtn) confirmBtn.onclick = () => confirmSupplierPayment();
    try { translateSupplierPaymentModal(); } catch(_) {}
    showModal('supplierPaymentModal');
}

function renderOpenBillsForSupplier(supplierId) {
    const rate = settings.exchangeRate;
    const container = document.getElementById('spOpenBills');
    if (!container) return;
    const openBills = purchases.filter(p => p.supplierId === supplierId && (p.status === 'unpaid' || p.status === 'partial'));
    container.innerHTML = openBills.map(p => {
        const remainUSD = Math.max(0, (p.totalUSD||0) - (p.paidUSD||0));
        const remainDisp = p.currency === 'USD' ? `$${remainUSD.toFixed(2)}` : `${Math.round(remainUSD * (p.rate||rate)).toLocaleString()} ل.ل`;
        return `<label style="display:flex;align-items:center;gap:8px;margin:4px 0;">
            <input type="checkbox" class="sp-bill-check" value="${p.id}">
            <span>فاتورة #${p.id} - ${p.date} - متبقي: ${remainDisp}</span>
        </label>`;
    }).join('');
}

function confirmSupplierPayment() {
    // حماية من النقر المزدوج
    const btn = document.getElementById('confirmSupplierPayment');
    if (btn) btn.disabled = true;
    let done = false;
    const finish = () => { if (btn) btn.disabled = false; };
    try {
    const supplierId = parseInt(document.getElementById('spSupplier').value);
    const amount = Number(document.getElementById('spAmount').value) || 0;
    const currency = document.getElementById('spCurrency').value || 'USD';
    const method = document.getElementById('spMethod').value || 'cash';
    const note = (document.getElementById('spNote')?.value || '').trim();
    if (!supplierId || amount <= 0) {
        showMessage('يرجى اختيار مورد وإدخال مبلغ صحيح', 'error');
        return finish();
    }
    const rate = settings.exchangeRate;
    let remainingUSD = toUSD(amount, currency, rate);
    const alloc = [];
    // لم يعد هناك اختيار فواتير؛ سنوزع FIFO على جميع الفواتير المفتوحة
    let bills = purchases.filter(p => p.supplierId === supplierId && (p.status === 'unpaid' || p.status === 'partial'))
        .sort((a,b)=> new Date(a.date) - new Date(b.date));

    // إجمالي المتبقي المفتوح للتحقق من تجاوز المبلغ
    const totalRemainingUSD = purchases.filter(p => p.supplierId === supplierId && (p.status === 'unpaid' || p.status === 'partial'))
        .reduce((s,p)=> s + Math.max(0,(p.totalUSD||0)-(p.paidUSD||0)), 0);
    if (remainingUSD > totalRemainingUSD + 1e-6) {
        showMessage('المبلغ المدفوع أكبر من إجمالي المتبقي', 'error');
        return finish();
    }
    for (const bill of bills) {
        if (remainingUSD <= 0) break;
        const need = Math.max(0, (bill.totalUSD||0) - (bill.paidUSD||0));
        const applied = Math.min(need, remainingUSD);
        if (applied > 0) {
            bill.paidUSD = (bill.paidUSD||0) + applied;
            recalcPurchaseStatus(bill);
            alloc.push({ billId: bill.id, amountUSD: applied });
            remainingUSD -= applied;
        }
    }
    if (alloc.length === 0) {
        showMessage('لا توجد فواتير مفتوحة للمورّد', 'warning');
        return finish();
    }
    supplierPayments.push({
        id: Math.max(0, ...supplierPayments.map(x=>x.id)) + 1,
        supplierId,
        date: new Date().toISOString(),
        currency,
        amount,
        rate,
        method,
        note,
        appliedTo: alloc
    });
    recordSupplierPaymentCash(amount, currency, method, `دفع مورد #${supplierId}`);
    // قيد دفتر الأستاذ PAYMENT
    addSupplierLedgerEntry({
        supplier_id: supplierId,
        type: 'PAYMENT',
        ref_no: alloc.length ? alloc.map(a=>a.billId).join('|') : null,
        total_cost: 0,
        paid_now: toUSD(amount, currency, rate),
        remaining: 0,
        note: note || '',
        currency,
        rate
    });
    saveAllData();
    loadPurchases();
    try { loadSuppliers(); } catch(_) {}
    hideModal('supplierPaymentModal');
    showMessage(`تم تسجيل دفعة للمورد بقيمة ${currency==='USD' ? '$'+amount.toFixed(2) : (Math.round(toUSD(amount,currency,rate)*rate).toLocaleString()+' ل.ل')}`);
    done = true;
    } catch (err) {
        console.error('confirmSupplierPayment error', err);
        showMessage('حدث خطأ أثناء تسجيل الدفعة', 'error');
    } finally {
        finish();
    }
}

// إدارة الصندوق والنقدية
let cashDrawer = loadFromStorage('cashDrawer', {
    cashUSD: 100.00,  // النقدية بالدولار
    cashLBP: 500000,  // النقدية بالليرة
    lastUpdate: new Date().toISOString(),
    transactions: []  // سجل المعاملات النقدية
});

// نظام versioning للمنتجات
let productsCatalogVersion = parseInt(localStorage.getItem('productsCatalogVersion')) || 1;

// دالة لفحص وتحديث catalog version
function checkAndUpdateProductsCatalog() {
    const storedVersion = parseInt(localStorage.getItem('productsCatalogVersion')) || 1;
    const storedLastUpdated = parseInt(localStorage.getItem('productsLastUpdated')) || 0;
    
    console.log(`🔍 فحص catalog version: المحلي=${productsCatalogVersion}, المخزن=${storedVersion}`);
    
    if (storedVersion > productsCatalogVersion) {
        console.log(`🔄 تم اكتشاف تحديث جديد للمنتجات (version ${storedVersion}), يتم إعادة تحميل البيانات...`);
        productsCatalogVersion = storedVersion;
        
        // إعادة تحميل المنتجات من localStorage
        products = getCurrentProducts();
        
        // إبطال أي cache للمنتجات
        if (window.productsCache) {
            delete window.productsCache;
        }
        
        console.log(`✅ تم تحديث المنتجات إلى version ${productsCatalogVersion}`);
        return true; // تم التحديث
    }
    
    return false; // لا يوجد تحديث
}

// دالة لإشعار النوافذ الأخرى بتحديث المنتجات
function notifyProductsUpdated() {
    console.log('📢 إشعار بتحديث المنتجات إلى جميع النوافذ المفتوحة');
    
    // إرسال رسالة إلى النوافذ الأخرى (إذا كان التطبيق يعمل في نوافذ متعددة)
    if (window.postMessage) {
        window.postMessage({
            type: 'PRODUCTS_UPDATED',
            version: productsCatalogVersion,
            timestamp: Date.now()
        }, '*');
    }
    
    // تحديث فوري للنافذة الحالية إذا كانت نقطة البيع مفتوحة
    if (window.location.hash === '#pos' || document.querySelector('.pos-section')) {
        console.log('🔄 تحديث فوري لنقطة البيع في النافذة الحالية');
        checkAndUpdateProductsCatalog();
    }
}

// إعداد listener لرسائل التحديث
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'PRODUCTS_UPDATED') {
        console.log('📨 تم استلام إشعار بتحديث المنتجات:', event.data);
        checkAndUpdateProductsCatalog();
    }
});

// وظائف إدارة البيانات المحلية
function saveToStorage(key, data) {
    try {
        // إذا كان المفتاح هو products، حدث catalog version ومتغير products
        if (key === 'products') {
            productsCatalogVersion++;
            localStorage.setItem('productsCatalogVersion', productsCatalogVersion.toString());
            localStorage.setItem('productsLastUpdated', Date.now().toString());
            console.log(`📦 تم تحديث catalog version إلى: ${productsCatalogVersion}`);
            
            // تحديث متغير products فوراً
            products = data;
            console.log(`🔄 تم تحديث متغير products مباشرة`);
        }
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
        return false;
    }
}

// ترجمة صفحة الفواتير
function translateInvoices() {
    const invHeader = document.querySelector('#invoices .page-header h2');
    if (invHeader) invHeader.textContent = getText('invoices-management');
    const filterBtn = document.querySelector('#invoices .filter-btn');
    if (filterBtn) filterBtn.textContent = getText('filter-date');
    const head = document.querySelectorAll('#invoices thead th');
    if (head && head.length >= 7) {
        head[0].textContent = getText('invoice-number');
        head[1].textContent = getText('date');
        head[2].textContent = getText('customer');
        head[3].textContent = getText('amount');
        head[4].textContent = getText('payment-method');
        head[5].textContent = getText('status');
        head[6].textContent = getText('actions');
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        return defaultValue;
    }
}

// دالة للحصول على السعر حسب النوع والعملة
function getProductPrice(product, priceType = currentPriceType, currency = 'USD') {
    // إذا كان المنتج في العربة وكان priceUSD محدث، استخدمه مباشرة
    if (product.priceUSD && (product.priceUSD !== product.prices?.[priceType]?.USD)) {
        console.log(`🔄 استخدام السعر المحدث مباشرة: $${product.priceUSD} بدلاً من $${product.prices?.[priceType]?.USD}`);
        return currency === 'USD' ? product.priceUSD : Math.round(product.priceUSD * (settings.exchangeRate || 1));
    }
    
    // إذا كان المنتج يحتوي على أسعار متعددة
    if (product.prices && product.prices[priceType]) {
        return currency === 'USD' ? product.prices[priceType].USD : product.prices[priceType].LBP;
    }
    
    // العودة للسعر القديم للتوافق
    return currency === 'USD' ? product.priceUSD : product.priceLBP;
}

// دالة لتحديث المنتجات في العربة من التخزين المحلي
function updateCartProductsFromStorage() {
    console.log('🔄 تحديث المنتجات في العربة...');
    const updatedProducts = loadFromStorage('products', []);
    let updatedCount = 0;
    
    // تحديث كل منتج في العربة
    cart.forEach((cartItem, index) => {
        const updatedProduct = updatedProducts.find(p => p.id === cartItem.id);
        if (updatedProduct) {
            // حفظ البيانات المهمة قبل التحديث
            const oldPriceUSD = cartItem.priceUSD;
            const oldPrices = cartItem.prices;
            
            // تحديث البيانات الأساسية
            cartItem.name = updatedProduct.name;
            cartItem.stock = updatedProduct.stock;
            cartItem.prices = updatedProduct.prices;
            cartItem.priceUSD = updatedProduct.priceUSD;
            cartItem.priceLBP = updatedProduct.priceLBP;
            cartItem.barcode = updatedProduct.barcode;
            cartItem.category = updatedProduct.category;
            cartItem.costUSD = updatedProduct.costUSD;
            cartItem.supplier = updatedProduct.supplier;
            
            // إزالة السعر المخصص القديم إذا كان موجوداً
            if (typeof cartItem.customPriceUSD === 'number') {
                console.log(`🗑️ إزالة السعر المخصص القديم: $${cartItem.customPriceUSD}`);
                delete cartItem.customPriceUSD;
            }
            
            // التحقق من تغيير السعر
            if (oldPriceUSD !== updatedProduct.priceUSD) {
                console.log(`💰 تم تحديث سعر ${cartItem.name}: من $${oldPriceUSD} إلى $${updatedProduct.priceUSD}`);
            }
            
            updatedCount++;
            console.log(`✅ تم تحديث منتج في العربة: ${cartItem.name}`);
        } else {
            console.log(`⚠️ لم يتم العثور على منتج محدث للعنصر: ${cartItem.name} (ID: ${cartItem.id})`);
        }
    });
    
    console.log(`✅ تم تحديث ${updatedCount} منتج من أصل ${cart.length} في العربة`);
}

// دالة لتحديث نقطة البيع إذا كانت مفتوحة حالياً
function updatePOSIfActive() {
    console.log('🔄 محاولة تحديث نقطة البيع...');
    const posPage = document.getElementById('pos');
    console.log('صفحة POS:', posPage);
    console.log('هل POS نشط:', posPage && posPage.classList.contains('active'));
    
    if (posPage && posPage.classList.contains('active')) {
        console.log('✅ نقطة البيع نشطة، يتم التحديث...');
        
        // إعادة تحميل المنتجات في نقطة البيع
        const oldProductsCount = products.length;
        products = getCurrentProducts();
        console.log(`📦 تم تحميل ${products.length} منتج (كان ${oldProductsCount})`);
        
        // تحديث عرض المنتجات إذا كان هناك بحث نشط
        const searchInput = document.getElementById('productSearch');
        if (searchInput && searchInput.value.trim()) {
            console.log('🔍 تحديث نتائج البحث:', searchInput.value.trim());
            // مسح النتائج الحالية أولاً
            const searchSection = document.querySelector('.search-section');
            if (searchSection) {
                const existingResults = searchSection.querySelector('.search-results-list');
                if (existingResults) {
                    existingResults.remove();
                }
            }
            // إعادة عرض النتائج
            displayProducts(searchInput.value.trim());
        }
        
        // تحديث المنتجات في العربة إذا تم تعديلها
        updateCartProductsFromStorage();
        
        // إعادة حساب الأسعار في العربة
        recalculateCartPrices();
        
        // تحديث العربة للتأكد من الأسعار الصحيحة
        updateCart();
        
        // تحديث عرض العربة الأفقي في POS
        try {
            updateCartHorizontalDisplay();
        } catch(e) {
            console.log('تحذير: لا يمكن تحديث عرض العربة الأفقي:', e);
        }
        
        console.log('✅ تم تحديث نقطة البيع بنجاح');
    } else {
        console.log('❌ نقطة البيع غير نشطة، لا حاجة للتحديث');
    }
}

// دالة جذرية لإعادة بناء العربة بالأسعار الجديدة
function rebuildCartWithNewPrices() {
    console.log('🔄 إعادة بناء العربة بالأسعار الجديدة...');
    
    if (!cart || cart.length === 0) {
        console.log('العربة فارغة، لا حاجة لإعادة البناء');
        return;
    }
    
    // حفظ محتويات العربة الحالية
    const currentCartItems = [...cart];
    const cartQuantities = {};
    
    // حفظ الكميات
    currentCartItems.forEach(item => {
        cartQuantities[item.id] = item.quantity;
    });
    
    // مسح العربة
    cart.length = 0;
    
    // إعادة تحميل المنتجات من localStorage
    products = getCurrentProducts();
    
    // إعادة إضافة المنتجات بالأسعار الجديدة
    currentCartItems.forEach(oldItem => {
        const updatedProduct = products.find(p => p.id === oldItem.id);
        if (updatedProduct) {
            const quantity = cartQuantities[oldItem.id] || 1;
            
            cart.push({
                ...updatedProduct,
                quantity: quantity,
                selectedPriceType: oldItem.selectedPriceType || currentPriceType,
                customPriceUSD: undefined // إزالة أي سعر مخصص
            });
            
            console.log(`✅ تم إعادة إضافة ${updatedProduct.name} بكمية ${quantity} وسعر $${updatedProduct.priceUSD}`);
        } else {
            console.log(`⚠️ لم يتم العثور على المنتج: ${oldItem.name}`);
        }
    });
    
    // تحديث العربة
    updateCart();
    
    // تحديث العرض الأفقي
    try {
        updateCartHorizontalDisplay();
    } catch(e) {
        console.log('تحذير: لا يمكن تحديث العرض الأفقي:', e);
    }
    
    console.log('🎉 تم إعادة بناء العربة بنجاح!');
    showMessage('تم تحديث جميع الأسعار في العربة', 'success');
}

// دالة لإجبار تحديث جميع المنتجات في العربة بالأسعار الجديدة
function forceUpdateCartPrices() {
    console.log('🚨 إجبار تحديث جميع الأسعار في العربة...');
    
    if (!cart || cart.length === 0) {
        console.log('العربة فارغة، لا حاجة للتحديث');
        return;
    }
    
    const updatedProducts = getCurrentProducts();
    let updatedCount = 0;
    
    cart.forEach((cartItem, index) => {
        const freshProduct = updatedProducts.find(p => p.id === cartItem.id);
        if (freshProduct) {
            const oldPrice = cartItem.priceUSD;
            const newPrice = freshProduct.priceUSD;
            
            if (oldPrice !== newPrice) {
                console.log(`💰 تحديث إجباري: ${cartItem.name} من $${oldPrice} إلى $${newPrice}`);
                
                // تحديث جميع البيانات
                cartItem.priceUSD = freshProduct.priceUSD;
                cartItem.priceLBP = freshProduct.priceLBP;
                cartItem.prices = JSON.parse(JSON.stringify(freshProduct.prices));
                cartItem.name = freshProduct.name;
                cartItem.stock = freshProduct.stock;
                cartItem.category = freshProduct.category;
                cartItem.barcode = freshProduct.barcode;
                cartItem.supplier = freshProduct.supplier;
                
                // إزالة السعر المخصص القديم
                if (typeof cartItem.customPriceUSD === 'number') {
                    delete cartItem.customPriceUSD;
                    console.log(`🗑️ تم إزالة السعر المخصص القديم: $${cartItem.customPriceUSD}`);
                }
                
                updatedCount++;
            }
        }
    });
    
    if (updatedCount > 0) {
        console.log(`✅ تم تحديث ${updatedCount} منتج في العربة`);
        updateCart();
        console.log('🎉 تم تحديث العربة بنجاح!');
        showMessage(`تم تحديث ${updatedCount} منتج في العربة`, 'success');
    } else {
        console.log('✅ جميع المنتجات في العربة محدثة بالفعل');
    }
}

// دالة إجبارية لتحديث نقطة البيع (يمكن استدعاؤها يدوياً)
function forceRefreshPOS() {
    console.log('🔄 بدء التحديث الإجباري لنقطة البيع...');
    
    try {
        // 1. إعادة تحميل المنتجات من localStorage
        products = getCurrentProducts();
        console.log(`📦 تم تحميل ${products.length} منتج من localStorage`);
        
        // 2. تحديث كل منتج في العربة
        if (cart && cart.length > 0) {
            let updatedCount = 0;
            cart.forEach((cartItem, index) => {
                const updatedProduct = products.find(p => p.id === cartItem.id);
                if (updatedProduct) {
                    const oldPrice = cartItem.priceUSD;
                    const newPrice = updatedProduct.priceUSD;
                    
                    // تحديث جميع البيانات
                    cartItem.name = updatedProduct.name;
                    cartItem.priceUSD = updatedProduct.priceUSD;
                    cartItem.priceLBP = updatedProduct.priceLBP;
                    cartItem.prices = updatedProduct.prices;
                    cartItem.stock = updatedProduct.stock;
                    cartItem.category = updatedProduct.category;
                    cartItem.barcode = updatedProduct.barcode;
                    
                    // إزالة السعر المخصص القديم إذا كان موجوداً
                    if (typeof cartItem.customPriceUSD === 'number') {
                        console.log(`🗑️ إزالة السعر المخصص القديم: $${cartItem.customPriceUSD}`);
                        delete cartItem.customPriceUSD;
                    }
                    
                    if (oldPrice !== newPrice) {
                        console.log(`💰 تم تحديث سعر ${cartItem.name}: من $${oldPrice} إلى $${newPrice}`);
                    }
                    updatedCount++;
                }
            });
            console.log(`✅ تم تحديث ${updatedCount} منتج في العربة`);
        }
        
        // 3. إعادة عرض العربة
        updateCart();
        
        // 4. إعادة عرض العربة الأفقي
        try {
            updateCartHorizontalDisplay();
        } catch(e) {
            console.log('تحذير: لا يمكن تحديث العرض الأفقي:', e);
        }
        
        // 5. إعادة عرض نتائج البحث إذا كان هناك بحث نشط
        const searchInput = document.getElementById('productSearch');
        if (searchInput && searchInput.value.trim()) {
            displayProducts(searchInput.value.trim());
        }
        
        console.log('🎉 تم التحديث الإجباري بنجاح!');
        showMessage('تم تحديث نقطة البيع بنجاح', 'success');
        
    } catch (error) {
        console.error('خطأ في التحديث الإجباري:', error);
        showMessage('خطأ في تحديث نقطة البيع', 'error');
    }
}

// دالة لإعادة حساب الأسعار في العربة
function recalculateCartPrices() {
    console.log('🔄 إعادة حساب الأسعار في العربة...');
    const updatedProducts = loadFromStorage('products', []);
    
    cart.forEach(cartItem => {
        const updatedProduct = updatedProducts.find(p => p.id === cartItem.id);
        if (updatedProduct) {
            const oldPriceUSD = cartItem.priceUSD;
            const newPriceUSD = updatedProduct.priceUSD;
            
            if (oldPriceUSD !== newPriceUSD) {
                console.log(`💰 إعادة حساب سعر ${cartItem.name}: من $${oldPriceUSD} إلى $${newPriceUSD}`);
                // تحديث السعر مباشرة
                cartItem.priceUSD = newPriceUSD;
                cartItem.priceLBP = updatedProduct.priceLBP;
                cartItem.prices = updatedProduct.prices;
            }
            
            // إزالة السعر المخصص القديم إذا كان موجوداً
            if (typeof cartItem.customPriceUSD === 'number') {
                console.log(`🗑️ إزالة السعر المخصص القديم: $${cartItem.customPriceUSD}`);
                delete cartItem.customPriceUSD;
            }
        }
    });
    
    console.log('✅ تم إعادة حساب جميع الأسعار في العربة');
}
// دالة للحصول على نص نوع السعر
function getPriceTypeLabel(priceType) {
    const isEn = (document.documentElement.lang || 'ar') === 'en';
    const labelsAr = { retail: '🏪 مفرق', wholesale: '📦 جملة', vip: '⭐ مميز' };
    const labelsEn = { retail: '🏪 Retail', wholesale: '📦 Wholesale', vip: '⭐ VIP' };
    const map = isEn ? labelsEn : labelsAr;
    return map[priceType] || (isEn ? 'Retail' : 'مفرق');
}

async function clearStorage() {
    if (confirm(getText('confirm-clear-all-data'))) {
        try {
            // حفظ الترخيص قبل المسح
            const licenseState = await loadLicenseState();
            const secureLicense = await secureStorage.loadLicense();
            
            // مسح جميع البيانات
            localStorage.clear();
            
            // إعادة حفظ الترخيص في localStorage
            if (licenseState && licenseState.activated) {
                await saveLicenseState(licenseState);
            }
            
            // إعادة حفظ الترخيص في التخزين الآمن
            if (secureLicense && secureLicense.activated) {
                await secureStorage.saveLicense(secureLicense);
            }
            
            // تأكيد الحفظ
            console.log('License protected from clear data');
            
            location.reload();
        } catch (e) {
            console.error('Error during clear storage:', e);
            alert('Error occurred while clearing data. Please try again.');
        }
    }
}

function exportData() {
    // Full backup: include all runtime data needed to fully restore system state
    const data = {
        products: products,
        customers: customers,
        sales: sales,
        suppliers: suppliers,
        settings: settings,
        purchases: typeof purchases !== 'undefined' ? purchases : [],
        supplierPayments: typeof supplierPayments !== 'undefined' ? supplierPayments : [],
        purchaseReturns: typeof purchaseReturns !== 'undefined' ? purchaseReturns : [],
        supplierLedger: typeof supplierLedger !== 'undefined' ? supplierLedger : [],
        stockMovements: loadFromStorage('stockMovements', []),
        salesLogs: loadFromStorage('salesLogs', []),
        customerLogs: loadFromStorage('customerLogs', {}),
        cashDrawer: loadFromStorage('cashDrawer', {}),
        license_state: loadLicenseState(),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `sales-system-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showMessage('تم تصدير البيانات بنجاح');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (!confirm('هل تريد استيراد هذه البيانات؟ سيتم استبدال البيانات الحالية بالكامل.')) return;

            // Replace each dataset if present in backup
            if (data.products) products = data.products;
            if (data.customers) customers = data.customers;
            if (data.sales) sales = data.sales;
            if (data.suppliers) suppliers = data.suppliers;
            if (data.settings) settings = data.settings;
            if (data.purchases) purchases = data.purchases;
            if (data.supplierPayments) supplierPayments = data.supplierPayments;
            if (data.purchaseReturns) purchaseReturns = data.purchaseReturns;
            if (data.supplierLedger) supplierLedger = data.supplierLedger;

            // low-level storages
            if (data.stockMovements) saveToStorage('stockMovements', data.stockMovements);
            if (data.salesLogs) saveToStorage('salesLogs', data.salesLogs);
            if (data.customerLogs) saveToStorage('customerLogs', data.customerLogs);

            if (data.cashDrawer) {
                cashDrawer = data.cashDrawer;
                saveToStorage('cashDrawer', cashDrawer);
            }

            // license state (if included) - careful: we do not override secrets beyond stored structure
            if (data.license_state) {
                saveToStorage(LICENSE_STATE_KEY, data.license_state);
            }

            // persist main arrays
            saveAllData();

            // reload to ensure all UI and caches reflect the imported state
            location.reload();
        } catch (error) {
            showMessage('خطأ في قراءة الملف. تأكد من صحة تنسيق الملف.', 'error');
        }
    };
    reader.readAsText(file);
}

function saveAllData() {
    saveToStorage('products', products);
    saveToStorage('customers', customers);
    saveToStorage('sales', sales);
    saveToStorage('suppliers', suppliers);
    saveToStorage('settings', settings);
    saveToStorage('cashDrawer', cashDrawer);
    saveToStorage('purchases', purchases);
    saveToStorage('supplierPayments', supplierPayments);
    saveToStorage('purchaseReturns', purchaseReturns);
    saveToStorage('supplierLedger', supplierLedger);
}

// سكربت إصلاح timestamps المبيعات القديمة
function fixOldSalesTimestamps() {
    console.log('🔧 بدء إصلاح التوقيت للمبيعات القديمة...');
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    sales.forEach(sale => {
        // فحص إذا كان لديه timestamp صحيح بالفعل
        if (sale.timestamp && sale.timestamp.includes('T')) {
            // التحقق من صحة timestamp
            const testDate = new Date(sale.timestamp);
            if (!isNaN(testDate.getTime())) {
                skippedCount++;
                return; // timestamp صحيح، لا حاجة لتعديل
            }
        }
        
        // المبيع يحتاج إصلاح
        if (sale.date) {
            try {
                // محاولة إنشاء timestamp محلي بناءً على التاريخ الموجود
                const dateStr = sale.date;
                
                // إذا كان التاريخ فقط (YYYY-MM-DD)
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    // إنشاء timestamp محلي مع وقت افتراضي (12:00:00 ظهراً)
                    // هذا أفضل من منتصف الليل لتجنب مشاكل التوقيت
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const localDate = new Date(year, month - 1, day, 12, 0, 0, 0);
                    
                    // إنشاء timestamp محلي بنفس طريقة getLocalDateTimeISO
                    const localYear = localDate.getFullYear();
                    const localMonth = String(localDate.getMonth() + 1).padStart(2, '0');
                    const localDay = String(localDate.getDate()).padStart(2, '0');
                    const localHours = String(localDate.getHours()).padStart(2, '0');
                    const localMinutes = String(localDate.getMinutes()).padStart(2, '0');
                    const localSeconds = String(localDate.getSeconds()).padStart(2, '0');
                    const localMs = String(localDate.getMilliseconds()).padStart(3, '0');
                    
                    sale.timestamp = `${localYear}-${localMonth}-${localDay}T${localHours}:${localMinutes}:${localSeconds}.${localMs}`;
                    fixedCount++;
                    
                    console.log(`✅ تم إصلاح بيع ${sale.invoiceNumber || sale.id}: ${sale.timestamp}`);
                } else {
                    // إذا كان التاريخ بتنسيق آخر، حاول parsing عادي
                    const parsedDate = new Date(dateStr);
                    if (!isNaN(parsedDate.getTime())) {
                        // تحويل للوقت المحلي
                        const localYear = parsedDate.getFullYear();
                        const localMonth = String(parsedDate.getMonth() + 1).padStart(2, '0');
                        const localDay = String(parsedDate.getDate()).padStart(2, '0');
                        const localHours = String(parsedDate.getHours()).padStart(2, '0');
                        const localMinutes = String(parsedDate.getMinutes()).padStart(2, '0');
                        const localSeconds = String(parsedDate.getSeconds()).padStart(2, '0');
                        const localMs = String(parsedDate.getMilliseconds()).padStart(3, '0');
                        
                        sale.timestamp = `${localYear}-${localMonth}-${localDay}T${localHours}:${localMinutes}:${localSeconds}.${localMs}`;
                        fixedCount++;
                        
                        console.log(`✅ تم إصلاح بيع ${sale.invoiceNumber || sale.id}: ${sale.timestamp}`);
                    } else {
                        console.warn(`❌ لا يمكن parsing التاريخ للبيع ${sale.invoiceNumber || sale.id}: ${sale.date}`);
                    }
                }
            } catch (error) {
                console.error(`❌ خطأ في إصلاح بيع ${sale.invoiceNumber || sale.id}:`, error);
            }
        } else {
            console.warn(`❌ لا يوجد تاريخ للبيع ${sale.invoiceNumber || sale.id}`);
        }
    });
    
    if (fixedCount > 0) {
        // حفظ التغييرات
        saveToStorage('sales', sales);
        console.log(`🎉 تم إصلاح ${fixedCount} من المبيعات بنجاح!`);
        
        // عرض إشعار للمستخدم
        const lang = document.documentElement.lang || 'en';
        const message = lang === 'en' 
            ? `Fixed timestamps for ${fixedCount} old sales records`
            : `تم إصلاح توقيت ${fixedCount} من المبيعات القديمة`;
        showMessage(message, 'success');
        
        // إعادة تحميل قوائم المبيعات
        if (typeof loadSales === 'function') {
            loadSales();
        }
        if (typeof loadInvoices === 'function') {
            loadInvoices();
        }
    }
    
    console.log(`📊 إجمالي المعالجة: ${fixedCount} تم إصلاحها، ${skippedCount} كانت صحيحة بالفعل`);
    return { fixed: fixedCount, skipped: skippedCount };
}

// دالة للتحقق من حالة timestamps المبيعات
function checkSalesTimestampsStatus() {
    let totalSales = sales.length;
    let hasTimestamp = 0;
    let hasValidTimestamp = 0;
    let needsFix = 0;
    
    sales.forEach(sale => {
        if (sale.timestamp) {
            hasTimestamp++;
            // التحقق من صحة timestamp
            const testDate = new Date(sale.timestamp);
            if (!isNaN(testDate.getTime())) {
                hasValidTimestamp++;
            } else {
                needsFix++;
            }
        } else {
            needsFix++;
        }
    });
    
    console.log(`📊 تقرير حالة timestamps المبيعات:`);
    console.log(`   • إجمالي المبيعات: ${totalSales}`);
    console.log(`   • لديها timestamp: ${hasTimestamp}`);
    console.log(`   • timestamp صحيح: ${hasValidTimestamp}`);
    console.log(`   • يحتاج إصلاح: ${needsFix}`);
    
    return {
        total: totalSales,
        hasTimestamp: hasTimestamp,
        hasValidTimestamp: hasValidTimestamp,
        needsFix: needsFix
    };
}

// دالة للتحقق من دقة التقارير والتوقيت
function validateReportsAccuracy() {
    console.log('🔍 التحقق من دقة التقارير والتوقيت...');
    
    let issues = [];
    
    // فحص المبيعات بدون timestamp
    const salesWithoutTimestamp = sales.filter(sale => !sale.timestamp);
    if (salesWithoutTimestamp.length > 0) {
        issues.push(`${salesWithoutTimestamp.length} من المبيعات لا تحتوي على timestamp`);
    }
    
    // فحص timestamps غير صالحة
    const invalidTimestamps = sales.filter(sale => {
        if (sale.timestamp) {
            const testDate = new Date(sale.timestamp);
            return isNaN(testDate.getTime());
        }
        return false;
    });
    
    if (invalidTimestamps.length > 0) {
        issues.push(`${invalidTimestamps.length} من المبيعات تحتوي على timestamps غير صالحة`);
    }
    
    // فحص استخدام formatDateTime في التقارير
    const reportsUsingCorrectFormat = sales.filter(sale => {
        // فحص إذا كان timestamp يُستخدم بشكل صحيح
        return sale.timestamp && sale.timestamp.includes('T');
    });
    
    console.log(`✅ ${reportsUsingCorrectFormat.length} من المبيعات تستخدم تنسيق timestamp صحيح`);
    
    if (issues.length === 0) {
        console.log('🎉 جميع التقارير تعمل بدقة - لا توجد مشاكل في التوقيت');
        return { status: 'success', issues: [] };
    } else {
        console.warn('⚠️ تم اكتشاف مشاكل في دقة التقارير:');
        issues.forEach(issue => console.warn(`   • ${issue}`));
        return { status: 'warning', issues: issues };
    }
}

// دالة لعرض تقرير شامل عن حالة التوقيت
function generateTimestampReport() {
    const timestampStatus = checkSalesTimestampsStatus();
    const accuracyStatus = validateReportsAccuracy();
    
    const report = {
        timestamp: timestampStatus,
        accuracy: accuracyStatus,
        recommendations: []
    };
    
    if (timestampStatus.needsFix > 0) {
        report.recommendations.push('تشغيل fixOldSalesTimestamps() لإصلاح المبيعات القديمة');
    }
    
    if (accuracyStatus.status === 'warning') {
        report.recommendations.push('مراجعة التقارير للتأكد من استخدام timestamp الصحيح');
    }
    
    console.log('📋 تقرير شامل عن حالة التوقيت:', report);
    return report;
}

// دالة للاختبار والإصلاح اليدوي - يمكن استدعاؤها من console
window.fixOldSalesTimestamps = fixOldSalesTimestamps;
window.checkSalesTimestampsStatus = checkSalesTimestampsStatus;
window.validateReportsAccuracy = validateReportsAccuracy;
window.generateTimestampReport = generateTimestampReport;

// دالة سريعة للفحص والإصلاح في console
window.quickTimestampFix = function() {
    console.log('🔧 بدء فحص وإصلاح سريع لتوقيت المبيعات...');
    const status = checkSalesTimestampsStatus();
    
    if (status.needsFix > 0) {
        console.log(`تم اكتشاف ${status.needsFix} من المبيعات تحتاج إصلاح. سيتم البدء بالإصلاح...`);
        const result = fixOldSalesTimestamps();
        
        // فحص النتيجة
        setTimeout(() => {
            const newStatus = checkSalesTimestampsStatus();
            console.log(`✅ انتهى الإصلاح: ${result.fixed} تم إصلاحها، ${result.skipped} كانت صحيحة`);
            console.log(`📊 الحالة الآن: ${newStatus.needsFix} لا تزال تحتاج إصلاح`);
        }, 500);
        
        return result;
    } else {
        console.log('✅ جميع المبيعات تحتوي على timestamps صحيحة - لا حاجة للإصلاح');
        return { fixed: 0, skipped: status.total };
    }
};

// تحديث إجمالي مشتريات جميع العملاء
function updateAllCustomersTotalPurchases() {
    console.log('🔄 [Customer] Updating total purchases for all customers...');
    console.log('🔍 [Debug] updateAllCustomersTotalPurchases called from:', new Error().stack);
    customers.forEach(customer => {
        const customerSales = sales.filter(sale => {
            return sale.customerId === customer.id ||
                   sale.customerName === customer.name ||
                   (sale.partialDetails && sale.partialDetails.customerId === customer.id) ||
                   (sale.partialDetails && sale.partialDetails.customerName === customer.name);
        });
        
        if (customer.name === 'joseph') {
            console.log(`🔍 [Debug] Found ${customerSales.length} sales for joseph`);
            console.log(`🔍 [Debug] All sales details for joseph:`, customerSales.map(s => ({
                invoiceNumber: s.invoiceNumber,
                amount: s.amount,
                paymentMethod: s.paymentMethod,
                cashDetails: s.cashDetails,
                previousAccountAmount: s.previousAccountAmount,
                partialDetails: s.partialDetails,
                creditDetails: s.creditDetails,
                date: s.date,
                customer: s.customer,
                customerId: s.customerId
            })));
        }
        
        // حساب إجمالي المشتريات (شامل جميع أنواع البيع)
        const totalPurchases = customerSales.reduce((sum, sale) => {
            let purchaseAmount = 0;
            
            // للبيع النقدي - المبلغ كاملاً (يشمل الدين السابق إذا تم تسويته)
            if (sale.cashDetails) {
                // إذا كان هناك دين سابق تم تسويته
                if (sale.previousAccountAmount && sale.previousAccountAmount > 0) {
                    // حساب مبلغ البيع الأصلي (بدون الدين السابق)
                    const originalSaleAmount = (sale.amount || 0) - (sale.previousAccountAmount || 0);
                    
                    if (customer.name === 'joseph') {
                        console.log(`🔍 [Debug] Cash sale with debt settlement for ${customer.name}:`, {
                            saleAmount: sale.amount,
                            previousAccountAmount: sale.previousAccountAmount,
                            originalSaleAmount: originalSaleAmount,
                            invoiceNumber: sale.invoiceNumber,
                            purchaseAmount: originalSaleAmount > 0 ? originalSaleAmount : 0
                        });
                    }
                    
                    // إذا كان هناك منتجات للبيع (مبلغ البيع الأصلي > 0)
                    if (originalSaleAmount > 0) {
                        purchaseAmount = originalSaleAmount; // فقط مبلغ البيع الأصلي
                    }
                    // إذا كان تسوية دين سابق فقط (مبلغ البيع الأصلي = 0 أو sale.amount = previousAccountAmount)
                    else {
                        purchaseAmount = 0; // لا نضيف شيء لإجمالي المشتريات
                    }
                } else {
                    // بيع عادي بدون دين سابق
                    purchaseAmount = sale.amount || 0;
                    if (customer.name === 'joseph') {
                        console.log(`🔍 [Debug] Regular cash sale for ${customer.name}:`, {
                            saleAmount: sale.amount,
                            invoiceNumber: sale.invoiceNumber,
                            purchaseAmount: purchaseAmount
                        });
                    }
                }
            }
            // للبيع الجزئي - المبلغ المدفوع فقط
            else if (sale.partialDetails) {
                const paidInUSD = sale.partialDetails.paymentCurrency === 'USD' 
                    ? sale.partialDetails.amountPaid 
                    : sale.partialDetails.amountPaid / (settings.exchangeRate || 1);
                purchaseAmount = paidInUSD;
                if (customer.name === 'joseph') {
                    console.log(`🔍 [Debug] Partial sale for ${customer.name}:`, {
                        saleAmount: sale.amount,
                        amountPaid: sale.partialDetails.amountPaid,
                        paidInUSD: paidInUSD,
                        invoiceNumber: sale.invoiceNumber,
                        purchaseAmount: purchaseAmount
                    });
                }
            }
            // للبيع بالدين - المبلغ كاملاً (حتى لو لم يتم الدفع بعد)
            else if (sale.paymentMethod === 'credit' || sale.invoiceNumber?.startsWith('CR-')) {
                purchaseAmount = sale.amount || 0;
                if (customer.name === 'joseph') {
                    console.log(`🔍 [Debug] Credit sale for ${customer.name}:`, {
                        saleAmount: sale.amount,
                        invoiceNumber: sale.invoiceNumber,
                        purchaseAmount: purchaseAmount
                    });
                }
            }
            // للبيع العادي (بدون تفاصيل دفع) - المبلغ كاملاً
            else {
                purchaseAmount = sale.amount || 0;
                if (customer.name === 'joseph') {
                    console.log(`🔍 [Debug] Regular sale for ${customer.name}:`, {
                        saleAmount: sale.amount,
                        invoiceNumber: sale.invoiceNumber,
                        purchaseAmount: purchaseAmount
                    });
                }
            }
            
            const newSum = sum + purchaseAmount;
            if (customer.name === 'joseph') {
                console.log(`🔍 [Debug] Adding ${purchaseAmount} to sum for ${customer.name}, new sum: ${newSum}`);
            }
            return newSum;
        }, 0);
        
        const oldTotal = customer.totalPurchases || 0;
        customer.totalPurchases = totalPurchases;
        
        if (customer.name === 'joseph') {
            console.log(`💰 [Debug] Final calculation for ${customer.name}: oldTotal=${oldTotal}, newTotal=${totalPurchases}`);
        }
        
        // إضافة console.log لعرض جميع مبيعات العميل (للاختبار فقط)
        if (customer.name === 'joseph') {
            console.log(`🔍 [Debug] All sales for ${customer.name}:`, customerSales.map(s => ({
                invoiceNumber: s.invoiceNumber,
                amount: s.amount,
                paymentMethod: s.paymentMethod,
                cashDetails: s.cashDetails,
                previousAccountAmount: s.previousAccountAmount,
                partialDetails: s.partialDetails,
                creditDetails: s.creditDetails,
                date: s.date
            })));
            console.log(`💰 [Debug] Total purchases calculation for ${customer.name}: ${totalPurchases}`);
        }
        
        if (oldTotal !== totalPurchases) {
            console.log(`📊 [Customer] Updated ${customer.name}: ${oldTotal} → ${totalPurchases} (total purchases)`);
            
            // تفاصيل إضافية لمراقبة مصادر إجمالي المشتريات
            const cashSales = customerSales.filter(s => s.cashDetails);
            const creditSales = customerSales.filter(s => s.paymentMethod === 'credit' || s.invoiceNumber?.startsWith('CR-'));
            const partialSales = customerSales.filter(s => s.partialDetails);
            
            console.log(`🔍 [Customer] ${customer.name} sales breakdown:`, {
                totalSales: customerSales.length,
                cashSales: cashSales.length,
                creditSales: creditSales.length,
                partialSales: partialSales.length,
                previousAccountSettlements: customerSales.filter(s => s.previousAccountAmount > 0).length,
                totalPreviousAccountSettled: customerSales.reduce((sum, s) => sum + (s.previousAccountAmount || 0), 0),
                note: "Previous debt settlements are NOT counted in total purchases"
            });
            
            // تفاصيل إضافية للمبيعات النقدية مع الدين السابق
            const cashSalesWithDebt = customerSales.filter(s => s.cashDetails && s.previousAccountAmount > 0);
            if (cashSalesWithDebt.length > 0) {
                console.log(`💰 [Customer] ${customer.name} cash sales with debt settlement:`, 
                    cashSalesWithDebt.map(s => {
                        const originalSaleAmount = (s.amount || 0) - (s.previousAccountAmount || 0);
                        return {
                            saleAmount: s.amount,
                            previousDebt: s.previousAccountAmount,
                            originalSaleAmount: originalSaleAmount,
                            contributionToTotalPurchases: originalSaleAmount > 0 ? originalSaleAmount : 0,
                            isDebtSettlementOnly: originalSaleAmount === 0
                        };
                    })
                );
            }
        }
        
        // التأكد من أن العملاء الجدد يحصلون على إجمالي مشتريات صحيح
        if (!customer.totalPurchases && customerSales.length > 0) {
            console.log(`🔄 [Customer] Initializing total purchases for new customer ${customer.name}: ${totalPurchases}`);
        }
    });
    saveToStorage('customers', customers);
    console.log('✅ [Customer] All customers total purchases updated');
}

// تحديث إجمالي مشتريات عميل محدد بعد دفع الدين
function updateCustomerTotalPurchasesAfterPayment(customerId, paymentAmount) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    console.log(`🔄 [Customer] Recalculating total purchases for ${customer.name} after payment of ${paymentAmount}`);
    
    // إعادة حساب إجمالي المشتريات بدلاً من إضافة المبلغ المدفوع
    // لأن إجمالي المشتريات يجب أن يكون ثابتاً (المبلغ الأصلي للمشتريات)
    updateAllCustomersTotalPurchases();
    
    console.log(`📊 [Customer] Recalculated total purchases for ${customer.name} after payment`);
}

// إعادة حساب إجمالي مشتريات عميل محدد
function recalculateCustomerTotalPurchases(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    console.log(`🔄 [Customer] Recalculating total purchases for ${customer.name}...`);
    
    // إعادة حساب إجمالي المشتريات
    updateAllCustomersTotalPurchases();
    
    console.log(`📊 [Customer] Recalculated total purchases for ${customer.name}: ${customer.totalPurchases}`);
}

// أنواع قيود الموردين: PURCHASE | PAYMENT | ADJUSTMENT
function addSupplierLedgerEntry(entry) {
    const e = {
        id: Math.max(0, ...supplierLedger.map(x => x.id || 0)) + 1,
        supplier_id: entry.supplier_id,
        type: entry.type,
        ref_no: entry.ref_no || null,
        total_cost: Number(entry.total_cost) || 0,
        paid_now: Number(entry.paid_now) || 0,
        remaining: Number(entry.remaining) || 0,
        note: entry.note || '',
        currency: entry.currency || 'USD',
        rate: entry.rate || settings.exchangeRate,
        created_at: new Date().toISOString()
    };
    supplierLedger.push(e);
    saveToStorage('supplierLedger', supplierLedger);
    return e;
}

// وظائف إدارة الصندوق والنقدية
function calculateOptimalChange(totalDue, amountPaid, paymentCurrency, preferredChangeCurrency = null) {
    const changeNeeded = amountPaid - totalDue;
    
    if (changeNeeded <= 0) {
        return { change: 0, currency: paymentCurrency, canGiveChange: true, breakdown: null };
    }
    
    // إذا لم يحدد العميل عملة الباقي، نحاول إعطاؤه بنفس عملة الدفع
    if (!preferredChangeCurrency) {
        preferredChangeCurrency = paymentCurrency;
    }
    
    // التحقق من توفر النقدية
    const availableCash = {
        USD: cashDrawer.cashUSD,
        LBP: cashDrawer.cashLBP
    };
    
    // حساب الباقي بالعملة المفضلة
    let changeAmount = changeNeeded;
    let changeCurrency = preferredChangeCurrency;
    
    // إذا كانت العملة مختلفة، نحتاج للتحويل
    if (paymentCurrency !== preferredChangeCurrency) {
        if (paymentCurrency === 'USD' && preferredChangeCurrency === 'LBP') {
            changeAmount = changeNeeded * settings.exchangeRate;
        } else if (paymentCurrency === 'LBP' && preferredChangeCurrency === 'USD') {
            changeAmount = changeNeeded / settings.exchangeRate;
        }
    }
    
    // التحقق من توفر النقدية المطلوبة
    const canGiveChange = availableCash[changeCurrency] >= changeAmount;
    
    // إذا لم تتوفر النقدية بالعملة المطلوبة، نجرب العملة الأخرى
    if (!canGiveChange) {
        const alternateCurrency = changeCurrency === 'USD' ? 'LBP' : 'USD';
        let alternateAmount;
        
        if (changeCurrency === 'USD') {
            alternateAmount = changeAmount * settings.exchangeRate;
        } else {
            alternateAmount = changeAmount / settings.exchangeRate;
        }
        
        if (availableCash[alternateCurrency] >= alternateAmount) {
            return {
                change: alternateAmount,
                currency: alternateCurrency,
                canGiveChange: true,
                breakdown: null,
                note: `تم إعطاء الباقي بعملة ${alternateCurrency === 'USD' ? 'الدولار' : 'الليرة'} لعدم توفر النقدية بالعملة المطلوبة`
            };
        }
    }
    
    // إذا لم تكف النقدية، نحاول التوزيع بين العملتين
    if (!canGiveChange && changeNeeded > 0) {
        const breakdown = calculateMixedCurrencyChange(changeNeeded, paymentCurrency);
        return {
            change: changeNeeded,
            currency: paymentCurrency,
            canGiveChange: breakdown.possible,
            breakdown: breakdown,
            note: breakdown.possible ? 'سيتم إعطاء الباقي بعملات مختلطة' : 'لا توجد نقدية كافية لإعطاء الباقي'
        };
    }
    
    return {
        change: changeAmount,
        currency: changeCurrency,
        canGiveChange: canGiveChange,
        breakdown: null
    };
}

function calculateMixedCurrencyChange(changeNeeded, originalCurrency) {
    let remainingChange = changeNeeded;
    const breakdown = { USD: 0, LBP: 0, possible: false };
    
    // إذا كان الدفع بالدولار، نعطي أولاً من الدولار ثم الليرة
    if (originalCurrency === 'USD') {
        const usdAvailable = Math.min(cashDrawer.cashUSD, remainingChange);
        breakdown.USD = usdAvailable;
        remainingChange -= usdAvailable;
        
        if (remainingChange > 0) {
            const lbpNeeded = remainingChange * settings.exchangeRate;
            if (cashDrawer.cashLBP >= lbpNeeded) {
                breakdown.LBP = lbpNeeded;
                remainingChange = 0;
            }
        }
    } else {
        // إذا كان الدفع بالليرة، نعطي أولاً من الليرة ثم الدولار
        const lbpAvailable = Math.min(cashDrawer.cashLBP, remainingChange);
        breakdown.LBP = lbpAvailable;
        remainingChange -= lbpAvailable;
        
        if (remainingChange > 0) {
            const usdNeeded = remainingChange / settings.exchangeRate;
            if (cashDrawer.cashUSD >= usdNeeded) {
                breakdown.USD = usdNeeded;
                remainingChange = 0;
            }
        }
    }
    
    breakdown.possible = remainingChange <= 0.01; // نسامح فلوس قليلة جداً
    return breakdown;
}

function updateCashDrawer(amountReceived, currency, changeGiven, changeCurrency) {
    // إضافة المبلغ المستلم
    if (currency === 'USD') {
        cashDrawer.cashUSD += amountReceived;
    } else {
        cashDrawer.cashLBP += amountReceived;
    }
    
    // خصم الباقي المُعطى
    if (changeGiven > 0) {
        if (changeCurrency === 'USD') {
            cashDrawer.cashUSD -= changeGiven;
        } else {
            cashDrawer.cashLBP -= changeGiven;
        }
    }
    
    // تسجيل المعاملة
    cashDrawer.transactions.push({
        timestamp: new Date().toISOString(),
        type: 'sale',
        amountReceived: amountReceived,
        receivedCurrency: currency,
        changeGiven: changeGiven,
        changeCurrency: changeCurrency,
        balanceAfter: {
            USD: cashDrawer.cashUSD,
            LBP: cashDrawer.cashLBP
        }
    });
    
    cashDrawer.lastUpdate = new Date().toISOString();
    saveToStorage('cashDrawer', cashDrawer);
}

// النسخ الاحتياطي التلقائي
function autoBackup() {
    if (settings.autoBackup) {
        saveAllData();
        console.log('تم حفظ النسخة الاحتياطية التلقائية');
    }
}

// تشغيل النسخ الاحتياطي كل 5 دقائق
setInterval(autoBackup, 5 * 60 * 1000);

// وظائف المساعدة
function formatCurrency(amount, currency = 'USD') {
    let numericAmount = Number(amount);
    if (!isFinite(numericAmount)) numericAmount = 0;
    if (currency === 'USD') {
        return `$${numericAmount.toFixed(2)}`;
    } else {
        return `${Math.round(numericAmount).toLocaleString()} ل.ل`;
    }
}

function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    if (fromCurrency === 'USD' && toCurrency === 'LBP') {
        return amount * settings.exchangeRate;
    } else if (fromCurrency === 'LBP' && toCurrency === 'USD') {
        return amount / settings.exchangeRate;
    }
    return amount;
}

// تحميل المشتريات في صفحة المشتريات
function loadPurchases() {
    // تعبئة الجدول
    const tbody = document.getElementById('purchasesTable');
    if (!tbody) return;
    tbody.innerHTML = purchases.slice().sort((a,b)=> new Date(b.date) - new Date(a.date)).map(p => {
        const supplier = suppliers.find(s => s.id === p.supplierId);
        const currency = p.currency || 'USD';
        const totalDisp = currency === 'USD' ? `$${(p.total||0).toFixed(2)}` : `${Math.round(p.total||0).toLocaleString()} ل.ل`;
        const paidInBillCurr = currency === 'USD' ? (p.paidUSD||0) : Math.round((p.paidUSD||0) * (p.rate||settings.exchangeRate)).toLocaleString();
        const remainInBillCurr = currency === 'USD' ? Math.max(0, (p.totalUSD||0)-(p.paidUSD||0)).toFixed(2) : Math.round(Math.max(0, (p.totalUSD||0)-(p.paidUSD||0))*(p.rate||settings.exchangeRate)).toLocaleString();
        const remainDisp = currency === 'USD' ? `$${remainInBillCurr}` : `${remainInBillCurr} ل.ل`;
        return `
        <tr>
            <td>${p.date || '-'}</td>
            <td>${supplier ? supplier.name : ('#'+p.supplierId)}</td>
            <td>${currency}</td>
            <td>${totalDisp}</td>
            <td>${currency === 'USD' ? `$${(p.paidUSD||0).toFixed(2)}` : `${paidInBillCurr} ل.ل`}</td>
            <td>${remainDisp}</td>
            <td>${p.dueDate || '-'}</td>
            <td>${p.status || 'unpaid'}</td>
            <td>
                <button class="action-btn view-btn" onclick="openPurchase(${p.id})"><i class="fas fa-eye"></i> ${getText('view')}</button>
                <button class="action-btn return-btn" onclick="openPurchaseReturn(${p.id})"><i class="fas fa-undo"></i> ${getText('return') || (document.documentElement.lang==='en'?'Return':'إرجاع')}</button>
            </td>
        </tr>`;
    }).join('');

    // زر إنشاء فاتورة
    const newBtn = document.getElementById('newPurchaseBtn');
    if (newBtn) {
        newBtn.onclick = () => openPurchase();
    }
}

function openPurchaseReturn(billId) {
    const bill = purchases.find(p=> p.id === billId);
    if (!bill) { showMessage('الفاتورة غير موجودة', 'error'); return; }
    const prBill = document.getElementById('prBill');
    if (prBill) {
        prBill.innerHTML = `<option value="${bill.id}">#${bill.id} - ${bill.date}</option>`;
        prBill.disabled = true;
    }
    const prItem = document.getElementById('prItem');
    if (prItem) {
        prItem.innerHTML = bill.items.map((it, idx)=>{
            const prod = products.find(p=> p.id === it.productId);
            return `<option value="${idx}">${prod?prod.name:('#'+it.productId)} (Qty ${it.quantity})</option>`;
        }).join('');
    }
    document.getElementById('prQty').value = 1;
    document.getElementById('prNote').value = '';
    const confirmBtn = document.getElementById('confirmPurchaseReturn');
    if (confirmBtn) confirmBtn.onclick = () => confirmPurchaseReturn(billId);
    showModal('purchaseReturnModal');
}

function confirmPurchaseReturn(billId) {
    const bill = purchases.find(p=> p.id === billId);
    if (!bill) { showMessage('الفاتورة غير موجودة', 'error'); return; }
    const idx = parseInt(document.getElementById('prItem').value);
    const qty = Math.max(1, parseInt(document.getElementById('prQty').value)||1);
    const item = bill.items[idx];
    if (!item) { showMessage('العنصر غير موجود', 'error'); return; }
    if (qty > item.quantity) { showMessage('الكمية المرجّعة أكبر من الكمية المشتراة', 'error'); return; }

    // إنقاص المخزون
    const pr = products.find(p=> p.id === item.productId);
    if (pr) pr.stock = Math.max(0, (pr.stock||0) - qty);

    // تقليل المبلغ من الفاتورة (نسبي على أساس السعر)
    const amount = (item.price||0) * qty; // بعملة الفاتورة
    const amountUSD = toUSD(amount, bill.currency, bill.rate);
    bill.total = Math.max(0, (bill.total||0) - amount);
    bill.totalUSD = Math.max(0, (bill.totalUSD||0) - amountUSD);
    // إذا كان المدفوع أكبر من الإجمالي الجديد، عدّل المدفوع وحدّث الرصيد
    if ((bill.paidUSD||0) > (bill.totalUSD||0)) bill.paidUSD = bill.totalUSD;
    recalcPurchaseStatus(bill);

    // سجل الإرجاع
    purchaseReturns.push({
        id: Math.max(0, ...purchaseReturns.map(r=>r.id)) + 1,
        billId,
        itemIndex: idx,
        qty,
        amount,
        currency: bill.currency,
        rate: bill.rate,
        date: new Date().toISOString(),
        note: document.getElementById('prNote').value || ''
    });
    saveAllData();
    loadProducts();
    loadPurchases();
    hideModal('purchaseReturnModal');
    showMessage('تم تسجيل إرجاع الشراء');
}

function renderPurchaseItems(items, currency) {
    const container = document.getElementById('purchaseItems');
    if (!container) return;
    container.innerHTML = '';
    items.forEach((it, idx) => {
        const row = document.createElement('div');
        row.className = 'form-group';
        row.innerHTML = `
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <select class="purchase-item-product" data-idx="${idx}">
                    ${products.map(p=>`<option value="${p.id}" ${p.id===it.productId?'selected':''}>${p.name}</option>`).join('')}
                </select>
                <input type="number" class="purchase-item-qty" data-idx="${idx}" min="1" value="${it.quantity||1}" style="width:90px;">
                <input type="number" class="purchase-item-price" data-idx="${idx}" step="0.01" value="${it.price||0}" style="width:120px;" placeholder="سعر الشراء">
                <button type="button" class="clear-btn" onclick="removePurchaseItem(${idx})">حذف</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function calcPurchaseTotals(items, currency, rate) {
    const total = items.reduce((s,it)=> s + (Number(it.price)||0) * (Number(it.quantity)||1), 0);
    const totalUSD = toUSD(total, currency, rate);
    return { total, totalUSD };
}

function updatePurchaseTotalsView(items, currency, rate) {
    const totalsEl = document.getElementById('purchaseTotals');
    if (!totalsEl) return;
    const { total } = calcPurchaseTotals(items, currency, rate);
    totalsEl.textContent = currency === 'USD' ? `$${total.toFixed(2)}` : `${Math.round(total).toLocaleString()} ل.ل`;
}

function openPurchase(purchaseId) {
    const isNew = !purchaseId;
    const rate = settings.exchangeRate;
    const supplierSel = document.getElementById('purchaseSupplier');
    if (supplierSel) {
        supplierSel.innerHTML = suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
    }
    const dateInp = document.getElementById('purchaseDate');
    const dueInp = document.getElementById('purchaseDueDate');
    const currSel = document.getElementById('purchaseCurrency');
    const rateInp = document.getElementById('purchaseRate');
    const items = isNew ? [] : (purchases.find(p=> p.id===purchaseId)?.items || []);
    const currency = isNew ? 'USD' : (purchases.find(p=> p.id===purchaseId)?.currency || 'USD');
    const bill = isNew ? null : purchases.find(p=> p.id===purchaseId);

    if (dateInp) dateInp.value = (bill?.date) || new Date().toISOString().split('T')[0];
    if (dueInp) dueInp.value = bill?.dueDate || '';
    if (currSel) currSel.value = currency;
    if (rateInp) rateInp.value = bill?.rate || rate;
    if (supplierSel) supplierSel.value = String(bill?.supplierId || suppliers[0]?.id || '');

    renderPurchaseItems(items, currency);
    updatePurchaseTotalsView(items, currency, bill?.rate || rate);

    const addItemBtn = document.getElementById('addPurchaseItem');
    if (addItemBtn) {
        addItemBtn.onclick = () => {
            const curItems = (bill ? bill.items.slice() : items.slice());
            curItems.push({ productId: products[0]?.id, quantity: 1, price: 0 });
            renderPurchaseItems(curItems, (currSel?.value)||'USD');
            updatePurchaseTotalsView(curItems, (currSel?.value)||'USD', Number(rateInp?.value)||settings.exchangeRate);
            // إعادة ربط الحفظ مع العناصر الجديدة
            bindPurchaseDynamicHandlers(curItems);
        };
    }

    bindPurchaseDynamicHandlers(items);

    const saveBtn = document.getElementById('savePurchaseBtn');
    const savePayBtn = document.getElementById('saveAndPayPurchaseBtn');
    if (saveBtn) saveBtn.onclick = () => savePurchase(false);
    if (savePayBtn) savePayBtn.onclick = () => savePurchase(true);

    try { translatePurchaseModal(); } catch(_) {}
    showModal('purchaseModal');
}

function bindPurchaseDynamicHandlers(itemsRef) {
    document.querySelectorAll('.purchase-item-product').forEach(sel => {
        sel.onchange = function(){
            const idx = parseInt(this.dataset.idx);
            itemsRef[idx].productId = parseInt(this.value);
        };
    });
    document.querySelectorAll('.purchase-item-qty').forEach(inp => {
        inp.oninput = function(){
            const idx = parseInt(this.dataset.idx);
            itemsRef[idx].quantity = Math.max(1, parseInt(this.value)||1);
            updatePurchaseTotalsView(itemsRef, document.getElementById('purchaseCurrency').value, Number(document.getElementById('purchaseRate').value)||settings.exchangeRate);
        };
    });
    document.querySelectorAll('.purchase-item-price').forEach(inp => {
        inp.oninput = function(){
            const idx = parseInt(this.dataset.idx);
            itemsRef[idx].price = Number(this.value)||0;
            updatePurchaseTotalsView(itemsRef, document.getElementById('purchaseCurrency').value, Number(document.getElementById('purchaseRate').value)||settings.exchangeRate);
        };
    });
}

function removePurchaseItem(idx) {
    const items = Array.from(document.querySelectorAll('.purchase-item-product')).map((sel, i)=>{
        return {
            productId: parseInt(sel.value),
            quantity: Math.max(1, parseInt(document.querySelectorAll('.purchase-item-qty')[i].value)||1),
            price: Number(document.querySelectorAll('.purchase-item-price')[i].value)||0
        };
    });
    items.splice(idx,1);
    renderPurchaseItems(items, document.getElementById('purchaseCurrency').value);
    updatePurchaseTotalsView(items, document.getElementById('purchaseCurrency').value, Number(document.getElementById('purchaseRate').value)||settings.exchangeRate);
    bindPurchaseDynamicHandlers(items);
}

function savePurchase(payNow) {
    const supplierId = parseInt(document.getElementById('purchaseSupplier').value);
    const date = document.getElementById('purchaseDate').value || new Date().toISOString().split('T')[0];
    const dueDate = document.getElementById('purchaseDueDate').value || '';
    const currency = document.getElementById('purchaseCurrency').value || 'USD';
    const rate = Number(document.getElementById('purchaseRate').value) || settings.exchangeRate;
    const items = Array.from(document.querySelectorAll('.purchase-item-product')).map((sel, i)=>{
        return {
            productId: parseInt(sel.value),
            quantity: Math.max(1, parseInt(document.querySelectorAll('.purchase-item-qty')[i].value)||1),
            price: Number(document.querySelectorAll('.purchase-item-price')[i].value)||0
        };
    });

    if (!supplierId || items.length === 0) {
        showMessage('يرجى اختيار المورد وإضافة بنود', 'error');
        return;
    }

    // حساب الإجمالي
    const { total, totalUSD } = calcPurchaseTotals(items, currency, rate);

    // إنشاء الفاتورة
    const bill = {
        id: Math.max(0, ...purchases.map(p=>p.id)) + 1,
        supplierId, date, dueDate,
        currency, rate,
        items,
        total,
        totalUSD,
        paidUSD: 0,
        status: 'unpaid'
    };
    recalcPurchaseStatus(bill);

    // تحديث المخزون
    items.forEach(it => {
        const pr = products.find(p => p.id === it.productId);
        if (pr) pr.stock = (pr.stock||0) + (it.quantity||0);
    });

    // حفظ الفاتورة
    purchases.push(bill);
    saveAllData();

    // الدفع الآن (اختياري)
    if (payNow) {
        const payCurrency = currency; // تبسيط: الدفع بنفس عملة الفاتورة الآن
        const amount = total;
        const payUSD = toUSD(amount, payCurrency, rate);
        bill.paidUSD += payUSD;
        recalcPurchaseStatus(bill);
        supplierPayments.push({
            id: Math.max(0, ...supplierPayments.map(x=>x.id)) + 1,
            supplierId,
            date: new Date().toISOString(),
            currency: payCurrency,
            amount,
            rate,
            appliedTo: [{ billId: bill.id, amountUSD: payUSD }],
            method: 'cash'
        });
        recordSupplierPaymentCash(amount, payCurrency, 'cash', `دفعة للمورد Bill#${bill.id}`);
        saveAllData();
    }

    loadProducts();
    loadPurchases();
    hideModal('purchaseModal');
    showMessage('تم حفظ فاتورة الشراء');
}

function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    
    let iconClass = 'exclamation';
    if (type === 'success') iconClass = 'check';
    else if (type === 'error') iconClass = 'times';
    else if (type === 'warning') iconClass = 'exclamation-triangle';
    else if (type === 'info') iconClass = 'info';
    
    messageDiv.innerHTML = `<i class="fas fa-${iconClass}-circle"></i> ${message}`;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// When import succeeds we may want to allow login immediately even if
// the renderer's license-status check is slightly delayed or hits
// filesystem timing issues. Use this flag to bypass the live check once
// an import has succeeded in this session.
let __licenseForcedActive = false;

// تسجيل الدخول - نظام Activation-First
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // التحقق من التفعيل أولاً - لا يُسمح بأي تسجيل دخول بدون تفعيل
    if (!isActivated()) {
        const currentLang = document.documentElement.lang || localStorage.getItem('appLanguage') || 'ar';
        const isEn = currentLang === 'en';
        
        const message = isEn 
            ? '🚫 System not activated. Please enter activation code first.'
            : '🚫 النظام غير مُفعّل. الرجاء إدخال كود التفعيل أولاً.';
        
        showMessage(message, 'error');
        
        // فتح شاشة التفعيل تلقائياً
        setTimeout(() => {
            const activationCard = document.getElementById('activationCard');
            if (activationCard) {
                activationCard.style.display = '';
            }
        }, 1000);
        
        return; // منع تسجيل الدخول نهائياً
    }
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // التحقق من بيانات تسجيل الدخول
    if (username === 'admin' && password === 'admin123') {
        currentUser = {
            name: 'المدير',
            role: 'admin'
        };
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('mainScreen').classList.add('active');
        loadDashboard();
        updateCashDrawerDisplay();
        
        // تحديث المؤشر البصري للاشتراك
        setTimeout(async () => {
            await updateSettingsLicenseDisplay();
            if (typeof updateVisualSubscriptionIndicator === 'function') {
                updateVisualSubscriptionIndicator();
            }
        }, 500);
        
        showNotification(`🎉 أهلاً وسهلاً ${currentUser.name}!\n✨ تم تسجيل الدخول بنجاح\n🛍️ نظام إدارة المبيعات جاهز للاستخدام`, 'success', 4000);
    } else {
        showMessage('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
    }
});

// تسجيل الخروج
function logout() {
    if (confirm(getText('confirm-logout'))) {
        currentUser = null;
        document.getElementById('mainScreen').classList.remove('active');
        document.getElementById('loginScreen').classList.add('active');
        showMessage(getText('logout-success'));
    }
}

// Event listener للزر القديم
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn && !logoutBtn.onclick) {
        logoutBtn.addEventListener('click', logout);
    }
});

// سجل الصندوق - حالة ترقيم
let __cashboxState = { page: 0, pageSize: 50, data: [] };

function readCashboxTransactionsRaw() {
    try {
        const drawer = loadFromStorage('cashDrawer', { transactions: [] });
        return Array.isArray(drawer.transactions) ? drawer.transactions : [];
    } catch(e) { return []; }
}

function getCashboxRows(filtered) {
    const isEn = (document.documentElement.lang||'ar')==='en';
    const typeMapAr = {
        deposit: 'إيداع',
        expense: 'إخراج',
        transfer: 'نقل',
        sale: 'بيع (تلقائي)',
        refund: 'استرجاع (تلقائي)',
        supplier_payment: 'دفع مورد',
        customer_debt: 'تسديد دين عميل'
    };
    const typeMapEn = {
        deposit: 'Deposit',
        expense: 'Expense',
        transfer: 'Transfer',
        sale: 'Sale (auto)',
        refund: 'Refund (auto)',
        supplier_payment: 'Supplier Payment',
        customer_debt: 'Customer Debt Pay'
    };
    return filtered.map(tr => {
        const typeKey = String(tr.type||'').toLowerCase();
        const typeText = isEn ? (typeMapEn[typeKey] || typeKey) : (typeMapAr[typeKey] || typeKey);
        // عرض المبالغ في أعمدة منفصلة للدولار والليرة
        const usdAmount = (function(){
            if (typeof tr.amount !== 'undefined' && tr.currency === 'USD') return formatCurrency(tr.amount, 'USD');
            if (tr.amountUSD) return formatCurrency(tr.amountUSD, 'USD');
            return '-';
        })();
        const lbpAmount = (function(){
            if (typeof tr.amount !== 'undefined' && tr.currency === 'LBP') return `${Math.round(tr.amount).toLocaleString()} ${isEn?'LBP':'ل.ل'}`;
            if (tr.amountLBP) return `${Math.round(tr.amountLBP).toLocaleString()} ${isEn?'LBP':'ل.ل'}`;
            return '-';
        })();
        const when = formatDateTimeLocal(tr.timestamp || tr.date || '');
        const rawDesc = tr.description || tr.note || '-';
        // ترجمة الأوصاف المحفوظة
        const desc = (rawDesc === 'تعديل يدوي للصندوق من الإعدادات' || rawDesc === 'Manual cashbox adjustment from Settings') 
            ? getText('cashbox-manual-adjustment') 
            : rawDesc;
        const user = tr.user || (currentUser || '-');
        return `
        <tr>
            <td>${typeText}</td>
            <td>${usdAmount}</td>
            <td>${lbpAmount}</td>
            <td>${when}</td>
            <td>${desc}</td>
            <td>${user}</td>
        </tr>`;
    }).join('');
}

function applyCashboxFilters(data) {
    const type = (document.getElementById('cashboxTypeFilter')?.value) || 'all';
    const currency = (document.getElementById('cashboxCurrencyFilter')?.value) || 'all';
    const from = document.getElementById('cashboxFromDate')?.value || '';
    const to = document.getElementById('cashboxToDate')?.value || '';
    const q = (document.getElementById('cashboxSearch')?.value || '').toLowerCase().trim();
    let list = data;
    
    // فلترة النوع - استبعاد sale و refund
    if (type !== 'all') {
        list = list.filter(t => {
            const transactionType = String(t.type || '');
            // استبعاد المعاملات التلقائية للبيع والاسترجاع
            if (transactionType.includes('sale') || transactionType.includes('refund')) {
                return false;
            }
            return transactionType.includes(type);
        });
    } else {
        // حتى لو كان "all"، استبعاد sale و refund
        list = list.filter(t => {
            const transactionType = String(t.type || '');
            return !transactionType.includes('sale') && !transactionType.includes('refund');
        });
    }
    
    if (currency !== 'all') list = list.filter(t => (t.currency|| (t.amountUSD?'USD':(t.amountLBP?'LBP':''))) === currency);
    if (from) list = list.filter(t => new Date(t.timestamp || t.date || 0) >= new Date(from));
    if (to) list = list.filter(t => new Date(t.timestamp || t.date || 0) <= new Date(to + 'T23:59:59'));
    if (q) list = list.filter(t => String(t.description||t.note||'').toLowerCase().includes(q) || String(t.user||'').toLowerCase().includes(q));
    return list;
}

function renderCashboxChunk(reset = false) {
    const tbody = document.getElementById('cashboxTable');
    if (!tbody) return;
    if (reset) tbody.innerHTML = '';
    const start = __cashboxState.page * __cashboxState.pageSize;
    const end = Math.min(start + __cashboxState.pageSize, __cashboxState.data.length);
    const slice = __cashboxState.data.slice(start, end);
    tbody.insertAdjacentHTML('beforeend', getCashboxRows(slice));
    __cashboxState.page++;
    const info = document.getElementById('cashboxCountInfo');
    if (info) info.textContent = (document.documentElement.lang||'ar')==='en'
        ? `Showing ${Math.min(__cashboxState.page*__cashboxState.pageSize, __cashboxState.data.length)} of ${__cashboxState.data.length}`
        : `المعروض ${Math.min(__cashboxState.page*__cashboxState.pageSize, __cashboxState.data.length)} من ${__cashboxState.data.length}`;
    const moreBtn = document.getElementById('loadMoreCashboxBtn');
    if (moreBtn) moreBtn.style.display = end < __cashboxState.data.length ? 'inline-flex' : 'none';
}

function loadCashboxHistory(firstLoad = false) {
    const raw = readCashboxTransactionsRaw();
    // ترتيب تنازلي
    const sorted = raw.sort((a,b)=> new Date(b.timestamp||b.date||0) - new Date(a.timestamp||a.date||0));
    const filtered = applyCashboxFilters(sorted);
    __cashboxState.page = 0;
    __cashboxState.data = filtered;
    renderCashboxChunk(true);
    // ربط الأزرار مرة واحدة
    if (firstLoad) {
        const applyBtn = document.getElementById('cashboxApplyFilter');
        if (applyBtn) applyBtn.addEventListener('click', () => loadCashboxHistory(false));
        document.getElementById('cashboxResetFilter')?.addEventListener('click', () => {
            const ids = ['cashboxTypeFilter','cashboxCurrencyFilter','cashboxFromDate','cashboxToDate','cashboxSearch'];
            ids.forEach(id=>{ const el=document.getElementById(id); if(!el) return; if(el.tagName==='SELECT') el.value='all'; else el.value=''; });
            loadCashboxHistory(false);
        });
        document.getElementById('loadMoreCashboxBtn')?.addEventListener('click', ()=> renderCashboxChunk(false));
        document.getElementById('cashboxExportCsv')?.addEventListener('click', exportCashboxCsv);
    }
}

function formatDateTimeLocal(value) {
    try {
        if (!value) return '-';
        const d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        return d.toLocaleString();
    } catch(e) {
        return String(value || '-');
    }
}

function exportCashboxCsv() {
    const isEn = (document.documentElement.lang||'ar')==='en';
    const rows = [isEn ? ['type','amount_usd','amount_lbp','date_time','description','user'] : ['النوع','المبلغ_USD','المبلغ_LBP','التاريخ_والوقت','الوصف','المستخدم']];
    __cashboxState.data.forEach(t => {
        const usdAmount = (typeof t.amount !== 'undefined' && t.currency === 'USD') ? t.amount : (t.amountUSD || 0);
        const lbpAmount = (typeof t.amount !== 'undefined' && t.currency === 'LBP') ? t.amount : (t.amountLBP || 0);
        rows.push([
            t.type||'',
            usdAmount,
            lbpAmount,
            t.timestamp || t.date || '',
            (t.description||t.note||'').replace(/\n/g,' '),
            t.user || ''
        ]);
    });
    const csv = rows.map(r=> r.map(v=>`"${String(v).replace(/"/g,'\"')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = isEn ? 'cashbox_history.csv' : 'سجل_الصندوق.csv'; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
}

// التنقل بين الصفحات
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const targetScreen = this.getAttribute('data-screen');
        
        // إزالة الكلاس النشط من جميع عناصر القائمة
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        
        // إخفاء جميع الصفحات
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        
        // إظهار الصفحة المطلوبة
        document.getElementById(targetScreen).classList.add('active');
        
        // تحميل بيانات الصفحة
        switch(targetScreen) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'pos':
                loadPOS();
                break;
        case 'cashboxHistory':
            loadCashboxHistory(true);
            try { translateCashboxHistoryUI(); } catch(_) {}
            break;
            case 'products':
                loadProducts();
                // لا حاجة لإدارة قفل تمرير
                break;
            case 'sales':
                loadSales();
                // لا حاجة لإدارة قفل تمرير
            // تطبيق الترجمات على صفحة المبيعات
            setTimeout(() => {
                translateSales();
            }, 100);
                break;
            case 'customers':
                loadCustomers();
                // لا حاجة لإدارة قفل تمرير
                break;
            case 'purchases':
                loadPurchases();
                break;
            case 'suppliers':
                loadSuppliers();
                // لا حاجة لإدارة قفل تمرير
                break;
            case 'settings':
                loadSettings();
                // تحديث المؤشر البصري عند فتح الإعدادات
                setTimeout(() => {
                    if (typeof updateSubscriptionDisplays === 'function') {
                        updateSubscriptionDisplays();
                    } else if (typeof updateVisualSubscriptionIndicator === 'function') {
                        updateVisualSubscriptionIndicator();
                    }
                }, 100);
                break;
        }
    });
});

// تحميل لوحة التحكم
function loadDashboard() {
    try {
        // إعادة تحميل البيانات من التخزين المحلي للتأكد من أحدث البيانات
        products = getCurrentProducts();
        customers = loadFromStorage('customers', []);
        sales = loadFromStorage('sales', []);
        
        // حساب إيرادات اليوم (المبيعات اليوم فقط) - استخدام التوقيت المحلي
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        const todaySales = sales.filter(sale => {
            try {
                // استخدام timestamp إذا كان متوفراً، وإلا fallback إلى date
                const dateValue = sale.timestamp || sale.date;
                const saleDate = new Date(dateValue);
                if (isNaN(saleDate.getTime())) return false;
                
                // استخدام التوقيت المحلي للمقارنة
                const saleDateStr = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;
                return saleDateStr === today;
            } catch (error) {
                return false;
            }
        });
        const todayRevenue = todaySales.reduce((sum, sale) => {
            // تحويل جميع المبالغ إلى USD للحساب الموحد
            const amountUSD = sale.amount || 0;
            return sum + amountUSD;
        }, 0);
        
        console.log('تفاصيل حساب اليوم:', {
            today: today,
            totalSales: sales.length,
            todaySales: todaySales.length,
            todayRevenue: todayRevenue,
            salesData: todaySales.map(s => ({ date: s.date, amount: s.amount }))
        });
        
        const totalProducts = products.length;
        const totalCustomers = customers.length;
        
        // تحديث العناصر في الواجهة مع التحقق من وجودها
        const todayRevenueEl = document.getElementById('todayRevenue');
        const todaySalesEl = document.getElementById('todaySales');
        const totalProductsEl = document.getElementById('totalProducts');
        const totalCustomersEl = document.getElementById('totalCustomers');
        
        if (todayRevenueEl) {
            todayRevenueEl.textContent = formatCurrency(todayRevenue, 'USD');
        }
        if (todaySalesEl) {
            todaySalesEl.textContent = todaySales.length;
        }
        if (totalProductsEl) {
            totalProductsEl.textContent = totalProducts;
        }
        if (totalCustomersEl) {
            totalCustomersEl.textContent = totalCustomers;
        }
        
        console.log('تم تحديث لوحة التحكم:', {
            todayRevenue: todayRevenue,
            todaySales: todaySales.length,
            totalProducts: totalProducts,
            totalCustomers: totalCustomers
        });
        
    } catch (error) {
        console.error('خطأ في تحميل لوحة التحكم:', error);
        // عرض قيم افتراضية في حالة الخطأ
        const todayRevenueEl = document.getElementById('todayRevenue');
        const todaySalesEl = document.getElementById('todaySales');
        const totalProductsEl = document.getElementById('totalProducts');
        const totalCustomersEl = document.getElementById('totalCustomers');
        
        if (todayRevenueEl) todayRevenueEl.textContent = '$0.00';
        if (todaySalesEl) todaySalesEl.textContent = '0';
        if (totalProductsEl) totalProductsEl.textContent = '0';
        if (totalCustomersEl) totalCustomersEl.textContent = '0';
    }
    
    // تحديث تنبيهات المخزون
    updateStockAlertsDashboard();
    
    // تحديث الشريط العلوي والصندوق
    updateCashDrawerDisplay();
    // تطبيق مقياس الواجهة من التخزين (افتراضياً 80%)
    try {
        const savedScale = parseFloat(localStorage.getItem('ui.scale') || '0.8');
        applyAppScale(isFinite(savedScale) && savedScale > 0 ? savedScale : 0.8);
    } catch(_) { applyAppScale(0.8); }
    
    // تحديث لوحة التحكم إذا كانت مفتوحة
    updateDashboardIfActive();
    
    // تحديث إضافي للتأكد من عرض القيم الصحيحة
    setTimeout(() => {
        updateCashDrawerDisplay();
    }, 500);
    // لا حاجة لإدارة قفل تمرير
}

// تحميل نقطة البيع
function loadPOS() {
    // فحص وتحديث catalog version
    const wasUpdated = checkAndUpdateProductsCatalog();
    
    if (wasUpdated) {
        console.log('🔄 تم تحديث البيانات في POS، إعادة تحميل الواجهة...');
        
        // تحديث العربة إذا كانت مفتوحة
        updateCartProductsFromStorage();
        updateCart();
        
        // تحديث نتائج البحث إذا كان هناك بحث نشط
        const searchInput = document.getElementById('productSearch');
        if (searchInput && searchInput.value.trim()) {
            displayProducts(searchInput.value.trim());
        }
    }
    
    displayProducts(''); // إخفاء المنتجات افتراضياً وإظهار رسالة البحث
    updateCart();
    updateCashDrawerDisplay();
    // إلغاء قفل التمرير: سنعتمد على سلوك العربة الافتراضي فقط
    
    // ربط event listener لتغيير نوع السعر
    const priceTypeSelect = document.getElementById('priceType');
    if (priceTypeSelect) {
        priceTypeSelect.addEventListener('change', function() {
            currentPriceType = this.value;
            
            // تحديث نوع السعر لجميع العناصر الموجودة في العربة
            cart.forEach(item => {
                item.selectedPriceType = currentPriceType;
                // إزالة السعر المخصص عند تغيير نوع السعر
                delete item.customPriceUSD;
            });
            
            displayProducts();
            updateCart();
            
            // إظهار رسالة تأكيد
            const priceTypeNames = {
                'retail': 'مفرق 🏪',
                'wholesale': 'جملة 📦', 
                'vip': 'زبون مميز ⭐'
            };
            showMessage(`تم تغيير نوع السعر إلى: ${priceTypeNames[currentPriceType]}`, 'success');
        });
    }
    
    // ربط event listener لتغيير العملة
    const currencySelect = document.getElementById('currency');
    if (currencySelect) {
        currencySelect.addEventListener('change', function() {
            updateCart();
            updateCashDrawerDisplay();
        });
    }
    
    
    // ربط event listener للبحث (تأكّد من عدم تسجيل المتكررات)
    const searchInput = document.getElementById('productSearch');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput && !searchInput.dataset.jhListeners) {
        searchInput.dataset.jhListeners = '1';
        let searchTimeout;
        let lastInputTime = 0;
        let barcodeBuffer = '';
        let barcodeTimer;

        const safeDisplay = term => { try { displayProducts(term); } catch(e){ console.error('displayProducts error', e); } };
        const safeBarcode = code => { try { searchByBarcode(code); } catch(e){ console.error('searchByBarcode error', e); } };

        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim();
            if (searchTerm.length >= 6 && /^\d+$/.test(searchTerm)) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => { safeBarcode(searchTerm); }, 50);
            } else if (searchTerm.length > 0) {
                safeDisplay(searchTerm);
            } else {
                safeDisplay('');
            }
        });

        searchInput.addEventListener('keypress', function(e){ if (e.key === 'Enter') { const st = this.value.trim(); if (st.length >=6 && /^\d+$/.test(st)) safeBarcode(st); else safeDisplay(st); } });

        searchInput.addEventListener('keydown', function(e){ const st = this.value.trim(); if (st.length >=6 && /^\d+$/.test(st)) { clearTimeout(searchTimeout); searchTimeout = setTimeout(()=>safeBarcode(st),30); } });

        searchInput.addEventListener('paste', function(){ setTimeout(()=>{ const st=this.value.trim(); if (st.length>=6 && /^\d+$/.test(st)) safeBarcode(st); },10); });
        searchInput.addEventListener('keyup', function(){ const v=this.value.trim(); if (v.length>=6 && /^\d+$/.test(v)) { clearTimeout(searchTimeout); searchTimeout=setTimeout(()=>safeBarcode(v),30); } });
        searchInput.addEventListener('compositionend', function(){ const v=this.value.trim(); if (v.length>=6 && /^\d+$/.test(v)) safeBarcode(v); });

        // barcode buffer handler
        searchInput.addEventListener('keydown', function(e){ if (e.key >= '0' && e.key <= '9') { barcodeBuffer += e.key; clearTimeout(barcodeTimer); if (barcodeBuffer.length>=6){ barcodeTimer = setTimeout(()=>{ if (barcodeBuffer.length>=6 && /^\d+$/.test(barcodeBuffer)) { safeBarcode(barcodeBuffer); barcodeBuffer=''; } },50); } } else if (e.key === 'Enter') { if (barcodeBuffer.length>=6 && /^\d+$/.test(barcodeBuffer)) { safeBarcode(barcodeBuffer); barcodeBuffer=''; } } else { barcodeBuffer=''; } });
    }

    if (searchBtn && !searchBtn.dataset.jhListeners) {
        searchBtn.dataset.jhListeners = '1';
        searchBtn.addEventListener('click', function(){ const searchTerm = document.getElementById('productSearch').value.trim(); if (searchTerm.length>=6 && /^\d+$/.test(searchTerm)) searchByBarcode(searchTerm); else displayProducts(searchTerm); });
    }
    
    // دالة لإعداد معالجات الدفع
    function setupPaymentHandlers() {
        // معالج الدفع النقدي
        const cashPaymentBtn = document.getElementById('cashPayment');
        if (cashPaymentBtn) {
            cashPaymentBtn.addEventListener('click', function() {
                processPayment('cash');
            });
        }
        
        // معالج الدفع بالبطاقة
        const cardPaymentBtn = document.getElementById('cardPayment');
        if (cardPaymentBtn) {
            cardPaymentBtn.addEventListener('click', function() {
                processPayment('card');
            });
        }
        
        // معالج الدفع المختلط
        const mixedPaymentBtn = document.getElementById('mixedPayment');
        if (mixedPaymentBtn) {
            mixedPaymentBtn.addEventListener('click', function() {
                processPayment('mixed');
            });
        }
    }
    
    // ربط event listeners للدفع
    setupPaymentHandlers();
    
    // ربط event listener لمسح العربة
    const clearCartBtn = document.getElementById('clearCart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (confirm(getText('confirm-clear-cart'))) {
                cart = [];
                updateCart();
                showMessage('تم مسح العربة', 'success');
            }
        });
    }
    
    // ربط event listener لتغيير طريقة الدفع (موحد لكافة الأنماط: نقدي/جزئي/دين)
    const paymentMethodSelect = document.getElementById('paymentMethod');
    if (paymentMethodSelect) {
        paymentMethodSelect.addEventListener('change', function() {
            const cashSection = document.getElementById('cashPaymentSection');
            const partialSection = document.getElementById('partialPaymentSection');
            const creditSection = document.getElementById('creditSaleSection');
            if (cashSection) cashSection.style.display = 'none';
            if (partialSection) partialSection.style.display = 'none';
            if (creditSection) creditSection.style.display = 'none';
            if (this.value === 'cash') {
                if (cashSection) cashSection.style.display = 'block';
            } else if (this.value === 'partial') {
                if (partialSection) partialSection.style.display = 'block';
            } else if (this.value === 'credit') {
                if (creditSection) creditSection.style.display = 'block';
                // تأكد من تعبئة قائمة العملاء وتحديث معلومات الائتمان
                setTimeout(() => {
                    if (typeof updateCustomerSelectForCredit === 'function') {
                        updateCustomerSelectForCredit();
                    }
                }, 50);
            }
        });
    }
    
    // تحديث عرض العملاء في الدفع الجزئي
    updateCustomerSelect();
    
    // تحديث سعر الصرف
    updateExchangeRateDisplay();
}

// دالة تحديث عرض سعر الصرف
function updateExchangeRateDisplay() {
    const exchangeRateDisplay = document.getElementById('currentExchangeRate');
    if (exchangeRateDisplay && settings.exchangeRate) {
        exchangeRateDisplay.textContent = settings.exchangeRate.toLocaleString();
    }
}
function setupCashPaymentInterface() {
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const cashPaymentSection = document.getElementById('cashPaymentSection');
    const calculateChangeBtn = document.getElementById('calculateChange');
    
    // تحقق من وجود الزر قبل إضافة الحدث
    if (calculateChangeBtn) {
    calculateChangeBtn.addEventListener('click', function() {
        calculateAndDisplayChange();
    });
    }
    
    // تحديث المبلغ المطلوب تلقائياً
    const amountPaidInput = document.getElementById('amountPaid');
    if (amountPaidInput) {
        amountPaidInput.addEventListener('input', function() {
        if (this.value && this.value > 0) {
            calculateAndDisplayChange();
        } else {
                const changeDetails = document.getElementById('changeDetails');
                if (changeDetails) {
                    changeDetails.style.display = 'none';
                }
        }
    });
    }
    
    // تحديث عند تغيير العملة
    const paymentCurrencySelect = document.getElementById('paymentCurrency');
    if (paymentCurrencySelect) {
        paymentCurrencySelect.addEventListener('change', function() {
            const amountPaid = document.getElementById('amountPaid');
            if (amountPaid && amountPaid.value) {
            calculateAndDisplayChange();
        }
    });
    }
    
    const changeCurrencySelect = document.getElementById('changeCurrency');
    if (changeCurrencySelect) {
        changeCurrencySelect.addEventListener('change', function() {
            const amountPaid = document.getElementById('amountPaid');
            if (amountPaid && amountPaid.value) {
            calculateAndDisplayChange();
        }
    });
    }
    

}

function updateCashDrawerDisplay() {
    try {
    // تحديث الشريط العلوي
        const headerUSD = document.getElementById('headerDrawerUSD');
        const headerLBP = document.getElementById('headerDrawerLBP');
        
        if (headerUSD) {
            headerUSD.textContent = formatCurrency(cashDrawer.cashUSD || 0, 'USD');
        }
        
        if (headerLBP) {
            headerLBP.textContent = formatCurrency(cashDrawer.cashLBP || 0, 'LBP');
        }
        
        // تحديث الإعدادات إذا كانت مفتوحة
        const currentUSD = document.getElementById('currentUSD');
        const currentLBP = document.getElementById('currentLBP');
        
        if (currentUSD) {
            currentUSD.textContent = formatCurrency(cashDrawer.cashUSD || 0, 'USD');
        }
        
        if (currentLBP) {
            currentLBP.textContent = formatCurrency(cashDrawer.cashLBP || 0, 'LBP');
        }
        
        console.log('تم تحديث عرض الصندوق:', {
            USD: cashDrawer.cashUSD,
            LBP: cashDrawer.cashLBP
        });
        
    } catch (error) {
        console.error('خطأ في تحديث عرض الصندوق:', error);
    }
}

function calculateAndDisplayChange() {
    try {
        const finalTotalElement = document.getElementById('finalTotal');
        const currencyElement = document.getElementById('currency');
        const amountPaidElement = document.getElementById('amountPaid');
        const paymentCurrencyElement = document.getElementById('paymentCurrency');
        const changeCurrencyElement = document.getElementById('changeCurrency');
        const changeDetailsElement = document.getElementById('changeDetails');

        // التحقق من وجود العناصر المطلوبة
        if (!finalTotalElement || !currencyElement || !amountPaidElement || !paymentCurrencyElement || !changeDetailsElement) {
            console.warn('بعض عناصر حساب الباقي غير موجودة');
            return;
        }

        const finalTotalText = finalTotalElement.textContent;
        const currency = currencyElement.value;
        
        // استخراج المبلغ الإجمالي بدقة أكبر
        let totalDue = 0;
    if (currency === 'USD') {
            totalDue = parseFloat(finalTotalText.replace(/[$,]/g, '')) || 0;
    } else {
            const cleanText = finalTotalText.replace(/[ل.,\s]/g, '');
            totalDue = parseFloat(cleanText) || 0;
            // تحويل من ليرة إلى دولار للحساب
            totalDue = totalDue / settings.exchangeRate;
        }
        
        const amountPaid = parseFloat(amountPaidElement.value) || 0;
        const paymentCurrency = paymentCurrencyElement.value;
        const preferredChangeCurrency = changeCurrencyElement ? changeCurrencyElement.value || null : null;
    
    if (amountPaid === 0) {
            changeDetailsElement.style.display = 'none';
        return;
    }
    
        // تحويل المبلغ الإجمالي لعملة الدفع
    let totalInPaymentCurrency = totalDue;
    
    if (currency === 'USD' && paymentCurrency === 'LBP') {
        totalInPaymentCurrency = totalDue * settings.exchangeRate;
        } else if (currency === 'LBP' && paymentCurrency === 'USD') {
        totalInPaymentCurrency = totalDue / settings.exchangeRate;
        } else if (currency === 'LBP' && paymentCurrency === 'LBP') {
        totalInPaymentCurrency = totalDue * settings.exchangeRate;
    }
        
        // تقريب الأرقام لتجنب مشاكل الفاصلة العائمة
        totalInPaymentCurrency = Math.round(totalInPaymentCurrency * 100) / 100;
    
    const changeResult = calculateOptimalChange(totalInPaymentCurrency, amountPaid, paymentCurrency, preferredChangeCurrency);
    displayChangeDetails(changeResult, totalInPaymentCurrency, amountPaid, paymentCurrency);
        
    } catch (error) {
        console.error('خطأ في حساب الباقي:', error);
        const changeDetailsElement = document.getElementById('changeDetails');
        if (changeDetailsElement) {
            changeDetailsElement.innerHTML = '<div class="error-message">خطأ في حساب الباقي. يرجى المحاولة مرة أخرى.</div>';
            changeDetailsElement.style.display = 'block';
        }
    }
}

function displayChangeDetails(changeResult, totalDue, amountPaid, paymentCurrency) {
    const changeDetailsDiv = document.getElementById('changeDetails');
    
    let html = `
        <div class="change-summary">
            <h4><i class="fas fa-receipt"></i> تفاصيل المعاملة</h4>
            <div class="transaction-row">
                <span>المبلغ المطلوب:</span>
                <span>${formatCurrency(totalDue, paymentCurrency)}</span>
            </div>
            <div class="transaction-row">
                <span>المبلغ المدفوع:</span>
                <span>${formatCurrency(amountPaid, paymentCurrency)}</span>
            </div>
    `;
    
    if (amountPaid < totalDue) {
        const shortage = totalDue - amountPaid;
        html += `
            <div class="transaction-row error">
                <span>المبلغ ناقص:</span>
                <span>${formatCurrency(shortage, paymentCurrency)}</span>
            </div>
        `;
    } else if (amountPaid > totalDue) {
        if (changeResult.canGiveChange) {
            if (changeResult.breakdown) {
                html += `
                    <div class="transaction-row success">
                        <span>الباقي - عملات مختلطة:</span>
                        <div class="mixed-change">
                `;
                if (changeResult.breakdown.USD > 0) {
                    html += `<span>${formatCurrency(changeResult.breakdown.USD, 'USD')}</span>`;
                }
                if (changeResult.breakdown.LBP > 0) {
                    html += `<span>${formatCurrency(changeResult.breakdown.LBP, 'LBP')}</span>`;
                }
                html += `</div></div>`;
            } else {
                html += `
                    <div class="transaction-row success">
                        <span>الباقي:</span>
                        <span>${formatCurrency(changeResult.change, changeResult.currency)}</span>
                    </div>
                `;
            }
            
            if (changeResult.note) {
                html += `<div class="change-note">${changeResult.note}</div>`;
            }
        } else {
            html += `
                <div class="transaction-row error">
                    <span>تحذير:</span>
                    <span>لا توجد نقدية كافية لإعطاء الباقي</span>
                </div>
            `;
        }
    } else {
        html += `
            <div class="transaction-row success">
                <span>المبلغ مضبوط!</span>
                <span><i class="fas fa-check-circle"></i></span>
            </div>
        `;
    }
    
    html += '</div>';
    
    changeDetailsDiv.innerHTML = html;
    changeDetailsDiv.style.display = 'block';
}
function displayProducts(searchTerm = '') {
    console.log('displayProducts تم استدعاؤها بمصطلح البحث:', searchTerm); // للتشخيص
    
    // فحص وتحديث catalog version
    checkAndUpdateProductsCatalog();
    
    // إعادة تحميل المنتجات من localStorage للتأكد من أحدث البيانات
    products = getCurrentProducts();
    
    const container = document.getElementById('productsGrid');
    const currency = document.getElementById('currency').value;
    
    if (!container) {
        console.log('لم يتم العثور على productsGrid container');
        return;
    }
    
    // إذا كان هناك مصطلح بحث، اعرض النتائج في شكل قائمة
    if (searchTerm && searchTerm.trim() !== '') {
        displaySearchResults(searchTerm);
        return;
    }
    
    // إخفاء المنتجات إذا لم يكن هناك بحث
    container.innerHTML = `
        <div class="no-products-message">
            <i class="fas fa-search"></i>
            <h3>ابحث عن منتج</h3>
            <p>اكتب اسم المنتج أو الباركود للبحث</p>
        </div>
    `;
    return;
    
    const filteredProducts = products.filter(product => 
        searchTerm === '' ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode || '').includes(searchTerm)
    );
    
    console.log('عدد المنتجات المفلترة:', filteredProducts.length); // للتشخيص
    console.log('المنتجات المفلترة:', filteredProducts); // للتشخيص
    
    // إذا لم توجد نتائج
    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="no-products-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>لم يتم العثور على منتجات</h3>
                <p>جرب البحث بكلمات مختلفة أو تحقق من الباركود</p>
            </div>
        `;
        return;
    }
    
    filteredProducts.forEach(product => {
        const price = getProductPrice(product, currentPriceType, currency);
        const priceFormatted = formatCurrency(price, currency);
        
        // إنشاء عرض الأسعار المختلفة
        let priceDisplay = `<div class="price main-price">${priceFormatted}</div>`;
        
        // إضافة الأسعار الأخرى إذا كانت متوفرة
        if (product.prices) {
            const isEn = (document.documentElement.lang || 'ar') === 'en';
            const priceTypes = isEn ? { retail: 'Retail', wholesale: 'Wholesale', vip: 'VIP' } : { retail: 'مفرق', wholesale: 'جملة', vip: 'مميز' };
            
            let otherPrices = '';
            Object.keys(product.prices).forEach(type => {
                if (type !== currentPriceType) {
                    const otherPrice = getProductPrice(product, type, currency);
                    const otherPriceFormatted = formatCurrency(otherPrice, currency);
                    otherPrices += `<small class="other-price">${priceTypes[type]}: ${otherPriceFormatted}</small>`;
                }
            });
            
            if (otherPrices) {
                priceDisplay += `<div class="other-prices">${otherPrices}</div>`;
            }
        }
        
        const productCard = document.createElement('div');
        productCard.className = product.stock <= 0 ? 'product-card clickable out-of-stock' : 'product-card clickable';
        productCard.dataset.id = String(product.id);
        productCard.innerHTML = `
            <h4>${product.name}</h4>
            ${priceDisplay}
            <div class="stock">${(document.documentElement.lang||'ar')==='en' ? 'In stock' : 'متوفر'}: ${product.stock}</div>
            <div class="price-type-indicator">${getPriceTypeLabel(currentPriceType)}</div>
            <div class="add-to-cart-hint">
                <i class="fas fa-plus-circle"></i>
                <span>انقر للإضافة</span>
            </div>
        `;
        
        // إضافة event listener مباشر
        productCard.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('تم النقر على المنتج:', product.name); // للتأكد من أن النقر يعمل
            addToCart(product);
            showMessage(`تم إضافة ${product.name} إلى العربة`, 'success');
        };
        
        // إضافة تأثير hover
        productCard.onmouseenter = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        };
        
        productCard.onmouseleave = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        };
        
        container.appendChild(productCard);
    });
    
    // إضافة event delegation كطريقة بديلة
    container.addEventListener('click', function(e) {
        const productCard = e.target.closest('.product-card');
        if (productCard) {
            const productId = parseInt(productCard.dataset.id);
            const product = products.find(p => p.id === productId);
            if (product) {
                console.log('تم النقر على المنتج عبر delegation:', product.name);
                addToCart(product);
                showMessage(`تم إضافة ${product.name} إلى العربة`, 'success');
            }
        }
    });
}

// عرض نتائج البحث في شكل قائمة مع checkboxes
function displaySearchResults(searchTerm) {
    // فحص وتحديث catalog version
    checkAndUpdateProductsCatalog();
    
    // إعادة تحميل المنتجات من localStorage للتأكد من أحدث البيانات
    products = getCurrentProducts();
    
    const searchSection = document.querySelector('.search-section');
    const container = document.getElementById('productsGrid');
    const currency = document.getElementById('currency').value;
    
    // فلترة المنتجات حسب مصطلح البحث
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // إزالة أي قائمة بحث سابقة
    const existingResults = searchSection.querySelector('.search-results-list');
    if (existingResults) {
        existingResults.remove();
    }
    
    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="no-products-message">
                <i class="fas fa-search"></i>
                <h3>لا توجد نتائج</h3>
                <p>لم يتم العثور على منتجات تطابق "${searchTerm}"</p>
            </div>
        `;
        return;
    }
    
    // إنشاء قائمة النتائج
    const resultsList = document.createElement('div');
    resultsList.className = 'search-results-list';
    
    filteredProducts.forEach(product => {
        const price = getProductPrice(product, currentPriceType, currency);
        const priceFormatted = formatCurrency(price, currency);
        
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.dataset.productId = product.id;
        
        resultItem.innerHTML = `
            <div class="search-result-checkbox"></div>
            <div class="search-result-info">
                <div class="search-result-name">${product.name} / Qty: ${product.stock}</div>
                <div class="search-result-price" style="color: #10b981; font-weight: bold; font-size: 12px;">${priceFormatted}</div>
            </div>
        `;
        
        // إضافة event listener للنقر على العنصر
        resultItem.addEventListener('click', function(e) {
            // منع النقر على checkbox من إضافة المنتج
            if (e.target.classList.contains('search-result-checkbox')) {
                return;
            }
            
            e.stopPropagation();
            toggleProductSelection(this, product);
        });
        
        // إضافة event listener للcheckbox
        const checkbox = resultItem.querySelector('.search-result-checkbox');
        checkbox.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            toggleProductSelection(resultItem, product);
        });
        
        resultsList.appendChild(resultItem);
    });
    
    // إضافة قائمة النتائج إلى قسم البحث
    searchSection.appendChild(resultsList);
    
    // إخفاء منطقة المنتجات
    container.innerHTML = '';
    
    // إضافة event listener لإخفاء القائمة عند النقر خارجها فقط
    setTimeout(() => {
        document.addEventListener('click', function hideResultsOnClickOutside(e) {
            // اخفي القائمة فقط إذا كان النقر خارج قسم البحث بالكامل
            if (!searchSection.contains(e.target)) {
                const resultsList = searchSection.querySelector('.search-results-list');
                if (resultsList) {
                    resultsList.remove();
                }
                document.removeEventListener('click', hideResultsOnClickOutside);
            }
        });
    }, 100);
}

// تبديل اختيار المنتج وإضافته/إزالته من العربة
function toggleProductSelection(element, product) {
    const checkbox = element.querySelector('.search-result-checkbox');
    const isSelected = checkbox.classList.contains('checked');
    
    if (isSelected) {
        // إزالة المنتج من العربة - البحث عن الفهرس الصحيح
        const cartIndex = cart.findIndex(item => item.id === product.id);
        if (cartIndex !== -1) {
            removeFromCart(cartIndex);
        }
        checkbox.classList.remove('checked');
        element.classList.remove('selected');
        showMessage(`تم إزالة ${product.name} من العربة`, 'success');
    } else {
        // إضافة المنتج إلى العربة
        addToCart(product);
        checkbox.classList.add('checked');
        element.classList.add('selected');
        showMessage(`تم إضافة ${product.name} إلى العربة`, 'success');
    }
    
    // تحديث حالة جميع checkboxes في القائمة - تأخير صغير لتجنب التضارب
    setTimeout(() => {
        updateSearchResultCheckboxes();
    }, 100);
}

// متغير لمنع التكرار في إضافة المنتج
let isAddingToCart = false;

function addToCart(product) {
    // منع التكرار
    if (isAddingToCart) {
        console.log('تم تجاهل إضافة المنتج - جاري معالجة إضافة أخرى');
        return;
    }
    
    isAddingToCart = true;
    
    console.log('=== بدء إضافة المنتج للعربة ===');
    
    // فحص وتحديث catalog version قبل إضافة المنتج
    checkAndUpdateProductsCatalog();
    
    // الحصول على المنتجات المحدثة دائماً
    const updatedProducts = getCurrentProducts();
    const updatedProduct = updatedProducts.find(p => p.id === product.id) || product;
    
    console.log(`🔍 فحص تحديث السعر: السعر القديم=${product.priceUSD}, السعر الجديد=${updatedProduct.priceUSD}`);
    
    console.log('اسم المنتج:', updatedProduct.name);
    console.log('معرف المنتج:', updatedProduct.id);
    console.log('الباركود:', updatedProduct.barcode);
    console.log('الكمية المتاحة:', updatedProduct.stock);
    console.log('السعر USD:', updatedProduct.priceUSD);
    console.log('الأسعار المتعددة:', updatedProduct.prices);
    
    // تشخيص إضافي للتأكد من السعر الصحيح
    console.log('🔍 تشخيص السعر المفصل:');
    console.log('  - product.priceUSD (القديم):', product.priceUSD);
    console.log('  - updatedProduct.priceUSD (الجديد):', updatedProduct.priceUSD);
    console.log('  - updatedProduct.prices:', JSON.stringify(updatedProduct.prices));
    console.log('  - currentPriceType:', currentPriceType);
    
    // التحقق من الكمية المتاحة
    if (updatedProduct.stock <= 0) {
        showMessage(`⚠️ لا يمكن بيع ${updatedProduct.name} - الكمية غير متوفرة (${updatedProduct.stock})`, 'error');
        return;
    }
    
    const existingItem = cart.find(item => item.id === updatedProduct.id);
    
    if (existingItem) {
        if (updatedProduct.stock <= 0) {
            showMessage(`⚠️ لا يمكن زيادة كمية ${updatedProduct.name} - الكمية غير متوفرة (${updatedProduct.stock})`, 'error');
            return;
        }
        
        // تحديث بيانات المنتج الموجود في العربة بالسعر الجديد
        console.log(`🔄 تحديث المنتج الموجود في العربة: ${existingItem.name}`);
        console.log(`   السعر القديم: $${existingItem.priceUSD}`);
        console.log(`   السعر الجديد: $${updatedProduct.priceUSD}`);
        
        existingItem.priceUSD = updatedProduct.priceUSD;
        existingItem.priceLBP = updatedProduct.priceLBP;
        existingItem.prices = JSON.parse(JSON.stringify(updatedProduct.prices));
        existingItem.stock = updatedProduct.stock;
        existingItem.name = updatedProduct.name;
        existingItem.category = updatedProduct.category;
        existingItem.barcode = updatedProduct.barcode;
        existingItem.supplier = updatedProduct.supplier;
        
        if (existingItem.quantity < updatedProduct.stock) {
            existingItem.quantity++;
            console.log('تم زيادة الكمية للمنتج الموجود:', updatedProduct.name);
        } else {
            showMessage(`⚠️ لا يمكن زيادة كمية ${updatedProduct.name} - الكمية المتاحة: ${updatedProduct.stock}`, 'error');
            return;
        }
    } else {
        // إنشاء نسخة جديدة تماماً من المنتج مع أحدث البيانات
        const freshProduct = {
            id: updatedProduct.id,
            name: updatedProduct.name,
            category: updatedProduct.category,
            costUSD: updatedProduct.costUSD,
            prices: JSON.parse(JSON.stringify(updatedProduct.prices)), // نسخة عميقة
            priceUSD: updatedProduct.priceUSD,
            priceLBP: updatedProduct.priceLBP,
            stock: updatedProduct.stock,
            minStock: updatedProduct.minStock,
            barcode: updatedProduct.barcode,
            supplier: updatedProduct.supplier,
            quantity: 1,
            selectedPriceType: currentPriceType,
            customPriceUSD: undefined
        };
        
        console.log(`🔄 إضافة منتج جديد تماماً: ${freshProduct.name} بسعر $${freshProduct.priceUSD}`);
        
        cart.push(freshProduct);
        console.log('تم إضافة منتج جديد للعربة:', updatedProduct.name);
    }
    
    // تحديث العربة والحسابات
    // إذا كان موجودًا، احتفظ بالمؤشر للتمركز بعد التحديث
    if (existingItem) {
        lastCartFocusIndex = cart.findIndex(it => it.id === updatedProduct.id);
    } else {
        lastCartFocusIndex = cart.length - 1; // العنصر الجديد في النهاية
    }
    updateCart();
    console.log('=== تم تحديث العربة ===');
    console.log('عدد العناصر في العربة:', cart.length);
    console.log('العناصر في العربة:', cart.map(item => ({name: item.name, quantity: item.quantity})));
    
    // إبراز العربة والتمرير إليها لضمان ظهورها مهما كان الزوم
    setTimeout(() => {
        const cartWrap = document.getElementById('cartSection') || document.getElementById('cartItems');
        if (cartWrap) {
            // إلغاء أي تمرير تلقائي عند الإضافة حتى لا ترتفع القوائم
            try {
                cartWrap.classList.add('cart-flash');
                setTimeout(() => cartWrap.classList.remove('cart-flash'), 800);
            } catch(e) {}
        }
    }, 50);
    
    // تحديث فوري للحسابات إذا كانت موجودة
    setTimeout(() => {
        // تحديث حساب الباقي للدفع النقدي
        const amountPaid = document.getElementById('amountPaid');
        if (amountPaid && amountPaid.value && amountPaid.value > 0) {
            calculateAndDisplayChange();
        }
        
        // تحديث حساب الدين للدفع الجزئي
        const paymentMethod = document.getElementById('paymentMethod');
        if (paymentMethod && paymentMethod.value === 'partial') {
            const partialAmount = document.getElementById('partialAmount');
            const customerSelect = document.getElementById('customerSelect');
            if (partialAmount && partialAmount.value && customerSelect && customerSelect.value) {
                calculateAndDisplayCredit();
            }
        }
    }, 50);
}

function updateCart() {
    // حفظ موضع التمرير أو الفهرس للتمركز بعد إعادة الرسم
    const container = document.getElementById('cartItems');
    const previousScrollTop = container ? container.scrollTop : 0;
    console.log('تحديث العربة، عدد العناصر:', cart.length); // للتشخيص
    
    // تمت تهيئة container أعلاه
    const horizontalContainer = document.getElementById('cartItemsHorizontalPos');
    const currency = document.getElementById('currency').value;
    
    if (!container) {
        console.log('لم يتم العثور على container للعربة');
        return;
    }
    
    container.innerHTML = '';
    
    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-state">${getText('cart-empty')}<br><small>${getText('click-to-add')}</small></div>`;
        if (horizontalContainer) {
            horizontalContainer.innerHTML = '<div class="cart-empty-horizontal-pos">🛒 العربة فارغة - انقر على المنتجات لإضافتها</div>';
        }
        document.getElementById('finalTotal').textContent = formatCurrency(0, currency);
        
        // تحديث الملخص الأفقي
        updateHorizontalCartSummary(0, 0);
        
        // إخفاء تفاصيل الباقي عندما تكون العربة فارغة
        const changeDetails = document.getElementById('changeDetails');
        if (changeDetails) {
            changeDetails.style.display = 'none';
        }
        return;
    }
    
    let subtotal = 0;
    let totalItems = 0;
    
    // تحديث العربة العمودية
    cart.forEach((item, index) => {
        // استخدام السعر المحفوظ مع المنتج في السلة
        const priceType = item.selectedPriceType || currentPriceType;
        const baseUSD = getProductPrice(item, priceType, 'USD');
        // إذا كان هناك سعر مخصص، طبّقه على العملتين
        let price;
        if (typeof item.customPriceUSD === 'number') {
            price = currency === 'USD' ? item.customPriceUSD : Math.round(item.customPriceUSD * (settings.exchangeRate || 1));
            console.log(`💰 استخدام السعر المخصص للمنتج ${item.name}: $${item.customPriceUSD} (العرض: ${formatCurrency(price, currency)})`);
        } else {
            // إذا كان priceUSD مختلف عن السعر في prices، استخدم priceUSD مباشرة
            if (item.priceUSD && item.priceUSD !== getProductPrice(item, priceType, 'USD')) {
                price = currency === 'USD' ? item.priceUSD : Math.round(item.priceUSD * (settings.exchangeRate || 1));
                console.log(`💰 استخدام السعر المحدث مباشرة للمنتج ${item.name}: ${formatCurrency(price, currency)}`);
                console.log(`   - item.priceUSD: ${item.priceUSD} (محدث)`);
                console.log(`   - السعر من prices: ${getProductPrice(item, priceType, 'USD')} (قديم)`);
            } else {
                price = getProductPrice(item, priceType, currency);
                console.log(`💰 استخدام السعر العادي للمنتج ${item.name}: ${formatCurrency(price, currency)}`);
                console.log(`   - item.priceUSD: ${item.priceUSD}`);
                console.log(`   - item.prices:`, JSON.stringify(item.prices));
                console.log(`   - priceType: ${priceType}`);
            }
        }
        
        // تحديث نوع السعر في العنصر إذا لم يكن محفوظاً
        if (!item.selectedPriceType) {
            item.selectedPriceType = currentPriceType;
        }
        const total = price * item.quantity;
        subtotal += total;
        totalItems += item.quantity;
        
        const priceTypeLabel = getPriceTypeLabel(priceType);
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        // حساب نسبة الخصم للعرض
        let discountPct = 0;
        if (typeof item.customPriceUSD === 'number' && item.customPriceUSD < baseUSD) {
            discountPct = +(((baseUSD - item.customPriceUSD) / baseUSD) * 100).toFixed(1);
        }
        const baseDisplay = currency === 'USD' ? baseUSD : Math.round(baseUSD * (settings.exchangeRate || 1));
        const finalDisplay = price;
        const discountUSDCalc = (typeof item.customPriceUSD === 'number' && item.customPriceUSD < baseUSD) ? (baseUSD - item.customPriceUSD) : 0;
        const discountDisplay = currency === 'USD' ? discountUSDCalc : Math.round(discountUSDCalc * (settings.exchangeRate || 1));
        cartItem.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                <span class="item-price">${formatCurrency(baseDisplay, currency)} <small class="price-type-tag">${priceTypeLabel}</small></span>
                <div class="inline-edit-price" style="margin-top:4px;display:flex;flex-direction:column;align-items:stretch;gap:6px;">
                    <div class="inline-edit-row" style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;">
                        <button type="button" class="edit-price-btn" onclick="togglePriceEdit(${index})" title="${(document.documentElement.lang||'ar')==='en' ? 'Edit Price' : 'تعديل السعر'}" style="padding:4px 8px;border:2px solid #10b981;border-radius:6px;background:#f0fdf4;cursor:pointer;white-space:nowrap;font-size:10px;font-weight:700;color:#065f46;flex-shrink:0;box-shadow:0 2px 4px rgba(16,185,129,0.2);transform:translateX(14px);">
                            <i class="fas fa-edit"></i> ${(document.documentElement.lang||'ar')==='en' ? 'Edit Price' : 'تعديل السعر'}
                        </button>
                        <div class="edit-price-field" id="editPriceWrap_${index}" style="display:flex;align-items:center;gap:2px;flex-shrink:0;transform:translateX(12px);">
                            <div style="position:relative;">
                                <div class="price-stepper" style="position:absolute;left:6px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:0;z-index:1;">
                                    <button type="button" class="step-up" style="border:none;background:transparent;color:#065f46;font-size:10px;line-height:10px;cursor:pointer;padding:0;margin:0;" onclick="increasePrice(${index})">▲</button>
                                    <button type="button" class="step-down" style="border:none;background:transparent;color:#065f46;font-size:10px;line-height:10px;cursor:pointer;padding:0;margin:0;" onclick="decreasePrice(${index})">▼</button>
                                </div>
                                <input class="price-input" type="text" inputmode="decimal" pattern="[0-9]*\.?[0-9]*" value="${price}" min="0" id="customPrice_${index}" dir="ltr" style="width:70px;min-width:60px;max-width:140px;box-sizing:border-box;padding:6px 44px 6px 28px;border:2px solid #10b981;border-radius:6px;background:#f0fdf4;font-weight:700;font-size:12px;color:#065f46;line-height:1.2;box-shadow:0 2px 4px rgba(16,185,129,0.2);text-align:right;direction:ltr;unicode-bidi:isolate;font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1;letter-spacing:0.2px;" placeholder="سعر جديد" oninput="autosizePriceInput(this);updateItemCustomPrice(${index}, this.value)" onkeydown="if(event.key==='Enter'){updateItemCustomPrice(${index}, this.value,{confirmFlow:true})}" onfocus="autosizePriceInput(this)" onblur="(function(){autosizePriceInput(this); updateItemCustomPrice(${index}, this.value, {confirmFlow:true});}).call(this)">
                                <span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:10px;color:#065f46;font-weight:700;pointer-events:none;background:#f0fdf4;padding-left:2px;">${currency}</span>
                            </div>
                        </div>
                    </div>
                    <div class="line-price-summary" style="${discountPct>0 ? '' : 'visibility:hidden;'}"><span class="original-price ${discountPct>0 ? 'struck' : ''}">${formatCurrency(baseDisplay, currency)}</span>${discountPct>0 ? `<span class="final-price">${formatCurrency(finalDisplay, currency)}</span><span class="discount-badge">-${formatCurrency(discountDisplay, currency)} (${discountPct}%)</span>` : ''}</div>
                </div>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="changeQuantity(${index}, -1)">-</button>
                <input type="number" class="quantity" value="${item.quantity}" min="1" max="${item.stock}" onchange="updateQuantityDirectly(${index}, this.value)" onkeydown="if(event.key==='Enter'){updateQuantityDirectly(${index}, this.value)}" style="width:50px;text-align:center;border:1px solid #3b82f6;border-radius:4px;padding:2px;font-size:14px;font-weight:700;">
                <button class="quantity-btn" onclick="changeQuantity(${index}, 1)">+</button>
            </div>
            <div class="item-total">${getText('stock')}: ${item.stock}</div>
            <button class="remove-btn" onclick="removeFromCart(${index})" title="حذف">×</button>
        `;
        
        container.appendChild(cartItem);
    });
    
    // تحديث العربة الأفقية
    updateHorizontalCart(cart, currency);
    
    // تحديث الملخص الأفقي
    updateHorizontalCartSummary(totalItems, subtotal);
    
    // بدون ضريبة - المجموع النهائي = المجموع الفرعي
    const finalTotal = subtotal;
    
    document.getElementById('finalTotal').textContent = formatCurrency(finalTotal, currency);
    // also update the visible final total box beside the POS controls (if present)
    try {
        const box = document.getElementById('finalTotalBoxAmount');
        if (box) box.textContent = formatCurrency(finalTotal, currency);
    } catch(e) {}
    
    // حساب الباقي تلقائياً إذا كان هناك مبلغ مدفوع
    const amountPaidField = document.getElementById('amountPaid');
    if (amountPaidField && amountPaidField.value && amountPaidField.value > 0) {
        // تأخير صغير لضمان تحديث DOM
        setTimeout(() => {
        calculateAndDisplayChange();
        }, 50);
    } else if (cart.length === 0) {
        // إخفاء تفاصيل الباقي عندما تكون العربة فارغة
        const changeDetails = document.getElementById('changeDetails');
        if (changeDetails) {
            changeDetails.style.display = 'none';
        }
    }
    
    // تحديث حسابات الدفع الجزئي إذا كانت مفعلة
    const paymentMethod = document.getElementById('paymentMethod');
    if (paymentMethod && paymentMethod.value === 'partial') {
        const partialAmount = document.getElementById('partialAmount');
        const customerSelect = document.getElementById('customerSelect');
        if (partialAmount && partialAmount.value && customerSelect && customerSelect.value) {
            setTimeout(() => {
                calculateAndDisplayCredit();
            }, 50);
        }
    }
    // استعادة موضع التمرير أو التمركز على العنصر الذي تم تعديله
    if (container) {
        if (typeof lastCartFocusIndex === 'number' && lastCartFocusIndex !== null) {
            const items = Array.from(container.querySelectorAll('.cart-item'));
            const clampedIndex = Math.max(0, Math.min(items.length - 1, lastCartFocusIndex));
            const target = items[clampedIndex];
            // التمرير التلقائي للمنتج الجديد
            if (target) {
                target.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest', 
                    inline: 'end' 
                });
            }
        } else {
            // التمرير التلقائي للمنتج الأخير المضاف
            setTimeout(() => {
                const items = Array.from(container.querySelectorAll('.cart-item'));
                if (items.length > 0) {
                    const lastItem = items[items.length - 1];
                    lastItem.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest', 
                        inline: 'end' 
                    });
                }
            }, 100);
        }
    }
    
    // تحديث حالة checkboxes في نتائج البحث
    updateSearchResultCheckboxes();
    
    // تحديث تنبيهات المخزون في لوحة التحكم
    updateStockAlertsDashboard();
}

// تحديث حالة checkboxes في نتائج البحث
// متغير لمنع التكرار
let isUpdatingCheckboxes = false;

function updateSearchResultCheckboxes() {
    // منع التكرار
    if (isUpdatingCheckboxes) {
        return;
    }
    
    isUpdatingCheckboxes = true;
    
    const searchResults = document.querySelectorAll('.search-result-item');
    searchResults.forEach(item => {
        const productId = parseInt(item.dataset.productId);
        const checkbox = item.querySelector('.search-result-checkbox');
        const isInCart = cart.some(cartItem => cartItem.id === productId);
        
        if (isInCart) {
            checkbox.classList.add('checked');
            item.classList.add('selected');
        } else {
            checkbox.classList.remove('checked');
            item.classList.remove('selected');
        }
    });
    
    // إعادة تعيين المتغير بعد انتهاء التحديث
    setTimeout(() => {
        isUpdatingCheckboxes = false;
    }, 50);
    
    // إعادة تعيين متغير إضافة المنتج
    setTimeout(() => {
        isAddingToCart = false;
    }, 100);
}

function changeQuantity(index, change) {
    const item = cart[index];
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        removeFromCart(index);
        return;
    }
    
    if (newQuantity > item.stock) {
        showMessage('الكمية المطلوبة غير متوفرة', 'error');
        return;
    }
    
    cart[index].quantity = newQuantity;
    lastCartFocusIndex = index;
    
    // تحديث العربة والحسابات
    updateCart();
    
    // تحديث فوري للحسابات إذا كانت موجودة
    setTimeout(() => {
        // تحديث حساب الباقي للدفع النقدي
        const amountPaid = document.getElementById('amountPaid');
        if (amountPaid && amountPaid.value && amountPaid.value > 0) {
            calculateAndDisplayChange();
        }
        
        // تحديث حساب الدين للدفع الجزئي
        const paymentMethod = document.getElementById('paymentMethod');
        if (paymentMethod && paymentMethod.value === 'partial') {
            const partialAmount = document.getElementById('partialAmount');
            const customerSelect = document.getElementById('customerSelect');
            if (partialAmount && partialAmount.value && customerSelect && customerSelect.value) {
                calculateAndDisplayCredit();
            }
        }
    }, 50);
}

function updateQuantityDirectly(index, newQuantity) {
    const item = cart[index];
    const quantity = parseInt(newQuantity);
    
    if (isNaN(quantity) || quantity <= 0) {
        showMessage('يرجى إدخال كمية صحيحة', 'warning');
        updateCart(); // إعادة عرض القيم الصحيحة
        return;
    }
    
    if (quantity > item.stock) {
        showMessage(`الكمية المطلوبة (${quantity}) أكبر من المخزون المتاح (${item.stock})`, 'warning');
        updateCart(); // إعادة عرض القيم الصحيحة
        return;
    }
    
    cart[index].quantity = quantity;
    lastCartFocusIndex = index;
    
    updateCart();
}

function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
        const removedItem = cart[index];
        cart.splice(index, 1);
        updateCart();
        if (removedItem && removedItem.name) {
            showMessage(`تم حذف ${removedItem.name} من العربة`);
        } else {
            showMessage('تم حذف المنتج من العربة');
        }
    }
}


// مسح العربة (مفيد لإعادة الاستخدام عند إتمام البيع أو الإلغاء)
function clearCart() {
    cart = [];
    updateCart();
}


// معالجة الدفع
document.getElementById('processPayment').addEventListener('click', function() {
    console.log('🔄 [POS] processPayment clicked');
    if (cart.length === 0) {
        showMessage('العربة فارغة', 'error');
        return;
    }
    
    const currency = document.getElementById('currency').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    // للدفع الجزئي، نحتاج للتحقق من العميل والمبلغ
    if (paymentMethod === 'partial') {
        const customerId = parseInt(document.getElementById('customerSelect').value);
        const paidAmount = parseFloat(document.getElementById('partialAmount').value) || 0;
        const partialCurrency = document.getElementById('partialCurrency').value;
        
        if (!customerId) {
            showMessage('يرجى اختيار عميل للدفع الجزئي', 'error');
            return;
        }
        
        if (paidAmount <= 0) {
            showMessage('يرجى إدخال مبلغ مدفوع صحيح', 'error');
            return;
        }
        
        const customer = customers.find(c => c.id === customerId);
        if (!customer) {
            showMessage('العميل غير موجود', 'error');
            return;
        }
        
        // حساب الفاتورة والدين
        const finalTotalText = document.getElementById('finalTotal').textContent;
        let totalDue;
        if (currency === 'USD') {
            totalDue = parseFloat(finalTotalText.replace('$', '').replace(',', ''));
        } else {
            totalDue = parseFloat(finalTotalText.replace(' ل.ل', '').replace(/,/g, '')) / settings.exchangeRate;
        }
        
        let paidInUSD = paidAmount;
        if (partialCurrency === 'LBP') {
            paidInUSD = paidAmount / settings.exchangeRate;
        }
        
        const remainingDebt = totalDue - paidInUSD;
        const newTotalDebt = customer.creditBalance + remainingDebt;
        
        // التحقق من الحد الائتماني
        if (newTotalDebt > customer.creditLimit) {
            const excess = newTotalDebt - customer.creditLimit;
            if (!confirm(`سيتجاوز الدين الحد المسموح بمقدار ${formatCurrency(excess)}. هل تريد المتابعة؟`)) {
                return;
            }
        }
        
        // تحديث الصندوق بالمبلغ المدفوع
        if (partialCurrency === 'USD') {
            cashDrawer.cashUSD += paidAmount;
        } else {
            cashDrawer.cashLBP += paidAmount;
        }
        
        // حفظ الصندوق وتحديث العرض
        cashDrawer.lastUpdate = new Date().toISOString();
        saveToStorage('cashDrawer', cashDrawer);
        updateCashDrawerDisplay();
        
        // إضافة الدين للعميل
        const success = addCreditToCustomer(customerId, remainingDebt, `فاتورة رقم INV-${(sales.length + 1).toString().padStart(3, '0')}`);
        
        if (!success) {
            showMessage('خطأ في إضافة الدين للعميل', 'error');
            return;
        }
        
        console.log(`تم إضافة دين ${remainingDebt}$ للعميل ${customer.name}. الدين الجديد: ${customer.creditBalance}$`);
        
    } else if (paymentMethod === 'credit') {
        // توقف التنفيذ هنا حتى لا يُنشئ مسار البيع النقدي فاتورة فارغة بعد مسار الائتمان
        processCreditSale();
        return;
    } else if (paymentMethod === 'cash') {
        const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
        if (amountPaid === 0) {
            showMessage('يرجى إدخال المبلغ المدفوع', 'error');
            return;
        }
        
        const finalTotalText = document.getElementById('finalTotal').textContent;
        let totalDue;
        if (currency === 'USD') {
            totalDue = parseFloat(finalTotalText.replace('$', '').replace(',', ''));
        } else {
            totalDue = parseFloat(finalTotalText.replace(' ل.ل', '').replace(/,/g, ''));
        }
        
        const paymentCurrency = document.getElementById('paymentCurrency').value;
        const preferredChangeCurrency = document.getElementById('changeCurrency').value || null;
        
        // تحويل المبلغ الإجمالي لعملة الدفع
        let totalInPaymentCurrency = totalDue;
        if (currency !== paymentCurrency) {
            if (currency === 'USD' && paymentCurrency === 'LBP') {
                totalInPaymentCurrency = totalDue * settings.exchangeRate;
            } else if (currency === 'LBP' && paymentCurrency === 'USD') {
                totalInPaymentCurrency = totalDue / settings.exchangeRate;
            }
        }
        
        if (amountPaid < totalInPaymentCurrency) {
            const completeRemainderEnabled = window.__completeRemainderLBP__ === true;
            if (!completeRemainderEnabled) {
                showMessage(`المبلغ المدفوع أقل من المطلوب. الناقص: ${formatCurrency(totalInPaymentCurrency - amountPaid, paymentCurrency)}`, 'error');
                return;
            }
        }
        
        // حساب الباقي (مع أخذ الإكمال بالليرة بعين الاعتبار)
        const completeRemainderEnabled = window.__completeRemainderLBP__ === true;
        let mixedLBPRemainder = 0;
        if (completeRemainderEnabled && amountPaid < totalInPaymentCurrency) {
            const remainingInPaymentCurrency = totalInPaymentCurrency - amountPaid;
            mixedLBPRemainder = paymentCurrency === 'LBP' ? remainingInPaymentCurrency : Math.round(remainingInPaymentCurrency * (settings.exchangeRate || 1));
        }
        const changeResult = completeRemainderEnabled && mixedLBPRemainder > 0
            ? { canGiveChange: true, change: 0, currency: paymentCurrency }
            : calculateOptimalChange(totalInPaymentCurrency, amountPaid, paymentCurrency, preferredChangeCurrency);
        
        if (!changeResult.canGiveChange && changeResult.change > 0) {
            if (!confirm('لا توجد نقدية كافية لإعطاء الباقي. هل تريد المتابعة؟')) {
                return;
            }
        }
        
        // تحديث الصندوق - إضافة المبلغ المستلم
        if (paymentCurrency === 'USD') { cashDrawer.cashUSD += amountPaid; } else { cashDrawer.cashLBP += amountPaid; }
        if (mixedLBPRemainder > 0) { cashDrawer.cashLBP += mixedLBPRemainder; }
        
        // خصم الباقي المُعطى
        if (mixedLBPRemainder === 0 && changeResult.breakdown) {
            // عملات مختلطة
            if (changeResult.breakdown.USD > 0) {
                cashDrawer.cashUSD -= changeResult.breakdown.USD;
            }
            if (changeResult.breakdown.LBP > 0) {
                cashDrawer.cashLBP -= changeResult.breakdown.LBP;
            }
        } else if (mixedLBPRemainder === 0 && changeResult.change > 0) {
            if (changeResult.currency === 'USD') {
                cashDrawer.cashUSD -= changeResult.change;
            } else {
                cashDrawer.cashLBP -= changeResult.change;
            }
        }
        
        // تسجيل المعاملة
        cashDrawer.transactions.push({
            timestamp: new Date().toISOString(),
            type: 'sale',
            amountReceived: amountPaid,
            receivedCurrency: paymentCurrency,
            changeGiven: changeResult.breakdown ? 
                (changeResult.breakdown.USD + changeResult.breakdown.LBP / settings.exchangeRate) : 
                changeResult.change,
            changeCurrency: changeResult.currency,
            details: mixedLBPRemainder > 0 ? `دفعة مختلطة: ${amountPaid} ${paymentCurrency} + ${mixedLBPRemainder.toLocaleString()} ل.ل` : undefined,
            balanceAfter: {
                USD: cashDrawer.cashUSD,
                LBP: cashDrawer.cashLBP
            }
        });
        
        cashDrawer.lastUpdate = new Date().toISOString();
        saveToStorage('cashDrawer', cashDrawer);
        
        // تحديث عرض الصندوق فوراً
        updateCashDrawerDisplay();
    }
    
    let total = 0;
    const saleItems = [];
    
    cart.forEach(item => {
        // اعتماد السعر المخصص إن وجد (USD) ثم تحويله عند الحاجة
        let baseUSD = item.customPriceUSD != null ? item.customPriceUSD : item.priceUSD;
        const price = currency === 'USD' ? baseUSD : Math.round(baseUSD * settings.exchangeRate);
        total += price * item.quantity;
        
        // حساب الخصم إن وُجد
        const originalUSD = item.priceUSD;
        const discountUSD = Math.max(0, originalUSD - baseUSD);
        const discountPct = originalUSD > 0 ? +(discountUSD / originalUSD * 100).toFixed(1) : 0;
        saleItems.push({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: price,
            originalPriceUSD: originalUSD,
            finalPriceUSD: baseUSD,
            discountUSD: discountUSD,
            discountPct: discountPct
        });
        
        // تحديث المخزون لكل أنواع البيع (نقدي/جزئي/دين)
        const product = products.find(p => p.id === item.id);
        if (product) {
            product.stock = Math.max(0, (product.stock || 0) - item.quantity);
            // سجل حركة المخزون
            recordStockMovement('sale', product.id, -item.quantity, 'PENDING', `خصم بيع ${item.name}`);
        }
    });
    
    // بدون ضريبة - المجموع النهائي = المجموع الفرعي
    const finalTotal = total;
    
    // تسوية دين سابق مضاف إلى العربة عند الدفع النقدي
    let previousAccountSettled = false;
    let previousAccountAmount = 0;
    if (paymentMethod === 'cash') {
        const prevItem = cart.find(i => i.type === 'previous_account');
        if (prevItem && prevItem.customerId) {
            const customer = customers.find(c => c.id === prevItem.customerId);
            if (customer) {
                const before = customer.creditBalance || 0;
                previousAccountAmount = Math.min(before, Number(prevItem.customPriceUSD ?? prevItem.priceUSD ?? prevItem.price) || 0);
                customer.creditBalance = Math.max(0, before - previousAccountAmount);
                customer.currentDebt = customer.creditBalance;
                previousAccountSettled = previousAccountAmount > 0;
                
                // console.log(`🔍 [Debug] Debt settlement calculation:`, {
                //     customerName: customer.name,
                //     beforeBalance: before,
                //     prevItemPrice: Number(prevItem.customPriceUSD ?? prevItem.priceUSD ?? prevItem.price),
                //     previousAccountAmount: previousAccountAmount,
                //     newBalance: customer.creditBalance,
                //     previousAccountSettled: previousAccountSettled
                // });
                if (!Array.isArray(customer.creditHistory)) customer.creditHistory = [];
                customer.creditHistory.push({
                    timestamp: new Date().toISOString(),
                    type: 'settlement',
                    amount: -previousAccountAmount,
                    description: 'تسوية دين سابق عبر بيع نقدي',
                    balanceAfter: customer.creditBalance
                });
                saveToStorage('customers', customers);
                // إضافة سجل عام للعميل
                const logs = loadFromStorage('customerLogs', {});
                const key = String(customer.id);
                if (!Array.isArray(logs[key])) logs[key] = [];
                logs[key].push({
                    timestamp: new Date().toLocaleString(),
                    action: 'تسوية دين سابق',
                    user: (currentUser || 'المستخدم'),
                    note: `تم تسوية ${formatCurrency(previousAccountAmount)} عبر بيع نقدي`
                });
                saveToStorage('customerLogs', logs);
                
                console.log(`✅ [Settlement] Successfully settled $${previousAccountAmount} for customer ${customer.name}, new balance: $${customer.creditBalance}`);
            }
        }
    }
    
    // إنشاء فاتورة جديدة
    let customerName = 'عميل عادي';
    let customerId = null;
    
    // إذا كان دفع جزئي، الحصول على معلومات العميل
    if (paymentMethod === 'partial') {
        customerId = parseInt(document.getElementById('customerSelect').value);
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            customerName = customer.name;
        }
    }
    // إذا كان دفع نقدي مع تسوية دين سابق، الحصول على معلومات العميل من العربة
    else if (paymentMethod === 'cash' && previousAccountSettled) {
        const prevItem = cart.find(i => i.type === 'previous_account');
        if (prevItem && prevItem.customerId) {
            customerId = prevItem.customerId;
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                customerName = customer.name;
            }
        }
    }
    
    const now = new Date();
    const localDateTimeISO = getLocalDateTimeISO();
    const newSale = {
        id: sales.length + 1,
        invoiceNumber: `INV-${(sales.length + 1).toString().padStart(3, '0')}`,
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`, // التاريخ المحلي
        timestamp: localDateTimeISO, // التاريخ والوقت الكامل بالوقت المحلي
        customer: customerName,
        customerId: customerId,
        amount: currency === 'USD' ? (finalTotal + previousAccountAmount) : convertCurrency((finalTotal + previousAccountAmount), 'LBP', 'USD'),
        paymentMethod: getPaymentMethodText(paymentMethod),
        items: saleItems,
        previousAccountSettled: previousAccountSettled,
        previousAccountAmount: previousAccountAmount
    };
    
    // إضافة تفاصيل الدفع للفاتورة
    if (paymentMethod === 'cash') {
        const amountPaid = parseFloat(document.getElementById('amountPaid').value);
        const paymentCurrency = document.getElementById('paymentCurrency').value;
        
        newSale.cashDetails = {
            amountPaid: amountPaid,
            paymentCurrency: paymentCurrency,
            change: amountPaid - (currency === paymentCurrency ? finalTotal : 
                   (currency === 'USD' && paymentCurrency === 'LBP' ? finalTotal * settings.exchangeRate :
                    finalTotal / settings.exchangeRate))
        };
    } else if (paymentMethod === 'partial') {
        const customerId = parseInt(document.getElementById('customerSelect').value);
        const paidAmount = parseFloat(document.getElementById('partialAmount').value);
        const partialCurrency = document.getElementById('partialCurrency').value;
        const customer = customers.find(c => c.id === customerId);
        
        newSale.partialDetails = {
            customerId: customerId,
            customerName: customer.name,
            amountPaid: paidAmount,
            paymentCurrency: partialCurrency,
            debtAmount: finalTotal - (partialCurrency === currency ? paidAmount : 
                       (partialCurrency === 'USD' && currency === 'LBP' ? paidAmount * settings.exchangeRate :
                        paidAmount / settings.exchangeRate))
        };
    }
    
    // تحديث أرقام الفاتورة المعلقة في حركات المخزون
    try {
        const movements = loadFromStorage('stockMovements', []);
        movements.forEach(m => { if (m.invoiceNumber === 'PENDING') m.invoiceNumber = newSale.invoiceNumber; });
        saveToStorage('stockMovements', movements);
    } catch(e) {}

    console.log('🔄 [POS] About to push newSale:', newSale);
    sales.push(newSale);
    saveAllData();
    
    // تحديث إجمالي مشتريات العملاء
    console.log('🔄 [POS] About to call updateAllCustomersTotalPurchases');
    updateAllCustomersTotalPurchases();
    
    // تحديث عرض العملاء إذا كان هناك تسوية دين سابق
    if (previousAccountSettled && customerId) {
        console.log(`🔄 [UI] Refreshing customers display after debt settlement for customer ${customerId}`);
        try { loadCustomers(); } catch(e) {}
    }
    
    // إضافة console.log إضافي للتتبع
    if (customerId) {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            console.log(`📊 [Final] Customer ${customer.name} final state:`, {
                creditBalance: customer.creditBalance,
                totalPurchases: customer.totalPurchases,
                previousAccountSettled: previousAccountSettled,
                previousAccountAmount: previousAccountAmount,
                saleAmount: newSale.amount
            });
        }
    }
    
    // تحديث تنبيهات المخزون
    updateStockAlertsDashboard();
    
    // تحديث لوحة التحكم
    updateDashboardIfActive();
    
    // حفظ سجل المبيعات العام - استخدام الوقت الحقيقي للفاتورة
    const salesLogs = loadFromStorage('salesLogs', []);
    salesLogs.push({
        timestamp: newSale.timestamp, // استخدام نفس timestamp الفاتورة المحلي الحقيقي
        invoiceNumber: newSale.invoiceNumber,
        amount: newSale.amount,
        currency,
        method: newSale.paymentMethod,
        customer: newSale.customer || '-',
        user: currentUser || 'المستخدم'
    });
    saveToStorage('salesLogs', salesLogs);
    
    // إفراغ العربة وتنظيف الواجهة
    cart = [];
    updateCart();
    
    // تحديث لوحة التحكم بعد إتمام البيع
    setTimeout(() => {
        updateDashboardIfActive();
    }, 100);
    displayProducts();
    
    
    // تحديث الصندوق فوراً وحفظ البيانات
    saveToStorage('cashDrawer', cashDrawer);
    updateCashDrawerDisplay();
    
    // تحديث إضافي بعد ثانية للتأكد
    setTimeout(() => {
        updateCashDrawerDisplay();
    }, 1000);
    
    // إعادة تعيين واجهة الدفع بالكامل
    // تنظيف جميع الحقول
    const amountPaidField = document.getElementById('amountPaid');
    const partialAmountField = document.getElementById('partialAmount');
    const customerSelectField = document.getElementById('customerSelect');
    const changeDetailsDiv = document.getElementById('changeDetails');
    const creditDetailsDiv = document.getElementById('creditDetails');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const partialPaymentSection = document.getElementById('partialPaymentSection');
    const cashPaymentSection = document.getElementById('cashPaymentSection');
    
    // إعادة تعيين القيم
    if (amountPaidField) amountPaidField.value = '';
    if (partialAmountField) partialAmountField.value = '';
    if (customerSelectField) customerSelectField.value = '';
    if (changeDetailsDiv) {
        changeDetailsDiv.innerHTML = '';
        changeDetailsDiv.style.display = 'none';
    }
    if (creditDetailsDiv) {
        creditDetailsDiv.innerHTML = '';
        creditDetailsDiv.style.display = 'none';
    }
    
    // إعادة تعيين طريقة الدفع للنقدي
    if (paymentMethodSelect) {
        paymentMethodSelect.value = 'cash';
    }
    
    // إظهار قسم الدفع النقدي وإخفاء الجزئي
    if (cashPaymentSection) cashPaymentSection.style.display = 'block';
    if (partialPaymentSection) partialPaymentSection.style.display = 'none';
    
    // تحديث قوائم العملاء
    updateCustomerSelect();
    if (document.getElementById('customers').classList.contains('active')) {
        loadCustomers();
    }
    
    // إظهار إشعار النجاح مفصل
    if (paymentMethod === 'partial') {
        const customer = customers.find(c => c.id === customerId);
        const paidAmount = parseFloat(document.getElementById('partialAmount').value) || 0;
        const partialCurrency = document.getElementById('partialCurrency').value;
        const debtAmount = finalTotal - (partialCurrency === currency ? paidAmount : 
                       (partialCurrency === 'USD' && currency === 'LBP' ? paidAmount * settings.exchangeRate :
                        paidAmount / settings.exchangeRate));
        
        showNotification(`✅ تمت العملية بنجاح!
📄 فاتورة رقم: ${newSale.invoiceNumber}
👤 العميل: ${customer?.name || 'غير محدد'}
💵 مدفوع: ${formatCurrency(paidAmount, partialCurrency)}
💰 دين جديد: ${formatCurrency(debtAmount)}
📊 إجمالي الدين: ${formatCurrency(customer?.creditBalance || 0)}`, 'success', 6000);
    } else {
        let msg = `✅ تمت المعاملة بنجاح!\n📄 رقم الفاتورة: ${newSale.invoiceNumber}\n💰 المبلغ: ${formatCurrency(finalTotal, currency)}`;
        if (previousAccountSettled) {
            msg += `\n🏦 تم تسوية دين سابق بقيمة: ${formatCurrency(previousAccountAmount)}`;
        }
        showNotification(msg, 'success', 4000);
    }
    
    // طباعة تلقائية إذا كانت مفعلة
    if (settings.printAfterSale || previousAccountSettled) {
        setTimeout(() => {
            showInvoice(newSale);
        }, 1000);
    }
});
// تغيير مقياس التطبيق (0.5 - 1.25 مثلاً)
function applyAppScale(scale){
    const clamped = Math.min(1.25, Math.max(0.5, Number(scale)||0.8));
    document.documentElement.style.setProperty('--app-scale', String(clamped));
    const body = document.body;
    if (body) {
        // switch to transform-based scaling to avoid clipping/scroll issues
        body.classList.add('app-scale');
        body.classList.remove('app-zoom-off');
    }
}

// واجهة صغيرة لحفظ المقياس اختيارياً لاحقاً
function setUserScale(scale){
    applyAppScale(scale);
    try { localStorage.setItem('ui.scale', String(scale)); } catch(_) {}
}

function getPaymentMethodText(method) {
    const methods = {
        'cash': 'نقدي',
        'partial': 'دفع جزئي (دين)'
    };
    return methods[method] || method;
}
// وظائف نظام الدين والدفع الجزئي
function setupPartialPaymentInterface() {
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const cashPaymentSection = document.getElementById('cashPaymentSection');
    const partialPaymentSection = document.getElementById('partialPaymentSection');
    const creditSaleSection = document.getElementById('creditSaleSection');
    
    // تحقق من وجود العناصر
    if (!paymentMethodSelect) {
        console.error('عنصر paymentMethod غير موجود');
        return;
    }
    if (!cashPaymentSection) {
        console.error('عنصر cashPaymentSection غير موجود');
        return;
    }
    if (!partialPaymentSection) {
        console.error('عنصر partialPaymentSection غير موجود');
        return;
    }
    if (!creditSaleSection) {
        console.error('عنصر creditSaleSection غير موجود');
        return;
    }
    
    // إعداد تبديل أقسام الدفع
    paymentMethodSelect.addEventListener('change', function() {
        // إخفاء جميع الأقسام أولاً
        if (cashPaymentSection) cashPaymentSection.style.display = 'none';
        if (partialPaymentSection) partialPaymentSection.style.display = 'none';
        if (creditSaleSection) creditSaleSection.style.display = 'none';
        
        if (this.value === 'cash') {
            if (cashPaymentSection) cashPaymentSection.style.display = 'block';
        } else if (this.value === 'partial') {
            if (partialPaymentSection) partialPaymentSection.style.display = 'block';
            updateCustomerSelect();
        } else if (this.value === 'credit') {
            if (creditSaleSection) {
                creditSaleSection.style.display = 'block';
                // تحديث قائمة العملاء للبيع بالدين
                setTimeout(() => {
                    updateCustomerSelectForCredit();
                }, 100);
            }
        }
    });
    
    // تطبيق الحالة الابتدائية بحسب القيمة الحالية
    try { paymentMethodSelect.dispatchEvent(new Event('change')); } catch(e) {}
    
    // حساب الدين
    const calculateCreditBtn = document.getElementById('calculateCredit');
    if (calculateCreditBtn) {
        calculateCreditBtn.addEventListener('click', function() {
            calculateAndDisplayCredit();
        });
    }
    
    // زر إضافة حساب سابق
    const addPreviousAccountBtn = document.getElementById('addPreviousAccountBtn');
    if (addPreviousAccountBtn) {
        addPreviousAccountBtn.addEventListener('click', function() {
            addPreviousAccountToCart();
        });
    }

    // تحديث عند تغيير المبلغ أو العميل
    const partialAmountInput = document.getElementById('partialAmount');
    if (partialAmountInput) {
        partialAmountInput.addEventListener('input', function() {
            const customerSelect = document.getElementById('customerSelect');
            if (this.value && customerSelect && customerSelect.value) {
                calculateAndDisplayCredit();
            }
        });
    }
    
    // تحديث تلقائي للمبلغ المدفوع عند تغيير العملة
    const paymentCurrencySelect = document.getElementById('paymentCurrency');
    if (paymentCurrencySelect) {
        paymentCurrencySelect.addEventListener('change', function() {
            const amountField = document.getElementById('amountPaid');
            if (amountField && amountField.value) {
                setTimeout(() => calculateAndDisplayChange(), 100);
            }
        });
    }
    
    // تحديث تلقائي للباقي عند تغيير عملة الباقي
    const changeCurrencySelect = document.getElementById('changeCurrency');
    if (changeCurrencySelect) {
        changeCurrencySelect.addEventListener('change', function() {
            const amountField = document.getElementById('amountPaid');
            if (amountField && amountField.value) {
                setTimeout(() => calculateAndDisplayChange(), 100);
            }
        });
    }
    
    const customerSelectDropdown = document.getElementById('customerSelect');
    if (customerSelectDropdown) {
        customerSelectDropdown.addEventListener('change', function() {
            const partialAmount = document.getElementById('partialAmount');
            if (partialAmount && partialAmount.value && this.value) {
                calculateAndDisplayCredit();
            }
            // إظهار/إخفاء زر إضافة حساب سابق بحسب دين العميل
            togglePreviousAccountButton(this.value);
        });
    }
    
    // إعداد مستمعات الأحداث للبيع بالدين
    const creditCustomerSelect = document.getElementById('creditCustomerSelect');
    if (creditCustomerSelect) {
        creditCustomerSelect.addEventListener('change', function() {
            const customerId = parseInt(this.value);
            if (customerId) {
                updateCreditInfo(customerId);
            }
        });
    }
}

function updateCustomerSelect() {
    const sel = document.getElementById('customerSelect');
    const list = document.getElementById('customerList');
    const search = document.getElementById('customerSearch');
    
    if (sel) sel.innerHTML = customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    
    // initialize combo
    const renderList = (term='') => {
        if (!list) return;
        const t = (term||'').trim().toLowerCase();
        const filtered = customers.filter(c => {
            const name = (c.name||'').toLowerCase();
            const mail = (c.email||'').toLowerCase();
            const phone = (c.phone||'').toLowerCase();
            return !t || name.includes(t) || mail.includes(t) || phone.includes(t);
        });
        if (filtered.length === 0) {
            list.innerHTML = `<div class="customer-item">لا نتائج</div>`;
        } else {
            list.innerHTML = filtered.map(c=>`<div class="customer-item" data-id="${c.id}"><span>${c.name}</span><span class="debt">${getText('current-debt')}: ${formatCurrency(c.creditBalance || 0)}</span></div>`).join('');
        }
        list.style.display = 'block';
        // bind click
        list.querySelectorAll('.customer-item').forEach(item => {
            item.onclick = function(){
                const id = parseInt(this.dataset.id);
                if (sel) sel.value = String(id);
                if (search) search.value = customers.find(c=>c.id===id)?.name || '';
                list.style.display = 'none';
                // تحديث زر إضافة الحساب السابق
                if (typeof togglePreviousAccountButton === 'function') {
                    togglePreviousAccountButton(id);
                }
            };
        });
    };
    
    if (search) {
        search.addEventListener('click', function() {
            this.readOnly = false;
            this.focus();
            renderList('');
        });
        
        search.addEventListener('input', function() {
            renderList(this.value);
        });
        
        search.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                list.style.display = 'none';
                this.blur();
            }
        });
    }
    
    // إخفاء القائمة عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#customerCombo')) {
            if (list) list.style.display = 'none';
        }
    });
    
    console.log(`تم تحديث قائمة العملاء: ${customers.length} عميل`);
}

// Actions dropdown functionality
function toggleActionsDropdown(customerId) {
    // Close all other dropdowns first
    const allDropdowns = document.querySelectorAll('.actions-dropdown-menu.show');
    allDropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });
    
    // Toggle current dropdown
    const dropdown = document.getElementById(`actions-menu-${customerId}`);
    if (dropdown) {
        dropdown.classList.toggle('show');
        
        // إذا كانت القائمة مفتوحة، تأكد من ظهورها بالكامل
        if (dropdown.classList.contains('show')) {
            // إزالة أي قيود على العرض
            dropdown.style.overflow = 'visible';
            dropdown.style.maxHeight = 'none';
            dropdown.style.height = 'auto';
            dropdown.style.zIndex = '999999';
            dropdown.style.position = 'fixed';
            
            // حساب الموضع الصحيح للقائمة
            const button = dropdown.previousElementSibling;
            if (button) {
                const rect = button.getBoundingClientRect();
                const dropdownWidth = 180;
                
                // موضع افتراضي أسفل الزر
                let top = rect.bottom + window.scrollY;
                let left = rect.right - dropdownWidth;
                
                // التأكد من أن القائمة لا تخرج من الشاشة من اليمين
                if (rect.right - dropdownWidth < 0) {
                    left = rect.left + window.scrollX;
                }
                
                // تطبيق الموضع
                dropdown.style.top = top + 'px';
                dropdown.style.left = left + 'px';
                
                // الانتظار قليلاً لحساب الارتفاع الفعلي
                setTimeout(() => {
                    const dropdownHeight = dropdown.offsetHeight;
                    
                    // إذا كانت القائمة تخرج من الشاشة من الأسفل
                    if (rect.bottom + dropdownHeight > window.innerHeight) {
                        dropdown.style.top = (rect.top + window.scrollY - dropdownHeight - 5) + 'px';
                    }
                }, 10);
            }
            
            // التأكد من أن جميع العناصر مرئية
            const menuItems = dropdown.querySelectorAll('.dropdown-action-btn');
            menuItems.forEach(item => {
                item.style.display = 'flex';
                item.style.visibility = 'visible';
                item.style.opacity = '1';
            });
            
            // التأكد من أن الحاويات الأب تسمح للقائمة بالظهور
            let parent = dropdown.parentElement;
            while (parent && parent !== document.body) {
                if (parent.style.overflow === 'hidden') {
                    parent.style.overflow = 'visible';
                }
                if (parent.classList.contains('table-container') || 
                    parent.classList.contains('data-table') ||
                    parent.tagName === 'TABLE' ||
                    parent.tagName === 'TBODY' ||
                    parent.tagName === 'TR' ||
                    parent.tagName === 'TD') {
                    parent.style.overflow = 'visible';
                }
                parent = parent.parentElement;
            }
        }
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.actions-dropdown')) {
        const allDropdowns = document.querySelectorAll('.actions-dropdown-menu.show');
        allDropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

// Close dropdown when pressing Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const allDropdowns = document.querySelectorAll('.actions-dropdown-menu.show');
        allDropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

// إعادة حساب موضع القوائم المنسدلة عند التمرير أو تغيير حجم النافذة
window.addEventListener('scroll', function() {
    const allDropdowns = document.querySelectorAll('.actions-dropdown-menu.show');
    allDropdowns.forEach(dropdown => {
        const button = dropdown.previousElementSibling;
        if (button) {
            const rect = button.getBoundingClientRect();
            const dropdownWidth = 180;
            
            let top = rect.bottom + window.scrollY;
            let left = rect.right - dropdownWidth;
            
            if (rect.right - dropdownWidth < 0) {
                left = rect.left + window.scrollX;
            }
            
            dropdown.style.top = top + 'px';
            dropdown.style.left = left + 'px';
            
            // التحقق من الخروج من الأسفل
            setTimeout(() => {
                const dropdownHeight = dropdown.offsetHeight;
                if (rect.bottom + dropdownHeight > window.innerHeight) {
                    dropdown.style.top = (rect.top + window.scrollY - dropdownHeight - 5) + 'px';
                }
            }, 10);
        }
    });
});

window.addEventListener('resize', function() {
    const allDropdowns = document.querySelectorAll('.actions-dropdown-menu.show');
    allDropdowns.forEach(dropdown => {
        const button = dropdown.previousElementSibling;
        if (button) {
            const rect = button.getBoundingClientRect();
            const dropdownWidth = 180;
            
            let top = rect.bottom + window.scrollY;
            let left = rect.right - dropdownWidth;
            
            if (rect.right - dropdownWidth < 0) {
                left = rect.left + window.scrollX;
            }
            
            dropdown.style.top = top + 'px';
            dropdown.style.left = left + 'px';
            
            // التحقق من الخروج من الأسفل
            setTimeout(() => {
                const dropdownHeight = dropdown.offsetHeight;
                if (rect.bottom + dropdownHeight > window.innerHeight) {
                    dropdown.style.top = (rect.top + window.scrollY - dropdownHeight - 5) + 'px';
                }
            }, 10);
        }
    });
});

// إظهار/إخفاء زر إضافة حساب سابق حسب دين العميل
function togglePreviousAccountButton(customerId) {
    const addPreviousAccountGroup = document.getElementById('addPreviousAccountGroup');
    if (!addPreviousAccountGroup) return;
    if (customerId && customerId !== '') {
        const customer = customers.find(c => c.id === parseInt(customerId));
        if (customer && (customer.creditBalance || 0) > 0) {
            addPreviousAccountGroup.style.display = 'block';
        } else {
            addPreviousAccountGroup.style.display = 'none';
        }
    } else {
        addPreviousAccountGroup.style.display = 'none';
    }
}

// إضافة حساب سابق إلى العربة كبند خاص
function addPreviousAccountToCart() {
    const customerId = parseInt(document.getElementById('customerSelect').value);
    if (!customerId) { showMessage('يرجى اختيار عميل أولاً', 'error'); return; }
    const customer = customers.find(c => c.id === customerId);
    if (!customer) { showMessage('العميل غير موجود', 'error'); return; }
    const balance = customer.creditBalance || 0;
    if (balance <= 0) { showMessage('هذا العميل لا يملك دين سابق', 'info'); return; }
    const exists = cart.find(i => i.type === 'previous_account' && i.customerId === customerId);
    if (exists) { showMessage('تم إضافة حساب هذا العميل السابق مسبقاً', 'warning'); return; }
        cart.push({
            id: `prev_account_${customerId}_${Date.now()}`,
            name: `${getText('previous-account')} - ${customer.name}`,
            priceUSD: balance,
            customPriceUSD: balance,
        quantity: 1,
        type: 'previous_account',
        customerId,
        customerName: customer.name
    });
    updateCart();
    showMessage(`تم إضافة حساب سابق بقيمة ${formatCurrency(balance)}`, 'success');
    const group = document.getElementById('addPreviousAccountGroup');
    if (group) group.style.display = 'none';
}

function calculateAndDisplayCredit() {
    const customerId = parseInt(document.getElementById('customerSelect').value);
    const paidAmount = parseFloat(document.getElementById('partialAmount').value) || 0;
    const currency = document.getElementById('partialCurrency').value;
    
    if (!customerId || paidAmount <= 0) {
        document.getElementById('creditDetails').style.display = 'none';
        return;
    }
    
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // حساب المبلغ الإجمالي للفاتورة
    const finalTotalText = document.getElementById('finalTotal').textContent;
    const cartCurrency = document.getElementById('currency').value;
    
    let totalDue;
    if (cartCurrency === 'USD') {
        totalDue = parseFloat(finalTotalText.replace('$', '').replace(',', ''));
    } else {
        totalDue = parseFloat(finalTotalText.replace(' ل.ل', '').replace(/,/g, '')) / settings.exchangeRate;
    }
    
    // تحويل المبلغ المدفوع إلى دولار للحساب
    let paidInUSD = paidAmount;
    if (currency === 'LBP') {
        paidInUSD = paidAmount / settings.exchangeRate;
    }
    
    const remainingDebt = totalDue - paidInUSD;
    const newTotalDebt = customer.creditBalance + remainingDebt;
    
    // التحقق من الحد الأقصى للدين
    const creditExceeded = newTotalDebt > customer.creditLimit;
    
    displayCreditDetails(customer, totalDue, paidInUSD, remainingDebt, newTotalDebt, creditExceeded, currency);
}

function displayCreditDetails(customer, totalDue, paidAmount, remainingDebt, newTotalDebt, creditExceeded, currency) {
    const creditDetailsDiv = document.getElementById('creditDetails');
    
    let html = `
        <div class="credit-summary">
            <h4><i class="fas fa-user-check"></i> تفاصيل حساب ${customer.name}</h4>
            <div class="credit-row">
                <span>إجمالي الفاتورة:</span>
                <span>${formatCurrency(totalDue)}</span>
            </div>
            <div class="credit-row">
                <span>المبلغ المدفوع:</span>
                <span>${formatCurrency(paidAmount, currency)}</span>
            </div>
            <div class="credit-row">
                <span>المبلغ المتبقي (دين جديد):</span>
                <span>${formatCurrency(remainingDebt)}</span>
            </div>
            <div class="credit-row">
                <span>الدين السابق:</span>
                <span>${formatCurrency(customer.creditBalance)}</span>
            </div>
            <div class="credit-row ${creditExceeded ? 'error' : 'success'}">
                <span>إجمالي الدين بعد المعاملة:</span>
                <span>${formatCurrency(newTotalDebt)}</span>
            </div>
            <div class="credit-row">
                <span>الحد الأقصى المسموح:</span>
                <span>${formatCurrency(customer.creditLimit)}</span>
            </div>
    `;
    
    if (creditExceeded) {
        const excess = newTotalDebt - customer.creditLimit;
        html += `
            <div class="credit-warning">
                <i class="fas fa-exclamation-triangle"></i>
                تحذير: الدين سيتجاوز الحد المسموح بمقدار ${formatCurrency(excess)}
            </div>
        `;
    } else {
        const available = customer.creditLimit - newTotalDebt;
        html += `
            <div class="credit-note">
                <i class="fas fa-info-circle"></i>
                سيتبقى ${formatCurrency(available)} من الحد الائتماني
            </div>
        `;
    }
    
    html += '</div>';
    
    creditDetailsDiv.innerHTML = html;
    creditDetailsDiv.style.display = 'block';
}

function addCreditToCustomer(customerId, amount, description) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        console.error(`العميل غير موجود: ${customerId}`);
        return false;
    }
    
    const oldBalance = customer.creditBalance || 0;
    customer.creditBalance = (customer.creditBalance || 0) + amount;
    
    if (!customer.creditHistory) {
        customer.creditHistory = [];
    }
    
    customer.creditHistory.push({
        date: new Date().toISOString().split('T')[0],
        type: 'purchase',
        amount: amount,
        description: description
    });
    
    console.log(`تحديث دين العميل ${customer.name}:`, {
        oldBalance: oldBalance,
        addedAmount: amount,
        newBalance: customer.creditBalance,
        creditLimit: customer.creditLimit
    });
    
    saveToStorage('customers', customers);
    return true;
}
function viewCreditHistory(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const modal = document.getElementById('reportModal');
    const modalTitle = modal.querySelector('.modal-header h2');
    const modalBody = modal.querySelector('.modal-body');
    
    modalTitle.innerHTML = `<i class="fas fa-history"></i> تاريخ ديون ${customer.name}`;
    
    let html = `
        <div class="credit-history">
            <div class="credit-summary-card">
                <h3>ملخص الحساب</h3>
                <div class="summary-row">
                    <span>الدين الحالي:</span>
                    <span class="amount ${customer.creditBalance > 0 ? 'debt' : 'clear'}">
                        ${formatCurrency(customer.creditBalance)}
                    </span>
                </div>
                <div class="summary-row">
                    <span>الحد الائتماني:</span>
                    <span class="amount">${formatCurrency(customer.creditLimit)}</span>
                </div>
                <div class="summary-row">
                    <span>المتاح:</span>
                    <span class="amount">${formatCurrency(customer.creditLimit - customer.creditBalance)}</span>
                </div>
            </div>
            
            <h3>تاريخ المعاملات</h3>
            <div class="credit-history-table">
    `;
    
    const langCH = document.documentElement.lang || 'ar';
    const tCH = langCH === 'en'
        ? { title: 'Transactions History', date: 'Date', type: 'Type', amount: 'Amount', desc: 'Description', purchase: 'Purchase', pay: 'Payment', empty: 'No history' }
        : { title: 'تاريخ المعاملات', date: 'التاريخ', type: 'النوع', amount: 'المبلغ', desc: 'الوصف', purchase: 'شراء', pay: 'دفع', empty: 'لا يوجد تاريخ معاملات' };
    if (customer.creditHistory && customer.creditHistory.length > 0) {
        html += `
            <table>
                <thead>
                    <tr>
                        <th>${tCH.date}</th>
                        <th>${tCH.type}</th>
                        <th>${tCH.amount}</th>
                        <th>${tCH.desc}</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        customer.creditHistory.forEach(record => {
            const typeIcon = record.type === 'purchase' ? 'fas fa-shopping-cart' : 'fas fa-money-bill';
            const typeText = record.type === 'purchase' ? tCH.purchase : tCH.pay;
            html += `
                <tr>
                    <td>${record.date}</td>
                    <td><i class="${typeIcon}"></i> ${typeText}</td>
                    <td class="amount">${formatCurrency(record.amount)}</td>
                    <td>${record.description}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
    } else {
        html += `<p class="no-data">${tCH.empty}</p>`;
    }
    
    html += `
            </div>
        </div>
    `;
    
    modalBody.innerHTML = html;
    modal.style.display = 'block';
}

// عرض سجل المعاملات (دخول/خروج) للعميل
function openCustomerTransactions(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    const logs = loadFromStorage('customerLogs', {});
    const key = String(customerId);
    let list = Array.isArray(logs[key]) ? logs[key] : [];
    // ترتيب تنازلي بحسب التاريخ والوقت
    list = list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    const lang = document.documentElement.lang || 'ar';
    const tHead = lang === 'en'
        ? { title: 'Customer Log', datetime: 'Date & Time', type: 'Type', user: 'User', notes: 'Notes', empty: 'No logs' }
        : { title: 'سجل العميل', datetime: 'التاريخ والوقت', type: 'النوع', user: 'المستخدم', notes: 'ملاحظات', empty: 'لا يوجد سجلات' };
    let html = `
        <div class="report-stats">
            <div class="stat-item">
                <h4>${tHead.title}</h4>
                <p class="stat-value">${customer.name}</p>
            </div>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th>${tHead.datetime}</th>
                    <th>${tHead.type}</th>
                    <th>${tHead.user}</th>
                    <th>${tHead.notes}</th>
                </tr>
            </thead>
            <tbody>
                ${list.length ? list.map((r, index) => `
                    <tr ${index === 0 ? 'style="background-color:#e3f2fd;font-weight:700;"' : ''}>
                        <td>${r.timestamp || '-'}</td>
                        <td>${r.action || '-'}</td>
                        <td>${r.user || '-'}</td>
                        <td>${r.note || '-'}</td>
                    </tr>
                `).join('') : `<tr><td colspan="4">${tHead.empty}</td></tr>`}
            </tbody>
        </table>
    `;
    const reportContent = document.getElementById('reportContent');
    const reportTitle = document.getElementById('reportTitle');
    if (reportTitle) reportTitle.textContent = tHead.title;
    if (reportContent) reportContent.innerHTML = html;
    showModal('reportModal');
}

function openPayDebt(customerId) {
    const select = document.getElementById('payDebtCustomer');
    const current = document.getElementById('payDebtCurrent');
    if (!select || !current) return;
    // تعريب واجهة النافذة
    try { translatePayDebtModalUI(); } catch(e) {}
    // تعبئة العملاء
    select.innerHTML = '';
    customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} - دين: ${formatCurrency(c.creditBalance || 0)}`;
        select.appendChild(opt);
    });
    select.value = String(customerId || '');
    const cust = customers.find(c => c.id === (customerId || parseInt(select.value)));
    current.value = formatCurrency(cust?.creditBalance || 0);
    showModal('payDebtModal');
}

document.getElementById('payDebtCustomer')?.addEventListener('change', function(){
    const c = customers.find(x => x.id === parseInt(this.value));
    const current = document.getElementById('payDebtCurrent');
    if (current) current.value = formatCurrency(c?.creditBalance || 0);
});

document.getElementById('confirmPayDebt')?.addEventListener('click', function(){
    const select = document.getElementById('payDebtCustomer');
    const amountInput = document.getElementById('payDebtAmount');
    const currencySel = document.getElementById('payDebtCurrency');
    const customer = customers.find(c => c.id === parseInt(select.value));
    if (!customer) { showMessage('يرجى اختيار عميل', 'error'); return; }
    const amount = parseFloat(amountInput.value) || 0;
    if (amount <= 0) { showMessage('أدخل مبلغاً صحيحاً', 'error'); return; }
    // تحويل إلى USD إذا الدفع بالليرة
    const amountUSD = currencySel.value === 'USD' ? amount : (amount / (settings.exchangeRate || 1));
    const before = customer.creditBalance || customer.currentDebt || 0;
    const pay = Math.min(amountUSD, before);
    customer.currentDebt = Math.max(before - pay, 0);
    customer.creditBalance = customer.currentDebt;
    saveToStorage('customers', customers);

    // تحديث الصندوق بإضافة المبلغ المدفوع
    if (currencySel.value === 'USD') { cashDrawer.cashUSD += amount; } else { cashDrawer.cashLBP += amount; }
    cashDrawer.lastUpdate = new Date().toISOString();
    saveToStorage('cashDrawer', cashDrawer);
    updateCashDrawerDisplay();

    // سجل العميل
    const clog = loadFromStorage('customerLogs', {});
    const key = String(customer.id);
    if (!Array.isArray(clog[key])) clog[key] = [];
    const logEntry = { timestamp: new Date().toLocaleString(), action: 'تسديد', user: (currentUser || 'المستخدم'), note: `تسديد ${amount} ${currencySel.value}` };
    clog[key].push(logEntry);
    saveToStorage('customerLogs', clog);
    console.log('Saved customerLogs entry:', key, logEntry);

    // تحديث إجمالي مشتريات العميل بعد الدفع
    updateCustomerTotalPurchasesAfterPayment(customer.id, pay);
    
    // تحديث عرض العملاء للتأكد من ظهور التغييرات
    try { loadCustomers(); } catch(e) {}
    
    // سجل المبيعات (دفعة على حساب) - استخدام الوقت الحقيقي
    const salesLogs = loadFromStorage('salesLogs', []);
    salesLogs.push({ timestamp: getLocalDateTimeISO(), invoiceNumber: '-', amount: amountUSD, currency: 'USD', method: 'payment', customer: customer.name, user: (currentUser || 'المستخدم') });
    saveToStorage('salesLogs', salesLogs);

    showNotification(getText('pay-debt-success'), 'success', 2500);
    hideModal('payDebtModal');
    loadCustomers();
});

// ترجمة نافذة تسديد دين العميل
function translatePayDebtModalUI() {
    const lang = document.documentElement.lang || 'ar';
    const modal = document.getElementById('payDebtModal');
    if (!modal) return;
    const t = (key) => ( (typeof getText === 'function') ? getText(key) : key );
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = t('pay-debt-title');
    const groups = modal.querySelectorAll('.report-body .form-group');
    if (groups && groups.length >= 4) {
        groups[0].querySelector('label').textContent = t('pay-debt-customer');
        groups[1].querySelector('label').textContent = t('pay-debt-current');
        groups[2].querySelector('label').textContent = t('pay-debt-amount');
        groups[3].querySelector('label').textContent = t('pay-debt-currency');
    }
    const currencySel = document.getElementById('payDebtCurrency');
    if (currencySel && currencySel.options.length >= 2) {
        currencySel.options[0].textContent = t('currency-usd');
        currencySel.options[1].textContent = t('currency-lbp');
    }
    const actions = modal.querySelectorAll('.modal-actions button');
    if (actions && actions.length >= 2) {
        const confirmBtn = modal.querySelector('#confirmPayDebt');
        const cancelBtn = actions[1];
        if (confirmBtn) {
            const icon = confirmBtn.querySelector('i');
            confirmBtn.textContent = t('confirm-pay-debt');
            if (icon) confirmBtn.prepend(icon);
        }
        if (cancelBtn) {
            const icon = cancelBtn.querySelector('i');
            cancelBtn.textContent = t('cancel-generic');
            if (icon) cancelBtn.prepend(icon);
        }
    }
}

// مسح العربة
document.getElementById('clearCart').addEventListener('click', function() {
    cart = [];
    updateCart();
    showMessage('تم مسح العربة');
});

// وظائف صفحة الفواتير
function loadInvoices() {
    const invoicesTable = document.getElementById('invoicesTable');
    // ترتيب تنازلي بحسب التاريخ والوقت (الأحدث أولاً)
    const sorted = [...sales].sort((a, b) => {
        // استخدام timestamp إذا كان متوفراً، وإلا fallback إلى date
        const timestampA = a.timestamp || a.date || 0;
        const timestampB = b.timestamp || b.date || 0;
        
        const da = new Date(timestampA);
        const db = new Date(timestampB);
        return db - da;
    });
    
    invoicesTable.innerHTML = sorted.map(sale => {
        let status = 'نشطة';
        let statusClass = 'active';
        
        if (sale.cancelled) {
            status = 'ملغاة';
            statusClass = 'cancelled';
        } else if (sale.returned) {
            status = 'مرجعة';
            statusClass = 'returned';
        }
        
        return `
        <tr class="${sale.cancelled ? 'cancelled-row' : ''}">
            <td>${sale.invoiceNumber}</td>
            <td>${formatDateTime(sale.timestamp || sale.date, sale.paymentMethod)}</td>
            <td>${sale.customer}</td>
            <td>${formatCurrency(sale.amount)}</td>
            <td>${sale.paymentMethod}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td>
                <button class="action-btn view-btn" onclick="viewInvoice('${sale.invoiceNumber}')">عرض</button>
                ${!sale.cancelled && !sale.returned ? `
                <button class="action-btn return-btn" onclick="returnInvoice('${sale.invoiceNumber}')">إرجاع</button>
                ` : ''}
            </td>
        </tr>
        `;
    }).join('');
}

function returnInvoice(invoiceNumber) {
    const sale = sales.find(s => s.invoiceNumber === invoiceNumber);
    if (!sale) {
        showNotification('❌ الفاتورة غير موجودة', 'error');
        return;
    }
    
    if (sale.returned) {
        showNotification('❌ الفاتورة مرجعة مسبقاً', 'error');
        return;
    }
    
    if (sale.cancelled) {
        showNotification('❌ لا يمكن إرجاع فاتورة ملغاة', 'error');
        return;
    }
    
    // طلب كلمة المرور لإرجاع الفاتورة
    const password = prompt('🔒 أدخل كلمة المرور لإرجاع الفاتورة:');
    if (password !== '00') {
        showNotification('❌ كلمة المرور خاطئة! لا يمكن إرجاع الفاتورة.', 'error', 3000);
        return;
    }
    
    if (!confirm(getText('confirm-return-invoice').replace('{invoiceNumber}', invoiceNumber))) {
        return;
    }
    
    // إرجاع الفاتورة
    sale.returned = true;
    sale.returnedDate = new Date().toISOString().split('T')[0];
    
    // إرجاع المنتجات للمخزون
    sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.stock += item.quantity;
        }
    });
    
    // إرجاع المبالغ المدفوعة للصندوق (عكس العملية)
    if (sale.cashDetails) {
        const currency = sale.cashDetails.paymentCurrency;
        const amount = sale.cashDetails.amountPaid;
        
        // إرجاع المبلغ للصندوق (إضافة وليس طرح!)
        if (currency === 'USD') {
            cashDrawer.cashUSD += amount;
        } else {
            cashDrawer.cashLBP += amount;
        }
        
        // إضافة معاملة إيداع للصندوق
        cashDrawer.transactions.push({
            date: new Date().toISOString(),
            type: 'deposit',
            amountUSD: currency === 'USD' ? amount : 0,
            amountLBP: currency === 'LBP' ? amount : 0,
            description: `إرجاع مبلغ فاتورة ملغاة ${invoiceNumber}`
        });
    }
    
    // إذا كان دفع جزئي، تقليل الدين من العميل
    if (sale.partialDetails) {
        const customer = customers.find(c => c.id === sale.customerId);
        if (customer) {
            const debtAmount = sale.partialDetails.debtAmount;
            customer.creditBalance = Math.max(0, customer.creditBalance - debtAmount);
            
            // إضافة سجل في تاريخ العميل
            if (!customer.creditHistory) customer.creditHistory = [];
            customer.creditHistory.push({
                date: new Date().toISOString().split('T')[0],
                type: 'cancellation',
                amount: -debtAmount,
                description: `إلغاء فاتورة ${invoiceNumber}`
            });
            
            // إرجاع المبلغ المدفوع للصندوق
            const currency = sale.partialDetails.paymentCurrency;
            const paidAmount = sale.partialDetails.amountPaid;
            
            // إرجاع المبلغ المدفوع للصندوق (إضافة وليس طرح!)
            if (currency === 'USD') {
                cashDrawer.cashUSD += paidAmount;
            } else {
                cashDrawer.cashLBP += paidAmount;
            }
            
            cashDrawer.transactions.push({
                date: new Date().toISOString(),
                type: 'deposit',
                amountUSD: currency === 'USD' ? paidAmount : 0,
                amountLBP: currency === 'LBP' ? paidAmount : 0,
                description: `إرجاع مبلغ مدفوع - فاتورة ملغاة ${invoiceNumber}`
            });
        }
    }
    
    // حفظ البيانات
    saveAllData();
    
    // تحديث الواجهات
    loadInvoices();
    updateCashDrawerDisplay();
    displayProducts();
    
    if (document.getElementById('customers').classList.contains('active')) {
        loadCustomers();
    }
    
    // إظهار إشعار مفصل
    let message = `✅ تم إرجاع الفاتورة ${invoiceNumber} بنجاح!

📦 المنتجات أُرجعت للمخزون`;
    
    if (sale.cashDetails) {
        const currency = sale.cashDetails.paymentCurrency;
        const amount = sale.cashDetails.amountPaid;
        message += `
💰 ${formatCurrency(amount, currency)} أُرجع للصندوق`;
    }
    
    if (sale.partialDetails) {
        const customer = customers.find(c => c.id === sale.customerId);
        const debtAmount = sale.partialDetails.debtAmount;
        const paidAmount = sale.partialDetails.amountPaid;
        const currency = sale.partialDetails.paymentCurrency;
        message += `
👤 ${customer?.name}: تم تقليل الدين ${formatCurrency(debtAmount)}
💰 ${formatCurrency(paidAmount, currency)} أُرجع للصندوق`;
    }
    
    showNotification(message, 'success', 6000);
}

function viewInvoice(invoiceNumber) {
    const sale = sales.find(s => s.invoiceNumber === invoiceNumber);
    if (sale) {
        showInvoice(sale);
    }
}

function filterInvoices() {
    const fromDate = document.getElementById('invoicesFromDate').value;
    const toDate = document.getElementById('invoicesToDate').value;
    
    let filteredSales = sales;
    
    if (fromDate) {
        filteredSales = filteredSales.filter(sale => {
            try {
                const dateValue = sale.timestamp || sale.date;
                const saleDate = new Date(dateValue);
                return !isNaN(saleDate.getTime()) && saleDate >= new Date(fromDate);
            } catch (error) {
                return false;
            }
        });
    }
    
    if (toDate) {
        filteredSales = filteredSales.filter(sale => {
            try {
                const dateValue = sale.timestamp || sale.date;
                const saleDate = new Date(dateValue);
                return !isNaN(saleDate.getTime()) && saleDate <= new Date(toDate);
            } catch (error) {
                return false;
            }
        });
    }
    
    displayFilteredInvoices(filteredSales);
}

function displayFilteredInvoices(filteredSales) {
    const invoicesTable = document.getElementById('invoicesTable');
    
    // دالة محسنة لتحليل timestamp
    function parseSaleTimestamp(sale) {
        const timestamp = sale.timestamp || sale.date || 0;
        if (!timestamp) return new Date(0);
        
        try {
            // إذا كان timestamp محلي بصيغة ISO
            if (typeof timestamp === 'string' && timestamp.includes('T')) {
                if (!timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-', 10)) {
                    // timestamp محلي بدون timezone - parse يدوياً
                    const parts = timestamp.split('T');
                    if (parts.length === 2) {
                        const [datePart, timePart] = parts;
                        const [year, month, day] = datePart.split('-').map(Number);
                        const timeWithMs = timePart.includes('.') ? timePart : timePart + '.000';
                        const [timeOnly, ms] = timeWithMs.split('.');
                        const [hours, minutes, seconds] = timeOnly.split(':').map(Number);
                        return new Date(year, month - 1, day, hours, minutes, seconds, Number(ms.padEnd(3, '0')));
                    }
                }
                return new Date(timestamp);
            }
            
            return new Date(timestamp);
        } catch (error) {
            console.warn('خطأ في تحليل timestamp:', timestamp, error);
            return new Date(0);
        }
    }
    
    // ترتيب تنازلي بحسب التاريخ والوقت ورقم الفاتورة
    const sorted = [...filteredSales].sort((a, b) => {
        const da = parseSaleTimestamp(a);
        const db = parseSaleTimestamp(b);
        
        // أولاً حسب الوقت
        const timeDiff = db.getTime() - da.getTime();
        if (timeDiff !== 0) return timeDiff;
        
        // ثم حسب رقم الفاتورة (الأحدث أولاً)
        const invoiceA = a.invoiceNumber || '';
        const invoiceB = b.invoiceNumber || '';
        return invoiceB.localeCompare(invoiceA, undefined, { numeric: true });
    });
    
    invoicesTable.innerHTML = sorted.map(sale => {
        const status = sale.cancelled ? 'ملغاة' : 'نشطة';
        const statusClass = sale.cancelled ? 'cancelled' : 'active';
        
        return `
        <tr class="${sale.cancelled ? 'cancelled-row' : ''}">
            <td>${sale.invoiceNumber}</td>
            <td>${sale.date}</td>
            <td>${sale.customer}</td>
            <td>${formatCurrency(sale.amount)}</td>
            <td>${sale.paymentMethod}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td>
                <button class="action-btn view-btn" onclick="viewInvoice('${sale.invoiceNumber}')">عرض</button>
                ${!sale.cancelled && !sale.returned ? `
                <button class="action-btn return-btn" onclick="returnInvoice('${sale.invoiceNumber}')">إرجاع</button>
                ` : ''}
            </td>
        </tr>
        `;
    }).join('');
}

// ===== نظام Pagination للمنتجات =====

// متغيرات pagination للمنتجات
let productsCurrentPage = 1;
let productsPageSize = 25;
let productsSearchTerm = '';

// تحميل المنتجات مع pagination
function loadProducts() {
    // إعداد pagination للمنتجات عند التحميل الأول
    setupProductsPagination();
    
    // عرض المنتجات
    renderProductsTable();
}

// إعداد pagination للمنتجات
function setupProductsPagination() {
    // تحميل حالة pagination من sessionStorage
    loadProductsPaginationState();
    
    // إعداد event listeners
    setupProductsPaginationEvents();
}

// تحميل حالة pagination من sessionStorage
function loadProductsPaginationState() {
    try {
        const saved = sessionStorage.getItem('productsPaginationState');
        if (saved) {
            const state = JSON.parse(saved);
            productsCurrentPage = state.page || 1;
            productsPageSize = state.pageSize || 25;
            productsSearchTerm = state.searchTerm || '';
        }
    } catch (e) {
        console.warn('Error loading products pagination state:', e);
    }
}

// حفظ حالة pagination في sessionStorage
function saveProductsPaginationState() {
    try {
        const state = {
            page: productsCurrentPage,
            pageSize: productsPageSize,
            searchTerm: productsSearchTerm
        };
        sessionStorage.setItem('productsPaginationState', JSON.stringify(state));
    } catch (e) {
        console.warn('Error saving products pagination state:', e);
    }
}

// إعداد event listeners للـ pagination
function setupProductsPaginationEvents() {
    // أزرار التنقل
    document.getElementById('productsFirstPage')?.addEventListener('click', () => goToProductsPage(1));
    document.getElementById('productsPrevPage')?.addEventListener('click', () => goToProductsPage(productsCurrentPage - 1));
    document.getElementById('productsNextPage')?.addEventListener('click', () => goToProductsPage(productsCurrentPage + 1));
    document.getElementById('productsLastPage')?.addEventListener('click', () => {
        const totalPages = getProductsTotalPages();
        goToProductsPage(totalPages);
    });
    
    // تعيين القيمة المحفوظة لحجم الصفحة
    const pageSizeSelect = document.getElementById('productsPageSize');
    if (pageSizeSelect && productsPageSize) {
        if (productsPageSize >= 999999) {
            pageSizeSelect.value = 'all';
        } else {
            pageSizeSelect.value = String(productsPageSize);
        }
    }
    
    // تغيير حجم الصفحة
    document.getElementById('productsPageSize')?.addEventListener('change', function() {
        if (this.value === 'all') {
            productsPageSize = 999999; // رقم كبير لعرض جميع المنتجات
        } else {
            productsPageSize = parseInt(this.value);
        }
        productsCurrentPage = 1;
        saveProductsPaginationState();
        renderProductsTable();
    });
    
    // البحث في المنتجات
    const productsSearch = document.getElementById('productsSearch');
    if (productsSearch) {
        productsSearch.value = productsSearchTerm;
        productsSearch.oninput = null;
        productsSearch.addEventListener('input', function() {
            productsSearchTerm = this.value.trim().toLowerCase();
            productsCurrentPage = 1;
            saveProductsPaginationState();
            renderProductsTable();
        });
    }
    
    // إضافة دعم لوحة المفاتيح للتنقل بين الصفحات (عند التركيز على جدول المنتجات)
    const productsTable = document.getElementById('productsTable');
    if (productsTable) {
        productsTable.parentElement?.addEventListener('keydown', function(e) {
            const totalPages = getProductsTotalPages();
            
            // السهم الأيمن = الصفحة السابقة (RTL)
            if (e.key === 'ArrowRight' && productsCurrentPage > 1) {
                e.preventDefault();
                goToProductsPage(productsCurrentPage - 1);
            }
            // السهم الأيسر = الصفحة التالية (RTL)
            else if (e.key === 'ArrowLeft' && productsCurrentPage < totalPages) {
                e.preventDefault();
                goToProductsPage(productsCurrentPage + 1);
            }
            // Home = الصفحة الأولى
            else if (e.key === 'Home') {
                e.preventDefault();
                goToProductsPage(1);
            }
            // End = الصفحة الأخيرة
            else if (e.key === 'End') {
                e.preventDefault();
                goToProductsPage(totalPages);
            }
        });
    }
}

// الحصول على المنتجات المفلترة
function getFilteredProducts() {
    if (!productsSearchTerm) {
        return products;
    }
    
    return products.filter(product => {
        const searchableText = [
            product.name,
            product.category,
            product.barcode || '',
            product.supplier || '',
            String(product.priceUSD),
            String(product.priceLBP),
            String(product.stock)
        ].join(' ').toLowerCase();
        
        return searchableText.includes(productsSearchTerm);
    });
}

// الحصول على عدد الصفحات الإجمالي
function getProductsTotalPages() {
    const filteredProducts = getFilteredProducts();
    return Math.max(1, Math.ceil(filteredProducts.length / productsPageSize));
}

// الانتقال إلى صفحة معينة
function goToProductsPage(page) {
    const totalPages = getProductsTotalPages();
    if (page < 1 || page > totalPages) return;
    
    productsCurrentPage = page;
    saveProductsPaginationState();
    renderProductsTable();
    
    // التمرير السلس إلى أعلى الجدول
    const productsTable = document.getElementById('productsTable');
    if (productsTable) {
        productsTable.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// عرض المنتجات في الجدول
function renderProductsTable() {
    const tbody = document.getElementById('productsTable');
    tbody.innerHTML = '';
    
    const filteredProducts = getFilteredProducts();
    const totalPages = getProductsTotalPages();
    
    // التأكد من أن الصفحة الحالية صحيحة
    if (productsCurrentPage > totalPages) {
        productsCurrentPage = Math.max(1, totalPages);
    }
    
    // حساب الفهارس
    const start = (productsCurrentPage - 1) * productsPageSize;
    const end = Math.min(start + productsPageSize, filteredProducts.length);
    const pageProducts = filteredProducts.slice(start, end);
    
    // عرض المنتجات
    pageProducts.forEach(product => {
        const row = document.createElement('tr');
        const isLowStock = product.stock <= product.minStock;
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.barcode || getText('not_specified')}</td>
            <td>${product.supplier || getText('not_specified')}</td>
            <td>${formatCurrency(product.priceUSD)}</td>
            <td>${formatCurrency(product.costUSD || 0)}</td>
            <td>${formatCurrency(product.priceLBP, 'LBP')}</td>
            <td ${isLowStock ? 'style="color: red; font-weight: bold;"' : ''}>${product.stock}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editProduct(${product.id})"><i class="fas fa-edit"></i> ${getText('edit')}</button>
                <button class="action-btn print-barcode-btn" onclick="openPrintBarcode(${product.id})"><i class="fas fa-barcode"></i> ${getText('print-barcode')}</button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${product.id})"><i class="fas fa-trash"></i> ${getText('delete')}</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // تحديث واجهة pagination
    updateProductsPaginationUI();
}

// تحديث واجهة pagination
function updateProductsPaginationUI() {
    const filteredProducts = getFilteredProducts();
    const totalPages = getProductsTotalPages();
    
    const start = (productsCurrentPage - 1) * productsPageSize + 1;
    const end = Math.min(start + productsPageSize - 1, filteredProducts.length);
    
    // تحديث رقم الصفحة الحالية
    const currentPageSpan = document.getElementById('productsCurrentPage');
    if (currentPageSpan) {
        currentPageSpan.textContent = `${productsCurrentPage} / ${totalPages}`;
    }
    
    // تحديث معلومات الصفحة
    const pageInfo = document.getElementById('productsPageInfo');
    if (pageInfo) {
        if (filteredProducts.length === 0) {
            pageInfo.textContent = getText('pagination-no-items');
        } else {
            pageInfo.textContent = `${getText('pagination-showing')} ${start}-${end} ${getText('pagination-of')} ${filteredProducts.length}`;
        }
    }
    
    // تحديث حالة الأزرار
    const firstBtn = document.getElementById('productsFirstPage');
    const prevBtn = document.getElementById('productsPrevPage');
    const nextBtn = document.getElementById('productsNextPage');
    const lastBtn = document.getElementById('productsLastPage');
    
    if (firstBtn) {
        firstBtn.disabled = productsCurrentPage === 1;
        firstBtn.title = getText('pagination-first');
    }
    if (prevBtn) {
        prevBtn.disabled = productsCurrentPage === 1;
        prevBtn.title = getText('pagination-previous');
    }
    if (nextBtn) {
        nextBtn.disabled = productsCurrentPage === totalPages;
        nextBtn.title = getText('pagination-next');
    }
    if (lastBtn) {
        lastBtn.disabled = productsCurrentPage === totalPages;
        lastBtn.title = getText('pagination-last');
    }
    
    // تحديث أنماط الأزرار المعطلة
    [firstBtn, prevBtn, nextBtn, lastBtn].forEach(btn => {
        if (btn) {
            if (btn.disabled) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        }
    });
    
    // تحديث ترجمة التسميات
    const pageSizeLabel = document.getElementById('productsPageSizeLabel');
    if (pageSizeLabel) {
        pageSizeLabel.textContent = getText('pagination-items-per-page');
    }
    
    // تحديث خيار "الكل" في قائمة حجم الصفحة
    const allOption = document.querySelector('#productsPageSize option[value="all"]');
    if (allOption) {
        allOption.textContent = getText('pagination-all');
    }
}

// وظيفة البحث في المنتجات (للتوافق مع الكود القديم)
function handleProductsSearch() {
    const term = this.value.trim().toLowerCase();
    filterProductsTable(term);
}

// تصفية جدول المنتجات (تم تحديثها للعمل مع pagination)
function filterProductsTable(term) {
    productsSearchTerm = term;
    productsCurrentPage = 1;
    saveProductsPaginationState();
    renderProductsTable();
}

// إضافة منتج جديد
document.getElementById('addProductBtn').addEventListener('click', function() {
    try { translateAddProductModal(); } catch(_) {}
    showModal('addProductModal');
    // تأكد من تشغيل الحساب التلقائي عند فتح النموذج
    setTimeout(() => {
        setupPriceCalculations();
        console.log('تم إعداد الحساب التلقائي للأسعار');
    }, 300);
});

// وظيفة إنشاء باركود تلقائي
function generateBarcode() {
    // إنشاء باركود عشوائي من 13 رقم
    const barcode = Math.floor(1000000000000 + Math.random() * 9000000000000);
    
    // وضع الباركود في الحقل
    const barcodeInput = document.getElementById('productBarcode');
    if (barcodeInput) {
        barcodeInput.value = barcode.toString();
        
        // إضافة تأثير بصري
        barcodeInput.style.backgroundColor = '#d4edda';
        barcodeInput.style.borderColor = '#28a745';
        
        // إزالة التأثير بعد ثانيتين
        setTimeout(() => {
            barcodeInput.style.backgroundColor = '';
            barcodeInput.style.borderColor = '';
        }, 2000);
        
        // إظهار رسالة نجاح
        showMessage('تم إنشاء باركود تلقائي بنجاح!', 'success');
    }
}

// فتح نافذة طباعة الباركود
function openPrintBarcode(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showMessage('المنتج غير موجود', 'error');
        return;
    }
    
    // ملء معلومات المنتج
    document.getElementById('barcodeProductName').textContent = product.name;
    document.getElementById('barcodeNumber').textContent = product.barcode || 'غير محدد';
    
    // إنشاء معاينة الباركود
    updateBarcodePreview();
    
    // إضافة event listeners
    document.getElementById('barcodeSize').addEventListener('change', updateBarcodePreview);
    
    // إظهار النافذة
    showModal('printBarcodeModal');
}

// تحديث معاينة الباركود
function updateBarcodePreview() {
    const barcodeNumber = document.getElementById('barcodeNumber').textContent;
    const size = document.getElementById('barcodeSize').value;
    const preview = document.getElementById('barcodePreview');
    
    if (barcodeNumber && barcodeNumber !== 'غير محدد') {
        // إنشاء عنصر SVG للباركود
        const svgId = 'barcode-svg-' + Date.now();
        preview.innerHTML = `
            <div class="barcode-container">
                <div style="font-size: 14px; margin-bottom: 10px; font-weight: bold;">${document.getElementById('barcodeProductName').textContent}</div>
                <svg id="${svgId}" class="barcode-svg"></svg>
                <div style="font-size: 12px; margin-top: 10px; color: #666;">${barcodeNumber}</div>
            </div>
        `;
        
        // إنشاء الباركود البصري
        try {
            // التأكد من أن الرقم صحيح للـ EAN13
            let validBarcode = barcodeNumber;
            if (validBarcode.length !== 13) {
                // إضافة أصفار في البداية إذا كان الرقم أقصر
                validBarcode = validBarcode.padStart(13, '0');
            }
            
            JsBarcode(`#${svgId}`, validBarcode, {
                format: "EAN13",
                width: size === 'small' ? 1.5 : size === 'large' ? 2.5 : 2,
                height: size === 'small' ? 40 : size === 'large' ? 60 : 50,
                displayValue: true,
                fontSize: size === 'small' ? 10 : size === 'large' ? 14 : 12,
                textMargin: 5,
                background: "#ffffff",
                lineColor: "#000000",
                margin: 10,
                textAlign: "center",
                textPosition: "bottom",
                valid: function(valid) {
                    if (!valid) {
                        console.log('الباركود غير صحيح، سيتم استخدام CODE128');
                    }
                }
            });
        } catch (error) {
            console.error('خطأ في إنشاء الباركود EAN13:', error);
            // محاولة استخدام CODE128 كبديل
            try {
                JsBarcode(`#${svgId}`, barcodeNumber, {
                    format: "CODE128",
                    width: size === 'small' ? 1.5 : size === 'large' ? 2.5 : 2,
                    height: size === 'small' ? 40 : size === 'large' ? 60 : 50,
                    displayValue: true,
                    fontSize: size === 'small' ? 10 : size === 'large' ? 14 : 12,
                    textMargin: 5,
                    background: "#ffffff",
                    lineColor: "#000000",
                    margin: 10,
                    textAlign: "center",
                    textPosition: "bottom"
                });
            } catch (error2) {
                console.error('خطأ في إنشاء الباركود CODE128:', error2);
                preview.innerHTML = `
                    <div class="barcode-container">
                        <div style="font-size: 14px; margin-bottom: 10px; font-weight: bold;">${document.getElementById('barcodeProductName').textContent}</div>
                        <div style="font-family: 'Courier New', monospace; font-weight: bold; letter-spacing: 2px; font-size: 16px;">${barcodeNumber}</div>
                        <div style="font-size: 12px; margin-top: 10px; color: #666;">Barcode (Text Format)</div>
                    </div>
                `;
            }
        }
    } else {
        preview.innerHTML = '<p style="color: #999;">لا يوجد باركود لهذا المنتج</p>';
    }
}

// طباعة الباركود - إصلاح شامل
function printBarcode() {
    console.log('🖨️ بدء طباعة الباركود...');
    
    try {
        const productName = document.getElementById('barcodeProductName').textContent;
        const barcodeNumber = document.getElementById('barcodeNumber').textContent;
        const quantity = parseInt(document.getElementById('printQuantity').value);
        const size = document.getElementById('barcodeSize').value;
        
        if (barcodeNumber === 'غير محدد') {
            showMessage('لا يوجد باركود لهذا المنتج', 'error');
            return;
        }
        
        if (!quantity || quantity < 1) {
            showMessage('يرجى تحديد كمية صحيحة للطباعة', 'error');
            return;
        }
        
        console.log(`📊 تفاصيل الطباعة: ${quantity} × ${productName} (${barcodeNumber})`);
        
        // إنشاء نافذة طباعة محسنة
        const printWindow = window.open('', '_blank', 'width=600,height=800');
        
        if (!printWindow) {
            console.error('❌ فشل في فتح نافذة الطباعة');
            showMessage('فشل في فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة.', 'error');
            return;
        }
        
        const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>طباعة الباركود - ${productName}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    text-align: center;
                }
                .barcode-item {
                    border: 1px solid #000;
                    padding: 15px;
                    margin: 10px;
                    display: inline-block;
                    min-width: 250px;
                    page-break-inside: avoid;
                }
                .product-name {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .barcode-svg {
                    margin: 10px 0;
                }
                .barcode-number {
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    font-size: 12px;
                    color: #333;
                    margin-top: 5px;
                }
                @media print {
                    body { 
                        margin: 0; 
                        padding: 5px;
                    }
                    .barcode-item { 
                        page-break-inside: avoid; 
                        margin: 5px;
                        border: 1px solid #000;
                    }
                }
            </style>
        </head>
        <body>
            ${Array(quantity).fill(0).map((_, index) => `
                <div class="barcode-item">
                    <div class="product-name">${productName}</div>
                    <svg id="barcode-${index}" class="barcode-svg"></svg>
                    <div class="barcode-number">${barcodeNumber}</div>
                </div>
            `).join('')}
            
            <script>
                console.log('🔄 بدء إنشاء الباركودات...');
                
                // إنشاء الباركودات البصرية
                document.addEventListener('DOMContentLoaded', function() {
                    const barcodeWidth = ${size === 'small' ? 1.5 : size === 'large' ? 2.5 : 2};
                    const barcodeHeight = ${size === 'small' ? 40 : size === 'large' ? 60 : 50};
                    const fontSize = ${size === 'small' ? 10 : size === 'large' ? 14 : 12};
                    
                    console.log('📊 معاملات الباركود:', { barcodeWidth, barcodeHeight, fontSize });
                    
                    // التأكد من أن الرقم صحيح للـ EAN13
                    let validBarcode = '${barcodeNumber}';
                    if (validBarcode.length !== 13) {
                        validBarcode = validBarcode.padStart(13, '0');
                    }
                    
                    let successCount = 0;
                    let errorCount = 0;
                    
                    for (let i = 0; i < ${quantity}; i++) {
                        try {
                            JsBarcode('#barcode-' + i, validBarcode, {
                                format: "EAN13",
                                width: barcodeWidth,
                                height: barcodeHeight,
                                displayValue: true,
                                fontSize: fontSize,
                                textMargin: 8,
                                background: "#ffffff",
                                lineColor: "#000000",
                                margin: 20,
                                textAlign: "center",
                                textPosition: "bottom"
                            });
                            successCount++;
                        } catch (error) {
                            console.error('خطأ في إنشاء الباركود EAN13:', error);
                            // محاولة استخدام CODE128 كبديل
                            try {
                                JsBarcode('#barcode-' + i, '${barcodeNumber}', {
                                    format: "CODE128",
                                    width: barcodeWidth,
                                    height: barcodeHeight,
                                    displayValue: true,
                                    fontSize: fontSize,
                                    textMargin: 5,
                                    background: "#ffffff",
                                    lineColor: "#000000",
                                    margin: 10,
                                    textAlign: "center",
                                    textPosition: "bottom"
                                });
                                successCount++;
                            } catch (error2) {
                                console.error('خطأ في إنشاء الباركود CODE128:', error2);
                                errorCount++;
                            }
                        }
                    }
                    
                    console.log(\`✅ تم إنشاء \${successCount} باركود، \${errorCount} أخطاء\`);
                    
                    // طباعة تلقائية
                    setTimeout(() => {
                        try {
                            window.focus();
                            window.print();
                            
                            // إغلاق النافذة بعد الطباعة
                            setTimeout(() => {
                                window.close();
                                console.log('✅ تم إغلاق نافذة الطباعة');
                            }, 1000);
                        } catch (printError) {
                            console.error('❌ خطأ في الطباعة:', printError);
                            window.close();
                        }
                    }, 1000);
                });
            </script>
        </body>
        </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // معالجة الأخطاء
        printWindow.onerror = function(error) {
            console.error('❌ خطأ في نافذة الطباعة:', error);
            showMessage('خطأ في نافذة الطباعة', 'error');
            printWindow.close();
        };
        
        showMessage(`تم بدء طباعة ${quantity} باركود!`, 'success');
        closePrintBarcode();
        
    } catch (error) {
        console.error('❌ خطأ عام في طباعة الباركود:', error);
        showMessage('خطأ في طباعة الباركود: ' + error.message, 'error');
    }
}

// إغلاق نافذة طباعة الباركود
function closePrintBarcode() {
    hideModal('printBarcodeModal');
}

// تم نقل معالج النموذج إلى الأسفل مع الحساب التلقائي

function editProduct(id) {
    const lang = document.documentElement.lang || 'ar';
    const product = products.find(p => p.id === id);
    if (!product) {
        showMessage(lang === 'en' ? 'Product not found' : 'المنتج غير موجود', 'error');
        return;
    }
    
    // طلب كلمة المرور لتعديل المنتج
    const password = prompt(lang === 'en' ? '🔒 Enter security code to edit product (12345):' : '🔒 أدخل رمز الأمان لتعديل المنتج (12345):');
    if (password !== '12345') {
        showNotification(lang === 'en' ? '❌ Incorrect code! Cannot edit product.' : '❌ كلمة المرور خاطئة! لا يمكن تعديل المنتج.', 'error', 3000);
        return;
    }
    
    // ملء النموذج ببيانات المنتج الحالية
    const editProductName = document.getElementById('editProductName');
    const editProductCategory = document.getElementById('editProductCategory');
    const editProductPriceUSD = document.getElementById('editProductPriceUSD');
    const editProductPriceLBP = document.getElementById('editProductPriceLBP');
    const editProductCostUSD = document.getElementById('editProductCostUSD');
    const editProductQuantity = document.getElementById('editProductQuantity');
    const editProductBarcode = document.getElementById('editProductBarcode');
    const editProductSupplier = document.getElementById('editProductSupplier');
    
    if (editProductName) editProductName.value = product.name;
    if (editProductCategory) editProductCategory.value = product.category;
    if (editProductPriceUSD) editProductPriceUSD.value = product.priceUSD;
    if (editProductPriceLBP) editProductPriceLBP.value = product.priceLBP;
    if (editProductCostUSD) editProductCostUSD.value = product.costUSD || 0;
    if (editProductQuantity) editProductQuantity.value = product.stock;
    if (editProductBarcode) editProductBarcode.value = product.barcode || '';
    
    // تحديث قائمة الموردين
    updateSuppliersDropdown('editProductSupplier');
    if (editProductSupplier) editProductSupplier.value = product.supplier || '';
    
    // تخزين معرف المنتج الذي يتم تعديله
    document.getElementById('editProductForm').dataset.editId = id;
    try { translateEditProductModal(); } catch(e) {}
    
    showModal('editProductModal');
    
    // التأكد من إعداد معالجات الأحداث للميزة الجديدة
    setTimeout(() => {
        initializeAddQuantityFeature();
        initializeAddQuantityInputHandlers();
        initializeAddQuantityFormHandler();
    }, 100);
}

// إضافة كمية جديدة للمنتج - معالج الزر
function initializeAddQuantityFeature() {
    const addQuantityBtn = document.getElementById('addQuantityBtn');
    if (addQuantityBtn && !addQuantityBtn.hasAddQuantityListener) {
        addQuantityBtn.addEventListener('click', function() {
            const editForm = document.getElementById('editProductForm');
            const editId = parseInt(editForm.dataset.editId);
            
            if (!editId) {
                const lang = document.documentElement.lang || 'en';
                const message = lang === 'en' ? 'Error: Product ID not found' : 'خطأ: لم يتم العثور على معرف المنتج';
                showMessage(message, 'error');
                return;
            }
            
            const product = products.find(p => p.id === editId);
            if (!product) {
                const lang = document.documentElement.lang || 'en';
                const message = lang === 'en' ? 'Error: Product not found' : 'خطأ: المنتج غير موجود';
                showMessage(message, 'error');
                return;
            }
            
            // تخزين معرف المنتج في النموذج الجديد
            document.getElementById('addQuantityForm').dataset.productId = editId;
            
            // تعبئة البيانات الحالية
            document.getElementById('newQuantity').value = '';
            document.getElementById('newCostPerUnit').value = '';
            
            // حساب وعرض التفاصيل
            updateQuantityCalculation();
            
            // تطبيق الترجمة على النافذة الجديدة
            setTimeout(() => {
                try {
                    // تطبيق الترجمة على النافذة باستخدام نظام الترجمة الموجود
                    const currentLang = document.documentElement.lang || 'en';
                    const addQuantityModal = document.getElementById('addQuantityModal');
                    if (addQuantityModal && typeof translateUI === 'function') {
                        translateUI(currentLang);
                    }
                } catch(e) {
                    console.log('Translation applied to add quantity modal');
                }
            }, 50);
            
            showModal('addQuantityModal');
        });
        addQuantityBtn.hasAddQuantityListener = true;
    }
}

// استدعاء عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeAddQuantityFeature);

// تحديث حساب الكلفة الجديدة
function updateQuantityCalculation() {
    const editForm = document.getElementById('editProductForm');
    const editId = parseInt(editForm.dataset.editId);
    const product = products.find(p => p.id === editId);
    
    if (!product) return;
    
    const newQuantity = parseFloat(document.getElementById('newQuantity').value) || 0;
    const newCostPerUnit = parseFloat(document.getElementById('newCostPerUnit').value) || 0;
    
    const currentQuantity = product.stock || 0;
    const currentCost = product.costUSD || 0;
    
    const detailsContainer = document.getElementById('costCalculationDetails');
    
    if (newQuantity > 0 && newCostPerUnit > 0) {
        // حساب الكلفة الجديدة بناء على المتوسط المرجح
        const totalOldValue = currentQuantity * currentCost;
        const totalNewValue = newQuantity * newCostPerUnit;
        const newTotalQuantity = currentQuantity + newQuantity;
        const newAverageCost = (totalOldValue + totalNewValue) / newTotalQuantity;
        
        const lang = document.documentElement.lang || 'en';
        
        if (lang === 'en') {
            detailsContainer.innerHTML = `
                <div style="font-size: 14px; line-height: 1.6;">
                    <div><strong>Current Quantity:</strong> ${currentQuantity} × $${currentCost.toFixed(2)} = $${totalOldValue.toFixed(2)}</div>
                    <div><strong>New Quantity:</strong> ${newQuantity} × $${newCostPerUnit.toFixed(2)} = $${totalNewValue.toFixed(2)}</div>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
                        <div><strong>New Total Quantity:</strong> ${newTotalQuantity}</div>
                        <div style="color: #28a745; font-weight: bold;"><strong>New Cost Per Unit:</strong> $${newAverageCost.toFixed(2)}</div>
                    </div>
                </div>
            `;
        } else {
            detailsContainer.innerHTML = `
                <div style="font-size: 14px; line-height: 1.6;">
                    <div><strong>الكمية الحالية:</strong> ${currentQuantity} × $${currentCost.toFixed(2)} = $${totalOldValue.toFixed(2)}</div>
                    <div><strong>الكمية الجديدة:</strong> ${newQuantity} × $${newCostPerUnit.toFixed(2)} = $${totalNewValue.toFixed(2)}</div>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
                        <div><strong>الكمية الإجمالية الجديدة:</strong> ${newTotalQuantity}</div>
                        <div style="color: #28a745; font-weight: bold;"><strong>الكلفة الجديدة للوحدة:</strong> $${newAverageCost.toFixed(2)}</div>
                    </div>
                </div>
            `;
        }
    } else {
        const lang = document.documentElement.lang || 'en';
        const placeholder = lang === 'en' 
            ? 'Enter new quantity and cost to display calculation'
            : 'أدخل الكمية والكلفة الجديدة لعرض الحساب';
        detailsContainer.innerHTML = `<div style="color: #666;">${placeholder}</div>`;
    }
}

// إضافة معالجات الأحداث للحقول
function initializeAddQuantityInputHandlers() {
    const newQuantityInput = document.getElementById('newQuantity');
    const newCostInput = document.getElementById('newCostPerUnit');
    
    if (newQuantityInput && !newQuantityInput.hasInputListener) {
        newQuantityInput.addEventListener('input', updateQuantityCalculation);
        newQuantityInput.hasInputListener = true;
    }
    
    if (newCostInput && !newCostInput.hasInputListener) {
        newCostInput.addEventListener('input', updateQuantityCalculation);
        newCostInput.hasInputListener = true;
    }
}

document.addEventListener('DOMContentLoaded', initializeAddQuantityInputHandlers);

// معالج حفظ الكمية الجديدة
function initializeAddQuantityFormHandler() {
    const addQuantityForm = document.getElementById('addQuantityForm');
    if (addQuantityForm && !addQuantityForm.hasFormListener) {
        addQuantityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const productId = parseInt(this.dataset.productId);
            const product = products.find(p => p.id === productId);
            
            if (!product) {
                const lang = document.documentElement.lang || 'en';
                const message = lang === 'en' ? 'Error: Product not found' : 'خطأ: المنتج غير موجود';
                showMessage(message, 'error');
                return;
            }
            
            const newQuantity = parseInt(document.getElementById('newQuantity').value);
            const newCostPerUnit = parseFloat(document.getElementById('newCostPerUnit').value);
            
            if (newQuantity <= 0 || newCostPerUnit <= 0) {
                const lang = document.documentElement.lang || 'en';
                const message = lang === 'en' ? 'Please enter valid values for quantity and cost' : 'يرجى إدخال قيم صحيحة للكمية والكلفة';
                showMessage(message, 'error');
                return;
            }
            
            // الحصول على القيم الحالية
            const currentQuantity = product.stock || 0;
            const currentCost = product.costUSD || 0;
            
            // حساب الكلفة الجديدة (المتوسط المرجح)
            const totalOldValue = currentQuantity * currentCost;
            const totalNewValue = newQuantity * newCostPerUnit;
            const newTotalQuantity = currentQuantity + newQuantity;
            const newAverageCost = (totalOldValue + totalNewValue) / newTotalQuantity;
            
            // تحديث بيانات المنتج
            const productIndex = products.findIndex(p => p.id === productId);
            if (productIndex !== -1) {
                products[productIndex] = {
                    ...products[productIndex],
                    stock: newTotalQuantity,
                    costUSD: newAverageCost
                };
                
                // حفظ التغييرات
                saveToStorage('products', products);
                
                // تحديث النماذج المفتوحة
                const editProductQuantity = document.getElementById('editProductQuantity');
                const editProductCostUSD = document.getElementById('editProductCostUSD');
                
                if (editProductQuantity) editProductQuantity.value = newTotalQuantity;
                if (editProductCostUSD) editProductCostUSD.value = newAverageCost.toFixed(2);
                
                // تسجيل النفقة وتحديث الصندوق
                const totalExpense = newQuantity * newCostPerUnit;
                
                // تسجيل النفقة في المعاملات
                const expenseRecorded = recordProductSupplyExpense(product.name, newQuantity, newCostPerUnit, 'USD');
                
                // تحديث رصيد الصندوق ليعكس النفقة الجديدة
                if (expenseRecorded) {
                    try {
                        const cashDrawer = loadFromStorage('cashDrawer', {});
                        // تقليل الرصيد في الصندوق بالقيمة المدفوعة
                        if (cashDrawer.cashUSD !== undefined) {
                            cashDrawer.cashUSD = (cashDrawer.cashUSD || 0) - totalExpense;
                            cashDrawer.lastUpdate = new Date().toISOString();
                            saveToStorage('cashDrawer', cashDrawer);
                            
                            console.log(`💰 تم تحديث الصندوق: -$${totalExpense.toFixed(2)} (توريد منتج)`);
                            
                            // تحديث عرض الصندوق إذا كان مفتوحاً
                            if (typeof updateCashDrawerDisplay === 'function') {
                                updateCashDrawerDisplay();
                            }
                        }
                    } catch (error) {
                        console.warn('خطأ في تحديث رصيد الصندوق:', error);
                    }
                }
                
                // إغلاق النافذة
                hideModal('addQuantityModal');
                
                // تحديث العروض
                loadProducts();
                updatePOSIfActive();
                updateDashboardIfActive();
                
                // تحديث تنبيهات المخزون
                if (typeof updateStockAlertsDashboard === 'function') {
                    updateStockAlertsDashboard();
                }
                
                const lang = document.documentElement.lang || 'en';
                const successMessage = lang === 'en' 
                    ? `Successfully added ${newQuantity} units. New cost: $${newAverageCost.toFixed(2)} and expense: $${totalExpense.toFixed(2)}`
                    : `تم إضافة ${newQuantity} وحدة بنجاح. الكلفة الجديدة: $${newAverageCost.toFixed(2)} والنفقة: $${totalExpense.toFixed(2)}`;
                showMessage(successMessage, 'success');
            }
        });
        addQuantityForm.hasFormListener = true;
    }
}

document.addEventListener('DOMContentLoaded', initializeAddQuantityFormHandler);

// معالج تعديل المنتج
document.getElementById('editProductForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const editId = parseInt(this.dataset.editId);
    const productIndex = products.findIndex(p => p.id === editId);
    
    if (productIndex === -1) {
        const lang = document.documentElement.lang || 'ar';
        showMessage(lang === 'en' ? 'Error finding product' : 'خطأ في العثور على المنتج', 'error');
        return;
    }
    
    // تحديث بيانات المنتج
    products[productIndex] = {
        ...products[productIndex],
        name: document.getElementById('editProductName').value,
        category: document.getElementById('editProductCategory').value,
        priceUSD: parseFloat(document.getElementById('editProductPriceUSD').value),
        priceLBP: parseFloat(document.getElementById('editProductPriceLBP').value),
        costUSD: parseFloat(document.getElementById('editProductCostUSD').value) || 0,
        stock: parseInt(document.getElementById('editProductQuantity').value),
        barcode: document.getElementById('editProductBarcode').value,
        supplier: document.getElementById('editProductSupplier').value
    };
    
    saveToStorage('products', products);
    loadProducts();
    hideModal('editProductModal');
    
    // تحديث نقطة البيع إذا كانت مفتوحة حالياً
    console.log('🔄 تم حفظ المنتج، محاولة تحديث POS...');
    updatePOSIfActive();
    
    // إشعار جميع النوافذ المفتوحة بتحديث المنتجات
    notifyProductsUpdated();
    
    // تحديث إضافي مباشر لنقطة البيع
    setTimeout(() => {
        console.log('🔄 تحديث إضافي لنقطة البيع...');
        updatePOSIfActive();
    }, 100);
    
    // تحديث إضافي بعد تأخير أطول للتأكد
    setTimeout(() => {
        console.log('🔄 تحديث نهائي لنقطة البيع...');
        updatePOSIfActive();
    }, 500);
    
    // تحديث تنبيهات المخزون
    updateStockAlertsDashboard();
    
    // تحديث لوحة التحكم
    updateDashboardIfActive();
    
    const langDone = document.documentElement.lang || 'ar';
    showMessage(langDone === 'en' ? 'Product updated successfully' : 'تم تحديث المنتج بنجاح');
});


function updateSuppliersDropdown(selectId) {
    const select = document.getElementById(selectId);
    const currentValue = select.value;
    
    select.innerHTML = `<option value="">${(document.documentElement.lang||'ar')==='en' ? 'Select supplier' : 'اختر المورد'}</option>`;
    
    // If this is the edit product supplier field, enhance with a small searchable combo
    if (selectId === 'editProductSupplier') {
        // ensure we don't duplicate the search UI
        const existingSearch = document.getElementById('editProductSupplierSearch');
        const existingList = document.getElementById('editProductSupplierList');
        if (!existingSearch) {
            // create search input above the select
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.id = 'editProductSupplierSearch';
            inp.placeholder = (document.documentElement.lang||'ar') === 'en' ? 'Search supplier...' : 'ابحث عن مورد...';
            inp.style.width = '100%';
            inp.style.boxSizing = 'border-box';
            inp.style.padding = '8px';
            inp.style.marginBottom = '6px';
            select.parentNode.insertBefore(inp, select);

            const list = document.createElement('div');
            list.id = 'editProductSupplierList';
            list.style.maxHeight = '160px';
            list.style.overflow = 'auto';
            list.style.border = '1px solid #e5e7eb';
            list.style.borderRadius = '6px';
            list.style.padding = '6px';
            list.style.marginBottom = '6px';
            list.style.background = '#fff';
            select.parentNode.insertBefore(list, select);

            // render full list initially
            function renderSupplierList(filter) {
                const term = (filter||'').trim().toLowerCase();
                list.innerHTML = '';
                const filtered = suppliers.filter(s => !term || (s.name||'').toLowerCase().includes(term));
                filtered.forEach(s => {
                    const item = document.createElement('div');
                    item.textContent = s.name;
                    item.style.padding = '6px 8px';
                    item.style.cursor = 'pointer';
                    item.style.borderRadius = '4px';
                    item.onmouseover = () => item.style.background = '#f3f4f6';
                    item.onmouseout = () => item.style.background = 'transparent';
                    item.onclick = () => {
                        // set select value and update input
                        const opt = Array.from(select.options).find(o => o.value === s.name);
                        if (opt) select.value = opt.value; else {
                            const newOpt = document.createElement('option'); newOpt.value = s.name; newOpt.textContent = s.name; select.appendChild(newOpt); select.value = s.name;
                        }
                        inp.value = s.name;
                        // collapse list
                        list.innerHTML = '';
                    };
                    list.appendChild(item);
                });
                if (filtered.length === 0) {
                    const none = document.createElement('div'); none.textContent = (document.documentElement.lang||'ar') === 'en' ? 'No suppliers' : 'لا يوجد موردون'; none.style.opacity = '0.7'; none.style.padding = '6px 8px'; list.appendChild(none);
                }
            }

            inp.addEventListener('input', function(){ renderSupplierList(this.value); });
            inp.addEventListener('focus', function(){ renderSupplierList(this.value); });

            // click outside to close
            document.addEventListener('click', function(e){
                if (!e.target.closest('#editProductSupplierList') && !e.target.closest('#editProductSupplierSearch')) {
                    const l = document.getElementById('editProductSupplierList'); if (l) l.innerHTML = '';
                }
            });
        }
    }

    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.name;
        option.textContent = supplier.name;
        select.appendChild(option);
    });

    select.value = currentValue;
}
function deleteProduct(id) {
    const lang = document.documentElement.lang || 'ar';
    const password = prompt(lang === 'en' ? '🔒 Enter security code to delete product (12345):' : '🔒 أدخل رمز الأمان لحذف المنتج (12345):');
    if (password !== '12345') {
        showNotification(lang === 'en' ? '❌ Invalid code! Cannot delete product.' : '❌ رمز غير صحيح! لا يمكن حذف المنتج.', 'error', 3000);
        return;
    }
    if (confirm(getText('confirm-delete-product'))) {
        products = products.filter(p => p.id !== id);
        saveToStorage('products', products);
        loadProducts();
        
        // تحديث تنبيهات المخزون
        updateStockAlertsDashboard();
        
        // تحديث لوحة التحكم
        updateDashboardIfActive();
        
        showMessage(lang === 'en' ? 'Product deleted' : 'تم حذف المنتج');
    }
}

// تحميل المبيعات
 function loadSales() {
   const tbody = document.getElementById('salesTable');
   tbody.innerHTML = '';
   // ترتيب تنازلي بحسب التاريخ والوقت - الأحدث أولاً
   const sorted = [...sales].sort((a, b) => {
        // استخدام timestamp إذا كان متوفراً، وإلا fallback إلى date
        let timestampA = a.timestamp || a.date || 0;
        let timestampB = b.timestamp || b.date || 0;
        
        // تحسين parsing التواريخ لضمان الترتيب الصحيح
        let da, db;
        
        if (timestampA && timestampA.includes && timestampA.includes('T')) {
            // timestamp محلي
            if (timestampA.includes('Z') || timestampA.includes('+') || timestampA.includes('-', 10)) {
                da = new Date(timestampA);
            } else {
                // timestamp محلي بدون timezone - parse يدوياً
                const parts = timestampA.split('T');
                if (parts.length === 2) {
                    const [datePart, timePart] = parts;
                    const [year, month, day] = datePart.split('-').map(Number);
                    const timeWithMs = timePart.includes('.') ? timePart : timePart + '.000';
                    const [timeOnly, ms] = timeWithMs.split('.');
                    const [hours, minutes, seconds] = timeOnly.split(':').map(Number);
                    da = new Date(year, month - 1, day, hours, minutes, seconds, Number(ms.padEnd(3, '0')));
                } else {
                    da = new Date(timestampA);
                }
            }
        } else {
            // date فقط
            da = new Date(timestampA);
        }
        
        if (timestampB && timestampB.includes && timestampB.includes('T')) {
            // timestamp محلي
            if (timestampB.includes('Z') || timestampB.includes('+') || timestampB.includes('-', 10)) {
                db = new Date(timestampB);
            } else {
                // timestamp محلي بدون timezone - parse يدوياً
                const parts = timestampB.split('T');
                if (parts.length === 2) {
                    const [datePart, timePart] = parts;
                    const [year, month, day] = datePart.split('-').map(Number);
                    const timeWithMs = timePart.includes('.') ? timePart : timePart + '.000';
                    const [timeOnly, ms] = timeWithMs.split('.');
                    const [hours, minutes, seconds] = timeOnly.split(':').map(Number);
                    db = new Date(year, month - 1, day, hours, minutes, seconds, Number(ms.padEnd(3, '0')));
                } else {
                    db = new Date(timestampB);
                }
            }
        } else {
            // date فقط
            db = new Date(timestampB);
        }
        
        // التحقق من صحة التواريخ
        if (isNaN(da.getTime())) da = new Date(0);
        if (isNaN(db.getTime())) db = new Date(0);
        
        // ترتيب تنازلي - الأحدث أولاً حسب الوقت
        const timeDiff = db.getTime() - da.getTime();
        if (timeDiff !== 0) return timeDiff;
        
        // في حالة تساوي الوقت، ترتيب حسب رقم الفاتورة (الأحدث أولاً)
        const invoiceA = a.invoiceNumber || '';
        const invoiceB = b.invoiceNumber || '';
        return invoiceB.localeCompare(invoiceA, undefined, { numeric: true });
    });
   // تهيئة ترقيم الصفحات
   const lsKey = 'sales.pageSize';
   let pageSize = parseInt(localStorage.getItem(lsKey)) || 15;
   const validSizes = [15, 25, 50, 100];
   if (!validSizes.includes(pageSize)) pageSize = 15;
   const total = sorted.length;
   const totalPages = Math.max(1, Math.ceil(total / pageSize));
   // استرجاع الصفحة الحالية من storage المؤقت
   let currentPage = parseInt(sessionStorage.getItem('sales.currentPage')) || 1;
   currentPage = Math.max(1, Math.min(totalPages, currentPage));
   const startIdx = (currentPage - 1) * pageSize;
   const pageItems = sorted.slice(startIdx, startIdx + pageSize);

   pageItems.forEach(sale => {
        // تحديد حالة المبيعة
        let statusClass = 'status-completed';
        let statusText = 'مكتملة';
        
        if (sale.returned) {
            if (sale.returnType === 'full') {
                statusClass = 'status-returned';
                statusText = 'مرجعة كاملة';
            } else if (sale.returnType === 'partial') {
                statusClass = 'status-partial-return';
                statusText = 'مرجعة جزئياً';
            }
        }
        
        const row = document.createElement('tr');
        // تحديد اسم العميل للعرض مع سلسلة بدائل لحالات الحفظ المختلفة
        const customerFromField = (sale.customer && String(sale.customer).trim().length > 0) ? sale.customer : null;
        const customerFromName = (sale.customerName && String(sale.customerName).trim().length > 0) ? sale.customerName : null;
        const customerFromPartial = (sale.partialDetails && sale.partialDetails.customerName && String(sale.partialDetails.customerName).trim().length > 0) ? sale.partialDetails.customerName : null;
        let customerLookupName = null;
        try {
            const cid = sale.customerId || (sale.partialDetails && sale.partialDetails.customerId);
            if (cid) {
                const cObj = customers.find(cc => cc.id === cid);
                if (cObj) customerLookupName = cObj.name;
            }
        } catch(e) { /* ignore lookup errors */ }
        // Default label for cash/no-customer invoices
        const defaultCashLabel = getText('regular-customer') || ((document.documentElement.lang === 'en') ? 'Regular Customer' : 'عميل عادي');
        const customerDisplay = customerFromField || customerFromName || customerFromPartial || customerLookupName || defaultCashLabel;
        // إنشاء نص الخصومات المرتبة
        let discountSummary = '';
        if (sale.items && sale.items.length) {
            const discounted = sale.items.filter(i => (i.originalPriceUSD != null && i.finalPriceUSD != null && i.finalPriceUSD < i.originalPriceUSD));
            if (discounted.length) {
                discountSummary = discounted.map(i => `${i.name}: ${i.discountPct}%`).join('، ');
            } else {
                discountSummary = '—';
            }
        }
        row.innerHTML = `
            <td>${sale.invoiceNumber}</td>
            <td>${formatDateTime(sale.timestamp || sale.date, sale.paymentMethod)}</td>
            <td>${customerDisplay}</td>
            <td>${formatCurrency(sale.amount)}</td>
            <td>${sale.paymentMethod}</td>
            <td>${discountSummary}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="action-btn view-btn" onclick="viewSale('${sale.id}')">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button class="action-btn" onclick="printSale('${sale.id}')">
                    <i class="fas fa-print"></i> ${getText('print')}
                </button>
                ${!sale.returned ? 
                    `<button class="action-btn return-btn" onclick="initiateSaleReturn('${sale.id}')">
                        <i class="fas fa-undo"></i> استرجاع
                    </button>` : 
                    `<button class="action-btn" disabled>
                        <i class="fas fa-check"></i> مرجعة
                    </button>`
                }
            </td>
        `;
        
        tbody.appendChild(row);
    });
   // بناء شريط التصفح أسفل الجدول
   buildSalesPager({ total, pageSize, currentPage, totalPages });
   
    // ربط event listener للبحث في المبيعات
    const salesSearch = document.getElementById('salesSearch');
    if (salesSearch) {
        // إزالة جميع event listeners القديمة
        salesSearch.oninput = null;
        // إضافة event listener جديد
        salesSearch.oninput = function() {
            const term = this.value.trim().toLowerCase();
            filterSalesTable(term);
        };
    }
}

// وظيفة البحث في المبيعات
function handleSalesSearch() {
    const term = this.value.trim().toLowerCase();
    filterSalesTable(term);
}

function filterSalesTable(term) {
    const rows = document.querySelectorAll('#salesTable tr');
    rows.forEach(row => {
        // تخطي header row
        if (row.querySelector('th')) {
            return;
        }
        
        // البحث في جميع الخلايا
        const cells = row.querySelectorAll('td');
        let found = false;
        
        cells.forEach(cell => {
            const cellText = cell.textContent.toLowerCase().trim();
            if (cellText.includes(term)) {
                found = true;
            }
        });
        
        // إظهار أو إخفاء الصف
        row.style.display = found ? '' : 'none';
    });
}

function viewSale(idOrNumber) {
    const key = String(idOrNumber);
    const sale = sales.find(s => String(s.id) === key || String(s.invoiceNumber) === key);
    if (sale) {
        showInvoice(sale);
    } else {
        showMessage('لم يتم العثور على الفاتورة', 'error');
    }
}

function printSale(idOrNumber) {
    const key = String(idOrNumber);
    const sale = sales.find(s => String(s.id) === key || String(s.invoiceNumber) === key);
    if (!sale) { showMessage('لم يتم العثور على الفاتورة', 'error'); return; }
    showInvoice(sale);
    // defer to ensure modal content rendered
    setTimeout(() => {
        const btn = document.getElementById('printInvoiceBtn');
        if (btn) btn.click();
    }, 50);
}
function showInvoice(sale) {
    const invoiceContent = document.getElementById('invoiceContent');
    const lang = document.documentElement.lang || 'ar';
    const t = lang === 'en' ? {
        invoice: 'Invoice',
        invoice_no: 'Invoice #',
        date: 'Date',
        customer: 'Customer',
        payment_method: 'Payment',
        item: 'Item',
        qty: 'Qty',
        price: 'Price',
        total: 'Total',
        subtotal: 'Subtotal',
        tax: 'Tax',
        grand_total: 'Grand Total',
        cash_details: 'Cash Details',
        paid: 'Paid',
        change: 'Change',
        none: 'None',
        phone: 'Phone'
    } : {
        invoice: 'فاتورة',
        invoice_no: 'فاتورة رقم',
        date: 'التاريخ',
        customer: 'العميل',
        payment_method: 'طريقة الدفع',
        item: 'المنتج',
        qty: 'الكمية',
        price: 'السعر',
        total: 'المجموع',
        subtotal: 'المجموع الفرعي',
        tax: 'الضريبة',
        grand_total: 'المجموع النهائي',
        cash_details: 'تفاصيل الدفع النقدي',
        paid: 'المبلغ المدفوع',
        change: 'الباقي',
        none: 'لا يوجد',
        phone: 'هاتف'
    };

    // إعادة حساب Subtotal وGrandTotal من عناصر الفاتورة (تعمل مع النقدي والائتمان)
    const itemsList = Array.isArray(sale.items) ? sale.items : [];
    const itemsTotal = itemsList.reduce((sum, item) => {
        const isUSD = Math.abs((item.finalPriceUSD || 0) - (item.price || 0)) < 0.5;
        const itemCurrency = isUSD ? 'USD' : 'LBP';
        const exRate = settings.exchangeRate || 1;
        const finalPrice = itemCurrency === 'USD' ? (item.finalPriceUSD || item.price || 0) : Math.round((item.finalPriceUSD || 0) * exRate);
        return sum + (finalPrice * (item.quantity || 1));
    }, 0);
    const subtotal = itemsTotal;
    const tax = 0;
    
    const exRate = settings.exchangeRate || 1;
    // اسم العميل (يدعم كل من sale.customer و sale.customerName)
    const customerDisplayName = (sale.customer && String(sale.customer).trim().length > 0)
        ? sale.customer
        : (sale.customerName || (function(){
            try { const c = customers.find(cc => cc.id === sale.customerId); return c ? c.name : getText('not_specified'); } catch(e) { return getText('not_specified'); }
          })());
    const isPartial = !!sale.partialDetails;
    const partialPaid = isPartial ? (sale.partialDetails.amountPaid || 0) : 0;
    const partialCurrency = isPartial ? (sale.partialDetails.paymentCurrency || 'USD') : 'USD';
    const subtotalCurrency = 'USD';
    const subtotalDisplay = formatCurrency(subtotal, subtotalCurrency);
    const grandDisplay = formatCurrency(sale.amount, 'USD');
    const paidNowDisplay = isPartial ? formatCurrency(partialPaid, partialCurrency) : '';
    const toAccountUSD = isPartial ? (sale.amount - (partialCurrency === 'USD' ? partialPaid : (partialPaid / (settings.exchangeRate||1)))) : 0;
    const toAccountDisplay = isPartial ? formatCurrency(toAccountUSD, 'USD') : '';
    // ملخص رصيد العميل
    let previousBalance = 0, newBalance = 0;
    try {
        const c = customers.find(cc => cc.id === (sale.customerId || sale.partialDetails?.customerId));
        if (c) {
            const currentBalance = (c.creditBalance || 0);
            if (isPartial) {
                // الرصيد السابق = الرصيد الحالي - المتبقي لهذه الفاتورة
                previousBalance = Math.max(0, currentBalance - (toAccountUSD || 0));
                newBalance = currentBalance;
            } else {
                previousBalance = currentBalance;
                newBalance = currentBalance;
            }
        }
    } catch(e) {}

    const invoiceHTML = `
        <div class="invoice-header">
            <div class="store-info">
                <h2>${settings.storeName || ''}</h2>
                <p>${settings.storeAddress || ''}</p>
                <p>${t.phone}: ${settings.storePhone || ''}</p>
            </div>
            <div class="invoice-info">
                <h3>${t.invoice}: ${sale.invoiceNumber}</h3>
                <p>${t.date}: ${formatDateTime(sale.timestamp || sale.date, sale.paymentMethod)}</p>
                <p>${t.customer}: ${customerDisplayName || '-'}</p>
                <p>${t.payment_method}: ${isPartial ? (lang==='en' ? 'Partial Payment (Credit)' : 'دفع جزئي (دين)') : sale.paymentMethod}</p>
            </div>
        </div>
        
        <table class="invoice-table">
            <thead>
                <tr>
                    <th>${t.item}</th>
                    <th>${t.qty}</th>
                    <th>${t.price}</th>
                    <th>${t.total}</th>
                </tr>
            </thead>
            <tbody>
                ${sale.items ? sale.items.map(item => {
                    // تحديد عملة سعر العنصر في لحظة البيع بمقارنة السعر النهائي بالدولار وسعر الصرف
                    const isUSD = Math.abs((item.finalPriceUSD || 0) - (item.price || 0)) < 0.5;
                    const itemCurrency = isUSD ? 'USD' : 'LBP';
                    const originalPrice = itemCurrency === 'USD' ? (item.originalPriceUSD || item.price) : Math.round((item.originalPriceUSD || 0) * exRate);
                    const finalPrice    = itemCurrency === 'USD' ? (item.finalPriceUSD    || item.price) : Math.round((item.finalPriceUSD    || 0) * exRate);
                    const hasDiscount   = typeof item.discountPct === 'number' && item.discountPct > 0 && finalPrice < originalPrice;
                    
                    const nameCell = hasDiscount
                        ? `${item.name}<br><small style="color:#16a34a;font-weight:700">-${item.discountPct}% → ${formatCurrency(finalPrice, itemCurrency)}</small>`
                        : `${item.name}`;
                    const priceCell = formatCurrency(originalPrice, itemCurrency); // عرض السعر الأساسي فقط
                    const totalCell = formatCurrency(finalPrice * (item.quantity || 1), itemCurrency); // مجموع بعد الخصم
                    
                    return `
                        <tr>
                            <td>${nameCell}</td>
                            <td>${item.quantity}</td>
                            <td>${priceCell}</td>
                            <td>${totalCell}</td>
                        </tr>
                    `;
                }).join('') : ''}
            </tbody>
        </table>
        
        <div class="invoice-summary">
            <div class="summary-row">
                <span>${t.subtotal}:</span>
                <span>${subtotalDisplay}</span>
            </div>
            <div class="summary-row total">
                <span>${t.grand_total}:</span>
                <span>${grandDisplay}</span>
            </div>
            ${isPartial ? `
            <div class="summary-row">
                <span>${lang==='en' ? 'Paid Now' : 'المدفوع الآن'}:</span>
                <span>${paidNowDisplay}</span>
            </div>
            <div class="summary-row">
                <span>${lang==='en' ? 'To Account' : 'المتبقي لهذه الفاتورة'}:</span>
                <span>${toAccountDisplay}</span>
            </div>
            ` : ''}
        </div>

        ${isPartial ? `
        <div class="invoice-cash-details">
            <h5>${lang==='en' ? 'Customer Balance' : 'ملخص رصيد العميل'}</h5>
            <div class="cash-detail-row">
                <span>${lang==='en' ? 'Previous Balance' : 'دين سابق'}:</span>
                <span>${formatCurrency(previousBalance, 'USD')}</span>
            </div>
            <div class="cash-detail-row">
                <span>${lang==='en' ? 'This Invoice to Account' : 'ترحيل هذه الفاتورة'}:</span>
                <span>${toAccountDisplay}</span>
            </div>
            <div class="cash-detail-row">
                <span>${lang==='en' ? 'New Balance' : 'الرصيد بعد العملية'}:</span>
                <span>${formatCurrency(newBalance, 'USD')}</span>
            </div>
        </div>
        ` : ''}
        
        ${sale.cashDetails ? `
            <div class="invoice-cash-details">
                <h5><i class="fas fa-money-bill-wave"></i> ${t.cash_details}</h5>
                <div class="cash-detail-row">
                    <span>${t.paid}:</span>
                    <span>${formatCurrency(sale.cashDetails.amountPaid, sale.cashDetails.paymentCurrency)}</span>
                </div>
                <div class="cash-detail-row">
                    <span>${t.change}:</span>
                    <span>${sale.cashDetails.change > 0 ? formatCurrency(sale.cashDetails.change, sale.cashDetails.paymentCurrency) : t.none}</span>
                </div>
            </div>
        ` : ''}
    `;
    
    invoiceContent.innerHTML = invoiceHTML;
    showModal('invoiceModal');
}

// طباعة الفاتورة - إصلاح شامل
document.getElementById('printInvoiceBtn').addEventListener('click', function() {
    console.log('🖨️ بدء عملية الطباعة...');
    
    try {
        const invoiceContent = document.getElementById('invoiceContent');
        if (!invoiceContent) {
            console.error('❌ لم يتم العثور على محتوى الفاتورة');
            showMessage('خطأ: لم يتم العثور على محتوى الفاتورة', 'error');
            return;
        }
        
        const invoiceHTML = `
        <!DOCTYPE html>
        <html dir="${document.documentElement.dir || 'rtl'}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${settings.storeName || 'Invoice'}</title>
            <style>
                @page { 
                    size: 80mm auto; 
                    margin: 0; 
                }
                :root { 
                    --primary: #111827; 
                    --muted: #6b7280; 
                    --border: #e5e7eb; 
                }
                body { 
                    font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; 
                    direction: inherit; 
                    margin: 0; 
                    color: #111827; 
                }
                .invoice-wrapper { 
                    width: 80mm; 
                    margin: 0 auto; 
                    padding: 6mm 4mm; 
                }
                .invoice-header { 
                    display: block; 
                    margin-bottom: 4mm; 
                    padding-bottom: 3mm; 
                    border-bottom: 1px dashed var(--border); 
                }
                .store-info { 
                    text-align: center; 
                }
                .store-info h2 { 
                    margin: 0 0 1mm 0; 
                    color: var(--primary); 
                    font-size: 14px; 
                }
                .store-info p { 
                    margin: 0; 
                    color: var(--muted); 
                    font-size: 11px; 
                }
                .invoice-info { 
                    margin-top: 3mm; 
                    font-size: 11px; 
                }
                .invoice-info h3 { 
                    margin: 0 0 1mm 0; 
                    color: var(--primary); 
                    font-size: 12px; 
                }
                .invoice-info p { 
                    margin: 0.5mm 0; 
                    color: #444; 
                }
                .invoice-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 3mm 0 1mm; 
                    font-size: 11px; 
                }
                .invoice-table thead { 
                    display: none; 
                }
                .invoice-table td { 
                    padding: 2mm 0; 
                    border-bottom: 1px dotted var(--border); 
                }
                .invoice-table td:nth-child(1) { 
                    width: 46%; 
                    text-align: ${document.documentElement.dir === 'rtl' ? 'right' : 'left'}; 
                }
                .invoice-table td:nth-child(2) { 
                    width: 18%; 
                    text-align: center; 
                }
                .invoice-table td:nth-child(3) { 
                    width: 18%; 
                    text-align: ${document.documentElement.dir === 'rtl' ? 'left' : 'right'}; 
                }
                .invoice-table td:nth-child(4) { 
                    width: 18%; 
                    text-align: ${document.documentElement.dir === 'rtl' ? 'left' : 'right'}; 
                }
                .invoice-summary { 
                    margin-top: 2mm; 
                    font-size: 11px; 
                }
                .summary-row { 
                    display: flex; 
                    justify-content: space-between; 
                    margin: 1mm 0; 
                }
                .summary-row.total { 
                    font-weight: 700; 
                    border-top: 1px dashed var(--border); 
                    padding-top: 2mm; 
                    font-size: 12px; 
                }
                .footer-note { 
                    margin-top: 3mm; 
                    text-align: center; 
                    color: var(--muted); 
                    font-size: 10px; 
                }
                @media print { 
                    body { 
                        margin: 0; 
                    } 
                    .invoice-wrapper { 
                        padding: 6mm 4mm; 
                    }
                }
            </style>
        </head>
        <body>
            <div class="invoice-wrapper">${invoiceContent.innerHTML}<div class="footer-note">${settings.storeName || ''} - Thank you for your business</div></div>
        </body>
        </html>`;

        console.log('📄 تم إنشاء HTML للطباعة');

        // If running inside Electron with exposed API, use IPC to ask main process to print (shows system dialog)
        if (window.jhAPI && typeof window.jhAPI.printInvoice === 'function') {
            console.log('🔌 استخدام Electron API للطباعة');
            window.jhAPI.printInvoice(invoiceHTML).catch(err => { 
                console.error('❌ فشل الطباعة:', err); 
                showMessage('فشل الطباعة: ' + (err && err.message ? err.message : ''), 'error'); 
            });
            return;
        }

        // Fallback for browsers (not Electron)
        console.log('🌐 استخدام نافذة المتصفح للطباعة');
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        
        if (!printWindow) {
            console.error('❌ فشل في فتح نافذة الطباعة - قد يكون بسبب حاجز المنبثقات');
            showMessage('فشل في فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة.', 'error');
            return;
        }
        
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        
        // انتظار تحميل المحتوى ثم الطباعة
        printWindow.onload = function() {
            console.log('✅ تم تحميل المحتوى، بدء الطباعة...');
            setTimeout(() => {
                try {
                    printWindow.focus();
                    printWindow.print();
                    
                    // إغلاق النافذة بعد الطباعة
                    setTimeout(() => {
                        printWindow.close();
                        console.log('✅ تم إغلاق نافذة الطباعة');
                    }, 1000);
                } catch (printError) {
                    console.error('❌ خطأ في الطباعة:', printError);
                    showMessage('خطأ في الطباعة: ' + printError.message, 'error');
                    printWindow.close();
                }
            }, 500);
        };
        
        // معالجة الأخطاء
        printWindow.onerror = function(error) {
            console.error('❌ خطأ في نافذة الطباعة:', error);
            showMessage('خطأ في نافذة الطباعة', 'error');
            printWindow.close();
        };
        
    } catch (error) {
        console.error('❌ خطأ عام في الطباعة:', error);
        showMessage('خطأ في الطباعة: ' + error.message, 'error');
    }
});

// تم استبدال دالة حذف المبيعات بنظام الاسترجاع الاحترافي

// إحصائيات المرتجعات
function getReturnStatistics() {
    const totalSales = sales.length;
    const returnedSales = sales.filter(s => s.returned).length;
    const fullReturns = sales.filter(s => s.returned && s.returnType === 'full').length;
    const partialReturns = sales.filter(s => s.returned && s.returnType === 'partial').length;
    
    const totalReturnAmount = sales
        .filter(s => s.returned)
        .reduce((sum, sale) => sum + (sale.returnAmount || 0), 0);
    
    return {
        totalSales,
        returnedSales,
        fullReturns,
        partialReturns,
        totalReturnAmount,
        returnRate: totalSales > 0 ? ((returnedSales / totalSales) * 100).toFixed(2) : 0
    };
}

// تحميل العملاء
function loadCustomers() {
    console.log('🔄 [UI] loadCustomers called');
    // تحديث إجمالي المشتريات قبل العرض
    updateAllCustomersTotalPurchases();
    
    const tbody = document.getElementById('customersTable');
    tbody.innerHTML = '';
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        const creditStatus = customer.creditBalance > 0 ? 'debt' : 'clear';
        const creditPercent = Math.min(((customer.creditBalance || 0) / (customer.creditLimit || 1)) * 100, 100);
        
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${customer.address || getText('not_specified')}</td>
            <td>${formatCurrency(customer.totalPurchases)}</td>
            <td class="credit-${creditStatus}">
                ${formatCurrency(customer.creditBalance || 0)}
                ${customer.creditBalance > 0 ? `<small>(${creditPercent.toFixed(0)}%)</small>` : ''}
            </td>
            <td>${formatCurrency(customer.creditLimit || 0)}</td>
            <td>${customer.dateJoined || getText('not_specified')}</td>
            <td class="actions-cell">
                <div class="actions-dropdown">
                    <button class="actions-toggle-btn" onclick="toggleActionsDropdown(${customer.id})">
                        <i class="fas fa-ellipsis-v"></i> ${getText('actions')}
                    </button>
                    <div class="actions-dropdown-menu" id="actions-menu-${customer.id}">
                        <button class="dropdown-action-btn edit-btn" onclick="editCustomer(${customer.id})">
                            <i class="fas fa-edit"></i> ${getText('edit')}
                        </button>
                        <button class="dropdown-action-btn delete-btn" onclick="deleteCustomer(${customer.id})">
                            <i class="fas fa-trash"></i> ${getText('delete')}
                        </button>
                        <button class="dropdown-action-btn customer-log-btn" onclick="openCustomerTransactions(${customer.id})">
                            <i class="fas fa-list"></i> ${getText('log')}
                        </button>
                        ${customer.creditBalance > 0 ? `<button class="dropdown-action-btn pay-debt-btn" onclick="openPayDebt(${customer.id})"><i class="fas fa-dollar-sign"></i> ${getText('pay-debt')}</button>` : ''}
                    </div>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // ربط event listener للبحث في العملاء
    const customersSearch = document.getElementById('customersSearch');
    if (customersSearch) {
        // إزالة جميع event listeners القديمة
        customersSearch.oninput = null;
        // إضافة event listener جديد
        customersSearch.oninput = function() {
            const term = this.value.trim().toLowerCase();
            filterCustomersTable(term);
        };
    }
    
    // بعد البناء، ترجم الأزرار وفق اللغة الحالية
    try { translateCustomerActionButtons(); } catch(e) {}
}

// وظيفة البحث في العملاء
function filterCustomersTable(term) {
    const rows = document.querySelectorAll('#customersTable tr');
    rows.forEach(row => {
        // تخطي header row
        if (row.querySelector('th')) {
            return;
        }
        
        // البحث في جميع الخلايا
        const cells = row.querySelectorAll('td');
        let found = false;
        
        cells.forEach(cell => {
            const cellText = cell.textContent.toLowerCase().trim();
            if (cellText.includes(term)) {
                found = true;
            }
        });
        
        // إظهار أو إخفاء الصف
        row.style.display = found ? '' : 'none';
    });
}

// إضافة عميل جديد
document.getElementById('addCustomerBtn').addEventListener('click', function() {
    try { translateAddCustomerModal(); } catch(_) {}
    showModal('addCustomerModal');
});

document.getElementById('addCustomerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newCustomer = {
        id: Math.max(...customers.map(c => c.id), 0) + 1,
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value,
        totalPurchases: 0,
        loyaltyPoints: 0,
        creditBalance: 0,
        creditLimit: parseFloat(document.getElementById('customerCreditLimit').value) || 500,
        creditHistory: [],
        dateJoined: new Date().toISOString().split('T')[0]
    };
    
    customers.push(newCustomer);
    saveToStorage('customers', customers);
    loadCustomers();
    hideModal('addCustomerModal');
    this.reset();
    
    showMessage('تم إضافة العميل بنجاح');
});

function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        showMessage('العميل غير موجود', 'error');
        return;
    }
    
    // ملء النموذج ببيانات العميل الحالية
    const editCustomerName = document.getElementById('editCustomerName');
    const editCustomerEmail = document.getElementById('editCustomerEmail');
    const editCustomerPhone = document.getElementById('editCustomerPhone');
    const editCustomerAddress = document.getElementById('editCustomerAddress');
    const editCustomerCreditLimit = document.getElementById('editCustomerCreditLimit');
    
    if (editCustomerName) editCustomerName.value = customer.name;
    if (editCustomerEmail) editCustomerEmail.value = customer.email;
    if (editCustomerPhone) editCustomerPhone.value = customer.phone;
    if (editCustomerAddress) editCustomerAddress.value = customer.address || '';
    if (editCustomerCreditLimit) editCustomerCreditLimit.value = customer.creditLimit || 500;
    
    // تخزين معرف العميل الذي يتم تعديله
    document.getElementById('editCustomerForm').dataset.editId = id;
    
    showModal('editCustomerModal');
    try { translateEditCustomerModal(); } catch(e) {}
}

// معالج تعديل العميل
document.getElementById('editCustomerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const editId = parseInt(this.dataset.editId);
    const customerIndex = customers.findIndex(c => c.id === editId);
    
    if (customerIndex === -1) {
        showMessage('خطأ في العثور على العميل', 'error');
        return;
    }
    
    // تحديث بيانات العميل
    customers[customerIndex] = {
        ...customers[customerIndex],
        name: document.getElementById('editCustomerName').value,
        email: document.getElementById('editCustomerEmail').value,
        phone: document.getElementById('editCustomerPhone').value,
        address: document.getElementById('editCustomerAddress').value,
        creditLimit: parseFloat(document.getElementById('editCustomerCreditLimit').value) || 500
    };
    
    saveToStorage('customers', customers);
    loadCustomers();
    hideModal('editCustomerModal');
    showMessage('تم تحديث العميل بنجاح');
});

function deleteCustomer(id) {
    if (confirm(getText('confirm-delete-customer'))) {
        customers = customers.filter(c => c.id !== id);
        saveToStorage('customers', customers);
        loadCustomers();
        showMessage(getText('customer-deleted'));
    }
}

// ترجمة نافذة تعديل عميل
function translateEditCustomerModal() {
    const lang = document.documentElement.lang || 'ar';
    const t = lang === 'en' ? {
        title: 'Edit Customer',
        name: 'Customer Name',
        email: 'Email',
        phone: 'Phone',
        address: 'Address',
        credit_limit: 'Credit Limit (USD)',
        save: 'Save Changes',
        cancel: 'Cancel'
    } : {
        title: 'تعديل العميل',
        name: 'اسم العميل',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        address: 'العنوان',
        credit_limit: 'الحد الائتماني (دولار)',
        save: 'حفظ التعديلات',
        cancel: 'إلغاء'
    };
    const modal = document.getElementById('editCustomerModal');
    if (!modal) return;
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = t.title;
    const groups = modal.querySelectorAll('.form-group');
    if (groups && groups.length >= 5) {
        groups[0].querySelector('label').textContent = t.name;
        groups[1].querySelector('label').textContent = t.email;
        groups[2].querySelector('label').textContent = t.phone;
        groups[3].querySelector('label').textContent = t.address;
        groups[4].querySelector('label').textContent = t.credit_limit;
    }
    const actions = modal.querySelectorAll('.modal-actions button');
    if (actions && actions.length >= 2) {
        actions[0].textContent = t.save;
        actions[1].textContent = t.cancel;
    }
}

// ترجمة نافذة إضافة عميل
function translateAddCustomerModal() {
    const lang = document.documentElement.lang || 'ar';
    const t = lang === 'en' ? {
        title: 'Add New Customer',
        name: 'Customer Name',
        email: 'Email',
        phone: 'Phone',
        address: 'Address',
        credit_limit: 'Credit Limit (USD)',
        save: 'Save',
        cancel: 'Cancel'
    } : {
        title: 'إضافة عميل جديد',
        name: 'اسم العميل',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        address: 'العنوان',
        credit_limit: 'الحد الائتماني (دولار)',
        save: 'حفظ',
        cancel: 'إلغاء'
    };
    const modal = document.getElementById('addCustomerModal');
    if (!modal) return;
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = t.title;
    const groups = modal.querySelectorAll('.form-group');
    if (groups && groups.length >= 5) {
        groups[0].querySelector('label').textContent = t.name;
        groups[1].querySelector('label').textContent = t.email;
        groups[2].querySelector('label').textContent = t.phone;
        groups[3].querySelector('label').textContent = t.address;
        groups[4].querySelector('label').textContent = t.credit_limit;
    }
    const actions = modal.querySelectorAll('.modal-actions button');
    if (actions && actions.length >= 2) {
        actions[0].textContent = t.save;
        actions[1].textContent = t.cancel;
    }
}

// ترجمة نافذة إضافة منتج
function translateAddProductModal() {
    const lang = document.documentElement.lang || 'ar';
    const t = lang === 'en' ? {
        title: 'Add New Product',
        name: 'Product Name',
        category: 'Category',
        cost_usd: 'Cost (USD)',
        prices_title: 'Prices (USD only)',
        retail: 'Retail Price 🏪',
        vip: 'VIP Price ⭐',
        wholesale: 'Wholesale Price 📦',
        dollar: 'Dollar',
        price_lbp: 'Price in LBP:',
        rate_prefix: 'Current rate:',
        qty: 'Quantity',
        barcode: 'Barcode',
        gen_barcode: 'Generate Barcode',
        supplier: 'Supplier',
        supplier_placeholder: 'Select supplier',
        save: 'Save',
        cancel: 'Cancel'
    } : {
        title: 'إضافة منتج جديد',
        name: 'اسم المنتج',
        category: 'التصنيف',
        cost_usd: 'التكلفة (USD)',
        prices_title: 'الأسعار (بالدولار فقط)',
        retail: '🏪 سعر المفرق',
        vip: '⭐ سعر الزبون المميز',
        wholesale: '📦 سعر الجملة',
        dollar: 'دولار',
        price_lbp: 'السعر بالليرة:',
        rate_prefix: 'سعر الصرف الحالي:',
        qty: 'الكمية',
        barcode: 'الباركود',
        gen_barcode: 'توليد باركود',
        supplier: 'المورد',
        supplier_placeholder: 'اختر المورد',
        save: 'حفظ',
        cancel: 'إلغاء'
    };

    const modal = document.getElementById('addProductModal');
    if (!modal) return;
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = t.title;

    const groups = modal.querySelectorAll('.form-group');
    // المجموعات حسب ترتيبها في النموذج
    // 0: name, 1: category, 2: cost USD, 3: quantity, 4: barcode, 5: supplier
    if (groups && groups.length) {
        const map = [t.name, t.category, t.cost_usd];
        // مجموعة الأسعار منفصلة بعنصر .price-group
        if (groups[0]) groups[0].querySelector('label').textContent = t.name;
        if (groups[1]) groups[1].querySelector('label').textContent = t.category;
        if (groups[2]) groups[2].querySelector('label').textContent = t.cost_usd;
    }

    // عنوان مجموعة الأسعار
    const priceGroupTitle = modal.querySelector('.price-group h4');
    if (priceGroupTitle) priceGroupTitle.textContent = t.prices_title;
    const priceTypes = modal.querySelectorAll('.price-group .price-type-group');
    if (priceTypes && priceTypes.length >= 3) {
        const labels = [t.retail, t.vip, t.wholesale];
        priceTypes.forEach((grp, i) => {
            const lbl = grp.querySelector('label');
            if (lbl && labels[i]) lbl.textContent = labels[i];
            const cur = grp.querySelector('.currency-label');
            if (cur) cur.textContent = t.dollar;
            const autoSmall = grp.querySelector('.auto-calc-display small');
            if (autoSmall) {
                const span = grp.querySelector('.auto-calc-display small span');
                autoSmall.textContent = t.price_lbp + ' ';
                if (span) autoSmall.appendChild(span);
                const tail = document.createTextNode(lang === 'en' ? ' LBP' : ' ل.ل');
                autoSmall.appendChild(tail);
            }
        });
        // تحديث أمثلة placeholder لحقول الأسعار بالدولار
        const cost = modal.querySelector('#productCostUSD');
        if (cost) cost.placeholder = lang === 'en' ? 'e.g. 0.80' : 'مثال: 0.80';
        const retail = modal.querySelector('#productRetailUSD');
        if (retail) retail.placeholder = lang === 'en' ? 'e.g. 1.50' : 'مثال: 1.50';
        const vip = modal.querySelector('#productVipUSD');
        if (vip) vip.placeholder = lang === 'en' ? 'e.g. 1.30' : 'مثال: 1.30';
        const wholesale = modal.querySelector('#productWholesaleUSD');
        if (wholesale) wholesale.placeholder = lang === 'en' ? 'e.g. 1.20' : 'مثال: 1.20';
    }
    // ملاحظة سعر الصرف
    const rateNote = modal.querySelector('.exchange-rate-note small');
    if (rateNote) {
        const valSpan = modal.querySelector('#currentExchangeRate');
        const num = valSpan ? valSpan.textContent : '';
        rateNote.textContent = `${t.rate_prefix} `;
        if (valSpan) rateNote.appendChild(valSpan);
        const tail = document.createTextNode(lang === 'en' ? ' LBP' : ' ل.ل');
        rateNote.appendChild(tail);
    }

    // كمية
    if (groups[3]) groups[3].querySelector('label').textContent = t.qty;
    // باركود + زر توليد
    if (groups[4]) {
        const lbl = groups[4].querySelector('label');
        if (lbl) lbl.textContent = t.barcode;
        const genBtn = groups[4].querySelector('.generate-barcode-btn');
        if (genBtn) { const icon = genBtn.querySelector('i'); genBtn.textContent = t.gen_barcode; if (icon) genBtn.prepend(icon); }
    }
    // المورد
    if (groups[5]) {
        const lbl = groups[5].querySelector('label');
        if (lbl) lbl.textContent = t.supplier;
        const sel = groups[5].querySelector('select');
        if (sel && sel.options.length) sel.options[0].textContent = t.supplier_placeholder;
    }
    // أزرار الحفظ والإلغاء
    const actions = modal.querySelectorAll('.modal-actions button');
    if (actions && actions.length >= 2) {
        actions[0].textContent = t.save;
        actions[1].textContent = t.cancel;
    }
}

// ترجمة نافذة تعديل المنتج (Edit Product Modal)
function translateEditProductModal() {
    const lang = document.documentElement.lang || 'ar';
    const t = lang === 'en' ? {
        title: 'Edit Product',
        name: 'Product Name',
        category: 'Category',
        price_usd: 'Price (USD)',
        price_lbp: 'Price (LBP)',
        cost_usd: 'Cost (USD)',
        qty: 'Quantity',
        barcode: 'Barcode',
        supplier: 'Supplier',
        supplier_placeholder: 'Select supplier',
        save: 'Save Changes',
        cancel: 'Cancel'
    } : {
        title: 'تعديل المنتج',
        name: 'اسم المنتج',
        category: 'التصنيف',
        price_usd: 'السعر بالدولار',
        price_lbp: 'السعر بالليرة',
        cost_usd: 'التكلفة (USD)',
        qty: 'الكمية',
        barcode: 'الباركود',
        supplier: 'المورد',
        supplier_placeholder: 'اختر المورد',
        save: 'حفظ التعديلات',
        cancel: 'إلغاء'
    };

    const modal = document.getElementById('editProductModal');
    if (!modal) return;
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = t.title;

    const groups = modal.querySelectorAll('.form-group');
    // mapping according to index in HTML
    if (groups && groups.length >= 6) {
        if (groups[0]) groups[0].querySelector('label').textContent = t.name;
        if (groups[1]) groups[1].querySelector('label').textContent = t.category;
        if (groups[2]) groups[2].querySelector('label').textContent = t.price_usd;
        if (groups[3]) groups[3].querySelector('label').textContent = t.price_lbp;
        if (groups[4]) groups[4].querySelector('label').textContent = t.cost_usd;
        if (groups[5]) groups[5].querySelector('label').textContent = t.qty;
        if (groups[6]) groups[6].querySelector('label').textContent = t.barcode;
        if (groups[7]) groups[7].querySelector('label').textContent = t.supplier;
        const sel = groups[7] ? groups[7].querySelector('select') : null;
        if (sel && sel.options.length) sel.options[0].textContent = t.supplier_placeholder;
    }

    const actions = modal.querySelectorAll('.modal-actions button');
    if (actions && actions.length >= 2) {
        actions[0].textContent = t.save;
        actions[1].textContent = t.cancel;
    }
}

// تحميل الموردين
function loadSuppliers() {
    const tbody = document.getElementById('suppliersTable');
    tbody.innerHTML = '';
    
    suppliers.forEach(supplier => {
        const row = document.createElement('tr');
        const balance = getSupplierBalanceUSD(supplier.id);
        row.innerHTML = `
            <td>${supplier.name}</td>
            <td>${supplier.email}</td>
            <td>${supplier.phone}</td>
            <td>${supplier.address}</td>
            <td>${supplier.contactPerson}</td>
            <td>${formatCurrency(balance, 'USD')}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editSupplier(${supplier.id})"><i class="fas fa-edit"></i> ${getText('edit')}</button>
                <button class="action-btn delete-btn" onclick="deleteSupplier(${supplier.id})"><i class="fas fa-trash"></i> ${getText('delete')}</button>
                <button class="action-btn" onclick="openSupplierHistory(${supplier.id})"><i class=\"fas fa-history\"></i> History</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // ربط event listener للبحث في الموردين
    const suppliersSearch = document.getElementById('suppliersSearch');
    if (suppliersSearch) {
        // إزالة جميع event listeners القديمة
        suppliersSearch.oninput = null;
        // إضافة event listener جديد
        suppliersSearch.oninput = function() {
            const term = this.value.trim().toLowerCase();
            filterSuppliersTable(term);
        };
    }

    // زر دفع مورد
    const payBtn = document.getElementById('openSupplierPaymentBtn');
    if (payBtn) {
        payBtn.onclick = () => openSupplierPayment();
    }
}

function openSupplierHistory(supplierId) {
    const supplier = suppliers.find(s=> s.id === supplierId);
    const modal = document.getElementById('supplierHistoryModal');
    if (!supplier || !modal) return;
    modal.dataset.supplierId = String(supplierId);
    renderSupplierHistory();
    const applyBtn = document.getElementById('shApply');
    if (applyBtn) applyBtn.onclick = () => renderSupplierHistory();
    const exportBtn = document.getElementById('shExport');
    if (exportBtn) exportBtn.onclick = () => exportSupplierHistoryCSV();
    showModal('supplierHistoryModal');
}

function renderSupplierHistory() {
    const modal = document.getElementById('supplierHistoryModal');
    const tbody = document.getElementById('supplierHistoryTable');
    if (!modal || !tbody) return;
    const supplierId = parseInt(modal.dataset.supplierId || '0');
    const from = document.getElementById('shFrom')?.value || '';
    const to = document.getElementById('shTo')?.value || '';
    const entries = supplierLedger.filter(e => e.supplier_id === supplierId);
    const filtered = entries.filter(e => {
        if (from) {
            if ((new Date(e.created_at)) < (new Date(from))) return false;
        }
        if (to) {
            const toD = new Date(to);
            toD.setHours(23,59,59,999);
            if ((new Date(e.created_at)) > toD) return false;
        }
        return true;
    }).sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
    tbody.innerHTML = filtered.map(e => `
        <tr>
            <td>${new Date(e.created_at).toLocaleString()}</td>
            <td>${e.type}</td>
            <td>${e.ref_no || '-'}</td>
            <td>${formatCurrency(e.total_cost || 0, 'USD')}</td>
            <td>${formatCurrency(e.paid_now || 0, 'USD')}</td>
            <td>${formatCurrency(e.remaining || 0, 'USD')}</td>
            <td>${e.note || ''}</td>
        </tr>
    `).join('');
}

function exportSupplierHistoryCSV() {
    const modal = document.getElementById('supplierHistoryModal');
    if (!modal) return;
    const supplierId = parseInt(modal.dataset.supplierId || '0');
    const entries = supplierLedger.filter(e => e.supplier_id === supplierId);
    const headers = ['created_at','type','ref_no','total_cost','paid_now','remaining','note'];
    const rows = entries.map(e => [e.created_at, e.type, e.ref_no || '', e.total_cost || 0, e.paid_now || 0, e.remaining || 0, (e.note||'').replace(/\n|\r/g,' ') ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `supplier-${supplierId}-history.csv`;
    link.click();
}

// وظيفة البحث في الموردين
function handleSuppliersSearch() {
    const term = this.value.trim().toLowerCase();
    filterSuppliersTable(term);
}

function filterSuppliersTable(term) {
    const rows = document.querySelectorAll('#suppliersTable tr');
    rows.forEach(row => {
        // تخطي header row
        if (row.querySelector('th')) {
            return;
        }
        
        // البحث في جميع الخلايا
        const cells = row.querySelectorAll('td');
        let found = false;
        
        cells.forEach(cell => {
            const cellText = cell.textContent.toLowerCase().trim();
            if (cellText.includes(term)) {
                found = true;
            }
        });
        
        // إظهار أو إخفاء الصف
        row.style.display = found ? '' : 'none';
    });
}

// إضافة مورد جديد
document.getElementById('addSupplierBtn').addEventListener('click', function() {
    showModal('addSupplierModal');
});

document.getElementById('addSupplierForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newSupplier = {
        id: Math.max(...suppliers.map(s => s.id), 0) + 1,
        name: document.getElementById('supplierName').value,
        email: document.getElementById('supplierEmail').value,
        phone: document.getElementById('supplierPhone').value,
        address: document.getElementById('supplierAddress').value,
        contactPerson: document.getElementById('supplierContact').value
    };
    
    suppliers.push(newSupplier);
    saveToStorage('suppliers', suppliers);
    loadSuppliers();
    updateSuppliersDropdown('productSupplier');
    updateSuppliersDropdown('editProductSupplier');
    hideModal('addSupplierModal');
    this.reset();
    
    showMessage('تم إضافة المورد بنجاح');
});

function editSupplier(id) {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) {
        showMessage('المورد غير موجود', 'error');
        return;
    }

    // تعبئة الحقول
    const nameInp = document.getElementById('editSupplierName');
    const emailInp = document.getElementById('editSupplierEmail');
    const phoneInp = document.getElementById('editSupplierPhone');
    const addressInp = document.getElementById('editSupplierAddress');
    const contactInp = document.getElementById('editSupplierContact');
    if (nameInp) nameInp.value = supplier.name || '';
    if (emailInp) emailInp.value = supplier.email || '';
    if (phoneInp) phoneInp.value = supplier.phone || '';
    if (addressInp) addressInp.value = supplier.address || '';
    if (contactInp) contactInp.value = supplier.contactPerson || '';

    // تخزين المعرف في النموذج
    const form = document.getElementById('editSupplierForm');
    if (form) form.dataset.editId = String(id);

    showModal('editSupplierModal');
}

// حفظ تعديل المورد
document.getElementById('editSupplierForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const editId = parseInt(this.dataset.editId);
    const idx = suppliers.findIndex(s => s.id === editId);
    if (idx === -1) {
        showMessage('خطأ في العثور على المورد', 'error');
        return;
    }

    // تحقق أساسي من الحقول
    const name = document.getElementById('editSupplierName').value.trim();
    const phone = document.getElementById('editSupplierPhone').value.trim();
    const email = document.getElementById('editSupplierEmail').value.trim();
    const address = document.getElementById('editSupplierAddress').value.trim();
    const contact = document.getElementById('editSupplierContact').value.trim();

    if (!name) {
        showMessage('يرجى إدخال اسم المورد', 'error');
        return;
    }
    if (!phone) {
        showMessage('يرجى إدخال رقم الهاتف', 'error');
        return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        showMessage('صيغة البريد الإلكتروني غير صحيحة', 'error');
        return;
    }

    suppliers[idx] = {
        ...suppliers[idx],
        name: name,
        email: email,
        phone: phone,
        address: address,
        contactPerson: contact
    };

    saveToStorage('suppliers', suppliers);
    loadSuppliers();
    updateSuppliersDropdown('productSupplier');
    updateSuppliersDropdown('editProductSupplier');
    hideModal('editSupplierModal');
    showMessage('تم تحديث المورد بنجاح');
});

function deleteSupplier(id) {
    if (confirm(getText('confirm-delete-supplier'))) {
        suppliers = suppliers.filter(s => s.id !== id);
        saveToStorage('suppliers', suppliers);
        loadSuppliers();
        updateSuppliersDropdown('productSupplier');
        updateSuppliersDropdown('editProductSupplier');
        showMessage('تم حذف المورد');
    }
}

// تحميل الإعدادات
function loadSettings() {
    const storeName = document.getElementById('storeName');
    const storeAddress = document.getElementById('storeAddress');
    const storePhone = document.getElementById('storePhone');
    const exchangeRateInput = document.getElementById('exchangeRateInput');
    const lowStockThreshold = document.getElementById('lowStockThreshold');
    const lowStockAlertCheckbox = document.getElementById('lowStockAlertCheckbox');
    
    if (storeName) storeName.value = settings.storeName;
    if (storeAddress) storeAddress.value = settings.storeAddress;
    if (storePhone) storePhone.value = settings.storePhone;
    if (exchangeRateInput) exchangeRateInput.value = settings.exchangeRate;
    // تم إزالة إعدادات الضريبة
    if (lowStockThreshold) lowStockThreshold.value = settings.lowStockThreshold || 10;
    if (lowStockAlertCheckbox) lowStockAlertCheckbox.checked = settings.lowStockAlert !== false;
    
    // إظهار/إخفاء مجموعة حد التحذير
    toggleStockThresholdGroup();
    
    // تحديث عرض الصندوق الحالي
    updateCashDrawerSettings();
}

function toggleStockThresholdGroup() {
    const checkbox = document.getElementById('lowStockAlertCheckbox');
    const group = document.getElementById('stockThresholdGroup');
    if (group) {
        group.style.display = checkbox && checkbox.checked ? 'block' : 'none';
    }
}

function updateCashDrawerSettings() {
    const currentUSD = document.getElementById('currentUSD');
    const currentLBP = document.getElementById('currentLBP');
    const editCashUSD = document.getElementById('editCashUSD');
    const editCashLBP = document.getElementById('editCashLBP');
    
    if (currentUSD) currentUSD.textContent = formatCurrency(cashDrawer.cashUSD, 'USD');
    if (currentLBP) currentLBP.textContent = formatCurrency(cashDrawer.cashLBP, 'LBP');
    if (editCashUSD) editCashUSD.value = cashDrawer.cashUSD;
    if (editCashLBP) editCashLBP.value = cashDrawer.cashLBP;
}

// تحديث سعر الصرف
document.getElementById('updateExchangeRate').addEventListener('click', function() {
    const newRate = parseFloat(document.getElementById('exchangeRateInput').value);
    if (newRate > 0) {
        settings.exchangeRate = newRate;
        const rateSuffix = (document.documentElement.lang || 'ar') === 'en' ? 'LBP' : 'ل.ل';
        document.getElementById('exchangeRate').textContent = `${getText('exchange-rate')}: ${newRate.toLocaleString()} ${rateSuffix}`;
        showMessage('تم تحديث سعر الصرف بنجاح');
    } else {
        showMessage('يرجى إدخال سعر صرف صحيح', 'error');
    }
});

// تم إزالة إعدادات الضريبة

// إدارة النوافذ المنبثقة
function showModal(modalId) {
    document.getElementById('overlay').classList.add('active');
    document.getElementById(modalId).classList.add('active');
}

function hideModal(modalId) {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById(modalId).classList.remove('active');
}

// إغلاق النوافذ المنبثقة
document.getElementById('overlay').addEventListener('click', function() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    this.classList.remove('active');
});

document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        if (modal) {
            hideModal(modal.id);
        }
    });
});

// تحديث أسعار المنتجات عند تغيير العملة
function updateProductPrices() {
    displayProducts();
}

// إعداد التواريخ الافتراضية
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    const df = document.getElementById('dateFrom');
    const dt = document.getElementById('dateTo');
    if (df) df.value = today;
    if (dt) dt.value = today;
    // إعداد حقل سعر صرف الشراء الافتراضي
    const pr = document.getElementById('purchaseRate');
    if (pr) pr.value = settings.exchangeRate;

    const spSupplier = document.getElementById('spSupplier');
    if (spSupplier) spSupplier.innerHTML = suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
});

// تمت إزالة معالج قديم لتصفية المبيعات كان يعيد تحميل كل المبيعات

// تقارير: أزلنا الاعتماد على ترتيب الأزرار واستبدلناه بربط صريح عبر onclick داخل HTML

// فلترة التقارير حسب الفترات الجاهزة أو تاريخ مخصص
document.getElementById('applyReportFilter')?.addEventListener('click', () => {
    const preset = document.getElementById('reportPreset').value;
    const fromInp = document.getElementById('reportFromDate');
    const toInp = document.getElementById('reportToDate');
    const { from, to } = getRangeByPreset(preset, fromInp.value, toInp ? toInp.value : '');
    window.currentReportRange = { from, to };
    // إعادة فتح آخر تقرير تم عرضه إن وجد
    const title = document.getElementById('reportTitle')?.textContent || '';
    if (title.includes('المبيعات') || title.toLowerCase().includes('sales')) return showSalesReport();
    if (title.includes('المالي') || title.toLowerCase().includes('financial')) return showFinancialReport();
    if (title.includes('المخزون') || title.toLowerCase().includes('inventory')) return showInventoryReport();
    if (title.includes('العملاء') || title.toLowerCase().includes('customers')) return showCustomersReport();
});

document.getElementById('openSalesHistory')?.addEventListener('click', openSalesHistory);
document.getElementById('openCashMove')?.addEventListener('click', () => {
    showModal('cashMoveModal');
    setTimeout(() => fixCashMoveModal(), 100);
});

document.getElementById('confirmCashMove')?.addEventListener('click', () => {
    const type = document.getElementById('cashMoveType').value;
    const amount = parseFloat(document.getElementById('cashMoveAmount').value) || 0;
    const currency = document.getElementById('cashMoveCurrency').value;
    const note = document.getElementById('cashMoveNote').value || '';
    if (amount <= 0) { showMessage('أدخل مبلغاً صحيحاً', 'error'); return; }
    // تنفيذ الحركة
    if (type === 'expense' || type === 'transfer') {
        if (currency === 'USD') {
            if (cashDrawer.cashUSD < amount) { showMessage('لا يوجد رصيد دولار كافٍ', 'error'); return; }
            cashDrawer.cashUSD -= amount;
        } else {
            if (cashDrawer.cashLBP < amount) { showMessage('لا يوجد رصيد ليرة كافٍ', 'error'); return; }
            cashDrawer.cashLBP -= amount;
        }
    } else if (type === 'deposit') {
        if (currency === 'USD') cashDrawer.cashUSD += amount; else cashDrawer.cashLBP += amount;
    }
    // سجل الحركة
    cashDrawer.transactions = cashDrawer.transactions || [];
    cashDrawer.transactions.push({
        timestamp: new Date().toISOString(),
        type,
        amount,
        currency,
        note,
        balanceAfter: { USD: cashDrawer.cashUSD, LBP: cashDrawer.cashLBP }
    });
    cashDrawer.lastUpdate = new Date().toISOString();
    saveToStorage('cashDrawer', cashDrawer);
    updateCashDrawerDisplay();

    // إضافة أيضاً لسجل المبيعات العام كمرجع يومي - استخدام الوقت الحقيقي
    const salesLogs = loadFromStorage('salesLogs', []);
    salesLogs.push({ timestamp: getLocalDateTimeISO(), invoiceNumber: '-', amount: (currency==='USD'?amount:amount/(settings.exchangeRate||1)), currency: 'USD', method: `cash-${type}`, customer: '-', user: currentUser || 'المستخدم', note });
    saveToStorage('salesLogs', salesLogs);
    
    showNotification('تم تسجيل حركة الصندوق', 'success', 2500);
    hideModal('cashMoveModal');
});

// تطبيق تلقائي عند تغيير القائمة الجاهزة
document.getElementById('reportPreset')?.addEventListener('change', (e) => {
    const preset = e.target.value;
    const fromInp = document.getElementById('reportFromDate');
    const toInp = document.getElementById('reportToDate');
    if (preset !== 'custom') {
        const { from, to } = getRangeByPreset(preset);
        fromInp.value = toDateInputValue(from);
        if (toInp) {
            toInp.value = toDateInputValue(to);
            toInp.disabled = true;
        }
        fromInp.disabled = true;
        window.currentReportRange = { from, to };
        rerenderCurrentReport();
    } else {
        fromInp.disabled = false; if (toInp) toInp.disabled = false;
    }
});

// تطبيق تلقائي عند إدخال تاريخين في وضع "مخصص"
['reportFromDate','reportToDate'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
        const presetSel = document.getElementById('reportPreset');
        if (!presetSel || presetSel.value !== 'custom') return;
        const fromVal = document.getElementById('reportFromDate').value;
        const toVal = document.getElementById('reportToDate').value;
        if (fromVal && toVal) {
            const { from, to } = getRangeByPreset('custom', fromVal, toVal);
            window.currentReportRange = { from, to };
            rerenderCurrentReport();
        }
    });
});

function getRangeByPreset(preset, customFrom, customTo) {
    const now = new Date();
    let from = new Date();
    let to = new Date();
    switch (preset) {
        case 'today':
            from.setHours(0,0,0,0); 
            to.setHours(23,59,59,999); 
            break;
        case 'yesterday':
            from = new Date(now);
            from.setDate(now.getDate()-1); 
            from.setHours(0,0,0,0);
            to = new Date(from); 
            to.setHours(23,59,59,999); 
            break;
        case 'this_week': {
            const day = now.getDay(); // 0 Sun
            const diff = (day + 6) % 7; // جعل الاثنين بداية الأسبوع إن رغبت لاحقاً
            from = new Date(now);
            from.setDate(now.getDate() - diff); 
            from.setHours(0,0,0,0);
            to = new Date(now);
            to.setHours(23,59,59,999); 
            break;
        }
        case 'last_7':
            from = new Date(now);
            from.setDate(now.getDate()-6); 
            from.setHours(0,0,0,0);
            to = new Date(now);
            to.setHours(23,59,59,999); 
            break;
        case 'this_month':
            from = new Date(now.getFullYear(), now.getMonth(), 1);
            to = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999); 
            break;
        case 'last_30':
            from = new Date(now);
            from.setDate(now.getDate()-29); 
            from.setHours(0,0,0,0);
            to = new Date(now);
            to.setHours(23,59,59,999); 
            break;
        case 'this_year':
            from = new Date(now.getFullYear(), 0, 1);
            to = new Date(now.getFullYear(), 11, 31, 23,59,59,999); 
            break;
        case 'custom':
        default:
            from = customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1);
            to = customTo ? new Date(customTo) : new Date(now);
    }
    return { from, to };
}

function toDateInputValue(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
}

function rerenderCurrentReport() {
    const title = document.getElementById('reportTitle')?.textContent || '';
    if (title.includes('المبيعات') || title.toLowerCase().includes('sales')) return showSalesReport();
    if (title.includes('المالي') || title.toLowerCase().includes('financial')) return showFinancialReport();
    if (title.includes('المخزون') || title.toLowerCase().includes('inventory')) return showInventoryReport();
    if (title.includes('العملاء') || title.toLowerCase().includes('customers')) return showCustomersReport();
}
function showSalesReport() {
    // التحقق من كلمة السر أولاً
    if (!checkReportPassword()) {
        return;
    }
    
    const reportContent = document.getElementById('reportContent');
    const reportTitle = document.getElementById('reportTitle');
    const isEn = (document.documentElement.lang || 'ar') === 'en';
    reportTitle.textContent = isEn ? 'Sales Report' : 'تقرير المبيعات';
    const range = window.currentReportRange || getRangeByPreset('this_month');
    const filtered = sales.filter(s => {
        try {
            // استخدام timestamp إذا كان متوفراً، وإلا fallback إلى date
            const dateValue = s.timestamp || s.date;
            const saleDate = new Date(dateValue);
            if (isNaN(saleDate.getTime())) {
                console.warn('Invalid date in sale:', s);
                return false;
            }
            return saleDate >= range.from && saleDate <= range.to;
        } catch (error) {
            console.warn('Error filtering sale by date:', s, error);
            return false;
        }
    });
    const totalSales = filtered.reduce((sum, sale) => sum + sale.amount, 0);
    const totalTransactions = filtered.length;
    const averageTransaction = totalSales / (totalTransactions || 1);
    // استخدام التوقيت المحلي لحساب اليوم
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const todaySales = filtered.filter(sale => {
        try {
            // استخدام timestamp إذا كان متوفراً، وإلا fallback إلى date
            const dateValue = sale.timestamp || sale.date;
            const saleDate = new Date(dateValue);
            if (isNaN(saleDate.getTime())) return false;
            
            // استخدام التوقيت المحلي للمقارنة
            const saleDateStr = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;
            return saleDateStr === todayStr;
        } catch (error) {
            return false;
        }
    });
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.amount, 0);
    
    const toolbar = `
        <div class="report-toolbar" style="margin: 0 15px 20px 15px; padding: 12px 15px; background: #f8f9fa; border-radius: 8px;">
            <div class="filter-group" style="display: flex; gap: 8px; align-items: center;">
                <select id="reportPreset" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; min-width: 120px;"><option value="today">${isEn?'Today':'اليوم'}</option><option value="this_week">${isEn?'This week':'هذا الأسبوع'}</option><option value="last_7">${isEn?'Last 7 days':'آخر 7 أيام'}</option><option value="this_month" selected>${isEn?'This month':'هذا الشهر'}</option><option value="last_30">${isEn?'Last 30 days':'آخر 30 يوم'}</option><option value="custom">${isEn?'Custom':'مخصص'}</option></select>
                <input type="date" id="reportFromDate" style="display:none; padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px;">
                <input type="date" id="reportToDate" style="display:none; padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px;">
            </div>
            <div class="filter-group" style="display: flex; gap: 8px; align-items: center;">
                <button class="filter-btn" id="applyReportFilter" style="padding: 6px 12px; font-size: 13px;">${isEn?'Apply':'تطبيق'}</button>
                <button class="report-btn" id="exportSalesCSV" style="padding: 6px 12px; font-size: 13px;">CSV</button>
                <button class="report-btn" id="exportSalesPDF" style="padding: 6px 12px; font-size: 13px;">PDF</button>
            </div>
        </div>`;

    const reportHTML = `
        ${toolbar}
        <div class="report-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 0 15px 20px 15px;">
            <div class="stat-item" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 500;">${isEn ? 'Total Sales' : 'إجمالي المبيعات'}</h4>
                <p class="stat-value" style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">${formatCurrency(totalSales)}</p>
            </div>
            <div class="stat-item" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 500;">${isEn ? 'Transactions' : 'عدد المعاملات'}</h4>
                <p class="stat-value" style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">${totalTransactions}</p>
            </div>
            <div class="stat-item" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 500;">${isEn ? 'Average Transaction' : 'متوسط المعاملة'}</h4>
                <p class="stat-value" style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">${formatCurrency(averageTransaction)}</p>
            </div>
            <div class="stat-item" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 500;">${isEn ? 'Today Sales' : 'مبيعات اليوم'}</h4>
                <p class="stat-value" style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">${formatCurrency(todayRevenue)}</p>
            </div>
        </div>
        
        <div class="table-container" style="margin: 0 15px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <table class="report-table" id="salesReportTable" style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th data-sort="invoiceNumber" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Invoice #' : 'رقم الفاتورة'} <i class="fas fa-sort"></i></th>
                        <th data-sort="date" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Date' : 'التاريخ'} <i class="fas fa-sort"></i></th>
                        <th data-sort="customer" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Customer' : 'العميل'} <i class="fas fa-sort"></i></th>
                        <th data-sort="amount" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Amount' : 'المبلغ'} <i class="fas fa-sort"></i></th>
                        <th data-sort="paymentMethod" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Payment Method' : 'طريقة الدفع'} <i class="fas fa-sort"></i></th>
                    </tr>
                </thead>
                <tbody id="salesReportTableBody">
                    <!-- سيتم ملء البيانات ديناميكياً -->
                </tbody>
            </table>
        </div>
        
        <!-- Pagination Controls -->
        <div id="salesPagination" class="pagination-container" style="display: flex; justify-content: space-between; align-items: center; margin: 20px 15px 15px 15px; padding: 12px 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div class="pagination-left" style="display: flex; align-items: center; gap: 8px;">
                <label for="salesRowsPerPage" style="font-size: 13px; color: #374151; font-weight: 500;">${getText('rows-per-page')}:</label>
                <select id="salesRowsPerPage" style="padding: 5px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: white; min-width: 60px;">
                    <option value="10">10</option>
                    <option value="25" selected>25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
            </div>
            
            <div class="pagination-center" style="display: flex; align-items: center; gap: 6px;">
                <button id="salesFirstPage" class="pagination-btn" style="padding: 6px 10px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" title="${getText('first')}">
                    <i class="fas fa-angle-double-left"></i>
                </button>
                <button id="salesPrevPage" class="pagination-btn" style="padding: 6px 10px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" title="${getText('previous')}">
                    <i class="fas fa-angle-left"></i>
                </button>
                <span id="salesCurrentPage" style="padding: 6px 12px; background: #3b82f6; color: white; border-radius: 6px; font-size: 13px; font-weight: 600; min-width: 30px; text-align: center;">1</span>
                <button id="salesNextPage" class="pagination-btn" style="padding: 6px 10px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" title="${getText('next')}">
                    <i class="fas fa-angle-right"></i>
                </button>
                <button id="salesLastPage" class="pagination-btn" style="padding: 6px 10px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" title="${getText('last')}">
                    <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
            
            <div class="pagination-right" style="font-size: 13px; color: #6b7280; font-weight: 500;">
                <span id="salesPageInfo">${getText('showing')} 1-25 ${getText('of')} ${totalTransactions} ${getText('entries')}</span>
            </div>
        </div>
    `;
    
    reportContent.innerHTML = reportHTML;
    
    // إعداد pagination للمبيعات
    setupSalesPagination(filtered);
    
    // ربط التصدير
    document.getElementById('exportSalesCSV')?.addEventListener('click', () => exportTableToCSV('sales_report.csv'));
    document.getElementById('exportSalesPDF')?.addEventListener('click', () => exportTableToPDF('Sales Report'));
    showModal('reportModal');
}
// عرض سجل المبيعات العام
function openSalesHistory() {
    const logsRaw = loadFromStorage('salesLogs', []);
    
    // دالة محسنة لتحليل timestamp
    function parseLogTimestamp(log) {
        const timestamp = log.timestamp;
        if (!timestamp) return new Date(0);
        
        try {
            // إذا كان timestamp محلي بصيغة ISO
            if (typeof timestamp === 'string' && timestamp.includes('T')) {
                if (!timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-', 10)) {
                    // timestamp محلي بدون timezone - parse يدوياً
                    const parts = timestamp.split('T');
                    if (parts.length === 2) {
                        const [datePart, timePart] = parts;
                        const [year, month, day] = datePart.split('-').map(Number);
                        const timeWithMs = timePart.includes('.') ? timePart : timePart + '.000';
                        const [timeOnly, ms] = timeWithMs.split('.');
                        const [hours, minutes, seconds] = timeOnly.split(':').map(Number);
                        return new Date(year, month - 1, day, hours, minutes, seconds, Number(ms.padEnd(3, '0')));
                    }
                }
                return new Date(timestamp);
            }
            
            // إذا كان timestamp بصيغة locale string أو أي صيغة أخرى
            return new Date(timestamp);
        } catch (error) {
            console.warn('خطأ في تحليل timestamp:', timestamp, error);
            return new Date(0);
        }
    }
    
    // ترتيب تنازلي بحسب التاريخ والوقت ورقم الفاتورة
    const logs = [...logsRaw].sort((a, b) => {
        const dateA = parseLogTimestamp(a);
        const dateB = parseLogTimestamp(b);
        
        // أولاً حسب الوقت
        const timeDiff = dateB - dateA;
        if (timeDiff !== 0) return timeDiff;
        
        // ثم حسب رقم الفاتورة (الأحدث أولاً)
        const invoiceA = a.invoiceNumber || '';
        const invoiceB = b.invoiceNumber || '';
        return invoiceB.localeCompare(invoiceA, undefined, { numeric: true });
    });
    let html = `
        <div class="report-stats">
            <div class="stat-item"><h4>${getText('sales-history')}</h4><p class="stat-value">${logs.length} ${getText('operations')}</p></div>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th>${getText('date-time')}</th>
                    <th>${getText('invoice-number')}</th>
                    <th>${getText('customer')}</th>
                    <th>${getText('method')}</th>
                    <th>${getText('amount')}</th>
                    <th>${getText('user')}</th>
                </tr>
            </thead>
            <tbody>
                ${logs.length ? logs.map((l, index) => `
                    <tr ${index === 0 ? 'style="background-color:#e3f2fd;font-weight:700;"' : ''}>
                        <td>${l.timestamp}</td>
                        <td>${l.invoiceNumber}</td>
                        <td>${l.customer || '-'}</td>
                        <td>${l.method}</td>
                        <td>${formatCurrency(l.amount, l.currency)}</td>
                        <td>${l.user}</td>
                    </tr>
                `).join('') : `<tr><td colspan="6">${getText('no-records')}</td></tr>`}
            </tbody>
        </table>
    `;
    const reportContent = document.getElementById('reportContent');
    const reportTitle = document.getElementById('reportTitle');
    if (reportTitle) reportTitle.textContent = getText('sales-history');
    if (reportContent) reportContent.innerHTML = html;
    showModal('reportModal');
}

function showInventoryReport() {
    // التحقق من كلمة السر أولاً
    if (!checkReportPassword()) {
        return;
    }
    
    const reportContent = document.getElementById('reportContent');
    const reportTitle = document.getElementById('reportTitle');
    
    const isEn = (document.documentElement.lang || 'ar') === 'en';
    reportTitle.textContent = isEn ? 'Inventory Report' : 'تقرير المخزون';
    
    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, product) => sum + (product.stock * product.priceUSD), 0);
    const lowStockProducts = products.filter(product => product.stock <= product.minStock);
    
    const toolbar = `
        <div class="report-toolbar" style="margin: 0 15px 20px 15px; padding: 12px 15px; background: #f8f9fa; border-radius: 8px;">
            <div class="filter-group" style="display: flex; gap: 8px; align-items: center;">
                <select id="reportPreset" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; min-width: 120px;"><option value="today">${isEn?'Today':'اليوم'}</option><option value="this_week">${isEn?'This week':'هذا الأسبوع'}</option><option value="last_7">${isEn?'Last 7 days':'آخر 7 أيام'}</option><option value="this_month" selected>${isEn?'This month':'هذا الشهر'}</option><option value="last_30">${isEn?'Last 30 days':'آخر 30 يوم'}</option><option value="custom">${isEn?'Custom':'مخصص'}</option></select>
                <input type="date" id="reportFromDate" style="display:none; padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px;">
                <input type="date" id="reportToDate" style="display:none; padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px;">
            </div>
            <div class="filter-group" style="display: flex; gap: 8px; align-items: center;">
                <button class="filter-btn" id="applyReportFilter" style="padding: 6px 12px; font-size: 13px;">${isEn?'Apply':'تطبيق'}</button>
                <button class="report-btn" id="exportInventoryCSV" style="padding: 6px 12px; font-size: 13px;">CSV</button>
                <button class="report-btn" id="exportInventoryPDF" style="padding: 6px 12px; font-size: 13px;">PDF</button>
            </div>
        </div>`;

    const reportHTML = `
        ${toolbar}
        <div class="report-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 0 15px 20px 15px;">
            <div class="stat-item" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 500;">${isEn ? 'Total Products' : 'إجمالي المنتجات'}</h4>
                <p class="stat-value" style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">${totalProducts}</p>
            </div>
            <div class="stat-item" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 500;">${isEn ? 'Stock Value' : 'قيمة المخزون'}</h4>
                <p class="stat-value" style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">${formatCurrency(totalStockValue)}</p>
            </div>
            <div class="stat-item" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 500;">${isEn ? 'Low Stock Products' : 'منتجات منخفضة المخزون'}</h4>
                <p class="stat-value" style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">${lowStockProducts.length}</p>
            </div>
        </div>
        
        <div class="table-container" style="margin: 0 15px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <table class="report-table" id="inventoryReportTable" style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th data-sort="name" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Product' : 'اسم المنتج'} <i class="fas fa-sort"></i></th>
                        <th data-sort="category" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Category' : 'التصنيف'} <i class="fas fa-sort"></i></th>
                        <th data-sort="stock" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${getText('stock')} <i class="fas fa-sort"></i></th>
                        <th data-sort="priceUSD" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Price' : 'السعر'} <i class="fas fa-sort"></i></th>
                        <th data-sort="totalValue" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Total Value' : 'القيمة الإجمالية'} <i class="fas fa-sort"></i></th>
                    </tr>
                </thead>
                <tbody id="inventoryReportTableBody">
                    <!-- سيتم ملء البيانات ديناميكياً -->
                </tbody>
            </table>
        </div>
        
        <!-- Pagination Controls -->
        <div id="inventoryPagination" class="pagination-container" style="display: flex; justify-content: space-between; align-items: center; margin: 20px 15px 15px 15px; padding: 12px 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div class="pagination-left" style="display: flex; align-items: center; gap: 8px;">
                <label for="inventoryRowsPerPage" style="font-size: 13px; color: #374151; font-weight: 500;">${getText('rows-per-page')}:</label>
                <select id="inventoryRowsPerPage" style="padding: 5px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: white; min-width: 60px;">
                    <option value="10">10</option>
                    <option value="25" selected>25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
            </div>
            
            <div class="pagination-center" style="display: flex; align-items: center; gap: 6px;">
                <button id="inventoryFirstPage" class="pagination-btn" style="padding: 6px 10px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" title="${getText('first')}">
                    <i class="fas fa-angle-double-left"></i>
                </button>
                <button id="inventoryPrevPage" class="pagination-btn" style="padding: 6px 10px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" title="${getText('previous')}">
                    <i class="fas fa-angle-left"></i>
                </button>
                <span id="inventoryCurrentPage" style="padding: 6px 12px; background: #3b82f6; color: white; border-radius: 6px; font-size: 13px; font-weight: 600; min-width: 30px; text-align: center;">1</span>
                <button id="inventoryNextPage" class="pagination-btn" style="padding: 6px 10px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" title="${getText('next')}">
                    <i class="fas fa-angle-right"></i>
                </button>
                <button id="inventoryLastPage" class="pagination-btn" style="padding: 6px 10px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" title="${getText('last')}">
                    <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
            
            <div class="pagination-right" style="font-size: 13px; color: #6b7280; font-weight: 500;">
                <span id="inventoryPageInfo">${getText('showing')} 1-25 ${getText('of')} ${totalProducts} ${getText('entries')}</span>
            </div>
        </div>
    `;
    
    reportContent.innerHTML = reportHTML;
    
    // إعداد pagination للمخزون
    setupInventoryPagination();
    
    document.getElementById('exportInventoryCSV')?.addEventListener('click', () => exportTableToCSV('inventory_report.csv'));
    document.getElementById('exportInventoryPDF')?.addEventListener('click', () => exportTableToPDF('Inventory Report'));
    showModal('reportModal');
}

function showCustomersReport() {
    // التحقق من كلمة السر أولاً
    if (!checkReportPassword()) {
        return;
    }
    
    // تحديث إجمالي المشتريات قبل عرض التقرير
    updateAllCustomersTotalPurchases();
    
    const reportContent = document.getElementById('reportContent');
    const reportTitle = document.getElementById('reportTitle');
    const isEn = (document.documentElement.lang || 'ar') === 'en';
    reportTitle.textContent = isEn ? 'Customers Report' : 'تقرير العملاء';
    
    const totalCustomers = customers.length;
    const totalCustomerPurchases = customers.reduce((sum, customer) => sum + customer.totalPurchases, 0);
    const averagePurchase = totalCustomerPurchases / totalCustomers || 0;
    const topCustomer = customers.reduce((prev, current) => 
        (prev.totalPurchases > current.totalPurchases) ? prev : current, customers[0]);
    
    const toolbar = `
        <div class="report-toolbar" style="margin: 0 15px 20px 15px; padding: 12px 15px; background: #f8f9fa; border-radius: 8px;">
            <div class="filter-group" style="display: flex; gap: 8px; align-items: center;">
                <select id="reportPreset" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; min-width: 120px;"><option value="today">${isEn?'Today':'اليوم'}</option><option value="this_week">${isEn?'This week':'هذا الأسبوع'}</option><option value="last_7">${isEn?'Last 7 days':'آخر 7 أيام'}</option><option value="this_month" selected>${isEn?'This month':'هذا الشهر'}</option><option value="last_30">${isEn?'Last 30 days':'آخر 30 يوم'}</option><option value="custom">${isEn?'Custom':'مخصص'}</option></select>
                <input type="date" id="reportFromDate" style="display:none; padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px;">
                <input type="date" id="reportToDate" style="display:none; padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px;">
            </div>
            <div class="filter-group" style="display: flex; gap: 8px; align-items: center;">
                <button class="filter-btn" id="applyReportFilter" style="padding: 6px 12px; font-size: 13px;">${isEn?'Apply':'تطبيق'}</button>
                <button class="report-btn" id="exportFinancialCSV" style="padding: 6px 12px; font-size: 13px;">CSV</button>
                <button class="report-btn" id="exportFinancialPDF" style="padding: 6px 12px; font-size: 13px;">PDF</button>
            </div>
        </div>`;

    const reportHTML = `
        ${toolbar}
        <div class="report-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 0 15px 20px 15px;">
            <div class="stat-item" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 500;">${isEn ? 'Total Customers' : 'إجمالي العملاء'}</h4>
                <p class="stat-value" style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">${totalCustomers}</p>
            </div>
            <div class="stat-item" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 500;">${isEn ? 'Total Customer Purchases' : 'إجمالي مشتريات العملاء'}</h4>
                <p class="stat-value" style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">${formatCurrency(totalCustomerPurchases)}</p>
            </div>
            <div class="stat-item" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 500;">${isEn ? 'Average Purchases' : 'متوسط المشتريات'}</h4>
                <p class="stat-value" style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">${formatCurrency(averagePurchase)}</p>
            </div>
            <div class="stat-item" style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 500;">${isEn ? 'Top Customer' : 'أفضل عميل'}</h4>
                <p class="stat-value" style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">${topCustomer ? topCustomer.name : (isEn ? 'N/A' : 'لا يوجد')}</p>
            </div>
        </div>
        
        <div class="table-container" style="margin: 0 15px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <table class="report-table" id="customersReportTable" style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th data-sort="name" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Customer Name' : 'اسم العميل'} <i class="fas fa-sort"></i></th>
                        <th data-sort="email" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Email' : 'البريد الإلكتروني'} <i class="fas fa-sort"></i></th>
                        <th data-sort="phone" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Phone' : 'الهاتف'} <i class="fas fa-sort"></i></th>
                        <th data-sort="totalPurchases" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Total Purchases' : 'إجمالي المشتريات'} <i class="fas fa-sort"></i></th>
                        <th data-sort="loyaltyPoints" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Loyalty Points' : 'نقاط الولاء'} <i class="fas fa-sort"></i></th>
                        <th data-sort="dateJoined" style="cursor: pointer; padding: 12px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isEn ? 'Join Date' : 'تاريخ الانضمام'} <i class="fas fa-sort"></i></th>
                    </tr>
                </thead>
                <tbody id="customersReportTableBody">
                    <!-- سيتم ملء البيانات ديناميكياً -->
                </tbody>
            </table>
        </div>
        
        <!-- Pagination Controls -->
        <div id="customersPagination" class="pagination-container" style="display: flex; justify-content: space-between; align-items: center; margin: 20px 15px 15px 15px; padding: 12px 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div class="pagination-left" style="display: flex; align-items: center; gap: 8px;">
                <label for="customersRowsPerPage" style="font-size: 13px; color: #374151; font-weight: 500;">${getText('rows-per-page')}:</label>
                <select id="customersRowsPerPage" style="padding: 5px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: white; min-width: 60px;">
                    <option value="10">10</option>
                    <option value="25" selected>25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
            </div>
            
            <div class="pagination-center" style="display: flex; align-items: center; gap: 6px;">
                <button id="customersFirstPage" class="pagination-btn" style="padding: 6px 10px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" title="${getText('first')}">
                    <i class="fas fa-angle-double-left"></i>
                </button>
                <button id="customersPrevPage" class="pagination-btn" style="padding: 6px 10px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" title="${getText('previous')}">
                    <i class="fas fa-angle-left"></i>
                </button>
                <span id="customersCurrentPage" style="padding: 6px 12px; background: #3b82f6; color: white; border-radius: 6px; font-size: 13px; font-weight: 600; min-width: 30px; text-align: center;">1</span>
                <button id="customersNextPage" class="pagination-btn" style="padding: 6px 10px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" title="${getText('next')}">
                    <i class="fas fa-angle-right"></i>
                </button>
                <button id="customersLastPage" class="pagination-btn" style="padding: 6px 10px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;" title="${getText('last')}">
                    <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
            
            <div class="pagination-right" style="font-size: 13px; color: #6b7280; font-weight: 500;">
                <span id="customersPageInfo">${getText('showing')} 1-25 ${getText('of')} ${totalCustomers} ${getText('entries')}</span>
            </div>
        </div>
    `;
    
    reportContent.innerHTML = reportHTML;
    
    // إعداد pagination للعملاء
    setupCustomersPagination();
    
    document.getElementById('exportFinancialCSV')?.addEventListener('click', () => exportTableToCSV('customers_report.csv'));
    document.getElementById('exportFinancialPDF')?.addEventListener('click', () => exportTableToPDF('Customers Report'));
    showModal('reportModal');
}

// ===== نظام Pagination لتقرير العملاء =====

// متغيرات pagination للعملاء
let customersCurrentPage = 1;
let customersPageSize = 25;
let customersSortBy = 'totalPurchases';
let customersSortDir = 'desc';
let customersFilteredData = [];

// إعداد pagination للعملاء
function setupCustomersPagination() {
    // تحميل الحالة المحفوظة
    loadCustomersPaginationState();
    
    // تطبيق البيانات والترتيب الأولي
    applyCustomersFilters();
    
    // إعداد event listeners
    setupCustomersPaginationEvents();
    
    // عرض البيانات
    renderCustomersTable();
}

// تحميل الحالة المحفوظة
function loadCustomersPaginationState() {
    try {
        const saved = sessionStorage.getItem('customersPaginationState');
        if (saved) {
            const state = JSON.parse(saved);
            customersCurrentPage = state.page || 1;
            customersPageSize = state.pageSize || 25;
            customersSortBy = state.sortBy || 'totalPurchases';
            customersSortDir = state.sortDir || 'desc';
        }
    } catch (e) {
        console.warn('Error loading pagination state:', e);
    }
}

// حفظ الحالة
function saveCustomersPaginationState() {
    try {
        const state = {
            page: customersCurrentPage,
            pageSize: customersPageSize,
            sortBy: customersSortBy,
            sortDir: customersSortDir
        };
        sessionStorage.setItem('customersPaginationState', JSON.stringify(state));
    } catch (e) {
        console.warn('Error saving pagination state:', e);
    }
}

// تطبيق الفلاتر والترتيب
function applyCustomersFilters() {
    customersFilteredData = [...customers];
    
    // تطبيق الترتيب
    customersFilteredData.sort((a, b) => {
        let aVal = a[customersSortBy];
        let bVal = b[customersSortBy];
        
        // معالجة التواريخ
        if (customersSortBy === 'dateJoined') {
            aVal = new Date(aVal || '1900-01-01');
            bVal = new Date(bVal || '1900-01-01');
        }
        
        // معالجة الأرقام
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return customersSortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // معالجة النصوص
        const aStr = String(aVal || '').toLowerCase();
        const bStr = String(bVal || '').toLowerCase();
        return customersSortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
}

// إعداد event listeners
function setupCustomersPaginationEvents() {
    // أزرار التنقل
    document.getElementById('customersFirstPage')?.addEventListener('click', () => goToCustomersPage(1));
    document.getElementById('customersPrevPage')?.addEventListener('click', () => goToCustomersPage(customersCurrentPage - 1));
    document.getElementById('customersNextPage')?.addEventListener('click', () => goToCustomersPage(customersCurrentPage + 1));
    document.getElementById('customersLastPage')?.addEventListener('click', () => goToCustomersPage(getCustomersTotalPages()));
    
    // تغيير عدد الصفوف
    document.getElementById('customersRowsPerPage')?.addEventListener('change', (e) => {
        customersPageSize = parseInt(e.target.value);
        customersCurrentPage = 1;
        saveCustomersPaginationState();
        renderCustomersTable();
    });
    
    // ترتيب الأعمدة
    document.querySelectorAll('#customersReportTable th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const sortBy = th.getAttribute('data-sort');
            if (customersSortBy === sortBy) {
                customersSortDir = customersSortDir === 'asc' ? 'desc' : 'asc';
            } else {
                customersSortBy = sortBy;
                customersSortDir = 'asc';
            }
            customersCurrentPage = 1;
            saveCustomersPaginationState();
            applyCustomersFilters();
            renderCustomersTable();
            updateSortIcons();
        });
    });
}

// التنقل إلى صفحة محددة
function goToCustomersPage(page) {
    const totalPages = getCustomersTotalPages();
    if (page >= 1 && page <= totalPages) {
        customersCurrentPage = page;
        saveCustomersPaginationState();
        renderCustomersTable();
    }
}

// حساب إجمالي الصفحات
function getCustomersTotalPages() {
    return Math.ceil(customersFilteredData.length / customersPageSize);
}

// عرض الجدول
function renderCustomersTable() {
    // تحديث إجمالي المشتريات قبل عرض الجدول
    updateAllCustomersTotalPurchases();
    
    const tbody = document.getElementById('customersReportTableBody');
    if (!tbody) return;
    
    const start = (customersCurrentPage - 1) * customersPageSize;
    const end = start + customersPageSize;
    const pageData = customersFilteredData.slice(start, end);
    
    const isEn = (document.documentElement.lang || 'ar') === 'en';
    
    tbody.innerHTML = pageData.map((customer, index) => `
        <tr style="border-bottom: 1px solid #f3f4f6; ${index % 2 === 0 ? 'background: #fafafa;' : 'background: white;'}">
            <td style="padding: 10px 8px; font-size: 13px; color: #1f2937;">${customer.name}</td>
            <td style="padding: 10px 8px; font-size: 13px; color: #6b7280;">${customer.email}</td>
            <td style="padding: 10px 8px; font-size: 13px; color: #6b7280;">${customer.phone}</td>
            <td style="padding: 10px 8px; font-size: 13px; color: #059669; font-weight: 600;">${formatCurrency(customer.totalPurchases)}</td>
            <td style="padding: 10px 8px; font-size: 13px; color: #1f2937; text-align: center;">${customer.loyaltyPoints || 0}</td>
            <td style="padding: 10px 8px; font-size: 13px; color: #6b7280;">${customer.dateJoined || (isEn ? 'Not set' : 'غير محدد')}</td>
        </tr>
    `).join('');
    
    updateCustomersPaginationUI();
}

// تحديث واجهة pagination
function updateCustomersPaginationUI() {
    const totalPages = getCustomersTotalPages();
    const totalItems = customersFilteredData.length;
    const start = (customersCurrentPage - 1) * customersPageSize + 1;
    const end = Math.min(customersCurrentPage * customersPageSize, totalItems);
    
    // تحديث معلومات الصفحة
    const pageInfo = document.getElementById('customersPageInfo');
    if (pageInfo) {
        pageInfo.textContent = `${getText('showing')} ${start}-${end} ${getText('of')} ${totalItems} ${getText('entries')}`;
    }
    
    // تحديث رقم الصفحة الحالية
    const currentPageSpan = document.getElementById('customersCurrentPage');
    if (currentPageSpan) {
        currentPageSpan.textContent = customersCurrentPage;
    }
    
    // تحديث حالة الأزرار
    const firstBtn = document.getElementById('customersFirstPage');
    const prevBtn = document.getElementById('customersPrevPage');
    const nextBtn = document.getElementById('customersNextPage');
    const lastBtn = document.getElementById('customersLastPage');
    
    const isFirst = customersCurrentPage === 1;
    const isLast = customersCurrentPage === totalPages;
    
    [firstBtn, prevBtn].forEach(btn => {
        if (btn) {
            btn.disabled = isFirst;
            btn.style.opacity = isFirst ? '0.5' : '1';
            btn.style.cursor = isFirst ? 'not-allowed' : 'pointer';
        }
    });
    
    [nextBtn, lastBtn].forEach(btn => {
        if (btn) {
            btn.disabled = isLast;
            btn.style.opacity = isLast ? '0.5' : '1';
            btn.style.cursor = isLast ? 'not-allowed' : 'pointer';
        }
    });
    
    // تحديث dropdown عدد الصفوف
    const rowsSelect = document.getElementById('customersRowsPerPage');
    if (rowsSelect) {
        rowsSelect.value = customersPageSize;
    }
}

// تحديث أيقونات الترتيب
function updateSortIcons() {
    document.querySelectorAll('#customersReportTable th[data-sort] i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    const currentTh = document.querySelector(`#customersReportTable th[data-sort="${customersSortBy}"]`);
    if (currentTh) {
        const icon = currentTh.querySelector('i');
        if (icon) {
            icon.className = customersSortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        }
    }
}

function showFinancialReport() {
    // التحقق من كلمة السر أولاً
    if (!checkReportPassword()) {
        return;
    }
    
    const reportContent = document.getElementById('reportContent');
    const reportTitle = document.getElementById('reportTitle');
    
    const isEn = (document.documentElement.lang || 'ar') === 'en';
    reportTitle.textContent = isEn ? 'Financial Report' : 'التقرير المالي';
    const range = window.currentReportRange || getRangeByPreset('this_month');
    const filtered = sales.filter(s => {
        try {
            const saleDate = new Date(s.date);
            if (isNaN(saleDate.getTime())) {
                console.warn('Invalid date in sale:', s);
                return false;
            }
            return saleDate >= range.from && saleDate <= range.to;
        } catch (error) {
            console.warn('Error filtering sale by date:', s, error);
            return false;
        }
    });
    const totalRevenue = filtered.reduce((sum, sale) => sum + sale.amount, 0);
    const totalTax = totalRevenue * 0.11;
    const netRevenue = totalRevenue - totalTax;
    const totalStockValue = products.reduce((sum, product) => sum + (product.stock * product.priceUSD), 0);
    
    // حساب المبيعات حسب طريقة الدفع
    const paymentMethods = {};
    filtered.forEach(sale => {
        paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.amount;
    });
    
    const reportHTML = `
        <div class="report-stats">
            <div class="stat-item">
                <h4>${isEn ? 'Total Revenue' : 'إجمالي الإيرادات'}</h4>
                <p class="stat-value">${formatCurrency(totalRevenue)}</p>
            </div>
            <div class="stat-item">
                <h4>${isEn ? 'Total Taxes' : 'إجمالي الضرائب'}</h4>
                <p class="stat-value">${formatCurrency(totalTax)}</p>
            </div>
            <div class="stat-item">
                <h4>${isEn ? 'Net Revenue' : 'صافي الإيرادات'}</h4>
                <p class="stat-value">${formatCurrency(netRevenue)}</p>
            </div>
            <div class="stat-item">
                <h4>${isEn ? 'Stock Value' : 'قيمة المخزون'}</h4>
                <p class="stat-value">${formatCurrency(totalStockValue)}</p>
            </div>
        </div>
        
        <h4>${isEn ? 'Sales by Payment Method:' : 'المبيعات حسب طريقة الدفع:'}</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>${isEn ? 'Payment Method' : 'طريقة الدفع'}</th>
                    <th>${isEn ? 'Amount' : 'المبلغ'}</th>
                    <th>${isEn ? 'Share' : 'النسبة'}</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(paymentMethods).map(([method, amount]) => `
                    <tr>
                        <td>${method}</td>
                        <td>${formatCurrency(amount)}</td>
                        <td>${((amount / totalRevenue) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h4>${isEn ? 'Monthly Sales:' : 'المبيعات الشهرية:'}</h4>
        <div class="monthly-sales">
            <p>${isEn ? 'This feature is under development - charts coming soon' : 'هذه الميزة قيد التطوير - ستتضمن رسوماً بيانية تفاعلية'}</p>
        </div>
    `;
    
    reportContent.innerHTML = reportHTML;
    showModal('reportModal');
}

// أدوات تصدير بسيطة معتمدة على جدول أول داخل المودال
function exportTableToCSV(filename) {
    try {
        const table = document.querySelector('#reportModal table');
        if (!table) { showMessage('لا يوجد جدول لتصديره', 'warning'); return; }
        let csv = [];
        table.querySelectorAll('tr').forEach(tr => {
            const row = [];
            tr.querySelectorAll('th,td').forEach(cell => {
                const text = (cell.innerText || '').replace(/\n/g, ' ').replace(/"/g, '""');
                row.push('"' + text + '"');
            });
            csv.push(row.join(','));
        });
        const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename || 'report.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch(e) { console.warn(e); }
}

function exportTableToPDF(title) {
    try {
        const printWindow = window.open('', '_blank');
        const modal = document.querySelector('#reportModal .modal-content');
        const content = modal ? modal.innerHTML : document.getElementById('reportContent').innerHTML;
        printWindow.document.write(`<!DOCTYPE html><html lang="ar"><head><meta charset="utf-8"><title>${title||'Report'}</title><style>body{font-family: Cairo, Arial; direction: rtl; padding:20px;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #ddd; padding:8px; text-align:right;} th{background:#f1f5f9;}</style></head><body>${content}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    } catch(e) { console.warn(e); }
}

// إعداد أحداث النسخ الاحتياطي والاستيراد
document.getElementById('exportDataBtn').addEventListener('click', exportData);
document.getElementById('importFile').addEventListener('change', importData);
document.getElementById('clearDataBtn').addEventListener('click', clearAllOperationalData);

// إعداد إعدادات النسخ الاحتياطي التلقائي
document.getElementById('autoBackupCheckbox').addEventListener('change', function() {
    settings.autoBackup = this.checked;
    saveToStorage('settings', settings);
    showMessage(this.checked ? 'تم تفعيل النسخ الاحتياطي التلقائي' : 'تم إلغاء النسخ الاحتياطي التلقائي');
});

// تصفية المبيعات بالتاريخ
document.getElementById('filterSales').addEventListener('click', function() {
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo')?.value || '';
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredSales = [...sales];
    
    // فلترة حسب التاريخ
    if (dateFrom) {
        filteredSales = filteredSales.filter(sale => {
            const saleDate = new Date(sale.date);
            const fromDate = new Date(dateFrom);
            if (dateTo) {
                const toDate = new Date(dateTo);
                return saleDate >= fromDate && saleDate <= toDate;
            }
            return saleDate >= fromDate;
        });
    }
    
    // فلترة حسب الحالة
    if (statusFilter !== 'all') {
        filteredSales = filteredSales.filter(sale => {
            switch(statusFilter) {
                case 'completed':
                    return !sale.returned;
                case 'returned':
                    return sale.returned && sale.returnType === 'full';
                case 'partial':
                    return sale.returned && sale.returnType === 'partial';
                default:
                    return true;
            }
        });
    }
    
    displayFilteredSales(filteredSales);
    
    // إظهار إحصائيات الفلترة
    const statusText = {
        'all': 'جميع المبيعات',
        'completed': 'المبيعات المكتملة',
        'returned': 'المبيعات المرجعة كاملة',
        'partial': 'المبيعات المرجعة جزئياً'
    };
    
    showMessage(`تم العثور على ${filteredSales.length} من ${statusText[statusFilter]} ${dateFrom && dateTo ? 'في الفترة المحددة' : ''}`);
});

// زر إعادة تعيين الفلترة
document.addEventListener('DOMContentLoaded', function() {
    const resetFilterBtn = document.getElementById('resetFilter');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', function() {
            const df = document.getElementById('dateFrom');
            const dt = document.getElementById('dateTo');
            if (df) df.value = '';
            if (dt) dt.value = '';
            document.getElementById('statusFilter').value = 'all';
            loadSales();
            showMessage('تم إعادة تعيين الفلترة');
        });
    }
});

function filterSalesByDate(dateFrom, dateTo) {
    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        
        return saleDate >= fromDate && saleDate <= toDate;
    });
    
    displayFilteredSales(filteredSales);
    showMessage(`تم العثور على ${filteredSales.length} معاملة في الفترة المحددة`);
}

function displayFilteredSales(filteredSales) {
    const tbody = document.getElementById('salesTable');
    tbody.innerHTML = '';
    
    const lsKey = 'sales.pageSize';
    let pageSize = parseInt(localStorage.getItem(lsKey)) || 15;
    const validSizes = [15, 25, 50, 100];
    if (!validSizes.includes(pageSize)) pageSize = 15;
    const total = filteredSales.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    let currentPage = parseInt(sessionStorage.getItem('sales.currentPage')) || 1;
    currentPage = Math.max(1, Math.min(totalPages, currentPage));
    const startIdx = (currentPage - 1) * pageSize;
    const pageItems = filteredSales.slice(startIdx, startIdx + pageSize);
    
    pageItems.forEach(sale => {
        // تحديد حالة المبيعة
        let statusClass = 'status-completed';
        let statusText = 'مكتملة';
        
        if (sale.returned) {
            if (sale.returnType === 'full') {
                statusClass = 'status-returned';
                statusText = 'مرجعة كاملة';
            } else if (sale.returnType === 'partial') {
                statusClass = 'status-partial-return';
                statusText = 'مرجعة جزئياً';
            }
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.invoiceNumber}</td>
            <td>${formatDateTime(sale.timestamp || sale.date, sale.paymentMethod)}</td>
            <td>${sale.customer}</td>
            <td>${formatCurrency(sale.amount)}</td>
            <td>${sale.paymentMethod}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="action-btn view-btn" onclick="viewSale(${sale.id})">
                    <i class="fas fa-eye"></i> عرض
                </button>
                ${!sale.returned ? 
                    `<button class="action-btn return-btn" onclick="initiateSaleReturn(${sale.id})">
                        <i class="fas fa-undo"></i> استرجاع
                    </button>` : 
                    `<button class="action-btn" disabled>
                        <i class="fas fa-check"></i> مرجعة
                    </button>`
                }
            </td>
        `;
        
        tbody.appendChild(row);
    });
   buildSalesPager({ total, pageSize, currentPage, totalPages });
    buildSalesPager({ total, pageSize, currentPage, totalPages });
}

// شريط ترقيم الصفحات للمبيعات
function buildSalesPager({ total, pageSize, currentPage, totalPages }) {
    const pagerWrap = document.getElementById('salesPager');
    const info = document.getElementById('salesCountInfo');
    if (!pagerWrap) return;
    const start = total === 0 ? 0 : ((currentPage - 1) * pageSize + 1);
    const end = Math.min(total, currentPage * pageSize);
    if (info) info.textContent = `عرض ${start}–${end} من إجمالي ${total}`;
    
    // مُبدّل حجم الصفحة
    let sizeSelect = document.getElementById('salesPageSize');
    if (!sizeSelect) {
        sizeSelect = document.createElement('select');
        sizeSelect.id = 'salesPageSize';
        sizeSelect.style.marginInlineStart = '8px';
        ['15','25','50','100'].forEach(v => {
            const opt = document.createElement('option');
            opt.value = v; opt.textContent = v;
            sizeSelect.appendChild(opt);
        });
        pagerWrap.prepend(sizeSelect);
    }
    sizeSelect.value = String(pageSize);
    sizeSelect.onchange = function(){
        localStorage.setItem('sales.pageSize', this.value);
        sessionStorage.setItem('sales.currentPage', '1');
        // إعادة التحميل مع الحفاظ على الفلاتر الحالية
        const term = (document.getElementById('salesSearch')?.value || '').trim().toLowerCase();
        if (term) {
            filterSalesTable(term);
        } else {
            loadSales();
        }
    };
    
    // أزرار التصفح
    let controls = document.getElementById('salesPagerControls');
    if (!controls) {
        controls = document.createElement('div');
        controls.id = 'salesPagerControls';
        controls.style.display = 'inline-flex';
        controls.style.gap = '6px';
        controls.style.alignItems = 'center';
        pagerWrap.appendChild(controls);
    }
    controls.innerHTML = '';
    function makeBtn(label, targetPage, disabled) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.className = 'action-btn';
        btn.style.padding = '6px 10px';
        btn.disabled = !!disabled;
        btn.onclick = function(){
            sessionStorage.setItem('sales.currentPage', String(targetPage));
            const term = (document.getElementById('salesSearch')?.value || '').trim().toLowerCase();
            if (term) {
                // إعادة تطبيق الفلترة الحالية
                filterSalesTable(term);
            } else {
                loadSales();
            }
        };
        return btn;
    }
    controls.appendChild(makeBtn('الأول', 1, currentPage === 1));
    controls.appendChild(makeBtn('السابق', Math.max(1, currentPage - 1), currentPage === 1));
    // أرقام الصفحات (نافذة صغيرة)
    const windowSize = 5;
    const startPage = Math.max(1, currentPage - Math.floor(windowSize/2));
    const endPage = Math.min(totalPages, startPage + windowSize - 1);
    for (let p = startPage; p <= endPage; p++) {
        const b = makeBtn(String(p), p, p === currentPage);
        if (p === currentPage) b.style.background = '#3b82f6', b.style.color = '#fff';
        controls.appendChild(b);
    }
    controls.appendChild(makeBtn('التالي', Math.min(totalPages, currentPage + 1), currentPage === totalPages));
    controls.appendChild(makeBtn('الأخير', totalPages, currentPage === totalPages));
}

// دعم البحث بالباركود - محسن لجميع أنواع قارئات الباركود
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        let barcodeBuffer = '';
        let barcodeTimeout;
        
        // دعم للباركودات التي تنتهي بـ Enter
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    console.log('تم مسح باركود:', searchTerm); // للتشخيص
                    searchByBarcode(searchTerm);
                }
            }
        });
        
        // تم دمج هذا الحدث مع الحدث السابق في loadPOS()
        
        // دعم للباركودات التي تصل كـ paste
        searchInput.addEventListener('paste', function(e) {
            setTimeout(() => {
                const value = this.value.trim();
                if (value.length >= 8 && /^\d+$/.test(value)) {
                    console.log('تم لصق باركود:', value); // للتشخيص
                    searchByBarcode(value);
                }
            }, 10);
        });
        
        // دعم للباركودات التي تصل كـ keyup (بعض القارئات)
        searchInput.addEventListener('keyup', function(e) {
            const value = this.value.trim();
            
            // إذا كان النص طويل وكلها أرقام
            if (value.length >= 8 && /^\d+$/.test(value)) {
                clearTimeout(barcodeTimeout);
                barcodeTimeout = setTimeout(() => {
                    console.log('تم مسح باركود (keyup):', value); // للتشخيص
                    searchByBarcode(value);
                }, 50);
            }
        });
        
        // دعم إضافي للقارئات التي ترسل البيانات بسرعة
        searchInput.addEventListener('keydown', function(e) {
            // منع إدخال النص العادي إذا كان الباركود قيد المسح
            const value = this.value.trim();
            if (value.length >= 8 && /^\d+$/.test(value)) {
                // إذا كان النص طويل وكلها أرقام، قد يكون باركود
                clearTimeout(barcodeTimeout);
                barcodeTimeout = setTimeout(() => {
                    console.log('تم مسح باركود (keydown):', value); // للتشخيص
                    searchByBarcode(value);
                }, 150);
            }
        });
        
        // دعم للقارئات التي ترسل البيانات كـ composition events
        searchInput.addEventListener('compositionend', function(e) {
            const value = this.value.trim();
            if (value.length >= 8 && /^\d+$/.test(value)) {
                console.log('تم مسح باركود (composition):', value); // للتشخيص
                searchByBarcode(value);
            }
        });
    }
});

// متغير لمنع التكرار في الباركود
let isProcessingBarcode = false;
let lastProcessedBarcode = '';
let barcodeTimeout;

function searchByBarcode(barcode) {
    // منع التكرار
    if (isProcessingBarcode) {
        console.log('تم تجاهل الباركود - جاري معالجة باركود آخر');
        return;
    }
    
    // منع معالجة نفس الباركود مرتين
    if (lastProcessedBarcode === barcode) {
        console.log('تم تجاهل الباركود - نفس الباركود السابق');
        return;
    }
    
    isProcessingBarcode = true;
    lastProcessedBarcode = barcode;
    
    console.log('=== بدء البحث عن الباركود ===');
    console.log('الباركود المستلم:', barcode);
    console.log('نوع البيانات:', typeof barcode);
    console.log('طول الباركود:', barcode.length);
    
    // فحص وتحديث catalog version
    checkAndUpdateProductsCatalog();
    
    // إعادة تحميل المنتجات من localStorage للتأكد من أحدث البيانات
    products = getCurrentProducts();
    
    // تنظيف الباركود من أي رموز إضافية
    const cleanBarcode = barcode.replace(/[^\d]/g, '');
    console.log('الباركود المنظف:', cleanBarcode); // للتشخيص
    
    // البحث بالباركود المطابق تماماً
    let product = products.find(p => p.barcode === cleanBarcode);
    
    // إذا لم يجد، جرب البحث بالباركود الأصلي
    if (!product) {
        product = products.find(p => p.barcode === barcode);
    }
    
    // إذا لم يجد، جرب البحث الجزئي
    if (!product) {
        product = products.find(p => p.barcode && p.barcode.includes(cleanBarcode));
    }
    
    if (product) {
        console.log('=== تم العثور على المنتج ===');
        console.log('اسم المنتج:', product.name);
        console.log('معرف المنتج:', product.id);
        console.log('الباركود:', product.barcode);
        console.log('الكمية المتاحة:', product.stock);
        
        // التحقق من توفر المنتج
        if (product.stock <= 0) {
            showMessage(`⚠️ المنتج ${product.name} غير متوفر في المخزون`, 'error');
            const searchInput = document.getElementById('productSearch');
            if (searchInput) {
                searchInput.value = '';
            }
            return;
        }
        
        console.log('=== بدء إضافة المنتج للعربة ===');
        // إضافة المنتج تلقائياً إلى العربة
        addToCart(product);
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        showMessage(`✅ تم إضافة ${product.name} إلى العربة بالباركود`, 'success');
        
        // رسالة إضافية للتأكيد
        console.log('✅ تم إضافة المنتج بنجاح للعربة');
        
        // إخفاء المنتجات بعد الإضافة
        displayProducts('');
        
        // إبراز العربة
        setTimeout(() => {
            const cartSection = document.querySelector('.cart-section');
            if (cartSection) {
                cartSection.classList.add('cart-flash');
                setTimeout(() => cartSection.classList.remove('cart-flash'), 800);
            }
        }, 100);
        
    } else {
        console.log('=== لم يتم العثور على منتج ===');
        console.log('الباركود المطلوب:', barcode);
        console.log('الباركود المنظف:', cleanBarcode);
        console.log('المنتجات المتاحة:', products.map(p => ({name: p.name, barcode: p.barcode})));
        
        // البحث بالاسم أو التصنيف كبديل
        displayProducts(barcode.toLowerCase());
        showMessage(`⚠️ لم يتم العثور على منتج بالباركود: ${barcode}`, 'warning');
    }
    
    // إعادة تعيين المتغيرات بعد انتهاء المعالجة
    setTimeout(() => {
        isProcessingBarcode = false;
        lastProcessedBarcode = '';
    }, 200);
}

// تحديث قوائم الموردين عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (dateFrom) dateFrom.value = today;
    if (dateTo) dateTo.value = today;
    
    // تعبئة حقول معلومات المتجر بالقيم الحالية
    const sn = document.getElementById('storeName');
    const sa = document.getElementById('storeAddress');
    const sp = document.getElementById('storePhone');
    if (sn) sn.value = settings.storeName || '';
    if (sa) sa.value = settings.storeAddress || '';
    if (sp) sp.value = settings.storePhone || '';

    const saveStoreBtn = document.getElementById('saveStoreInfo');
    if (saveStoreBtn) {
        saveStoreBtn.addEventListener('click', function() {
            const nameVal = (document.getElementById('storeName')?.value || '').trim();
            const addrVal = (document.getElementById('storeAddress')?.value || '').trim();
            const phoneVal = (document.getElementById('storePhone')?.value || '').trim();
            settings.storeName = nameVal;
            settings.storeAddress = addrVal;
            settings.storePhone = phoneVal;
            saveToStorage('settings', settings);
            // تحديث فوري للهيدر والفاتورة المقبلة
            const headerUser = document.getElementById('currentUser'); // placeholder, keep unchanged
            showNotification('✅ تم حفظ معلومات المتجر', 'success', 2500);
        });
    }
    
    // تحديث قوائم الموردين
    updateSuppliersDropdown('productSupplier');
    updateSuppliersDropdown('editProductSupplier');
    
    
    // تحديث حالة النسخ الاحتياطي التلقائي
    document.getElementById('autoBackupCheckbox').checked = settings.autoBackup;

    // إعداد event listener للمنتجات
    setupProductClickHandlers();

    // إعداد event listener لإظهار الوقت لجميع المبيعات
    const showTimeForAllSalesCheckbox = document.getElementById('showTimeForAllSalesCheckbox');
    if (showTimeForAllSalesCheckbox) {
        showTimeForAllSalesCheckbox.checked = settings.showTimeForAllSales || false;
        showTimeForAllSalesCheckbox.addEventListener('change', function() {
            settings.showTimeForAllSales = this.checked;
            saveToStorage('settings', settings);
            showMessage('تم حفظ الإعداد بنجاح');
            
            // إعادة تحميل جدول المبيعات إذا كان مفتوحاً
            if (document.getElementById('sales').style.display !== 'none') {
                loadSales();
            }
        });
    }

    // تم نقل event listeners للبحث إلى دوال loadProducts و loadSales و loadSuppliers

console.log('نظام إدارة المبيعات جاهز للاستخدام!');
});

// تحديث العربة الأفقية
function updateHorizontalCart(cartItems, currency) {
    const horizontalContainer = document.getElementById('cartItemsHorizontalPos');
    if (!horizontalContainer) return;
    
    horizontalContainer.innerHTML = '';
    
    cartItems.forEach((item, index) => {
        const priceType = item.selectedPriceType || currentPriceType;
        const price = getProductPrice(item, priceType, currency);
        const total = price * item.quantity;
        
        const cartItemHorizontal = document.createElement('div');
        cartItemHorizontal.className = 'cart-item-horizontal-pos';
        cartItemHorizontal.innerHTML = `
            <div class="cart-item-info-pos">
                <div class="cart-item-name-pos">${item.name}</div>
                <div class="cart-item-price-pos">${formatCurrency(price, currency)} × ${item.quantity}</div>
            </div>
            <div class="cart-item-controls-pos">
                <div class="quantity-controls-horizontal-pos">
                    <button class="quantity-btn-horizontal-pos" onclick="changeQuantity(${index}, -1)">-</button>
                    <span class="quantity-horizontal-pos">${item.quantity}</span>
                    <button class="quantity-btn-horizontal-pos" onclick="changeQuantity(${index}, 1)">+</button>
                </div>
                <button class="remove-btn-horizontal-pos" onclick="removeFromCart(${index})">×</button>
            </div>
        `;
        
        horizontalContainer.appendChild(cartItemHorizontal);
    });
}

// تحديث ملخص العربة الأفقية
function updateHorizontalCartSummary(totalItems, totalAmount) {
    const totalItemsElement = document.getElementById('totalItemsPos');
    const totalAmountElement = document.getElementById('totalAmountPos');
    
    if (totalItemsElement) {
        totalItemsElement.textContent = totalItems;
    }
    
    if (totalAmountElement) {
        const currency = document.getElementById('currency').value;
        totalAmountElement.textContent = formatCurrency(totalAmount, currency);
    }
}


// عرض المنتجات في التصميم الجديد
function displayProductsNew() {
    const container = document.getElementById('productsArea');
    if (!container) return;
    
    container.innerHTML = '';
    
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes('') ||
        product.category.toLowerCase().includes('')
    );
    
    filteredProducts.forEach(product => {
        const price = getProductPrice(product, currentPriceType, 'USD');
        const priceFormatted = formatCurrency(price, 'USD');
        
        const productCard = document.createElement('div');
        productCard.className = product.stock <= 0 ? 'product-card-new out-of-stock' : 'product-card-new';
        productCard.innerHTML = `
            <div class="product-info">
                <h4>${product.name}</h4>
                <div class="product-price">${priceFormatted}</div>
                <div class="product-stock">متوفر: ${product.stock}</div>
            </div>
        `;
        
        productCard.addEventListener('click', function() {
            addToCart(product);
            showMessage(`تم إضافة ${product.name} إلى العربة`, 'success');
        });
        
        container.appendChild(productCard);
    });
}

// تحديث العربة في التصميم الجديد
function updateCartNew() {
    const totalDisplay = document.getElementById('totalDisplay');
    if (!totalDisplay) return;
    
    let total = 0;
    let totalItems = 0;
    
    cart.forEach(item => {
        const priceType = item.selectedPriceType || currentPriceType;
        const price = getProductPrice(item, priceType, 'USD');
        total += price * item.quantity;
        totalItems += item.quantity;
    });
    
    totalDisplay.textContent = formatCurrency(total, 'USD');
}

// إعداد event listeners للمنتجات
function setupProductClickHandlers() {
    // لا نحتاج event delegation لأننا نستخدم event listeners مباشرة في displayProducts
}
// إضافة معالج للحساب التلقائي للأسعار
function setupPriceCalculations() {
    const exchangeRate = settings.exchangeRate;
    
    // عرض سعر الصرف الحالي
    const exchangeRateDisplay = document.getElementById('currentExchangeRate');
    if (exchangeRateDisplay) {
        exchangeRateDisplay.textContent = exchangeRate.toLocaleString();
    }
    
    // دالة لحساب وعرض السعر بالليرة
    function calculateAndDisplayLBP(usdInput, lbpDisplay) {
        if (!usdInput || !lbpDisplay) return;
        const usdPrice = parseFloat(usdInput.value) || 0;
        const lbpPrice = Math.round(usdPrice * exchangeRate);
        lbpDisplay.textContent = lbpPrice > 0 ? lbpPrice.toLocaleString() : '--';
    }
    
    // ربط المدخلات بالحساب التلقائي مع تأخير للتأكد من وجود العناصر
    setTimeout(() => {
        const retailUSDInput = document.getElementById('productRetailUSD');
        const wholesaleUSDInput = document.getElementById('productWholesaleUSD');
        const vipUSDInput = document.getElementById('productVipUSD');
        
        const retailLBPDisplay = document.getElementById('retailLBPDisplay');
        const wholesaleLBPDisplay = document.getElementById('wholesaleLBPDisplay');
        const vipLBPDisplay = document.getElementById('vipLBPDisplay');
        
        if (retailUSDInput && retailLBPDisplay) {
            // إزالة المستمع القديم إن وجد
            retailUSDInput.removeEventListener('input', retailUSDInput._handler);
            retailUSDInput._handler = () => calculateAndDisplayLBP(retailUSDInput, retailLBPDisplay);
            retailUSDInput.addEventListener('input', retailUSDInput._handler);
        }
        
        if (wholesaleUSDInput && wholesaleLBPDisplay) {
            wholesaleUSDInput.removeEventListener('input', wholesaleUSDInput._handler);
            wholesaleUSDInput._handler = () => calculateAndDisplayLBP(wholesaleUSDInput, wholesaleLBPDisplay);
            wholesaleUSDInput.addEventListener('input', wholesaleUSDInput._handler);
        }
        
        if (vipUSDInput && vipLBPDisplay) {
            vipUSDInput.removeEventListener('input', vipUSDInput._handler);
            vipUSDInput._handler = () => calculateAndDisplayLBP(vipUSDInput, vipLBPDisplay);
            vipUSDInput.addEventListener('input', vipUSDInput._handler);
        }
    }, 200);
}

// استدعاء الدالة عند تحميل الصفحة وإعداد معالج النموذج
document.addEventListener('DOMContentLoaded', function() {
    setupPriceCalculations();
    // إعداد حقلَي إجمالي الكلفة و Pay Now عند اختيار مورّد
    try {
        const supplierSel = document.getElementById('productSupplier');
        const costInp = document.getElementById('productCostUSD');
        const qtyInp = document.getElementById('productQuantity');
        const group = document.getElementById('supplierCostGroup');
        const totalDisp = document.getElementById('productTotalCostDisplay');
        const payNowInp = document.getElementById('productPayNow');
        function recalcTotalCost() {
            const hasSupplier = (supplierSel && supplierSel.value && supplierSel.value.trim() !== '');
            if (group) group.style.display = hasSupplier ? 'flex' : 'none';
            const cost = Number(costInp?.value) || 0;
            const qty = Math.max(0, parseInt(qtyInp?.value) || 0);
            const total = cost * qty;
            if (totalDisp) totalDisp.value = `$${total.toFixed(2)}`;
            if (payNowInp) {
                // لا تتجاوز الإجمالي
                let val = Number(payNowInp.value) || 0;
                if (val > total) val = total;
                if (val < 0) val = 0;
                payNowInp.value = val ? String(val) : '';
                payNowInp.max = String(total);
                payNowInp.min = '0';
            }
        }
        supplierSel && (supplierSel.onchange = recalcTotalCost);
        costInp && (costInp.oninput = recalcTotalCost);
        qtyInp && (qtyInp.oninput = recalcTotalCost);
        payNowInp && (payNowInp.oninput = recalcTotalCost);
        recalcTotalCost();
    } catch(_) {}
    
    // إعداد معالج حفظ المنتج
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(e) {
    e.preventDefault();
            console.log('تم الضغط على زر الحفظ');
            
            // التحقق من وجود الحقول
            const retailUSDInput = document.getElementById('productRetailUSD');
            const wholesaleUSDInput = document.getElementById('productWholesaleUSD');
            const vipUSDInput = document.getElementById('productVipUSD');
            
            if (!retailUSDInput || !wholesaleUSDInput || !vipUSDInput) {
                showMessage('خطأ: لا يمكن العثور على حقول الأسعار', 'error');
                return;
            }
            
            const retailUSD = parseFloat(retailUSDInput.value);
            const wholesaleUSD = parseFloat(wholesaleUSDInput.value);
            const vipUSD = parseFloat(vipUSDInput.value);
            
            console.log('الأسعار المدخلة:', { retailUSD, wholesaleUSD, vipUSD });
            
            // التحقق من صحة الأسعار
            if (isNaN(retailUSD) || isNaN(wholesaleUSD) || isNaN(vipUSD)) {
                showMessage('يرجى إدخال أسعار صحيحة لجميع الأنواع', 'error');
                return;
            }
            
            if (wholesaleUSD >= retailUSD) {
                showMessage('سعر الجملة يجب أن يكون أقل من سعر المفرق', 'error');
                return;
            }
            
            if (vipUSD < wholesaleUSD || vipUSD >= retailUSD) {
                showMessage('سعر الزبون المميز يجب أن يكون بين سعر الجملة وسعر المفرق', 'error');
                return;
            }
            
            const exchangeRate = settings.exchangeRate;
            console.log('سعر الصرف:', exchangeRate);
    
    const newProduct = {
        id: Math.max(...products.map(p => p.id), 0) + 1,
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
                prices: {
                    retail: {
                        USD: retailUSD,
                        LBP: Math.round(retailUSD * exchangeRate)
                    },
                    wholesale: {
                        USD: wholesaleUSD,
                        LBP: Math.round(wholesaleUSD * exchangeRate)
                    },
                    vip: {
                        USD: vipUSD,
                        LBP: Math.round(vipUSD * exchangeRate)
                    }
                },
                // للتوافق مع الكود القديم - استخدام سعر المفرق
                priceUSD: retailUSD,
                priceLBP: Math.round(retailUSD * exchangeRate),
        costUSD: parseFloat(document.getElementById('productCostUSD').value) || 0,
        stock: parseInt(document.getElementById('productQuantity').value),
        barcode: document.getElementById('productBarcode').value,
        supplier: document.getElementById('productSupplier').value,
        minStock: 5
    };
            
            console.log('المنتج الجديد:', newProduct);
    
    products.push(newProduct);
    saveToStorage('products', products);
    
    // تسجيل نفقة توريد المنتج تلقائياً
    try {
        const qty = Math.max(0, parseInt(document.getElementById('productQuantity').value) || 0);
        const unitCost = Number(document.getElementById('productCostUSD').value) || 0;
        
        if (qty > 0 && unitCost > 0) {
            recordProductSupplyExpense(newProduct.name, qty, unitCost, 'USD');
        }
    } catch(e) {
        console.warn('خطأ في تسجيل نفقة توريد المنتج:', e);
    }
    
    // إنشاء قيد شراء وفاتورة للمورد عند وجود مورّد
    try {
        const supplierName = (newProduct.supplier || '').trim();
        if (supplierName) {
            const sup = suppliers.find(s => s.name === supplierName);
            if (sup) {
                const supplierId = sup.id;
                const qty = Math.max(0, parseInt(document.getElementById('productQuantity').value) || 0);
                const unitCost = Number(document.getElementById('productCostUSD').value) || 0;
                const total = unitCost * qty; // USD
                let paidNow = Number(document.getElementById('productPayNow')?.value || 0) || 0;
                if (paidNow < 0) paidNow = 0;
                if (paidNow > total) paidNow = total;

                // أنشئ فاتورة شراء واحدة
                const bill = {
                    id: Math.max(0, ...purchases.map(p=>p.id)) + 1,
                    supplierId,
                    date: new Date().toISOString().split('T')[0],
                    dueDate: '',
                    currency: 'USD',
                    rate: exchangeRate,
                    items: [ { productId: newProduct.id, quantity: qty, price: unitCost } ],
                    total: total,
                    totalUSD: total,
                    paidUSD: paidNow,
                    status: 'unpaid'
                };
                recalcPurchaseStatus(bill);
                purchases.push(bill);

                // سجل دفتر الأستاذ PURCHASE
                addSupplierLedgerEntry({
                    supplier_id: supplierId,
                    type: 'PURCHASE',
                    ref_no: String(bill.id),
                    total_cost: total,
                    paid_now: paidNow,
                    remaining: Math.max(0, total - paidNow),
                    note: 'from Add Product',
                    currency: 'USD',
                    rate: exchangeRate
                });

                // إذا تم الدفع الآن، سجّل دفعة مورد وخزنة
                if (paidNow > 0) {
                    supplierPayments.push({
                        id: Math.max(0, ...supplierPayments.map(x=>x.id)) + 1,
                        supplierId,
                        date: new Date().toISOString(),
                        currency: 'USD',
                        amount: paidNow,
                        rate: exchangeRate,
                        method: 'cash',
                        appliedTo: [{ billId: bill.id, amountUSD: paidNow }]
                    });
                    recordSupplierPaymentCash(paidNow, 'USD', 'cash', `دفعة مورد (from Add Product) #${supplierId}`);
                }

                saveAllData();
                // تحديث واجهات المشتريات والموردين
                try { loadPurchases(); } catch(_) {}
                try { loadSuppliers(); } catch(_) {}
            }
        }
    } catch(_) {}
    loadProducts();
    hideModal('addProductModal');
    this.reset();
    
    // تحديث نقطة البيع إذا كانت مفتوحة حالياً
    console.log('🔄 تم إضافة المنتج، محاولة تحديث POS...');
    updatePOSIfActive();
    
    // إشعار جميع النوافذ المفتوحة بتحديث المنتجات
    notifyProductsUpdated();
    
    // تحديث إضافي مباشر لنقطة البيع
    setTimeout(() => {
        console.log('🔄 تحديث إضافي لنقطة البيع...');
        updatePOSIfActive();
    }, 100);
    
    // تحديث إضافي بعد تأخير أطول للتأكد
    setTimeout(() => {
        console.log('🔄 تحديث نهائي لنقطة البيع...');
        updatePOSIfActive();
    }, 500);
    
    // تحديث تنبيهات المخزون
    updateStockAlertsDashboard();
    
    // تحديث لوحة التحكم
    updateDashboardIfActive();
    
    showMessage('تم إضافة المنتج بنجاح', 'success');
    
            // مسح شاشات العرض
            const retailDisplay = document.getElementById('retailLBPDisplay');
            const wholesaleDisplay = document.getElementById('wholesaleLBPDisplay');
            const vipDisplay = document.getElementById('vipLBPDisplay');
            
            if (retailDisplay) retailDisplay.textContent = '--';
            if (wholesaleDisplay) wholesaleDisplay.textContent = '--';
            if (vipDisplay) vipDisplay.textContent = '--';
            
            showMessage('تم إضافة المنتج بنجاح! تم حساب الأسعار بالليرة تلقائياً 🎉');
            console.log('تم حفظ المنتج بنجاح');
        });
    }
});

// نظام استرجاع المبيعات
let currentSaleForReturn = null;

function initiateSaleReturn(saleIdOrNumber) {
    const key = String(saleIdOrNumber);
    currentSaleForReturn = sales.find(s => String(s.id) === key || String(s.invoiceNumber) === key);
    if (!currentSaleForReturn) {
        showMessage('لم يتم العثور على المبيعة', 'error');
        return;
    }
    
    if (currentSaleForReturn.returned) {
        showMessage('هذه المبيعة مرجعة مسبقاً', 'error');
        return;
    }
    
    // ملء بيانات المبيعة
    document.getElementById('returnInvoiceNumber').textContent = currentSaleForReturn.invoiceNumber;
    document.getElementById('returnCustomerName').textContent = currentSaleForReturn.customer;
    document.getElementById('returnTotalAmount').textContent = formatCurrency(currentSaleForReturn.amount);
    
    // عرض طريقة الدفع مع التفاصيل
    let paymentMethodText = currentSaleForReturn.paymentMethod;
    if (currentSaleForReturn.cashDetails) {
        const currency = currentSaleForReturn.cashDetails.paymentCurrency;
        const paid = currentSaleForReturn.cashDetails.amountPaid;
        if (currency === 'USD') {
            paymentMethodText += ` ($${paid.toFixed(2)})`;
        } else {
            paymentMethodText += ` (${paid.toLocaleString()} ل.ل)`;
        }
    } else if (currentSaleForReturn.partialDetails) {
        const currency = currentSaleForReturn.partialDetails.paymentCurrency;
        const paid = currentSaleForReturn.partialDetails.amountPaid;
        if (currency === 'USD') {
            paymentMethodText += ` - مدفوع: $${paid.toFixed(2)}`;
        } else {
            paymentMethodText += ` - مدفوع: ${paid.toLocaleString()} ل.ل`;
        }
    }
    document.getElementById('returnPaymentMethod').textContent = paymentMethodText;
    
    // إعادة تعيين النموذج
    const returnType = document.getElementById('returnType');
    const partialReturnAmount = document.getElementById('partialReturnAmount');
    const returnReason = document.getElementById('returnReason');
    const returnNotes = document.getElementById('returnNotes');
    
    if (returnType) returnType.value = 'full';
    if (partialReturnAmount) partialReturnAmount.value = '';
    if (returnReason) returnReason.value = 'defective';
    if (returnNotes) returnNotes.value = '';
    document.getElementById('partialAmountGroup').style.display = 'none';
    
    // تحديث ملخص الاسترجاع
    updateReturnSummary();
    
    // عرض النافذة
    showModal('returnSaleModal');
    try { translateReturnModalUI(); } catch(e) {}
}
function updateReturnSummary() {
    if (!currentSaleForReturn) return;
    
    const returnType = document.getElementById('returnType').value;
    const partialAmount = parseFloat(document.getElementById('partialReturnAmount').value) || 0;
    
    let refundDisplayText = '';
    let refundMethodText = '';
    
    if (currentSaleForReturn.cashDetails) {
        // مبيعة نقدية
        const originalCurrency = currentSaleForReturn.cashDetails.paymentCurrency;
        const originalPaid = currentSaleForReturn.cashDetails.amountPaid;
        
        if (returnType === 'full') {
            if (originalCurrency === 'USD') {
                refundDisplayText = `$${originalPaid.toFixed(2)}`;
            } else {
                refundDisplayText = `${originalPaid.toLocaleString()} ل.ل`;
            }
        } else if (returnType === 'partial') {
            const refundRatio = partialAmount / currentSaleForReturn.amount;
            const refundInOriginalCurrency = originalPaid * refundRatio;
            
            if (originalCurrency === 'USD') {
                refundDisplayText = `$${refundInOriginalCurrency.toFixed(2)}`;
            } else {
                refundDisplayText = `${refundInOriginalCurrency.toLocaleString()} ل.ل`;
            }
        }
        refundMethodText = (document.documentElement.lang === 'en') ? 'Cash' : 'نقدي';
        
    } else if (currentSaleForReturn.partialDetails) {
        // مبيعة جزئية
        const originalCurrency = currentSaleForReturn.partialDetails.paymentCurrency;
        const originalPaid = currentSaleForReturn.partialDetails.amountPaid;
        
        if (returnType === 'full') {
            if (originalCurrency === 'USD') {
                refundDisplayText = `$${originalPaid.toFixed(2)}`;
            } else {
                refundDisplayText = `${originalPaid.toLocaleString()} ل.ل`;
            }
        } else if (returnType === 'partial') {
            const refundRatio = partialAmount / currentSaleForReturn.amount;
            const refundInOriginalCurrency = Math.min(originalPaid * refundRatio, originalPaid);
            
            if (originalCurrency === 'USD') {
                refundDisplayText = `$${refundInOriginalCurrency.toFixed(2)}`;
            } else {
                refundDisplayText = `${refundInOriginalCurrency.toLocaleString()} ل.ل`;
            }
        }
        refundMethodText = 'نقدي (من المبلغ المدفوع)';
        
    } else {
        // مبيعة قديمة - افتراض
        let refundAmount = 0;
        if (returnType === 'full') {
            refundAmount = currentSaleForReturn.amount;
        } else if (returnType === 'partial') {
            refundAmount = Math.min(partialAmount, currentSaleForReturn.amount);
        }
        
        if (currentSaleForReturn.amount < 50) {
            refundDisplayText = `$${refundAmount.toFixed(2)}`;
        } else {
            refundDisplayText = `${(refundAmount * settings.exchangeRate).toLocaleString()} ل.ل`;
        }
        refundMethodText = 'نقدي';
    }
    
    document.getElementById('refundAmount').textContent = refundDisplayText;
    document.getElementById('refundMethod').textContent = refundMethodText;
}

function processReturn() {
    if (!currentSaleForReturn) {
        showMessage('خطأ في البيانات', 'error');
        return;
    }
    
    console.log('🔍 بدء عملية الاسترجاع للمبيعة:', currentSaleForReturn);
    
    const returnTypeEl = document.getElementById('returnType');
    const partialAmountEl = document.getElementById('partialReturnAmount');
    const returnReasonEl = document.getElementById('returnReason');
    const returnNotesEl = document.getElementById('returnNotes');
    
    if (!returnTypeEl || !returnReasonEl || !returnNotesEl) {
        console.error('❌ عناصر النموذج غير موجودة');
        showMessage('خطأ في واجهة الاسترجاع', 'error');
        return;
    }
    
    const returnType = returnTypeEl.value;
    const partialAmount = parseFloat(partialAmountEl ? partialAmountEl.value : '0') || 0;
    const returnReason = returnReasonEl.value;
    const returnNotes = returnNotesEl.value;
    
    console.log('📋 بيانات الاسترجاع:', { returnType, partialAmount, returnReason });
    
    // التحقق من صحة البيانات
    if (returnType === 'partial' && (partialAmount <= 0 || partialAmount > currentSaleForReturn.amount)) {
        showMessage('مبلغ الاسترجاع الجزئي غير صحيح', 'error');
        return;
    }
    
    // حساب مبلغ الاسترجاع
    let refundAmount = returnType === 'full' ? currentSaleForReturn.amount : partialAmount;
    
    // تحديث بيانات المبيعة
    currentSaleForReturn.returned = true;
    currentSaleForReturn.returnType = returnType;
    currentSaleForReturn.returnAmount = refundAmount;
    currentSaleForReturn.returnDate = new Date().toISOString().split('T')[0];
    currentSaleForReturn.returnReason = returnReason;
    currentSaleForReturn.returnNotes = returnNotes;
    
    // إرجاع المنتجات للمخزون
    if (currentSaleForReturn.items) {
        currentSaleForReturn.items.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                const returnQuantity = returnType === 'full' ? item.quantity : 
                    Math.floor((item.quantity * partialAmount) / currentSaleForReturn.amount);
                product.stock += returnQuantity;
            }
        });
    }
    
    // تحديث الصندوق - إرجاع المال
    if (currentSaleForReturn.paymentMethod === 'نقدي' || currentSaleForReturn.paymentMethod === 'دفع جزئي (دين)') {
        console.log('🔄 بدء تحديث الصندوق للاسترجاع - طريقة الدفع:', currentSaleForReturn.paymentMethod);
        
        // التأكد من تحميل الصندوق من التخزين
        cashDrawer = loadFromStorage('cashDrawer', {
            cashUSD: 100.00,
            cashLBP: 500000,
            lastUpdate: new Date().toISOString(),
            transactions: []
        });
        
        console.log('🏦 بيانات الصندوق المحملة:', cashDrawer);
        let refundDetails = [];
        
        if (currentSaleForReturn.cashDetails) {
            // مبيعة نقدية
            const originalCurrency = currentSaleForReturn.cashDetails.paymentCurrency;
            const originalPaid = currentSaleForReturn.cashDetails.amountPaid;
            
            console.log('💰 تفاصيل المبيعة النقدية:', { originalCurrency, originalPaid, returnType });
            console.log('💳 الصندوق قبل الاسترجاع:', { USD: cashDrawer.cashUSD, LBP: cashDrawer.cashLBP });
            
            if (returnType === 'full') {
                // استرجاع كامل - نرجع نفس المبلغ والعملة المدفوعة
                if (originalCurrency === 'USD') {
                    cashDrawer.cashUSD -= originalPaid;
                    refundDetails.push(`$${originalPaid.toFixed(2)}`);
                    console.log('💵 تم خصم من الدولار:', originalPaid);
                } else {
                    cashDrawer.cashLBP -= originalPaid;
                    refundDetails.push(`${originalPaid.toLocaleString()} ل.ل`);
                    console.log('💴 تم خصم من الليرة:', originalPaid);
                }
            } else {
                // استرجاع جزئي - نحسب النسبة
                const refundRatio = partialAmount / currentSaleForReturn.amount;
                const refundInOriginalCurrency = originalPaid * refundRatio;
                
                if (originalCurrency === 'USD') {
                    cashDrawer.cashUSD -= refundInOriginalCurrency;
                    refundDetails.push(`$${refundInOriginalCurrency.toFixed(2)}`);
                } else {
                    cashDrawer.cashLBP -= refundInOriginalCurrency;
                    refundDetails.push(`${refundInOriginalCurrency.toLocaleString()} ل.ل`);
                }
            }
        } else if (currentSaleForReturn.partialDetails) {
            // مبيعة جزئية - نرجع فقط المبلغ المدفوع
            const originalCurrency = currentSaleForReturn.partialDetails.paymentCurrency;
            const originalPaid = currentSaleForReturn.partialDetails.amountPaid;
            
            if (returnType === 'full') {
                if (originalCurrency === 'USD') {
                    cashDrawer.cashUSD -= originalPaid;
                    refundDetails.push(`$${originalPaid.toFixed(2)}`);
                } else {
                    cashDrawer.cashLBP -= originalPaid;
                    refundDetails.push(`${originalPaid.toLocaleString()} ل.ل`);
                }
            } else {
                // استرجاع جزئي للمبيعة الجزئية
                const refundRatio = partialAmount / currentSaleForReturn.amount;
                const refundInOriginalCurrency = Math.min(originalPaid * refundRatio, originalPaid);
                
                if (originalCurrency === 'USD') {
                    cashDrawer.cashUSD -= refundInOriginalCurrency;
                    refundDetails.push(`$${refundInOriginalCurrency.toFixed(2)}`);
                } else {
                    cashDrawer.cashLBP -= refundInOriginalCurrency;
                    refundDetails.push(`${refundInOriginalCurrency.toLocaleString()} ل.ل`);
                }
            }
        } else {
            // مبيعة قديمة بدون تفاصيل - افتراض بالدولار
            if (currentSaleForReturn.amount < 50) { // افتراض مبالغ صغيرة بالدولار
                cashDrawer.cashUSD -= refundAmount;
                refundDetails.push(`$${refundAmount.toFixed(2)}`);
            } else {
                // تحويل للليرة
                const refundLBP = refundAmount * settings.exchangeRate;
                cashDrawer.cashLBP -= refundLBP;
                refundDetails.push(`${refundLBP.toLocaleString()} ل.ل`);
            }
        }
        
        // إضافة سجل معاملة
        cashDrawer.transactions.push({
            timestamp: new Date().toISOString(),
            type: 'refund',
            amount: refundAmount,
            description: `استرجاع ${returnType === 'full' ? 'كامل' : 'جزئي'} للفاتورة ${currentSaleForReturn.invoiceNumber} - المبلغ المرجع: ${refundDetails.join(' + ')}`,
            balanceAfter: {
                USD: cashDrawer.cashUSD,
                LBP: cashDrawer.cashLBP
            }
        });
        
        cashDrawer.lastUpdate = new Date().toISOString();
        console.log('💳 الصندوق بعد الاسترجاع:', { USD: cashDrawer.cashUSD, LBP: cashDrawer.cashLBP });
        saveToStorage('cashDrawer', cashDrawer);
        updateCashDrawerDisplay();
        console.log('✅ تم حفظ الصندوق وتحديث العرض');
    } else {
        console.log('❌ لم يتم تحديث الصندوق - طريقة الدفع:', currentSaleForReturn.paymentMethod);
    }
    
    // في حالة البيع بالدَّين: تقليل دين العميل
    try {
        const pm = String(currentSaleForReturn.paymentMethod || '').toLowerCase();
        const isCreditSale = pm.includes('credit') || (currentSaleForReturn.invoiceNumber || '').startsWith('CR-') || currentSaleForReturn.paymentMethod === 'credit';
        if (isCreditSale && currentSaleForReturn.customerId) {
            const customer = customers.find(c => c.id === currentSaleForReturn.customerId);
            if (customer) {
                const before = customer.creditBalance || 0;
                customer.creditBalance = Math.max(0, before - refundAmount);
                customer.currentDebt = customer.creditBalance;
                if (!Array.isArray(customer.creditHistory)) customer.creditHistory = [];
                customer.creditHistory.push({
                    timestamp: new Date().toISOString(),
                    type: 'refund',
                    amount: -refundAmount,
                    description: `استرجاع على الفاتورة ${currentSaleForReturn.invoiceNumber}`,
                    balanceAfter: customer.creditBalance
                });
                saveToStorage('customers', customers);
                // سجل العميل العام
                const logs = loadFromStorage('customerLogs', {});
                const key = String(customer.id);
                if (!Array.isArray(logs[key])) logs[key] = [];
                logs[key].push({
                    timestamp: new Date().toLocaleString(),
                    action: 'استرجاع (دين)',
                    user: (currentUser || 'المستخدم'),
                    note: `تم استرجاع بقيمة ${formatCurrency(refundAmount)} من الفاتورة ${currentSaleForReturn.invoiceNumber}`
                });
                saveToStorage('customerLogs', logs);
            }
        }
    } catch (e) {
        console.warn('refund credit adjust error', e);
    }
    
    // توليد فاتورة استرجاع للطباعة والتوثيق
    try {
        const ratio = currentSaleForReturn.returnType === 'full' ? 1 : (refundAmount / (currentSaleForReturn.amount || 1));
        const returnedItems = (currentSaleForReturn.items || []).map(it => ({
            id: it.id,
            name: it.name,
            quantity: Math.max(1, Math.floor((it.quantity || 1) * ratio)),
            price: it.price,
            originalPriceUSD: it.originalPriceUSD,
            finalPriceUSD: it.finalPriceUSD,
            discountUSD: it.discountUSD,
            discountPct: it.discountPct
        }));
        const now = new Date();
        const localDateTimeISO = getLocalDateTimeISO();
        const refundInvoice = {
            id: generateInvoiceId(),
            invoiceNumber: `RF-${(sales.length + 1).toString().padStart(3, '0')}`,
            customerId: currentSaleForReturn.customerId,
            customer: currentSaleForReturn.customer,
            amount: refundAmount,
            paymentMethod: 'refund',
            status: 'completed',
            date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
            timestamp: localDateTimeISO, // استخدام timestamp محلي صحيح
            items: returnedItems
        };
        sales.push(refundInvoice);
        saveToStorage('sales', sales);
        // سجل المبيعات العام - استخدام نفس timestamp الفاتورة
        const salesLogs = loadFromStorage('salesLogs', []);
        salesLogs.push({
            timestamp: refundInvoice.timestamp, // استخدام نفس timestamp الفاتورة المحلي الحقيقي
            invoiceNumber: refundInvoice.invoiceNumber,
            amount: -refundAmount,
            currency: 'USD',
            method: 'refund',
            customer: currentSaleForReturn.customer || '-',
            user: currentUser || 'المستخدم'
        });
        saveToStorage('salesLogs', salesLogs);
        // عرض فاتورة الاسترجاع
        try { showInvoice(refundInvoice); } catch(e) {}
    } catch (e) {
        console.warn('generate refund invoice error', e);
    }
    
    
    // حفظ البيانات المحدثة
    saveToStorage('sales', sales);
    saveToStorage('products', products);
    
    // تحديث الواجهات
    loadSales();
    displayProducts();
    
    // تحديث تنبيهات المخزون
    updateStockAlertsDashboard();
    
    // تحديث لوحة التحكم
    updateDashboardIfActive();
    
    // إخفاء النافذة
    hideModal('returnSaleModal');
    
    // إظهار رسالة نجاح مع تفاصيل المبلغ المرجع
    const refundText = refundDetails.length > 0 ? refundDetails.join(' + ') : formatCurrency(refundAmount);
    showMessage(`✅ تم استرجاع المبيعة بنجاح! تم رد ${refundText} للعميل`, 'success');
    
    currentSaleForReturn = null;
}

// ربط الأحداث للنافذة
document.addEventListener('DOMContentLoaded', function() {
    // ربط تغيير نوع الاسترجاع
    const returnTypeSelect = document.getElementById('returnType');
    if (returnTypeSelect) {
        returnTypeSelect.addEventListener('change', function() {
            const partialGroup = document.getElementById('partialAmountGroup');
            if (this.value === 'partial') {
                partialGroup.style.display = 'block';
            } else {
                partialGroup.style.display = 'none';
            }
            updateReturnSummary();
        });
    }
    
    // ربط تحديث المبلغ الجزئي
    const partialAmountInput = document.getElementById('partialReturnAmount');
    if (partialAmountInput) {
        partialAmountInput.addEventListener('input', updateReturnSummary);
    }
});

// تحسين نظام الإشعارات
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // تحويل الأسطر الجديدة إلى <br> للعرض الصحيح
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <div class="notification-text">${formattedMessage}</div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار تلقائياً
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// فحص المخزون المنخفض وإرسال إشعارات
function checkLowStock() {
    if (!settings.lowStockAlert) return;
    
    const threshold = settings.lowStockThreshold || 10;
    const lowStockProducts = products.filter(product => 
        product && 
        product.name && 
        typeof product.stock === 'number' && 
        product.stock <= threshold
    );
    
    if (lowStockProducts.length > 0) {
        // إنشاء قائمة مفصلة للمنتجات منخفضة المخزون
        const isEn = (document.documentElement.lang || 'ar') === 'en';
        const stockOut = isEn ? 'Out of Stock' : 'نفد المخزون';
        const stockCritical = isEn ? 'Critical Stock' : 'مخزون حرج';
        const stockLow = isEn ? 'Low Stock' : 'مخزون منخفض';
        const piece = isEn ? 'piece' : 'قطعة';
        const warningTitle = isEn ? 'Low Stock Warning' : 'تحذير مخزون منخفض';
        const limitText = isEn ? 'limit' : 'حد';
        
        const productList = lowStockProducts
            .map(p => {
                const stockStatus = p.stock === 0 ? stockOut : 
                                  p.stock <= 3 ? stockCritical : 
                                  stockLow;
                return `• ${p.name}: ${p.stock} ${piece} (${stockStatus})`;
            })
            .join('\n');
            
        const message = `⚠️ ${warningTitle} (${limitText}: ${threshold} ${piece})\n\n${productList}`;
        showNotification(message, 'warning', 10000);
    }
}

// فحص المخزون كل دقيقة
setInterval(checkLowStock, 60000);

// دالة لاختبار تنبيهات المخزون (للتطوير)
function testLowStockAlert() {
    const threshold = settings.lowStockThreshold || 10;
    const testProducts = products.filter(p => p.stock <= threshold).slice(0, 3);
    
    if (testProducts.length > 0) {
        const isEn = (document.documentElement.lang || 'ar') === 'en';
        const stockOut = isEn ? 'Out of Stock' : 'نفد المخزون';
        const stockCritical = isEn ? 'Critical Stock' : 'مخزون حرج';
        const stockLow = isEn ? 'Low Stock' : 'مخزون منخفض';
        const piece = isEn ? 'piece' : 'قطعة';
        const testTitle = isEn ? 'Test Low Stock Warning' : 'اختبار تحذير مخزون منخفض';
        const limitText = isEn ? 'limit' : 'حد';
        
        const productList = testProducts
            .map(p => {
                const stockStatus = p.stock === 0 ? stockOut : 
                                  p.stock <= 3 ? stockCritical : 
                                  stockLow;
                return `• ${p.name}: ${p.stock} ${piece} (${stockStatus})`;
            })
            .join('\n');
            
        const message = `🧪 ${testTitle} (${limitText}: ${threshold} ${piece})\n\n${productList}`;
        showNotification(message, 'warning', 8000);
    } else {
        const isEn = (document.documentElement.lang || 'ar') === 'en';
        const noLowStockMsg = isEn ? '✅ No low stock products for testing' : '✅ لا توجد منتجات منخفضة المخزون للاختبار';
        showNotification(noLowStockMsg, 'info', 3000);
    }
}

// تحديث لوحة التحكم إذا كانت مفتوحة
function updateDashboardIfActive() {
    const dashboardPage = document.getElementById('dashboard');
    if (dashboardPage && dashboardPage.classList.contains('active')) {
        // تحديث مباشر بدون استدعاء loadDashboard لتجنب التكرار اللانهائي
        updateDashboardDirectly();
    }
}

// تحديث مباشر للوحة التحكم
function updateDashboardDirectly() {
    try {
        // إعادة تحميل البيانات من التخزين المحلي
        const currentProducts = loadFromStorage('products', []);
        const currentCustomers = loadFromStorage('customers', []);
        const currentSales = loadFromStorage('sales', []);
        
        // حساب إيرادات اليوم
        const today = new Date().toISOString().split('T')[0];
        const todaySales = currentSales.filter(sale => {
            try {
                const dateValue = sale.timestamp || sale.date;
                const saleDate = new Date(dateValue);
                if (isNaN(saleDate.getTime())) return false;
                return saleDate.toISOString().split('T')[0] === today;
            } catch (error) {
                return false;
            }
        });
        const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
        
        // تحديث العناصر مباشرة
        const todayRevenueEl = document.getElementById('todayRevenue');
        const todaySalesEl = document.getElementById('todaySales');
        const totalProductsEl = document.getElementById('totalProducts');
        const totalCustomersEl = document.getElementById('totalCustomers');
        
        if (todayRevenueEl) {
            todayRevenueEl.textContent = formatCurrency(todayRevenue, 'USD');
        }
        if (todaySalesEl) {
            todaySalesEl.textContent = todaySales.length;
        }
        if (totalProductsEl) {
            totalProductsEl.textContent = currentProducts.length;
        }
        if (totalCustomersEl) {
            totalCustomersEl.textContent = currentCustomers.length;
        }
        
        console.log('تم تحديث لوحة التحكم مباشرة:', {
            todayRevenue: todayRevenue,
            todaySales: todaySales.length,
            totalProducts: currentProducts.length,
            totalCustomers: currentCustomers.length
        });
        
    } catch (error) {
        console.error('خطأ في تحديث لوحة التحكم مباشرة:', error);
    }
}

// دالة لاختبار لوحة التحكم
function testDashboard() {
    console.log('=== اختبار لوحة التحكم ===');
    console.log('المنتجات:', products.length);
    console.log('العملاء:', customers.length);
    console.log('المبيعات:', sales.length);
    
    // إضافة بيانات تجريبية للاختبار
    const testSale = {
        id: sales.length + 1,
        invoiceNumber: `TEST-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        customer: 'عميل تجريبي',
        amount: 50.00,
        paymentMethod: 'نقدي',
        items: []
    };
    
    sales.push(testSale);
    saveToStorage('sales', sales);
    
    // تحديث لوحة التحكم
    loadDashboard();
    
    showNotification('✅ تم اختبار لوحة التحكم - تم إضافة بيع تجريبي', 'success', 3000);
}

// دالة لإصلاح لوحة التحكم
function fixDashboard() {
    console.log('=== إصلاح لوحة التحكم ===');
    
    // إعادة تحميل جميع البيانات
    products = getCurrentProducts();
    customers = loadFromStorage('customers', []);
    sales = loadFromStorage('sales', []);
    
    console.log('البيانات المحملة:', {
        products: products.length,
        customers: customers.length,
        sales: sales.length
    });
    
    // إجبار تحديث لوحة التحكم
    loadDashboard();
    
    // إجبار تحديث العناصر مباشرة
    const todayRevenueEl = document.getElementById('todayRevenue');
    const todaySalesEl = document.getElementById('todaySales');
    const totalProductsEl = document.getElementById('totalProducts');
    const totalCustomersEl = document.getElementById('totalCustomers');
    
    if (todayRevenueEl) {
        const today = new Date().toISOString().split('T')[0];
        const todaySales = sales.filter(sale => {
            try {
                const dateValue = sale.timestamp || sale.date;
                const saleDate = new Date(dateValue);
                if (isNaN(saleDate.getTime())) return false;
                return saleDate.toISOString().split('T')[0] === today;
            } catch (error) {
                return false;
            }
        });
        const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
        todayRevenueEl.textContent = formatCurrency(todayRevenue, 'USD');
        console.log('تم تحديث إيرادات اليوم:', todayRevenue);
    }
    
    if (todaySalesEl) {
        const today = new Date().toISOString().split('T')[0];
        const todaySales = sales.filter(sale => {
            try {
                const dateValue = sale.timestamp || sale.date;
                const saleDate = new Date(dateValue);
                if (isNaN(saleDate.getTime())) return false;
                return saleDate.toISOString().split('T')[0] === today;
            } catch (error) {
                return false;
            }
        });
        todaySalesEl.textContent = todaySales.length;
        console.log('تم تحديث مبيعات اليوم:', todaySales.length);
    }
    
    if (totalProductsEl) {
        totalProductsEl.textContent = products.length;
        console.log('تم تحديث إجمالي المنتجات:', products.length);
    }
    
    if (totalCustomersEl) {
        totalCustomersEl.textContent = customers.length;
        console.log('تم تحديث إجمالي العملاء:', customers.length);
    }
    
    showNotification('✅ تم إصلاح لوحة التحكم', 'success', 3000);
}

// دالة تشخيص لوحة التحكم
function diagnoseDashboard() {
    console.log('=== تشخيص لوحة التحكم ===');
    
    // فحص العناصر في HTML
    const todayRevenueEl = document.getElementById('todayRevenue');
    const todaySalesEl = document.getElementById('todaySales');
    const totalProductsEl = document.getElementById('totalProducts');
    const totalCustomersEl = document.getElementById('totalCustomers');
    
    console.log('العناصر الموجودة:', {
        todayRevenue: !!todayRevenueEl,
        todaySales: !!todaySalesEl,
        totalProducts: !!totalProductsEl,
        totalCustomers: !!totalCustomersEl
    });
    
    // فحص البيانات
    console.log('البيانات الحالية:', {
        products: products.length,
        customers: customers.length,
        sales: sales.length
    });
    
    // فحص التخزين المحلي
    const storedProducts = loadFromStorage('products', []);
    const storedCustomers = loadFromStorage('customers', []);
    const storedSales = loadFromStorage('sales', []);
    
    console.log('البيانات في التخزين المحلي:', {
        products: storedProducts.length,
        customers: storedCustomers.length,
        sales: storedSales.length
    });
    
    // فحص مبيعات اليوم
    const today = new Date().toISOString().split('T')[0];
    const todaySales = storedSales.filter(sale => {
        try {
            const dateValue = sale.timestamp || sale.date;
            const saleDate = new Date(dateValue);
            if (isNaN(saleDate.getTime())) return false;
            return saleDate.toISOString().split('T')[0] === today;
        } catch (error) {
            return false;
        }
    });
    const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    
    console.log('مبيعات اليوم:', {
        today: today,
        todaySales: todaySales.length,
        todayRevenue: todayRevenue,
        salesData: todaySales
    });
    
    // محاولة إصلاح
    if (todayRevenueEl) {
        todayRevenueEl.textContent = formatCurrency(todayRevenue, 'USD');
        console.log('✅ تم تحديث إيرادات اليوم');
    } else {
        console.log('❌ عنصر إيرادات اليوم غير موجود');
    }
    
    if (todaySalesEl) {
        todaySalesEl.textContent = todaySales.length;
        console.log('✅ تم تحديث مبيعات اليوم');
    } else {
        console.log('❌ عنصر مبيعات اليوم غير موجود');
    }
    
    if (totalProductsEl) {
        totalProductsEl.textContent = storedProducts.length;
        console.log('✅ تم تحديث إجمالي المنتجات');
    } else {
        console.log('❌ عنصر إجمالي المنتجات غير موجود');
    }
    
    if (totalCustomersEl) {
        totalCustomersEl.textContent = storedCustomers.length;
        console.log('✅ تم تحديث إجمالي العملاء');
    } else {
        console.log('❌ عنصر إجمالي العملاء غير موجود');
    }
    
    showNotification('✅ تم تشخيص لوحة التحكم - راجع وحدة التحكم', 'info', 5000);
}

// دالة لإجبار تحديث لوحة التحكم
function forceUpdateDashboard() {
    console.log('=== إجبار تحديث لوحة التحكم ===');
    
    // إعادة تحميل البيانات
    products = getCurrentProducts();
    customers = loadFromStorage('customers', []);
    sales = loadFromStorage('sales', []);
    
    // إجبار تحديث العناصر
    const todayRevenueEl = document.getElementById('todayRevenue');
    const todaySalesEl = document.getElementById('todaySales');
    const totalProductsEl = document.getElementById('totalProducts');
    const totalCustomersEl = document.getElementById('totalCustomers');
    
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(sale => {
        try {
            const dateValue = sale.timestamp || sale.date;
            const saleDate = new Date(dateValue);
            if (isNaN(saleDate.getTime())) return false;
            return saleDate.toISOString().split('T')[0] === today;
        } catch (error) {
            return false;
        }
    });
    const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    
    if (todayRevenueEl) {
        todayRevenueEl.textContent = formatCurrency(todayRevenue, 'USD');
        todayRevenueEl.style.color = 'red';
        setTimeout(() => todayRevenueEl.style.color = '', 2000);
    }
    
    if (todaySalesEl) {
        todaySalesEl.textContent = todaySales.length;
        todaySalesEl.style.color = 'red';
        setTimeout(() => todaySalesEl.style.color = '', 2000);
    }
    
    if (totalProductsEl) {
        totalProductsEl.textContent = products.length;
        totalProductsEl.style.color = 'red';
        setTimeout(() => totalProductsEl.style.color = '', 2000);
    }
    
    if (totalCustomersEl) {
        totalCustomersEl.textContent = customers.length;
        totalCustomersEl.style.color = 'red';
        setTimeout(() => totalCustomersEl.style.color = '', 2000);
    }
    
    console.log('تم إجبار التحديث:', {
        todayRevenue: todayRevenue,
        todaySales: todaySales.length,
        totalProducts: products.length,
        totalCustomers: customers.length
    });
    
    showNotification('✅ تم إجبار تحديث لوحة التحكم', 'success', 3000);
}

// دالة لإيقاف التكرار اللانهائي
function stopDashboardLoop() {
    console.log('تم إيقاف التكرار اللانهائي في لوحة التحكم');
    // إعادة تحميل الصفحة لإيقاف التكرار
    if (confirm('هل تريد إعادة تحميل الصفحة لإيقاف التكرار اللانهائي؟')) {
        location.reload();
    }
}

// تحديث تنبيهات المخزون في لوحة التحكم
function updateStockAlertsDashboard() {
    const alertsList = document.getElementById('stockAlertsList');
    if (!alertsList) return;
    
    const isEn = (document.documentElement.lang || 'ar') === 'en';
    const t = isEn ? {
        all_safe: 'All products in stock are safe',
        out: 'Out of stock',
        critical: 'Critical stock',
        low: 'Low stock',
        remain_fmt: (name, qty) => `${name} - ${qty} pcs remaining`
    } : {
        all_safe: 'جميع المنتجات في المخزون آمن',
        out: 'نفد المخزون',
        critical: 'مخزون حرج',
        low: 'مخزون منخفض',
        remain_fmt: (name, qty) => `${name} - متبقي ${qty} قطع`
    };

    const threshold = settings.lowStockThreshold || 10;
    const lowStockProducts = products.filter(product => 
        product && 
        product.name && 
        typeof product.stock === 'number' && 
        product.stock <= threshold
    );
    
    if (lowStockProducts.length === 0) {
        alertsList.innerHTML = `<div class="alert-item" style="background: #d4edda; color: #155724; border-left-color: #28a745;"><i class="fas fa-check-circle" style="color: #28a745;"></i><span>${t.all_safe}</span></div>`;
        return;
    }
    
    // ترتيب المنتجات حسب الأولوية (الأقل مخزوناً أولاً)
    const sortedProducts = lowStockProducts.sort((a, b) => a.stock - b.stock);
    
    alertsList.innerHTML = sortedProducts.map(product => {
        let alertClass = '';
        let icon = 'fas fa-exclamation-circle';
        let statusText = '';
        
        if (product.stock === 0) {
            alertClass = 'out-of-stock';
            icon = 'fas fa-times-circle';
            statusText = t.out;
        } else if (product.stock <= 3) {
            alertClass = 'critical';
            icon = 'fas fa-exclamation-triangle';
            statusText = t.critical;
        } else {
            alertClass = '';
            icon = 'fas fa-exclamation-circle';
            statusText = t.low;
        }
        
        return `
            <div class="alert-item ${alertClass}">
                <i class="${icon}"></i>
                <span>${t.remain_fmt(product.name, product.stock)}</span>
            </div>
        `;
    }).join('');
}

// تحديث حد تحذير المخزون
document.addEventListener('DOMContentLoaded', function() {
    const thresholdInput = document.getElementById('lowStockThreshold');
    if (thresholdInput) {
        thresholdInput.addEventListener('change', function() {
            const newThreshold = parseInt(this.value);
            if (newThreshold > 0) {
                settings.lowStockThreshold = newThreshold;
                saveToStorage('settings', settings);
                showNotification('✅ تم تحديث حد تحذير المخزون', 'success', 3000);
            }
        });
    }
    
    // تفعيل/إلغاء تحذيرات المخزون
    const alertCheckbox = document.getElementById('lowStockAlertCheckbox');
    if (alertCheckbox) {
        alertCheckbox.addEventListener('change', function() {
            settings.lowStockAlert = this.checked;
            saveToStorage('settings', settings);
            toggleStockThresholdGroup();
            
            if (this.checked) {
                showNotification('✅ تم تفعيل تحذيرات المخزون', 'success', 3000);
            } else {
                showNotification('🔕 تم إلغاء تحذيرات المخزون', 'info', 3000);
            }
        });
    }
    
    // تحديث الصندوق
    const updateCashBtn = document.getElementById('updateCashDrawer');
    if (updateCashBtn) {
        updateCashBtn.addEventListener('click', function() {
            // طلب كلمة المرور
            const password = prompt('🔒 أدخل كلمة المرور لتعديل الصندوق:');
            if (password !== '00') {
                showNotification('❌ كلمة المرور خاطئة! لا يمكن تعديل الصندوق.', 'error', 3000);
                return;
            }
            
            const newUSD = parseFloat(document.getElementById('editCashUSD').value) || 0;
            const newLBP = parseFloat(document.getElementById('editCashLBP').value) || 0;
            
            if (!confirm(getText('confirm-update-cashbox').replace('{newUSD}', formatCurrency(newUSD, 'USD')).replace('{newLBP}', formatCurrency(newLBP, 'LBP')))) {
                return;
            }
            
            // حساب الفرق وإضافة معاملة
            const diffUSD = newUSD - cashDrawer.cashUSD;
            const diffLBP = newLBP - cashDrawer.cashLBP;
            
            // تحديث الصندوق
            cashDrawer.cashUSD = newUSD;
            cashDrawer.cashLBP = newLBP;
            cashDrawer.lastUpdate = new Date().toISOString();
            
            // إضافة معاملة توضيحية
            if (diffUSD !== 0 || diffLBP !== 0) {
                cashDrawer.transactions.push({
                    date: new Date().toISOString(),
                    type: 'adjustment',
                    amountUSD: diffUSD,
                    amountLBP: diffLBP,
                    description: getText('cashbox-manual-adjustment')
                });
                
            }
            
            // حفظ وتحديث
            saveToStorage('cashDrawer', cashDrawer);
            updateCashDrawerDisplay();
            updateCashDrawerSettings();
            
            showNotification(`✅ تم تحديث الصندوق بنجاح!
💵 دولار: ${formatCurrency(newUSD, 'USD')}
💰 ليرة: ${formatCurrency(newLBP, 'LBP')}`, 'success', 5000);
        });
    }
});

// زر القائمة للجوال
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');

if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
    });
    
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}
// تحسين الحسابات التلقائية
function ensureCalculationsWork() {
    // التأكد من عمل الحسابات التلقائية
    const currencySelect = document.getElementById('currency');
    const amountPaidInput = document.getElementById('amountPaid');
    const paymentCurrencySelect = document.getElementById('paymentCurrency');
    const changeCurrencySelect = document.getElementById('changeCurrency');
    
    // إضافة مستمعات إضافية للتأكد
    if (currencySelect) {
        currencySelect.addEventListener('change', function() {
            // تحديث فوري للعربة
            setTimeout(() => {
                updateCart();
                const amountPaid = document.getElementById('amountPaid');
                if (amountPaid && amountPaid.value && amountPaid.value > 0) {
                    calculateAndDisplayChange();
                }
            }, 100);
        });
    }
    
    // تحسين الاستجابة للتغييرات
    document.addEventListener('change', function(e) {
        if (e.target.id === 'amountPaid' || 
            e.target.id === 'paymentCurrency' || 
            e.target.id === 'changeCurrency') {
            
            const amountPaid = document.getElementById('amountPaid');
            if (amountPaid && amountPaid.value && amountPaid.value > 0) {
                setTimeout(() => {
                    calculateAndDisplayChange();
                }, 50);
            }
        }
    });
    
    // إعادة حساب كل شيء عند تحميل نقطة البيع
    const posPage = document.getElementById('pos');
    if (posPage && posPage.classList.contains('active')) {
        setTimeout(() => {
            updateCart();
            const amountPaid = document.getElementById('amountPaid');
            if (amountPaid && amountPaid.value && amountPaid.value > 0) {
                calculateAndDisplayChange();
            }
        }, 200);
    }
}
// تشغيل التحسينات
setTimeout(ensureCalculationsWork, 1000);

console.log('نظام إدارة المبيعات المتطور جاهز للاستخدام!');

// ===================== i18n: Dynamic Language Switching (AR/EN) =====================
(function setupI18n() {
    const translations = {
        ar: {
            app_title: 'CATCH POS SYSTEM',
            app_subtitle: 'CATCH POS SYSTEM',
            logout: 'خروج',
            cash_drawer_label: 'الصندوق:',
            brand_compact: 'CATCH POS SYSTEM',
            // sidebar
            nav_dashboard: 'لوحة التحكم',
            nav_pos: 'نقطة البيع',
            nav_cashbox: 'سجل الصندوق',
            nav_products: 'المنتجات',
            nav_sales: 'المبيعات',
            nav_invoices: 'الفواتير',
            nav_customers: 'العملاء',
            nav_reports: 'التقارير',
            nav_suppliers: 'الموردين',
            nav_settings: 'الإعدادات',
            // dashboard
            dashboard_title: 'لوحة التحكم',
            dashboard_subtitle: 'نظرة عامة على أداء المتجر',
            today_revenue: 'إيرادات اليوم',
            today_sales: 'مبيعات اليوم',
            total_products: 'إجمالي المنتجات',
            total_customers: 'إجمالي العملاء',
            weekly_sales: 'مبيعات الأسبوع',
            stock_alerts: 'تنبيهات المخزون',
            // POS
            pos_title: 'نقطة البيع',
            currency_label: 'العملة:',
            price_type_label: 'نوع السعر:',
            exchange_rate_prefix: 'سعر الصرف:',
            search_placeholder: 'ابحث عن منتج بالاسم أو الباركود...',
            cart_title: 'العربة',
            subtotal: 'المجموع الفرعي:',
            tax_11: 'الضريبة:',
            total_final: 'المجموع النهائي:',
            payment_method: 'طريقة الدفع:',
            payment_cash: 'دفع كامل (نقدي)',
            payment_partial: 'دفع جزئي (دين)',
            cash_pay_smart: 'دفع نقدي ذكي',
            cash_pay_desc: 'حساب الباقي تلقائياً بعملات مختلفة',
            pay_currency: 'عملة الدفع:',
            amount_paid: 'المبلغ المدفوع:',
            change_currency: 'عملة الباقي:',
            change_auto: 'تلقائي',
            calc_change: 'حساب الباقي',
            partial_title: 'دفع جزئي (دين)',
            partial_desc: 'ادفع جزء والباقي على الحساب',
            choose_customer: 'اختر العميل:',
            choose_customer_placeholder: 'اختر عميل...',
            partial_amount: 'مبلغ مدفوع:',
            partial_currency: 'عملة الدفع:',
            calc_debt: 'حساب الدين',
            process_payment: 'إتمام الدفع',
            clear_cart: 'مسح العربة',
            // Sales
            sales_manage: 'إدارة المبيعات',
            filter_all: 'جميع المبيعات',
            filter_completed: 'مكتملة فقط',
            filter_returned: 'مرجعة فقط',
            filter_partial: 'مرجعة جزئياً',
            filter_btn: 'تصفية',
            reset_btn: 'إعادة تعيين',
            // Products
            products_manage: 'إدارة المنتجات',
            add_product: 'إضافة منتج',
            th_product_name: 'اسم المنتج',
            th_category: 'التصنيف',
            th_barcode: 'الباركود',
            th_supplier: 'المورد',
            th_price_usd: 'السعر (USD)',
            th_price_lbp: 'السعر (LBP)',
            th_stock: 'المخزون',
            th_actions: 'الإجراءات',
            // Customers
            customers_manage: 'إدارة العملاء',
            add_customer: 'إضافة عميل',
            th_name: 'الاسم',
            th_email: 'البريد الإلكتروني',
            th_phone: 'الهاتف',
            th_address: 'العنوان',
            th_total_purchases: 'إجمالي المشتريات',
            th_loyalty_points: 'نقاط الولاء',
            th_current_debt: 'الدين الحالي',
            th_credit_limit: 'الحد الائتماني',
            th_join_date: 'تاريخ الانضمام',
        // Suppliers
        suppliers_manage: 'إدارة الموردين',
        add_supplier: 'إضافة مورد',
        add_new_supplier: 'إضافة مورد جديد',
        supplier_name: 'اسم المورد',
        supplier_email: 'البريد الإلكتروني',
        supplier_phone: 'رقم الهاتف',
        supplier_address: 'العنوان',
        supplier_contact_person: 'الشخص المسؤول',
        supplier_record: 'سجل المورد',
        th_supplier_name: 'اسم المورد',
        th_contact_person: 'الشخص المسؤول',
        date: 'التاريخ',
        type: 'النوع',
        reference: 'المرجع',
        total: 'الإجمالي',
        'paid-now': 'المدفوع الآن',
        remaining: 'المتبقي',
        notes: 'الملاحظة',
        apply: 'تطبيق',
        'confirm-delete-supplier': 'هل أنت متأكد من حذف هذا المورد؟',
        'confirm-clear-all-data': 'هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.',
        'clear-all-data': 'مسح جميع البيانات',
        'confirm-clear-cart': 'هل أنت متأكد من مسح العربة؟',
        'confirm-return-invoice': 'هل أنت متأكد من إرجاع الفاتورة {invoiceNumber}؟\nسيتم رد المصاري للعميل وإرجاع المنتجات للمخزون.',
        'confirm-delete-product': 'هل أنت متأكد من حذف هذا المنتج؟',
        'confirm-update-cashbox': 'هل أنت متأكد من تحديث الصندوق؟\nالرصيد الجديد: {newUSD} + {newLBP}',
        'sales-invoice': 'فاتورة البيع',
        'support-phone': 'رقم الدعم',
        'support-phone-desc': 'رقم الدعم الرسمي للنظام',
        'activated-lifetime': 'مفعّل: مدى الحياة',
        'license-not-active': 'الأيام المتبقية لانتهاء الاشتراك: -- يوم',
        'activation-code-placeholder': 'أدخل كود التفعيل',
        'enter-activation-code': 'أدخل كود التفعيل',
            // Search placeholders
            products_search_placeholder: 'ابحث داخل المنتجات...',
            customers_search_placeholder: 'ابحث داخل العملاء...',
            suppliers_search_placeholder: 'ابحث داخل الموردين...',
            // Cashbox (History)
            'cashbox-history': 'سجل الصندوق',
            'cashbox-all-types': 'كل الأنواع',
            'cashbox-deposit': 'إيداع',
            'cashbox-expense': 'إخراج',
            'cashbox-transfer': 'نقل',
            'cashbox-all-currencies': 'كل العملات',
            'cashbox-search-placeholder': 'بحث في الوصف/المستخدم...',
            'cashbox-apply-filter': 'تصفية',
            'cashbox-reset-filter': 'إعادة تعيين',
            'cashbox-export-csv': 'تصدير CSV',
            'cashbox-type': 'النوع',
            'cashbox-amount': 'المبلغ',
            'cashbox-amount-usd': 'المبلغ (USD)',
            'cashbox-amount-lbp': 'المبلغ (LBP)',
            'cashbox-currency': 'العملة',
            'cashbox-date-time': 'التاريخ والوقت',
            'cashbox-description': 'الوصف',
            'cashbox-user': 'المستخدم',
            'cashbox-load-more': 'تحميل المزيد',
        'cashbox-manual-adjustment': 'تعديل يدوي للصندوق من الإعدادات',
        // Expenses Report
        'expenses-report-title': 'تقرير النفقات',
        'expenses-date-time': 'التاريخ والوقت',
        'expenses-category': 'التصنيف',
        'expenses-description': 'الوصف',
        'expenses-original-amount': 'المبلغ الأصلي',
        'expenses-exchange-rate': 'سعر الصرف',
        'expenses-amount-usd': 'المصروف (USD)',
        'expenses-user': 'المستخدم',
        'expenses-total': 'إجمالي النفقات (USD)',
        'expenses-category-all': 'جميع التصنيفات',
        'expenses-user-all': 'جميع المستخدمين',
        'expenses-search-placeholder': 'بحث في الوصف...',
        'expenses-export-csv': 'تصدير CSV',
        'expenses-export-pdf': 'تصدير PDF',
        // Pagination
        'rows-per-page': 'عدد الصفوف في الصفحة',
        'first': 'الأولى',
        'previous': 'السابقة',
        'next': 'التالي',
        'last': 'الأخيرة',
        'showing': 'عرض',
        'of': 'من',
        'entries': 'إدخال',
        // Reports
            reports_title: 'التقارير',
            sales_report_card: 'تقرير المبيعات',
            inventory_report_card: 'تقرير المخزون',
            customers_report_card: 'تقرير العملاء',
            financial_report_card: 'التقرير المالي',
            view_report: 'عرض التقرير',
            // Settings
            settings_title: 'الإعدادات',
            store_info: 'معلومات المتجر',
            store_name: 'اسم المتجر',
            store_address: 'عنوان المتجر',
            store_phone: 'هاتف المتجر',
            currency_settings: 'إعدادات العملة',
            base_currency: 'العملة الأساسية',
            exchange_rate_label: 'سعر صرف الليرة اللبنانية',
            save_exchange_rate: 'حفظ سعر الصرف',
            // تم إزالة إعدادات الضريبة
            data_mgmt: 'إدارة البيانات',
            export_data: 'تصدير البيانات',
            import_data: 'استيراد البيانات',
            clear_all_data: 'مسح جميع البيانات',
            auto_backup_label: 'تفعيل النسخ الاحتياطي التلقائي',
            low_stock_alert_label: 'تفعيل تحذيرات المخزون المنخفض',
            low_stock_threshold: 'حد تحذير المخزون المنخفض:',
            threshold_help: 'سيظهر تحذير عندما تصل الكمية لهذا الحد أو أقل',
            cash_mgmt: 'إدارة الصندوق',
            current_balance: 'الرصيد الحالي:',
            edit_balance: 'تعديل الرصيد:',
            usd_label: 'الدولار الأمريكي ($):',
            lbp_label: 'الليرة اللبنانية (ل.ل):',
            update_cash: 'تحديث الصندوق',
            purchases: 'المشتريات',
        },
        en: {
            app_title: 'CATCH POS SYSTEM',
            app_subtitle: 'CATCH POS SYSTEM',
            logout: 'Logout',
            cash_drawer_label: 'Cash Drawer:',
            brand_compact: 'CATCH POS SYSTEM',
            // sidebar
            nav_dashboard: 'Dashboard',
            nav_pos: 'POS',
            nav_cashbox: 'History Cashbox',
            nav_products: 'Products',
            nav_sales: 'Sales',
            nav_invoices: 'Invoices',
            nav_customers: 'Customers',
            nav_reports: 'Reports',
            nav_suppliers: 'Suppliers',
            nav_settings: 'Settings',
            // dashboard
            dashboard_title: 'Dashboard',
            dashboard_subtitle: 'Store performance overview',
            today_revenue: 'Today Revenue',
            today_sales: 'Today Sales',
            total_products: 'Total Products',
            total_customers: 'Total Customers',
            weekly_sales: 'Weekly Sales',
            stock_alerts: 'Stock Alerts',
            // POS
            pos_title: 'Point of Sale',
            currency_label: 'Currency:',
            price_type_label: 'Price Type:',
            exchange_rate_prefix: 'Exchange Rate:',
            search_placeholder: 'Search by name or barcode...',
            cart_title: 'Cart',
            subtotal: 'Subtotal:',
            tax_11: 'Tax:',
            total_final: 'Total:',
            payment_method: 'Payment Method:',
            payment_cash: 'Full payment (Cash)',
            payment_partial: 'Partial payment (Credit)',
            cash_pay_smart: 'Smart Cash Payment',
            cash_pay_desc: 'Auto change across currencies',
            pay_currency: 'Pay Currency:',
            amount_paid: 'Amount Paid:',
            change_currency: 'Change Currency:',
            change_auto: 'Auto',
            calc_change: 'Calculate Change',
            partial_title: 'Partial (Credit)',
            partial_desc: 'Pay part, rest on account',
            choose_customer: 'Select Customer:',
            choose_customer_placeholder: 'Choose customer...',
            partial_amount: 'Paid Amount:',
            partial_currency: 'Pay Currency:',
            calc_debt: 'Calculate Credit',
            process_payment: 'Process Payment',
            clear_cart: 'Clear Cart',
            // Sales
            sales_manage: 'Sales Management',
            filter_all: 'All sales',
            filter_completed: 'Completed only',
            filter_returned: 'Returned only',
            filter_partial: 'Partially returned',
            filter_btn: 'Filter',
            reset_btn: 'Reset',
            // Products
            products_manage: 'Products Management',
            add_product: 'Add Product',
            th_product_name: 'Product Name',
            th_category: 'Category',
            th_barcode: 'Barcode',
            th_supplier: 'Supplier',
            th_price_usd: 'Price (USD)',
            th_price_lbp: 'Price (LBP)',
            th_stock: 'Stock',
            th_actions: 'Actions',
            // Customers
            customers_manage: 'Customers Management',
            add_customer: 'Add Customer',
            th_name: 'Name',
            th_email: 'Email',
            th_phone: 'Phone',
            th_address: 'Address',
            th_total_purchases: 'Total Purchases',
            th_loyalty_points: 'Loyalty Points',
            th_current_debt: 'Current Debt',
            th_credit_limit: 'Credit Limit',
            th_join_date: 'Join Date',
            // Suppliers
            suppliers_manage: 'Suppliers Management',
            add_supplier: 'Add Supplier',
            add_new_supplier: 'Add New Supplier',
            supplier_name: 'Supplier Name',
            supplier_email: 'Email',
            supplier_phone: 'Phone Number',
            supplier_address: 'Address',
            supplier_contact_person: 'Contact Person',
            supplier_record: 'Supplier Record',
            th_supplier_name: 'Supplier Name',
            th_contact_person: 'Contact Person',
            date: 'Date',
            type: 'Type',
            reference: 'Reference',
            total: 'Total',
            'paid-now': 'Paid Now',
            remaining: 'Remaining',
            notes: 'Notes',
            apply: 'Apply',
            'confirm-delete-supplier': 'Are you sure you want to delete this supplier?',
            'confirm-clear-all-data': 'Are you sure you want to delete all data? This action cannot be undone.',
            'clear-all-data': 'Clear All Data',
            'confirm-clear-cart': 'Are you sure you want to clear the cart?',
            'confirm-return-invoice': 'Are you sure you want to return invoice {invoiceNumber}?\nMoney will be refunded to customer and products returned to stock.',
            'confirm-delete-product': 'Are you sure you want to delete this product?',
            'confirm-update-cashbox': 'Are you sure you want to update the cashbox?\nNew balance: {newUSD} + {newLBP}',
            'sales-invoice': 'Sales Invoice',
            'support-phone': 'Support Phone',
            'support-phone-desc': 'Official system support number',
            'activated-lifetime': 'Activated: Lifetime',
            'license-not-active': 'Days left: --',
            'activation-code-placeholder': 'Enter activation code',
            'enter-activation-code': 'Enter Activation Code',
            // Search placeholders
            products_search_placeholder: 'Search in products...',
            customers_search_placeholder: 'Search in customers...',
            suppliers_search_placeholder: 'Search in suppliers...',
            // Cashbox (History)
            'cashbox-history': 'History Cashbox',
            'cashbox-all-types': 'All types',
            'cashbox-deposit': 'Deposit',
            'cashbox-expense': 'Expense',
            'cashbox-transfer': 'Transfer',
            'cashbox-all-currencies': 'All currencies',
            'cashbox-search-placeholder': 'Search in description/user...',
            'cashbox-apply-filter': 'Apply',
            'cashbox-reset-filter': 'Reset',
            'cashbox-export-csv': 'Export CSV',
            'cashbox-type': 'Type',
            'cashbox-amount': 'Amount',
            'cashbox-amount-usd': 'Amount (USD)',
            'cashbox-amount-lbp': 'Amount (LBP)',
            'cashbox-currency': 'Currency',
            'cashbox-date-time': 'Date & Time',
            'cashbox-description': 'Description',
            'cashbox-user': 'User',
            'cashbox-load-more': 'Load more',
            'cashbox-manual-adjustment': 'Manual cashbox adjustment from Settings',
            // Expenses Report
            'expenses-report-title': 'Expenses Report',
            'expenses-date-time': 'Date & Time',
            'expenses-category': 'Category',
            'expenses-description': 'Description',
            'expenses-original-amount': 'Original Amount',
            'expenses-exchange-rate': 'Exchange Rate',
            'expenses-amount-usd': 'Expense (USD)',
            'expenses-user': 'User',
            'expenses-total': 'Total Expenses (USD)',
            'expenses-category-all': 'All Categories',
            'expenses-user-all': 'All Users',
            'expenses-search-placeholder': 'Search in description...',
            'expenses-export-csv': 'Export CSV',
            'expenses-export-pdf': 'Export PDF',
            // Pagination
            'rows-per-page': 'Rows per page',
            'first': 'First',
            'previous': 'Previous',
            'next': 'Next',
            'last': 'Last',
            'showing': 'Showing',
            'of': 'of',
            'entries': 'entries',
            // Profit Reports / Filters
            'today': 'Today',
            'this-week': 'This week',
            'last-week': 'Last week',
            'this-month': 'This month',
            'last-month': 'Last month',
            'custom': 'Custom',
            'all-methods': 'All methods',
            'cash': 'Cash',
            'partial-payment': 'Partial payment (Credit)',
            'credit': 'Credit Sale',
            // Reports
            reports_title: 'Reports',
            sales_report_card: 'Sales Report',
            inventory_report_card: 'Inventory Report',
            customers_report_card: 'Customers Report',
            financial_report_card: 'Financial Report',
            view_report: 'View Report',
            // Settings
            settings_title: 'Settings',
            store_info: 'Store Info',
            store_name: 'Store Name',
            store_address: 'Store Address',
            store_phone: 'Store Phone',
            currency_settings: 'Currency Settings',
            base_currency: 'Base Currency',
            exchange_rate_label: 'LBP Exchange Rate',
            save_exchange_rate: 'Save Exchange Rate',
            save_store_info: 'Save Store Info',
            save_store_info_success: '✅ Store info saved',
            renew_license: 'Import / Renew License',
            // تم إزالة إعدادات الضريبة
            data_mgmt: 'Data Management',
            export_data: 'Export Data',
            import_data: 'Import Data',
            clear_all_data: 'Clear All Data',
            auto_backup_label: 'Enable Auto Backup',
            low_stock_alert_label: 'Enable Low Stock Alerts',
            low_stock_threshold: 'Low stock threshold:',
            threshold_help: 'An alert appears when quantity reaches this threshold',
            cash_mgmt: 'Cash Drawer Management',
            current_balance: 'Current Balance:',
            edit_balance: 'Edit Balance:',
            usd_label: 'US Dollar ($):',
            lbp_label: 'Lebanese Pound (LBP):',
            update_cash: 'Update Drawer',
            purchases: 'Purchases',
            'currency-usd': 'dollar',
            'currency-lbp': 'lbp',
            cash_move_expense: 'Expense',
            cash_move_deposit: 'Deposit',
            cash_move_transfer: 'Transfer',
            cash_move_placeholder: 'e.g.: purchase supplies/transfer to safe...',
            cash_move_title: 'Cash Movement',
            cash_move_type: 'Type',
            cash_move_amount: 'Amount',
            cash_move_currency: 'Currency',
            cash_move_description: 'Description',
            cash_move_confirm: 'Confirm',
            cash_move_cancel: 'Cancel',
        }
    };

    function translateUI(lang) {
        const t = translations[lang] || translations.ar;
        const html = document.documentElement;
        html.lang = lang;
        html.dir = lang === 'ar' ? 'rtl' : 'ltr';

        // Header
        const brand = document.querySelector('.logo-small span');
        if (brand) brand.textContent = t.brand_compact;
        const cashLabel = document.querySelector('.cash-indicator span');
        if (cashLabel) cashLabel.textContent = t.cash_drawer_label;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.lastChild && (logoutBtn.lastChild.textContent = ' ' + t.logout);

        // Language select UI reflect
        const langSelect = document.getElementById('languageSelect');
        if (langSelect && langSelect.value !== lang) langSelect.value = lang;

        // Sidebar
        const sideItems = [
            { sel: '.nav-item[data-screen="dashboard"] span', key: 'nav_dashboard' },
            { sel: '.nav-item[data-screen="pos"] span', key: 'nav_pos' },
            { sel: '.nav-item[data-screen="cashboxHistory"] span', key: 'nav_cashbox' },
            { sel: '.nav-item[data-screen="products"] span', key: 'nav_products' },
            { sel: '.nav-item[data-screen="sales"] span', key: 'nav_sales' },
            { sel: '.nav-item[onclick="showPage(\'invoices\')"] span', key: 'nav_invoices' },
            { sel: '.nav-item[data-screen="customers"] span', key: 'nav_customers' },
            { sel: '.nav-item[data-screen="purchases"] span', key: 'purchases' },
            { sel: '.nav-item[data-screen="reports"] span', key: 'nav_reports' },
            { sel: '.nav-item[data-screen="suppliers"] span', key: 'nav_suppliers' },
            { sel: '.nav-item[data-screen="settings"] span', key: 'nav_settings' },
        ];
        sideItems.forEach(it => {
            const el = document.querySelector(it.sel);
            if (el) el.textContent = t[it.key];
        });

        // Dashboard
        const dashHeader = document.querySelector('#dashboard .page-header h2');
        if (dashHeader) dashHeader.textContent = t.dashboard_title;
        const dashSub = document.querySelector('#dashboard .page-header p');
        if (dashSub) dashSub.textContent = t.dashboard_subtitle;
        const statLabels = document.querySelectorAll('#dashboard .stat-card .stat-content p');
        if (statLabels && statLabels.length >= 4) {
            statLabels[0].textContent = t.today_revenue;
            statLabels[1].textContent = t.today_sales;
            statLabels[2].textContent = t.total_products;
            statLabels[3].textContent = t.total_customers;
        }
        const weeklyTitle = document.querySelector('.dashboard-card h3 i.fa-chart-line')?.parentElement;
        if (weeklyTitle) weeklyTitle.childNodes[weeklyTitle.childNodes.length - 1].nodeValue = ' ' + t.weekly_sales;
        const stockAlertsTitle = document.querySelectorAll('.dashboard-card h3')[1];
        if (stockAlertsTitle && stockAlertsTitle.querySelector('i.fa-exclamation-triangle')) {
            stockAlertsTitle.childNodes[stockAlertsTitle.childNodes.length - 1].nodeValue = ' ' + t.stock_alerts;
        }

        // POS Header
        const posHeader = document.querySelector('#pos .page-header h2');
        if (posHeader) posHeader.textContent = t.pos_title;
        const currencyLabel = document.querySelector('#pos .currency-selector label:nth-of-type(1)');
        if (currencyLabel) currencyLabel.textContent = t.currency_label;
    const priceTypeLabel = document.querySelector('#pos .currency-selector label:nth-of-type(2)');
        if (priceTypeLabel) priceTypeLabel.textContent = t.price_type_label;
        const exchangeSpan = document.getElementById('exchangeRate');
        if (exchangeSpan) {
            const num = exchangeSpan.textContent.replace(/[^0-9,]/g, '').trim();
            exchangeSpan.textContent = `${t.exchange_rate_prefix} ${num} ل.ل`;
        }
        // Translate Open Cash Move button (preserve icon)
        const openCashMoveBtn = document.getElementById('openCashMove');
        if (openCashMoveBtn) {
            const icon = openCashMoveBtn.querySelector('i');
            const iconHtml = icon ? icon.outerHTML + ' ' : '';
            openCashMoveBtn.innerHTML = iconHtml + t.cash_move_title;
        }
        const searchInput = document.getElementById('productSearch');
        if (searchInput) searchInput.placeholder = t.search_placeholder;
        const cartTitle = document.querySelector('.cart-section h3');
        if (cartTitle) {
            const icon = cartTitle.querySelector('i');
            cartTitle.textContent = t.cart_title;
            if (icon) cartTitle.prepend(icon);
        }
        const totals = document.querySelectorAll('.cart-total .total-line span:first-child');
        if (totals && totals.length >= 2) {
            totals[0].textContent = t.tax_11;
            totals[1].textContent = t.total_final;
        }
        // Translate the POS final-total box title if present
        const finalBoxTitle = document.querySelector('.final-total-box .final-total-title');
        if (finalBoxTitle) finalBoxTitle.textContent = t.total_final;
    const pmLabel = document.querySelector('.payment-section > label');
    if (pmLabel) pmLabel.textContent = t.payment_method;
    const pmSelect = document.getElementById('paymentMethod');
    if (pmSelect && pmSelect.options.length >= 3) {
        pmSelect.options[0].textContent = t.payment_cash;
        pmSelect.options[1].textContent = t.credit_sale || (lang==='en' ? 'Credit Sale' : 'بيع بالدين');
        pmSelect.options[2].textContent = t.payment_partial;
    }
        const cashTitle = document.querySelector('#cashPaymentSection .cash-feature-highlight h3');
        if (cashTitle) cashTitle.textContent = t.cash_pay_smart;
        const cashDesc = document.querySelector('#cashPaymentSection .cash-feature-highlight p');
        if (cashDesc) cashDesc.textContent = t.cash_pay_desc;
        const payCurLabel = document.querySelector('#cashPaymentSection .payment-input .input-group:nth-of-type(1) label');
        if (payCurLabel) payCurLabel.textContent = t.pay_currency;
        const amtPaidLabel = document.querySelector('#cashPaymentSection .payment-input .input-group:nth-of-type(2) label');
        if (amtPaidLabel) amtPaidLabel.textContent = t.amount_paid;
        const changeCurLabel = document.querySelector('#cashPaymentSection .payment-input .input-group:nth-of-type(3) label');
        if (changeCurLabel) changeCurLabel.textContent = t.change_currency;
    const changeCurSelect = document.getElementById('changeCurrency');
    if (changeCurSelect && changeCurSelect.options.length >= 3) {
        changeCurSelect.options[0].textContent = t.change_auto;
        changeCurSelect.options[1].textContent = t['currency-usd'] || (lang==='en' ? 'US Dollar ($)' : 'دولار ($)');
        changeCurSelect.options[2].textContent = t['currency-lbp'] || (lang==='en' ? 'Lebanese Pound (LBP)' : 'ليرة (ل.ل)');
    }
        const calcBtn = document.getElementById('calculateChange');
        if (calcBtn) calcBtn.textContent = t.calc_change;
        // Generic data-i18n elements and placeholders
        try {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (!key) return;
                const val = t[key];
                if (val === undefined) return;
                // if element contains a child icon, keep the icon and place text after it
                const icon = el.querySelector && el.querySelector('i');
                if (icon && el.tagName.toLowerCase() !== 'option') {
                    // many headings have <i> and text node; replace only the text part
                    // remove existing text nodes then append new text
                    Array.from(el.childNodes).forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.remove(); });
                    el.appendChild(document.createTextNode(' ' + val));
                } else {
                    // normal replacement (works for option, span, button, etc.)
                    el.textContent = val;
                }
            });
            // placeholders via data-i18n-placeholder
            document.querySelectorAll('[data-i18n-placeholder]').forEach(inp => {
                const key = inp.getAttribute('data-i18n-placeholder');
                const val = t[key];
                if (val !== undefined && (inp.tagName.toLowerCase() === 'input' || inp.tagName.toLowerCase() === 'textarea')) {
                    inp.placeholder = val;
                }
            });
            // translate option elements that use data-i18n (some selects keep Arabic text otherwise)
            try {
                document.querySelectorAll('option[data-i18n]').forEach(opt => {
                    const key = opt.getAttribute('data-i18n');
                    const val = t[key];
                    if (val !== undefined) opt.textContent = val;
                });
            } catch(e) {}
        } catch (e) { console.warn('i18n generic apply failed', e); }
        const partialTitle = document.querySelector('#partialPaymentSection .credit-feature-highlight h3');
        if (partialTitle) partialTitle.textContent = t.partial_title;
        const partialDesc = document.querySelector('#partialPaymentSection .credit-feature-highlight p');
        if (partialDesc) partialDesc.textContent = t.partial_desc;
        const chooseCustLabel = document.querySelector('#partialPaymentSection .partial-payment-input .input-group:nth-of-type(1) label');
        if (chooseCustLabel) chooseCustLabel.textContent = t.choose_customer;
        const customerSelect = document.getElementById('customerSelect');
        if (customerSelect && customerSelect.options.length > 0) customerSelect.options[0].textContent = t.choose_customer_placeholder;
        const partialAmtLabel = document.querySelector('#partialPaymentSection .partial-payment-input .input-group:nth-of-type(2) label');
        if (partialAmtLabel) partialAmtLabel.textContent = t.partial_amount;
        const partialCurLabel = document.querySelector('#partialPaymentSection .partial-payment-input .input-group:nth-of-type(3) label');
        if (partialCurLabel) partialCurLabel.textContent = t.partial_currency;
        const calcDebtBtn = document.getElementById('calculateCredit');
        if (calcDebtBtn) calcDebtBtn.textContent = t.calc_debt;
        const processBtn = document.getElementById('processPayment');
        if (processBtn) {
            const icon = processBtn.querySelector('i');
            processBtn.textContent = t.process_payment;
            if (icon) processBtn.prepend(icon);
        }
        const clearBtn = document.getElementById('clearCart');
        if (clearBtn) {
            const icon = clearBtn.querySelector('i');
            clearBtn.textContent = t.clear_cart;
            if (icon) clearBtn.prepend(icon);
        }

        // Sales header controls
        const salesHeader = document.querySelector('#sales .page-header h2');
        if (salesHeader) {
            const icon = salesHeader.querySelector('i');
            salesHeader.textContent = ' ' + t.sales_manage;
            if (icon) salesHeader.prepend(icon);
        }
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter && statusFilter.options.length >= 4) {
            statusFilter.options[0].textContent = t.filter_all;
            statusFilter.options[1].textContent = t.filter_completed;
            statusFilter.options[2].textContent = t.filter_returned;
            statusFilter.options[3].textContent = t.filter_partial;
        }
        const filterBtn = document.getElementById('filterSales');
        if (filterBtn) filterBtn.textContent = t.filter_btn;
        const resetBtn = document.getElementById('resetFilter');
        if (resetBtn) resetBtn.textContent = t.reset_btn;

        // Products page
        const prodHeader = document.querySelector('#products .page-header h2');
        if (prodHeader) prodHeader.textContent = t.products_manage;
        const addProdBtn = document.getElementById('addProductBtn');
        if (addProdBtn) { const icon = addProdBtn.querySelector('i'); addProdBtn.textContent = t.add_product; if (icon) addProdBtn.prepend(icon); }
        const productsHead = document.querySelectorAll('#products thead th');
        if (productsHead && productsHead.length >= 9) {
            productsHead[0].textContent = t.th_product_name;
            productsHead[1].textContent = t.th_category;
            productsHead[2].textContent = t.th_barcode;
            productsHead[3].textContent = t.th_supplier;
            productsHead[4].textContent = t.th_price_usd;
            productsHead[5].textContent = t.th_cost_usd ? t.th_cost_usd : (lang === 'ar' ? 'التكلفة (USD)' : 'Cost (USD)');
            productsHead[6].textContent = t.th_price_lbp;
            productsHead[7].textContent = t.th_stock;
            productsHead[8].textContent = t.th_actions;
        }
        // Products page search input
        const productsSearchInput = document.getElementById('productsSearch');
        if (productsSearchInput) productsSearchInput.placeholder = t.products_search_placeholder;

        // Sales table head
        const salesHead = document.querySelectorAll('#sales thead th');
        if (salesHead && salesHead.length >= 7) {
            salesHead[0].textContent = lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #';
            salesHead[1].textContent = lang === 'ar' ? 'التاريخ' : 'Date';
            salesHead[2].textContent = lang === 'ar' ? 'العميل' : 'Customer';
            salesHead[3].textContent = lang === 'ar' ? 'المبلغ' : 'Amount';
            salesHead[4].textContent = lang === 'ar' ? 'طريقة الدفع' : 'Payment Method';
            salesHead[5].textContent = lang === 'ar' ? 'الحالة' : 'Status';
            salesHead[6].textContent = lang === 'ar' ? 'الإجراءات' : 'Actions';
        }

        // Customers page
        const custHeader = document.querySelector('#customers .page-header h2');
        if (custHeader) {
            const icon = custHeader.querySelector('i');
            custHeader.textContent = ' ' + (lang === 'ar' ? 'إدارة العملاء' : 'Customers Management');
            if (icon) custHeader.prepend(icon);
        }
        const addCustBtn = document.getElementById('addCustomerBtn');
        if (addCustBtn) { const icon = addCustBtn.querySelector('i'); addCustBtn.textContent = t.add_customer; if (icon) addCustBtn.prepend(icon); }
        const customersHead = document.querySelectorAll('#customers thead th');
        // customers table now has 9 columns (we removed loyalty points); translate when at least 9 headers present
        if (customersHead && customersHead.length >= 9) {
            const labels = lang === 'ar'
                ? [t.th_name, t.th_email, t.th_phone, t.th_address, t.th_total_purchases, t.th_current_debt, t.th_credit_limit, t.th_join_date, t.th_actions]
                : [t.th_name, t.th_email, t.th_phone, t.th_address, t.th_total_purchases, t.th_current_debt, t.th_credit_limit, t.th_join_date, t.th_actions];
            customersHead.forEach((th, i) => { if (labels[i]) th.textContent = labels[i]; });
        }
    const customersSearchInput = document.getElementById('customersSearch');
    if (customersSearchInput) customersSearchInput.placeholder = t.customers_search_placeholder;

        // Suppliers page
        const supHeader = document.querySelector('#suppliers .page-header h2');
        if (supHeader) { const icon = supHeader.querySelector('i'); supHeader.textContent = ' ' + (lang === 'ar' ? t.suppliers_manage : t.suppliers_manage); if (icon) supHeader.prepend(icon); }
        const addSupBtn = document.getElementById('addSupplierBtn');
        if (addSupBtn) { const icon = addSupBtn.querySelector('i'); addSupBtn.textContent = t.add_supplier; if (icon) addSupBtn.prepend(icon); }
        const suppliersSearchInput = document.getElementById('suppliersSearch');
        if (suppliersSearchInput) suppliersSearchInput.placeholder = t.suppliers_search_placeholder;
        const suppliersHead = document.querySelectorAll('#suppliers thead th');
        if (suppliersHead && suppliersHead.length >= 6) {
            suppliersHead[0].textContent = t.th_supplier_name;
            suppliersHead[1].textContent = t.th_email;
            suppliersHead[2].textContent = t.th_phone;
            suppliersHead[3].textContent = t.th_address;
            suppliersHead[4].textContent = t.th_contact_person;
            suppliersHead[5].textContent = t.th_actions;
        }

        // Reports page cards and title
        const reportsHeader = document.querySelector('#reports .page-header h2');
        if (reportsHeader) { const icon = reportsHeader.querySelector('i'); reportsHeader.textContent = ' ' + t.reports_title; if (icon) reportsHeader.prepend(icon); }
        // ترجمات بطاقات التقارير: مطابقة حسب أزرار الفتح لضمان العناوين الصحيحة
        const cardsMap = [
            { selector: 'button[onclick="showSalesReport()"]', title: t.sales_report_card },
            { selector: 'button[onclick="showInventoryReport()"]', title: t.inventory_report_card },
            { selector: 'button[onclick="showCustomersReport()"]', title: t.customers_report_card },
            { selector: 'button[onclick="showFinancialReport()"]', title: t.financial_report_card },
            { selector: 'button[onclick="showProfitReports()"]', title: t.profit_reports_card || (html.lang==='en'?'Profit Reports':'تقارير الأرباح') },
            { selector: 'button[onclick="showInventoryCapital()"]', title: t.inventory_capital_card || (html.lang==='en'?'Inventory Capital':'رأس مال المخزون') },
            { selector: 'button[onclick="showExpensesReport()"]', title: t.expenses_report_card || (html.lang==='en'?'Expenses':'النفقات') }
        ];
        cardsMap.forEach(({ selector, title }) => {
            const btn = document.querySelector(`#reports .report-card ${selector}`);
            if (!btn) return;
            const card = btn.closest('.report-card');
            if (!card) return;
            const h3 = card.querySelector('h3');
            if (h3) { const icon = h3.querySelector('i'); h3.textContent = ' ' + title; if (icon) h3.prepend(icon); }
            btn.textContent = t.view_report;
        });

        // Settings sections
        const settingsHeader = document.querySelector('#settings .page-header h2');
        if (settingsHeader) { const icon = settingsHeader.querySelector('i'); settingsHeader.textContent = ' ' + t.settings_title; if (icon) settingsHeader.prepend(icon); }
        const sections = document.querySelectorAll('#settings .settings-section');
        if (sections && sections.length >= 4) {
            const sectionTitles = [t.store_info, t.currency_settings, t.data_mgmt, t.cash_mgmt];
            sections.forEach((sec, i) => {
                const h3 = sec.querySelector('h3');
                if (h3) { const icon = h3.querySelector('i'); h3.textContent = ' ' + sectionTitles[i]; if (icon) h3.prepend(icon); }
            });
        }
        // Translate buttons and labels specific to settings not covered above
        const saveStoreBtn = document.getElementById('saveStoreInfo');
        if (saveStoreBtn) saveStoreBtn.textContent = t.save_store_info;
        const renewBtn = document.getElementById('renewLicenseBtn');
        if (renewBtn) renewBtn.textContent = t.renew_license;
        // Cash move modal translations
        const cashMoveTitle = document.querySelector('#cashMoveModal .modal-header h3');
        if (cashMoveTitle) cashMoveTitle.textContent = t.cash_move_title;
        const cashMoveType = document.querySelector('#cashMoveModal label[for]') || document.querySelector('#cashMoveModal .form-group label');
        // translate form labels explicitly
        const cashMoveTypeLabel = document.querySelector('#cashMoveModal label[for="cashMoveType"]') || document.querySelector('#cashMoveModal .form-group label');
        try {
            const lblType = document.querySelector('#cashMoveModal .form-group:nth-of-type(1) label'); if (lblType) lblType.textContent = t.cash_move_type;
            const lblAmount = document.querySelector('#cashMoveModal .form-group:nth-of-type(2) label'); if (lblAmount) lblAmount.textContent = t.cash_move_amount;
            const lblCurrency = document.querySelector('#cashMoveModal .form-group:nth-of-type(3) label'); if (lblCurrency) lblCurrency.textContent = t.cash_move_currency;
            const lblDesc = document.querySelector('#cashMoveModal .form-group:nth-of-type(4) label'); if (lblDesc) lblDesc.textContent = t.cash_move_description;
            const descInput = document.getElementById('cashMoveNote'); if (descInput) descInput.placeholder = t.cash_move_placeholder;
            const confirmBtn = document.getElementById('confirmCashMove'); if (confirmBtn) confirmBtn.textContent = t.cash_move_confirm;
            const cancelBtn = document.querySelector('#cashMoveModal .cancel-btn'); if (cancelBtn) cancelBtn.textContent = t.cash_move_cancel;
        } catch(e) {}
        // Translate cash move select options
        try {
            const optExpense = document.querySelector('#cashMoveModal #cashMoveType option[value="expense"]'); if (optExpense) optExpense.textContent = t.cash_move_expense;
            const optDeposit = document.querySelector('#cashMoveModal #cashMoveType option[value="deposit"]'); if (optDeposit) optDeposit.textContent = t.cash_move_deposit;
            const optTransfer = document.querySelector('#cashMoveModal #cashMoveType option[value="transfer"]'); if (optTransfer) optTransfer.textContent = t.cash_move_transfer;
        } catch(e) {}
        // Store info labels
        const storeLabels = document.querySelectorAll('#settings .settings-section:nth-of-type(1) .form-group label');
        if (storeLabels && storeLabels.length >= 3) {
            storeLabels[0].textContent = t.store_name;
            storeLabels[1].textContent = t.store_address;
            storeLabels[2].textContent = t.store_phone;
        }
        // Currency settings
        const curLabels = document.querySelectorAll('#settings .settings-section:nth-of-type(2) .form-group label');
        if (curLabels && curLabels.length >= 2) {
            curLabels[0].textContent = t.base_currency;
            curLabels[1].textContent = t.exchange_rate_label;
        }
        const saveExBtn = document.getElementById('updateExchangeRate');
        if (saveExBtn) { const icon = saveExBtn.querySelector('i'); saveExBtn.textContent = t.save_exchange_rate; if (icon) saveExBtn.prepend(icon); }
        // تم إزالة إعدادات الضريبة
        // Data management
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) { const icon = exportBtn.querySelector('i'); exportBtn.textContent = t.export_data; if (icon) exportBtn.prepend(icon); }
        const importLabel = document.querySelector('#settings .import-section label');
        if (importLabel) { const icon = importLabel.querySelector('i'); importLabel.textContent = t.import_data; if (icon) importLabel.prepend(icon); }
        const clearBtn2 = document.getElementById('clearDataBtn');
        if (clearBtn2) { const icon = clearBtn2.querySelector('i'); clearBtn2.textContent = t.clear_all_data; if (icon) clearBtn2.prepend(icon); }
        const autoBackup = document.querySelector('#settings #autoBackupCheckbox')?.parentElement;
        if (autoBackup) autoBackup.lastChild.nodeType === Node.TEXT_NODE ? autoBackup.lastChild.textContent = ' ' + t.auto_backup_label : autoBackup.append(' ' + t.auto_backup_label);
        const lowStock = document.querySelector('#settings #lowStockAlertCheckbox')?.parentElement;
        if (lowStock) lowStock.lastChild.nodeType === Node.TEXT_NODE ? lowStock.lastChild.textContent = ' ' + t.low_stock_alert_label : lowStock.append(' ' + t.low_stock_alert_label);
        const thrLabel = document.querySelector('#stockThresholdGroup label');
        if (thrLabel) thrLabel.textContent = t.low_stock_threshold;
        const thrSmall = document.querySelector('#stockThresholdGroup small');
        if (thrSmall) thrSmall.textContent = t.threshold_help;
        // Cash drawer labels
        const cashSecLabels = document.querySelectorAll('#settings .settings-section:nth-of-type(5) .form-group label');
        // Not all are direct; we set known ones below
        const currentBalanceH4 = document.querySelector('#settings .current-balance h4');
        if (currentBalanceH4) currentBalanceH4.textContent = t.current_balance;
        const editBalanceH4 = document.querySelector('#settings .edit-balance h4');
        if (editBalanceH4) editBalanceH4.textContent = t.edit_balance;
        const usdLbl = document.querySelector('#editCashUSD')?.closest('.form-group')?.querySelector('label');
        if (usdLbl) usdLbl.textContent = t.usd_label;
        const lbpLbl = document.querySelector('#editCashLBP')?.closest('.form-group')?.querySelector('label');
        if (lbpLbl) lbpLbl.textContent = t.lbp_label;
        const updateCashBtn = document.getElementById('updateCashDrawer');
        if (updateCashBtn) { const icon = updateCashBtn.querySelector('i'); updateCashBtn.textContent = t.update_cash; if (icon) updateCashBtn.prepend(icon); }
    }
    // update license days display in settings
    try {
        (async function(){
            try {
                const el = document.getElementById('licenseDaysLeft');
                if (!el) return;
                const status = (window.jhAPI && window.jhAPI.getLicenseStatus) ? await window.jhAPI.getLicenseStatus() : { active: false };
                if (!status || !status.active) {
                    el.textContent = (getText('license_not_active') || 'النظام غير مفعّل') + ' — -- يوم';
                    el.className = 'license-days inactive';
                    return;
                }
                const days = status.days_left || 0;
                el.textContent = `الأيام المتبقية لانتهاء الاشتراك: ${days} يوم`;
                if (days >= 30) el.className = 'license-days safe';
                else if (days >= 7) el.className = 'license-days warn';
                else el.className = 'license-days danger';
            } catch(e) { console.warn('license days UI update failed', e); }
        })();
    } catch(e) {}

    function setLanguage(lang) {
        // توحيد حالة اللغة مع النظام العام
        try { localStorage.setItem('appLanguage', lang); } catch(e) {}
        if (typeof window.changeLanguage === 'function') {
            // هذا سيستدعي translateUI و applyTranslations أيضاً
            try { window.changeLanguage(lang); return; } catch(e) {}
        }
        // احتياطي
        translateUI(lang);
    }

    document.addEventListener('DOMContentLoaded', function() {
        const saved = (function(){ try { return localStorage.getItem('appLanguage'); } catch(e) { return null; } })() || 'ar';
        // تحميل أولي موحد
        if (typeof window.changeLanguage === 'function') {
            try { window.changeLanguage(saved); } catch(e) { translateUI(saved); }
        } else {
            translateUI(saved);
        }
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) {
            langSelect.value = saved;
            // تفادي مستمع مزدوج: نستخدم changeLanguage واحد فقط
            langSelect.addEventListener('change', function(){
                if (typeof window.changeLanguage === 'function') {
                    window.changeLanguage(this.value);
                } else {
                    setLanguage(this.value);
                }
            });
        }
    });
    // تعريض الدوال عالمياً لندمج مع النظام الموجود
    window.translateUI = translateUI;
    window.setLanguage = setLanguage;
})();
// تحسينات الموبايل
function setupMobileOptimizations() {
    // منع التكبير على iOS
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    // Setup license UI on login screen
    (async function setupLicenseUI(){
        try {
            const importBtn = document.getElementById('importLicenseBtn');
            const status = (window.jhAPI && window.jhAPI.getLicenseStatus) ? await window.jhAPI.getLicenseStatus() : { active: true };
            if (!status || !status.active) {
                // show activate and import buttons and disable login visually
                const activateBtn = document.getElementById('activateBtn');
                if (activateBtn) activateBtn.style.display = '';
                if (importBtn) importBtn.style.display = '';
                // show message
                showMessage(getText('license_not_active') || 'النظام غير مفعّل. الرجاء استيراد ملف التفعيل لمتابعة الاستخدام.', 'error');

                // attach activate dialog (only once)
                if (activateBtn && !activateBtn.dataset.jhAttached) {
                    activateBtn.dataset.jhAttached = '1';
                    activateBtn.addEventListener('click', function(){
                        const modal = document.createElement('div');
                        modal.className = 'activate-modal';
                        modal.style.position = 'fixed';
                        modal.style.left = '50%';
                        modal.style.top = '50%';
                        modal.style.transform = 'translate(-50%, -50%)';
                        modal.style.background = '#fff';
                        modal.style.padding = '18px';
                        modal.style.borderRadius = '10px';
                        modal.style.boxShadow = '0 12px 40px rgba(0,0,0,0.16)';
                        modal.style.zIndex = 9999;
                        modal.innerHTML = `<h3 style="margin-top:0;">${getText('activate_prompt') || 'لاستخدام البرنامج يلزم تفعيل. اختر أحد الخيارات أدناه.'}</h3>
                            <div style="display:flex;gap:12px;flex-direction:column;min-width:320px;">
                                <button id="whatsappRequestBtn" class="save-btn">${getText('send_whatsapp') || 'إرسال طلب التفعيل'}</button>
                                <button id="copyHwidBtnMain" class="report-btn">${getText('copy_hwid') || 'نسخ رمز الجهاز (HWID)'}</button>
                                <button id="closeActivateModal" class="cancel-btn">إغلاق</button>
                            </div>`;
                        document.body.appendChild(modal);
                        document.getElementById('closeActivateModal').addEventListener('click', function(){ modal.remove(); });

                        document.getElementById('copyHwidBtnMain').addEventListener('click', async function(){
                            try {
                                const hwid = (window.jhAPI && window.jhAPI.computeHWID) ? await window.jhAPI.computeHWID() : null;
                                if (!hwid) { showMessage('تعذر توليد HWID، الرجاء المحاولة مرة أخرى', 'error'); return; }
                                try { await navigator.clipboard.writeText(hwid); showMessage('✅ تم النسخ', 'success'); } catch(e) { showMessage('تعذّر نسخ القيمة', 'error'); }
                            } catch(e) { showMessage('تعذر توليد HWID، الرجاء المحاولة مرة أخرى', 'error'); }
                        });

                        document.getElementById('whatsappRequestBtn').addEventListener('click', async function(){
                            try {
                                const hwid = (window.jhAPI && window.jhAPI.computeHWID) ? await window.jhAPI.computeHWID() : null;
                                if (!hwid) { showMessage('تعذر توليد HWID، الرجاء المحاولة مرة أخرى', 'error'); return; }
                                const storeName = document.getElementById('storeName') ? document.getElementById('storeName').value || 'غير معروف' : 'غير معروف';
                                const msg = `مرحبًا، هذا HWID: ${hwid} – اسم المحل: ${storeName} – الرجاء إرسال ملف تفعيل لمدة (سنة/شهر/تجريبي).`;
                                const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                                window.open(url, '_blank');
                            } catch(e) { showMessage('تعذر فتح واتساب', 'error'); }
                        });
                    });
                }
            } else {
                // show info: active until
                if (status.end_at) {
                    const displayEl = document.createElement('div');
                    displayEl.className = 'license-info';
                    displayEl.style.marginTop = '8px';
                    displayEl.textContent = `${getText('licensed_until') || 'مفعّل حتى:'} ${new Date(status.end_at).toLocaleDateString()} — ${getText('days_left') || 'متبقي:'} ${status.days_left}`;
                    const card = document.querySelector('.login-card');
                    if (card) card.appendChild(displayEl);
                    if (status.days_left !== undefined && status.days_left < 10) {
                        displayEl.style.background = '#fff6d6';
                        displayEl.style.padding = '8px';
                        displayEl.style.borderRadius = '6px';
                    }
                }
            }
            if (importBtn) {
                importBtn.addEventListener('click', async function(){
                    try {
                        const filePath = await window.jhAPI.openImportDialog();
                        if (!filePath) return;
                        const res = await window.jhAPI.importLicense(filePath);
                        if (res && res.success) {
                            showMessage('تم استيراد التفعيل بنجاح', 'success');
                            // hide import button after success
                            importBtn.style.display = 'none';
                            // enable login immediately
                            const loginBtn = document.querySelector('#loginForm button[type="submit"]');
                            if (loginBtn) loginBtn.disabled = false;
                            // mark forced active for this session so future checks allow login
                            try { __licenseForcedActive = true; } catch(e){}
                            // remove any license_not_active toasts by removing error messages that match
                            document.querySelectorAll('.error-message').forEach(el => {
                                if (el.textContent && el.textContent.includes(getText('license_not_active'))) el.remove();
                            });
                            // show license info immediately
                            const payload = { end_at: res.end_at, days_left: res.days_left };
                            // append info
                            const card = document.querySelector('.login-card');
                            if (card) {
                                const displayEl = document.createElement('div');
                                displayEl.className = 'license-info';
                                displayEl.style.marginTop = '8px';
                                displayEl.textContent = `${getText('licensed_until') || 'مفعّل حتى:'} ${new Date(payload.end_at).toLocaleDateString()} — ${getText('days_left') || 'متبقي:'} ${payload.days_left}`;
                                card.appendChild(displayEl);
                            }
                            // emit activated event to any listeners (already done in main)
                            try { window.dispatchEvent && window.dispatchEvent(new CustomEvent('license:activated', { detail: payload })); } catch(e){}
                        } else {
                            showMessage(res && res.message ? res.message : 'فشل استيراد ملف التفعيل', 'error');
                        }
                    } catch(err) {
                        showMessage(err.message || 'فشل استيراد ملف التفعيل', 'error');
                    }
                });
            }
        } catch(e) { console.error(e); }
    })();
    
    // تحسين القائمة الجانبية للموبايل
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            if (overlay) {
                overlay.classList.toggle('active');
            }
        });
    }
    
    // إغلاق القائمة عند النقر على overlay
    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
    
    // إغلاق القائمة عند النقر على عنصر قائمة
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                if (overlay) {
                    overlay.classList.remove('active');
                }
            }
        });
    });
    
    // تحسين اللمس للمنتجات
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('touchstart', function(e) {
            this.style.transform = 'scale(0.98)';
        });
        
        card.addEventListener('touchend', function(e) {
            this.style.transform = 'scale(1)';
        });
    });
    
    // تحسين اللمس لأزرار العربة
    const cartButtons = document.querySelectorAll('.quantity-btn-horizontal-pos, .remove-btn-horizontal-pos');
    cartButtons.forEach(button => {
        button.addEventListener('touchstart', function(e) {
            this.style.transform = 'scale(0.9)';
        });
        
        button.addEventListener('touchend', function(e) {
            this.style.transform = 'scale(1)';
        });
    });
    
    // تحسين النوافذ المنبثقة للموبايل
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });
    });
    
    // تحسين التمرير في العربة
    const cartContainer = document.querySelector('.cart-items-horizontal-pos');
    if (cartContainer) {
        cartContainer.addEventListener('touchstart', function(e) {
            this.style.overflowY = 'auto';
        });
    }
    
    // تحسين البحث للموبايل
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            // لا تمرير تلقائي على الموبايل لتجنب رفع الصفحة
        });
    }
    
    // تحسين الأزرار الكبيرة للموبايل
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(button => {
        if (window.innerWidth <= 768) {
            button.style.minHeight = '44px';
            button.style.minWidth = '44px';
        }
    });
    
    // تحديث عند تغيير حجم الشاشة
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            if (overlay) {
                overlay.classList.remove('active');
            }
        }
    });
}

// استدعاء تحسينات الموبايل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    setupMobileOptimizations();
    setupNavigationToggle();
    setupLanguageToggle();
    
    // إعداد واجهة الدفع
    setupPartialPaymentInterface();
    
    // تحميل اللغة المحفوظة وتطبيق الترجمات مرة واحدة
    const savedLang = (function(){ try { return localStorage.getItem('appLanguage'); } catch(e) { return null; } })() || currentLanguage || 'ar';
    if (typeof window.changeLanguage === 'function') {
        try { window.changeLanguage(savedLang); } catch(e) { try { window.translateUI && window.translateUI(savedLang); } catch(_) {} }
    } else {
        try { window.translateUI && window.translateUI(savedLang); } catch(_) {}
        try { applyTranslations(); } catch(_) {}
    }
    
    // تحديث قوائم العملاء
    setTimeout(() => {
        updateCustomerSelectForCredit();
    }, 500);

    // فحص وإصلاح timestamps المبيعات القديمة (مرة واحدة فقط)
    setTimeout(() => {
        try {
            const lastFixCheck = localStorage.getItem('salesTimestampFixCheck');
            const today = new Date().toISOString().split('T')[0];
            
            // تشغيل الفحص مرة واحدة في اليوم فقط
            if (lastFixCheck !== today) {
                const status = checkSalesTimestampsStatus();
                
                if (status.needsFix > 0) {
                    console.log(`🔧 تم اكتشاف ${status.needsFix} من المبيعات تحتاج إصلاح timestamp`);
                    // تشغيل إصلاح تلقائي
                    fixOldSalesTimestamps();
                } else {
                    console.log('✅ جميع المبيعات تحتوي على timestamps صحيحة');
                }
                
                // حفظ تاريخ آخر فحص
                localStorage.setItem('salesTimestampFixCheck', today);
            }
        } catch (error) {
            console.error('خطأ في فحص timestamps المبيعات:', error);
        }
    }, 1000);

    // Listen for license activation events from main process and refresh login UI
    try {
        if (window.jhAPI && window.jhAPI.onLicenseActivated) {
            window.jhAPI.onLicenseActivated(function(payload) {
                try {
                    // enable login
                    const loginBtn = document.querySelector('#loginForm button[type="submit"]');
                    if (loginBtn) loginBtn.disabled = false;
                    // remove license_not_active toasts
                    document.querySelectorAll('.error-message').forEach(el => {
                        if (el.textContent && el.textContent.includes(getText('license_not_active'))) el.remove();
                    });
                    // show license info on login card
                    const card = document.querySelector('.login-card');
                    if (card) {
                        const existing = card.querySelector('.license-info');
                        if (existing) existing.remove();
                        const displayEl = document.createElement('div');
                        displayEl.className = 'license-info';
                        displayEl.style.marginTop = '8px';
                        displayEl.textContent = `${getText('licensed_until') || 'مفعّل حتى:'} ${new Date(payload.end_at).toLocaleDateString()} — ${getText('days_left') || 'متبقي:'} ${payload.days_left}`;
                        card.appendChild(displayEl);
                    }
                    // update settings UI license days immediately
                    try { const el = document.getElementById('licenseDaysLeft'); if (el) { const days = payload.days_left || 0; el.textContent = `الأيام المتبقية لانتهاء الاشتراك: ${days} يوم`; if (days>=30) el.className='license-days safe'; else if (days>=7) el.className='license-days warn'; else el.className='license-days danger'; } } catch(e){}
                } catch(e) { console.error('onLicenseActivated handler error', e); }
            });
        }
    } catch(e) { console.warn('Failed to register onLicenseActivated', e); }
    
    // التأكد من عمل زر التحكم بعد تحميل الصفحة
    setTimeout(() => {
        ensureToggleButtonWorks();
    }, 1000);
    
    // زر إكمال الباقي بالليرة
    const completeBtn = document.getElementById('completeRemainderLBP');
    if (completeBtn) completeBtn.innerHTML = `<i class="fas fa-exchange-alt"></i> ${getText('complete-remainder')}`;
    if (completeBtn) {
        completeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const currency = document.getElementById('currency').value;
            const paymentCurrency = document.getElementById('paymentCurrency').value;
            const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
            const finalTotalText = document.getElementById('finalTotal').textContent;
            let totalDueUSD;
            if (currency === 'USD') {
                totalDueUSD = parseFloat(finalTotalText.replace(/[^0-9.-]+/g, '')) || 0;
            } else {
                const rawLBP = parseFloat(finalTotalText.replace(/[^0-9.-]+/g, '')) || 0;
                totalDueUSD = rawLBP / (settings.exchangeRate || 1);
            }
            const paidUSD = paymentCurrency === 'USD' ? amountPaid : (amountPaid / (settings.exchangeRate || 1));
            const remainingUSD = Math.max(0, totalDueUSD - paidUSD);
            const remainderLBP = Math.round(remainingUSD * (settings.exchangeRate || 1));
            const disp = document.getElementById('remainderLBPDisplay');
            if (disp) {
                if (remainderLBP > 0) {
                    disp.style.display = 'inline-flex';
                    disp.textContent = `${remainderLBP.toLocaleString()} ل.ل`;
                } else {
                    disp.style.display = 'none';
                    disp.textContent = '';
                }
            }
            window.__completeRemainderLBP__ = remainderLBP > 0;
            showMessage(remainderLBP > 0 ? getText('will-complete-lbp') : getText('no-remainder'), remainderLBP > 0 ? 'success' : 'error');
        });
    }
});

// إعداد تبديل اللغة
function setupLanguageToggle() {
    const languageSelect = document.getElementById('languageSelect');
    
    if (languageSelect) {
        // تعيين اللغة الافتراضية فقط (تفادي مستمع مزدوج، تمت معالجته في i18n IIFE)
        languageSelect.value = currentLanguage;
        console.log('تم إعداد تبديل اللغة');
    }
}

// إعداد زر إظهار/إخفاء القائمة
function setupNavigationToggle() {
    const navToggleBtn = document.getElementById('navToggleBtn');
    const navMenu = document.getElementById('navMenu');
    
    if (!navToggleBtn || !navMenu) {
        console.error('عناصر التحكم في القائمة غير موجودة');
        return;
    }
    
    console.log('تم العثور على زر التحكم:', navToggleBtn);
    
    // إضافة مستمع الحدث للنقر على الزر
    navToggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('تم النقر على زر التحكم');
        toggleNavigationMenu();
    });
    
    // تحديد الحالة الافتراضية (مفتوحة)
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.add('expanded');
    navMenu.classList.add('expanded');
    mainContent.classList.remove('sidebar-hidden');
    
    updateToggleButtonText(false);
    
    console.log('تم إعداد زر التحكم بنجاح');
}

// تبديل حالة القائمة (إظهار/إخفاء)
function toggleNavigationMenu() {
    console.log('تم استدعاء toggleNavigationMenu');
    const sidebar = document.querySelector('.sidebar');
    
    if (!sidebar) {
        console.error('لم يتم العثور على القائمة الجانبية');
        return;
    }
    
    console.log('حالة القائمة الجانبية:', sidebar.classList.contains('collapsed'));
    
    if (sidebar.classList.contains('collapsed')) {
        // إظهار القائمة
        console.log('إظهار القائمة');
        showNavigationMenu();
    } else {
        // إخفاء القائمة
        console.log('إخفاء القائمة');
        hideNavigationMenu();
    }
}

// إظهار القائمة
function showNavigationMenu() {
    const navToggleBtn = document.getElementById('navToggleBtn');
    const navMenu = document.getElementById('navMenu');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    // إظهار القائمة الجانبية
    sidebar.classList.remove('collapsed');
    sidebar.classList.add('expanded');
    
    // إظهار عناصر القائمة
    navMenu.classList.remove('collapsed');
    navMenu.classList.add('expanded');
    
    // تحديث الزر
    navToggleBtn.classList.remove('collapsed');
    
    // تعديل المحتوى الرئيسي
    mainContent.classList.remove('sidebar-hidden');
    
    updateToggleButtonText(false);
    
    // إظهار رسالة تأكيد
    showMessage(getText('menu-shown'), 'success');
}
// إخفاء القائمة
function hideNavigationMenu() {
    const navToggleBtn = document.getElementById('navToggleBtn');
    const navMenu = document.getElementById('navMenu');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    // إخفاء القائمة الجانبية
    sidebar.classList.remove('expanded');
    sidebar.classList.add('collapsed');
    
    // إخفاء عناصر القائمة
    navMenu.classList.remove('expanded');
    navMenu.classList.add('collapsed');
    
    // تحديث الزر
    navToggleBtn.classList.add('collapsed');
    
    // تعديل المحتوى الرئيسي ليملأ المساحة
    mainContent.classList.add('sidebar-hidden');
    
    updateToggleButtonText(true);
    
    // إظهار رسالة تأكيد
    showMessage(getText('menu-hidden'), 'success');
}

// تحديث نص الزر
function updateToggleButtonText(isCollapsed) {
    const navToggleBtn = document.getElementById('navToggleBtn');
    const spanElement = navToggleBtn.querySelector('span');
    const eyeIcon = navToggleBtn.querySelector('i:first-child');
    
    if (isCollapsed) {
        spanElement.textContent = getText('show-menu');
        eyeIcon.className = 'fas fa-eye';
    } else {
        spanElement.textContent = getText('hide-menu');
        eyeIcon.className = 'fas fa-eye-slash';
    }
}

// إضافة وظيفة للتأكد من أن الزر يعمل دائماً
function ensureToggleButtonWorks() {
    const navToggleBtn = document.getElementById('navToggleBtn');
    const sidebar = document.querySelector('.sidebar');
    
    if (navToggleBtn && sidebar) {
        // إضافة مستمع الحدث مرة أخرى للتأكد
        navToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('تم النقر على الزر من ensureToggleButtonWorks');
            toggleNavigationMenu();
        });
        
        // إضافة مستمع الحدث للضغط على المفتاح Enter
        navToggleBtn.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                toggleNavigationMenu();
            }
        });
        
        console.log('تم التأكد من عمل زر التحكم في القائمة');
    } else {
        console.error('لم يتم العثور على عناصر التحكم');
    }
}

// جعل الوظيفة متاحة عالمياً
window.toggleNavigationMenu = toggleNavigationMenu;

// دالة لترجمة الصفحة الحالية
function translateCurrentPage() {
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        const pageId = activePage.id;
        if (pageId === 'sales') {
            translateSales();
        } else if (pageId === 'reports') {
            translateReports();
        }
    }
}

// استدعاء ترجمة الصفحة الحالية كل ثانية
setInterval(translateCurrentPage, 1000);

// ===== نظام البيع بالدين والأقساط =====

// إعداد واجهة البيع بالدين
function setupCreditSaleInterface() {
    const creditCustomerSelect = document.getElementById('creditCustomerSelect');
    if (!creditCustomerSelect) return;
    
    // تحديث قائمة العملاء للبيع بالدين
    updateCustomerSelectForCredit();
    
    // إضافة مستمع الحدث لاختيار العميل
    creditCustomerSelect.addEventListener('change', function() {
        const customerId = parseInt(this.value);
        if (customerId) {
            updateCreditInfo(customerId);
        }
    });
}

// إعداد واجهة البيع على أقساط
function setupInstallmentSaleInterface() {
    const installmentCustomerSelect = document.getElementById('installmentCustomerSelect');
    const calculateInstallmentBtn = document.getElementById('calculateInstallment');
    
    if (!installmentCustomerSelect) return;
    
    // تحديث قائمة العملاء للبيع على أقساط
    updateCustomerSelectForInstallment();
    
    // إضافة مستمع الحدث لحساب الأقساط
    if (calculateInstallmentBtn) {
        calculateInstallmentBtn.addEventListener('click', calculateInstallments);
    }
}

// تحديث قائمة العملاء للبيع بالدين
function updateCustomerSelectForCredit() {
    const sel = document.getElementById('creditCustomerSelect');
    const list = document.getElementById('creditCustomerList');
    const search = document.getElementById('creditCustomerSearch');
    
    if (sel) sel.innerHTML = customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    
    // initialize combo
    const renderList = (term='') => {
        if (!list) return;
        const t = (term||'').trim().toLowerCase();
        const filtered = customers.filter(c => {
            const name = (c.name||'').toLowerCase();
            const mail = (c.email||'').toLowerCase();
            const phone = (c.phone||'').toLowerCase();
            return !t || name.includes(t) || mail.includes(t) || phone.includes(t);
        });
        if (filtered.length === 0) {
            list.innerHTML = `<div class="customer-item">لا نتائج</div>`;
        } else {
            list.innerHTML = filtered.map(c=>`<div class="customer-item" data-id="${c.id}"><span>${c.name}</span><span class="debt">${getText('current-debt')}: ${formatCurrency(c.creditBalance || 0)}</span></div>`).join('');
        }
        list.style.display = 'block';
        // bind click
        list.querySelectorAll('.customer-item').forEach(item => {
            item.onclick = function(){
                const id = parseInt(this.dataset.id);
                if (sel) sel.value = String(id);
                if (search) search.value = customers.find(c=>c.id===id)?.name || '';
                list.style.display = 'none';
                // تحديث معلومات الائتمان
                if (typeof updateCreditInfo === 'function') {
                    updateCreditInfo(id);
                }
            };
        });
    };
    
    if (search) {
        search.addEventListener('click', function() {
            this.readOnly = false;
            this.focus();
            renderList('');
        });
        
        search.addEventListener('input', function() {
            renderList(this.value);
        });
        
        search.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                list.style.display = 'none';
                this.blur();
            }
        });
    }
    
    // إخفاء القائمة عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#creditCustomerCombo')) {
            if (list) list.style.display = 'none';
        }
    });
    
    // مسح الخيارات الموجودة
    if (sel) sel.innerHTML = '<option value="">اختر عميل...</option>';
    
    // إضافة العملاء
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        const remainingCredit = customer.creditLimit - (customer.currentDebt || 0);
        option.textContent = `${customer.name} (حد: ${customer.creditLimit}$ - متاح: ${remainingCredit}$)`;
        sel.appendChild(option);
    });
}


// تحديث معلومات الائتمان
function updateCreditInfo(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        return;
    }
    
    const creditLimitDisplay = document.getElementById('creditLimitDisplay');
    const currentDebtDisplay = document.getElementById('currentDebtDisplay');
    const remainingCreditDisplay = document.getElementById('remainingCreditDisplay');
    
    if (creditLimitDisplay) creditLimitDisplay.textContent = `${customer.creditLimit}$`;
    if (currentDebtDisplay) currentDebtDisplay.textContent = `${customer.currentDebt || 0}$`;
    
    const remainingCredit = customer.creditLimit - (customer.currentDebt || 0);
    if (remainingCreditDisplay) remainingCreditDisplay.textContent = `${remainingCredit}$`;
    
    // تغيير لون النص حسب الائتمان المتاح
    if (remainingCreditDisplay) {
        if (remainingCredit > 0) {
            remainingCreditDisplay.style.color = '#10b981';
        } else {
            remainingCreditDisplay.style.color = '#ef4444';
        }
    }
}




// معالجة البيع بالدين
function processCreditSale() {
    try {
        const customerId = document.getElementById('creditCustomerSelect')?.value || '';
        const currency = (document.getElementById('currency')?.value) || 'USD';
        const finalText = (document.getElementById('finalTotal')?.textContent || '').trim();
        let finalTotal = 0;
        if (currency === 'USD') {
            finalTotal = parseFloat(finalText.replace(/[^0-9.-]+/g, '')) || 0;
        } else {
            const rawLBP = parseFloat(finalText.replace(/[^0-9.-]+/g, '')) || 0;
            finalTotal = (rawLBP / (settings.exchangeRate || 1));
        }
        if (!customerId) {
            showMessage('يرجى اختيار عميل', 'error');
            return;
        }
        const customer = customers.find(c => c.id === parseInt(customerId));
        if (!customer) {
            showMessage('العميل غير موجود', 'error');
            return;
        }
        const existingDebt = (customer.currentDebt != null ? customer.currentDebt : (customer.creditBalance || 0));
        const remainingCredit = (customer.creditLimit || 0) - existingDebt;
        if (finalTotal > remainingCredit + 1e-6) {
            showMessage(getText('credit-exceeded'), 'error');
            return;
        }
        if (finalTotal <= 0) {
            showMessage('إجمالي الفاتورة غير صحيح', 'error');
            return;
        }
        if (confirm(getText('confirm-credit-sale'))) {
            customer.currentDebt = existingDebt + finalTotal;
            customer.creditBalance = customer.currentDebt;
            if (!Array.isArray(customer.creditHistory)) customer.creditHistory = [];
            customer.creditHistory.push({ timestamp: new Date().toISOString(), type: 'creditSale', amount: finalTotal, description: 'بيع بالدين كامل', balanceAfter: customer.creditBalance });
            saveToStorage('customers', customers);
            // إنقاص المخزون فوراً لكل بند
            try {
                cart.forEach(item => {
                    const product = products.find(p => p.id === item.id);
                    if (product) {
                        product.stock = Math.max(0, (product.stock || 0) - (item.quantity || 1));
                        recordStockMovement('sale', product.id, -(item.quantity || 1), 'PENDING', `خصم بيع بالدين ${item.name}`);
                    }
                });
                saveToStorage('products', products);
            } catch(e) { console.warn('credit sale stock update failed', e); }

            const newInvoice = createCreditSaleInvoice(customer, finalTotal);
            saveToStorage('sales', sales);
            try { updateCreditInfo(customer.id); } catch(e) {}
            try { updateCustomerSelectForCredit(); } catch(e) {}
            try { updateAllCustomersTotalPurchases(); } catch(e) {}
            const logs = loadFromStorage('customerLogs', {});
            const key = String(customer.id);
            if (!Array.isArray(logs[key])) logs[key] = [];
            const logEntry = { timestamp: new Date().toLocaleString(), action: 'دين', user: (currentUser || 'المستخدم'), note: `فاتورة ${newInvoice.invoiceNumber} بقيمة ${finalTotal.toFixed(2)}$` };
            logs[key].push(logEntry);
            saveToStorage('customerLogs', logs);
            console.log('Saved customerLogs entry:', key, logEntry);
            clearCart();
            updateCart();
            lastCartFocusIndex = null;
            try { loadCustomers(); } catch(e) {}
            try {
                const currencyNow = (document.getElementById('currency')?.value) || 'USD';
                const finalEl = document.getElementById('finalTotal');
                if (finalEl) finalEl.textContent = formatCurrency(0, currencyNow);
                const horiz = document.getElementById('cartItemsHorizontalPos');
                if (horiz) horiz.innerHTML = '<div class="cart-empty-horizontal-pos">🛒 العربة فارغة - انقر على المنتجات لإضافتها</div>';
            } catch(e) {}
            try { openCustomerTransactions(customer.id); } catch(e) {}
            showNotification(getText('credit-sale-success'), 'success', 3000);
            const pm = document.getElementById('paymentMethod');
            if (pm) {
                pm.value = 'cash';
                try { pm.dispatchEvent(new Event('change')); } catch(e) {}
            }
            const creditSectionEl = document.getElementById('creditSaleSection');
            if (creditSectionEl) creditSectionEl.style.display = 'none';
            const cashSectionEl = document.getElementById('cashPaymentSection');
            if (cashSectionEl) cashSectionEl.style.display = 'block';
            if (newInvoice) {
                setTimeout(() => {
                    showInvoice(newInvoice);
                }, 500);
            }
        }
    } catch (err) {
        console.error('processCreditSale error:', err);
        showMessage('حدث خطأ أثناء البيع بالدين: ' + (err?.message || err), 'error');
    }
}


// منشئ معرف فاتورة فريد
function generateInvoiceId() {
    const prefix = 'INV-';
    const time = Date.now().toString(36);
    const rand = Math.floor(Math.random() * 1e9).toString(36);
    return prefix + time + '-' + rand;
}

// إنشاء فاتورة البيع بالدين
 function createCreditSaleInvoice(customer, amount) {
    const now = new Date();
    const localDateTimeISO = getLocalDateTimeISO();
    const invoice = {
        id: generateInvoiceId(),
        invoiceNumber: `CR-${(sales.length + 1).toString().padStart(3, '0')}`,
        customerId: customer.id,
        customerName: customer.name,
        amount: amount,
        paymentMethod: 'credit',
        status: 'completed',
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`, // التاريخ المحلي
        timestamp: localDateTimeISO, // الوقت الكامل بالوقت المحلي
        // حصّل العناصر بالأسعار النهائية بالدولار لضمان الحساب/العرض
        items: cart.map(item => {
            const baseUSD = (item.customPriceUSD != null ? item.customPriceUSD : item.priceUSD) || 0;
            const originalUSD = item.priceUSD || baseUSD;
            const discountUSD = Math.max(0, originalUSD - baseUSD);
            const discountPct = originalUSD > 0 ? +((discountUSD / originalUSD) * 100).toFixed(1) : 0;
            return {
                id: item.id,
                name: item.name,
                quantity: item.quantity || 1,
                price: baseUSD,
                originalPriceUSD: originalUSD,
                finalPriceUSD: baseUSD,
                discountUSD,
                discountPct
            };
        })
    };
    
    // ربط حركات المخزون برقم فاتورة الدين
    try {
        const movements = loadFromStorage('stockMovements', []);
        movements.forEach(m => { if (m.invoiceNumber === 'PENDING') m.invoiceNumber = invoice.invoiceNumber; });
        saveToStorage('stockMovements', movements);
    } catch(e) {}

    sales.push(invoice);
    saveToStorage('sales', sales);
    // سجل المبيعات: البيع بالدين - استخدام نفس timestamp الفاتورة
    const salesLogs = loadFromStorage('salesLogs', []);
    salesLogs.push({
        timestamp: invoice.timestamp, // استخدام نفس timestamp الفاتورة المحلي الحقيقي
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: 'USD',
        method: 'credit',
        customer: invoice.customerName || '-',
        user: currentUser || 'المستخدم'
    });
    saveToStorage('salesLogs', salesLogs);
    return invoice;
}

// ===== Event Listeners لتقرير النفقات =====

// إعداد event listeners لتقرير النفقات
function setupExpensesReportEventListeners() {
    // زر تطبيق الفلاتر
    document.getElementById('expensesApplyFilter')?.addEventListener('click', () => {
        const expenses = getExpensesData();
        const filtered = applyExpensesFilters(expenses);
        displayExpensesTable(filtered);
        updateExpensesSummary(filtered);
    });
    
    // زر إعادة تعيين الفلاتر
    document.getElementById('expensesResetFilter')?.addEventListener('click', () => {
        const ids = ['expensesFromDate', 'expensesCategoryFilter', 'expensesUserFilter', 'expensesSearch'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (el.tagName === 'SELECT') el.value = 'all';
            else el.value = '';
        });
        
        // إعادة عرض البيانات بدون فلاتر
        const expenses = getExpensesData();
        displayExpensesTable(expenses);
        updateExpensesSummary(expenses);
    });
    
    // زر تصدير CSV
    document.getElementById('expensesExportCsv')?.addEventListener('click', exportExpensesCsv);
}


// تشغيل إعداد event listeners عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    setupExpensesReportEventListeners();
});

// ===== نظام Pagination لتقرير المخزون =====

// متغيرات pagination للمخزون
let inventoryCurrentPage = 1;
let inventoryPageSize = 25;
let inventorySortBy = 'name';
let inventorySortDir = 'asc';
let inventoryFilteredData = [];

// إعداد pagination للمخزون
function setupInventoryPagination() {
    // تحميل الحالة المحفوظة
    loadInventoryPaginationState();
    
    // تطبيق البيانات والترتيب الأولي
    applyInventoryFilters();
    
    // إعداد event listeners
    setupInventoryPaginationEvents();
    
    // عرض البيانات
    renderInventoryTable();
}

// تحميل الحالة المحفوظة
function loadInventoryPaginationState() {
    try {
        const saved = sessionStorage.getItem('inventoryPaginationState');
        if (saved) {
            const state = JSON.parse(saved);
            inventoryCurrentPage = state.page || 1;
            inventoryPageSize = state.pageSize || 25;
            inventorySortBy = state.sortBy || 'name';
            inventorySortDir = state.sortDir || 'asc';
        }
    } catch (e) {
        console.warn('Error loading inventory pagination state:', e);
    }
}

// حفظ الحالة
function saveInventoryPaginationState() {
    try {
        const state = {
            page: inventoryCurrentPage,
            pageSize: inventoryPageSize,
            sortBy: inventorySortBy,
            sortDir: inventorySortDir
        };
        sessionStorage.setItem('inventoryPaginationState', JSON.stringify(state));
    } catch (e) {
        console.warn('Error saving inventory pagination state:', e);
    }
}

// تطبيق الفلاتر والترتيب
function applyInventoryFilters() {
    inventoryFilteredData = products.map(product => ({
        ...product,
        totalValue: product.stock * product.priceUSD
    }));
    
    // تطبيق الترتيب
    inventoryFilteredData.sort((a, b) => {
        let aVal = a[inventorySortBy];
        let bVal = b[inventorySortBy];
        
        // معالجة الأرقام
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return inventorySortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // معالجة النصوص
        const aStr = String(aVal || '').toLowerCase();
        const bStr = String(bVal || '').toLowerCase();
        return inventorySortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
}

// إعداد event listeners
function setupInventoryPaginationEvents() {
    // أزرار التنقل
    document.getElementById('inventoryFirstPage')?.addEventListener('click', () => goToInventoryPage(1));
    document.getElementById('inventoryPrevPage')?.addEventListener('click', () => goToInventoryPage(inventoryCurrentPage - 1));
    document.getElementById('inventoryNextPage')?.addEventListener('click', () => goToInventoryPage(inventoryCurrentPage + 1));
    document.getElementById('inventoryLastPage')?.addEventListener('click', () => goToInventoryPage(getInventoryTotalPages()));
    
    // تغيير عدد الصفوف
    document.getElementById('inventoryRowsPerPage')?.addEventListener('change', (e) => {
        inventoryPageSize = parseInt(e.target.value);
        inventoryCurrentPage = 1;
        saveInventoryPaginationState();
        renderInventoryTable();
    });
    
    // ترتيب الأعمدة
    document.querySelectorAll('#inventoryReportTable th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const sortBy = th.getAttribute('data-sort');
            if (inventorySortBy === sortBy) {
                inventorySortDir = inventorySortDir === 'asc' ? 'desc' : 'asc';
            } else {
                inventorySortBy = sortBy;
                inventorySortDir = 'asc';
            }
            inventoryCurrentPage = 1;
            saveInventoryPaginationState();
            applyInventoryFilters();
            renderInventoryTable();
            updateInventorySortIcons();
        });
    });
}

// التنقل إلى صفحة محددة
function goToInventoryPage(page) {
    const totalPages = getInventoryTotalPages();
    if (page >= 1 && page <= totalPages) {
        inventoryCurrentPage = page;
        saveInventoryPaginationState();
        renderInventoryTable();
    }
}

// حساب إجمالي الصفحات
function getInventoryTotalPages() {
    return Math.ceil(inventoryFilteredData.length / inventoryPageSize);
}

// عرض الجدول
function renderInventoryTable() {
    const tbody = document.getElementById('inventoryReportTableBody');
    if (!tbody) return;
    
    const start = (inventoryCurrentPage - 1) * inventoryPageSize;
    const end = start + inventoryPageSize;
    const pageData = inventoryFilteredData.slice(start, end);
    
    const isEn = (document.documentElement.lang || 'ar') === 'en';
    
    tbody.innerHTML = pageData.map((product, index) => {
        const isLowStock = product.stock <= product.minStock;
        const stockColor = isLowStock ? '#dc2626' : '#1f2937';
        const stockWeight = isLowStock ? 'bold' : 'normal';
        
        return `
            <tr style="border-bottom: 1px solid #f3f4f6; ${index % 2 === 0 ? 'background: #fafafa;' : 'background: white;'}">
                <td style="padding: 10px 8px; font-size: 13px; color: #1f2937; font-weight: 600;">${product.name}</td>
                <td style="padding: 10px 8px; font-size: 13px; color: #6b7280;">${product.category || (isEn ? 'Uncategorized' : 'غير مصنف')}</td>
                <td style="padding: 10px 8px; font-size: 13px; color: ${stockColor}; font-weight: ${stockWeight}; text-align: center;">${product.stock}</td>
                <td style="padding: 10px 8px; font-size: 13px; color: #059669; font-weight: 600;">${formatCurrency(product.priceUSD)}</td>
                <td style="padding: 10px 8px; font-size: 13px; color: #1f2937; font-weight: 600;">${formatCurrency(product.stock * product.priceUSD)}</td>
            </tr>
        `;
    }).join('');
    
    updateInventoryPaginationUI();
}

// تحديث واجهة pagination
function updateInventoryPaginationUI() {
    const totalPages = getInventoryTotalPages();
    const totalItems = inventoryFilteredData.length;
    const start = (inventoryCurrentPage - 1) * inventoryPageSize + 1;
    const end = Math.min(inventoryCurrentPage * inventoryPageSize, totalItems);
    
    // تحديث معلومات الصفحة
    const pageInfo = document.getElementById('inventoryPageInfo');
    if (pageInfo) {
        pageInfo.textContent = `${getText('showing')} ${start}-${end} ${getText('of')} ${totalItems} ${getText('entries')}`;
    }
    
    // تحديث رقم الصفحة الحالية
    const currentPageSpan = document.getElementById('inventoryCurrentPage');
    if (currentPageSpan) {
        currentPageSpan.textContent = inventoryCurrentPage;
    }
    
    // تحديث حالة الأزرار
    const firstBtn = document.getElementById('inventoryFirstPage');
    const prevBtn = document.getElementById('inventoryPrevPage');
    const nextBtn = document.getElementById('inventoryNextPage');
    const lastBtn = document.getElementById('inventoryLastPage');
    
    const isFirst = inventoryCurrentPage === 1;
    const isLast = inventoryCurrentPage === totalPages;
    
    [firstBtn, prevBtn].forEach(btn => {
        if (btn) {
            btn.disabled = isFirst;
            btn.style.opacity = isFirst ? '0.5' : '1';
            btn.style.cursor = isFirst ? 'not-allowed' : 'pointer';
        }
    });
    
    [nextBtn, lastBtn].forEach(btn => {
        if (btn) {
            btn.disabled = isLast;
            btn.style.opacity = isLast ? '0.5' : '1';
            btn.style.cursor = isLast ? 'not-allowed' : 'pointer';
        }
    });
    
    // تحديث dropdown عدد الصفوف
    const rowsSelect = document.getElementById('inventoryRowsPerPage');
    if (rowsSelect) {
        rowsSelect.value = inventoryPageSize;
    }
}

// تحديث أيقونات الترتيب
function updateInventorySortIcons() {
    document.querySelectorAll('#inventoryReportTable th[data-sort] i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    const currentTh = document.querySelector(`#inventoryReportTable th[data-sort="${inventorySortBy}"]`);
    if (currentTh) {
        const icon = currentTh.querySelector('i');
        if (icon) {
            icon.className = inventorySortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        }
    }
}

// ===== نظام Pagination لتقرير المبيعات =====

// متغيرات pagination للمبيعات
let salesCurrentPage = 1;
let salesPageSize = 25;
let salesSortBy = 'date';
let salesSortDir = 'desc';
let salesFilteredData = [];

// إعداد pagination للمبيعات
function setupSalesPagination(salesData) {
    salesFilteredData = salesData;
    
    // تحميل الحالة المحفوظة
    loadSalesPaginationState();
    
    // تطبيق البيانات والترتيب الأولي
    applySalesFilters();
    
    // إعداد event listeners
    setupSalesPaginationEvents();
    
    // عرض البيانات
    renderSalesTable();
}

// تحميل الحالة المحفوظة
function loadSalesPaginationState() {
    try {
        const saved = sessionStorage.getItem('salesPaginationState');
        if (saved) {
            const state = JSON.parse(saved);
            salesCurrentPage = state.page || 1;
            salesPageSize = state.pageSize || 25;
            salesSortBy = state.sortBy || 'date';
            salesSortDir = state.sortDir || 'desc';
        }
    } catch (e) {
        console.warn('Error loading sales pagination state:', e);
    }
}

// حفظ الحالة
function saveSalesPaginationState() {
    try {
        const state = {
            page: salesCurrentPage,
            pageSize: salesPageSize,
            sortBy: salesSortBy,
            sortDir: salesSortDir
        };
        sessionStorage.setItem('salesPaginationState', JSON.stringify(state));
    } catch (e) {
        console.warn('Error saving sales pagination state:', e);
    }
}

// تطبيق الفلاتر والترتيب
function applySalesFilters() {
    // تطبيق الترتيب
    salesFilteredData.sort((a, b) => {
        let aVal = a[salesSortBy];
        let bVal = b[salesSortBy];
        
        // معالجة التواريخ
        if (salesSortBy === 'date') {
            // استخدام timestamp إذا كان متوفراً، وإلا fallback إلى date
            const aDateValue = a.timestamp || a.date || '1900-01-01';
            const bDateValue = b.timestamp || b.date || '1900-01-01';
            
            // تحسين parsing التواريخ لضمان الترتيب الصحيح
            if (aDateValue && aDateValue.includes && aDateValue.includes('T')) {
                if (aDateValue.includes('Z') || aDateValue.includes('+') || aDateValue.includes('-', 10)) {
                    aVal = new Date(aDateValue);
                } else {
                    // timestamp محلي بدون timezone - parse يدوياً
                    const parts = aDateValue.split('T');
                    if (parts.length === 2) {
                        const [datePart, timePart] = parts;
                        const [year, month, day] = datePart.split('-').map(Number);
                        const timeWithMs = timePart.includes('.') ? timePart : timePart + '.000';
                        const [timeOnly, ms] = timeWithMs.split('.');
                        const [hours, minutes, seconds] = timeOnly.split(':').map(Number);
                        aVal = new Date(year, month - 1, day, hours, minutes, seconds, Number(ms.padEnd(3, '0')));
                    } else {
                        aVal = new Date(aDateValue);
                    }
                }
            } else {
                aVal = new Date(aDateValue);
            }
            
            if (bDateValue && bDateValue.includes && bDateValue.includes('T')) {
                if (bDateValue.includes('Z') || bDateValue.includes('+') || bDateValue.includes('-', 10)) {
                    bVal = new Date(bDateValue);
                } else {
                    // timestamp محلي بدون timezone - parse يدوياً
                    const parts = bDateValue.split('T');
                    if (parts.length === 2) {
                        const [datePart, timePart] = parts;
                        const [year, month, day] = datePart.split('-').map(Number);
                        const timeWithMs = timePart.includes('.') ? timePart : timePart + '.000';
                        const [timeOnly, ms] = timeWithMs.split('.');
                        const [hours, minutes, seconds] = timeOnly.split(':').map(Number);
                        bVal = new Date(year, month - 1, day, hours, minutes, seconds, Number(ms.padEnd(3, '0')));
                    } else {
                        bVal = new Date(bDateValue);
                    }
                }
            } else {
                bVal = new Date(bDateValue);
            }
            
            // التحقق من صحة التواريخ
            if (isNaN(aVal.getTime())) aVal = new Date(0);
            if (isNaN(bVal.getTime())) bVal = new Date(0);
        }
        
        // معالجة الأرقام
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return salesSortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // معالجة النصوص
        const aStr = String(aVal || '').toLowerCase();
        const bStr = String(bVal || '').toLowerCase();
        return salesSortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
}

// إعداد event listeners
function setupSalesPaginationEvents() {
    // أزرار التنقل
    document.getElementById('salesFirstPage')?.addEventListener('click', () => goToSalesPage(1));
    document.getElementById('salesPrevPage')?.addEventListener('click', () => goToSalesPage(salesCurrentPage - 1));
    document.getElementById('salesNextPage')?.addEventListener('click', () => goToSalesPage(salesCurrentPage + 1));
    document.getElementById('salesLastPage')?.addEventListener('click', () => goToSalesPage(getSalesTotalPages()));
    
    // تغيير عدد الصفوف
    document.getElementById('salesRowsPerPage')?.addEventListener('change', (e) => {
        salesPageSize = parseInt(e.target.value);
        salesCurrentPage = 1;
        saveSalesPaginationState();
        renderSalesTable();
    });
    
    // ترتيب الأعمدة
    document.querySelectorAll('#salesReportTable th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const sortBy = th.getAttribute('data-sort');
            if (salesSortBy === sortBy) {
                salesSortDir = salesSortDir === 'asc' ? 'desc' : 'asc';
            } else {
                salesSortBy = sortBy;
                salesSortDir = 'asc';
            }
            salesCurrentPage = 1;
            saveSalesPaginationState();
            applySalesFilters();
            renderSalesTable();
            updateSalesSortIcons();
        });
    });
}

// التنقل إلى صفحة محددة
function goToSalesPage(page) {
    const totalPages = getSalesTotalPages();
    if (page >= 1 && page <= totalPages) {
        salesCurrentPage = page;
        saveSalesPaginationState();
        renderSalesTable();
    }
}

// حساب إجمالي الصفحات
function getSalesTotalPages() {
    return Math.ceil(salesFilteredData.length / salesPageSize);
}

// عرض الجدول
function renderSalesTable() {
    const tbody = document.getElementById('salesReportTableBody');
    if (!tbody) return;
    
    const start = (salesCurrentPage - 1) * salesPageSize;
    const end = start + salesPageSize;
    const pageData = salesFilteredData.slice(start, end);
    
    const isEn = (document.documentElement.lang || 'ar') === 'en';
    
    tbody.innerHTML = pageData.map((sale, index) => `
        <tr style="border-bottom: 1px solid #f3f4f6; ${index % 2 === 0 ? 'background: #fafafa;' : 'background: white;'}">
            <td style="padding: 10px 8px; font-size: 13px; color: #1f2937; font-weight: 600;">${sale.invoiceNumber || 'N/A'}</td>
            <td style="padding: 10px 8px; font-size: 13px; color: #6b7280;">${formatDateTime(sale.timestamp || sale.date, sale.paymentMethod)}</td>
            <td style="padding: 10px 8px; font-size: 13px; color: #1f2937;">${sale.customer || (isEn ? 'Walk-in' : 'عميل عادي')}</td>
            <td style="padding: 10px 8px; font-size: 13px; color: #059669; font-weight: 600;">${formatCurrency(sale.amount)}</td>
            <td style="padding: 10px 8px; font-size: 13px; color: #6b7280;">${sale.paymentMethod || (isEn ? 'Cash' : 'نقدي')}</td>
        </tr>
    `).join('');
    
    updateSalesPaginationUI();
}

// تحديث واجهة pagination
function updateSalesPaginationUI() {
    const totalPages = getSalesTotalPages();
    const totalItems = salesFilteredData.length;
    const start = (salesCurrentPage - 1) * salesPageSize + 1;
    const end = Math.min(salesCurrentPage * salesPageSize, totalItems);
    
    // تحديث معلومات الصفحة
    const pageInfo = document.getElementById('salesPageInfo');
    if (pageInfo) {
        pageInfo.textContent = `${getText('showing')} ${start}-${end} ${getText('of')} ${totalItems} ${getText('entries')}`;
    }
    
    // تحديث رقم الصفحة الحالية
    const currentPageSpan = document.getElementById('salesCurrentPage');
    if (currentPageSpan) {
        currentPageSpan.textContent = salesCurrentPage;
    }
    
    // تحديث حالة الأزرار
    const firstBtn = document.getElementById('salesFirstPage');
    const prevBtn = document.getElementById('salesPrevPage');
    const nextBtn = document.getElementById('salesNextPage');
    const lastBtn = document.getElementById('salesLastPage');
    
    const isFirst = salesCurrentPage === 1;
    const isLast = salesCurrentPage === totalPages;
    
    [firstBtn, prevBtn].forEach(btn => {
        if (btn) {
            btn.disabled = isFirst;
            btn.style.opacity = isFirst ? '0.5' : '1';
            btn.style.cursor = isFirst ? 'not-allowed' : 'pointer';
        }
    });
    
    [nextBtn, lastBtn].forEach(btn => {
        if (btn) {
            btn.disabled = isLast;
            btn.style.opacity = isLast ? '0.5' : '1';
            btn.style.cursor = isLast ? 'not-allowed' : 'pointer';
        }
    });
    
    // تحديث dropdown عدد الصفوف
    const rowsSelect = document.getElementById('salesRowsPerPage');
    if (rowsSelect) {
        rowsSelect.value = salesPageSize;
    }
}

// تحديث أيقونات الترتيب
function updateSalesSortIcons() {
    document.querySelectorAll('#salesReportTable th[data-sort] i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    const currentTh = document.querySelector(`#salesReportTable th[data-sort="${salesSortBy}"]`);
    if (currentTh) {
        const icon = currentTh.querySelector('i');
        if (icon) {
        icon.className = salesSortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
}

// دالة لاختبار مباشر من Console
function forceUpdateLicense() {
    console.log('=== FORCING LICENSE UPDATE ===');
    updateSettingsLicenseDisplay();
}

// دالة لإصلاح عناصر الإعدادات
function fixSettingsElements() {
    console.log('Fixing settings elements...');
    
    // إصلاح عنصر support-phone-desc
    const supportPhoneDesc = document.querySelector('[data-i18n="support-phone-desc"]');
    if (supportPhoneDesc) {
        supportPhoneDesc.textContent = getText('support-phone-desc');
        console.log('Fixed support-phone-desc:', supportPhoneDesc.textContent);
    }
    
    // إصلاح عنصر support-phone
    const supportPhone = document.querySelector('[data-i18n="support-phone"]');
    if (supportPhone) {
        supportPhone.textContent = getText('support-phone');
        console.log('Fixed support-phone:', supportPhone.textContent);
    }
    
    // إصلاح عنصر nav_cashbox
    const navCashbox = document.querySelector('[data-i18n="nav_cashbox"]');
    if (navCashbox) {
        navCashbox.textContent = getText('nav_cashbox');
        console.log('Fixed nav_cashbox:', navCashbox.textContent);
    }
    
    // إصلاح زر cash-movement
    fixCashMovementButton();
    
    // إصلاح أزرار الإعدادات
    const saveStoreBtn = document.querySelector('#saveStoreInfo span');
    if (saveStoreBtn) {
        saveStoreBtn.textContent = getText('save-store-info');
    }
    
    const renewBtn = document.querySelector('#renewLicenseBtn span');
    if (renewBtn) {
        renewBtn.textContent = getText('renew-license');
    }
    
    // إصلاح تسميات معلومات المتجر
    const storeNameLabel = document.querySelector('label[data-i18n="store-name"]');
    if (storeNameLabel) {
        storeNameLabel.textContent = getText('store-name');
    }
    
    const storeAddressLabel = document.querySelector('label[data-i18n="store-address"]');
    if (storeAddressLabel) {
        storeAddressLabel.textContent = getText('store-address');
    }
    
    const storePhoneLabel = document.querySelector('label[data-i18n="store-phone"]');
    if (storePhoneLabel) {
        storePhoneLabel.textContent = getText('store-phone');
    }
    
    // إصلاح نص الأزرار
    setTimeout(() => {
        if (typeof window.fixSettingsButtonsText === 'function') {
            window.fixSettingsButtonsText();
        }
    }, 100);
    
    // إصلاح إضافي بعد فترة أطول
    setTimeout(() => {
        if (typeof window.fixSettingsButtonsText === 'function') {
            window.fixSettingsButtonsText();
        }
    }, 500);
    
    // إصلاح جميع العناصر التي تحتوي على data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            const text = getText(key);
            if (text && text !== key) {
                el.textContent = text;
            }
        }
    });
    
    console.log('Settings elements fixed');
}

// دالة إضافية لإصلاح الزر (في حالة الطوارئ)
window.fixCashMovementButton = function() {
    const cashMovementBtn = document.querySelector('#openCashMove');
    if (cashMovementBtn) {
        const currentLang = document.documentElement.lang || 'ar';
        const isEn = currentLang === 'en';
        const text = isEn ? 'Cash Movement' : 'حركة الصندوق';
        
        // إزالة النص القديم والاحتفاظ بالأيقونة
        const icon = cashMovementBtn.querySelector('i');
        cashMovementBtn.innerHTML = '';
        if (icon) {
            cashMovementBtn.appendChild(icon);
        }
        cashMovementBtn.appendChild(document.createTextNode(' ' + text));
        
        console.log('Emergency fix applied to cash movement button:', text);
        return text;
    } else {
        console.log('Cash movement button not found');
        return null;
    }
};

// دالة طوارئ لإصلاح أزرار الإعدادات
window.fixSettingsButtons = function() {
    const currentLang = document.documentElement.lang || 'ar';
    const isEn = currentLang === 'en';
    
    // إصلاح زر حفظ معلومات المتجر
    const saveStoreBtn = document.querySelector('#saveStoreInfo span');
    if (saveStoreBtn) {
        const text = isEn ? 'Save Store Info' : 'حفظ معلومات المتجر';
        saveStoreBtn.textContent = text;
        console.log('Fixed save store button:', text);
    }
    
    // إصلاح زر تجديد الترخيص
    const renewBtn = document.querySelector('#renewLicenseBtn span');
    if (renewBtn) {
        const text = isEn ? 'Import/Renew License File' : 'استيراد/تجديد ملف التفعيل';
        renewBtn.textContent = text;
        console.log('Fixed renew license button:', text);
    }
    
    // إصلاح تسميات معلومات المتجر
    const storeNameLabel = document.querySelector('label[data-i18n="store-name"]');
    if (storeNameLabel) {
        const text = isEn ? 'Store Name' : 'اسم المتجر';
        storeNameLabel.textContent = text;
        console.log('Fixed store name label:', text);
    }
    
    const storeAddressLabel = document.querySelector('label[data-i18n="store-address"]');
    if (storeAddressLabel) {
        const text = isEn ? 'Store Address' : 'عنوان المتجر';
        storeAddressLabel.textContent = text;
        console.log('Fixed store address label:', text);
    }
    
    const storePhoneLabel = document.querySelector('label[data-i18n="store-phone"]');
    if (storePhoneLabel) {
        const text = isEn ? 'Store Phone' : 'هاتف المتجر';
        storePhoneLabel.textContent = text;
        console.log('Fixed store phone label:', text);
    }
    
    return true;
};

// دالة طوارئ قوية لإصلاح أزرار الإعدادات
window.fixSettingsButtonsText = function() {
    console.log('Fixing settings buttons text visibility with strong approach...');
    
    const saveBtn = document.querySelector('#saveStoreInfo');
    const renewBtn = document.querySelector('#renewLicenseBtn');
    
    const fixButton = (btn, buttonName) => {
        if (!btn) {
            console.log(`${buttonName} button not found`);
            return;
        }
        
        // إصلاح الزر نفسه
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.gap = '8px';
        btn.style.minHeight = '44px';
        btn.style.padding = '12px 20px';
        btn.style.background = 'linear-gradient(135deg, #4c6ef5 0%, #5c7cfa 100%)';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '10px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = '700';
        btn.style.transition = 'all 0.3s ease';
        btn.style.boxShadow = '0 4px 12px rgba(76, 110, 245, 0.25)';
        btn.style.fontSize = '14px';
        btn.style.textAlign = 'center';
        btn.style.whiteSpace = 'nowrap';
        btn.style.position = 'relative';
        btn.style.overflow = 'visible';
        
        // إصلاح النص
        const span = btn.querySelector('span');
        if (span) {
            span.style.display = 'inline';
            span.style.visibility = 'visible';
            span.style.opacity = '1';
            span.style.color = 'white';
            span.style.background = 'transparent';
            span.style.textIndent = '0';
            span.style.whiteSpace = 'nowrap';
            span.style.overflow = 'visible';
            span.style.textOverflow = 'clip';
            span.style.fontWeight = '700';
            span.style.fontSize = '14px';
            span.style.lineHeight = '1.2';
            span.style.zIndex = '10';
            span.style.position = 'relative';
            span.style.margin = '0';
            span.style.padding = '0';
            span.style.border = 'none';
            span.style.width = 'auto';
            span.style.height = 'auto';
            span.style.maxWidth = 'none';
            span.style.maxHeight = 'none';
            span.style.minWidth = '0';
            span.style.minHeight = '0';
            span.style.textAlign = 'center';
            span.style.verticalAlign = 'baseline';
            span.style.textDecoration = 'none';
            span.style.textTransform = 'none';
            span.style.letterSpacing = 'normal';
            span.style.wordSpacing = 'normal';
            span.style.direction = 'ltr';
            span.style.unicodeBidi = 'normal';
            
            console.log(`${buttonName} button text fixed:`, span.textContent);
        } else {
            console.log(`${buttonName} button span not found`);
        }
        
        // إصلاح الأيقونة
        const icon = btn.querySelector('i');
        if (icon) {
            icon.style.display = 'inline-block';
            icon.style.fontSize = '16px';
            icon.style.margin = '0';
            icon.style.padding = '0';
            icon.style.color = 'white';
            icon.style.visibility = 'visible';
            icon.style.opacity = '1';
            icon.style.flexShrink = '0';
        }
    };
    
    fixButton(saveBtn, 'Save Store Info');
    fixButton(renewBtn, 'Renew License');
    
    return true;
};

// دالة طوارئ لإصلاح نافذة حركة الصندوق
window.fixCashMoveModal = function() {
    const descInput = document.getElementById('cashMoveNote');
    if (descInput) {
        const currentLang = document.documentElement.lang || 'ar';
        const isEn = currentLang === 'en';
        const placeholder = isEn ? 'e.g.: purchase supplies/transfer to safe...' : 'مثال: شراء مستلزمات/نقل للخزنة ...';
        descInput.placeholder = placeholder;
        console.log('Emergency fix applied to cash move modal placeholder:', placeholder);
    }
    
    // إصلاح خيارات القائمة المنسدلة
    const selectOptions = document.querySelectorAll('#cashMoveType option');
    if (selectOptions.length >= 3) {
        const currentLang = document.documentElement.lang || 'ar';
        const isEn = currentLang === 'en';
        
        if (isEn) {
            selectOptions[0].textContent = 'Deposit (Input)';
            selectOptions[1].textContent = 'Expense (Output)';
            selectOptions[2].textContent = 'Transfer';
        } else {
            selectOptions[0].textContent = 'إيداع (الادخال)';
            selectOptions[1].textContent = 'إخراج (التخريح)';
            selectOptions[2].textContent = 'نقل (التحويل)';
        }
        
        console.log('Emergency fix applied to cash move options');
        return true;
    } else {
        console.log('Cash move modal options not found');
        return null;
    }
};


// Toggle Tooltip عند الضغط على المؤشر
function initSubscriptionIndicatorEvents() {
    const indicator = document.getElementById('subscriptionIndicator');
    const tooltip = document.getElementById('subscriptionTooltip');
    
    if (!indicator || !tooltip) return;
    
    indicator.addEventListener('click', (e) => {
        e.stopPropagation();
        tooltip.classList.toggle('show');
    });
    
    // إغلاق عند الضغط خارجه
    document.addEventListener('click', (e) => {
        if (!indicator.contains(e.target)) {
            tooltip.classList.remove('show');
        }
    });
}

// دالة الاتصال بالدعم (WhatsApp)
function contactSupport() {
    const phoneNumber = '96171783701';
    const currentLang = document.documentElement.lang || currentLanguage || 'ar';
    const isEn = currentLang === 'en';
    
    const message = isEn 
        ? 'Hello, I need help with my CATCH POS subscription.'
        : 'مرحباً، أحتاج مساعدة بخصوص اشتراك CATCH POS.';
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// تحديث دوري للمؤشر البصري
setInterval(updateVisualSubscriptionIndicator, 5000); // كل 5 ثوانٍ للتأكد من العمل
setInterval(updateSubscriptionDisplays, 60000); // كل دقيقة للتأكد من التزامن

// تحديث عند تحميل الصفحة وعند تسجيل الدخول
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        updateVisualSubscriptionIndicator();
        initSubscriptionIndicatorEvents();
    }, 1000);
});

// تحديث فوري عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        updateVisualSubscriptionIndicator();
    }, 2000);
});

// تحديث إضافي كل ثانية للدقائق الأولى
let updateCounter = 0;
const quickUpdates = setInterval(() => {
    updateCounter++;
    if (updateCounter <= 60) { // أول دقيقة
        updateVisualSubscriptionIndicator();
    } else {
        clearInterval(quickUpdates);
    }
}, 1000);

// دالة للاختبار - يمكن استدعاؤها من console
window.testSubscriptionIndicator = function() {
    console.log('🧪 Testing subscription indicator...');
    updateVisualSubscriptionIndicator();
};

// دالة تحديث فورية
window.fixSubscriptionIndicator = function() {
    console.log('🔧 Force updating subscription indicator...');
    setTimeout(() => {
        updateVisualSubscriptionIndicator();
    }, 100);
    setTimeout(() => {
        updateVisualSubscriptionIndicator();
    }, 500);
    setTimeout(() => {
        updateVisualSubscriptionIndicator();
    }, 1000);
    console.log('✅ Multiple updates scheduled');
};

// دالة تحديث مشتركة لضمان التزامن بين الإعدادات والمؤشر البصري
async function updateSubscriptionDisplays() {
    console.log('Updating both subscription displays...');
    await updateSettingsLicenseDisplay();
    updateVisualSubscriptionIndicator();
    console.log('Both displays updated successfully');
}

// جعل الدوال متاحة للاستخدام من console
window.updateSubscriptionDisplays = updateSubscriptionDisplays;
window.updateVisualSubscriptionIndicator = updateVisualSubscriptionIndicator;

// دالة تحديث مباشر من نص الإعدادات
window.updateFromSettings = function() {
    const settingsEl = document.getElementById('licenseDaysLeft');
    const indicatorEl = document.getElementById('subDays');
    const labelEl = document.getElementById('subLabel');
    
    if (!settingsEl || !indicatorEl || !labelEl) {
        console.log('❌ Elements not found');
        return;
    }
    
    const settingsText = settingsEl.textContent;
    console.log('📊 Settings text:', settingsText);
    
    // استخراج الرقم
    const daysMatch = settingsText.match(/(\d+)/);
    if (daysMatch) {
        const days = daysMatch[1];
        indicatorEl.textContent = days;
        labelEl.textContent = 'يوم';
        
        // تحديث الألوان
        const indicator = document.getElementById('subscriptionIndicator');
        const bar = document.getElementById('subscriptionBar');
        
        if (parseInt(days) <= 3) {
            indicator.className = 'subscription-indicator danger';
            bar.className = 'danger';
        } else if (parseInt(days) <= 7) {
            indicator.className = 'subscription-indicator warn';
            bar.className = 'warn';
        } else {
            indicator.className = 'subscription-indicator safe';
            bar.className = 'safe';
        }
        
        console.log('✅ Updated to:', days, 'days');
    } else {
        console.log('❌ No number found in:', settingsText);
    }
};

// مراقبة تلقائية لتغييرات الإعدادات
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const target = mutation.target;
            if (target.id === 'licenseDaysLeft' || target.closest('#licenseDaysLeft')) {
                console.log('🔄 Settings changed, updating indicator...');
                setTimeout(() => {
                    window.updateFromSettings();
                }, 100);
            }
        }
    });
});

// بدء المراقبة عند تحميل الصفحة
setTimeout(() => {
    const settingsElement = document.getElementById('licenseDaysLeft');
    if (settingsElement) {
        observer.observe(settingsElement, {
            childList: true,
            characterData: true,
            subtree: true
        });
        console.log('👀 Started monitoring settings changes');
    }
}, 3000);

// ============================================================
// نهاية نظام المؤشر البصري
// ============================================================

}