// WelcomeScreen.tsx
import { StyleSheet, Text, View } from 'react-native';
/**
 * A simple welcome screen component for an Expo app.
 * It displays a centered "Welcome" message.
 */
const WelcomeScreen = () => {
  
  return (
    
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // This makes the container take up the full screen
    justifyContent: 'center', // Centers children vertically
    alignItems: 'center', // Centers children horizontally
    backgroundColor: '#fff', // Sets a white background
  },
  welcomeText: {
    fontSize: 24, // Sets a large font size for the text
    fontWeight: 'bold', // Makes the text bold
  },
});

export default WelcomeScreen;