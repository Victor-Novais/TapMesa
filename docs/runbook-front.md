# Runbook Operacional Front-end — TapMesa Web

**Versão da Aplicação:** `v1.0.0`  
**Data:** 22 de Outubro de 2026  
**Público-alvo:** Equipes de Engenharia, DevOps, SRE e Operações

---

## 1. Visão Geral da Arquitetura de Produção

O front-end do TapMesa é uma aplicação desenvolvida com **Next.js 16 App Router** compilada com `output: 'standalone'`. Isso significa que o processo Node.js roda de maneira autocontida, dependendo unicamente de:

- Um servidor Node.js (v24.x) executando `node server.js`
- Os assets estáticos gerados em `.next/static`
- A pasta pública `public/` (ícones, manifest e Service Worker `sw.js`)

A aplicação comunica-se com a API REST/SSE do TapMesa via requisições HTTP seguras com credenciais (`withCredentials: true`), mantendo os tokens de autenticação estritamente na memória volátil da aplicação e utilizando cookies `httpOnly` para rotação de sessão.

---

## 2. Variáveis de Ambiente e Injeção no Build

> [!IMPORTANT]
> As variáveis prefixadas com `NEXT_PUBLIC_` são embutidas diretamente nos pacotes JavaScript estáticos **em tempo de compilação (`npm run build`)**.
> Alterar essas variáveis em um container em execução NÃO surtirá efeito sem reconstruir a imagem Docker.

| Variável              | Obrigatória | Exemplo Produção                    | Descrição                                                                      |
| :-------------------- | :---------- | :---------------------------------- | :----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Sim         | `https://api.tapmesa.com.br/api/v1` | URL base da API do TapMesa, acessada pelo navegador do cliente e do painel.    |
| `NEXT_PUBLIC_APP_URL` | Sim         | `https://app.tapmesa.com.br`        | URL canônica pública do front-end, utilizada na montagem dos links de QR Code. |
| `PORT`                | Não         | `3001`                              | Porta TCP na qual o servidor HTTP do Node.js escuta.                           |
| `HOSTNAME`            | Não         | `0.0.0.0`                           | Endereço de interface de rede (obrigatório em containers).                     |
| `NODE_ENV`            | Sim         | `production`                        | Ativa otimizações do React e Next.js e desativa `unsafe-eval` no CSP.          |

---

## 3. Procedimento de Deploy

### 3.1 Deploy via Docker Container (Recomendado)

1. **Construção da Imagem:**

   ```bash
   docker build \
     --target prod \
     --build-arg NEXT_PUBLIC_API_URL="https://api.tapmesa.com.br/api/v1" \
     --build-arg NEXT_PUBLIC_APP_URL="https://app.tapmesa.com.br" \
     -t ghcr.io/tapmesa/tapmesa-web:v1.0.0 .
   ```

2. **Execução Segura em Produção:**

   ```bash
   docker run -d \
     --name tapmesa-web \
     -p 3001:3001 \
     --read-only \
     --tmpfs /tmp \
     --tmpfs /app/.next/cache \
     --cap-drop ALL \
     --security-opt no-new-privileges:true \
     --restart unless-stopped \
     ghcr.io/tapmesa/tapmesa-web:v1.0.0
   ```

3. **Deploy via Docker Compose:**
   ```bash
   docker compose pull web
   docker compose up -d --remove-orphans web
   ```

### 3.2 Verificação de Saúde Pós-Deploy (Smoke Check)

Logo após o deploy, execute os seguintes testes automáticos na máquina de produção ou load balancer:

```bash
# 1. Checagem de status HTTP 200 na raiz
curl -I -s http://localhost:3001/ | grep "HTTP/1.1 200 OK"

# 2. Verificação de cabeçalhos de segurança essenciais
curl -I -s http://localhost:3001/ | grep -E "x-content-type-options|x-frame-options|content-security-policy"

# 3. Verificação de isolamento no Service Worker (não deve ter cache da API)
curl -s http://localhost:3001/sw.js | grep "NETWORK_ONLY_ROUTES"
```

---

## 4. Estratégia e Procedimento de Rollback

Se um bug crítico ou quebra de contrato for detectado em produção:

1. **Reversão Imediata de Imagem Docker (SLA < 1 minuto):**

   ```bash
   # Reaponte a tag no compose ou orquestrador para a versão anterior estável
   docker stop tapmesa-web
   docker run -d \
     --name tapmesa-web \
     -p 3001:3001 \
     --restart unless-stopped \
     ghcr.io/tapmesa/tapmesa-web:v0.9.x # versão estável anterior
   ```

2. **Reversão via Kubernetes:**

   ```bash
   kubectl rollout undo deployment/tapmesa-web
   kubectl rollout status deployment/tapmesa-web
   ```

3. **Reversão de Branch Git:**
   - Faça checkout da tag anterior estável (`git checkout tags/vX.Y.Z`).
   - Se necessário, execute `git revert HEAD` criando um PR de reversão emergencial.

---

## 5. Integração e Alinhamento de Contratos com o Backend

Para evitar regressões entre front-end e back-end:

1. **Versionamento Estrito:** Todas as chamadas do cliente e dashboard utilizam o prefixo `/api/v1`. Nenhuma rota do front consome rotas legadas ou não versionadas.
2. **CORS:** O backend deve ter a flag `cors.origin` configurada contendo exatamente o domínio de produção (`https://app.tapmesa.com.br`) com `credentials: true`.
3. **Cookies de Sessão:** Em ambientes HTTPS de produção, garanta que os cookies emitidos pelo backend (`refreshToken`) tenham os atributos `HttpOnly; Secure; SameSite=None` (ou `SameSite=Lax` se o front e a API estiverem sob o mesmo subdomínio base).
4. **Relógio do Servidor (`X-Server-Now`):** O backend deve retornar a hora UTC atual no cabeçalho `X-Server-Now` e no campo `serverNow` dos payloads JSON para sincronizar os cronômetros de tempo de espera do painel e da mesa.

---

## 6. Procedimentos de Contingência e Degradação Graciosa

- **Queda do canal SSE de Tempo Real:**
  - O painel operacional comuta automaticamente para polling silencioso a cada 10 segundos (`GET /api/v1/panel/state`), garantindo que nenhum chamado fique sem atendimento.
  - A tela da mesa executa retentativas com backoff exponencial (1s, 2s, 4s até 30s) e ressincroniza assim que a aba voltar a ficar visível (`visibilitychange`) ou a conexão cair e voltar (`online`).
- **Desconexão de Rede do Dispositivo do Painel:**
  - O painel exibe um banner persistente vermelho ("Painel desconectado. Tentando reconectar...").
  - O operador da casa é alertado visualmente para restabelecer o Wi-Fi da Smart TV ou tablet.
