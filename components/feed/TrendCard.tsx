import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, useTheme } from '@/constants/theme';
import type { TrendSummary } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

// ─── Today's card ─────────────────────────────────────────────

type TrendCardProps = {
  summary: TrendSummary;
  isToday?: boolean;
};

export function TrendCard({ summary, isToday = false }: TrendCardProps) {
  const t = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      {/* Date pill */}
      <View style={[styles.datePill, { backgroundColor: colors.primary + '22' }]}>
        <Ionicons name="globe-outline" size={13} color={colors.primary} />
        <Text style={[styles.dateLabel, { color: colors.primary }]}>
          {isToday ? 'Today · ' : ''}{formatDate(summary.date)}
        </Text>
      </View>

      {/* Headline */}
      <Text style={[styles.headline, { color: t.textPrimary }]}>{summary.headline}</Text>

      {/* Trends list */}
      {summary.trends.map((trend, i) => {
        const inner = (
          <>
            <View style={styles.trendTitleRow}>
              <Text style={[styles.trendTitle, { color: t.textPrimary }]}>{trend.title}</Text>
              {trend.url ? <Ionicons name="open-outline" size={13} color={colors.primary} /> : null}
            </View>
            <Text style={[styles.trendDesc, { color: t.textSecondary }]}>{trend.description}</Text>
          </>
        );
        return trend.url ? (
          <TouchableOpacity
            key={i}
            style={[styles.trendRow, { borderLeftColor: i === 0 ? colors.primary : colors.primaryDark }]}
            onPress={() => Linking.openURL(trend.url!)}
            activeOpacity={0.7}
          >
            {inner}
          </TouchableOpacity>
        ) : (
          <View key={i} style={[styles.trendRow, { borderLeftColor: i === 0 ? colors.primary : colors.primaryDark }]}>
            {inner}
          </View>
        );
      })}

      {/* Tip of the day */}
      <View style={[styles.tipBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '44' }]}>
        <View style={styles.tipHeader}>
          <Ionicons name="bulb-outline" size={16} color={colors.primary} />
          <Text style={[styles.tipHeading, { color: colors.primary }]}>Tip of the day</Text>
        </View>
        <Text style={[styles.tipText, { color: t.textPrimary }]}>{summary.tip_of_day}</Text>
      </View>

      {/* Sources */}
      <Text style={[styles.sources, { color: t.textSecondary }]}>{summary.sources_note}</Text>
    </View>
  );
}

// ─── Archive (collapsible list of past 7 days) ────────────────

type TrendArchiveProps = {
  summaries: TrendSummary[];
};

export function TrendArchive({ summaries }: TrendArchiveProps) {
  const t = useTheme();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (summaries.length === 0) return null;

  return (
    <View style={styles.archiveSection}>
      <Text style={[styles.archiveHeading, { color: t.textSecondary }]}>PREVIOUS DAYS</Text>
      {summaries.map((s) => {
        const isOpen = expanded === s.id;
        return (
          <View key={s.id} style={[styles.archiveItem, { borderColor: t.border }]}>
            <TouchableOpacity
              style={styles.archiveToggle}
              onPress={() => setExpanded(isOpen ? null : s.id)}
            >
              <View style={styles.archiveToggleLeft}>
                <Ionicons name="newspaper-outline" size={16} color={t.textSecondary} />
                <View>
                  <Text style={[styles.archiveDate, { color: t.textPrimary }]}>
                    {formatDate(s.date)}
                  </Text>
                  {!isOpen && (
                    <Text style={[styles.archiveHeadlinePreview, { color: t.textSecondary }]} numberOfLines={1}>
                      {s.headline}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={t.textSecondary}
              />
            </TouchableOpacity>
            {isOpen && <TrendCard summary={s} />}
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  dateLabel: { ...typography.label, fontSize: 11 },
  headline: { ...typography.heading2 },
  trendRow: {
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
    gap: 3,
  },
  trendTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  trendTitle: { ...typography.body, fontWeight: '600', flex: 1 },
  trendDesc: { ...typography.bodySmall, lineHeight: 18 },
  tipBox: {
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tipHeading: { ...typography.label },
  tipText: { ...typography.body, lineHeight: 22 },
  sources: { ...typography.bodySmall, fontStyle: 'italic' },

  // Archive
  archiveSection: { marginTop: spacing.sm },
  archiveHeading: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  archiveItem: {
    borderWidth: 1,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  archiveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: spacing.sm,
  },
  archiveToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  archiveDate: { ...typography.bodySmall, fontWeight: '600' },
  archiveHeadlinePreview: { ...typography.bodySmall, flex: 1 },
});
