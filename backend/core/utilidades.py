"""Funciones auxiliares compartidas por los métodos numéricos."""
import math


def error_relativo(actual: float, anterior: float) -> float:
    """Error relativo aproximado porcentual |(x_nuevo - x_anterior) / x_nuevo| * 100."""
    if anterior is None:
        return 100.0
    if abs(actual) < 1e-12:
        return abs(actual - anterior) * 100
    return abs((actual - anterior) / actual) * 100


def motivo_parada(criterio, i, max_iter, error, tol, exacta=False, unidad="iteraciones"):
    """Texto que explica por qué se detuvo el método (útil para comparar los dos modos)."""
    if exacta:
        return f"Se encontró el valor exacto en la iteración {i} (f = 0)."
    if criterio == "iter":
        return f"Modo por iteraciones: se completaron las {i} {unidad} solicitadas (error final = {error:.6g} %)."
    if error is not None and error < tol:
        return f"Modo por tolerancia: ea = {error:.6g} % < tolerancia = {tol:g} % en la iteración {i}."
    return f"Modo por tolerancia: se alcanzó el máximo de {max_iter} {unidad} sin cumplir la tolerancia (ea = {error:.6g} %)."


def es_valido(v: float) -> bool:
    return v is not None and not math.isnan(v) and not math.isinf(v)


def limpiar(obj):
    """Reemplaza NaN/Inf por None para que la respuesta sea JSON válido."""
    if isinstance(obj, float):
        return obj if math.isfinite(obj) else None
    if isinstance(obj, dict):
        return {k: limpiar(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [limpiar(v) for v in obj]
    return obj


def formato(num: float, decimales: int = 4) -> str:
    if abs(num) >= 1e6 or (abs(num) < 1e-4 and num != 0):
        return f"{num:.4e}"
    return f"{round(num, decimales):g}"


def polinomio_texto(coefs_ascendentes, prefijo: str = "") -> str:
    """Construye 'a_n*x^n + ... + a0' a partir de coeficientes [a0, a1, ...]."""
    texto = ""
    grado = len(coefs_ascendentes) - 1
    for j in range(grado, -1, -1):
        c = coefs_ascendentes[j]
        if abs(c) < 1e-10 and grado > 0:
            continue
        signo = ("" if texto == "" else " + ") if c >= 0 else " - "
        abs_c = formato(abs(c))
        termino = abs_c if j == 0 else (f"{abs_c}*x" if j == 1 else f"{abs_c}*x^{j}")
        texto += signo + termino
    return prefijo + (texto or "0")
