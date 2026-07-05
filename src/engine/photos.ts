import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Let the user attach their own photo to a recipe. We downscale and re-encode to
// a compact JPEG data URI so it (a) persists across reloads in local storage and
// (b) stays small enough not to blow the storage quota. Works on web (file
// picker) and native (library/camera). Returns null if the user cancels.
export async function pickRecipePhoto(fromCamera = false): Promise<string | null> {
  if (fromCamera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
  const res = fromCamera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (res.canceled || !res.assets?.[0]) return null;

  try {
    // Cap the long edge at 900px and compress — a phone photo becomes ~60–120 KB.
    const out = await manipulateAsync(res.assets[0].uri, [{ resize: { width: 900 } }], {
      compress: 0.6,
      format: SaveFormat.JPEG,
      base64: true,
    });
    return out.base64 ? `data:image/jpeg;base64,${out.base64}` : out.uri;
  } catch {
    // If manipulation fails for any reason, fall back to the raw picked image.
    return res.assets[0].uri;
  }
}
