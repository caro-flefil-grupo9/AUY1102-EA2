# Evaluación Parcial 3 — AUY1102
## Aseguramiento de la Calidad del Software con GitHub y GitHub Actions II

---

## 1. Antecedentes

- **Institución:** Duoc UC
- **Asignatura:** Ciclo de Vida del Software I (AUY1102)
- **Evaluación:** Evaluación Parcial N° 3 (40% de ponderación)
- **Integrantes:**
  - Francisco Flefil
  - Javier Caro
- **Organización en GitHub:** [caro-flefil-grupo9](https://github.com/caro-flefil-grupo9)
- **Repositorio oficial (público):** [https://github.com/caro-flefil-grupo9/AUY1102-EA2](https://github.com/caro-flefil-grupo9/AUY1102-EA2)
- **Repositorio base (fork upstream):** [Fundacion-Instituto-Profesional-Duoc-UC/AUY1102-Pipeline](https://github.com/Fundacion-Instituto-Profesional-Duoc-UC/AUY1102-Pipeline)
- **Registro de imágenes en Docker Hub:** [https://hub.docker.com/r/fflefil/auy1102-pipeline](https://hub.docker.com/r/fflefil/auy1102-pipeline)
- **Proyecto en SonarCloud:** [caro-flefil-grupo9_AUY1102-EA2](https://sonarcloud.io/project/overview?id=caro-flefil-grupo9_AUY1102-EA2)

### Estrategia de Ramas (Continuación de EP2)
- **`master`**: se mantiene intacta con el historial y entregables de la Evaluación Parcial 2 ([EVALUACION_EA2.md](EVALUACION_EA2.md)).
- **`develop`**: rama de integración donde se desarrolla y valida continuamente cada `push` con construcción Docker, pruebas unitarias dentro del contenedor, Docker Scout, GitHub Advanced Security y publicación en Docker Hub (`develop` / `sha-<commit>`).
- **`main`**: rama principal protegida mediante Pull Requests desde `develop`, que ejecutan el pipeline completo de calidad y seguridad (incluyendo SonarCloud, Snyk, Dependency Review, Escaneo de Secretos, CodeQL y Docker Scout) antes de autorizar el despliegue (`pr-<n>` / `latest`).

---

## 2. Arquitectura del Pipeline CI/CD

El pipeline está organizado en dos workflows modulares dentro de `.github/workflows/`:
1. **[`.github/workflows/ci-cd-ep3.yml`](.github/workflows/ci-cd-ep3.yml)**: workflow principal disparado en `push` a `develop`, `pull_request` a `main` y `workflow_dispatch`.
2. **[`.github/workflows/ghas-security.yml`](.github/workflows/ghas-security.yml)**: workflow reutilizable (`workflow_call`) invocado por el pipeline principal para ejecutar los controles de **GitHub Advanced Security**.

```mermaid
flowchart LR
    T1["Trigger: push a develop / PR a main"] --> J1["1. Docker Build + Pruebas Unitarias en Contenedor"]
    J1 --> J2["2. Docker Scout (CVEs críticas)"]
    J1 --> J3["3. SonarCloud + Quality Gate (PR a main)"]
    T1 --> J4["4. Snyk Code SAST + Snyk SCA (PR a main)"]
    T1 --> J5["5. GitHub Advanced Security (Dependency Review + Secret Scan + CodeQL)"]
    J2 --> G{"¿Todos los gates en verde?"}
    J3 --> G
    J4 --> G
    J5 --> G
    G -- "Sí" --> J6["6. Publicación en Docker Hub"]
    G -- "No (fallo crítico / calidad)" --> STOP["Despliegue Interrumpido"]
```

### Matriz de Disparadores y Gates

| Job / Control | `push` a `develop` | `pull_request` a `main` | Interrumpe despliegue si falla |
| :--- | :---: | :---: | :---: |
| 1. Docker Build + Pruebas Unitarias en Contenedor | Sí | Sí | Sí |
| 2. Docker Scout (CVEs críticas) | Sí | Sí | Sí (`exit-code: true`) |
| 3. SonarCloud (SAST + Quality Gate) | — | Sí | Sí (`sonar.qualitygate.wait=true`) |
| 4. Snyk (Snyk Code SAST + Dependencias críticas) | — | Sí | Sí (`--severity-threshold`) |
| 5a. GHAS — Dependency Review | — | Sí | Sí (`fail-on-severity: critical`) |
| 5b. GHAS — Escaneo de Secretos (Gitleaks + GHAS) | Sí | Sí | Sí |
| 5c. GHAS — CodeQL SAST (`javascript-typescript`) | Sí | Sí | Sí |
| 6. Publicación en Docker Hub | Solo si 1, 2 y 5 pasan | Solo si 1, 2, 3, 4 y 5 pasan | N/A |

---

## 3. Parte 1: Automatización con GitHub Actions y Docker

### 3.1 Dockerización Multi-Stage ([`Dockerfile`](Dockerfile) y [`.dockerignore`](.dockerignore))
Se diseñó un `Dockerfile` multi-stage con dos etapas diferenciadas:
- **Etapa `test` (`node:20.20.0-alpine`)**: actualiza paquetes de sistema (`apk upgrade --no-cache`), instala dependencias bloqueadas (`npm ci --ignore-scripts`) y ejecuta la suite completa de pruebas unitarias y cobertura con Jest **dentro del contenedor**.
- **Etapa `production` (`node:22-alpine`)**: actualiza paquetes del sistema operativo, instala únicamente dependencias de producción (`npm ci --omit=dev --ignore-scripts`), limpia caché y elimina los gestores de paquetes (`npm`, `corepack`, `yarn`) del entorno de ejecución final, copiando el código con propietario no privilegiado y ejecutando bajo **`USER node`** (cumpliendo buenas prácticas de contenedorización y eliminando la alerta `docker:S6471`).

### 3.2 Pruebas Unitarias y Cobertura Ejecutadas dentro del Contenedor
La ejecución dentro del contenedor Docker genera el reporte `coverage/lcov.info`, el cual se comparte como artefacto al job de SonarCloud:
- **Suites ejecutadas:** 12 de 12 aprobadas (**100%**)
- **Pruebas unitarias:** 24 de 24 aprobadas (**100%**)
- **Cobertura global alcanzada (Jest):**
  - Sentencias (`% Stmts`): **70.96%** (mejora desde 39.72% en EP2)
  - Ramas (`% Branch`): **83.33%** (mejora desde 60.00% en EP2)
  - Funciones (`% Funcs`): **76.92%** (mejora desde 53.12% en EP2)
  - Líneas (`% Lines`): **70.96%** (mejora desde 39.72% en EP2)

### 3.3 Publicación Automatizada en Docker Hub
El job `deploy-dockerhub` carga exactamente la misma imagen verificada por Docker Scout y la publica en `fflefil/auy1102-pipeline` únicamente cuando todos los controles previos finalizan en estado `success`:
- En `push` a `develop`: publica `develop` y `sha-<commit>`.
- En `pull_request` a `main`: publica `pr-<num>`, `sha-<commit>` y `latest`.

---

## 4. Parte 2: Análisis de Código, Seguridad y Bloqueo de Despliegue

### 4.1 SonarCloud ([`sonar-project.properties`](sonar-project.properties))
- Integrado con `SonarSource/sonarqube-scan-action@v6` en cada Pull Request hacia `main`, consumiendo el reporte `lcov.info` generado dentro del contenedor Docker.
- Configurado con `-Dsonar.qualitygate.wait=true` para bloquear el pipeline si el Quality Gate falla.
- **Resultados verificados en PR #7:**
  - **Quality Gate:** `OK` (Aprobado)
  - **Cobertura en código nuevo:** `100.0%` (umbral mínimo: `80%`)
  - **Nuevos Bugs / Vulnerabilidades / Code Smells:** `0` / `0` / `0`
  - **Duplicación en código nuevo:** `0.0%`
  - **Calificaciones (Reliability / Security / Maintainability):** `A` / `A` / `A`

### 4.2 Snyk (Análisis Estático y de Dependencias)
- Integrado mediante `snyk/actions/setup@master` en cada Pull Request hacia `main`:
  - **Snyk Code (SAST):** `snyk code test --org=frflefil --severity-threshold=high --sarif-file-output=snyk-code.sarif`
  - **Snyk Open Source (SCA):** `snyk test --org=frflefil --severity-threshold=critical --sarif-file-output=snyk-deps.sarif`
- Los resultados SARIF se suben automáticamente a la pestaña **Security → Code scanning** de GitHub.

### 4.3 GitHub Advanced Security ([`ghas-security.yml`](.github/workflows/ghas-security.yml) y [`.github/dependabot.yml`](.github/dependabot.yml))
- **Análisis de dependencias:** `actions/dependency-review-action@v4` en Pull Requests a `main` con `fail-on-severity: critical`, complementado con Dependabot configurado para ecosistemas `npm`, `docker` y `github-actions`.
- **Escaneo de secretos:** GitHub Secret Scanning y Push Protection habilitados en el repositorio público, reforzados en CI por **Gitleaks** (`gitleaks detect --no-git --source=. --redact`) con exclusión justificada en [`.gitleaksignore`](.gitleaksignore) únicamente para el identificador público `sonar.projectKey`.
- **Análisis estático CodeQL:** `github/codeql-action/init@v4` y `analyze@v4` para `javascript-typescript`.

### 4.4 Docker Scout
- Integrado con `docker/scout-action@v1` (`command: cves`, `only-severities: critical`, `exit-code: true`, `sarif-file: docker-scout.sarif`).
- **Resultado final sobre la imagen de producción endurecida (`node:22-alpine`):**
  - **Vulnerabilidades detectadas:** `0 Críticas`, `0 Altas`, `0 Medias`, `0 Bajas` (`No vulnerable packages detected`).
  - Reporte SARIF integrado en GitHub Code Scanning.

---

## 5. Evidencia Real de Interrupción del Despliegue y Remediaciones

Durante las pruebas en vivo en GitHub Actions, el pipeline demostró su capacidad de **interrumpir automáticamente el despliegue** ante hallazgos reales:

| Herramienta | Hallazgo que interrumpió el despliegue | Remediación aplicada | Resultado posterior |
| :--- | :--- | :--- | :--- |
| **Docker Scout** | `CVE-2026-59873` (CVSS 9.2 — **CRÍTICA**) en `pkg:npm/tar@6.2.1` dentro de la imagen base `node:20.20.0-alpine` (Run `#45207831991`). | Migración del stage `production` a `node:22-alpine`, actualización con `apk upgrade --no-cache`, eliminación de `npm`/`corepack`/`yarn` en runtime y ejecución con `USER node` (commit `a63f0dd`). | **0C / 0H / 0M / 0L** — Despliegue aprobado ✅ |
| **Snyk Code (SAST)** | Vulnerabilidad **HIGH** de Cross-Site Scripting (XSS) en `src/quality/insecure-1-object.ts` línea 24 (Run `#45208709318`). | Refactorización de `src/quality/insecure-1-object.ts` con sanitización estricta de entrada y escape HTML + suite de pruebas unitarias `test/quality/insecure-1-object.test.ts` (commit `e82c5f4`). | **0 issues HIGH/CRITICAL** — Snyk aprobado ✅ |
| **SonarCloud / Secret Scanning** | Credencial hardcodeada en `.npmrc` (`secrets:S6689`), secretos en `src/index.ts` y patrones inseguros (SQLi, XSS, contraseñas en texto plano) en `src/quality/insecure-2-object.ts`. | Sustitución por variables de entorno (`${NODE_AUTH_TOKEN}`), limpieza de `src/index.ts`, remediación segura en `src/quality/insecure-2-object.ts` y pruebas unitarias `test/quality/insecure-2-object.test.ts` (commit `92b90d7`). | **Quality Gate OK (100% cobertura en código nuevo)** ✅ |

### Ejecuciones Verificadas en Verde
- **Pull Request #7 (`develop` → `main`):** [Run #45210240824](https://github.com/caro-flefil-grupo9/AUY1102-EA2/actions/runs/45210240824) — Todos los jobs (Docker Build + Tests, Docker Scout, SonarCloud, Snyk, GHAS Dependency Review, GHAS Secret Scanning, GHAS CodeQL y Deploy Docker Hub) en estado `success`.
- **Push a `develop`:** [Run #45210229303](https://github.com/caro-flefil-grupo9/AUY1102-EA2/actions/runs/45210229303) — Todos los jobs aplicables en estado `success` con publicación en Docker Hub.

---

## 6. Integridad del Código y Consideraciones Éticas

- **Gestión segura de credenciales:** todas las claves (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `SONAR_TOKEN`, `SNYK_TOKEN`) se almacenan exclusivamente como **GitHub Actions Repository Secrets** encriptados; ninguna credencial existe en el código fuente ni en los archivos de workflow.
- **Trazabilidad e integridad:** cada cambio fue validado mediante commits descriptivos, ramas separadas (`develop` y `main`), conservación intacta de `master` (EP2) y controles automatizados no evadibles antes de la publicación.
- **Mínimo privilegio:** los workflows declaran `permissions` explícitos por job (`contents: read`, `security-events: write`, `pull-requests: read`) y la imagen Docker final corre bajo usuario sin privilegios (`USER node`).

---

## 7. Cumplimiento de la Rúbrica

| Indicador | Peso | Evidencia en el repositorio |
| :--- | :---: | :--- |
| **IL4.1 / IE4.1.1:** Reconoce componentes de CI/CD, manteniendo la integridad del código y respetando consideraciones éticas, para automatizar procesos y reducir la intervención manual. | 33% | Separación de ramas (`develop`/`main`), uso exclusivo de *Repository Secrets*, eliminación de secretos hardcodeados (`.npmrc`, `src/index.ts`, `src/quality/insecure-2-object.ts`), mínimo privilegio en workflows y contenedores (`USER node`). |
| **IL4.2 / IE4.2.1:** Diseña pipelines de CI/CD, garantizando la calidad y la entrega continua del producto, para automatizar la compilación, prueba y despliegue de software en un contexto de desarrollo ágil. | 33% | Diseño modular con `Dockerfile` multi-stage, `.dockerignore`, `sonar-project.properties`, workflow principal (`ci-cd-ep3.yml`) y workflow reutilizable de seguridad (`ghas-security.yml`) con disparadores en `push` a `develop` y `pull_request` a `main`, y compuerta estricta antes de `deploy-dockerhub`. |
| **IL4.3 / IE4.3.1:** Implementa pipelines de CI/CD, para automatizar la compilación, prueba y despliegue de software en un contexto de desarrollo ágil, garantizando la calidad y la entrega continua del producto. | 34% | Ejecución real y verificada en verde en GitHub Actions (PR #7 y `develop`), pruebas ejecutadas dentro del contenedor Docker (24/24 aprobadas), SonarCloud Quality Gate OK (100% cobertura en código nuevo), Snyk Code + SCA OK, GHAS OK, Docker Scout 0 CVEs críticas e imagen publicada en Docker Hub (`fflefil/auy1102-pipeline`). |
