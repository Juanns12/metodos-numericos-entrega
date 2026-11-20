"""Endpoint: Regla de Simpson 1/3 compuesta (Taller 1 - Integración numérica)."""
from fastapi import APIRouter

from core.expresiones import funcion_1d
from core.integracion import EntradaIntegracion, resolver
from core.utilidades import limpiar

router = APIRouter(tags=["Integración numérica"])


def peso_simpson13(i, n):
    # suma = f(a) + f(b) + 4 Σ impares + 2 Σ pares;   I = suma * h / 3
    if i in (0, n):
        return 1
    return 2 if i % 2 == 0 else 4


def validar_n(n):
    if n < 2:
        raise ValueError("Para Simpson 1/3 se requiere al menos n = 2 subintervalos.")
    if n % 2 != 0:
        raise ValueError(
            f"La regla compuesta de Simpson 1/3 exige que 'n' sea un número PAR. El valor ingresado es {n}. Pruebe con {n + 1}."
        )


@router.post("/api/simpson-13", summary="Regla de Simpson 1/3 (n fijo o por tolerancia)")
def endpoint_simpson_13(datos: EntradaIntegracion):
    f = funcion_1d(datos.funcion)
    return limpiar(resolver(f, datos, "Simpson 1/3", peso_simpson13, 1 / 3, 2, validar_n))
