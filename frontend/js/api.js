// js/api.js - Cliente del backend FastAPI (un endpoint por método numérico)

const Api = {
    BASE_URL: (window.API_BASE_URL || 'http://127.0.0.1:8000'),

    post: async function(ruta, cuerpo) {
        let resp;
        try {
            resp = await fetch(`${this.BASE_URL}${ruta}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cuerpo)
            });
        } catch (e) {
            throw new Error(`No se pudo conectar con el backend (${this.BASE_URL}). Verifique que el servidor FastAPI esté corriendo.`);
        }
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            let msg = data.detail;
            if (Array.isArray(msg)) {
                // Errores de validación de Pydantic
                msg = msg.map(d => `${(d.loc || []).slice(1).join('.')}: ${d.msg}`).join(' | ');
            }
            throw new Error(msg || `Error HTTP ${resp.status}`);
        }
        return data;
    },

    biseccion:            function(d) { return this.post('/api/biseccion', d); },
    falsaPosicion:        function(d) { return this.post('/api/falsa-posicion', d); },
    secante:              function(d) { return this.post('/api/secante', d); },
    newtonRaphson:        function(d) { return this.post('/api/newton-raphson', d); },
    trapecio:             function(d) { return this.post('/api/trapecio', d); },
    simpson13:            function(d) { return this.post('/api/simpson-13', d); },
    simpson38:            function(d) { return this.post('/api/simpson-38', d); },
    interpolacionDirecta: function(d) { return this.post('/api/interpolacion-directa', d); },
    minimosCuadrados:     function(d) { return this.post('/api/minimos-cuadrados', d); },
    seccionDorada1D:      function(d) { return this.post('/api/seccion-dorada-1d', d); },
    seccionDorada2D:      function(d) { return this.post('/api/seccion-dorada-2d', d); },

    // Construye P(x) = c0 + c1*x + ... (Horner) a partir de los coeficientes devueltos por el backend, solo para graficar
    polinomio: function(coefs) {
        return function(x) {
            let s = 0;
            for (let j = coefs.length - 1; j >= 0; j--) s = s * x + coefs[j];
            return s;
        };
    }
};
