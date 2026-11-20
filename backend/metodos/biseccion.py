"""Endpoint: Método de Bisección (Taller 1 - Raíces de ecuaciones)."""
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from core.expresiones import funcion_1d
from core.utilidades import error_relativo, es_valido, limpiar, motivo_parada

router = APIRouter(tags=["Raíces de ecuaciones"])


class EntradaBiseccion(BaseModel):
    funcion: str = Field(..., examples=["x^3 - x - 2"])
    a: float = Field(..., examples=[1])
    b: float = Field(..., examples=[2])
    tolerancia: float = Field(1e-4, gt=0, description="Error relativo porcentual objetivo")
    max_iter: int = Field(50, ge=1, le=10000)
    criterio: Literal["tol", "iter"] = "tol"


def biseccion(f, xl, xu, tol, max_iter, criterio):
    fa, fb = f(xl), f(xu)
    if not (es_valido(fa) and es_valido(fb)):
        raise ValueError("La función f(x) produce valores no válidos o fuera de dominio en los extremos [a, b].")
    for raiz, fr in ((xl, fa), (xu, fb)):
        if abs(fr) < 1e-12:
            fila = {"iter": 1, "a": xl, "b": xu, "xr": raiz, "fa": fa, "fb": fb, "fxr": fr, "absErr": 0, "error": 0}
            return {"root": raiz, "fRoot": fr, "iterations": [fila], "converged": True,
                    "totalIter": 1, "finalError": 0, "absError": 0}
    if fa * fb > 0:
        raise ValueError(
            f"No se cumple el teorema de Bolzano: f(a) = {fa:.4f} y f(b) = {fb:.4f} tienen el mismo signo. "
            "Debe existir un cambio de signo en [a, b]."
        )

    iteraciones = []
    xr = xl
    error, abs_err = 100.0, None
    i = 0
    while i < max_iter:
        i += 1
        xr_anterior = xr
        xr = (xl + xu) / 2
        fxr, fxl, fxu = f(xr), f(xl), f(xu)
        if i > 1:
            error = error_relativo(xr, xr_anterior)
            abs_err = abs(xr - xr_anterior)
        producto = fxl * fxr
        intervalo = f"[{xl:.4f}, {xr:.4f}]" if producto < 0 else f"[{xr:.4f}, {xu:.4f}]"
        iteraciones.append({
            "iter": i, "a": xl, "b": xu, "xr": xr, "fa": fxl, "fb": fxu, "fxr": fxr,
            "signProduct": producto, "absErr": abs_err, "error": None if i == 1 else error,
            "interval": intervalo,
        })
        if abs(fxr) < 1e-12:
            break
        if criterio == "tol" and i > 1 and error < tol:
            break
        if producto < 0:
            xu = xr
        elif producto > 0:
            xl = xr
        else:
            break

    f_raiz = f(xr)
    return {
        "root": xr, "fRoot": f_raiz, "iterations": iteraciones, "mode": criterio,
        "converged": (criterio == "tol" and i > 1 and error < tol) or abs(f_raiz) < 1e-6,
        "totalIter": i, "finalError": error, "absError": abs_err or 0,
        "stopReason": motivo_parada(criterio, i, max_iter, error, tol, abs(f_raiz) < 1e-12),
    }


@router.post("/api/biseccion", summary="Método de Bisección")
def endpoint_biseccion(datos: EntradaBiseccion):
    f = funcion_1d(datos.funcion)
    return limpiar(biseccion(f, datos.a, datos.b, datos.tolerancia, datos.max_iter, datos.criterio))
