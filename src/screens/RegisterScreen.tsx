import React, { useState } from 'react';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ImageBackground,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const RegisterScreen = () => {
    const navigation = useNavigation<any>();

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [sameAddress, setSameAddress] = useState(false);

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        permanentAddress: '',
        currentAddress: '',
        aadharNo: '',
        licenseNo: '',
        licenseExpiryDate: '',
        alternateMobile1: '',
        alternateMobile2: '',
        alternateMobile3: '',
        alternateMobile4: '',
        gpayNo: '',
        otp: '',
        policeVerificationExpiryDate: '',
    });

    const [images, setImages] = useState<any>({});
    const [uploadedUrls, setUploadedUrls] = useState<any>({});
    const [showLicensePicker, setShowLicensePicker] = useState(false);
    const [showPolicePicker, setShowPolicePicker] = useState(false);
    const [modal, setModal] = useState({ visible: false, title: '', message: '' });

    const showModal = (title: string, message: string) => setModal({ visible: true, title, message });
    const hideModal = () => setModal({ visible: false, title: '', message: '' });

    const formatDate = (date: Date) => {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    };

    const scrollRef = React.useRef<ScrollView>(null);

    const nextStep = () => {
        setStep((current) => current + 1);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
    };
    const prevStep = () => setStep((current) => current - 1);

    const updateFormField = (field: string, value: string) => {
        setForm((prev) => {
            const nextState = { ...prev, [field]: value };

            if (field === 'permanentAddress' && sameAddress) {
                nextState.currentAddress = value;
            }

            return nextState;
        });
    };

    const pickImage = async (field: string) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showModal('Permission Required', 'Camera permission is needed to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: 'Images',
            quality: 0.7,
        });

        if (!result.canceled) {
            setImages((prev: any) => ({ ...prev, [field]: result.assets[0] }));
        }
    };

    const uploadFile = async (image: any) => {
        if (!image) return '';

        const formData = new FormData();
        formData.append('file', {
            uri: image.uri,
            name: 'file.jpg',
            type: 'image/jpeg',
        } as any);

        const res = await fetch(`${API_BASE_URL}/api/upload/file`, {
            method: 'POST',
            body: formData,
        });

        const text = await res.text();
        let data: any = null;

        try {
            data = JSON.parse(text);
        } catch {
            throw new Error('Upload failed. Please try again.');
        }

        if (!res.ok) throw new Error(data?.message || 'Upload failed. Please try again.');

        return data.fileId || data.url || data.file?.url || '';
    };

    const handleCompleteRegistration = async () => {
        if (!form.name || !form.phone || !form.password || !form.permanentAddress) {
            showModal('Error', 'Please fill your personal details first');
            return;
        }

        setLoading(true);

        try {
            const uploadedDocumentUrls = {
                photo: await uploadFile(images.photo),
                dlPhoto: await uploadFile(images.dlPhoto),
                panPhoto: await uploadFile(images.panPhoto),
                aadharPhoto: await uploadFile(images.aadharPhoto),
                policeVerificationPhoto: await uploadFile(images.policeVerificationPhoto),
            };

            setUploadedUrls(uploadedDocumentUrls);
            showModal('Success', 'Documents uploaded. Please verify your OTP to finish registration.');
            setStep(4);
        } catch (error) {
            console.error('Upload Error:', error);
            showModal('Error', 'Document upload failed');
        } finally {
            setLoading(false);
        }
    };

    const driverRegister = async () => {
        if (!form.name || !form.phone || !form.password || !form.aadharNo || !form.licenseNo || !form.licenseExpiryDate) {
            showModal('Error', 'Please complete the identification details');
            return;
        }

        if (!form.otp) {
            showModal('Error', 'Please enter the OTP');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/driver/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    password: form.password,
                    currentAddress: form.currentAddress,
                    permanentAddress: form.permanentAddress,
                    aadharNo: form.aadharNo,
                    licenseNo: form.licenseNo,
                    licenseExpiryDate: form.licenseExpiryDate,
                    altPhone: [
                        form.alternateMobile1,
                        form.alternateMobile2,
                        form.alternateMobile3,
                        form.alternateMobile4,
                    ].filter(Boolean),
                    upiId: form.gpayNo,
                    photo: uploadedUrls.photo || '',
                    dlPhoto: uploadedUrls.dlPhoto || '',
                    panPhoto: uploadedUrls.panPhoto || '',
                    aadharPhoto: uploadedUrls.aadharPhoto || '',
                    policeVerificationPhoto: uploadedUrls.policeVerificationPhoto || '',
                    policeVerificationExpiryDate: form.policeVerificationExpiryDate,
                    otp: form.otp,
                }),
            });

            const text = await response.text();
            let data: any = null;

            try {
                data = JSON.parse(text);
            } catch {
                console.error('Register API Non-JSON response:', text);
                throw new Error('Server not responding. Please try again later.');
            }

            if (response.ok) {
                if (data.token) {
                    await AsyncStorage.setItem('auth-token', data.token);
                }

                Alert.alert('Success', 'Registration successful');
                navigation.replace('Login');
            } else {
                showModal('Error', data.message || data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration Error:', error);
            showModal('Error', 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const renderTextField = (
        field: string,
        label: string,
        placeholder = '',
        options: any = {}
    ) => (
        <View key={field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, options.multiline && styles.textarea]}
                placeholder={placeholder}
                placeholderTextColor="#999"
                value={(form as any)[field]}
                secureTextEntry={options.secureTextEntry || false}
                keyboardType={options.keyboardType || 'default'}
                autoCapitalize={options.autoCapitalize || 'none'}
                multiline={options.multiline || false}
                numberOfLines={options.numberOfLines || 1}
                maxLength={options.maxLength}
                editable={options.editable !== undefined ? options.editable : true}
                onChangeText={(text) => {
                    let value = text;

                    if (options.numericOnly) {
                        value = text.replace(/[^0-9]/g, '');
                    }

                    updateFormField(field, value);
                }}
            />
        </View>
    );

    const renderPersonalDetails = () => (
        <View>
            <Text style={styles.stepSubTitle}>Enter your basic profile information to get started.</Text>
            {renderTextField('name', 'Full Name *', 'Enter your full name', { autoCapitalize: 'words' })}
            {renderTextField('phone', 'Phone Number * (10 digits)', 'Enter phone number', { keyboardType: 'phone-pad', numericOnly: true, maxLength: 10 })}
            {renderTextField('password', 'Password *', 'Enter password', { secureTextEntry: true })}
            {renderTextField('permanentAddress', 'Permanent Address *', 'Enter permanent address', { multiline: true, numberOfLines: 3 })}

            <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                    const nextValue = !sameAddress;
                    setSameAddress(nextValue);
                    if (nextValue) {
                        updateFormField('currentAddress', form.permanentAddress);
                    } else {
                        updateFormField('currentAddress', '');
                    }
                }}
            >
                <View style={[styles.checkboxBox, sameAddress && styles.checkboxBoxChecked]}>
                    {sameAddress ? <Text style={styles.checkboxCheck}>✓</Text> : null}
                </View>
                <Text style={styles.checkboxLabel}>Same as Permanent Address</Text>
            </TouchableOpacity>

            {!sameAddress ? renderTextField('currentAddress', 'Current Address *', 'Enter current address', {
                multiline: true,
                numberOfLines: 3,
            }) : null}
        </View>
    );

    const renderIdentification = () => (
        <View>
            <Text style={styles.stepSubTitle}>Provide your driving credentials and alternate contacts.</Text>
            {renderTextField('aadharNo', 'Aadhar Number * (12 digits)', 'Enter aadhaar number', { keyboardType: 'phone-pad', numericOnly: true, maxLength: 12 })}
            {renderTextField('licenseNo', 'Driving License Number *', 'Enter driving license number', { autoCapitalize: 'characters' })}
            <Text style={styles.label}>License Expiry Date *</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowLicensePicker(true)}>
                <Text style={form.licenseExpiryDate ? styles.dateText : styles.datePlaceholder}>
                    {form.licenseExpiryDate || 'DD-MM-YYYY'}
                </Text>
                <Feather name="calendar" size={18} color="#888" />
            </TouchableOpacity>
            {showLicensePicker && (
                <DateTimePicker
                    value={form.licenseExpiryDate ? (() => { const [d,m,y] = form.licenseExpiryDate.split('-'); return new Date(+y, +m-1, +d); })() : new Date()}
                    mode="date"
                    display="default"
                    onChange={(_, date) => {
                        setShowLicensePicker(false);
                        if (date) updateFormField('licenseExpiryDate', formatDate(date));
                    }}
                />
            )}
            {renderTextField('gpayNo', 'GPay / PhonePe Number', 'Enter UPI number', { keyboardType: 'phone-pad', numericOnly: true, maxLength: 10 })}
            {renderTextField('alternateMobile1', 'Alternate Phone 1 (Optional)', 'Enter alternate phone', { keyboardType: 'phone-pad', numericOnly: true, maxLength: 10 })}
            {renderTextField('alternateMobile2', 'Alternate Phone 2 (Optional)', 'Enter alternate phone', { keyboardType: 'phone-pad', numericOnly: true, maxLength: 10 })}
            {renderTextField('alternateMobile3', 'Alternate Phone 3 (Optional)', 'Enter alternate phone', { keyboardType: 'phone-pad', numericOnly: true, maxLength: 10 })}
            {renderTextField('alternateMobile4', 'Alternate Phone 4 (Optional)', 'Enter alternate phone', { keyboardType: 'phone-pad', numericOnly: true, maxLength: 10 })}
        </View>
    );

    const renderDocuments = () => (
        <View>
            <Text style={styles.stepSubTitle}>Upload clear photos of your required documents to complete.</Text>
            <View style={styles.uploadGrid}>
                {[
                    { key: 'photo', label: 'Profile Photo', icon: 'image' },
                    { key: 'dlPhoto', label: 'Driving License', icon: 'file-text' },
                    { key: 'panPhoto', label: 'PAN Card', icon: 'credit-card' },
                    { key: 'aadharPhoto', label: 'Aadhar Card', icon: 'file' },
                    { key: 'policeVerificationPhoto', label: 'Police Verification', icon: 'shield' },
                ].map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={styles.uploadBox}
                        onPress={() => pickImage(item.key)}
                    >
                        {images[item.key] ? (
                            <Image source={{ uri: images[item.key].uri }} style={styles.image} />
                        ) : (
                            <View style={styles.uploadContent}>
                                <Feather name={item.icon as any} size={22} color="#6b7280" style={styles.icon} />
                                <Text style={styles.uploadText}>{item.label}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
            <Text style={styles.label}>Police Verification Expiry Date *</Text>
            <Text style={styles.fieldHint}>Typically valid for 1 year from issue date.</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowPolicePicker(true)}>
                <Text style={form.policeVerificationExpiryDate ? styles.dateText : styles.datePlaceholder}>
                    {form.policeVerificationExpiryDate || 'DD-MM-YYYY'}
                </Text>
                <Feather name="calendar" size={18} color="#888" />
            </TouchableOpacity>
            {showPolicePicker && (
                <DateTimePicker
                    value={form.policeVerificationExpiryDate ? (() => { const [d,m,y] = form.policeVerificationExpiryDate.split('-'); return new Date(+y, +m-1, +d); })() : new Date()}
                    mode="date"
                    display="default"
                    onChange={(_, date) => {
                        setShowPolicePicker(false);
                        if (date) updateFormField('policeVerificationExpiryDate', formatDate(date));
                    }}
                />
            )}
        </View>
    );

    const renderOTP = () => (
        <View>
            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    We've sent a 6-digit verification code to your registered mobile numbers.
                </Text>
            </View>
            <Text style={styles.label}>OTP FOR {form.phone} *</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={6}
                value={form.otp}
                onChangeText={(text) => updateFormField('otp', text.replace(/[^0-9]/g, ''))}
            />
            {form.alternateMobile1 !== '' && (
                <View>
                    <Text style={styles.label}>OTP FOR {form.alternateMobile1} (ALTERNATE) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter 6-digit code"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        maxLength={6}
                    />
                </View>
            )}
        </View>
    );

    const renderStepContent = () => {
        if (step === 1) return renderPersonalDetails();
        if (step === 2) return renderIdentification();
        if (step === 3) return renderDocuments();
        return renderOTP();
    };

    const isStepValid = () => {
        if (step === 1) return !!(form.name && form.phone.length === 10 && form.password && form.permanentAddress && (sameAddress || form.currentAddress));
        if (step === 2) return !!(form.aadharNo.length === 12 && form.licenseNo && form.licenseExpiryDate);
        if (step === 3) return !!(form.policeVerificationExpiryDate);
        if (step === 4) return form.otp.length === 6;
        return false;
    };

    const buttonText = step === 1
        ? 'Continue →'
        : step === 2
            ? 'Continue →'
            : step === 3
                ? 'Complete Registration'
                : 'Verify & Login';

    const handlePrimaryAction = () => {
        if (step === 1) {
            if (!form.name || !form.phone || !form.password || !form.permanentAddress) {
                Alert.alert('Error', 'Please fill the required personal details');
                return;
            }

            nextStep();
            return;
        }

        if (step === 2) {
            if (!form.aadharNo || !form.licenseNo || !form.licenseExpiryDate) {
                Alert.alert('Error', 'Please fill the required identification fields');
                return;
            }

            nextStep();
            return;
        }

        if (step === 3) {
            handleCompleteRegistration();
            return;
        }

        driverRegister();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7' }}
                style={styles.container}
                blurRadius={3}
            >
                <View style={styles.overlay}>
                    <Text style={styles.logo}>SNP</Text>

                    <View style={styles.card}>
                        <ScrollView
                            ref={scrollRef}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                        >
                            <View style={styles.headerRow}>
                                <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : prevStep()}>
                                    <Text style={styles.back}>{step === 1 ? '← Back to Login' : '← Back'}</Text>
                                </TouchableOpacity>
                                <View style={styles.stepBadge}>
                                    <Text style={styles.stepText}>Step {step} of 4</Text>
                                </View>
                            </View>

                            {step === 4 ? (
                                <Text style={styles.title}>OTP Verification</Text>
                            ) : step === 1 ? (
                                <Text style={styles.title}>Personal Details</Text>
                            ) : step === 2 ? (
                                <Text style={styles.title}>Identification & Contact</Text>
                            ) : (
                                <Text style={styles.title}>Document Uploads</Text>
                            )}
                            {step === 4 && (
                                <Text style={styles.subTitle}>
                                    Please verify your phone numbers to activate your account.
                                </Text>
                            )}
                            {renderStepContent()}
                        </ScrollView>

                        <View style={styles.buttonRow}>
                            {step === 4 ? (
                                <TouchableOpacity
                                    style={[styles.verifyButton, !isStepValid() && styles.buttonDisabled]}
                                    onPress={handlePrimaryAction}
                                    disabled={loading || !isStepValid()}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.verifyText}>Verify &amp; Login ✓</Text>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.primaryButton, !isStepValid() && styles.buttonDisabled]}
                                    onPress={handlePrimaryAction}
                                    disabled={loading || !isStepValid()}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.btnText}>{buttonText}</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </ImageBackground>

            <Modal visible={modal.visible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Feather name="alert-triangle" size={58} color="#fff" />
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={styles.modalTitle}>{modal.title}</Text>
                            <Text style={styles.modalMessage}>{modal.message}</Text>
                            <TouchableOpacity style={styles.modalButton} onPress={hideModal}>
                                <Text style={styles.modalButtonText}>Okay, Understood</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

export default RegisterScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    logo: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 20,
        paddingBottom: 15,
        maxHeight: '88%',
        elevation: 5,
        width: '98%',
        alignSelf: 'center',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    back: {
        color: '#888',
        marginBottom: 10,
        fontWeight: 'bold',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        flex: 1,
    },
    subTitle: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 4,
    },
    progressBadge: {
        backgroundColor: '#111827',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    progressBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    stepBadge: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    stepText: {
        fontSize: 12,
        color: '#777',
        fontWeight: '700',
    },
    fieldHint: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 5,
    },
    stepSubTitle: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 6,
        marginTop: 2,
    },
    dateInput: {
        backgroundColor: '#F8F8F8',
        borderRadius: 14,
        height: 52,
        paddingHorizontal: 15,
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateText: {
        fontSize: 14,
        color: '#222',
    },
    datePlaceholder: {
        fontSize: 14,
        color: '#999',
    },
    infoBox: {
        backgroundColor: '#EEF5FF',
        borderRadius: 14,
        padding: 14,
        marginTop: 15,
        marginBottom: 18,
    },
    infoText: {
        color: '#3B82F6',
        fontSize: 13,
        fontWeight: '500',
    },
    verifyButton: {
        flex: 1,
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    verifyText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 6,
        marginBottom: 8,
        color: '#111827',
    },
    label: {
        fontSize: 11,
        color: '#888',
        marginTop: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: '#F8F8F8',
        borderRadius: 14,
        height: 52,
        padding: 15,
        marginTop: 6,
    },
    textarea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    checkboxBox: {
        width: 20,
        height: 20,
        borderWidth: 1.5,
        borderColor: '#6b7280',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxBoxChecked: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    checkboxCheck: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    checkboxLabel: {
        marginLeft: 8,
        color: '#374151',
    },
    helperText: {
        color: '#6b7280',
        marginTop: 8,
        fontSize: 13,
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 10,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#d1d5db',
    },
    secondaryButton: {
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        minWidth: 100,
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        color: '#111827',
        fontWeight: 'bold',
    },
    uploadGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
        rowGap: 12,
    },
    uploadBox: {
        width: '48%',
        height: 95,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#d1d5db',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fafafa',
    },
    uploadContent: {
        alignItems: 'center',
    },
    icon: {
        marginBottom: 5,
    },
    uploadText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '88%',
        backgroundColor: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 12,
    },
    modalHeader: {
        backgroundColor: '#EF4444',
        paddingVertical: 28,
        alignItems: 'center',
    },
    modalBody: {
        padding: 22,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    modalButton: {
        backgroundColor: '#000',
        width: '100%',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
}); 