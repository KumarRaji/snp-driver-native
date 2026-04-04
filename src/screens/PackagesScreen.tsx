import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { getPackages } from '../api/driverApi';

const PackagesScreen = () => {
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    const data = await getPackages();
    setPackages(data.packages || []);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Driver Packages</Text>
        <Text style={styles.subtitle}>
          Choose a plan to start accepting rides.
        </Text>
      </View>

      {/* Packages List */}
      {packages.map((pkg) => (
        <View key={pkg.id} style={styles.card}>
          
          {/* Package Name */}
          <Text style={styles.name}>{pkg.name}</Text>

          {/* Price + Duration */}
          <View style={styles.row}>
            <Text style={styles.price}>₹{pkg.price}</Text>
            <Text style={styles.duration}>/{pkg.duration} days</Text>
          </View>

          {/* Description (static or API-based) */}
          <Text style={styles.desc}>
            Mini 4 hour Rs.400–450, Extra per hour Rs.80–90
          </Text>

          {/* Button */}
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Choose Package & Pay</Text>
          </TouchableOpacity>

        </View>
      ))}
    </ScrollView>
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
    color: '#000',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 15,
    borderRadius: 12,

    // Shadow (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },

    // Elevation (Android)
    elevation: 3,
  },

  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },

  duration: {
    fontSize: 14,
    color: '#777',
    marginLeft: 5,
  },

  desc: {
    fontSize: 13,
    color: '#777',
    marginTop: 8,
    marginBottom: 12,
  },

  button: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});