import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ms, s, vs } from "react-native-size-matters";

interface Card2Props {
  title: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
  iconColor?: string;
  trend?: string;
  info?: string;
}

export default function Card2({
  title,
  value,
  icon = "stats-chart-outline",
  backgroundColor = "#fff",
  iconColor = "#1A6A37",
  trend,
  info,
}: Card2Props) {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        {trend && <Text style={styles.trend}>{trend}</Text>}
        {info && <Text style={styles.info} numberOfLines={2}>{info}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: s(16),
    borderRadius: ms(14),
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    minHeight: vs(90),
  },
  iconContainer: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    justifyContent: "center",
    alignItems: "center",
    marginRight: s(12),
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: ms(13),
    color: "#6c757d",
    fontWeight: "600",
    marginBottom: vs(2),
  },
  value: {
    fontSize: ms(20),
    fontWeight: "700",
    color: "#1A6A37",
    marginBottom: vs(2),
  },
  trend: {
    fontSize: ms(12),
    color: "#28a745",
    fontWeight: "500",
    marginBottom: vs(2),
  },
  info: {
    fontSize: ms(11),
    color: "#6c757d",
    lineHeight: ms(14),
  },
});