# Guia de Integração Frontend — TapMesa Backend API

Este guia prático contém padrões de implementação, código pronto para produção e melhores práticas para integrar aplicações frontend (React, Vue, Next.js, React Native ou Vanilla JS) com o backend do TapMesa.

---

## 1. Configuração do Cliente HTTP (Axios) com Renovação Automática de Token

A integração autenticada exige tratamento de expiração do Access Token (15 minutos) de forma transparente para o usuário, com **fila de requisições pendentes (Mutex/Queue)** para evitar múltiplas chamadas concorrentes de refresh.

```typescript
// src/services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true, // OBRIGATÓRIO: permite trafegar o cookie HttpOnly refresh_token
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de Requisição: Injeta o Access Token e o X-Request-Id
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // Gera um UUID para rastreabilidade de logs caso o cliente não tenha um
  if (!config.headers['X-Request-Id']) {
    config.headers['X-Request-Id'] = crypto.randomUUID();
  }

  return config;
});

// Interceptor de Resposta: Trata 401 e realiza o Refresh Automático
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Ignora tentativas no próprio endpoint de auth (login, refresh, logout)
    if (
      !originalRequest ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // O cookie HttpOnly refresh_token é enviado automaticamente pelo browser
        const response = await api.post<{ accessToken: string }>(
          '/auth/refresh',
        );
        const newAccessToken = response.data.accessToken;

        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);

        // Se o refresh falhar (ex: sessão expirada ou reúso), redireciona para o login
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
```

---

## 2. Cliente de Tempo Real via SSE (Server-Sent Events)

O TapMesa possui dois canais distintos de tempo real:

1. **Canal Público da Mesa (`/public/tables/:token/stream`):** Usado pelo cliente no celular via QR Code.
2. **Canal do Painel da Equipe (`/panel/stream?ticket=...`):** Usado pela equipe e garçons.

### 2.1. Conexão do Cliente na Mesa com Reconexão com Backoff

```typescript
// src/services/tableStream.ts
export type TableEventHandler = (event: string, data: any) => void;

export function connectTableStream(
  tableToken: string,
  onEvent: TableEventHandler,
  onStatusChange?: (
    status: 'connecting' | 'connected' | 'disconnected',
  ) => void,
) {
  let eventSource: EventSource | null = null;
  let retryTimeout: NodeJS.Timeout | null = null;
  let retryDelay = 1000; // Inicia com 1 segundo
  const maxRetryDelay = 30000; // Máximo 30 segundos
  let isClosedManually = false;

  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/public/tables/${tableToken}/stream`;

  function connect() {
    if (isClosedManually) return;

    onStatusChange?.('connecting');
    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      onStatusChange?.('connected');
      retryDelay = 1000; // Reseta o backoff após sucesso
    };

    // Lista de eventos de negócio do TapMesa
    const events = [
      'CALL_CREATED',
      'CALL_ACKNOWLEDGED',
      'CALL_ASSUMED',
      'CALL_ATTENDED',
      'CALL_CONFIRMED',
      'CALL_CANCELLED',
      'CALL_EXPIRED',
      'CALL_CLOSED_UNCONFIRMED',
      'TABLE_PAUSED',
      'TABLE_RESUMED',
      'TABLE_DELETED',
    ];

    events.forEach((eventName) => {
      eventSource?.addEventListener(eventName, (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent(eventName, parsed);
        } catch {
          onEvent(eventName, e.data);
        }
      });
    });

    eventSource.onerror = () => {
      onStatusChange?.('disconnected');
      eventSource?.close();
      eventSource = null;

      if (!isClosedManually) {
        // Reconexão exponencial
        retryTimeout = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 1.5, maxRetryDelay);
          connect();
        }, retryDelay);
      }
    };
  }

  connect();

  return {
    disconnect: () => {
      isClosedManually = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (eventSource) eventSource.close();
      onStatusChange?.('disconnected');
    },
  };
}
```

---

### 2.2. Conexão do Painel da Equipe com Fluxo de Tickets

> **IMPORTANTE:** O ticket retornado por `POST /panel/stream-ticket` é de **uso único** e expira em 60 segundos. Em caso de reconexão de rede, o frontend **nunca deve reconectar usando o mesmo ticket**; deve-se solicitar um novo ticket à API antes de abrir uma nova conexão `EventSource`.

```typescript
// src/services/panelStream.ts
import { api } from './api';

export function connectPanelStream(
  onSnapshot: (snapshotData: any) => void,
  onEvent: (event: string, data: any) => void,
  onStatusChange?: (
    status: 'connecting' | 'connected' | 'disconnected',
  ) => void,
) {
  let eventSource: EventSource | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let isClosed = false;

  async function getFreshTicket(): Promise<string> {
    const res = await api.post<{ ticket: string }>('/panel/stream-ticket');
    return res.data.ticket;
  }

  async function establishConnection() {
    if (isClosed) return;

    try {
      onStatusChange?.('connecting');
      const ticket = await getFreshTicket();

      const streamUrl = `${api.defaults.baseURL}/panel/stream?ticket=${encodeURIComponent(ticket)}`;
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        onStatusChange?.('connected');
      };

      // O primeiro evento recebido é sempre o snapshot completo do salão
      eventSource.addEventListener('snapshot', (e: MessageEvent) => {
        const snapshot = JSON.parse(e.data);
        onSnapshot(snapshot);
      });

      const events = [
        'CALL_CREATED',
        'CALL_ACKNOWLEDGED',
        'CALL_ASSUMED',
        'CALL_ATTENDED',
        'CALL_CONFIRMED',
        'CALL_CANCELLED',
        'CALL_EXPIRED',
        'CALL_CLOSED_UNCONFIRMED',
      ];

      events.forEach((evt) => {
        eventSource?.addEventListener(evt, (e: MessageEvent) => {
          try {
            onEvent(evt, JSON.parse(e.data));
          } catch {
            onEvent(evt, e.data);
          }
        });
      });

      eventSource.onerror = () => {
        onStatusChange?.('disconnected');
        eventSource?.close();
        eventSource = null;

        if (!isClosed) {
          // Agenda reconexão gerando um novo ticket após 3 segundos
          reconnectTimer = setTimeout(establishConnection, 3000);
        }
      };
    } catch (err) {
      onStatusChange?.('disconnected');
      if (!isClosed) {
        reconnectTimer = setTimeout(establishConnection, 5000);
      }
    }
  }

  void establishConnection();

  return {
    disconnect: () => {
      isClosed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) eventSource.close();
      onStatusChange?.('disconnected');
    },
  };
}
```

---

## 3. Sincronização de Relógio e Cronômetros em Tempo Real

Para evitar que o relógio local do smartphone do cliente ou da máquina do garçom afete os contadores, o frontend deve calcular o **desvio de relógio (offset)** em relação ao servidor:

```typescript
// src/utils/timeSync.ts

let serverOffsetMs = 0;

/**
 * Atualiza a sincronização de relógio a partir do cabeçalho ou body da resposta
 */
export function syncClock(serverNowIsoString: string) {
  const serverTime = new Date(serverNowIsoString).getTime();
  const localTime = Date.now();
  serverOffsetMs = serverTime - localTime;
}

/**
 * Retorna o timestamp atual em milissegundos referenciado no horário oficial do servidor
 */
export function getServerNowMs(): number {
  return Date.now() + serverOffsetMs;
}

/**
 * Calcula os segundos decorridos desde a criação de um chamado de forma segura
 */
export function calculateElapsedSec(createdAtIsoString: string): number {
  const createdTime = new Date(createdAtIsoString).getTime();
  const currentServerTime = getServerNowMs();
  return Math.max(0, Math.floor((currentServerTime - createdTime) / 1000));
}

/**
 * Formata segundos em cronômetro mm:ss
 */
export function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
```

---

## 4. Tratamento Padronizado de Erros (RFC 7807)

```typescript
// src/utils/errorHandler.ts
import { AxiosError } from 'axios';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  requestId?: string;
  code?: string;
  duplicates?: number[];
}

export function parseApiError(error: unknown): ProblemDetails {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as Partial<ProblemDetails>;
    return {
      type: data.type || 'about:blank',
      title: data.title || 'Erro na Requisição',
      status: error.response.status,
      detail: data.detail || error.message,
      instance: data.instance || '',
      requestId: data.requestId,
      code: data.code,
      duplicates: data.duplicates,
    };
  }

  return {
    type: 'about:blank',
    title: 'Erro de Conexão',
    status: 500,
    detail:
      'Não foi possível se comunicar com o servidor. Verifique sua conexão.',
    instance: '',
  };
}
```
