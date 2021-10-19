import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  GestureEvent,
  HandlerStateChangeEvent,
  PanGestureHandler,
  PanGestureHandlerEventPayload,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { snapPoint } from 'react-native-redash';

import { SwipeableAction } from './SwipeableAction';
import { SwipeableActionItemContainer } from './SwipeableActionItemContainer';
import { SwipeableActionsContainer } from './SwipeableActionsContainer';
import { useInstance } from './hooks';

export type SwipeableActionItemRender = () => React.ReactNode;

export interface SwipeableActionItem {
  key: string;
  color: string;
  render: SwipeableActionItemRender;
  renderEngaged?: SwipeableActionItemRender;
  onPress?(): any;
}

export interface SwipeableHandle {
  close(): void;
}

export interface SwipeableProps
  extends React.ComponentProps<typeof Animated.View> {
  children: React.ReactNode;
  actionSize: number;
  actionsLeft?: SwipeableActionItem[];
  actionsRight?: SwipeableActionItem[];
}

const _Swipeable = React.forwardRef<SwipeableHandle, SwipeableProps>(
  (
    { style, children, actionSize, actionsLeft, actionsRight, ...props },
    ref
  ) => {
    const [selfWidth, setSelfWidth] = useState(0);

    const minWidthRight = actionSize * (actionsRight?.length ?? 0);
    const minWidthLeft = actionSize * (actionsLeft?.length ?? 0);

    const didEngageRight = useSharedValue(false);
    const didEngageLeft = useSharedValue(false);

    const engageRightCallback = useInstance(actionsRight?.[0]?.onPress);
    const engageLeftCallback = useInstance(actionsLeft?.[0]?.onPress);

    const snapPoints = useMemo(
      () => [minWidthLeft, 0, -minWidthRight],
      [minWidthLeft, minWidthRight]
    );

    const snapPointsWhenOpen = useMemo(
      () => [
        minWidthLeft ? selfWidth : 0,
        minWidthLeft,
        0,
        -minWidthRight,
        -(minWidthRight ? selfWidth : 0),
      ],
      [minWidthLeft, minWidthRight, selfWidth]
    );

    const translationX = useSharedValue(0);
    const offsetX = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translationX.value }],
    }));

    const onDidNotify = useCallback((left: boolean, right: boolean) => {
      if (left) {
        engageLeftCallback.current?.();
        return;
      }

      if (right) {
        engageRightCallback.current?.();
        return;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGestureChange = useCallback(
      (data: { translationX: number }) => {
        const canShowRight = !!actionsRight?.length;
        const canShowLeft = !!actionsLeft?.length;
        const targetValue = interpolate(
          offsetX.value + data.translationX,
          [canShowRight ? -9999 : -0, canShowLeft ? 9999 : 0],
          [canShowRight ? -9999 : -0, canShowLeft ? 9999 : 0],
          Extrapolate.CLAMP
        );

        translationX.value = targetValue;
      },
      [actionsLeft?.length, actionsRight?.length, translationX, offsetX]
    );

    const handleGestureEnd = useCallback(
      (data: { translationX: number; velocity: number }) => {
        const offset = offsetX.value;
        const isNotOffset = offset === 0;
        const isOffsetToTheRight = offset > 0;
        const snapPointsAccountingForOffset = isNotOffset
          ? snapPoints
          : isOffsetToTheRight
          ? snapPointsWhenOpen.slice(0, -2)
          : snapPointsWhenOpen.slice(2);

        const targetPosition = (() => {
          if (didEngageLeft.value) {
            return selfWidth;
          }

          if (didEngageRight.value) {
            return -selfWidth;
          }

          return snapPoint(
            data.translationX,
            data.velocity,
            snapPointsAccountingForOffset
          );
        })();

        translationX.value = withSpring(
          targetPosition,
          {
            damping: 15,
            mass: 0.25,
          },
          (didFinish) => {
            if (!didFinish) {
              return;
            }

            runOnJS(onDidNotify)(didEngageLeft.value, didEngageRight.value);
          }
        );

        offsetX.value = targetPosition;
      },
      [
        didEngageLeft,
        didEngageRight,
        offsetX,
        onDidNotify,
        selfWidth,
        snapPoints,
        snapPointsWhenOpen,
        translationX,
      ]
    );

    const handleHandlerStateChange = useCallback(
      (event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
        const { state, ...data } = event.nativeEvent;

        if (state === State.END) {
          handleGestureEnd({
            translationX: data.translationX,
            velocity: data.velocityX,
          });
        }
      },
      [handleGestureEnd]
    );

    const handleGestureEvent = useCallback(
      (event: GestureEvent<PanGestureHandlerEventPayload>) => {
        handleGestureChange({ translationX: event.nativeEvent.translationX });
      },
      [handleGestureChange]
    );

    useImperativeHandle(ref, () => ({
      close() {
        offsetX.value = 0;
        translationX.value = withSpring(0, {
          damping: 15,
          mass: 0.5,
        });
      },
    }));

    return (
      <PanGestureHandler
        failOffsetY={[-5, 5]}
        activeOffsetX={[-10, 10]}
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleHandlerStateChange}
      >
        <Animated.View
          onLayout={(event) => setSelfWidth(event.nativeEvent.layout.width)}
        >
          {actionsRight && (
            <SwipeableActionsContainer position="right" gestureX={translationX}>
              {actionsRight.map((action, idx) => (
                <SwipeableActionItemContainer
                  key={action.key}
                  order={idx}
                  position="right"
                  canEngage={idx === 0}
                  gestureX={translationX}
                  renderFn={action.render}
                  renderEngagedFn={action.renderEngaged}
                  totalWidth={minWidthRight}
                  backgroundColor={action.color}
                  didEngage={didEngageRight}
                  size={actionSize}
                  onPress={action.onPress}
                />
              ))}
            </SwipeableActionsContainer>
          )}
          {actionsLeft && (
            <SwipeableActionsContainer position="left" gestureX={translationX}>
              {actionsLeft.map((action, idx) => (
                <SwipeableActionItemContainer
                  key={action.key}
                  order={idx}
                  position="left"
                  canEngage={idx === 0}
                  gestureX={translationX}
                  renderFn={action.render}
                  renderEngagedFn={action.renderEngaged}
                  totalWidth={minWidthLeft}
                  backgroundColor={action.color}
                  didEngage={didEngageLeft}
                  size={actionSize}
                  onPress={action.onPress}
                />
              ))}
            </SwipeableActionsContainer>
          )}
          <Animated.View style={[style, animatedStyle]} {...props}>
            {children}
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    );
  }
);

_Swipeable.displayName = 'Swipeable';
export const Swipeable = Object.assign(_Swipeable, { Action: SwipeableAction });
