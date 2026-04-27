import { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, useWindowDimensions,
} from 'react-native';
import { colors, spacing, radius, useTheme } from '@/constants/theme';
import { DAY_ABBR, MONTH_ABBR as MONTH_ABB } from '@/lib/dateFormat';
import type { ScheduledSessionWithDetails, TrainerAvailability } from '@/types';

// ─── Grid constants ───────────────────────────────────────────
const START_HOUR = 8;   // 8 AM
const END_HOUR   = 20;  // 8 PM (exclusive)
const NUM_SLOTS  = (END_HOUR - START_HOUR) * 2; // 24 half-hour slots
const TIME_W     = 44;  // px for time label column

function sessionColor(status: string): string {
  if (status === 'confirmed') return colors.success;
  if (status === 'pending')   return colors.error;
  if (status === 'completed') return colors.primary;
  return colors.error;
}

/** Minutes elapsed since START_HOUR:00 */
function minutesFromStart(iso: string): number {
  const d = new Date(iso);
  return (d.getHours() - START_HOUR) * 60 + d.getMinutes();
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseHHMM(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Returns top/height pixel values for each availability slot that falls on `day`. */
function availBandsForDay(
  day: Date,
  slots: TrainerAvailability[],
  slotH: number,
  totalH: number,
): { top: number; height: number }[] {
  const dayIso = toIso(day);
  return slots
    .filter((s) => {
      const matchWeekly  = s.day_of_week !== null && s.day_of_week === day.getDay();
      // Trim to 10 chars to guard against any timestamp suffixes from Supabase
      const sDate        = s.specific_date ? s.specific_date.slice(0, 10) : null;
      const matchSpecific = sDate !== null && sDate === dayIso;
      return matchWeekly || matchSpecific;
    })
    .map((s) => {
      const startMins = parseHHMM(s.start_time) - START_HOUR * 60;
      const endMins   = parseHHMM(s.end_time)   - START_HOUR * 60;
      const top    = Math.max(0, (startMins / 30) * slotH);
      const bottom = Math.min(totalH, (endMins / 30) * slotH);
      return { top, height: Math.max(0, bottom - top) };
    })
    .filter((b) => b.height > 0);
}

type Props = {
  weekStart: Date;
  sessions: ScheduledSessionWithDetails[];
  onSessionPress: (session: ScheduledSessionWithDetails) => void;
  /** Availability slots to show as faint gold bands. */
  availability?: TrainerAvailability[];
  /** Override the label shown inside a session block. Defaults to client full_name. */
  getSessionLabel?: (s: ScheduledSessionWithDetails) => string;
};

export function WeeklyTimetable({ weekStart, sessions, onSessionPress, availability = [], getSessionLabel }: Props) {
  const t = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // Measured height of the body area — drives slot height
  const [bodyHeight, setBodyHeight] = useState(0);
  const slotH  = bodyHeight > 0 ? bodyHeight / NUM_SLOTS : 0;
  const totalH = slotH * NUM_SLOTS; // === bodyHeight when measured

  // 7 columns fill whatever remains after the time label column
  const dayW = (screenWidth - TIME_W) / 7;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const today = new Date();

  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth()    === today.getMonth() &&
    d.getDate()     === today.getDate();

  // "now" line position (depends on slotH)
  const nowMins = (today.getHours() - START_HOUR) * 60 + today.getMinutes();
  const nowTop  = (nowMins / 30) * slotH;
  const showNow = nowMins >= 0 && nowMins < NUM_SLOTS * 30;

  // Build time label strings for each slot
  const timeLabels = Array.from({ length: NUM_SLOTS }, (_, i) => {
    const h = START_HOUR + Math.floor(i / 2);
    const m = i % 2 === 0 ? 0 : 30;
    if (m === 0) {
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h > 12 ? h - 12 : h;
      return `${h12}${period}`;
    }
    return null;
  });

  function sessionsForDay(day: Date): ScheduledSessionWithDetails[] {
    return sessions.filter((s) => {
      const sd = new Date(s.scheduled_at);
      return sd.getFullYear() === day.getFullYear()
        && sd.getMonth()      === day.getMonth()
        && sd.getDate()       === day.getDate()
        && s.status !== 'cancelled';
    });
  }

  return (
    <View style={styles.root}>

      {/* ── Fixed header: time spacer + 7 day columns ── */}
      <View style={[styles.headerRow, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <View style={[styles.timeColSpacer, { width: TIME_W, borderRightColor: t.border }]} />
        {days.map((day) => {
          const active = isToday(day);
          return (
            <View
              key={day.toISOString()}
              style={[styles.dayHeader, { width: dayW, borderRightColor: t.border }]}
            >
              <Text style={[styles.dayAbbr, { color: active ? colors.primary : t.textSecondary }]}>
                {DAY_ABBR[day.getDay()]}
              </Text>
              <View style={[styles.dayNumWrap, active && styles.dayNumWrapActive]}>
                <Text style={[styles.dayNum, { color: active ? colors.textInverse : t.textPrimary }]}>
                  {day.getDate()}
                </Text>
              </View>
              <Text style={[styles.dayMonth, { color: t.textSecondary }]}>
                {MONTH_ABB[day.getMonth()]}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ── Body: fills remaining space, no scroll ── */}
      <View
        style={styles.body}
        onLayout={(e) => setBodyHeight(e.nativeEvent.layout.height)}
      >
        {bodyHeight > 0 && (
          <View style={styles.bodyRow}>

            {/* Time labels — left column */}
            <View style={[styles.timeCol, { width: TIME_W, borderRightColor: t.border }]}>
              {timeLabels.map((label, i) => (
                <View key={i} style={[styles.timeCell, { height: slotH }]}>
                  {label !== null && (
                    <Text style={[styles.timeText, { color: t.textSecondary }]}>{label}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* 7 day columns */}
            <View style={[styles.gridColumns, { height: totalH }]}>
              {days.map((day) => {
                const ds       = sessionsForDay(day);
                const todayCol = isToday(day);
                const bands    = availBandsForDay(day, availability, slotH, totalH);

                return (
                  <View
                    key={day.toISOString()}
                    style={[
                      styles.dayCol,
                      { width: dayW, borderRightColor: t.border },
                      todayCol && { backgroundColor: colors.primary + '0A' },
                    ]}
                  >
                    {/* Availability bands — behind everything */}
                    {bands.map((band, bi) => (
                      <View
                        key={bi}
                        style={[styles.availBand, { top: band.top, height: band.height }]}
                      />
                    ))}

                    {/* Grid lines */}
                    {Array.from({ length: NUM_SLOTS }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.gridLine,
                          { top: i * slotH, borderTopColor: t.border },
                          i % 2 === 0 && styles.gridLineHour,
                        ]}
                      />
                    ))}

                    {/* "Now" red line (today only) */}
                    {todayCol && showNow && (
                      <>
                        <View style={[styles.nowLine, { top: nowTop }]} />
                        <View style={[styles.nowDot, { top: nowTop - 4 }]} />
                      </>
                    )}

                    {/* Session blocks */}
                    {ds.map((s) => {
                      const mins = minutesFromStart(s.scheduled_at);
                      if (mins < 0 || mins >= NUM_SLOTS * 30) return null;
                      const top    = (mins / 30) * slotH;
                      const height = Math.max((s.duration_minutes / 30) * slotH - 2, 20);
                      const bg     = sessionColor(s.status);
                      const d      = new Date(s.scheduled_at);
                      const hh     = d.getHours();
                      const mm     = d.getMinutes().toString().padStart(2, '0');
                      const period = hh >= 12 ? 'PM' : 'AM';
                      const h12    = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;

                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.sessionBlock,
                            { top, height, backgroundColor: bg + 'CC', borderLeftColor: bg },
                          ]}
                          onPress={() => onSessionPress(s)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.sessionName} numberOfLines={1}>
                            {getSessionLabel ? getSessionLabel(s) : (s.client?.full_name ?? 'Client')}
                          </Text>
                          {height >= 36 && (
                            <Text style={styles.sessionTime} numberOfLines={1}>
                              {`${h12}:${mm} ${period}`}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </View>

          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Fixed header
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeColSpacer: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRightWidth: StyleSheet.hairlineWidth,
    gap: 1,
  },
  dayAbbr: { fontSize: 10, fontWeight: '600', lineHeight: 13, letterSpacing: 0.5 },
  dayNumWrap: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  dayNumWrapActive: { backgroundColor: colors.primary },
  dayNum: { fontSize: 13, fontWeight: '700', lineHeight: 16 },
  dayMonth: { fontSize: 9, fontWeight: '400', lineHeight: 12 },

  // Body — fills all remaining vertical space, no scroll
  body: { flex: 1 },
  bodyRow: { flexDirection: 'row', flex: 1 },

  // Time label column
  timeCol: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  timeCell: {
    justifyContent: 'flex-start',
    paddingTop: 3,
    paddingRight: spacing.xs,
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 13,
  },

  // Day columns
  gridColumns: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  dayCol: {
    position: 'relative',
    borderRightWidth: StyleSheet.hairlineWidth,
  },

  // Availability highlight band
  availBand: {
    position: 'absolute',
    left: 0, right: 0,
    backgroundColor: colors.primary + '22',
    borderLeftWidth: 2,
    borderLeftColor: colors.primary + '55',
    zIndex: 0,
  },

  gridLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    opacity: 0.35,
    zIndex: 1,
  },
  gridLineHour: { opacity: 0.75 },

  // "Now" indicator
  nowLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 1,
    backgroundColor: colors.error,
    zIndex: 10,
  },
  nowDot: {
    position: 'absolute',
    left: -3,
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: colors.error,
    zIndex: 10,
  },

  // Session blocks
  sessionBlock: {
    position: 'absolute',
    left: 1, right: 1,
    borderRadius: radius.sm - 2,
    borderLeftWidth: 3,
    paddingHorizontal: 3,
    paddingVertical: 2,
    overflow: 'hidden',
    zIndex: 5,
  },
  sessionName: {
    fontSize: 10, fontWeight: '700', color: '#fff', lineHeight: 13,
  },
  sessionTime: {
    fontSize: 9, fontWeight: '400', color: 'rgba(255,255,255,0.85)', lineHeight: 12,
  },
});
