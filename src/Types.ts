// src/types.ts

export type DIPMethodName =
  | "greyscale"
  | "logarithmic"
  | "exponential"
  | "sqrt"
  | "sine"
  | "cosine"
  | "tangent"
  | "contrast_stretch"
  | "hist_eq"
  | "gamma"
  | "gaussian_blur"
  | "clahe"
  | "sharpen"
  | "adaptive_thresh"
  | "binary"
  | "canny"
  | "sobel"
  | "niblack"
  | "sauvola";
// …etc, add all the names from your backend’s DIP_CLASSES

export interface DIPParams {
  gamma?: number;
  thresh?: number;
  threshold1?: number;
  threshold2?: number;
  k?: number;
  window_size?: number;
  kernel_size?: number;
}
