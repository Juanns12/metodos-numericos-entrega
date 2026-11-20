// js/plotter.js - Motor Gráfico Científico en Modo Oscuro con Plotly.js

const Plotter = {
    theme: {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: '#02041a',
        font: { family: 'Inter, system-ui, sans-serif', color: '#c7c2e8', size: 11 },
        gridcolor: '#16205a',
        linecolor: '#3b4a9a',
        zerolinecolor: '#6b4fb8'
    },

    // 1. Gráfica de convergencia de error (Escala logarítmica)
    plotErrorLog: function(containerId, iterations, customYTitle = 'ea (%)') {
        const xVals = [];
        const yVals = [];

        iterations.forEach(it => {
            const err = it.error !== undefined ? it.error : (it.stepDist !== undefined ? it.stepDist : null);
            if (err !== null && !isNaN(err) && err > 0) {
                xVals.push(it.iter || it.cycle);
                yVals.push(err);
            }
        });

        const traces = [
            {
                x: xVals,
                y: yVals,
                mode: 'lines+markers',
                name: customYTitle,
                line: { color: '#06b6d4', width: 2.2 },
                marker: { color: '#38bdf8', size: 6, line: { color: '#0891b2', width: 1.5 } }
            }
        ];

        const layout = {
            margin: { t: 25, r: 20, b: 35, l: 55 },
            paper_bgcolor: Plotter.theme.paper_bgcolor,
            plot_bgcolor: Plotter.theme.plot_bgcolor,
            font: Plotter.theme.font,
            xaxis: {
                title: { text: 'Iteración', font: { size: 10, color: '#94a3b8' } },
                gridcolor: Plotter.theme.gridcolor,
                linecolor: Plotter.theme.linecolor,
                zeroline: false
            },
            yaxis: {
                title: { text: customYTitle, font: { size: 10, color: '#94a3b8' } },
                type: 'log',
                gridcolor: Plotter.theme.gridcolor,
                linecolor: Plotter.theme.linecolor,
                autorange: true
            },
            legend: {
                orientation: 'h',
                x: 0.5,
                y: 1.15,
                xanchor: 'center',
                font: { color: '#cbd5e1' }
            }
        };

        Plotly.newPlot(containerId, traces, layout, { responsive: true, displayModeBar: false });
    },

    // 2. Gráfica de Función y Raíz Encontrada
    plotFunctionAndRoot: function(containerId, fn, root, fRoot, a, b, extraData = {}) {
        let xMin = (a !== undefined && !isNaN(a)) ? Math.min(a, root) : root - 2;
        let xMax = (b !== undefined && !isNaN(b)) ? Math.max(b, root) : root + 2;
        const span = Math.abs(xMax - xMin) || 2;
        xMin -= span * 0.25;
        xMax += span * 0.25;

        const N = 260;
        const dx = (xMax - xMin) / N;
        const xCurve = [];
        const yCurve = [];

        for (let i = 0; i <= N; i++) {
            const x = xMin + i * dx;
            try {
                const y = fn(x);
                if (!isNaN(y) && isFinite(y) && Math.abs(y) < 1e5) {
                    xCurve.push(x);
                    yCurve.push(y);
                }
            } catch (e) {}
        }

        const traces = [
            {
                x: xCurve,
                y: yCurve,
                mode: 'lines',
                name: 'f(x)',
                line: { color: '#0ea5e9', width: 2.5 }
            },
            // Raíz aproximada con punto rosa/rojo suave
            {
                x: [root],
                y: [fRoot],
                mode: 'markers',
                name: `Raíz ≈ ${root.toFixed(5)}`,
                marker: { color: '#f43f5e', size: 11, line: { color: '#ffffff', width: 2 } }
            },
            // Eje horizontal y=0
            {
                x: [xMin, xMax],
                y: [0, 0],
                mode: 'lines',
                showlegend: false,
                line: { color: '#334155', width: 1.2, dash: 'dot' },
                hoverinfo: 'none'
            }
        ];

        // Límites del intervalo si existen (los métodos abiertos no tienen intervalo)
        if (!extraData.hideBounds && a !== undefined && b !== undefined && !isNaN(a) && !isNaN(b)) {
            traces.push({
                x: [a, a],
                y: [Math.min(...yCurve), Math.max(...yCurve)],
                mode: 'lines',
                name: `a = ${a}`,
                line: { color: '#eab308', width: 1.2, dash: 'dash' }
            });
            traces.push({
                x: [b, b],
                y: [Math.min(...yCurve), Math.max(...yCurve)],
                mode: 'lines',
                name: `b = ${b}`,
                line: { color: '#a855f7', width: 1.2, dash: 'dash' }
            });
        }

        const layout = {
            margin: { t: 25, r: 20, b: 35, l: 45 },
            paper_bgcolor: Plotter.theme.paper_bgcolor,
            plot_bgcolor: Plotter.theme.plot_bgcolor,
            font: Plotter.theme.font,
            xaxis: {
                gridcolor: Plotter.theme.gridcolor,
                linecolor: Plotter.theme.linecolor,
                zeroline: false
            },
            yaxis: {
                title: { text: 'f(x)', font: { size: 10, color: '#94a3b8' } },
                gridcolor: Plotter.theme.gridcolor,
                linecolor: Plotter.theme.linecolor,
                zeroline: true,
                zerolinecolor: Plotter.theme.zerolinecolor
            },
            legend: {
                orientation: 'h',
                x: 0.5,
                y: 1.15,
                xanchor: 'center',
                font: { color: '#cbd5e1' }
            }
        };

        Plotly.newPlot(containerId, traces, layout, { responsive: true, displayModeBar: false });
    },

    // 3. Gráficas para Integración Numérica (Trapecio y Simpson)
    plotIntegrationDual: function(leftId, rightId, fn, a, b, result) {
        // Izquierda: Contribución y pesos de nodos
        const leftTraces = [
            {
                x: result.points.map(p => `P${p.i}`),
                y: result.points.map(p => p.fxi),
                type: 'bar',
                name: 'f(x_i)',
                marker: { color: '#06b6d4', line: { color: '#0891b2', width: 1 } }
            }
        ];

        const leftLayout = {
            margin: { t: 25, r: 20, b: 35, l: 45 },
            paper_bgcolor: Plotter.theme.paper_bgcolor,
            plot_bgcolor: Plotter.theme.plot_bgcolor,
            font: Plotter.theme.font,
            xaxis: { title: { text: 'Nodos de Evaluación', font: { size: 10, color: '#94a3b8' } } },
            yaxis: { title: { text: 'f(x_i)', font: { size: 10, color: '#94a3b8' } }, gridcolor: Plotter.theme.gridcolor },
            legend: { orientation: 'h', x: 0.5, y: 1.15, xanchor: 'center', font: { color: '#cbd5e1' } }
        };
        Plotly.newPlot(leftId, leftTraces, leftLayout, { responsive: true, displayModeBar: false });

        // Derecha: Curva y área bajo la curva sombreada
        const span = b - a;
        const xMin = a - span * 0.12;
        const xMax = b + span * 0.12;
        const N = 200;
        const dx = (xMax - xMin) / N;
        const xCurve = [];
        const yCurve = [];

        for (let i = 0; i <= N; i++) {
            const x = xMin + i * dx;
            try {
                const y = fn(x);
                xCurve.push(x);
                yCurve.push(y);
            } catch (e) {}
        }

        const xNodes = result.points.map(p => p.xi);
        const yNodes = result.points.map(p => p.fxi);

        const rightTraces = [
            {
                x: xCurve,
                y: yCurve,
                mode: 'lines',
                name: 'f(x)',
                line: { color: '#38bdf8', width: 2.5 }
            },
            {
                x: [a, ...xNodes, b],
                y: [0, ...yNodes, 0],
                fill: 'tozeroy',
                type: 'scatter',
                mode: 'lines',
                fillcolor: 'rgba(6, 182, 212, 0.22)',
                line: { color: 'rgba(6, 182, 212, 0.8)', width: 1.8 },
                name: `Área ≈ ${result.integral.toFixed(5)}`
            },
            {
                x: xNodes,
                y: yNodes,
                mode: 'markers',
                name: 'Nodos',
                marker: { color: '#f43f5e', size: 6 }
            }
        ];

        const rightLayout = {
            margin: { t: 25, r: 20, b: 35, l: 45 },
            paper_bgcolor: Plotter.theme.paper_bgcolor,
            plot_bgcolor: Plotter.theme.plot_bgcolor,
            font: Plotter.theme.font,
            xaxis: { gridcolor: Plotter.theme.gridcolor },
            yaxis: { title: { text: 'f(x)', font: { size: 10, color: '#94a3b8' } }, gridcolor: Plotter.theme.gridcolor },
            legend: { orientation: 'h', x: 0.5, y: 1.15, xanchor: 'center', font: { color: '#cbd5e1' } }
        };
        Plotly.newPlot(rightId, rightTraces, rightLayout, { responsive: true, displayModeBar: false });
    },

    // 4. Gráficas para Ajuste de Curvas (Interpolación y Regresión)
    plotFittingDual: function(leftId, rightId, points, modelFn, isRegression = false, residuals = [], evalResult = null) {
        // Izquierda: Gráfico de residuos
        if (isRegression && residuals.length > 0) {
            const leftTraces = [
                {
                    x: residuals.map(r => r.x),
                    y: residuals.map(r => r.residual),
                    type: 'bar',
                    name: 'Residuo e_i',
                    marker: { color: '#f43f5e' }
                }
            ];
            const leftLayout = {
                margin: { t: 25, r: 20, b: 35, l: 45 },
                paper_bgcolor: Plotter.theme.paper_bgcolor,
                plot_bgcolor: Plotter.theme.plot_bgcolor,
                font: Plotter.theme.font,
                xaxis: { title: { text: 'x_i', font: { size: 10, color: '#94a3b8' } } },
                yaxis: { title: { text: 'Residuo (y - ŷ)', font: { size: 10, color: '#94a3b8' } }, gridcolor: Plotter.theme.gridcolor },
                legend: { orientation: 'h', x: 0.5, y: 1.15, xanchor: 'center', font: { color: '#cbd5e1' } }
            };
            Plotly.newPlot(leftId, leftTraces, leftLayout, { responsive: true, displayModeBar: false });
        } else {
            // Para interpolación: Valores muestrales
            const leftTraces = [
                {
                    x: points.map((p, i) => `x${i}`),
                    y: points.map(p => p.y),
                    type: 'bar',
                    name: 'y_i',
                    marker: { color: '#06b6d4' }
                }
            ];
            const leftLayout = {
                margin: { t: 25, r: 20, b: 35, l: 45 },
                paper_bgcolor: Plotter.theme.paper_bgcolor,
                plot_bgcolor: Plotter.theme.plot_bgcolor,
                font: Plotter.theme.font,
                xaxis: { title: { text: 'Puntos dados', font: { size: 10, color: '#94a3b8' } } },
                yaxis: { title: { text: 'y', font: { size: 10, color: '#94a3b8' } }, gridcolor: Plotter.theme.gridcolor },
                legend: { orientation: 'h', x: 0.5, y: 1.15, xanchor: 'center', font: { color: '#cbd5e1' } }
            };
            Plotly.newPlot(leftId, leftTraces, leftLayout, { responsive: true, displayModeBar: false });
        }

        // Derecha: Puntos originales y curva interpolada o ajustada
        const xVals = points.map(p => p.x);
        let minX = Math.min(...xVals);
        let maxX = Math.max(...xVals);
        const span = maxX - minX || 2;
        minX -= span * 0.18;
        maxX += span * 0.18;

        const N = 200;
        const dx = (maxX - minX) / N;
        const xCurve = [];
        const yCurve = [];

        for (let i = 0; i <= N; i++) {
            const x = minX + i * dx;
            xCurve.push(x);
            yCurve.push(modelFn(x));
        }

        const rightTraces = [
            {
                x: xCurve,
                y: yCurve,
                mode: 'lines',
                name: isRegression ? 'Modelo Ajustado' : 'Polinomio P(x)',
                line: { color: '#38bdf8', width: 2.5 }
            },
            {
                x: points.map(p => p.x),
                y: points.map(p => p.y),
                mode: 'markers',
                name: 'Datos Originales',
                marker: { color: '#ffffff', size: 8, line: { color: '#0284c7', width: 2 } }
            }
        ];

        if (evalResult) {
            rightTraces.push({
                x: [evalResult.x],
                y: [evalResult.y],
                mode: 'markers',
                name: `P(${evalResult.x}) = ${evalResult.y.toFixed(4)}`,
                marker: { color: '#f43f5e', size: 12, symbol: 'star', line: { color: '#ffffff', width: 1.5 } }
            });
        }

        const rightLayout = {
            margin: { t: 25, r: 20, b: 35, l: 45 },
            paper_bgcolor: Plotter.theme.paper_bgcolor,
            plot_bgcolor: Plotter.theme.plot_bgcolor,
            font: Plotter.theme.font,
            xaxis: { gridcolor: Plotter.theme.gridcolor },
            yaxis: { title: { text: 'y', font: { size: 10, color: '#94a3b8' } }, gridcolor: Plotter.theme.gridcolor },
            legend: { orientation: 'h', x: 0.5, y: 1.15, xanchor: 'center', font: { color: '#cbd5e1' } }
        };
        Plotly.newPlot(rightId, rightTraces, rightLayout, { responsive: true, displayModeBar: false });
    },

    // 5. Gráficas para Optimización Univariada (1D)
    plotGolden1DDual: function(leftId, rightId, fn, a, b, result) {
        Plotter.plotErrorLog(leftId, result.iterations, 'Ancho intervalo / ea (%)');

        const span = b - a;
        const xMin = a - span * 0.18;
        const xMax = b + span * 0.18;
        const N = 200;
        const dx = (xMax - xMin) / N;
        const xCurve = [];
        const yCurve = [];

        for (let i = 0; i <= N; i++) {
            const x = xMin + i * dx;
            try {
                xCurve.push(x);
                yCurve.push(fn(x));
            } catch (e) {}
        }

        const rightTraces = [
            {
                x: xCurve,
                y: yCurve,
                mode: 'lines',
                name: 'f(x)',
                line: { color: '#38bdf8', width: 2.5 }
            },
            {
                x: [result.optimumX],
                y: [result.optimumF],
                mode: 'markers',
                name: `Óptimo x* ≈ ${result.optimumX.toFixed(4)}`,
                marker: { color: '#f43f5e', size: 12, symbol: 'diamond', line: { color: '#ffffff', width: 1.5 } }
            },
            {
                x: [a, a],
                y: [Math.min(...yCurve), Math.max(...yCurve)],
                mode: 'lines',
                name: `a = ${a}`,
                line: { color: '#eab308', width: 1, dash: 'dot' }
            },
            {
                x: [b, b],
                y: [Math.min(...yCurve), Math.max(...yCurve)],
                mode: 'lines',
                name: `b = ${b}`,
                line: { color: '#a855f7', width: 1, dash: 'dot' }
            }
        ];

        const rightLayout = {
            margin: { t: 25, r: 20, b: 35, l: 45 },
            paper_bgcolor: Plotter.theme.paper_bgcolor,
            plot_bgcolor: Plotter.theme.plot_bgcolor,
            font: Plotter.theme.font,
            xaxis: { gridcolor: Plotter.theme.gridcolor },
            yaxis: { title: { text: 'f(x)', font: { size: 10, color: '#94a3b8' } }, gridcolor: Plotter.theme.gridcolor },
            legend: { orientation: 'h', x: 0.5, y: 1.15, xanchor: 'center', font: { color: '#cbd5e1' } }
        };
        Plotly.newPlot(rightId, rightTraces, rightLayout, { responsive: true, displayModeBar: false });
    },

    // Línea genérica (RMSE vs grado, error vs n, etc.)
    plotLine: function(containerId, xs, ys, xTitle, yTitle, name, logY = false) {
        const pairs = xs.map((x, i) => [x, ys[i]]).filter(p => p[1] !== null && !isNaN(p[1]) && (!logY || p[1] > 0));
        const traces = [{
            x: pairs.map(p => p[0]),
            y: pairs.map(p => p[1]),
            mode: 'lines+markers',
            name: name,
            line: { color: '#06b6d4', width: 2.2 },
            marker: { color: '#38bdf8', size: 6, line: { color: '#0891b2', width: 1.5 } }
        }];
        const layout = {
            margin: { t: 25, r: 20, b: 35, l: 55 },
            paper_bgcolor: Plotter.theme.paper_bgcolor,
            plot_bgcolor: Plotter.theme.plot_bgcolor,
            font: Plotter.theme.font,
            xaxis: { title: { text: xTitle, font: { size: 10, color: '#94a3b8' } }, gridcolor: Plotter.theme.gridcolor, linecolor: Plotter.theme.linecolor, zeroline: false },
            yaxis: { title: { text: yTitle, font: { size: 10, color: '#94a3b8' } }, type: logY ? 'log' : 'linear', gridcolor: Plotter.theme.gridcolor, linecolor: Plotter.theme.linecolor },
            legend: { orientation: 'h', x: 0.5, y: 1.15, xanchor: 'center', font: { color: '#cbd5e1' } }
        };
        Plotly.newPlot(containerId, traces, layout, { responsive: true, displayModeBar: false });
    },

    // --- Superposiciones para el recorrido paso a paso ---
    vLine: function(x, color, label, dash = 'dash') {
        return {
            shape: { type: 'line', xref: 'x', yref: 'paper', x0: x, x1: x, y0: 0, y1: 1, line: { color: color, width: 1.6, dash: dash } },
            annotation: label ? { x: x, y: 1, xref: 'x', yref: 'paper', yanchor: 'bottom', text: label, showarrow: false, font: { color: color, size: 10 } } : null
        };
    },

    segment: function(x0, y0, x1, y1, color, dash = 'solid', width = 2) {
        return { shape: { type: 'line', xref: 'x', yref: 'y', x0: x0, y0: y0, x1: x1, y1: y1, line: { color: color, width: width, dash: dash } } };
    },

    band: function(x0, x1, color) {
        return { shape: { type: 'rect', xref: 'x', yref: 'paper', x0: x0, x1: x1, y0: 0, y1: 1, fillcolor: color, line: { width: 0 }, layer: 'below' } };
    },

    dot: function(x, y, color, label) {
        return {
            shape: { type: 'circle', xref: 'x', yref: 'y', xsizemode: 'pixel', ysizemode: 'pixel', xanchor: x, yanchor: y, x0: -6, x1: 6, y0: -6, y1: 6, fillcolor: color, line: { color: '#ffffff', width: 1.5 } },
            annotation: label ? { x: x, y: y, xref: 'x', yref: 'y', text: label, showarrow: true, arrowhead: 0, ax: 18, ay: -22, font: { color: color, size: 10 }, arrowcolor: color } : null
        };
    },

    setOverlay: function(containerId, items) {
        const el = document.getElementById(containerId);
        if (!el || !el.data) return;
        const valid = (items || []).filter(Boolean);
        Plotly.relayout(el, {
            shapes: valid.map(i => i.shape).filter(Boolean),
            annotations: valid.map(i => i.annotation).filter(Boolean)
        });
    },

    // 6. Gráficas para Optimización Multivariada (2D)
    plotGolden2DDual: function(leftId, rightId, fn2D, rangeX, rangeY, result) {
        Plotter.plotErrorLog(leftId, result.iterations, 'Paso Euclidiano (%)');

        const gridN = 45;
        const xStep = (rangeX[1] - rangeX[0]) / gridN;
        const yStep = (rangeY[1] - rangeY[0]) / gridN;

        const xArr = [];
        const yArr = [];
        const zMatrix = [];

        for (let i = 0; i <= gridN; i++) xArr.push(rangeX[0] + i * xStep);
        for (let j = 0; j <= gridN; j++) yArr.push(rangeY[0] + j * yStep);

        for (let j = 0; j <= gridN; j++) {
            const row = [];
            const y = yArr[j];
            for (let i = 0; i <= gridN; i++) {
                const x = xArr[i];
                try {
                    const z = fn2D(x, y);
                    row.push(isNaN(z) || !isFinite(z) ? 0 : z);
                } catch (e) {
                    row.push(0);
                }
            }
            zMatrix.push(row);
        }

        const trajX = result.trajectory.map(p => p.x);
        const trajY = result.trajectory.map(p => p.y);

        const rightTraces = [
            // Contorno
            {
                z: zMatrix,
                x: xArr,
                y: yArr,
                type: 'contour',
                colorscale: 'Electric',
                contours: { coloring: 'lines' },
                showscale: false,
                name: 'Curvas de Nivel'
            },
            // Trayectoria
            {
                x: trajX,
                y: trajY,
                mode: 'lines+markers',
                name: 'Trayectoria Coordinada',
                line: { color: '#38bdf8', width: 2.2 },
                marker: { color: '#06b6d4', size: 6 }
            },
            // Inicio
            {
                x: [trajX[0]],
                y: [trajY[0]],
                mode: 'markers',
                name: 'Inicio',
                marker: { color: '#10b981', size: 10, symbol: 'circle' }
            },
            // Óptimo
            {
                x: [result.optimum.x],
                y: [result.optimum.y],
                mode: 'markers',
                name: `Óptimo (${result.optimum.x.toFixed(3)}, ${result.optimum.y.toFixed(3)})`,
                marker: { color: '#f43f5e', size: 12, symbol: 'star' }
            }
        ];

        const rightLayout = {
            margin: { t: 25, r: 20, b: 35, l: 45 },
            paper_bgcolor: Plotter.theme.paper_bgcolor,
            plot_bgcolor: Plotter.theme.plot_bgcolor,
            font: Plotter.theme.font,
            xaxis: { title: 'x', gridcolor: Plotter.theme.gridcolor },
            yaxis: { title: 'y', gridcolor: Plotter.theme.gridcolor },
            legend: { orientation: 'h', x: 0.5, y: 1.15, xanchor: 'center', font: { color: '#cbd5e1' } }
        };
        Plotly.newPlot(rightId, rightTraces, rightLayout, { responsive: true, displayModeBar: false });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Plotter;
}
