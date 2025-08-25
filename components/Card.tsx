import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ms, s, vs } from "react-native-size-matters";

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
  iconColor?: string;
  trend?: string;
  description?: string;
}

export default function Card({
  title,
  value,
  subtitle,
  icon = "stats-chart",
  backgroundColor = "#fff",
  iconColor = "#1A6A37",
  trend,
  description,
}: CardProps) {
  const isPositiveTrend = trend?.includes('+');

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
      </View>

      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons
            name={isPositiveTrend ? "trending-up" : "trending-down"}
            size={16}
            color={isPositiveTrend ? "#28a745" : "#dc3545"}
          />
          <Text style={[styles.trend, { color: isPositiveTrend ? "#28a745" : "#dc3545" }]}>
            {trend}
          </Text>
        </View>
      )}

      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: vs(20),
    borderRadius: ms(16),
    padding: s(20),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
    minHeight: vs(180),
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(16),
  },
  title: {
    fontSize: ms(16),
    color: "#495057",
    fontWeight: "600",
    flex: 1,
  },
  iconContainer: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    justifyContent: "center",
    alignItems: "center",
  },
  valueContainer: {
    marginBottom: vs(12),
  },
  value: {
    fontSize: ms(36),
    fontWeight: "800",
    color: "#1A6A37",
    lineHeight: ms(40),
  },
  subtitle: {
    fontSize: ms(14),
    color: "#6c757d",
    marginTop: vs(4),
    fontWeight: "500",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(8),
  },
  trend: {
    fontSize: ms(14),
    fontWeight: "600",
    marginLeft: s(4),
  },
  description: {
    fontSize: ms(12),
    color: "#6c757d",
    lineHeight: ms(16),
  },
});