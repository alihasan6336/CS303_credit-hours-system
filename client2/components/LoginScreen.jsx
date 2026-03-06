import { useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView, Platform, ScrollView,
  StatusBar,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import ForgotPasswordScreen from "./ForgotPasswordScreen";

const { height } = Dimensions.get("window");

export default function LoginScreen({ onLogin, errorMessage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const isFormValid = email.length > 0 && password.length > 0;

  if (showForgotPassword) {
    return <ForgotPasswordScreen onBack={() => setShowForgotPassword(false)} />;
  }

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
            <Text style={styles.iconText}>🎓</Text>
          </View>
          <Text style={styles.slideTitle}>{"Welcome Back to\nCredit Hours System"}</Text>
          <Text style={styles.slideSubtitle}>
            Sign in to continue managing your academic journey and register for courses.
          </Text>
          <View style={styles.featureList}>
            {[
              "Access your course schedule",
              "View your academic records",
              "Register for new courses",
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
          <Text style={styles.signInTitle}>Sign In</Text>
          <Text style={styles.signInSubtitle}>Welcome back! Please enter your details</Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputWrapper, errorMessage && styles.inputError]}>
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@university.edu"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.passwordHeader}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.inputWrapper, errorMessage && styles.inputError]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>{showPassword ? "👁" : "🙅"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
            <Text style={styles.rememberText}>Remember me for 30 days</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signInBtn, !isFormValid && styles.signInBtnDisabled]}
            disabled={!isFormValid}
            onPress={() => onLogin(email, password)}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
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
    height: height * 0.45, backgroundColor: "#2554e8",
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
  inputError: { borderColor: "#fca5a5" },
  inputIcon: { fontSize: 15, marginRight: 8, color: "#aaa" },
  input: { flex: 1, fontSize: 14, color: "#222" },
  eyeIcon: { fontSize: 16, marginLeft: 6 },
  passwordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  forgotText: { fontSize: 13, color: "#2554e8", fontWeight: "600", marginBottom: 6 },
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
    paddingVertical: 15, alignItems: "center", marginBottom: 8,
  },
  signInBtnDisabled: { backgroundColor: "#9ab0f0" },
  signInBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.4 },
});