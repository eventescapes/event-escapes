import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Creates an Axios instance configured to use Fixie proxy
 * @returns {import('axios').AxiosInstance}
 */
export function makeProxiedAxios() {
  const fixieUrl = process.env.FIXIE_URL;
  
  if (!fixieUrl) {
    console.warn('⚠️  FIXIE_URL not set - requests will not be proxied');
    return axios.create();
  }

  const proxyAgent = new HttpsProxyAgent(fixieUrl);
  
  const instance = axios.create({
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
    proxy: false, // Disable axios default proxy handling
  });

  console.log('✅ Axios instance created with Fixie proxy:', fixieUrl.replace(/:[^:@]+@/, ':****@'));
  
  return instance;
}
