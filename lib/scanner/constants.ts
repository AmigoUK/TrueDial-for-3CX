// Shared scan/badge constants. The badge cap and the scanner cap are the SAME
// number by design ("200+" appears exactly when the scanner stops counting), so
// they live in one place.

/** Per-page highlight cap (§7.2): beyond this, only a counter is reported. */
export const MAX_MATCHES = 200;
