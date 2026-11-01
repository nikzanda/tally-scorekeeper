import { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

type Props<T> = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  /** Current committed value, shown whenever the field is not being edited. */
  value: string;
  /** Converts the typed text into a value, or `null` while it is incomplete or invalid. */
  parse: (text: string) => T | null;
  onValueChange: (value: T) => void;
  sanitize?: (text: string) => string;
};

/**
 * Text field that keeps the user's partial input while focused and only propagates valid values,
 * snapping back to the committed value on blur.
 */
export function DraftTextInput<T>({
  value,
  parse,
  onValueChange,
  sanitize,
  onFocus,
  onBlur,
  ...textInputProps
}: Props<T>) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <TextInput
      {...textInputProps}
      value={draft ?? value}
      onFocus={(event) => {
        setDraft(value);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setDraft(null);
        onBlur?.(event);
      }}
      onChangeText={(text) => {
        const next = sanitize ? sanitize(text) : text;
        setDraft(next);
        const parsed = parse(next);
        if (parsed !== null) onValueChange(parsed);
      }}
    />
  );
}
