export const PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PROFILE_PHOTO_MAX_SIZE = 5 * 1024 * 1024;

type ProfilePhotoFile = {
  type: string;
  size: number;
};

export function validateProfilePhoto(file: ProfilePhotoFile) {
  if (!PROFILE_PHOTO_TYPES.includes(file.type)) {
    return "Choose a JPG, PNG, or WebP image.";
  }

  if (file.size > PROFILE_PHOTO_MAX_SIZE) {
    return "Profile photo must be 5 MB or smaller.";
  }

  return "";
}
