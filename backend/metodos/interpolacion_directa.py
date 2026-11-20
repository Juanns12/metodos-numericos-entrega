"""Endpoint: Interpolación directa (Taller 2).

Dos formas de resolver (como en los talleres):
  * metodo = "vandermonde" -> sistema V·a = y resuelto paso a paso por Gauss-Jordan (equivale a np.polyfit grado n-1).
  * metodo = "lagrange"    -> P(x*) = Σ y_i·L_i(x*) término a término (evaluación baricéntrica del taller).
"""
from typing import List, Literal, Optional

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field

from core.puntos import Punto
from core.utilidades import formato, limpiar, polinomio_texto

router = APIRouter(tags=["Interpolación y regresión"])


class EntradaInterpolacion(BaseModel):
    puntos: List[Punto] = Field(..., examples=[[{"x": 0, "y": 1}, {"x": 1, "y": 3}, {"x": 2, "y": 5}]])
    x_eval: Optional[float] = Field(None, examples=[1.5])
    metodo: Literal["vandermonde", "lagrange"] = "vandermonde"


def pesos_baricentricos(xd):
    n = len(xd)
    w = np.ones(n)
    for j in range(n):
        for k in range(n):
            if j != k:
                w[j] /= (xd[j] - xd[k])
    return w


def interpolacion_baricentrica(xd, yd, x):
    """Evaluación del polinomio de Lagrange en forma baricéntrica (Taller 2)."""
    coincidencia = np.where(np.isclose(x, xd))[0]
    if len(coincidencia) > 0:
        return float(yd[coincidencia[0]])
    w = pesos_baricentricos(xd)
    terminos = w / (x - xd)
    return float(np.sum(terminos * yd) / np.sum(terminos))


def gauss_jordan_pasos(A, b):
    """Resuelve A·x = b con pivoteo parcial registrando cada operación de fila."""
    n = len(b)
    M = np.hstack([np.array(A, dtype=float), np.array(b, dtype=float).reshape(-1, 1)])
    pasos = [{"operacion": "Matriz aumentada inicial [V | y]", "pivote": None, "matriz": M.tolist()}]
    for i in range(n):
        fila_max = i + int(np.argmax(np.abs(M[i:, i])))
        if fila_max != i:
            M[[i, fila_max]] = M[[fila_max, i]]
            pasos.append({"operacion": f"Pivoteo parcial: F{i + 1} ↔ F{fila_max + 1}", "pivote": None,
                          "matriz": M.tolist()})
        pivote = M[i, i]
        if abs(pivote) < 1e-13:
            raise ValueError("El sistema de Vandermonde es singular (no posee solución única).")
        M[i] = M[i] / pivote
        pasos.append({"operacion": f"Normalizar: F{i + 1} ← F{i + 1} / {formato(pivote)}", "pivote": pivote,
                      "matriz": M.tolist()})
        ops = []
        for k in range(n):
            if k != i and abs(M[k, i]) > 0:
                factor = M[k, i]
                M[k] = M[k] - factor * M[i]
                ops.append(f"F{k + 1} ← F{k + 1} − ({formato(factor)})·F{i + 1}")
        if ops:
            pasos.append({"operacion": "Eliminar columna " + str(i + 1) + ": " + "; ".join(ops), "pivote": None,
                          "matriz": M.tolist()})
    return M[:, n].copy(), pasos


def interpolacion_directa(puntos, x_eval=None, metodo="vandermonde"):
    if len(puntos) < 2:
        raise ValueError("Se requieren al menos 2 puntos para interpolar.")
    xd = np.array([p.x for p in puntos], dtype=float)
    yd = np.array([p.y for p in puntos], dtype=float)
    n = len(xd)
    for i in range(n):
        for j in range(i + 1, n):
            if abs(xd[i] - xd[j]) < 1e-12:
                raise ValueError(
                    f"Abscisas duplicadas detectadas en x = {xd[i]:g}. Para interpolar, cada x_i debe ser único."
                )

    # Matriz de Vandermonde: P(x) = a0 + a1*x + ... + a_(n-1)*x^(n-1) pasa EXACTAMENTE por los n puntos
    V = np.vander(xd, n, increasing=True)
    coefs, pasos_gj = gauss_jordan_pasos(V, yd)

    pasos_lagrange = []
    evaluacion = None
    if x_eval is not None:
        acumulado = 0.0
        for i in range(n):
            Li = 1.0
            factores = []
            for j in range(n):
                if j != i:
                    Li *= (x_eval - xd[j]) / (xd[i] - xd[j])
                    factores.append(f"({formato(x_eval)} − {formato(xd[j])})/({formato(xd[i])} − {formato(xd[j])})")
            acumulado += yd[i] * Li
            pasos_lagrange.append({"i": i, "xi": xd[i], "yi": yd[i], "Li": Li, "termValue": yd[i] * Li,
                                   "acumulado": acumulado, "factores": " · ".join(factores)})
        y_vander = float(np.polynomial.polynomial.polyval(x_eval, coefs))
        y_lagrange = interpolacion_baricentrica(xd, yd, x_eval)
        evaluacion = {
            "x": x_eval,
            "y": y_vander if metodo == "vandermonde" else y_lagrange,
            "yVandermonde": y_vander,
            "yLagrange": y_lagrange,
            "basisValues": pasos_lagrange,
            "isExtrapolation": bool(x_eval < xd.min() or x_eval > xd.max()),
        }

    return {
        "method": metodo,
        "points": [{"x": float(a), "y": float(b)} for a, b in zip(xd, yd)],
        "degree": n - 1,
        "coefficients": coefs.tolist(),
        "polyString": polinomio_texto(coefs.tolist()),
        "vandermondeMatrix": V.tolist(),
        "evaluation": evaluacion,
        # Pasos para el recorrido iteración por iteración
        "iterations": pasos_gj if metodo == "vandermonde" else pasos_lagrange,
        "stopReason": (f"Vandermonde: sistema {n}×{n} resuelto por Gauss-Jordan en {len(pasos_gj) - 1} operaciones de fila."
                       if metodo == "vandermonde" else
                       f"Lagrange: P(x*) construido sumando {n} términos y_i·L_i(x*)."),
    }


@router.post("/api/interpolacion-directa", summary="Interpolación directa (Vandermonde o Lagrange)")
def endpoint_interpolacion(datos: EntradaInterpolacion):
    if datos.metodo == "lagrange" and datos.x_eval is None:
        raise ValueError("La forma de Lagrange necesita un valor x* donde evaluar el polinomio.")
    return limpiar(interpolacion_directa(datos.puntos, datos.x_eval, datos.metodo))
