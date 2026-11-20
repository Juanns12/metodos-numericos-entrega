"""Endpoint: Sección Dorada multivariada por búsqueda coordinada cíclica (Ejercicios de Optimización)."""
import math
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from core.expresiones import funcion_2d
from core.seccion_dorada import R, paso
from core.utilidades import es_valido, limpiar, motivo_parada

router = APIRouter(tags=["Optimización"])

TOL_INTERNA = 1e-9
MAX_ITER_INTERNA = 100


class EntradaSeccionDorada2D(BaseModel):
    funcion: str = Field(..., examples=["(x - 2)^2 + (y + 1)^2"])
    x0: float = Field(0, description="Punto inicial x")
    y0: float = Field(0, description="Punto inicial y")
    x_min: float = -1
    x_max: float = 5
    y_min: float = -4
    y_max: float = 3
    tipo: Literal["min", "max"] = "min"
    tolerancia: float = Field(1e-4, gt=0, description="Error relativo porcentual entre ciclos")
    max_ciclos: int = Field(25, ge=1, le=1000, description="Tolerancia: máximo de ciclos. Iteraciones: ciclos exactos")
    orden: Literal["xy", "yx"] = "xy"
    criterio: Literal["tol", "iter"] = "tol"


def busqueda_en_eje(f2, punto, j, lim_inf, lim_sup, tipo):
    """Sección dorada 1D sobre la coordenada j fijando la otra (igual que el bucle interno del taller)."""
    def f(v):
        p = list(punto)
        p[j] = v
        return f2(p[0], p[1])

    x0, x3 = lim_inf, lim_sup
    d = (x3 - x0) * R
    x1, x2 = x3 - d, x0 + d
    f1, f2_ = f(x1), f(x2)
    k = 0
    while k < MAX_ITER_INTERNA and (x3 - x0) >= TOL_INTERNA:
        x0, x1, x2, x3, f1, f2_ = paso(f, x0, x1, x2, x3, f1, f2_, tipo)
        k += 1
    return (x0 + x3) / 2


def error_relativo_coord(nuevo, anterior):
    if abs(nuevo) < 1e-12:
        return abs(nuevo - anterior)
    return abs((nuevo - anterior) / nuevo)


def seccion_dorada_2d(f2, x0, y0, rango_x, rango_y, tipo, tol, max_ciclos, orden, criterio="tol"):
    if rango_x[0] >= rango_x[1] or rango_y[0] >= rango_y[1]:
        raise ValueError("Los rangos de búsqueda deben cumplir mín < máx en ambos ejes.")
    punto = [x0, y0]
    valor = f2(x0, y0)
    if not es_valido(valor):
        raise ValueError(f"La función f(x, y) no está definida en el punto inicial ({x0}, {y0}).")

    rangos = (rango_x, rango_y)
    ejes = (0, 1) if orden == "xy" else (1, 0)
    trayectoria = [{"x": x0, "y": y0, "z": valor, "step": 0, "phase": "Inicio", "note": "Punto Inicial"}]
    iteraciones = []
    error = 100.0
    ciclo = 0
    while ciclo < max_ciclos:
        ciclo += 1
        anterior = list(punto)
        valor_anterior = valor
        for j in ejes:
            punto[j] = busqueda_en_eje(f2, punto, j, rangos[j][0], rangos[j][1], tipo)
            valor = f2(punto[0], punto[1])
            otro = "y" if j == 0 else "x"
            trayectoria.append({
                "x": punto[0], "y": punto[1], "z": valor, "step": ciclo,
                "phase": "X" if j == 0 else "Y",
                "note": f"Opt. {'X' if j == 0 else 'Y'} ({otro}={punto[1 - j]:.4f})",
            })

        # Error del taller: máximo error relativo entre coordenadas (expresado en %)
        error = max(error_relativo_coord(punto[0], anterior[0]), error_relativo_coord(punto[1], anterior[1])) * 100
        paso_euclidiano = math.hypot(punto[0] - anterior[0], punto[1] - anterior[1])
        iteraciones.append({
            "cycle": ciclo, "x": punto[0], "y": punto[1], "fval": valor,
            "deltaF": abs(valor - valor_anterior), "stepDist": paso_euclidiano, "error": error,
        })
        if criterio == "tol" and error < tol:
            break

    return {
        "optimum": {"x": punto[0], "y": punto[1], "f": valor}, "type": tipo, "mode": criterio,
        "iterations": iteraciones, "trajectory": trayectoria, "totalCycles": ciclo,
        "finalError": error, "converged": error < tol,
        "stopReason": motivo_parada(criterio, ciclo, max_ciclos, error, tol, unidad="ciclos"),
    }


@router.post("/api/seccion-dorada-2d", summary="Sección Dorada multivariada (coordenadas cíclicas)")
def endpoint_seccion_dorada_2d(datos: EntradaSeccionDorada2D):
    f2 = funcion_2d(datos.funcion)
    return limpiar(seccion_dorada_2d(
        f2, datos.x0, datos.y0, (datos.x_min, datos.x_max), (datos.y_min, datos.y_max),
        datos.tipo, datos.tolerancia, datos.max_ciclos, datos.orden, datos.criterio,
    ))
