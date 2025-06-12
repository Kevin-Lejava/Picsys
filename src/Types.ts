export type DIPMethodName =
  | "greyscale"
  | "HSV"
  | "HLS"
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
  | "segment"
  | "multisegment"
  | "adaptive_thresh"
  | "binary"
  | "open"
  | "dilate"
  | "erode"
  | "morphgradient"
  | "canny"
  | "sobel"
  | "niblack"
  | "sauvola"
  | "HOG";

export interface DIPParams {
  gamma?: number;
  thresh?: number;
  threshold1?: number;
  threshold2?: number;
  k?: number;
  window_size?: number;
  kernel_size?: number;
}
