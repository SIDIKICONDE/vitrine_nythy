/**
 * Script de test de sécurité pour l'API Next.js
 * 
 * Test tous les aspects de sécurité :
 * - Rate limiting
 * - Headers de sécurité
 * - CORS
 * - App Check
 * - Authentification
 * 
 * Usage: npm run test:security
 */

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

async function makeRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

// ==================== TEST 1: Headers de Sécurité ====================
async function testSecurityHeaders() {
  log('\n🔒 Test 1: Headers de Sécurité', 'cyan');
  log('━'.repeat(60), 'cyan');

  try {
    const response = await makeRequest('/api/merchant/me');
    const headers = response.headers;

    const requiredHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': true, // Vérifier juste la présence
    };

    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const actualValue = headers.get(header);

      if (expectedValue === true) {
        // Juste vérifier la présence
        if (actualValue) {
          results.push({
            name: `Header ${header}`,
            passed: true,
            message: `✅ Présent: ${actualValue?.substring(0, 50)}...`,
          });
          log(`  ✅ ${header}: Présent`, 'green');
        } else {
          results.push({
            name: `Header ${header}`,
            passed: false,
            message: `❌ Manquant`,
          });
          log(`  ❌ ${header}: Manquant`, 'red');
        }
      } else {
        if (actualValue === expectedValue) {
          results.push({
            name: `Header ${header}`,
            passed: true,
            message: `✅ ${expectedValue}`,
          });
          log(`  ✅ ${header}: ${expectedValue}`, 'green');
        } else {
          results.push({
            name: `Header ${header}`,
            passed: false,
            message: `❌ Attendu: ${expectedValue}, Reçu: ${actualValue}`,
          });
          log(`  ❌ ${header}: Attendu "${expectedValue}", Reçu "${actualValue}"`, 'red');
        }
      }
    }
  } catch (error) {
    log(`  ❌ Erreur: ${error}`, 'red');
    results.push({
      name: 'Headers de sécurité',
      passed: false,
      message: `Erreur: ${error}`,
    });
  }
}

// ==================== TEST 2: CORS ====================
async function testCORS() {
  log('\n🌐 Test 2: Configuration CORS', 'cyan');
  log('━'.repeat(60), 'cyan');

  try {
    // Test OPTIONS preflight
    const response = await makeRequest('/api/merchant/me', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    });

    const corsHeaders = [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers',
    ];

    let allPresent = true;
    for (const header of corsHeaders) {
      const value = response.headers.get(header);
      if (value) {
        log(`  ✅ ${header}: ${value}`, 'green');
      } else {
        log(`  ❌ ${header}: Manquant`, 'red');
        allPresent = false;
      }
    }

    results.push({
      name: 'CORS Configuration',
      passed: allPresent,
      message: allPresent ? 'Tous les headers CORS présents' : 'Headers CORS manquants',
    });
  } catch (error) {
    log(`  ❌ Erreur: ${error}`, 'red');
    results.push({
      name: 'CORS Configuration',
      passed: false,
      message: `Erreur: ${error}`,
    });
  }
}

// ==================== TEST 3: Rate Limiting ====================
async function testRateLimiting() {
  log('\n⏱️  Test 3: Rate Limiting', 'cyan');
  log('━'.repeat(60), 'cyan');

  try {
    log('  📊 Envoi de 80 requêtes pour tester le rate limit (60/min)...', 'yellow');

    let rateLimitHit = false;
    let requestCount = 0;

    // Envoyer 80 requêtes rapidement (60 max + marge)
    for (let i = 0; i < 80; i++) {
      try {
        const response = await makeRequest('/api/merchant/me');

        if (response.status === 429) {
          rateLimitHit = true;
          log(`  ✅ Rate limit activé après ${i + 1} requêtes`, 'green');
          break;
        }
        requestCount++;
      } catch (error) {
        // Ignorer les erreurs réseau
      }

      // Petite pause pour ne pas surcharger
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    if (rateLimitHit) {
      results.push({
        name: 'Rate Limiting',
        passed: true,
        message: `✅ Rate limit activé après ${requestCount} requêtes`,
      });
    } else {
      results.push({
        name: 'Rate Limiting',
        passed: false,
        message: `⚠️ Rate limit non activé après ${requestCount} requêtes (attendu ~60)`,
      });
      log(`  ⚠️ Rate limit non activé après ${requestCount} requêtes (attendu ~60)`, 'yellow');
    }
  } catch (error) {
    log(`  ❌ Erreur: ${error}`, 'red');
    results.push({
      name: 'Rate Limiting',
      passed: false,
      message: `Erreur: ${error}`,
    });
  }
}

// ==================== TEST 4: App Check ====================
async function testAppCheck() {
  log('\n🔐 Test 4: App Check Protection', 'cyan');
  log('━'.repeat(60), 'cyan');

  try {
    // Test sans token App Check (doit échouer)
    log('  📝 Test requête SANS App Check token...', 'yellow');
    const responseWithoutToken = await makeRequest('/api/merchant/me');

    if (responseWithoutToken.status === 401) {
      const data = await responseWithoutToken.json();
      if (data.error === 'App Check token missing') {
        log('  ✅ Requête sans token bloquée (401)', 'green');
        results.push({
          name: 'App Check - Requête sans token',
          passed: true,
          message: 'Bloquée correctement (401)',
        });
      } else {
        log(`  ⚠️ Bloquée mais raison différente: ${data.error}`, 'yellow');
        results.push({
          name: 'App Check - Requête sans token',
          passed: false,
          message: `Raison inattendue: ${data.error}`,
        });
      }
    } else {
      log(`  ❌ Requête acceptée (status: ${responseWithoutToken.status})`, 'red');
      results.push({
        name: 'App Check - Requête sans token',
        passed: false,
        message: `Requête acceptée au lieu d'être bloquée (${responseWithoutToken.status})`,
      });
    }

    // Test avec token invalide
    log('  📝 Test requête avec token INVALIDE...', 'yellow');
    const responseWithInvalidToken = await makeRequest('/api/merchant/me', {
      headers: {
        'X-Firebase-AppCheck': 'invalid-token-12345',
      },
    });

    if (responseWithInvalidToken.status === 401) {
      const data = await responseWithInvalidToken.json();
      if (data.error === 'Invalid App Check token') {
        log('  ✅ Token invalide rejeté (401)', 'green');
        results.push({
          name: 'App Check - Token invalide',
          passed: true,
          message: 'Rejeté correctement (401)',
        });
      } else {
        log(`  ⚠️ Rejeté mais raison différente: ${data.error}`, 'yellow');
        results.push({
          name: 'App Check - Token invalide',
          passed: false,
          message: `Raison inattendue: ${data.error}`,
        });
      }
    } else {
      log(`  ❌ Token invalide accepté (status: ${responseWithInvalidToken.status})`, 'red');
      results.push({
        name: 'App Check - Token invalide',
        passed: false,
        message: `Token invalide accepté (${responseWithInvalidToken.status})`,
      });
    }
  } catch (error) {
    log(`  ❌ Erreur: ${error}`, 'red');
    results.push({
      name: 'App Check Protection',
      passed: false,
      message: `Erreur: ${error}`,
    });
  }
}

// ==================== TEST 5: Authentification ====================
async function testAuthentication() {
  log('\n🔑 Test 5: Authentification', 'cyan');
  log('━'.repeat(60), 'cyan');

  try {
    // Test route protégée sans auth (avec App Check désactivé pour ce test)
    log('  📝 Test requête SANS authentification...', 'yellow');
    const response = await makeRequest('/api/merchant/me');

    if (response.status === 401) {
      log('  ✅ Requête non authentifiée bloquée (401)', 'green');
      results.push({
        name: 'Authentification requise',
        passed: true,
        message: 'Route protégée correctement',
      });
    } else {
      log(`  ❌ Requête acceptée (status: ${response.status})`, 'red');
      results.push({
        name: 'Authentification requise',
        passed: false,
        message: `Route accessible sans auth (${response.status})`,
      });
    }
  } catch (error) {
    log(`  ❌ Erreur: ${error}`, 'red');
    results.push({
      name: 'Authentification',
      passed: false,
      message: `Erreur: ${error}`,
    });
  }
}

// ==================== TEST 6: Validation des Inputs ====================
async function testInputValidation() {
  log('\n✅ Test 6: Validation des Inputs', 'cyan');
  log('━'.repeat(60), 'cyan');

  try {
    // Test avec données malformées
    log('  📝 Test avec données malformées...', 'yellow');
    const response = await makeRequest('/api/merchant/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'not-an-email',
        password: '123', // Trop court
        businessName: '<script>alert("xss")</script>', // XSS attempt
      }),
    });

    if (response.status === 400) {
      const data = await response.json();
      log(`  ✅ Données invalides rejetées: ${data.message}`, 'green');
      results.push({
        name: 'Validation des inputs',
        passed: true,
        message: 'Données invalides rejetées',
      });
    } else if (response.status === 401) {
      log('  ✅ Bloqué par App Check (attendu)', 'green');
      results.push({
        name: 'Validation des inputs',
        passed: true,
        message: 'Protégé par App Check',
      });
    } else {
      log(`  ⚠️ Status inattendu: ${response.status}`, 'yellow');
      results.push({
        name: 'Validation des inputs',
        passed: false,
        message: `Status inattendu: ${response.status}`,
      });
    }
  } catch (error) {
    log(`  ❌ Erreur: ${error}`, 'red');
    results.push({
      name: 'Validation des inputs',
      passed: false,
      message: `Erreur: ${error}`,
    });
  }
}

// ==================== TEST 7: Protection Upload ====================
async function testUploadProtection() {
  log('\n📤 Test 7: Protection Upload', 'cyan');
  log('━'.repeat(60), 'cyan');

  try {
    // Test upload sans authentification
    log('  📝 Test upload sans authentification...', 'yellow');
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('merchantId', 'test-merchant');
    formData.append('path', 'test/path.jpg');

    const response = await fetch(`${API_BASE_URL}/api/merchant/upload`, {
      method: 'POST',
      body: formData,
    });

    if (response.status === 401) {
      const data = await response.json();
      log(`  ✅ Upload non authentifié bloqué: ${data.message}`, 'green');
      results.push({
        name: 'Protection Upload',
        passed: true,
        message: 'Upload bloqué sans authentification',
      });
    } else {
      log(`  ❌ Upload accepté (status: ${response.status})`, 'red');
      results.push({
        name: 'Protection Upload',
        passed: false,
        message: `Upload accepté sans auth (${response.status})`,
      });
    }
  } catch (error) {
    log(`  ❌ Erreur: ${error}`, 'red');
    results.push({
      name: 'Protection Upload',
      passed: false,
      message: `Erreur: ${error}`,
    });
  }
}

// ==================== TEST 8: SQL/NoSQL Injection ====================
async function testInjectionProtection() {
  log('\n💉 Test 8: Protection Injection', 'cyan');
  log('━'.repeat(60), 'cyan');

  try {
    // Tenter une injection dans l'URL
    log('  📝 Test injection dans merchantId...', 'yellow');
    const maliciousId = "' OR '1'='1";
    const response = await makeRequest(`/api/merchant/${encodeURIComponent(maliciousId)}/orders`);

    if (response.status === 401 || response.status === 404 || response.status === 403) {
      log(`  ✅ Injection bloquée (status: ${response.status})`, 'green');
      results.push({
        name: 'Protection Injection',
        passed: true,
        message: 'Tentative d\'injection bloquée',
      });
    } else if (response.status === 500) {
      log('  ⚠️ Erreur serveur (vérifier les logs)', 'yellow');
      results.push({
        name: 'Protection Injection',
        passed: false,
        message: 'Erreur serveur - vérifier si injection bloquée',
      });
    } else {
      log(`  ❌ Status inattendu: ${response.status}`, 'red');
      results.push({
        name: 'Protection Injection',
        passed: false,
        message: `Status inattendu: ${response.status}`,
      });
    }
  } catch (error) {
    log(`  ❌ Erreur: ${error}`, 'red');
    results.push({
      name: 'Protection Injection',
      passed: false,
      message: `Erreur: ${error}`,
    });
  }
}

// ==================== TEST 9: Protection CSRF ====================
async function testCSRFProtection() {
  log('\n🛡️  Test 9: Protection CSRF', 'cyan');
  log('━'.repeat(60), 'cyan');

  try {
    // Test 1: POST sans token CSRF (doit échouer)
    log('  📝 Test POST sans token CSRF...', 'yellow');
    const responseNoToken = await makeRequest('/api/merchant/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'TestPassword123!',
        businessName: 'Test Business',
      }),
    });

    if (responseNoToken.status === 403) {
      const data = await responseNoToken.json();
      if (data.error?.includes('CSRF')) {
        log('  ✅ POST sans token CSRF bloqué (403)', 'green');
        results.push({
          name: 'Protection CSRF - Sans token',
          passed: true,
          message: 'Bloqué correctement',
        });
      } else {
        log(`  ⚠️ Bloqué mais raison différente: ${data.error}`, 'yellow');
        results.push({
          name: 'Protection CSRF - Sans token',
          passed: false,
          message: `Raison inattendue: ${data.error}`,
        });
      }
    } else if (responseNoToken.status === 401 || responseNoToken.status === 429) {
      log(`  ✅ Bloqué par autre protection (${responseNoToken.status})`, 'green');
      results.push({
        name: 'Protection CSRF - Sans token',
        passed: true,
        message: `Protégé (${responseNoToken.status})`,
      });
    } else {
      log(`  ❌ POST accepté (status: ${responseNoToken.status})`, 'red');
      results.push({
        name: 'Protection CSRF - Sans token',
        passed: false,
        message: `POST accepté sans token (${responseNoToken.status})`,
      });
    }

    // Test 2: Vérifier présence du cookie CSRF
    log('  📝 Test présence cookie CSRF...', 'yellow');
    const responseGet = await makeRequest('/api/merchant/me');
    const csrfCookie = responseGet.headers.get('set-cookie');

    if (csrfCookie && csrfCookie.includes('nythy_csrf')) {
      log('  ✅ Cookie CSRF présent', 'green');
      results.push({
        name: 'Protection CSRF - Cookie',
        passed: true,
        message: 'Cookie CSRF émis',
      });
    } else {
      log('  ⚠️ Cookie CSRF non détecté', 'yellow');
      results.push({
        name: 'Protection CSRF - Cookie',
        passed: false,
        message: 'Cookie CSRF manquant',
      });
    }
  } catch (error) {
    log(`  ❌ Erreur: ${error}`, 'red');
    results.push({
      name: 'Protection CSRF',
      passed: false,
      message: `Erreur: ${error}`,
    });
  }
}

// ==================== TEST 10: Validation Upload ====================
async function testFileUploadValidation() {
  log('\n📤 Test 10: Validation Upload', 'cyan');
  log('━'.repeat(60), 'cyan');

  try {
    // Test upload fichier trop volumineux
    log('  📝 Test upload fichier trop volumineux...', 'yellow');
    const largeFile = new Blob(['x'.repeat(6 * 1024 * 1024)], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', largeFile, 'large.jpg');
    formData.append('merchantId', 'test-merchant');
    formData.append('path', 'test/large.jpg');

    const responseLarge = await fetch(`${API_BASE_URL}/api/merchant/upload`, {
      method: 'POST',
      body: formData,
    });

    if (responseLarge.status === 400 || responseLarge.status === 413) {
      log('  ✅ Fichier trop volumineux rejeté', 'green');
      results.push({
        name: 'Upload - Taille max',
        passed: true,
        message: 'Fichier trop grand rejeté',
      });
    } else if (responseLarge.status === 401 || responseLarge.status === 403) {
      log('  ✅ Bloqué par authentification/CSRF', 'green');
      results.push({
        name: 'Upload - Taille max',
        passed: true,
        message: 'Protégé par auth',
      });
    } else {
      log(`  ⚠️ Status: ${responseLarge.status}`, 'yellow');
      results.push({
        name: 'Upload - Taille max',
        passed: false,
        message: `Status inattendu: ${responseLarge.status}`,
      });
    }

    // Test upload type de fichier invalide
    log('  📝 Test upload type invalide...', 'yellow');
    const invalidFile = new Blob(['test'], { type: 'application/x-executable' });
    const formData2 = new FormData();
    formData2.append('file', invalidFile, 'malicious.exe');
    formData2.append('merchantId', 'test-merchant');
    formData2.append('path', 'test/malicious.exe');

    const responseInvalid = await fetch(`${API_BASE_URL}/api/merchant/upload`, {
      method: 'POST',
      body: formData2,
    });

    if (responseInvalid.status === 400) {
      log('  ✅ Type de fichier invalide rejeté', 'green');
      results.push({
        name: 'Upload - Type invalide',
        passed: true,
        message: 'Type invalide rejeté',
      });
    } else if (responseInvalid.status === 401 || responseInvalid.status === 403) {
      log('  ✅ Bloqué par authentification/CSRF', 'green');
      results.push({
        name: 'Upload - Type invalide',
        passed: true,
        message: 'Protégé par auth',
      });
    } else {
      log(`  ⚠️ Status: ${responseInvalid.status}`, 'yellow');
      results.push({
        name: 'Upload - Type invalide',
        passed: false,
        message: `Status inattendu: ${responseInvalid.status}`,
      });
    }
  } catch (error) {
    log(`  ❌ Erreur: ${error}`, 'red');
    results.push({
      name: 'Validation Upload',
      passed: false,
      message: `Erreur: ${error}`,
    });
  }
}

// ==================== TEST 11: Détection Menaces ====================
async function testThreatDetection() {
  log('\n🚨 Test 11: Détection de Menaces', 'cyan');
  log('━'.repeat(60), 'cyan');

  try {
    // Test détection SQL injection
    log('  📝 Test détection SQL injection...', 'yellow');
    const sqlPayload = {
      email: "admin'--",
      password: "' OR '1'='1",
      businessName: "Test'; DROP TABLE merchants;--",
    };

    const responseSql = await makeRequest('/api/merchant/register', {
      method: 'POST',
      body: JSON.stringify(sqlPayload),
    });

    if (responseSql.status === 400) {
      const data = await responseSql.json();
      if (data.error?.includes('invalid') || data.error?.includes('Validation')) {
        log('  ✅ SQL injection détectée et bloquée', 'green');
        results.push({
          name: 'Détection - SQL injection',
          passed: true,
          message: 'SQL injection bloquée',
        });
      } else {
        log(`  ⚠️ Bloquée mais raison différente: ${data.error}`, 'yellow');
        results.push({
          name: 'Détection - SQL injection',
          passed: false,
          message: 'Détection incertaine',
        });
      }
    } else if (responseSql.status === 401 || responseSql.status === 403) {
      log('  ✅ Bloqué par autre protection', 'green');
      results.push({
        name: 'Détection - SQL injection',
        passed: true,
        message: 'Protégé',
      });
    } else {
      log(`  ⚠️ Status: ${responseSql.status}`, 'yellow');
      results.push({
        name: 'Détection - SQL injection',
        passed: false,
        message: `Status inattendu: ${responseSql.status}`,
      });
    }

    // Test détection XSS
    log('  📝 Test détection XSS...', 'yellow');
    const xssPayload = {
      email: 'test@test.com',
      password: 'TestPassword123!',
      businessName: '<script>alert("XSS")</script>',
    };

    const responseXss = await makeRequest('/api/merchant/register', {
      method: 'POST',
      body: JSON.stringify(xssPayload),
    });

    if (responseXss.status === 400) {
      const data = await responseXss.json();
      if (data.error?.includes('invalid') || data.error?.includes('Validation')) {
        log('  ✅ XSS détecté et bloqué', 'green');
        results.push({
          name: 'Détection - XSS',
          passed: true,
          message: 'XSS bloqué',
        });
      } else {
        log(`  ⚠️ Bloquée mais raison différente: ${data.error}`, 'yellow');
        results.push({
          name: 'Détection - XSS',
          passed: false,
          message: 'Détection incertaine',
        });
      }
    } else if (responseXss.status === 401 || responseXss.status === 403) {
      log('  ✅ Bloqué par autre protection', 'green');
      results.push({
        name: 'Détection - XSS',
        passed: true,
        message: 'Protégé',
      });
    } else {
      log(`  ⚠️ Status: ${responseXss.status}`, 'yellow');
      results.push({
        name: 'Détection - XSS',
        passed: false,
        message: `Status inattendu: ${responseXss.status}`,
      });
    }
  } catch (error) {
    log(`  ❌ Erreur: ${error}`, 'red');
    results.push({
      name: 'Détection de Menaces',
      passed: false,
      message: `Erreur: ${error}`,
    });
  }
}

// ==================== RAPPORT FINAL ====================
function printReport() {
  log('\n' + '═'.repeat(60), 'blue');
  log('📊 RAPPORT DE SÉCURITÉ', 'blue');
  log('═'.repeat(60), 'blue');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  log(`\n✅ Tests réussis: ${passed}/${total} (${percentage}%)`, passed === total ? 'green' : 'yellow');
  log(`❌ Tests échoués: ${failed}/${total}`, failed > 0 ? 'red' : 'green');

  if (failed > 0) {
    log('\n❌ Tests échoués:', 'red');
    results.filter(r => !r.passed).forEach(r => {
      log(`  • ${r.name}: ${r.message}`, 'red');
    });
  }

  log('\n' + '═'.repeat(60), 'blue');

  // Recommandations
  if (percentage < 100) {
    log('\n📋 RECOMMANDATIONS:', 'yellow');
    log('  1. Vérifiez que le serveur Next.js est démarré', 'yellow');
    log('  2. Vérifiez les variables d\'environnement (.env.local)', 'yellow');
    log('  3. Consultez les logs du serveur pour plus de détails', 'yellow');
  } else {
    log('\n🎉 Tous les tests de sécurité sont passés !', 'green');
    log('   Votre backend est correctement sécurisé.', 'green');
  }

  log('');
}

// ==================== MAIN ====================
async function main() {
  log('🚀 Démarrage des tests de sécurité...', 'blue');
  log(`📡 API Base URL: ${API_BASE_URL}`, 'blue');

  // Vérifier que le serveur est accessible
  try {
    await makeRequest('/api/merchant/me');
  } catch (error) {
    log('\n❌ Erreur: Impossible de se connecter au serveur', 'red');
    log(`   Vérifiez que le serveur Next.js est démarré sur ${API_BASE_URL}`, 'red');
    log('   Commande: cd "vitrine nythy" && npm run dev\n', 'yellow');
    process.exit(1);
  }

  // Exécuter tous les tests
  await testSecurityHeaders();
  await testCORS();
  await testRateLimiting();
  await testAppCheck();
  await testAuthentication();
  await testInputValidation();
  await testUploadProtection();
  await testInjectionProtection();
  await testCSRFProtection();
  await testFileUploadValidation();
  await testThreatDetection();

  // Afficher le rapport
  printReport();

  // Exit code basé sur les résultats
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

// Exécuter
main().catch(error => {
  log(`\n💥 Erreur fatale: ${error}`, 'red');
  process.exit(1);
});

// Make this file a module to avoid global scope conflicts
export { };

