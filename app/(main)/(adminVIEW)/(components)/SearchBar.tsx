import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    LayoutAnimation,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SearchBarProps {
  onSearch?: (text: string) => void;
  placeholder?: string;
  onButtonPress?: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search here...',
  onButtonPress,
}) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (value: string) => {
    setText(value);
    if (onSearch) onSearch(value);
  };

  const clearText = () => {
    setText('');
    if (onSearch) onSearch('');
  };

  const handleFocus = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFocused(true);
  };

  const handleBlur = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFocused(false);
  };

  const handleButtonPress = () => {
    if (onButtonPress) onButtonPress(text);
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <Ionicons name="search" size={20} color="#888" style={styles.icon} />
        <TextInput
          style={[styles.input, isFocused && { flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={text}
          onChangeText={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {text.length > 0 && (
          <TouchableOpacity onPress={clearText} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
        {isFocused && (
          <TouchableOpacity style={styles.rightButton} onPress={handleButtonPress}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d9d9d9ff',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  icon: {
    marginRight: 8,
  },
  clearButton: {
    marginLeft: 8,
  },
  rightButton: {
    marginLeft: 10,
    backgroundColor: '#9f9f9fff',
    borderRadius: 25,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchBar;
