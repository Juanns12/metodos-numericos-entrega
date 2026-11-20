"""Endpoint: Regla de Simpson 3/8 compuesta (Taller 1 - Integración numérica)."""
import math

from fastapi import APIRouter

from core.expresiones import funcion_1d
from core.integracion import EntradaIntegracion, resolver
from core.utilidades import limpiar

router = APIRouter(tags=["Integración numérica"])


def peso_simpson38(i, n):
    # suma = f(a) + f(b) + 2 Σ múltiplos de 3 + 3 Σ resto;   I = suma * 3h / 8
    if i in (0, n):
        return 1
    return 2 if i % 3 == 0 else 3


def validar_n(n):
    if n < 3:
        raise ValueError("Para Simpson 3/8 se requiere al menos n = 3 subintervalos.")
    if n % 3 != 0:
        raise ValueError(
            f"La regla compuesta de Simpson 3/8 exige que 'n' sea MÚLTIPLO DE 3. El valor ingresado es {n}. "
            f"Pruebe con {math.ceil(n / 3) * 3}."
        )


@router.post("/api/simpson-38", summary="Regla de Simpson 3/8 (n fijo o por tolerancia)")
def endpoint_simpson_38(datos: EntradaIntegracion):
    f = funcion_1d(datos.funcion)
    return limpiar(resolver(f, datos, "Simpson 3/8", peso_simpson38, 3 / 8, 3, validar_n))
