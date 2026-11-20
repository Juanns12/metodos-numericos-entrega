"""Endpoint: Regresión por mínimos cuadrados (Taller 2).

Modos:
  * intercept     -> recta y = b0 + b1·x
  * no_intercept  -> recta por el origen y = b1·x
  * polynomial    -> polinomio de grado fijo (ecuaciones normales / np.polyfit)
  * auto          -> grado automático: prueba grados 1..10 y mide el RMSE (como en el Taller 2),
                     elige el primer grado a partir del cual el RMSE casi no mejora.
"""
from typing import List, Literal, Optional

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field

from core.puntos import Punto
from core.utilidades import formato, limpiar, polinomio_texto

router = APIRouter(tags=["Interpolación y regresión"])


class EntradaMinimosCuadrados(BaseModel):
    puntos: List[Punto] = Field(..., examples=[[{"x": 0, "y": 1}, {"x": 1, "y": 3}, {"x": 2, "y": 5}]])
    modo: Literal["intercept", "no_intercept", "polynomial", "auto"] = "intercept"
    grado: int = Field(1, ge=1, le=10)
    x_eval: Optional[float] = Field(None, examples=[3])
    grado_max: int = Field(10, ge=1, le=10, description="Modo auto: grado máximo a probar")
    mejora_min: float = Field(10, gt=0, description="Modo auto: mejora mínima del RMSE (%) para subir de grado")


def ecuaciones_normales(x, y, m):
    """Sistema A·c = B con A[j][k] = Σ x^(j+k) y B[j] = Σ x^j·y (notebook 11/09)."""
    A = [[float(np.sum(x ** (j + k))) for k in range(m + 1)] for j in range(m + 1)]
    B = [float(np.sum((x ** j) * y)) for j in range(m + 1)]
    return A, B


def ajuste_polinomial(x, y, m):
    coefs = np.polyfit(x, y, m)[::-1]  # np.polyfit devuelve de mayor a menor grado
    rmse = float(np.sqrt(np.mean((y - np.polynomial.polynomial.polyval(x, coefs)) ** 2)))
    return coefs.tolist(), rmse


def minimos_cuadrados(puntos, modo="intercept", grado=1, x_eval=None, grado_max=10, mejora_min=10.0):
    N = len(puntos)
    if N < 2:
        raise ValueError("Se requieren al menos 2 puntos para realizar regresión.")
    x = np.array([p.x for p in puntos], dtype=float)
    y = np.array([p.y for p in puntos], dtype=float)
    St = float(np.sum((y - y.mean()) ** 2))

    comparacion = []
    motivo = None
    sistema = None
    if modo == "no_intercept":
        # y = b1*x  ->  b1 = Σxy / Σx²
        sx2 = float(np.sum(x * x))
        if abs(sx2) < 1e-14:
            raise ValueError("Suma de x² nula. No se puede ajustar sin intercepto.")
        b1 = float(np.sum(x * y)) / sx2
        coefs = [0.0, b1]
        ecuacion = f"y = {formato(b1)}*x"
        sistema = {"A": [[sx2]], "B": [float(np.sum(x * y))], "incognitas": ["b1"]}
        grado_usado = 1
    else:
        if float(np.sum((x - x.mean()) ** 2)) < 1e-14:
            raise ValueError("Varianza en x es cero (todos los puntos tienen la misma coordenada x).")
        if modo == "auto":
            limite = max(1, min(grado_max, N - 1))
            grado_usado = None
            rmse_prev = None
            rmse_base = None
            for g in range(1, limite + 1):
                c, rmse = ajuste_polinomial(x, y, g)
                Sr_g = float(np.sum((y - np.polynomial.polynomial.polyval(x, c)) ** 2))
                if rmse_base is None:
                    rmse_base = rmse
                # Mejora del RMSE al subir un grado, medida sobre el RMSE de la recta (grado 1)
                mejora = None if rmse_prev is None else (
                    (rmse_prev - rmse) / rmse_base * 100 if rmse_base > 1e-15 else 0.0)
                comparacion.append({"iter": len(comparacion) + 1, "grado": g, "rmse": rmse,
                                    "r2": max(0.0, (St - Sr_g) / St) if St > 1e-12 else 1.0,
                                    "mejora": mejora, "elegido": False})
                if grado_usado is None and mejora is not None and mejora < mejora_min:
                    grado_usado = g - 1
                rmse_prev = rmse
            if grado_usado is None:
                grado_usado = limite
            comparacion[grado_usado - 1]["elegido"] = True
            motivo = (f"Grado automático: se probaron los grados 1 a {limite}; después del grado {grado_usado} "
                      f"el RMSE mejora menos de {mejora_min:g} % (respecto al RMSE de grado 1) "
                      f"-> se elige grado {grado_usado}.")
        else:
            grado_usado = 1 if modo == "intercept" else max(1, min(grado, N - 1))
        coefs, _ = ajuste_polinomial(x, y, grado_usado)
        A, B = ecuaciones_normales(x, y, grado_usado)
        sistema = {"A": A, "B": B, "incognitas": [f"a{j}" for j in range(grado_usado + 1)]}
        if modo == "intercept":
            ecuacion = f"y = {formato(coefs[0])} + {formato(coefs[1])}*x"
        else:
            ecuacion = polinomio_texto(coefs, "y = ")

    y_pred = np.polynomial.polynomial.polyval(x, coefs)
    residuos = y - y_pred
    Sr = float(np.sum(residuos ** 2))
    r2 = max(0.0, (St - Sr) / St) if St > 1e-12 else 1.0
    b0, b1 = coefs[0], coefs[1] if len(coefs) > 1 else 0.0
    r = float(np.sqrt(r2)) if b1 >= 0 else -float(np.sqrt(r2))
    gl = max(1, N - len(coefs))

    filas = []
    acum = 0.0
    for i in range(N):
        acum += float(residuos[i] ** 2)
        filas.append({
            "i": i + 1, "x": float(x[i]), "y": float(y[i]), "yPred": float(y_pred[i]),
            "residual": float(residuos[i]), "residualSq": float(residuos[i] ** 2),
            "devMeanSq": float((y[i] - y.mean()) ** 2), "SrAcum": acum,
        })

    return {
        "mode": modo, "degree": grado_usado,
        "points": [{"x": float(a), "y": float(b)} for a, b in zip(x, y)],
        "b0": b0, "b1": b1, "coefficients": coefs, "equationString": ecuacion,
        "normalEquations": sistema,
        "tableRows": filas, "degreeComparison": comparacion,
        "iterations": comparacion if modo == "auto" else filas,
        "St": St, "Sr": Sr, "r2": r2, "r": r,
        "syx": float(np.sqrt(Sr / gl)), "rmse": float(np.sqrt(Sr / N)),
        "evaluation": {"x": x_eval, "y": float(np.polynomial.polynomial.polyval(x_eval, coefs))}
        if x_eval is not None else None,
        "stopReason": motivo or f"Ajuste directo por ecuaciones normales (grado {grado_usado}, {N} puntos).",
    }


@router.post("/api/minimos-cuadrados", summary="Regresión por mínimos cuadrados (lineal, polinomial o grado automático)")
def endpoint_minimos_cuadrados(datos: EntradaMinimosCuadrados):
    return limpiar(minimos_cuadrados(datos.puntos, datos.modo, datos.grado, datos.x_eval,
                                     datos.grado_max, datos.mejora_min))
