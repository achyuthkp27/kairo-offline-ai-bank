/**
 * Kairo — Local Model Manager
 * Handles downloading, storing, and verifying the local GGUF model
 */

import * as FileSystem from 'expo-file-system/legacy';

const MODEL_NAME = 'qwen2.5-3b-instruct-q4_k_m.gguf';
const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf';
export const MODEL_PATH = `${FileSystem.documentDirectory}${MODEL_NAME}`;

export const checkModelExists = async (): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(MODEL_PATH);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error checking model existence:', error);
    return false;
  }
};

export const downloadModel = async (
  onProgress?: (progress: number) => void
): Promise<string> => {
  const exists = await checkModelExists();
  if (exists) {
    console.log('[ModelManager] Model already exists at path:', MODEL_PATH);
    return MODEL_PATH;
  }

  console.log('[ModelManager] Starting model download from:', MODEL_URL);

  const downloadResumable = FileSystem.createDownloadResumable(
    MODEL_URL,
    MODEL_PATH,
    {},
    (downloadProgress) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      if (onProgress) {
        onProgress(progress);
      }
    }
  );

  try {
    const result = await downloadResumable.downloadAsync();
    if (!result) throw new Error('Download failed, no result returned.');
    
    console.log('[ModelManager] Model successfully downloaded to:', result.uri);
    return result.uri;
  } catch (error) {
    console.error('[ModelManager] Error downloading model:', error);
    throw error;
  }
};

export const deleteModel = async () => {
  try {
    const exists = await checkModelExists();
    if (exists) {
      await FileSystem.deleteAsync(MODEL_PATH);
      console.log('[ModelManager] Model deleted successfully.');
    }
  } catch (error) {
    console.error('[ModelManager] Error deleting model:', error);
  }
};
