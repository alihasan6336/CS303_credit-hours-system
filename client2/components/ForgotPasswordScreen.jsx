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

const { height } = Dimensions.get("window");

export default function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState("");
  const isFormValid = email.length > 0;

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
        {/* TOP PANEL */}
        <View style={styles.topPanel}>
          <View style={styles.iconWrapper}>
            <Text style={styles.iconText}>🎓</Text>
          </View>
          <Text style={styles.panelTitle}>{"Reset Your\nPassword"}</Text>
          <Text style={styles.panelSubtitle}>
            Don't worry! It happens to the best of us. Enter your email and we'll send you reset instructions.
          </Text>
          <View style={styles.featureList}>
            {[
              "Quick and secure process",
              "Email verification required",
              "Back in your account in minutes",
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

        {/* FORM */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Forgot Password?</Text>
          <Text style={styles.formSubtitle}>No worries, we'll send you reset instructions</Text>

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
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

          <TouchableOpacity
            style={[styles.btn, !isFormValid && styles.btnDisabled]}
            disabled={!isFormValid}
            onPress={() => alert("Reset link sent to " + email)}
          >
            <Text style={styles.btnText}>Send Reset Link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backRow} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}> Back to sign in</Text>
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Remember your password? </Text>
            <TouchableOpacity onPress={onBack}>
              <Text style={styles.bottomLink}>Sign in</Text>
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
    height: height * 0.45,
    backgroundColor: "#2554e8",
    paddingHorizontal: 28,
    paddingTop: 52,
    paddingBottom: 20,
  },
  iconWrapper: {
    width: 48, height: 48, borderRadius: 12,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  iconText: { fontSize: 22 },
  panelTitle: { fontSize: 26, fontWeight: "800", color: "#fff", lineHeight: 34, marginBottom: 10 },
  panelSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 20, marginBottom: 18 },
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
    margin: 16, backgroundColor: "#fff", borderRadius: 20,
    padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 6, marginBottom: 32,
  },
  formTitle: { fontSize: 24, fontWeight: "800", color: "#111", marginBottom: 4 },
  formSubtitle: { fontSize: 13, color: "#888", marginBottom: 22 },
  label: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#e0e0e0", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, marginBottom: 20, backgroundColor: "#fafafa",
  },
  inputIcon: { fontSize: 15, marginRight: 8, color: "#aaa" },
  input: { flex: 1, fontSize: 14, color: "#222" },
  btn: {
    backgroundColor: "#2554e8", borderRadius: 10,
    paddingVertical: 15, alignItems: "center", marginBottom: 16,
  },
  btnDisabled: { backgroundColor: "#9ab0f0" },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.4 },
  backRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  backArrow: { fontSize: 16, color: "#333", fontWeight: "600" },
  backText: { fontSize: 14, color: "#333", fontWeight: "600" },
  bottomRow: { flexDirection: "row", justifyContent: "center" },
  bottomText: { fontSize: 13, color: "#888" },
  bottomLink: { fontSize: 13, color: "#2554e8", fontWeight: "700" },
});
