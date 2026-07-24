import {
  Modal,
  type ModalProps,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { cn } from '@/lib/utils';

interface DialogProps extends ModalProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  message?: string;
  className?: string;
}

const Dialog = ({
  visible,
  onClose,
  title,
  message,
  className = '',
  children,
}: DialogProps) => {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-center items-center">
          <View className="absolute inset-0 bg-black opacity-30" />

          <TouchableWithoutFeedback>
            <View
              className={cn(
                'flex justify-center items-center w-[80%] h-45 p-5 bg-background rounded-xl',
                className,
              )}
            >
              {title && <Text className="text-lg font-bold mb-2">{title}</Text>}
              {message && <Text className="mb-4">{message}</Text>}
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default Dialog;
