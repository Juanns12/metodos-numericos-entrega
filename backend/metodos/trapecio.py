"""Endpoint: Regla del Trapecio simple y compuesta (Taller 1 - Integración numérica)."""
from fastapi import APIRouter

from core.expresiones import funcion_1d
from core.integracion import EntradaIntegracion, resolver
from core.utilidades import limpiar

router = APIRouter(tags=["Integración numérica"])


def peso_trapecio(i, n):
    # suma = (f(a) + f(b))/2 + Σ f(xi);   I = suma * h
    return 0.5 if i in (0, n) else 1.0


def validar_n(n):
    if n < 1:
        raise ValueError("El número de subintervalos (n) debe ser al menos 1.")


@router.post("/api/trapecio", summary="Regla del Trapecio (n fijo o por tolerancia)")
def endpoint_trapecio(datos: EntradaIntegracion):
    f = funcion_1d(datos.funcion)
    return limpiar(resolver(f, datos, "Trapecio", peso_trapecio, 1.0, 1, validar_n))
