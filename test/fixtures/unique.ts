// This file has completely unique code with no duplication

export class Vector3D {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number,
  ) {}

  magnitude(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
  }

  dot(other: Vector3D): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  cross(other: Vector3D): Vector3D {
    return new Vector3D(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x,
    );
  }

  normalize(): Vector3D {
    const mag = this.magnitude();
    if (mag === 0) throw new Error('Cannot normalize zero vector');
    return new Vector3D(this.x / mag, this.y / mag, this.z / mag);
  }
}
