import React, { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import notice from '../legalNotice.json';

export default function LegalNotice({ isDark }: { isDark: boolean }) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const colors = isDark
    ? { backgroundColor: '#0b1117', color: '#d9e6f2', borderColor: '#2a3441' }
    : { backgroundColor: '#f8fafc', color: '#17212b', borderColor: '#cbd5e1' };
  const linkStyle = [styles.link, { color: isDark ? '#85c8ff' : '#075fa8' }];

  return (
    <View style={[styles.footer, colors, { paddingBottom: Math.max(8, insets.bottom) }]}>
      <Text style={[styles.summary, { color: colors.color }]}>© 2026 Peter Stroessler · Nur für Lernzwecke</Text>
      <Text style={[styles.summary, { color: colors.color }]}>{notice.keySummary}</Text>
      <Pressable accessibilityRole="button" onPress={() => setVisible(true)} style={styles.linkButton}>
        <Text style={linkStyle}>Rechtliche Hinweise · Haftung & Kontakt</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <SafeAreaView style={styles.overlay}>
          <View accessibilityViewIsModal accessibilityLabel="Rechtliche Hinweise" style={[styles.panel, colors]}>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={[styles.heading, { color: colors.color }]}>Rechtliche Hinweise</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Rechtliche Hinweise schließen" onPress={() => setVisible(false)} style={styles.linkButton}>
                <Text style={linkStyle}>Schließen</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
              <Text style={[styles.paragraph, { color: colors.color }]}>{notice.purposeSummary}</Text>
              <Text style={[styles.paragraph, { color: colors.color }]}>Stand: {notice.updated}</Text>
              {notice.sections.map((section) => (
                <View key={section.title}>
                  <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.color }]}>{section.title}</Text>
                  <Text style={[styles.paragraph, { color: colors.color }]}>{section.text}</Text>
                </View>
              ))}
              <Pressable accessibilityRole="link" accessibilityLabel={`Kontakt: ${notice.contact}`} onPress={() => void Linking.openURL(`mailto:${notice.contact}`)} style={styles.linkButton}>
                <Text style={linkStyle}>{notice.contact}</Text>
              </Pressable>
              {notice.references.map((reference) => (
                <Pressable key={reference.url} accessibilityRole="link" onPress={() => void Linking.openURL(reference.url)} style={styles.linkButton}>
                  <Text style={linkStyle}>{reference.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { borderTopWidth: 1, paddingTop: 8, paddingHorizontal: 12, alignItems: 'center' },
  summary: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
  linkButton: { paddingVertical: 8, paddingHorizontal: 4 },
  link: { fontSize: 13, lineHeight: 19, textDecorationLine: 'underline' },
  overlay: { flex: 1, padding: 16, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center' },
  panel: { maxWidth: 760, maxHeight: '90%', width: '100%', alignSelf: 'center', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heading: { flex: 1, fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionTitle: { fontSize: 16, lineHeight: 23, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  paragraph: { fontSize: 14, lineHeight: 22, marginBottom: 8 },
});
