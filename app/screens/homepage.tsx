// file.tsx

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * A simple welcome screen component for a React Native application.
 * It displays "Welcome" in the center of the screen.
 */
const WelcomeScreen = () => {
  return (
    // The main container for the screen.
    // The styles flex: 1, justifyContent, and alignItems center the content both vertically and horizontally.
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome</Text>
    </View>
  );
};

// StyleSheet.create is used for optimized styling in React Native.
const styles = StyleSheet.create({
  container: {
    flex: 1, // This makes the container take up the full height of the screen.
    justifyContent: 'center', // Centers children vertically.
    alignItems: 'center', // Centers children horizontally.
    backgroundColor: '#fff', // A white background for the screen.
  },
  welcomeText: {
    fontSize: 24, // Sets the font size for the text.
    fontWeight: 'bold', // Makes the text bold.
    color: '#333', // A dark color for good contrast.
  },
});

export default WelcomeScreen;
