// Rapier backend: gravity (m/s^2, +Y up) and damping (1/s). Their own file so the main thread can
// read them without loading the engine (a throw that starts on the main thread, such as one flown
// from a hand before the simulation takes over, must fall and slow the same way).
//
// The cannon-es worker uses -9.8 * 800 legacy units/s^2, about -2.5 m/s^2 at this board's
// scale: dice a few centimetres across falling at a quarter of real gravity, so they float,
// skid and creep for seconds. Twice that was tried (quick, but heavy, with little tumble), then
// 1.25x, which still read as heavy. 1.125x with bouncier dice and little spin damping
// (DEFAULT_TUNING) tumbles and rolls out: hand throws turn ~3 times on the desk instead of
// ~1.7, and roll ~2.2 s instead of ~1.4 before they stop.
export const RAPIER_GRAVITY = -9.8 * 800 * (0.016 / 50) * 1.125;

// cannon-es uses 0.1 (v *= 0.9 per second, Rapier c = -ln(0.9) = 0.105). Less, so a die keeps
// its speed and spin between impacts; the impacts and the desk's grip still stop it.
export const RAPIER_LINEAR_DAMPING = 0.05;
export const RAPIER_ANGULAR_DAMPING = 0.02;
