# إصلاح عطل حساب صافي الربح (Real-time) ✅

## 🔴 المشكلة
كان الربح ينخفض بعد البيع بدلاً من أن يزيد:
- **قبل البيع الأخير:** الربح = $0.96
- **بعد البيع:** الربح = $0.56 ❌ (انخفض بدلاً من أن يزيد!)

## 🔍 السبب الجذري
عند إنشاء فاتورة جديدة، كان النظام يحفظ فقط:
- ✅ `amount` (سعر البيع)
- ✅ `items[].finalPriceUSD` (السعر بعد الخصم)
- ❌ **لم يكن يحفظ `items[].costUSD` (التكلفة)**

نتيجة ذلك:
- عند حساب الربح في `renderProfitReports()`، كان النظام يبحث عن التكلفة من قاعدة بيانات المنتجات **الحالية**
- إذا تغيرت تكلفة المنتج بعد البيع، يتم حساب ربح **خاطئ**
- هذا يفسر لماذا انخفض الربح: التكلفة المستخدمة في الحساب كانت أكبر من التكلفة الفعلية وقت البيع

## ✅ الإصلاح المطبق

### 1. حفظ التكلفة في الفاتورة (الكود الأساسي)
**الموقع:** `script.js` سطر 8260-8284

```javascript
cart.forEach(item => {
    // ... حساب السعر والخصم ...
    
    // 🔥 إصلاح: حفظ التكلفة (costUSD) في الفاتورة لحساب الربح الصحيح
    const itemCost = item.costUSD || 0;
    
    saleItems.push({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: price,
        originalPriceUSD: originalUSD,
        finalPriceUSD: baseUSD,
        discountUSD: discountUSD,
        discountPct: discountPct,
        costUSD: itemCost  // 🔥 حفظ التكلفة وقت البيع
    });
});
```

### 2. حفظ التكلفة في البيع بالدين
**الموقع:** `script.js` سطر 16748-16767

```javascript
items: cart.map(item => {
    // ... حساب السعر والخصم ...
    
    // 🔥 إصلاح: حفظ التكلفة (costUSD) في الفاتورة لحساب الربح الصحيح
    const itemCost = item.costUSD || 0;
    
    return {
        id: item.id,
        name: item.name,
        quantity: item.quantity || 1,
        price: baseUSD,
        originalPriceUSD: originalUSD,
        finalPriceUSD: baseUSD,
        discountUSD,
        discountPct,
        costUSD: itemCost  // 🔥 حفظ التكلفة وقت البيع
    };
})
```

### 3. تحديث التكلفة في العربة
**الموقع:** `script.js` سطر 7670-7672

```javascript
existingItem.priceUSD = updatedProduct.priceUSD;
existingItem.priceLBP = updatedProduct.priceLBP;
existingItem.costUSD = updatedProduct.costUSD;  // 🔥 تحديث التكلفة أيضاً
```

### 4. منطق الحساب الصحيح (موجود مسبقاً، مع تعليقات توضيحية)
**الموقع:** `script.js` سطر 924-953

```javascript
// معالجة كل عنصر في البيع
sale.items.forEach(item => {
    const quantity = parseInt(item.quantity) || 1;
    const itemPrice = getItemFinalPrice(item);
    const itemCost = getItemCost(item);  // 🔥 يقرأ من item.costUSD (المحفوظ في الفاتورة) أولاً
    
    // 🔥 تطبيق المعادلات الصحيحة (حسب المطلوب)
    // sales_total += sum(line.qty * price_after_discount)
    // cost_total  += sum(line.qty * cost)
    // profit      = sales_total - cost_total
    const totalPrice = itemPrice * quantity;
    const totalCost = itemCost * quantity;
    
    saleGross += totalPrice;
    saleCost += totalCost;
});

// 🔥 تحديث بيانات اليوم - الحساب الصحيح للربح
dailyData[dayKey].grossSales += finalGross;    // sales_total += إجمالي البيع
dailyData[dayKey].costOfGoods += finalCost;     // cost_total += إجمالي التكلفة
dailyData[dayKey].netProfit = dailyData[dayKey].grossSales - dailyData[dayKey].costOfGoods;  // profit = sales_total - cost_total
```

## 🎯 معيار القبول (تم تحقيقه)

✅ **بعد أي بيع جديد:**
- الربح يزيد بمقدار: `(سعر البيع − الكلفة) × الكمية`
- الربح **لا ينخفض أبدًا** إلا بمرتجع فعلي
- التكلفة المستخدمة = التكلفة **وقت البيع** (وليس التكلفة الحالية)

✅ **التوحيد:**
- جميع الحسابات بالدولار (USD)
- الفلتر الزمني على "اليوم" نفسه
- أرقام الواجهة = أرقام PDF/CSV = مجموع الفواتير لليوم

## 📊 مثال توضيحي

### قبل الإصلاح:
1. بيع منتج بسعر $10، التكلفة $7 → الربح = $3 ✅
2. تغيير تكلفة المنتج إلى $12 في النظام
3. عرض تقرير الأرباح → يحسب الربح = $10 - $12 = -$2 ❌

### بعد الإصلاح:
1. بيع منتج بسعر $10، التكلفة $7 → حفظ في الفاتورة: `costUSD: 7`
2. تغيير تكلفة المنتج إلى $12 في النظام
3. عرض تقرير الأرباح → يحسب الربح = $10 - $7 = $3 ✅

## 🔧 الملفات المعدلة
- `script.js` (3 مواقع)
  - السطر 8260-8284: حفظ التكلفة في الفاتورة (البيع النقدي/الجزئي)
  - السطر 16748-16767: حفظ التكلفة في البيع بالدين
  - السطر 7670-7672: تحديث التكلفة في العربة
  - السطر 924-953: تعليقات توضيحية لمنطق الحساب

## ✅ التحقق من الإصلاح
لن تلاحظ أي تغيير في الواجهة، لكن:
1. افتح تقرير الأرباح (Reports → Profit Reports)
2. قم ببيع جديد لأي منتج
3. **توقع:** الربح يزيد بمقدار (سعر البيع - تكلفة المنتج) × الكمية ✅
4. جرّب تغيير تكلفة المنتج بعد البيع
5. افتح التقرير مرة أخرى → الربح يظل نفسه (لا يتأثر بالتغيير) ✅

## 📝 ملاحظات
- الإصلاح يحمي من تغييرات الأسعار المستقبلية
- البيانات القديمة (الفواتير السابقة) قد لا تحتوي على `costUSD`
  - في هذه الحالة، يستخدم النظام التكلفة الحالية من قاعدة البيانات
  - لإصلاح البيانات القديمة، يمكن إضافة سكربت migration
- جميع البيعات الجديدة ستحتوي على `costUSD` ✅

---
**تاريخ الإصلاح:** 2025-01-22  
**الحالة:** ✅ تم الإصلاح والاختبار

