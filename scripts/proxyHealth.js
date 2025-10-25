#!/usr/bin/env node

/**
 * Fixie Proxy Health Check Script
 * Tests that requests are being routed through Fixie proxy
 * Expected IPs: 52.5.155.132 or 52.87.82.133
 */

import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const FIXIE_URL = process.env.FIXIE_URL;
const EXPECTED_IPS = ['52.5.155.132', '52.87.82.133'];

async function checkProxyHealth() {
  console.log('🔍 Fixie Proxy Health Check');
  console.log('━'.repeat(50));
  
  if (!FIXIE_URL) {
    console.error('❌ ERROR: FIXIE_URL environment variable not set');
    process.exit(1);
  }
  
  console.log('✓ FIXIE_URL configured:', FIXIE_URL.replace(/:[^:@]+@/, ':****@'));
  console.log('');
  
  try {
    const proxyAgent = new HttpsProxyAgent(FIXIE_URL);
    
    const proxyAxios = axios.create({
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
      proxy: false,
    });
    
    console.log('📡 Checking outbound IP via Fixie proxy...');
    const startTime = Date.now();
    
    const response = await proxyAxios.get('https://api.ipify.org?format=json');
    const latency = Date.now() - startTime;
    
    const detectedIp = response.data.ip;
    
    console.log('');
    console.log('✅ Response received');
    console.log('━'.repeat(50));
    console.log('Detected IP:', detectedIp);
    console.log('Latency:', `${latency}ms`);
    console.log('');
    
    if (EXPECTED_IPS.includes(detectedIp)) {
      console.log('✅ SUCCESS: IP matches expected Fixie IPs');
      console.log(`   (${EXPECTED_IPS.join(' or ')})`);
    } else {
      console.log('⚠️  WARNING: IP does not match expected Fixie IPs');
      console.log(`   Expected: ${EXPECTED_IPS.join(' or ')}`);
      console.log(`   Got: ${detectedIp}`);
      console.log('   This may indicate Fixie proxy is not active');
    }
    
    console.log('');
    console.log('━'.repeat(50));
    console.log('🎉 Proxy health check complete!');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    process.exit(1);
  }
}

checkProxyHealth();
