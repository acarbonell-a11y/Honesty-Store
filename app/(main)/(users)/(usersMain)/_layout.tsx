import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function _layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#1a6a37',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          height: 70,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: -3 },
          shadowRadius: 6,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="Homepage"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="Bill"
        options={{
          title: 'My Bills',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="MyAccount"
        options={{
          title: 'My Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications/[id]"
        options={{
          tabBarButton: () => null,
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="NotifacationScreen"
        options={{
          tabBarButton: () => null,
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          tabBarButton: () => null,
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="CartScreen"
        options={{
          tabBarButton: () => null,
          headerShown: true,
        }}
      />
    </Tabs>
  );
}
