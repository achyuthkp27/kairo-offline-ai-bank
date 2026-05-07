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

class ModelDownloadManager {
  private downloadResumable: FileSystem.DownloadResumable | null = null;
  private isPaused = false;

  async startDownload(
    onProgress?: (progress: number, totalWritten: number, totalExpected: number) => void,
    retryCount = 3
  ): Promise<string> {
    const exists = await checkModelExists();
    if (exists) return MODEL_PATH;

    this.downloadResumable = FileSystem.createDownloadResumable(
      MODEL_URL,
      MODEL_PATH,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        if (onProgress) {
          onProgress(progress, downloadProgress.totalBytesWritten, downloadProgress.totalBytesExpectedToWrite);
        }
      }
    );

    let attempts = 0;
    while (attempts < retryCount) {
      try {
        console.log(`[ModelManager] Download attempt ${attempts + 1}/${retryCount}`);
        const result = await this.downloadResumable.downloadAsync();
        if (!result) throw new Error('Download failed, no result returned.');
        return result.uri;
      } catch (error) {
        attempts++;
        if (attempts >= retryCount) throw error;
        console.warn(`[ModelManager] Download failed, retrying in 3s...`, error);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    throw new Error('Download failed after retries');
  }

  async pause() {
    if (this.downloadResumable && !this.isPaused) {
      try {
        await this.downloadResumable.pauseAsync();
        this.isPaused = true;
        console.log('[ModelManager] Download paused');
      } catch (e) {
        console.error('[ModelManager] Pause failed', e);
      }
    }
  }

  async resume() {
    if (this.downloadResumable && this.isPaused) {
      try {
        await this.downloadResumable.resumeAsync();
        this.isPaused = false;
        console.log('[ModelManager] Download resumed');
      } catch (e) {
        console.error('[ModelManager] Resume failed', e);
      }
    }
  }

  async cancel() {
    if (this.downloadResumable) {
      try {
        await this.downloadResumable.cancelAsync();
        this.downloadResumable = null;
        this.isPaused = false;
        console.log('[ModelManager] Download cancelled');
        // Clean up partial file
        if (await checkModelExists()) {
          await FileSystem.deleteAsync(MODEL_PATH);
        }
      } catch (e) {
        console.error('[ModelManager] Cancel failed', e);
      }
    }
  }
}

export const downloadManager = new ModelDownloadManager();

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
