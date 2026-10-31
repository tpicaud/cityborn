import { styled, View } from 'tamagui';

export const PressableFrame = styled(View, {
  role: 'button',
  render: <button type="button" />,
  tabIndex: 0,
  borderWidth: '0',
  cursor: 'web:pointer',
  outlineColor: 'focus-visible:white',
  outlineStyle: 'focus-visible:solid',
  outlineWidth: 'focus-visible:0.5',
});
