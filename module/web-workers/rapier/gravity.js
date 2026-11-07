// Rapier backend: gravity, in m/s^2 (+Y up). Its own file so the main thread can read it
// without loading the engine (a throw that starts on the main thread, such as one flown from
// a hand before the simulation takes over, must fall the same way).
//
// The cannon-es worker uses -9.8 * 800 legacy units/s^2, about -2.5 m/s^2 at this board's
// scale: dice a few centimetres across falling at a quarter of real gravity, so they float,
// skid and creep for seconds. Twice that reads as weight: they land sooner, bounce lower and
// friction (mu * g) stops them twice as fast. Bench, 40 throws: 2d20 settle 2.45 s -> 1.62 s
// median (p95 3.48 -> 2.42), 10 mixed 2.88 -> 2.02, 10d6 -> 1.73, cocked dice not more.
export const RAPIER_GRAVITY = -9.8 * 800 * (0.016 / 50) * 2;
