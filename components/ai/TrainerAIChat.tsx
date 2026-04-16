import { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTrainerAIChat } from '@/hooks/useTrainerAIChat';
import { getTrainerAIChatResponse, type TrainerAIContext } from '@/lib/trainerAI';
import { NUTRITION_AI_ENABLED } from '@/lib/nutritionAI';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Trainer } from '@/types';

// ─── Quick prompts ────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: 'Beginner program',      prompt: 'Give me a beginner program template for a new client' },
  { label: 'Progressive overload',  prompt: 'My client has hit a plateau — how do I apply progressive overload?' },
  { label: 'PPL split',             prompt: 'Design a push/pull/legs 6-day split' },
  { label: 'Warm-up protocol',      prompt: 'What warm-up protocol should I use before strength training?' },
  { label: 'Recovery strategies',   prompt: 'Best recovery strategies for my clients on rest days?' },
  { label: 'Macro setting',         prompt: 'How do I set macros and calories for a fat loss client?' },
  { label: 'Exercise substitutions',prompt: 'What are good exercise substitutions for clients with knee pain?' },
  { label: 'Deload week',           prompt: 'When and how should I programme a deload week?' },
];

// ─── Message parsing (encyclopedia inline links) ──────────────
//
// Supports [[N:topicId|label]] (Nutrition Encyclopedia) and
// [[E:muscleGroup|label]] (Exercise Encyclopedia) markers from AI responses.

type ParsedSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; linkType: 'N' | 'E'; linkId: string };

function parseMessage(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const re = /\[\[([NE]):([^\]|]+)\|([^\]]+)\]\]/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ kind: 'text', text: content.slice(lastIndex, m.index) });
    }
    segments.push({ kind: 'link', text: m[3], linkType: m[1] as 'N' | 'E', linkId: m[2] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ kind: 'text', text: content.slice(lastIndex) });
  }
  return segments;
}

// ─── Message bubble ───────────────────────────────────────────

function MessageBubble({
  role, content, t,
}: {
  role: 'user' | 'assistant';
  content: string;
  t: ReturnType<typeof useTheme>;
}) {
  const isUser = role === 'user';
  const textColor = isUser ? colors.textInverse : (t.textPrimary as string);
  const segments = parseMessage(content);

  return (
    <View style={[styles.bubbleWrap, isUser && styles.bubbleWrapUser]}>
      {!isUser && (
        <View style={[styles.avatarWrap, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="barbell-outline" size={14} color={colors.primary} />
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser
          ? [styles.bubbleUser, { backgroundColor: colors.primary }]
          : [styles.bubbleAssistant, { backgroundColor: t.surface, borderColor: t.border }],
      ]}>
        <Text style={[styles.bubbleText, { color: textColor }]}>
          {segments.map((seg, i) =>
            seg.kind === 'text'
              ? <Text key={i}>{seg.text}</Text>
              : <Text key={i} style={styles.encLink}>{seg.text}</Text>
          )}
        </Text>
      </View>
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────

type Props = {
  trainer: Trainer;
  totalClients?: number;
};

// ─── Main component ───────────────────────────────────────────

export function TrainerAIChat({ trainer, totalClients }: Props) {
  const t = useTheme();
  const { messages, loading, addMessage, clearHistory } = useTrainerAIChat(trainer.id);
  const [input, setInput] = useState('');
  const [replying, setReplying] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const context: TrainerAIContext = {
    full_name: trainer.full_name,
    email: trainer.email,
    total_clients: totalClients ?? null,
  };

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || replying) return;
    setInput('');

    await addMessage('user', trimmed);

    setReplying(true);
    const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
    const { reply, error } = await getTrainerAIChatResponse(trimmed, context, history);
    setReplying(false);

    if (error || !reply) {
      await addMessage('assistant', "Sorry, I couldn't process that. Please try again.");
      return;
    }
    await addMessage('assistant', reply);
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={160}
    >
      {/* Demo mode badge */}
      {!NUTRITION_AI_ENABLED && (
        <View style={[styles.devBadge, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="flask-outline" size={12} color={t.textSecondary as string} />
          <Text style={[styles.devBadgeText, { color: t.textSecondary }]}>Demo mode — mock responses</Text>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.welcomeWrap}>
            <View style={[styles.welcomeIcon, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="barbell-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.welcomeTitle, { color: t.textPrimary }]}>AI Training Assistant</Text>
            <Text style={[styles.welcomeBody, { color: t.textSecondary }]}>
              Ask about program design, progressive overload, exercise substitutions, recovery, client nutrition, or anything coaching related.
            </Text>
            <View style={styles.quickPromptsGrid}>
              {QUICK_PROMPTS.map((qp) => (
                <TouchableOpacity
                  key={qp.label}
                  style={[styles.quickPromptBtn, { backgroundColor: t.surface, borderColor: t.border }]}
                  onPress={() => sendMessage(qp.prompt)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickPromptText, { color: t.textPrimary }]}>{qp.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} role={msg.role} content={msg.content} t={t} />
            ))}
            {replying && (
              <View style={styles.bubbleWrap}>
                <View style={[styles.avatarWrap, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="barbell-outline" size={14} color={colors.primary} />
                </View>
                <View style={[styles.bubble, styles.bubbleAssistant, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={[styles.inputBar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
        {messages.length > 0 && (
          <TouchableOpacity
            onPress={() => Alert.alert('Clear history', 'Delete all messages?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearHistory },
            ])}
            style={styles.clearBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={t.textSecondary as string} />
          </TouchableOpacity>
        )}
        <TextInput
          style={[styles.textInput, { color: t.textPrimary, backgroundColor: t.background, borderColor: t.border }]}
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything about training or nutrition…"
          placeholderTextColor={t.textSecondary}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(input)}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary }, (!input.trim() || replying) && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || replying}
        >
          <Ionicons name="send" size={16} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  devBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginHorizontal: spacing.md, marginTop: spacing.xs, marginBottom: spacing.xs,
    padding: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.full, borderWidth: 1, alignSelf: 'flex-start',
  },
  devBadgeText: { ...typography.label, fontSize: 10 },

  messagesList: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },

  welcomeWrap: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl },
  welcomeIcon: {
    width: 64, height: 64, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  welcomeTitle: { ...typography.heading3 },
  welcomeBody: { ...typography.body, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
  quickPromptsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    justifyContent: 'center', marginTop: spacing.sm,
  },
  quickPromptBtn: {
    borderWidth: 1, borderRadius: radius.full,
    paddingVertical: 8, paddingHorizontal: spacing.md,
  },
  quickPromptText: { ...typography.bodySmall, fontWeight: '600' },

  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  bubbleWrapUser: { flexDirection: 'row-reverse' },
  avatarWrap: {
    width: 28, height: 28, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bubble: {
    maxWidth: '80%', borderRadius: radius.lg,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { ...typography.body, lineHeight: 22 },
  encLink: { color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    padding: spacing.sm, paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  clearBtn: { paddingBottom: spacing.xs + 2 },
  textInput: {
    flex: 1, borderWidth: 1, borderRadius: radius.lg,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    ...typography.body, maxHeight: 100, lineHeight: 22,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 1,
  },
  sendBtnDisabled: { opacity: 0.5 },
});
