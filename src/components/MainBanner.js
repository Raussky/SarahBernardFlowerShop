import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Image, TouchableOpacity } from 'react-native';

const MainBanner = ({ onShopNowPress }) => {
  return (
    <ImageBackground 
      source={require('../../assets/main-banner-bg.png')} 
      style={styles.bannerContainer}
      imageStyle={{ borderRadius: 20 }}
    >
      <View style={styles.overlay}>
        <Image source={require('../../assets/logo-white.png')} style={styles.logo} />
        <View style={styles.textContainer}>
          <Text style={styles.subtitle}>
            Сделайте каждый момент ярче с идеальным цветком. {'\n'}
            Откройте для себя потрясающие цветы на любой случай.
          </Text>
          <TouchableOpacity style={styles.shopNowButton} onPress={onShopNowPress}>
            <Text style={styles.shopNowButtonText}>В магазин</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    height: 250,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 20,
    justifyContent: 'space-between',
  },
  logo: {
    width: '70%',
    height: 50,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 15,
  },
  shopNowButton: {
    backgroundColor: '#B99976',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopNowButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MainBanner;