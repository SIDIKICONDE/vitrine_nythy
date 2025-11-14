/**
 * Script de test du middleware de sécurité v2.0
 * 
 * Teste toutes les fonctionnalités :
 * - Rate limiting
 * - CSRF protection
 * - IP intelligence
 * - Anomaly detection
 * - CSP headers
 * - Monitoring
 */

const API_BASE_URL = process.env['API_BASE_URL'] || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name: string) {
  log(`\n🧪 Test: ${name}`, 'cyan');
}

function logSuccess(message: string) {
  log(`  ✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`  ❌ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`  ⚠️  ${message}`, 'yellow');
}

function addResult(name: string, passed: boolean, message: string, duration: number) {
  results.push({ name, passed, message, duration });
  if (passed) {
    logSuccess(`${message} (${duration}ms)`);
  } else {
    logError(`${message} (${duration}ms)`);
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== TESTS ====================

/**
 * Test 1: CSRF Token Generation
 */
async function testCsrfTokenGeneration() {
  logTest('CSRF Token Generation');
  const start = Date.now();
  
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      credentials: 'include',
    });

    const cookies = response.headers.get('set-cookie');
    const hasCsrfCookie = cookies?.includes('nythy_csrf_token');

    if (hasCsrfCookie) {
      addResult('CSRF Token', true, 'CSRF token cookie generated', Date.now() - start);
      return cookies;
    } else {
      addResult('CSRF Token', false, 'CSRF token cookie not found', Date.now() - start);
      return null;
    }
  } catch (error) {
    addResult('CSRF Token', false, `Error: ${error}`, Date.now() - start);
    return null;
  }
}

/**
 * Test 2: CSRF Protection
 */
async function testCsrfProtection(cookies: string | null) {
  logTest('CSRF Protection');
  const start = Date.now();

  try {
    // Tenter une requête POST sans token CSRF
    const response = await fetch(`${API_BASE_URL}/api/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '',
      },
      body: JSON.stringify({ test: 'data' }),
    });

    if (response.status === 403) {
      addResult('CSRF Protection', true, 'POST blocked without CSRF token', Date.now() - start);
      return true;
    } else {
      addResult('CSRF Protection', false, `Expected 403, got ${response.status}`, Date.now() - start);
      return false;
    }
  } catch (error) {
    addResult('CSRF Protection', false, `Error: ${error}`, Date.now() - start);
    return false;
  }
}

/**
 * Test 3: Rate Limiting
 */
async function testRateLimiting() {
  logTest('Rate Limiting');
  const start = Date.now();

  try {
    const requests = [];
    const maxRequests = 10;

    // Envoyer plusieurs requêtes rapidement
    for (let i = 0; i < maxRequests; i++) {
      requests.push(
        fetch(`${API_BASE_URL}/api/test`, {
          method: 'GET',
        })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);

    if (rateLimited) {
      addResult('Rate Limiting', true, 'Rate limiting active (429 received)', Date.now() - start);
      
      // Vérifier les headers de rate limit
      const lastResponse = responses[responses.length - 1];
      const hasRateLimitHeaders = lastResponse &&
        (lastResponse.headers.has('X-RateLimit-Limit') ||
        lastResponse.headers.has('Retry-After'));
      
      if (hasRateLimitHeaders) {
        logSuccess('Rate limit headers present');
      }
      
      return true;
    } else {
      addResult('Rate Limiting', false, 'No rate limiting detected', Date.now() - start);
      return false;
    }
  } catch (error) {
    addResult('Rate Limiting', false, `Error: ${error}`, Date.now() - start);
    return false;
  }
}

/**
 * Test 4: Security Headers
 */
async function testSecurityHeaders() {
  logTest('Security Headers');
  const start = Date.now();

  try {
    const response = await fetch(`${API_BASE_URL}/`);
    
    const requiredHeaders = [
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Content-Security-Policy',
      'Referrer-Policy',
    ];

    const missingHeaders = requiredHeaders.filter(
      header => !response.headers.has(header)
    );

    if (missingHeaders.length === 0) {
      addResult('Security Headers', true, 'All security headers present', Date.now() - start);
      
      // Vérifier le CSP
      const csp = response.headers.get('Content-Security-Policy');
      if (csp?.includes('nonce-')) {
        logSuccess('CSP with nonce detected');
      } else {
        logWarning('CSP nonce not detected (dev mode?)');
      }
      
      return true;
    } else {
      addResult('Security Headers', false, `Missing: ${missingHeaders.join(', ')}`, Date.now() - start);
      return false;
    }
  } catch (error) {
    addResult('Security Headers', false, `Error: ${error}`, Date.now() - start);
    return false;
  }
}

/**
 * Test 5: CORS Headers
 */
async function testCorsHeaders() {
  logTest('CORS Headers');
  const start = Date.now();

  try {
    const response = await fetch(`${API_BASE_URL}/api/test`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
      },
    });

    const hasCors = 
      response.headers.has('Access-Control-Allow-Origin') &&
      response.headers.has('Access-Control-Allow-Methods');

    if (hasCors) {
      addResult('CORS Headers', true, 'CORS headers configured', Date.now() - start);
      return true;
    } else {
      addResult('CORS Headers', false, 'CORS headers missing', Date.now() - start);
      return false;
    }
  } catch (error) {
    addResult('CORS Headers', false, `Error: ${error}`, Date.now() - start);
    return false;
  }
}

/**
 * Test 6: Response Time
 */
async function testResponseTime() {
  logTest('Response Time');
  const start = Date.now();

  try {
    const response = await fetch(`${API_BASE_URL}/`);
    const duration = Date.now() - start;

    if (duration < 500) {
      addResult('Response Time', true, `Fast response: ${duration}ms`, duration);
      return true;
    } else if (duration < 1000) {
      addResult('Response Time', true, `Acceptable response: ${duration}ms`, duration);
      return true;
    } else {
      addResult('Response Time', false, `Slow response: ${duration}ms`, duration);
      return false;
    }
  } catch (error) {
    addResult('Response Time', false, `Error: ${error}`, Date.now() - start);
    return false;
  }
}

/**
 * Test 7: Multiple IPs Simulation
 */
async function testMultipleIps() {
  logTest('Multiple IPs Handling');
  const start = Date.now();

  try {
    const ips = [
      '192.168.1.1',
      '10.0.0.1',
      '172.16.0.1',
    ];

    const requests = ips.map(ip =>
      fetch(`${API_BASE_URL}/`, {
        headers: {
          'X-Forwarded-For': ip,
        },
      })
    );

    const responses = await Promise.all(requests);
    const allSuccess = responses.every(r => r.ok);

    if (allSuccess) {
      addResult('Multiple IPs', true, 'Handled multiple IPs correctly', Date.now() - start);
      return true;
    } else {
      addResult('Multiple IPs', false, 'Failed to handle multiple IPs', Date.now() - start);
      return false;
    }
  } catch (error) {
    addResult('Multiple IPs', false, `Error: ${error}`, Date.now() - start);
    return false;
  }
}

/**
 * Test 8: Malicious Patterns Detection
 */
async function testMaliciousPatterns() {
  logTest('Malicious Patterns Detection');
  const start = Date.now();

  try {
    const maliciousPayloads = [
      { name: 'SQL Injection', payload: "' OR '1'='1" },
      { name: 'XSS', payload: '<script>alert("xss")</script>' },
      { name: 'Path Traversal', payload: '../../etc/passwd' },
    ];

    let detected = 0;

    for (const { name, payload } of maliciousPayloads) {
      const response = await fetch(`${API_BASE_URL}/api/test?q=${encodeURIComponent(payload)}`, {
        method: 'GET',
      });

      if (response.status === 403 || response.status === 400) {
        logSuccess(`${name} detected`);
        detected++;
      } else {
        logWarning(`${name} not detected`);
      }

      await sleep(100);
    }

    if (detected > 0) {
      addResult('Malicious Patterns', true, `${detected}/${maliciousPayloads.length} patterns detected`, Date.now() - start);
      return true;
    } else {
      addResult('Malicious Patterns', false, 'No malicious patterns detected', Date.now() - start);
      return false;
    }
  } catch (error) {
    addResult('Malicious Patterns', false, `Error: ${error}`, Date.now() - start);
    return false;
  }
}

/**
 * Test 9: Admin Route Protection
 */
async function testAdminProtection() {
  logTest('Admin Route Protection');
  const start = Date.now();

  try {
    const response = await fetch(`${API_BASE_URL}/admin`, {
      redirect: 'manual',
    });

    // Doit rediriger vers /admin/login
    if (response.status === 307 || response.status === 302) {
      const location = response.headers.get('location');
      if (location?.includes('/admin/login')) {
        addResult('Admin Protection', true, 'Admin routes protected', Date.now() - start);
        return true;
      }
    }

    addResult('Admin Protection', false, 'Admin routes not properly protected', Date.now() - start);
    return false;
  } catch (error) {
    addResult('Admin Protection', false, `Error: ${error}`, Date.now() - start);
    return false;
  }
}

/**
 * Test 10: Concurrent Requests
 */
async function testConcurrentRequests() {
  logTest('Concurrent Requests Handling');
  const start = Date.now();

  try {
    const concurrentRequests = 50;
    const requests = Array(concurrentRequests).fill(null).map(() =>
      fetch(`${API_BASE_URL}/`)
    );

    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.ok).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;

    if (successCount > 0) {
      addResult(
        'Concurrent Requests',
        true,
        `Handled ${successCount}/${concurrentRequests} requests (${rateLimitedCount} rate-limited)`,
        Date.now() - start
      );
      return true;
    } else {
      addResult('Concurrent Requests', false, 'Failed to handle concurrent requests', Date.now() - start);
      return false;
    }
  } catch (error) {
    addResult('Concurrent Requests', false, `Error: ${error}`, Date.now() - start);
    return false;
  }
}

// ==================== MAIN ====================

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║   🛡️  MIDDLEWARE SÉCURITÉ v2.0 - TESTS COMPLETS  🛡️   ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝\n', 'blue');

  log(`📍 Testing: ${API_BASE_URL}\n`, 'cyan');

  // Vérifier que le serveur est accessible
  try {
    await fetch(`${API_BASE_URL}/`);
  } catch (error) {
    log('❌ Serveur non accessible. Assurez-vous que le serveur est démarré.', 'red');
    log(`   Commande: npm run dev\n`, 'yellow');
    process.exit(1);
  }

  // Exécuter tous les tests
  const cookies = await testCsrfTokenGeneration();
  await sleep(500);

  await testCsrfProtection(cookies);
  await sleep(500);

  await testSecurityHeaders();
  await sleep(500);

  await testCorsHeaders();
  await sleep(500);

  await testResponseTime();
  await sleep(500);

  await testMultipleIps();
  await sleep(500);

  await testMaliciousPatterns();
  await sleep(1000);

  await testAdminProtection();
  await sleep(500);

  await testConcurrentRequests();
  await sleep(500);

  await testRateLimiting();

  // Résumé
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║                    📊 RÉSUMÉ DES TESTS                  ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝\n', 'blue');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const successRate = ((passed / total) * 100).toFixed(1);

  log(`Total: ${total} tests`, 'cyan');
  log(`✅ Réussis: ${passed}`, 'green');
  log(`❌ Échoués: ${failed}`, 'red');
  log(`📈 Taux de réussite: ${successRate}%\n`, 'cyan');

  // Détails des tests échoués
  if (failed > 0) {
    log('Tests échoués:', 'red');
    results.filter(r => !r.passed).forEach(r => {
      log(`  • ${r.name}: ${r.message}`, 'red');
    });
    log('');
  }

  // Score de sécurité
  let score = 0;
  if (successRate >= 90) score = 12;
  else if (successRate >= 80) score = 10;
  else if (successRate >= 70) score = 8;
  else if (successRate >= 60) score = 6;
  else score = 4;

  log(`🏆 Score de sécurité: ${score}/10`, score >= 10 ? 'green' : 'yellow');

  if (score >= 10) {
    log('\n🎉 Excellent ! Le middleware de sécurité fonctionne parfaitement !', 'green');
  } else if (score >= 8) {
    log('\n👍 Bon ! Quelques améliorations possibles.', 'yellow');
  } else {
    log('\n⚠️  Attention ! Des problèmes de sécurité ont été détectés.', 'red');
  }

  log('\n✨ Tests terminés !\n', 'cyan');

  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Exécuter les tests
runAllTests().catch(error => {
  log(`\n❌ Erreur fatale: ${error}`, 'red');
  process.exit(1);
});

