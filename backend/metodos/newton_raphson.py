"""Endpoint: Método de Newton-Raphson (Raíces de ecuaciones, método abierto)."""
from typing import Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from core.expresiones import derivada_simbolica, funcion_1d
from core.utilidades import error_relativo, es_valido, limpiar, motivo_parada

router = APIRouter(tags=["Raíces de ecuaciones"])


class EntradaNewton(BaseModel):
    funcion: str = Field(..., examples=["x^3 - x - 2"])
    derivada: Optional[str] = Field(None, examples=["3*x^2 - 1"], description="Vacío = derivada simbólica automática")
    x0: float = Field(..., examples=[2])
    tolerancia: float = Field(1e-4, gt=0)
    max_iter: int = Field(50, ge=1, le=10000)
    criterio: Literal["tol", "iter"] = "tol"


def derivada_numerica(f, x, h=1e-6):
    return (f(x + h) - f(x - h)) / (2 * h)


def newton_raphson(f, df, x, tol, max_iter, criterio):
    iteraciones = []
    error, abs_err = 100.0, None
    x_nuevo = x
    i = 0
    while i < max_iter:
        i += 1
        fx = f(x)
        dfx = df(x)
        if not es_valido(dfx):
            raise ValueError(f"La derivada evaluada en x = {x:.4f} no es finita.")
        if abs(dfx) < 1e-14:
            raise ValueError(
                f"Derivada nula o casi nula en x = {x:.5f}. La recta tangente es horizontal y el método no puede continuar."
            )
        # Fórmula del taller: x_nuevo = x - f(x) / f'(x)
        x_nuevo = x - fx / dfx
        error = error_relativo(x_nuevo, x)
        abs_err = abs(x_nuevo - x)
        f_nuevo = f(x_nuevo)
        iteraciones.append({
            "iter": i, "xCurr": x, "fx": fx, "dfx": dfx, "xNext": x_nuevo,
            "fNext": f_nuevo, "absErr": abs_err, "error": error,
        })
        if abs(f_nuevo) < 1e-12:
            break
        if criterio == "tol" and error < tol:
            break
        x = x_nuevo

    f_raiz = f(x_nuevo)
    return {
        "root": x_nuevo, "fRoot": f_raiz, "iterations": iteraciones, "mode": criterio,
        "converged": error < tol or abs(f_raiz) < 1e-6,
        "totalIter": i, "finalError": error, "absError": abs_err or 0,
        "stopReason": motivo_parada(criterio, i, max_iter, error, tol, abs(f_raiz) < 1e-12),
    }


@router.post("/api/newton-raphson", summary="Método de Newton-Raphson")
def endpoint_newton(datos: EntradaNewton):
    f = funcion_1d(datos.funcion)
    es_numerica = False
    if datos.derivada and datos.derivada.strip():
        df = funcion_1d(datos.derivada)
        texto = f"Analítica: {datos.derivada.strip()}"
    else:
        try:
            expr_d = derivada_simbolica(datos.funcion)
            df = funcion_1d(expr_d)
            texto = f"Simbólica: {expr_d}"
        except Exception:  # noqa: BLE001
            df = lambda v: derivada_numerica(f, v)  # noqa: E731
            es_numerica = True
            texto = "Aproximación numérica (diferencias centradas)"
    resultado = newton_raphson(f, df, datos.x0, datos.tolerancia, datos.max_iter, datos.criterio)
    resultado["isNumericDeriv"] = es_numerica
    resultado["derivativeUsed"] = texto
    return limpiar(resultado)
