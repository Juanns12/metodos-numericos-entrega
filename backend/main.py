"""API de Métodos Numéricos — FastAPI.

Cada endpoint está dedicado a un único método numérico:

    POST /api/biseccion              POST /api/trapecio
    POST /api/falsa-posicion         POST /api/simpson-13
    POST /api/secante                POST /api/simpson-38
    POST /api/newton-raphson         POST /api/interpolacion-directa
    POST /api/seccion-dorada-1d      POST /api/minimos-cuadrados
    POST /api/seccion-dorada-2d

Ejecutar (desde la carpeta backend):  uvicorn main:app --reload --port 8000
Documentación interactiva:            http://127.0.0.1:8000/docs
"""
import os
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from metodos import (
    biseccion,
    falsa_posicion,
    interpolacion_directa,
    minimos_cuadrados,
    newton_raphson,
    secante,
    seccion_dorada_1d,
    seccion_dorada_2d,
    simpson_13,
    simpson_38,
    trapecio,
)

app = FastAPI(
    title="API de Métodos Numéricos",
    description="Backend de la plataforma web de métodos numéricos. Un endpoint por método.",
    version="1.0.0",
)

# Configuración de CORS permitiendo la URL de Vercel y orígenes locales
VERCEL_PRODUCTION_URL = "https://frontend-coral-rho-swidic9f8h.vercel.app"

origins = [
    VERCEL_PRODUCTION_URL,
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

cors_env = os.environ.get("ALLOWED_ORIGINS", "")
if cors_env:
    for o in cors_env.split(","):
        o_clean = o.strip()
        if o_clean and o_clean not in origins:
            origins.append(o_clean)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ValueError)
async def manejar_error_valor(_: Request, exc: ValueError):
    """Errores matemáticos (Bolzano, n impar, derivada nula, sintaxis...) -> 422 con mensaje legible."""
    return JSONResponse(status_code=422, content={"detail": str(exc)})


for modulo in (
    biseccion, falsa_posicion, secante, newton_raphson,
    trapecio, simpson_13, simpson_38,
    interpolacion_directa, minimos_cuadrados,
    seccion_dorada_1d, seccion_dorada_2d,
):
    app.include_router(modulo.router)


@app.get("/api/salud", tags=["Sistema"])
def salud():
    return {"estado": "ok"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
