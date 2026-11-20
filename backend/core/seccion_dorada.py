"""Paso básico de la sección dorada, compartido por la versión 1D y la búsqueda coordinada 2D."""

R = ((5 ** 0.5) - 1) / 2  # razón áurea ≈ 0.618034


def mejor(fa, fb, tipo):
    """True si fa es mejor que fb según el objetivo (min / max)."""
    return fa < fb if tipo == "min" else fa > fb


def paso(f, x0, x1, x2, x3, f1, f2, tipo):
    """Reduce el intervalo [x0, x3] conservando el subintervalo que contiene el óptimo.

    Convención del taller: x1 = x3 - d (punto inferior), x2 = x0 + d (punto superior).
    """
    if mejor(f1, f2, tipo):
        x3 = x2
        x2, f2 = x1, f1
        d = (x3 - x0) * R
        x1 = x3 - d
        f1 = f(x1)
    else:
        x0 = x1
        x1, f1 = x2, f2
        d = (x3 - x0) * R
        x2 = x0 + d
        f2 = f(x2)
    return x0, x1, x2, x3, f1, f2
