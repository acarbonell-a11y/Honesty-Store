import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  TextInput
} from 'react-native';

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
  containerStyle?: object;
  inputStyle?: object;
  iconColor?: string;
};

export default function SearchBar({
  placeholder = 'Search...',
  value = '',
  onChangeText,
  onClear,
  showClearButton = true,
  containerStyle,
  inputStyle,
  iconColor = '#1a6a37',
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const clearOpacity = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  useEffect(() => {
    Animated.timing(clearOpacity, {
      toValue: value.length > 0 && showClearButton ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, showClearButton]);

  return (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        {
          transform: [{ scale: scaleAnim }],
          borderColor: isFocused ? iconColor : '#ddd',
        },
      ]}
    >
      <Ionicons
        name="search-outline"
        size={22}
        color={isFocused ? iconColor : '#888'}
        style={{ marginRight: 8 }}
      />
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {showClearButton && (
        <Animated.View style={{ opacity: clearOpacity }}>
          <Pressable onPress={onClear} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    marginVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});
