import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  type Bee,
  type Fly,
  type Treat,
  selectFlyInSwatReach,
} from '../lib/meeting';

export const swatImpactDelayMs = 70;
export const knockdownLifetimeMs = 620;
export const swatRecoverDelayMs = 190;
export const splatLifetimeMs = 420;

export type ArenaPoint = {
  x: number;
  y: number;
};

export type SwatTarget = ArenaPoint & {
  flyId: number;
};

export type SwatImpact = ArenaPoint & {
  id: number;
};

export type FlySplat = SwatImpact & {
  rotation: number;
};

export type KnockedFly = SwatImpact & {
  drift: number;
  flyId: number;
  rotation: number;
};

export type SwatterPose = ArenaPoint & {
  rotation: number;
  swingKey: number;
  isTracking: boolean;
  isSwinging: boolean;
  impact: SwatImpact | null;
  knockdowns: KnockedFly[];
  splats: FlySplat[];
};

const initialSwatterPose: SwatterPose = {
  x: 52,
  y: 58,
  rotation: 0,
  swingKey: 0,
  isTracking: false,
  isSwinging: false,
  impact: null,
  knockdowns: [],
  splats: [],
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const getArenaPoint = (
  rect: DOMRect,
  clientX: number,
  clientY: number
): ArenaPoint => ({
  x: clampPercent(((clientX - rect.left) / rect.width) * 100),
  y: clampPercent(((clientY - rect.top) / rect.height) * 100),
});

type UseSwatterArgs = {
  isActive: boolean;
  flies: Fly[];
  treat: Treat | null;
  bee: Bee | null;
  onSwatFly: (flyId: number) => void;
  onSwatTreat: (point: ArenaPoint) => void;
  onSwatBee: (point: ArenaPoint) => void;
};

type UseSwatterReturn = {
  swatter: SwatterPose;
  knockedFlyIds: Set<number>;
  handlePointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handlePointerEnter: () => void;
  handlePointerLeave: () => void;
  handleKeyboardSwat: (target: SwatTarget) => void;
};

export const useSwatter = ({
  isActive,
  flies,
  treat,
  bee,
  onSwatFly,
  onSwatTreat,
  onSwatBee,
}: UseSwatterArgs): UseSwatterReturn => {
  const [swatter, setSwatter] = useState(initialSwatterPose);
  const lastPointerRef = useRef<ArenaPoint | null>(null);
  const scheduledTimeoutsRef = useRef<number[]>([]);
  const nextEffectIdRef = useRef(0);
  const onSwatFlyRef = useRef(onSwatFly);
  const onSwatTreatRef = useRef(onSwatTreat);
  const onSwatBeeRef = useRef(onSwatBee);

  useEffect(() => {
    onSwatFlyRef.current = onSwatFly;
  }, [onSwatFly]);

  useEffect(() => {
    onSwatTreatRef.current = onSwatTreat;
  }, [onSwatTreat]);

  useEffect(() => {
    onSwatBeeRef.current = onSwatBee;
  }, [onSwatBee]);

  const knockedFlyIds = new Set(
    swatter.knockdowns.map((knockdown) => knockdown.flyId)
  );

  const scheduleSwatterTimeout = (callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      callback();
      scheduledTimeoutsRef.current = scheduledTimeoutsRef.current.filter(
        (scheduledTimeoutId) => scheduledTimeoutId !== timeoutId
      );
    }, delay);

    scheduledTimeoutsRef.current.push(timeoutId);
  };

  useEffect(
    () => () => {
      for (const timeoutId of scheduledTimeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }
    },
    []
  );

  useEffect(() => {
    if (isActive) {
      return;
    }

    lastPointerRef.current = null;
    setSwatter((current) => ({
      ...initialSwatterPose,
      x: current.x,
      y: current.y,
    }));
  }, [isActive]);

  const triggerSwatAt = (point: ArenaPoint, target: SwatTarget | null) => {
    nextEffectIdRef.current += 1;
    const effectId = nextEffectIdRef.current;
    const effectPoint = target ?? point;
    const effectRotation = -18 + (effectId % 5) * 9;

    setSwatter((current) => ({
      ...current,
      ...point,
      swingKey: effectId,
      isTracking: true,
      isSwinging: true,
      impact: {
        ...effectPoint,
        id: effectId,
      },
    }));

    scheduleSwatterTimeout(() => {
      if (target === null) {
        return;
      }

      setSwatter((current) => ({
        ...current,
        knockdowns: [
          ...current.knockdowns.slice(-5),
          {
            ...target,
            drift: effectId % 2 === 0 ? -18 : 18,
            flyId: target.flyId,
            id: effectId,
            rotation: effectRotation,
          },
        ],
      }));

      scheduleSwatterTimeout(() => {
        onSwatFlyRef.current(target.flyId);
        setSwatter((current) => ({
          ...current,
          knockdowns: current.knockdowns.filter(
            (knockdown) => knockdown.id !== effectId
          ),
          splats: [
            ...current.splats.slice(-7),
            {
              ...target,
              id: effectId,
              rotation: effectRotation,
              y: Math.min(94, target.y + 22),
            },
          ],
        }));

        scheduleSwatterTimeout(() => {
          setSwatter((current) => ({
            ...current,
            splats: current.splats.filter((splat) => splat.id !== effectId),
          }));
        }, splatLifetimeMs);
      }, knockdownLifetimeMs);

      scheduleSwatterTimeout(() => {
        setSwatter((current) => ({
          ...current,
          knockdowns: current.knockdowns.filter(
            (knockdown) => knockdown.id !== effectId
          ),
        }));
      }, knockdownLifetimeMs + splatLifetimeMs);
    }, swatImpactDelayMs);

    scheduleSwatterTimeout(() => {
      setSwatter((current) => ({
        ...current,
        isSwinging: false,
        impact: current.impact?.id === effectId ? null : current.impact,
      }));
    }, swatRecoverDelayMs);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isActive) {
      return;
    }

    const point = getArenaPoint(
      event.currentTarget.getBoundingClientRect(),
      event.clientX,
      event.clientY
    );
    const previousPoint = lastPointerRef.current;
    const horizontalMotion = previousPoint ? point.x - previousPoint.x : 0;
    lastPointerRef.current = point;

    setSwatter((current) => ({
      ...current,
      ...point,
      rotation: Math.max(-5, Math.min(5, horizontalMotion * 0.45)),
      isTracking: true,
    }));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isActive) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const rect = event.currentTarget.getBoundingClientRect();
    const point = getArenaPoint(rect, event.clientX, event.clientY);
    // Visually the swatter head sits roughly 7% of arena height above the
    // cursor (the cursor anchors near the bottom of the swatter), so search
    // for hit-targets at the head position rather than at the raw cursor.
    const swatHeadPoint: ArenaPoint = {
      x: point.x,
      y: clampPercent(point.y - 7),
    };
    const availableFlies = flies.filter((fly) => !knockedFlyIds.has(fly.id));
    const targetFlyId = selectFlyInSwatReach(availableFlies, swatHeadPoint, {
      width: rect.width,
      height: rect.height,
    });
    const targetFly =
      availableFlies.find((fly) => fly.id === targetFlyId) ?? null;

    const flyDistance = targetFly
      ? Math.hypot(
          ((targetFly.x - swatHeadPoint.x) / 100) * rect.width,
          ((targetFly.y - swatHeadPoint.y) / 100) * rect.height
        )
      : Number.POSITIVE_INFINITY;

    // Golden bee takes priority over anything else when in reach because the
    // payoff (+10) is large and the bee is on screen only briefly.
    if (bee) {
      const beeReachPixels = 104;
      const beeDistance = Math.hypot(
        ((bee.x - swatHeadPoint.x) / 100) * rect.width,
        ((bee.y - swatHeadPoint.y) / 100) * rect.height
      );

      if (beeDistance <= beeReachPixels && beeDistance < flyDistance) {
        onSwatBeeRef.current({ x: bee.x, y: bee.y });
        triggerSwatAt(point, null);
        return;
      }
    }

    // Treat takes priority over flies if it is closer to the swatter head.
    if (treat) {
      const treatReachPixels = 96;
      const treatDistance = Math.hypot(
        ((treat.x - swatHeadPoint.x) / 100) * rect.width,
        ((treat.y - swatHeadPoint.y) / 100) * rect.height
      );

      if (treatDistance <= treatReachPixels && treatDistance < flyDistance) {
        onSwatTreatRef.current({ x: treat.x, y: treat.y });
        triggerSwatAt(point, null);
        return;
      }
    }

    triggerSwatAt(
      point,
      targetFly
        ? {
            flyId: targetFly.id,
            x: targetFly.x,
            y: targetFly.y,
          }
        : null
    );
  };

  const handlePointerEnter = () => {
    setSwatter((current) => ({
      ...current,
      isTracking: true,
    }));
  };

  const handlePointerLeave = () => {
    lastPointerRef.current = null;
    setSwatter((current) => ({
      ...current,
      isTracking: current.isSwinging,
    }));
  };

  const handleKeyboardSwat = (target: SwatTarget) => {
    triggerSwatAt(target, target);
  };

  return {
    swatter,
    knockedFlyIds,
    handlePointerMove,
    handlePointerDown,
    handlePointerEnter,
    handlePointerLeave,
    handleKeyboardSwat,
  };
};
