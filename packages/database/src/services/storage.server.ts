import {
  PRODUCT_IMAGE_BUCKET_NAME,
  PRODUCT_IMAGE_PATH_PREFIX,
  STORAGE_CACHE_CONTROL,
} from "@repo/shared/constants";
import { createAdminClient } from "../lib/supabase/admin";

export async function uploadImage(file: File) {
  const supabase = createAdminClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${PRODUCT_IMAGE_PATH_PREFIX}/${fileName}`;

  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET_NAME).upload(filePath, file, {
    cacheControl: STORAGE_CACHE_CONTROL,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PRODUCT_IMAGE_BUCKET_NAME).getPublicUrl(filePath);

  return publicUrl;
}

export async function deleteImage(publicUrl: string) {
  const supabase = createAdminClient();
  const path = publicUrl.split(`${PRODUCT_IMAGE_BUCKET_NAME}/`).pop();

  if (!path) return;

  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET_NAME).remove([path]);

  if (error) {
    throw error;
  }
}
