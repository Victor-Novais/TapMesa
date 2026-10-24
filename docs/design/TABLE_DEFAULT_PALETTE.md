# Paleta padrão da tela da mesa — instruções para o back-end

**Data:** 24/10/2026
**Para:** quem mantém o back-end do TapMesa
**Contexto:** o redesign visual (`docs/design/DESIGN_PLAN.md`) adota a paleta TapMesa. O front **usa exatamente as cores que o back devolve** e só aplica os tokens TapMesa quando um campo vier ausente ou nulo. Por isso, o padrão visto por restaurantes que nunca personalizaram a aparência depende do valor padrão configurado no back. Este documento descreve o que mudar e como validar. A decisão de migrar restaurantes existentes é sua (§4).

Valores de contraste calculados pela fórmula de luminância relativa da WCAG 2.1. Mínimos: 4,5:1 para texto normal; 3:1 para texto grande (≥ 24px, ou ≥ 18,66px em negrito) e para componentes de interface.

---

## 1. Campos de aparência que o back devolve e o padrão atual

Os campos chegam em `GET /public/tables/{token}` → `appearance` e em `GET /settings/appearance` (mesmo formato: `RestaurantAppearance`, em `src/shared/types/api.ts`).

| Campo no contrato               | Tipo                   | Valor padrão atual (restaurante sem personalização) | Observação                                                              |
| ------------------------------- | ---------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| `appearance.backgroundType`     | `"color"` \| `"image"` | `"color"`                                           | Com `"image"`, `backgroundValue` é a URL da imagem.                     |
| `appearance.backgroundValue`    | string \| null         | `"#0f172a"` (azul-marinho)                          | Com `"color"`, é usado quando `colors.background` não vem.              |
| `appearance.colors.background`  | string                 | `"#0f172a"` (azul-marinho)                          | Cor do fundo da tela da mesa.                                           |
| `appearance.colors.text`        | string                 | `"#f8fafc"`                                         | Cor do texto solto sobre o fundo.                                       |
| `appearance.colors.primary`     | string                 | `"#f97316"`                                         | Cor do botão "Chamar garçom" (a partir da Fase 4).                      |
| `appearance.colors.secondary`   | string (opcional)      | **ausente**                                         | Cor de fundo do botão "Pedir a conta".                                  |
| `appearance.colors.primaryText` | string (opcional)      | **ausente**                                         | Cor do rótulo do botão primário.                                        |
| `appearance.colors.surface`     | string                 | `"#1e293b"`                                         | Hoje não é usado na tela da mesa (só na pré-visualização de Aparência). |

Contraste do padrão atual:

| Par                                         | Razão      | Resultado                                                                       |
| ------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| Texto `#f8fafc` sobre fundo `#0f172a`       | 17,06:1    | ✅                                                                              |
| Branco sobre primária `#f97316`             | **2,80:1** | ❌ — a proteção de contraste do front troca o rótulo para tinta escura (7,10:1) |
| Primária `#f97316` contra o fundo `#0f172a` | 6,37:1     | ✅                                                                              |

## 2. Paleta padrão proposta (tokens TapMesa)

| Campo                | Valor proposto            | Token                    | Par verificado             | Razão                                                                |
| -------------------- | ------------------------- | ------------------------ | -------------------------- | -------------------------------------------------------------------- |
| `backgroundType`     | `"color"`                 | —                        | —                          | —                                                                    |
| `backgroundValue`    | `"#F9F8F6"`               | Warm Alabaster           | —                          | —                                                                    |
| `colors.background`  | `"#F9F8F6"`               | Warm Alabaster           | —                          | —                                                                    |
| `colors.text`        | `"#141615"`               | Cast Iron                | texto / fundo              | **17,13:1** ✅                                                       |
| `colors.primary`     | `"#C4452D"` (recomendado) | Terracotta para botões   | rótulo branco / primária   | **4,96:1** ✅                                                        |
|                      | ou `"#D94E34"`            | Terracotta Ember (marca) | rótulo branco / primária   | 4,13:1 — ✅ só com rótulo ≥ 18,66px em negrito; ❌ para rótulo menor |
| `colors.primaryText` | `"#FFFFFF"`               | —                        | (ver linha acima)          | —                                                                    |
| `colors.secondary`   | `"#2A2421"`               | Deep Espresso            | rótulo branco / secundária | **15,30:1** ✅                                                       |
| `colors.surface`     | `"#FFFFFF"`               | Pure Ceramic             | texto / superfície         | 18,18:1 ✅                                                           |

Componentes contra o fundo `#F9F8F6` (mínimo 3:1): primária `#C4452D` = 4,67:1 ✅; `#D94E34` = 3,89:1 ✅; secundária `#2A2421` = 14,41:1 ✅.

**Por que `#C4452D` e não `#D94E34`:** no celular, o rótulo de "Chamar garçom" tem 16px em negrito, abaixo do limite de "texto grande". Com `#D94E34`, branco fica em 4,13:1 e não passa AA; com `#C4452D`, passa (4,96:1) e a cor continua lida como Terracotta. `#D94E34` segue sendo a cor da marca (logo, destaques).

## 3. Como o front usa cada campo na tela da mesa

Situação após a Fase 4 do redesign (decisões Q3, Q4 e Q6 do plano).

| Elemento                                                            | Campo usado                                                | Comportamento                                                                                                                      | Se o campo faltar                                                     |
| ------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Fundo da tela                                                       | `backgroundType` + `colors.background` / `backgroundValue` | Cor sólida, ou imagem com película escura (sem desfoque)                                                                           | `#F9F8F6`                                                             |
| Texto solto (nome, descrição, rodapé)                               | `colors.text`                                              | Se tiver menos de 4,5:1 contra o fundo, o front troca por branco ou `#141615`, o que for mais legível                              | `#141615`                                                             |
| Botão "Chamar garçom"                                               | `colors.primary` + `colors.primaryText`                    | Rótulo com a mesma proteção de contraste (4,5:1). Se a cor do botão tiver menos de 3:1 contra o fundo, o botão ganha borda de 2px. | `--primary` (`#C4452D`) com rótulo branco                             |
| Botão "Pedir a conta"                                               | `colors.secondary`                                         | Fundo na cor secundária, rótulo com proteção de contraste                                                                          | Botão de contorno neutro                                              |
| Card do Wi-Fi, cards de chamado, selos (mesa, conexão, boas-vindas) | derivados de `colors.background` e `colors.text`           | Superfícies claras ou escuras conforme a luminância do fundo do restaurante — **nunca** pelo modo escuro do celular                | Superfícies claras                                                    |
| Logo                                                                | `logoUrl`                                                  | Sempre tem prioridade                                                                                                              | Logo TapMesa (versão clara ou escura conforme o fundo do restaurante) |

**Se o restaurante mudar só alguns campos:** cada campo é independente. Exemplo: mudar só `colors.primary` mantém o fundo e o texto padrão; mudar só `colors.background` para uma cor escura faz os cards passarem para a versão escura e, se `colors.text` continuar `#141615`, a proteção de contraste troca o texto para branco. Nenhuma combinação deixa o texto abaixo de 4,5:1.

## 4. Restaurantes existentes com o padrão antigo — decisão pendente

Recomendação: migrar para o padrão novo **apenas os restaurantes que nunca editaram a aparência**, sem sobrescrever quem personalizou.

Como o back pode saber quem nunca editou (escolha uma):

1. **Comparar com o padrão antigo:** restaurante cujo conjunto `backgroundType = "color"`, `backgroundValue = "#0f172a"`, `colors = { primary: "#f97316", background: "#0f172a", surface: "#1e293b", text: "#f8fafc" }`, sem `secondary`/`primaryText`, é tratado como "nunca personalizou". Simples, mas reclassifica quem escolheu esses mesmos valores de propósito.
2. **Campo de controle:** adicionar `appearanceCustomizedAt` (ou `appearanceUpdatedAt`) ao restaurante, preenchido em todo `PUT /settings/appearance`. Restaurantes sem esse campo recebem o padrão novo. É o caminho mais seguro daqui para frente.
3. **Trilha de auditoria:** usar a auditoria existente (`/admin/audit`) para identificar restaurantes sem nenhum evento de alteração de aparência.

**Decisão sua:** migrar ou não, e por qual critério. O front funciona com qualquer escolha.

## 5. Checklist de validação depois da mudança no back

- [ ] `GET /public/tables/{token}` de um restaurante novo devolve os valores do §2.
- [ ] Capturas da tela da mesa com o padrão novo em 390px, nos estados livre, garçom pendente, atendido (avaliação), confirmado e pausada — com o celular em **modo claro** e em **modo escuro** (as duas devem ficar iguais, porque a mesa segue só o tema do restaurante).
- [ ] Contraste AA: texto/fundo ≥ 4,5:1; rótulo de "Chamar garçom" ≥ 4,5:1; rótulo de "Pedir a conta" ≥ 4,5:1; botões ≥ 3:1 contra o fundo. Lighthouse mobile sem falha de `color-contrast` em `/m/[token]`.
- [ ] Pré-visualização em Configurações → Aparência igual à mesa real (mesmas cores, mesmo botão primário).
- [ ] Restaurantes que personalizaram continuam exatamente como estavam.

## 6. Pendência do back-end: cabeçalho `x-table-url`

O teste `e2e/integration.spec.ts` (linha 137) espera que `GET /tables/{id}/qr?format=png` devolva o cabeçalho `x-table-url` com a URL canônica da mesa (igual a `table.url`, ex.: `http://localhost:3001/?m=QCPQ9QSU6B`). O back-end local não envia esse cabeçalho, e o teste falha nesse ponto. Ver `docs/design/E2E_BASELINE.md`.
