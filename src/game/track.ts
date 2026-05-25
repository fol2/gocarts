export interface CoursePoint {
  x: number;
  z: number;
}

export interface CoursePose extends CoursePoint {
  heading: number;
}

export interface CourseSegment {
  start: CoursePoint;
  end: CoursePoint;
  midpoint: CoursePoint;
  heading: number;
  length: number;
  startDistance: number;
}

export interface RoadConstraintResult {
  point: CoursePoint;
  onRoad: boolean;
}

interface RouteProjection {
  point: CoursePoint;
  routeDistance: number;
  offset: number;
}

export const ROAD_WIDTH = 11;
export const WORLD_LIMIT = 72;

export const TRACK_WAYPOINTS: CoursePoint[] = [
  { x: 0, z: -48 },
  { x: 24, z: -52 },
  { x: 49, z: -32 },
  { x: 56, z: -2 },
  { x: 43, z: 28 },
  { x: 12, z: 47 },
  { x: -26, z: 43 },
  { x: -55, z: 15 },
  { x: -50, z: -24 },
  { x: -24, z: -43 }
];

export const TRACK_PICKUP_RATIOS = [0.06, 0.14, 0.23, 0.34, 0.45, 0.57, 0.68, 0.78, 0.88, 0.96];

export const TRACK_SEGMENTS = buildSegments(TRACK_WAYPOINTS);
export const TRACK_LENGTH = TRACK_SEGMENTS.reduce((total, segment) => total + segment.length, 0);

export function routePointAt(distance: number): CoursePose {
  const wrappedDistance = wrapDistance(distance);
  const segment =
    TRACK_SEGMENTS.find((candidate) => wrappedDistance >= candidate.startDistance && wrappedDistance <= candidate.startDistance + candidate.length) ??
    TRACK_SEGMENTS[TRACK_SEGMENTS.length - 1];
  const progress = segment.length === 0 ? 0 : (wrappedDistance - segment.startDistance) / segment.length;

  return {
    x: lerp(segment.start.x, segment.end.x, progress),
    z: lerp(segment.start.z, segment.end.z, progress),
    heading: segment.heading
  };
}

export function routePointByRatio(ratio: number): CoursePose {
  return routePointAt(TRACK_LENGTH * ratio);
}

export function startGridPose(slot: number): CoursePose {
  const row = Math.floor(slot / 2);
  const column = slot % 2;
  const base = routePointAt(TRACK_LENGTH - 5 - row * 6);
  const sideOffset = column === 0 ? -2.4 : 2.4;

  return {
    x: base.x + Math.cos(base.heading) * sideOffset,
    z: base.z - Math.sin(base.heading) * sideOffset,
    heading: base.heading
  };
}

export function trackSidePoint(distance: number, side: -1 | 1, offset = ROAD_WIDTH / 2 + 1.3): CoursePoint {
  const point = routePointAt(distance);

  return {
    x: point.x + Math.cos(point.heading) * side * offset,
    z: point.z - Math.sin(point.heading) * side * offset
  };
}

export function constrainPointToRoad(point: CoursePoint, maxOffset = ROAD_WIDTH / 2 - 0.65): RoadConstraintResult {
  const nearest = nearestPointOnRoute(point);
  const dx = point.x - nearest.x;
  const dz = point.z - nearest.z;
  const offset = Math.hypot(dx, dz);

  if (offset <= maxOffset) {
    return {
      point,
      onRoad: true
    };
  }

  if (offset === 0) {
    return {
      point: nearest,
      onRoad: false
    };
  }

  const scale = maxOffset / offset;

  return {
    point: {
      x: nearest.x + dx * scale,
      z: nearest.z + dz * scale
    },
    onRoad: false
  };
}

export function routeDistanceForPoint(point: CoursePoint): number {
  return nearestRouteProjection(point).routeDistance;
}

export function isWithinWorld(point: CoursePoint): boolean {
  return Math.abs(point.x) <= WORLD_LIMIT && Math.abs(point.z) <= WORLD_LIMIT;
}

function buildSegments(points: CoursePoint[]): CourseSegment[] {
  let distance = 0;

  return points.map((start, index) => {
    const end = points[(index + 1) % points.length];
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.hypot(dx, dz);
    const segment: CourseSegment = {
      start,
      end,
      midpoint: {
        x: (start.x + end.x) / 2,
        z: (start.z + end.z) / 2
      },
      heading: Math.atan2(dx, dz),
      length,
      startDistance: distance
    };

    distance += length;
    return segment;
  });
}

function nearestPointOnRoute(point: CoursePoint): CoursePoint {
  return nearestRouteProjection(point).point;
}

function nearestRouteProjection(point: CoursePoint): RouteProjection {
  let closest: RouteProjection = {
    point: TRACK_SEGMENTS[0].start,
    routeDistance: TRACK_SEGMENTS[0].startDistance,
    offset: Number.POSITIVE_INFINITY
  };

  for (const segment of TRACK_SEGMENTS) {
    const dx = segment.end.x - segment.start.x;
    const dz = segment.end.z - segment.start.z;
    const lengthSquared = dx * dx + dz * dz;
    const amount = lengthSquared === 0 ? 0 : clamp(((point.x - segment.start.x) * dx + (point.z - segment.start.z) * dz) / lengthSquared, 0, 1);
    const candidate = {
      x: segment.start.x + dx * amount,
      z: segment.start.z + dz * amount
    };
    const offset = Math.hypot(point.x - candidate.x, point.z - candidate.z);

    if (offset < closest.offset) {
      closest = {
        point: candidate,
        routeDistance: wrapDistance(segment.startDistance + segment.length * amount),
        offset
      };
    }
  }

  return closest;
}

function wrapDistance(distance: number): number {
  return ((distance % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
