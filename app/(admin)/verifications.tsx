import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography } from '../../src/theme/colors';
import { useAdminStore } from '../../src/store/adminStore';
import { Button } from '../../src/components/ui/Button';
import { Card, Badge } from '../../src/components/ui/Components';

export default function VerificationsScreen() {
  const { pendingVerifications, approveDriver, rejectDriver, fetchDrivers, isLoadingDrivers, driversError } = useAdminStore();
  const [selectedVId, setSelectedVId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTargetId, setRejectTargetId] = useState('');

  useEffect(() => {
    void fetchDrivers().catch(() => undefined);
  }, [fetchDrivers]);

  const openVerification = (id: string) => setSelectedVId(id === selectedVId ? null : id);

  const handleApprove = (driverId: string, driverName: string) => {
    Alert.alert('Approve Driver', `Approve ${driverName} as a verified driver? They will be able to accept rides immediately.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve', onPress: async () => {
          try {
            await approveDriver(driverId, 'Approved by administrator.');
            Alert.alert('Approved', `${driverName} is now a verified driver.`);
          } catch (error) {
            Alert.alert('Approval failed', error instanceof Error ? error.message : 'Please try again.');
          }
        }
      },
    ]);
  };

  const handleReject = (driverId: string) => {
    setRejectTargetId(driverId);
    setRejectReason('');
    setRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rejection.');
      return;
    }
    try {
      await rejectDriver(rejectTargetId, rejectReason);
      setRejectModal(false);
      Alert.alert('Rejected', 'The driver verification was rejected.');
    } catch (error) {
      Alert.alert('Rejection failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const allVerified = pendingVerifications.filter((v) => v.overallStatus === 'pending').length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Verifications</Text>
        <Text style={styles.subtitle}>SRS Section 4.1 — REQ-1.1 to REQ-1.5</Text>
      </View>

      {isLoadingDrivers && pendingVerifications.length === 0 ? (
        <View style={styles.allDone}><ActivityIndicator color={Colors.brand.start} /><Text style={styles.allDoneText}>Loading driver records…</Text></View>
      ) : driversError ? (
        <View style={styles.allDone}><Text style={styles.allDoneText}>{driversError}</Text></View>
      ) : allVerified ? (
        <View style={styles.allDone}>
          <Ionicons name="checkmark-circle" size={56} color={Colors.status.success} />
          <Text style={styles.allDoneText}>All verifications processed!</Text>
        </View>
      ) : (
        <FlatList
          data={pendingVerifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isExpanded = selectedVId === item.id;
            const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = { approved: 'success', pending: 'warning', rejected: 'danger' };

            return (
              <Card style={styles.verCard}>
                {/* Verification header */}
                <TouchableOpacity
                  style={styles.verHeader}
                  onPress={() => openVerification(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.driverName}, ${item.overallStatus} verification`}
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <View style={styles.driverAvatar}>
                    <Ionicons name="person" size={24} color={Colors.brand.start} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverName}>{item.driverName}</Text>
                    <Text style={styles.submittedAt}>Submitted {new Date(item.submittedAt).toLocaleDateString('en-IN')}</Text>
                  </View>
                  <Badge label={item.overallStatus.toUpperCase()} variant={statusVariant[item.overallStatus] || 'default'} />
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.text.muted} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.verDetails}>
                    {/* Document evidence storage/upload is not yet integrated. */}
                    <Text style={styles.docsTitle}>Documents</Text>
                    {Object.keys(item.documents).length === 0 ? (
                      <Text style={styles.submittedAt}>Document uploads and document-level review are not connected yet.</Text>
                    ) : Object.entries(item.documents).map(([docType, status]) => (
                      <View key={docType} style={styles.docRow}>
                        <Ionicons name="document-text" size={16} color={Colors.text.muted} />
                        <Text style={styles.docName}>{DOC_LABELS[docType]}</Text>
                        <Badge label={status.toUpperCase()} variant={statusVariant[status as string] || 'default'} size="sm" />
                      </View>
                    ))}

                    {/* Actions */}
                    {item.overallStatus === 'pending' && (
                      <View style={styles.actionBtns}>
                        <Button title="Reject" variant="danger" onPress={() => handleReject(item.driverId)} style={{ flex: 1 }} />
                        <Button title="Approve Driver" icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />} onPress={() => handleApprove(item.driverId, item.driverName)} style={{ flex: 2 }} />
                      </View>
                    )}

                    {item.adminNotes && (
                      <View style={styles.notesBox}>
                        <Text style={styles.notesLabel}>Admin Notes:</Text>
                        <Text style={styles.notesText}>{item.adminNotes}</Text>
                      </View>
                    )}
                  </View>
                )}
              </Card>
            );
          }}
        />
      )}

      {/* Reject Modal */}
      <Modal visible={rejectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejection Reason</Text>
            <Text style={styles.modalSubtitle}>This will be communicated to the driver</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Documents not clear, please resubmit..."
              placeholderTextColor={Colors.text.muted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalBtns}>
              <Button title="Cancel" variant="secondary" onPress={() => setRejectModal(false)} style={{ flex: 1 }} />
              <Button title="Confirm Reject" variant="danger" onPress={confirmReject} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const DOC_LABELS: Record<string, string> = {
  license: "Driver's License",
  insurance: 'Vehicle Insurance',
  vehicleRC: 'Vehicle RC',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg, gap: 4 },
  title: { ...Typography.title, color: Colors.text.primary },
  subtitle: { fontSize: 13, color: Colors.text.secondary },
  list: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.xl, gap: Spacing.md, paddingBottom: 100 },
  allDone: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  allDoneText: { fontSize: 18, fontWeight: '600', color: Colors.text.secondary },
  // Verification card
  verCard: { gap: 0, padding: 0, overflow: 'hidden' },
  verHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(124,58,237,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.brand.start },
  driverName: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  submittedAt: { fontSize: 12, color: Colors.text.muted, marginTop: 2 },
  verDetails: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.md },
  docsTitle: { fontSize: 13, fontWeight: '700', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.bg.secondary, borderRadius: Radius.sm },
  docName: { flex: 1, fontSize: 13, color: Colors.text.primary },
  approveDocBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.status.successBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.status.success },
  actionBtns: { flexDirection: 'row', gap: Spacing.md },
  notesBox: { padding: Spacing.md, backgroundColor: Colors.bg.secondary, borderRadius: Radius.md, gap: 4 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: Colors.text.muted, textTransform: 'uppercase' },
  notesText: { fontSize: 13, color: Colors.text.primary },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: Spacing.xl },
  modalContent: { backgroundColor: Colors.bg.secondary, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  modalTitle: { ...Typography.subtitle, color: Colors.text.primary },
  modalSubtitle: { fontSize: 13, color: Colors.text.secondary },
  reasonInput: { backgroundColor: Colors.bg.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, color: Colors.text.primary, fontSize: 14, minHeight: 100 },
  modalBtns: { flexDirection: 'row', gap: Spacing.md },
});
