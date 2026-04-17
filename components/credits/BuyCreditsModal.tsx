import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  STRIPE_PAYMENTS_ENABLED,
  CREDIT_PACKAGES,
  formatPrice,
  type CreditPackage,
} from '@/lib/stripe';
import { useCreditPurchase } from '@/hooks/useStripePayments';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

// ─── Props ────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  clientId: string;
  currentBalance: number;
  onClose: () => void;
  /** Called after a successful payment has been verified. */
  onPurchased?: () => void;
};

// ─── Package card ─────────────────────────────────────────────

function PackageCard({
  pkg,
  disabled,
  loading,
  onPress,
}: {
  pkg: CreditPackage;
  disabled: boolean;
  loading: boolean;
  onPress: (pkg: CreditPackage) => void;
}) {
  const t = useTheme();
  const isPopular = pkg.credits === 10;

  return (
    <View style={[styles.pkgCard, { backgroundColor: t.surface, borderColor: isPopular ? colors.primary : t.border }]}>
      {isPopular && (
        <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}

      <View style={styles.pkgTop}>
        <View style={[styles.creditsBubble, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[styles.creditsNum, { color: colors.primary }]}>{pkg.credits}</Text>
          <Text style={[styles.creditsWord, { color: colors.primary }]}>credits</Text>
        </View>

        <View style={styles.pkgRight}>
          <Text style={[styles.pkgPrice, { color: t.textPrimary }]}>{formatPrice(pkg.price_cents)}</Text>
          <Text style={[styles.pkgPerCredit, { color: t.textSecondary }]}>
            {formatPrice(Math.round(pkg.price_cents / pkg.credits))} / credit
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.buyBtn,
          disabled ? [styles.buyBtnDisabled, { borderColor: t.border }] : { backgroundColor: colors.primary },
        ]}
        onPress={() => onPress(pkg)}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={disabled ? (t.textSecondary as string) : '#fff'} />
        ) : disabled ? (
          <>
            <Ionicons name="lock-closed-outline" size={14} color={t.textSecondary as string} />
            <Text style={[styles.buyBtnDisabledText, { color: t.textSecondary }]}>Coming Soon</Text>
          </>
        ) : (
          <Text style={styles.buyBtnText}>Buy {pkg.credits} Credits</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────

export function BuyCreditsModal({ visible, clientId, currentBalance, onClose, onPurchased }: Props) {
  const t = useTheme();
  const { purchase, state, error, reset } = useCreditPurchase(clientId);

  async function handlePackagePress(pkg: CreditPackage) {
    if (!STRIPE_PAYMENTS_ENABLED) return;
    const ok = await purchase(pkg);
    if (ok) onPurchased?.();
  }

  function handleClose() {
    reset();
    onClose();
  }

  const isLoading = state === 'creating' || state === 'redirecting';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: t.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Buy Credits</Text>
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerSpacer}
          >
            <Ionicons name="close" size={24} color={t.textPrimary as string} style={{ textAlign: 'right' }} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Disabled / coming-soon banner */}
          {!STRIPE_PAYMENTS_ENABLED && (
            <View style={[styles.comingSoonBanner, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '44' }]}>
              <Ionicons name="lock-closed" size={16} color={colors.primary} />
              <View style={styles.comingSoonText}>
                <Text style={[styles.comingSoonTitle, { color: colors.primary }]}>Payments Coming Soon</Text>
                <Text style={[styles.comingSoonSub, { color: t.textSecondary }]}>
                  Credit purchases will be available shortly. Ask your trainer to top up your balance in the meantime.
                </Text>
              </View>
            </View>
          )}

          {/* Current balance */}
          <View style={[styles.balanceRow, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.balanceLabel, { color: t.textSecondary }]}>Current balance</Text>
            <Text style={[styles.balanceValue, { color: colors.primary }]}>
              {currentBalance} credit{currentBalance !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* How credits work */}
          <View style={[styles.infoCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.infoTitle, { color: t.textSecondary }]}>HOW CREDITS WORK</Text>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: t.textPrimary }]}>30-min session = 1 credit</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: t.textPrimary }]}>60-min session = 2 credits</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="refresh-outline" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: t.textPrimary }]}>Credits refunded if trainer cancels</Text>
            </View>
          </View>

          {/* Pricing note */}
          <Text style={[styles.pricingNote, { color: t.textSecondary }]}>
            All packages at $1.00 per credit · Prices in USD
          </Text>

          {/* Package cards */}
          {CREDIT_PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              disabled={!STRIPE_PAYMENTS_ENABLED || isLoading}
              loading={isLoading}
              onPress={handlePackagePress}
            />
          ))}

          {/* Error */}
          {error && STRIPE_PAYMENTS_ENABLED && (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '14', borderColor: colors.error + '44' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          {/* Secure payment note */}
          <View style={styles.secureRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={t.textSecondary as string} />
            <Text style={[styles.secureText, { color: t.textSecondary }]}>
              Secure checkout powered by Stripe. We never store card details.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  headerSpacer: { width: 32 },
  headerTitle: { ...typography.heading3, fontWeight: '700' },

  scroll: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  // Coming soon banner
  comingSoonBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  comingSoonText: { flex: 1, gap: 4 },
  comingSoonTitle: { ...typography.body, fontWeight: '700' },
  comingSoonSub: { ...typography.bodySmall, lineHeight: 18 },

  // Balance row
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  balanceLabel: { ...typography.body },
  balanceValue: { ...typography.body, fontWeight: '700' },

  // Info card
  infoCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoTitle: { ...typography.label, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  infoText: { ...typography.bodySmall },

  pricingNote: { ...typography.bodySmall, textAlign: 'center' },

  // Package card
  pkgCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderBottomLeftRadius: radius.sm,
  },
  popularText: { ...typography.label, color: '#fff', fontWeight: '800', letterSpacing: 0.5 },

  pkgTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  creditsBubble: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  creditsNum: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  creditsWord: { ...typography.label, fontWeight: '600' },

  pkgRight: { flex: 1, gap: 4 },
  pkgPrice: { fontSize: 28, fontWeight: '800' },
  pkgPerCredit: { ...typography.bodySmall },

  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingVertical: spacing.sm + 2,
  },
  buyBtnDisabled: {
    borderWidth: 1,
  },
  buyBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },
  buyBtnDisabledText: { ...typography.body, fontWeight: '600' },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  errorText: { ...typography.bodySmall, flex: 1 },

  // Secure
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  secureText: { ...typography.label, textAlign: 'center', flex: 1 },
});
