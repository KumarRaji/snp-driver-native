import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Linking,
  RefreshControl,
} from 'react-native';
import { getTrips, handleLogoutIfRequired, completeTripAPI, sendStartOTP, startTripAPI, requestCancelAPI } from '../api/driverApi';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import CustomAlert from '../components/CustomAlert';
import TripTimer from '../components/TripTimer';

const shouldReverifyTrip = (trip: any) => {
  if (trip.status !== 'ONGOING') return false;

  const lastActivity = trip.updatedAt || trip.actualStartTime;

  if (!lastActivity) return false;

  const diff = new Date().getTime() - new Date(lastActivity).getTime();

  const hours = diff / (1000 * 60 * 60);

  return hours >= 12;
};

const HomeScreen = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const navigation = useNavigation<any>();

  // Complete modal
  const [completeModal, setCompleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  // Cancel modal
  const [cancelModal, setCancelModal] = useState(false);

  // Start trip flow
  const [startModal, setStartModal] = useState(false);
  const [frontPhoto, setFrontPhoto] = useState<any>(null);
  const [backPhoto, setBackPhoto] = useState<any>(null);

  // OTP modal
  const [otpModal, setOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Custom Alert
  const [alertInfo, setAlertInfo] = useState({ visible: false, title: '', message: '', type: 'info' as const });
  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => setAlertInfo({ visible: true, title, message, type: type as 'info' });
  const hideAlert = () => setAlertInfo({ ...alertInfo, visible: false });

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

  const fetchTrips = async () => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      const data = await getTrips();
      if (await handleLogoutIfRequired(data, navigation)) return;
      setTrips(data?.bookings || data?.trips || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const activeTrips = trips.filter(
    (t) => t.status === 'ONGOING' || t.status === 'CONFIRMED' || t.status === 'ACCEPTED'
  );

  // ── Complete Trip ──────────────────────────────────────────
  const calculateFinalAmount = (trip: any) => {
    const baseAmount = Number(
      trip.estimatedCost ||
      trip.estimateAmount ||
      0
    );

    if (!trip.actualStartTime || !trip.duration) {
      return baseAmount;
    }

    const start = new Date(trip.actualStartTime).getTime();
    const end = Date.now();

    const actualHours = Math.floor(
      (end - start) / (1000 * 60 * 60)
    );

    let packageHours = 0;

    const duration = trip.duration.toLowerCase();

    const number = parseInt(duration.match(/\d+/)?.[0] || "0");

    if (duration.includes("hour") || duration.includes("hr")) {
      packageHours = number;
    } else if (duration.includes("day")) {
      packageHours = number * 12;
    } else if (duration.includes("month")) {
      packageHours = number * 30 * 12;
    }

    if (actualHours > packageHours) {
      return baseAmount + ((actualHours - packageHours) * 100);
    }

    return baseAmount;
  };

  const completeTrip = async () => {
    if (!selectedTrip) return;
    try {
      setLoadingId(selectedTrip.id);
      const finalAmount = calculateFinalAmount(selectedTrip);
      const data = await completeTripAPI(selectedTrip.id, {
        finalAmount,
      });
      if (await handleLogoutIfRequired(data, navigation)) return;
      if (data?.success) {
        setCompleteModal(false);
        setSelectedTrip(null);
        fetchTrips();
        showAlert('Success', 'Trip completed successfully!', 'success');
      } else {
        showAlert('Error', data?.error || data?.message || 'Failed to complete trip', 'error');
      }
    } catch (e) {
      showAlert('Error', 'Network error occurred', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  // ── Cancel Trip ────────────────────────────────────────────
  const requestCancel = async () => {
    if (!selectedTrip) return;
    try {
      setLoadingId(selectedTrip.id);
      const data = await requestCancelAPI(selectedTrip.id);
      if (await handleLogoutIfRequired(data, navigation)) return;
      setCancelModal(false);
      setSelectedTrip(null);
      fetchTrips();
      showAlert('Submitted', 'Cancellation request submitted.', 'success');
    } catch (e) {
      showAlert('Error', 'Network error occurred', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  // ── Start Trip Flow ────────────────────────────────────────
  const takePhoto = async (type: 'front' | 'back') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Required', 'Camera permission is needed to take photos.', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) {
      if (type === 'front') setFrontPhoto(result.assets[0]);
      else setBackPhoto(result.assets[0]);
    }
  };

  const handleSendOTP = async () => {
    if (!selectedTrip) return;
    try {
      setOtpLoading(true);
      const data = await sendStartOTP(selectedTrip.id);
      if (await handleLogoutIfRequired(data, navigation)) return;
      if (data?.success) {
        setStartModal(false);
        setOtpModal(true);
      } else {
        showAlert('Error', data?.message || 'Failed to send OTP', 'error');
      }
    } catch (e) {
      showAlert('Error', 'Network error occurred', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleConfirmStart = async () => {
    if (!selectedTrip || otp.length !== 6) return;
    try {
      setOtpLoading(true);
      const data = await startTripAPI(selectedTrip.id, otp);
      if (await handleLogoutIfRequired(data, navigation)) return;
      if (data?.success) {
        setOtpModal(false);
        setOtp('');
        setFrontPhoto(null);
        setBackPhoto(null);
        setSelectedTrip(null);
        fetchTrips();
        showAlert(
          selectedTrip?.status === 'ONGOING'
            ? 'Ride Continued'
            : 'Trip Started',
          selectedTrip?.status === 'ONGOING'
            ? 'Vehicle verification completed successfully.'
            : 'Trip has been started successfully!',
          'success'
        );
      } else {
        showAlert('Error', data?.message || 'Invalid OTP or failed to start trip', 'error');
      }
    } catch (e) {
      showAlert('Error', 'Network error occurred', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const resetStartFlow = () => {
    setStartModal(false);
    setFrontPhoto(null);
    setBackPhoto(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F4F4' }}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {activeTrips.length > 0 && (
          <View style={styles.titleRow}>
            <View style={styles.greenDot} />
            <Text style={styles.title}>Ongoing Trips</Text>
          </View>
        )}

        {activeTrips.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No active trips</Text>
            <Text style={styles.emptySub}>Wait for admin to assign bookings</Text>
          </View>
        ) : (
          activeTrips.map((trip) => {
            const isUpcoming = trip.status === 'CONFIRMED' || trip.status === 'ACCEPTED';
            const needReverify = shouldReverifyTrip(trip);
            return (
              <View key={trip.id} style={styles.card}>

                {/* Header */}
                <View style={styles.topRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.onTrip}>
                      {trip.status === 'ONGOING' ? 'On Trip' : 'Upcoming'}
                    </Text>
                    {trip.status === 'ONGOING' && trip.actualStartTime && (
                      <View style={{ marginLeft: 8 }}>
                        <TripTimer startTime={trip.actualStartTime} />
                      </View>
                    )}
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{trip.serviceType || 'Outstation'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Timeline */}
                <View style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.outerDot}><View style={styles.innerDot} /></View>
                    <View style={styles.line} />
                    <Feather name="map-pin" size={14} color="#fff" />
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={styles.locLabel}>FROM</Text>
                    <Text style={styles.location}>{trip.pickupLocation}</Text>
                    <Text style={[styles.locLabel, { marginTop: 10 }]}>TO</Text>
                    <Text style={styles.location}>{trip.dropLocation}</Text>
                  </View>
                </View>

                {/* Map Buttons */}
                <View style={styles.mapRow}>
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trip.pickupLocation)}`
                      )
                    }
                  >
                    <Feather name="map-pin" size={14} color="#4F8EF7" />
                    <Text style={styles.mapButtonText}>To Pickup</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dropButton}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip.pickupLocation)}&destination=${encodeURIComponent(trip.dropLocation)}`
                      )
                    }
                  >
                    <Feather name="navigation" size={14} color="#bbb" />
                    <Text style={styles.dropText}>To Drop-off</Text>
                  </TouchableOpacity>
                </View>

                {/* Base Amount */}
                {trip.estimateAmount && (
                  <View style={styles.amountCard}>

                    {/* Schedule Row */}
                    <View style={styles.scheduleRow}>
                      <View style={styles.scheduleLeft}>
                        <Feather
                          name="calendar"
                          size={13}
                          color="#9CA3AF"
                        />

                        <Text style={styles.scheduleLabel}>
                          SCHEDULE
                        </Text>
                      </View>

                      <Text style={styles.estimateText}>
                        Estimate ({trip.duration || "0 Hrs"})
                      </Text>
                    </View>

                    <View style={styles.scheduleDivider} />

                    {/* Base Amount */}
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>
                        BASE AMOUNT
                      </Text>

                      <Text style={styles.amount}>
                        ₹{trip.estimatedCost || trip.estimateAmount || 0}
                      </Text>
                    </View>

                  </View>
                )}

                {/* Action Buttons */}
                {trip.cancellationRequested ? (
                  <View style={{ marginTop: 15, backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#E6B800', borderRadius: 10, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                    <Feather name="clock" size={18} color="#B7791F" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#B7791F', fontSize: 16, fontWeight: '700' }}>Cancellation Pending</Text>
                  </View>
                ) : isUpcoming ? (
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => { setSelectedTrip(trip); setStartModal(true); }}
                      disabled={loadingId === trip.id}
                    >
                      {loadingId === trip.id
                        ? <ActivityIndicator color="#fff" />
                        : <>
                            <Feather name="play" size={16} color="#fff" />
                            <Text style={styles.buttonText}>Start Trip</Text>
                          </>
                      }
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => { setSelectedTrip(trip); setCancelModal(true); }}
                      disabled={loadingId === trip.id}
                    >
                      <Feather name="x" size={18} color="#EF4444" />
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : needReverify ? (
                  <>
                    <View style={styles.reverifyCard}>
                      <View style={{ flexDirection: 'row' }}>
                        <Feather
                          name="alert-triangle"
                          size={24}
                          color="#D97706"
                        />

                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.reverifyTitle}>
                            Trip exceeded 12 hours
                          </Text>

                          <Text style={styles.reverifySubtitle}>
                            You must re-verify your vehicle photos and OTP
                            before continuing this ride.
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.reverifyButton}
                        onPress={() => {
                          setSelectedTrip(trip);
                          setStartModal(true);
                        }}
                      >
                        <Text style={styles.reverifyButtonText}>
                          Re-verify & Continue Ride
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => { setSelectedTrip(trip); setCompleteModal(true); }}
                    disabled={loadingId === trip.id}
                  >
                    {loadingId === trip.id
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.buttonText}>Complete Trip</Text>}
                  </TouchableOpacity>
                )}

              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Complete Trip Modal ── */}
      <Modal visible={completeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <View style={styles.modalHeaderRow}>
              <View style={styles.successIcon}>
                <Feather name="check-circle" size={24} color="#16A34A" />
              </View>
              <Text style={styles.modalTitle}>Complete Trip</Text>
            </View>

            {selectedTrip && (
              <>
                <View style={styles.completAmountCard}>
                  <Text style={styles.completAmountLabel}>FINAL AMOUNT</Text>
                  <Text style={styles.completAmountValue}>₹{calculateFinalAmount(selectedTrip)}</Text>
                  <Text style={styles.completAmountNote}>*Includes ₹100/hr extra charge after {selectedTrip.duration}</Text>
                </View>

                <View style={styles.modalTimelineRow}>
                  <View style={styles.modalTimelineLeft}>
                    <View style={styles.modalOuterDot}><View style={styles.modalInnerDot} /></View>
                    <View style={styles.modalLine} />
                    <Feather name="map-pin" size={14} color="#000" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>FROM</Text>
                    <Text style={styles.modalLocation}>{selectedTrip.pickupLocation}</Text>
                    <Text style={[styles.modalLabel, { marginTop: 6 }]}>TO</Text>
                    <Text style={styles.modalLocation}>{selectedTrip.dropLocation}</Text>
                  </View>
                </View>

                <View style={styles.customerCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {selectedTrip.customer?.name?.charAt(0) || 'C'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.customerLabel}>CUSTOMER</Text>
                    <Text style={styles.customerName}>{selectedTrip.customer?.name}</Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setCompleteModal(false); setSelectedTrip(null); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={completeTrip} disabled={loadingId === selectedTrip?.id}>
                {loadingId === selectedTrip?.id
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmText}>Complete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Cancel Trip Modal ── */}
      <Modal visible={cancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Trip</Text>
            <Text style={styles.modalSub}>Are you sure you want to request cancellation?</Text>
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                This request will be sent to Admin.{'\n'}If approved, 1 duty will be deducted.
              </Text>
            </View>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setCancelModal(false); setSelectedTrip(null); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#EF4444' }]} onPress={requestCancel} disabled={loadingId === selectedTrip?.id}>
                {loadingId === selectedTrip?.id
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmText}>Request Cancellation</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Start Trip Photo Modal ── */}
      <Modal visible={startModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedTrip?.status === 'ONGOING'
                ? 'Re-verify Trip'
                : 'Start Trip'}
            </Text>
            <Text style={styles.modalSub}>
              {selectedTrip?.status === 'ONGOING'
                ? 'Take new vehicle photos before continuing.'
                : 'Take vehicle photos before starting.'}
            </Text>

            <Text style={styles.photoLabel}>CAR FRONT VIEW</Text>
            <TouchableOpacity style={styles.photoBox} onPress={() => takePhoto('front')}>
              {frontPhoto
                ? <Image source={{ uri: frontPhoto.uri }} style={styles.photoPreview} />
                : <><Feather name="camera" size={24} color="#888" /><Text style={styles.photoHint}>Take Photo</Text></>}
            </TouchableOpacity>

            <Text style={styles.photoLabel}>CAR BACK VIEW</Text>
            <TouchableOpacity style={styles.photoBox} onPress={() => takePhoto('back')}>
              {backPhoto
                ? <Image source={{ uri: backPhoto.uri }} style={styles.photoPreview} />
                : <><Feather name="camera" size={24} color="#888" /><Text style={styles.photoHint}>Take Photo</Text></>}
            </TouchableOpacity>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={resetStartFlow}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (!frontPhoto || !backPhoto) && { backgroundColor: '#ccc' }]}
                onPress={handleSendOTP}
                disabled={!frontPhoto || !backPhoto || otpLoading}
              >
                {otpLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmText}>
                      {selectedTrip?.status === 'ONGOING'
                        ? 'Send Re-verification OTP'
                        : 'Send OTP'}
                    </Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── OTP Modal ── */}
      <Modal visible={otpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.otpIconWrap}>
              <Feather name="lock" size={32} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>Verify OTP</Text>
            <Text style={styles.modalSub}>Enter 6 digit code sent to customer</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="______"
              placeholderTextColor="#ccc"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
            <TouchableOpacity onPress={handleSendOTP} disabled={otpLoading}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setOtpModal(false); setOtp(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, otp.length !== 6 && { backgroundColor: '#ccc' }]}
                onPress={handleConfirmStart}
                disabled={otp.length !== 6 || otpLoading}
              >
                {otpLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmText}>
                      {selectedTrip?.status === 'ONGOING'
                        ? 'Verify & Continue Ride'
                        : 'Verify & Start'}
                    </Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={hideAlert}
      />

    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  emptyBox: {
    backgroundColor: '#f3f3f3',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#444', marginBottom: 5 },
  emptySub: { fontSize: 13, color: '#777', textAlign: 'center' },

  // Trip Card
  card: {
    backgroundColor: '#000',
    borderRadius: 14,
    padding: 16,
    marginBottom: 15,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  onTrip: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  badge: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 10 },
  timelineRow: { flexDirection: 'row', marginTop: 4 },
  timelineLeft: { alignItems: 'center', marginRight: 10, paddingTop: 4 },
  timelineRight: { flex: 1 },
  outerDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  innerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },
  line: { width: 2, flex: 1, backgroundColor: '#666', marginVertical: 6, borderRadius: 2 },
  locLabel: { color: '#888', fontSize: 11 },
  location: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2 },

  // Map buttons
  mapRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  mapButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0f172a', borderRadius: 8, paddingVertical: 10, gap: 6,
    borderWidth: 1, borderColor: '#1e3a5f',
  },
  mapButtonText: { color: '#4F8EF7', fontSize: 13, fontWeight: '600' },
  dropButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1a1a1a', borderRadius: 8, paddingVertical: 10, gap: 6,
    borderWidth: 1, borderColor: '#333',
  },
  dropText: { color: '#bbb', fontSize: 13, fontWeight: '600' },

  // Amount
  amountCard: {
    flexDirection: 'column',
    backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, marginTop: 12,
  },
  amountLabel: { color: '#888', fontSize: 11, fontWeight: '700' },
  amount: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleLabel: {
    marginLeft: 6,
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  estimateText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Buttons
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  startButton: { flex: 2, flexDirection: 'row', gap: 8, backgroundColor: '#22c55e', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: '#1a1a1a', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EF4444' },
  cancelButtonText: { color: '#EF4444', fontWeight: 'bold' },
  completeButton: { backgroundColor: '#22c55e', marginTop: 14, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },

  // Modal base
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  modalSub: { color: '#666', marginBottom: 16 },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancelBtn: { flex: 0.8, paddingVertical: 12, borderRadius: 8, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontWeight: 'bold', color: '#333', textAlign: 'center' },
  modalConfirmBtn: { flex: 1.2, paddingVertical: 16, borderRadius: 8, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  modalConfirmText: { fontWeight: 'bold', color: '#fff', textAlign: 'center' },

  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  successIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F8EC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  completAmountCard: { backgroundColor: '#E9FAEC', borderRadius: 14, padding: 20, marginBottom: 15, alignItems: 'center' },
  completAmountLabel: { fontSize: 13, fontWeight: '700', color: '#4B5563' },
  completAmountValue: { fontSize: 42, fontWeight: 'bold', color: '#16A34A', marginVertical: 8 },
  completAmountNote: { fontSize: 11, color: '#4B5563', textAlign: 'center' },
  customerCard: { backgroundColor: '#F8F8F8', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#ECECEC', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { fontWeight: 'bold', fontSize: 18 },
  customerLabel: { color: '#888', fontSize: 11, fontWeight: '700' },
  customerName: { fontSize: 18, fontWeight: '700', color: '#111' },

  // Timeline in modal
  modalTimelineRow: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12 },
  modalTimelineLeft: { alignItems: 'center', marginRight: 10, paddingTop: 4 },
  modalOuterDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center' },
  modalInnerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#000' },
  modalLine: { width: 1.5, flex: 1, minHeight: 15, backgroundColor: '#ccc', marginVertical: 2 },
  modalLabel: { fontSize: 11, color: '#888', fontWeight: 'bold' },
  modalLocation: { fontSize: 14, fontWeight: '600', color: '#000', marginTop: 2 },

  // Cancel warning
  warningBox: { flexDirection: 'row', backgroundColor: '#FEF2F2', borderRadius: 10, padding: 14, marginBottom: 16, alignItems: 'flex-start', gap: 10 },
  warningIcon: { fontSize: 20 },
  warningText: { flex: 1, color: '#b91c1c', fontSize: 13, lineHeight: 20 },

  // Photo
  photoLabel: { fontSize: 11, fontWeight: '700', color: '#888', marginTop: 14, marginBottom: 6 },
  photoBox: {
    height: 110, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: '#d1d5db', backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  photoPreview: { width: '100%', height: '100%', borderRadius: 10 },
  photoHint: { fontSize: 12, color: '#888' },

  // OTP
  otpIconWrap: { backgroundColor: '#000', width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  otpInput: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, height: 52,
    textAlign: 'center', fontSize: 22, letterSpacing: 8, marginVertical: 14, color: '#000',
  },
  resendText: { textAlign: 'center', color: '#3B82F6', fontWeight: '600', marginBottom: 10 },

  // Re-verify Card
  reverifyCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 18,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#F4D06F',
  },
  reverifyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  reverifySubtitle: {
    marginTop: 6,
    color: '#7C6A35',
    fontSize: 13,
    lineHeight: 20,
  },
  reverifyButton: {
    marginTop: 18,
    backgroundColor: '#F4B400',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  reverifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

});
