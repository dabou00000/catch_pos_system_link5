# سكريبت PowerShell لمسح بيانات التفعيل
Write-Host "🗑️ بدء مسح بيانات التفعيل..." -ForegroundColor Yellow

# إنشاء صفحة HTML بسيطة لمسح البيانات
$htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>مسح بيانات التفعيل</title>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial; text-align: center; padding: 50px; background: #f0f0f0;">
    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
        <h1>🗑️ مسح بيانات التفعيل</h1>
        <p>جاري مسح جميع بيانات التفعيل...</p>
        <div id="result" style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 5px;"></div>
    </div>
    
    <script>
        function clearLicenseData() {
            const licenseKeys = ['license_state', 'catch_pos_license', 'lastWarningTime'];
            let cleared = 0;
            
            // مسح localStorage
            licenseKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    cleared++;
                }
            });
            
            // مسح sessionStorage  
            licenseKeys.forEach(key => {
                if (sessionStorage.getItem(key)) {
                    sessionStorage.removeItem(key);
                    cleared++;
                }
            });
            
            // مسح IndexedDB
            if ('indexedDB' in window) {
                try {
                    indexedDB.deleteDatabase('catch_pos_license');
                    cleared++;
                } catch (e) {
                    console.log('IndexedDB غير متوفر');
                }
            }
            
            // مسح أي مفاتيح أخرى
            const allKeys = Object.keys(localStorage);
            allKeys.forEach(key => {
                if (key.toLowerCase().includes('license') || 
                    key.toLowerCase().includes('activation') ||
                    key.toLowerCase().includes('catch_pos')) {
                    localStorage.removeItem(key);
                    cleared++;
                }
            });
            
            document.getElementById('result').innerHTML = 
                '<div style="color: #2e7d32; font-weight: bold;">✅ تم مسح ' + cleared + ' عنصر بنجاح!</div>' +
                '<div style="margin-top: 10px;">النظام جاهز لإعادة التفعيل من جديد</div>';
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
        
        // تشغيل المسح فوراً
        window.onload = clearLicenseData;
    </script>
</body>
</html>
"@

# حفظ المحتوى في ملف HTML
$htmlContent | Out-File -FilePath "temp_clear.html" -Encoding UTF8

Write-Host "✅ تم إنشاء أداة المسح" -ForegroundColor Green
Write-Host "🚀 فتح أداة المسح..." -ForegroundColor Cyan

# فتح الملف في المتصفح
Start-Process "temp_clear.html"

Write-Host "⏳ انتظر حتى يكتمل المسح..." -ForegroundColor Yellow
Write-Host "🔄 سيتم إعادة توجيهك للنظام الرئيسي تلقائياً" -ForegroundColor Cyan

# حذف الملف المؤقت بعد 5 ثواني
Start-Sleep -Seconds 5
Remove-Item "temp_clear.html" -ErrorAction SilentlyContinue

Write-Host "✅ تم الانتهاء من عملية المسح" -ForegroundColor Green

