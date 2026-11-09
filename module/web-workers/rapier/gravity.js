// Rapier backend: gravity (m/s^2, +Y up) and damping (1/s). Their own file so the main thread can
// read them without loading the engine (a throw that starts on the main thread, such as one flown
// from a hand before the simulation takes over, must fall and slow the same way).
//
// The cannon-es worker's gravity: -9.8 * 800 legacy units/s^2, about -2.5 m/s^2 at this board's
// scale. Rapier copies cannon's feel (DEFAULT_TUNING), so it falls the same way. Heavier was
// tried (2x, 1.25x, 1.125x): with more gravity the dice landed harder and read as heavy.
export const RAPIER_GRAVITY = -9.8 * 800 * (0.016 / 50);

// cannon-es damping 0.1 means v *= 0.9 per second; Rapier uses v /= (1 + dt*c), c = -ln(0.9).
// Spin fades at half that: a die rolls out its last face instead of stopping dead on it.
export const RAPIER_LINEAR_DAMPING = -Math.log(0.9);
export const RAPIER_ANGULAR_DAMPING = 0.05;
