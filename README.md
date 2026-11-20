# Guía de Uso - Plataforma Web de Métodos Numéricos

Esta aplicación web interactiva está diseñada para explicar, resolver y graficar paso a paso los principales métodos numéricos de ingeniería y ciencias aplicadas.

---

## 🚀 Cómo Iniciar la Aplicación (Backend + Frontend)

Los cálculos los realiza un **backend en Python con FastAPI** (carpeta `backend/`). El frontend solo envía los datos y grafica los resultados.

**Requisito:** Python 3.10 o superior.

### Opción rápida (Windows)

Doble clic en **`iniciar.bat`**. Instala las dependencias, abre el backend (puerto 8000) y el frontend (puerto 5500) en dos ventanas, y abre el navegador en http://localhost:5500.
Si Python no está en el PATH, edite la línea `set PYTHON=python` del archivo con la ruta a su `python.exe`.

### Opción manual

### 1. Backend (FastAPI) — puerto 8000

Desde la carpeta del proyecto:

```bash
cd backend
python -m pip install -r requirements.txt   # solo la primera vez
python -m uvicorn main:app --port 8000
```

Documentación interactiva de la API: http://127.0.0.1:8000/docs

| Método | Endpoint | Archivo |
|---|---|---|
| Bisección | `POST /api/biseccion` | `backend/metodos/biseccion.py` |
| Falsa Posición | `POST /api/falsa-posicion` | `backend/metodos/falsa_posicion.py` |
| Secante | `POST /api/secante` | `backend/metodos/secante.py` |
| Newton-Raphson | `POST /api/newton-raphson` | `backend/metodos/newton_raphson.py` |
| Regla del Trapecio | `POST /api/trapecio` | `backend/metodos/trapecio.py` |
| Simpson 1/3 | `POST /api/simpson-13` | `backend/metodos/simpson_13.py` |
| Simpson 3/8 | `POST /api/simpson-38` | `backend/metodos/simpson_38.py` |
| Interpolación Directa | `POST /api/interpolacion-directa` | `backend/metodos/interpolacion_directa.py` |
| Mínimos Cuadrados | `POST /api/minimos-cuadrados` | `backend/metodos/minimos_cuadrados.py` |
| Sección Dorada 1D | `POST /api/seccion-dorada-1d` | `backend/metodos/seccion_dorada_1d.py` |
| Sección Dorada 2D | `POST /api/seccion-dorada-2d` | `backend/metodos/seccion_dorada_2d.py` |

Prueba rápida de todos los endpoints (con el backend corriendo): `python backend/prueba_api.py`

### 2. Frontend — puerto 5500

En otra terminal, desde la carpeta del proyecto:

```bash
python -m http.server 5500
```

Abre http://localhost:5500 en el navegador. La URL del backend se configura en `js/api.js` (`BASE_URL`).

---

## 📚 Métodos Numéricos Incluidos

### 1. Raíces de Ecuaciones
* **Bisección**: Método cerrado basado en el Teorema de Bolzano. Divide a la mitad el intervalo sucesivamente asegurando la convergencia.
* **Falsa Posición (Regula Falsi)**: Une los extremos del intervalo con una cuerda secante lineal para proyectar una aproximación más rápida de la raíz.
* **Secante**: Método abierto que utiliza dos puntos iniciales y aproxima la derivada mediante una recta secante, sin necesidad de derivar la función.
* **Newton-Raphson**: Método de convergencia cuadrática que emplea la recta tangente $f'(x)$. Incluye derivación simbólica automática (SymPy en el backend) o derivada ingresada por el usuario.

---

### 2. Integración Numérica
* **Regla del Trapecio (Simple y Compuesto)**: Aproxima la integral dividiendo el área bajo la curva en $n$ trapecios.
* **Simpson 1/3 (y regla 1/8)**: Método de Newton-Cotes de 2º orden que ajusta parábolas cada 2 subintervalos (requiere $n$ par). *Incluye nota explicativa académica para la denominación habitual Simpson 1/8*.
* **Simpson 3/8**: Método de Newton-Cotes de 3º orden que ajusta polinomios cúbicos cada 3 subintervalos (requiere $n$ múltiplo de 3).

---

### 3. Ajuste de Curvas
* **Interpolación Directa (Vandermonde)**: Determina el polinomio exacto $P(x)$ que pasa por todos los puntos conocidos resolviendo el sistema matricial de Vandermonde. Permite evaluar en cualquier $x^*$.
* **Regresión por Mínimos Cuadrados (Lineal y Polinomial)**: Ajusta una función minimizando la suma de errores residuales al cuadrado ($S_r$). Entrega $R^2$, coeficiente de correlación $r$, error estándar $S_{y/x}$ y gráfica con dispersión y residuos.

---

### 4. Optimización
* **Sección Dorada Univariada (1D)**: Encuentra el mínimo o máximo de una función unimodal reduciendo el intervalo con la razón áurea $\phi \approx 0.618034$.
* **Sección Dorada Multivariada (2D)**: Optimiza funciones de dos variables $f(x, y)$ mediante búsqueda cíclica por coordenadas ortogonales y sección dorada unidimensional, mostrando las curvas de nivel (contorno) y la trayectoria completa en la gráfica.

---

## 🔁 Dos Formas de Resolver Cada Método

Cada método tiene un selector **"Forma de resolución"** en *Parámetros de Entrada*. Cada forma funciona por separado, igual que en los talleres:

| Método | Forma 1 | Forma 2 |
|---|---|---|
| Bisección, Falsa Posición, Secante, Newton-Raphson, Sección Dorada 1D | **Por tolerancia** (`while ea > tol`) | **Por iteraciones** (`for i in range(N)`: exactamente N) |
| Sección Dorada 2D | **Por tolerancia** entre ciclos | **Por ciclos** (exactamente N ciclos) |
| Trapecio, Simpson 1/3, Simpson 3/8 | **n fijo** | **Por tolerancia**: n = 1, 2, 3… (o 2, 4… / 3, 6…) hasta que el error sea menor que la tolerancia (Taller 1) |
| Interpolación Directa | **Vandermonde** (`V·a = y` por Gauss-Jordan) | **Lagrange** (`Σ yᵢ·Lᵢ(x*)`) |
| Mínimos Cuadrados | **Grado fijo** (recta, recta sin intercepto o polinomio) | **Grado automático** (RMSE para grados 1..10, Taller 2) |

En el backend esto corresponde al campo `criterio` (`"tol"` / `"iter"`, o `"n"` / `"tol"` en integración), `metodo` (`"vandermonde"` / `"lagrange"`) y `modo: "auto"` en mínimos cuadrados. Cada respuesta incluye `stopReason`, que explica por qué se detuvo el método.

### Recorrido paso a paso
Después de calcular aparece el panel **Recorrido iteración por iteración**:
- **Controles:** botones ⏮ ◀ ▶ ▶ ⏭, deslizador, flechas ← → del teclado o clic en una fila de la tabla.
- **Detalle de cada paso:** la fórmula con los valores sustituidos, la decisión tomada (nuevo intervalo, siguiente n, grado elegido…) y el control del `while` o del `for`.
- **Gráficas:** marcan el estado de esa iteración (intervalo [a, b], x_r, secante o tangente, x₁ y x₂ de la sección dorada, trayectoria 2D hasta ese ciclo, nodo de integración, residuo del punto).

Los **ejemplos precargados** incluyen los ejercicios de los talleres: canal, tanque esférico, viga, paracaidista, proyectil, x − cos(x) con 10 iteraciones, función de 2 variables del ejercicio de optimización, datos de regresión del 11/09, etc.

---

## 🎨 Características de la Interfaz

* **Fácil de Manejar**: Todo se controla con botones intuitivos, paneles organizados y ejemplos listos para usar en 1 clic.
* **Gráficas Interactivas**: Desarrolladas con Plotly.js con zoom, desplazamiento (pan), lectura de coordenadas al pasar el cursor y visualización clara de raíces, tangentes, trapecios, residuos y contornos.
* **Paso a Paso y Fórmulas**: Explicación teórica de cada método renderizada con KaTeX, tabla completa de iteraciones con errores calculados y opción para **Copiar Tabla** o **Descargar CSV**.
* **100% Responsivo**: Funciona perfectamente en computadores, tablets y teléfonos móviles.
