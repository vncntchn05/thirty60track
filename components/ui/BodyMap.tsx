import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Body, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter';
import { colors, spacing, typography, useTheme } from '@/constants/theme';

// Library base width is 200px; scale so the body fills the available column width.
const BASE_W = 200;

type MuscleGroup = 'Shoulders' | 'Chest' | 'Arms' | 'Core' | 'Hips' | 'Back' | 'Glutes' | 'Legs' | 'Hands' | 'Feet';

const GROUP_SLUGS: Record<MuscleGroup, Slug[]> = {
  Chest:     ['chest'],
  Shoulders: ['deltoids', 'trapezius'],
  Arms:      ['biceps', 'triceps', 'forearm'],
  Core:      ['abs', 'obliques'],
  Hips:      ['adductors'],
  Back:      ['upper-back', 'lower-back'],
  Glutes:    ['gluteal'],
  Legs:      ['quadriceps', 'hamstring', 'calves', 'tibialis'],
  Hands:     ['hands'],
  Feet:      ['feet', 'ankles'],
};

const SLUG_TO_GROUP: Partial<Record<Slug, MuscleGroup>> = {
  chest:         'Chest',
  deltoids:      'Shoulders',
  trapezius:     'Shoulders',
  biceps:        'Arms',
  triceps:       'Arms',
  forearm:       'Arms',
  abs:           'Core',
  obliques:      'Core',
  adductors:     'Hips',
  'upper-back':  'Back',
  'lower-back':  'Back',
  gluteal:       'Glutes',
  quadriceps:    'Legs',
  hamstring:     'Legs',
  calves:        'Legs',
  tibialis:      'Legs',
  hands:         'Hands',
  feet:          'Feet',
  ankles:        'Feet',
};

type Props = {
  selected: string | null;
  onSelect: (muscle: string | null) => void;
};

export function BodyMap({ selected, onSelect }: Props) {
  const t = useTheme();
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [colWidth, setColWidth] = useState(0);
  const [hoveredGroup, setHoveredGroup] = useState<MuscleGroup | null>(null);

  function handleLayout(e: LayoutChangeEvent) {
    setColWidth(e.nativeEvent.layout.width);
  }

  const scale = colWidth > 0 ? colWidth / BASE_W : 0.7;

  function handlePress(part: ExtendedBodyPart) {
    if (!part.slug) return;
    const group = SLUG_TO_GROUP[part.slug] ?? null;
    if (!group) return;
    onSelect(selected === group ? null : group);
  }

  // Build data array: selected = full gold, hovered (non-selected) = light gold
  const highlightData: ExtendedBodyPart[] = [
    ...(selected
      ? (GROUP_SLUGS[selected as MuscleGroup] ?? []).map((slug) => ({
          slug,
          styles: { fill: colors.primary, stroke: '#8A6820', strokeWidth: 1 },
        }))
      : []),
    ...(hoveredGroup && hoveredGroup !== selected
      ? (GROUP_SLUGS[hoveredGroup] ?? []).map((slug) => ({
          slug,
          styles: { fill: colors.primaryLight, stroke: '#B88C32', strokeWidth: 1 },
        }))
      : []),
  ];

  const dimFill  = t.background === '#000000' ? '#1C1C1C' : '#D8D0C4';
  const baseFill = selected ? dimFill : t.surface;

  return (
    <View style={styles.container}>
      {/* Front / Back toggle */}
      <View style={[styles.toggleRow, { borderBottomColor: t.border }]}>
        {(['front', 'back'] as const).map((v) => (
          <TouchableOpacity key={v} style={styles.toggleBtn} onPress={() => setSide(v)}>
            <Text
              style={[
                styles.toggleText,
                { color: side === v ? colors.primary : t.textSecondary },
              ]}
            >
              {v === 'front' ? 'Front' : 'Back'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Body diagram */}
      <View
        style={styles.bodyWrapper}
        onLayout={handleLayout}
        // @ts-ignore — web-only mouse events for hover highlighting
        onMouseMove={(e: MouseEvent) => {
          const slug = (e.target as Element)?.id as Slug | undefined;
          const group = (slug ? SLUG_TO_GROUP[slug] : null) ?? null;
          if (group !== hoveredGroup) setHoveredGroup(group);
        }}
        onMouseLeave={() => setHoveredGroup(null)}
      >
        <Body
          data={highlightData}
          side={side}
          scale={scale}
          gender="male"
          onBodyPartPress={handlePress}
          defaultFill={baseFill}
          defaultStroke={t.border}
          defaultStrokeWidth={1}
          border={t.border}
          colors={[colors.primary]}
        />
      </View>

      {/* Selected label + clear */}
      <View style={[styles.selectedBar, { borderTopColor: t.border }]}>
        <Text
          style={[
            styles.selectedText,
            { color: selected ? colors.primary : (hoveredGroup ? colors.primaryLight : t.textSecondary) },
          ]}
          numberOfLines={1}
        >
          {selected ?? hoveredGroup ?? 'All'}
        </Text>
        {selected !== null && (
          <TouchableOpacity
            onPress={() => onSelect(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.clearBtn, { color: t.textSecondary }]}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  toggleRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  toggleText: {
    ...typography.body,
    fontWeight: '600',
  },
  bodyWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 4,
    overflow: 'hidden',
  },
  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
  },
  selectedText: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  clearBtn: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '600',
    paddingLeft: spacing.xs,
  },
});
