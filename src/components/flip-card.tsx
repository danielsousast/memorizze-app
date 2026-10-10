import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Pressable, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const HALF_MS = 150;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => active && setReduced(value));
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

type Props = {
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

// Flips only when `flipped` goes false -> true: rotate to 90deg, swap the face, rotate back.
export function FlipCard({ flipped, front, back, onPress, disabled, testID, accessibilityLabel, style }: Props) {
  const reduceMotion = useReducedMotion();
  const angle = useSharedValue(0);
  const [backShown, setBackShown] = useState(flipped);
  const wasFlipped = useRef(flipped);

  useEffect(() => {
    const was = wasFlipped.current;
    wasFlipped.current = flipped;
    if (!flipped || was || reduceMotion) {
      cancelAnimation(angle);
      angle.value = 0;
      setBackShown(flipped);
      return;
    }
    angle.value = withSequence(withTiming(90, { duration: HALF_MS }), withTiming(0, { duration: HALF_MS }));
    const timer = setTimeout(() => setBackShown(true), HALF_MS);
    return () => clearTimeout(timer);
  }, [flipped, reduceMotion, angle]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${angle.value}deg` }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animated]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPress={onPress}
        style={style}
      >
        {flipped && backShown ? back : front}
      </Pressable>
    </Animated.View>
  );
}
