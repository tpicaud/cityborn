import type { ComponentProps } from 'react';
import { Input, styled, View } from 'tamagui';
import { Caption } from './Caption';

type TextFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
  secureTextEntry?: boolean;
  disabled?: boolean;
  onBlur?: ComponentProps<typeof Input>['onBlur'];
  inputRef?: ComponentProps<typeof Input>['ref'];
  autoComplete?: ComponentProps<typeof Input>['autoComplete'];
  inputMode?: ComponentProps<typeof Input>['inputMode'];
  onSubmitEditing?: ComponentProps<typeof Input>['onSubmitEditing'];
  returnKeyType?: ComponentProps<typeof Input>['returnKeyType'];
};

const TextFieldInput = styled(Input, {
  size: false,
  self: 'stretch',
  h: '14 md:20',
  px: '4 md:5',
  rounded: '8',
  borderWidth: '1',
  borderColor: 'field-border focus:white',
  backgroundColor: 'field-fill',
  fontFamily: 'body',
  fontSize: '4 md:6',
  fontWeight: '400',
  color: 'white',
  variants: {
    invalid: {
      true: { borderColor: 'common-red' },
    },
    dimmed: {
      true: { opacity: 0.5 },
    },
  } as const,
});

const TextFieldError = styled(Caption, {
  px: '4',
  color: 'common-red',
});

export function TextField({
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  disabled = false,
  onBlur,
  inputRef,
  autoComplete,
  inputMode,
  onSubmitEditing,
  returnKeyType,
}: TextFieldProps) {
  return (
    <View self="stretch" gap="1.5">
      <TextFieldInput
        ref={inputRef}
        aria-label={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onBlur={onBlur}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="field-placeholder"
        type={secureTextEntry ? 'password' : 'text'}
        disabled={disabled}
        dimmed={disabled}
        invalid={error !== undefined}
        aria-invalid={error !== undefined}
      />
      {error !== undefined && (
        <TextFieldError role="alert">{error}</TextFieldError>
      )}
    </View>
  );
}
