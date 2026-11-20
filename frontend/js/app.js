// js/app.js - Controlador Principal de la Plataforma de Métodos Numéricos
// Los cálculos los realiza el backend FastAPI (js/api.js). Aquí se construyen formularios,
// se muestran resultados y se ofrece el recorrido iteración por iteración.

// Formas de resolución reutilizables (las dos formas usadas en los talleres)
const MODES_ITER = [
    { id: 'tol', name: 'Por tolerancia', code: 'while ea > tol:', icon: 'fa-bullseye' },
    { id: 'iter', name: 'Por iteraciones', code: 'for i in range(N):', icon: 'fa-list-ol' }
];
const MODES_INTEGRATION = [
    { id: 'n', name: 'n fijo', code: 'regla(f, a, b, n)', icon: 'fa-hashtag' },
    { id: 'tol', name: 'Por tolerancia', code: 'while error > tol: n += k', icon: 'fa-bullseye' }
];

const App = {
    currentMethod: 'bisection',
    decimalPrecision: 6,
    stepper: null,
    ctx: {},

    methodsConfig: {
        // --- CATEGORÍA A: ECUACIONES NO LINEALES ---
        bisection: {
            id: 'bisection',
            name: 'Bisección',
            category: 'Categoría A: Ecuaciones no lineales',
            badge: 'Intervalo / Cerrado',
            description: 'Divide sucesivamente el intervalo [a, b] por la mitad y conserva el subintervalo donde f(x) cambia de signo según el Teorema de Bolzano.',
            formulaPill: 'x_r = (a + b) / 2',
            modes: MODES_ITER,
            about: {
                queHace: 'Localiza una raíz real de f(x) mediante división sucesiva del intervalo.',
                entradas: 'Función continua f(x), límites a y b tal que f(a)·f(b) < 0, tolerancia o número de iteraciones.',
                condiciones: 'Requiere que f(x) sea continua en [a, b] y f(a)·f(b) < 0 (signos opuestos).',
                parada: 'Por tolerancia: ea < tol (o |f(xr)| = 0). Por iteraciones: se ejecutan exactamente N iteraciones.',
                interpretacion: 'Garantiza convergencia segura a una raíz, aunque su ritmo de convergencia es lineal y relativamente lento.',
                limitaciones: 'No detecta raíces de multiplicidad par donde la función no cruza el eje (como x² = 0).',
                formas: 'Por tolerancia (while ea > tol, como en el Taller 1) o por número fijo de iteraciones (for i in range(10), como en clase).'
            },
            defaults: { solveMode: 'tol', fn: 'x^3 - x - 2', a: 1, b: 2, tol: 0.0001, maxIter: 50, nIter: 10 },
            presets: [
                { label: 'Caso Prueba A (x³ - x - 2)', solveMode: 'tol', fn: 'x^3 - x - 2', a: 1, b: 2, tol: 0.0001 },
                { label: 'Taller 1: canal (Q = 20), tol 1 %', solveMode: 'tol', fn: '1 - (20^2*(3 + x))/(9.81*(3*x + x^2/2)^3)', a: 0.5, b: 2.5, tol: 1 },
                { label: 'Taller 1: tanque esférico (V = 30)', solveMode: 'tol', fn: 'pi*x^2*(9 - x)/3 - 30', a: 0.5, b: 2.5, tol: 0.0005 },
                { label: 'Taller 1: viga M(x) = 0 en [6, 10]', solveMode: 'tol', fn: '265*x - 150*(x - 2) - 300*(x - 4.5)', a: 6, b: 10, tol: 0.0005 },
                { label: 'Clase: x − cos(x), 10 iteraciones', solveMode: 'iter', fn: 'x - cos(x)', a: -4, b: 3, nIter: 10 },
                { label: 'Exponencial (e^-x - x)', solveMode: 'tol', fn: 'exp(-x) - x', a: 0, b: 1, tol: 0.0001 }
            ]
        },

        falsePosition: {
            id: 'falsePosition',
            name: 'Falsa Posición',
            category: 'Categoría A: Ecuaciones no lineales',
            badge: 'Interpolación / Cerrado',
            description: 'Conecta (a, f(a)) y (b, f(b)) mediante una recta secante y toma la intersección con el eje horizontal como aproximación de la raíz.',
            formulaPill: 'x_r = b - f(b)(a - b) / (f(a) - f(b))',
            modes: MODES_ITER,
            about: {
                queHace: 'Acelera la localización de raíces ponderando las magnitudes de f(a) y f(b).',
                entradas: 'Función f(x), límites a y b con f(a)·f(b) < 0, tolerancia o número de iteraciones.',
                condiciones: 'Continuidad de f(x) en [a, b] y cambio de signo en los extremos.',
                parada: 'Por tolerancia: ea < tol. Por iteraciones: exactamente N iteraciones.',
                interpretacion: 'Suele converger más rápido que bisección, pero un extremo puede estancarse si la curva tiene fuerte convexidad.',
                limitaciones: 'El estancamiento de un extremo puede ralentizar la tasa efectiva de convergencia.',
                formas: 'Por tolerancia (while, Taller 1) o por número fijo de iteraciones (for).'
            },
            defaults: { solveMode: 'tol', fn: 'x^3 - x - 2', a: 1, b: 2, tol: 0.0001, maxIter: 50, nIter: 10 },
            presets: [
                { label: 'Caso Prueba A (x³ - x - 2)', solveMode: 'tol', fn: 'x^3 - x - 2', a: 1, b: 2, tol: 0.0001 },
                { label: 'Taller 1: canal (Q = 20), tol 1 %', solveMode: 'tol', fn: '1 - (20^2*(3 + x))/(9.81*(3*x + x^2/2)^3)', a: 0.5, b: 2.5, tol: 1 },
                { label: 'Taller 1: tanque esférico (V = 30)', solveMode: 'tol', fn: 'pi*x^2*(9 - x)/3 - 30', a: 0.5, b: 2.5, tol: 0.0005 },
                { label: 'Taller 1: viga M(x) = 0 en [6, 10]', solveMode: 'tol', fn: '265*x - 150*(x - 2) - 300*(x - 4.5)', a: 6, b: 10, tol: 0.0005 },
                { label: 'x − cos(x), 10 iteraciones', solveMode: 'iter', fn: 'x - cos(x)', a: -4, b: 3, nIter: 10 },
                { label: 'Polinomio Chapra', solveMode: 'tol', fn: 'x^3 - 2*x - 5', a: 2, b: 3, tol: 0.0001 }
            ]
        },

        secant: {
            id: 'secant',
            name: 'Secante',
            category: 'Categoría A: Ecuaciones no lineales',
            badge: 'Abierto / 2 Puntos',
            description: 'Método abierto similar a Newton-Raphson que aproxima la pendiente de la tangente mediante la recta secante entre dos estimaciones previas.',
            formulaPill: 'x_{n+1} = x_n - f(x_n)(x_{n-1} - x_n) / [f(x_{n-1}) - f(x_n)]',
            modes: MODES_ITER,
            about: {
                queHace: 'Halla raíces sin necesidad de evaluar analíticamente la derivada f\'(x).',
                entradas: 'Función f(x), dos valores iniciales x_{n-1} y x_n, tolerancia o número de iteraciones.',
                condiciones: 'Los valores iniciales deben estar razonablemente cerca de la raíz y f(x0) != f(x1).',
                parada: 'Por tolerancia: ea < tol. Por iteraciones: exactamente N iteraciones (o hasta f(x) = 0 exacto).',
                interpretacion: 'Orden de convergencia superlineal (~1.618), más veloz que bisección y sin calcular derivadas.',
                limitaciones: 'Al ser un método abierto, no garantiza convergencia si los puntos iniciales están lejos de la raíz o si el denominador se anula.',
                formas: 'Clase: for i in range(10) con x_ant = 3.5, x_act = 3, y la versión while error > tolerancia.'
            },
            defaults: { solveMode: 'tol', fn: 'x^3 - x - 2', x0: 1, x1: 2, tol: 0.0001, maxIter: 50, nIter: 10 },
            presets: [
                { label: 'Caso Prueba A (x³ - x - 2)', solveMode: 'tol', fn: 'x^3 - x - 2', x0: 1, x1: 2, tol: 0.0001 },
                { label: 'Clase: x − cos(x), 10 iteraciones', solveMode: 'iter', fn: 'x - cos(x)', x0: 3.5, x1: 3, nIter: 10 },
                { label: 'Clase: x − cos(x), tol 0.0005 %', solveMode: 'tol', fn: 'x - cos(x)', x0: 3.5, x1: 3, tol: 0.0005 },
                { label: 'Gaussiana (e^(-x²) - x)', solveMode: 'tol', fn: 'exp(-x^2) - x', x0: 0, x1: 1, tol: 0.0001 },
                { label: 'Logarítmica (ln(x) + x² - 3)', solveMode: 'tol', fn: 'log(x) + x^2 - 3', x0: 1, x1: 2, tol: 0.0001 }
            ]
        },

        newtonRaphson: {
            id: 'newtonRaphson',
            name: 'Newton-Raphson',
            category: 'Categoría A: Ecuaciones no lineales',
            badge: 'Abierto / Cuadrático',
            description: 'Utiliza la pendiente de la recta tangente evaluando la primera derivada f\'(x) en cada estimación.',
            formulaPill: "x_{n+1} = x_n - f(x_n) / f'(x_n)",
            modes: MODES_ITER,
            about: {
                queHace: 'Aproxima rápidamente raíces mediante extrapolación tangencial.',
                entradas: 'Función f(x), punto inicial x0, derivada f\'(x) (analítica o simbólica automática), tolerancia o número de iteraciones.',
                condiciones: 'Derivada f\'(x0) != 0 y función diferenciable cerca de la raíz.',
                parada: 'Por tolerancia: ea < tol. Por iteraciones: exactamente N iteraciones.',
                interpretacion: 'Convergencia cuadrática cerca de la raíz (el número de cifras correctas se duplica en cada iteración).',
                limitaciones: 'Puede diverger o ciclar si x0 está cerca de un punto de inflexión o donde f\'(x) ≈ 0.',
                formas: 'Taller 1 (tanque esférico): for i in range(3). Clase: while error > tolerancia.'
            },
            defaults: { solveMode: 'tol', fn: 'x^3 - x - 2', dfn: '3*x^2 - 1', x0: 2, tol: 0.0001, maxIter: 50, nIter: 3 },
            presets: [
                { label: 'Caso Prueba A (x³ - x - 2)', solveMode: 'tol', fn: 'x^3 - x - 2', dfn: '3*x^2 - 1', x0: 2, tol: 0.0001 },
                { label: 'Taller 1: tanque esférico, 3 iteraciones', solveMode: 'iter', fn: 'pi*x^2*(9 - x)/3 - 30', dfn: 'pi*x*(6 - x)', x0: 3, nIter: 3 },
                { label: 'Clase: x − cos(x) desde x₀ = 3', solveMode: 'tol', fn: 'x - cos(x)', dfn: '1 + sin(x)', x0: 3, tol: 0.0005 },
                { label: 'Derivada automática: x·e^x − 2', solveMode: 'tol', fn: 'x*exp(x) - 2', dfn: '', x0: 1, tol: 0.0001 },
                { label: 'Raíz de 7 (x² - 7)', solveMode: 'tol', fn: 'x^2 - 7', dfn: '2*x', x0: 3, tol: 0.0001 }
            ]
        },

        // --- CATEGORÍA B: INTEGRACIÓN NUMÉRICA ---
        trapezoidal: {
            id: 'trapezoidal',
            name: 'Regla del Trapecio',
            category: 'Categoría B: Integración numérica',
            badge: 'Polinomial / Grado 1',
            description: 'Aproxima el área bajo la curva f(x) mediante trapecios conectando los nodos con segmentos lineales.',
            formulaPill: 'I ≈ h·[(f(a) + f(b))/2 + Σ f(xi)]',
            modes: MODES_INTEGRATION,
            about: {
                queHace: 'Calcula la integral definida ∫ f(x) dx sumando las áreas de n trapecios.',
                entradas: 'Función continua f(x), límites a y b, número de subintervalos n o tolerancia de error.',
                condiciones: 'f(x) integrable en [a, b]. Límite superior b > a.',
                parada: 'n fijo: cálculo directo. Por tolerancia: n = 1, 2, 3, … hasta que el error < tol.',
                interpretacion: 'Aproximación de primer orden; el error global disminuye con O(h²).',
                limitaciones: 'Requiere más subintervalos para curvas con fuerte curvatura.',
                formas: 'Taller 1 (paracaidista): while True: calcular, si error < 0.00005 % parar, si no n += 1.'
            },
            defaults: { solveMode: 'n', fn: 'x^2', a: 0, b: 1, n: 6, exactVal: 0.3333333333, tol: 0.01, maxIter: 2000 },
            presets: [
                { label: 'Caso Prueba B (x² en [0,1])', solveMode: 'n', fn: 'x^2', a: 0, b: 1, n: 6, exactVal: 0.3333333333 },
                { label: 'Taller 1: paracaidista (n automático)', solveMode: 'tol', fn: 'sqrt(9.8*68.1/0.25)*tanh(sqrt(9.8*0.25/68.1)*x)', a: 0, b: 10, exactVal: 333.92622119267946, tol: 0.00005, maxIter: 2000 },
                { label: 'Taller 1: viga V(x) en [0, 5.5] (n automático)', solveMode: 'tol', fn: '5 + 0.25*x^2', a: 0, b: 5.5, exactVal: 41.36458333333333, tol: 0.00005, maxIter: 2000 },
                { label: 'Polinomio Chapra', solveMode: 'n', fn: '0.2 + 25*x - 200*x^2 + 675*x^3 - 900*x^4 + 400*x^5', a: 0, b: 0.8, n: 8, exactVal: 1.640533 },
                { label: 'Seno [0, π]', solveMode: 'n', fn: 'sin(x)', a: 0, b: 3.14159265, n: 10, exactVal: 2 }
            ]
        },

        simpson13: {
            id: 'simpson13',
            name: 'Simpson 1/3',
            category: 'Categoría B: Integración numérica',
            badge: 'Newton-Cotes 2º Orden (n Par)',
            description: 'Ajusta parábolas de segundo orden sobre grupos de tres puntos consecutivos. Requiere número PAR de subintervalos.',
            formulaPill: 'I ≈ (h/3)·[f(x0) + 4·Σimpar + 2·Σpar + f(xn)]',
            modes: MODES_INTEGRATION,
            warningNotice: 'El enunciado del curso indica Simpson 1/8. Verifica la fórmula exacta utilizada por el profesor para implementar esta variante correctamente.',
            about: {
                queHace: 'Aproxima la integral evaluando polinomios cuadráticos por parejas de subintervalos.',
                entradas: 'Función f(x), límites a y b, número de subintervalos n (PAR) o tolerancia de error.',
                condiciones: 'n debe ser entero par (n = 2, 4, 6, 8...).',
                parada: 'n fijo: evaluación directa. Por tolerancia: n = 2, 4, 6, … hasta que el error < tol.',
                interpretacion: 'Orden de error O(h⁴); exacto para polinomios de hasta grado 3.',
                limitaciones: 'Inaplicable si n es impar.',
                formas: 'Taller 1: n_simpson13 = 2 y n += 2 hasta cumplir la tolerancia; o n fijo.'
            },
            defaults: { solveMode: 'n', fn: 'x^2', a: 0, b: 1, n: 4, exactVal: 0.3333333333, tol: 0.0001, maxIter: 2000 },
            presets: [
                { label: 'Caso Prueba B (x² en [0,1])', solveMode: 'n', fn: 'x^2', a: 0, b: 1, n: 4, exactVal: 0.3333333333 },
                { label: 'Taller 1: paracaidista (n automático)', solveMode: 'tol', fn: 'sqrt(9.8*68.1/0.25)*tanh(sqrt(9.8*0.25/68.1)*x)', a: 0, b: 10, exactVal: 333.92622119267946, tol: 0.00005, maxIter: 2000 },
                { label: 'Taller 1: viga V(x) en [5.5, 11]', solveMode: 'n', fn: '5 + 0.25*x^2', a: 5.5, b: 11, n: 2, exactVal: 124.55208333333333 },
                { label: 'Chapra n=4', solveMode: 'n', fn: '0.2 + 25*x - 200*x^2 + 675*x^3 - 900*x^4 + 400*x^5', a: 0, b: 0.8, n: 4, exactVal: 1.640533 },
                { label: 'Gaussiana sin valor exacto (tol)', solveMode: 'tol', fn: 'exp(-x^2)', a: 0, b: 1, exactVal: '', tol: 0.000001, maxIter: 2000 }
            ]
        },

        simpson38: {
            id: 'simpson38',
            name: 'Simpson 3/8',
            category: 'Categoría B: Integración numérica',
            badge: 'Newton-Cotes 3º Orden (n Múltiplo de 3)',
            description: 'Ajusta polinomios cúbicos de tercer orden sobre grupos de cuatro puntos. Requiere número de subintervalos MÚLTIPLO DE 3.',
            formulaPill: 'I ≈ (3h/8)·[f(x0) + 3·Σ + 2·Σmúlt3 + f(xn)]',
            modes: MODES_INTEGRATION,
            about: {
                queHace: 'Aproximación de tercer orden con pesos 1, 3, 3, 2, 3, 3, 2... 1.',
                entradas: 'Función f(x), límites a y b, número de subintervalos n (MÚLTIPLO DE 3) o tolerancia.',
                condiciones: 'n debe ser divisible por 3.',
                parada: 'n fijo: evaluación directa. Por tolerancia: n = 3, 6, 9, … hasta que el error < tol.',
                interpretacion: 'Orden de error O(h⁴), ideal para combinar con Simpson 1/3 cuando el número de intervalos no es par.',
                limitaciones: 'Requiere que n sea múltiplo de 3.',
                formas: 'Taller 1: n_simpson38 = 3 y n += 3 hasta cumplir la tolerancia; o n fijo.'
            },
            defaults: { solveMode: 'n', fn: 'x^2', a: 0, b: 1, n: 6, exactVal: 0.3333333333, tol: 0.0001, maxIter: 2000 },
            presets: [
                { label: 'Caso Prueba B (x² en [0,1])', solveMode: 'n', fn: 'x^2', a: 0, b: 1, n: 6, exactVal: 0.3333333333 },
                { label: 'Taller 1: paracaidista (n automático)', solveMode: 'tol', fn: 'sqrt(9.8*68.1/0.25)*tanh(sqrt(9.8*0.25/68.1)*x)', a: 0, b: 10, exactVal: 333.92622119267946, tol: 0.00005, maxIter: 2000 },
                { label: 'Simpson 3/8 Simple (n=3)', solveMode: 'n', fn: 'sqrt(x)', a: 1, b: 4, n: 3, exactVal: 4.666667 },
                { label: 'Chapra n=6', solveMode: 'n', fn: '0.2 + 25*x - 200*x^2 + 675*x^3 - 900*x^4 + 400*x^5', a: 0, b: 0.8, n: 6, exactVal: 1.640533 }
            ]
        },

        // --- CATEGORÍA C: INTERPOLACIÓN Y REGRESIÓN ---
        directInterpolation: {
            id: 'directInterpolation',
            name: 'Interpolación Directa',
            category: 'Categoría C: Interpolación y regresión',
            badge: 'Vandermonde / Lagrange',
            description: 'Encuentra el único polinomio P(x) de grado n-1 que pasa exactamente por los n puntos dados. Se puede resolver por el sistema de Vandermonde o por la fórmula de Lagrange.',
            formulaPill: 'V·a = y   ó   P(x) = Σ yi·Li(x)',
            modes: [
                { id: 'vandermonde', name: 'Vandermonde', code: 'V·a = y (Gauss-Jordan)', icon: 'fa-table-cells' },
                { id: 'lagrange', name: 'Lagrange', code: 'P(x*) = Σ yᵢ·Lᵢ(x*)', icon: 'fa-layer-group' }
            ],
            about: {
                queHace: 'Genera una curva polinomial continua que interpola de forma exacta cada punto.',
                entradas: 'Conjunto de pares ordenados (xi, yi), punto objetivo x* a evaluar.',
                condiciones: 'Las abscisas xi deben ser estrictamente distintas entre sí (no duplicadas).',
                parada: 'Vandermonde: se resuelve el sistema fila por fila. Lagrange: se suma término a término.',
                interpretacion: 'El polinomio pasa con precisión milimétrica por cada dato muestral; ambas formas dan el mismo P(x).',
                limitaciones: 'Para muchos puntos equidistantes puede sufrir el fenómeno de Runge (oscilaciones en los bordes).',
                formas: 'Taller 2: np.polyfit(x, y, n-1) (equivale a Vandermonde) y la interpolación de Lagrange baricéntrica.'
            },
            defaults: { solveMode: 'vandermonde', pointsText: '0, 1\n1, 3\n2, 5', evalX: 1.5 },
            presets: [
                { label: 'Caso Prueba C ((0,1), (1,3), (2,5))', pointsText: '0, 1\n1, 3\n2, 5', evalX: 1.5 },
                { label: 'Clase: (3,4), (4,5), (5,3)', pointsText: '3, 4\n4, 5\n5, 3', evalX: 4.5 },
                { label: '4 Puntos Cúbicos', pointsText: '1, 3\n2, 6\n3, 19\n5, 99', evalX: 2.5 },
                { label: 'Termodinámica (T vs P)', pointsText: '100, 1.013\n110, 1.433\n120, 1.985\n130, 2.701', evalX: 115 }
            ]
        },

        leastSquares: {
            id: 'leastSquares',
            name: 'Mínimos Cuadrados',
            category: 'Categoría C: Interpolación y regresión',
            badge: 'Regresión Lineal / Polinomial',
            description: 'Ajusta el modelo que minimiza la suma de los residuos al cuadrado (Sr). Grado fijo (recta con/sin intercepto o polinomio) o grado automático según el RMSE.',
            formulaPill: 'min Sr = Σ (yi - ŷi)²',
            modes: [
                { id: 'fixed', name: 'Grado fijo', code: 'np.polyfit(x, y, g)', icon: 'fa-sliders' },
                { id: 'auto', name: 'Grado automático', code: 'RMSE para g = 1..10', icon: 'fa-wand-magic-sparkles' }
            ],
            about: {
                queHace: 'Encuentra la tendencia global de un conjunto de datos minimizando el error cuadrático.',
                entradas: 'Pares muestrales (xi, yi), modelo (recta, recta sin intercepto, polinomio) o grado automático, punto a pronosticar x.',
                condiciones: 'Al menos 2 puntos para recta; n > grado para polinomial. Varianza de x > 0.',
                parada: 'Grado fijo: solución de las ecuaciones normales. Grado automático: se prueban grados hasta que el RMSE casi no mejora.',
                interpretacion: 'R² mide la proporción de varianza explicada por el modelo (1.0 = ajuste perfecto).',
                limitaciones: 'Sensible a datos atípicos (outliers); grados altos pueden sobreajustar.',
                formas: 'Taller 2: recta con np.polyfit(x, y, 1) y selección del grado probando grados 1..10 con el RMSE.'
            },
            defaults: { solveMode: 'fixed', pointsText: '0, 1\n1, 3\n2, 5', mode: 'intercept', degree: 1, evalX: 3, gradoMax: 10, mejoraMin: 10 },
            presets: [
                { label: 'Caso Prueba D ((0,1), (1,3), (2,5))', solveMode: 'fixed', pointsText: '0, 1\n1, 3\n2, 5', mode: 'intercept', degree: 1, evalX: 3 },
                { label: 'Clase 11/09: x = 1..7 (recta)', solveMode: 'fixed', pointsText: '1, 0.5\n2, 2.5\n3, 2.0\n4, 4.0\n5, 3.5\n6, 6.0\n7, 5.5', mode: 'intercept', degree: 1, evalX: 4.5 },
                { label: 'Parabólica (grado 2 fijo)', solveMode: 'fixed', pointsText: '0, 1.0\n1, 1.8\n2, 3.2\n3, 5.5\n4, 8.9\n5, 13.1', mode: 'polynomial', degree: 2, evalX: 2.5 },
                { label: 'Parabólica (grado automático)', solveMode: 'auto', pointsText: '0, 1.0\n1, 1.8\n2, 3.2\n3, 5.5\n4, 8.9\n5, 13.1', evalX: 2.5, mejoraMin: 10 },
                { label: 'Cúbica con ruido (grado automático)', solveMode: 'auto', pointsText: '-3, -14.8\n-2, -3.1\n-1, 1.2\n0, 1.1\n1, 0.7\n2, 1.2\n3, 5.9\n4, 18.8\n5, 41.1', evalX: 1.5, mejoraMin: 10 }
            ]
        },

        // --- CATEGORÍA D: OPTIMIZACIÓN ---
        goldenSection1D: {
            id: 'goldenSection1D',
            name: 'Sección Dorada Univariada',
            category: 'Categoría D: Optimización',
            badge: 'Búsqueda Áurea 1D (R ≈ 0.618)',
            description: 'Encuentra el mínimo o máximo de una función unimodal dentro de un intervalo [a, b] utilizando la proporción áurea.',
            formulaPill: 'd = R·(xu - xl),  x1 = xu - d,  x2 = xl + d',
            modes: MODES_ITER,
            about: {
                queHace: 'Reduce progresivamente el intervalo de incertidumbre donde se ubica el óptimo sin necesidad de derivadas.',
                entradas: 'Función f(x), límites a y b, objetivo (minimizar o maximizar), tolerancia o número de iteraciones.',
                condiciones: 'La función debe ser unimodal en [a, b] (tener un único extremo local).',
                parada: 'Por tolerancia: ea = (1 − R)·|(xu − xl)/x_opt|·100 < tol. Por iteraciones: exactamente N.',
                interpretacion: 'Garantiza encontrar el óptimo local dentro del intervalo con eficiencia geométrica constante.',
                limitaciones: 'No demuestra que el extremo sea global si existen múltiples picos o valles fuera del intervalo.',
                formas: 'Clase: for i in range(10) / while i < 10. Ejercicio del proyectil: while error >= tolerancia.'
            },
            defaults: { solveMode: 'tol', fn: '(x - 2)^2', a: 0, b: 5, type: 'min', tol: 0.0001, maxIter: 40, nIter: 10 },
            presets: [
                { label: 'Caso Prueba E: min (x - 2)² en [0,5]', solveMode: 'tol', fn: '(x - 2)^2', a: 0, b: 5, type: 'min', tol: 0.0001 },
                { label: 'Ejercicio: altura máxima del proyectil (tol 1 %)', solveMode: 'tol', fn: 'tan(50*pi/180)*x - 9.81*x^2/(2*25^2*cos(50*pi/180)^2) + 1', a: 0, b: 60, type: 'max', tol: 1 },
                { label: 'Clase: máx 2x − x², 10 iteraciones', solveMode: 'iter', fn: '2*x - x^2', a: 0, b: 4, type: 'max', nIter: 10 },
                { label: 'Máximo Chapra (2·sin(x) - x²/10)', solveMode: 'tol', fn: '2*sin(x) - x^2 / 10', a: 0, b: 4, type: 'max', tol: 0.0001 },
                { label: 'Cúbica con Extremo', solveMode: 'tol', fn: 'x^3 - 6*x^2 + 4*x + 12', a: 0, b: 3, type: 'max', tol: 0.0001 }
            ]
        },

        goldenSection2D: {
            id: 'goldenSection2D',
            name: 'Sección Dorada Multivariada',
            category: 'Categoría D: Optimización',
            badge: 'Búsqueda Coordinada Cíclica 2D',
            description: 'Optimiza funciones multivariadas f(x, y) alternando búsquedas unidimensionales por sección dorada en cada eje.',
            formulaPill: 'x_{k+1} = argopt_x f(x, y_k)  →  y_{k+1} = argopt_y f(x_{k+1}, y)',
            modes: [
                { id: 'tol', name: 'Por tolerancia', code: 'while error > tol:', icon: 'fa-bullseye' },
                { id: 'iter', name: 'Por ciclos', code: 'for ciclo in range(N):', icon: 'fa-list-ol' }
            ],
            about: {
                queHace: 'Optimiza funciones de dos variables f(x, y) mediante búsqueda coordinada por ejes sin derivadas.',
                entradas: 'Función f(x, y), punto inicial (x0, y0), rangos de búsqueda [xmin, xmax] y [ymin, ymax], objetivo (min/max).',
                condiciones: 'La función debe ser continua y unimodal en cada eje dentro de la región de búsqueda.',
                parada: 'Por tolerancia: max(|Δx/x|, |Δy/y|)·100 < tol. Por ciclos: exactamente N ciclos.',
                interpretacion: 'Muestra una trayectoria ortogonal en zigzag sobre las curvas de nivel convergiendo al óptimo local.',
                limitaciones: 'Puede ralentizarse en valles estrechos diagonales (como la función de Rosenbrock) y depende del punto inicial.',
                formas: 'Ejercicio de optimización: ciclos while i < 100 que se detienen cuando el error relativo < tolerancia, o N ciclos fijos.'
            },
            defaults: {
                solveMode: 'tol', fn2D: '(x - 2)^2 + (y + 1)^2', x0: 0, y0: 0, xMin: -1, xMax: 5, yMin: -4, yMax: 3,
                type: 'min', tol: 0.0001, maxCycles: 25, nCycles: 5, coordOrder: 'xy'
            },
            presets: [
                { label: 'Caso Prueba F: min (x-2)² + (y+1)²', solveMode: 'tol', fn2D: '(x - 2)^2 + (y + 1)^2', x0: 0, y0: 0, xMin: -1, xMax: 5, yMin: -4, yMax: 3, type: 'min', tol: 0.0001 },
                { label: 'Ejercicio: min −8x + x² + 12y + 4y² − 2xy', solveMode: 'tol', fn2D: '-8*x + x^2 + 12*y + 4*y^2 - 2*x*y', x0: 0, y0: 0, xMin: -10, xMax: 10, yMin: -10, yMax: 10, type: 'min', tol: 0.0005, maxCycles: 100 },
                { label: 'Mismo ejercicio, 5 ciclos fijos', solveMode: 'iter', fn2D: '-8*x + x^2 + 12*y + 4*y^2 - 2*x*y', x0: 0, y0: 0, xMin: -10, xMax: 10, yMin: -10, yMax: 10, type: 'min', nCycles: 5 },
                { label: 'Paraboloide Elíptico', solveMode: 'tol', fn2D: 'x^2 - 4*x + y^2 - 6*y + 15', x0: 0, y0: 0, xMin: -1, xMax: 6, yMin: -1, yMax: 7, type: 'min', tol: 0.0001 },
                { label: 'Colina Gaussiana (Máximo)', solveMode: 'tol', fn2D: '4*exp(-(x-1)^2 - (y-2)^2)', x0: 0, y0: 0, xMin: -1, xMax: 3, yMin: 0, yMax: 4, type: 'max', tol: 0.0001 }
            ]
        }
    },

    // ============================================================
    // INICIALIZACIÓN Y NAVEGACIÓN
    // ============================================================
    init: function() {
        this.renderCategoryNav();
        this.selectMethod(this.currentMethod);
        this.setupEvents();
        this.checkBackend();
    },

    checkBackend: async function() {
        const el = document.getElementById('backend-status');
        if (!el) return;
        try {
            const r = await fetch(`${Api.BASE_URL}/api/salud`);
            if (!r.ok) throw new Error();
            el.innerHTML = '<span style="color:#39ff7a;text-shadow:0 0 6px #39ff7a">● Backend en línea</span>';
        } catch (e) {
            el.innerHTML = '<span style="color:#ff3344;text-shadow:0 0 6px #ff3344">● Backend sin conexión</span>';
        }
    },

    renderCategoryNav: function() {
        const categories = {
            'Categoría A: Ecuaciones no lineales': ['bisection', 'falsePosition', 'secant', 'newtonRaphson'],
            'Categoría B: Integración numérica': ['trapezoidal', 'simpson13', 'simpson38'],
            'Categoría C: Interpolación y regresión': ['directInterpolation', 'leastSquares'],
            'Categoría D: Optimización': ['goldenSection1D', 'goldenSection2D']
        };

        const container = document.getElementById('nav-categories-container');
        if (!container) return;

        const catStyles = ['cat-a', 'cat-b', 'cat-c', 'cat-d'];
        const catIcons = ['fa-crosshairs', 'fa-chart-area', 'fa-wave-square', 'fa-trophy'];

        let html = '';
        let catIdx = 0;
        for (const [catName, methodIds] of Object.entries(categories)) {
            const catClass = catStyles[catIdx] || '';
            const icon = catIcons[catIdx] || 'fa-star';
            catIdx++;
            html += `<div class="flex flex-col gap-2 ${catClass}"><span class="category-chip">${catName.replace('Categoría ', '')}</span><div class="flex flex-wrap">`;
            methodIds.forEach(id => {
                const conf = this.methodsConfig[id];
                html += `<button type="button" onclick="App.selectMethod('${id}')" id="tab-${id}" class="tab-button"><i class="fas ${icon}"></i><span>${conf.name}</span></button>`;
            });
            html += '</div></div>';
        }
        container.innerHTML = html;
    },

    selectMethod: function(methodId) {
        this.currentMethod = methodId;
        const config = this.methodsConfig[methodId];
        if (!config) return;

        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        const activeTab = document.getElementById(`tab-${methodId}`);
        if (activeTab) activeTab.classList.add('active');

        document.getElementById('method-title').innerText = config.name;
        document.getElementById('method-badge').innerText = config.badge;
        document.getElementById('method-category-name').innerText = config.category;
        document.getElementById('method-description').innerText = config.description;
        document.getElementById('method-formula-pill').innerText = config.formulaPill;

        const noticeBox = document.getElementById('method-warning-box');
        if (config.warningNotice) {
            noticeBox.classList.remove('hidden');
            document.getElementById('method-warning-text').innerText = config.warningNotice;
        } else {
            noticeBox.classList.add('hidden');
        }

        this.renderAboutSection(config.about);
        this.renderPresets(config.presets);
        this.renderFormInputs(config);
        document.getElementById('custom-solution-container').innerHTML = '';
        this.calculateCurrent();
    },

    renderAboutSection: function(about) {
        if (!about) return;
        const container = document.getElementById('about-method-content');
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                    <p class="font-bold text-amber-300 mb-1">¿Qué hace el método?</p>
                    <p class="text-indigo-100 mb-3">${about.queHace}</p>
                    <p class="font-bold text-amber-300 mb-1">Entradas</p>
                    <p class="text-indigo-100 mb-3">${about.entradas}</p>
                    <p class="font-bold text-amber-300 mb-1">Condiciones de aplicación</p>
                    <p class="text-indigo-100 mb-3">${about.condiciones}</p>
                    <p class="font-bold text-amber-300 mb-1">Criterio de parada</p>
                    <p class="text-indigo-100">${about.parada}</p>
                </div>
                <div>
                    <p class="font-bold text-cyan-300 mb-1">Formas de resolución (talleres)</p>
                    <p class="text-indigo-100 mb-3">${about.formas || '—'}</p>
                    <p class="font-bold text-amber-300 mb-1">Interpretación de resultados</p>
                    <p class="text-indigo-100 mb-3">${about.interpretacion}</p>
                    <p class="font-bold text-rose-400 mb-1">Limitaciones principales</p>
                    <p class="text-indigo-100">${about.limitaciones}</p>
                </div>
            </div>
        `;
    },

    renderPresets: function(presets) {
        const container = document.getElementById('presets-container');
        if (!presets || presets.length === 0) {
            container.innerHTML = '';
            return;
        }
        let html = '<div class="flex items-center gap-2 flex-wrap mb-3"><span class="dark-label mb-0">Ejemplos precargados:</span>';
        presets.forEach((p, idx) => {
            html += `<button type="button" onclick="App.applyPreset(${idx})" class="preset-chip">${p.label}</button>`;
        });
        html += '</div>';
        container.innerHTML = html;
    },

    inputIdFor: function(key) {
        return key === 'pointsText' ? 'input-points' : `input-${key}`;
    },

    applyPreset: function(idx) {
        const config = this.methodsConfig[this.currentMethod];
        const preset = config.presets[idx];
        if (!preset) return;
        for (const [key, val] of Object.entries(preset)) {
            if (key === 'label' || key === 'solveMode') continue;
            const input = document.getElementById(this.inputIdFor(key));
            if (input) input.value = val;
        }
        if (preset.solveMode) this.setSolveMode(preset.solveMode, false);
        this.calculateCurrent();
    },

    resetCurrentMethod: function() {
        this.renderFormInputs(this.methodsConfig[this.currentMethod]);
        this.calculateCurrent();
    },

    // ============================================================
    // SELECTOR DE FORMA DE RESOLUCIÓN
    // ============================================================
    modeToggleHTML: function(config) {
        if (!config.modes) return '';
        const current = config.defaults.solveMode;
        let html = `<div><label class="dark-label">Forma de resolución</label><input type="hidden" id="input-solveMode" value="${current}"><div class="mode-toggle">`;
        config.modes.forEach(m => {
            html += `
                <button type="button" class="mode-btn ${m.id === current ? 'active' : ''}" data-mode="${m.id}" onclick="App.setSolveMode('${m.id}')">
                    <i class="fas ${m.icon}"></i>
                    <span class="mode-name">${m.name}</span>
                    <span class="mode-code">${m.code}</span>
                </button>`;
        });
        html += '</div></div>';
        return html;
    },

    getSolveMode: function() {
        const el = document.getElementById('input-solveMode');
        return el ? el.value : null;
    },

    setSolveMode: function(mode, recalc = true) {
        const hidden = document.getElementById('input-solveMode');
        if (!hidden) return;
        hidden.value = mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        document.querySelectorAll('[data-mode-only]').forEach(el => {
            const allowed = el.dataset.modeOnly.split(' ');
            el.classList.toggle('hidden', !allowed.includes(mode));
        });
        if (recalc) this.calculateCurrent();
    },

    // Campos de parada comunes a los métodos iterativos
    iterFieldsHTML: function(d, unit = 'iteraciones') {
        return `
            <div class="grid grid-cols-2 gap-2">
                <div data-mode-only="tol">
                    <label class="dark-label">Tolerancia ea (%)</label>
                    <input type="number" step="any" id="input-tol" value="${d.tol}" class="dark-input font-mono">
                </div>
                <div data-mode-only="tol">
                    <label class="dark-label">Máx. ${unit} (seguridad)</label>
                    <input type="number" id="input-maxIter" value="${d.maxIter}" min="1" class="dark-input font-mono">
                </div>
                <div data-mode-only="iter" class="col-span-2">
                    <label class="dark-label">Número de ${unit} N <span class="text-amber-300">(se ejecutan exactamente N)</span></label>
                    <input type="number" id="input-nIter" value="${d.nIter}" min="1" class="dark-input font-mono">
                </div>
            </div>`;
    },

    renderFormInputs: function(config) {
        const container = document.getElementById('form-inputs-container');
        const d = config.defaults;
        let html = this.modeToggleHTML(config);

        if (config.id === 'bisection' || config.id === 'falsePosition') {
            html += `
                <div>
                    <label class="dark-label">Función f(x)</label>
                    <input type="text" id="input-fn" value="${d.fn}" class="dark-input font-mono">
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div><label class="dark-label">Límite a (x_l)</label><input type="number" step="any" id="input-a" value="${d.a}" class="dark-input font-mono"></div>
                    <div><label class="dark-label">Límite b (x_u)</label><input type="number" step="any" id="input-b" value="${d.b}" class="dark-input font-mono"></div>
                </div>
                ${this.iterFieldsHTML(d)}`;
        } else if (config.id === 'secant') {
            html += `
                <div>
                    <label class="dark-label">Función f(x)</label>
                    <input type="text" id="input-fn" value="${d.fn}" class="dark-input font-mono">
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div><label class="dark-label">x_{n-1} inicial (x_ant)</label><input type="number" step="any" id="input-x0" value="${d.x0}" class="dark-input font-mono"></div>
                    <div><label class="dark-label">x_n inicial (x_act)</label><input type="number" step="any" id="input-x1" value="${d.x1}" class="dark-input font-mono"></div>
                </div>
                ${this.iterFieldsHTML(d)}`;
        } else if (config.id === 'newtonRaphson') {
            html += `
                <div>
                    <label class="dark-label">Función f(x)</label>
                    <input type="text" id="input-fn" value="${d.fn}" class="dark-input font-mono">
                </div>
                <div>
                    <label class="dark-label">Derivada f'(x) <span class="text-slate-500 font-normal">(Vacío = simbólica automática)</span></label>
                    <input type="text" id="input-dfn" value="${d.dfn || ''}" placeholder="Se deriva automáticamente en el backend" class="dark-input font-mono">
                </div>
                <div>
                    <label class="dark-label">Valor inicial x0</label>
                    <input type="number" step="any" id="input-x0" value="${d.x0}" class="dark-input font-mono">
                </div>
                ${this.iterFieldsHTML(d)}`;
        } else if (['trapezoidal', 'simpson13', 'simpson38'].includes(config.id)) {
            const ruleHelp = config.id === 'simpson13' ? '(DEBE SER PAR)' : config.id === 'simpson38' ? '(MÚLTIPLO DE 3)' : '(>= 1)';
            const nStart = config.id === 'simpson13' ? '2, 4, 6…' : config.id === 'simpson38' ? '3, 6, 9…' : '1, 2, 3…';
            html += `
                <div>
                    <label class="dark-label">Función integrando f(x)</label>
                    <input type="text" id="input-fn" value="${d.fn}" class="dark-input font-mono">
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div><label class="dark-label">Límite inferior a</label><input type="number" step="any" id="input-a" value="${d.a}" class="dark-input font-mono"></div>
                    <div><label class="dark-label">Límite superior b</label><input type="number" step="any" id="input-b" value="${d.b}" class="dark-input font-mono"></div>
                </div>
                <div data-mode-only="n">
                    <label class="dark-label">Subintervalos n <span class="text-amber-300 font-bold">${ruleHelp}</span></label>
                    <input type="number" id="input-n" value="${d.n}" min="1" class="dark-input font-mono">
                </div>
                <div class="grid grid-cols-2 gap-2" data-mode-only="tol">
                    <div><label class="dark-label">Tolerancia error (%)</label><input type="number" step="any" id="input-tol" value="${d.tol}" class="dark-input font-mono"></div>
                    <div><label class="dark-label">Máx. cálculos</label><input type="number" id="input-maxIter" value="${d.maxIter}" min="1" max="5000" class="dark-input font-mono"></div>
                    <p class="col-span-2 text-[10px] text-indigo-300">Se prueba n = ${nStart} hasta que el error sea menor que la tolerancia.</p>
                </div>
                <div>
                    <label class="dark-label">Valor exacto <span class="text-slate-500 font-normal">(opcional: error verdadero; vacío = error aproximado)</span></label>
                    <input type="number" step="any" id="input-exactVal" value="${d.exactVal ?? ''}" placeholder="Para error verdadero" class="dark-input font-mono">
                </div>`;
        } else if (config.id === 'directInterpolation') {
            html += `
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <label class="dark-label mb-0">Tabla de Puntos (x, y)</label>
                        <div class="flex gap-1">
                            <button type="button" onclick="App.addPointRow()" class="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700">+ Fila</button>
                            <button type="button" onclick="App.removePointRow()" class="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-rose-400 rounded border border-slate-700">- Fila</button>
                        </div>
                    </div>
                    <textarea id="input-points" rows="5" class="dark-textarea font-mono text-xs">${d.pointsText}</textarea>
                </div>
                <div>
                    <label class="dark-label">Interpolar en x* =</label>
                    <input type="number" step="any" id="input-evalX" value="${d.evalX}" class="dark-input font-mono">
                </div>`;
        } else if (config.id === 'leastSquares') {
            let degOpts = '';
            for (let g = 1; g <= 10; g++) degOpts += `<option value="${g}" ${g === d.degree ? 'selected' : ''}>${g}${g === 1 ? ' (Lineal)' : g === 2 ? ' (Parabólico)' : g === 3 ? ' (Cúbico)' : ''}</option>`;
            let maxOpts = '';
            for (let g = 2; g <= 10; g++) maxOpts += `<option value="${g}" ${g === d.gradoMax ? 'selected' : ''}>${g}</option>`;
            html += `
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <label class="dark-label mb-0">Datos Muestrales (x, y)</label>
                        <div class="flex gap-1">
                            <button type="button" onclick="App.addPointRow()" class="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700">+ Fila</button>
                            <button type="button" onclick="App.removePointRow()" class="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-rose-400 rounded border border-slate-700">- Fila</button>
                        </div>
                    </div>
                    <textarea id="input-points" rows="5" class="dark-textarea font-mono text-xs">${d.pointsText}</textarea>
                </div>
                <div class="grid grid-cols-2 gap-2" data-mode-only="fixed">
                    <div>
                        <label class="dark-label">Modelo</label>
                        <select id="input-mode" class="dark-select text-xs">
                            <option value="intercept" ${d.mode === 'intercept' ? 'selected' : ''}>Recta y = b0 + b1·x</option>
                            <option value="no_intercept" ${d.mode === 'no_intercept' ? 'selected' : ''}>Sin intercepto y = b1·x</option>
                            <option value="polynomial" ${d.mode === 'polynomial' ? 'selected' : ''}>Polinomial (grado g)</option>
                        </select>
                    </div>
                    <div>
                        <label class="dark-label">Grado g (si polinomial)</label>
                        <select id="input-degree" class="dark-select text-xs">${degOpts}</select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2" data-mode-only="auto">
                    <div>
                        <label class="dark-label">Grado máximo a probar</label>
                        <select id="input-gradoMax" class="dark-select text-xs">${maxOpts}</select>
                    </div>
                    <div>
                        <label class="dark-label">Mejora mínima RMSE (%)</label>
                        <input type="number" step="any" id="input-mejoraMin" value="${d.mejoraMin}" class="dark-input font-mono">
                    </div>
                </div>
                <div>
                    <label class="dark-label">Pronosticar en x =</label>
                    <input type="number" step="any" id="input-evalX" value="${d.evalX}" class="dark-input font-mono">
                </div>`;
        } else if (config.id === 'goldenSection1D') {
            html += `
                <div>
                    <label class="dark-label">Función f(x)</label>
                    <input type="text" id="input-fn" value="${d.fn}" class="dark-input font-mono">
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div><label class="dark-label">Límite inferior a (x_l)</label><input type="number" step="any" id="input-a" value="${d.a}" class="dark-input font-mono"></div>
                    <div><label class="dark-label">Límite superior b (x_u)</label><input type="number" step="any" id="input-b" value="${d.b}" class="dark-input font-mono"></div>
                </div>
                <div>
                    <label class="dark-label">Objetivo</label>
                    <select id="input-type" class="dark-select text-xs font-bold text-amber-300">
                        <option value="min" ${d.type === 'min' ? 'selected' : ''}>Minimizar (Mínimo)</option>
                        <option value="max" ${d.type === 'max' ? 'selected' : ''}>Maximizar (Máximo)</option>
                    </select>
                </div>
                ${this.iterFieldsHTML(d)}`;
        } else if (config.id === 'goldenSection2D') {
            html += `
                <div>
                    <label class="dark-label">Función f(x, y)</label>
                    <input type="text" id="input-fn2D" value="${d.fn2D}" class="dark-input font-mono">
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div><label class="dark-label">Punto Inicial x0</label><input type="number" step="any" id="input-x0" value="${d.x0}" class="dark-input font-mono"></div>
                    <div><label class="dark-label">Punto Inicial y0</label><input type="number" step="any" id="input-y0" value="${d.y0}" class="dark-input font-mono"></div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="dark-label">Rango X [mín, máx]</label>
                        <div class="flex gap-1">
                            <input type="number" step="any" id="input-xMin" value="${d.xMin}" class="dark-input font-mono text-xs">
                            <input type="number" step="any" id="input-xMax" value="${d.xMax}" class="dark-input font-mono text-xs">
                        </div>
                    </div>
                    <div>
                        <label class="dark-label">Rango Y [mín, máx]</label>
                        <div class="flex gap-1">
                            <input type="number" step="any" id="input-yMin" value="${d.yMin}" class="dark-input font-mono text-xs">
                            <input type="number" step="any" id="input-yMax" value="${d.yMax}" class="dark-input font-mono text-xs">
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="dark-label">Objetivo</label>
                        <select id="input-type" class="dark-select text-xs font-bold text-amber-300">
                            <option value="min" ${d.type === 'min' ? 'selected' : ''}>Minimizar</option>
                            <option value="max" ${d.type === 'max' ? 'selected' : ''}>Maximizar</option>
                        </select>
                    </div>
                    <div>
                        <label class="dark-label">Orden Coordenadas</label>
                        <select id="input-coordOrder" class="dark-select text-xs">
                            <option value="xy" selected>Primero X, luego Y</option>
                            <option value="yx">Primero Y, luego X</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div data-mode-only="tol"><label class="dark-label">Tolerancia error (%)</label><input type="number" step="any" id="input-tol" value="${d.tol}" class="dark-input font-mono"></div>
                    <div data-mode-only="tol"><label class="dark-label">Máx. ciclos (seguridad)</label><input type="number" id="input-maxCycles" value="${d.maxCycles}" min="1" class="dark-input font-mono"></div>
                    <div data-mode-only="iter" class="col-span-2"><label class="dark-label">Número de ciclos N <span class="text-amber-300">(se ejecutan exactamente N)</span></label><input type="number" id="input-nCycles" value="${d.nCycles}" min="1" class="dark-input font-mono"></div>
                </div>`;
        }

        container.innerHTML = html;
        if (config.modes) this.setSolveMode(d.solveMode, false);
    },

    addPointRow: function() {
        const textarea = document.getElementById('input-points');
        if (!textarea) return;
        const lines = textarea.value.trim().split('\n');
        let nextX = 0;
        let nextY = 0;
        if (lines.length > 0) {
            const lastParts = lines[lines.length - 1].split(/[\s,;\t]+/).map(Number);
            if (lastParts.length >= 2 && !isNaN(lastParts[0])) {
                nextX = lastParts[0] + 1;
                nextY = lastParts[1] + 2;
            }
        }
        textarea.value += `\n${nextX}, ${nextY}`;
    },

    removePointRow: function() {
        const textarea = document.getElementById('input-points');
        if (!textarea) return;
        const lines = textarea.value.trim().split('\n');
        if (lines.length > 2) {
            lines.pop();
            textarea.value = lines.join('\n');
        }
    },

    parsePointsText: function(text) {
        const points = [];
        for (const line of text.trim().split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const parts = trimmed.split(/[\s,;\t]+/).map(Number);
            if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                points.push({ x: parts[0], y: parts[1] });
            }
        }
        return points;
    },

    val: function(id) { return document.getElementById(`input-${id}`).value; },
    num: function(id) { return parseFloat(this.val(id)); },
    int: function(id) { return parseInt(this.val(id), 10); },
    fmt: function(v, d) { return MathEngine.formatNum(v, d === undefined ? App.decimalPrecision : d); },
    // Número con paréntesis si es negativo (para sustituir en fórmulas)
    par: function(v, d) { const s = App.fmt(v, d); return v < 0 ? `(${s})` : s; },

    // ============================================================
    // CÁLCULO (delegado al backend)
    // ============================================================
    _requestSeq: 0,

    calculateCurrent: async function() {
        const methodId = this.currentMethod;
        const alertBox = document.getElementById('error-alert');
        alertBox.classList.add('hidden');
        const seq = ++this._requestSeq;
        this._isStale = () => seq !== this._requestSeq || methodId !== this.currentMethod;

        try {
            switch (methodId) {
                case 'bisection':
                case 'falsePosition':
                    await this.executeBracketMethod(methodId);
                    break;
                case 'secant':
                    await this.executeSecant();
                    break;
                case 'newtonRaphson':
                    await this.executeNewtonRaphson();
                    break;
                case 'trapezoidal':
                case 'simpson13':
                case 'simpson38':
                    await this.executeIntegration(methodId);
                    break;
                case 'directInterpolation':
                    await this.executeDirectInterpolation();
                    break;
                case 'leastSquares':
                    await this.executeLeastSquares();
                    break;
                case 'goldenSection1D':
                    await this.executeGoldenSection1D();
                    break;
                case 'goldenSection2D':
                    await this.executeGoldenSection2D();
                    break;
            }
        } catch (err) {
            if (err && err.stale) return;
            if (this._isStale()) return;
            alertBox.classList.remove('hidden');
            document.getElementById('error-message').innerText = err.message || 'Error en el cálculo.';
            this.setupStepper(null);
            console.error(err);
        }
    },

    callApi: async function(promise) {
        const result = await promise;
        if (this._isStale()) {
            const e = new Error('stale');
            e.stale = true;
            throw e;
        }
        return result;
    },

    // Datos de parada comunes para métodos iterativos
    iterPayload: function(maxKey = 'maxIter', nKey = 'nIter') {
        const mode = this.getSolveMode();
        return {
            criterio: mode === 'iter' ? 'iter' : 'tol',
            tolerancia: mode === 'iter' ? 1e-12 : this.num('tol'),
            max_iter: mode === 'iter' ? this.int(nKey) : this.int(maxKey)
        };
    },

    criterionLine: function(it, idx, total, errorValue) {
        const c = this.ctx;
        if (c.mode === 'iter') {
            return `<div class="step-line"><span class="step-label">Control (for):</span> iteración ${idx + 1} de N = ${c.N}${idx + 1 === total ? ' <span class="ok">→ fin del ciclo for</span>' : ''}</div>`;
        }
        if (errorValue === null || errorValue === undefined) {
            return `<div class="step-line"><span class="step-label">Control (while):</span> aún no hay error (primera aproximación) <span class="warn">→ continúa</span></div>`;
        }
        const ok = errorValue < c.tol;
        return `<div class="step-line"><span class="step-label">Control (while):</span> ${this.fmt(errorValue, 6)} % ${ok ? '<' : '≥'} tol = ${c.tol} % ${ok ? '<span class="ok">✔ se detiene</span>' : '<span class="warn">→ continúa</span>'}</div>`;
    },

    L: function(label, content) {
        return `<div class="step-line"><span class="step-label">${label}</span> ${content}</div>`;
    },

    // 1. Bisección / Falsa Posición
    executeBracketMethod: async function(methodId) {
        const fnStr = this.val('fn');
        const a = this.num('a');
        const b = this.num('b');
        const stop = this.iterPayload();
        const payload = Object.assign({ funcion: fnStr, a: a, b: b }, stop);
        const result = await this.callApi(methodId === 'bisection' ? Api.biseccion(payload) : Api.falsaPosicion(payload));
        const fn = MathEngine.createFunction1D(fnStr);
        this.ctx = { mode: stop.criterio, tol: stop.tolerancia, N: stop.max_iter };

        const exactFirst = result.totalIter === 1 && Math.abs(result.fRoot) < 1e-12;
        this.renderKPIs([
            { title: 'Raíz Aproximada (xr)', value: this.fmt(result.root), highlight: true },
            { title: 'f(xr) Residuo', value: this.fmt(result.fRoot, 4) },
            { title: 'Iteraciones', value: result.totalIter },
            { title: 'Error ea (%)', value: exactFirst ? 'Raíz exacta' : `${this.fmt(result.finalError, 4)} %` }
        ]);

        document.getElementById('left-chart-title').innerText = 'Error aproximado vs iteración (escala log)';
        document.getElementById('right-chart-title').innerText = 'Función, intervalo y raíz';
        Plotter.plotErrorLog('left-chart-container', result.iterations);
        Plotter.plotFunctionAndRoot('right-chart-container', fn, result.root, result.fRoot, a, b);

        const headers = ['Iter', 'a (x_l)', 'b (x_u)', 'xr', 'f(a)', 'f(b)', 'f(xr)', 'f(a)·f(xr)', 'Error Abs |Δx|', 'Error ea (%)', 'Nuevo Intervalo'];
        const rows = result.iterations.map(it => [
            it.iter, this.fmt(it.a, 6), this.fmt(it.b, 6), this.fmt(it.xr), this.fmt(it.fa, 5), this.fmt(it.fb, 5),
            this.fmt(it.fxr, 5), it.signProduct !== undefined ? this.fmt(it.signProduct, 4) : '—',
            it.absErr !== null && it.absErr !== undefined ? this.fmt(it.absErr, 6) : '—',
            it.error === null ? '—' : `${this.fmt(it.error, 6)}%`, it.interval || '—'
        ]);
        this.renderTable(headers, rows);
        this.renderSolution(result.stopReason);

        const isFP = methodId === 'falsePosition';
        this.setupStepper(result.iterations, {
            unit: 'Iteración',
            describe: (it, i, steps) => {
                const prev = i > 0 ? steps[i - 1].xr : null;
                const formula = isFP
                    ? `x_r = b − f(b)(a − b)/(f(a) − f(b)) = ${this.fmt(it.b)} − ${this.par(it.fb)}·(${this.fmt(it.a)} − ${this.par(it.b)})/(${this.fmt(it.fa)} − ${this.par(it.fb)}) = <span class="hl">${this.fmt(it.xr)}</span>`
                    : `x_r = (a + b)/2 = (${this.fmt(it.a)} + ${this.par(it.b)})/2 = <span class="hl">${this.fmt(it.xr)}</span>`;
                const p = it.signProduct;
                let decision = 'x_r es raíz exacta';
                if (p < 0) decision = 'f(a)·f(x_r) < 0 → la raíz está en [a, x_r] ⇒ <b>b = x_r</b>';
                else if (p > 0) decision = 'f(a)·f(x_r) > 0 → la raíz está en [x_r, b] ⇒ <b>a = x_r</b>';
                return [
                    this.L(`Iteración ${it.iter}:`, `intervalo actual [a, b] = [${this.fmt(it.a)}, ${this.fmt(it.b)}]`),
                    this.L('Nueva aproximación:', formula),
                    this.L('Evaluaciones:', `f(a) = ${this.fmt(it.fa)}, f(b) = ${this.fmt(it.fb)}, f(x_r) = ${this.fmt(it.fxr)}`),
                    p !== undefined ? this.L('Signo:', `f(a)·f(x_r) = ${this.par(it.fa)}·${this.par(it.fxr)} = ${this.fmt(p, 6)} → ${decision}`) : '',
                    it.interval ? this.L('Nuevo intervalo:', it.interval) : '',
                    this.L('Error:', prev === null ? '— (primera iteración: no hay x_r anterior)' : `ea = |(x_r − x_r,ant)/x_r|·100 = |(${this.fmt(it.xr)} − ${this.par(prev)})/${this.par(it.xr)}|·100 = <span class="hl">${this.fmt(it.error, 6)} %</span>`),
                    this.criterionLine(it, i, steps.length, it.error)
                ].join('');
            },
            mark: (it) => {
                const items = [
                    Plotter.band(it.a, it.b, 'rgba(255, 210, 63, 0.10)'),
                    Plotter.vLine(it.a, '#eab308', 'a'),
                    Plotter.vLine(it.b, '#a855f7', 'b'),
                    Plotter.dot(it.xr, it.fxr, '#ff2fb3', 'x_r')
                ];
                if (isFP) items.push(Plotter.segment(it.a, it.fa, it.b, it.fb, '#39ff7a', 'dot'));
                Plotter.setOverlay('right-chart-container', items);
                Plotter.setOverlay('left-chart-container', [Plotter.vLine(it.iter, '#ff2fb3', null, 'dot')]);
            }
        });
    },

    // Rango de graficación que cubre todas las aproximaciones de un método abierto
    openRange: function(xs, fallbackCenter) {
        const finite = xs.filter(v => v !== null && isFinite(v));
        let lo = Math.min(...finite);
        let hi = Math.max(...finite);
        if (!isFinite(lo) || !isFinite(hi) || hi - lo > 1e3) return [fallbackCenter - 1, fallbackCenter + 1];
        if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
        return [lo, hi];
    },

    // 2. Secante
    executeSecant: async function() {
        const fnStr = this.val('fn');
        const x0 = this.num('x0');
        const x1 = this.num('x1');
        const stop = this.iterPayload();
        const result = await this.callApi(Api.secante(Object.assign({ funcion: fnStr, x0: x0, x1: x1 }, stop)));
        const fn = MathEngine.createFunction1D(fnStr);
        this.ctx = { mode: stop.criterio, tol: stop.tolerancia, N: stop.max_iter };

        this.renderKPIs([
            { title: 'Raíz Aproximada', value: this.fmt(result.root), highlight: true },
            { title: 'f(xr) Residuo', value: this.fmt(result.fRoot, 4) },
            { title: 'Iteraciones', value: result.totalIter },
            { title: 'Error ea (%)', value: `${this.fmt(result.finalError, 4)} %` }
        ]);

        document.getElementById('left-chart-title').innerText = 'Error aproximado vs iteración (escala log)';
        document.getElementById('right-chart-title').innerText = 'Función, rectas secantes y raíz';
        Plotter.plotErrorLog('left-chart-container', result.iterations);
        const range = this.openRange(result.iterations.flatMap(it => [it.xPrev, it.xCurr, it.xNext]), result.root);
        Plotter.plotFunctionAndRoot('right-chart-container', fn, result.root, result.fRoot, range[0], range[1], { hideBounds: true });

        const headers = ['Iter', 'x_{n-1}', 'x_n', 'f(x_{n-1})', 'f(x_n)', 'x_{n+1}', 'f(x_{n+1})', 'Error ea (%)'];
        const rows = result.iterations.map(it => [
            it.iter, this.fmt(it.xPrev, 6), this.fmt(it.xCurr, 6), this.fmt(it.fPrev, 5), this.fmt(it.fCurr, 5),
            this.fmt(it.xNext), this.fmt(it.fNext, 5), `${this.fmt(it.error, 6)}%`
        ]);
        this.renderTable(headers, rows);
        this.renderSolution(result.stopReason);

        this.setupStepper(result.iterations, {
            unit: 'Iteración',
            describe: (it, i, steps) => [
                this.L(`Iteración ${it.iter}:`, `x_{n−1} = ${this.fmt(it.xPrev)}, x_n = ${this.fmt(it.xCurr)}`),
                this.L('Evaluaciones:', `f(x_{n−1}) = ${this.fmt(it.fPrev)}, f(x_n) = ${this.fmt(it.fCurr)}`),
                this.L('Fórmula:', `x_{n+1} = x_n − f(x_n)(x_{n−1} − x_n)/(f(x_{n−1}) − f(x_n))`),
                this.L('Sustitución:', `x_{n+1} = ${this.fmt(it.xCurr)} − ${this.par(it.fCurr)}·(${this.fmt(it.xPrev)} − ${this.par(it.xCurr)})/(${this.fmt(it.fPrev)} − ${this.par(it.fCurr)}) = <span class="hl">${this.fmt(it.xNext)}</span>`),
                this.L('f(x_{n+1}):', this.fmt(it.fNext)),
                this.L('Error:', `ea = |(${this.fmt(it.xNext)} − ${this.par(it.xCurr)})/${this.par(it.xNext)}|·100 = <span class="hl">${this.fmt(it.error, 6)} %</span>`),
                this.criterionLine(it, i, steps.length, it.error),
                i + 1 < steps.length ? this.L('Actualización:', 'x_{n−1} ← x_n, x_n ← x_{n+1}') : ''
            ].join(''),
            mark: (it) => {
                Plotter.setOverlay('right-chart-container', [
                    Plotter.segment(it.xPrev, it.fPrev, it.xNext, 0, '#39ff7a', 'dot'),
                    Plotter.dot(it.xPrev, it.fPrev, '#a855f7', 'x_{n−1}'),
                    Plotter.dot(it.xCurr, it.fCurr, '#eab308', 'x_n'),
                    Plotter.dot(it.xNext, 0, '#ff2fb3', 'x_{n+1}')
                ]);
                Plotter.setOverlay('left-chart-container', [Plotter.vLine(it.iter, '#ff2fb3', null, 'dot')]);
            }
        });
    },

    // 3. Newton-Raphson
    executeNewtonRaphson: async function() {
        const fnStr = this.val('fn');
        const dfnStr = this.val('dfn').trim();
        const x0 = this.num('x0');
        const stop = this.iterPayload();
        const result = await this.callApi(Api.newtonRaphson(Object.assign({ funcion: fnStr, derivada: dfnStr || null, x0: x0 }, stop)));
        const fn = MathEngine.createFunction1D(fnStr);
        this.ctx = { mode: stop.criterio, tol: stop.tolerancia, N: stop.max_iter };

        this.renderKPIs([
            { title: 'Raíz Aproximada', value: this.fmt(result.root), highlight: true },
            { title: 'f(xr) Residuo', value: this.fmt(result.fRoot, 4) },
            { title: 'Iteraciones', value: result.totalIter },
            { title: 'Error ea (%)', value: `${this.fmt(result.finalError, 4)} %` }
        ]);

        document.getElementById('left-chart-title').innerText = 'Error aproximado vs iteración (escala log)';
        document.getElementById('right-chart-title').innerText = 'Función, rectas tangentes y raíz';
        Plotter.plotErrorLog('left-chart-container', result.iterations);
        const range = this.openRange(result.iterations.flatMap(it => [it.xCurr, it.xNext]), x0);
        Plotter.plotFunctionAndRoot('right-chart-container', fn, result.root, result.fRoot, range[0], range[1], { hideBounds: true });

        const headers = ['Iter', 'x_n', 'f(x_n)', "f'(x_n)", 'x_{n+1}', 'f(x_{n+1})', 'Error ea (%)'];
        const rows = result.iterations.map(it => [
            it.iter, this.fmt(it.xCurr, 6), this.fmt(it.fx, 5), this.fmt(it.dfx, 5), this.fmt(it.xNext), this.fmt(it.fNext, 5), `${this.fmt(it.error, 6)}%`
        ]);
        this.renderTable(headers, rows);
        this.renderSolution(result.stopReason, `
            <div class="dark-card p-3 text-xs">
                <span class="text-slate-400 uppercase font-bold block mb-0.5">Derivada empleada:</span>
                <span class="font-mono text-amber-300">${result.derivativeUsed}</span>
            </div>`);

        this.setupStepper(result.iterations, {
            unit: 'Iteración',
            describe: (it, i, steps) => [
                this.L(`Iteración ${it.iter}:`, `x_n = ${this.fmt(it.xCurr)}`),
                this.L('Evaluaciones:', `f(x_n) = ${this.fmt(it.fx)}, f'(x_n) = ${this.fmt(it.dfx)}`),
                this.L('Sustitución:', `x_{n+1} = x_n − f(x_n)/f'(x_n) = ${this.fmt(it.xCurr)} − ${this.par(it.fx)}/${this.par(it.dfx)} = <span class="hl">${this.fmt(it.xNext)}</span>`),
                this.L('f(x_{n+1}):', this.fmt(it.fNext)),
                this.L('Error:', `ea = |(${this.fmt(it.xNext)} − ${this.par(it.xCurr)})/${this.par(it.xNext)}|·100 = <span class="hl">${this.fmt(it.error, 6)} %</span>`),
                this.criterionLine(it, i, steps.length, it.error)
            ].join(''),
            mark: (it) => {
                Plotter.setOverlay('right-chart-container', [
                    Plotter.segment(it.xCurr, it.fx, it.xNext, 0, '#39ff7a', 'dot'),
                    Plotter.segment(it.xCurr, 0, it.xCurr, it.fx, '#eab308', 'dash', 1.2),
                    Plotter.dot(it.xCurr, it.fx, '#eab308', 'x_n'),
                    Plotter.dot(it.xNext, 0, '#ff2fb3', 'x_{n+1}')
                ]);
                Plotter.setOverlay('left-chart-container', [Plotter.vLine(it.iter, '#ff2fb3', null, 'dot')]);
            }
        });
    },

    // 4. Integración Numérica
    executeIntegration: async function(methodId) {
        const fnStr = this.val('fn');
        const a = this.num('a');
        const b = this.num('b');
        const exactInput = this.val('exactVal').trim();
        const exactVal = exactInput !== '' ? parseFloat(exactInput) : null;
        const mode = this.getSolveMode();
        const payload = {
            funcion: fnStr, a: a, b: b, valor_exacto: exactVal, criterio: mode,
            n: mode === 'n' ? this.int('n') : 6,
            tolerancia: mode === 'tol' ? this.num('tol') : 1e-4,
            max_iter: mode === 'tol' ? this.int('maxIter') : 500
        };
        const call = methodId === 'trapezoidal' ? Api.trapecio(payload)
            : methodId === 'simpson13' ? Api.simpson13(payload)
            : Api.simpson38(payload);
        const result = await this.callApi(call);
        const fn = MathEngine.createFunction1D(fnStr);
        this.ctx = { mode: mode === 'tol' ? 'tol' : 'n', tol: payload.tolerancia };

        const coefText = methodId === 'trapezoidal' ? 'h' : methodId === 'simpson13' ? 'h/3' : '3h/8';
        const coef = methodId === 'trapezoidal' ? 1 : methodId === 'simpson13' ? 1 / 3 : 3 / 8;
        const weightWhy = (p, n) => {
            if (p.i === 0 || p.i === n) return methodId === 'trapezoidal' ? 'extremo → ½' : 'extremo → 1';
            if (methodId === 'trapezoidal') return 'interior → 1';
            if (methodId === 'simpson13') return p.i % 2 ? 'índice impar → 4' : 'índice par → 2';
            return p.i % 3 === 0 ? 'múltiplo de 3 → 2' : 'no múltiplo de 3 → 3';
        };

        this.renderKPIs([
            { title: 'Integral (I)', value: this.fmt(result.integral), highlight: true },
            { title: 'Paso (h)', value: this.fmt(result.h, 6) },
            { title: 'Subintervalos (n)', value: result.n },
            { title: result.isTrueError ? 'Error Verdadero (%)' : 'Error Estimado (%)', value: `${this.fmt(result.errorPct, 4)} %` }
        ]);

        document.getElementById('right-chart-title').innerText = `Área bajo la curva (n = ${result.n})`;
        Plotter.plotIntegrationDual('left-chart-container', 'right-chart-container', fn, a, b, result);

        if (mode === 'tol') {
            // Forma por tolerancia: tabla y recorrido sobre cada n probado
            document.getElementById('left-chart-title').innerText = 'Error (%) vs n (escala log)';
            Plotter.plotLine('left-chart-container', result.iterations.map(h => h.n), result.iterations.map(h => h.error), 'n subintervalos', 'Error (%)', 'Error', true);
            const headers = ['Cálculo', 'n', 'h', 'I_n', exactVal !== null ? 'Error verdadero (%)' : 'Error aprox. (%)'];
            const rows = result.iterations.map(h => [h.iter, h.n, this.fmt(h.h, 6), this.fmt(h.integral, 8), h.error === null ? '—' : `${this.fmt(h.error, 6)}%`]);
            this.renderTable(headers, rows);
            this.renderSolution(result.stopReason, `
                <div class="dark-card p-3 text-xs font-mono">
                    <span class="text-slate-400 uppercase font-bold block mb-1 font-sans">Resultado final</span>
                    <span class="text-cyan-300">I = (${coefText})·Σ wᵢ·f(xᵢ) = ${this.fmt(coef * result.h)}·${this.fmt(result.weightedSum)} = <b>${this.fmt(result.integral, 10)}</b></span>
                    <span class="block text-indigo-200 mt-1">${result.type} · ${result.iterations.length} valores de n probados</span>
                </div>`);
            this.setupStepper(result.iterations, {
                unit: 'Cálculo',
                describe: (h, i, steps) => [
                    this.L(`Cálculo ${h.iter}:`, `n = ${h.n} → h = (b − a)/n = (${this.fmt(b)} − ${this.par(a)})/${h.n} = ${this.fmt(h.h)}`),
                    this.L('Integral:', `I_${h.n} = (${coefText})·Σ wᵢ·f(xᵢ) = <span class="hl">${this.fmt(h.integral, 10)}</span>`),
                    this.L('Error:', h.error === null ? '— (no hay valor exacto ni aproximación anterior todavía)'
                        : exactVal !== null
                            ? `|(I_n − exacto)/exacto|·100 = |(${this.fmt(h.integral, 10)} − ${this.par(exactVal, 10)})/${this.par(exactVal, 10)}|·100 = <span class="hl">${this.fmt(h.error, 6)} %</span>`
                            : `|(I_n − I_anterior)/I_n|·100 = <span class="hl">${this.fmt(h.error, 6)} %</span>`),
                    this.criterionLine(h, i, steps.length, h.error),
                    i + 1 < steps.length ? this.L('Siguiente:', `n ← n + ${steps[1] ? steps[1].n - steps[0].n : 1}`) : ''
                ].join(''),
                mark: (h) => Plotter.setOverlay('left-chart-container', [Plotter.vLine(h.n, '#ff2fb3', `n=${h.n}`, 'dot')])
            });
        } else {
            // Forma n fijo: recorrido nodo por nodo
            document.getElementById('left-chart-title').innerText = 'Evaluación en Nodos';
            const headers = ['Punto (i)', 'x_i', 'f(x_i)', 'Peso (w_i)', 'Término (w_i · f_i)', 'Σ acumulada'];
            let acc = 0;
            const accs = result.points.map(p => (acc += p.term));
            const rows = result.points.map((p, i) => [p.i, this.fmt(p.xi, 6), this.fmt(p.fxi, 6), p.factor, this.fmt(p.term, 6), this.fmt(accs[i], 6)]);
            this.renderTable(headers, rows);
            this.renderSolution(result.stopReason, `
                <div class="dark-card p-3 text-xs font-mono">
                    <span class="text-slate-400 uppercase font-bold block mb-1 font-sans">${result.type}</span>
                    <span class="text-cyan-300">I = (${coefText})·Σ wᵢ·f(xᵢ) = ${this.fmt(coef * result.h)}·${this.fmt(result.weightedSum)} = <b>${this.fmt(result.integral, 10)}</b></span>
                </div>`);
            const n = result.n;
            this.setupStepper(result.points, {
                unit: 'Nodo',
                describe: (p, i, steps) => [
                    this.L(`Nodo i = ${p.i}:`, `x_i = a + i·h = ${this.fmt(a)} + ${p.i}·${this.fmt(result.h)} = ${this.fmt(p.xi)}`),
                    this.L('Evaluación:', `f(x_${p.i}) = ${this.fmt(p.fxi)}`),
                    this.L('Peso:', `w_${p.i} = ${p.factor} (${weightWhy(p, n)})`),
                    this.L('Término:', `w_i·f(x_i) = ${p.factor}·${this.par(p.fxi)} = ${this.fmt(p.term)}`),
                    this.L('Suma acumulada:', `Σ = <span class="hl">${this.fmt(accs[i])}</span>`),
                    i === steps.length - 1 ? this.L('Resultado:', `I = (${coefText})·Σ = ${this.fmt(coef * result.h)}·${this.fmt(accs[i])} = <span class="ok">${this.fmt(result.integral, 10)}</span>`) : ''
                ].join(''),
                mark: (p) => Plotter.setOverlay('right-chart-container', [Plotter.vLine(p.xi, '#ff2fb3', `x_${p.i}`, 'dot'), Plotter.dot(p.xi, p.fxi, '#ff2fb3')])
            });
        }
    },

    matrixHTML: function(M) {
        const n = M.length;
        let html = '<table class="matrix-mini">';
        M.forEach(row => {
            html += '<tr>';
            row.forEach((v, j) => {
                html += `<td class="${j === n ? 'aug' : ''}">${this.fmt(v, 5)}</td>`;
            });
            html += '</tr>';
        });
        return html + '</table>';
    },

    // 5. Interpolación Directa
    executeDirectInterpolation: async function() {
        const evalVal = this.val('evalX');
        const evalX = evalVal !== '' ? parseFloat(evalVal) : null;
        const metodo = this.getSolveMode();
        const points = this.parsePointsText(this.val('points'));
        const result = await this.callApi(Api.interpolacionDirecta({ puntos: points, x_eval: evalX, metodo: metodo }));
        result.polyFunction = Api.polinomio(result.coefficients);

        this.renderKPIs([
            { title: 'Grado Polinomio', value: result.degree, highlight: true },
            { title: 'Cant. Puntos', value: result.points.length },
            { title: evalX !== null ? `P(${evalX})` : 'P(x) Listo', value: result.evaluation ? this.fmt(result.evaluation.y) : 'OK' },
            { title: 'Condición', value: result.evaluation && result.evaluation.isExtrapolation ? 'Extrapolación' : 'Interpolación' }
        ]);

        document.getElementById('left-chart-title').innerText = 'Valores Muestrales Y_i';
        document.getElementById('right-chart-title').innerText = 'Puntos y Polinomio Interpolador P(x)';
        Plotter.plotFittingDual('left-chart-container', 'right-chart-container', result.points, result.polyFunction, false, [], result.evaluation);

        const coefList = result.coefficients.map((c, j) => `a${j} = ${this.fmt(c)}`).join(', ');
        const ev = result.evaluation;
        const compare = ev ? `
            <div class="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
                <div class="${metodo === 'vandermonde' ? 'text-amber-300' : 'text-indigo-200'}">Vandermonde: P(${ev.x}) = ${this.fmt(ev.yVandermonde, 10)}</div>
                <div class="${metodo === 'lagrange' ? 'text-amber-300' : 'text-indigo-200'}">Lagrange: P(${ev.x}) = ${this.fmt(ev.yLagrange, 10)}</div>
            </div>
            <p class="text-[11px] text-emerald-400 mt-1">Diferencia entre ambas formas: ${MathEngine.formatNum(Math.abs(ev.yVandermonde - ev.yLagrange), 3)}</p>` : '';
        this.renderSolution(result.stopReason, `
            <div class="dark-card p-3">
                <span class="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Polinomio Interpolante P(x):</span>
                <span class="font-mono text-cyan-300 font-bold text-sm overflow-x-auto block">${result.polyString}</span>
                <span class="font-mono text-[11px] text-indigo-200 block mt-1">${coefList}</span>
                ${compare}
                ${ev && ev.isExtrapolation ? '<p class="text-xs text-amber-400 mt-1">⚠️ El valor x solicitado está fuera del rango de datos (extrapolación).</p>' : ''}
            </div>`);

        if (metodo === 'vandermonde') {
            const headers = ['Paso', 'Operación de fila'];
            const rows = result.iterations.map((s, i) => [i + 1, s.operacion]);
            this.renderTable(headers, rows);
            this.setupStepper(result.iterations, {
                unit: 'Paso',
                title: 'Gauss-Jordan sobre el sistema de Vandermonde',
                describe: (s, i, steps) => [
                    this.L(`Paso ${i + 1}:`, s.operacion),
                    `<div class="overflow-x-auto">${this.matrixHTML(s.matriz)}</div>`,
                    i === steps.length - 1 ? this.L('Solución:', `la última columna contiene los coeficientes → <span class="ok">${coefList}</span>`) : ''
                ].join(''),
                mark: () => {}
            });
        } else {
            const headers = ['i', 'x_i', 'y_i', 'L_i(x*)', 'y_i·L_i(x*)', 'P(x*) acumulado'];
            const rows = result.iterations.map(b => [b.i, this.fmt(b.xi, 5), this.fmt(b.yi, 5), this.fmt(b.Li, 6), this.fmt(b.termValue, 6), this.fmt(b.acumulado, 6)]);
            this.renderTable(headers, rows);
            this.setupStepper(result.iterations, {
                unit: 'Término',
                title: 'Construcción de Lagrange término a término',
                describe: (b, i, steps) => [
                    this.L(`Término i = ${b.i}:`, `(x_i, y_i) = (${this.fmt(b.xi)}, ${this.fmt(b.yi)})`),
                    this.L('Base:', `L_${b.i}(x*) = ${b.factores} = ${this.fmt(b.Li)}`),
                    this.L('Término:', `y_i·L_i(x*) = ${this.fmt(b.yi)}·${this.par(b.Li)} = ${this.fmt(b.termValue)}`),
                    this.L('Suma parcial:', `P(x*) ≈ <span class="hl">${this.fmt(b.acumulado)}</span>`),
                    i === steps.length - 1 ? this.L('Resultado:', `<span class="ok">P(${ev.x}) = ${this.fmt(ev.y)}</span>`) : ''
                ].join(''),
                mark: (b) => Plotter.setOverlay('right-chart-container', [Plotter.vLine(b.xi, '#ff2fb3', `x_${b.i}`, 'dot'), Plotter.dot(b.xi, b.yi, '#ff2fb3')])
            });
        }
    },

    // 6. Mínimos Cuadrados
    executeLeastSquares: async function() {
        const solveMode = this.getSolveMode();
        const evalVal = this.val('evalX');
        const evalX = evalVal !== '' ? parseFloat(evalVal) : null;
        const points = this.parsePointsText(this.val('points'));
        const payload = solveMode === 'auto'
            ? { puntos: points, modo: 'auto', x_eval: evalX, grado_max: this.int('gradoMax'), mejora_min: this.num('mejoraMin') }
            : { puntos: points, modo: this.val('mode'), grado: this.int('degree'), x_eval: evalX };
        const result = await this.callApi(Api.minimosCuadrados(payload));
        result.modelFunction = Api.polinomio(result.coefficients);

        this.renderKPIs([
            { title: 'Coef. R²', value: `${(result.r2 * 100).toFixed(2)} %`, highlight: true },
            { title: solveMode === 'auto' ? 'Grado elegido' : 'Correlación (r)', value: solveMode === 'auto' ? result.degree : this.fmt(result.r, 4) },
            { title: 'Error Estándar Sy/x', value: this.fmt(result.syx, 4) },
            { title: 'RMSE', value: this.fmt(result.rmse, 4) }
        ]);

        document.getElementById('right-chart-title').innerText = 'Datos Muestrales y Curva Ajustada';
        Plotter.plotFittingDual('left-chart-container', 'right-chart-container', result.points, result.modelFunction, true, result.tableRows, result.evaluation);

        const ne = result.normalEquations;
        const neHTML = ne ? `
            <div class="mt-2">
                <span class="text-[11px] text-slate-400 font-bold uppercase block">Ecuaciones normales [Σxʲ⁺ᵏ | Σxʲ·y] → (${ne.incognitas.join(', ')})</span>
                <div class="overflow-x-auto">${this.matrixHTML(ne.A.map((row, j) => [...row, ne.B[j]]))}</div>
            </div>` : '';
        this.renderSolution(result.stopReason, `
            <div class="dark-card p-3">
                <span class="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Ecuación Ajustada:</span>
                <span class="font-mono text-cyan-300 font-bold text-sm block mb-1">${result.equationString}</span>
                <span class="font-mono text-[11px] text-indigo-200 block">St = ${this.fmt(result.St, 5)}, Sr = ${this.fmt(result.Sr, 5)}, R² = (St − Sr)/St = ${this.fmt(result.r2, 6)}</span>
                ${result.evaluation ? `<p class="text-xs text-emerald-400 font-mono mt-1">Estimación en x = ${result.evaluation.x}: ŷ = ${this.fmt(result.evaluation.y, 6)}</p>` : ''}
                ${neHTML}
            </div>`);

        const model = result.modelFunction;
        if (solveMode === 'auto') {
            document.getElementById('left-chart-title').innerText = 'RMSE vs grado del polinomio';
            Plotter.plotLine('left-chart-container', result.degreeComparison.map(d => d.grado), result.degreeComparison.map(d => d.rmse), 'Grado del polinomio', 'Error (RMSE)', 'RMSE');
            const headers = ['Grado', 'RMSE', 'R²', 'Mejora RMSE (%)', 'Elegido'];
            const rows = result.degreeComparison.map(d => [d.grado, this.fmt(d.rmse, 6), this.fmt(d.r2, 6), d.mejora === null ? '—' : `${this.fmt(d.mejora, 4)}%`, d.elegido ? '★ Sí' : '']);
            this.renderTable(headers, rows);
            const thr = this.num('mejoraMin');
            this.setupStepper(result.degreeComparison, {
                unit: 'Grado',
                title: 'Selección del grado (Taller 2)',
                start: result.degree - 1,
                describe: (d) => [
                    this.L(`Grado g = ${d.grado}:`, `coef = np.polyfit(x, y, ${d.grado})`),
                    this.L('RMSE:', `√(Σ(yᵢ − ŷᵢ)²/N) = <span class="hl">${this.fmt(d.rmse, 6)}</span>, R² = ${this.fmt(d.r2, 6)}`),
                    this.L('Mejora:', d.mejora === null ? '— (grado inicial de referencia)' : `(RMSE_{g−1} − RMSE_g)/RMSE_1·100 = ${this.fmt(d.mejora, 4)} % ${d.mejora < thr ? `< ${thr} % <span class="warn">→ casi no mejora</span>` : `≥ ${thr} % <span class="ok">→ vale la pena subir de grado</span>`}`),
                    d.elegido ? this.L('Decisión:', `<span class="ok">★ grado elegido = ${d.grado}</span>`) : ''
                ].join(''),
                mark: (d) => Plotter.setOverlay('left-chart-container', [Plotter.vLine(d.grado, '#ff2fb3', `g=${d.grado}`, 'dot')])
            });
        } else {
            document.getElementById('left-chart-title').innerText = 'Residuos del Modelo (e_i)';
            const headers = ['i', 'x_i', 'y_i', 'ŷ_i (Modelo)', 'e_i (Residuo)', 'e_i²', '(y_i - ȳ)²', 'Sr acumulado'];
            const rows = result.tableRows.map(r => [r.i, this.fmt(r.x, 4), this.fmt(r.y, 4), this.fmt(r.yPred, 5), this.fmt(r.residual, 5), this.fmt(r.residualSq, 6), this.fmt(r.devMeanSq, 6), this.fmt(r.SrAcum, 6)]);
            this.renderTable(headers, rows);
            this.setupStepper(result.tableRows, {
                unit: 'Punto',
                title: 'Cálculo de residuos punto por punto',
                describe: (r, i, steps) => [
                    this.L(`Punto ${r.i}:`, `(x, y) = (${this.fmt(r.x)}, ${this.fmt(r.y)})`),
                    this.L('Modelo:', `ŷ = ${result.equationString.replace('y = ', '')} evaluado en x = ${this.fmt(r.x)} → ŷ = ${this.fmt(r.yPred)}`),
                    this.L('Residuo:', `e = y − ŷ = ${this.fmt(r.y)} − ${this.par(r.yPred)} = <span class="hl">${this.fmt(r.residual)}</span>`),
                    this.L('Cuadrados:', `e² = ${this.fmt(r.residualSq)}, (y − ȳ)² = ${this.fmt(r.devMeanSq)}`),
                    this.L('Sr acumulado:', this.fmt(r.SrAcum)),
                    i === steps.length - 1 ? this.L('Resultado:', `<span class="ok">Sr = ${this.fmt(result.Sr)}, R² = ${this.fmt(result.r2)}</span>`) : ''
                ].join(''),
                mark: (r) => {
                    Plotter.setOverlay('right-chart-container', [Plotter.segment(r.x, r.y, r.x, model(r.x), '#ff2fb3', 'solid', 2.5), Plotter.dot(r.x, r.y, '#ff2fb3', `e=${this.fmt(r.residual, 3)}`)]);
                    Plotter.setOverlay('left-chart-container', [Plotter.vLine(r.x, '#ff2fb3', null, 'dot')]);
                }
            });
        }
    },

    // 7. Sección Dorada 1D
    executeGoldenSection1D: async function() {
        const fnStr = this.val('fn');
        const a = this.num('a');
        const b = this.num('b');
        const type = this.val('type');
        const stop = this.iterPayload();
        const result = await this.callApi(Api.seccionDorada1D(Object.assign({ funcion: fnStr, a: a, b: b, tipo: type }, stop)));
        const fn = MathEngine.createFunction1D(fnStr);
        this.ctx = { mode: stop.criterio, tol: stop.tolerancia, N: stop.max_iter };

        this.renderKPIs([
            { title: `Óptimo x* (${type === 'min' ? 'Mín' : 'Máx'})`, value: this.fmt(result.optimumX), highlight: true },
            { title: 'f(x*) en Óptimo', value: this.fmt(result.optimumF, 6) },
            { title: 'Iteraciones', value: result.totalIter },
            { title: 'Error ea (%)', value: `${this.fmt(result.finalError, 4)} %` }
        ]);

        document.getElementById('left-chart-title').innerText = 'Error ea (%) vs iteración';
        document.getElementById('right-chart-title').innerText = 'Función, intervalo y óptimo';
        Plotter.plotGolden1DDual('left-chart-container', 'right-chart-container', fn, a, b, result);

        const headers = ['Iter', 'x_l', 'x_1', 'x_2', 'x_u', 'f(x_1)', 'f(x_2)', 'x_opt', 'f(x_opt)', 'Ancho (x_u - x_l)', 'ea (%)'];
        const rows = result.iterations.map(it => [
            it.iter, this.fmt(it.xl, 6), this.fmt(it.x1, 6), this.fmt(it.x2, 6), this.fmt(it.xu, 6),
            this.fmt(it.fx1, 6), this.fmt(it.fx2, 6), this.fmt(it.xOpt), this.fmt(it.fOpt, 6),
            this.fmt(it.intervalWidth, 6), it.error === null ? '—' : `${this.fmt(it.error, 6)}%`
        ]);
        this.renderTable(headers, rows);
        this.renderSolution(result.stopReason, `
            <div class="dark-card p-3 text-xs font-mono">
                <span class="text-slate-400 uppercase font-bold block mb-1 font-sans">Intervalo final de incertidumbre</span>
                <span class="text-cyan-300">[${this.fmt(result.finalInterval[0])}, ${this.fmt(result.finalInterval[1])}] · ancho = ${this.fmt(result.intervalWidth)}</span>
            </div>`);

        const R = (Math.sqrt(5) - 1) / 2;
        const better = (f1, f2) => type === 'min' ? f1 < f2 : f1 > f2;
        this.setupStepper(result.iterations, {
            unit: 'Iteración',
            describe: (it, i, steps) => {
                const prev = i > 0 ? steps[i - 1] : null;
                let why = '';
                if (prev) {
                    why = better(prev.fx1, prev.fx2)
                        ? `en la iteración anterior f(x_1) ${type === 'min' ? '<' : '>'} f(x_2) → se descartó [x_2, x_u] ⇒ x_u = x_2, x_2 = x_1`
                        : `en la iteración anterior f(x_1) ${type === 'min' ? '≥' : '≤'} f(x_2) → se descartó [x_l, x_1] ⇒ x_l = x_1, x_1 = x_2`;
                }
                return [
                    this.L(`Iteración ${it.iter}:`, `intervalo [x_l, x_u] = [${this.fmt(it.xl)}, ${this.fmt(it.xu)}]`),
                    why ? this.L('Reducción:', why) : this.L('Reducción:', `primera reducción del intervalo inicial [${this.fmt(a)}, ${this.fmt(b)}]`),
                    this.L('Distancia:', `d = R·(x_u − x_l) = 0.618034·${this.fmt(it.intervalWidth)} = ${this.fmt(R * it.intervalWidth)}`),
                    this.L('Puntos:', `x_1 = x_u − d = ${this.fmt(it.x1)}, x_2 = x_l + d = ${this.fmt(it.x2)}`),
                    this.L('Evaluaciones:', `f(x_1) = ${this.fmt(it.fx1)}, f(x_2) = ${this.fmt(it.fx2)} → x_opt = <span class="hl">${this.fmt(it.xOpt)}</span> (f = ${this.fmt(it.fOpt)})`),
                    this.L('Error:', `ea = (1 − R)·|(x_u − x_l)/x_opt|·100 = 0.381966·|${this.fmt(it.intervalWidth)}/${this.par(it.xOpt)}|·100 = <span class="hl">${this.fmt(it.error, 6)} %</span>`),
                    this.criterionLine(it, i, steps.length, it.error)
                ].join('');
            },
            mark: (it) => {
                Plotter.setOverlay('right-chart-container', [
                    Plotter.band(it.xl, it.xu, 'rgba(255, 210, 63, 0.10)'),
                    Plotter.vLine(it.xl, '#eab308', 'x_l'),
                    Plotter.vLine(it.x1, '#39ff7a', 'x_1', 'dot'),
                    Plotter.vLine(it.x2, '#2ff3ff', 'x_2', 'dot'),
                    Plotter.vLine(it.xu, '#a855f7', 'x_u'),
                    Plotter.dot(it.xOpt, it.fOpt, '#ff2fb3')
                ]);
                Plotter.setOverlay('left-chart-container', [Plotter.vLine(it.iter, '#ff2fb3', null, 'dot')]);
            }
        });
    },

    // 8. Sección Dorada 2D
    executeGoldenSection2D: async function() {
        const fnStr = this.val('fn2D');
        const xMin = this.num('xMin'), xMax = this.num('xMax'), yMin = this.num('yMin'), yMax = this.num('yMax');
        const type = this.val('type');
        const mode = this.getSolveMode();
        const payload = {
            funcion: fnStr, x0: this.num('x0'), y0: this.num('y0'), x_min: xMin, x_max: xMax, y_min: yMin, y_max: yMax,
            tipo: type, orden: this.val('coordOrder'), criterio: mode === 'iter' ? 'iter' : 'tol',
            tolerancia: mode === 'iter' ? 1e-12 : this.num('tol'),
            max_ciclos: mode === 'iter' ? this.int('nCycles') : this.int('maxCycles')
        };
        const result = await this.callApi(Api.seccionDorada2D(payload));
        const fn2D = MathEngine.createFunction2D(fnStr);
        this.ctx = { mode: payload.criterio, tol: payload.tolerancia, N: payload.max_ciclos };

        this.renderKPIs([
            { title: 'Coordenada x*', value: this.fmt(result.optimum.x), highlight: true },
            { title: 'Coordenada y*', value: this.fmt(result.optimum.y) },
            { title: 'f(x*, y*) Óptimo', value: this.fmt(result.optimum.f, 6) },
            { title: 'Ciclos Realizados', value: result.totalCycles }
        ]);

        document.getElementById('left-chart-title').innerText = 'Error relativo (%) vs ciclo';
        document.getElementById('right-chart-title').innerText = 'Curvas de Nivel y Trayectoria';
        Plotter.plotGolden2DDual('left-chart-container', 'right-chart-container', fn2D, [xMin, xMax], [yMin, yMax], result);

        const headers = ['Ciclo', 'x', 'y', 'f(x, y)', '|Δf|', 'Paso Euclidiano', 'Error (%)'];
        const rows = result.iterations.map(it => [it.cycle, this.fmt(it.x), this.fmt(it.y), this.fmt(it.fval, 6), this.fmt(it.deltaF, 6), this.fmt(it.stepDist, 6), `${this.fmt(it.error, 6)}%`]);
        this.renderTable(headers, rows);
        this.renderSolution(result.stopReason);

        const traj = result.trajectory;
        this.setupStepper(result.iterations, {
            unit: 'Ciclo',
            describe: (it, i, steps) => {
                const moves = traj.filter(p => p.step === it.cycle);
                const prev = i > 0 ? steps[i - 1] : { x: traj[0].x, y: traj[0].y, fval: traj[0].z };
                return [
                    this.L(`Ciclo ${it.cycle}:`, `parte de (x, y) = (${this.fmt(prev.x)}, ${this.fmt(prev.y)}), f = ${this.fmt(prev.fval)}`),
                    ...moves.map(m => this.L(m.phase === 'X' ? 'Sección dorada en x:' : 'Sección dorada en y:',
                        m.phase === 'X' ? `y fija = ${this.fmt(m.y)} → x = <span class="hl">${this.fmt(m.x)}</span>, f = ${this.fmt(m.z)}`
                                        : `x fija = ${this.fmt(m.x)} → y = <span class="hl">${this.fmt(m.y)}</span>, f = ${this.fmt(m.z)}`)),
                    this.L('Cambio:', `|Δf| = ${this.fmt(it.deltaF)}, paso = √(Δx² + Δy²) = ${this.fmt(it.stepDist)}`),
                    this.L('Error:', `max(|Δx/x|, |Δy/y|)·100 = <span class="hl">${this.fmt(it.error, 6)} %</span>`),
                    this.criterionLine(it, i, steps.length, it.error)
                ].join('');
            },
            mark: (it) => {
                const shown = traj.filter(p => p.step <= it.cycle);
                const el = document.getElementById('right-chart-container');
                if (el && el.data) Plotly.restyle(el, { x: [shown.map(p => p.x)], y: [shown.map(p => p.y)] }, [1]);
                Plotter.setOverlay('right-chart-container', [Plotter.dot(it.x, it.y, '#ff2fb3', `ciclo ${it.cycle}`)]);
                Plotter.setOverlay('left-chart-container', [Plotter.vLine(it.cycle, '#ff2fb3', null, 'dot')]);
            }
        });
    },

    // ============================================================
    // RENDERIZADO COMÚN
    // ============================================================
    renderKPIs: function(kpis) {
        const container = document.getElementById('kpi-container');
        container.innerHTML = kpis.map(kpi => `
            <div class="kpi-dark-card ${kpi.highlight ? 'highlight' : ''}">
                <div class="kpi-dark-title">${kpi.title}</div>
                <div class="kpi-dark-value" title="${kpi.value}">${kpi.value}</div>
            </div>`).join('');
    },

    renderSolution: function(stopReason, extraHtml = '') {
        document.getElementById('custom-solution-container').innerHTML = `
            <div class="space-y-3 mb-4">
                ${stopReason ? `<div class="stop-reason"><i class="fas fa-flag-checkered"></i><span>${stopReason}</span></div>` : ''}
                ${extraHtml}
            </div>`;
    },

    renderTable: function(headers, rows) {
        this.currentTableHeaders = headers;
        this.currentTableRows = rows;
        document.getElementById('table-head').innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
        document.getElementById('table-body').innerHTML = rows.map((r, idx) =>
            `<tr onclick="App.goToStep(${idx})">${r.map(cell => `<td>${cell}</td>`).join('')}</tr>`
        ).join('');
    },

    // ============================================================
    // RECORRIDO PASO A PASO
    // ============================================================
    setupStepper: function(steps, opts = {}) {
        this.stopPlay();
        const panel = document.getElementById('stepper-panel');
        if (!steps || steps.length === 0) {
            this.stepper = null;
            panel.classList.add('hidden');
            return;
        }
        this.stepper = { steps: steps, describe: opts.describe, mark: opts.mark, unit: opts.unit || 'Iteración', idx: 0 };
        panel.classList.remove('hidden');
        document.getElementById('stepper-title').innerText = opts.title || `Recorrido ${(opts.unit || 'iteración').toLowerCase()} por ${(opts.unit || 'iteración').toLowerCase()}`;
        const range = document.getElementById('step-range');
        range.max = steps.length - 1;
        const start = opts.start !== undefined ? opts.start : steps.length - 1;
        // Mostrar el paso de inmediato y repetir tras el dibujo de Plotly para superponer marcadores
        this.goToStep(start);
        const current = this.stepper;
        setTimeout(() => { if (this.stepper === current) this.goToStep(current.idx); }, 50);
    },

    goToStep: function(idx) {
        const s = this.stepper;
        if (!s) return;
        const n = s.steps.length;
        idx = Math.max(0, Math.min(n - 1, idx));
        s.idx = idx;
        const step = s.steps[idx];

        document.getElementById('stepper-counter').innerText = `${s.unit} ${idx + 1} / ${n}`;
        document.getElementById('step-range').value = idx;
        document.getElementById('step-first').disabled = idx === 0;
        document.getElementById('step-prev').disabled = idx === 0;
        document.getElementById('step-next').disabled = idx === n - 1;
        document.getElementById('step-last').disabled = idx === n - 1;

        try {
            document.getElementById('step-detail').innerHTML = s.describe ? s.describe(step, idx, s.steps) : '';
        } catch (e) {
            console.error(e);
        }

        const rows = document.querySelectorAll('#table-body tr');
        rows.forEach(r => r.classList.remove('row-active'));
        const row = rows[idx];
        if (row) {
            row.classList.add('row-active');
            const container = row.closest('.table-dark-container');
            if (container) {
                const top = row.offsetTop - container.clientHeight / 2;
                container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
            }
        }

        try {
            if (s.mark) s.mark(step, idx, s.steps);
        } catch (e) {
            console.error(e);
        }
    },

    stepBy: function(delta) {
        if (!this.stepper) return;
        this.goToStep(this.stepper.idx + delta);
    },

    togglePlay: function() {
        if (this._playTimer) {
            this.stopPlay();
            return;
        }
        const s = this.stepper;
        if (!s) return;
        if (s.idx >= s.steps.length - 1) this.goToStep(0);
        const btn = document.getElementById('step-play');
        btn.classList.add('playing');
        btn.innerHTML = '<i class="fas fa-pause"></i>';
        this._playTimer = setInterval(() => {
            if (!this.stepper || this.stepper.idx >= this.stepper.steps.length - 1) {
                this.stopPlay();
                return;
            }
            this.stepBy(1);
        }, 1100);
    },

    stopPlay: function() {
        if (this._playTimer) clearInterval(this._playTimer);
        this._playTimer = null;
        const btn = document.getElementById('step-play');
        if (btn) {
            btn.classList.remove('playing');
            btn.innerHTML = '<i class="fas fa-play"></i>';
        }
    },

    setPrecision: function(prec) {
        this.decimalPrecision = prec;
        document.querySelectorAll('.prec-btn').forEach(btn => {
            btn.classList.toggle('active', Number(btn.dataset.prec) === prec);
        });
        this.calculateCurrent();
    },

    copyTableToClipboard: function() {
        if (!this.currentTableHeaders || !this.currentTableRows) return;
        const text = [this.currentTableHeaders.join('\t'), ...this.currentTableRows.map(r => r.join('\t'))].join('\n');
        navigator.clipboard.writeText(text).then(() => {
            alert('¡Tabla copiada al portapapeles exitosamente!');
        });
    },

    exportTableCSV: function() {
        if (!this.currentTableHeaders || !this.currentTableRows) return;
        const csvContent = 'data:text/csv;charset=utf-8,' + [
            this.currentTableHeaders.join(','),
            ...this.currentTableRows.map(r => r.map(c => `"${c}"`).join(','))
        ].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `metodo_${this.currentMethod}_${this.getSolveMode() || ''}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    setupEvents: function() {
        document.getElementById('method-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateCurrent();
        });
        // Flechas del teclado para recorrer iteraciones (fuera de campos de texto)
        document.addEventListener('keydown', (e) => {
            const tag = (e.target.tagName || '').toLowerCase();
            if (['input', 'textarea', 'select'].includes(tag) || !this.stepper) return;
            if (e.key === 'ArrowRight') { this.stepBy(1); e.preventDefault(); }
            if (e.key === 'ArrowLeft') { this.stepBy(-1); e.preventDefault(); }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
