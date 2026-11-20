"""Endpoint: Método de la Secante (Raíces de ecuaciones, método abierto)."""
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from core.expresiones import funcion_1d
from core.utilidades import error_relativo, limpiar, motivo_parada

router = APIRouter(tags=["Raíces de ecuaciones"])


class EntradaSecante(BaseModel):
    funcion: str = Field(..., examples=["x^3 - x - 2"])
    x0: float = Field(..., examples=[1], description="x_{n-1} inicial")
    x1: float = Field(..., examples=[2], description="x_n inicial")
    tolerancia: float = Field(1e-4, gt=0)
    max_iter: int = Field(50, ge=1, le=10000)
    criterio: Literal["tol", "iter"] = "tol"


def secante(f, x_ant, x_act, tol, max_iter, criterio):
    iteraciones = []
    error, abs_err = 100.0, None
    x_nuevo = x_act
    i = 0
    while i < max_iter:
        i += 1
        f_ant, f_act = f(x_ant), f(x_act)
        denominador = f_ant - f_act
        if abs(denominador) < 1e-14:
            raise ValueError(
                f"Denominador nulo o inestable en iteración {i}: f(x_n) ≈ f(x_(n-1)). Pruebe con otros puntos iniciales."
            )
        # Fórmula del taller: x_nuevo = x_act - f(x_act)(x_ant - x_act) / (f(x_ant) - f(x_act))
        x_nuevo = x_act - (f_act * (x_ant - x_act)) / denominador
        error = error_relativo(x_nuevo, x_act)
        abs_err = abs(x_nuevo - x_act)
        f_nuevo = f(x_nuevo)
        iteraciones.append({
            "iter": i, "xPrev": x_ant, "xCurr": x_act, "fPrev": f_ant, "fCurr": f_act,
            "xNext": x_nuevo, "fNext": f_nuevo, "absErr": abs_err, "error": error,
        })
        if abs(f_nuevo) < 1e-12:
            break
        if criterio == "tol" and error < tol:
            break
        x_ant, x_act = x_act, x_nuevo

    f_raiz = f(x_nuevo)
    return {
        "root": x_nuevo, "fRoot": f_raiz, "iterations": iteraciones, "mode": criterio,
        "converged": error < tol or abs(f_raiz) < 1e-6,
        "totalIter": i, "finalError": error, "absError": abs_err or 0,
        "stopReason": motivo_parada(criterio, i, max_iter, error, tol, abs(f_raiz) < 1e-12),
    }


@router.post("/api/secante", summary="Método de la Secante")
def endpoint_secante(datos: EntradaSecante):
    f = funcion_1d(datos.funcion)
    return limpiar(secante(f, datos.x0, datos.x1, datos.tolerancia, datos.max_iter, datos.criterio))
