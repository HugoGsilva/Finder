import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { logger } from '../utils/logger';

export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  userAgent?: string;
  enableCookies?: boolean;
}

export interface FormPayload {
  [key: string]: string | number;
}

export class HttpClient {
  private client: AxiosInstance;
  private cookieJar: CookieJar;

  constructor(config: HttpClientConfig) {
    this.cookieJar = new CookieJar();

    const axiosConfig: AxiosRequestConfig = {
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      decompress: true, // Enable Gzip/Brotli decompression
      maxRedirects: 5,
      validateStatus: (status: number) => status >= 200 && status < 400,
    };

    this.client = axios.create(axiosConfig);

    // Wrap with cookie support if enabled
    if (config.enableCookies !== false) {
      wrapper(this.client);
      this.client.defaults.jar = this.cookieJar;
      this.client.defaults.withCredentials = true;
    }

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (requestConfig: InternalAxiosRequestConfig) => {
        logger.debug(`Request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
        return requestConfig;
      },
      (error: Error) => {
        logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.debug(`Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: { response?: { status: number }; code?: string; config?: { url?: string }; message?: string }) => {
        if (error.response) {
          logger.error(`Response error: ${error.response.status} ${error.config?.url}`);
        } else if (error.code === 'ECONNABORTED') {
          logger.error(`Request timeout: ${error.config?.url}`);
        } else {
          logger.error('Network error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  async get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.client.get(url, config);
  }

  async post(url: string, data?: FormPayload, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    // Convert payload to URL-encoded form data
    const formData = new URLSearchParams();
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        formData.append(key, String(value));
      }
    }

    return this.client.post(url, formData.toString(), {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  getCookieJar(): CookieJar {
    return this.cookieJar;
  }

  async getCookiesForUrl(url: string): Promise<string> {
    const cookies = await this.cookieJar.getCookies(url);
    return cookies.map((c: { key: string; value: string }) => `${c.key}=${c.value}`).join('; ');
  }

  clearCookies(): void {
    this.cookieJar.removeAllCookiesSync();
  }

  // Add delay between requests to avoid rate limiting
  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate random delay between min and max
  getRandomDelay(min: number = 1000, max: number = 3000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// Default client for Rubinot
let rubinothingsClient: HttpClient | null = null;

export function getRubinothingsClient(): HttpClient {
  if (!rubinothingsClient) {
    rubinothingsClient = new HttpClient({
      baseUrl: 'https://rubinot.com',
      timeout: 30000,
      enableCookies: true,
    });
  }
  return rubinothingsClient;
}

// Client for rubinothings (playtime history)
let rubinothingsHistoryClient: HttpClient | null = null;

export function getRubinothingsHistoryClient(): HttpClient {
  if (!rubinothingsHistoryClient) {
    rubinothingsHistoryClient = new HttpClient({
      baseUrl: 'https://rubinothings.com',
      timeout: 30000,
      enableCookies: true,
    });
  }
  return rubinothingsHistoryClient;
}
