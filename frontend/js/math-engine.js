// js/math-engine.js - Motor de Evaluación Matemática y Métodos Analíticos

const MathEngine = {
    // Evaluar de forma segura f(x)
    createFunction1D: function(exprString) {
        if (!exprString || typeof exprString !== 'string') {
            throw new Error("Debe proporcionar una expresión matemática válida.");
        }
        try {
            const compiled = math.compile(exprString.trim());
            return function(x) {
                try {
                    const res = compiled.evaluate({ x: x, e: Math.E, pi: Math.PI, PI: Math.PI });
                    if (typeof res === 'object' && res.im !== undefined) {
                        return NaN; // Número complejo
                    }
                    return Number(res);
                } catch (e) {
                    return NaN;
                }
            };
        } catch (err) {
            throw new Error(`Sintaxis no válida en f(x): ${err.message}`);
        }
    },

    // Evaluar de forma segura f(x, y)
    createFunction2D: function(exprString) {
        if (!exprString || typeof exprString !== 'string') {
            throw new Error("Debe proporcionar una expresión matemática de 2 variables f(x, y).");
        }
        try {
            const compiled = math.compile(exprString.trim());
            return function(x, y) {
                try {
                    const res = compiled.evaluate({ x: x, y: y, e: Math.E, pi: Math.PI, PI: Math.PI });
                    if (typeof res === 'object' && res.im !== undefined) {
                        return NaN;
                    }
                    return Number(res);
                } catch (e) {
                    return NaN;
                }
            };
        } catch (err) {
            throw new Error(`Sintaxis no válida en f(x, y): ${err.message}`);
        }
    },

    // Derivada analítica simbólica o null si no se puede derivar simbólicamente
    getDerivativeExpr: function(exprString, varName = 'x') {
        try {
            const parsed = math.parse(exprString);
            const derived = math.derivative(parsed, varName);
            return derived.toString();
        } catch (err) {
            return null;
        }
    },

    // Derivada numérica por diferencias centradas
    numericDerivative: function(fn, x, h = 1e-6) {
        const fPlus = fn(x + h);
        const fMinus = fn(x - h);
        if (isNaN(fPlus) || isNaN(fMinus)) {
            // Intentar paso hacia adelante
            return (fn(x + h) - fn(x)) / h;
        }
        return (fPlus - fMinus) / (2 * h);
    },

    // Formateo consistente de números
    formatNum: function(num, decimals = 6) {
        if (num === null || num === undefined || isNaN(num)) return 'N/A';
        if (!isFinite(num)) return num > 0 ? '+Inf' : '-Inf';
        if (Math.abs(num) < 1e-12 && num !== 0) return '0.000000';
        if (Math.abs(num) >= 1e6 || (Math.abs(num) < 1e-4 && num !== 0)) {
            return num.toExponential(4);
        }
        return Number(num.toFixed(decimals)).toString();
    },

    // Error relativo aproximado porcentual |(x_new - x_old) / x_new| * 100
    calcRelError: function(current, previous) {
        if (previous === null || previous === undefined) return 100;
        if (Math.abs(current) < 1e-12) {
            return Math.abs(current - previous) * 100;
        }
        return Math.abs((current - previous) / current) * 100;
    },

    // Solucionador de sistemas lineales A*x = b por eliminación Gauss-Jordan con pivoteo parcial
    solveLinearSystem: function(A, b) {
        const n = A.length;
        const M = A.map((row, i) => [...row, b[i]]);

        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
                    maxRow = k;
                }
            }
            [M[i], M[maxRow]] = [M[maxRow], M[i]];

            if (Math.abs(M[i][i]) < 1e-13) {
                throw new Error("El sistema de ecuaciones es singular o está mal condicionado (no posee solución única finita).");
            }

            const pivot = M[i][i];
            for (let j = i; j <= n; j++) {
                M[i][j] /= pivot;
            }

            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = M[k][i];
                    for (let j = i; j <= n; j++) {
                        M[k][j] -= factor * M[i][j];
                    }
                }
            }
        }

        return M.map(row => row[n]);
    }
};

// Exportar para Node.js si corre en testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathEngine;
}
