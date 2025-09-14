import React from 'react';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

const AnimatedListItem = ({ children, index }) => {
  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedListItem;