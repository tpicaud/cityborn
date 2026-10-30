import { Input, styled, Text, View } from 'tamagui';

type TextFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
  secureTextEntry?: boolean;
  disabled?: boolean;
};

const TextFieldInput = styled(Input, {
  size: false,
  self: 'stretch',
  h: '14',
  px: '4',
  rounded: '8',
  borderWidth: '1',
  borderColor: 'field-border focus:white',
  backgroundColor: 'field-fill',
  fontFamily: 'body',
  fontSize: '4',
  fontWeight: '400',
  color: 'white',
  variants: {
    invalid: {
      true: { borderColor: 'common-red' },
    },
  } as const,
});

const TextFieldError = styled(Text, {
  px: '4',
  fontFamily: 'body',
  fontSize: '2',
  lineHeight: '2',
  fontWeight: '500',
  color: 'common-red',
});

export function TextField({
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  disabled = false,
}: TextFieldProps) {
  return (
    <View self="stretch" gap="1.5">
      <TextFieldInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="field-placeholder"
        secureTextEntry={secureTextEntry}
        type={secureTextEntry ? 'password' : 'text'}
        disabled={disabled}
        invalid={error !== undefined}
        aria-invalid={error !== undefined}
      />
      {error !== undefined && (
        <TextFieldError role="alert">{error}</TextFieldError>
      )}
    </View>
  );
}
