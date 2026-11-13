import {
  type RenderResult,
  render,
  screen,
} from '@testing-library/react-native';
import Dialog from './Dialog';

describe('Dialog', () => {
  it('hides its message when it closes', async () => {
    const dialog: RenderResult = await render(
      <Dialog visible title="Confirmation" message="Quitter la partie ?" />,
    );
    expect(screen.getByText('Quitter la partie ?')).toBeVisible();

    await dialog.rerender(
      <Dialog
        visible={false}
        title="Confirmation"
        message="Quitter la partie ?"
      />,
    );

    expect(screen.queryByText('Quitter la partie ?')).toBeNull();
  });
});
