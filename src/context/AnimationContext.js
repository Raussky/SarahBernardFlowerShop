import React, { createContext, useState, useRef } from 'react';
import { View, Animated, Image, Dimensions } from 'react-native';

const window = Dimensions.get('window');

export const AnimationContext = createContext({
  startAddToCartAnimation: () => {},
});

export const AnimationProvider = ({ children }) => {
  const [image, setImage] = useState(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const startPosition = useRef({ x: 0, y: 0 }).current;
  const endPosition = useRef({ x: window.width / 2, y: window.height - 50 }).current; // Approximate cart position

  const startAddToCartAnimation = (startPos, imgUri) => {
    if (!imgUri) return;

    startPosition.x = startPos.x;
    startPosition.y = startPos.y;
    setImage(imgUri);

    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start(() => {
      setImage(null);
      animatedValue.setValue(0);
    });
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startPosition.x, endPosition.x],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startPosition.y, endPosition.y],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.5, 0.1],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <AnimationContext.Provider value={{ startAddToCartAnimation }}>
      {children}
      {image && (
        <Animated.View
          style={{
            position: 'absolute',
            transform: [{ translateX }, { translateY }, { scale }],
            opacity,
          }}
        >
          <Image
            source={{ uri: image }}
            style={{ width: 100, height: 100, borderRadius: 15 }}
          />
        </Animated.View>
      )}
    </AnimationContext.Provider>
  );
};