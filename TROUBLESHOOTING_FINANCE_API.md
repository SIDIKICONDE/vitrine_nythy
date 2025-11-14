# Troubleshooting Guide: Finance API Error

## Error: "Erreur lors de la récupération du résumé financier"

This guide helps diagnose and fix the finance API error you're experiencing.

## 🔍 What I've Changed

### 1. Enhanced Error Logging

**File: `app/merchant/infrastructure/api/ApiFinanceRepository.ts`**
- Added comprehensive logging of API responses including status, statusText, and full result
- Enhanced error messages to include details and stack traces
- Error messages now show the actual error from the API instead of generic messages

### 2. Added Input Validation

**File: `app/api/merchant/[merchantId]/finances/summary/route.ts`**
- Added validation for invalid merchantIds ('temp', '', 'undefined', 'null')
- Returns specific error codes (NO_SESSION, INVALID_MERCHANT_ID, etc.)
- Improved error categorization (401, 403, 404, 500) based on error type

### 3. Improved useFinance Hook

**File: `hooks/useFinance.ts`**
- Added validation to prevent API calls with invalid merchantIds
- Added detailed logging at each step of the process
- Consistent error handling across all methods
- Better console output for debugging

### 4. Created Debug Endpoint

**File: `app/api/merchant/debug/route.ts`**
- New endpoint: `/api/merchant/debug`
- Shows authentication status
- Shows merchant lookup results
- Shows sample orders for the merchant
- Helps diagnose data availability issues

## 🚀 How to Debug the Error

### Step 1: Check the Browser Console

Open your browser's developer console (F12) and look for the detailed logs:

```
📊 [ApiFinanceRepository] Réponse API complète: { ... }
```

This will show you:
- HTTP status code (200, 401, 403, 404, 500)
- Whether `success` is true or false
- The exact error message from the API
- Any details or stack traces (in development mode)

### Step 2: Use the Debug Endpoint

Navigate to or call:
```
GET /api/merchant/debug
```

This will show you:
- ✅ Whether you're authenticated
- ✅ Your user ID and email
- ✅ Whether a merchant was found for your user
- ✅ The merchant's ID and name
- ✅ Sample orders for the merchant
- ❌ Any errors encountered during lookup

### Step 3: Common Issues and Solutions

#### Issue 1: User Not Authenticated
**Symptoms:**
- Error code: `NO_SESSION`
- Status: 401

**Solution:**
- Make sure you're logged in
- Check that your session is valid
- Try logging out and back in

#### Issue 2: Invalid Merchant ID
**Symptoms:**
- Error code: `INVALID_MERCHANT_ID`
- Status: 400
- Console shows: `merchantId: 'temp'` or `merchantId: ''`

**Solution:**
- The `/api/merchant/me` endpoint might be failing
- Check the finances page console for merchant lookup errors
- Verify your user account is linked to a merchant

#### Issue 3: Merchant Not Found
**Symptoms:**
- Status: 404
- Message: "Marchand non trouvé"

**Solution:**
- Your user account doesn't have a linked merchant
- Check Firestore `users` collection for your user document
- Check if it has a `merchantId` field
- Or check `merchants` collection for a document with `owner_user_id` matching your user ID

#### Issue 4: Permission Denied
**Symptoms:**
- Status: 403
- Message: "Non autorisé - Ce commerce ne vous appartient pas"

**Solution:**
- The merchantId exists but doesn't belong to your user
- Check that `merchants` document has correct `owner_user_id` or `ownerUserId` field
- Verify it matches your authenticated user ID

#### Issue 5: Firestore/Database Error
**Symptoms:**
- Status: 500
- Error code: `INTERNAL_ERROR`

**Solution:**
- Check server logs for detailed error messages
- Verify Firebase Admin SDK is configured correctly
- Check Firestore security rules
- Verify database indexes exist for the queries

## 📊 Enhanced Logging Output

With the new changes, you should see detailed logs like:

```typescript
// When finance page loads:
🔍 [useFinance] MerchantId invalide ou pas de repository, skip chargement: { merchantId: 'temp', hasRepository: true }

// OR if valid:
🔄 [useFinance] Début chargement données finances pour: abc123
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
❌ [ApiFinanceRepository] Erreur API finances détaillée: {
  status: 401,
  statusText: 'Unauthorized',
  message: 'Utilisateur non authentifié',
  details: '',
  stack: '',
  fullResult: { ... }
}
```

## 🔧 Quick Fix Checklist

1. ✅ Check browser console for detailed error logs
2. ✅ Visit `/api/merchant/debug` to see authentication status
3. ✅ Verify you're logged in with a valid session
4. ✅ Check that your user has a linked merchant in Firestore
5. ✅ Verify the merchant's `owner_user_id` matches your user ID
6. ✅ Check that orders exist for your merchant (or understand it's a new merchant)
7. ✅ Look for the specific error code (NO_SESSION, INVALID_MERCHANT_ID, etc.)

## 📝 Next Steps

After following this guide, the console logs should show you **exactly** what's failing. Share the detailed error output (from the console) if you need further help, especially:

- The HTTP status code
- The error code (NO_SESSION, INVALID_MERCHANT_ID, etc.)
- The full error message
- Your user ID
- The merchant ID being used

## 🎯 What to Look For

The error message you saw was generic. Now, you should see one of these specific errors:

- `NO_SESSION` - You're not logged in
- `INVALID_MERCHANT_ID` - The merchantId is 'temp', empty, or invalid
- `NOT_FOUND` - Merchant doesn't exist in database
- `PERMISSION_DENIED` - Merchant exists but doesn't belong to you
- `INTERNAL_ERROR` - Database or server error (check server logs)

Each error now comes with detailed context to help fix the issue.

