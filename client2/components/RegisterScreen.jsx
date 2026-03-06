import { useState } from "react";
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { authApi } from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
const { height } = Dimensions.get("window");

export default function RegisterScreen({ onRegister, onNavigateLogin }) {
    const [formData, setFormData] = useState({
        fullName: "",
        universityId: "",
        email: "",
        password: "",
        confirmPassword: "",
        major: "",
        academicYear: "",
        currentSemester: "",
        completedCreditHours: "",
        phoneNumber: "",
        acceptTerms: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const majors = [
        "Computer Science",
        "Software Engineering",
        "Information Technology",
        "Computer Engineering",
        "Cybersecurity",
        "Data Science",
        "Business Administration",
        "Electrical Engineering",
        "Mechanical Engineering",
        "Civil Engineering",
    ];

    const academicYears = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    const semesters = ["Fall", "Spring", "Summer"];

    const handleChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrorMessage("");
    };

    const isFormValid =
        formData.fullName &&
        formData.universityId &&
        formData.email &&
        formData.password &&
        formData.confirmPassword &&
        formData.major &&
        formData.academicYear &&
        formData.currentSemester &&
        formData.completedCreditHours &&
        formData.acceptTerms;

    const handleSubmit = async () => {
        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }

        try {
            setErrorMessage("");
            setIsLoading(true);

            const response = await authApi.register({
                fullName: formData.fullName,
                universityId: formData.universityId,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                major: formData.major,
                academicYear: formData.academicYear,
                currentSemester: formData.currentSemester,
                completedCreditHours: formData.completedCreditHours,
                phoneNumber: formData.phoneNumber || undefined,
                acceptTerms: formData.acceptTerms,
            });

            await AsyncStorage.setItem("authToken", response.token);
            await AsyncStorage.setItem("student", JSON.stringify(response.student));

            onRegister && onRegister(response.student);
        } catch (error) {
            setErrorMessage(error.message || "Failed to create account. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderNativePicker = (label, name, options) => (
        <View style={{ marginBottom: 14 }}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📋</Text>
                <Picker
                    mode="dropdown"
                    style={styles.picker}
                    selectedValue={formData[name]}
                    onValueChange={(val) => handleChange(name, val)}
                >
                    <Picker.Item label={`Select ${label.toLowerCase()}`} value="" color="#aaa" />
                    {options.map((opt) => (
                        <Picker.Item key={opt} label={opt} value={opt} />
                    ))}
                </Picker>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar barStyle="light-content" />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.topPanel}>
                    <View style={styles.iconWrapper}>
                        <Text style={styles.iconText}>📝</Text>
                    </View>
                    <Text style={styles.slideTitle}>{"Join the\nCredit Hours System"}</Text>
                    <Text style={styles.slideSubtitle}>
                        Create your student account to start managing your academic journey effortlessly.
                    </Text>
                    <View style={styles.featureList}>
                        {[
                            "Easy course registration",
                            "Track your academic progress",
                            "Secure and reliable platform",
                        ].map((f, i) => (
                            <View key={i} style={styles.featureRow}>
                                <View style={styles.checkCircle}>
                                    <Text style={styles.checkMark}>✓</Text>
                                </View>
                                <Text style={styles.featureText}>{f}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.signInTitle}>Create Account</Text>
                    <Text style={styles.signInSubtitle}>Join thousands of students managing their academic journey</Text>

                    {errorMessage ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                        </View>
                    ) : null}

                    {/* Full Name */}
                    <Text style={styles.label}>Full Name *</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>👤</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="First and last name"
                            placeholderTextColor="#aaa"
                            value={formData.fullName}
                            onChangeText={(text) => handleChange("fullName", text)}
                        />
                    </View>

                    {/* University ID */}
                    <Text style={styles.label}>University ID *</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>🎓</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Your ID number"
                            placeholderTextColor="#aaa"
                            value={formData.universityId}
                            onChangeText={(text) => handleChange("universityId", text)}
                        />
                    </View>

                    {/* Email */}
                    <Text style={styles.label}>Email Address *</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>✉</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="your.email@university.edu"
                            placeholderTextColor="#aaa"
                            value={formData.email}
                            onChangeText={(text) => handleChange("email", text)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Password */}
                    <Text style={styles.label}>Password *</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>🔒</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="6+ chars"
                            placeholderTextColor="#aaa"
                            value={formData.password}
                            onChangeText={(text) => handleChange("password", text)}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Text style={styles.eyeIcon}>{showPassword ? "👁" : "🙅"}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Password */}
                    <Text style={styles.label}>Confirm Password *</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>🔒</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Re-enter password"
                            placeholderTextColor="#aaa"
                            value={formData.confirmPassword}
                            onChangeText={(text) => handleChange("confirmPassword", text)}
                            secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Text style={styles.eyeIcon}>{showConfirmPassword ? "👁" : "🙅"}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* We're simulating pickers with Action Sheets or standard TextInputs if we avoid 3rd party packages for mobile */}
                    {/* To maintain consistent React Native bare/Expo support without additional install, we'll use a basic styled representation for dropdown fields */}

                    <Text style={styles.label}>Major *</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.optionsScroll}
                        contentContainerStyle={styles.optionsContainer}
                    >
                        {majors.map((m) => (
                            <TouchableOpacity
                                key={m}
                                style={[styles.optionChip, formData.major === m && styles.optionChipSelected]}
                                onPress={() => handleChange("major", m)}
                            >
                                <Text style={[styles.optionChipText, formData.major === m && styles.optionChipTextSelected]}>
                                    {m}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.label}>Academic Year *</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.optionsScroll}
                        contentContainerStyle={styles.optionsContainer}
                    >
                        {academicYears.map((y) => (
                            <TouchableOpacity
                                key={y}
                                style={[styles.optionChip, formData.academicYear === y && styles.optionChipSelected]}
                                onPress={() => handleChange("academicYear", y)}
                            >
                                <Text style={[styles.optionChipText, formData.academicYear === y && styles.optionChipTextSelected]}>
                                    {y}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Semester *</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.optionsScroll}
                                contentContainerStyle={styles.optionsContainer}
                            >
                                {semesters.map((s) => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.optionChip, formData.currentSemester === s && styles.optionChipSelected]}
                                        onPress={() => handleChange("currentSemester", s)}
                                    >
                                        <Text style={[styles.optionChipText, formData.currentSemester === s && styles.optionChipTextSelected]}>
                                            {s}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Credits *</Text>
                            <View style={[styles.inputWrapper, { paddingVertical: 8, height: 44 }]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0"
                                    placeholderTextColor="#aaa"
                                    value={formData.completedCreditHours}
                                    onChangeText={(text) => handleChange("completedCreditHours", text)}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    <Text style={styles.label}>Phone (Optional)</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>📞</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Your phone number"
                            placeholderTextColor="#aaa"
                            value={formData.phoneNumber}
                            onChangeText={(text) => handleChange("phoneNumber", text)}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.rememberRow}
                        onPress={() => handleChange("acceptTerms", !formData.acceptTerms)}
                    >
                        <View style={[styles.checkbox, formData.acceptTerms && styles.checkboxChecked]}>
                            {formData.acceptTerms && <Text style={styles.checkboxMark}>✓</Text>}
                        </View>
                        <Text style={styles.rememberText}>I accept the Terms and Conditions *</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.signInBtn, (!isFormValid || isLoading) && styles.signInBtnDisabled]}
                        disabled={!isFormValid || isLoading}
                        onPress={handleSubmit}
                    >
                        <Text style={styles.signInBtnText}>{isLoading ? "Creating Account..." : "Create Account"}</Text>
                    </TouchableOpacity>

                    <View style={styles.bottomNavContainer}>
                        <Text style={styles.bottomNavText}>Already have an account? </Text>
                        <TouchableOpacity onPress={onNavigateLogin}>
                            <Text style={styles.bottomNavTextLink}>Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f0f2f5" },
    scrollView: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    topPanel: {
        height: height * 0.40, backgroundColor: "#2554e8",
        paddingHorizontal: 28, paddingTop: 52, paddingBottom: 20,
    },
    iconWrapper: {
        width: 48, height: 48, borderRadius: 12,
        borderWidth: 2, borderColor: "rgba(255,255,255,0.6)",
        alignItems: "center", justifyContent: "center", marginBottom: 16,
    },
    iconText: { fontSize: 22 },
    slideTitle: { fontSize: 26, fontWeight: "800", color: "#fff", lineHeight: 34, marginBottom: 10 },
    slideSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 20, marginBottom: 18 },
    featureList: { gap: 8 },
    featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    checkCircle: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 1.5, borderColor: "rgba(255,255,255,0.7)",
        alignItems: "center", justifyContent: "center",
    },
    checkMark: { color: "#fff", fontSize: 11, fontWeight: "700" },
    featureText: { color: "rgba(255,255,255,0.9)", fontSize: 13 },
    formContainer: {
        margin: 16, backgroundColor: "#fff", borderRadius: 20, padding: 24,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 16, elevation: 6, marginBottom: 32,
        marginTop: -20,  
    },
    signInTitle: { fontSize: 24, fontWeight: "800", color: "#111", marginBottom: 4 },
    signInSubtitle: { fontSize: 13, color: "#888", marginBottom: 16 },
    errorBox: {
        backgroundColor: "#fef2f2", borderWidth: 1.5, borderColor: "#fca5a5",
        borderRadius: 10, padding: 12, marginBottom: 16,
    },
    errorText: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
    label: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6 },
    inputWrapper: {
        flexDirection: "row", alignItems: "center",
        borderWidth: 1.5, borderColor: "#e0e0e0", borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 11, marginBottom: 14, backgroundColor: "#fafafa",
    },
    input: { flex: 1, fontSize: 14, color: "#222" },
    inputIcon: { fontSize: 15, marginRight: 8, color: "#aaa" },
    eyeIcon: { fontSize: 16, marginLeft: 6 },

    optionsScroll: { marginBottom: 16 },
    optionsContainer: { flexDirection: "row", gap: 8, paddingRight: 20 },
    optionChip: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1.5, borderColor: "#e0e0e0",
        backgroundColor: "#fafafa", marginRight: 8,
    },
    optionChipSelected: {
        backgroundColor: "#eef2ff", borderColor: "#2554e8"
    },
    optionChipText: { fontSize: 13, color: "#666", fontWeight: "500" },
    optionChipTextSelected: { color: "#2554e8", fontWeight: "700" },

    rememberRow: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 10 },
    checkbox: {
        width: 18, height: 18, borderRadius: 4,
        borderWidth: 1.5, borderColor: "#ccc",
        alignItems: "center", justifyContent: "center",
    },
    checkboxChecked: { backgroundColor: "#2554e8", borderColor: "#2554e8" },
    checkboxMark: { color: "#fff", fontSize: 11, fontWeight: "700" },
    rememberText: { fontSize: 13, color: "#555" },
    signInBtn: {
        backgroundColor: "#2554e8", borderRadius: 10,
        paddingVertical: 15, alignItems: "center", marginBottom: 16,
    },
    signInBtnDisabled: { backgroundColor: "#9ab0f0" },
    signInBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.4 },

    bottomNavContainer: { flexDirection: "row", justifyContent: "center" },
    bottomNavText: { fontSize: 13, color: "#777" },
    bottomNavTextLink: { fontSize: 13, color: "#2554e8", fontWeight: "700" },
});
