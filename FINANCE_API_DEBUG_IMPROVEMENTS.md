# Finance API Debugging Improvements

## 📋 Summary

I've enhanced the finance API error handling and logging to help you diagnose the issue with the error: **"Erreur lors de la récupération du résumé financier"**

Previously, this error was too generic and didn't tell you what was actually wrong. Now, you'll get specific error codes and detailed logging.

## 🔧 Changes Made

### 1. Enhanced API Finance Repository (`app/merchant/infrastructure/api/ApiFinanceRepository.ts`)

**Before:**
```typescript
console.log('📊 [ApiFinanceRepository] Réponse API:', { 
  ok: response.ok, 
  status: response.status,
  success: result.success,
  message: result.message 
});

if (!response.ok || !result.success) {
  const errorMsg = result.message || result.error || 'Erreur lors de la récupération du résumé financier';
  console.error('❌ [ApiFinanceRepository] Erreur API finances:', errorMsg);
  throw new Error(errorMsg);
}
```

**After:**
```typescript
console.log('📊 [ApiFinanceRepository] Réponse API complète:', { 
  ok: response.ok, 
  status: response.status,
  statusText: response.statusText,
  result: result  // Full result object
});

if (!response.ok || !result.success) {
  const errorMsg = result.message || result.error || 'Erreur lors de la récupération du résumé financier';
  const errorDetails = result.details || result.error || '';
  const errorStack = result.stack || '';
  
  console.error('❌ [ApiFinanceRepository] Erreur API finances détaillée:', {
    status: response.status,
    statusText: response.statusText,
    message: errorMsg,
    details: errorDetails,
    stack: errorStack,
    fullResult: result  // Complete API response
  });
  throw new Error(`${errorMsg}${errorDetails ? ` - Détails: ${errorDetails}` : ''}`);
}
```

**Benefits:**
- ✅ See the complete API response
- ✅ Get detailed error information including stack traces
- ✅ Understand exactly what the API returned

### 2. Added Input Validation to Finance Summary API (`app/api/merchant/[merchantId]/finances/summary/route.ts`)

**Added:**
```typescript
// Valider merchantId
if (!merchantId || merchantId === 'temp' || merchantId === '' || merchantId === 'undefined' || merchantId === 'null') {
  console.warn('⚠️  [API] MerchantId invalide:', merchantId);
  return NextResponse.json(
    { success: false, message: 'MerchantId invalide', error: 'INVALID_MERCHANT_ID' },
    { status: 400 }
  );
}
```

**Improved Error Response:**
```typescript
// Now returns specific error codes
return NextResponse.json({
  success: false,
  message: 'Erreur lors de la récupération du résumé financier',
  error: errorCode,  // NO_SESSION, INVALID_MERCHANT_ID, PERMISSION_DENIED, etc.
  errorMessage: errorMessage,
  details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
  stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
}, { status: statusCode });
```

**Benefits:**
- ✅ Prevents API calls with invalid merchantIds
- ✅ Returns specific error codes for each error type
- ✅ Provides detailed error information in development mode

### 3. Improved useFinance Hook (`hooks/useFinance.ts`)

**Added Early Exit for Invalid MerchantIds:**
```typescript
// Ne charger que si on a un vrai merchantId (pas vide, pas 'temp', pas undefined, pas null)
if (!merchantId || merchantId === 'temp' || merchantId === '' || merchantId === 'undefined' || merchantId === 'null' || !financeRepository) {
  console.log('⚠️ [useFinance] MerchantId invalide ou pas de repository, skip chargement:', { merchantId, hasRepository: !!financeRepository });
  setLoading(false);
  setSummary(null);
  setTransactions([]);
  setPayouts([]);
  return;
}
```

**Enhanced Logging:**
```typescript
console.log('🔄 [useFinance] Début chargement données finances pour:', merchantId);
// ... on success:
console.log('✅ [useFinance] Summary chargé');
console.log('✅ [useFinance] Transactions chargées');
console.log('✅ [useFinance] Payouts chargés');
console.log('🏁 [useFinance] Chargement terminé');

// ... on error:
console.error('❌ [useFinance] Erreur chargement finances:', {
  error: err,
  message: errorMsg,
  merchantId
});
```

**Benefits:**
- ✅ Prevents unnecessary API calls with invalid merchantIds
- ✅ Clear step-by-step logging of what's happening
- ✅ Easy to see where the process succeeds or fails

### 4. New Debug Endpoint (`app/api/merchant/debug/route.ts`)

**New Endpoint:** `GET /api/merchant/debug`

**Returns:**
```json
{
  "success": true,
  "debug": {
    "timestamp": "2025-11-13T...",
    "session": {
      "exists": true,
      "hasUser": true,
      "userId": "abc123",
      "userEmail": "merchant@example.com",
      "userName": "Merchant Name"
    },
    "merchant": {
      "found": true,
      "id": "merchant_xyz",
      "name": "My Store",
      "owner_user_id": "abc123",
      "email": "merchant@example.com",
      "ordersCount": 5,
      "sampleOrders": [...]
    },
    "firestore": {
      "userDocExists": true,
      "userData": { ... }
    },
    "errors": []
  }
}
```

**Benefits:**
- ✅ Quick way to check authentication status
- ✅ Verify merchant is correctly linked to user
- ✅ See sample orders to verify data exists
- ✅ Identify any Firestore access issues

## 🎯 Error Codes You'll Now See

Instead of the generic error, you'll now see specific error codes:

| Error Code | Status | Meaning | Solution |
|------------|--------|---------|----------|
| `NO_SESSION` | 401 | Not authenticated | Log in |
| `INVALID_MERCHANT_ID` | 400 | MerchantId is 'temp', empty, or invalid | Check merchant lookup |
| `NOT_FOUND` | 404 | Merchant doesn't exist | Create merchant account |
| `PERMISSION_DENIED` | 403 | Merchant exists but doesn't belong to you | Verify ownership |
| `INTERNAL_ERROR` | 500 | Server/database error | Check server logs |

## 🚀 How to Use These Improvements

### Step 1: Check Console for Detailed Logs

Open your browser console (F12) when visiting the finances page. You should now see:

```
🔍 [useFinance] MerchantId invalide ou pas de repository, skip chargement
```
OR
```
🔄 [useFinance] Début chargement données finances pour: merchant_123
💰 [API] Récupération résumé financier: monthly
📊 [ApiFinanceRepository] Réponse API complète: { ok: false, status: 401, ... }
❌ [ApiFinanceRepository] Erreur API finances détaillée: { ... }
```

### Step 2: Visit Debug Endpoint

Open: `http://localhost:3000/api/merchant/debug` (or your dev URL)

This will show you:
- ✅ Whether you're authenticated
- ✅ Your user information
- ✅ Whether a merchant was found
- ✅ Sample orders for verification

### Step 3: Identify the Specific Error

The error message will now include:
- Specific error code (e.g., `NO_SESSION`, `INVALID_MERCHANT_ID`)
- HTTP status code (401, 403, 404, 500)
- Detailed error message
- Stack trace (in development mode)

### Step 4: Fix Based on Error Code

See `TROUBLESHOOTING_FINANCE_API.md` for detailed solutions for each error code.

## 📊 Example Console Output

### Scenario 1: Invalid MerchantId
```
⚠️ [useFinance] MerchantId invalide ou pas de repository, skip chargement: { merchantId: 'temp', hasRepository: true }
```

**Solution:** The `/api/merchant/me` endpoint is failing to return a valid merchantId.

### Scenario 2: Not Authenticated
```
🔄 [useFinance] Début chargement données finances pour: merchant_123
💰 [API] Récupération résumé financier: monthly
📊 [ApiFinanceRepository] Réponse API complète: {
  ok: false,
  status: 401,
  statusText: 'Unauthorized',
  result: {
    success: false,
    message: 'Utilisateur non authentifié',
    error: 'NO_SESSION'
  }
}
```

**Solution:** Log in to the application.

### Scenario 3: Merchant Not Found
```
📊 [ApiFinanceRepository] Réponse API complète: {
  ok: false,
  status: 404,
  result: {
    success: false,
    message: 'Marchand non trouvé',
    error: 'NOT_FOUND'
  }
}
```

**Solution:** The merchantId doesn't exist in the `merchants` collection.

## 📝 Files Modified

1. ✅ `vitrine nythy/app/merchant/infrastructure/api/ApiFinanceRepository.ts` - Enhanced error logging
2. ✅ `vitrine nythy/app/api/merchant/[merchantId]/finances/summary/route.ts` - Added validation and error codes
3. ✅ `vitrine nythy/hooks/useFinance.ts` - Added validation and detailed logging
4. ✅ `vitrine nythy/app/api/merchant/debug/route.ts` - New debug endpoint

## 🎓 What to Do Next

1. **Clear browser cache** and reload the page
2. **Open browser console** (F12) before navigating to the finances page
3. **Look for the detailed logs** - they'll show exactly what's failing
4. **Visit `/api/merchant/debug`** to verify authentication and merchant status
5. **Note the error code** (NO_SESSION, INVALID_MERCHANT_ID, etc.)
6. **Follow the troubleshooting guide** in `TROUBLESHOOTING_FINANCE_API.md`

The generic error message you were seeing should now be replaced with specific, actionable error information that will help you quickly identify and fix the issue!

## 🔗 Related Documentation

- See `TROUBLESHOOTING_FINANCE_API.md` for detailed troubleshooting steps
- Check the browser console for real-time logs
- Visit `/api/merchant/debug` for authentication diagnostics

