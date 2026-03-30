import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, useTheme } from '@/constants/theme';
import type { WorkoutWithTrainer, AssignedWorkoutWithDetails, ScheduledSessionWithDetails } from '@/types';

// ─── Dot colours ─────────────────────────────────────────────
const DOT_LOGGED   = '#DBAF55'; // gold – past logged workouts
const DOT_ASSIGNED = '#22c55e'; // green – assigned (upcoming)
const DOT_SESSION  = '#15803d'; // dark green – confirmed booked session

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS   = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Props = {
  workouts: WorkoutWithTrainer[];
  assignedWorkouts: AssignedWorkoutWithDetails[];
  sessions: ScheduledSessionWithDetails[];
  onDayPress?: (iso: string) => void;
};

export function WorkoutCalendar({ workouts, assignedWorkouts, sessions, onDayPress }: Props) {
  const t = useTheme();
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickYear, setPickYear]   = useState(today.getFullYear());
  const [pickMonth, setPickMonth] = useState(today.getMonth());

  function openPicker() {
    setPickYear(year);
    setPickMonth(month);
    setPickerOpen(true);
  }
  function applyPicker() {
    setYear(pickYear);
    setMonth(pickMonth);
    setPickerOpen(false);
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // ── Date sets for O(1) lookup ──────────────────────────────
  const loggedDates = new Set(workouts.map(w => w.performed_at.slice(0, 10)));

  const assignedDates = new Set(
    assignedWorkouts
      .filter(a => a.status === 'assigned')
      .map(a => a.scheduled_date.slice(0, 10)),
  );

  const confirmedDates = new Set(
    sessions
      .filter(s => s.status === 'confirmed')
      .map(s => toIso(new Date(s.scheduled_at))),
  );

  // ── Build calendar grid ────────────────────────────────────
  const firstDow    = new Date(year, month, 1).getDay();       // 0–6
  const daysInMonth = new Date(year, month + 1, 0).getDate();  // 28–31
  const totalCells  = Math.ceil((firstDow + daysInMonth) / 7) * 7;
  const numWeeks    = totalCells / 7;

  const todayIso = toIso(today);

  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDow + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  return (
    <View style={styles.root}>
      {/* Month navigator */}
      <View style={[styles.monthNav, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={20} color={t.textPrimary as string} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={openPicker}
          style={styles.monthTitleBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={[styles.monthTitle, { color: t.textPrimary }]}>
            {MONTHS[month]} {year}
          </Text>
          <Ionicons name="chevron-down" size={13} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-forward" size={20} color={t.textPrimary as string} />
        </TouchableOpacity>
      </View>

      {/* Month / Year picker modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={[styles.pickerSheet, { backgroundColor: t.surface }]} onPress={() => {}}>

            {/* Year row */}
            <View style={styles.yearRow}>
              <TouchableOpacity onPress={() => setPickYear(y => y - 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="chevron-back" size={20} color={t.textPrimary as string} />
              </TouchableOpacity>
              <Text style={[styles.yearText, { color: t.textPrimary }]}>{pickYear}</Text>
              <TouchableOpacity onPress={() => setPickYear(y => y + 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="chevron-forward" size={20} color={t.textPrimary as string} />
              </TouchableOpacity>
            </View>

            {/* Month grid: 3 cols × 4 rows */}
            <View style={styles.monthGrid}>
              {MONTHS.map((name, idx) => {
                const active = idx === pickMonth;
                return (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.monthChip,
                      { borderColor: t.border },
                      active && styles.monthChipActive,
                    ]}
                    onPress={() => setPickMonth(idx)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.monthChipText,
                      { color: active ? colors.textInverse : t.textPrimary },
                    ]}>
                      {name.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Apply */}
            <TouchableOpacity style={styles.applyBtn} onPress={applyPicker} activeOpacity={0.8}>
              <Text style={styles.applyBtnText}>Go</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Day-of-week headers */}
      <View style={[styles.dayHeaderRow, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
        {DAY_ABBR.map(d => (
          <View key={d} style={styles.dayHeaderCell}>
            <Text style={[styles.dayHeaderText, { color: t.textSecondary }]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid — flex:1 fills remaining height */}
      <View style={styles.grid}>
        {Array.from({ length: numWeeks }, (_, week) => (
          <View key={week} style={styles.weekRow}>
            {Array.from({ length: 7 }, (_, dow) => {
              const day = cells[week * 7 + dow];
              if (day === null) {
                return (
                  <View
                    key={dow}
                    style={[styles.dayCell, { borderColor: t.border }]}
                  />
                );
              }

              const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday    = iso === todayIso;
              const hasLogged  = loggedDates.has(iso);
              const hasAssign  = assignedDates.has(iso);
              const hasSession = confirmedDates.has(iso);
              const hasDot     = hasLogged || hasAssign || hasSession;

              const cellContent = (
                <>
                  <View style={[styles.dayNumWrap, isToday && styles.dayNumToday]}>
                    <Text style={[
                      styles.dayNum,
                      { color: isToday ? colors.textInverse : t.textPrimary },
                    ]}>
                      {day}
                    </Text>
                  </View>
                  {hasDot && (
                    <View style={styles.dots}>
                      {hasLogged  && <View style={[styles.dot, { backgroundColor: DOT_LOGGED }]} />}
                      {hasAssign  && <View style={[styles.dot, { backgroundColor: DOT_ASSIGNED }]} />}
                      {hasSession && <View style={[styles.dot, { backgroundColor: DOT_SESSION }]} />}
                    </View>
                  )}
                </>
              );

              const cellStyle = [
                styles.dayCell,
                { borderColor: t.border },
                isToday && { backgroundColor: colors.primary + '0F' },
              ];

              return hasDot && onDayPress ? (
                <TouchableOpacity
                  key={dow}
                  style={cellStyle}
                  onPress={() => onDayPress(iso)}
                  activeOpacity={0.65}
                >
                  {cellContent}
                </TouchableOpacity>
              ) : (
                <View key={dow} style={cellStyle}>
                  {cellContent}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={[styles.legend, { borderTopColor: t.border, backgroundColor: t.surface }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: DOT_LOGGED }]} />
          <Text style={[styles.legendText, { color: t.textSecondary }]}>Logged</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: DOT_ASSIGNED }]} />
          <Text style={[styles.legendText, { color: t.textSecondary }]}>Assigned</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: DOT_SESSION }]} />
          <Text style={[styles.legendText, { color: t.textSecondary }]}>Confirmed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthTitleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthTitle: { ...typography.body, fontWeight: '700' },

  // Picker modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  pickerSheet: {
    width: 300, borderRadius: 16,
    padding: spacing.md, gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
  },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
  yearText: { ...typography.heading3, fontWeight: '700' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  monthChip: {
    width: '30%', paddingVertical: spacing.sm,
    alignItems: 'center', borderRadius: 8, borderWidth: 1,
  },
  monthChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  monthChipText: { ...typography.body, fontWeight: '600' },
  applyBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: spacing.sm, alignItems: 'center',
  },
  applyBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },

  dayHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayHeaderCell: {
    flex: 1, alignItems: 'center', paddingVertical: 6,
  },
  dayHeaderText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  grid: { flex: 1 },

  weekRow: { flex: 1, flexDirection: 'row' },

  dayCell: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },

  dayNumWrap: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  dayNumToday: { backgroundColor: colors.primary },
  dayNum: { fontSize: 13, fontWeight: '600', lineHeight: 16 },

  dots: { flexDirection: 'row', gap: 3 },
  dot:  { width: 5, height: 5, borderRadius: 3 },

  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.bodySmall },
});
