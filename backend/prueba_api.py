"""Prueba los 11 endpoints con los casos de verificación (equivalentes a test_methods.js).

Uso (con el backend corriendo):  python prueba_api.py [url_base]
"""
import json
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
PTS = [{"x": 0, "y": 1}, {"x": 1, "y": 3}, {"x": 2, "y": 5}]


def post(ruta, cuerpo):
    req = urllib.request.Request(BASE + ruta, data=json.dumps(cuerpo).encode(),
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


raiz = 1.5213797
casos = [
    ("Bisección", "/api/biseccion", {"funcion": "x^3 - x - 2", "a": 1, "b": 2},
     lambda r: abs(r["root"] - raiz) < 1e-3),
    ("Falsa posición", "/api/falsa-posicion", {"funcion": "x^3 - x - 2", "a": 1, "b": 2},
     lambda r: abs(r["root"] - raiz) < 1e-3),
    ("Secante", "/api/secante", {"funcion": "x^3 - x - 2", "x0": 1, "x1": 2},
     lambda r: abs(r["root"] - raiz) < 1e-3),
    ("Newton-Raphson", "/api/newton-raphson", {"funcion": "x^3 - x - 2", "x0": 2},
     lambda r: abs(r["root"] - raiz) < 1e-4),
    ("Trapecio", "/api/trapecio", {"funcion": "x^2", "a": 0, "b": 1, "n": 6, "valor_exacto": 1 / 3},
     lambda r: abs(r["integral"] - 1 / 3) < 0.01),
    ("Simpson 1/3", "/api/simpson-13", {"funcion": "x^2", "a": 0, "b": 1, "n": 4},
     lambda r: abs(r["integral"] - 1 / 3) < 1e-6),
    ("Simpson 3/8", "/api/simpson-38", {"funcion": "x^2", "a": 0, "b": 1, "n": 6},
     lambda r: abs(r["integral"] - 1 / 3) < 1e-6),
    ("Interpolación", "/api/interpolacion-directa", {"puntos": PTS, "x_eval": 1.5},
     lambda r: abs(r["evaluation"]["y"] - 4.0) < 1e-5),
    ("Mínimos cuadrados", "/api/minimos-cuadrados", {"puntos": PTS, "x_eval": 3},
     lambda r: abs(r["b1"] - 2) < 1e-5 and abs(r["b0"] - 1) < 1e-5 and abs(r["r2"] - 1) < 1e-5),
    ("Sección dorada 1D", "/api/seccion-dorada-1d", {"funcion": "(x - 2)^2", "a": 0, "b": 5},
     lambda r: abs(r["optimumX"] - 2) < 1e-3 and abs(r["optimumF"]) < 1e-4),
    ("Sección dorada 2D", "/api/seccion-dorada-2d", {"funcion": "(x - 2)^2 + (y + 1)^2"},
     lambda r: abs(r["optimum"]["x"] - 2) < 1e-2 and abs(r["optimum"]["y"] + 1) < 1e-2),
    # Modo por iteraciones fijas (for i in range(N)) en lugar de tolerancia
    ("Bisección 10 iteraciones fijas", "/api/biseccion",
     {"funcion": "x - cos(x)", "a": -4, "b": 3, "max_iter": 10, "criterio": "iter"},
     lambda r: r["totalIter"] == 10 and r["mode"] == "iter"),
    ("Newton 3 iteraciones fijas (Taller 1)", "/api/newton-raphson",
     {"funcion": "pi*x^2*(9 - x)/3 - 30", "x0": 3, "max_iter": 3, "criterio": "iter"},
     lambda r: r["totalIter"] == 3 and abs(r["root"] - 2.0269) < 1e-3),
    ("Secante 10 iteraciones fijas", "/api/secante",
     {"funcion": "x - cos(x)", "x0": 3.5, "x1": 3, "max_iter": 10, "criterio": "iter"},
     lambda r: r["totalIter"] <= 10 and abs(r["root"] - 0.7390851) < 1e-6),
    ("Sección dorada 1D 10 iteraciones (max 2x - x²)", "/api/seccion-dorada-1d",
     {"funcion": "2*x - x^2", "a": 0, "b": 4, "tipo": "max", "max_iter": 10, "criterio": "iter"},
     lambda r: r["totalIter"] == 10 and abs(r["optimumX"] - 1) < 0.05),
    ("Sección dorada 2D 5 ciclos fijos", "/api/seccion-dorada-2d",
     {"funcion": "-8*x + x^2 + 12*y + 4*y^2 - 2*x*y", "x_min": -10, "x_max": 10, "y_min": -10, "y_max": 10,
      "max_ciclos": 5, "criterio": "iter"},
     lambda r: r["totalCycles"] == 5),
    ("Sección dorada 2D por tolerancia (Ejercicio)", "/api/seccion-dorada-2d",
     {"funcion": "-8*x + x^2 + 12*y + 4*y^2 - 2*x*y", "x_min": -10, "x_max": 10, "y_min": -10, "y_max": 10,
      "tolerancia": 0.0005, "max_ciclos": 100},
     lambda r: abs(r["optimum"]["x"] - 10 / 3) < 1e-3 and abs(r["optimum"]["y"] + 2 / 3) < 1e-3),
    # Integración por tolerancia (n automático, Taller 1)
    ("Trapecio por tolerancia", "/api/trapecio",
     {"funcion": "x^2", "a": 0, "b": 1, "valor_exacto": 1 / 3, "criterio": "tol", "tolerancia": 0.01},
     lambda r: r["mode"] == "tol" and r["iterations"][-1]["error"] < 0.01 and r["n"] == len(r["iterations"])),
    ("Simpson 1/3 por tolerancia sin exacto", "/api/simpson-13",
     {"funcion": "exp(-x^2)", "a": 0, "b": 1, "criterio": "tol", "tolerancia": 1e-6},
     lambda r: r["n"] % 2 == 0 and abs(r["integral"] - 0.7468241) < 1e-6),
    ("Simpson 3/8 por tolerancia", "/api/simpson-38",
     {"funcion": "sqrt(x)", "a": 1, "b": 4, "valor_exacto": 14 / 3, "criterio": "tol", "tolerancia": 1e-4},
     lambda r: r["n"] % 3 == 0 and r["iterations"][-1]["error"] < 1e-4),
    # Las dos formas de interpolación
    ("Interpolación Lagrange", "/api/interpolacion-directa",
     {"puntos": [{"x": 1, "y": 3}, {"x": 2, "y": 6}, {"x": 3, "y": 19}, {"x": 5, "y": 99}], "x_eval": 2.5,
      "metodo": "lagrange"},
     lambda r: abs(r["evaluation"]["yLagrange"] - r["evaluation"]["yVandermonde"]) < 1e-9 and len(r["iterations"]) == 4),
    ("Mínimos cuadrados grado automático", "/api/minimos-cuadrados",
     {"puntos": [{"x": i, "y": v} for i, v in enumerate([1.0, 1.8, 3.2, 5.5, 8.9, 13.1])], "modo": "auto"},
     lambda r: r["degree"] == 2 and len(r["degreeComparison"]) == 5),
    # Errores esperados
    ("Bolzano (error 422)", "/api/biseccion", {"funcion": "x^2 + 1", "a": 0, "b": 1}, None),
    ("Simpson 1/3 n impar (error 422)", "/api/simpson-13", {"funcion": "x", "a": 0, "b": 1, "n": 3}, None),
    ("Expresión maliciosa (error 422)", "/api/trapecio", {"funcion": "__import__('os')", "a": 0, "b": 1}, None),
]

ok = 0
for nombre, ruta, cuerpo, check in casos:
    status, r = post(ruta, cuerpo)
    if check is None:
        passed = status == 422
        detalle = r.get("detail")
    else:
        passed = status == 200 and check(r)
        detalle = {k: r[k] for k in ("root", "integral", "optimumX", "optimum", "b0", "b1", "r2") if k in r} \
            if status == 200 else r
        if "evaluation" in r and r["evaluation"]:
            detalle["eval"] = r["evaluation"]["y"]
    ok += passed
    print(f"[{'PASS' if passed else 'FAIL'}] {nombre}: {detalle}")

print(f"\n{ok}/{len(casos)} pruebas superadas")
sys.exit(0 if ok == len(casos) else 1)
