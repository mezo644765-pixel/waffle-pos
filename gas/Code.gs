// ============================================================
// وافل الجو — Google Apps Script Backend
// ============================================================
// Sheets:
//   Users:    id | email | name | password | role
//   Orders:   id | userId | userName | productType | fraction | quantity |
//             basePrice | totalPrice | notes | timestamp | isCancelled
//   Shifts:   id | userId | userName | startTime | isActive
//   Settings: key | value
//
// SETUP:
//   1. Create a new Google Sheet.
//   2. Open Extensions → Apps Script.
//   3. Replace all content with this file.
//   4. Run setupSheets() once from the editor (Run → Run function → setupSheets).
//   5. Deploy → New deployment → Web App.
//      Execute as: Me | Who has access: Anyone → Deploy → Copy the URL.
//   6. Paste the URL into the app's settings screen.
//
// Default admin: admin@waffle.sa / Admin@1234  ← CHANGE IMMEDIATELY

/* ---- CORS helper ---- */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function respond(data) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

/* ---- Sheet bootstrapper ---- */
var SHEET_HEADERS = {
  Users:    ['id', 'email', 'name', 'password', 'role'],
  Orders:   ['id', 'userId', 'userName', 'productType', 'fraction', 'quantity',
             'basePrice', 'totalPrice', 'notes', 'timestamp', 'isCancelled'],
  Shifts:   ['id', 'userId', 'userName', 'startTime', 'isActive'],
  Settings: ['key', 'value'],
};

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var headers = SHEET_HEADERS[name];
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

// ============================================================
// doGet — read-only operations
// ============================================================
function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  try {
    switch (action) {
      case 'getSettings':
        return getSettings();
      case 'getOrders':
        return getOrders(e.parameter.lastTimestamp || '', e.parameter.userId || '');
      case 'getActiveShifts':
        return getActiveShifts();
      case 'getStats':
        return getStats(e.parameter.period || 'today');
      default:
        return respond({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return respond({ success: false, error: err.toString() });
  }
}

// ============================================================
// doPost — write operations (LockService protected)
// ============================================================
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    switch (action) {
      case 'validateUser':   return validateUser(data.email, data.password);
      case 'addOrder':       return addOrder(data.order);
      case 'cancelOrder':    return cancelOrder(data.orderId);
      case 'startShift':     return startShift(data.shift);
      case 'endShift':       return endShift(data.userId);
      case 'updateSettings': return updateSettings(data.settings);
      case 'addUser':        return addUser(data.user);
      default:
        return respond({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return respond({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// ============================================================
// Users
// ============================================================
function validateUser(email, password) {
  if (!email || !password) {
    return respond({ success: false, error: 'البريد وكلمة المرور مطلوبان' });
  }
  var sheet = getSheet('Users');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (
      String(row[1]).toLowerCase().trim() === String(email).toLowerCase().trim() &&
      String(row[3]) === String(password)
    ) {
      return respond({
        success: true,
        user: {
          id:    String(row[0]),
          email: String(row[1]),
          name:  String(row[2]),
          role:  String(row[4]),
        },
      });
    }
  }
  return respond({ success: false, error: 'بيانات الدخول غير صحيحة' });
}

function addUser(user) {
  if (!user || !user.id || !user.email || !user.name || !user.password) {
    return respond({ success: false, error: 'بيانات الموظف ناقصة' });
  }
  var sheet = getSheet('Users');
  var existing = sheet.getDataRange().getValues();
  for (var i = 1; i < existing.length; i++) {
    if (String(existing[i][1]).toLowerCase() === String(user.email).toLowerCase()) {
      return respond({ success: false, error: 'البريد الإلكتروني مستخدم بالفعل' });
    }
  }
  sheet.appendRow([user.id, user.email, user.name, user.password, user.role || 'user']);
  return respond({ success: true });
}

// ============================================================
// Settings / Prices
// ============================================================
function getSettings() {
  var sheet = getSheet('Settings');
  var data = sheet.getDataRange().getValues();
  var settings = {
    waffleBasePrice: 60,
    pancakePrice: 10,
    version: 0,
    updatedAt: new Date().toISOString(),
  };
  for (var i = 1; i < data.length; i++) {
    var key = String(data[i][0]);
    var val = data[i][1];
    if (key === 'waffleBasePrice') settings.waffleBasePrice = Number(val);
    else if (key === 'pancakePrice')  settings.pancakePrice  = Number(val);
    else if (key === 'version')        settings.version       = Number(val);
    else if (key === 'updatedAt')      settings.updatedAt     = String(val);
  }
  return respond({ success: true, settings: settings });
}

function updateSettings(settings) {
  if (!settings) return respond({ success: false, error: 'لا توجد بيانات' });
  var sheet = getSheet('Settings');
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
  sheet.getRange(2, 1, 4, 2).setValues([
    ['waffleBasePrice', settings.waffleBasePrice],
    ['pancakePrice',    settings.pancakePrice],
    ['version',         settings.version],
    ['updatedAt',       settings.updatedAt],
  ]);
  return respond({ success: true });
}

// ============================================================
// Orders
// ============================================================
function addOrder(order) {
  if (!order || !order.id) return respond({ success: false, error: 'بيانات الطلب ناقصة' });
  var sheet = getSheet('Orders');
  // Idempotency: ignore if order id already exists
  var existing = sheet.getDataRange().getValues();
  for (var i = 1; i < existing.length; i++) {
    if (String(existing[i][0]) === String(order.id)) {
      return respond({ success: true }); // already exists, no-op
    }
  }
  sheet.appendRow([
    order.id,
    order.userId,
    order.userName,
    order.productType,
    order.fraction   !== undefined ? order.fraction   : '',
    order.quantity   !== undefined ? order.quantity   : '',
    order.basePrice,
    order.totalPrice,
    order.notes || '',
    order.timestamp,
    'false',
  ]);
  return respond({ success: true });
}

function cancelOrder(orderId) {
  if (!orderId) return respond({ success: false, error: 'معرّف الطلب مطلوب' });
  var sheet = getSheet('Orders');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(orderId)) {
      sheet.getRange(i + 1, 11).setValue('true');
      return respond({ success: true });
    }
  }
  return respond({ success: false, error: 'الطلب غير موجود: ' + orderId });
}

function getOrders(lastTimestamp, userId) {
  var sheet = getSheet('Orders');
  var data = sheet.getDataRange().getValues();
  var cutoff = lastTimestamp ? new Date(lastTimestamp).getTime() : 0;
  var orders = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var ts = String(row[9]);
    var orderTime = new Date(ts).getTime();
    if (isNaN(orderTime) || orderTime <= cutoff) continue;
    if (userId && String(row[1]) !== String(userId)) continue;
    orders.push({
      id:          String(row[0]),
      userId:      String(row[1]),
      userName:    String(row[2]),
      productType: String(row[3]),
      fraction:    row[4] !== '' ? Number(row[4]) : null,
      quantity:    row[5] !== '' ? Number(row[5]) : null,
      basePrice:   Number(row[6]),
      totalPrice:  Number(row[7]),
      notes:       String(row[8]),
      timestamp:   ts,
      isCancelled: String(row[10]) === 'true',
      isSynced:    true,
    });
  }
  return respond({ success: true, orders: orders });
}

// ============================================================
// Shifts
// ============================================================
function startShift(shift) {
  if (!shift || !shift.userId) return respond({ success: false, error: 'بيانات الوردية ناقصة' });
  var sheet = getSheet('Shifts');
  var data = sheet.getDataRange().getValues();
  // Mark any existing active shift for this user as closed
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(shift.userId) && String(data[i][4]) === 'true') {
      sheet.getRange(i + 1, 5).setValue('false');
    }
  }
  sheet.appendRow([shift.id, shift.userId, shift.userName, shift.startTime, 'true']);
  return respond({ success: true });
}

function endShift(userId) {
  if (!userId) return respond({ success: false, error: 'معرّف المستخدم مطلوب' });
  var sheet = getSheet('Shifts');
  var data = sheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(userId) && String(data[i][4]) === 'true') {
      sheet.getRange(i + 1, 5).setValue('false');
      found = true;
    }
  }
  return respond({ success: true, found: found });
}

function getActiveShifts() {
  var sheet = getSheet('Shifts');
  var data = sheet.getDataRange().getValues();
  var shifts = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][4]) === 'true') {
      shifts.push({
        id:        String(data[i][0]),
        userId:    String(data[i][1]),
        userName:  String(data[i][2]),
        startTime: String(data[i][3]),
        isActive:  true,
      });
    }
  }
  return respond({ success: true, shifts: shifts });
}

// ============================================================
// Statistics
// ============================================================
function getStats(period) {
  var sheet = getSheet('Orders');
  var data = sheet.getDataRange().getValues();
  var now = new Date();
  var startDate;

  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    var dayOfWeek = now.getDay();
    startDate = new Date(now);
    startDate.setDate(now.getDate() - dayOfWeek);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(0);
  }

  var revenue = 0;
  var count = 0;
  var productCounts = {};

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[10]) === 'true') continue; // skip cancelled
    var orderDate = new Date(String(row[9]));
    if (orderDate < startDate) continue;
    revenue += Number(row[7]);
    count++;
    var product = String(row[3]);
    productCounts[product] = (productCounts[product] || 0) + 1;
  }

  var sorted = Object.keys(productCounts).sort(function(a, b) {
    return productCounts[b] - productCounts[a];
  });

  return respond({
    success: true,
    stats: {
      revenue:       Math.round(revenue * 100) / 100,
      count:         count,
      topProduct:    sorted[0]                || null,
      leastProduct:  sorted[sorted.length - 1] || null,
      productCounts: productCounts,
    },
  });
}

// ============================================================
// Setup helper — run once from the Apps Script editor
// ============================================================
function setupSheets() {
  Object.keys(SHEET_HEADERS).forEach(function(name) { getSheet(name); });
  // Seed a default admin if Users is empty
  var users = getSheet('Users');
  if (users.getLastRow() <= 1) {
    users.appendRow(['admin-001', 'admin@waffle.sa', 'المدير', 'Admin@1234', 'admin']);
    Logger.log('Default admin created: admin@waffle.sa / Admin@1234');
    Logger.log('⚠️  CHANGE THE PASSWORD IMMEDIATELY from the app settings screen!');
  }
  // Seed default prices
  var settings = getSheet('Settings');
  if (settings.getLastRow() <= 1) {
    settings.getRange(2, 1, 4, 2).setValues([
      ['waffleBasePrice', 60],
      ['pancakePrice',    10],
      ['version',          1],
      ['updatedAt',        new Date().toISOString()],
    ]);
  }
  Logger.log('Setup complete. 4 sheets ready: Users, Orders, Shifts, Settings.');
}
