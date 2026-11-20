"""Utilidades comunes a las reglas de integración de Newton-Cotes.

Cada regla se puede resolver de dos formas (como en el Taller 1):
  * criterio = "n"   -> número fijo de subintervalos n.
  * criterio = "tol" -> n automático: se empieza en n_min y se incrementa en n_min
                        hasta que el error sea menor que la tolerancia.
"""
import math
from typing import Literal, Optional

from pydantic import BaseModel, Field

from core.utilidades import error_relativo, es_valido


class EntradaIntegracion(BaseModel):
    funcion: str = Field(..., examples=["x^2"])
    a: float = Field(..., examples=[0])
    b: float = Field(..., examples=[1])
    n: int = Field(6, ge=1, le=100000, description="Subintervalos (modo 'n')")
    valor_exacto: Optional[float] = Field(None, description="Para calcular el error verdadero")
    criterio: Literal["n", "tol"] = "n"
    tolerancia: float = Field(1e-4, gt=0, description="Error porcentual objetivo (modo 'tol')")
    max_iter: int = Field(500, ge=1, le=5000, description="Máximo de incrementos de n (modo 'tol')")


def exacto_valido(v):
    return v is not None and math.isfinite(v) and abs(v) > 1e-12


def evaluar_nodos(f, a, b, n, peso):
    """Evalúa f en los n+1 nodos y aplica el peso de la regla correspondiente."""
    if a >= b:
        raise ValueError("El límite superior 'b' debe ser estrictamente mayor que el límite inferior 'a'.")
    h = (b - a) / n
    puntos = []
    suma = 0.0
    for i in range(n + 1):
        xi = a + i * h
        fxi = f(xi)
        if not es_valido(fxi):
            raise ValueError(f"f(x) no está definida o es infinita en el nodo x_{i} = {xi:.4f}.")
        w = peso(i, n)
        suma += w * fxi
        puntos.append({"i": i, "xi": xi, "fxi": fxi, "factor": w, "term": w * fxi})
    return h, puntos, suma


def integral_rapida(f, a, b, n, peso, coef):
    h = (b - a) / n
    return coef * h * sum(peso(i, n) * f(a + i * h) for i in range(n + 1))


def integral_referencia(f, a, b, n):
    """Simpson 1/3 con 4n subintervalos, usado para estimar el error cuando no hay valor exacto."""
    m = n * 4
    h = (b - a) / m
    s = f(a) + f(b)
    for i in range(1, m):
        s += (2 if i % 2 == 0 else 4) * f(a + i * h)
    return h / 3 * s


def calcular_error(f, a, b, n, integral, valor_exacto):
    if exacto_valido(valor_exacto):
        return abs((valor_exacto - integral) / valor_exacto) * 100, True
    ref = integral_referencia(f, a, b, n)
    return (abs((ref - integral) / ref) * 100 if abs(ref) > 1e-12 else 0.0), False


def resolver(f, datos: EntradaIntegracion, nombre, peso, coef, n_min, validar_n):
    """Resuelve la regla en el modo pedido y devuelve la respuesta común."""
    a, b, exacto = datos.a, datos.b, datos.valor_exacto
    if a >= b:
        raise ValueError("El límite superior 'b' debe ser estrictamente mayor que el límite inferior 'a'.")

    historial = []
    motivo = None
    if datos.criterio == "n":
        validar_n(datos.n)
        n = datos.n
    else:
        # Igual que el Taller 1: while True -> calcular con n, medir error, si no cumple n += paso
        n = n_min
        anterior = None
        error = None
        k = 0
        while k < datos.max_iter:
            k += 1
            I = integral_rapida(f, a, b, n, peso, coef)
            if not es_valido(I):
                raise ValueError(f"La integral no es finita con n = {n}. Revise f(x) en [a, b].")
            if exacto_valido(exacto):
                error = abs((I - exacto) / exacto) * 100
            elif anterior is not None:
                error = error_relativo(I, anterior)
            else:
                error = None
            historial.append({"iter": k, "n": n, "h": (b - a) / n, "integral": I, "error": error})
            if error is not None and error < datos.tolerancia:
                break
            anterior = I
            n += n_min
        if error is not None and error < datos.tolerancia:
            motivo = (f"Modo por tolerancia: con n = {n} el error "
                      f"{'verdadero' if exacto_valido(exacto) else 'aproximado'} = {error:.6g} % "
                      f"< tolerancia = {datos.tolerancia:g} % ({k} cálculos).")
        else:
            motivo = (f"Modo por tolerancia: se alcanzó el máximo de {datos.max_iter} incrementos (n = {n}) "
                      f"sin cumplir la tolerancia.")

    h, puntos, suma = evaluar_nodos(f, a, b, n, peso)
    integral = coef * h * suma
    error_pct, verdadero = calcular_error(f, a, b, n, integral, exacto)
    return {
        "integral": integral, "h": h, "n": n, "points": puntos, "weightedSum": suma,
        "errorPct": error_pct, "isTrueError": verdadero, "mode": datos.criterio,
        "iterations": historial,
        "stopReason": motivo or f"Modo por n fijo: se usaron n = {n} subintervalos (h = {h:.6g}).",
        "type": f"{nombre} {'Simple' if n == n_min else f'Compuesto (n={n})'}",
    }
