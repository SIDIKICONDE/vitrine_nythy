/**
 * Script de simulation d'attaques pour tester le monitoring de sécurité
 * 
 * Génère différents types d'attaques pour peupler les logs de sécurité
 * et vérifier que le monitoring Flutter fonctionne correctement
 */

// Make this file a module to avoid global scope conflicts
export {};

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== ATTAQUE 1: SQL Injection ====================
async function simulateSqlInjection() {
  log('\n💉 Simulation: SQL Injection', 'magenta');
  log('━'.repeat(60), 'magenta');

  const payloads = [
    "admin'--",
    "' OR '1'='1",
    "'; DROP TABLE users;--",
    "admin' OR 1=1--",
    "' UNION SELECT * FROM users--",
  ];

  for (const payload of payloads) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload,
          password: 'TestPassword123!',
          businessName: payload,
        }),
      });

      log(`  📤 Payload: "${payload}" → Status: ${response.status}`, 'yellow');
      await sleep(500);
    } catch (error) {
      log(`  ❌ Erreur: ${error}`, 'red');
    }
  }
}

// ==================== ATTAQUE 2: XSS ====================
async function simulateXss() {
  log('\n🎭 Simulation: XSS (Cross-Site Scripting)', 'magenta');
  log('━'.repeat(60), 'magenta');

  const payloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')">',
  ];

  for (const payload of payloads) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'TestPassword123!',
          businessName: payload,
        }),
      });

      log(`  📤 Payload: "${payload.substring(0, 40)}..." → Status: ${response.status}`, 'yellow');
      await sleep(500);
    } catch (error) {
      log(`  ❌ Erreur: ${error}`, 'red');
    }
  }
}

// ==================== ATTAQUE 3: CSRF ====================
async function simulateCsrf() {
  log('\n🛡️  Simulation: CSRF (Cross-Site Request Forgery)', 'magenta');
  log('━'.repeat(60), 'magenta');

  try {
    // Tentative POST sans token CSRF
    const response = await fetch(`${API_BASE_URL}/api/merchant/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://malicious-site.com',
      },
      body: JSON.stringify({
        email: 'csrf-attack@evil.com',
        password: 'TestPassword123!',
        businessName: 'CSRF Attack Business',
      }),
    });

    log(`  📤 POST sans CSRF token depuis origine malveillante → Status: ${response.status}`, 'yellow');
    await sleep(500);

    // Tentative avec token invalide
    const response2 = await fetch(`${API_BASE_URL}/api/merchant/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'fake-token-12345',
      },
      body: JSON.stringify({
        email: 'csrf-attack2@evil.com',
        password: 'TestPassword123!',
        businessName: 'CSRF Attack Business 2',
      }),
    });

    log(`  📤 POST avec CSRF token invalide → Status: ${response2.status}`, 'yellow');
  } catch (error) {
    log(`  ❌ Erreur: ${error}`, 'red');
  }
}

// ==================== ATTAQUE 4: Rate Limiting ====================
async function simulateRateLimiting() {
  log('\n⏱️  Simulation: Rate Limiting (Flood)', 'magenta');
  log('━'.repeat(60), 'magenta');

  log('  📊 Envoi de 100 requêtes rapides...', 'yellow');

  let blocked = 0;
  for (let i = 0; i < 100; i++) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant/me`);
      if (response.status === 429) {
        blocked++;
      }
    } catch (error) {
      // Ignorer
    }
  }

  log(`  📤 ${blocked} requêtes bloquées par rate limiting`, blocked > 0 ? 'green' : 'yellow');
}

// ==================== ATTAQUE 5: App Check Bypass ====================
async function simulateAppCheckBypass() {
  log('\n🔐 Simulation: App Check Bypass', 'magenta');
  log('━'.repeat(60), 'magenta');

  const fakeTokens = [
    'invalid-token-12345',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake',
    'Bearer fake-token',
    '',
  ];

  for (const token of fakeTokens) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant/me`, {
        headers: {
          'X-Firebase-AppCheck': token,
        },
      });

      log(`  📤 Token: "${token.substring(0, 20)}..." → Status: ${response.status}`, 'yellow');
      await sleep(300);
    } catch (error) {
      log(`  ❌ Erreur: ${error}`, 'red');
    }
  }
}

// ==================== ATTAQUE 6: Path Traversal ====================
async function simulatePathTraversal() {
  log('\n📁 Simulation: Path Traversal', 'magenta');
  log('━'.repeat(60), 'magenta');

  const payloads = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '....//....//....//etc/passwd',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  ];

  for (const payload of payloads) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant/${encodeURIComponent(payload)}/orders`);
      log(`  📤 Path: "${payload}" → Status: ${response.status}`, 'yellow');
      await sleep(300);
    } catch (error) {
      log(`  ❌ Erreur: ${error}`, 'red');
    }
  }
}

// ==================== ATTAQUE 7: Payload Volumineux ====================
async function simulateLargePayload() {
  log('\n📦 Simulation: Payload Volumineux (DoS)', 'magenta');
  log('━'.repeat(60), 'magenta');

  try {
    const largePayload = {
      email: 'test@test.com',
      password: 'TestPassword123!',
      businessName: 'x'.repeat(500_000), // 500KB de données
    };

    const response = await fetch(`${API_BASE_URL}/api/merchant/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(largePayload),
    });

    log(`  📤 Payload de ${JSON.stringify(largePayload).length} bytes → Status: ${response.status}`, 'yellow');
  } catch (error) {
    log(`  ❌ Erreur: ${error}`, 'red');
  }
}

// ==================== ATTAQUE 8: Validation Bypass ====================
async function simulateValidationBypass() {
  log('\n✅ Simulation: Validation Bypass', 'magenta');
  log('━'.repeat(60), 'magenta');

  const invalidPayloads = [
    {
      email: 'not-an-email',
      password: '123',
      businessName: 'AB', // Trop court
    },
    {
      email: 'test@test.com',
      password: 'TestPassword123!',
      businessName: 'Valid Name',
      address: {
        latitude: 999, // Invalide
        longitude: -999, // Invalide
      },
    },
    {
      email: 'test@test.com',
      password: 'weak',
      businessName: 'Valid Name',
    },
  ];

  for (const payload of invalidPayloads) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      log(`  📤 Payload invalide → Status: ${response.status}`, 'yellow');
      await sleep(300);
    } catch (error) {
      log(`  ❌ Erreur: ${error}`, 'red');
    }
  }
}

// ==================== RAPPORT FINAL ====================
function printSummary() {
  log('\n' + '═'.repeat(60), 'blue');
  log('📊 SIMULATION TERMINÉE', 'blue');
  log('═'.repeat(60), 'blue');
  log('\n✅ Toutes les attaques ont été simulées', 'green');
  log('📱 Ouvre l\'admin Flutter pour voir les logs en temps réel', 'cyan');
  log('   → Tab "Monitoring Sécurité" (icône bouclier rouge)', 'cyan');
  log('\n💡 Les événements apparaissent dans Firestore: collection "security_logs"', 'yellow');
  log('');
}

// ==================== MAIN ====================
async function main() {
  log('🚀 Démarrage de la simulation d\'attaques...', 'blue');
  log(`📡 API Base URL: ${API_BASE_URL}`, 'blue');

  // Vérifier que le serveur est accessible
  try {
    await fetch(`${API_BASE_URL}/api/merchant/me`);
  } catch (error) {
    log('\n❌ Erreur: Impossible de se connecter au serveur', 'red');
    log(`   Vérifiez que le serveur Next.js est démarré sur ${API_BASE_URL}`, 'red');
    log('   Commande: cd "vitrine nythy" && npm run dev\n', 'yellow');
    process.exit(1);
  }

  // Exécuter toutes les simulations
  await simulateSqlInjection();
  await sleep(1000);
  
  await simulateXss();
  await sleep(1000);
  
  await simulateCsrf();
  await sleep(1000);
  
  await simulateAppCheckBypass();
  await sleep(1000);
  
  await simulatePathTraversal();
  await sleep(1000);
  
  await simulateValidationBypass();
  await sleep(1000);
  
  await simulateLargePayload();
  await sleep(1000);
  
  await simulateRateLimiting();

  // Afficher le résumé
  printSummary();
}

// Exécuter
main().catch(error => {
  log(`\n💥 Erreur fatale: ${error}`, 'red');
  process.exit(1);
});

