/**
 * Records what objects are colliding with each other
 */

/**
 * A 3x3 matrix.
 * Authored by {@link http://github.com/schteppe/ schteppe}
 */
class Mat3 {
  /**
   * A vector of length 9, containing all matrix elements.
   */

  /**
   * @param elements A vector of length 9, containing all matrix elements.
   */
  constructor(elements) {
    if (elements === void 0) {
      elements = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    this.elements = elements;
  }

  /**
   * Sets the matrix to identity
   * @todo Should perhaps be renamed to `setIdentity()` to be more clear.
   * @todo Create another function that immediately creates an identity matrix eg. `eye()`
   */
  identity() {
    const e = this.elements;
    e[0] = 1;
    e[1] = 0;
    e[2] = 0;
    e[3] = 0;
    e[4] = 1;
    e[5] = 0;
    e[6] = 0;
    e[7] = 0;
    e[8] = 1;
  }

  /**
   * Set all elements to zero
   */
  setZero() {
    const e = this.elements;
    e[0] = 0;
    e[1] = 0;
    e[2] = 0;
    e[3] = 0;
    e[4] = 0;
    e[5] = 0;
    e[6] = 0;
    e[7] = 0;
    e[8] = 0;
  }

  /**
   * Sets the matrix diagonal elements from a Vec3
   */
  setTrace(vector) {
    const e = this.elements;
    e[0] = vector.x;
    e[4] = vector.y;
    e[8] = vector.z;
  }

  /**
   * Gets the matrix diagonal elements
   */
  getTrace(target) {
    if (target === void 0) {
      target = new Vec3();
    }
    const e = this.elements;
    target.x = e[0];
    target.y = e[4];
    target.z = e[8];
    return target;
  }

  /**
   * Matrix-Vector multiplication
   * @param v The vector to multiply with
   * @param target Optional, target to save the result in.
   */
  vmult(v, target) {
    if (target === void 0) {
      target = new Vec3();
    }
    const e = this.elements;
    const x = v.x;
    const y = v.y;
    const z = v.z;
    target.x = e[0] * x + e[1] * y + e[2] * z;
    target.y = e[3] * x + e[4] * y + e[5] * z;
    target.z = e[6] * x + e[7] * y + e[8] * z;
    return target;
  }

  /**
   * Matrix-scalar multiplication
   */
  smult(s) {
    for (let i = 0; i < this.elements.length; i++) {
      this.elements[i] *= s;
    }
  }

  /**
   * Matrix multiplication
   * @param matrix Matrix to multiply with from left side.
   */
  mmult(matrix, target) {
    if (target === void 0) {
      target = new Mat3();
    }
    const A = this.elements;
    const B = matrix.elements;
    const T = target.elements;
    const a11 = A[0],
      a12 = A[1],
      a13 = A[2],
      a21 = A[3],
      a22 = A[4],
      a23 = A[5],
      a31 = A[6],
      a32 = A[7],
      a33 = A[8];
    const b11 = B[0],
      b12 = B[1],
      b13 = B[2],
      b21 = B[3],
      b22 = B[4],
      b23 = B[5],
      b31 = B[6],
      b32 = B[7],
      b33 = B[8];
    T[0] = a11 * b11 + a12 * b21 + a13 * b31;
    T[1] = a11 * b12 + a12 * b22 + a13 * b32;
    T[2] = a11 * b13 + a12 * b23 + a13 * b33;
    T[3] = a21 * b11 + a22 * b21 + a23 * b31;
    T[4] = a21 * b12 + a22 * b22 + a23 * b32;
    T[5] = a21 * b13 + a22 * b23 + a23 * b33;
    T[6] = a31 * b11 + a32 * b21 + a33 * b31;
    T[7] = a31 * b12 + a32 * b22 + a33 * b32;
    T[8] = a31 * b13 + a32 * b23 + a33 * b33;
    return target;
  }

  /**
   * Scale each column of the matrix
   */
  scale(vector, target) {
    if (target === void 0) {
      target = new Mat3();
    }
    const e = this.elements;
    const t = target.elements;
    for (let i = 0; i !== 3; i++) {
      t[3 * i + 0] = vector.x * e[3 * i + 0];
      t[3 * i + 1] = vector.y * e[3 * i + 1];
      t[3 * i + 2] = vector.z * e[3 * i + 2];
    }
    return target;
  }

  /**
   * Solve Ax=b
   * @param b The right hand side
   * @param target Optional. Target vector to save in.
   * @return The solution x
   * @todo should reuse arrays
   */
  solve(b, target) {
    if (target === void 0) {
      target = new Vec3();
    }
    // Construct equations
    const nr = 3; // num rows
    const nc = 4; // num cols
    const eqns = [];
    let i;
    let j;
    for (i = 0; i < nr * nc; i++) {
      eqns.push(0);
    }
    for (i = 0; i < 3; i++) {
      for (j = 0; j < 3; j++) {
        eqns[i + nc * j] = this.elements[i + 3 * j];
      }
    }
    eqns[3 + 4 * 0] = b.x;
    eqns[3 + 4 * 1] = b.y;
    eqns[3 + 4 * 2] = b.z;

    // Compute right upper triangular version of the matrix - Gauss elimination
    let n = 3;
    const k = n;
    let np;
    const kp = 4; // num rows
    let p;
    do {
      i = k - n;
      if (eqns[i + nc * i] === 0) {
        // the pivot is null, swap lines
        for (j = i + 1; j < k; j++) {
          if (eqns[i + nc * j] !== 0) {
            np = kp;
            do {
              // do ligne( i ) = ligne( i ) + ligne( k )
              p = kp - np;
              eqns[p + nc * i] += eqns[p + nc * j];
            } while (--np);
            break;
          }
        }
      }
      if (eqns[i + nc * i] !== 0) {
        for (j = i + 1; j < k; j++) {
          const multiplier = eqns[i + nc * j] / eqns[i + nc * i];
          np = kp;
          do {
            // do ligne( k ) = ligne( k ) - multiplier * ligne( i )
            p = kp - np;
            eqns[p + nc * j] = p <= i ? 0 : eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
          } while (--np);
        }
      }
    } while (--n);

    // Get the solution
    target.z = eqns[2 * nc + 3] / eqns[2 * nc + 2];
    target.y = (eqns[1 * nc + 3] - eqns[1 * nc + 2] * target.z) / eqns[1 * nc + 1];
    target.x = (eqns[0 * nc + 3] - eqns[0 * nc + 2] * target.z - eqns[0 * nc + 1] * target.y) / eqns[0 * nc + 0];
    if (isNaN(target.x) || isNaN(target.y) || isNaN(target.z) || target.x === Infinity || target.y === Infinity || target.z === Infinity) {
      throw `Could not solve equation! Got x=[${target.toString()}], b=[${b.toString()}], A=[${this.toString()}]`;
    }
    return target;
  }

  /**
   * Get an element in the matrix by index. Index starts at 0, not 1!!!
   * @param value If provided, the matrix element will be set to this value.
   */

  e(row, column, value) {
    if (value === undefined) {
      return this.elements[column + 3 * row];
    } else {
      // Set value
      this.elements[column + 3 * row] = value;
    }
  }

  /**
   * Copy another matrix into this matrix object.
   */
  copy(matrix) {
    for (let i = 0; i < matrix.elements.length; i++) {
      this.elements[i] = matrix.elements[i];
    }
    return this;
  }

  /**
   * Returns a string representation of the matrix.
   */
  toString() {
    let r = '';
    const sep = ',';
    for (let i = 0; i < 9; i++) {
      r += this.elements[i] + sep;
    }
    return r;
  }

  /**
   * reverse the matrix
   * @param target Target matrix to save in.
   * @return The solution x
   */
  reverse(target) {
    if (target === void 0) {
      target = new Mat3();
    }
    // Construct equations
    const nr = 3; // num rows
    const nc = 6; // num cols
    const eqns = reverse_eqns;
    let i;
    let j;
    for (i = 0; i < 3; i++) {
      for (j = 0; j < 3; j++) {
        eqns[i + nc * j] = this.elements[i + 3 * j];
      }
    }
    eqns[3 + 6 * 0] = 1;
    eqns[3 + 6 * 1] = 0;
    eqns[3 + 6 * 2] = 0;
    eqns[4 + 6 * 0] = 0;
    eqns[4 + 6 * 1] = 1;
    eqns[4 + 6 * 2] = 0;
    eqns[5 + 6 * 0] = 0;
    eqns[5 + 6 * 1] = 0;
    eqns[5 + 6 * 2] = 1;

    // Compute right upper triangular version of the matrix - Gauss elimination
    let n = 3;
    const k = n;
    let np;
    const kp = nc; // num rows
    let p;
    do {
      i = k - n;
      if (eqns[i + nc * i] === 0) {
        // the pivot is null, swap lines
        for (j = i + 1; j < k; j++) {
          if (eqns[i + nc * j] !== 0) {
            np = kp;
            do {
              // do line( i ) = line( i ) + line( k )
              p = kp - np;
              eqns[p + nc * i] += eqns[p + nc * j];
            } while (--np);
            break;
          }
        }
      }
      if (eqns[i + nc * i] !== 0) {
        for (j = i + 1; j < k; j++) {
          const multiplier = eqns[i + nc * j] / eqns[i + nc * i];
          np = kp;
          do {
            // do line( k ) = line( k ) - multiplier * line( i )
            p = kp - np;
            eqns[p + nc * j] = p <= i ? 0 : eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
          } while (--np);
        }
      }
    } while (--n);

    // eliminate the upper left triangle of the matrix
    i = 2;
    do {
      j = i - 1;
      do {
        const multiplier = eqns[i + nc * j] / eqns[i + nc * i];
        np = nc;
        do {
          p = nc - np;
          eqns[p + nc * j] = eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
        } while (--np);
      } while (j--);
    } while (--i);

    // operations on the diagonal
    i = 2;
    do {
      const multiplier = 1 / eqns[i + nc * i];
      np = nc;
      do {
        p = nc - np;
        eqns[p + nc * i] = eqns[p + nc * i] * multiplier;
      } while (--np);
    } while (i--);
    i = 2;
    do {
      j = 2;
      do {
        p = eqns[nr + j + nc * i];
        if (isNaN(p) || p === Infinity) {
          throw `Could not reverse! A=[${this.toString()}]`;
        }
        target.e(i, j, p);
      } while (j--);
    } while (i--);
    return target;
  }

  /**
   * Set the matrix from a quaterion
   */
  setRotationFromQuaternion(q) {
    const x = q.x;
    const y = q.y;
    const z = q.z;
    const w = q.w;
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const xy = x * y2;
    const xz = x * z2;
    const yy = y * y2;
    const yz = y * z2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;
    const e = this.elements;
    e[3 * 0 + 0] = 1 - (yy + zz);
    e[3 * 0 + 1] = xy - wz;
    e[3 * 0 + 2] = xz + wy;
    e[3 * 1 + 0] = xy + wz;
    e[3 * 1 + 1] = 1 - (xx + zz);
    e[3 * 1 + 2] = yz - wx;
    e[3 * 2 + 0] = xz - wy;
    e[3 * 2 + 1] = yz + wx;
    e[3 * 2 + 2] = 1 - (xx + yy);
    return this;
  }

  /**
   * Transpose the matrix
   * @param target Optional. Where to store the result.
   * @return The target Mat3, or a new Mat3 if target was omitted.
   */
  transpose(target) {
    if (target === void 0) {
      target = new Mat3();
    }
    const M = this.elements;
    const T = target.elements;
    let tmp;

    //Set diagonals
    T[0] = M[0];
    T[4] = M[4];
    T[8] = M[8];
    tmp = M[1];
    T[1] = M[3];
    T[3] = tmp;
    tmp = M[2];
    T[2] = M[6];
    T[6] = tmp;
    tmp = M[5];
    T[5] = M[7];
    T[7] = tmp;
    return target;
  }
}
const reverse_eqns = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

/**
 * 3-dimensional vector
 * @example
 *     const v = new Vec3(1, 2, 3)
 *     console.log('x=' + v.x) // x=1
 */
class Vec3 {
  constructor(x, y, z) {
    if (x === void 0) {
      x = 0.0;
    }
    if (y === void 0) {
      y = 0.0;
    }
    if (z === void 0) {
      z = 0.0;
    }
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Vector cross product
   * @param target Optional target to save in.
   */
  cross(vector, target) {
    if (target === void 0) {
      target = new Vec3();
    }
    const vx = vector.x;
    const vy = vector.y;
    const vz = vector.z;
    const x = this.x;
    const y = this.y;
    const z = this.z;
    target.x = y * vz - z * vy;
    target.y = z * vx - x * vz;
    target.z = x * vy - y * vx;
    return target;
  }

  /**
   * Set the vectors' 3 elements
   */
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  /**
   * Set all components of the vector to zero.
   */
  setZero() {
    this.x = this.y = this.z = 0;
  }

  /**
   * Vector addition
   */

  vadd(vector, target) {
    if (target) {
      target.x = vector.x + this.x;
      target.y = vector.y + this.y;
      target.z = vector.z + this.z;
    } else {
      return new Vec3(this.x + vector.x, this.y + vector.y, this.z + vector.z);
    }
  }

  /**
   * Vector subtraction
   * @param target Optional target to save in.
   */

  vsub(vector, target) {
    if (target) {
      target.x = this.x - vector.x;
      target.y = this.y - vector.y;
      target.z = this.z - vector.z;
    } else {
      return new Vec3(this.x - vector.x, this.y - vector.y, this.z - vector.z);
    }
  }

  /**
   * Get the cross product matrix a_cross from a vector, such that a x b = a_cross * b = c
   *
   * See {@link https://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf Umeå University Lecture}
   */
  crossmat() {
    return new Mat3([0, -this.z, this.y, this.z, 0, -this.x, -this.y, this.x, 0]);
  }

  /**
   * Normalize the vector. Note that this changes the values in the vector.
    * @return Returns the norm of the vector
   */
  normalize() {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const n = Math.sqrt(x * x + y * y + z * z);
    if (n > 0.0) {
      const invN = 1 / n;
      this.x *= invN;
      this.y *= invN;
      this.z *= invN;
    } else {
      // Make something up
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }
    return n;
  }

  /**
   * Get the version of this vector that is of length 1.
   * @param target Optional target to save in
   * @return Returns the unit vector
   */
  unit(target) {
    if (target === void 0) {
      target = new Vec3();
    }
    const x = this.x;
    const y = this.y;
    const z = this.z;
    let ninv = Math.sqrt(x * x + y * y + z * z);
    if (ninv > 0.0) {
      ninv = 1.0 / ninv;
      target.x = x * ninv;
      target.y = y * ninv;
      target.z = z * ninv;
    } else {
      target.x = 1;
      target.y = 0;
      target.z = 0;
    }
    return target;
  }

  /**
   * Get the length of the vector
   */
  length() {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    return Math.sqrt(x * x + y * y + z * z);
  }

  /**
   * Get the squared length of the vector.
   */
  lengthSquared() {
    return this.dot(this);
  }

  /**
   * Get distance from this point to another point
   */
  distanceTo(p) {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const px = p.x;
    const py = p.y;
    const pz = p.z;
    return Math.sqrt((px - x) * (px - x) + (py - y) * (py - y) + (pz - z) * (pz - z));
  }

  /**
   * Get squared distance from this point to another point
   */
  distanceSquared(p) {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const px = p.x;
    const py = p.y;
    const pz = p.z;
    return (px - x) * (px - x) + (py - y) * (py - y) + (pz - z) * (pz - z);
  }

  /**
   * Multiply all the components of the vector with a scalar.
   * @param target The vector to save the result in.
   */
  scale(scalar, target) {
    if (target === void 0) {
      target = new Vec3();
    }
    const x = this.x;
    const y = this.y;
    const z = this.z;
    target.x = scalar * x;
    target.y = scalar * y;
    target.z = scalar * z;
    return target;
  }

  /**
   * Multiply the vector with an other vector, component-wise.
   * @param target The vector to save the result in.
   */
  vmul(vector, target) {
    if (target === void 0) {
      target = new Vec3();
    }
    target.x = vector.x * this.x;
    target.y = vector.y * this.y;
    target.z = vector.z * this.z;
    return target;
  }

  /**
   * Scale a vector and add it to this vector. Save the result in "target". (target = this + vector * scalar)
   * @param target The vector to save the result in.
   */
  addScaledVector(scalar, vector, target) {
    if (target === void 0) {
      target = new Vec3();
    }
    target.x = this.x + scalar * vector.x;
    target.y = this.y + scalar * vector.y;
    target.z = this.z + scalar * vector.z;
    return target;
  }

  /**
   * Calculate dot product
   * @param vector
   */
  dot(vector) {
    return this.x * vector.x + this.y * vector.y + this.z * vector.z;
  }
  isZero() {
    return this.x === 0 && this.y === 0 && this.z === 0;
  }

  /**
   * Make the vector point in the opposite direction.
   * @param target Optional target to save in
   */
  negate(target) {
    if (target === void 0) {
      target = new Vec3();
    }
    target.x = -this.x;
    target.y = -this.y;
    target.z = -this.z;
    return target;
  }

  /**
   * Compute two artificial tangents to the vector
   * @param t1 Vector object to save the first tangent in
   * @param t2 Vector object to save the second tangent in
   */
  tangents(t1, t2) {
    const norm = this.length();
    if (norm > 0.0) {
      const n = Vec3_tangents_n;
      const inorm = 1 / norm;
      n.set(this.x * inorm, this.y * inorm, this.z * inorm);
      const randVec = Vec3_tangents_randVec;
      if (Math.abs(n.x) < 0.9) {
        randVec.set(1, 0, 0);
        n.cross(randVec, t1);
      } else {
        randVec.set(0, 1, 0);
        n.cross(randVec, t1);
      }
      n.cross(t1, t2);
    } else {
      // The normal length is zero, make something up
      t1.set(1, 0, 0);
      t2.set(0, 1, 0);
    }
  }

  /**
   * Converts to a more readable format
   */
  toString() {
    return `${this.x},${this.y},${this.z}`;
  }

  /**
   * Converts to an array
   */
  toArray() {
    return [this.x, this.y, this.z];
  }

  /**
   * Copies value of source to this vector.
   */
  copy(vector) {
    this.x = vector.x;
    this.y = vector.y;
    this.z = vector.z;
    return this;
  }

  /**
   * Do a linear interpolation between two vectors
   * @param t A number between 0 and 1. 0 will make this function return u, and 1 will make it return v. Numbers in between will generate a vector in between them.
   */
  lerp(vector, t, target) {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    target.x = x + (vector.x - x) * t;
    target.y = y + (vector.y - y) * t;
    target.z = z + (vector.z - z) * t;
  }

  /**
   * Check if a vector equals is almost equal to another one.
   */
  almostEquals(vector, precision) {
    if (precision === void 0) {
      precision = 1e-6;
    }
    if (Math.abs(this.x - vector.x) > precision || Math.abs(this.y - vector.y) > precision || Math.abs(this.z - vector.z) > precision) {
      return false;
    }
    return true;
  }

  /**
   * Check if a vector is almost zero
   */
  almostZero(precision) {
    if (precision === void 0) {
      precision = 1e-6;
    }
    if (Math.abs(this.x) > precision || Math.abs(this.y) > precision || Math.abs(this.z) > precision) {
      return false;
    }
    return true;
  }

  /**
   * Check if the vector is anti-parallel to another vector.
   * @param precision Set to zero for exact comparisons
   */
  isAntiparallelTo(vector, precision) {
    this.negate(antip_neg);
    return antip_neg.almostEquals(vector, precision);
  }

  /**
   * Clone the vector
   */
  clone() {
    return new Vec3(this.x, this.y, this.z);
  }
}
Vec3.ZERO = new Vec3(0, 0, 0);
Vec3.UNIT_X = new Vec3(1, 0, 0);
Vec3.UNIT_Y = new Vec3(0, 1, 0);
Vec3.UNIT_Z = new Vec3(0, 0, 1);
const Vec3_tangents_n = new Vec3();
const Vec3_tangents_randVec = new Vec3();
const antip_neg = new Vec3();

/**
 * Axis aligned bounding box class.
 */
class AABB {
  /**
   * The lower bound of the bounding box
   */

  /**
   * The upper bound of the bounding box
   */

  constructor(options) {
    if (options === void 0) {
      options = {};
    }
    this.lowerBound = new Vec3();
    this.upperBound = new Vec3();
    if (options.lowerBound) {
      this.lowerBound.copy(options.lowerBound);
    }
    if (options.upperBound) {
      this.upperBound.copy(options.upperBound);
    }
  }

  /**
   * Set the AABB bounds from a set of points.
   * @param points An array of Vec3's.
   * @return The self object
   */
  setFromPoints(points, position, quaternion, skinSize) {
    const l = this.lowerBound;
    const u = this.upperBound;
    const q = quaternion;

    // Set to the first point
    l.copy(points[0]);
    if (q) {
      q.vmult(l, l);
    }
    u.copy(l);
    for (let i = 1; i < points.length; i++) {
      let p = points[i];
      if (q) {
        q.vmult(p, tmp$1);
        p = tmp$1;
      }
      if (p.x > u.x) {
        u.x = p.x;
      }
      if (p.x < l.x) {
        l.x = p.x;
      }
      if (p.y > u.y) {
        u.y = p.y;
      }
      if (p.y < l.y) {
        l.y = p.y;
      }
      if (p.z > u.z) {
        u.z = p.z;
      }
      if (p.z < l.z) {
        l.z = p.z;
      }
    }

    // Add offset
    if (position) {
      position.vadd(l, l);
      position.vadd(u, u);
    }
    if (skinSize) {
      l.x -= skinSize;
      l.y -= skinSize;
      l.z -= skinSize;
      u.x += skinSize;
      u.y += skinSize;
      u.z += skinSize;
    }
    return this;
  }

  /**
   * Copy bounds from an AABB to this AABB
   * @param aabb Source to copy from
   * @return The this object, for chainability
   */
  copy(aabb) {
    this.lowerBound.copy(aabb.lowerBound);
    this.upperBound.copy(aabb.upperBound);
    return this;
  }

  /**
   * Clone an AABB
   */
  clone() {
    return new AABB().copy(this);
  }

  /**
   * Extend this AABB so that it covers the given AABB too.
   */
  extend(aabb) {
    this.lowerBound.x = Math.min(this.lowerBound.x, aabb.lowerBound.x);
    this.upperBound.x = Math.max(this.upperBound.x, aabb.upperBound.x);
    this.lowerBound.y = Math.min(this.lowerBound.y, aabb.lowerBound.y);
    this.upperBound.y = Math.max(this.upperBound.y, aabb.upperBound.y);
    this.lowerBound.z = Math.min(this.lowerBound.z, aabb.lowerBound.z);
    this.upperBound.z = Math.max(this.upperBound.z, aabb.upperBound.z);
  }

  /**
   * Returns true if the given AABB overlaps this AABB.
   */
  overlaps(aabb) {
    const l1 = this.lowerBound;
    const u1 = this.upperBound;
    const l2 = aabb.lowerBound;
    const u2 = aabb.upperBound;

    //      l2        u2
    //      |---------|
    // |--------|
    // l1       u1

    const overlapsX = l2.x <= u1.x && u1.x <= u2.x || l1.x <= u2.x && u2.x <= u1.x;
    const overlapsY = l2.y <= u1.y && u1.y <= u2.y || l1.y <= u2.y && u2.y <= u1.y;
    const overlapsZ = l2.z <= u1.z && u1.z <= u2.z || l1.z <= u2.z && u2.z <= u1.z;
    return overlapsX && overlapsY && overlapsZ;
  }

  // Mostly for debugging
  volume() {
    const l = this.lowerBound;
    const u = this.upperBound;
    return (u.x - l.x) * (u.y - l.y) * (u.z - l.z);
  }

  /**
   * Returns true if the given AABB is fully contained in this AABB.
   */
  contains(aabb) {
    const l1 = this.lowerBound;
    const u1 = this.upperBound;
    const l2 = aabb.lowerBound;
    const u2 = aabb.upperBound;

    //      l2        u2
    //      |---------|
    // |---------------|
    // l1              u1

    return l1.x <= l2.x && u1.x >= u2.x && l1.y <= l2.y && u1.y >= u2.y && l1.z <= l2.z && u1.z >= u2.z;
  }
  getCorners(a, b, c, d, e, f, g, h) {
    const l = this.lowerBound;
    const u = this.upperBound;
    a.copy(l);
    b.set(u.x, l.y, l.z);
    c.set(u.x, u.y, l.z);
    d.set(l.x, u.y, u.z);
    e.set(u.x, l.y, u.z);
    f.set(l.x, u.y, l.z);
    g.set(l.x, l.y, u.z);
    h.copy(u);
  }

  /**
   * Get the representation of an AABB in another frame.
   * @return The "target" AABB object.
   */
  toLocalFrame(frame, target) {
    const corners = transformIntoFrame_corners;
    const a = corners[0];
    const b = corners[1];
    const c = corners[2];
    const d = corners[3];
    const e = corners[4];
    const f = corners[5];
    const g = corners[6];
    const h = corners[7];

    // Get corners in current frame
    this.getCorners(a, b, c, d, e, f, g, h);

    // Transform them to new local frame
    for (let i = 0; i !== 8; i++) {
      const corner = corners[i];
      frame.pointToLocal(corner, corner);
    }
    return target.setFromPoints(corners);
  }

  /**
   * Get the representation of an AABB in the global frame.
   * @return The "target" AABB object.
   */
  toWorldFrame(frame, target) {
    const corners = transformIntoFrame_corners;
    const a = corners[0];
    const b = corners[1];
    const c = corners[2];
    const d = corners[3];
    const e = corners[4];
    const f = corners[5];
    const g = corners[6];
    const h = corners[7];

    // Get corners in current frame
    this.getCorners(a, b, c, d, e, f, g, h);

    // Transform them to new local frame
    for (let i = 0; i !== 8; i++) {
      const corner = corners[i];
      frame.pointToWorld(corner, corner);
    }
    return target.setFromPoints(corners);
  }

  /**
   * Check if the AABB is hit by a ray.
   */
  overlapsRay(ray) {
    const {
      direction,
      from
    } = ray;
    // const t = 0

    // ray.direction is unit direction vector of ray
    const dirFracX = 1 / direction.x;
    const dirFracY = 1 / direction.y;
    const dirFracZ = 1 / direction.z;

    // this.lowerBound is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
    const t1 = (this.lowerBound.x - from.x) * dirFracX;
    const t2 = (this.upperBound.x - from.x) * dirFracX;
    const t3 = (this.lowerBound.y - from.y) * dirFracY;
    const t4 = (this.upperBound.y - from.y) * dirFracY;
    const t5 = (this.lowerBound.z - from.z) * dirFracZ;
    const t6 = (this.upperBound.z - from.z) * dirFracZ;

    // const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)));
    // const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)));
    const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
    const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

    // if tmax < 0, ray (line) is intersecting AABB, but whole AABB is behing us
    if (tmax < 0) {
      //t = tmax;
      return false;
    }

    // if tmin > tmax, ray doesn't intersect AABB
    if (tmin > tmax) {
      //t = tmax;
      return false;
    }
    return true;
  }
}
const tmp$1 = new Vec3();
const transformIntoFrame_corners = [new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3()];

/**
 * Collision "matrix".
 * It's actually a triangular-shaped array of whether two bodies are touching this step, for reference next step
 */
class ArrayCollisionMatrix {
  /**
   * The matrix storage.
   */

  constructor() {
    this.matrix = [];
  }

  /**
   * Get an element
   */
  get(bi, bj) {
    let {
      index: i
    } = bi;
    let {
      index: j
    } = bj;
    if (j > i) {
      const temp = j;
      j = i;
      i = temp;
    }
    return this.matrix[(i * (i + 1) >> 1) + j - 1];
  }

  /**
   * Set an element
   */
  set(bi, bj, value) {
    let {
      index: i
    } = bi;
    let {
      index: j
    } = bj;
    if (j > i) {
      const temp = j;
      j = i;
      i = temp;
    }
    this.matrix[(i * (i + 1) >> 1) + j - 1] = value ? 1 : 0;
  }

  /**
   * Sets all elements to zero
   */
  reset() {
    for (let i = 0, l = this.matrix.length; i !== l; i++) {
      this.matrix[i] = 0;
    }
  }

  /**
   * Sets the max number of objects
   */
  setNumObjects(n) {
    this.matrix.length = n * (n - 1) >> 1;
  }
}

/**
 * Base class for objects that dispatches events.
 */
class EventTarget {
  /**
   * Add an event listener
   * @return The self object, for chainability.
   */
  addEventListener(type, listener) {
    if (this._listeners === undefined) {
      this._listeners = {};
    }
    const listeners = this._listeners;
    if (listeners[type] === undefined) {
      listeners[type] = [];
    }
    if (!listeners[type].includes(listener)) {
      listeners[type].push(listener);
    }
    return this;
  }

  /**
   * Check if an event listener is added
   */
  hasEventListener(type, listener) {
    if (this._listeners === undefined) {
      return false;
    }
    const listeners = this._listeners;
    if (listeners[type] !== undefined && listeners[type].includes(listener)) {
      return true;
    }
    return false;
  }

  /**
   * Check if any event listener of the given type is added
   */
  hasAnyEventListener(type) {
    if (this._listeners === undefined) {
      return false;
    }
    const listeners = this._listeners;
    return listeners[type] !== undefined;
  }

  /**
   * Remove an event listener
   * @return The self object, for chainability.
   */
  removeEventListener(type, listener) {
    if (this._listeners === undefined) {
      return this;
    }
    const listeners = this._listeners;
    if (listeners[type] === undefined) {
      return this;
    }
    const index = listeners[type].indexOf(listener);
    if (index !== -1) {
      listeners[type].splice(index, 1);
    }
    return this;
  }

  /**
   * Emit an event.
   * @return The self object, for chainability.
   */
  dispatchEvent(event) {
    if (this._listeners === undefined) {
      return this;
    }
    const listeners = this._listeners;
    const listenerArray = listeners[event.type];
    if (listenerArray !== undefined) {
      event.target = this;
      for (let i = 0, l = listenerArray.length; i < l; i++) {
        listenerArray[i].call(this, event);
      }
    }
    return this;
  }
}

/**
 * A Quaternion describes a rotation in 3D space. The Quaternion is mathematically defined as Q = x*i + y*j + z*k + w, where (i,j,k) are imaginary basis vectors. (x,y,z) can be seen as a vector related to the axis of rotation, while the real multiplier, w, is related to the amount of rotation.
 * @param x Multiplier of the imaginary basis vector i.
 * @param y Multiplier of the imaginary basis vector j.
 * @param z Multiplier of the imaginary basis vector k.
 * @param w Multiplier of the real part.
 * @see http://en.wikipedia.org/wiki/Quaternion
 */
let Quaternion$1 = class Quaternion {
  constructor(x, y, z, w) {
    if (x === void 0) {
      x = 0;
    }
    if (y === void 0) {
      y = 0;
    }
    if (z === void 0) {
      z = 0;
    }
    if (w === void 0) {
      w = 1;
    }
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  /**
   * Set the value of the quaternion.
   */
  set(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  /**
   * Convert to a readable format
   * @return "x,y,z,w"
   */
  toString() {
    return `${this.x},${this.y},${this.z},${this.w}`;
  }

  /**
   * Convert to an Array
   * @return [x, y, z, w]
   */
  toArray() {
    return [this.x, this.y, this.z, this.w];
  }

  /**
   * Set the quaternion components given an axis and an angle in radians.
   */
  setFromAxisAngle(vector, angle) {
    const s = Math.sin(angle * 0.5);
    this.x = vector.x * s;
    this.y = vector.y * s;
    this.z = vector.z * s;
    this.w = Math.cos(angle * 0.5);
    return this;
  }

  /**
   * Converts the quaternion to [ axis, angle ] representation.
   * @param targetAxis A vector object to reuse for storing the axis.
   * @return An array, first element is the axis and the second is the angle in radians.
   */
  toAxisAngle(targetAxis) {
    if (targetAxis === void 0) {
      targetAxis = new Vec3();
    }
    this.normalize(); // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
    const angle = 2 * Math.acos(this.w);
    const s = Math.sqrt(1 - this.w * this.w); // assuming quaternion normalised then w is less than 1, so term always positive.
    if (s < 0.001) {
      // test to avoid divide by zero, s is always positive due to sqrt
      // if s close to zero then direction of axis not important
      targetAxis.x = this.x; // if it is important that axis is normalised then replace with x=1; y=z=0;
      targetAxis.y = this.y;
      targetAxis.z = this.z;
    } else {
      targetAxis.x = this.x / s; // normalise axis
      targetAxis.y = this.y / s;
      targetAxis.z = this.z / s;
    }
    return [targetAxis, angle];
  }

  /**
   * Set the quaternion value given two vectors. The resulting rotation will be the needed rotation to rotate u to v.
   */
  setFromVectors(u, v) {
    if (u.isAntiparallelTo(v)) {
      const t1 = sfv_t1;
      const t2 = sfv_t2;
      u.tangents(t1, t2);
      this.setFromAxisAngle(t1, Math.PI);
    } else {
      const a = u.cross(v);
      this.x = a.x;
      this.y = a.y;
      this.z = a.z;
      this.w = Math.sqrt(u.length() ** 2 * v.length() ** 2) + u.dot(v);
      this.normalize();
    }
    return this;
  }

  /**
   * Multiply the quaternion with an other quaternion.
   */
  mult(quat, target) {
    if (target === void 0) {
      target = new Quaternion();
    }
    const ax = this.x;
    const ay = this.y;
    const az = this.z;
    const aw = this.w;
    const bx = quat.x;
    const by = quat.y;
    const bz = quat.z;
    const bw = quat.w;
    target.x = ax * bw + aw * bx + ay * bz - az * by;
    target.y = ay * bw + aw * by + az * bx - ax * bz;
    target.z = az * bw + aw * bz + ax * by - ay * bx;
    target.w = aw * bw - ax * bx - ay * by - az * bz;
    return target;
  }

  /**
   * Get the inverse quaternion rotation.
   */
  inverse(target) {
    if (target === void 0) {
      target = new Quaternion();
    }
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const w = this.w;
    this.conjugate(target);
    const inorm2 = 1 / (x * x + y * y + z * z + w * w);
    target.x *= inorm2;
    target.y *= inorm2;
    target.z *= inorm2;
    target.w *= inorm2;
    return target;
  }

  /**
   * Get the quaternion conjugate
   */
  conjugate(target) {
    if (target === void 0) {
      target = new Quaternion();
    }
    target.x = -this.x;
    target.y = -this.y;
    target.z = -this.z;
    target.w = this.w;
    return target;
  }

  /**
   * Normalize the quaternion. Note that this changes the values of the quaternion.
   */
  normalize() {
    let l = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    if (l === 0) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 0;
    } else {
      l = 1 / l;
      this.x *= l;
      this.y *= l;
      this.z *= l;
      this.w *= l;
    }
    return this;
  }

  /**
   * Approximation of quaternion normalization. Works best when quat is already almost-normalized.
   * @author unphased, https://github.com/unphased
   */
  normalizeFast() {
    const f = (3.0 - (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)) / 2.0;
    if (f === 0) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 0;
    } else {
      this.x *= f;
      this.y *= f;
      this.z *= f;
      this.w *= f;
    }
    return this;
  }

  /**
   * Multiply the quaternion by a vector
   */
  vmult(v, target) {
    if (target === void 0) {
      target = new Vec3();
    }
    const x = v.x;
    const y = v.y;
    const z = v.z;
    const qx = this.x;
    const qy = this.y;
    const qz = this.z;
    const qw = this.w;

    // q*v
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;
    target.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    target.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    target.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return target;
  }

  /**
   * Copies value of source to this quaternion.
   * @return this
   */
  copy(quat) {
    this.x = quat.x;
    this.y = quat.y;
    this.z = quat.z;
    this.w = quat.w;
    return this;
  }

  /**
   * Convert the quaternion to euler angle representation. Order: YZX, as this page describes: https://www.euclideanspace.com/maths/standards/index.htm
   * @param order Three-character string, defaults to "YZX"
   */
  toEuler(target, order) {
    if (order === void 0) {
      order = 'YZX';
    }
    let heading;
    let attitude;
    let bank;
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const w = this.w;
    switch (order) {
      case 'YZX':
        const test = x * y + z * w;
        if (test > 0.499) {
          // singularity at north pole
          heading = 2 * Math.atan2(x, w);
          attitude = Math.PI / 2;
          bank = 0;
        }
        if (test < -0.499) {
          // singularity at south pole
          heading = -2 * Math.atan2(x, w);
          attitude = -Math.PI / 2;
          bank = 0;
        }
        if (heading === undefined) {
          const sqx = x * x;
          const sqy = y * y;
          const sqz = z * z;
          heading = Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * sqy - 2 * sqz); // Heading
          attitude = Math.asin(2 * test); // attitude
          bank = Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * sqx - 2 * sqz); // bank
        }
        break;
      default:
        throw new Error(`Euler order ${order} not supported yet.`);
    }
    target.y = heading;
    target.z = attitude;
    target.x = bank;
  }

  /**
   * Set the quaternion components given Euler angle representation.
   *
   * @param order The order to apply angles: 'XYZ' or 'YXZ' or any other combination.
   *
   * See {@link https://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors MathWorks} reference
   */
  setFromEuler(x, y, z, order) {
    if (order === void 0) {
      order = 'XYZ';
    }
    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);
    if (order === 'XYZ') {
      this.x = s1 * c2 * c3 + c1 * s2 * s3;
      this.y = c1 * s2 * c3 - s1 * c2 * s3;
      this.z = c1 * c2 * s3 + s1 * s2 * c3;
      this.w = c1 * c2 * c3 - s1 * s2 * s3;
    } else if (order === 'YXZ') {
      this.x = s1 * c2 * c3 + c1 * s2 * s3;
      this.y = c1 * s2 * c3 - s1 * c2 * s3;
      this.z = c1 * c2 * s3 - s1 * s2 * c3;
      this.w = c1 * c2 * c3 + s1 * s2 * s3;
    } else if (order === 'ZXY') {
      this.x = s1 * c2 * c3 - c1 * s2 * s3;
      this.y = c1 * s2 * c3 + s1 * c2 * s3;
      this.z = c1 * c2 * s3 + s1 * s2 * c3;
      this.w = c1 * c2 * c3 - s1 * s2 * s3;
    } else if (order === 'ZYX') {
      this.x = s1 * c2 * c3 - c1 * s2 * s3;
      this.y = c1 * s2 * c3 + s1 * c2 * s3;
      this.z = c1 * c2 * s3 - s1 * s2 * c3;
      this.w = c1 * c2 * c3 + s1 * s2 * s3;
    } else if (order === 'YZX') {
      this.x = s1 * c2 * c3 + c1 * s2 * s3;
      this.y = c1 * s2 * c3 + s1 * c2 * s3;
      this.z = c1 * c2 * s3 - s1 * s2 * c3;
      this.w = c1 * c2 * c3 - s1 * s2 * s3;
    } else if (order === 'XZY') {
      this.x = s1 * c2 * c3 - c1 * s2 * s3;
      this.y = c1 * s2 * c3 - s1 * c2 * s3;
      this.z = c1 * c2 * s3 + s1 * s2 * c3;
      this.w = c1 * c2 * c3 + s1 * s2 * s3;
    }
    return this;
  }
  clone() {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  /**
   * Performs a spherical linear interpolation between two quat
   *
   * @param toQuat second operand
   * @param t interpolation amount between the self quaternion and toQuat
   * @param target A quaternion to store the result in. If not provided, a new one will be created.
   * @returns {Quaternion} The "target" object
   */
  slerp(toQuat, t, target) {
    if (target === void 0) {
      target = new Quaternion();
    }
    const ax = this.x;
    const ay = this.y;
    const az = this.z;
    const aw = this.w;
    let bx = toQuat.x;
    let by = toQuat.y;
    let bz = toQuat.z;
    let bw = toQuat.w;
    let omega;
    let cosom;
    let sinom;
    let scale0;
    let scale1;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;

    // adjust signs (if necessary)
    if (cosom < 0.0) {
      cosom = -cosom;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }

    // calculate coefficients
    if (1.0 - cosom > 0.000001) {
      // standard case (slerp)
      omega = Math.acos(cosom);
      sinom = Math.sin(omega);
      scale0 = Math.sin((1.0 - t) * omega) / sinom;
      scale1 = Math.sin(t * omega) / sinom;
    } else {
      // "from" and "to" quaternions are very close
      //  ... so we can do a linear interpolation
      scale0 = 1.0 - t;
      scale1 = t;
    }

    // calculate final values
    target.x = scale0 * ax + scale1 * bx;
    target.y = scale0 * ay + scale1 * by;
    target.z = scale0 * az + scale1 * bz;
    target.w = scale0 * aw + scale1 * bw;
    return target;
  }

  /**
   * Rotate an absolute orientation quaternion given an angular velocity and a time step.
   */
  integrate(angularVelocity, dt, angularFactor, target) {
    if (target === void 0) {
      target = new Quaternion();
    }
    const ax = angularVelocity.x * angularFactor.x,
      ay = angularVelocity.y * angularFactor.y,
      az = angularVelocity.z * angularFactor.z,
      bx = this.x,
      by = this.y,
      bz = this.z,
      bw = this.w;
    const half_dt = dt * 0.5;
    target.x += half_dt * (ax * bw + ay * bz - az * by);
    target.y += half_dt * (ay * bw + az * bx - ax * bz);
    target.z += half_dt * (az * bw + ax * by - ay * bx);
    target.w += half_dt * (-ax * bx - ay * by - az * bz);
    return target;
  }
};
const sfv_t1 = new Vec3();
const sfv_t2 = new Vec3();

/**
 * The available shape types.
 */
const SHAPE_TYPES = {
  /** SPHERE */
  SPHERE: 1,
  /** PLANE */
  PLANE: 2,
  /** BOX */
  BOX: 4,
  /** COMPOUND */
  COMPOUND: 8,
  /** CONVEXPOLYHEDRON */
  CONVEXPOLYHEDRON: 16,
  /** HEIGHTFIELD */
  HEIGHTFIELD: 32,
  /** PARTICLE */
  PARTICLE: 64,
  /** CYLINDER */
  CYLINDER: 128,
  /** TRIMESH */
  TRIMESH: 256
};

/**
 * ShapeType
 */

/**
 * Base class for shapes
 */
class Shape {
  /**
   * Identifier of the Shape.
   */

  /**
   * The type of this shape. Must be set to an int > 0 by subclasses.
   */

  /**
   * The local bounding sphere radius of this shape.
   */

  /**
   * Whether to produce contact forces when in contact with other bodies. Note that contacts will be generated, but they will be disabled.
   * @default true
   */

  /**
   * @default 1
   */

  /**
   * @default -1
   */

  /**
   * Optional material of the shape that regulates contact properties.
   */

  /**
   * The body to which the shape is added to.
   */

  static idCounter = 0;

  /**
   * All the Shape types.
   */
  static types = SHAPE_TYPES;
  constructor(options) {
    if (options === void 0) {
      options = {};
    }
    this.id = Shape.idCounter++;
    this.type = options.type || 0;
    this.boundingSphereRadius = 0;
    this.collisionResponse = options.collisionResponse ? options.collisionResponse : true;
    this.collisionFilterGroup = options.collisionFilterGroup !== undefined ? options.collisionFilterGroup : 1;
    this.collisionFilterMask = options.collisionFilterMask !== undefined ? options.collisionFilterMask : -1;
    this.material = options.material ? options.material : null;
    this.body = null;
  }

  /**
   * Computes the bounding sphere radius.
   * The result is stored in the property `.boundingSphereRadius`
   */
  updateBoundingSphereRadius() {
    throw `computeBoundingSphereRadius() not implemented for shape type ${this.type}`;
  }

  /**
   * Get the volume of this shape
   */
  volume() {
    throw `volume() not implemented for shape type ${this.type}`;
  }

  /**
   * Calculates the inertia in the local frame for this shape.
   * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
   */
  calculateLocalInertia(mass, target) {
    throw `calculateLocalInertia() not implemented for shape type ${this.type}`;
  }

  /**
   * @todo use abstract for these kind of methods
   */
  calculateWorldAABB(pos, quat, min, max) {
    throw `calculateWorldAABB() not implemented for shape type ${this.type}`;
  }
}

/**
 * Transformation utilities.
 */
class Transform {
  /**
   * position
   */

  /**
   * quaternion
   */

  constructor(options) {
    if (options === void 0) {
      options = {};
    }
    this.position = new Vec3();
    this.quaternion = new Quaternion$1();
    if (options.position) {
      this.position.copy(options.position);
    }
    if (options.quaternion) {
      this.quaternion.copy(options.quaternion);
    }
  }

  /**
   * Get a global point in local transform coordinates.
   */
  pointToLocal(worldPoint, result) {
    return Transform.pointToLocalFrame(this.position, this.quaternion, worldPoint, result);
  }

  /**
   * Get a local point in global transform coordinates.
   */
  pointToWorld(localPoint, result) {
    return Transform.pointToWorldFrame(this.position, this.quaternion, localPoint, result);
  }

  /**
   * vectorToWorldFrame
   */
  vectorToWorldFrame(localVector, result) {
    if (result === void 0) {
      result = new Vec3();
    }
    this.quaternion.vmult(localVector, result);
    return result;
  }

  /**
   * pointToLocalFrame
   */
  static pointToLocalFrame(position, quaternion, worldPoint, result) {
    if (result === void 0) {
      result = new Vec3();
    }
    worldPoint.vsub(position, result);
    quaternion.conjugate(tmpQuat$1);
    tmpQuat$1.vmult(result, result);
    return result;
  }

  /**
   * pointToWorldFrame
   */
  static pointToWorldFrame(position, quaternion, localPoint, result) {
    if (result === void 0) {
      result = new Vec3();
    }
    quaternion.vmult(localPoint, result);
    result.vadd(position, result);
    return result;
  }

  /**
   * vectorToWorldFrame
   */
  static vectorToWorldFrame(quaternion, localVector, result) {
    if (result === void 0) {
      result = new Vec3();
    }
    quaternion.vmult(localVector, result);
    return result;
  }

  /**
   * vectorToLocalFrame
   */
  static vectorToLocalFrame(position, quaternion, worldVector, result) {
    if (result === void 0) {
      result = new Vec3();
    }
    quaternion.w *= -1;
    quaternion.vmult(worldVector, result);
    quaternion.w *= -1;
    return result;
  }
}
const tmpQuat$1 = new Quaternion$1();

/** ConvexPolyhedronContactPoint */

/**
 * A set of polygons describing a convex shape.
 *
 * The shape MUST be convex for the code to work properly. No polygons may be coplanar (contained
 * in the same 3D plane), instead these should be merged into one polygon.
 *
 * @author qiao / https://github.com/qiao (original author, see https://github.com/qiao/three.js/commit/85026f0c769e4000148a67d45a9e9b9c5108836f)
 * @author schteppe / https://github.com/schteppe
 * @see https://www.altdevblogaday.com/2011/05/13/contact-generation-between-3d-convex-meshes/
 *
 * @todo Move the clipping functions to ContactGenerator?
 * @todo Automatically merge coplanar polygons in constructor.
 * @example
 *     const convexShape = new CANNON.ConvexPolyhedron({ vertices, faces })
 *     const convexBody = new CANNON.Body({ mass: 1, shape: convexShape })
 *     world.addBody(convexBody)
 */

class ConvexPolyhedron extends Shape {
  /** vertices */

  /**
   * Array of integer arrays, indicating which vertices each face consists of
   */

  /** faceNormals */

  /** worldVertices */

  /** worldVerticesNeedsUpdate */

  /** worldFaceNormals */

  /** worldFaceNormalsNeedsUpdate */

  /**
   * If given, these locally defined, normalized axes are the only ones being checked when doing separating axis check.
   */

  /** uniqueEdges */

  /**
   * @param vertices An array of Vec3's
   * @param faces Array of integer arrays, describing which vertices that is included in each face.
   */
  constructor(props) {
    if (props === void 0) {
      props = {};
    }
    const {
      vertices = [],
      faces = [],
      normals = [],
      axes,
      boundingSphereRadius
    } = props;
    super({
      type: Shape.types.CONVEXPOLYHEDRON
    });
    this.vertices = vertices;
    this.faces = faces;
    this.faceNormals = normals;
    if (this.faceNormals.length === 0) {
      this.computeNormals();
    }
    if (!boundingSphereRadius) {
      this.updateBoundingSphereRadius();
    } else {
      this.boundingSphereRadius = boundingSphereRadius;
    }
    this.worldVertices = []; // World transformed version of .vertices
    this.worldVerticesNeedsUpdate = true;
    this.worldFaceNormals = []; // World transformed version of .faceNormals
    this.worldFaceNormalsNeedsUpdate = true;
    this.uniqueAxes = axes ? axes.slice() : null;
    this.uniqueEdges = [];
    this.computeEdges();
  }

  /**
   * Computes uniqueEdges
   */
  computeEdges() {
    const faces = this.faces;
    const vertices = this.vertices;
    const edges = this.uniqueEdges;
    edges.length = 0;
    const edge = new Vec3();
    for (let i = 0; i !== faces.length; i++) {
      const face = faces[i];
      const numVertices = face.length;
      for (let j = 0; j !== numVertices; j++) {
        const k = (j + 1) % numVertices;
        vertices[face[j]].vsub(vertices[face[k]], edge);
        edge.normalize();
        let found = false;
        for (let p = 0; p !== edges.length; p++) {
          if (edges[p].almostEquals(edge) || edges[p].almostEquals(edge)) {
            found = true;
            break;
          }
        }
        if (!found) {
          edges.push(edge.clone());
        }
      }
    }
  }

  /**
   * Compute the normals of the faces.
   * Will reuse existing Vec3 objects in the `faceNormals` array if they exist.
   */
  computeNormals() {
    this.faceNormals.length = this.faces.length;

    // Generate normals
    for (let i = 0; i < this.faces.length; i++) {
      // Check so all vertices exists for this face
      for (let j = 0; j < this.faces[i].length; j++) {
        if (!this.vertices[this.faces[i][j]]) {
          throw new Error(`Vertex ${this.faces[i][j]} not found!`);
        }
      }
      const n = this.faceNormals[i] || new Vec3();
      this.getFaceNormal(i, n);
      n.negate(n);
      this.faceNormals[i] = n;
      const vertex = this.vertices[this.faces[i][0]];
      if (n.dot(vertex) < 0) {
        console.error(`.faceNormals[${i}] = Vec3(${n.toString()}) looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.`);
        for (let j = 0; j < this.faces[i].length; j++) {
          console.warn(`.vertices[${this.faces[i][j]}] = Vec3(${this.vertices[this.faces[i][j]].toString()})`);
        }
      }
    }
  }

  /**
   * Compute the normal of a face from its vertices
   */
  getFaceNormal(i, target) {
    const f = this.faces[i];
    const va = this.vertices[f[0]];
    const vb = this.vertices[f[1]];
    const vc = this.vertices[f[2]];
    ConvexPolyhedron.computeNormal(va, vb, vc, target);
  }

  /**
   * Get face normal given 3 vertices
   */
  static computeNormal(va, vb, vc, target) {
    const cb = new Vec3();
    const ab = new Vec3();
    vb.vsub(va, ab);
    vc.vsub(vb, cb);
    cb.cross(ab, target);
    if (!target.isZero()) {
      target.normalize();
    }
  }

  /**
   * @param minDist Clamp distance
   * @param result The an array of contact point objects, see clipFaceAgainstHull
   */
  clipAgainstHull(posA, quatA, hullB, posB, quatB, separatingNormal, minDist, maxDist, result) {
    const WorldNormal = new Vec3();
    let closestFaceB = -1;
    let dmax = -Number.MAX_VALUE;
    for (let face = 0; face < hullB.faces.length; face++) {
      WorldNormal.copy(hullB.faceNormals[face]);
      quatB.vmult(WorldNormal, WorldNormal);
      const d = WorldNormal.dot(separatingNormal);
      if (d > dmax) {
        dmax = d;
        closestFaceB = face;
      }
    }
    const worldVertsB1 = [];
    for (let i = 0; i < hullB.faces[closestFaceB].length; i++) {
      const b = hullB.vertices[hullB.faces[closestFaceB][i]];
      const worldb = new Vec3();
      worldb.copy(b);
      quatB.vmult(worldb, worldb);
      posB.vadd(worldb, worldb);
      worldVertsB1.push(worldb);
    }
    if (closestFaceB >= 0) {
      this.clipFaceAgainstHull(separatingNormal, posA, quatA, worldVertsB1, minDist, maxDist, result);
    }
  }

  /**
   * Find the separating axis between this hull and another
   * @param target The target vector to save the axis in
   * @return Returns false if a separation is found, else true
   */
  findSeparatingAxis(hullB, posA, quatA, posB, quatB, target, faceListA, faceListB) {
    const faceANormalWS3 = new Vec3();
    const Worldnormal1 = new Vec3();
    const deltaC = new Vec3();
    const worldEdge0 = new Vec3();
    const worldEdge1 = new Vec3();
    const Cross = new Vec3();
    let dmin = Number.MAX_VALUE;
    const hullA = this;
    if (!hullA.uniqueAxes) {
      const numFacesA = faceListA ? faceListA.length : hullA.faces.length;

      // Test face normals from hullA
      for (let i = 0; i < numFacesA; i++) {
        const fi = faceListA ? faceListA[i] : i;

        // Get world face normal
        faceANormalWS3.copy(hullA.faceNormals[fi]);
        quatA.vmult(faceANormalWS3, faceANormalWS3);
        const d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB);
        if (d === false) {
          return false;
        }
        if (d < dmin) {
          dmin = d;
          target.copy(faceANormalWS3);
        }
      }
    } else {
      // Test unique axes
      for (let i = 0; i !== hullA.uniqueAxes.length; i++) {
        // Get world axis
        quatA.vmult(hullA.uniqueAxes[i], faceANormalWS3);
        const d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB);
        if (d === false) {
          return false;
        }
        if (d < dmin) {
          dmin = d;
          target.copy(faceANormalWS3);
        }
      }
    }
    if (!hullB.uniqueAxes) {
      // Test face normals from hullB
      const numFacesB = faceListB ? faceListB.length : hullB.faces.length;
      for (let i = 0; i < numFacesB; i++) {
        const fi = faceListB ? faceListB[i] : i;
        Worldnormal1.copy(hullB.faceNormals[fi]);
        quatB.vmult(Worldnormal1, Worldnormal1);
        const d = hullA.testSepAxis(Worldnormal1, hullB, posA, quatA, posB, quatB);
        if (d === false) {
          return false;
        }
        if (d < dmin) {
          dmin = d;
          target.copy(Worldnormal1);
        }
      }
    } else {
      // Test unique axes in B
      for (let i = 0; i !== hullB.uniqueAxes.length; i++) {
        quatB.vmult(hullB.uniqueAxes[i], Worldnormal1);
        const d = hullA.testSepAxis(Worldnormal1, hullB, posA, quatA, posB, quatB);
        if (d === false) {
          return false;
        }
        if (d < dmin) {
          dmin = d;
          target.copy(Worldnormal1);
        }
      }
    }

    // Test edges
    for (let e0 = 0; e0 !== hullA.uniqueEdges.length; e0++) {
      // Get world edge
      quatA.vmult(hullA.uniqueEdges[e0], worldEdge0);
      for (let e1 = 0; e1 !== hullB.uniqueEdges.length; e1++) {
        // Get world edge 2
        quatB.vmult(hullB.uniqueEdges[e1], worldEdge1);
        worldEdge0.cross(worldEdge1, Cross);
        if (!Cross.almostZero()) {
          Cross.normalize();
          const dist = hullA.testSepAxis(Cross, hullB, posA, quatA, posB, quatB);
          if (dist === false) {
            return false;
          }
          if (dist < dmin) {
            dmin = dist;
            target.copy(Cross);
          }
        }
      }
    }
    posB.vsub(posA, deltaC);
    if (deltaC.dot(target) > 0.0) {
      target.negate(target);
    }
    return true;
  }

  /**
   * Test separating axis against two hulls. Both hulls are projected onto the axis and the overlap size is returned if there is one.
   * @return The overlap depth, or FALSE if no penetration.
   */
  testSepAxis(axis, hullB, posA, quatA, posB, quatB) {
    const hullA = this;
    ConvexPolyhedron.project(hullA, axis, posA, quatA, maxminA);
    ConvexPolyhedron.project(hullB, axis, posB, quatB, maxminB);
    const maxA = maxminA[0];
    const minA = maxminA[1];
    const maxB = maxminB[0];
    const minB = maxminB[1];
    if (maxA < minB || maxB < minA) {
      return false; // Separated
    }
    const d0 = maxA - minB;
    const d1 = maxB - minA;
    const depth = d0 < d1 ? d0 : d1;
    return depth;
  }

  /**
   * calculateLocalInertia
   */
  calculateLocalInertia(mass, target) {
    // Approximate with box inertia
    // Exact inertia calculation is overkill, but see http://geometrictools.com/Documentation/PolyhedralMassProperties.pdf for the correct way to do it
    const aabbmax = new Vec3();
    const aabbmin = new Vec3();
    this.computeLocalAABB(aabbmin, aabbmax);
    const x = aabbmax.x - aabbmin.x;
    const y = aabbmax.y - aabbmin.y;
    const z = aabbmax.z - aabbmin.z;
    target.x = 1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * z * 2 * z);
    target.y = 1.0 / 12.0 * mass * (2 * x * 2 * x + 2 * z * 2 * z);
    target.z = 1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * x * 2 * x);
  }

  /**
   * @param face_i Index of the face
   */
  getPlaneConstantOfFace(face_i) {
    const f = this.faces[face_i];
    const n = this.faceNormals[face_i];
    const v = this.vertices[f[0]];
    const c = -n.dot(v);
    return c;
  }

  /**
   * Clip a face against a hull.
   * @param worldVertsB1 An array of Vec3 with vertices in the world frame.
   * @param minDist Distance clamping
   * @param Array result Array to store resulting contact points in. Will be objects with properties: point, depth, normal. These are represented in world coordinates.
   */
  clipFaceAgainstHull(separatingNormal, posA, quatA, worldVertsB1, minDist, maxDist, result) {
    const faceANormalWS = new Vec3();
    const edge0 = new Vec3();
    const WorldEdge0 = new Vec3();
    const worldPlaneAnormal1 = new Vec3();
    const planeNormalWS1 = new Vec3();
    const worldA1 = new Vec3();
    const localPlaneNormal = new Vec3();
    const planeNormalWS = new Vec3();
    const hullA = this;
    const worldVertsB2 = [];
    const pVtxIn = worldVertsB1;
    const pVtxOut = worldVertsB2;
    let closestFaceA = -1;
    let dmin = Number.MAX_VALUE;

    // Find the face with normal closest to the separating axis
    for (let face = 0; face < hullA.faces.length; face++) {
      faceANormalWS.copy(hullA.faceNormals[face]);
      quatA.vmult(faceANormalWS, faceANormalWS);
      const d = faceANormalWS.dot(separatingNormal);
      if (d < dmin) {
        dmin = d;
        closestFaceA = face;
      }
    }
    if (closestFaceA < 0) {
      return;
    }

    // Get the face and construct connected faces
    const polyA = hullA.faces[closestFaceA];
    polyA.connectedFaces = [];
    for (let i = 0; i < hullA.faces.length; i++) {
      for (let j = 0; j < hullA.faces[i].length; j++) {
        if (/* Sharing a vertex*/
        polyA.indexOf(hullA.faces[i][j]) !== -1 && /* Not the one we are looking for connections from */
        i !== closestFaceA && /* Not already added */
        polyA.connectedFaces.indexOf(i) === -1) {
          polyA.connectedFaces.push(i);
        }
      }
    }

    // Clip the polygon to the back of the planes of all faces of hull A,
    // that are adjacent to the witness face
    const numVerticesA = polyA.length;
    for (let i = 0; i < numVerticesA; i++) {
      const a = hullA.vertices[polyA[i]];
      const b = hullA.vertices[polyA[(i + 1) % numVerticesA]];
      a.vsub(b, edge0);
      WorldEdge0.copy(edge0);
      quatA.vmult(WorldEdge0, WorldEdge0);
      posA.vadd(WorldEdge0, WorldEdge0);
      worldPlaneAnormal1.copy(this.faceNormals[closestFaceA]);
      quatA.vmult(worldPlaneAnormal1, worldPlaneAnormal1);
      posA.vadd(worldPlaneAnormal1, worldPlaneAnormal1);
      WorldEdge0.cross(worldPlaneAnormal1, planeNormalWS1);
      planeNormalWS1.negate(planeNormalWS1);
      worldA1.copy(a);
      quatA.vmult(worldA1, worldA1);
      posA.vadd(worldA1, worldA1);
      const otherFace = polyA.connectedFaces[i];
      localPlaneNormal.copy(this.faceNormals[otherFace]);
      const localPlaneEq = this.getPlaneConstantOfFace(otherFace);
      planeNormalWS.copy(localPlaneNormal);
      quatA.vmult(planeNormalWS, planeNormalWS);
      const planeEqWS = localPlaneEq - planeNormalWS.dot(posA);

      // Clip face against our constructed plane
      this.clipFaceAgainstPlane(pVtxIn, pVtxOut, planeNormalWS, planeEqWS);

      // Throw away all clipped points, but save the remaining until next clip
      while (pVtxIn.length) {
        pVtxIn.shift();
      }
      while (pVtxOut.length) {
        pVtxIn.push(pVtxOut.shift());
      }
    }

    // only keep contact points that are behind the witness face
    localPlaneNormal.copy(this.faceNormals[closestFaceA]);
    const localPlaneEq = this.getPlaneConstantOfFace(closestFaceA);
    planeNormalWS.copy(localPlaneNormal);
    quatA.vmult(planeNormalWS, planeNormalWS);
    const planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
    for (let i = 0; i < pVtxIn.length; i++) {
      let depth = planeNormalWS.dot(pVtxIn[i]) + planeEqWS; // ???

      if (depth <= minDist) {
        // console.log(`clamped: depth=${depth} to minDist=${minDist}`)
        depth = minDist;
      }
      if (depth <= maxDist) {
        const point = pVtxIn[i];
        if (depth <= 1e-6) {
          const p = {
            point,
            normal: planeNormalWS,
            depth
          };
          result.push(p);
        }
      }
    }
  }

  /**
   * Clip a face in a hull against the back of a plane.
   * @param planeConstant The constant in the mathematical plane equation
   */
  clipFaceAgainstPlane(inVertices, outVertices, planeNormal, planeConstant) {
    let n_dot_first;
    let n_dot_last;
    const numVerts = inVertices.length;
    if (numVerts < 2) {
      return outVertices;
    }
    let firstVertex = inVertices[inVertices.length - 1];
    let lastVertex = inVertices[0];
    n_dot_first = planeNormal.dot(firstVertex) + planeConstant;
    for (let vi = 0; vi < numVerts; vi++) {
      lastVertex = inVertices[vi];
      n_dot_last = planeNormal.dot(lastVertex) + planeConstant;
      if (n_dot_first < 0) {
        if (n_dot_last < 0) {
          // Start < 0, end < 0, so output lastVertex
          const newv = new Vec3();
          newv.copy(lastVertex);
          outVertices.push(newv);
        } else {
          // Start < 0, end >= 0, so output intersection
          const newv = new Vec3();
          firstVertex.lerp(lastVertex, n_dot_first / (n_dot_first - n_dot_last), newv);
          outVertices.push(newv);
        }
      } else {
        if (n_dot_last < 0) {
          // Start >= 0, end < 0 so output intersection and end
          const newv = new Vec3();
          firstVertex.lerp(lastVertex, n_dot_first / (n_dot_first - n_dot_last), newv);
          outVertices.push(newv);
          outVertices.push(lastVertex);
        }
      }
      firstVertex = lastVertex;
      n_dot_first = n_dot_last;
    }
    return outVertices;
  }

  /**
   * Updates `.worldVertices` and sets `.worldVerticesNeedsUpdate` to false.
   */
  computeWorldVertices(position, quat) {
    while (this.worldVertices.length < this.vertices.length) {
      this.worldVertices.push(new Vec3());
    }
    const verts = this.vertices;
    const worldVerts = this.worldVertices;
    for (let i = 0; i !== this.vertices.length; i++) {
      quat.vmult(verts[i], worldVerts[i]);
      position.vadd(worldVerts[i], worldVerts[i]);
    }
    this.worldVerticesNeedsUpdate = false;
  }
  computeLocalAABB(aabbmin, aabbmax) {
    const vertices = this.vertices;
    aabbmin.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    aabbmax.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    for (let i = 0; i < this.vertices.length; i++) {
      const v = vertices[i];
      if (v.x < aabbmin.x) {
        aabbmin.x = v.x;
      } else if (v.x > aabbmax.x) {
        aabbmax.x = v.x;
      }
      if (v.y < aabbmin.y) {
        aabbmin.y = v.y;
      } else if (v.y > aabbmax.y) {
        aabbmax.y = v.y;
      }
      if (v.z < aabbmin.z) {
        aabbmin.z = v.z;
      } else if (v.z > aabbmax.z) {
        aabbmax.z = v.z;
      }
    }
  }

  /**
   * Updates `worldVertices` and sets `worldVerticesNeedsUpdate` to false.
   */
  computeWorldFaceNormals(quat) {
    const N = this.faceNormals.length;
    while (this.worldFaceNormals.length < N) {
      this.worldFaceNormals.push(new Vec3());
    }
    const normals = this.faceNormals;
    const worldNormals = this.worldFaceNormals;
    for (let i = 0; i !== N; i++) {
      quat.vmult(normals[i], worldNormals[i]);
    }
    this.worldFaceNormalsNeedsUpdate = false;
  }

  /**
   * updateBoundingSphereRadius
   */
  updateBoundingSphereRadius() {
    // Assume points are distributed with local (0,0,0) as center
    let max2 = 0;
    const verts = this.vertices;
    for (let i = 0; i !== verts.length; i++) {
      const norm2 = verts[i].lengthSquared();
      if (norm2 > max2) {
        max2 = norm2;
      }
    }
    this.boundingSphereRadius = Math.sqrt(max2);
  }

  /**
   * calculateWorldAABB
   */
  calculateWorldAABB(pos, quat, min, max) {
    const verts = this.vertices;
    let minx;
    let miny;
    let minz;
    let maxx;
    let maxy;
    let maxz;
    let tempWorldVertex = new Vec3();
    for (let i = 0; i < verts.length; i++) {
      tempWorldVertex.copy(verts[i]);
      quat.vmult(tempWorldVertex, tempWorldVertex);
      pos.vadd(tempWorldVertex, tempWorldVertex);
      const v = tempWorldVertex;
      if (minx === undefined || v.x < minx) {
        minx = v.x;
      }
      if (maxx === undefined || v.x > maxx) {
        maxx = v.x;
      }
      if (miny === undefined || v.y < miny) {
        miny = v.y;
      }
      if (maxy === undefined || v.y > maxy) {
        maxy = v.y;
      }
      if (minz === undefined || v.z < minz) {
        minz = v.z;
      }
      if (maxz === undefined || v.z > maxz) {
        maxz = v.z;
      }
    }
    min.set(minx, miny, minz);
    max.set(maxx, maxy, maxz);
  }

  /**
   * Get approximate convex volume
   */
  volume() {
    return 4.0 * Math.PI * this.boundingSphereRadius / 3.0;
  }

  /**
   * Get an average of all the vertices positions
   */
  getAveragePointLocal(target) {
    if (target === void 0) {
      target = new Vec3();
    }
    const verts = this.vertices;
    for (let i = 0; i < verts.length; i++) {
      target.vadd(verts[i], target);
    }
    target.scale(1 / verts.length, target);
    return target;
  }

  /**
   * Transform all local points. Will change the .vertices
   */
  transformAllPoints(offset, quat) {
    const n = this.vertices.length;
    const verts = this.vertices;

    // Apply rotation
    if (quat) {
      // Rotate vertices
      for (let i = 0; i < n; i++) {
        const v = verts[i];
        quat.vmult(v, v);
      }
      // Rotate face normals
      for (let i = 0; i < this.faceNormals.length; i++) {
        const v = this.faceNormals[i];
        quat.vmult(v, v);
      }
      /*
            // Rotate edges
            for(let i=0; i<this.uniqueEdges.length; i++){
                const v = this.uniqueEdges[i];
                quat.vmult(v,v);
            }*/
    }

    // Apply offset
    if (offset) {
      for (let i = 0; i < n; i++) {
        const v = verts[i];
        v.vadd(offset, v);
      }
    }
  }

  /**
   * Checks whether p is inside the polyhedra. Must be in local coords.
   * The point lies outside of the convex hull of the other points if and only if the direction
   * of all the vectors from it to those other points are on less than one half of a sphere around it.
   * @param p A point given in local coordinates
   */
  pointIsInside(p) {
    const verts = this.vertices;
    const faces = this.faces;
    const normals = this.faceNormals;
    const pointInside = new Vec3();
    this.getAveragePointLocal(pointInside);
    for (let i = 0; i < this.faces.length; i++) {
      let n = normals[i];
      const v = verts[faces[i][0]]; // We only need one point in the face

      // This dot product determines which side of the edge the point is
      const vToP = new Vec3();
      p.vsub(v, vToP);
      const r1 = n.dot(vToP);
      const vToPointInside = new Vec3();
      pointInside.vsub(v, vToPointInside);
      const r2 = n.dot(vToPointInside);
      if (r1 < 0 && r2 > 0 || r1 > 0 && r2 < 0) {
        return false; // Encountered some other sign. Exit.
      }
    }

    // If we got here, all dot products were of the same sign.
    return -1;
  }

  /**
   * Get max and min dot product of a convex hull at position (pos,quat) projected onto an axis.
   * Results are saved in the array maxmin.
   * @param result result[0] and result[1] will be set to maximum and minimum, respectively.
   */
  static project(shape, axis, pos, quat, result) {
    const n = shape.vertices.length;
    const localAxis = project_localAxis;
    let max = 0;
    let min = 0;
    const localOrigin = project_localOrigin;
    const vs = shape.vertices;
    localOrigin.setZero();

    // Transform the axis to local
    Transform.vectorToLocalFrame(pos, quat, axis, localAxis);
    Transform.pointToLocalFrame(pos, quat, localOrigin, localOrigin);
    const add = localOrigin.dot(localAxis);
    min = max = vs[0].dot(localAxis);
    for (let i = 1; i < n; i++) {
      const val = vs[i].dot(localAxis);
      if (val > max) {
        max = val;
      }
      if (val < min) {
        min = val;
      }
    }
    min -= add;
    max -= add;
    if (min > max) {
      // Inconsistent - swap
      const temp = min;
      min = max;
      max = temp;
    }
    // Output
    result[0] = max;
    result[1] = min;
  }
}
const maxminA = [];
const maxminB = [];
new Vec3();
const project_localAxis = new Vec3();
const project_localOrigin = new Vec3();

/**
 * A 3d box shape.
 * @example
 *     const size = 1
 *     const halfExtents = new CANNON.Vec3(size, size, size)
 *     const boxShape = new CANNON.Box(halfExtents)
 *     const boxBody = new CANNON.Body({ mass: 1, shape: boxShape })
 *     world.addBody(boxBody)
 */
class Box extends Shape {
  /**
   * The half extents of the box.
   */

  /**
   * Used by the contact generator to make contacts with other convex polyhedra for example.
   */

  constructor(halfExtents) {
    super({
      type: Shape.types.BOX
    });
    this.halfExtents = halfExtents;
    this.convexPolyhedronRepresentation = null;
    this.updateConvexPolyhedronRepresentation();
    this.updateBoundingSphereRadius();
  }

  /**
   * Updates the local convex polyhedron representation used for some collisions.
   */
  updateConvexPolyhedronRepresentation() {
    const sx = this.halfExtents.x;
    const sy = this.halfExtents.y;
    const sz = this.halfExtents.z;
    const V = Vec3;
    const vertices = [new V(-sx, -sy, -sz), new V(sx, -sy, -sz), new V(sx, sy, -sz), new V(-sx, sy, -sz), new V(-sx, -sy, sz), new V(sx, -sy, sz), new V(sx, sy, sz), new V(-sx, sy, sz)];
    const faces = [[3, 2, 1, 0],
    // -z
    [4, 5, 6, 7],
    // +z
    [5, 4, 0, 1],
    // -y
    [2, 3, 7, 6],
    // +y
    [0, 4, 7, 3],
    // -x
    [1, 2, 6, 5] // +x
    ];
    const axes = [new V(0, 0, 1), new V(0, 1, 0), new V(1, 0, 0)];
    const h = new ConvexPolyhedron({
      vertices,
      faces,
      axes
    });
    this.convexPolyhedronRepresentation = h;
    h.material = this.material;
  }

  /**
   * Calculate the inertia of the box.
   */
  calculateLocalInertia(mass, target) {
    if (target === void 0) {
      target = new Vec3();
    }
    Box.calculateInertia(this.halfExtents, mass, target);
    return target;
  }
  static calculateInertia(halfExtents, mass, target) {
    const e = halfExtents;
    target.x = 1.0 / 12.0 * mass * (2 * e.y * 2 * e.y + 2 * e.z * 2 * e.z);
    target.y = 1.0 / 12.0 * mass * (2 * e.x * 2 * e.x + 2 * e.z * 2 * e.z);
    target.z = 1.0 / 12.0 * mass * (2 * e.y * 2 * e.y + 2 * e.x * 2 * e.x);
  }

  /**
   * Get the box 6 side normals
   * @param sixTargetVectors An array of 6 vectors, to store the resulting side normals in.
   * @param quat Orientation to apply to the normal vectors. If not provided, the vectors will be in respect to the local frame.
   */
  getSideNormals(sixTargetVectors, quat) {
    const sides = sixTargetVectors;
    const ex = this.halfExtents;
    sides[0].set(ex.x, 0, 0);
    sides[1].set(0, ex.y, 0);
    sides[2].set(0, 0, ex.z);
    sides[3].set(-ex.x, 0, 0);
    sides[4].set(0, -ex.y, 0);
    sides[5].set(0, 0, -ex.z);
    if (quat !== undefined) {
      for (let i = 0; i !== sides.length; i++) {
        quat.vmult(sides[i], sides[i]);
      }
    }
    return sides;
  }

  /**
   * Returns the volume of the box.
   */
  volume() {
    return 8.0 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z;
  }

  /**
   * updateBoundingSphereRadius
   */
  updateBoundingSphereRadius() {
    this.boundingSphereRadius = this.halfExtents.length();
  }

  /**
   * forEachWorldCorner
   */
  forEachWorldCorner(pos, quat, callback) {
    const e = this.halfExtents;
    const corners = [[e.x, e.y, e.z], [-e.x, e.y, e.z], [-e.x, -e.y, e.z], [-e.x, -e.y, -e.z], [e.x, -e.y, -e.z], [e.x, e.y, -e.z], [-e.x, e.y, -e.z], [e.x, -e.y, e.z]];
    for (let i = 0; i < corners.length; i++) {
      worldCornerTempPos.set(corners[i][0], corners[i][1], corners[i][2]);
      quat.vmult(worldCornerTempPos, worldCornerTempPos);
      pos.vadd(worldCornerTempPos, worldCornerTempPos);
      callback(worldCornerTempPos.x, worldCornerTempPos.y, worldCornerTempPos.z);
    }
  }

  /**
   * calculateWorldAABB
   */
  calculateWorldAABB(pos, quat, min, max) {
    const e = this.halfExtents;
    worldCornersTemp[0].set(e.x, e.y, e.z);
    worldCornersTemp[1].set(-e.x, e.y, e.z);
    worldCornersTemp[2].set(-e.x, -e.y, e.z);
    worldCornersTemp[3].set(-e.x, -e.y, -e.z);
    worldCornersTemp[4].set(e.x, -e.y, -e.z);
    worldCornersTemp[5].set(e.x, e.y, -e.z);
    worldCornersTemp[6].set(-e.x, e.y, -e.z);
    worldCornersTemp[7].set(e.x, -e.y, e.z);
    const wc = worldCornersTemp[0];
    quat.vmult(wc, wc);
    pos.vadd(wc, wc);
    max.copy(wc);
    min.copy(wc);
    for (let i = 1; i < 8; i++) {
      const wc = worldCornersTemp[i];
      quat.vmult(wc, wc);
      pos.vadd(wc, wc);
      const x = wc.x;
      const y = wc.y;
      const z = wc.z;
      if (x > max.x) {
        max.x = x;
      }
      if (y > max.y) {
        max.y = y;
      }
      if (z > max.z) {
        max.z = z;
      }
      if (x < min.x) {
        min.x = x;
      }
      if (y < min.y) {
        min.y = y;
      }
      if (z < min.z) {
        min.z = z;
      }
    }

    // Get each axis max
    // min.set(Infinity,Infinity,Infinity);
    // max.set(-Infinity,-Infinity,-Infinity);
    // this.forEachWorldCorner(pos,quat,function(x,y,z){
    //     if(x > max.x){
    //         max.x = x;
    //     }
    //     if(y > max.y){
    //         max.y = y;
    //     }
    //     if(z > max.z){
    //         max.z = z;
    //     }

    //     if(x < min.x){
    //         min.x = x;
    //     }
    //     if(y < min.y){
    //         min.y = y;
    //     }
    //     if(z < min.z){
    //         min.z = z;
    //     }
    // });
  }
}
const worldCornerTempPos = new Vec3();
const worldCornersTemp = [new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3()];

/**
 * BODY_TYPES
 */
const BODY_TYPES = {
  /** DYNAMIC */
  DYNAMIC: 1,
  /** STATIC */
  STATIC: 2,
  /** KINEMATIC */
  KINEMATIC: 4
};

/**
 * BodyType
 */

/**
 * BODY_SLEEP_STATES
 */
const BODY_SLEEP_STATES = {
  /** AWAKE */
  AWAKE: 0,
  /** SLEEPY */
  SLEEPY: 1,
  /** SLEEPING */
  SLEEPING: 2
};

/**
 * BodySleepState
 */

/**
 * Base class for all body types.
 * @example
 *     const shape = new CANNON.Sphere(1)
 *     const body = new CANNON.Body({
 *       mass: 1,
 *       shape,
 *     })
 *     world.addBody(body)
 */
class Body extends EventTarget {
  static idCounter = 0;

  /**
   * Dispatched after two bodies collide. This event is dispatched on each
   * of the two bodies involved in the collision.
   * @event collide
   * @param body The body that was involved in the collision.
   * @param contact The details of the collision.
   */
  static COLLIDE_EVENT_NAME = 'collide';

  /**
   * A dynamic body is fully simulated. Can be moved manually by the user, but normally they move according to forces. A dynamic body can collide with all body types. A dynamic body always has finite, non-zero mass.
   */
  static DYNAMIC = BODY_TYPES.DYNAMIC;

  /**
   * A static body does not move during simulation and behaves as if it has infinite mass. Static bodies can be moved manually by setting the position of the body. The velocity of a static body is always zero. Static bodies do not collide with other static or kinematic bodies.
   */
  static STATIC = BODY_TYPES.STATIC;

  /**
   * A kinematic body moves under simulation according to its velocity. They do not respond to forces. They can be moved manually, but normally a kinematic body is moved by setting its velocity. A kinematic body behaves as if it has infinite mass. Kinematic bodies do not collide with other static or kinematic bodies.
   */
  static KINEMATIC = BODY_TYPES.KINEMATIC;

  /**
   * AWAKE
   */
  static AWAKE = BODY_SLEEP_STATES.AWAKE;
  /**
   * SLEEPY
   */
  static SLEEPY = BODY_SLEEP_STATES.SLEEPY;
  /**
   * SLEEPING
   */
  static SLEEPING = BODY_SLEEP_STATES.SLEEPING;

  /**
   * Dispatched after a sleeping body has woken up.
   * @event wakeup
   */
  static wakeupEvent = {
    type: 'wakeup'
  };

  /**
   * Dispatched after a body has gone in to the sleepy state.
   * @event sleepy
   */
  static sleepyEvent = {
    type: 'sleepy'
  };

  /**
   * Dispatched after a body has fallen asleep.
   * @event sleep
   */
  static sleepEvent = {
    type: 'sleep'
  };

  /**
   * Identifier of the body.
   */

  /**
   * Position of body in World.bodies. Updated by World and used in ArrayCollisionMatrix.
   */

  /**
   * Reference to the world the body is living in.
   */

  /**
   * The collision group the body belongs to.
   * @default 1
   */

  /**
   * The collision group the body can collide with.
   * @default -1
   */

  /**
   * Whether to produce contact forces when in contact with other bodies. Note that contacts will be generated, but they will be disabled - i.e. "collide" events will be raised, but forces will not be altered.
   */

  /**
   * World space position of the body.
   */

  /**
   * Interpolated position of the body.
   */

  /**
   * Initial position of the body.
   */

  /**
   * World space velocity of the body.
   */

  /**
   * Initial velocity of the body.
   */

  /**
   * Linear force on the body in world space.
   */

  /**
   * The mass of the body.
   * @default 0
   */

  /**
   * The physics material of the body. It defines the body interaction with other bodies.
   */

  /**
   * How much to damp the body velocity each step. It can go from 0 to 1.
   * @default 0.01
   */

  /**
   * One of: `Body.DYNAMIC`, `Body.STATIC` and `Body.KINEMATIC`.
   */

  /**
   * If true, the body will automatically fall to sleep.
   * @default true
   */

  /**
   * Current sleep state.
   */

  /**
   * If the speed (the norm of the velocity) is smaller than this value, the body is considered sleepy.
   * @default 0.1
   */

  /**
   * If the body has been sleepy for this sleepTimeLimit seconds, it is considered sleeping.
   * @default 1
   */

  /**
   * World space rotational force on the body, around center of mass.
   */

  /**
   * World space orientation of the body.
   */

  /**
   * Initial quaternion of the body.
   */

  /**
   * Interpolated orientation of the body.
   */

  /**
   * Angular velocity of the body, in world space. Think of the angular velocity as a vector, which the body rotates around. The length of this vector determines how fast (in radians per second) the body rotates.
   */

  /**
   * Initial angular velocity of the body.
   */

  /**
   * List of Shapes that have been added to the body.
   */

  /**
   * Position of each Shape in the body, given in local Body space.
   */

  /**
   * Orientation of each Shape, given in local Body space.
   */

  /**
   * The inertia of the body.
   */

  /**
   * Set to true if you don't want the body to rotate. Make sure to run .updateMassProperties() if you change this after the body creation.
   * @default false
   */

  /**
   * How much to damp the body angular velocity each step. It can go from 0 to 1.
   * @default 0.01
   */

  /**
   * Use this property to limit the motion along any world axis. (1,1,1) will allow motion along all axes while (0,0,0) allows none.
   */

  /**
   * Use this property to limit the rotational motion along any world axis. (1,1,1) will allow rotation along all axes while (0,0,0) allows none.
   */

  /**
   * World space bounding box of the body and its shapes.
   */

  /**
   * Indicates if the AABB needs to be updated before use.
   */

  /**
   * Total bounding radius of the Body including its shapes, relative to body.position.
   */

  /**
   * When true the body behaves like a trigger. It does not collide
   * with other bodies but collision events are still triggered.
   * @default false
   */

  constructor(options) {
    if (options === void 0) {
      options = {};
    }
    super();
    this.id = Body.idCounter++;
    this.index = -1;
    this.world = null;
    this.vlambda = new Vec3();
    this.collisionFilterGroup = typeof options.collisionFilterGroup === 'number' ? options.collisionFilterGroup : 1;
    this.collisionFilterMask = typeof options.collisionFilterMask === 'number' ? options.collisionFilterMask : -1;
    this.collisionResponse = typeof options.collisionResponse === 'boolean' ? options.collisionResponse : true;
    this.position = new Vec3();
    this.previousPosition = new Vec3();
    this.interpolatedPosition = new Vec3();
    this.initPosition = new Vec3();
    if (options.position) {
      this.position.copy(options.position);
      this.previousPosition.copy(options.position);
      this.interpolatedPosition.copy(options.position);
      this.initPosition.copy(options.position);
    }
    this.velocity = new Vec3();
    if (options.velocity) {
      this.velocity.copy(options.velocity);
    }
    this.initVelocity = new Vec3();
    this.force = new Vec3();
    const mass = typeof options.mass === 'number' ? options.mass : 0;
    this.mass = mass;
    this.invMass = mass > 0 ? 1.0 / mass : 0;
    this.material = options.material || null;
    this.linearDamping = typeof options.linearDamping === 'number' ? options.linearDamping : 0.01;
    this.type = mass <= 0.0 ? Body.STATIC : Body.DYNAMIC;
    if (typeof options.type === "number") {
      this.type = options.type;
    }
    this.allowSleep = typeof options.allowSleep !== 'undefined' ? options.allowSleep : true;
    this.sleepState = Body.AWAKE;
    this.sleepSpeedLimit = typeof options.sleepSpeedLimit !== 'undefined' ? options.sleepSpeedLimit : 0.1;
    this.sleepTimeLimit = typeof options.sleepTimeLimit !== 'undefined' ? options.sleepTimeLimit : 1;
    this.timeLastSleepy = 0;
    this.wakeUpAfterNarrowphase = false;
    this.torque = new Vec3();
    this.quaternion = new Quaternion$1();
    this.initQuaternion = new Quaternion$1();
    this.previousQuaternion = new Quaternion$1();
    this.interpolatedQuaternion = new Quaternion$1();
    if (options.quaternion) {
      this.quaternion.copy(options.quaternion);
      this.initQuaternion.copy(options.quaternion);
      this.previousQuaternion.copy(options.quaternion);
      this.interpolatedQuaternion.copy(options.quaternion);
    }
    this.angularVelocity = new Vec3();
    if (options.angularVelocity) {
      this.angularVelocity.copy(options.angularVelocity);
    }
    this.initAngularVelocity = new Vec3();
    this.shapes = [];
    this.shapeOffsets = [];
    this.shapeOrientations = [];
    this.inertia = new Vec3();
    this.invInertia = new Vec3();
    this.invInertiaWorld = new Mat3();
    this.invMassSolve = 0;
    this.invInertiaSolve = new Vec3();
    this.invInertiaWorldSolve = new Mat3();
    this.fixedRotation = typeof options.fixedRotation !== 'undefined' ? options.fixedRotation : false;
    this.angularDamping = typeof options.angularDamping !== 'undefined' ? options.angularDamping : 0.01;
    this.linearFactor = new Vec3(1, 1, 1);
    if (options.linearFactor) {
      this.linearFactor.copy(options.linearFactor);
    }
    this.angularFactor = new Vec3(1, 1, 1);
    if (options.angularFactor) {
      this.angularFactor.copy(options.angularFactor);
    }
    this.aabb = new AABB();
    this.aabbNeedsUpdate = true;
    this.boundingRadius = 0;
    this.wlambda = new Vec3();
    this.isTrigger = Boolean(options.isTrigger);
    if (options.shape) {
      this.addShape(options.shape);
    }
    this.updateMassProperties();
  }

  /**
   * Wake the body up.
   */
  wakeUp() {
    const prevState = this.sleepState;
    this.sleepState = Body.AWAKE;
    this.wakeUpAfterNarrowphase = false;
    if (prevState === Body.SLEEPING) {
      this.dispatchEvent(Body.wakeupEvent);
    }
  }

  /**
   * Force body sleep
   */
  sleep() {
    this.sleepState = Body.SLEEPING;
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
    this.wakeUpAfterNarrowphase = false;
  }

  /**
   * Called every timestep to update internal sleep timer and change sleep state if needed.
   * @param time The world time in seconds
   */
  sleepTick(time) {
    if (this.allowSleep) {
      const sleepState = this.sleepState;
      const speedSquared = this.velocity.lengthSquared() + this.angularVelocity.lengthSquared();
      const speedLimitSquared = this.sleepSpeedLimit ** 2;
      if (sleepState === Body.AWAKE && speedSquared < speedLimitSquared) {
        this.sleepState = Body.SLEEPY; // Sleepy
        this.timeLastSleepy = time;
        this.dispatchEvent(Body.sleepyEvent);
      } else if (sleepState === Body.SLEEPY && speedSquared > speedLimitSquared) {
        this.wakeUp(); // Wake up
      } else if (sleepState === Body.SLEEPY && time - this.timeLastSleepy > this.sleepTimeLimit) {
        this.sleep(); // Sleeping
        this.dispatchEvent(Body.sleepEvent);
      }
    }
  }

  /**
   * If the body is sleeping, it should be immovable / have infinite mass during solve. We solve it by having a separate "solve mass".
   */
  updateSolveMassProperties() {
    if (this.sleepState === Body.SLEEPING || this.type === Body.KINEMATIC) {
      this.invMassSolve = 0;
      this.invInertiaSolve.setZero();
      this.invInertiaWorldSolve.setZero();
    } else {
      this.invMassSolve = this.invMass;
      this.invInertiaSolve.copy(this.invInertia);
      this.invInertiaWorldSolve.copy(this.invInertiaWorld);
    }
  }

  /**
   * Convert a world point to local body frame.
   */
  pointToLocalFrame(worldPoint, result) {
    if (result === void 0) {
      result = new Vec3();
    }
    worldPoint.vsub(this.position, result);
    this.quaternion.conjugate().vmult(result, result);
    return result;
  }

  /**
   * Convert a world vector to local body frame.
   */
  vectorToLocalFrame(worldVector, result) {
    if (result === void 0) {
      result = new Vec3();
    }
    this.quaternion.conjugate().vmult(worldVector, result);
    return result;
  }

  /**
   * Convert a local body point to world frame.
   */
  pointToWorldFrame(localPoint, result) {
    if (result === void 0) {
      result = new Vec3();
    }
    this.quaternion.vmult(localPoint, result);
    result.vadd(this.position, result);
    return result;
  }

  /**
   * Convert a local body point to world frame.
   */
  vectorToWorldFrame(localVector, result) {
    if (result === void 0) {
      result = new Vec3();
    }
    this.quaternion.vmult(localVector, result);
    return result;
  }

  /**
   * Add a shape to the body with a local offset and orientation.
   * @return The body object, for chainability.
   */
  addShape(shape, _offset, _orientation) {
    const offset = new Vec3();
    const orientation = new Quaternion$1();
    if (_offset) {
      offset.copy(_offset);
    }
    if (_orientation) {
      orientation.copy(_orientation);
    }
    this.shapes.push(shape);
    this.shapeOffsets.push(offset);
    this.shapeOrientations.push(orientation);
    this.updateMassProperties();
    this.updateBoundingRadius();
    this.aabbNeedsUpdate = true;
    shape.body = this;
    return this;
  }

  /**
   * Remove a shape from the body.
   * @return The body object, for chainability.
   */
  removeShape(shape) {
    const index = this.shapes.indexOf(shape);
    if (index === -1) {
      console.warn('Shape does not belong to the body');
      return this;
    }
    this.shapes.splice(index, 1);
    this.shapeOffsets.splice(index, 1);
    this.shapeOrientations.splice(index, 1);
    this.updateMassProperties();
    this.updateBoundingRadius();
    this.aabbNeedsUpdate = true;
    shape.body = null;
    return this;
  }

  /**
   * Update the bounding radius of the body. Should be done if any of the shapes are changed.
   */
  updateBoundingRadius() {
    const shapes = this.shapes;
    const shapeOffsets = this.shapeOffsets;
    const N = shapes.length;
    let radius = 0;
    for (let i = 0; i !== N; i++) {
      const shape = shapes[i];
      shape.updateBoundingSphereRadius();
      const offset = shapeOffsets[i].length();
      const r = shape.boundingSphereRadius;
      if (offset + r > radius) {
        radius = offset + r;
      }
    }
    this.boundingRadius = radius;
  }

  /**
   * Updates the .aabb
   */
  updateAABB() {
    const shapes = this.shapes;
    const shapeOffsets = this.shapeOffsets;
    const shapeOrientations = this.shapeOrientations;
    const N = shapes.length;
    const offset = tmpVec;
    const orientation = tmpQuat;
    const bodyQuat = this.quaternion;
    const aabb = this.aabb;
    const shapeAABB = updateAABB_shapeAABB;
    for (let i = 0; i !== N; i++) {
      const shape = shapes[i];

      // Get shape world position
      bodyQuat.vmult(shapeOffsets[i], offset);
      offset.vadd(this.position, offset);

      // Get shape world quaternion
      bodyQuat.mult(shapeOrientations[i], orientation);

      // Get shape AABB
      shape.calculateWorldAABB(offset, orientation, shapeAABB.lowerBound, shapeAABB.upperBound);
      if (i === 0) {
        aabb.copy(shapeAABB);
      } else {
        aabb.extend(shapeAABB);
      }
    }
    this.aabbNeedsUpdate = false;
  }

  /**
   * Update `.inertiaWorld` and `.invInertiaWorld`
   */
  updateInertiaWorld(force) {
    const I = this.invInertia;
    if (I.x === I.y && I.y === I.z && !force) ; else {
      const m1 = uiw_m1;
      const m2 = uiw_m2;
      m1.setRotationFromQuaternion(this.quaternion);
      m1.transpose(m2);
      m1.scale(I, m1);
      m1.mmult(m2, this.invInertiaWorld);
    }
  }

  /**
   * Apply force to a point of the body. This could for example be a point on the Body surface.
   * Applying force this way will add to Body.force and Body.torque.
   * @param force The amount of force to add.
   * @param relativePoint A point relative to the center of mass to apply the force on.
   */
  applyForce(force, relativePoint) {
    if (relativePoint === void 0) {
      relativePoint = new Vec3();
    }
    // Needed?
    if (this.type !== Body.DYNAMIC) {
      return;
    }
    if (this.sleepState === Body.SLEEPING) {
      this.wakeUp();
    }

    // Compute produced rotational force
    const rotForce = Body_applyForce_rotForce;
    relativePoint.cross(force, rotForce);

    // Add linear force
    this.force.vadd(force, this.force);

    // Add rotational force
    this.torque.vadd(rotForce, this.torque);
  }

  /**
   * Apply force to a local point in the body.
   * @param force The force vector to apply, defined locally in the body frame.
   * @param localPoint A local point in the body to apply the force on.
   */
  applyLocalForce(localForce, localPoint) {
    if (localPoint === void 0) {
      localPoint = new Vec3();
    }
    if (this.type !== Body.DYNAMIC) {
      return;
    }
    const worldForce = Body_applyLocalForce_worldForce;
    const relativePointWorld = Body_applyLocalForce_relativePointWorld;

    // Transform the force vector to world space
    this.vectorToWorldFrame(localForce, worldForce);
    this.vectorToWorldFrame(localPoint, relativePointWorld);
    this.applyForce(worldForce, relativePointWorld);
  }

  /**
   * Apply torque to the body.
   * @param torque The amount of torque to add.
   */
  applyTorque(torque) {
    if (this.type !== Body.DYNAMIC) {
      return;
    }
    if (this.sleepState === Body.SLEEPING) {
      this.wakeUp();
    }

    // Add rotational force
    this.torque.vadd(torque, this.torque);
  }

  /**
   * Apply impulse to a point of the body. This could for example be a point on the Body surface.
   * An impulse is a force added to a body during a short period of time (impulse = force * time).
   * Impulses will be added to Body.velocity and Body.angularVelocity.
   * @param impulse The amount of impulse to add.
   * @param relativePoint A point relative to the center of mass to apply the force on.
   */
  applyImpulse(impulse, relativePoint) {
    if (relativePoint === void 0) {
      relativePoint = new Vec3();
    }
    if (this.type !== Body.DYNAMIC) {
      return;
    }
    if (this.sleepState === Body.SLEEPING) {
      this.wakeUp();
    }

    // Compute point position relative to the body center
    const r = relativePoint;

    // Compute produced central impulse velocity
    const velo = Body_applyImpulse_velo;
    velo.copy(impulse);
    velo.scale(this.invMass, velo);

    // Add linear impulse
    this.velocity.vadd(velo, this.velocity);

    // Compute produced rotational impulse velocity
    const rotVelo = Body_applyImpulse_rotVelo;
    r.cross(impulse, rotVelo);

    /*
     rotVelo.x *= this.invInertia.x;
     rotVelo.y *= this.invInertia.y;
     rotVelo.z *= this.invInertia.z;
     */
    this.invInertiaWorld.vmult(rotVelo, rotVelo);

    // Add rotational Impulse
    this.angularVelocity.vadd(rotVelo, this.angularVelocity);
  }

  /**
   * Apply locally-defined impulse to a local point in the body.
   * @param force The force vector to apply, defined locally in the body frame.
   * @param localPoint A local point in the body to apply the force on.
   */
  applyLocalImpulse(localImpulse, localPoint) {
    if (localPoint === void 0) {
      localPoint = new Vec3();
    }
    if (this.type !== Body.DYNAMIC) {
      return;
    }
    const worldImpulse = Body_applyLocalImpulse_worldImpulse;
    const relativePointWorld = Body_applyLocalImpulse_relativePoint;

    // Transform the force vector to world space
    this.vectorToWorldFrame(localImpulse, worldImpulse);
    this.vectorToWorldFrame(localPoint, relativePointWorld);
    this.applyImpulse(worldImpulse, relativePointWorld);
  }

  /**
   * Should be called whenever you change the body shape or mass.
   */
  updateMassProperties() {
    const halfExtents = Body_updateMassProperties_halfExtents;
    this.invMass = this.mass > 0 ? 1.0 / this.mass : 0;
    const I = this.inertia;
    const fixed = this.fixedRotation;

    // Approximate with AABB box
    this.updateAABB();
    halfExtents.set((this.aabb.upperBound.x - this.aabb.lowerBound.x) / 2, (this.aabb.upperBound.y - this.aabb.lowerBound.y) / 2, (this.aabb.upperBound.z - this.aabb.lowerBound.z) / 2);
    Box.calculateInertia(halfExtents, this.mass, I);
    this.invInertia.set(I.x > 0 && !fixed ? 1.0 / I.x : 0, I.y > 0 && !fixed ? 1.0 / I.y : 0, I.z > 0 && !fixed ? 1.0 / I.z : 0);
    this.updateInertiaWorld(true);
  }

  /**
   * Get world velocity of a point in the body.
   * @param worldPoint
   * @param result
   * @return The result vector.
   */
  getVelocityAtWorldPoint(worldPoint, result) {
    const r = new Vec3();
    worldPoint.vsub(this.position, r);
    this.angularVelocity.cross(r, result);
    this.velocity.vadd(result, result);
    return result;
  }

  /**
   * Move the body forward in time.
   * @param dt Time step
   * @param quatNormalize Set to true to normalize the body quaternion
   * @param quatNormalizeFast If the quaternion should be normalized using "fast" quaternion normalization
   */
  integrate(dt, quatNormalize, quatNormalizeFast) {
    // Save previous position
    this.previousPosition.copy(this.position);
    this.previousQuaternion.copy(this.quaternion);
    if (!(this.type === Body.DYNAMIC || this.type === Body.KINEMATIC) || this.sleepState === Body.SLEEPING) {
      // Only for dynamic
      return;
    }
    const velo = this.velocity;
    const angularVelo = this.angularVelocity;
    const pos = this.position;
    const force = this.force;
    const torque = this.torque;
    const quat = this.quaternion;
    const invMass = this.invMass;
    const invInertia = this.invInertiaWorld;
    const linearFactor = this.linearFactor;
    const iMdt = invMass * dt;
    velo.x += force.x * iMdt * linearFactor.x;
    velo.y += force.y * iMdt * linearFactor.y;
    velo.z += force.z * iMdt * linearFactor.z;
    const e = invInertia.elements;
    const angularFactor = this.angularFactor;
    const tx = torque.x * angularFactor.x;
    const ty = torque.y * angularFactor.y;
    const tz = torque.z * angularFactor.z;
    angularVelo.x += dt * (e[0] * tx + e[1] * ty + e[2] * tz);
    angularVelo.y += dt * (e[3] * tx + e[4] * ty + e[5] * tz);
    angularVelo.z += dt * (e[6] * tx + e[7] * ty + e[8] * tz);

    // Use new velocity  - leap frog
    pos.x += velo.x * dt;
    pos.y += velo.y * dt;
    pos.z += velo.z * dt;
    quat.integrate(this.angularVelocity, dt, this.angularFactor, quat);
    if (quatNormalize) {
      if (quatNormalizeFast) {
        quat.normalizeFast();
      } else {
        quat.normalize();
      }
    }
    this.aabbNeedsUpdate = true;

    // Update world inertia
    this.updateInertiaWorld();
  }
}
const tmpVec = new Vec3();
const tmpQuat = new Quaternion$1();
const updateAABB_shapeAABB = new AABB();
const uiw_m1 = new Mat3();
const uiw_m2 = new Mat3();
new Mat3();
const Body_applyForce_rotForce = new Vec3();
const Body_applyLocalForce_worldForce = new Vec3();
const Body_applyLocalForce_relativePointWorld = new Vec3();
const Body_applyImpulse_velo = new Vec3();
const Body_applyImpulse_rotVelo = new Vec3();
const Body_applyLocalImpulse_worldImpulse = new Vec3();
const Body_applyLocalImpulse_relativePoint = new Vec3();
const Body_updateMassProperties_halfExtents = new Vec3();

/**
 * Base class for broadphase implementations
 * @author schteppe
 */
class Broadphase {
  /**
   * The world to search for collisions in.
   */

  /**
   * If set to true, the broadphase uses bounding boxes for intersection tests, else it uses bounding spheres.
   */

  /**
   * Set to true if the objects in the world moved.
   */

  constructor() {
    this.world = null;
    this.useBoundingBoxes = false;
    this.dirty = true;
  }

  /**
   * Get the collision pairs from the world
   * @param world The world to search in
   * @param p1 Empty array to be filled with body objects
   * @param p2 Empty array to be filled with body objects
   */
  collisionPairs(world, p1, p2) {
    throw new Error('collisionPairs not implemented for this BroadPhase class!');
  }

  /**
   * Check if a body pair needs to be intersection tested at all.
   */
  needBroadphaseCollision(bodyA, bodyB) {
    // Check collision filter masks
    if ((bodyA.collisionFilterGroup & bodyB.collisionFilterMask) === 0 || (bodyB.collisionFilterGroup & bodyA.collisionFilterMask) === 0) {
      return false;
    }

    // Check types
    if (((bodyA.type & Body.STATIC) !== 0 || bodyA.sleepState === Body.SLEEPING) && ((bodyB.type & Body.STATIC) !== 0 || bodyB.sleepState === Body.SLEEPING)) {
      // Both bodies are static or sleeping. Skip.
      return false;
    }
    return true;
  }

  /**
   * Check if the bounding volumes of two bodies intersect.
   */
  intersectionTest(bodyA, bodyB, pairs1, pairs2) {
    if (this.useBoundingBoxes) {
      this.doBoundingBoxBroadphase(bodyA, bodyB, pairs1, pairs2);
    } else {
      this.doBoundingSphereBroadphase(bodyA, bodyB, pairs1, pairs2);
    }
  }

  /**
   * Check if the bounding spheres of two bodies are intersecting.
   * @param pairs1 bodyA is appended to this array if intersection
   * @param pairs2 bodyB is appended to this array if intersection
   */
  doBoundingSphereBroadphase(bodyA, bodyB, pairs1, pairs2) {
    const r = Broadphase_collisionPairs_r;
    bodyB.position.vsub(bodyA.position, r);
    const boundingRadiusSum2 = (bodyA.boundingRadius + bodyB.boundingRadius) ** 2;
    const norm2 = r.lengthSquared();
    if (norm2 < boundingRadiusSum2) {
      pairs1.push(bodyA);
      pairs2.push(bodyB);
    }
  }

  /**
   * Check if the bounding boxes of two bodies are intersecting.
   */
  doBoundingBoxBroadphase(bodyA, bodyB, pairs1, pairs2) {
    if (bodyA.aabbNeedsUpdate) {
      bodyA.updateAABB();
    }
    if (bodyB.aabbNeedsUpdate) {
      bodyB.updateAABB();
    }

    // Check AABB / AABB
    if (bodyA.aabb.overlaps(bodyB.aabb)) {
      pairs1.push(bodyA);
      pairs2.push(bodyB);
    }
  }

  /**
   * Removes duplicate pairs from the pair arrays.
   */
  makePairsUnique(pairs1, pairs2) {
    const t = Broadphase_makePairsUnique_temp;
    const p1 = Broadphase_makePairsUnique_p1;
    const p2 = Broadphase_makePairsUnique_p2;
    const N = pairs1.length;
    for (let i = 0; i !== N; i++) {
      p1[i] = pairs1[i];
      p2[i] = pairs2[i];
    }
    pairs1.length = 0;
    pairs2.length = 0;
    for (let i = 0; i !== N; i++) {
      const id1 = p1[i].id;
      const id2 = p2[i].id;
      const key = id1 < id2 ? `${id1},${id2}` : `${id2},${id1}`;
      t[key] = i;
      t.keys.push(key);
    }
    for (let i = 0; i !== t.keys.length; i++) {
      const key = t.keys.pop();
      const pairIndex = t[key];
      pairs1.push(p1[pairIndex]);
      pairs2.push(p2[pairIndex]);
      delete t[key];
    }
  }

  /**
   * To be implemented by subcasses
   */
  setWorld(world) {}

  /**
   * Check if the bounding spheres of two bodies overlap.
   */
  static boundingSphereCheck(bodyA, bodyB) {
    const dist = new Vec3(); // bsc_dist;
    bodyA.position.vsub(bodyB.position, dist);
    const sa = bodyA.shapes[0];
    const sb = bodyB.shapes[0];
    return Math.pow(sa.boundingSphereRadius + sb.boundingSphereRadius, 2) > dist.lengthSquared();
  }

  /**
   * Returns all the bodies within the AABB.
   */
  aabbQuery(world, aabb, result) {
    console.warn('.aabbQuery is not implemented in this Broadphase subclass.');
    return [];
  }
}

// Temp objects
const Broadphase_collisionPairs_r = new Vec3();
new Vec3();
new Quaternion$1();
new Vec3();
const Broadphase_makePairsUnique_temp = {
  keys: []
};
const Broadphase_makePairsUnique_p1 = [];
const Broadphase_makePairsUnique_p2 = [];
new Vec3();
new Vec3();
new Vec3();

/**
 * Naive broadphase implementation, used in lack of better ones.
 *
 * The naive broadphase looks at all possible pairs without restriction, therefore it has complexity N^2 _(which is bad)_
 */
class NaiveBroadphase extends Broadphase {
  /**
   * @todo Remove useless constructor
   */
  constructor() {
    super();
  }

  /**
   * Get all the collision pairs in the physics world
   */
  collisionPairs(world, pairs1, pairs2) {
    const bodies = world.bodies;
    const n = bodies.length;
    let bi;
    let bj;

    // Naive N^2 ftw!
    for (let i = 0; i !== n; i++) {
      for (let j = 0; j !== i; j++) {
        bi = bodies[i];
        bj = bodies[j];
        if (!this.needBroadphaseCollision(bi, bj)) {
          continue;
        }
        this.intersectionTest(bi, bj, pairs1, pairs2);
      }
    }
  }

  /**
   * Returns all the bodies within an AABB.
   * @param result An array to store resulting bodies in.
   */
  aabbQuery(world, aabb, result) {
    if (result === void 0) {
      result = [];
    }
    for (let i = 0; i < world.bodies.length; i++) {
      const b = world.bodies[i];
      if (b.aabbNeedsUpdate) {
        b.updateAABB();
      }

      // Ugly hack until Body gets aabb
      if (b.aabb.overlaps(aabb)) {
        result.push(b);
      }
    }
    return result;
  }
}

/**
 * Storage for Ray casting data
 */
class RaycastResult {
  /**
   * rayFromWorld
   */

  /**
   * rayToWorld
   */

  /**
   * hitNormalWorld
   */

  /**
   * hitPointWorld
   */

  /**
   * hasHit
   */

  /**
   * shape
   */

  /**
   * body
   */

  /**
   * The index of the hit triangle, if the hit shape was a trimesh
   */

  /**
   * Distance to the hit. Will be set to -1 if there was no hit
   */

  /**
   * If the ray should stop traversing the bodies
   */

  constructor() {
    this.rayFromWorld = new Vec3();
    this.rayToWorld = new Vec3();
    this.hitNormalWorld = new Vec3();
    this.hitPointWorld = new Vec3();
    this.hasHit = false;
    this.shape = null;
    this.body = null;
    this.hitFaceIndex = -1;
    this.distance = -1;
    this.shouldStop = false;
  }

  /**
   * Reset all result data.
   */
  reset() {
    this.rayFromWorld.setZero();
    this.rayToWorld.setZero();
    this.hitNormalWorld.setZero();
    this.hitPointWorld.setZero();
    this.hasHit = false;
    this.shape = null;
    this.body = null;
    this.hitFaceIndex = -1;
    this.distance = -1;
    this.shouldStop = false;
  }

  /**
   * abort
   */
  abort() {
    this.shouldStop = true;
  }

  /**
   * Set result data.
   */
  set(rayFromWorld, rayToWorld, hitNormalWorld, hitPointWorld, shape, body, distance) {
    this.rayFromWorld.copy(rayFromWorld);
    this.rayToWorld.copy(rayToWorld);
    this.hitNormalWorld.copy(hitNormalWorld);
    this.hitPointWorld.copy(hitPointWorld);
    this.shape = shape;
    this.body = body;
    this.distance = distance;
  }
}

/**
 * RAY_MODES
 */
const RAY_MODES = {
  /** CLOSEST */
  CLOSEST: 1,
  /** ANY */
  ANY: 2,
  /** ALL */
  ALL: 4
};

/**
 * RayMode
 */

/**
 * RayOptions
 */

/**
 * A line in 3D space that intersects bodies and return points.
 */
class Ray {
  /**
   * from
   */

  /**
   * to
   */

  /**
   * direction
   */

  /**
   * The precision of the ray. Used when checking parallelity etc.
   * @default 0.0001
   */

  /**
   * Set to `false` if you don't want the Ray to take `collisionResponse` flags into account on bodies and shapes.
   * @default true
   */

  /**
   * If set to `true`, the ray skips any hits with normal.dot(rayDirection) < 0.
   * @default false
   */

  /**
   * collisionFilterMask
   * @default -1
   */

  /**
   * collisionFilterGroup
   * @default -1
   */

  /**
   * The intersection mode. Should be Ray.ANY, Ray.ALL or Ray.CLOSEST.
   * @default RAY.ANY
   */

  /**
   * Current result object.
   */

  /**
   * Will be set to `true` during intersectWorld() if the ray hit anything.
   */

  /**
   * User-provided result callback. Will be used if mode is Ray.ALL.
   */

  /**
   * CLOSEST
   */
  static CLOSEST = RAY_MODES.CLOSEST;
  /**
   * ANY
   */
  static ANY = RAY_MODES.ANY;
  /**
   * ALL
   */
  static ALL = RAY_MODES.ALL;
  get [Shape.types.SPHERE]() {
    return this._intersectSphere;
  }
  get [Shape.types.PLANE]() {
    return this._intersectPlane;
  }
  get [Shape.types.BOX]() {
    return this._intersectBox;
  }
  get [Shape.types.CYLINDER]() {
    return this._intersectConvex;
  }
  get [Shape.types.CONVEXPOLYHEDRON]() {
    return this._intersectConvex;
  }
  get [Shape.types.HEIGHTFIELD]() {
    return this._intersectHeightfield;
  }
  get [Shape.types.TRIMESH]() {
    return this._intersectTrimesh;
  }
  constructor(from, to) {
    if (from === void 0) {
      from = new Vec3();
    }
    if (to === void 0) {
      to = new Vec3();
    }
    this.from = from.clone();
    this.to = to.clone();
    this.direction = new Vec3();
    this.precision = 0.0001;
    this.checkCollisionResponse = true;
    this.skipBackfaces = false;
    this.collisionFilterMask = -1;
    this.collisionFilterGroup = -1;
    this.mode = Ray.ANY;
    this.result = new RaycastResult();
    this.hasHit = false;
    this.callback = result => {};
  }

  /**
   * Do itersection against all bodies in the given World.
   * @return True if the ray hit anything, otherwise false.
   */
  intersectWorld(world, options) {
    this.mode = options.mode || Ray.ANY;
    this.result = options.result || new RaycastResult();
    this.skipBackfaces = !!options.skipBackfaces;
    this.collisionFilterMask = typeof options.collisionFilterMask !== 'undefined' ? options.collisionFilterMask : -1;
    this.collisionFilterGroup = typeof options.collisionFilterGroup !== 'undefined' ? options.collisionFilterGroup : -1;
    this.checkCollisionResponse = typeof options.checkCollisionResponse !== 'undefined' ? options.checkCollisionResponse : true;
    if (options.from) {
      this.from.copy(options.from);
    }
    if (options.to) {
      this.to.copy(options.to);
    }
    this.callback = options.callback || (() => {});
    this.hasHit = false;
    this.result.reset();
    this.updateDirection();
    this.getAABB(tmpAABB$1);
    tmpArray.length = 0;
    world.broadphase.aabbQuery(world, tmpAABB$1, tmpArray);
    this.intersectBodies(tmpArray);
    return this.hasHit;
  }

  /**
   * Shoot a ray at a body, get back information about the hit.
   * @deprecated @param result set the result property of the Ray instead.
   */
  intersectBody(body, result) {
    if (result) {
      this.result = result;
      this.updateDirection();
    }
    const checkCollisionResponse = this.checkCollisionResponse;
    if (checkCollisionResponse && !body.collisionResponse) {
      return;
    }
    if ((this.collisionFilterGroup & body.collisionFilterMask) === 0 || (body.collisionFilterGroup & this.collisionFilterMask) === 0) {
      return;
    }
    const xi = intersectBody_xi;
    const qi = intersectBody_qi;
    for (let i = 0, N = body.shapes.length; i < N; i++) {
      const shape = body.shapes[i];
      if (checkCollisionResponse && !shape.collisionResponse) {
        continue; // Skip
      }
      body.quaternion.mult(body.shapeOrientations[i], qi);
      body.quaternion.vmult(body.shapeOffsets[i], xi);
      xi.vadd(body.position, xi);
      this.intersectShape(shape, qi, xi, body);
      if (this.result.shouldStop) {
        break;
      }
    }
  }

  /**
   * Shoot a ray at an array bodies, get back information about the hit.
   * @param bodies An array of Body objects.
   * @deprecated @param result set the result property of the Ray instead.
   *
   */
  intersectBodies(bodies, result) {
    if (result) {
      this.result = result;
      this.updateDirection();
    }
    for (let i = 0, l = bodies.length; !this.result.shouldStop && i < l; i++) {
      this.intersectBody(bodies[i]);
    }
  }

  /**
   * Updates the direction vector.
   */
  updateDirection() {
    this.to.vsub(this.from, this.direction);
    this.direction.normalize();
  }
  intersectShape(shape, quat, position, body) {
    const from = this.from;

    // Checking boundingSphere
    const distance = distanceFromIntersection(from, this.direction, position);
    if (distance > shape.boundingSphereRadius) {
      return;
    }
    const intersectMethod = this[shape.type];
    if (intersectMethod) {
      intersectMethod.call(this, shape, quat, position, body, shape);
    }
  }
  _intersectBox(box, quat, position, body, reportedShape) {
    return this._intersectConvex(box.convexPolyhedronRepresentation, quat, position, body, reportedShape);
  }
  _intersectPlane(shape, quat, position, body, reportedShape) {
    const from = this.from;
    const to = this.to;
    const direction = this.direction;

    // Get plane normal
    const worldNormal = new Vec3(0, 0, 1);
    quat.vmult(worldNormal, worldNormal);
    const len = new Vec3();
    from.vsub(position, len);
    const planeToFrom = len.dot(worldNormal);
    to.vsub(position, len);
    const planeToTo = len.dot(worldNormal);
    if (planeToFrom * planeToTo > 0) {
      // "from" and "to" are on the same side of the plane... bail out
      return;
    }
    if (from.distanceTo(to) < planeToFrom) {
      return;
    }
    const n_dot_dir = worldNormal.dot(direction);
    if (Math.abs(n_dot_dir) < this.precision) {
      // No intersection
      return;
    }
    const planePointToFrom = new Vec3();
    const dir_scaled_with_t = new Vec3();
    const hitPointWorld = new Vec3();
    from.vsub(position, planePointToFrom);
    const t = -worldNormal.dot(planePointToFrom) / n_dot_dir;
    direction.scale(t, dir_scaled_with_t);
    from.vadd(dir_scaled_with_t, hitPointWorld);
    this.reportIntersection(worldNormal, hitPointWorld, reportedShape, body, -1);
  }

  /**
   * Get the world AABB of the ray.
   */
  getAABB(aabb) {
    const {
      lowerBound,
      upperBound
    } = aabb;
    const to = this.to;
    const from = this.from;
    lowerBound.x = Math.min(to.x, from.x);
    lowerBound.y = Math.min(to.y, from.y);
    lowerBound.z = Math.min(to.z, from.z);
    upperBound.x = Math.max(to.x, from.x);
    upperBound.y = Math.max(to.y, from.y);
    upperBound.z = Math.max(to.z, from.z);
  }
  _intersectHeightfield(shape, quat, position, body, reportedShape) {
    shape.data;
    shape.elementSize;
    // Convert the ray to local heightfield coordinates
    const localRay = intersectHeightfield_localRay; //new Ray(this.from, this.to);
    localRay.from.copy(this.from);
    localRay.to.copy(this.to);
    Transform.pointToLocalFrame(position, quat, localRay.from, localRay.from);
    Transform.pointToLocalFrame(position, quat, localRay.to, localRay.to);
    localRay.updateDirection();

    // Get the index of the data points to test against
    const index = intersectHeightfield_index;
    let iMinX;
    let iMinY;
    let iMaxX;
    let iMaxY;

    // Set to max
    iMinX = iMinY = 0;
    iMaxX = iMaxY = shape.data.length - 1;
    const aabb = new AABB();
    localRay.getAABB(aabb);
    shape.getIndexOfPosition(aabb.lowerBound.x, aabb.lowerBound.y, index, true);
    iMinX = Math.max(iMinX, index[0]);
    iMinY = Math.max(iMinY, index[1]);
    shape.getIndexOfPosition(aabb.upperBound.x, aabb.upperBound.y, index, true);
    iMaxX = Math.min(iMaxX, index[0] + 1);
    iMaxY = Math.min(iMaxY, index[1] + 1);
    for (let i = iMinX; i < iMaxX; i++) {
      for (let j = iMinY; j < iMaxY; j++) {
        if (this.result.shouldStop) {
          return;
        }
        shape.getAabbAtIndex(i, j, aabb);
        if (!aabb.overlapsRay(localRay)) {
          continue;
        }

        // Lower triangle
        shape.getConvexTrianglePillar(i, j, false);
        Transform.pointToWorldFrame(position, quat, shape.pillarOffset, worldPillarOffset);
        this._intersectConvex(shape.pillarConvex, quat, worldPillarOffset, body, reportedShape, intersectConvexOptions);
        if (this.result.shouldStop) {
          return;
        }

        // Upper triangle
        shape.getConvexTrianglePillar(i, j, true);
        Transform.pointToWorldFrame(position, quat, shape.pillarOffset, worldPillarOffset);
        this._intersectConvex(shape.pillarConvex, quat, worldPillarOffset, body, reportedShape, intersectConvexOptions);
      }
    }
  }
  _intersectSphere(sphere, quat, position, body, reportedShape) {
    const from = this.from;
    const to = this.to;
    const r = sphere.radius;
    const a = (to.x - from.x) ** 2 + (to.y - from.y) ** 2 + (to.z - from.z) ** 2;
    const b = 2 * ((to.x - from.x) * (from.x - position.x) + (to.y - from.y) * (from.y - position.y) + (to.z - from.z) * (from.z - position.z));
    const c = (from.x - position.x) ** 2 + (from.y - position.y) ** 2 + (from.z - position.z) ** 2 - r ** 2;
    const delta = b ** 2 - 4 * a * c;
    const intersectionPoint = Ray_intersectSphere_intersectionPoint;
    const normal = Ray_intersectSphere_normal;
    if (delta < 0) {
      // No intersection
      return;
    } else if (delta === 0) {
      // single intersection point
      from.lerp(to, delta, intersectionPoint);
      intersectionPoint.vsub(position, normal);
      normal.normalize();
      this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
    } else {
      const d1 = (-b - Math.sqrt(delta)) / (2 * a);
      const d2 = (-b + Math.sqrt(delta)) / (2 * a);
      if (d1 >= 0 && d1 <= 1) {
        from.lerp(to, d1, intersectionPoint);
        intersectionPoint.vsub(position, normal);
        normal.normalize();
        this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
      }
      if (this.result.shouldStop) {
        return;
      }
      if (d2 >= 0 && d2 <= 1) {
        from.lerp(to, d2, intersectionPoint);
        intersectionPoint.vsub(position, normal);
        normal.normalize();
        this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
      }
    }
  }
  _intersectConvex(shape, quat, position, body, reportedShape, options) {
    const normal = intersectConvex_normal;
    const vector = intersectConvex_vector;
    const faceList = options && options.faceList || null;

    // Checking faces
    const faces = shape.faces;
    const vertices = shape.vertices;
    const normals = shape.faceNormals;
    const direction = this.direction;
    const from = this.from;
    const to = this.to;
    const fromToDistance = from.distanceTo(to);
    const Nfaces = faceList ? faceList.length : faces.length;
    const result = this.result;
    for (let j = 0; !result.shouldStop && j < Nfaces; j++) {
      const fi = faceList ? faceList[j] : j;
      const face = faces[fi];
      const faceNormal = normals[fi];
      const q = quat;
      const x = position;

      // determine if ray intersects the plane of the face
      // note: this works regardless of the direction of the face normal

      // Get plane point in world coordinates...
      vector.copy(vertices[face[0]]);
      q.vmult(vector, vector);
      vector.vadd(x, vector);

      // ...but make it relative to the ray from. We'll fix this later.
      vector.vsub(from, vector);

      // Get plane normal
      q.vmult(faceNormal, normal);

      // If this dot product is negative, we have something interesting
      const dot = direction.dot(normal);

      // Bail out if ray and plane are parallel
      if (Math.abs(dot) < this.precision) {
        continue;
      }

      // calc distance to plane
      const scalar = normal.dot(vector) / dot;

      // if negative distance, then plane is behind ray
      if (scalar < 0) {
        continue;
      }

      // if (dot < 0) {

      // Intersection point is from + direction * scalar
      direction.scale(scalar, intersectPoint);
      intersectPoint.vadd(from, intersectPoint);

      // a is the point we compare points b and c with.
      a.copy(vertices[face[0]]);
      q.vmult(a, a);
      x.vadd(a, a);
      for (let i = 1; !result.shouldStop && i < face.length - 1; i++) {
        // Transform 3 vertices to world coords
        b.copy(vertices[face[i]]);
        c.copy(vertices[face[i + 1]]);
        q.vmult(b, b);
        q.vmult(c, c);
        x.vadd(b, b);
        x.vadd(c, c);
        const distance = intersectPoint.distanceTo(from);
        if (!(Ray.pointInTriangle(intersectPoint, a, b, c) || Ray.pointInTriangle(intersectPoint, b, a, c)) || distance > fromToDistance) {
          continue;
        }
        this.reportIntersection(normal, intersectPoint, reportedShape, body, fi);
      }
      // }
    }
  }

  /**
   * @todo Optimize by transforming the world to local space first.
   * @todo Use Octree lookup
   */
  _intersectTrimesh(mesh, quat, position, body, reportedShape, options) {
    const normal = intersectTrimesh_normal;
    const triangles = intersectTrimesh_triangles;
    const treeTransform = intersectTrimesh_treeTransform;
    const vector = intersectConvex_vector;
    const localDirection = intersectTrimesh_localDirection;
    const localFrom = intersectTrimesh_localFrom;
    const localTo = intersectTrimesh_localTo;
    const worldIntersectPoint = intersectTrimesh_worldIntersectPoint;
    const worldNormal = intersectTrimesh_worldNormal;

    // Checking faces
    const indices = mesh.indices;
    mesh.vertices;
    // const normals = mesh.faceNormals

    const from = this.from;
    const to = this.to;
    const direction = this.direction;
    treeTransform.position.copy(position);
    treeTransform.quaternion.copy(quat);

    // Transform ray to local space!
    Transform.vectorToLocalFrame(position, quat, direction, localDirection);
    Transform.pointToLocalFrame(position, quat, from, localFrom);
    Transform.pointToLocalFrame(position, quat, to, localTo);
    localTo.x *= mesh.scale.x;
    localTo.y *= mesh.scale.y;
    localTo.z *= mesh.scale.z;
    localFrom.x *= mesh.scale.x;
    localFrom.y *= mesh.scale.y;
    localFrom.z *= mesh.scale.z;
    localTo.vsub(localFrom, localDirection);
    localDirection.normalize();
    const fromToDistanceSquared = localFrom.distanceSquared(localTo);
    mesh.tree.rayQuery(this, treeTransform, triangles);
    for (let i = 0, N = triangles.length; !this.result.shouldStop && i !== N; i++) {
      const trianglesIndex = triangles[i];
      mesh.getNormal(trianglesIndex, normal);

      // determine if ray intersects the plane of the face
      // note: this works regardless of the direction of the face normal

      // Get plane point in world coordinates...
      mesh.getVertex(indices[trianglesIndex * 3], a);

      // ...but make it relative to the ray from. We'll fix this later.
      a.vsub(localFrom, vector);

      // If this dot product is negative, we have something interesting
      const dot = localDirection.dot(normal);

      // Bail out if ray and plane are parallel
      // if (Math.abs( dot ) < this.precision){
      //     continue;
      // }

      // calc distance to plane
      const scalar = normal.dot(vector) / dot;

      // if negative distance, then plane is behind ray
      if (scalar < 0) {
        continue;
      }

      // Intersection point is from + direction * scalar
      localDirection.scale(scalar, intersectPoint);
      intersectPoint.vadd(localFrom, intersectPoint);

      // Get triangle vertices
      mesh.getVertex(indices[trianglesIndex * 3 + 1], b);
      mesh.getVertex(indices[trianglesIndex * 3 + 2], c);
      const squaredDistance = intersectPoint.distanceSquared(localFrom);
      if (!(Ray.pointInTriangle(intersectPoint, b, a, c) || Ray.pointInTriangle(intersectPoint, a, b, c)) || squaredDistance > fromToDistanceSquared) {
        continue;
      }

      // transform intersectpoint and normal to world
      Transform.vectorToWorldFrame(quat, normal, worldNormal);
      Transform.pointToWorldFrame(position, quat, intersectPoint, worldIntersectPoint);
      this.reportIntersection(worldNormal, worldIntersectPoint, reportedShape, body, trianglesIndex);
    }
    triangles.length = 0;
  }

  /**
   * @return True if the intersections should continue
   */
  reportIntersection(normal, hitPointWorld, shape, body, hitFaceIndex) {
    const from = this.from;
    const to = this.to;
    const distance = from.distanceTo(hitPointWorld);
    const result = this.result;

    // Skip back faces?
    if (this.skipBackfaces && normal.dot(this.direction) > 0) {
      return;
    }
    result.hitFaceIndex = typeof hitFaceIndex !== 'undefined' ? hitFaceIndex : -1;
    switch (this.mode) {
      case Ray.ALL:
        this.hasHit = true;
        result.set(from, to, normal, hitPointWorld, shape, body, distance);
        result.hasHit = true;
        this.callback(result);
        break;
      case Ray.CLOSEST:
        // Store if closer than current closest
        if (distance < result.distance || !result.hasHit) {
          this.hasHit = true;
          result.hasHit = true;
          result.set(from, to, normal, hitPointWorld, shape, body, distance);
        }
        break;
      case Ray.ANY:
        // Report and stop.
        this.hasHit = true;
        result.hasHit = true;
        result.set(from, to, normal, hitPointWorld, shape, body, distance);
        result.shouldStop = true;
        break;
    }
  }

  /**
   * As per "Barycentric Technique" as named
   * {@link https://www.blackpawn.com/texts/pointinpoly/default.html here} but without the division
   */
  static pointInTriangle(p, a, b, c) {
    c.vsub(a, v0);
    b.vsub(a, v1);
    p.vsub(a, v2);
    const dot00 = v0.dot(v0);
    const dot01 = v0.dot(v1);
    const dot02 = v0.dot(v2);
    const dot11 = v1.dot(v1);
    const dot12 = v1.dot(v2);
    let u;
    let v;
    return (u = dot11 * dot02 - dot01 * dot12) >= 0 && (v = dot00 * dot12 - dot01 * dot02) >= 0 && u + v < dot00 * dot11 - dot01 * dot01;
  }
}
const tmpAABB$1 = new AABB();
const tmpArray = [];
const v1 = new Vec3();
const v2 = new Vec3();
const intersectBody_xi = new Vec3();
const intersectBody_qi = new Quaternion$1();
const intersectPoint = new Vec3();
const a = new Vec3();
const b = new Vec3();
const c = new Vec3();
new Vec3();
new RaycastResult();
const intersectConvexOptions = {
  faceList: [0]
};
const worldPillarOffset = new Vec3();
const intersectHeightfield_localRay = new Ray();
const intersectHeightfield_index = [];
const Ray_intersectSphere_intersectionPoint = new Vec3();
const Ray_intersectSphere_normal = new Vec3();
const intersectConvex_normal = new Vec3();
new Vec3();
new Vec3();
const intersectConvex_vector = new Vec3();
const intersectTrimesh_normal = new Vec3();
const intersectTrimesh_localDirection = new Vec3();
const intersectTrimesh_localFrom = new Vec3();
const intersectTrimesh_localTo = new Vec3();
const intersectTrimesh_worldNormal = new Vec3();
const intersectTrimesh_worldIntersectPoint = new Vec3();
new AABB();
const intersectTrimesh_triangles = [];
const intersectTrimesh_treeTransform = new Transform();
const v0 = new Vec3();
const intersect = new Vec3();
function distanceFromIntersection(from, direction, position) {
  // v0 is vector from from to position
  position.vsub(from, v0);
  const dot = v0.dot(direction);

  // intersect = direction*dot + from
  direction.scale(dot, intersect);
  intersect.vadd(from, intersect);
  const distance = position.distanceTo(intersect);
  return distance;
}

class Utils {
  /**
   * Extend an options object with default values.
   * @param options The options object. May be falsy: in this case, a new object is created and returned.
   * @param defaults An object containing default values.
   * @return The modified options object.
   */
  static defaults(options, defaults) {
    if (options === void 0) {
      options = {};
    }
    for (let key in defaults) {
      if (!(key in options)) {
        options[key] = defaults[key];
      }
    }
    return options;
  }
}

/**
 * Constraint base class
 */
class Constraint {
  /**
   * Equations to be solved in this constraint.
   */

  /**
   * Body A.
   */

  /**
   * Body B.
   */

  /**
   * Set to false if you don't want the bodies to collide when they are connected.
   */

  static idCounter = 0;
  constructor(bodyA, bodyB, options) {
    if (options === void 0) {
      options = {};
    }
    options = Utils.defaults(options, {
      collideConnected: true,
      wakeUpBodies: true
    });
    this.equations = [];
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.id = Constraint.idCounter++;
    this.collideConnected = options.collideConnected;
    if (options.wakeUpBodies) {
      if (bodyA) {
        bodyA.wakeUp();
      }
      if (bodyB) {
        bodyB.wakeUp();
      }
    }
  }

  /**
   * Update all the equations with data.
   */
  update() {
    throw new Error('method update() not implmemented in this Constraint subclass!');
  }

  /**
   * Enables all equations in the constraint.
   */
  enable() {
    const eqs = this.equations;
    for (let i = 0; i < eqs.length; i++) {
      eqs[i].enabled = true;
    }
  }

  /**
   * Disables all equations in the constraint.
   */
  disable() {
    const eqs = this.equations;
    for (let i = 0; i < eqs.length; i++) {
      eqs[i].enabled = false;
    }
  }
}

/**
 * An element containing 6 entries, 3 spatial and 3 rotational degrees of freedom.
 */
class JacobianElement {
  /**
   * spatial
   */

  /**
   * rotational
   */

  constructor() {
    this.spatial = new Vec3();
    this.rotational = new Vec3();
  }

  /**
   * Multiply with other JacobianElement
   */
  multiplyElement(element) {
    return element.spatial.dot(this.spatial) + element.rotational.dot(this.rotational);
  }

  /**
   * Multiply with two vectors
   */
  multiplyVectors(spatial, rotational) {
    return spatial.dot(this.spatial) + rotational.dot(this.rotational);
  }
}

/**
 * Equation base class.
 *
 * `a`, `b` and `eps` are {@link https://www8.cs.umu.se/kurser/5DV058/VT15/lectures/SPOOKlabnotes.pdf SPOOK} parameters that default to `0.0`. See {@link https://github.com/schteppe/cannon.js/issues/238#issuecomment-147172327 this exchange} for more details on Cannon's physics implementation.
 */
class Equation {
  /**
   * Minimum (read: negative max) force to be applied by the constraint.
   */

  /**
   * Maximum (read: positive max) force to be applied by the constraint.
   */

  /**
   * SPOOK parameter
   */

  /**
   * SPOOK parameter
   */

  /**
   * SPOOK parameter
   */

  /**
   * A number, proportional to the force added to the bodies.
   */

  static idCounter = 0;
  constructor(bi, bj, minForce, maxForce) {
    if (minForce === void 0) {
      minForce = -1e6;
    }
    if (maxForce === void 0) {
      maxForce = 1e6;
    }
    this.id = Equation.idCounter++;
    this.minForce = minForce;
    this.maxForce = maxForce;
    this.bi = bi;
    this.bj = bj;
    this.a = 0.0; // SPOOK parameter
    this.b = 0.0; // SPOOK parameter
    this.eps = 0.0; // SPOOK parameter
    this.jacobianElementA = new JacobianElement();
    this.jacobianElementB = new JacobianElement();
    this.enabled = true;
    this.multiplier = 0;
    this.setSpookParams(1e7, 4, 1 / 60); // Set typical spook params
  }

  /**
   * Recalculates a, b, and eps.
   *
   * The Equation constructor sets typical SPOOK parameters as such:
   * * `stiffness` = 1e7
   * * `relaxation` = 4
   * * `timeStep`= 1 / 60, _note the hardcoded refresh rate._
   */
  setSpookParams(stiffness, relaxation, timeStep) {
    const d = relaxation;
    const k = stiffness;
    const h = timeStep;
    this.a = 4.0 / (h * (1 + 4 * d));
    this.b = 4.0 * d / (1 + 4 * d);
    this.eps = 4.0 / (h * h * k * (1 + 4 * d));
  }

  /**
   * Computes the right hand side of the SPOOK equation
   */
  computeB(a, b, h) {
    const GW = this.computeGW();
    const Gq = this.computeGq();
    const GiMf = this.computeGiMf();
    return -Gq * a - GW * b - GiMf * h;
  }

  /**
   * Computes G*q, where q are the generalized body coordinates
   */
  computeGq() {
    const GA = this.jacobianElementA;
    const GB = this.jacobianElementB;
    const bi = this.bi;
    const bj = this.bj;
    const xi = bi.position;
    const xj = bj.position;
    return GA.spatial.dot(xi) + GB.spatial.dot(xj);
  }

  /**
   * Computes G*W, where W are the body velocities
   */
  computeGW() {
    const GA = this.jacobianElementA;
    const GB = this.jacobianElementB;
    const bi = this.bi;
    const bj = this.bj;
    const vi = bi.velocity;
    const vj = bj.velocity;
    const wi = bi.angularVelocity;
    const wj = bj.angularVelocity;
    return GA.multiplyVectors(vi, wi) + GB.multiplyVectors(vj, wj);
  }

  /**
   * Computes G*Wlambda, where W are the body velocities
   */
  computeGWlambda() {
    const GA = this.jacobianElementA;
    const GB = this.jacobianElementB;
    const bi = this.bi;
    const bj = this.bj;
    const vi = bi.vlambda;
    const vj = bj.vlambda;
    const wi = bi.wlambda;
    const wj = bj.wlambda;
    return GA.multiplyVectors(vi, wi) + GB.multiplyVectors(vj, wj);
  }

  /**
   * Computes G*inv(M)*f, where M is the mass matrix with diagonal blocks for each body, and f are the forces on the bodies.
   */
  computeGiMf() {
    const GA = this.jacobianElementA;
    const GB = this.jacobianElementB;
    const bi = this.bi;
    const bj = this.bj;
    const fi = bi.force;
    const ti = bi.torque;
    const fj = bj.force;
    const tj = bj.torque;
    const invMassi = bi.invMassSolve;
    const invMassj = bj.invMassSolve;
    fi.scale(invMassi, iMfi);
    fj.scale(invMassj, iMfj);
    bi.invInertiaWorldSolve.vmult(ti, invIi_vmult_taui);
    bj.invInertiaWorldSolve.vmult(tj, invIj_vmult_tauj);
    return GA.multiplyVectors(iMfi, invIi_vmult_taui) + GB.multiplyVectors(iMfj, invIj_vmult_tauj);
  }

  /**
   * Computes G*inv(M)*G'
   */
  computeGiMGt() {
    const GA = this.jacobianElementA;
    const GB = this.jacobianElementB;
    const bi = this.bi;
    const bj = this.bj;
    const invMassi = bi.invMassSolve;
    const invMassj = bj.invMassSolve;
    const invIi = bi.invInertiaWorldSolve;
    const invIj = bj.invInertiaWorldSolve;
    let result = invMassi + invMassj;
    invIi.vmult(GA.rotational, tmp);
    result += tmp.dot(GA.rotational);
    invIj.vmult(GB.rotational, tmp);
    result += tmp.dot(GB.rotational);
    return result;
  }

  /**
   * Add constraint velocity to the bodies.
   */
  addToWlambda(deltalambda) {
    const GA = this.jacobianElementA;
    const GB = this.jacobianElementB;
    const bi = this.bi;
    const bj = this.bj;
    const temp = addToWlambda_temp;

    // Add to linear velocity
    // v_lambda += inv(M) * delta_lamba * G
    bi.vlambda.addScaledVector(bi.invMassSolve * deltalambda, GA.spatial, bi.vlambda);
    bj.vlambda.addScaledVector(bj.invMassSolve * deltalambda, GB.spatial, bj.vlambda);

    // Add to angular velocity
    bi.invInertiaWorldSolve.vmult(GA.rotational, temp);
    bi.wlambda.addScaledVector(deltalambda, temp, bi.wlambda);
    bj.invInertiaWorldSolve.vmult(GB.rotational, temp);
    bj.wlambda.addScaledVector(deltalambda, temp, bj.wlambda);
  }

  /**
   * Compute the denominator part of the SPOOK equation: C = G*inv(M)*G' + eps
   */
  computeC() {
    return this.computeGiMGt() + this.eps;
  }
}
const iMfi = new Vec3();
const iMfj = new Vec3();
const invIi_vmult_taui = new Vec3();
const invIj_vmult_tauj = new Vec3();
const tmp = new Vec3();
const addToWlambda_temp = new Vec3();

/**
 * Contact/non-penetration constraint equation
 */
class ContactEquation extends Equation {
  /**
   * "bounciness": u1 = -e*u0
   */

  /**
   * World-oriented vector that goes from the center of bi to the contact point.
   */

  /**
   * World-oriented vector that starts in body j position and goes to the contact point.
   */

  /**
   * Contact normal, pointing out of body i.
   */

  constructor(bodyA, bodyB, maxForce) {
    if (maxForce === void 0) {
      maxForce = 1e6;
    }
    super(bodyA, bodyB, 0, maxForce);
    this.restitution = 0.0;
    this.ri = new Vec3();
    this.rj = new Vec3();
    this.ni = new Vec3();
  }
  computeB(h) {
    const a = this.a;
    const b = this.b;
    const bi = this.bi;
    const bj = this.bj;
    const ri = this.ri;
    const rj = this.rj;
    const rixn = ContactEquation_computeB_temp1;
    const rjxn = ContactEquation_computeB_temp2;
    const vi = bi.velocity;
    const wi = bi.angularVelocity;
    bi.force;
    bi.torque;
    const vj = bj.velocity;
    const wj = bj.angularVelocity;
    bj.force;
    bj.torque;
    const penetrationVec = ContactEquation_computeB_temp3;
    const GA = this.jacobianElementA;
    const GB = this.jacobianElementB;
    const n = this.ni;

    // Caluclate cross products
    ri.cross(n, rixn);
    rj.cross(n, rjxn);

    // g = xj+rj -(xi+ri)
    // G = [ -ni  -rixn  ni  rjxn ]
    n.negate(GA.spatial);
    rixn.negate(GA.rotational);
    GB.spatial.copy(n);
    GB.rotational.copy(rjxn);

    // Calculate the penetration vector
    penetrationVec.copy(bj.position);
    penetrationVec.vadd(rj, penetrationVec);
    penetrationVec.vsub(bi.position, penetrationVec);
    penetrationVec.vsub(ri, penetrationVec);
    const g = n.dot(penetrationVec);

    // Compute iteration
    const ePlusOne = this.restitution + 1;
    const GW = ePlusOne * vj.dot(n) - ePlusOne * vi.dot(n) + wj.dot(rjxn) - wi.dot(rixn);
    const GiMf = this.computeGiMf();
    const B = -g * a - GW * b - h * GiMf;
    return B;
  }

  /**
   * Get the current relative velocity in the contact point.
   */
  getImpactVelocityAlongNormal() {
    const vi = ContactEquation_getImpactVelocityAlongNormal_vi;
    const vj = ContactEquation_getImpactVelocityAlongNormal_vj;
    const xi = ContactEquation_getImpactVelocityAlongNormal_xi;
    const xj = ContactEquation_getImpactVelocityAlongNormal_xj;
    const relVel = ContactEquation_getImpactVelocityAlongNormal_relVel;
    this.bi.position.vadd(this.ri, xi);
    this.bj.position.vadd(this.rj, xj);
    this.bi.getVelocityAtWorldPoint(xi, vi);
    this.bj.getVelocityAtWorldPoint(xj, vj);
    vi.vsub(vj, relVel);
    return this.ni.dot(relVel);
  }
}
const ContactEquation_computeB_temp1 = new Vec3(); // Temp vectors
const ContactEquation_computeB_temp2 = new Vec3();
const ContactEquation_computeB_temp3 = new Vec3();
const ContactEquation_getImpactVelocityAlongNormal_vi = new Vec3();
const ContactEquation_getImpactVelocityAlongNormal_vj = new Vec3();
const ContactEquation_getImpactVelocityAlongNormal_xi = new Vec3();
const ContactEquation_getImpactVelocityAlongNormal_xj = new Vec3();
const ContactEquation_getImpactVelocityAlongNormal_relVel = new Vec3();

/**
 * Connects two bodies at given offset points.
 * @example
 *     const bodyA = new Body({ mass: 1 })
 *     const bodyB = new Body({ mass: 1 })
 *     bodyA.position.set(-1, 0, 0)
 *     bodyB.position.set(1, 0, 0)
 *     bodyA.addShape(shapeA)
 *     bodyB.addShape(shapeB)
 *     world.addBody(bodyA)
 *     world.addBody(bodyB)
 *     const localPivotA = new Vec3(1, 0, 0)
 *     const localPivotB = new Vec3(-1, 0, 0)
 *     const constraint = new PointToPointConstraint(bodyA, localPivotA, bodyB, localPivotB)
 *     world.addConstraint(constraint)
 */
class PointToPointConstraint extends Constraint {
  /**
   * Pivot, defined locally in bodyA.
   */

  /**
   * Pivot, defined locally in bodyB.
   */

  /**
   * @param pivotA The point relative to the center of mass of bodyA which bodyA is constrained to.
   * @param bodyB Body that will be constrained in a similar way to the same point as bodyA. We will therefore get a link between bodyA and bodyB. If not specified, bodyA will be constrained to a static point.
   * @param pivotB The point relative to the center of mass of bodyB which bodyB is constrained to.
   * @param maxForce The maximum force that should be applied to constrain the bodies.
   */
  constructor(bodyA, pivotA, bodyB, pivotB, maxForce) {
    if (pivotA === void 0) {
      pivotA = new Vec3();
    }
    if (pivotB === void 0) {
      pivotB = new Vec3();
    }
    if (maxForce === void 0) {
      maxForce = 1e6;
    }
    super(bodyA, bodyB);
    this.pivotA = pivotA.clone();
    this.pivotB = pivotB.clone();
    const x = this.equationX = new ContactEquation(bodyA, bodyB);
    const y = this.equationY = new ContactEquation(bodyA, bodyB);
    const z = this.equationZ = new ContactEquation(bodyA, bodyB);

    // Equations to be fed to the solver
    this.equations.push(x, y, z);

    // Make the equations bidirectional
    x.minForce = y.minForce = z.minForce = -maxForce;
    x.maxForce = y.maxForce = z.maxForce = maxForce;
    x.ni.set(1, 0, 0);
    y.ni.set(0, 1, 0);
    z.ni.set(0, 0, 1);
  }
  update() {
    const bodyA = this.bodyA;
    const bodyB = this.bodyB;
    const x = this.equationX;
    const y = this.equationY;
    const z = this.equationZ;

    // Rotate the pivots to world space
    bodyA.quaternion.vmult(this.pivotA, x.ri);
    bodyB.quaternion.vmult(this.pivotB, x.rj);
    y.ri.copy(x.ri);
    y.rj.copy(x.rj);
    z.ri.copy(x.ri);
    z.rj.copy(x.rj);
  }
}
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();

/**
 * Constrains the slipping in a contact along a tangent
 */
class FrictionEquation extends Equation {
  // Tangent

  /**
   * @param slipForce should be +-F_friction = +-mu * F_normal = +-mu * m * g
   */
  constructor(bodyA, bodyB, slipForce) {
    super(bodyA, bodyB, -slipForce, slipForce);
    this.ri = new Vec3();
    this.rj = new Vec3();
    this.t = new Vec3();
  }
  computeB(h) {
    this.a;
    const b = this.b;
    this.bi;
    this.bj;
    const ri = this.ri;
    const rj = this.rj;
    const rixt = FrictionEquation_computeB_temp1;
    const rjxt = FrictionEquation_computeB_temp2;
    const t = this.t;

    // Caluclate cross products
    ri.cross(t, rixt);
    rj.cross(t, rjxt);

    // G = [-t -rixt t rjxt]
    // And remember, this is a pure velocity constraint, g is always zero!
    const GA = this.jacobianElementA;
    const GB = this.jacobianElementB;
    t.negate(GA.spatial);
    rixt.negate(GA.rotational);
    GB.spatial.copy(t);
    GB.rotational.copy(rjxt);
    const GW = this.computeGW();
    const GiMf = this.computeGiMf();
    const B = -GW * b - h * GiMf;
    return B;
  }
}
const FrictionEquation_computeB_temp1 = new Vec3();
const FrictionEquation_computeB_temp2 = new Vec3();

/**
 * Defines what happens when two materials meet.
 * @todo Refactor materials to materialA and materialB
 */
class ContactMaterial {
  /**
   * Identifier of this material.
   */

  /**
   * Participating materials.
   */

  /**
   * Friction coefficient.
   * @default 0.3
   */

  /**
   * Restitution coefficient.
   * @default 0.3
   */

  /**
   * Stiffness of the produced contact equations.
   * @default 1e7
   */

  /**
   * Relaxation time of the produced contact equations.
   * @default 3
   */

  /**
   * Stiffness of the produced friction equations.
   * @default 1e7
   */

  /**
   * Relaxation time of the produced friction equations
   * @default 3
   */

  static idCounter = 0;
  constructor(m1, m2, options) {
    options = Utils.defaults(options, {
      friction: 0.3,
      restitution: 0.3,
      contactEquationStiffness: 1e7,
      contactEquationRelaxation: 3,
      frictionEquationStiffness: 1e7,
      frictionEquationRelaxation: 3
    });
    this.id = ContactMaterial.idCounter++;
    this.materials = [m1, m2];
    this.friction = options.friction;
    this.restitution = options.restitution;
    this.contactEquationStiffness = options.contactEquationStiffness;
    this.contactEquationRelaxation = options.contactEquationRelaxation;
    this.frictionEquationStiffness = options.frictionEquationStiffness;
    this.frictionEquationRelaxation = options.frictionEquationRelaxation;
  }
}

/**
 * Defines a physics material.
 */
class Material {
  /**
   * Material name.
   * If options is a string, name will be set to that string.
   * @todo Deprecate this
   */

  /** Material id. */

  /**
   * Friction for this material.
   * If non-negative, it will be used instead of the friction given by ContactMaterials. If there's no matching ContactMaterial, the value from `defaultContactMaterial` in the World will be used.
   */

  /**
   * Restitution for this material.
   * If non-negative, it will be used instead of the restitution given by ContactMaterials. If there's no matching ContactMaterial, the value from `defaultContactMaterial` in the World will be used.
   */

  static idCounter = 0;
  constructor(options) {
    if (options === void 0) {
      options = {};
    }
    let name = '';

    // Backwards compatibility fix
    if (typeof options === 'string') {
      //console.warn(`Passing a string to MaterialOptions is deprecated, and has no effect`)
      name = options;
      options = {};
    }
    this.name = name;
    this.id = Material.idCounter++;
    this.friction = typeof options.friction !== 'undefined' ? options.friction : -1;
    this.restitution = typeof options.restitution !== 'undefined' ? options.restitution : -1;
  }
}
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Ray();
new Vec3();
new Vec3();
new Vec3();
[new Vec3(1, 0, 0), new Vec3(0, 1, 0), new Vec3(0, 0, 1)];
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();

/**
 * Spherical shape
 * @example
 *     const radius = 1
 *     const sphereShape = new CANNON.Sphere(radius)
 *     const sphereBody = new CANNON.Body({ mass: 1, shape: sphereShape })
 *     world.addBody(sphereBody)
 */
class Sphere extends Shape {
  /**
   * The radius of the sphere.
   */

  /**
   *
   * @param radius The radius of the sphere, a non-negative number.
   */
  constructor(radius) {
    super({
      type: Shape.types.SPHERE
    });
    this.radius = radius !== undefined ? radius : 1.0;
    if (this.radius < 0) {
      throw new Error('The sphere radius cannot be negative.');
    }
    this.updateBoundingSphereRadius();
  }

  /** calculateLocalInertia */
  calculateLocalInertia(mass, target) {
    if (target === void 0) {
      target = new Vec3();
    }
    const I = 2.0 * mass * this.radius * this.radius / 5.0;
    target.x = I;
    target.y = I;
    target.z = I;
    return target;
  }

  /** volume */
  volume() {
    return 4.0 * Math.PI * Math.pow(this.radius, 3) / 3.0;
  }
  updateBoundingSphereRadius() {
    this.boundingSphereRadius = this.radius;
  }
  calculateWorldAABB(pos, quat, min, max) {
    const r = this.radius;
    const axes = ['x', 'y', 'z'];
    for (let i = 0; i < axes.length; i++) {
      const ax = axes[i];
      min[ax] = pos[ax] - r;
      max[ax] = pos[ax] + r;
    }
  }
}
new Vec3();
new Vec3();
new Vec3();

// Temp vectors for calculation
new Vec3(); // Relative velocity

new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();

/**
 * Cylinder class.
 * @example
 *     const radiusTop = 0.5
 *     const radiusBottom = 0.5
 *     const height = 2
 *     const numSegments = 12
 *     const cylinderShape = new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments)
 *     const cylinderBody = new CANNON.Body({ mass: 1, shape: cylinderShape })
 *     world.addBody(cylinderBody)
 */
class Cylinder extends ConvexPolyhedron {
  /** The radius of the top of the Cylinder. */

  /** The radius of the bottom of the Cylinder. */

  /** The height of the Cylinder. */

  /** The number of segments to build the cylinder out of. */

  /**
   * @param radiusTop The radius of the top of the Cylinder.
   * @param radiusBottom The radius of the bottom of the Cylinder.
   * @param height The height of the Cylinder.
   * @param numSegments The number of segments to build the cylinder out of.
   */
  constructor(radiusTop, radiusBottom, height, numSegments) {
    if (radiusTop === void 0) {
      radiusTop = 1;
    }
    if (radiusBottom === void 0) {
      radiusBottom = 1;
    }
    if (height === void 0) {
      height = 1;
    }
    if (numSegments === void 0) {
      numSegments = 8;
    }
    if (radiusTop < 0) {
      throw new Error('The cylinder radiusTop cannot be negative.');
    }
    if (radiusBottom < 0) {
      throw new Error('The cylinder radiusBottom cannot be negative.');
    }
    const N = numSegments;
    const vertices = [];
    const axes = [];
    const faces = [];
    const bottomface = [];
    const topface = [];
    const cos = Math.cos;
    const sin = Math.sin;

    // First bottom point
    vertices.push(new Vec3(-radiusBottom * sin(0), -height * 0.5, radiusBottom * cos(0)));
    bottomface.push(0);

    // First top point
    vertices.push(new Vec3(-radiusTop * sin(0), height * 0.5, radiusTop * cos(0)));
    topface.push(1);
    for (let i = 0; i < N; i++) {
      const theta = 2 * Math.PI / N * (i + 1);
      const thetaN = 2 * Math.PI / N * (i + 0.5);
      if (i < N - 1) {
        // Bottom
        vertices.push(new Vec3(-radiusBottom * sin(theta), -height * 0.5, radiusBottom * cos(theta)));
        bottomface.push(2 * i + 2);
        // Top
        vertices.push(new Vec3(-radiusTop * sin(theta), height * 0.5, radiusTop * cos(theta)));
        topface.push(2 * i + 3);

        // Face
        faces.push([2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2]);
      } else {
        faces.push([2 * i, 2 * i + 1, 1, 0]); // Connect
      }

      // Axis: we can cut off half of them if we have even number of segments
      if (N % 2 === 1 || i < N / 2) {
        axes.push(new Vec3(-sin(thetaN), 0, cos(thetaN)));
      }
    }
    faces.push(bottomface);
    axes.push(new Vec3(0, 1, 0));

    // Reorder top face
    const temp = [];
    for (let i = 0; i < topface.length; i++) {
      temp.push(topface[topface.length - i - 1]);
    }
    faces.push(temp);
    super({
      vertices,
      faces,
      axes
    });
    this.type = Shape.types.CYLINDER;
    this.radiusTop = radiusTop;
    this.radiusBottom = radiusBottom;
    this.height = height;
    this.numSegments = numSegments;
  }
}

/**
 * A plane, facing in the Z direction. The plane has its surface at z=0 and everything below z=0 is assumed to be solid plane. To make the plane face in some other direction than z, you must put it inside a Body and rotate that body. See the demos.
 * @example
 *     const planeShape = new CANNON.Plane()
 *     const planeBody = new CANNON.Body({ mass: 0, shape:  planeShape })
 *     planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
 *     world.addBody(planeBody)
 */
class Plane extends Shape {
  /** worldNormal */

  /** worldNormalNeedsUpdate */

  constructor() {
    super({
      type: Shape.types.PLANE
    });

    // World oriented normal
    this.worldNormal = new Vec3();
    this.worldNormalNeedsUpdate = true;
    this.boundingSphereRadius = Number.MAX_VALUE;
  }

  /** computeWorldNormal */
  computeWorldNormal(quat) {
    const n = this.worldNormal;
    n.set(0, 0, 1);
    quat.vmult(n, n);
    this.worldNormalNeedsUpdate = false;
  }
  calculateLocalInertia(mass, target) {
    if (target === void 0) {
      target = new Vec3();
    }
    return target;
  }
  volume() {
    return (
      // The plane is infinite...
      Number.MAX_VALUE
    );
  }
  calculateWorldAABB(pos, quat, min, max) {
    // The plane AABB is infinite, except if the normal is pointing along any axis
    tempNormal.set(0, 0, 1); // Default plane normal is z
    quat.vmult(tempNormal, tempNormal);
    const maxVal = Number.MAX_VALUE;
    min.set(-maxVal, -maxVal, -maxVal);
    max.set(maxVal, maxVal, maxVal);
    if (tempNormal.x === 1) {
      max.x = pos.x;
    } else if (tempNormal.x === -1) {
      min.x = pos.x;
    }
    if (tempNormal.y === 1) {
      max.y = pos.y;
    } else if (tempNormal.y === -1) {
      min.y = pos.y;
    }
    if (tempNormal.z === 1) {
      max.z = pos.z;
    } else if (tempNormal.z === -1) {
      min.z = pos.z;
    }
  }
  updateBoundingSphereRadius() {
    this.boundingSphereRadius = Number.MAX_VALUE;
  }
}
const tempNormal = new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new AABB();
new Vec3();
new AABB();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new Vec3();
new AABB();
new Vec3();
new Transform();
new AABB();

/**
 * Constraint equation solver base class.
 */
class Solver {
  /**
   * All equations to be solved
   */

  /**
   * @todo remove useless constructor
   */
  constructor() {
    this.equations = [];
  }

  /**
   * Should be implemented in subclasses!
   * @todo use abstract
   * @return number of iterations performed
   */
  solve(dt, world) {
    return (
      // Should return the number of iterations done!
      0
    );
  }

  /**
   * Add an equation
   */
  addEquation(eq) {
    if (eq.enabled && !eq.bi.isTrigger && !eq.bj.isTrigger) {
      this.equations.push(eq);
    }
  }

  /**
   * Remove an equation
   */
  removeEquation(eq) {
    const eqs = this.equations;
    const i = eqs.indexOf(eq);
    if (i !== -1) {
      eqs.splice(i, 1);
    }
  }

  /**
   * Add all equations
   */
  removeAllEquations() {
    this.equations.length = 0;
  }
}

/**
 * Constraint equation Gauss-Seidel solver.
 * @todo The spook parameters should be specified for each constraint, not globally.
 * @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
 */
class GSSolver extends Solver {
  /**
   * The number of solver iterations determines quality of the constraints in the world.
   * The more iterations, the more correct simulation. More iterations need more computations though. If you have a large gravity force in your world, you will need more iterations.
   */

  /**
   * When tolerance is reached, the system is assumed to be converged.
   */

  /**
   * @todo remove useless constructor
   */
  constructor() {
    super();
    this.iterations = 10;
    this.tolerance = 1e-7;
  }

  /**
   * Solve
   * @return number of iterations performed
   */
  solve(dt, world) {
    let iter = 0;
    const maxIter = this.iterations;
    const tolSquared = this.tolerance * this.tolerance;
    const equations = this.equations;
    const Neq = equations.length;
    const bodies = world.bodies;
    const Nbodies = bodies.length;
    const h = dt;
    let B;
    let invC;
    let deltalambda;
    let deltalambdaTot;
    let GWlambda;
    let lambdaj;

    // Update solve mass
    if (Neq !== 0) {
      for (let i = 0; i !== Nbodies; i++) {
        bodies[i].updateSolveMassProperties();
      }
    }

    // Things that do not change during iteration can be computed once
    const invCs = GSSolver_solve_invCs;
    const Bs = GSSolver_solve_Bs;
    const lambda = GSSolver_solve_lambda;
    invCs.length = Neq;
    Bs.length = Neq;
    lambda.length = Neq;
    for (let i = 0; i !== Neq; i++) {
      const c = equations[i];
      lambda[i] = 0.0;
      Bs[i] = c.computeB(h);
      invCs[i] = 1.0 / c.computeC();
    }
    if (Neq !== 0) {
      // Reset vlambda
      for (let i = 0; i !== Nbodies; i++) {
        const b = bodies[i];
        const vlambda = b.vlambda;
        const wlambda = b.wlambda;
        vlambda.set(0, 0, 0);
        wlambda.set(0, 0, 0);
      }

      // Iterate over equations
      for (iter = 0; iter !== maxIter; iter++) {
        // Accumulate the total error for each iteration.
        deltalambdaTot = 0.0;
        for (let j = 0; j !== Neq; j++) {
          const c = equations[j];

          // Compute iteration
          B = Bs[j];
          invC = invCs[j];
          lambdaj = lambda[j];
          GWlambda = c.computeGWlambda();
          deltalambda = invC * (B - GWlambda - c.eps * lambdaj);

          // Clamp if we are not within the min/max interval
          if (lambdaj + deltalambda < c.minForce) {
            deltalambda = c.minForce - lambdaj;
          } else if (lambdaj + deltalambda > c.maxForce) {
            deltalambda = c.maxForce - lambdaj;
          }
          lambda[j] += deltalambda;
          deltalambdaTot += deltalambda > 0.0 ? deltalambda : -deltalambda; // abs(deltalambda)

          c.addToWlambda(deltalambda);
        }

        // If the total error is small enough - stop iterate
        if (deltalambdaTot * deltalambdaTot < tolSquared) {
          break;
        }
      }

      // Add result to velocity
      for (let i = 0; i !== Nbodies; i++) {
        const b = bodies[i];
        const v = b.velocity;
        const w = b.angularVelocity;
        b.vlambda.vmul(b.linearFactor, b.vlambda);
        v.vadd(b.vlambda, v);
        b.wlambda.vmul(b.angularFactor, b.wlambda);
        w.vadd(b.wlambda, w);
      }

      // Set the `.multiplier` property of each equation
      let l = equations.length;
      const invDt = 1 / h;
      while (l--) {
        equations[l].multiplier = lambda[l] * invDt;
      }
    }
    return iter;
  }
}

// Just temporary number holders that we want to reuse each iteration.
const GSSolver_solve_lambda = [];
const GSSolver_solve_invCs = [];
const GSSolver_solve_Bs = [];

/**
 * For pooling objects that can be reused.
 */
class Pool {
  /**
   * The objects array.
   */
  objects = [];
  /**
   * The type of the objects.
   */
  type = Object;

  /**
   * Release an object after use
   */
  release() {
    const Nargs = arguments.length;
    for (let i = 0; i !== Nargs; i++) {
      this.objects.push(i < 0 || arguments.length <= i ? undefined : arguments[i]);
    }
    return this;
  }

  /**
   * Get an object
   */
  get() {
    if (this.objects.length === 0) {
      return this.constructObject();
    } else {
      return this.objects.pop();
    }
  }

  /**
   * Construct an object. Should be implemented in each subclass.
   */
  constructObject() {
    throw new Error('constructObject() not implemented in this Pool subclass yet!');
  }

  /**
   * @return Self, for chaining
   */
  resize(size) {
    const objects = this.objects;
    while (objects.length > size) {
      objects.pop();
    }
    while (objects.length < size) {
      objects.push(this.constructObject());
    }
    return this;
  }
}

/**
 * Vec3Pool
 */
class Vec3Pool extends Pool {
  type = Vec3;

  /**
   * Construct a vector
   */
  constructObject() {
    return new Vec3();
  }
}

// Naming rule: based of the order in SHAPE_TYPES,
// the first part of the method is formed by the
// shape type that comes before, in the second part
// there is the shape type that comes after in the SHAPE_TYPES list
const COLLISION_TYPES = {
  sphereSphere: Shape.types.SPHERE,
  spherePlane: Shape.types.SPHERE | Shape.types.PLANE,
  boxBox: Shape.types.BOX | Shape.types.BOX,
  sphereBox: Shape.types.SPHERE | Shape.types.BOX,
  planeBox: Shape.types.PLANE | Shape.types.BOX,
  convexConvex: Shape.types.CONVEXPOLYHEDRON,
  sphereConvex: Shape.types.SPHERE | Shape.types.CONVEXPOLYHEDRON,
  planeConvex: Shape.types.PLANE | Shape.types.CONVEXPOLYHEDRON,
  boxConvex: Shape.types.BOX | Shape.types.CONVEXPOLYHEDRON,
  sphereHeightfield: Shape.types.SPHERE | Shape.types.HEIGHTFIELD,
  boxHeightfield: Shape.types.BOX | Shape.types.HEIGHTFIELD,
  convexHeightfield: Shape.types.CONVEXPOLYHEDRON | Shape.types.HEIGHTFIELD,
  sphereParticle: Shape.types.PARTICLE | Shape.types.SPHERE,
  planeParticle: Shape.types.PLANE | Shape.types.PARTICLE,
  boxParticle: Shape.types.BOX | Shape.types.PARTICLE,
  convexParticle: Shape.types.PARTICLE | Shape.types.CONVEXPOLYHEDRON,
  cylinderCylinder: Shape.types.CYLINDER,
  sphereCylinder: Shape.types.SPHERE | Shape.types.CYLINDER,
  planeCylinder: Shape.types.PLANE | Shape.types.CYLINDER,
  boxCylinder: Shape.types.BOX | Shape.types.CYLINDER,
  convexCylinder: Shape.types.CONVEXPOLYHEDRON | Shape.types.CYLINDER,
  heightfieldCylinder: Shape.types.HEIGHTFIELD | Shape.types.CYLINDER,
  particleCylinder: Shape.types.PARTICLE | Shape.types.CYLINDER,
  sphereTrimesh: Shape.types.SPHERE | Shape.types.TRIMESH,
  planeTrimesh: Shape.types.PLANE | Shape.types.TRIMESH
};
/**
 * Helper class for the World. Generates ContactEquations.
 * @todo Sphere-ConvexPolyhedron contacts
 * @todo Contact reduction
 * @todo should move methods to prototype
 */
class Narrowphase {
  /**
   * Internal storage of pooled contact points.
   */

  /**
   * Pooled vectors.
   */

  get [COLLISION_TYPES.sphereSphere]() {
    return this.sphereSphere;
  }
  get [COLLISION_TYPES.spherePlane]() {
    return this.spherePlane;
  }
  get [COLLISION_TYPES.boxBox]() {
    return this.boxBox;
  }
  get [COLLISION_TYPES.sphereBox]() {
    return this.sphereBox;
  }
  get [COLLISION_TYPES.planeBox]() {
    return this.planeBox;
  }
  get [COLLISION_TYPES.convexConvex]() {
    return this.convexConvex;
  }
  get [COLLISION_TYPES.sphereConvex]() {
    return this.sphereConvex;
  }
  get [COLLISION_TYPES.planeConvex]() {
    return this.planeConvex;
  }
  get [COLLISION_TYPES.boxConvex]() {
    return this.boxConvex;
  }
  get [COLLISION_TYPES.sphereHeightfield]() {
    return this.sphereHeightfield;
  }
  get [COLLISION_TYPES.boxHeightfield]() {
    return this.boxHeightfield;
  }
  get [COLLISION_TYPES.convexHeightfield]() {
    return this.convexHeightfield;
  }
  get [COLLISION_TYPES.sphereParticle]() {
    return this.sphereParticle;
  }
  get [COLLISION_TYPES.planeParticle]() {
    return this.planeParticle;
  }
  get [COLLISION_TYPES.boxParticle]() {
    return this.boxParticle;
  }
  get [COLLISION_TYPES.convexParticle]() {
    return this.convexParticle;
  }
  get [COLLISION_TYPES.cylinderCylinder]() {
    return this.convexConvex;
  }
  get [COLLISION_TYPES.sphereCylinder]() {
    return this.sphereConvex;
  }
  get [COLLISION_TYPES.planeCylinder]() {
    return this.planeConvex;
  }
  get [COLLISION_TYPES.boxCylinder]() {
    return this.boxConvex;
  }
  get [COLLISION_TYPES.convexCylinder]() {
    return this.convexConvex;
  }
  get [COLLISION_TYPES.heightfieldCylinder]() {
    return this.heightfieldCylinder;
  }
  get [COLLISION_TYPES.particleCylinder]() {
    return this.particleCylinder;
  }
  get [COLLISION_TYPES.sphereTrimesh]() {
    return this.sphereTrimesh;
  }
  get [COLLISION_TYPES.planeTrimesh]() {
    return this.planeTrimesh;
  }
  // get [COLLISION_TYPES.convexTrimesh]() {
  //   return this.convexTrimesh
  // }

  constructor(world) {
    this.contactPointPool = [];
    this.frictionEquationPool = [];
    this.result = [];
    this.frictionResult = [];
    this.v3pool = new Vec3Pool();
    this.world = world;
    this.currentContactMaterial = world.defaultContactMaterial;
    this.enableFrictionReduction = false;
  }

  /**
   * Make a contact object, by using the internal pool or creating a new one.
   */
  createContactEquation(bi, bj, si, sj, overrideShapeA, overrideShapeB) {
    let c;
    if (this.contactPointPool.length) {
      c = this.contactPointPool.pop();
      c.bi = bi;
      c.bj = bj;
    } else {
      c = new ContactEquation(bi, bj);
    }
    c.enabled = bi.collisionResponse && bj.collisionResponse && si.collisionResponse && sj.collisionResponse;
    const cm = this.currentContactMaterial;
    c.restitution = cm.restitution;
    c.setSpookParams(cm.contactEquationStiffness, cm.contactEquationRelaxation, this.world.dt);
    const matA = si.material || bi.material;
    const matB = sj.material || bj.material;
    if (matA && matB && matA.restitution >= 0 && matB.restitution >= 0) {
      c.restitution = matA.restitution * matB.restitution;
    }
    c.si = overrideShapeA || si;
    c.sj = overrideShapeB || sj;
    return c;
  }
  createFrictionEquationsFromContact(contactEquation, outArray) {
    const bodyA = contactEquation.bi;
    const bodyB = contactEquation.bj;
    const shapeA = contactEquation.si;
    const shapeB = contactEquation.sj;
    const world = this.world;
    const cm = this.currentContactMaterial;

    // If friction or restitution were specified in the material, use them
    let friction = cm.friction;
    const matA = shapeA.material || bodyA.material;
    const matB = shapeB.material || bodyB.material;
    if (matA && matB && matA.friction >= 0 && matB.friction >= 0) {
      friction = matA.friction * matB.friction;
    }
    if (friction > 0) {
      // Create 2 tangent equations
      // Users may provide a force different from global gravity to use when computing contact friction.
      const mug = friction * (world.frictionGravity || world.gravity).length();
      let reducedMass = bodyA.invMass + bodyB.invMass;
      if (reducedMass > 0) {
        reducedMass = 1 / reducedMass;
      }
      const pool = this.frictionEquationPool;
      const c1 = pool.length ? pool.pop() : new FrictionEquation(bodyA, bodyB, mug * reducedMass);
      const c2 = pool.length ? pool.pop() : new FrictionEquation(bodyA, bodyB, mug * reducedMass);
      c1.bi = c2.bi = bodyA;
      c1.bj = c2.bj = bodyB;
      c1.minForce = c2.minForce = -mug * reducedMass;
      c1.maxForce = c2.maxForce = mug * reducedMass;

      // Copy over the relative vectors
      c1.ri.copy(contactEquation.ri);
      c1.rj.copy(contactEquation.rj);
      c2.ri.copy(contactEquation.ri);
      c2.rj.copy(contactEquation.rj);

      // Construct tangents
      contactEquation.ni.tangents(c1.t, c2.t);

      // Set spook params
      c1.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, world.dt);
      c2.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, world.dt);
      c1.enabled = c2.enabled = contactEquation.enabled;
      outArray.push(c1, c2);
      return true;
    }
    return false;
  }

  /**
   * Take the average N latest contact point on the plane.
   */
  createFrictionFromAverage(numContacts) {
    // The last contactEquation
    let c = this.result[this.result.length - 1];

    // Create the result: two "average" friction equations
    if (!this.createFrictionEquationsFromContact(c, this.frictionResult) || numContacts === 1) {
      return;
    }
    const f1 = this.frictionResult[this.frictionResult.length - 2];
    const f2 = this.frictionResult[this.frictionResult.length - 1];
    averageNormal.setZero();
    averageContactPointA.setZero();
    averageContactPointB.setZero();
    const bodyA = c.bi;
    c.bj;
    for (let i = 0; i !== numContacts; i++) {
      c = this.result[this.result.length - 1 - i];
      if (c.bi !== bodyA) {
        averageNormal.vadd(c.ni, averageNormal);
        averageContactPointA.vadd(c.ri, averageContactPointA);
        averageContactPointB.vadd(c.rj, averageContactPointB);
      } else {
        averageNormal.vsub(c.ni, averageNormal);
        averageContactPointA.vadd(c.rj, averageContactPointA);
        averageContactPointB.vadd(c.ri, averageContactPointB);
      }
    }
    const invNumContacts = 1 / numContacts;
    averageContactPointA.scale(invNumContacts, f1.ri);
    averageContactPointB.scale(invNumContacts, f1.rj);
    f2.ri.copy(f1.ri); // Should be the same
    f2.rj.copy(f1.rj);
    averageNormal.normalize();
    averageNormal.tangents(f1.t, f2.t);
    // return eq;
  }

  /**
   * Generate all contacts between a list of body pairs
   * @param p1 Array of body indices
   * @param p2 Array of body indices
   * @param result Array to store generated contacts
   * @param oldcontacts Optional. Array of reusable contact objects
   */
  getContacts(p1, p2, world, result, oldcontacts, frictionResult, frictionPool) {
    // Save old contact objects
    this.contactPointPool = oldcontacts;
    this.frictionEquationPool = frictionPool;
    this.result = result;
    this.frictionResult = frictionResult;
    const qi = tmpQuat1;
    const qj = tmpQuat2;
    const xi = tmpVec1;
    const xj = tmpVec2;
    for (let k = 0, N = p1.length; k !== N; k++) {
      // Get current collision bodies
      const bi = p1[k];
      const bj = p2[k];

      // Get contact material
      let bodyContactMaterial = null;
      if (bi.material && bj.material) {
        bodyContactMaterial = world.getContactMaterial(bi.material, bj.material) || null;
      }
      const justTest = bi.type & Body.KINEMATIC && bj.type & Body.STATIC || bi.type & Body.STATIC && bj.type & Body.KINEMATIC || bi.type & Body.KINEMATIC && bj.type & Body.KINEMATIC;
      for (let i = 0; i < bi.shapes.length; i++) {
        bi.quaternion.mult(bi.shapeOrientations[i], qi);
        bi.quaternion.vmult(bi.shapeOffsets[i], xi);
        xi.vadd(bi.position, xi);
        const si = bi.shapes[i];
        for (let j = 0; j < bj.shapes.length; j++) {
          // Compute world transform of shapes
          bj.quaternion.mult(bj.shapeOrientations[j], qj);
          bj.quaternion.vmult(bj.shapeOffsets[j], xj);
          xj.vadd(bj.position, xj);
          const sj = bj.shapes[j];
          if (!(si.collisionFilterMask & sj.collisionFilterGroup && sj.collisionFilterMask & si.collisionFilterGroup)) {
            continue;
          }
          if (xi.distanceTo(xj) > si.boundingSphereRadius + sj.boundingSphereRadius) {
            continue;
          }

          // Get collision material
          let shapeContactMaterial = null;
          if (si.material && sj.material) {
            shapeContactMaterial = world.getContactMaterial(si.material, sj.material) || null;
          }
          this.currentContactMaterial = shapeContactMaterial || bodyContactMaterial || world.defaultContactMaterial;

          // Get contacts
          const resolverIndex = si.type | sj.type;
          const resolver = this[resolverIndex];
          if (resolver) {
            let retval = false;

            // TO DO: investigate why sphereParticle and convexParticle
            // resolvers expect si and sj shapes to be in reverse order
            // (i.e. larger integer value type first instead of smaller first)
            if (si.type < sj.type) {
              retval = resolver.call(this, si, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
            } else {
              retval = resolver.call(this, sj, si, xj, xi, qj, qi, bj, bi, si, sj, justTest);
            }
            if (retval && justTest) {
              // Register overlap
              world.shapeOverlapKeeper.set(si.id, sj.id);
              world.bodyOverlapKeeper.set(bi.id, bj.id);
            }
          }
        }
      }
    }
  }
  sphereSphere(si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
    if (justTest) {
      return xi.distanceSquared(xj) < (si.radius + sj.radius) ** 2;
    }

    // We will have only one contact in this case
    const contactEq = this.createContactEquation(bi, bj, si, sj, rsi, rsj);

    // Contact normal
    xj.vsub(xi, contactEq.ni);
    contactEq.ni.normalize();

    // Contact point locations
    contactEq.ri.copy(contactEq.ni);
    contactEq.rj.copy(contactEq.ni);
    contactEq.ri.scale(si.radius, contactEq.ri);
    contactEq.rj.scale(-sj.radius, contactEq.rj);
    contactEq.ri.vadd(xi, contactEq.ri);
    contactEq.ri.vsub(bi.position, contactEq.ri);
    contactEq.rj.vadd(xj, contactEq.rj);
    contactEq.rj.vsub(bj.position, contactEq.rj);
    this.result.push(contactEq);
    this.createFrictionEquationsFromContact(contactEq, this.frictionResult);
  }
  spherePlane(si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
    // We will have one contact in this case
    const r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);

    // Contact normal
    r.ni.set(0, 0, 1);
    qj.vmult(r.ni, r.ni);
    r.ni.negate(r.ni); // body i is the sphere, flip normal
    r.ni.normalize(); // Needed?

    // Vector from sphere center to contact point
    r.ni.scale(si.radius, r.ri);

    // Project down sphere on plane
    xi.vsub(xj, point_on_plane_to_sphere);
    r.ni.scale(r.ni.dot(point_on_plane_to_sphere), plane_to_sphere_ortho);
    point_on_plane_to_sphere.vsub(plane_to_sphere_ortho, r.rj); // The sphere position projected to plane

    if (-point_on_plane_to_sphere.dot(r.ni) <= si.radius) {
      if (justTest) {
        return true;
      }

      // Make it relative to the body
      const ri = r.ri;
      const rj = r.rj;
      ri.vadd(xi, ri);
      ri.vsub(bi.position, ri);
      rj.vadd(xj, rj);
      rj.vsub(bj.position, rj);
      this.result.push(r);
      this.createFrictionEquationsFromContact(r, this.frictionResult);
    }
  }
  boxBox(si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
    si.convexPolyhedronRepresentation.material = si.material;
    sj.convexPolyhedronRepresentation.material = sj.material;
    si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
    sj.convexPolyhedronRepresentation.collisionResponse = sj.collisionResponse;
    return this.convexConvex(si.convexPolyhedronRepresentation, sj.convexPolyhedronRepresentation, xi, xj, qi, qj, bi, bj, si, sj, justTest);
  }
  sphereBox(si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
    const v3pool = this.v3pool;

    // we refer to the box as body j
    const sides = sphereBox_sides;
    xi.vsub(xj, box_to_sphere);
    sj.getSideNormals(sides, qj);
    const R = si.radius;

    // Check side (plane) intersections
    let found = false;

    // Store the resulting side penetration info
    const side_ns = sphereBox_side_ns;
    const side_ns1 = sphereBox_side_ns1;
    const side_ns2 = sphereBox_side_ns2;
    let side_h = null;
    let side_penetrations = 0;
    let side_dot1 = 0;
    let side_dot2 = 0;
    let side_distance = null;
    for (let idx = 0, nsides = sides.length; idx !== nsides && found === false; idx++) {
      // Get the plane side normal (ns)
      const ns = sphereBox_ns;
      ns.copy(sides[idx]);
      const h = ns.length();
      ns.normalize();

      // The normal/distance dot product tells which side of the plane we are
      const dot = box_to_sphere.dot(ns);
      if (dot < h + R && dot > 0) {
        // Intersects plane. Now check the other two dimensions
        const ns1 = sphereBox_ns1;
        const ns2 = sphereBox_ns2;
        ns1.copy(sides[(idx + 1) % 3]);
        ns2.copy(sides[(idx + 2) % 3]);
        const h1 = ns1.length();
        const h2 = ns2.length();
        ns1.normalize();
        ns2.normalize();
        const dot1 = box_to_sphere.dot(ns1);
        const dot2 = box_to_sphere.dot(ns2);
        if (dot1 < h1 && dot1 > -h1 && dot2 < h2 && dot2 > -h2) {
          const dist = Math.abs(dot - h - R);
          if (side_distance === null || dist < side_distance) {
            side_distance = dist;
            side_dot1 = dot1;
            side_dot2 = dot2;
            side_h = h;
            side_ns.copy(ns);
            side_ns1.copy(ns1);
            side_ns2.copy(ns2);
            side_penetrations++;
            if (justTest) {
              return true;
            }
          }
        }
      }
    }
    if (side_penetrations) {
      found = true;
      const r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
      side_ns.scale(-R, r.ri); // Sphere r
      r.ni.copy(side_ns);
      r.ni.negate(r.ni); // Normal should be out of sphere
      side_ns.scale(side_h, side_ns);
      side_ns1.scale(side_dot1, side_ns1);
      side_ns.vadd(side_ns1, side_ns);
      side_ns2.scale(side_dot2, side_ns2);
      side_ns.vadd(side_ns2, r.rj);

      // Make relative to bodies
      r.ri.vadd(xi, r.ri);
      r.ri.vsub(bi.position, r.ri);
      r.rj.vadd(xj, r.rj);
      r.rj.vsub(bj.position, r.rj);
      this.result.push(r);
      this.createFrictionEquationsFromContact(r, this.frictionResult);
    }

    // Check corners
    let rj = v3pool.get();
    const sphere_to_corner = sphereBox_sphere_to_corner;
    for (let j = 0; j !== 2 && !found; j++) {
      for (let k = 0; k !== 2 && !found; k++) {
        for (let l = 0; l !== 2 && !found; l++) {
          rj.set(0, 0, 0);
          if (j) {
            rj.vadd(sides[0], rj);
          } else {
            rj.vsub(sides[0], rj);
          }
          if (k) {
            rj.vadd(sides[1], rj);
          } else {
            rj.vsub(sides[1], rj);
          }
          if (l) {
            rj.vadd(sides[2], rj);
          } else {
            rj.vsub(sides[2], rj);
          }

          // World position of corner
          xj.vadd(rj, sphere_to_corner);
          sphere_to_corner.vsub(xi, sphere_to_corner);
          if (sphere_to_corner.lengthSquared() < R * R) {
            if (justTest) {
              return true;
            }
            found = true;
            const r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
            r.ri.copy(sphere_to_corner);
            r.ri.normalize();
            r.ni.copy(r.ri);
            r.ri.scale(R, r.ri);
            r.rj.copy(rj);

            // Make relative to bodies
            r.ri.vadd(xi, r.ri);
            r.ri.vsub(bi.position, r.ri);
            r.rj.vadd(xj, r.rj);
            r.rj.vsub(bj.position, r.rj);
            this.result.push(r);
            this.createFrictionEquationsFromContact(r, this.frictionResult);
          }
        }
      }
    }
    v3pool.release(rj);
    rj = null;

    // Check edges
    const edgeTangent = v3pool.get();
    const edgeCenter = v3pool.get();
    const r = v3pool.get(); // r = edge center to sphere center
    const orthogonal = v3pool.get();
    const dist = v3pool.get();
    const Nsides = sides.length;
    for (let j = 0; j !== Nsides && !found; j++) {
      for (let k = 0; k !== Nsides && !found; k++) {
        if (j % 3 !== k % 3) {
          // Get edge tangent
          sides[k].cross(sides[j], edgeTangent);
          edgeTangent.normalize();
          sides[j].vadd(sides[k], edgeCenter);
          r.copy(xi);
          r.vsub(edgeCenter, r);
          r.vsub(xj, r);
          const orthonorm = r.dot(edgeTangent); // distance from edge center to sphere center in the tangent direction
          edgeTangent.scale(orthonorm, orthogonal); // Vector from edge center to sphere center in the tangent direction

          // Find the third side orthogonal to this one
          let l = 0;
          while (l === j % 3 || l === k % 3) {
            l++;
          }

          // vec from edge center to sphere projected to the plane orthogonal to the edge tangent
          dist.copy(xi);
          dist.vsub(orthogonal, dist);
          dist.vsub(edgeCenter, dist);
          dist.vsub(xj, dist);

          // Distances in tangent direction and distance in the plane orthogonal to it
          const tdist = Math.abs(orthonorm);
          const ndist = dist.length();
          if (tdist < sides[l].length() && ndist < R) {
            if (justTest) {
              return true;
            }
            found = true;
            const res = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
            edgeCenter.vadd(orthogonal, res.rj); // box rj
            res.rj.copy(res.rj);
            dist.negate(res.ni);
            res.ni.normalize();
            res.ri.copy(res.rj);
            res.ri.vadd(xj, res.ri);
            res.ri.vsub(xi, res.ri);
            res.ri.normalize();
            res.ri.scale(R, res.ri);

            // Make relative to bodies
            res.ri.vadd(xi, res.ri);
            res.ri.vsub(bi.position, res.ri);
            res.rj.vadd(xj, res.rj);
            res.rj.vsub(bj.position, res.rj);
            this.result.push(res);
            this.createFrictionEquationsFromContact(res, this.frictionResult);
          }
        }
      }
    }
    v3pool.release(edgeTangent, edgeCenter, r, orthogonal, dist);
  }
  planeBox(si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
    sj.convexPolyhedronRepresentation.material = sj.material;
    sj.convexPolyhedronRepresentation.collisionResponse = sj.collisionResponse;
    sj.convexPolyhedronRepresentation.id = sj.id;
    return this.planeConvex(si, sj.convexPolyhedronRepresentation, xi, xj, qi, qj, bi, bj, si, sj, justTest);
  }
  convexConvex(si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest, faceListA, faceListB) {
    const sepAxis = convexConvex_sepAxis;
    if (xi.distanceTo(xj) > si.boundingSphereRadius + sj.boundingSphereRadius) {
      return;
    }
    if (si.findSeparatingAxis(sj, xi, qi, xj, qj, sepAxis, faceListA, faceListB)) {
      const res = [];
      const q = convexConvex_q;
      si.clipAgainstHull(xi, qi, sj, xj, qj, sepAxis, -100, 100, res);
      let numContacts = 0;
      for (let j = 0; j !== res.length; j++) {
        if (justTest) {
          return true;
        }
        const r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
        const ri = r.ri;
        const rj = r.rj;
        sepAxis.negate(r.ni);
        res[j].normal.negate(q);
        q.scale(res[j].depth, q);
        res[j].point.vadd(q, ri);
        rj.copy(res[j].point);

        // Contact points are in world coordinates. Transform back to relative
        ri.vsub(xi, ri);
        rj.vsub(xj, rj);

        // Make relative to bodies
        ri.vadd(xi, ri);
        ri.vsub(bi.position, ri);
        rj.vadd(xj, rj);
        rj.vsub(bj.position, rj);
        this.result.push(r);
        numContacts++;
        if (!this.enableFrictionReduction) {
          this.createFrictionEquationsFromContact(r, this.frictionResult);
        }
      }
      if (this.enableFrictionReduction && numContacts) {
        this.createFrictionFromAverage(numContacts);
      }
    }
  }
  sphereConvex(si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
    const v3pool = this.v3pool;
    xi.vsub(xj, convex_to_sphere);
    const normals = sj.faceNormals;
    const faces = sj.faces;
    const verts = sj.vertices;
    const R = si.radius;

    // if(convex_to_sphere.lengthSquared() > si.boundingSphereRadius + sj.boundingSphereRadius){
    //     return;
    // }
    let found = false;

    // Check corners
    for (let i = 0; i !== verts.length; i++) {
      const v = verts[i];

      // World position of corner
      const worldCorner = sphereConvex_worldCorner;
      qj.vmult(v, worldCorner);
      xj.vadd(worldCorner, worldCorner);
      const sphere_to_corner = sphereConvex_sphereToCorner;
      worldCorner.vsub(xi, sphere_to_corner);
      if (sphere_to_corner.lengthSquared() < R * R) {
        if (justTest) {
          return true;
        }
        found = true;
        const r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
        r.ri.copy(sphere_to_corner);
        r.ri.normalize();
        r.ni.copy(r.ri);
        r.ri.scale(R, r.ri);
        worldCorner.vsub(xj, r.rj);

        // Should be relative to the body.
        r.ri.vadd(xi, r.ri);
        r.ri.vsub(bi.position, r.ri);

        // Should be relative to the body.
        r.rj.vadd(xj, r.rj);
        r.rj.vsub(bj.position, r.rj);
        this.result.push(r);
        this.createFrictionEquationsFromContact(r, this.frictionResult);
        return;
      }
    }

    // Check side (plane) intersections
    for (let i = 0, nfaces = faces.length; i !== nfaces && found === false; i++) {
      const normal = normals[i];
      const face = faces[i];

      // Get world-transformed normal of the face
      const worldNormal = sphereConvex_worldNormal;
      qj.vmult(normal, worldNormal);

      // Get a world vertex from the face
      const worldPoint = sphereConvex_worldPoint;
      qj.vmult(verts[face[0]], worldPoint);
      worldPoint.vadd(xj, worldPoint);

      // Get a point on the sphere, closest to the face normal
      const worldSpherePointClosestToPlane = sphereConvex_worldSpherePointClosestToPlane;
      worldNormal.scale(-R, worldSpherePointClosestToPlane);
      xi.vadd(worldSpherePointClosestToPlane, worldSpherePointClosestToPlane);

      // Vector from a face point to the closest point on the sphere
      const penetrationVec = sphereConvex_penetrationVec;
      worldSpherePointClosestToPlane.vsub(worldPoint, penetrationVec);

      // The penetration. Negative value means overlap.
      const penetration = penetrationVec.dot(worldNormal);
      const worldPointToSphere = sphereConvex_sphereToWorldPoint;
      xi.vsub(worldPoint, worldPointToSphere);
      if (penetration < 0 && worldPointToSphere.dot(worldNormal) > 0) {
        // Intersects plane. Now check if the sphere is inside the face polygon
        const faceVerts = []; // Face vertices, in world coords
        for (let j = 0, Nverts = face.length; j !== Nverts; j++) {
          const worldVertex = v3pool.get();
          qj.vmult(verts[face[j]], worldVertex);
          xj.vadd(worldVertex, worldVertex);
          faceVerts.push(worldVertex);
        }
        if (pointInPolygon(faceVerts, worldNormal, xi)) {
          // Is the sphere center in the face polygon?
          if (justTest) {
            return true;
          }
          found = true;
          const r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
          worldNormal.scale(-R, r.ri); // Contact offset, from sphere center to contact
          worldNormal.negate(r.ni); // Normal pointing out of sphere

          const penetrationVec2 = v3pool.get();
          worldNormal.scale(-penetration, penetrationVec2);
          const penetrationSpherePoint = v3pool.get();
          worldNormal.scale(-R, penetrationSpherePoint);

          //xi.vsub(xj).vadd(penetrationSpherePoint).vadd(penetrationVec2 , r.rj);
          xi.vsub(xj, r.rj);
          r.rj.vadd(penetrationSpherePoint, r.rj);
          r.rj.vadd(penetrationVec2, r.rj);

          // Should be relative to the body.
          r.rj.vadd(xj, r.rj);
          r.rj.vsub(bj.position, r.rj);

          // Should be relative to the body.
          r.ri.vadd(xi, r.ri);
          r.ri.vsub(bi.position, r.ri);
          v3pool.release(penetrationVec2);
          v3pool.release(penetrationSpherePoint);
          this.result.push(r);
          this.createFrictionEquationsFromContact(r, this.frictionResult);

          // Release world vertices
          for (let j = 0, Nfaceverts = faceVerts.length; j !== Nfaceverts; j++) {
            v3pool.release(faceVerts[j]);
          }
          return; // We only expect *one* face contact
        } else {
          // Edge?
          for (let j = 0; j !== face.length; j++) {
            // Get two world transformed vertices
            const v1 = v3pool.get();
            const v2 = v3pool.get();
            qj.vmult(verts[face[(j + 1) % face.length]], v1);
            qj.vmult(verts[face[(j + 2) % face.length]], v2);
            xj.vadd(v1, v1);
            xj.vadd(v2, v2);

            // Construct edge vector
            const edge = sphereConvex_edge;
            v2.vsub(v1, edge);

            // Construct the same vector, but normalized
            const edgeUnit = sphereConvex_edgeUnit;
            edge.unit(edgeUnit);

            // p is xi projected onto the edge
            const p = v3pool.get();
            const v1_to_xi = v3pool.get();
            xi.vsub(v1, v1_to_xi);
            const dot = v1_to_xi.dot(edgeUnit);
            edgeUnit.scale(dot, p);
            p.vadd(v1, p);

            // Compute a vector from p to the center of the sphere
            const xi_to_p = v3pool.get();
            p.vsub(xi, xi_to_p);

            // Collision if the edge-sphere distance is less than the radius
            // AND if p is in between v1 and v2
            if (dot > 0 && dot * dot < edge.lengthSquared() && xi_to_p.lengthSquared() < R * R) {
              // Collision if the edge-sphere distance is less than the radius
              // Edge contact!
              if (justTest) {
                return true;
              }
              const r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
              p.vsub(xj, r.rj);
              p.vsub(xi, r.ni);
              r.ni.normalize();
              r.ni.scale(R, r.ri);

              // Should be relative to the body.
              r.rj.vadd(xj, r.rj);
              r.rj.vsub(bj.position, r.rj);

              // Should be relative to the body.
              r.ri.vadd(xi, r.ri);
              r.ri.vsub(bi.position, r.ri);
              this.result.push(r);
              this.createFrictionEquationsFromContact(r, this.frictionResult);

              // Release world vertices
              for (let j = 0, Nfaceverts = faceVerts.length; j !== Nfaceverts; j++) {
                v3pool.release(faceVerts[j]);
              }
              v3pool.release(v1);
              v3pool.release(v2);
              v3pool.release(p);
              v3pool.release(xi_to_p);
              v3pool.release(v1_to_xi);
              return;
            }
            v3pool.release(v1);
            v3pool.release(v2);
            v3pool.release(p);
            v3pool.release(xi_to_p);
            v3pool.release(v1_to_xi);
          }
        }

        // Release world vertices
        for (let j = 0, Nfaceverts = faceVerts.length; j !== Nfaceverts; j++) {
          v3pool.release(faceVerts[j]);
        }
      }
    }
  }
  planeConvex(planeShape, convexShape, planePosition, convexPosition, planeQuat, convexQuat, planeBody, convexBody, si, sj, justTest) {
    // Simply return the points behind the plane.
    const worldVertex = planeConvex_v;
    const worldNormal = planeConvex_normal;
    worldNormal.set(0, 0, 1);
    planeQuat.vmult(worldNormal, worldNormal); // Turn normal according to plane orientation

    let numContacts = 0;
    const relpos = planeConvex_relpos;
    for (let i = 0; i !== convexShape.vertices.length; i++) {
      // Get world convex vertex
      worldVertex.copy(convexShape.vertices[i]);
      convexQuat.vmult(worldVertex, worldVertex);
      convexPosition.vadd(worldVertex, worldVertex);
      worldVertex.vsub(planePosition, relpos);
      const dot = worldNormal.dot(relpos);
      if (dot <= 0.0) {
        if (justTest) {
          return true;
        }
        const r = this.createContactEquation(planeBody, convexBody, planeShape, convexShape, si, sj);

        // Get vertex position projected on plane
        const projected = planeConvex_projected;
        worldNormal.scale(worldNormal.dot(relpos), projected);
        worldVertex.vsub(projected, projected);
        projected.vsub(planePosition, r.ri); // From plane to vertex projected on plane

        r.ni.copy(worldNormal); // Contact normal is the plane normal out from plane

        // rj is now just the vector from the convex center to the vertex
        worldVertex.vsub(convexPosition, r.rj);

        // Make it relative to the body
        r.ri.vadd(planePosition, r.ri);
        r.ri.vsub(planeBody.position, r.ri);
        r.rj.vadd(convexPosition, r.rj);
        r.rj.vsub(convexBody.position, r.rj);
        this.result.push(r);
        numContacts++;
        if (!this.enableFrictionReduction) {
          this.createFrictionEquationsFromContact(r, this.frictionResult);
        }
      }
    }
    if (this.enableFrictionReduction && numContacts) {
      this.createFrictionFromAverage(numContacts);
    }
  }
  boxConvex(si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
    si.convexPolyhedronRepresentation.material = si.material;
    si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
    return this.convexConvex(si.convexPolyhedronRepresentation, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
  }
  sphereHeightfield(sphereShape, hfShape, spherePos, hfPos, sphereQuat, hfQuat, sphereBody, hfBody, rsi, rsj, justTest) {
    const data = hfShape.data;
    const radius = sphereShape.radius;
    const w = hfShape.elementSize;
    const worldPillarOffset = sphereHeightfield_tmp2;

    // Get sphere position to heightfield local!
    const localSpherePos = sphereHeightfield_tmp1;
    Transform.pointToLocalFrame(hfPos, hfQuat, spherePos, localSpherePos);

    // Get the index of the data points to test against
    let iMinX = Math.floor((localSpherePos.x - radius) / w) - 1;
    let iMaxX = Math.ceil((localSpherePos.x + radius) / w) + 1;
    let iMinY = Math.floor((localSpherePos.y - radius) / w) - 1;
    let iMaxY = Math.ceil((localSpherePos.y + radius) / w) + 1;

    // Bail out if we are out of the terrain
    if (iMaxX < 0 || iMaxY < 0 || iMinX > data.length || iMinY > data[0].length) {
      return;
    }

    // Clamp index to edges
    if (iMinX < 0) {
      iMinX = 0;
    }
    if (iMaxX < 0) {
      iMaxX = 0;
    }
    if (iMinY < 0) {
      iMinY = 0;
    }
    if (iMaxY < 0) {
      iMaxY = 0;
    }
    if (iMinX >= data.length) {
      iMinX = data.length - 1;
    }
    if (iMaxX >= data.length) {
      iMaxX = data.length - 1;
    }
    if (iMaxY >= data[0].length) {
      iMaxY = data[0].length - 1;
    }
    if (iMinY >= data[0].length) {
      iMinY = data[0].length - 1;
    }
    const minMax = [];
    hfShape.getRectMinMax(iMinX, iMinY, iMaxX, iMaxY, minMax);
    const min = minMax[0];
    const max = minMax[1];

    // Bail out if we can't touch the bounding height box
    if (localSpherePos.z - radius > max || localSpherePos.z + radius < min) {
      return;
    }
    const result = this.result;
    for (let i = iMinX; i < iMaxX; i++) {
      for (let j = iMinY; j < iMaxY; j++) {
        const numContactsBefore = result.length;
        let intersecting = false;

        // Lower triangle
        hfShape.getConvexTrianglePillar(i, j, false);
        Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
        if (spherePos.distanceTo(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + sphereShape.boundingSphereRadius) {
          intersecting = this.sphereConvex(sphereShape, hfShape.pillarConvex, spherePos, worldPillarOffset, sphereQuat, hfQuat, sphereBody, hfBody, sphereShape, hfShape, justTest);
        }
        if (justTest && intersecting) {
          return true;
        }

        // Upper triangle
        hfShape.getConvexTrianglePillar(i, j, true);
        Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
        if (spherePos.distanceTo(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + sphereShape.boundingSphereRadius) {
          intersecting = this.sphereConvex(sphereShape, hfShape.pillarConvex, spherePos, worldPillarOffset, sphereQuat, hfQuat, sphereBody, hfBody, sphereShape, hfShape, justTest);
        }
        if (justTest && intersecting) {
          return true;
        }
        const numContacts = result.length - numContactsBefore;
        if (numContacts > 2) {
          return;
        }
        /*
          // Skip all but 1
          for (let k = 0; k < numContacts - 1; k++) {
              result.pop();
          }
        */
      }
    }
  }
  boxHeightfield(si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
    si.convexPolyhedronRepresentation.material = si.material;
    si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
    return this.convexHeightfield(si.convexPolyhedronRepresentation, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
  }
  convexHeightfield(convexShape, hfShape, convexPos, hfPos, convexQuat, hfQuat, convexBody, hfBody, rsi, rsj, justTest) {
    const data = hfShape.data;
    const w = hfShape.elementSize;
    const radius = convexShape.boundingSphereRadius;
    const worldPillarOffset = convexHeightfield_tmp2;
    const faceList = convexHeightfield_faceList;

    // Get sphere position to heightfield local!
    const localConvexPos = convexHeightfield_tmp1;
    Transform.pointToLocalFrame(hfPos, hfQuat, convexPos, localConvexPos);

    // Get the index of the data points to test against
    let iMinX = Math.floor((localConvexPos.x - radius) / w) - 1;
    let iMaxX = Math.ceil((localConvexPos.x + radius) / w) + 1;
    let iMinY = Math.floor((localConvexPos.y - radius) / w) - 1;
    let iMaxY = Math.ceil((localConvexPos.y + radius) / w) + 1;

    // Bail out if we are out of the terrain
    if (iMaxX < 0 || iMaxY < 0 || iMinX > data.length || iMinY > data[0].length) {
      return;
    }

    // Clamp index to edges
    if (iMinX < 0) {
      iMinX = 0;
    }
    if (iMaxX < 0) {
      iMaxX = 0;
    }
    if (iMinY < 0) {
      iMinY = 0;
    }
    if (iMaxY < 0) {
      iMaxY = 0;
    }
    if (iMinX >= data.length) {
      iMinX = data.length - 1;
    }
    if (iMaxX >= data.length) {
      iMaxX = data.length - 1;
    }
    if (iMaxY >= data[0].length) {
      iMaxY = data[0].length - 1;
    }
    if (iMinY >= data[0].length) {
      iMinY = data[0].length - 1;
    }
    const minMax = [];
    hfShape.getRectMinMax(iMinX, iMinY, iMaxX, iMaxY, minMax);
    const min = minMax[0];
    const max = minMax[1];

    // Bail out if we're cant touch the bounding height box
    if (localConvexPos.z - radius > max || localConvexPos.z + radius < min) {
      return;
    }
    for (let i = iMinX; i < iMaxX; i++) {
      for (let j = iMinY; j < iMaxY; j++) {
        let intersecting = false;

        // Lower triangle
        hfShape.getConvexTrianglePillar(i, j, false);
        Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
        if (convexPos.distanceTo(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + convexShape.boundingSphereRadius) {
          intersecting = this.convexConvex(convexShape, hfShape.pillarConvex, convexPos, worldPillarOffset, convexQuat, hfQuat, convexBody, hfBody, null, null, justTest, faceList, null);
        }
        if (justTest && intersecting) {
          return true;
        }

        // Upper triangle
        hfShape.getConvexTrianglePillar(i, j, true);
        Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
        if (convexPos.distanceTo(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + convexShape.boundingSphereRadius) {
          intersecting = this.convexConvex(convexShape, hfShape.pillarConvex, convexPos, worldPillarOffset, convexQuat, hfQuat, convexBody, hfBody, null, null, justTest, faceList, null);
        }
        if (justTest && intersecting) {
          return true;
        }
      }
    }
  }
  sphereParticle(sj, si, xj, xi, qj, qi, bj, bi, rsi, rsj, justTest) {
    // The normal is the unit vector from sphere center to particle center
    const normal = particleSphere_normal;
    normal.set(0, 0, 1);
    xi.vsub(xj, normal);
    const lengthSquared = normal.lengthSquared();
    if (lengthSquared <= sj.radius * sj.radius) {
      if (justTest) {
        return true;
      }
      const r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
      normal.normalize();
      r.rj.copy(normal);
      r.rj.scale(sj.radius, r.rj);
      r.ni.copy(normal); // Contact normal
      r.ni.negate(r.ni);
      r.ri.set(0, 0, 0); // Center of particle
      this.result.push(r);
      this.createFrictionEquationsFromContact(r, this.frictionResult);
    }
  }
  planeParticle(sj, si, xj, xi, qj, qi, bj, bi, rsi, rsj, justTest) {
    const normal = particlePlane_normal;
    normal.set(0, 0, 1);
    bj.quaternion.vmult(normal, normal); // Turn normal according to plane orientation
    const relpos = particlePlane_relpos;
    xi.vsub(bj.position, relpos);
    const dot = normal.dot(relpos);
    if (dot <= 0.0) {
      if (justTest) {
        return true;
      }
      const r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
      r.ni.copy(normal); // Contact normal is the plane normal
      r.ni.negate(r.ni);
      r.ri.set(0, 0, 0); // Center of particle

      // Get particle position projected on plane
      const projected = particlePlane_projected;
      normal.scale(normal.dot(xi), projected);
      xi.vsub(projected, projected);
      //projected.vadd(bj.position,projected);

      // rj is now the projected world position minus plane position
      r.rj.copy(projected);
      this.result.push(r);
      this.createFrictionEquationsFromContact(r, this.frictionResult);
    }
  }
  boxParticle(si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
    si.convexPolyhedronRepresentation.material = si.material;
    si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
    return this.convexParticle(si.convexPolyhedronRepresentation, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
  }
  convexParticle(sj, si, xj, xi, qj, qi, bj, bi, rsi, rsj, justTest) {
    let penetratedFaceIndex = -1;
    const penetratedFaceNormal = convexParticle_penetratedFaceNormal;
    const worldPenetrationVec = convexParticle_worldPenetrationVec;
    let minPenetration = null;

    // Convert particle position xi to local coords in the convex
    const local = convexParticle_local;
    local.copy(xi);
    local.vsub(xj, local); // Convert position to relative the convex origin
    qj.conjugate(cqj);
    cqj.vmult(local, local);
    if (sj.pointIsInside(local)) {
      if (sj.worldVerticesNeedsUpdate) {
        sj.computeWorldVertices(xj, qj);
      }
      if (sj.worldFaceNormalsNeedsUpdate) {
        sj.computeWorldFaceNormals(qj);
      }

      // For each world polygon in the polyhedra
      for (let i = 0, nfaces = sj.faces.length; i !== nfaces; i++) {
        // Construct world face vertices
        const verts = [sj.worldVertices[sj.faces[i][0]]];
        const normal = sj.worldFaceNormals[i];

        // Check how much the particle penetrates the polygon plane.
        xi.vsub(verts[0], convexParticle_vertexToParticle);
        const penetration = -normal.dot(convexParticle_vertexToParticle);
        if (minPenetration === null || Math.abs(penetration) < Math.abs(minPenetration)) {
          if (justTest) {
            return true;
          }
          minPenetration = penetration;
          penetratedFaceIndex = i;
          penetratedFaceNormal.copy(normal);
        }
      }
      if (penetratedFaceIndex !== -1) {
        // Setup contact
        const r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
        penetratedFaceNormal.scale(minPenetration, worldPenetrationVec);

        // rj is the particle position projected to the face
        worldPenetrationVec.vadd(xi, worldPenetrationVec);
        worldPenetrationVec.vsub(xj, worldPenetrationVec);
        r.rj.copy(worldPenetrationVec);
        //const projectedToFace = xi.vsub(xj).vadd(worldPenetrationVec);
        //projectedToFace.copy(r.rj);

        //qj.vmult(r.rj,r.rj);
        penetratedFaceNormal.negate(r.ni); // Contact normal
        r.ri.set(0, 0, 0); // Center of particle

        const ri = r.ri;
        const rj = r.rj;

        // Make relative to bodies
        ri.vadd(xi, ri);
        ri.vsub(bi.position, ri);
        rj.vadd(xj, rj);
        rj.vsub(bj.position, rj);
        this.result.push(r);
        this.createFrictionEquationsFromContact(r, this.frictionResult);
      } else {
        console.warn('Point found inside convex, but did not find penetrating face!');
      }
    }
  }
  heightfieldCylinder(hfShape, convexShape, hfPos, convexPos, hfQuat, convexQuat, hfBody, convexBody, rsi, rsj, justTest) {
    return this.convexHeightfield(convexShape, hfShape, convexPos, hfPos, convexQuat, hfQuat, convexBody, hfBody, rsi, rsj, justTest);
  }
  particleCylinder(si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
    return this.convexParticle(sj, si, xj, xi, qj, qi, bj, bi, rsi, rsj, justTest);
  }
  sphereTrimesh(sphereShape, trimeshShape, spherePos, trimeshPos, sphereQuat, trimeshQuat, sphereBody, trimeshBody, rsi, rsj, justTest) {
    const edgeVertexA = sphereTrimesh_edgeVertexA;
    const edgeVertexB = sphereTrimesh_edgeVertexB;
    const edgeVector = sphereTrimesh_edgeVector;
    const edgeVectorUnit = sphereTrimesh_edgeVectorUnit;
    const localSpherePos = sphereTrimesh_localSpherePos;
    const tmp = sphereTrimesh_tmp;
    const localSphereAABB = sphereTrimesh_localSphereAABB;
    const v2 = sphereTrimesh_v2;
    const relpos = sphereTrimesh_relpos;
    const triangles = sphereTrimesh_triangles;

    // Convert sphere position to local in the trimesh
    Transform.pointToLocalFrame(trimeshPos, trimeshQuat, spherePos, localSpherePos);

    // Get the aabb of the sphere locally in the trimesh
    const sphereRadius = sphereShape.radius;
    localSphereAABB.lowerBound.set(localSpherePos.x - sphereRadius, localSpherePos.y - sphereRadius, localSpherePos.z - sphereRadius);
    localSphereAABB.upperBound.set(localSpherePos.x + sphereRadius, localSpherePos.y + sphereRadius, localSpherePos.z + sphereRadius);
    trimeshShape.getTrianglesInAABB(localSphereAABB, triangles);
    //for (let i = 0; i < trimeshShape.indices.length / 3; i++) triangles.push(i); // All

    // Vertices
    const v = sphereTrimesh_v;
    const radiusSquared = sphereShape.radius * sphereShape.radius;
    for (let i = 0; i < triangles.length; i++) {
      for (let j = 0; j < 3; j++) {
        trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + j], v);

        // Check vertex overlap in sphere
        v.vsub(localSpherePos, relpos);
        if (relpos.lengthSquared() <= radiusSquared) {
          // Safe up
          v2.copy(v);
          Transform.pointToWorldFrame(trimeshPos, trimeshQuat, v2, v);
          v.vsub(spherePos, relpos);
          if (justTest) {
            return true;
          }
          let r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape, rsi, rsj);
          r.ni.copy(relpos);
          r.ni.normalize();

          // ri is the vector from sphere center to the sphere surface
          r.ri.copy(r.ni);
          r.ri.scale(sphereShape.radius, r.ri);
          r.ri.vadd(spherePos, r.ri);
          r.ri.vsub(sphereBody.position, r.ri);
          r.rj.copy(v);
          r.rj.vsub(trimeshBody.position, r.rj);

          // Store result
          this.result.push(r);
          this.createFrictionEquationsFromContact(r, this.frictionResult);
        }
      }
    }

    // Check all edges
    for (let i = 0; i < triangles.length; i++) {
      for (let j = 0; j < 3; j++) {
        trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + j], edgeVertexA);
        trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + (j + 1) % 3], edgeVertexB);
        edgeVertexB.vsub(edgeVertexA, edgeVector);

        // Project sphere position to the edge
        localSpherePos.vsub(edgeVertexB, tmp);
        const positionAlongEdgeB = tmp.dot(edgeVector);
        localSpherePos.vsub(edgeVertexA, tmp);
        let positionAlongEdgeA = tmp.dot(edgeVector);
        if (positionAlongEdgeA > 0 && positionAlongEdgeB < 0) {
          // Now check the orthogonal distance from edge to sphere center
          localSpherePos.vsub(edgeVertexA, tmp);
          edgeVectorUnit.copy(edgeVector);
          edgeVectorUnit.normalize();
          positionAlongEdgeA = tmp.dot(edgeVectorUnit);
          edgeVectorUnit.scale(positionAlongEdgeA, tmp);
          tmp.vadd(edgeVertexA, tmp);

          // tmp is now the sphere center position projected to the edge, defined locally in the trimesh frame
          const dist = tmp.distanceTo(localSpherePos);
          if (dist < sphereShape.radius) {
            if (justTest) {
              return true;
            }
            const r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape, rsi, rsj);
            tmp.vsub(localSpherePos, r.ni);
            r.ni.normalize();
            r.ni.scale(sphereShape.radius, r.ri);
            r.ri.vadd(spherePos, r.ri);
            r.ri.vsub(sphereBody.position, r.ri);
            Transform.pointToWorldFrame(trimeshPos, trimeshQuat, tmp, tmp);
            tmp.vsub(trimeshBody.position, r.rj);
            Transform.vectorToWorldFrame(trimeshQuat, r.ni, r.ni);
            Transform.vectorToWorldFrame(trimeshQuat, r.ri, r.ri);
            this.result.push(r);
            this.createFrictionEquationsFromContact(r, this.frictionResult);
          }
        }
      }
    }

    // Triangle faces
    const va = sphereTrimesh_va;
    const vb = sphereTrimesh_vb;
    const vc = sphereTrimesh_vc;
    const normal = sphereTrimesh_normal;
    for (let i = 0, N = triangles.length; i !== N; i++) {
      trimeshShape.getTriangleVertices(triangles[i], va, vb, vc);
      trimeshShape.getNormal(triangles[i], normal);
      localSpherePos.vsub(va, tmp);
      let dist = tmp.dot(normal);
      normal.scale(dist, tmp);
      localSpherePos.vsub(tmp, tmp);

      // tmp is now the sphere position projected to the triangle plane
      dist = tmp.distanceTo(localSpherePos);
      if (Ray.pointInTriangle(tmp, va, vb, vc) && dist < sphereShape.radius) {
        if (justTest) {
          return true;
        }
        let r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape, rsi, rsj);
        tmp.vsub(localSpherePos, r.ni);
        r.ni.normalize();
        r.ni.scale(sphereShape.radius, r.ri);
        r.ri.vadd(spherePos, r.ri);
        r.ri.vsub(sphereBody.position, r.ri);
        Transform.pointToWorldFrame(trimeshPos, trimeshQuat, tmp, tmp);
        tmp.vsub(trimeshBody.position, r.rj);
        Transform.vectorToWorldFrame(trimeshQuat, r.ni, r.ni);
        Transform.vectorToWorldFrame(trimeshQuat, r.ri, r.ri);
        this.result.push(r);
        this.createFrictionEquationsFromContact(r, this.frictionResult);
      }
    }
    triangles.length = 0;
  }
  planeTrimesh(planeShape, trimeshShape, planePos, trimeshPos, planeQuat, trimeshQuat, planeBody, trimeshBody, rsi, rsj, justTest) {
    // Make contacts!
    const v = new Vec3();
    const normal = planeTrimesh_normal;
    normal.set(0, 0, 1);
    planeQuat.vmult(normal, normal); // Turn normal according to plane

    for (let i = 0; i < trimeshShape.vertices.length / 3; i++) {
      // Get world vertex from trimesh
      trimeshShape.getVertex(i, v);

      // Safe up
      const v2 = new Vec3();
      v2.copy(v);
      Transform.pointToWorldFrame(trimeshPos, trimeshQuat, v2, v);

      // Check plane side
      const relpos = planeTrimesh_relpos;
      v.vsub(planePos, relpos);
      const dot = normal.dot(relpos);
      if (dot <= 0.0) {
        if (justTest) {
          return true;
        }
        const r = this.createContactEquation(planeBody, trimeshBody, planeShape, trimeshShape, rsi, rsj);
        r.ni.copy(normal); // Contact normal is the plane normal

        // Get vertex position projected on plane
        const projected = planeTrimesh_projected;
        normal.scale(relpos.dot(normal), projected);
        v.vsub(projected, projected);

        // ri is the projected world position minus plane position
        r.ri.copy(projected);
        r.ri.vsub(planeBody.position, r.ri);
        r.rj.copy(v);
        r.rj.vsub(trimeshBody.position, r.rj);

        // Store result
        this.result.push(r);
        this.createFrictionEquationsFromContact(r, this.frictionResult);
      }
    }
  }

  // convexTrimesh(
  //   si: ConvexPolyhedron, sj: Trimesh, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion,
  //   bi: Body, bj: Body, rsi?: Shape | null, rsj?: Shape | null,
  //   faceListA?: number[] | null, faceListB?: number[] | null,
  // ) {
  //   const sepAxis = convexConvex_sepAxis;

  //   if(xi.distanceTo(xj) > si.boundingSphereRadius + sj.boundingSphereRadius){
  //       return;
  //   }

  //   // Construct a temp hull for each triangle
  //   const hullB = new ConvexPolyhedron();

  //   hullB.faces = [[0,1,2]];
  //   const va = new Vec3();
  //   const vb = new Vec3();
  //   const vc = new Vec3();
  //   hullB.vertices = [
  //       va,
  //       vb,
  //       vc
  //   ];

  //   for (let i = 0; i < sj.indices.length / 3; i++) {

  //       const triangleNormal = new Vec3();
  //       sj.getNormal(i, triangleNormal);
  //       hullB.faceNormals = [triangleNormal];

  //       sj.getTriangleVertices(i, va, vb, vc);

  //       let d = si.testSepAxis(triangleNormal, hullB, xi, qi, xj, qj);
  //       if(!d){
  //           triangleNormal.scale(-1, triangleNormal);
  //           d = si.testSepAxis(triangleNormal, hullB, xi, qi, xj, qj);

  //           if(!d){
  //               continue;
  //           }
  //       }

  //       const res: ConvexPolyhedronContactPoint[] = [];
  //       const q = convexConvex_q;
  //       si.clipAgainstHull(xi,qi,hullB,xj,qj,triangleNormal,-100,100,res);
  //       for(let j = 0; j !== res.length; j++){
  //           const r = this.createContactEquation(bi,bj,si,sj,rsi,rsj),
  //               ri = r.ri,
  //               rj = r.rj;
  //           r.ni.copy(triangleNormal);
  //           r.ni.negate(r.ni);
  //           res[j].normal.negate(q);
  //           q.mult(res[j].depth, q);
  //           res[j].point.vadd(q, ri);
  //           rj.copy(res[j].point);

  //           // Contact points are in world coordinates. Transform back to relative
  //           ri.vsub(xi,ri);
  //           rj.vsub(xj,rj);

  //           // Make relative to bodies
  //           ri.vadd(xi, ri);
  //           ri.vsub(bi.position, ri);
  //           rj.vadd(xj, rj);
  //           rj.vsub(bj.position, rj);

  //           result.push(r);
  //       }
  //   }
  // }
}
const averageNormal = new Vec3();
const averageContactPointA = new Vec3();
const averageContactPointB = new Vec3();
const tmpVec1 = new Vec3();
const tmpVec2 = new Vec3();
const tmpQuat1 = new Quaternion$1();
const tmpQuat2 = new Quaternion$1();
const planeTrimesh_normal = new Vec3();
const planeTrimesh_relpos = new Vec3();
const planeTrimesh_projected = new Vec3();
const sphereTrimesh_normal = new Vec3();
const sphereTrimesh_relpos = new Vec3();
new Vec3();
const sphereTrimesh_v = new Vec3();
const sphereTrimesh_v2 = new Vec3();
const sphereTrimesh_edgeVertexA = new Vec3();
const sphereTrimesh_edgeVertexB = new Vec3();
const sphereTrimesh_edgeVector = new Vec3();
const sphereTrimesh_edgeVectorUnit = new Vec3();
const sphereTrimesh_localSpherePos = new Vec3();
const sphereTrimesh_tmp = new Vec3();
const sphereTrimesh_va = new Vec3();
const sphereTrimesh_vb = new Vec3();
const sphereTrimesh_vc = new Vec3();
const sphereTrimesh_localSphereAABB = new AABB();
const sphereTrimesh_triangles = [];
const point_on_plane_to_sphere = new Vec3();
const plane_to_sphere_ortho = new Vec3();

// See http://bulletphysics.com/Bullet/BulletFull/SphereTriangleDetector_8cpp_source.html
const pointInPolygon_edge = new Vec3();
const pointInPolygon_edge_x_normal = new Vec3();
const pointInPolygon_vtp = new Vec3();
function pointInPolygon(verts, normal, p) {
  let positiveResult = null;
  const N = verts.length;
  for (let i = 0; i !== N; i++) {
    const v = verts[i];

    // Get edge to the next vertex
    const edge = pointInPolygon_edge;
    verts[(i + 1) % N].vsub(v, edge);

    // Get cross product between polygon normal and the edge
    const edge_x_normal = pointInPolygon_edge_x_normal;
    //const edge_x_normal = new Vec3();
    edge.cross(normal, edge_x_normal);

    // Get vector between point and current vertex
    const vertex_to_p = pointInPolygon_vtp;
    p.vsub(v, vertex_to_p);

    // This dot product determines which side of the edge the point is
    const r = edge_x_normal.dot(vertex_to_p);

    // If all such dot products have same sign, we are inside the polygon.
    if (positiveResult === null || r > 0 && positiveResult === true || r <= 0 && positiveResult === false) {
      if (positiveResult === null) {
        positiveResult = r > 0;
      }
      continue;
    } else {
      return false; // Encountered some other sign. Exit.
    }
  }

  // If we got here, all dot products were of the same sign.
  return true;
}
const box_to_sphere = new Vec3();
const sphereBox_ns = new Vec3();
const sphereBox_ns1 = new Vec3();
const sphereBox_ns2 = new Vec3();
const sphereBox_sides = [new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3()];
const sphereBox_sphere_to_corner = new Vec3();
const sphereBox_side_ns = new Vec3();
const sphereBox_side_ns1 = new Vec3();
const sphereBox_side_ns2 = new Vec3();
const convex_to_sphere = new Vec3();
const sphereConvex_edge = new Vec3();
const sphereConvex_edgeUnit = new Vec3();
const sphereConvex_sphereToCorner = new Vec3();
const sphereConvex_worldCorner = new Vec3();
const sphereConvex_worldNormal = new Vec3();
const sphereConvex_worldPoint = new Vec3();
const sphereConvex_worldSpherePointClosestToPlane = new Vec3();
const sphereConvex_penetrationVec = new Vec3();
const sphereConvex_sphereToWorldPoint = new Vec3();
new Vec3();
new Vec3();
const planeConvex_v = new Vec3();
const planeConvex_normal = new Vec3();
const planeConvex_relpos = new Vec3();
const planeConvex_projected = new Vec3();
const convexConvex_sepAxis = new Vec3();
const convexConvex_q = new Vec3();
const particlePlane_normal = new Vec3();
const particlePlane_relpos = new Vec3();
const particlePlane_projected = new Vec3();
const particleSphere_normal = new Vec3();

// WIP
const cqj = new Quaternion$1();
const convexParticle_local = new Vec3();
new Vec3();
const convexParticle_penetratedFaceNormal = new Vec3();
const convexParticle_vertexToParticle = new Vec3();
const convexParticle_worldPenetrationVec = new Vec3();
const convexHeightfield_tmp1 = new Vec3();
const convexHeightfield_tmp2 = new Vec3();
const convexHeightfield_faceList = [0];
const sphereHeightfield_tmp1 = new Vec3();
const sphereHeightfield_tmp2 = new Vec3();

class OverlapKeeper {
  /**
   * @todo Remove useless constructor
   */
  constructor() {
    this.current = [];
    this.previous = [];
  }

  /**
   * getKey
   */
  getKey(i, j) {
    if (j < i) {
      const temp = j;
      j = i;
      i = temp;
    }
    return i << 16 | j;
  }

  /**
   * set
   */
  set(i, j) {
    // Insertion sort. This way the diff will have linear complexity.
    const key = this.getKey(i, j);
    const current = this.current;
    let index = 0;
    while (key > current[index]) {
      index++;
    }
    if (key === current[index]) {
      return; // Pair was already added
    }
    for (let j = current.length - 1; j >= index; j--) {
      current[j + 1] = current[j];
    }
    current[index] = key;
  }

  /**
   * tick
   */
  tick() {
    const tmp = this.current;
    this.current = this.previous;
    this.previous = tmp;
    this.current.length = 0;
  }

  /**
   * getDiff
   */
  getDiff(additions, removals) {
    const a = this.current;
    const b = this.previous;
    const al = a.length;
    const bl = b.length;
    let j = 0;
    for (let i = 0; i < al; i++) {
      let found = false;
      const keyA = a[i];
      while (keyA > b[j]) {
        j++;
      }
      found = keyA === b[j];
      if (!found) {
        unpackAndPush(additions, keyA);
      }
    }
    j = 0;
    for (let i = 0; i < bl; i++) {
      let found = false;
      const keyB = b[i];
      while (keyB > a[j]) {
        j++;
      }
      found = a[j] === keyB;
      if (!found) {
        unpackAndPush(removals, keyB);
      }
    }
  }
}
function unpackAndPush(array, key) {
  array.push((key & 0xffff0000) >> 16, key & 0x0000ffff);
}

const getKey = (i, j) => i < j ? `${i}-${j}` : `${j}-${i}`;

/**
 * TupleDictionary
 */
class TupleDictionary {
  data = {
    keys: []
  };

  /** get */
  get(i, j) {
    const key = getKey(i, j);
    return this.data[key];
  }

  /** set */
  set(i, j, value) {
    const key = getKey(i, j);

    // Check if key already exists
    if (!this.get(i, j)) {
      this.data.keys.push(key);
    }
    this.data[key] = value;
  }

  /** delete */
  delete(i, j) {
    const key = getKey(i, j);
    const index = this.data.keys.indexOf(key);
    if (index !== -1) {
      this.data.keys.splice(index, 1);
    }
    delete this.data[key];
  }

  /** reset */
  reset() {
    const data = this.data;
    const keys = data.keys;
    while (keys.length > 0) {
      const key = keys.pop();
      delete data[key];
    }
  }
}

/**
 * The physics world
 */
class World extends EventTarget {
  /**
   * Currently / last used timestep. Is set to -1 if not available. This value is updated before each internal step, which means that it is "fresh" inside event callbacks.
   */

  /**
   * Makes bodies go to sleep when they've been inactive.
   * @default false
   */

  /**
   * All the current contacts (instances of ContactEquation) in the world.
   */

  /**
   * How often to normalize quaternions. Set to 0 for every step, 1 for every second etc.. A larger value increases performance. If bodies tend to explode, set to a smaller value (zero to be sure nothing can go wrong).
   * @default 0
   */

  /**
   * Set to true to use fast quaternion normalization. It is often enough accurate to use.
   * If bodies tend to explode, set to false.
   * @default false
   */

  /**
   * The wall-clock time since simulation start.
   */

  /**
   * Time that has passed in the simulation.
   */

  /**
   * Number of timesteps taken since start.
   */

  /**
   * Default and last timestep sizes.
   */

  /**
   * The gravity of the world.
   */

  /**
   * Gravity to use when approximating the friction max force (mu \* mass \* gravity).
   * If undefined, global gravity will be used.
   * Use to enable friction in a World with a null gravity vector (no gravity).
   */

  /**
   * The broadphase algorithm to use.
   * @default NaiveBroadphase
   */

  /**
   * All bodies in this world
   */

  /**
   * True if any bodies are not sleeping, false if every body is sleeping.
   */

  /**
   * The solver algorithm to use.
   * @default GSSolver
   */

  /**
   * collisionMatrix
   */

  /**
   * CollisionMatrix from the previous step.
   */

  /**
   * All added contactmaterials.
   */

  /**
   * Used to look up a ContactMaterial given two instances of Material.
   */

  /**
   * The default material of the bodies.
   */

  /**
   * This contact material is used if no suitable contactmaterial is found for a contact.
   */

  /**
   * Dispatched after a body has been added to the world.
   */

  /**
   * Dispatched after a body has been removed from the world.
   */

  constructor(options) {
    if (options === void 0) {
      options = {};
    }
    super();
    this.dt = -1;
    this.allowSleep = !!options.allowSleep;
    this.contacts = [];
    this.frictionEquations = [];
    this.quatNormalizeSkip = options.quatNormalizeSkip !== undefined ? options.quatNormalizeSkip : 0;
    this.quatNormalizeFast = options.quatNormalizeFast !== undefined ? options.quatNormalizeFast : false;
    this.time = 0.0;
    this.simulationTime = 0.0;
    this.stepnumber = 0;
    this.default_dt = 1 / 60;
    this.nextId = 0;
    this.gravity = new Vec3();
    if (options.gravity) {
      this.gravity.copy(options.gravity);
    }
    if (options.frictionGravity) {
      this.frictionGravity = new Vec3();
      this.frictionGravity.copy(options.frictionGravity);
    }
    this.broadphase = options.broadphase !== undefined ? options.broadphase : new NaiveBroadphase();
    this.bodies = [];
    this.hasActiveBodies = false;
    this.solver = options.solver !== undefined ? options.solver : new GSSolver();
    this.constraints = [];
    this.narrowphase = new Narrowphase(this);
    this.collisionMatrix = new ArrayCollisionMatrix();
    this.collisionMatrixPrevious = new ArrayCollisionMatrix();
    this.bodyOverlapKeeper = new OverlapKeeper();
    this.shapeOverlapKeeper = new OverlapKeeper();
    this.contactmaterials = [];
    this.contactMaterialTable = new TupleDictionary();
    this.defaultMaterial = new Material('default');
    this.defaultContactMaterial = new ContactMaterial(this.defaultMaterial, this.defaultMaterial, {
      friction: 0.3,
      restitution: 0.0
    });
    this.doProfiling = false;
    this.profile = {
      solve: 0,
      makeContactConstraints: 0,
      broadphase: 0,
      integrate: 0,
      narrowphase: 0
    };
    this.subsystems = [];
    this.addBodyEvent = {
      type: 'addBody',
      body: null
    };
    this.removeBodyEvent = {
      type: 'removeBody',
      body: null
    };
    this.idToBodyMap = {};
    this.broadphase.setWorld(this);
  }

  /**
   * Get the contact material between materials m1 and m2
   * @return The contact material if it was found.
   */
  getContactMaterial(m1, m2) {
    return this.contactMaterialTable.get(m1.id, m2.id);
  }

  /**
   * Store old collision state info
   */
  collisionMatrixTick() {
    const temp = this.collisionMatrixPrevious;
    this.collisionMatrixPrevious = this.collisionMatrix;
    this.collisionMatrix = temp;
    this.collisionMatrix.reset();
    this.bodyOverlapKeeper.tick();
    this.shapeOverlapKeeper.tick();
  }

  /**
   * Add a constraint to the simulation.
   */
  addConstraint(c) {
    this.constraints.push(c);
  }

  /**
   * Removes a constraint
   */
  removeConstraint(c) {
    const idx = this.constraints.indexOf(c);
    if (idx !== -1) {
      this.constraints.splice(idx, 1);
    }
  }

  /**
   * Raycast test
   * @deprecated Use .raycastAll, .raycastClosest or .raycastAny instead.
   */
  rayTest(from, to, result) {
    if (result instanceof RaycastResult) {
      // Do raycastClosest
      this.raycastClosest(from, to, {
        skipBackfaces: true
      }, result);
    } else {
      // Do raycastAll
      this.raycastAll(from, to, {
        skipBackfaces: true
      }, result);
    }
  }

  /**
   * Ray cast against all bodies. The provided callback will be executed for each hit with a RaycastResult as single argument.
   * @return True if any body was hit.
   */
  raycastAll(from, to, options, callback) {
    if (options === void 0) {
      options = {};
    }
    options.mode = Ray.ALL;
    options.from = from;
    options.to = to;
    options.callback = callback;
    return tmpRay.intersectWorld(this, options);
  }

  /**
   * Ray cast, and stop at the first result. Note that the order is random - but the method is fast.
   * @return True if any body was hit.
   */
  raycastAny(from, to, options, result) {
    if (options === void 0) {
      options = {};
    }
    options.mode = Ray.ANY;
    options.from = from;
    options.to = to;
    options.result = result;
    return tmpRay.intersectWorld(this, options);
  }

  /**
   * Ray cast, and return information of the closest hit.
   * @return True if any body was hit.
   */
  raycastClosest(from, to, options, result) {
    if (options === void 0) {
      options = {};
    }
    options.mode = Ray.CLOSEST;
    options.from = from;
    options.to = to;
    options.result = result;
    return tmpRay.intersectWorld(this, options);
  }

  /**
   * Add a rigid body to the simulation.
   * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
   * @todo Adding an array of bodies should be possible. This would save some loops too
   */
  addBody(body) {
    if (this.bodies.includes(body)) {
      return;
    }
    body.index = this.bodies.length;
    this.bodies.push(body);
    body.world = this;
    body.initPosition.copy(body.position);
    body.initVelocity.copy(body.velocity);
    body.timeLastSleepy = this.simulationTime;
    if (body instanceof Body) {
      body.initAngularVelocity.copy(body.angularVelocity);
      body.initQuaternion.copy(body.quaternion);
    }
    this.collisionMatrix.setNumObjects(this.bodies.length);
    this.addBodyEvent.body = body;
    this.idToBodyMap[body.id] = body;
    this.dispatchEvent(this.addBodyEvent);
  }

  /**
   * Remove a rigid body from the simulation.
   */
  removeBody(body) {
    body.world = null;
    const n = this.bodies.length - 1;
    const bodies = this.bodies;
    const idx = bodies.indexOf(body);
    if (idx !== -1) {
      bodies.splice(idx, 1); // Todo: should use a garbage free method

      // Recompute index
      for (let i = 0; i !== bodies.length; i++) {
        bodies[i].index = i;
      }
      this.collisionMatrix.setNumObjects(n);
      this.removeBodyEvent.body = body;
      delete this.idToBodyMap[body.id];
      this.dispatchEvent(this.removeBodyEvent);
    }
  }
  getBodyById(id) {
    return this.idToBodyMap[id];
  }

  /**
   * @todo Make a faster map
   */
  getShapeById(id) {
    const bodies = this.bodies;
    for (let i = 0; i < bodies.length; i++) {
      const shapes = bodies[i].shapes;
      for (let j = 0; j < shapes.length; j++) {
        const shape = shapes[j];
        if (shape.id === id) {
          return shape;
        }
      }
    }
    return null;
  }

  /**
   * Adds a contact material to the World
   */
  addContactMaterial(cmat) {
    // Add contact material
    this.contactmaterials.push(cmat);

    // Add current contact material to the material table
    this.contactMaterialTable.set(cmat.materials[0].id, cmat.materials[1].id, cmat);
  }

  /**
   * Removes a contact material from the World.
   */
  removeContactMaterial(cmat) {
    const idx = this.contactmaterials.indexOf(cmat);
    if (idx === -1) {
      return;
    }
    this.contactmaterials.splice(idx, 1);
    this.contactMaterialTable.delete(cmat.materials[0].id, cmat.materials[1].id);
  }

  /**
   * Step the simulation forward keeping track of last called time
   * to be able to step the world at a fixed rate, independently of framerate.
   *
   * @param dt The fixed time step size to use (default: 1 / 60).
   * @param maxSubSteps Maximum number of fixed steps to take per function call (default: 10).
   * @see https://gafferongames.com/post/fix_your_timestep/
   * @example
   *     // Run the simulation independently of framerate every 1 / 60 ms
   *     world.fixedStep()
   */
  fixedStep(dt, maxSubSteps) {
    if (dt === void 0) {
      dt = 1 / 60;
    }
    if (maxSubSteps === void 0) {
      maxSubSteps = 10;
    }
    const time = performance.now() / 1000; // seconds
    if (!this.lastCallTime) {
      this.step(dt, undefined, maxSubSteps);
    } else {
      const timeSinceLastCalled = time - this.lastCallTime;
      this.step(dt, timeSinceLastCalled, maxSubSteps);
    }
    this.lastCallTime = time;
  }

  /**
   * Step the physics world forward in time.
   *
   * There are two modes. The simple mode is fixed timestepping without interpolation. In this case you only use the first argument. The second case uses interpolation. In that you also provide the time since the function was last used, as well as the maximum fixed timesteps to take.
   *
   * @param dt The fixed time step size to use.
   * @param timeSinceLastCalled The time elapsed since the function was last called.
   * @param maxSubSteps Maximum number of fixed steps to take per function call (default: 10).
   * @see https://web.archive.org/web/20180426154531/http://bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World#What_do_the_parameters_to_btDynamicsWorld::stepSimulation_mean.3F
   * @example
   *     // fixed timestepping without interpolation
   *     world.step(1 / 60)
   */
  step(dt, timeSinceLastCalled, maxSubSteps) {
    if (maxSubSteps === void 0) {
      maxSubSteps = 10;
    }
    if (timeSinceLastCalled === undefined) {
      // Fixed, simple stepping

      this.internalStep(dt);

      // Increment time
      this.time += dt;
      this.simulationTime += dt;
    } else {
      this.time += timeSinceLastCalled;
      const t0 = performance.now();
      let substeps = 0;
      while (this.time > this.simulationTime && substeps < maxSubSteps) {
        // Do fixed steps to catch up
        this.internalStep(dt);
        this.simulationTime += dt;
        substeps++;
        if (performance.now() - t0 > dt * 1000) {
          // The framerate is not interactive anymore.
          // We are below the target framerate.
          // Better bail out.
          break;
        }
      }
      if (this.time > this.simulationTime) {
        // We could not catch up to the wall-clock time,
        // so in order to keep the ball rolling (:D),
        // we need to artificially catch up.
        // To the user's eye, this will look like the simulation
        // is running slower than expected.
        const numberOfSteps = Math.ceil((this.time - this.simulationTime) / dt);
        this.simulationTime += numberOfSteps * dt;
      }
      const t = (this.time - this.simulationTime) / dt + 1;
      for (let j = 0; j !== this.bodies.length; j++) {
        const b = this.bodies[j];
        b.previousPosition.lerp(b.position, t, b.interpolatedPosition);
        b.previousQuaternion.slerp(b.quaternion, t, b.interpolatedQuaternion);
        b.previousQuaternion.normalize();
      }
    }
  }
  internalStep(dt) {
    this.dt = dt;
    const contacts = this.contacts;
    const p1 = World_step_p1;
    const p2 = World_step_p2;
    const N = this.bodies.length;
    const bodies = this.bodies;
    const solver = this.solver;
    const gravity = this.gravity;
    const doProfiling = this.doProfiling;
    const profile = this.profile;
    const DYNAMIC = Body.DYNAMIC;
    let profilingStart = -Infinity;
    const constraints = this.constraints;
    const frictionEquationPool = World_step_frictionEquationPool;
    gravity.length();
    const gx = gravity.x;
    const gy = gravity.y;
    const gz = gravity.z;
    let i = 0;
    if (doProfiling) {
      profilingStart = performance.now();
    }

    // Add gravity to all objects
    for (i = 0; i !== N; i++) {
      const bi = bodies[i];
      if (bi.type === DYNAMIC) {
        // Only for dynamic bodies
        const f = bi.force;
        const m = bi.mass;
        f.x += m * gx;
        f.y += m * gy;
        f.z += m * gz;
      }
    }

    // Update subsystems
    for (let i = 0, Nsubsystems = this.subsystems.length; i !== Nsubsystems; i++) {
      this.subsystems[i].update();
    }

    // Collision detection
    if (doProfiling) {
      profilingStart = performance.now();
    }
    p1.length = 0; // Clean up pair arrays from last step
    p2.length = 0;
    this.broadphase.collisionPairs(this, p1, p2);
    if (doProfiling) {
      profile.broadphase = performance.now() - profilingStart;
    }

    // Remove constrained pairs with collideConnected == false
    let Nconstraints = constraints.length;
    for (i = 0; i !== Nconstraints; i++) {
      const c = constraints[i];
      if (!c.collideConnected) {
        for (let j = p1.length - 1; j >= 0; j -= 1) {
          if (c.bodyA === p1[j] && c.bodyB === p2[j] || c.bodyB === p1[j] && c.bodyA === p2[j]) {
            p1.splice(j, 1);
            p2.splice(j, 1);
          }
        }
      }
    }
    this.collisionMatrixTick();

    // Generate contacts
    if (doProfiling) {
      profilingStart = performance.now();
    }
    const oldcontacts = World_step_oldContacts;
    const NoldContacts = contacts.length;
    for (i = 0; i !== NoldContacts; i++) {
      oldcontacts.push(contacts[i]);
    }
    contacts.length = 0;

    // Transfer FrictionEquation from current list to the pool for reuse
    const NoldFrictionEquations = this.frictionEquations.length;
    for (i = 0; i !== NoldFrictionEquations; i++) {
      frictionEquationPool.push(this.frictionEquations[i]);
    }
    this.frictionEquations.length = 0;
    this.narrowphase.getContacts(p1, p2, this, contacts, oldcontacts,
    // To be reused
    this.frictionEquations, frictionEquationPool);
    if (doProfiling) {
      profile.narrowphase = performance.now() - profilingStart;
    }

    // Loop over all collisions
    if (doProfiling) {
      profilingStart = performance.now();
    }

    // Add all friction eqs
    for (i = 0; i < this.frictionEquations.length; i++) {
      solver.addEquation(this.frictionEquations[i]);
    }
    const ncontacts = contacts.length;
    for (let k = 0; k !== ncontacts; k++) {
      // Current contact
      const c = contacts[k];

      // Get current collision indeces
      const bi = c.bi;
      const bj = c.bj;
      const si = c.si;
      const sj = c.sj;

      // Get collision properties
      let cm;
      if (bi.material && bj.material) {
        cm = this.getContactMaterial(bi.material, bj.material) || this.defaultContactMaterial;
      } else {
        cm = this.defaultContactMaterial;
      }

      // c.enabled = bi.collisionResponse && bj.collisionResponse && si.collisionResponse && sj.collisionResponse;

      cm.friction;
      // c.restitution = cm.restitution;

      // If friction or restitution were specified in the material, use them
      if (bi.material && bj.material) {
        if (bi.material.friction >= 0 && bj.material.friction >= 0) {
          bi.material.friction * bj.material.friction;
        }
        if (bi.material.restitution >= 0 && bj.material.restitution >= 0) {
          c.restitution = bi.material.restitution * bj.material.restitution;
        }
      }

      // c.setSpookParams(
      //           cm.contactEquationStiffness,
      //           cm.contactEquationRelaxation,
      //           dt
      //       );

      solver.addEquation(c);

      // // Add friction constraint equation
      // if(mu > 0){

      // 	// Create 2 tangent equations
      // 	const mug = mu * gnorm;
      // 	const reducedMass = (bi.invMass + bj.invMass);
      // 	if(reducedMass > 0){
      // 		reducedMass = 1/reducedMass;
      // 	}
      // 	const pool = frictionEquationPool;
      // 	const c1 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
      // 	const c2 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
      // 	this.frictionEquations.push(c1, c2);

      // 	c1.bi = c2.bi = bi;
      // 	c1.bj = c2.bj = bj;
      // 	c1.minForce = c2.minForce = -mug*reducedMass;
      // 	c1.maxForce = c2.maxForce = mug*reducedMass;

      // 	// Copy over the relative vectors
      // 	c1.ri.copy(c.ri);
      // 	c1.rj.copy(c.rj);
      // 	c2.ri.copy(c.ri);
      // 	c2.rj.copy(c.rj);

      // 	// Construct tangents
      // 	c.ni.tangents(c1.t, c2.t);

      //           // Set spook params
      //           c1.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, dt);
      //           c2.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, dt);

      //           c1.enabled = c2.enabled = c.enabled;

      // 	// Add equations to solver
      // 	solver.addEquation(c1);
      // 	solver.addEquation(c2);
      // }

      if (bi.allowSleep && bi.type === Body.DYNAMIC && bi.sleepState === Body.SLEEPING && bj.sleepState === Body.AWAKE && bj.type !== Body.STATIC) {
        const speedSquaredB = bj.velocity.lengthSquared() + bj.angularVelocity.lengthSquared();
        const speedLimitSquaredB = bj.sleepSpeedLimit ** 2;
        if (speedSquaredB >= speedLimitSquaredB * 2) {
          bi.wakeUpAfterNarrowphase = true;
        }
      }
      if (bj.allowSleep && bj.type === Body.DYNAMIC && bj.sleepState === Body.SLEEPING && bi.sleepState === Body.AWAKE && bi.type !== Body.STATIC) {
        const speedSquaredA = bi.velocity.lengthSquared() + bi.angularVelocity.lengthSquared();
        const speedLimitSquaredA = bi.sleepSpeedLimit ** 2;
        if (speedSquaredA >= speedLimitSquaredA * 2) {
          bj.wakeUpAfterNarrowphase = true;
        }
      }

      // Now we know that i and j are in contact. Set collision matrix state
      this.collisionMatrix.set(bi, bj, true);
      if (!this.collisionMatrixPrevious.get(bi, bj)) {
        // First contact!
        // We reuse the collideEvent object, otherwise we will end up creating new objects for each new contact, even if there's no event listener attached.
        World_step_collideEvent.body = bj;
        World_step_collideEvent.contact = c;
        bi.dispatchEvent(World_step_collideEvent);
        World_step_collideEvent.body = bi;
        bj.dispatchEvent(World_step_collideEvent);
      }
      this.bodyOverlapKeeper.set(bi.id, bj.id);
      this.shapeOverlapKeeper.set(si.id, sj.id);
    }
    this.emitContactEvents();
    if (doProfiling) {
      profile.makeContactConstraints = performance.now() - profilingStart;
      profilingStart = performance.now();
    }

    // Wake up bodies
    for (i = 0; i !== N; i++) {
      const bi = bodies[i];
      if (bi.wakeUpAfterNarrowphase) {
        bi.wakeUp();
        bi.wakeUpAfterNarrowphase = false;
      }
    }

    // Add user-added constraints
    Nconstraints = constraints.length;
    for (i = 0; i !== Nconstraints; i++) {
      const c = constraints[i];
      c.update();
      for (let j = 0, Neq = c.equations.length; j !== Neq; j++) {
        const eq = c.equations[j];
        solver.addEquation(eq);
      }
    }

    // Solve the constrained system
    solver.solve(dt, this);
    if (doProfiling) {
      profile.solve = performance.now() - profilingStart;
    }

    // Remove all contacts from solver
    solver.removeAllEquations();

    // Apply damping, see http://code.google.com/p/bullet/issues/detail?id=74 for details
    const pow = Math.pow;
    for (i = 0; i !== N; i++) {
      const bi = bodies[i];
      if (bi.type & DYNAMIC) {
        // Only for dynamic bodies
        const ld = pow(1.0 - bi.linearDamping, dt);
        const v = bi.velocity;
        v.scale(ld, v);
        const av = bi.angularVelocity;
        if (av) {
          const ad = pow(1.0 - bi.angularDamping, dt);
          av.scale(ad, av);
        }
      }
    }
    this.dispatchEvent(World_step_preStepEvent);

    // Leap frog
    // vnew = v + h*f/m
    // xnew = x + h*vnew
    if (doProfiling) {
      profilingStart = performance.now();
    }
    const stepnumber = this.stepnumber;
    const quatNormalize = stepnumber % (this.quatNormalizeSkip + 1) === 0;
    const quatNormalizeFast = this.quatNormalizeFast;
    for (i = 0; i !== N; i++) {
      bodies[i].integrate(dt, quatNormalize, quatNormalizeFast);
    }
    this.clearForces();
    this.broadphase.dirty = true;
    if (doProfiling) {
      profile.integrate = performance.now() - profilingStart;
    }

    // Update step number
    this.stepnumber += 1;
    this.dispatchEvent(World_step_postStepEvent);

    // Sleeping update
    let hasActiveBodies = true;
    if (this.allowSleep) {
      hasActiveBodies = false;
      for (i = 0; i !== N; i++) {
        const bi = bodies[i];
        bi.sleepTick(this.simulationTime);
        if (bi.sleepState !== Body.SLEEPING) {
          hasActiveBodies = true;
        }
      }
    }
    this.hasActiveBodies = hasActiveBodies;
  }
  emitContactEvents() {
    const hasBeginContact = this.hasAnyEventListener('beginContact');
    const hasEndContact = this.hasAnyEventListener('endContact');
    if (hasBeginContact || hasEndContact) {
      this.bodyOverlapKeeper.getDiff(additions, removals);
    }
    if (hasBeginContact) {
      for (let i = 0, l = additions.length; i < l; i += 2) {
        beginContactEvent.bodyA = this.getBodyById(additions[i]);
        beginContactEvent.bodyB = this.getBodyById(additions[i + 1]);
        this.dispatchEvent(beginContactEvent);
      }
      beginContactEvent.bodyA = beginContactEvent.bodyB = null;
    }
    if (hasEndContact) {
      for (let i = 0, l = removals.length; i < l; i += 2) {
        endContactEvent.bodyA = this.getBodyById(removals[i]);
        endContactEvent.bodyB = this.getBodyById(removals[i + 1]);
        this.dispatchEvent(endContactEvent);
      }
      endContactEvent.bodyA = endContactEvent.bodyB = null;
    }
    additions.length = removals.length = 0;
    const hasBeginShapeContact = this.hasAnyEventListener('beginShapeContact');
    const hasEndShapeContact = this.hasAnyEventListener('endShapeContact');
    if (hasBeginShapeContact || hasEndShapeContact) {
      this.shapeOverlapKeeper.getDiff(additions, removals);
    }
    if (hasBeginShapeContact) {
      for (let i = 0, l = additions.length; i < l; i += 2) {
        const shapeA = this.getShapeById(additions[i]);
        const shapeB = this.getShapeById(additions[i + 1]);
        beginShapeContactEvent.shapeA = shapeA;
        beginShapeContactEvent.shapeB = shapeB;
        if (shapeA) beginShapeContactEvent.bodyA = shapeA.body;
        if (shapeB) beginShapeContactEvent.bodyB = shapeB.body;
        this.dispatchEvent(beginShapeContactEvent);
      }
      beginShapeContactEvent.bodyA = beginShapeContactEvent.bodyB = beginShapeContactEvent.shapeA = beginShapeContactEvent.shapeB = null;
    }
    if (hasEndShapeContact) {
      for (let i = 0, l = removals.length; i < l; i += 2) {
        const shapeA = this.getShapeById(removals[i]);
        const shapeB = this.getShapeById(removals[i + 1]);
        endShapeContactEvent.shapeA = shapeA;
        endShapeContactEvent.shapeB = shapeB;
        if (shapeA) endShapeContactEvent.bodyA = shapeA.body;
        if (shapeB) endShapeContactEvent.bodyB = shapeB.body;
        this.dispatchEvent(endShapeContactEvent);
      }
      endShapeContactEvent.bodyA = endShapeContactEvent.bodyB = endShapeContactEvent.shapeA = endShapeContactEvent.shapeB = null;
    }
  }

  /**
   * Sets all body forces in the world to zero.
   */
  clearForces() {
    const bodies = this.bodies;
    const N = bodies.length;
    for (let i = 0; i !== N; i++) {
      const b = bodies[i];
      b.force;
      b.torque;
      b.force.set(0, 0, 0);
      b.torque.set(0, 0, 0);
    }
  }
}

// Temp stuff
new AABB();
const tmpRay = new Ray();

// performance.now() fallback on Date.now()
const performance = globalThis.performance || {};
if (!performance.now) {
  let nowOffset = Date.now();
  if (performance.timing && performance.timing.navigationStart) {
    nowOffset = performance.timing.navigationStart;
  }
  performance.now = () => Date.now() - nowOffset;
}
new Vec3();

// Dispatched after the world has stepped forward in time.
// Reusable event objects to save memory.
const World_step_postStepEvent = {
  type: 'postStep'
};

// Dispatched before the world steps forward in time.
const World_step_preStepEvent = {
  type: 'preStep'
};
const World_step_collideEvent = {
  type: Body.COLLIDE_EVENT_NAME,
  body: null,
  contact: null
};

// Pools for unused objects
const World_step_oldContacts = [];
const World_step_frictionEquationPool = [];

// Reusable arrays for collision pairs
const World_step_p1 = [];
const World_step_p2 = [];

// Stuff for emitContactEvents
const additions = [];
const removals = [];
const beginContactEvent = {
  type: 'beginContact',
  bodyA: null,
  bodyB: null
};
const endContactEvent = {
  type: 'endContact',
  bodyA: null,
  bodyB: null
};
const beginShapeContactEvent = {
  type: 'beginShapeContact',
  bodyA: null,
  bodyB: null,
  shapeA: null,
  shapeB: null
};
const endShapeContactEvent = {
  type: 'endShapeContact',
  bodyA: null,
  bodyB: null,
  shapeA: null,
  shapeB: null
};

/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
const REVISION = '184';

/**
 * WebGL coordinate system.
 *
 * @type {number}
 * @constant
 */
const WebGLCoordinateSystem = 2000;

/**
 * WebGPU coordinate system.
 *
 * @type {number}
 * @constant
 */
const WebGPUCoordinateSystem = 2001;

/**
 * Enhances log/warn/error messages related to TSL.
 *
 * @param {Array<any>} params - The original message parameters.
 * @returns {Array<any>} The filtered and enhanced message parameters.
 */
function enhanceLogMessage( params ) {

	const message = params[ 0 ];

	if ( typeof message === 'string' && message.startsWith( 'TSL:' ) ) {

		const stackTrace = params[ 1 ];

		if ( stackTrace && stackTrace.isStackTrace ) {

			params[ 0 ] += ' ' + stackTrace.getLocation();

		} else {

			params[ 1 ] = 'Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.';

		}

	}

	return params;

}

/**
 * Logs a warning message with the 'THREE.' prefix.
 *
 * If a custom console function is set via setConsoleFunction(), it will be used
 * instead of the native console.warn. The first parameter is treated as the
 * method name and is automatically prefixed with 'THREE.'.
 *
 * @param {...any} params - The message components. The first param is used as
 *                          the method name and prefixed with 'THREE.'.
 */
function warn( ...params ) {

	params = enhanceLogMessage( params );

	const message = 'THREE.' + params.shift();

	{

		const stackTrace = params[ 0 ];

		if ( stackTrace && stackTrace.isStackTrace ) {

			console.warn( stackTrace.getError( message ) );

		} else {

			console.warn( message, ...params );

		}

	}

}

/**
 * Clamps the given value between min and max.
 *
 * @param {number} value - The value to clamp.
 * @param {number} min - The min value.
 * @param {number} max - The max value.
 * @return {number} The clamped value.
 */
function clamp( value, min, max ) {

	return Math.max( min, Math.min( max, value ) );

}

/**
 * Class representing a 2D vector. A 2D vector is an ordered pair of numbers
 * (labeled x and y), which can be used to represent a number of things, such as:
 *
 * - A point in 2D space (i.e. a position on a plane).
 * - A direction and length across a plane. In three.js the length will
 * always be the Euclidean distance(straight-line distance) from `(0, 0)` to `(x, y)`
 * and the direction is also measured from `(0, 0)` towards `(x, y)`.
 * - Any arbitrary ordered pair of numbers.
 *
 * There are other things a 2D vector can be used to represent, such as
 * momentum vectors, complex numbers and so on, however these are the most
 * common uses in three.js.
 *
 * Iterating through a vector instance will yield its components `(x, y)` in
 * the corresponding order.
 * ```js
 * const a = new THREE.Vector2( 0, 1 );
 *
 * //no arguments; will be initialised to (0, 0)
 * const b = new THREE.Vector2( );
 *
 * const d = a.distanceTo( b );
 * ```
 */
class Vector2 {

	static {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		Vector2.prototype.isVector2 = true;

	}

	/**
	 * Constructs a new 2D vector.
	 *
	 * @param {number} [x=0] - The x value of this vector.
	 * @param {number} [y=0] - The y value of this vector.
	 */
	constructor( x = 0, y = 0 ) {

		/**
		 * The x value of this vector.
		 *
		 * @type {number}
		 */
		this.x = x;

		/**
		 * The y value of this vector.
		 *
		 * @type {number}
		 */
		this.y = y;

	}

	/**
	 * Alias for {@link Vector2#x}.
	 *
	 * @type {number}
	 */
	get width() {

		return this.x;

	}

	set width( value ) {

		this.x = value;

	}

	/**
	 * Alias for {@link Vector2#y}.
	 *
	 * @type {number}
	 */
	get height() {

		return this.y;

	}

	set height( value ) {

		this.y = value;

	}

	/**
	 * Sets the vector components.
	 *
	 * @param {number} x - The value of the x component.
	 * @param {number} y - The value of the y component.
	 * @return {Vector2} A reference to this vector.
	 */
	set( x, y ) {

		this.x = x;
		this.y = y;

		return this;

	}

	/**
	 * Sets the vector components to the same value.
	 *
	 * @param {number} scalar - The value to set for all vector components.
	 * @return {Vector2} A reference to this vector.
	 */
	setScalar( scalar ) {

		this.x = scalar;
		this.y = scalar;

		return this;

	}

	/**
	 * Sets the vector's x component to the given value
	 *
	 * @param {number} x - The value to set.
	 * @return {Vector2} A reference to this vector.
	 */
	setX( x ) {

		this.x = x;

		return this;

	}

	/**
	 * Sets the vector's y component to the given value
	 *
	 * @param {number} y - The value to set.
	 * @return {Vector2} A reference to this vector.
	 */
	setY( y ) {

		this.y = y;

		return this;

	}

	/**
	 * Allows to set a vector component with an index.
	 *
	 * @param {number} index - The component index. `0` equals to x, `1` equals to y.
	 * @param {number} value - The value to set.
	 * @return {Vector2} A reference to this vector.
	 */
	setComponent( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

		return this;

	}

	/**
	 * Returns the value of the vector component which matches the given index.
	 *
	 * @param {number} index - The component index. `0` equals to x, `1` equals to y.
	 * @return {number} A vector component value.
	 */
	getComponent( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			default: throw new Error( 'index is out of range: ' + index );

		}

	}

	/**
	 * Returns a new vector with copied values from this instance.
	 *
	 * @return {Vector2} A clone of this instance.
	 */
	clone() {

		return new this.constructor( this.x, this.y );

	}

	/**
	 * Copies the values of the given vector to this instance.
	 *
	 * @param {Vector2} v - The vector to copy.
	 * @return {Vector2} A reference to this vector.
	 */
	copy( v ) {

		this.x = v.x;
		this.y = v.y;

		return this;

	}

	/**
	 * Adds the given vector to this instance.
	 *
	 * @param {Vector2} v - The vector to add.
	 * @return {Vector2} A reference to this vector.
	 */
	add( v ) {

		this.x += v.x;
		this.y += v.y;

		return this;

	}

	/**
	 * Adds the given scalar value to all components of this instance.
	 *
	 * @param {number} s - The scalar to add.
	 * @return {Vector2} A reference to this vector.
	 */
	addScalar( s ) {

		this.x += s;
		this.y += s;

		return this;

	}

	/**
	 * Adds the given vectors and stores the result in this instance.
	 *
	 * @param {Vector2} a - The first vector.
	 * @param {Vector2} b - The second vector.
	 * @return {Vector2} A reference to this vector.
	 */
	addVectors( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;

		return this;

	}

	/**
	 * Adds the given vector scaled by the given factor to this instance.
	 *
	 * @param {Vector2} v - The vector.
	 * @param {number} s - The factor that scales `v`.
	 * @return {Vector2} A reference to this vector.
	 */
	addScaledVector( v, s ) {

		this.x += v.x * s;
		this.y += v.y * s;

		return this;

	}

	/**
	 * Subtracts the given vector from this instance.
	 *
	 * @param {Vector2} v - The vector to subtract.
	 * @return {Vector2} A reference to this vector.
	 */
	sub( v ) {

		this.x -= v.x;
		this.y -= v.y;

		return this;

	}

	/**
	 * Subtracts the given scalar value from all components of this instance.
	 *
	 * @param {number} s - The scalar to subtract.
	 * @return {Vector2} A reference to this vector.
	 */
	subScalar( s ) {

		this.x -= s;
		this.y -= s;

		return this;

	}

	/**
	 * Subtracts the given vectors and stores the result in this instance.
	 *
	 * @param {Vector2} a - The first vector.
	 * @param {Vector2} b - The second vector.
	 * @return {Vector2} A reference to this vector.
	 */
	subVectors( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;

		return this;

	}

	/**
	 * Multiplies the given vector with this instance.
	 *
	 * @param {Vector2} v - The vector to multiply.
	 * @return {Vector2} A reference to this vector.
	 */
	multiply( v ) {

		this.x *= v.x;
		this.y *= v.y;

		return this;

	}

	/**
	 * Multiplies the given scalar value with all components of this instance.
	 *
	 * @param {number} scalar - The scalar to multiply.
	 * @return {Vector2} A reference to this vector.
	 */
	multiplyScalar( scalar ) {

		this.x *= scalar;
		this.y *= scalar;

		return this;

	}

	/**
	 * Divides this instance by the given vector.
	 *
	 * @param {Vector2} v - The vector to divide.
	 * @return {Vector2} A reference to this vector.
	 */
	divide( v ) {

		this.x /= v.x;
		this.y /= v.y;

		return this;

	}

	/**
	 * Divides this vector by the given scalar.
	 *
	 * @param {number} scalar - The scalar to divide.
	 * @return {Vector2} A reference to this vector.
	 */
	divideScalar( scalar ) {

		return this.multiplyScalar( 1 / scalar );

	}

	/**
	 * Multiplies this vector (with an implicit 1 as the 3rd component) by
	 * the given 3x3 matrix.
	 *
	 * @param {Matrix3} m - The matrix to apply.
	 * @return {Vector2} A reference to this vector.
	 */
	applyMatrix3( m ) {

		const x = this.x, y = this.y;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ];
		this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ];

		return this;

	}

	/**
	 * If this vector's x or y value is greater than the given vector's x or y
	 * value, replace that value with the corresponding min value.
	 *
	 * @param {Vector2} v - The vector.
	 * @return {Vector2} A reference to this vector.
	 */
	min( v ) {

		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );

		return this;

	}

	/**
	 * If this vector's x or y value is less than the given vector's x or y
	 * value, replace that value with the corresponding max value.
	 *
	 * @param {Vector2} v - The vector.
	 * @return {Vector2} A reference to this vector.
	 */
	max( v ) {

		this.x = Math.max( this.x, v.x );
		this.y = Math.max( this.y, v.y );

		return this;

	}

	/**
	 * If this vector's x or y value is greater than the max vector's x or y
	 * value, it is replaced by the corresponding value.
	 * If this vector's x or y value is less than the min vector's x or y value,
	 * it is replaced by the corresponding value.
	 *
	 * @param {Vector2} min - The minimum x and y values.
	 * @param {Vector2} max - The maximum x and y values in the desired range.
	 * @return {Vector2} A reference to this vector.
	 */
	clamp( min, max ) {

		// assumes min < max, componentwise

		this.x = clamp( this.x, min.x, max.x );
		this.y = clamp( this.y, min.y, max.y );

		return this;

	}

	/**
	 * If this vector's x or y values are greater than the max value, they are
	 * replaced by the max value.
	 * If this vector's x or y values are less than the min value, they are
	 * replaced by the min value.
	 *
	 * @param {number} minVal - The minimum value the components will be clamped to.
	 * @param {number} maxVal - The maximum value the components will be clamped to.
	 * @return {Vector2} A reference to this vector.
	 */
	clampScalar( minVal, maxVal ) {

		this.x = clamp( this.x, minVal, maxVal );
		this.y = clamp( this.y, minVal, maxVal );

		return this;

	}

	/**
	 * If this vector's length is greater than the max value, it is replaced by
	 * the max value.
	 * If this vector's length is less than the min value, it is replaced by the
	 * min value.
	 *
	 * @param {number} min - The minimum value the vector length will be clamped to.
	 * @param {number} max - The maximum value the vector length will be clamped to.
	 * @return {Vector2} A reference to this vector.
	 */
	clampLength( min, max ) {

		const length = this.length();

		return this.divideScalar( length || 1 ).multiplyScalar( clamp( length, min, max ) );

	}

	/**
	 * The components of this vector are rounded down to the nearest integer value.
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	floor() {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );

		return this;

	}

	/**
	 * The components of this vector are rounded up to the nearest integer value.
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	ceil() {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );

		return this;

	}

	/**
	 * The components of this vector are rounded to the nearest integer value
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	round() {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );

		return this;

	}

	/**
	 * The components of this vector are rounded towards zero (up if negative,
	 * down if positive) to an integer value.
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	roundToZero() {

		this.x = Math.trunc( this.x );
		this.y = Math.trunc( this.y );

		return this;

	}

	/**
	 * Inverts this vector - i.e. sets x = -x and y = -y.
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	negate() {

		this.x = - this.x;
		this.y = - this.y;

		return this;

	}

	/**
	 * Calculates the dot product of the given vector with this instance.
	 *
	 * @param {Vector2} v - The vector to compute the dot product with.
	 * @return {number} The result of the dot product.
	 */
	dot( v ) {

		return this.x * v.x + this.y * v.y;

	}

	/**
	 * Calculates the cross product of the given vector with this instance.
	 *
	 * @param {Vector2} v - The vector to compute the cross product with.
	 * @return {number} The result of the cross product.
	 */
	cross( v ) {

		return this.x * v.y - this.y * v.x;

	}

	/**
	 * Computes the square of the Euclidean length (straight-line length) from
	 * (0, 0) to (x, y). If you are comparing the lengths of vectors, you should
	 * compare the length squared instead as it is slightly more efficient to calculate.
	 *
	 * @return {number} The square length of this vector.
	 */
	lengthSq() {

		return this.x * this.x + this.y * this.y;

	}

	/**
	 * Computes the  Euclidean length (straight-line length) from (0, 0) to (x, y).
	 *
	 * @return {number} The length of this vector.
	 */
	length() {

		return Math.sqrt( this.x * this.x + this.y * this.y );

	}

	/**
	 * Computes the Manhattan length of this vector.
	 *
	 * @return {number} The length of this vector.
	 */
	manhattanLength() {

		return Math.abs( this.x ) + Math.abs( this.y );

	}

	/**
	 * Converts this vector to a unit vector - that is, sets it equal to a vector
	 * with the same direction as this one, but with a vector length of `1`.
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	normalize() {

		return this.divideScalar( this.length() || 1 );

	}

	/**
	 * Computes the angle in radians of this vector with respect to the positive x-axis.
	 *
	 * @return {number} The angle in radians.
	 */
	angle() {

		const angle = Math.atan2( - this.y, - this.x ) + Math.PI;

		return angle;

	}

	/**
	 * Returns the angle between the given vector and this instance in radians.
	 *
	 * @param {Vector2} v - The vector to compute the angle with.
	 * @return {number} The angle in radians.
	 */
	angleTo( v ) {

		const denominator = Math.sqrt( this.lengthSq() * v.lengthSq() );

		if ( denominator === 0 ) return Math.PI / 2;

		const theta = this.dot( v ) / denominator;

		// clamp, to handle numerical problems

		return Math.acos( clamp( theta, -1, 1 ) );

	}

	/**
	 * Computes the distance from the given vector to this instance.
	 *
	 * @param {Vector2} v - The vector to compute the distance to.
	 * @return {number} The distance.
	 */
	distanceTo( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	}

	/**
	 * Computes the squared distance from the given vector to this instance.
	 * If you are just comparing the distance with another distance, you should compare
	 * the distance squared instead as it is slightly more efficient to calculate.
	 *
	 * @param {Vector2} v - The vector to compute the squared distance to.
	 * @return {number} The squared distance.
	 */
	distanceToSquared( v ) {

		const dx = this.x - v.x, dy = this.y - v.y;
		return dx * dx + dy * dy;

	}

	/**
	 * Computes the Manhattan distance from the given vector to this instance.
	 *
	 * @param {Vector2} v - The vector to compute the Manhattan distance to.
	 * @return {number} The Manhattan distance.
	 */
	manhattanDistanceTo( v ) {

		return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y );

	}

	/**
	 * Sets this vector to a vector with the same direction as this one, but
	 * with the specified length.
	 *
	 * @param {number} length - The new length of this vector.
	 * @return {Vector2} A reference to this vector.
	 */
	setLength( length ) {

		return this.normalize().multiplyScalar( length );

	}

	/**
	 * Linearly interpolates between the given vector and this instance, where
	 * alpha is the percent distance along the line - alpha = 0 will be this
	 * vector, and alpha = 1 will be the given one.
	 *
	 * @param {Vector2} v - The vector to interpolate towards.
	 * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
	 * @return {Vector2} A reference to this vector.
	 */
	lerp( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;

		return this;

	}

	/**
	 * Linearly interpolates between the given vectors, where alpha is the percent
	 * distance along the line - alpha = 0 will be first vector, and alpha = 1 will
	 * be the second one. The result is stored in this instance.
	 *
	 * @param {Vector2} v1 - The first vector.
	 * @param {Vector2} v2 - The second vector.
	 * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
	 * @return {Vector2} A reference to this vector.
	 */
	lerpVectors( v1, v2, alpha ) {

		this.x = v1.x + ( v2.x - v1.x ) * alpha;
		this.y = v1.y + ( v2.y - v1.y ) * alpha;

		return this;

	}

	/**
	 * Returns `true` if this vector is equal with the given one.
	 *
	 * @param {Vector2} v - The vector to test for equality.
	 * @return {boolean} Whether this vector is equal with the given one.
	 */
	equals( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) );

	}

	/**
	 * Sets this vector's x value to be `array[ offset ]` and y
	 * value to be `array[ offset + 1 ]`.
	 *
	 * @param {Array<number>} array - An array holding the vector component values.
	 * @param {number} [offset=0] - The offset into the array.
	 * @return {Vector2} A reference to this vector.
	 */
	fromArray( array, offset = 0 ) {

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];

		return this;

	}

	/**
	 * Writes the components of this vector to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number>} [array=[]] - The target array holding the vector components.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number>} The vector components.
	 */
	toArray( array = [], offset = 0 ) {

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;

		return array;

	}

	/**
	 * Sets the components of this vector from the given buffer attribute.
	 *
	 * @param {BufferAttribute} attribute - The buffer attribute holding vector data.
	 * @param {number} index - The index into the attribute.
	 * @return {Vector2} A reference to this vector.
	 */
	fromBufferAttribute( attribute, index ) {

		this.x = attribute.getX( index );
		this.y = attribute.getY( index );

		return this;

	}

	/**
	 * Rotates this vector around the given center by the given angle.
	 *
	 * @param {Vector2} center - The point around which to rotate.
	 * @param {number} angle - The angle to rotate, in radians.
	 * @return {Vector2} A reference to this vector.
	 */
	rotateAround( center, angle ) {

		const c = Math.cos( angle ), s = Math.sin( angle );

		const x = this.x - center.x;
		const y = this.y - center.y;

		this.x = x * c - y * s + center.x;
		this.y = x * s + y * c + center.y;

		return this;

	}

	/**
	 * Sets each component of this vector to a pseudo-random value between `0` and
	 * `1`, excluding `1`.
	 *
	 * @return {Vector2} A reference to this vector.
	 */
	random() {

		this.x = Math.random();
		this.y = Math.random();

		return this;

	}

	*[ Symbol.iterator ]() {

		yield this.x;
		yield this.y;

	}

}

/**
 * Class for representing a Quaternion. Quaternions are used in three.js to represent rotations.
 *
 * Iterating through a vector instance will yield its components `(x, y, z, w)` in
 * the corresponding order.
 *
 * Note that three.js expects Quaternions to be normalized.
 * ```js
 * const quaternion = new THREE.Quaternion();
 * quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI / 2 );
 *
 * const vector = new THREE.Vector3( 1, 0, 0 );
 * vector.applyQuaternion( quaternion );
 * ```
 */
class Quaternion {

	/**
	 * Constructs a new quaternion.
	 *
	 * @param {number} [x=0] - The x value of this quaternion.
	 * @param {number} [y=0] - The y value of this quaternion.
	 * @param {number} [z=0] - The z value of this quaternion.
	 * @param {number} [w=1] - The w value of this quaternion.
	 */
	constructor( x = 0, y = 0, z = 0, w = 1 ) {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isQuaternion = true;

		this._x = x;
		this._y = y;
		this._z = z;
		this._w = w;

	}

	/**
	 * Interpolates between two quaternions via SLERP. This implementation assumes the
	 * quaternion data are managed in flat arrays.
	 *
	 * @param {Array<number>} dst - The destination array.
	 * @param {number} dstOffset - An offset into the destination array.
	 * @param {Array<number>} src0 - The source array of the first quaternion.
	 * @param {number} srcOffset0 - An offset into the first source array.
	 * @param {Array<number>} src1 -  The source array of the second quaternion.
	 * @param {number} srcOffset1 - An offset into the second source array.
	 * @param {number} t - The interpolation factor. A value in the range `[0,1]` will interpolate. A value outside the range `[0,1]` will extrapolate.
	 * @see {@link Quaternion#slerp}
	 */
	static slerpFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t ) {

		let x0 = src0[ srcOffset0 + 0 ],
			y0 = src0[ srcOffset0 + 1 ],
			z0 = src0[ srcOffset0 + 2 ],
			w0 = src0[ srcOffset0 + 3 ];

		let x1 = src1[ srcOffset1 + 0 ],
			y1 = src1[ srcOffset1 + 1 ],
			z1 = src1[ srcOffset1 + 2 ],
			w1 = src1[ srcOffset1 + 3 ];

		if ( w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1 ) {

			let dot = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1;

			if ( dot < 0 ) {

				x1 = - x1;
				y1 = - y1;
				z1 = - z1;
				w1 = - w1;

				dot = - dot;

			}

			let s = 1 - t;

			if ( dot < 0.9995 ) {

				// slerp

				const theta = Math.acos( dot );
				const sin = Math.sin( theta );

				s = Math.sin( s * theta ) / sin;
				t = Math.sin( t * theta ) / sin;

				x0 = x0 * s + x1 * t;
				y0 = y0 * s + y1 * t;
				z0 = z0 * s + z1 * t;
				w0 = w0 * s + w1 * t;

			} else {

				// for small angles, lerp then normalize

				x0 = x0 * s + x1 * t;
				y0 = y0 * s + y1 * t;
				z0 = z0 * s + z1 * t;
				w0 = w0 * s + w1 * t;

				const f = 1 / Math.sqrt( x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0 );

				x0 *= f;
				y0 *= f;
				z0 *= f;
				w0 *= f;

			}

		}

		dst[ dstOffset ] = x0;
		dst[ dstOffset + 1 ] = y0;
		dst[ dstOffset + 2 ] = z0;
		dst[ dstOffset + 3 ] = w0;

	}

	/**
	 * Multiplies two quaternions. This implementation assumes the quaternion data are managed
	 * in flat arrays.
	 *
	 * @param {Array<number>} dst - The destination array.
	 * @param {number} dstOffset - An offset into the destination array.
	 * @param {Array<number>} src0 - The source array of the first quaternion.
	 * @param {number} srcOffset0 - An offset into the first source array.
	 * @param {Array<number>} src1 -  The source array of the second quaternion.
	 * @param {number} srcOffset1 - An offset into the second source array.
	 * @return {Array<number>} The destination array.
	 * @see {@link Quaternion#multiplyQuaternions}.
	 */
	static multiplyQuaternionsFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1 ) {

		const x0 = src0[ srcOffset0 ];
		const y0 = src0[ srcOffset0 + 1 ];
		const z0 = src0[ srcOffset0 + 2 ];
		const w0 = src0[ srcOffset0 + 3 ];

		const x1 = src1[ srcOffset1 ];
		const y1 = src1[ srcOffset1 + 1 ];
		const z1 = src1[ srcOffset1 + 2 ];
		const w1 = src1[ srcOffset1 + 3 ];

		dst[ dstOffset ] = x0 * w1 + w0 * x1 + y0 * z1 - z0 * y1;
		dst[ dstOffset + 1 ] = y0 * w1 + w0 * y1 + z0 * x1 - x0 * z1;
		dst[ dstOffset + 2 ] = z0 * w1 + w0 * z1 + x0 * y1 - y0 * x1;
		dst[ dstOffset + 3 ] = w0 * w1 - x0 * x1 - y0 * y1 - z0 * z1;

		return dst;

	}

	/**
	 * The x value of this quaternion.
	 *
	 * @type {number}
	 * @default 0
	 */
	get x() {

		return this._x;

	}

	set x( value ) {

		this._x = value;
		this._onChangeCallback();

	}

	/**
	 * The y value of this quaternion.
	 *
	 * @type {number}
	 * @default 0
	 */
	get y() {

		return this._y;

	}

	set y( value ) {

		this._y = value;
		this._onChangeCallback();

	}

	/**
	 * The z value of this quaternion.
	 *
	 * @type {number}
	 * @default 0
	 */
	get z() {

		return this._z;

	}

	set z( value ) {

		this._z = value;
		this._onChangeCallback();

	}

	/**
	 * The w value of this quaternion.
	 *
	 * @type {number}
	 * @default 1
	 */
	get w() {

		return this._w;

	}

	set w( value ) {

		this._w = value;
		this._onChangeCallback();

	}

	/**
	 * Sets the quaternion components.
	 *
	 * @param {number} x - The x value of this quaternion.
	 * @param {number} y - The y value of this quaternion.
	 * @param {number} z - The z value of this quaternion.
	 * @param {number} w - The w value of this quaternion.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	set( x, y, z, w ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._w = w;

		this._onChangeCallback();

		return this;

	}

	/**
	 * Returns a new quaternion with copied values from this instance.
	 *
	 * @return {Quaternion} A clone of this instance.
	 */
	clone() {

		return new this.constructor( this._x, this._y, this._z, this._w );

	}

	/**
	 * Copies the values of the given quaternion to this instance.
	 *
	 * @param {Quaternion} quaternion - The quaternion to copy.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	copy( quaternion ) {

		this._x = quaternion.x;
		this._y = quaternion.y;
		this._z = quaternion.z;
		this._w = quaternion.w;

		this._onChangeCallback();

		return this;

	}

	/**
	 * Sets this quaternion from the rotation specified by the given
	 * Euler angles.
	 *
	 * @param {Euler} euler - The Euler angles.
	 * @param {boolean} [update=true] - Whether the internal `onChange` callback should be executed or not.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	setFromEuler( euler, update = true ) {

		const x = euler._x, y = euler._y, z = euler._z, order = euler._order;

		// http://www.mathworks.com/matlabcentral/fileexchange/
		// 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
		//	content/SpinCalc.m

		const cos = Math.cos;
		const sin = Math.sin;

		const c1 = cos( x / 2 );
		const c2 = cos( y / 2 );
		const c3 = cos( z / 2 );

		const s1 = sin( x / 2 );
		const s2 = sin( y / 2 );
		const s3 = sin( z / 2 );

		switch ( order ) {

			case 'XYZ':
				this._x = s1 * c2 * c3 + c1 * s2 * s3;
				this._y = c1 * s2 * c3 - s1 * c2 * s3;
				this._z = c1 * c2 * s3 + s1 * s2 * c3;
				this._w = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case 'YXZ':
				this._x = s1 * c2 * c3 + c1 * s2 * s3;
				this._y = c1 * s2 * c3 - s1 * c2 * s3;
				this._z = c1 * c2 * s3 - s1 * s2 * c3;
				this._w = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			case 'ZXY':
				this._x = s1 * c2 * c3 - c1 * s2 * s3;
				this._y = c1 * s2 * c3 + s1 * c2 * s3;
				this._z = c1 * c2 * s3 + s1 * s2 * c3;
				this._w = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case 'ZYX':
				this._x = s1 * c2 * c3 - c1 * s2 * s3;
				this._y = c1 * s2 * c3 + s1 * c2 * s3;
				this._z = c1 * c2 * s3 - s1 * s2 * c3;
				this._w = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			case 'YZX':
				this._x = s1 * c2 * c3 + c1 * s2 * s3;
				this._y = c1 * s2 * c3 + s1 * c2 * s3;
				this._z = c1 * c2 * s3 - s1 * s2 * c3;
				this._w = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case 'XZY':
				this._x = s1 * c2 * c3 - c1 * s2 * s3;
				this._y = c1 * s2 * c3 - s1 * c2 * s3;
				this._z = c1 * c2 * s3 + s1 * s2 * c3;
				this._w = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			default:
				warn( 'Quaternion: .setFromEuler() encountered an unknown order: ' + order );

		}

		if ( update === true ) this._onChangeCallback();

		return this;

	}

	/**
	 * Sets this quaternion from the given axis and angle.
	 *
	 * @param {Vector3} axis - The normalized axis.
	 * @param {number} angle - The angle in radians.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	setFromAxisAngle( axis, angle ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

		const halfAngle = angle / 2, s = Math.sin( halfAngle );

		this._x = axis.x * s;
		this._y = axis.y * s;
		this._z = axis.z * s;
		this._w = Math.cos( halfAngle );

		this._onChangeCallback();

		return this;

	}

	/**
	 * Sets this quaternion from the given rotation matrix.
	 *
	 * @param {Matrix4} m - A 4x4 matrix of which the upper 3x3 of matrix is a pure rotation matrix (i.e. unscaled).
	 * @return {Quaternion} A reference to this quaternion.
	 */
	setFromRotationMatrix( m ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		const te = m.elements,

			m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
			m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
			m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

			trace = m11 + m22 + m33;

		if ( trace > 0 ) {

			const s = 0.5 / Math.sqrt( trace + 1.0 );

			this._w = 0.25 / s;
			this._x = ( m32 - m23 ) * s;
			this._y = ( m13 - m31 ) * s;
			this._z = ( m21 - m12 ) * s;

		} else if ( m11 > m22 && m11 > m33 ) {

			const s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

			this._w = ( m32 - m23 ) / s;
			this._x = 0.25 * s;
			this._y = ( m12 + m21 ) / s;
			this._z = ( m13 + m31 ) / s;

		} else if ( m22 > m33 ) {

			const s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

			this._w = ( m13 - m31 ) / s;
			this._x = ( m12 + m21 ) / s;
			this._y = 0.25 * s;
			this._z = ( m23 + m32 ) / s;

		} else {

			const s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

			this._w = ( m21 - m12 ) / s;
			this._x = ( m13 + m31 ) / s;
			this._y = ( m23 + m32 ) / s;
			this._z = 0.25 * s;

		}

		this._onChangeCallback();

		return this;

	}

	/**
	 * Sets this quaternion to the rotation required to rotate the direction vector
	 * `vFrom` to the direction vector `vTo`.
	 *
	 * @param {Vector3} vFrom - The first (normalized) direction vector.
	 * @param {Vector3} vTo - The second (normalized) direction vector.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	setFromUnitVectors( vFrom, vTo ) {

		// assumes direction vectors vFrom and vTo are normalized

		let r = vFrom.dot( vTo ) + 1;

		if ( r < 1e-8 ) { // the epsilon value has been discussed in #31286

			// vFrom and vTo point in opposite directions

			r = 0;

			if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {

				this._x = - vFrom.y;
				this._y = vFrom.x;
				this._z = 0;
				this._w = r;

			} else {

				this._x = 0;
				this._y = - vFrom.z;
				this._z = vFrom.y;
				this._w = r;

			}

		} else {

			// crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3

			this._x = vFrom.y * vTo.z - vFrom.z * vTo.y;
			this._y = vFrom.z * vTo.x - vFrom.x * vTo.z;
			this._z = vFrom.x * vTo.y - vFrom.y * vTo.x;
			this._w = r;

		}

		return this.normalize();

	}

	/**
	 * Returns the angle between this quaternion and the given one in radians.
	 *
	 * @param {Quaternion} q - The quaternion to compute the angle with.
	 * @return {number} The angle in radians.
	 */
	angleTo( q ) {

		return 2 * Math.acos( Math.abs( clamp( this.dot( q ), -1, 1 ) ) );

	}

	/**
	 * Rotates this quaternion by a given angular step to the given quaternion.
	 * The method ensures that the final quaternion will not overshoot `q`.
	 *
	 * @param {Quaternion} q - The target quaternion.
	 * @param {number} step - The angular step in radians.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	rotateTowards( q, step ) {

		const angle = this.angleTo( q );

		if ( angle === 0 ) return this;

		const t = Math.min( 1, step / angle );

		this.slerp( q, t );

		return this;

	}

	/**
	 * Sets this quaternion to the identity quaternion; that is, to the
	 * quaternion that represents "no rotation".
	 *
	 * @return {Quaternion} A reference to this quaternion.
	 */
	identity() {

		return this.set( 0, 0, 0, 1 );

	}

	/**
	 * Inverts this quaternion via {@link Quaternion#conjugate}. The
	 * quaternion is assumed to have unit length.
	 *
	 * @return {Quaternion} A reference to this quaternion.
	 */
	invert() {

		return this.conjugate();

	}

	/**
	 * Returns the rotational conjugate of this quaternion. The conjugate of a
	 * quaternion represents the same rotation in the opposite direction about
	 * the rotational axis.
	 *
	 * @return {Quaternion} A reference to this quaternion.
	 */
	conjugate() {

		this._x *= -1;
		this._y *= -1;
		this._z *= -1;

		this._onChangeCallback();

		return this;

	}

	/**
	 * Calculates the dot product of this quaternion and the given one.
	 *
	 * @param {Quaternion} v - The quaternion to compute the dot product with.
	 * @return {number} The result of the dot product.
	 */
	dot( v ) {

		return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;

	}

	/**
	 * Computes the squared Euclidean length (straight-line length) of this quaternion,
	 * considered as a 4 dimensional vector. This can be useful if you are comparing the
	 * lengths of two quaternions, as this is a slightly more efficient calculation than
	 * {@link Quaternion#length}.
	 *
	 * @return {number} The squared Euclidean length.
	 */
	lengthSq() {

		return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

	}

	/**
	 * Computes the Euclidean length (straight-line length) of this quaternion,
	 * considered as a 4 dimensional vector.
	 *
	 * @return {number} The Euclidean length.
	 */
	length() {

		return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );

	}

	/**
	 * Normalizes this quaternion - that is, calculated the quaternion that performs
	 * the same rotation as this one, but has a length equal to `1`.
	 *
	 * @return {Quaternion} A reference to this quaternion.
	 */
	normalize() {

		let l = this.length();

		if ( l === 0 ) {

			this._x = 0;
			this._y = 0;
			this._z = 0;
			this._w = 1;

		} else {

			l = 1 / l;

			this._x = this._x * l;
			this._y = this._y * l;
			this._z = this._z * l;
			this._w = this._w * l;

		}

		this._onChangeCallback();

		return this;

	}

	/**
	 * Multiplies this quaternion by the given one.
	 *
	 * @param {Quaternion} q - The quaternion.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	multiply( q ) {

		return this.multiplyQuaternions( this, q );

	}

	/**
	 * Pre-multiplies this quaternion by the given one.
	 *
	 * @param {Quaternion} q - The quaternion.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	premultiply( q ) {

		return this.multiplyQuaternions( q, this );

	}

	/**
	 * Multiplies the given quaternions and stores the result in this instance.
	 *
	 * @param {Quaternion} a - The first quaternion.
	 * @param {Quaternion} b - The second quaternion.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	multiplyQuaternions( a, b ) {

		// from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

		const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
		const qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

		this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

		this._onChangeCallback();

		return this;

	}

	/**
	 * Performs a spherical linear interpolation between this quaternion and the target quaternion.
	 *
	 * @param {Quaternion} qb - The target quaternion.
	 * @param {number} t - The interpolation factor. A value in the range `[0,1]` will interpolate. A value outside the range `[0,1]` will extrapolate.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	slerp( qb, t ) {

		let x = qb._x, y = qb._y, z = qb._z, w = qb._w;

		let dot = this.dot( qb );

		if ( dot < 0 ) {

			x = - x;
			y = - y;
			z = - z;
			w = - w;

			dot = - dot;

		}

		let s = 1 - t;

		if ( dot < 0.9995 ) {

			// slerp

			const theta = Math.acos( dot );
			const sin = Math.sin( theta );

			s = Math.sin( s * theta ) / sin;
			t = Math.sin( t * theta ) / sin;

			this._x = this._x * s + x * t;
			this._y = this._y * s + y * t;
			this._z = this._z * s + z * t;
			this._w = this._w * s + w * t;

			this._onChangeCallback();

		} else {

			// for small angles, lerp then normalize

			this._x = this._x * s + x * t;
			this._y = this._y * s + y * t;
			this._z = this._z * s + z * t;
			this._w = this._w * s + w * t;

			this.normalize(); // normalize calls _onChangeCallback()

		}

		return this;

	}

	/**
	 * Performs a spherical linear interpolation between the given quaternions
	 * and stores the result in this quaternion.
	 *
	 * @param {Quaternion} qa - The source quaternion.
	 * @param {Quaternion} qb - The target quaternion.
	 * @param {number} t - The interpolation factor in the closed interval `[0, 1]`.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	slerpQuaternions( qa, qb, t ) {

		return this.copy( qa ).slerp( qb, t );

	}

	/**
	 * Sets this quaternion to a uniformly random, normalized quaternion.
	 *
	 * @return {Quaternion} A reference to this quaternion.
	 */
	random() {

		// Ken Shoemake
		// Uniform random rotations
		// D. Kirk, editor, Graphics Gems III, pages 124-132. Academic Press, New York, 1992.

		const theta1 = 2 * Math.PI * Math.random();
		const theta2 = 2 * Math.PI * Math.random();

		const x0 = Math.random();
		const r1 = Math.sqrt( 1 - x0 );
		const r2 = Math.sqrt( x0 );

		return this.set(
			r1 * Math.sin( theta1 ),
			r1 * Math.cos( theta1 ),
			r2 * Math.sin( theta2 ),
			r2 * Math.cos( theta2 ),
		);

	}

	/**
	 * Returns `true` if this quaternion is equal with the given one.
	 *
	 * @param {Quaternion} quaternion - The quaternion to test for equality.
	 * @return {boolean} Whether this quaternion is equal with the given one.
	 */
	equals( quaternion ) {

		return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );

	}

	/**
	 * Sets this quaternion's components from the given array.
	 *
	 * @param {Array<number>} array - An array holding the quaternion component values.
	 * @param {number} [offset=0] - The offset into the array.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	fromArray( array, offset = 0 ) {

		this._x = array[ offset ];
		this._y = array[ offset + 1 ];
		this._z = array[ offset + 2 ];
		this._w = array[ offset + 3 ];

		this._onChangeCallback();

		return this;

	}

	/**
	 * Writes the components of this quaternion to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number>} [array=[]] - The target array holding the quaternion components.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number>} The quaternion components.
	 */
	toArray( array = [], offset = 0 ) {

		array[ offset ] = this._x;
		array[ offset + 1 ] = this._y;
		array[ offset + 2 ] = this._z;
		array[ offset + 3 ] = this._w;

		return array;

	}

	/**
	 * Sets the components of this quaternion from the given buffer attribute.
	 *
	 * @param {BufferAttribute} attribute - The buffer attribute holding quaternion data.
	 * @param {number} index - The index into the attribute.
	 * @return {Quaternion} A reference to this quaternion.
	 */
	fromBufferAttribute( attribute, index ) {

		this._x = attribute.getX( index );
		this._y = attribute.getY( index );
		this._z = attribute.getZ( index );
		this._w = attribute.getW( index );

		this._onChangeCallback();

		return this;

	}

	/**
	 * This methods defines the serialization result of this class. Returns the
	 * numerical elements of this quaternion in an array of format `[x, y, z, w]`.
	 *
	 * @return {Array<number>} The serialized quaternion.
	 */
	toJSON() {

		return this.toArray();

	}

	_onChange( callback ) {

		this._onChangeCallback = callback;

		return this;

	}

	_onChangeCallback() {}

	*[ Symbol.iterator ]() {

		yield this._x;
		yield this._y;
		yield this._z;
		yield this._w;

	}

}

/**
 * Class representing a 3D vector. A 3D vector is an ordered triplet of numbers
 * (labeled x, y and z), which can be used to represent a number of things, such as:
 *
 * - A point in 3D space.
 * - A direction and length in 3D space. In three.js the length will
 * always be the Euclidean distance(straight-line distance) from `(0, 0, 0)` to `(x, y, z)`
 * and the direction is also measured from `(0, 0, 0)` towards `(x, y, z)`.
 * - Any arbitrary ordered triplet of numbers.
 *
 * There are other things a 3D vector can be used to represent, such as
 * momentum vectors and so on, however these are the most
 * common uses in three.js.
 *
 * Iterating through a vector instance will yield its components `(x, y, z)` in
 * the corresponding order.
 * ```js
 * const a = new THREE.Vector3( 0, 1, 0 );
 *
 * //no arguments; will be initialised to (0, 0, 0)
 * const b = new THREE.Vector3( );
 *
 * const d = a.distanceTo( b );
 * ```
 */
class Vector3 {

	static {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		Vector3.prototype.isVector3 = true;

	}

	/**
	 * Constructs a new 3D vector.
	 *
	 * @param {number} [x=0] - The x value of this vector.
	 * @param {number} [y=0] - The y value of this vector.
	 * @param {number} [z=0] - The z value of this vector.
	 */
	constructor( x = 0, y = 0, z = 0 ) {

		/**
		 * The x value of this vector.
		 *
		 * @type {number}
		 */
		this.x = x;

		/**
		 * The y value of this vector.
		 *
		 * @type {number}
		 */
		this.y = y;

		/**
		 * The z value of this vector.
		 *
		 * @type {number}
		 */
		this.z = z;

	}

	/**
	 * Sets the vector components.
	 *
	 * @param {number} x - The value of the x component.
	 * @param {number} y - The value of the y component.
	 * @param {number} z - The value of the z component.
	 * @return {Vector3} A reference to this vector.
	 */
	set( x, y, z ) {

		if ( z === undefined ) z = this.z; // sprite.scale.set(x,y)

		this.x = x;
		this.y = y;
		this.z = z;

		return this;

	}

	/**
	 * Sets the vector components to the same value.
	 *
	 * @param {number} scalar - The value to set for all vector components.
	 * @return {Vector3} A reference to this vector.
	 */
	setScalar( scalar ) {

		this.x = scalar;
		this.y = scalar;
		this.z = scalar;

		return this;

	}

	/**
	 * Sets the vector's x component to the given value.
	 *
	 * @param {number} x - The value to set.
	 * @return {Vector3} A reference to this vector.
	 */
	setX( x ) {

		this.x = x;

		return this;

	}

	/**
	 * Sets the vector's y component to the given value.
	 *
	 * @param {number} y - The value to set.
	 * @return {Vector3} A reference to this vector.
	 */
	setY( y ) {

		this.y = y;

		return this;

	}

	/**
	 * Sets the vector's z component to the given value.
	 *
	 * @param {number} z - The value to set.
	 * @return {Vector3} A reference to this vector.
	 */
	setZ( z ) {

		this.z = z;

		return this;

	}

	/**
	 * Allows to set a vector component with an index.
	 *
	 * @param {number} index - The component index. `0` equals to x, `1` equals to y, `2` equals to z.
	 * @param {number} value - The value to set.
	 * @return {Vector3} A reference to this vector.
	 */
	setComponent( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			case 2: this.z = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

		return this;

	}

	/**
	 * Returns the value of the vector component which matches the given index.
	 *
	 * @param {number} index - The component index. `0` equals to x, `1` equals to y, `2` equals to z.
	 * @return {number} A vector component value.
	 */
	getComponent( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			default: throw new Error( 'index is out of range: ' + index );

		}

	}

	/**
	 * Returns a new vector with copied values from this instance.
	 *
	 * @return {Vector3} A clone of this instance.
	 */
	clone() {

		return new this.constructor( this.x, this.y, this.z );

	}

	/**
	 * Copies the values of the given vector to this instance.
	 *
	 * @param {Vector3} v - The vector to copy.
	 * @return {Vector3} A reference to this vector.
	 */
	copy( v ) {

		this.x = v.x;
		this.y = v.y;
		this.z = v.z;

		return this;

	}

	/**
	 * Adds the given vector to this instance.
	 *
	 * @param {Vector3} v - The vector to add.
	 * @return {Vector3} A reference to this vector.
	 */
	add( v ) {

		this.x += v.x;
		this.y += v.y;
		this.z += v.z;

		return this;

	}

	/**
	 * Adds the given scalar value to all components of this instance.
	 *
	 * @param {number} s - The scalar to add.
	 * @return {Vector3} A reference to this vector.
	 */
	addScalar( s ) {

		this.x += s;
		this.y += s;
		this.z += s;

		return this;

	}

	/**
	 * Adds the given vectors and stores the result in this instance.
	 *
	 * @param {Vector3} a - The first vector.
	 * @param {Vector3} b - The second vector.
	 * @return {Vector3} A reference to this vector.
	 */
	addVectors( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;

		return this;

	}

	/**
	 * Adds the given vector scaled by the given factor to this instance.
	 *
	 * @param {Vector3|Vector4} v - The vector.
	 * @param {number} s - The factor that scales `v`.
	 * @return {Vector3} A reference to this vector.
	 */
	addScaledVector( v, s ) {

		this.x += v.x * s;
		this.y += v.y * s;
		this.z += v.z * s;

		return this;

	}

	/**
	 * Subtracts the given vector from this instance.
	 *
	 * @param {Vector3} v - The vector to subtract.
	 * @return {Vector3} A reference to this vector.
	 */
	sub( v ) {

		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;

		return this;

	}

	/**
	 * Subtracts the given scalar value from all components of this instance.
	 *
	 * @param {number} s - The scalar to subtract.
	 * @return {Vector3} A reference to this vector.
	 */
	subScalar( s ) {

		this.x -= s;
		this.y -= s;
		this.z -= s;

		return this;

	}

	/**
	 * Subtracts the given vectors and stores the result in this instance.
	 *
	 * @param {Vector3} a - The first vector.
	 * @param {Vector3} b - The second vector.
	 * @return {Vector3} A reference to this vector.
	 */
	subVectors( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;

		return this;

	}

	/**
	 * Multiplies the given vector with this instance.
	 *
	 * @param {Vector3} v - The vector to multiply.
	 * @return {Vector3} A reference to this vector.
	 */
	multiply( v ) {

		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;

		return this;

	}

	/**
	 * Multiplies the given scalar value with all components of this instance.
	 *
	 * @param {number} scalar - The scalar to multiply.
	 * @return {Vector3} A reference to this vector.
	 */
	multiplyScalar( scalar ) {

		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;

		return this;

	}

	/**
	 * Multiplies the given vectors and stores the result in this instance.
	 *
	 * @param {Vector3} a - The first vector.
	 * @param {Vector3} b - The second vector.
	 * @return {Vector3} A reference to this vector.
	 */
	multiplyVectors( a, b ) {

		this.x = a.x * b.x;
		this.y = a.y * b.y;
		this.z = a.z * b.z;

		return this;

	}

	/**
	 * Applies the given Euler rotation to this vector.
	 *
	 * @param {Euler} euler - The Euler angles.
	 * @return {Vector3} A reference to this vector.
	 */
	applyEuler( euler ) {

		return this.applyQuaternion( _quaternion$5.setFromEuler( euler ) );

	}

	/**
	 * Applies a rotation specified by an axis and an angle to this vector.
	 *
	 * @param {Vector3} axis - A normalized vector representing the rotation axis.
	 * @param {number} angle - The angle in radians.
	 * @return {Vector3} A reference to this vector.
	 */
	applyAxisAngle( axis, angle ) {

		return this.applyQuaternion( _quaternion$5.setFromAxisAngle( axis, angle ) );

	}

	/**
	 * Multiplies this vector with the given 3x3 matrix.
	 *
	 * @param {Matrix3} m - The 3x3 matrix.
	 * @return {Vector3} A reference to this vector.
	 */
	applyMatrix3( m ) {

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
		this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
		this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;

		return this;

	}

	/**
	 * Multiplies this vector by the given normal matrix and normalizes
	 * the result.
	 *
	 * @param {Matrix3} m - The normal matrix.
	 * @return {Vector3} A reference to this vector.
	 */
	applyNormalMatrix( m ) {

		return this.applyMatrix3( m ).normalize();

	}

	/**
	 * Multiplies this vector (with an implicit 1 in the 4th dimension) by m, and
	 * divides by perspective.
	 *
	 * @param {Matrix4} m - The matrix to apply.
	 * @return {Vector3} A reference to this vector.
	 */
	applyMatrix4( m ) {

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		const w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );

		this.x = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * w;
		this.y = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * w;
		this.z = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w;

		return this;

	}

	/**
	 * Applies the given Quaternion to this vector.
	 *
	 * @param {Quaternion} q - The Quaternion.
	 * @return {Vector3} A reference to this vector.
	 */
	applyQuaternion( q ) {

		// quaternion q is assumed to have unit length

		const vx = this.x, vy = this.y, vz = this.z;
		const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

		// t = 2 * cross( q.xyz, v );
		const tx = 2 * ( qy * vz - qz * vy );
		const ty = 2 * ( qz * vx - qx * vz );
		const tz = 2 * ( qx * vy - qy * vx );

		// v + q.w * t + cross( q.xyz, t );
		this.x = vx + qw * tx + qy * tz - qz * ty;
		this.y = vy + qw * ty + qz * tx - qx * tz;
		this.z = vz + qw * tz + qx * ty - qy * tx;

		return this;

	}

	/**
	 * Projects this vector from world space into the camera's normalized
	 * device coordinate (NDC) space.
	 *
	 * @param {Camera} camera - The camera.
	 * @return {Vector3} A reference to this vector.
	 */
	project( camera ) {

		return this.applyMatrix4( camera.matrixWorldInverse ).applyMatrix4( camera.projectionMatrix );

	}

	/**
	 * Unprojects this vector from the camera's normalized device coordinate (NDC)
	 * space into world space.
	 *
	 * @param {Camera} camera - The camera.
	 * @return {Vector3} A reference to this vector.
	 */
	unproject( camera ) {

		return this.applyMatrix4( camera.projectionMatrixInverse ).applyMatrix4( camera.matrixWorld );

	}

	/**
	 * Transforms the direction of this vector by a matrix (the upper left 3 x 3
	 * subset of the given 4x4 matrix and then normalizes the result.
	 *
	 * @param {Matrix4} m - The matrix.
	 * @return {Vector3} A reference to this vector.
	 */
	transformDirection( m ) {

		// input: THREE.Matrix4 affine matrix
		// vector interpreted as a direction

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z;
		this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z;
		this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z;

		return this.normalize();

	}

	/**
	 * Divides this instance by the given vector.
	 *
	 * @param {Vector3} v - The vector to divide.
	 * @return {Vector3} A reference to this vector.
	 */
	divide( v ) {

		this.x /= v.x;
		this.y /= v.y;
		this.z /= v.z;

		return this;

	}

	/**
	 * Divides this vector by the given scalar.
	 *
	 * @param {number} scalar - The scalar to divide.
	 * @return {Vector3} A reference to this vector.
	 */
	divideScalar( scalar ) {

		return this.multiplyScalar( 1 / scalar );

	}

	/**
	 * If this vector's x, y or z value is greater than the given vector's x, y or z
	 * value, replace that value with the corresponding min value.
	 *
	 * @param {Vector3} v - The vector.
	 * @return {Vector3} A reference to this vector.
	 */
	min( v ) {

		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );
		this.z = Math.min( this.z, v.z );

		return this;

	}

	/**
	 * If this vector's x, y or z value is less than the given vector's x, y or z
	 * value, replace that value with the corresponding max value.
	 *
	 * @param {Vector3} v - The vector.
	 * @return {Vector3} A reference to this vector.
	 */
	max( v ) {

		this.x = Math.max( this.x, v.x );
		this.y = Math.max( this.y, v.y );
		this.z = Math.max( this.z, v.z );

		return this;

	}

	/**
	 * If this vector's x, y or z value is greater than the max vector's x, y or z
	 * value, it is replaced by the corresponding value.
	 * If this vector's x, y or z value is less than the min vector's x, y or z value,
	 * it is replaced by the corresponding value.
	 *
	 * @param {Vector3} min - The minimum x, y and z values.
	 * @param {Vector3} max - The maximum x, y and z values in the desired range.
	 * @return {Vector3} A reference to this vector.
	 */
	clamp( min, max ) {

		// assumes min < max, componentwise

		this.x = clamp( this.x, min.x, max.x );
		this.y = clamp( this.y, min.y, max.y );
		this.z = clamp( this.z, min.z, max.z );

		return this;

	}

	/**
	 * If this vector's x, y or z values are greater than the max value, they are
	 * replaced by the max value.
	 * If this vector's x, y or z values are less than the min value, they are
	 * replaced by the min value.
	 *
	 * @param {number} minVal - The minimum value the components will be clamped to.
	 * @param {number} maxVal - The maximum value the components will be clamped to.
	 * @return {Vector3} A reference to this vector.
	 */
	clampScalar( minVal, maxVal ) {

		this.x = clamp( this.x, minVal, maxVal );
		this.y = clamp( this.y, minVal, maxVal );
		this.z = clamp( this.z, minVal, maxVal );

		return this;

	}

	/**
	 * If this vector's length is greater than the max value, it is replaced by
	 * the max value.
	 * If this vector's length is less than the min value, it is replaced by the
	 * min value.
	 *
	 * @param {number} min - The minimum value the vector length will be clamped to.
	 * @param {number} max - The maximum value the vector length will be clamped to.
	 * @return {Vector3} A reference to this vector.
	 */
	clampLength( min, max ) {

		const length = this.length();

		return this.divideScalar( length || 1 ).multiplyScalar( clamp( length, min, max ) );

	}

	/**
	 * The components of this vector are rounded down to the nearest integer value.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	floor() {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );
		this.z = Math.floor( this.z );

		return this;

	}

	/**
	 * The components of this vector are rounded up to the nearest integer value.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	ceil() {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );
		this.z = Math.ceil( this.z );

		return this;

	}

	/**
	 * The components of this vector are rounded to the nearest integer value
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	round() {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );
		this.z = Math.round( this.z );

		return this;

	}

	/**
	 * The components of this vector are rounded towards zero (up if negative,
	 * down if positive) to an integer value.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	roundToZero() {

		this.x = Math.trunc( this.x );
		this.y = Math.trunc( this.y );
		this.z = Math.trunc( this.z );

		return this;

	}

	/**
	 * Inverts this vector - i.e. sets x = -x, y = -y and z = -z.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	negate() {

		this.x = - this.x;
		this.y = - this.y;
		this.z = - this.z;

		return this;

	}

	/**
	 * Calculates the dot product of the given vector with this instance.
	 *
	 * @param {Vector3} v - The vector to compute the dot product with.
	 * @return {number} The result of the dot product.
	 */
	dot( v ) {

		return this.x * v.x + this.y * v.y + this.z * v.z;

	}

	/**
	 * Computes the square of the Euclidean length (straight-line length) from
	 * (0, 0, 0) to (x, y, z). If you are comparing the lengths of vectors, you should
	 * compare the length squared instead as it is slightly more efficient to calculate.
	 *
	 * @return {number} The square length of this vector.
	 */
	lengthSq() {

		return this.x * this.x + this.y * this.y + this.z * this.z;

	}

	/**
	 * Computes the  Euclidean length (straight-line length) from (0, 0, 0) to (x, y, z).
	 *
	 * @return {number} The length of this vector.
	 */
	length() {

		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

	}

	/**
	 * Computes the Manhattan length of this vector.
	 *
	 * @return {number} The length of this vector.
	 */
	manhattanLength() {

		return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );

	}

	/**
	 * Converts this vector to a unit vector - that is, sets it equal to a vector
	 * with the same direction as this one, but with a vector length of `1`.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	normalize() {

		return this.divideScalar( this.length() || 1 );

	}

	/**
	 * Sets this vector to a vector with the same direction as this one, but
	 * with the specified length.
	 *
	 * @param {number} length - The new length of this vector.
	 * @return {Vector3} A reference to this vector.
	 */
	setLength( length ) {

		return this.normalize().multiplyScalar( length );

	}

	/**
	 * Linearly interpolates between the given vector and this instance, where
	 * alpha is the percent distance along the line - alpha = 0 will be this
	 * vector, and alpha = 1 will be the given one.
	 *
	 * @param {Vector3} v - The vector to interpolate towards.
	 * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
	 * @return {Vector3} A reference to this vector.
	 */
	lerp( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;
		this.z += ( v.z - this.z ) * alpha;

		return this;

	}

	/**
	 * Linearly interpolates between the given vectors, where alpha is the percent
	 * distance along the line - alpha = 0 will be first vector, and alpha = 1 will
	 * be the second one. The result is stored in this instance.
	 *
	 * @param {Vector3} v1 - The first vector.
	 * @param {Vector3} v2 - The second vector.
	 * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
	 * @return {Vector3} A reference to this vector.
	 */
	lerpVectors( v1, v2, alpha ) {

		this.x = v1.x + ( v2.x - v1.x ) * alpha;
		this.y = v1.y + ( v2.y - v1.y ) * alpha;
		this.z = v1.z + ( v2.z - v1.z ) * alpha;

		return this;

	}

	/**
	 * Calculates the cross product of the given vector with this instance.
	 *
	 * @param {Vector3} v - The vector to compute the cross product with.
	 * @return {Vector3} The result of the cross product.
	 */
	cross( v ) {

		return this.crossVectors( this, v );

	}

	/**
	 * Calculates the cross product of the given vectors and stores the result
	 * in this instance.
	 *
	 * @param {Vector3} a - The first vector.
	 * @param {Vector3} b - The second vector.
	 * @return {Vector3} A reference to this vector.
	 */
	crossVectors( a, b ) {

		const ax = a.x, ay = a.y, az = a.z;
		const bx = b.x, by = b.y, bz = b.z;

		this.x = ay * bz - az * by;
		this.y = az * bx - ax * bz;
		this.z = ax * by - ay * bx;

		return this;

	}

	/**
	 * Projects this vector onto the given one.
	 *
	 * @param {Vector3} v - The vector to project to.
	 * @return {Vector3} A reference to this vector.
	 */
	projectOnVector( v ) {

		const denominator = v.lengthSq();

		if ( denominator === 0 ) return this.set( 0, 0, 0 );

		const scalar = v.dot( this ) / denominator;

		return this.copy( v ).multiplyScalar( scalar );

	}

	/**
	 * Projects this vector onto a plane by subtracting this
	 * vector projected onto the plane's normal from this vector.
	 *
	 * @param {Vector3} planeNormal - The plane normal.
	 * @return {Vector3} A reference to this vector.
	 */
	projectOnPlane( planeNormal ) {

		_vector$c.copy( this ).projectOnVector( planeNormal );

		return this.sub( _vector$c );

	}

	/**
	 * Reflects this vector off a plane orthogonal to the given normal vector.
	 *
	 * @param {Vector3} normal - The (normalized) normal vector.
	 * @return {Vector3} A reference to this vector.
	 */
	reflect( normal ) {

		return this.sub( _vector$c.copy( normal ).multiplyScalar( 2 * this.dot( normal ) ) );

	}
	/**
	 * Returns the angle between the given vector and this instance in radians.
	 *
	 * @param {Vector3} v - The vector to compute the angle with.
	 * @return {number} The angle in radians.
	 */
	angleTo( v ) {

		const denominator = Math.sqrt( this.lengthSq() * v.lengthSq() );

		if ( denominator === 0 ) return Math.PI / 2;

		const theta = this.dot( v ) / denominator;

		// clamp, to handle numerical problems

		return Math.acos( clamp( theta, -1, 1 ) );

	}

	/**
	 * Computes the distance from the given vector to this instance.
	 *
	 * @param {Vector3} v - The vector to compute the distance to.
	 * @return {number} The distance.
	 */
	distanceTo( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	}

	/**
	 * Computes the squared distance from the given vector to this instance.
	 * If you are just comparing the distance with another distance, you should compare
	 * the distance squared instead as it is slightly more efficient to calculate.
	 *
	 * @param {Vector3} v - The vector to compute the squared distance to.
	 * @return {number} The squared distance.
	 */
	distanceToSquared( v ) {

		const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;

		return dx * dx + dy * dy + dz * dz;

	}

	/**
	 * Computes the Manhattan distance from the given vector to this instance.
	 *
	 * @param {Vector3} v - The vector to compute the Manhattan distance to.
	 * @return {number} The Manhattan distance.
	 */
	manhattanDistanceTo( v ) {

		return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y ) + Math.abs( this.z - v.z );

	}

	/**
	 * Sets the vector components from the given spherical coordinates.
	 *
	 * @param {Spherical} s - The spherical coordinates.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromSpherical( s ) {

		return this.setFromSphericalCoords( s.radius, s.phi, s.theta );

	}

	/**
	 * Sets the vector components from the given spherical coordinates.
	 *
	 * @param {number} radius - The radius.
	 * @param {number} phi - The phi angle in radians.
	 * @param {number} theta - The theta angle in radians.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromSphericalCoords( radius, phi, theta ) {

		const sinPhiRadius = Math.sin( phi ) * radius;

		this.x = sinPhiRadius * Math.sin( theta );
		this.y = Math.cos( phi ) * radius;
		this.z = sinPhiRadius * Math.cos( theta );

		return this;

	}

	/**
	 * Sets the vector components from the given cylindrical coordinates.
	 *
	 * @param {Cylindrical} c - The cylindrical coordinates.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromCylindrical( c ) {

		return this.setFromCylindricalCoords( c.radius, c.theta, c.y );

	}

	/**
	 * Sets the vector components from the given cylindrical coordinates.
	 *
	 * @param {number} radius - The radius.
	 * @param {number} theta - The theta angle in radians.
	 * @param {number} y - The y value.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromCylindricalCoords( radius, theta, y ) {

		this.x = radius * Math.sin( theta );
		this.y = y;
		this.z = radius * Math.cos( theta );

		return this;

	}

	/**
	 * Sets the vector components to the position elements of the
	 * given transformation matrix.
	 *
	 * @param {Matrix4} m - The 4x4 matrix.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromMatrixPosition( m ) {

		const e = m.elements;

		this.x = e[ 12 ];
		this.y = e[ 13 ];
		this.z = e[ 14 ];

		return this;

	}

	/**
	 * Sets the vector components to the scale elements of the
	 * given transformation matrix.
	 *
	 * @param {Matrix4} m - The 4x4 matrix.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromMatrixScale( m ) {

		const sx = this.setFromMatrixColumn( m, 0 ).length();
		const sy = this.setFromMatrixColumn( m, 1 ).length();
		const sz = this.setFromMatrixColumn( m, 2 ).length();

		this.x = sx;
		this.y = sy;
		this.z = sz;

		return this;

	}

	/**
	 * Sets the vector components from the specified matrix column.
	 *
	 * @param {Matrix4} m - The 4x4 matrix.
	 * @param {number} index - The column index.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromMatrixColumn( m, index ) {

		return this.fromArray( m.elements, index * 4 );

	}

	/**
	 * Sets the vector components from the specified matrix column.
	 *
	 * @param {Matrix3} m - The 3x3 matrix.
	 * @param {number} index - The column index.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromMatrix3Column( m, index ) {

		return this.fromArray( m.elements, index * 3 );

	}

	/**
	 * Sets the vector components from the given Euler angles.
	 *
	 * @param {Euler} e - The Euler angles to set.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromEuler( e ) {

		this.x = e._x;
		this.y = e._y;
		this.z = e._z;

		return this;

	}

	/**
	 * Sets the vector components from the RGB components of the
	 * given color.
	 *
	 * @param {Color} c - The color to set.
	 * @return {Vector3} A reference to this vector.
	 */
	setFromColor( c ) {

		this.x = c.r;
		this.y = c.g;
		this.z = c.b;

		return this;

	}

	/**
	 * Returns `true` if this vector is equal with the given one.
	 *
	 * @param {Vector3} v - The vector to test for equality.
	 * @return {boolean} Whether this vector is equal with the given one.
	 */
	equals( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );

	}

	/**
	 * Sets this vector's x value to be `array[ offset ]`, y value to be `array[ offset + 1 ]`
	 * and z value to be `array[ offset + 2 ]`.
	 *
	 * @param {Array<number>} array - An array holding the vector component values.
	 * @param {number} [offset=0] - The offset into the array.
	 * @return {Vector3} A reference to this vector.
	 */
	fromArray( array, offset = 0 ) {

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];
		this.z = array[ offset + 2 ];

		return this;

	}

	/**
	 * Writes the components of this vector to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number>} [array=[]] - The target array holding the vector components.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number>} The vector components.
	 */
	toArray( array = [], offset = 0 ) {

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;
		array[ offset + 2 ] = this.z;

		return array;

	}

	/**
	 * Sets the components of this vector from the given buffer attribute.
	 *
	 * @param {BufferAttribute} attribute - The buffer attribute holding vector data.
	 * @param {number} index - The index into the attribute.
	 * @return {Vector3} A reference to this vector.
	 */
	fromBufferAttribute( attribute, index ) {

		this.x = attribute.getX( index );
		this.y = attribute.getY( index );
		this.z = attribute.getZ( index );

		return this;

	}

	/**
	 * Sets each component of this vector to a pseudo-random value between `0` and
	 * `1`, excluding `1`.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	random() {

		this.x = Math.random();
		this.y = Math.random();
		this.z = Math.random();

		return this;

	}

	/**
	 * Sets this vector to a uniformly random point on a unit sphere.
	 *
	 * @return {Vector3} A reference to this vector.
	 */
	randomDirection() {

		// https://mathworld.wolfram.com/SpherePointPicking.html

		const theta = Math.random() * Math.PI * 2;
		const u = Math.random() * 2 - 1;
		const c = Math.sqrt( 1 - u * u );

		this.x = c * Math.cos( theta );
		this.y = u;
		this.z = c * Math.sin( theta );

		return this;

	}

	*[ Symbol.iterator ]() {

		yield this.x;
		yield this.y;
		yield this.z;

	}

}

const _vector$c = /*@__PURE__*/ new Vector3();
const _quaternion$5 = /*@__PURE__*/ new Quaternion();

/**
 * Represents a 3x3 matrix.
 *
 * A Note on Row-Major and Column-Major Ordering:
 *
 * The constructor and {@link Matrix3#set} method take arguments in
 * [row-major](https://en.wikipedia.org/wiki/Row-_and_column-major_order#Column-major_order)
 * order, while internally they are stored in the {@link Matrix3#elements} array in column-major order.
 * This means that calling:
 * ```js
 * const m = new THREE.Matrix();
 * m.set( 11, 12, 13,
 *        21, 22, 23,
 *        31, 32, 33 );
 * ```
 * will result in the elements array containing:
 * ```js
 * m.elements = [ 11, 21, 31,
 *                12, 22, 32,
 *                13, 23, 33 ];
 * ```
 * and internally all calculations are performed using column-major ordering.
 * However, as the actual ordering makes no difference mathematically and
 * most people are used to thinking about matrices in row-major order, the
 * three.js documentation shows matrices in row-major order. Just bear in
 * mind that if you are reading the source code, you'll have to take the
 * transpose of any matrices outlined here to make sense of the calculations.
 */
class Matrix3 {

	static {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		Matrix3.prototype.isMatrix3 = true;

	}

	/**
	 * Constructs a new 3x3 matrix. The arguments are supposed to be
	 * in row-major order. If no arguments are provided, the constructor
	 * initializes the matrix as an identity matrix.
	 *
	 * @param {number} [n11] - 1-1 matrix element.
	 * @param {number} [n12] - 1-2 matrix element.
	 * @param {number} [n13] - 1-3 matrix element.
	 * @param {number} [n21] - 2-1 matrix element.
	 * @param {number} [n22] - 2-2 matrix element.
	 * @param {number} [n23] - 2-3 matrix element.
	 * @param {number} [n31] - 3-1 matrix element.
	 * @param {number} [n32] - 3-2 matrix element.
	 * @param {number} [n33] - 3-3 matrix element.
	 */
	constructor( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

		/**
		 * A column-major list of matrix values.
		 *
		 * @type {Array<number>}
		 */
		this.elements = [

			1, 0, 0,
			0, 1, 0,
			0, 0, 1

		];

		if ( n11 !== undefined ) {

			this.set( n11, n12, n13, n21, n22, n23, n31, n32, n33 );

		}

	}

	/**
	 * Sets the elements of the matrix.The arguments are supposed to be
	 * in row-major order.
	 *
	 * @param {number} [n11] - 1-1 matrix element.
	 * @param {number} [n12] - 1-2 matrix element.
	 * @param {number} [n13] - 1-3 matrix element.
	 * @param {number} [n21] - 2-1 matrix element.
	 * @param {number} [n22] - 2-2 matrix element.
	 * @param {number} [n23] - 2-3 matrix element.
	 * @param {number} [n31] - 3-1 matrix element.
	 * @param {number} [n32] - 3-2 matrix element.
	 * @param {number} [n33] - 3-3 matrix element.
	 * @return {Matrix3} A reference to this matrix.
	 */
	set( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

		const te = this.elements;

		te[ 0 ] = n11; te[ 1 ] = n21; te[ 2 ] = n31;
		te[ 3 ] = n12; te[ 4 ] = n22; te[ 5 ] = n32;
		te[ 6 ] = n13; te[ 7 ] = n23; te[ 8 ] = n33;

		return this;

	}

	/**
	 * Sets this matrix to the 3x3 identity matrix.
	 *
	 * @return {Matrix3} A reference to this matrix.
	 */
	identity() {

		this.set(

			1, 0, 0,
			0, 1, 0,
			0, 0, 1

		);

		return this;

	}

	/**
	 * Copies the values of the given matrix to this instance.
	 *
	 * @param {Matrix3} m - The matrix to copy.
	 * @return {Matrix3} A reference to this matrix.
	 */
	copy( m ) {

		const te = this.elements;
		const me = m.elements;

		te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ];
		te[ 3 ] = me[ 3 ]; te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ];
		te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ]; te[ 8 ] = me[ 8 ];

		return this;

	}

	/**
	 * Extracts the basis of this matrix into the three axis vectors provided.
	 *
	 * @param {Vector3} xAxis - The basis's x axis.
	 * @param {Vector3} yAxis - The basis's y axis.
	 * @param {Vector3} zAxis - The basis's z axis.
	 * @return {Matrix3} A reference to this matrix.
	 */
	extractBasis( xAxis, yAxis, zAxis ) {

		xAxis.setFromMatrix3Column( this, 0 );
		yAxis.setFromMatrix3Column( this, 1 );
		zAxis.setFromMatrix3Column( this, 2 );

		return this;

	}

	/**
	 * Set this matrix to the upper 3x3 matrix of the given 4x4 matrix.
	 *
	 * @param {Matrix4} m - The 4x4 matrix.
	 * @return {Matrix3} A reference to this matrix.
	 */
	setFromMatrix4( m ) {

		const me = m.elements;

		this.set(

			me[ 0 ], me[ 4 ], me[ 8 ],
			me[ 1 ], me[ 5 ], me[ 9 ],
			me[ 2 ], me[ 6 ], me[ 10 ]

		);

		return this;

	}

	/**
	 * Post-multiplies this matrix by the given 3x3 matrix.
	 *
	 * @param {Matrix3} m - The matrix to multiply with.
	 * @return {Matrix3} A reference to this matrix.
	 */
	multiply( m ) {

		return this.multiplyMatrices( this, m );

	}

	/**
	 * Pre-multiplies this matrix by the given 3x3 matrix.
	 *
	 * @param {Matrix3} m - The matrix to multiply with.
	 * @return {Matrix3} A reference to this matrix.
	 */
	premultiply( m ) {

		return this.multiplyMatrices( m, this );

	}

	/**
	 * Multiples the given 3x3 matrices and stores the result
	 * in this matrix.
	 *
	 * @param {Matrix3} a - The first matrix.
	 * @param {Matrix3} b - The second matrix.
	 * @return {Matrix3} A reference to this matrix.
	 */
	multiplyMatrices( a, b ) {

		const ae = a.elements;
		const be = b.elements;
		const te = this.elements;

		const a11 = ae[ 0 ], a12 = ae[ 3 ], a13 = ae[ 6 ];
		const a21 = ae[ 1 ], a22 = ae[ 4 ], a23 = ae[ 7 ];
		const a31 = ae[ 2 ], a32 = ae[ 5 ], a33 = ae[ 8 ];

		const b11 = be[ 0 ], b12 = be[ 3 ], b13 = be[ 6 ];
		const b21 = be[ 1 ], b22 = be[ 4 ], b23 = be[ 7 ];
		const b31 = be[ 2 ], b32 = be[ 5 ], b33 = be[ 8 ];

		te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31;
		te[ 3 ] = a11 * b12 + a12 * b22 + a13 * b32;
		te[ 6 ] = a11 * b13 + a12 * b23 + a13 * b33;

		te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31;
		te[ 4 ] = a21 * b12 + a22 * b22 + a23 * b32;
		te[ 7 ] = a21 * b13 + a22 * b23 + a23 * b33;

		te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31;
		te[ 5 ] = a31 * b12 + a32 * b22 + a33 * b32;
		te[ 8 ] = a31 * b13 + a32 * b23 + a33 * b33;

		return this;

	}

	/**
	 * Multiplies every component of the matrix by the given scalar.
	 *
	 * @param {number} s - The scalar.
	 * @return {Matrix3} A reference to this matrix.
	 */
	multiplyScalar( s ) {

		const te = this.elements;

		te[ 0 ] *= s; te[ 3 ] *= s; te[ 6 ] *= s;
		te[ 1 ] *= s; te[ 4 ] *= s; te[ 7 ] *= s;
		te[ 2 ] *= s; te[ 5 ] *= s; te[ 8 ] *= s;

		return this;

	}

	/**
	 * Computes and returns the determinant of this matrix.
	 *
	 * @return {number} The determinant.
	 */
	determinant() {

		const te = this.elements;

		const a = te[ 0 ], b = te[ 1 ], c = te[ 2 ],
			d = te[ 3 ], e = te[ 4 ], f = te[ 5 ],
			g = te[ 6 ], h = te[ 7 ], i = te[ 8 ];

		return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;

	}

	/**
	 * Inverts this matrix, using the [analytic method](https://en.wikipedia.org/wiki/Invertible_matrix#Analytic_solution).
	 * You can not invert with a determinant of zero. If you attempt this, the method produces
	 * a zero matrix instead.
	 *
	 * @return {Matrix3} A reference to this matrix.
	 */
	invert() {

		const te = this.elements,

			n11 = te[ 0 ], n21 = te[ 1 ], n31 = te[ 2 ],
			n12 = te[ 3 ], n22 = te[ 4 ], n32 = te[ 5 ],
			n13 = te[ 6 ], n23 = te[ 7 ], n33 = te[ 8 ],

			t11 = n33 * n22 - n32 * n23,
			t12 = n32 * n13 - n33 * n12,
			t13 = n23 * n12 - n22 * n13,

			det = n11 * t11 + n21 * t12 + n31 * t13;

		if ( det === 0 ) return this.set( 0, 0, 0, 0, 0, 0, 0, 0, 0 );

		const detInv = 1 / det;

		te[ 0 ] = t11 * detInv;
		te[ 1 ] = ( n31 * n23 - n33 * n21 ) * detInv;
		te[ 2 ] = ( n32 * n21 - n31 * n22 ) * detInv;

		te[ 3 ] = t12 * detInv;
		te[ 4 ] = ( n33 * n11 - n31 * n13 ) * detInv;
		te[ 5 ] = ( n31 * n12 - n32 * n11 ) * detInv;

		te[ 6 ] = t13 * detInv;
		te[ 7 ] = ( n21 * n13 - n23 * n11 ) * detInv;
		te[ 8 ] = ( n22 * n11 - n21 * n12 ) * detInv;

		return this;

	}

	/**
	 * Transposes this matrix in place.
	 *
	 * @return {Matrix3} A reference to this matrix.
	 */
	transpose() {

		let tmp;
		const m = this.elements;

		tmp = m[ 1 ]; m[ 1 ] = m[ 3 ]; m[ 3 ] = tmp;
		tmp = m[ 2 ]; m[ 2 ] = m[ 6 ]; m[ 6 ] = tmp;
		tmp = m[ 5 ]; m[ 5 ] = m[ 7 ]; m[ 7 ] = tmp;

		return this;

	}

	/**
	 * Computes the normal matrix which is the inverse transpose of the upper
	 * left 3x3 portion of the given 4x4 matrix.
	 *
	 * @param {Matrix4} matrix4 - The 4x4 matrix.
	 * @return {Matrix3} A reference to this matrix.
	 */
	getNormalMatrix( matrix4 ) {

		return this.setFromMatrix4( matrix4 ).invert().transpose();

	}

	/**
	 * Transposes this matrix into the supplied array, and returns itself unchanged.
	 *
	 * @param {Array<number>} r - An array to store the transposed matrix elements.
	 * @return {Matrix3} A reference to this matrix.
	 */
	transposeIntoArray( r ) {

		const m = this.elements;

		r[ 0 ] = m[ 0 ];
		r[ 1 ] = m[ 3 ];
		r[ 2 ] = m[ 6 ];
		r[ 3 ] = m[ 1 ];
		r[ 4 ] = m[ 4 ];
		r[ 5 ] = m[ 7 ];
		r[ 6 ] = m[ 2 ];
		r[ 7 ] = m[ 5 ];
		r[ 8 ] = m[ 8 ];

		return this;

	}

	/**
	 * Sets the UV transform matrix from offset, repeat, rotation, and center.
	 *
	 * @param {number} tx - Offset x.
	 * @param {number} ty - Offset y.
	 * @param {number} sx - Repeat x.
	 * @param {number} sy - Repeat y.
	 * @param {number} rotation - Rotation, in radians. Positive values rotate counterclockwise.
	 * @param {number} cx - Center x of rotation.
	 * @param {number} cy - Center y of rotation
	 * @return {Matrix3} A reference to this matrix.
	 */
	setUvTransform( tx, ty, sx, sy, rotation, cx, cy ) {

		const c = Math.cos( rotation );
		const s = Math.sin( rotation );

		this.set(
			sx * c, sx * s, - sx * ( c * cx + s * cy ) + cx + tx,
			- sy * s, sy * c, - sy * ( - s * cx + c * cy ) + cy + ty,
			0, 0, 1
		);

		return this;

	}

	/**
	 * Scales this matrix with the given scalar values.
	 *
	 * @param {number} sx - The amount to scale in the X axis.
	 * @param {number} sy - The amount to scale in the Y axis.
	 * @return {Matrix3} A reference to this matrix.
	 */
	scale( sx, sy ) {

		this.premultiply( _m3.makeScale( sx, sy ) );

		return this;

	}

	/**
	 * Rotates this matrix by the given angle.
	 *
	 * @param {number} theta - The rotation in radians.
	 * @return {Matrix3} A reference to this matrix.
	 */
	rotate( theta ) {

		this.premultiply( _m3.makeRotation( - theta ) );

		return this;

	}

	/**
	 * Translates this matrix by the given scalar values.
	 *
	 * @param {number} tx - The amount to translate in the X axis.
	 * @param {number} ty - The amount to translate in the Y axis.
	 * @return {Matrix3} A reference to this matrix.
	 */
	translate( tx, ty ) {

		this.premultiply( _m3.makeTranslation( tx, ty ) );

		return this;

	}

	// for 2D Transforms

	/**
	 * Sets this matrix as a 2D translation transform.
	 *
	 * @param {number|Vector2} x - The amount to translate in the X axis or alternatively a translation vector.
	 * @param {number} y - The amount to translate in the Y axis.
	 * @return {Matrix3} A reference to this matrix.
	 */
	makeTranslation( x, y ) {

		if ( x.isVector2 ) {

			this.set(

				1, 0, x.x,
				0, 1, x.y,
				0, 0, 1

			);

		} else {

			this.set(

				1, 0, x,
				0, 1, y,
				0, 0, 1

			);

		}

		return this;

	}

	/**
	 * Sets this matrix as a 2D rotational transformation.
	 *
	 * @param {number} theta - The rotation in radians.
	 * @return {Matrix3} A reference to this matrix.
	 */
	makeRotation( theta ) {

		// counterclockwise

		const c = Math.cos( theta );
		const s = Math.sin( theta );

		this.set(

			c, - s, 0,
			s, c, 0,
			0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix as a 2D scale transform.
	 *
	 * @param {number} x - The amount to scale in the X axis.
	 * @param {number} y - The amount to scale in the Y axis.
	 * @return {Matrix3} A reference to this matrix.
	 */
	makeScale( x, y ) {

		this.set(

			x, 0, 0,
			0, y, 0,
			0, 0, 1

		);

		return this;

	}

	/**
	 * Returns `true` if this matrix is equal with the given one.
	 *
	 * @param {Matrix3} matrix - The matrix to test for equality.
	 * @return {boolean} Whether this matrix is equal with the given one.
	 */
	equals( matrix ) {

		const te = this.elements;
		const me = matrix.elements;

		for ( let i = 0; i < 9; i ++ ) {

			if ( te[ i ] !== me[ i ] ) return false;

		}

		return true;

	}

	/**
	 * Sets the elements of the matrix from the given array.
	 *
	 * @param {Array<number>} array - The matrix elements in column-major order.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Matrix3} A reference to this matrix.
	 */
	fromArray( array, offset = 0 ) {

		for ( let i = 0; i < 9; i ++ ) {

			this.elements[ i ] = array[ i + offset ];

		}

		return this;

	}

	/**
	 * Writes the elements of this matrix to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number>} [array=[]] - The target array holding the matrix elements in column-major order.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number>} The matrix elements in column-major order.
	 */
	toArray( array = [], offset = 0 ) {

		const te = this.elements;

		array[ offset ] = te[ 0 ];
		array[ offset + 1 ] = te[ 1 ];
		array[ offset + 2 ] = te[ 2 ];

		array[ offset + 3 ] = te[ 3 ];
		array[ offset + 4 ] = te[ 4 ];
		array[ offset + 5 ] = te[ 5 ];

		array[ offset + 6 ] = te[ 6 ];
		array[ offset + 7 ] = te[ 7 ];
		array[ offset + 8 ] = te[ 8 ];

		return array;

	}

	/**
	 * Returns a matrix with copied values from this instance.
	 *
	 * @return {Matrix3} A clone of this instance.
	 */
	clone() {

		return new this.constructor().fromArray( this.elements );

	}

}

const _m3 = /*@__PURE__*/ new Matrix3();

/**
 * Class representing a 4D vector. A 4D vector is an ordered quadruplet of numbers
 * (labeled x, y, z and w), which can be used to represent a number of things, such as:
 *
 * - A point in 4D space.
 * - A direction and length in 4D space. In three.js the length will
 * always be the Euclidean distance(straight-line distance) from `(0, 0, 0, 0)` to `(x, y, z, w)`
 * and the direction is also measured from `(0, 0, 0, 0)` towards `(x, y, z, w)`.
 * - Any arbitrary ordered quadruplet of numbers.
 *
 * There are other things a 4D vector can be used to represent, however these
 * are the most common uses in *three.js*.
 *
 * Iterating through a vector instance will yield its components `(x, y, z, w)` in
 * the corresponding order.
 * ```js
 * const a = new THREE.Vector4( 0, 1, 0, 0 );
 *
 * //no arguments; will be initialised to (0, 0, 0, 1)
 * const b = new THREE.Vector4( );
 *
 * const d = a.dot( b );
 * ```
 */
class Vector4 {

	static {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		Vector4.prototype.isVector4 = true;

	}

	/**
	 * Constructs a new 4D vector.
	 *
	 * @param {number} [x=0] - The x value of this vector.
	 * @param {number} [y=0] - The y value of this vector.
	 * @param {number} [z=0] - The z value of this vector.
	 * @param {number} [w=1] - The w value of this vector.
	 */
	constructor( x = 0, y = 0, z = 0, w = 1 ) {

		/**
		 * The x value of this vector.
		 *
		 * @type {number}
		 */
		this.x = x;

		/**
		 * The y value of this vector.
		 *
		 * @type {number}
		 */
		this.y = y;

		/**
		 * The z value of this vector.
		 *
		 * @type {number}
		 */
		this.z = z;

		/**
		 * The w value of this vector.
		 *
		 * @type {number}
		 */
		this.w = w;

	}

	/**
	 * Alias for {@link Vector4#z}.
	 *
	 * @type {number}
	 */
	get width() {

		return this.z;

	}

	set width( value ) {

		this.z = value;

	}

	/**
	 * Alias for {@link Vector4#w}.
	 *
	 * @type {number}
	 */
	get height() {

		return this.w;

	}

	set height( value ) {

		this.w = value;

	}

	/**
	 * Sets the vector components.
	 *
	 * @param {number} x - The value of the x component.
	 * @param {number} y - The value of the y component.
	 * @param {number} z - The value of the z component.
	 * @param {number} w - The value of the w component.
	 * @return {Vector4} A reference to this vector.
	 */
	set( x, y, z, w ) {

		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;

		return this;

	}

	/**
	 * Sets the vector components to the same value.
	 *
	 * @param {number} scalar - The value to set for all vector components.
	 * @return {Vector4} A reference to this vector.
	 */
	setScalar( scalar ) {

		this.x = scalar;
		this.y = scalar;
		this.z = scalar;
		this.w = scalar;

		return this;

	}

	/**
	 * Sets the vector's x component to the given value
	 *
	 * @param {number} x - The value to set.
	 * @return {Vector4} A reference to this vector.
	 */
	setX( x ) {

		this.x = x;

		return this;

	}

	/**
	 * Sets the vector's y component to the given value
	 *
	 * @param {number} y - The value to set.
	 * @return {Vector4} A reference to this vector.
	 */
	setY( y ) {

		this.y = y;

		return this;

	}

	/**
	 * Sets the vector's z component to the given value
	 *
	 * @param {number} z - The value to set.
	 * @return {Vector4} A reference to this vector.
	 */
	setZ( z ) {

		this.z = z;

		return this;

	}

	/**
	 * Sets the vector's w component to the given value
	 *
	 * @param {number} w - The value to set.
	 * @return {Vector4} A reference to this vector.
	 */
	setW( w ) {

		this.w = w;

		return this;

	}

	/**
	 * Allows to set a vector component with an index.
	 *
	 * @param {number} index - The component index. `0` equals to x, `1` equals to y,
	 * `2` equals to z, `3` equals to w.
	 * @param {number} value - The value to set.
	 * @return {Vector4} A reference to this vector.
	 */
	setComponent( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			case 2: this.z = value; break;
			case 3: this.w = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

		return this;

	}

	/**
	 * Returns the value of the vector component which matches the given index.
	 *
	 * @param {number} index - The component index. `0` equals to x, `1` equals to y,
	 * `2` equals to z, `3` equals to w.
	 * @return {number} A vector component value.
	 */
	getComponent( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			case 3: return this.w;
			default: throw new Error( 'index is out of range: ' + index );

		}

	}

	/**
	 * Returns a new vector with copied values from this instance.
	 *
	 * @return {Vector4} A clone of this instance.
	 */
	clone() {

		return new this.constructor( this.x, this.y, this.z, this.w );

	}

	/**
	 * Copies the values of the given vector to this instance.
	 *
	 * @param {Vector3|Vector4} v - The vector to copy.
	 * @return {Vector4} A reference to this vector.
	 */
	copy( v ) {

		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
		this.w = ( v.w !== undefined ) ? v.w : 1;

		return this;

	}

	/**
	 * Adds the given vector to this instance.
	 *
	 * @param {Vector4} v - The vector to add.
	 * @return {Vector4} A reference to this vector.
	 */
	add( v ) {

		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		this.w += v.w;

		return this;

	}

	/**
	 * Adds the given scalar value to all components of this instance.
	 *
	 * @param {number} s - The scalar to add.
	 * @return {Vector4} A reference to this vector.
	 */
	addScalar( s ) {

		this.x += s;
		this.y += s;
		this.z += s;
		this.w += s;

		return this;

	}

	/**
	 * Adds the given vectors and stores the result in this instance.
	 *
	 * @param {Vector4} a - The first vector.
	 * @param {Vector4} b - The second vector.
	 * @return {Vector4} A reference to this vector.
	 */
	addVectors( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;
		this.w = a.w + b.w;

		return this;

	}

	/**
	 * Adds the given vector scaled by the given factor to this instance.
	 *
	 * @param {Vector4} v - The vector.
	 * @param {number} s - The factor that scales `v`.
	 * @return {Vector4} A reference to this vector.
	 */
	addScaledVector( v, s ) {

		this.x += v.x * s;
		this.y += v.y * s;
		this.z += v.z * s;
		this.w += v.w * s;

		return this;

	}

	/**
	 * Subtracts the given vector from this instance.
	 *
	 * @param {Vector4} v - The vector to subtract.
	 * @return {Vector4} A reference to this vector.
	 */
	sub( v ) {

		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		this.w -= v.w;

		return this;

	}

	/**
	 * Subtracts the given scalar value from all components of this instance.
	 *
	 * @param {number} s - The scalar to subtract.
	 * @return {Vector4} A reference to this vector.
	 */
	subScalar( s ) {

		this.x -= s;
		this.y -= s;
		this.z -= s;
		this.w -= s;

		return this;

	}

	/**
	 * Subtracts the given vectors and stores the result in this instance.
	 *
	 * @param {Vector4} a - The first vector.
	 * @param {Vector4} b - The second vector.
	 * @return {Vector4} A reference to this vector.
	 */
	subVectors( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;
		this.w = a.w - b.w;

		return this;

	}

	/**
	 * Multiplies the given vector with this instance.
	 *
	 * @param {Vector4} v - The vector to multiply.
	 * @return {Vector4} A reference to this vector.
	 */
	multiply( v ) {

		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;
		this.w *= v.w;

		return this;

	}

	/**
	 * Multiplies the given scalar value with all components of this instance.
	 *
	 * @param {number} scalar - The scalar to multiply.
	 * @return {Vector4} A reference to this vector.
	 */
	multiplyScalar( scalar ) {

		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		this.w *= scalar;

		return this;

	}

	/**
	 * Multiplies this vector with the given 4x4 matrix.
	 *
	 * @param {Matrix4} m - The 4x4 matrix.
	 * @return {Vector4} A reference to this vector.
	 */
	applyMatrix4( m ) {

		const x = this.x, y = this.y, z = this.z, w = this.w;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] * w;
		this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] * w;
		this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] * w;
		this.w = e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] * w;

		return this;

	}

	/**
	 * Divides this instance by the given vector.
	 *
	 * @param {Vector4} v - The vector to divide.
	 * @return {Vector4} A reference to this vector.
	 */
	divide( v ) {

		this.x /= v.x;
		this.y /= v.y;
		this.z /= v.z;
		this.w /= v.w;

		return this;

	}

	/**
	 * Divides this vector by the given scalar.
	 *
	 * @param {number} scalar - The scalar to divide.
	 * @return {Vector4} A reference to this vector.
	 */
	divideScalar( scalar ) {

		return this.multiplyScalar( 1 / scalar );

	}

	/**
	 * Sets the x, y and z components of this
	 * vector to the quaternion's axis and w to the angle.
	 *
	 * @param {Quaternion} q - The Quaternion to set.
	 * @return {Vector4} A reference to this vector.
	 */
	setAxisAngleFromQuaternion( q ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/index.htm

		// q is assumed to be normalized

		this.w = 2 * Math.acos( q.w );

		const s = Math.sqrt( 1 - q.w * q.w );

		if ( s < 0.0001 ) {

			this.x = 1;
			this.y = 0;
			this.z = 0;

		} else {

			this.x = q.x / s;
			this.y = q.y / s;
			this.z = q.z / s;

		}

		return this;

	}

	/**
	 * Sets the x, y and z components of this
	 * vector to the axis of rotation and w to the angle.
	 *
	 * @param {Matrix4} m - A 4x4 matrix of which the upper left 3x3 matrix is a pure rotation matrix.
	 * @return {Vector4} A reference to this vector.
	 */
	setAxisAngleFromRotationMatrix( m ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToAngle/index.htm

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		let angle, x, y, z; // variables for result
		const epsilon = 0.01,		// margin to allow for rounding errors
			epsilon2 = 0.1,		// margin to distinguish between 0 and 180 degrees

			te = m.elements,

			m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
			m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
			m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

		if ( ( Math.abs( m12 - m21 ) < epsilon ) &&
		     ( Math.abs( m13 - m31 ) < epsilon ) &&
		     ( Math.abs( m23 - m32 ) < epsilon ) ) {

			// singularity found
			// first check for identity matrix which must have +1 for all terms
			// in leading diagonal and zero in other terms

			if ( ( Math.abs( m12 + m21 ) < epsilon2 ) &&
			     ( Math.abs( m13 + m31 ) < epsilon2 ) &&
			     ( Math.abs( m23 + m32 ) < epsilon2 ) &&
			     ( Math.abs( m11 + m22 + m33 - 3 ) < epsilon2 ) ) {

				// this singularity is identity matrix so angle = 0

				this.set( 1, 0, 0, 0 );

				return this; // zero angle, arbitrary axis

			}

			// otherwise this singularity is angle = 180

			angle = Math.PI;

			const xx = ( m11 + 1 ) / 2;
			const yy = ( m22 + 1 ) / 2;
			const zz = ( m33 + 1 ) / 2;
			const xy = ( m12 + m21 ) / 4;
			const xz = ( m13 + m31 ) / 4;
			const yz = ( m23 + m32 ) / 4;

			if ( ( xx > yy ) && ( xx > zz ) ) {

				// m11 is the largest diagonal term

				if ( xx < epsilon ) {

					x = 0;
					y = 0.707106781;
					z = 0.707106781;

				} else {

					x = Math.sqrt( xx );
					y = xy / x;
					z = xz / x;

				}

			} else if ( yy > zz ) {

				// m22 is the largest diagonal term

				if ( yy < epsilon ) {

					x = 0.707106781;
					y = 0;
					z = 0.707106781;

				} else {

					y = Math.sqrt( yy );
					x = xy / y;
					z = yz / y;

				}

			} else {

				// m33 is the largest diagonal term so base result on this

				if ( zz < epsilon ) {

					x = 0.707106781;
					y = 0.707106781;
					z = 0;

				} else {

					z = Math.sqrt( zz );
					x = xz / z;
					y = yz / z;

				}

			}

			this.set( x, y, z, angle );

			return this; // return 180 deg rotation

		}

		// as we have reached here there are no singularities so we can handle normally

		let s = Math.sqrt( ( m32 - m23 ) * ( m32 - m23 ) +
			( m13 - m31 ) * ( m13 - m31 ) +
			( m21 - m12 ) * ( m21 - m12 ) ); // used to normalize

		if ( Math.abs( s ) < 0.001 ) s = 1;

		// prevent divide by zero, should not happen if matrix is orthogonal and should be
		// caught by singularity test above, but I've left it in just in case

		this.x = ( m32 - m23 ) / s;
		this.y = ( m13 - m31 ) / s;
		this.z = ( m21 - m12 ) / s;
		this.w = Math.acos( ( m11 + m22 + m33 - 1 ) / 2 );

		return this;

	}

	/**
	 * Sets the vector components to the position elements of the
	 * given transformation matrix.
	 *
	 * @param {Matrix4} m - The 4x4 matrix.
	 * @return {Vector4} A reference to this vector.
	 */
	setFromMatrixPosition( m ) {

		const e = m.elements;

		this.x = e[ 12 ];
		this.y = e[ 13 ];
		this.z = e[ 14 ];
		this.w = e[ 15 ];

		return this;

	}

	/**
	 * If this vector's x, y, z or w value is greater than the given vector's x, y, z or w
	 * value, replace that value with the corresponding min value.
	 *
	 * @param {Vector4} v - The vector.
	 * @return {Vector4} A reference to this vector.
	 */
	min( v ) {

		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );
		this.z = Math.min( this.z, v.z );
		this.w = Math.min( this.w, v.w );

		return this;

	}

	/**
	 * If this vector's x, y, z or w value is less than the given vector's x, y, z or w
	 * value, replace that value with the corresponding max value.
	 *
	 * @param {Vector4} v - The vector.
	 * @return {Vector4} A reference to this vector.
	 */
	max( v ) {

		this.x = Math.max( this.x, v.x );
		this.y = Math.max( this.y, v.y );
		this.z = Math.max( this.z, v.z );
		this.w = Math.max( this.w, v.w );

		return this;

	}

	/**
	 * If this vector's x, y, z or w value is greater than the max vector's x, y, z or w
	 * value, it is replaced by the corresponding value.
	 * If this vector's x, y, z or w value is less than the min vector's x, y, z or w value,
	 * it is replaced by the corresponding value.
	 *
	 * @param {Vector4} min - The minimum x, y and z values.
	 * @param {Vector4} max - The maximum x, y and z values in the desired range.
	 * @return {Vector4} A reference to this vector.
	 */
	clamp( min, max ) {

		// assumes min < max, componentwise

		this.x = clamp( this.x, min.x, max.x );
		this.y = clamp( this.y, min.y, max.y );
		this.z = clamp( this.z, min.z, max.z );
		this.w = clamp( this.w, min.w, max.w );

		return this;

	}

	/**
	 * If this vector's x, y, z or w values are greater than the max value, they are
	 * replaced by the max value.
	 * If this vector's x, y, z or w values are less than the min value, they are
	 * replaced by the min value.
	 *
	 * @param {number} minVal - The minimum value the components will be clamped to.
	 * @param {number} maxVal - The maximum value the components will be clamped to.
	 * @return {Vector4} A reference to this vector.
	 */
	clampScalar( minVal, maxVal ) {

		this.x = clamp( this.x, minVal, maxVal );
		this.y = clamp( this.y, minVal, maxVal );
		this.z = clamp( this.z, minVal, maxVal );
		this.w = clamp( this.w, minVal, maxVal );

		return this;

	}

	/**
	 * If this vector's length is greater than the max value, it is replaced by
	 * the max value.
	 * If this vector's length is less than the min value, it is replaced by the
	 * min value.
	 *
	 * @param {number} min - The minimum value the vector length will be clamped to.
	 * @param {number} max - The maximum value the vector length will be clamped to.
	 * @return {Vector4} A reference to this vector.
	 */
	clampLength( min, max ) {

		const length = this.length();

		return this.divideScalar( length || 1 ).multiplyScalar( clamp( length, min, max ) );

	}

	/**
	 * The components of this vector are rounded down to the nearest integer value.
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	floor() {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );
		this.z = Math.floor( this.z );
		this.w = Math.floor( this.w );

		return this;

	}

	/**
	 * The components of this vector are rounded up to the nearest integer value.
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	ceil() {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );
		this.z = Math.ceil( this.z );
		this.w = Math.ceil( this.w );

		return this;

	}

	/**
	 * The components of this vector are rounded to the nearest integer value
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	round() {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );
		this.z = Math.round( this.z );
		this.w = Math.round( this.w );

		return this;

	}

	/**
	 * The components of this vector are rounded towards zero (up if negative,
	 * down if positive) to an integer value.
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	roundToZero() {

		this.x = Math.trunc( this.x );
		this.y = Math.trunc( this.y );
		this.z = Math.trunc( this.z );
		this.w = Math.trunc( this.w );

		return this;

	}

	/**
	 * Inverts this vector - i.e. sets x = -x, y = -y, z = -z, w = -w.
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	negate() {

		this.x = - this.x;
		this.y = - this.y;
		this.z = - this.z;
		this.w = - this.w;

		return this;

	}

	/**
	 * Calculates the dot product of the given vector with this instance.
	 *
	 * @param {Vector4} v - The vector to compute the dot product with.
	 * @return {number} The result of the dot product.
	 */
	dot( v ) {

		return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;

	}

	/**
	 * Computes the square of the Euclidean length (straight-line length) from
	 * (0, 0, 0, 0) to (x, y, z, w). If you are comparing the lengths of vectors, you should
	 * compare the length squared instead as it is slightly more efficient to calculate.
	 *
	 * @return {number} The square length of this vector.
	 */
	lengthSq() {

		return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;

	}

	/**
	 * Computes the  Euclidean length (straight-line length) from (0, 0, 0, 0) to (x, y, z, w).
	 *
	 * @return {number} The length of this vector.
	 */
	length() {

		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );

	}

	/**
	 * Computes the Manhattan length of this vector.
	 *
	 * @return {number} The length of this vector.
	 */
	manhattanLength() {

		return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z ) + Math.abs( this.w );

	}

	/**
	 * Converts this vector to a unit vector - that is, sets it equal to a vector
	 * with the same direction as this one, but with a vector length of `1`.
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	normalize() {

		return this.divideScalar( this.length() || 1 );

	}

	/**
	 * Sets this vector to a vector with the same direction as this one, but
	 * with the specified length.
	 *
	 * @param {number} length - The new length of this vector.
	 * @return {Vector4} A reference to this vector.
	 */
	setLength( length ) {

		return this.normalize().multiplyScalar( length );

	}

	/**
	 * Linearly interpolates between the given vector and this instance, where
	 * alpha is the percent distance along the line - alpha = 0 will be this
	 * vector, and alpha = 1 will be the given one.
	 *
	 * @param {Vector4} v - The vector to interpolate towards.
	 * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
	 * @return {Vector4} A reference to this vector.
	 */
	lerp( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;
		this.z += ( v.z - this.z ) * alpha;
		this.w += ( v.w - this.w ) * alpha;

		return this;

	}

	/**
	 * Linearly interpolates between the given vectors, where alpha is the percent
	 * distance along the line - alpha = 0 will be first vector, and alpha = 1 will
	 * be the second one. The result is stored in this instance.
	 *
	 * @param {Vector4} v1 - The first vector.
	 * @param {Vector4} v2 - The second vector.
	 * @param {number} alpha - The interpolation factor, typically in the closed interval `[0, 1]`.
	 * @return {Vector4} A reference to this vector.
	 */
	lerpVectors( v1, v2, alpha ) {

		this.x = v1.x + ( v2.x - v1.x ) * alpha;
		this.y = v1.y + ( v2.y - v1.y ) * alpha;
		this.z = v1.z + ( v2.z - v1.z ) * alpha;
		this.w = v1.w + ( v2.w - v1.w ) * alpha;

		return this;

	}

	/**
	 * Returns `true` if this vector is equal with the given one.
	 *
	 * @param {Vector4} v - The vector to test for equality.
	 * @return {boolean} Whether this vector is equal with the given one.
	 */
	equals( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) && ( v.w === this.w ) );

	}

	/**
	 * Sets this vector's x value to be `array[ offset ]`, y value to be `array[ offset + 1 ]`,
	 * z value to be `array[ offset + 2 ]`, w value to be `array[ offset + 3 ]`.
	 *
	 * @param {Array<number>} array - An array holding the vector component values.
	 * @param {number} [offset=0] - The offset into the array.
	 * @return {Vector4} A reference to this vector.
	 */
	fromArray( array, offset = 0 ) {

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];
		this.z = array[ offset + 2 ];
		this.w = array[ offset + 3 ];

		return this;

	}

	/**
	 * Writes the components of this vector to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number>} [array=[]] - The target array holding the vector components.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number>} The vector components.
	 */
	toArray( array = [], offset = 0 ) {

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;
		array[ offset + 2 ] = this.z;
		array[ offset + 3 ] = this.w;

		return array;

	}

	/**
	 * Sets the components of this vector from the given buffer attribute.
	 *
	 * @param {BufferAttribute} attribute - The buffer attribute holding vector data.
	 * @param {number} index - The index into the attribute.
	 * @return {Vector4} A reference to this vector.
	 */
	fromBufferAttribute( attribute, index ) {

		this.x = attribute.getX( index );
		this.y = attribute.getY( index );
		this.z = attribute.getZ( index );
		this.w = attribute.getW( index );

		return this;

	}

	/**
	 * Sets each component of this vector to a pseudo-random value between `0` and
	 * `1`, excluding `1`.
	 *
	 * @return {Vector4} A reference to this vector.
	 */
	random() {

		this.x = Math.random();
		this.y = Math.random();
		this.z = Math.random();
		this.w = Math.random();

		return this;

	}

	*[ Symbol.iterator ]() {

		yield this.x;
		yield this.y;
		yield this.z;
		yield this.w;

	}

}

/**
 * Represents a 4x4 matrix.
 *
 * The most common use of a 4x4 matrix in 3D computer graphics is as a transformation matrix.
 * For an introduction to transformation matrices as used in WebGL, check out [this tutorial](https://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices)
 *
 * This allows a 3D vector representing a point in 3D space to undergo
 * transformations such as translation, rotation, shear, scale, reflection,
 * orthogonal or perspective projection and so on, by being multiplied by the
 * matrix. This is known as `applying` the matrix to the vector.
 *
 * A Note on Row-Major and Column-Major Ordering:
 *
 * The constructor and {@link Matrix3#set} method take arguments in
 * [row-major](https://en.wikipedia.org/wiki/Row-_and_column-major_order#Column-major_order)
 * order, while internally they are stored in the {@link Matrix3#elements} array in column-major order.
 * This means that calling:
 * ```js
 * const m = new THREE.Matrix4();
 * m.set( 11, 12, 13, 14,
 *        21, 22, 23, 24,
 *        31, 32, 33, 34,
 *        41, 42, 43, 44 );
 * ```
 * will result in the elements array containing:
 * ```js
 * m.elements = [ 11, 21, 31, 41,
 *                12, 22, 32, 42,
 *                13, 23, 33, 43,
 *                14, 24, 34, 44 ];
 * ```
 * and internally all calculations are performed using column-major ordering.
 * However, as the actual ordering makes no difference mathematically and
 * most people are used to thinking about matrices in row-major order, the
 * three.js documentation shows matrices in row-major order. Just bear in
 * mind that if you are reading the source code, you'll have to take the
 * transpose of any matrices outlined here to make sense of the calculations.
 */
class Matrix4 {

	static {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		Matrix4.prototype.isMatrix4 = true;

	}

	/**
	 * Constructs a new 4x4 matrix. The arguments are supposed to be
	 * in row-major order. If no arguments are provided, the constructor
	 * initializes the matrix as an identity matrix.
	 *
	 * @param {number} [n11] - 1-1 matrix element.
	 * @param {number} [n12] - 1-2 matrix element.
	 * @param {number} [n13] - 1-3 matrix element.
	 * @param {number} [n14] - 1-4 matrix element.
	 * @param {number} [n21] - 2-1 matrix element.
	 * @param {number} [n22] - 2-2 matrix element.
	 * @param {number} [n23] - 2-3 matrix element.
	 * @param {number} [n24] - 2-4 matrix element.
	 * @param {number} [n31] - 3-1 matrix element.
	 * @param {number} [n32] - 3-2 matrix element.
	 * @param {number} [n33] - 3-3 matrix element.
	 * @param {number} [n34] - 3-4 matrix element.
	 * @param {number} [n41] - 4-1 matrix element.
	 * @param {number} [n42] - 4-2 matrix element.
	 * @param {number} [n43] - 4-3 matrix element.
	 * @param {number} [n44] - 4-4 matrix element.
	 */
	constructor( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

		/**
		 * A column-major list of matrix values.
		 *
		 * @type {Array<number>}
		 */
		this.elements = [

			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		];

		if ( n11 !== undefined ) {

			this.set( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 );

		}

	}

	/**
	 * Sets the elements of the matrix.The arguments are supposed to be
	 * in row-major order.
	 *
	 * @param {number} [n11] - 1-1 matrix element.
	 * @param {number} [n12] - 1-2 matrix element.
	 * @param {number} [n13] - 1-3 matrix element.
	 * @param {number} [n14] - 1-4 matrix element.
	 * @param {number} [n21] - 2-1 matrix element.
	 * @param {number} [n22] - 2-2 matrix element.
	 * @param {number} [n23] - 2-3 matrix element.
	 * @param {number} [n24] - 2-4 matrix element.
	 * @param {number} [n31] - 3-1 matrix element.
	 * @param {number} [n32] - 3-2 matrix element.
	 * @param {number} [n33] - 3-3 matrix element.
	 * @param {number} [n34] - 3-4 matrix element.
	 * @param {number} [n41] - 4-1 matrix element.
	 * @param {number} [n42] - 4-2 matrix element.
	 * @param {number} [n43] - 4-3 matrix element.
	 * @param {number} [n44] - 4-4 matrix element.
	 * @return {Matrix4} A reference to this matrix.
	 */
	set( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

		const te = this.elements;

		te[ 0 ] = n11; te[ 4 ] = n12; te[ 8 ] = n13; te[ 12 ] = n14;
		te[ 1 ] = n21; te[ 5 ] = n22; te[ 9 ] = n23; te[ 13 ] = n24;
		te[ 2 ] = n31; te[ 6 ] = n32; te[ 10 ] = n33; te[ 14 ] = n34;
		te[ 3 ] = n41; te[ 7 ] = n42; te[ 11 ] = n43; te[ 15 ] = n44;

		return this;

	}

	/**
	 * Sets this matrix to the 4x4 identity matrix.
	 *
	 * @return {Matrix4} A reference to this matrix.
	 */
	identity() {

		this.set(

			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Returns a matrix with copied values from this instance.
	 *
	 * @return {Matrix4} A clone of this instance.
	 */
	clone() {

		return new Matrix4().fromArray( this.elements );

	}

	/**
	 * Copies the values of the given matrix to this instance.
	 *
	 * @param {Matrix4} m - The matrix to copy.
	 * @return {Matrix4} A reference to this matrix.
	 */
	copy( m ) {

		const te = this.elements;
		const me = m.elements;

		te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ]; te[ 3 ] = me[ 3 ];
		te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ]; te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ];
		te[ 8 ] = me[ 8 ]; te[ 9 ] = me[ 9 ]; te[ 10 ] = me[ 10 ]; te[ 11 ] = me[ 11 ];
		te[ 12 ] = me[ 12 ]; te[ 13 ] = me[ 13 ]; te[ 14 ] = me[ 14 ]; te[ 15 ] = me[ 15 ];

		return this;

	}

	/**
	 * Copies the translation component of the given matrix
	 * into this matrix's translation component.
	 *
	 * @param {Matrix4} m - The matrix to copy the translation component.
	 * @return {Matrix4} A reference to this matrix.
	 */
	copyPosition( m ) {

		const te = this.elements, me = m.elements;

		te[ 12 ] = me[ 12 ];
		te[ 13 ] = me[ 13 ];
		te[ 14 ] = me[ 14 ];

		return this;

	}

	/**
	 * Set the upper 3x3 elements of this matrix to the values of given 3x3 matrix.
	 *
	 * @param {Matrix3} m - The 3x3 matrix.
	 * @return {Matrix4} A reference to this matrix.
	 */
	setFromMatrix3( m ) {

		const me = m.elements;

		this.set(

			me[ 0 ], me[ 3 ], me[ 6 ], 0,
			me[ 1 ], me[ 4 ], me[ 7 ], 0,
			me[ 2 ], me[ 5 ], me[ 8 ], 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Extracts the basis of this matrix into the three axis vectors provided.
	 *
	 * @param {Vector3} xAxis - The basis's x axis.
	 * @param {Vector3} yAxis - The basis's y axis.
	 * @param {Vector3} zAxis - The basis's z axis.
	 * @return {Matrix4} A reference to this matrix.
	 */
	extractBasis( xAxis, yAxis, zAxis ) {

		if ( this.determinant() === 0 ) {

			xAxis.set( 1, 0, 0 );
			yAxis.set( 0, 1, 0 );
			zAxis.set( 0, 0, 1 );

			return this;

		}

		xAxis.setFromMatrixColumn( this, 0 );
		yAxis.setFromMatrixColumn( this, 1 );
		zAxis.setFromMatrixColumn( this, 2 );

		return this;

	}

	/**
	 * Sets the given basis vectors to this matrix.
	 *
	 * @param {Vector3} xAxis - The basis's x axis.
	 * @param {Vector3} yAxis - The basis's y axis.
	 * @param {Vector3} zAxis - The basis's z axis.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeBasis( xAxis, yAxis, zAxis ) {

		this.set(
			xAxis.x, yAxis.x, zAxis.x, 0,
			xAxis.y, yAxis.y, zAxis.y, 0,
			xAxis.z, yAxis.z, zAxis.z, 0,
			0, 0, 0, 1
		);

		return this;

	}

	/**
	 * Extracts the rotation component of the given matrix
	 * into this matrix's rotation component.
	 *
	 * Note: This method does not support reflection matrices.
	 *
	 * @param {Matrix4} m - The matrix.
	 * @return {Matrix4} A reference to this matrix.
	 */
	extractRotation( m ) {

		if ( m.determinant() === 0 ) {

			return this.identity();

		}

		const te = this.elements;
		const me = m.elements;

		const scaleX = 1 / _v1$7.setFromMatrixColumn( m, 0 ).length();
		const scaleY = 1 / _v1$7.setFromMatrixColumn( m, 1 ).length();
		const scaleZ = 1 / _v1$7.setFromMatrixColumn( m, 2 ).length();

		te[ 0 ] = me[ 0 ] * scaleX;
		te[ 1 ] = me[ 1 ] * scaleX;
		te[ 2 ] = me[ 2 ] * scaleX;
		te[ 3 ] = 0;

		te[ 4 ] = me[ 4 ] * scaleY;
		te[ 5 ] = me[ 5 ] * scaleY;
		te[ 6 ] = me[ 6 ] * scaleY;
		te[ 7 ] = 0;

		te[ 8 ] = me[ 8 ] * scaleZ;
		te[ 9 ] = me[ 9 ] * scaleZ;
		te[ 10 ] = me[ 10 ] * scaleZ;
		te[ 11 ] = 0;

		te[ 12 ] = 0;
		te[ 13 ] = 0;
		te[ 14 ] = 0;
		te[ 15 ] = 1;

		return this;

	}

	/**
	 * Sets the rotation component (the upper left 3x3 matrix) of this matrix to
	 * the rotation specified by the given Euler angles. The rest of
	 * the matrix is set to the identity. Depending on the {@link Euler#order},
	 * there are six possible outcomes. See [this page](https://en.wikipedia.org/wiki/Euler_angles#Rotation_matrix)
	 * for a complete list.
	 *
	 * @param {Euler} euler - The Euler angles.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeRotationFromEuler( euler ) {

		const te = this.elements;

		const x = euler.x, y = euler.y, z = euler.z;
		const a = Math.cos( x ), b = Math.sin( x );
		const c = Math.cos( y ), d = Math.sin( y );
		const e = Math.cos( z ), f = Math.sin( z );

		if ( euler.order === 'XYZ' ) {

			const ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[ 0 ] = c * e;
			te[ 4 ] = - c * f;
			te[ 8 ] = d;

			te[ 1 ] = af + be * d;
			te[ 5 ] = ae - bf * d;
			te[ 9 ] = - b * c;

			te[ 2 ] = bf - ae * d;
			te[ 6 ] = be + af * d;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'YXZ' ) {

			const ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[ 0 ] = ce + df * b;
			te[ 4 ] = de * b - cf;
			te[ 8 ] = a * d;

			te[ 1 ] = a * f;
			te[ 5 ] = a * e;
			te[ 9 ] = - b;

			te[ 2 ] = cf * b - de;
			te[ 6 ] = df + ce * b;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'ZXY' ) {

			const ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[ 0 ] = ce - df * b;
			te[ 4 ] = - a * f;
			te[ 8 ] = de + cf * b;

			te[ 1 ] = cf + de * b;
			te[ 5 ] = a * e;
			te[ 9 ] = df - ce * b;

			te[ 2 ] = - a * d;
			te[ 6 ] = b;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'ZYX' ) {

			const ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[ 0 ] = c * e;
			te[ 4 ] = be * d - af;
			te[ 8 ] = ae * d + bf;

			te[ 1 ] = c * f;
			te[ 5 ] = bf * d + ae;
			te[ 9 ] = af * d - be;

			te[ 2 ] = - d;
			te[ 6 ] = b * c;
			te[ 10 ] = a * c;

		} else if ( euler.order === 'YZX' ) {

			const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[ 0 ] = c * e;
			te[ 4 ] = bd - ac * f;
			te[ 8 ] = bc * f + ad;

			te[ 1 ] = f;
			te[ 5 ] = a * e;
			te[ 9 ] = - b * e;

			te[ 2 ] = - d * e;
			te[ 6 ] = ad * f + bc;
			te[ 10 ] = ac - bd * f;

		} else if ( euler.order === 'XZY' ) {

			const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[ 0 ] = c * e;
			te[ 4 ] = - f;
			te[ 8 ] = d * e;

			te[ 1 ] = ac * f + bd;
			te[ 5 ] = a * e;
			te[ 9 ] = ad * f - bc;

			te[ 2 ] = bc * f - ad;
			te[ 6 ] = b * e;
			te[ 10 ] = bd * f + ac;

		}

		// bottom row
		te[ 3 ] = 0;
		te[ 7 ] = 0;
		te[ 11 ] = 0;

		// last column
		te[ 12 ] = 0;
		te[ 13 ] = 0;
		te[ 14 ] = 0;
		te[ 15 ] = 1;

		return this;

	}

	/**
	 * Sets the rotation component of this matrix to the rotation specified by
	 * the given Quaternion as outlined [here](https://en.wikipedia.org/wiki/Rotation_matrix#Quaternion)
	 * The rest of the matrix is set to the identity.
	 *
	 * @param {Quaternion} q - The Quaternion.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeRotationFromQuaternion( q ) {

		return this.compose( _zero, q, _one );

	}

	/**
	 * Sets the rotation component of the transformation matrix, looking from `eye` towards
	 * `target`, and oriented by the up-direction.
	 *
	 * @param {Vector3} eye - The eye vector.
	 * @param {Vector3} target - The target vector.
	 * @param {Vector3} up - The up vector.
	 * @return {Matrix4} A reference to this matrix.
	 */
	lookAt( eye, target, up ) {

		const te = this.elements;

		_z.subVectors( eye, target );

		if ( _z.lengthSq() === 0 ) {

			// eye and target are in the same position

			_z.z = 1;

		}

		_z.normalize();
		_x.crossVectors( up, _z );

		if ( _x.lengthSq() === 0 ) {

			// up and z are parallel

			if ( Math.abs( up.z ) === 1 ) {

				_z.x += 0.0001;

			} else {

				_z.z += 0.0001;

			}

			_z.normalize();
			_x.crossVectors( up, _z );

		}

		_x.normalize();
		_y.crossVectors( _z, _x );

		te[ 0 ] = _x.x; te[ 4 ] = _y.x; te[ 8 ] = _z.x;
		te[ 1 ] = _x.y; te[ 5 ] = _y.y; te[ 9 ] = _z.y;
		te[ 2 ] = _x.z; te[ 6 ] = _y.z; te[ 10 ] = _z.z;

		return this;

	}

	/**
	 * Post-multiplies this matrix by the given 4x4 matrix.
	 *
	 * @param {Matrix4} m - The matrix to multiply with.
	 * @return {Matrix4} A reference to this matrix.
	 */
	multiply( m ) {

		return this.multiplyMatrices( this, m );

	}

	/**
	 * Pre-multiplies this matrix by the given 4x4 matrix.
	 *
	 * @param {Matrix4} m - The matrix to multiply with.
	 * @return {Matrix4} A reference to this matrix.
	 */
	premultiply( m ) {

		return this.multiplyMatrices( m, this );

	}

	/**
	 * Multiples the given 4x4 matrices and stores the result
	 * in this matrix.
	 *
	 * @param {Matrix4} a - The first matrix.
	 * @param {Matrix4} b - The second matrix.
	 * @return {Matrix4} A reference to this matrix.
	 */
	multiplyMatrices( a, b ) {

		const ae = a.elements;
		const be = b.elements;
		const te = this.elements;

		const a11 = ae[ 0 ], a12 = ae[ 4 ], a13 = ae[ 8 ], a14 = ae[ 12 ];
		const a21 = ae[ 1 ], a22 = ae[ 5 ], a23 = ae[ 9 ], a24 = ae[ 13 ];
		const a31 = ae[ 2 ], a32 = ae[ 6 ], a33 = ae[ 10 ], a34 = ae[ 14 ];
		const a41 = ae[ 3 ], a42 = ae[ 7 ], a43 = ae[ 11 ], a44 = ae[ 15 ];

		const b11 = be[ 0 ], b12 = be[ 4 ], b13 = be[ 8 ], b14 = be[ 12 ];
		const b21 = be[ 1 ], b22 = be[ 5 ], b23 = be[ 9 ], b24 = be[ 13 ];
		const b31 = be[ 2 ], b32 = be[ 6 ], b33 = be[ 10 ], b34 = be[ 14 ];
		const b41 = be[ 3 ], b42 = be[ 7 ], b43 = be[ 11 ], b44 = be[ 15 ];

		te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
		te[ 4 ] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
		te[ 8 ] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
		te[ 12 ] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

		te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
		te[ 5 ] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
		te[ 9 ] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
		te[ 13 ] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

		te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
		te[ 6 ] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
		te[ 10 ] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
		te[ 14 ] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

		te[ 3 ] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
		te[ 7 ] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
		te[ 11 ] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
		te[ 15 ] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

		return this;

	}

	/**
	 * Multiplies every component of the matrix by the given scalar.
	 *
	 * @param {number} s - The scalar.
	 * @return {Matrix4} A reference to this matrix.
	 */
	multiplyScalar( s ) {

		const te = this.elements;

		te[ 0 ] *= s; te[ 4 ] *= s; te[ 8 ] *= s; te[ 12 ] *= s;
		te[ 1 ] *= s; te[ 5 ] *= s; te[ 9 ] *= s; te[ 13 ] *= s;
		te[ 2 ] *= s; te[ 6 ] *= s; te[ 10 ] *= s; te[ 14 ] *= s;
		te[ 3 ] *= s; te[ 7 ] *= s; te[ 11 ] *= s; te[ 15 ] *= s;

		return this;

	}

	/**
	 * Computes and returns the determinant of this matrix.
	 *
	 * Based on the method outlined [here](http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.html).
	 *
	 * @return {number} The determinant.
	 */
	determinant() {

		const te = this.elements;

		const n11 = te[ 0 ], n12 = te[ 4 ], n13 = te[ 8 ], n14 = te[ 12 ];
		const n21 = te[ 1 ], n22 = te[ 5 ], n23 = te[ 9 ], n24 = te[ 13 ];
		const n31 = te[ 2 ], n32 = te[ 6 ], n33 = te[ 10 ], n34 = te[ 14 ];
		const n41 = te[ 3 ], n42 = te[ 7 ], n43 = te[ 11 ], n44 = te[ 15 ];

		const t11 = n23 * n34 - n24 * n33;
		const t12 = n22 * n34 - n24 * n32;
		const t13 = n22 * n33 - n23 * n32;

		const t21 = n21 * n34 - n24 * n31;
		const t22 = n21 * n33 - n23 * n31;
		const t23 = n21 * n32 - n22 * n31;

		return n11 * ( n42 * t11 - n43 * t12 + n44 * t13 ) -
			n12 * ( n41 * t11 - n43 * t21 + n44 * t22 ) +
			n13 * ( n41 * t12 - n42 * t21 + n44 * t23 ) -
			n14 * ( n41 * t13 - n42 * t22 + n43 * t23 );

	}

	/**
	 * Transposes this matrix in place.
	 *
	 * @return {Matrix4} A reference to this matrix.
	 */
	transpose() {

		const te = this.elements;
		let tmp;

		tmp = te[ 1 ]; te[ 1 ] = te[ 4 ]; te[ 4 ] = tmp;
		tmp = te[ 2 ]; te[ 2 ] = te[ 8 ]; te[ 8 ] = tmp;
		tmp = te[ 6 ]; te[ 6 ] = te[ 9 ]; te[ 9 ] = tmp;

		tmp = te[ 3 ]; te[ 3 ] = te[ 12 ]; te[ 12 ] = tmp;
		tmp = te[ 7 ]; te[ 7 ] = te[ 13 ]; te[ 13 ] = tmp;
		tmp = te[ 11 ]; te[ 11 ] = te[ 14 ]; te[ 14 ] = tmp;

		return this;

	}

	/**
	 * Sets the position component for this matrix from the given vector,
	 * without affecting the rest of the matrix.
	 *
	 * @param {number|Vector3} x - The x component of the vector or alternatively the vector object.
	 * @param {number} y - The y component of the vector.
	 * @param {number} z - The z component of the vector.
	 * @return {Matrix4} A reference to this matrix.
	 */
	setPosition( x, y, z ) {

		const te = this.elements;

		if ( x.isVector3 ) {

			te[ 12 ] = x.x;
			te[ 13 ] = x.y;
			te[ 14 ] = x.z;

		} else {

			te[ 12 ] = x;
			te[ 13 ] = y;
			te[ 14 ] = z;

		}

		return this;

	}

	/**
	 * Inverts this matrix, using the [analytic method](https://en.wikipedia.org/wiki/Invertible_matrix#Analytic_solution).
	 * You can not invert with a determinant of zero. If you attempt this, the method produces
	 * a zero matrix instead.
	 *
	 * @return {Matrix4} A reference to this matrix.
	 */
	invert() {

		// based on https://github.com/toji/gl-matrix
		const te = this.elements,

			n11 = te[ 0 ], n21 = te[ 1 ], n31 = te[ 2 ], n41 = te[ 3 ],
			n12 = te[ 4 ], n22 = te[ 5 ], n32 = te[ 6 ], n42 = te[ 7 ],
			n13 = te[ 8 ], n23 = te[ 9 ], n33 = te[ 10 ], n43 = te[ 11 ],
			n14 = te[ 12 ], n24 = te[ 13 ], n34 = te[ 14 ], n44 = te[ 15 ],

			t1 = n11 * n22 - n21 * n12,
			t2 = n11 * n32 - n31 * n12,
			t3 = n11 * n42 - n41 * n12,
			t4 = n21 * n32 - n31 * n22,
			t5 = n21 * n42 - n41 * n22,
			t6 = n31 * n42 - n41 * n32,
			t7 = n13 * n24 - n23 * n14,
			t8 = n13 * n34 - n33 * n14,
			t9 = n13 * n44 - n43 * n14,
			t10 = n23 * n34 - n33 * n24,
			t11 = n23 * n44 - n43 * n24,
			t12 = n33 * n44 - n43 * n34;

		const det = t1 * t12 - t2 * t11 + t3 * t10 + t4 * t9 - t5 * t8 + t6 * t7;

		if ( det === 0 ) return this.set( 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 );

		const detInv = 1 / det;

		te[ 0 ] = ( n22 * t12 - n32 * t11 + n42 * t10 ) * detInv;
		te[ 1 ] = ( n31 * t11 - n21 * t12 - n41 * t10 ) * detInv;
		te[ 2 ] = ( n24 * t6 - n34 * t5 + n44 * t4 ) * detInv;
		te[ 3 ] = ( n33 * t5 - n23 * t6 - n43 * t4 ) * detInv;

		te[ 4 ] = ( n32 * t9 - n12 * t12 - n42 * t8 ) * detInv;
		te[ 5 ] = ( n11 * t12 - n31 * t9 + n41 * t8 ) * detInv;
		te[ 6 ] = ( n34 * t3 - n14 * t6 - n44 * t2 ) * detInv;
		te[ 7 ] = ( n13 * t6 - n33 * t3 + n43 * t2 ) * detInv;

		te[ 8 ] = ( n12 * t11 - n22 * t9 + n42 * t7 ) * detInv;
		te[ 9 ] = ( n21 * t9 - n11 * t11 - n41 * t7 ) * detInv;
		te[ 10 ] = ( n14 * t5 - n24 * t3 + n44 * t1 ) * detInv;
		te[ 11 ] = ( n23 * t3 - n13 * t5 - n43 * t1 ) * detInv;

		te[ 12 ] = ( n22 * t8 - n12 * t10 - n32 * t7 ) * detInv;
		te[ 13 ] = ( n11 * t10 - n21 * t8 + n31 * t7 ) * detInv;
		te[ 14 ] = ( n24 * t2 - n14 * t4 - n34 * t1 ) * detInv;
		te[ 15 ] = ( n13 * t4 - n23 * t2 + n33 * t1 ) * detInv;

		return this;

	}

	/**
	 * Multiplies the columns of this matrix by the given vector.
	 *
	 * @param {Vector3} v - The scale vector.
	 * @return {Matrix4} A reference to this matrix.
	 */
	scale( v ) {

		const te = this.elements;
		const x = v.x, y = v.y, z = v.z;

		te[ 0 ] *= x; te[ 4 ] *= y; te[ 8 ] *= z;
		te[ 1 ] *= x; te[ 5 ] *= y; te[ 9 ] *= z;
		te[ 2 ] *= x; te[ 6 ] *= y; te[ 10 ] *= z;
		te[ 3 ] *= x; te[ 7 ] *= y; te[ 11 ] *= z;

		return this;

	}

	/**
	 * Gets the maximum scale value of the three axes.
	 *
	 * @return {number} The maximum scale.
	 */
	getMaxScaleOnAxis() {

		const te = this.elements;

		const scaleXSq = te[ 0 ] * te[ 0 ] + te[ 1 ] * te[ 1 ] + te[ 2 ] * te[ 2 ];
		const scaleYSq = te[ 4 ] * te[ 4 ] + te[ 5 ] * te[ 5 ] + te[ 6 ] * te[ 6 ];
		const scaleZSq = te[ 8 ] * te[ 8 ] + te[ 9 ] * te[ 9 ] + te[ 10 ] * te[ 10 ];

		return Math.sqrt( Math.max( scaleXSq, scaleYSq, scaleZSq ) );

	}

	/**
	 * Sets this matrix as a translation transform from the given vector.
	 *
	 * @param {number|Vector3} x - The amount to translate in the X axis or alternatively a translation vector.
	 * @param {number} y - The amount to translate in the Y axis.
	 * @param {number} z - The amount to translate in the z axis.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeTranslation( x, y, z ) {

		if ( x.isVector3 ) {

			this.set(

				1, 0, 0, x.x,
				0, 1, 0, x.y,
				0, 0, 1, x.z,
				0, 0, 0, 1

			);

		} else {

			this.set(

				1, 0, 0, x,
				0, 1, 0, y,
				0, 0, 1, z,
				0, 0, 0, 1

			);

		}

		return this;

	}

	/**
	 * Sets this matrix as a rotational transformation around the X axis by
	 * the given angle.
	 *
	 * @param {number} theta - The rotation in radians.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeRotationX( theta ) {

		const c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			1, 0, 0, 0,
			0, c, - s, 0,
			0, s, c, 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix as a rotational transformation around the Y axis by
	 * the given angle.
	 *
	 * @param {number} theta - The rotation in radians.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeRotationY( theta ) {

		const c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			 c, 0, s, 0,
			 0, 1, 0, 0,
			- s, 0, c, 0,
			 0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix as a rotational transformation around the Z axis by
	 * the given angle.
	 *
	 * @param {number} theta - The rotation in radians.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeRotationZ( theta ) {

		const c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			c, - s, 0, 0,
			s, c, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix as a rotational transformation around the given axis by
	 * the given angle.
	 *
	 * This is a somewhat controversial but mathematically sound alternative to
	 * rotating via Quaternions. See the discussion [here](https://www.gamedev.net/articles/programming/math-and-physics/do-we-really-need-quaternions-r1199).
	 *
	 * @param {Vector3} axis - The normalized rotation axis.
	 * @param {number} angle - The rotation in radians.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeRotationAxis( axis, angle ) {

		// Based on http://www.gamedev.net/reference/articles/article1199.asp

		const c = Math.cos( angle );
		const s = Math.sin( angle );
		const t = 1 - c;
		const x = axis.x, y = axis.y, z = axis.z;
		const tx = t * x, ty = t * y;

		this.set(

			tx * x + c, tx * y - s * z, tx * z + s * y, 0,
			tx * y + s * z, ty * y + c, ty * z - s * x, 0,
			tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix as a scale transformation.
	 *
	 * @param {number} x - The amount to scale in the X axis.
	 * @param {number} y - The amount to scale in the Y axis.
	 * @param {number} z - The amount to scale in the Z axis.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeScale( x, y, z ) {

		this.set(

			x, 0, 0, 0,
			0, y, 0, 0,
			0, 0, z, 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix as a shear transformation.
	 *
	 * @param {number} xy - The amount to shear X by Y.
	 * @param {number} xz - The amount to shear X by Z.
	 * @param {number} yx - The amount to shear Y by X.
	 * @param {number} yz - The amount to shear Y by Z.
	 * @param {number} zx - The amount to shear Z by X.
	 * @param {number} zy - The amount to shear Z by Y.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeShear( xy, xz, yx, yz, zx, zy ) {

		this.set(

			1, yx, zx, 0,
			xy, 1, zy, 0,
			xz, yz, 1, 0,
			0, 0, 0, 1

		);

		return this;

	}

	/**
	 * Sets this matrix to the transformation composed of the given position,
	 * rotation (Quaternion) and scale.
	 *
	 * @param {Vector3} position - The position vector.
	 * @param {Quaternion} quaternion - The rotation as a Quaternion.
	 * @param {Vector3} scale - The scale vector.
	 * @return {Matrix4} A reference to this matrix.
	 */
	compose( position, quaternion, scale ) {

		const te = this.elements;

		const x = quaternion._x, y = quaternion._y, z = quaternion._z, w = quaternion._w;
		const x2 = x + x,	y2 = y + y, z2 = z + z;
		const xx = x * x2, xy = x * y2, xz = x * z2;
		const yy = y * y2, yz = y * z2, zz = z * z2;
		const wx = w * x2, wy = w * y2, wz = w * z2;

		const sx = scale.x, sy = scale.y, sz = scale.z;

		te[ 0 ] = ( 1 - ( yy + zz ) ) * sx;
		te[ 1 ] = ( xy + wz ) * sx;
		te[ 2 ] = ( xz - wy ) * sx;
		te[ 3 ] = 0;

		te[ 4 ] = ( xy - wz ) * sy;
		te[ 5 ] = ( 1 - ( xx + zz ) ) * sy;
		te[ 6 ] = ( yz + wx ) * sy;
		te[ 7 ] = 0;

		te[ 8 ] = ( xz + wy ) * sz;
		te[ 9 ] = ( yz - wx ) * sz;
		te[ 10 ] = ( 1 - ( xx + yy ) ) * sz;
		te[ 11 ] = 0;

		te[ 12 ] = position.x;
		te[ 13 ] = position.y;
		te[ 14 ] = position.z;
		te[ 15 ] = 1;

		return this;

	}

	/**
	 * Decomposes this matrix into its position, rotation and scale components
	 * and provides the result in the given objects.
	 *
	 * Note: Not all matrices are decomposable in this way. For example, if an
	 * object has a non-uniformly scaled parent, then the object's world matrix
	 * may not be decomposable, and this method may not be appropriate.
	 *
	 * @param {Vector3} position - The position vector.
	 * @param {Quaternion} quaternion - The rotation as a Quaternion.
	 * @param {Vector3} scale - The scale vector.
	 * @return {Matrix4} A reference to this matrix.
	 */
	decompose( position, quaternion, scale ) {

		const te = this.elements;

		position.x = te[ 12 ];
		position.y = te[ 13 ];
		position.z = te[ 14 ];

		const det = this.determinant();

		if ( det === 0 ) {

			scale.set( 1, 1, 1 );
			quaternion.identity();

			return this;

		}

		let sx = _v1$7.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
		const sy = _v1$7.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
		const sz = _v1$7.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();

		// if determinant is negative, we need to invert one scale
		if ( det < 0 ) sx = - sx;

		// scale the rotation part
		_m1$2.copy( this );

		const invSX = 1 / sx;
		const invSY = 1 / sy;
		const invSZ = 1 / sz;

		_m1$2.elements[ 0 ] *= invSX;
		_m1$2.elements[ 1 ] *= invSX;
		_m1$2.elements[ 2 ] *= invSX;

		_m1$2.elements[ 4 ] *= invSY;
		_m1$2.elements[ 5 ] *= invSY;
		_m1$2.elements[ 6 ] *= invSY;

		_m1$2.elements[ 8 ] *= invSZ;
		_m1$2.elements[ 9 ] *= invSZ;
		_m1$2.elements[ 10 ] *= invSZ;

		quaternion.setFromRotationMatrix( _m1$2 );

		scale.x = sx;
		scale.y = sy;
		scale.z = sz;

		return this;

	}

	/**
	 * Creates a perspective projection matrix. This is used internally by
	 * {@link PerspectiveCamera#updateProjectionMatrix}.

	 * @param {number} left - Left boundary of the viewing frustum at the near plane.
	 * @param {number} right - Right boundary of the viewing frustum at the near plane.
	 * @param {number} top - Top boundary of the viewing frustum at the near plane.
	 * @param {number} bottom - Bottom boundary of the viewing frustum at the near plane.
	 * @param {number} near - The distance from the camera to the near plane.
	 * @param {number} far - The distance from the camera to the far plane.
	 * @param {(WebGLCoordinateSystem|WebGPUCoordinateSystem)} [coordinateSystem=WebGLCoordinateSystem] - The coordinate system.
	 * @param {boolean} [reversedDepth=false] - Whether to use a reversed depth.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makePerspective( left, right, top, bottom, near, far, coordinateSystem = WebGLCoordinateSystem, reversedDepth = false ) {

		const te = this.elements;

		const x = 2 * near / ( right - left );
		const y = 2 * near / ( top - bottom );

		const a = ( right + left ) / ( right - left );
		const b = ( top + bottom ) / ( top - bottom );

		let c, d;

		if ( reversedDepth ) {

			c = near / ( far - near );
			d = ( far * near ) / ( far - near );

		} else {

			if ( coordinateSystem === WebGLCoordinateSystem ) {

				c = - ( far + near ) / ( far - near );
				d = ( -2 * far * near ) / ( far - near );

			} else if ( coordinateSystem === WebGPUCoordinateSystem ) {

				c = - far / ( far - near );
				d = ( - far * near ) / ( far - near );

			} else {

				throw new Error( 'THREE.Matrix4.makePerspective(): Invalid coordinate system: ' + coordinateSystem );

			}

		}

		te[ 0 ] = x;	te[ 4 ] = 0;	te[ 8 ] = a; 	te[ 12 ] = 0;
		te[ 1 ] = 0;	te[ 5 ] = y;	te[ 9 ] = b; 	te[ 13 ] = 0;
		te[ 2 ] = 0;	te[ 6 ] = 0;	te[ 10 ] = c; 	te[ 14 ] = d;
		te[ 3 ] = 0;	te[ 7 ] = 0;	te[ 11 ] = -1;	te[ 15 ] = 0;

		return this;

	}

	/**
	 * Creates a orthographic projection matrix. This is used internally by
	 * {@link OrthographicCamera#updateProjectionMatrix}.

	 * @param {number} left - Left boundary of the viewing frustum at the near plane.
	 * @param {number} right - Right boundary of the viewing frustum at the near plane.
	 * @param {number} top - Top boundary of the viewing frustum at the near plane.
	 * @param {number} bottom - Bottom boundary of the viewing frustum at the near plane.
	 * @param {number} near - The distance from the camera to the near plane.
	 * @param {number} far - The distance from the camera to the far plane.
	 * @param {(WebGLCoordinateSystem|WebGPUCoordinateSystem)} [coordinateSystem=WebGLCoordinateSystem] - The coordinate system.
	 * @param {boolean} [reversedDepth=false] - Whether to use a reversed depth.
	 * @return {Matrix4} A reference to this matrix.
	 */
	makeOrthographic( left, right, top, bottom, near, far, coordinateSystem = WebGLCoordinateSystem, reversedDepth = false ) {

		const te = this.elements;

		const x = 2 / ( right - left );
		const y = 2 / ( top - bottom );

		const a = - ( right + left ) / ( right - left );
		const b = - ( top + bottom ) / ( top - bottom );

		let c, d;

		if ( reversedDepth ) {

			c = 1 / ( far - near );
			d = far / ( far - near );

		} else {

			if ( coordinateSystem === WebGLCoordinateSystem ) {

				c = -2 / ( far - near );
				d = - ( far + near ) / ( far - near );

			} else if ( coordinateSystem === WebGPUCoordinateSystem ) {

				c = -1 / ( far - near );
				d = - near / ( far - near );

			} else {

				throw new Error( 'THREE.Matrix4.makeOrthographic(): Invalid coordinate system: ' + coordinateSystem );

			}

		}

		te[ 0 ] = x;		te[ 4 ] = 0;		te[ 8 ] = 0; 		te[ 12 ] = a;
		te[ 1 ] = 0; 		te[ 5 ] = y;		te[ 9 ] = 0; 		te[ 13 ] = b;
		te[ 2 ] = 0; 		te[ 6 ] = 0;		te[ 10 ] = c;		te[ 14 ] = d;
		te[ 3 ] = 0; 		te[ 7 ] = 0;		te[ 11 ] = 0;		te[ 15 ] = 1;

		return this;

	}

	/**
	 * Returns `true` if this matrix is equal with the given one.
	 *
	 * @param {Matrix4} matrix - The matrix to test for equality.
	 * @return {boolean} Whether this matrix is equal with the given one.
	 */
	equals( matrix ) {

		const te = this.elements;
		const me = matrix.elements;

		for ( let i = 0; i < 16; i ++ ) {

			if ( te[ i ] !== me[ i ] ) return false;

		}

		return true;

	}

	/**
	 * Sets the elements of the matrix from the given array.
	 *
	 * @param {Array<number>} array - The matrix elements in column-major order.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Matrix4} A reference to this matrix.
	 */
	fromArray( array, offset = 0 ) {

		for ( let i = 0; i < 16; i ++ ) {

			this.elements[ i ] = array[ i + offset ];

		}

		return this;

	}

	/**
	 * Writes the elements of this matrix to the given array. If no array is provided,
	 * the method returns a new instance.
	 *
	 * @param {Array<number>} [array=[]] - The target array holding the matrix elements in column-major order.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Array<number>} The matrix elements in column-major order.
	 */
	toArray( array = [], offset = 0 ) {

		const te = this.elements;

		array[ offset ] = te[ 0 ];
		array[ offset + 1 ] = te[ 1 ];
		array[ offset + 2 ] = te[ 2 ];
		array[ offset + 3 ] = te[ 3 ];

		array[ offset + 4 ] = te[ 4 ];
		array[ offset + 5 ] = te[ 5 ];
		array[ offset + 6 ] = te[ 6 ];
		array[ offset + 7 ] = te[ 7 ];

		array[ offset + 8 ] = te[ 8 ];
		array[ offset + 9 ] = te[ 9 ];
		array[ offset + 10 ] = te[ 10 ];
		array[ offset + 11 ] = te[ 11 ];

		array[ offset + 12 ] = te[ 12 ];
		array[ offset + 13 ] = te[ 13 ];
		array[ offset + 14 ] = te[ 14 ];
		array[ offset + 15 ] = te[ 15 ];

		return array;

	}

}

const _v1$7 = /*@__PURE__*/ new Vector3();
const _m1$2 = /*@__PURE__*/ new Matrix4();
const _zero = /*@__PURE__*/ new Vector3( 0, 0, 0 );
const _one = /*@__PURE__*/ new Vector3( 1, 1, 1 );
const _x = /*@__PURE__*/ new Vector3();
const _y = /*@__PURE__*/ new Vector3();
const _z = /*@__PURE__*/ new Vector3();

/**
 * Represents a 2x2 matrix.
 *
 * A Note on Row-Major and Column-Major Ordering:
 *
 * The constructor and {@link Matrix2#set} method take arguments in
 * [row-major](https://en.wikipedia.org/wiki/Row-_and_column-major_order#Column-major_order)
 * order, while internally they are stored in the {@link Matrix2#elements} array in column-major order.
 * This means that calling:
 * ```js
 * const m = new THREE.Matrix2();
 * m.set( 11, 12,
 *        21, 22 );
 * ```
 * will result in the elements array containing:
 * ```js
 * m.elements = [ 11, 21,
 *                12, 22 ];
 * ```
 * and internally all calculations are performed using column-major ordering.
 * However, as the actual ordering makes no difference mathematically and
 * most people are used to thinking about matrices in row-major order, the
 * three.js documentation shows matrices in row-major order. Just bear in
 * mind that if you are reading the source code, you'll have to take the
 * transpose of any matrices outlined here to make sense of the calculations.
 */
class Matrix2 {

	static {

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		Matrix2.prototype.isMatrix2 = true;

	}

	/**
	 * Constructs a new 2x2 matrix. The arguments are supposed to be
	 * in row-major order. If no arguments are provided, the constructor
	 * initializes the matrix as an identity matrix.
	 *
	 * @param {number} [n11] - 1-1 matrix element.
	 * @param {number} [n12] - 1-2 matrix element.
	 * @param {number} [n21] - 2-1 matrix element.
	 * @param {number} [n22] - 2-2 matrix element.
	 */
	constructor( n11, n12, n21, n22 ) {

		/**
		 * A column-major list of matrix values.
		 *
		 * @type {Array<number>}
		 */
		this.elements = [
			1, 0,
			0, 1,
		];

		if ( n11 !== undefined ) {

			this.set( n11, n12, n21, n22 );

		}

	}

	/**
	 * Sets this matrix to the 2x2 identity matrix.
	 *
	 * @return {Matrix2} A reference to this matrix.
	 */
	identity() {

		this.set(
			1, 0,
			0, 1,
		);

		return this;

	}

	/**
	 * Sets the elements of the matrix from the given array.
	 *
	 * @param {Array<number>} array - The matrix elements in column-major order.
	 * @param {number} [offset=0] - Index of the first element in the array.
	 * @return {Matrix2} A reference to this matrix.
	 */
	fromArray( array, offset = 0 ) {

		for ( let i = 0; i < 4; i ++ ) {

			this.elements[ i ] = array[ i + offset ];

		}

		return this;

	}

	/**
	 * Sets the elements of the matrix.The arguments are supposed to be
	 * in row-major order.
	 *
	 * @param {number} n11 - 1-1 matrix element.
	 * @param {number} n12 - 1-2 matrix element.
	 * @param {number} n21 - 2-1 matrix element.
	 * @param {number} n22 - 2-2 matrix element.
	 * @return {Matrix2} A reference to this matrix.
	 */
	set( n11, n12, n21, n22 ) {

		const te = this.elements;

		te[ 0 ] = n11; te[ 2 ] = n12;
		te[ 1 ] = n21; te[ 3 ] = n22;

		return this;

	}

}

if ( typeof __THREE_DEVTOOLS__ !== 'undefined' ) {

	__THREE_DEVTOOLS__.dispatchEvent( new CustomEvent( 'register', { detail: {
		revision: REVISION,
	} } ) );

}

if ( typeof window !== 'undefined' ) {

	if ( window.__THREE__ ) {

		warn( 'WARNING: Multiple instances of Three.js being imported.' );

	} else {

		window.__THREE__ = REVISION;

	}

}

/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
const _m$1 = /*@__PURE__*/ new Matrix3();

_m$1.set( -1, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0 );
const _m = /*@__PURE__*/ new Matrix3();

_m.set( -1, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0 );

// scene convention: 1 unit = 1 meter, +Y up, desk in XZ at y=0, d6 edge ~16mm

Object.freeze(new Vector3(0, 1, 0));
const TARGET_D6_EDGE_METERS = 0.016;

//legacy-to-meters factor for third-party GLTF dice (legacy baseScale was 50)
const LEGACY_TO_METERS = TARGET_D6_EDGE_METERS / 50;

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var register = {exports: {}};

var tinyEmitter;
var hasRequiredTinyEmitter;

function requireTinyEmitter () {
	if (hasRequiredTinyEmitter) return tinyEmitter;
	hasRequiredTinyEmitter = 1;

	function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike) { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

	var TinyEmitter = /*#__PURE__*/function () {
	  function TinyEmitter() {
	    _classCallCheck(this, TinyEmitter);

	    Object.defineProperty(this, '__listeners', {
	      value: {},
	      enumerable: false,
	      writable: false
	    });
	  }

	  _createClass(TinyEmitter, [{
	    key: "emit",
	    value: function emit(eventName) {
	      if (!this.__listeners[eventName]) return this;

	      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	        args[_key - 1] = arguments[_key];
	      }

	      var _iterator = _createForOfIteratorHelper(this.__listeners[eventName]),
	          _step;

	      try {
	        for (_iterator.s(); !(_step = _iterator.n()).done;) {
	          var handler = _step.value;
	          handler.apply(void 0, args);
	        }
	      } catch (err) {
	        _iterator.e(err);
	      } finally {
	        _iterator.f();
	      }

	      return this;
	    }
	  }, {
	    key: "once",
	    value: function once(eventName, handler) {
	      var _this = this;

	      var once = function once() {
	        _this.off(eventName, once);

	        handler.apply(void 0, arguments);
	      };

	      return this.on(eventName, once);
	    }
	  }, {
	    key: "on",
	    value: function on(eventName, handler) {
	      if (!this.__listeners[eventName]) this.__listeners[eventName] = [];

	      this.__listeners[eventName].push(handler);

	      return this;
	    }
	  }, {
	    key: "off",
	    value: function off(eventName, handler) {
	      if (handler) this.__listeners[eventName] = this.__listeners[eventName].filter(function (h) {
	        return h !== handler;
	      });else this.__listeners[eventName] = [];
	      return this;
	    }
	  }]);

	  return TinyEmitter;
	}();

	tinyEmitter = TinyEmitter;
	return tinyEmitter;
}

var hasRequiredRegister;

function requireRegister () {
	if (hasRequiredRegister) return register.exports;
	hasRequiredRegister = 1;

	function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

	function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

	function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

	function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

	function _get() { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get.bind(); } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(arguments.length < 3 ? target : receiver); } return desc.value; }; } return _get.apply(this, arguments); }

	function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

	function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

	function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

	function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

	function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

	function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

	function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

	var TinyEmitter = requireTinyEmitter();

	var MESSAGE_RESULT = 0;
	var MESSAGE_EVENT = 1;
	var RESULT_ERROR = 0;
	var RESULT_SUCCESS = 1;
	var DEFAULT_HANDLER = 'main';

	var isPromise = function isPromise(o) {
	  return _typeof(o) === 'object' && o !== null && typeof o.then === 'function' && typeof o["catch"] === 'function';
	};

	function RegisterPromise(fn) {
	  var handlers = _defineProperty({}, DEFAULT_HANDLER, fn);

	  var sendPostMessage = self.postMessage.bind(self);
	  var server = new ( /*#__PURE__*/function (_TinyEmitter) {
	    _inherits(WorkerRegister, _TinyEmitter);

	    var _super = _createSuper(WorkerRegister);

	    function WorkerRegister() {
	      _classCallCheck(this, WorkerRegister);

	      return _super.apply(this, arguments);
	    }

	    _createClass(WorkerRegister, [{
	      key: "emit",
	      value: function emit(eventName) {
	        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	          args[_key - 1] = arguments[_key];
	        }

	        if (args.length == 1 && args[0] instanceof TransferableResponse) {
	          sendPostMessage({
	            eventName: eventName,
	            args: args
	          }, args[0].transferable);
	        } else {
	          sendPostMessage({
	            eventName: eventName,
	            args: args
	          });
	        }

	        return this;
	      }
	    }, {
	      key: "emitLocally",
	      value: function emitLocally(eventName) {
	        var _get2;

	        for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
	          args[_key2 - 1] = arguments[_key2];
	        }

	        (_get2 = _get(_getPrototypeOf(WorkerRegister.prototype), "emit", this)).call.apply(_get2, [this, eventName].concat(args));
	      }
	    }, {
	      key: "operation",
	      value: function operation(name, handler) {
	        handlers[name] = handler;
	        return this;
	      }
	    }]);

	    return WorkerRegister;
	  }(TinyEmitter))();

	  var run = function run(messageId, payload, handlerName) {
	    var onSuccess = function onSuccess(result) {
	      if (result && result instanceof TransferableResponse) {
	        sendResult(messageId, RESULT_SUCCESS, result.payload, result.transferable);
	      } else {
	        sendResult(messageId, RESULT_SUCCESS, result);
	      }
	    };

	    var onError = function onError(e) {
	      sendResult(messageId, RESULT_ERROR, {
	        message: e.message,
	        stack: e.stack
	      });
	    };

	    try {
	      var result = runFn(messageId, payload, handlerName);

	      if (isPromise(result)) {
	        result.then(onSuccess)["catch"](onError);
	      } else {
	        onSuccess(result);
	      }
	    } catch (e) {
	      onError(e);
	    }
	  };

	  var runFn = function runFn(messageId, payload, handlerName) {
	    var handler = handlers[handlerName || DEFAULT_HANDLER];
	    if (!handler) throw new Error("Not found handler for this request");
	    return handler(payload, sendEvent.bind(null, messageId));
	  };

	  var sendResult = function sendResult(messageId, success, payload) {
	    var transferable = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
	    sendPostMessage([MESSAGE_RESULT, messageId, success, payload], transferable);
	  };

	  var sendEvent = function sendEvent(messageId, eventName, payload) {
	    if (!eventName) throw new Error('eventName is required');
	    if (typeof eventName !== 'string') throw new Error('eventName should be string');
	    sendPostMessage([MESSAGE_EVENT, messageId, eventName, payload]);
	  };

	  self.addEventListener('message', function (_ref) {
	    var data = _ref.data;

	    if (Array.isArray(data)) {
	      run.apply(void 0, _toConsumableArray(data));
	    } else if (data && data.eventName) {
	      server.emitLocally.apply(server, [data.eventName].concat(_toConsumableArray(data.args)));
	    }
	  });
	  return server;
	}

	var TransferableResponse = /*#__PURE__*/_createClass(function TransferableResponse(payload, transferable) {
	  _classCallCheck(this, TransferableResponse);

	  this.payload = payload;
	  this.transferable = transferable;
	});

	register.exports = RegisterPromise;
	register.exports.TransferableResponse = TransferableResponse;
	return register.exports;
}

var registerExports = requireRegister();
var RegisterPromise = /*@__PURE__*/getDefaultExportFromCjs(registerExports);

//cannon-es only behaves well at legacy scale (~1000x meters), so the worker
//runs internally at legacy scale. callers speak meters, conversion at I/O boundary.
const METERS_TO_LEGACY = 1 / LEGACY_TO_METERS;

class PhysicsWorker {
    constructor() {
        this.shapeList = new Map();
        this.shapeDefs = new Map();
        this.host = RegisterPromise()
            .operation('init', this.init.bind(this))
            .operation('addConstraint', this.addConstraint.bind(this))
            .operation('removeConstraint', this.removeConstraint.bind(this))
            .operation('updateConstraint', this.updateConstraint.bind(this))
            .operation('createShape', this.createShape.bind(this))
            .operation('getDiceValue', this.getDiceValue.bind(this))
            .operation('createDice', this.createDice.bind(this))
            .operation('createDiceBatch', this.createDiceBatch.bind(this))
            .operation('removeDice', this.removeDice.bind(this))
            .operation('addDice', this.addDice.bind(this))
            .operation('applyImpulse', this.applyImpulse.bind(this))
            .operation('getBodyQuaternion', this.getBodyQuaternion.bind(this))
            .operation('setBodyPosition', this.setBodyPosition.bind(this))
            .operation('setBodyPositions', this.setBodyPositions.bind(this))
            .operation('playStep', this.playStep.bind(this))
            .operation('simulateThrow', this.simulateThrow.bind(this))

            .operation('updateBarriers', this.updateBarriers.bind(this))
            .operation('getWorldInfo', this.getWorldInfo.bind(this))
            .operation('setCollisionResponse', this.setCollisionResponse.bind(this));
    }

    /**
     * Initialize the physics simulation
     */
    init(data) {
        this.world = new World();
        this.dice_body_material = new Material();
        this.desk_body_material = new Material();
        this.barrier_body_material = new Material();

        this.soundDelay = 2; // time between sound effects in worldstep
        this.animstate = 'throw';

        this.diceConstraints = new Map();

        this.diceList = new Map();

        this.world.gravity.set(0, -9.8 * 800, 0);
        this.world.broadphase = new NaiveBroadphase();
        this.world.solver.iterations = 14;
        this.world.allowSleep = true;

        this.muteSoundSecretRolls = data.muteSoundSecretRolls;

        this.framerate = 1 / 60;

        this.addContactMaterials();
        this.addDesk();
        this.addBarriers(
            data.height * METERS_TO_LEGACY,
            data.width * METERS_TO_LEGACY,
            {
                top: data.margin.top * METERS_TO_LEGACY,
                bottom: data.margin.bottom * METERS_TO_LEGACY,
                left: data.margin.left * METERS_TO_LEGACY,
                right: data.margin.right * METERS_TO_LEGACY
            }
        );
        this.reset();
        //reset sets animstate='simulate' but no sim is running after init, so allow playStep
        this.animstate = 'throw';
    }

    /**
     * Adds contact materials between different body materials with the specified
     * friction and restitution options.
     */
    addContactMaterials() {
        const contactMaterials = [
            { materials: [this.desk_body_material, this.dice_body_material], options: { friction: 0.01, restitution: 0.5 } },
            { materials: [this.barrier_body_material, this.dice_body_material], options: { friction: 0, restitution: 0.95 } },
            { materials: [this.dice_body_material, this.dice_body_material], options: { friction: 0.01, restitution: 0.7 } }
        ];

        for (const { materials, options } of contactMaterials) {
            const contactMaterial = new ContactMaterial(...materials, options);
            this.world.addContactMaterial(contactMaterial);
        }
    }

    /**
     * Adds a static desk body to the world simulation with the desk_body_material.
     */
    addDesk() {
        const desk = new Body({ allowSleep: false, mass: 0, shape: new Plane(), material: this.desk_body_material });
        //rotate default +Z normal to +Y so the plane lies flat
        desk.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(desk);
    }

    /**
     * Adds barriers around the world simulation to keep dice within bounds.
     */
    addBarriers(height, width, margin) {
        this.barriers = [];
        this.barriersScale = 0.97;
        //four walls around the desk: +Z, -Z, +X, -X
        const barriersConfig = [
            { axis: new Vec3(1, 0, 0), angle: Math.PI, position: new Vec3(0, 0, (height - margin.top * 2) * this.barriersScale) },
            { axis: new Vec3(1, 0, 0), angle: 0, position: new Vec3(0, 0, (-height + margin.bottom * 2) * this.barriersScale) },
            { axis: new Vec3(0, 1, 0), angle: -Math.PI / 2, position: new Vec3((width - margin.right * 2) * this.barriersScale, 0, 0) },
            { axis: new Vec3(0, 1, 0), angle: Math.PI / 2, position: new Vec3((-width + margin.left * 2) * this.barriersScale, 0, 0) }
        ];

        for (const { axis, angle, position } of barriersConfig) {
            const barrier = new Body({ allowSleep: false, mass: 0, shape: new Plane(), material: this.barrier_body_material });
            barrier.quaternion.setFromAxisAngle(axis, angle);
            barrier.position.copy(position);
            this.world.addBody(barrier);
            this.barriers.push(barrier);
        }
    }

    /**
     * Updates the positions of the barriers based on new world dimensions.
     */
    updateBarriers({height, width, margin}) {
        const h = height * METERS_TO_LEGACY;
        const w = width * METERS_TO_LEGACY;
        const mt = margin.top * METERS_TO_LEGACY;
        const mb = margin.bottom * METERS_TO_LEGACY;
        const mr = margin.right * METERS_TO_LEGACY;
        const ml = margin.left * METERS_TO_LEGACY;
        this.barriers[0].position.set(0, 0, (h - mt * 2) * this.barriersScale);
        this.barriers[1].position.set(0, 0, (-h + mb * 2) * this.barriersScale);
        this.barriers[2].position.set((w - mr * 2) * this.barriersScale, 0, 0);
        this.barriers[3].position.set((-w + ml * 2) * this.barriersScale, 0, 0);
    }

    //create a joint body for a held die, one per addConstraint call
    _createJointBody() {
        const shape = new Sphere(0.1);
        const joint = new Body({ mass: 0 });
        joint.addShape(shape);
        joint.collisionFilterGroup = 0;
        joint.collisionFilterMask = 0;
        this.world.addBody(joint);
        return joint;
    }

    /**
     * Adds a dice to the world simulation with the dice_body_material.
     */
    createDice({id, shape, material, vectordata, mass, startAtIteration, options}) {
        const resolvedShape = this.shapeList.get(shape);
        const body = new Body({ allowSleep: true, sleepSpeedLimit: 75, sleepTimeLimit: 0.9, mass: mass, shape: resolvedShape, material: this.dice_body_material });
        body.type = Body.DYNAMIC;
        body.position.set(vectordata.pos.x * METERS_TO_LEGACY, vectordata.pos.y * METERS_TO_LEGACY, vectordata.pos.z * METERS_TO_LEGACY);
        body.quaternion.setFromAxisAngle(new Vec3(vectordata.axis.x, vectordata.axis.y, vectordata.axis.z), vectordata.axis.a * Math.PI * 2);
        body.angularVelocity.set(vectordata.angle.x, vectordata.angle.y, vectordata.angle.z);
        body.velocity.set(vectordata.velocity.x * METERS_TO_LEGACY, vectordata.velocity.y * METERS_TO_LEGACY, vectordata.velocity.z * METERS_TO_LEGACY);
        body.linearDamping = 0.1;
        body.angularDamping = 0.1;
        body.addEventListener('collide', this.eventCollide.bind(this));

        //We add some informations about the dice to the CANNON body to be used in the collide event
        body.diceType = vectordata.type;
        body.diceShape = shape;
        body.diceMaterial = material;
        body.secretRoll = options?.secret ?? false;
        body.persistent = options?.persistent ?? false;
        body.startAtIteration = startAtIteration;

        this.diceList.set(id, body);
    }

    createDiceBatch(specs) {
        const addToWorld = [];
        for (const spec of specs) {
            this.createDice(spec);
            if (spec.startAtIteration === 0) addToWorld.push(spec.id);
        }
        for (const id of addToWorld) {
            this.world.addBody(this.diceList.get(id));
        }
    }

    addDice(id) {
        const dice = this.diceList.get(id);
        this.world.addBody(dice);
    }

    removeDice(ids) {
        for (const id of ids) {
            //clean up any active constraint before removing the body
            const entry = this.diceConstraints.get(id);
            if (entry) {
                this.world.removeConstraint(entry.constraint);
                this.world.removeBody(entry.joint);
                this.diceConstraints.delete(id);
            }

            const dice = this.diceList.get(id);
            this.world.removeBody(dice);

            this.diceList.delete(id);
        }
        //wake survivors so they react to removed supports
        for (const [, dice] of this.diceList) dice.wakeUp();
    }

    applyImpulse({id, velocity, angularVelocity}) {
        const dice = this.diceList.get(id);
        if (!dice) return;

        dice.result = null;
        dice.wakeUp();
        dice.type = Body.DYNAMIC;
        dice.velocity.set(velocity.x * METERS_TO_LEGACY, velocity.y * METERS_TO_LEGACY, velocity.z * METERS_TO_LEGACY);
        dice.angularVelocity.set(angularVelocity.x, angularVelocity.y, angularVelocity.z);
    }

    getBodyQuaternion(id) {
        const dice = this.diceList.get(id);
        if (!dice) return null;
        return {
            x: dice.quaternion.x,
            y: dice.quaternion.y,
            z: dice.quaternion.z,
            w: dice.quaternion.w
        };
    }

    setBodyPosition({ id, position }) {
        const dice = this.diceList.get(id);
        if (!dice) return;
        dice.position.set(position.x * METERS_TO_LEGACY, position.y * METERS_TO_LEGACY, position.z * METERS_TO_LEGACY);
        dice.velocity.set(0, 0, 0);
        dice.angularVelocity.set(0, 0, 0);
    }

    //batch setBodyPosition to avoid N worker messages per frame
    setBodyPositions({ updates }) {
        for (const { id, position } of updates) {
            const dice = this.diceList.get(id);
            if (!dice) continue;
            dice.position.set(position.x * METERS_TO_LEGACY, position.y * METERS_TO_LEGACY, position.z * METERS_TO_LEGACY);
            dice.velocity.set(0, 0, 0);
            dice.angularVelocity.set(0, 0, 0);
        }
    }

    setCollisionResponse({ ids, enabled }) {
        for (const id of ids) {
            const body = this.diceList.get(id);
            if (body) body.collisionResponse = enabled;
        }
    }

    cleanAfterThrow() {
        //no-op: dynamic tracking allocates per-sim buffers, nothing to reset on bodies
    }

    /**
     * Collide event handler for dice bodies.
     */
    eventCollide({ body, target }) {
        if (!body) return;
        //skip phantom collisions involving ghostified (no collision response) bodies
        if (body.collisionResponse === false || target.collisionResponse === false) return;

        const now = body.world.stepnumber;
        const currentSoundType = body.mass > 0 ? 'dice' : 'table';

        if (this.shouldSkipSound(now, currentSoundType)) return;

        if (body.mass > 0) { // dice to dice collision
            this.handleDiceCollision(body, target);
        } else { // dice to table collision
            this.handleTableCollision(body, target);
        }

        this.updateLastSound(now);
    }

    /**
     * Determines if the sound should be skipped based on the current world step and sound type.
     */
    shouldSkipSound(now, currentSoundType) {
        const soundPlayedThisStep = this.lastSoundStep === now;
        const notEnoughDelay = this.lastSound > now;

        if (soundPlayedThisStep || notEnoughDelay) {
            const sameSoundType = currentSoundType === 'dice' && this.lastSoundType === 'dice';
            return !(currentSoundType !== 'dice') || sameSoundType;
        }
        return false;
    }

    /**
     * Handles dice to dice collision and plays appropriate sound.
     */
    handleDiceCollision(body, target) {
        const speed = body.velocity.length();
        if (speed < 250) return;

        const strength = this.calculateStrength(speed, 550, 0.2);
        const shouldMute = this.muteSoundSecretRolls && (body.secretRoll || target.secretRoll);
        const finalStrength = shouldMute ? 0 : strength;

        if (this.animstate === "simulate") {
            this.detectedCollides[this.iteration] = ["dice", body.diceType, body.diceMaterial, finalStrength];
        } else {
            this.host.emit("collide", { source: "dice", type: body.diceType, material: body.diceMaterial, strength: finalStrength });
        }
        this.lastSoundType = 'dice';
    }

    /**
     * Handles dice to table collision and plays appropriate sound.
     */
    handleTableCollision(body, target) {
        const speed = target.velocity.length();
        if (speed < 100) return;

        const strength = this.calculateStrength(speed, 500, 0.2);
        const shouldMute = this.muteSoundSecretRolls && (body.secretRoll || target.secretRoll);
        const finalStrength = shouldMute ? 0 : strength;

        if (this.animstate === "simulate") {
            this.detectedCollides[this.iteration] = ["table", null, null, finalStrength];
        } else {
            this.host.emit("collide", { source: "table", type: null, material: null, strength: finalStrength });
        }

        this.lastSoundType = 'table';
    }

    /**
     * Calculates the strength of the sound based on the speed, max speed, and minimum strength.
     */
    calculateStrength(speed, maxSpeed, minStrength) {
        return Math.max(Math.min(speed / maxSpeed, 1), minStrength);
    }

    /**
     * Updates the last sound step and last sound properties based on the current world step.
     */
    updateLastSound(now) {
        this.lastSoundStep = now;
        this.lastSound = now + this.soundDelay;
    }

    addConstraint({id, pos}){
        const dice = this.diceList.get(id);
        if (!dice) return;

        //idempotent: already constrained, just reposition
        if (this.diceConstraints.has(id)) {
            return this.updateConstraint({ positions: { [id]: pos } });
        }

        //disable sleep while held so the constraint solver stays active
        const prevAllowSleep = dice.allowSleep;
        dice.allowSleep = false;
        dice.wakeUp();

        const lx = pos.x * METERS_TO_LEGACY;
        const ly = pos.y * METERS_TO_LEGACY;
        const lz = pos.z * METERS_TO_LEGACY;

        //persistent = center pivot, ephemeral = click-point pivot
        let pivot;
        let anchorPos;
        if (dice.persistent) {
            pivot = new Vec3(0, 0, 0);
            //keep current xz so pickup doesn't teleport, lift to caller's y
            anchorPos = { x: dice.position.x, y: ly, z: dice.position.z };
        } else {
            let v1 = new Vec3(lx, ly, lz).vsub(dice.position);
            // Apply anti-quaternion to vector to tranform it into the local body coordinate system
            let antiRot = dice.quaternion.inverse();
            pivot = antiRot.vmult(v1); // pivot is not in local body coordinates
            anchorPos = { x: lx, y: ly, z: lz };
        }

        const joint = this._createJointBody();
        joint.position.set(anchorPos.x, anchorPos.y, anchorPos.z);

        const constraint = new PointToPointConstraint(dice, pivot, joint, new Vec3(0, 0, 0));
        this.world.addConstraint(constraint);

        this.diceConstraints.set(id, { joint, constraint, prevAllowSleep });
    }

    updateConstraint(payload){
        if (this.diceConstraints.size === 0) return;

        const positions = payload?.positions;
        if (!positions) return;

        for (const [id, pos] of Object.entries(positions)) {
            //Object.entries gives string keys, Map uses numbers
            const entry = this.diceConstraints.get(Number(id)) ?? this.diceConstraints.get(id);
            if (!entry) continue;
            entry.joint.position.set(pos.x * METERS_TO_LEGACY, pos.y * METERS_TO_LEGACY, pos.z * METERS_TO_LEGACY);
            entry.constraint.update();
            //wake to keep solver active even with allowSleep=false
            const dice = this.diceList.get(Number(id)) ?? this.diceList.get(id);
            if (dice) dice.wakeUp();
        }
    }

    //remove constraints for given ids (or all), restore sleep policy
    removeConstraint(payload){
        const ids = payload?.ids ?? Array.from(this.diceConstraints.keys());
        for (const id of ids) {
            const entry = this.diceConstraints.get(id);
            if (!entry) continue;
            this.world.removeConstraint(entry.constraint);
            this.world.removeBody(entry.joint);
            const dice = this.diceList.get(id);
            if (dice) dice.allowSleep = entry.prevAllowSleep ?? true;
            this.diceConstraints.delete(id);
        }
    }

    createShape({name, radius, definition}){
        const legacyRadius = radius * METERS_TO_LEGACY;
        switch(definition.type){
            case "ConvexPolyhedron":
                this.shapeList.set(name, this.loadShape(definition.vertices, definition.faces, legacyRadius, definition.skipLastFaceIndex));
                break;
            case "Cylinder":
                this.shapeList.set(name, new Cylinder(legacyRadius*definition.radiusTop, legacyRadius*definition.radiusBottom, legacyRadius*definition.height, definition.numSegments));
                break;
            default:
                throw new Error("Unknown shape type: " + definition.type);
        }
        this.shapeDefs.set(name, definition);
    }

    loadShape(vertices, faces, radius, skipLastFaceIndex = false) {
        const cv = new Array(vertices.length);
        const cf = new Array(faces.length);

        for (let i = 0; i < vertices.length; ++i) {
            const v = vertices[i];
            cv[i] = new Vec3(v[0] * radius, v[1] * radius, v[2] * radius);
        }

        for (let i = 0; i < faces.length; ++i) {
            cf[i] = skipLastFaceIndex ? faces[i].slice(0, faces[i].length - 1) : faces[i];
        }
        return new ConvexPolyhedron({ vertices: cv, faces: cf });
    }

    getDiceValue(id){
        const dice = this.diceList.get(id);

        if(!dice)
            return null;
        if(dice.result)
            return dice.result;

        const faceValues = this.shapeDefs.get(dice.diceShape).faceValues;

        //d4 reads from bottom face, everything else from top
        const vector = new Vector3(0, dice.diceShape == 'd4' ? -1 : 1, 0);
        const faceCannon = new Vector3();
        let closest_face, closest_angle = Math.PI * 2;
        for (let i = 0, l = dice.shapes[0].faceNormals.length; i < l; ++i) {
            if(faceValues[i] == 0)
                continue;
            faceCannon.copy(dice.shapes[0].faceNormals[i]);

            const angle = faceCannon.applyQuaternion(dice.quaternion).angleTo(vector);
            if (angle < closest_angle) {
                closest_angle = angle;
                closest_face = i;
            }
        }
        const dieValue = faceValues[closest_face];
        dice.result = dieValue;
        this.diceList.set(id, dice);

        return dieValue;
    }

    reset(){
        this.lastSoundType = '';
        this.lastSoundStep = 0;
        this.lastSound = 0;
        this.detectedCollides = new Array(1000);
        this.iterationsNeeded = 0;
        this.animstate = 'simulate';
        this.iteration = 0;
    }

    simulateThrow({minIterations, nbIterationsBetweenRolls, framerate, canBeFlipped, impulses}) {
        this.reset();

        this.minIterations = minIterations;
        this.nbIterationsBetweenRolls = nbIterationsBetweenRolls;
        this.framerate = framerate;
        this.canBeFlipped = canBeFlipped;

        //apply impulses atomically before the first world step
        const impulseIds = new Set();
        if (impulses) {
            for (const [impId, imp] of Object.entries(impulses)) {
                const numId = Number(impId);
                const dice = this.diceList.get(numId) ?? this.diceList.get(impId);
                if (!dice || !imp) continue;
                impulseIds.add(numId);
                dice.result = null;
                dice.wakeUp();
                dice.type = Body.DYNAMIC;
                dice.velocity.set(imp.velocity.x * METERS_TO_LEGACY, imp.velocity.y * METERS_TO_LEGACY, imp.velocity.z * METERS_TO_LEGACY);
                dice.angularVelocity.set(imp.angularVelocity.x, imp.angularVelocity.y, imp.angularVelocity.z);
            }
        }

        //primary dice determine when the sim ends:
        //impulse recipients + non-persistent dice (ephemeral, including dead from prior throws)
        const primaryDiceRefs = [];
        for (const [id, dice] of this.diceList) {
            if (impulseIds.has(id)) { primaryDiceRefs.push(dice); continue; }
            if (!dice.persistent) primaryDiceRefs.push(dice);
        }

        const MAX_FRAMES = 1001;
        const maxIterations = 1000;

        //dynamic buffer tracking: allocate per-die buffers on demand, backfill rest frames
        const tracked = new Map();

        //snapshot sleeping dice positions for backfill (taken after impulses so recipients are awake)
        const restingSnapshots = new Map();
        for (const [id, dice] of this.diceList) {
            if (dice.sleepState >= 2) {
                restingSnapshots.set(id, {
                    px: dice.position.x, py: dice.position.y, pz: dice.position.z,
                    qx: dice.quaternion.x, qy: dice.quaternion.y, qz: dice.quaternion.z, qw: dice.quaternion.w
                });
            }
        }

        const startTracking = (trackId, dice, frame) => {
            const posBuffer = new Float32Array(MAX_FRAMES * 3);
            const quatBuffer = new Float32Array(MAX_FRAMES * 4);
            const snap = restingSnapshots.get(trackId);
            const rawPos = snap ? [snap.px, snap.py, snap.pz] : [dice.position.x, dice.position.y, dice.position.z];
            const bfPos = [rawPos[0] * LEGACY_TO_METERS, rawPos[1] * LEGACY_TO_METERS, rawPos[2] * LEGACY_TO_METERS];
            const bfQuat = snap ? [snap.qx, snap.qy, snap.qz, snap.qw] : [dice.quaternion.x, dice.quaternion.y, dice.quaternion.z, dice.quaternion.w];
            for (let f = 0; f <= frame; f++) {
                posBuffer.set(bfPos, f * 3);
                quatBuffer.set(bfQuat, f * 4);
            }
            tracked.set(trackId, { dice, posBuffer, quatBuffer });
        };

        //seed: track awake dynamic dice already in the world (skip stagger-pending and sleeping bystanders)
        for (const [id, dice] of this.diceList) {
            if (dice.startAtIteration > 0) continue;
            if (dice.mass === 0) continue;
            if (dice.sleepState >= 2) continue;
            startTracking(id, dice, 0);
        }

        //simulation loop (inline, replaces runPhysicsSimulation)
        while (this.iteration < maxIterations) {
            ++this.iteration;

            //stagger: add bodies at their designated iteration
            if (!(this.iteration % nbIterationsBetweenRolls)) {
                for (const [id, dice] of this.diceList) {
                    if (dice.startAtIteration === this.iteration) {
                        this.world.addBody(dice);
                        if (!tracked.has(id)) startTracking(id, dice, this.iteration);
                    }
                }
            }

            this.world.step(framerate);

            //record positions/quaternions for all tracked dice
            for (const entry of tracked.values()) {
                const d = entry.dice;
                entry.posBuffer.set([d.position.x * LEGACY_TO_METERS, d.position.y * LEGACY_TO_METERS, d.position.z * LEGACY_TO_METERS], this.iteration * 3);
                entry.quatBuffer.set([d.quaternion.x, d.quaternion.y, d.quaternion.z, d.quaternion.w], this.iteration * 4);
            }

            //pick up any die that woke this frame (collision knocked a bystander)
            for (const [id, dice] of this.diceList) {
                if (tracked.has(id)) continue;
                if (dice.mass === 0) continue;
                if (dice.sleepState >= 2) continue;
                startTracking(id, dice, this.iteration);
            }

            //exit when all primary dice have settled
            if (this.iteration >= (minIterations || 0)) {
                let allSettled = true;
                for (const ref of primaryDiceRefs) {
                    if (ref.sleepState < 2) { allSettled = false; break; }
                }
                if (allSettled) break;
            }
        }

        this.iterationsNeeded = this.iteration;

        //post-sim: cache face values for all tracked dice, make ephemerals static
        const faceValues = {};
        const finalQuaternions = {};
        for (const [id, dice] of this.diceList) {
            if (tracked.has(id)) {
                dice.result = null;
                const val = this.getDiceValue(id);
                faceValues[id] = val;
                finalQuaternions[id] = { x: dice.quaternion.x, y: dice.quaternion.y, z: dice.quaternion.z, w: dice.quaternion.w };
            }
            if (!dice.persistent && !canBeFlipped) {
                if (!dice.result) dice.result = this.getDiceValue(id);
                dice.mass = 0;
                dice.dead = this.iterationsNeeded;
                dice.updateMassProperties();
            }
        }

        this.animstate = 'throw';

        //build transferable response from tracked buffers
        const ids = [];
        const quaternionsBuffers = [];
        const positionsBuffers = [];
        const deads = [];

        for (const [trackId, entry] of tracked) {
            ids.push(trackId);
            quaternionsBuffers.push(entry.quatBuffer.buffer);
            positionsBuffers.push(entry.posBuffer.buffer);
            deads.push(entry.dice.dead ?? false);
        }

        return new RegisterPromise.TransferableResponse({
            ids: ids,
            quaternionsBuffers: quaternionsBuffers,
            positionsBuffers: positionsBuffers,
            detectedCollides: this.detectedCollides,
            deads: deads,
            iterationsNeeded: this.iterationsNeeded,
            faceValues: faceValues,
            finalQuaternions: finalQuaternions
        }, [...quaternionsBuffers, ...positionsBuffers]);
    }

    runPhysicsSimulation() {
        while (!this.throwFinished()) {
            //Before each step, we copy the quaternions of every die in an array
            ++this.iteration;

            if (!(this.iteration % this.nbIterationsBetweenRolls)) {
                for(const [id, dice] of this.diceList){
                    if(dice.startAtIteration == this.iteration){
                        this.world.addBody(dice);
                    }
                }
            }
            this.world.step(this.framerate);


            for (let i = 0; i < this.world.bodies.length; i++) {
                if (this.world.bodies[i].stepPositions) {
                    this.world.bodies[i].stepQuaternions.set([this.world.bodies[i].quaternion.x, this.world.bodies[i].quaternion.y, this.world.bodies[i].quaternion.z,this.world.bodies[i].quaternion.w], this.iteration*4);
    
                    this.world.bodies[i].stepPositions.set([this.world.bodies[i].position.x * LEGACY_TO_METERS, this.world.bodies[i].position.y * LEGACY_TO_METERS, this.world.bodies[i].position.z * LEGACY_TO_METERS], this.iteration*3);
                }
            }
        }
    }

    throwFinished() {
        let stopped = true;
        if (this.iteration <= this.minIterations) return false;

        for(const [id, dice] of this.diceList){
            if (dice.persistent) continue;
            if (dice.sleepState < 2) {
                stopped = false;
                break;
            } else {
                dice.asleepAtIteration = this.iteration;
            }
        }

        if (this.iteration >= 1000)
            stopped = true;
        //Throw is actually finished
        if (stopped) {
            this.iterationsNeeded = this.iteration;
            for(const [id, dice] of this.diceList){
                if (dice.persistent) continue;
                dice.result = this.getDiceValue(id);
                if(!this.canBeFlipped){
                    //make the current dice on the board STATIC object so they can't be knocked
                    dice.mass = 0;
                    dice.dead = dice.asleepAtIteration || false;
                    dice.updateMassProperties();
                }
                this.diceList.set(id, dice);
            }
        }
        return stopped;
    }

    playStep({time_diff}) {
        if(this.animstate == 'simulate')
            return;
        const ids = [];
        const quaternions = new Float32Array(this.diceList.size * 4);
        const positions = new Float32Array(this.diceList.size * 3);
        //if any constraint is active, world can't be asleep (held dice must keep stepping)
        let worldAsleep = this.diceConstraints.size === 0;
        if (worldAsleep) {
            for (let i = 0; i < this.world.bodies.length; i++) {
                if (this.world.bodies[i].sleepState < 2) {
                    worldAsleep = false;
                    break;
                }
            }
        }
        if (!worldAsleep) {
            this.world.step(this.framerate, time_diff);
            for(const [id, dice] of this.diceList){
                if(!dice.dead){
                    ids.push(id);
                    quaternions.set([dice.quaternion.x, dice.quaternion.y, dice.quaternion.z,dice.quaternion.w], ids.length*4-4);

                    positions.set([dice.position.x * LEGACY_TO_METERS, dice.position.y * LEGACY_TO_METERS, dice.position.z * LEGACY_TO_METERS], ids.length*3-3);
                }
            }
        }
        return new RegisterPromise.TransferableResponse({ids: ids, quaternionsBuffers: quaternions.buffer, positionsBuffers: positions.buffer, worldAsleep: worldAsleep}, [quaternions.buffer, positions.buffer]);
    }

    //debug function to get the state of the CANNON world
    getWorldInfo() {
        console.log(`World iteration: ${this.world.stepnumber}`);

        console.log(`World has ${this.world.bodies.length} bodies:`);
        for (let i = 0; i < this.world.bodies.length; i++) {
            console.log(`body ${i}:`);
            console.log(this.world.bodies[i]);
        }

        console.log(`World has ${this.world.constraints.length} constraints:`);
        for (let i = 0; i < this.world.constraints.length; i++) {
            console.log(`constraint ${i}:`);
            console.log(this.world.constraints[i]);
        }
    }
}

new PhysicsWorker();
