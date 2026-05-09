import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { TransferService } from '../services/TransferService';

interface UseDashboardTransfersParams {
  fdMaturityStatus: string;
  trigger: (type: 'light' | 'medium' | 'heavy' | 'success' | 'selection') => void;
  refreshTxns: () => void;
  refreshSpending: () => void;
  refreshNetWorth: () => void;
  onNavigateWealth: () => void;
  onNavigateAi: () => void;
}

export const useDashboardTransfers = ({
  fdMaturityStatus,
  trigger,
  refreshTxns,
  refreshSpending,
  refreshNetWorth,
  onNavigateWealth,
  onNavigateAi,
}: UseDashboardTransfersParams) => {
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [addMoneyModalVisible, setAddMoneyModalVisible] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    if (!scannerVisible) return;
    setScannerVisible(false);
    trigger('success');

    const merchantName = data.includes('pa=')
      ? data.split('pn=')[1]?.split('&')[0]?.replace(/%20/g, ' ') || 'UPI Merchant'
      : data;

    setTransferRecipient(merchantName);
    setTransferAmount('');
    setTransferModalVisible(true);
  }, [scannerVisible, trigger]);

  const executeTransfer = useCallback(async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0 || !transferRecipient) {
      Alert.alert('Error', 'Please enter a valid amount and recipient');
      return;
    }

    setIsProcessing(true);
    try {
      await TransferService.performTransfer(amount, transferRecipient);
      trigger('success');
      setTransferSuccess(true);
      setTimeout(() => {
        setTransferModalVisible(false);
        setTransferSuccess(false);
        setTransferAmount('');
        setTransferRecipient('');
        refreshTxns();
        refreshSpending();
        refreshNetWorth();
      }, 2000);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Transfer failed. Please try again.';
      Alert.alert('Transfer Failed', message);
    } finally {
      setIsProcessing(false);
    }
  }, [refreshNetWorth, refreshSpending, refreshTxns, transferAmount, transferRecipient, trigger]);

  const executeAddMoney = useCallback(async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      await TransferService.addFunds(amount);
      trigger('success');
      setAddMoneyModalVisible(false);
      setTransferAmount('');
      refreshTxns();
      refreshSpending();
      refreshNetWorth();
      Alert.alert('Success', `₹${amount} added successfully!`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unable to add money right now.';
      Alert.alert('Error', message);
    } finally {
      setIsProcessing(false);
    }
  }, [refreshNetWorth, refreshSpending, refreshTxns, transferAmount, trigger]);

  const handleActionPress = useCallback((actionId: string) => {
    trigger('medium');

    switch (actionId) {
      case 'send':
      case 'upi':
        setTransferRecipient('');
        setTransferAmount('');
        setTransferModalVisible(true);
        break;
      case 'add':
        setTransferAmount('');
        setAddMoneyModalVisible(true);
        break;
      case 'scan':
        if (!permission?.granted) {
          requestPermission();
        } else {
          setScannerVisible(true);
        }
        break;
      case 'pay':
        Alert.alert(
          'Pay Bills',
          'Select a bill to pay in real-time:',
          [
            {
              text: 'Tata Power (₹2,450)',
              onPress: () => {
                setTransferRecipient('Tata Power');
                setTransferAmount('2450');
                setTransferModalVisible(true);
              },
            },
            {
              text: 'Airtel (₹999)',
              onPress: () => {
                setTransferRecipient('Airtel Fiber');
                setTransferAmount('999');
                setTransferModalVisible(true);
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        break;
      case 'fd':
        Alert.alert(
          'Fixed Deposits',
          `Current FD: ${fdMaturityStatus}\n\nTop Rates:\n• 1 Year: 7.20% p.a.\n• 3 Years: 7.50% p.a.`,
          [{ text: 'Book New FD', style: 'default' }, { text: 'Close', style: 'cancel' }]
        );
        break;
      case 'invest':
        onNavigateWealth();
        break;
      case 'analytics':
        onNavigateAi();
        break;
      default:
        break;
    }
  }, [fdMaturityStatus, onNavigateAi, onNavigateWealth, permission?.granted, requestPermission, trigger]);

  return {
    transferModalVisible,
    setTransferModalVisible,
    addMoneyModalVisible,
    setAddMoneyModalVisible,
    transferAmount,
    setTransferAmount,
    transferRecipient,
    setTransferRecipient,
    isProcessing,
    transferSuccess,
    scannerVisible,
    setScannerVisible,
    handleBarCodeScanned,
    handleActionPress,
    executeTransfer,
    executeAddMoney,
  };
};
