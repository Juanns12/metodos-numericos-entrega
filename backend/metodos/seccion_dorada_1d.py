"""Endpoint: Sección Dorada univariada (Ejercicios de Optimización)."""
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from core.expresiones import funcion_1d
from core.seccion_dorada import R, mejor, paso
from core.utilidades import es_valido, limpiar, motivo_parada

router = APIRouter(tags=["Optimización"])


class EntradaSeccionDorada1D(BaseModel):
    funcion: str = Field(..., examples=["(x - 2)^2"])
    a: float = Field(..., examples=[0])
    b: float = Field(..., examples=[5])
    tipo: Literal["min", "max"] = "min"
    tolerancia: float = Field(1e-4, gt=0)
    max_iter: int = Field(40, ge=1, le=10000)
    criterio: Literal["tol", "iter"] = "tol"


def seccion_dorada_1d(f, x0, x3, tipo, tol, max_iter, criterio):
    if x0 >= x3:
        raise ValueError("El límite inferior 'a' debe ser estrictamente menor que el superior 'b'.")
    d = (x3 - x0) * R
    x1 = x3 - d
    x2 = x0 + d
    f1, f2 = f(x1), f(x2)
    if not (es_valido(f1) and es_valido(f2)):
        raise ValueError("La función f(x) produce valores no válidos o fuera de dominio en el intervalo de búsqueda.")

    iteraciones = []
    error = float("inf")
    x_opt, f_opt = (x1, f1) if mejor(f1, f2, tipo) else (x2, f2)
    i = 0
    while i < max_iter:
        x0, x1, x2, x3, f1, f2 = paso(f, x0, x1, x2, x3, f1, f2, tipo)
        x_opt, f_opt = (x1, f1) if mejor(f1, f2, tipo) else (x2, f2)
        if x_opt != 0:
            error = (1 - R) * abs((x3 - x0) / x_opt) * 100
        i += 1
        iteraciones.append({
            "iter": i, "xl": x0, "x1": x1, "x2": x2, "xu": x3, "fx1": f1, "fx2": f2,
            "xOpt": x_opt, "fOpt": f_opt, "intervalWidth": x3 - x0, "error": error,
        })
        if criterio == "tol" and (error < tol or (x3 - x0) < tol):
            break

    return {
        "optimumX": x_opt, "optimumF": f_opt, "type": tipo, "mode": criterio,
        "finalInterval": [x0, x3], "intervalWidth": x3 - x0, "iterations": iteraciones,
        "converged": error < tol or (x3 - x0) < tol, "totalIter": i, "finalError": error,
        "stopReason": motivo_parada(criterio, i, max_iter, error, tol),
    }


@router.post("/api/seccion-dorada-1d", summary="Sección Dorada univariada")
def endpoint_seccion_dorada_1d(datos: EntradaSeccionDorada1D):
    f = funcion_1d(datos.funcion)
    return limpiar(seccion_dorada_1d(f, datos.a, datos.b, datos.tipo, datos.tolerancia, datos.max_iter, datos.criterio))
