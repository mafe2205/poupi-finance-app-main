import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { ApiError } from '@/api/client';
import { uploadDocument, type UploadableFile } from '@/api/documents';
import { useTheme } from '@/hooks/use-theme';

const MAX_UPLOAD_SIDE = 2000;

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  quality: 0.7,
  presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
};

async function shrinkForUpload(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_UPLOAD_SIDE) {
    context.resize(asset.width >= asset.height ? { width: MAX_UPLOAD_SIDE } : { height: MAX_UPLOAD_SIDE });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return result.uri;
}

export default function NovoComprovanteScreen() {
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleAsset(asset: ImagePicker.ImagePickerAsset) {
    setError('');
    setUploading(true);
    try {
      const webFile = (asset as unknown as { file?: Blob }).file;
      const file: UploadableFile = webFile ?? new File(await shrinkForUpload(asset));
      const documentId = await uploadDocument(file);
      router.push({ pathname: '/comprovante/revisao', params: { documentId } });
    } catch (err) {
      console.log('Falha no envio do comprovante', err);
      if (err instanceof ApiError) {
        setError(
          err.status === 413
            ? 'A foto é grande demais para enviar (limite de 10 MB). Tente uma foto com menos resolução.'
            : `Não foi possível enviar o comprovante (erro ${err.status}): ${err.message}`
        );
      } else {
        const message = err instanceof Error ? err.message : String(err);
        const isNetwork = /network request failed|failed to fetch|network error|timed? ?out/i.test(message);
        setError(
          isNetwork
            ? `Não foi possível conectar à API para enviar o comprovante. Verifique se ela está rodando e se o celular está na mesma rede. (${message})`
            : `Não foi possível preparar a foto para envio. (${message})`
        );
      }
    } finally {
      setUploading(false);
    }
  }

  async function useCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Permissão de câmera negada.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) await handleAsset(result.assets[0]);
  }

  async function useGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Permissão de galeria negada.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ ...PICKER_OPTIONS, mediaTypes: ['images'] });
    if (!result.canceled) await handleAsset(result.assets[0]);
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={[styles.dropzone, { borderColor: theme.border }]}>
        <IconSymbol ios="camera.fill" android="photo_camera" size={32} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          Tirar foto ou enviar da galeria
        </ThemedText>
      </View>

      {!!error && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}

      <Button label={uploading ? 'Enviando…' : 'Usar câmera'} onPress={useCamera} disabled={uploading} />
      <Button label="Escolher da galeria" variant="ghost" onPress={useGallery} disabled={uploading} />
      <Button label="Cancelar" variant="danger" onPress={() => router.back()} disabled={uploading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
  dropzone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
});
