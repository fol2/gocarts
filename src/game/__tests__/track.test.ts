import { describe, expect, it } from 'vitest';
import { ROAD_WIDTH, TRACK_LENGTH, TRACK_PICKUP_RATIOS, WORLD_LIMIT, constrainPointToRoad, isWithinWorld, routePointAt, routePointByRatio, startGridPose } from '../track';

describe('track route', () => {
  it('creates a much longer road than the first prototype loop', () => {
    expect(TRACK_LENGTH).toBeGreaterThan(260);
    expect(WORLD_LIMIT).toBeGreaterThanOrEqual(70);
  });

  it('wraps route positions cleanly for lap movement', () => {
    const start = routePointAt(0);
    const wrapped = routePointAt(TRACK_LENGTH);
    const nearFinish = routePointAt(TRACK_LENGTH - 0.01);

    expect(wrapped.x).toBeCloseTo(start.x, 5);
    expect(wrapped.z).toBeCloseTo(start.z, 5);
    expect(isWithinWorld(nearFinish)).toBe(true);
  });

  it('keeps pickup route points inside the playable world', () => {
    expect(TRACK_PICKUP_RATIOS).toHaveLength(10);
    expect(TRACK_PICKUP_RATIOS.every((ratio) => isWithinWorld(routePointByRatio(ratio)))).toBe(true);
  });

  it('places start-grid slots inside the playable road world', () => {
    expect(Array.from({ length: 6 }, (_, index) => isWithinWorld(startGridPose(index))).every(Boolean)).toBe(true);
  });

  it('projects off-road points back inside the road width', () => {
    const result = constrainPointToRoad({ x: 0, z: 0 });

    expect(result.onRoad).toBe(false);
    expect(Math.hypot(result.point.x, result.point.z)).toBeGreaterThan(ROAD_WIDTH);
    expect(constrainPointToRoad(result.point).onRoad).toBe(true);
  });
});
