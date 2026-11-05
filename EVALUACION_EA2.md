# Evaluación Parcial 2 — AUY1102
## Ciclo de Vida del Software I

---

## 1. Antecedentes
- **Institución:** Duoc UC
- **Asignatura:** Ciclo de Vida del Software I (AUY1102)
- **Integrantes:** 
  - Francisco Flefil
  - Javier Caro
- **Organización en GitHub:** [caro-flefil-grupo9](https://github.com/caro-flefil-grupo9)
- **Repositorio oficial:** [https://github.com/caro-flefil-grupo9/AUY1102-EA2](https://github.com/caro-flefil-grupo9/AUY1102-EA2)
- **Distribución de roles:**
  - **Francisco Flefil (Rama `ea2-pruebas-sonar`):** Pruebas unitarias, análisis de cobertura, análisis de código estático en SonarCloud, remediación de hallazgos y análisis de vulnerabilidades con `npm audit`.
  - **Javier Caro (Rama `ea2-snyk-seguridad`):** Análisis de dependencias y código en Snyk, remediación coordinada y configuración de GitHub Advanced Security (Dependabot, CodeQL y Secret Scanning).

### Evidencia del Repositorio
![Repositorio en GitHub](evidencias/01-repositorio.png)
*Figura 1.1: Repositorio forkeado oficial en GitHub bajo la organización caro-flefil-grupo9.*

---

## 2. Pruebas unitarias y cobertura

### Procedimiento y Comandos Ejecutados
Para validar la suite de pruebas unitarias provista en el proyecto TypeScript con Jest, se utilizaron los siguientes comandos en el entorno local:
```bash
# Ejecución exclusiva de pruebas unitarias
npm run test:unit

# Ejecución de análisis de cobertura de código
npm run test:coverage

# Script único configurado para la evaluación
npm run test:evaluacion
```

### Resultados Obtenidos
- **Suites de Pruebas:** 10 suites ejecutadas, **10 pasadas exitosamente (100%)**, 0 fallidas.
- **Pruebas Unitarias:** 18 pruebas individuales ejecutadas, **18 pasadas exitosamente**, 0 errores.
- **Métricas de Cobertura Global (Jest):**
  - **Sentencias (% Stmts):** 39.72% (29/73)
  - **Ramas (% Branch):** 60.00% (6/10)
  - **Funciones (% Funcs):** 53.12% (17/32)
  - **Líneas (% Lines):** 39.72% (29/73)

### Detalle de Código No Cubierto
El análisis de Jest reveló que los siguientes componentes no cuentan con pruebas unitarias o su cobertura es parcial:
1. `src/quality/errores-object.ts`: **0.00% de cobertura** (líneas 2-6 sin pruebas asociadas).
2. `src/quality/insecure-1-object.ts`: **0.00% de cobertura** (líneas 1-28 sin pruebas).
3. `src/quality/insecure-2-object.ts`: **0.00% de cobertura** (líneas 1-32 sin pruebas).
4. `src/value-object/primitives/date-value-object.ts`: **6.66% de cobertura** (líneas 3-35 descubiertas).
5. `src/value-object/primitives/enum-value-object.ts`: **83.33% de cobertura** (línea 11 sin cubrir).
6. `src/index.ts`: **62.50% de cobertura** (líneas 8-10 descubiertas).

### Evidencias
![Pruebas Unitarias](evidencias/02-pruebas-unitarias.png)
*Figura 2.1: Ejecución exitosa de las 18 pruebas unitarias sin fallos en terminal.*

![Cobertura Jest](evidencias/03-cobertura.png)
*Figura 2.2: Tabla de porcentaje de cobertura emitida por Jest detallando archivos y líneas sin cubrir.*

---

## 3. SonarCloud: Análisis y Remediación

### Integración y Análisis Inicial
El repositorio fue vinculado con la organización `caro-flefil-grupo9` en SonarCloud. La plataforma ejecutó el análisis estático identificando vulnerabilidades críticas en el código y en la configuración del proyecto.

### Hallazgos Detectados
Entre los hallazgos principales reportados por SonarCloud destacan:
1. **Fuga de Credenciales (Regla `secrets:S6689` - Blocker Vulnerability):**
   - **Archivo:** `credentials.yml` (Línea 1).
   - **Descripción:** Presencia de un Token de Acceso Personal (PAT) de GitHub hardcodeado en texto plano dentro del repositorio (`token: github_pat_...`).
2. **Server-Side Template Injection (Regla `tssecurity:S5496` / `typescript:S7790` - Blocker Vulnerability):**
   - **Archivo:** `src/quality/insecure-1-object.ts` (Línea 21).
   - **Descripción:** Concatenación directa de entrada de usuario (`req.body.username`) dentro de una plantilla Pug sin sanitizar ni parametrizar.
3. **Inconsistencia de Tipos en TypeScript:**
   - **Archivo:** `src/quality/errores-object.ts` (Línea 6).
   - **Descripción:** Asignación de un valor numérico (`10`) a una variable fuertemente tipada como `string`.

### Remediación Aplicada
Se realizaron las siguientes correcciones en la rama `ea2-pruebas-sonar`:
- **`credentials.yml`:** Se eliminó el token sensible hardcodeado y se reemplazó por la referencia a variable de entorno `${GITHUB_TOKEN}`, mitigando el riesgo de compromiso de credenciales.
- **`src/quality/insecure-1-object.ts`:** Se refactorizó la compilación de Pug a una plantilla estática parametrizada, pasando el valor del usuario como variable de contexto en `compiledTemplate({ username: input })`.
- **`src/quality/errores-object.ts`:** Se corrigió la asignación a `const message: string = '10';` y se agregaron las exportaciones correspondientes.

Tras la remediación, se ejecutaron nuevamente las pruebas unitarias y de cobertura confirmando su correcto funcionamiento, y se abrió el **Pull Request #1** hacia la rama `master`.

### Evidencias
![Panel Inicial SonarCloud](evidencias/04-sonarcloud-inicial.png)
*Figura 3.1: Panel inicial de métricas y vulnerabilidades en SonarCloud.*

![Detalle de Hallazgo SonarCloud](evidencias/05-sonarcloud-hallazgo.png)
*Figura 3.2: Detalle de la vulnerabilidad detectada en SonarCloud (fuga de credenciales o SSTI).*

![Remediación SonarCloud](evidencias/06-sonarcloud-remediacion.png)
*Figura 3.3: Verificación de la remediación y cierre del hallazgo en SonarCloud.*

---

## 4. Snyk: Análisis de Dependencias y Código

### Integración y Escaneo
El proyecto fue importado en la consola web de Snyk bajo la organización `caro-flefil-grupo9`. Snyk realizó un análisis de Software Composition Analysis (SCA) sobre `package.json` y `package-lock.json`, además de análisis estático del código (Snyk Code).

### Hallazgos Principales
- Detección de vulnerabilidades en dependencias heredadas de desarrollo y producción.
- Identificación de problemas de severidad alta en paquetes clave como `chokidar` (versión 2.0.3 desactualizada con riesgos de ReDoS y Path Traversal) y herramientas de Babel.

### Evidencias
![Panel de Snyk](evidencias/08-snyk-inicial.png)
*Figura 4.1: Reporte del escáner de Snyk detallando dependencias y severidades encontradas.*

*(Opcional: Capturas de remediación de dependencias `09-snyk-hallazgo.png` y `10-snyk-remediacion.png`).*

---

## 5. npm audit

### Procedimiento
Se ejecutó el comando de auditoría nativo de npm dentro del entorno local:
```bash
npm audit
```

### Resultados
- **Total de vulnerabilidades:** 82 problemas de seguridad detectados.
  - **Baja (Low):** 11
  - **Moderada (Moderate):** 20
  - **Alta (High):** 49
  - **Crítica (Critical):** 2
- **Paquetes más comprometidos:**
  - `tar` y `cacache` (Path Traversal y vulnerabilidades en extracción).
  - `chokidar` (versión 2.0.3 en desuso con avisos de fin de ciclo de soporte).
  - `@babel/core` y `@faker-js/faker` (ejecución de código arbitrario y ReDoS).
- **Acciones recomendadas:** Ejecución controlada de `npm audit fix` para remediaciones sin cambios disruptivos, y evaluación de actualización de librerías principales (`--force`).

### Evidencias
![Reporte npm audit](evidencias/07-npm-audit.png)
*Figura 5.1: Salida de npm audit en consola resumiendo las 82 vulnerabilidades por nivel de severidad.*

---

## 6. GitHub Advanced Security

### Configuración en el Repositorio
Se accedió a la configuración de seguridad (`Settings > Code security and analysis`) de `AUY1102-EA2` habilitando las herramientas de análisis continuo:
1. **Dependabot Alerts y Version Updates:** Monitorización activa de versiones obsoletas en `package.json`.
2. **Secret Scanning:** Detección automática de tokens, llaves API y contraseñas expuestas en commits.
3. **Code Scanning (CodeQL):** Análisis semántico del código TypeScript para identificar patrones de fallo y debilidades CWE/OWASP.

### Evidencias
![Configuración Dependabot](evidencias/11-dependabot-configuracion.png)
*Figura 6.1: Configuración activa de Dependabot en GitHub.*

![Alertas Dependabot](evidencias/12-dependabot-alertas.png)
*Figura 6.2: Alertas automáticas generadas por Dependabot.*

![CodeQL Code Scanning](evidencias/13-code-scanning.png)
*Figura 6.3: Escaneo de código estático mediante CodeQL en GitHub Actions.*

![Secret Scanning](evidencias/14-secret-scanning.png)
*Figura 6.4: Alerta generada por Secret Scanning detectando el token en credentials.yml.*

---

## 7. Conclusiones

1. **Aseguramiento Temprano de la Calidad:** Las pruebas unitarias permitieron validar que la lógica central de los Value Objects opera de manera confiable (18/18 pruebas superadas). Sin embargo, el análisis de cobertura evidenció que módulos críticos como `src/quality/` carecían totalmente de pruebas (0%), lo cual incrementa el riesgo de deuda técnica y fallos desapercibidos.
2. **Detección Estática vs Dependencias:** La integración combinada de SonarCloud y Snyk demostró ser complementaria: mientras SonarCloud detectó malas prácticas de desarrollo y fugas de secretos (`credentials.yml`), Snyk y `npm audit` visibilizaron la vulnerabilidad de la cadena de suministro por dependencias externas desactualizadas (82 alertas).
3. **Automatización en el Ciclo de Vida:** La incorporación de GitHub Advanced Security y la remediación directa en ramas protegidas mediante Pull Requests facilitan un ciclo de entrega continua (DevSecOps) seguro, resolviendo incidentes antes de su despliegue a producción.

---

## 8. Enlaces de Entrega

- **Repositorio oficial de código:** [https://github.com/caro-flefil-grupo9/AUY1102-EA2](https://github.com/caro-flefil-grupo9/AUY1102-EA2)
- **Pull Request de Pruebas y Remediación:** [https://github.com/caro-flefil-grupo9/AUY1102-EA2/pull/1](https://github.com/caro-flefil-grupo9/AUY1102-EA2/pull/1)
- **Documento Markdown entregable:** [https://github.com/caro-flefil-grupo9/AUY1102-EA2/blob/master/EVALUACION_EA2.md](https://github.com/caro-flefil-grupo9/AUY1102-EA2/blob/master/EVALUACION_EA2.md)

