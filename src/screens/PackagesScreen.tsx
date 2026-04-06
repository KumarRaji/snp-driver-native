import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { getPackages, purchaseSubscription, getActiveSubscription } from '../api/driverApi';

const PackagesScreen = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);

  useEffect(() => {
    fetchPackages();
    fetchActivePlan();
  }, []);

  const fetchPackages = async () => {
    const data = await getPackages();
    setPackages(data.packages || []);
  };

  const fetchActivePlan = async () => {
    try {
      const data = await getActiveSubscription();
      setActivePlan(data);
    } catch (e) {
      console.log(e);
    }
  };

  const openPaymentModal = (pkg: any) => {
    setSelectedPackage(pkg);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPackage(null);
  };

  const handlePayment = async (method: string) => {
    try {
      setLoading(true);

      const res = await purchaseSubscription(
        selectedPackage.id, // ⚠️ IMPORTANT: Maps to what your backend expects
        method
      );

      if (res?.error || res?.success === false) {
        Alert.alert('Error', res.error || res.message || 'Payment Failed ❌');
        return;
      }

      console.log('Payment success:', res);

      // Refresh active plan (with 1-second delay for backend to sync)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const updated = await getActiveSubscription();
      console.log('UPDATED PLAN:', updated);
      setActivePlan(updated);

      closeModal();

      Alert.alert('Success', 'Subscription Activated Successfully ✅');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Payment Failed ❌');
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = () => {
    if (!activePlan?.endDate) return 0;

    const diff =
      new Date(activePlan.endDate).getTime() - new Date().getTime();

    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  console.log('ACTIVE PLAN FULL:', activePlan);
  console.log('PLAN ID:', activePlan?.plan?.id || activePlan?.planId || activePlan?.subscriptionPlanId);
  console.log('STATUS:', activePlan?.status);
  console.log('END DATE:', activePlan?.endDate);

  return (
    <View style={{ flex: 1 }}>
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Driver Packages</Text>
          <Text style={styles.subtitle}>
            Choose a plan to start accepting rides.
          </Text>
        </View>

        {/* Packages */}
        {packages.map((pkg) => {
          const daysLeft = getDaysLeft();

          const planId =
            activePlan?.plan?.id || activePlan?.planId || activePlan?.subscriptionPlanId;

          const isActive =
            planId === pkg.id &&
            (activePlan?.status === 'ACTIVE' || activePlan?.status === 'SUCCESS') &&
            daysLeft > 0;

          const hasActivePlan =
            (activePlan?.status === 'ACTIVE' || activePlan?.status === 'SUCCESS') &&
            daysLeft > 0;

          const isDisabled = hasActivePlan && !isActive;

          return (
            <View
              key={pkg.id}
              style={[
                styles.card,
                isActive && styles.activeCard,
                isDisabled && { opacity: 0.5 },
              ]}
            >
              
              {/* 🔥 CURRENT PLAN BADGE */}
              {isActive && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
                </View>
              )}

            <Text style={styles.name}>{pkg.name}</Text>

            <View style={styles.row}>
              <Text style={styles.price}>₹{pkg.price}</Text>
              <Text style={styles.duration}>/{pkg.duration} days</Text>
            </View>

            <Text style={styles.desc}>
              {pkg.description || 'Mini 4 hour Rs.400–450, Extra per hour Rs.80–90'}
            </Text>

            {/* BUTTON */}
            <TouchableOpacity
              style={[
                styles.button,
                (isActive || isDisabled) && styles.activeButton,
              ]}
              disabled={isActive || isDisabled}
              onPress={() => openPaymentModal(pkg)}
            >
              <Text
                style={[
                  styles.buttonText,
                  (isActive || isDisabled) && styles.activeButtonText,
                ]}
              >
                {isActive ? 'Active' : 'Choose Package & Pay'}
              </Text>
            </TouchableOpacity>

            </View>
          );
        })}
      </ScrollView>

      {/* 🔥 Payment Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>

            <Text style={styles.modalTitle}>Select Payment Method</Text>

            {selectedPackage && (
              <>
                <Text style={styles.modalSub}>
                  {selectedPackage.name} - ₹{selectedPackage.price}
                </Text>
                <Text style={styles.modalHint}>
                  Choose how you want to pay
                </Text>
              </>
            )}

            {/* Cash */}
            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: '#22c55e' }]}
              onPress={() => handlePayment('CASH')}
              disabled={loading}
            >
              <Text style={styles.payText}>{loading ? 'Processing...' : 'Cash'}</Text>
            </TouchableOpacity>

            {/* UPI */}
            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: '#3b82f6' }]}
              onPress={() => handlePayment('UPI')}
              disabled={loading}
            >
              <Text style={styles.payText}>{loading ? 'Processing...' : 'UPI'}</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
};

export default PackagesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
  },

  header: {
    marginTop: 10,
    marginBottom: 15,
    alignItems: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },

  card: {
    backgroundColor: '#fff',
    padding: 18,
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  activeCard: {
    borderWidth: 2,
    borderColor: '#000',
  },

  name: {
    fontSize: 16,
    fontWeight: '600',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 6,
  },

  price: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  duration: {
    fontSize: 13,
    color: '#777',
    marginLeft: 6,
    marginBottom: 2,
  },

  desc: {
    fontSize: 13,
    color: '#777',
    marginTop: 8,
    marginBottom: 12,
  },

  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },

  currentBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 10,
  },

  currentBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  activeButton: {
    backgroundColor: '#e5e5e5',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  activeButtonText: {
    color: '#888',
  },

  /* 🔥 Modal Styles */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },

  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  modalSub: {
    fontSize: 15,
    marginBottom: 6,
  },

  modalHint: {
    fontSize: 13,
    color: '#777',
    marginBottom: 15,
  },

  payButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },

  payText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  cancel: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
});