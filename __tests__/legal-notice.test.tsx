import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import LegalNotice from '../src/components/LegalNotice';

const describeUI = process.env.EXPO_UI_TESTS === '1' ? describe : describe.skip;

describeUI('Legal notice', () => {
  it('shows the key restriction and opens and closes the full notice', () => {
    const view = render(<LegalNotice isDark />);
    expect(view.getByText('© 2026 Peter Stroessler · Nur für Lernzwecke')).toBeTruthy();
    expect(view.getByText(/CARTO-API-Schlüssel: Weitergabe und Wiederverwendung/)).toBeTruthy();
    expect(view.queryByText('4. Haftungsbeschränkung und gesetzliche Vorbehalte')).toBeNull();

    fireEvent.press(view.getByRole('button', { name: 'Rechtliche Hinweise · Haftung & Kontakt' }));
    expect(view.getByText('4. Haftungsbeschränkung und gesetzliche Vorbehalte')).toBeTruthy();
    expect(view.getByText(/Der Ausschluss gilt nicht bei rechtswidriger Absicht/)).toBeTruthy();
    expect(view.getByText(/Die Beschreibung als Bildungsdemonstration schränkt/)).toBeTruthy();

    fireEvent.press(view.getByRole('button', { name: 'Rechtliche Hinweise schließen' }));
    expect(view.queryByText('4. Haftungsbeschränkung und gesetzliche Vorbehalte')).toBeNull();
  });

  it('opens the requested contact address only when the contact link is pressed', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    try {
      const view = render(<LegalNotice isDark={false} />);
      fireEvent.press(view.getByRole('button', { name: 'Rechtliche Hinweise · Haftung & Kontakt' }));
      expect(openURL).not.toHaveBeenCalled();
      fireEvent.press(view.getByRole('link', { name: 'Kontakt: peter.stroessler@bluewin.ch' }));
      expect(openURL).toHaveBeenCalledWith('mailto:peter.stroessler@bluewin.ch');
    } finally {
      openURL.mockRestore();
    }
  });
});
