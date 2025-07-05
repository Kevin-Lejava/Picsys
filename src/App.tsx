import React, { useState, useEffect, ChangeEvent, DragEvent } from "react";
import { SelectChangeEvent } from "@mui/material/Select";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Typography,
  Chip,
} from "@mui/material";
import axios from "axios";
import { DIPMethodName, DIPParams } from "./Types";
import { LineChart } from "@mui/x-charts/LineChart";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewSrc2, setPreviewSrc2] = useState<string | null>(null);
  const [methods, setMethods] = useState<DIPMethodName[]>([]);
  const [params, setParams] = useState<
    Partial<Record<DIPMethodName, DIPParams>>
  >({});
  const [resultSrc, setResultSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [histogram, setHistogram] = useState<{
    r: number[];
    g: number[];
    b: number[];
  } | null>(null);

  const handleClearAll = () => {
    setMethods([]);
    setParams({});
    setResultSrc(null);
  };

  const loadFile = (
    f: File,
    set: React.Dispatch<React.SetStateAction<File | null>>,
    setPrev: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    set(f);
    const reader = new FileReader();
    reader.onload = () => setPrev(reader.result as string);
    reader.readAsDataURL(f);
    setResultSrc(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0])
      loadFile(e.target.files[0], setFile, setPreviewSrc);
  };
  const handleFile2Change = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0])
      loadFile(e.target.files[0], setFile2, setPreviewSrc2);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0])
      loadFile(e.dataTransfer.files[0], setFile, setPreviewSrc);
  };
  const handleDrop2 = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0])
      loadFile(e.dataTransfer.files[0], setFile2, setPreviewSrc2);
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleMethodsChange = (e: SelectChangeEvent<typeof methods>) => {
    const value = e.target.value;
    const newMethods =
      typeof value === "string" ? (value.split(",") as DIPMethodName[]) : value;
    setMethods(newMethods);
    setParams((prev) => {
      const updated: Partial<Record<DIPMethodName, DIPParams>> = {};
      newMethods.forEach((m) => {
        updated[m] = prev[m] || {};
      });
      return updated;
    });
    setResultSrc(null);
  };

  const handleParamChange = (
    method: DIPMethodName,
    key: keyof DIPParams,
    value: number | number[]
  ) => {
    const v = Array.isArray(value) ? value[0] : value;
    setParams((prev) => ({
      ...prev,
      [method]: {
        ...prev[method],
        [key]: v,
      },
    }));
  };

  const handleRun = async () => {
    if (!file) return;
    setLoading(true);
    const data = new FormData();
    data.append("methods", JSON.stringify(methods));
    if (
      (methods.includes("add") ||
        methods.includes("subtract") ||
        methods.includes("multiply") ||
        methods.includes("divide") ||
        methods.includes("LIPadd") ||
        methods.includes("LIPsubtract") ||
        methods.includes("LIPdivide")) &&
      file2
    ) {
      data.append("upload2", file2);
    }
    methods.forEach((m) => {
      const mp = params[m] || {};
      Object.entries(mp).forEach(([k, v]) => {
        data.append(`${m}_${k}`, String(v));
      });
    });
    data.append("upload", file);

    try {
      const response = await axios.post("http://localhost:8000/process", data, {
        responseType: "arraybuffer",
        headers: { "Content-Type": "multipart/form-data" },
      });
      const blob = new Blob([response.data], { type: "image/png" });
      setResultSrc(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Processing error:", err);
      alert("Error processing image. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!resultSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = resultSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height).data;

      const bins = 256;
      const histR = new Array(bins).fill(0);
      const histG = new Array(bins).fill(0);
      const histB = new Array(bins).fill(0);
      for (let i = 0; i < imageData.length; i += 4) {
        histR[imageData[i]]++;
        histG[imageData[i + 1]]++;
        histB[imageData[i + 2]]++;
      }
      setHistogram({ r: histR, g: histG, b: histB });
    };
  }, [resultSrc]);

  const renderParamControls = (method: DIPMethodName) => {
    const p = params[method] || {};
    switch (method) {
      case "gamma":
        return (
          <Box sx={{ my: 2 }} key={`${method}-gamma`}>
            <Typography gutterBottom>{`Gamma (${p.gamma ?? 1.0})`}</Typography>
            <Slider
              value={p.gamma ?? 1.0}
              min={0.1}
              max={5}
              step={0.1}
              onChange={(_, v) => handleParamChange(method, "gamma", v)}
              valueLabelDisplay="auto"
            />
          </Box>
        );

      case "binary":
        return (
          <Box sx={{ my: 2 }} key={`${method}-thresh`}>
            <Typography gutterBottom>{`Binary Threshold (${
              p.thresh ?? 127
            })`}</Typography>
            <Slider
              value={p.thresh ?? 127}
              min={0}
              max={255}
              step={1}
              onChange={(_, v) => handleParamChange(method, "thresh", v)}
              valueLabelDisplay="auto"
            />
          </Box>
        );

      case "canny":
        return (
          <Box key={`${method}-canny`}>
            <Box sx={{ my: 2 }}>
              <Typography gutterBottom>{`Canny Threshold1 (${
                p.threshold1 ?? 100
              })`}</Typography>
              <Slider
                value={p.threshold1 ?? 100}
                min={0}
                max={255}
                step={1}
                onChange={(_, v) => handleParamChange(method, "threshold1", v)}
                valueLabelDisplay="auto"
              />
            </Box>
            <Box sx={{ my: 2 }}>
              <Typography gutterBottom>{`Canny Threshold2 (${
                p.threshold2 ?? 200
              })`}</Typography>
              <Slider
                value={p.threshold2 ?? 200}
                min={0}
                max={255}
                step={1}
                onChange={(_, v) => handleParamChange(method, "threshold2", v)}
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>
        );

      case "sobel":
        return (
          <Box sx={{ my: 2 }}>
            <Typography gutterBottom>{`Sobel Threshold (${
              p.thresh ?? 100
            })`}</Typography>
            <Slider
              value={p.thresh ?? 100}
              min={0}
              max={255}
              step={1}
              onChange={(_, v) => handleParamChange(method, "thresh", v)}
              valueLabelDisplay="auto"
            />
          </Box>
        );

      case "niblack":
        return (
          <>
            <Box sx={{ my: 2 }}>
              <Typography gutterBottom>Niblack k (–1.0 → 1.0)</Typography>
              <Slider
                value={p.k ?? 0.2}
                min={-1}
                max={1}
                step={0.1}
                onChange={(_, v) => handleParamChange(method, "k", v)}
                valueLabelDisplay="auto"
              />
            </Box>
            <Box sx={{ my: 2 }}>
              <Typography gutterBottom>
                Niblack Window Size (odd: 3 → 201)
              </Typography>
              <Slider
                value={p.window_size ?? 15}
                min={3}
                max={201}
                step={2}
                onChange={(_, v) => handleParamChange(method, "window_size", v)}
                valueLabelDisplay="auto"
              />
            </Box>
          </>
        );
      case "sauvola":
        return (
          <>
            <Box sx={{ my: 2 }}>
              <Typography gutterBottom>Sauvola k (–1.0 → 1.0)</Typography>
              <Slider
                value={p.k ?? 0.2}
                min={-1}
                max={1}
                step={0.1}
                onChange={(_, v) => handleParamChange(method, "k", v)}
                valueLabelDisplay="auto"
              />
            </Box>
            <Box sx={{ my: 2 }}>
              <Typography gutterBottom>
                Sauvola Window Size (odd: 3 → 201)
              </Typography>
              <Slider
                value={p.window_size ?? 15}
                min={3}
                max={201}
                step={2}
                onChange={(_, v) => handleParamChange(method, "window_size", v)}
                valueLabelDisplay="auto"
              />
            </Box>
          </>
        );

      case "gaussian_blur":
        return (
          <Box sx={{ my: 2 }}>
            <Typography gutterBottom>Blur Kernel Size (odd: 1 → 21)</Typography>
            <Slider
              value={p.kernel_size ?? 5}
              min={1}
              max={21}
              step={2}
              onChange={(_, v) => handleParamChange(method, "kernel_size", v)}
              valueLabelDisplay="auto"
            />
          </Box>
        );
      case "LIPmultiply":
        return (
          <Box sx={{ my: 2 }} key={`${method}-LIPmultiply`}>
            <Typography gutterBottom>{`Constant (${p.c ?? 1.0})`}</Typography>
            <Slider
              value={p.c ?? 1.0}
              min={0.1}
              max={3.0}
              step={0.1}
              onChange={(_, v) => handleParamChange(method, "c", v)}
              valueLabelDisplay="auto"
            />
          </Box>
        );
      default:
        return null;
    }
  };

  const filename =
    methods.length > 0
      ? methods
          .map((m) => {
            const entries = Object.entries(params[m] || {})
              .map(([k, v]) => `${k}(${v})`)
              .join(",");
            return entries ? `${m}[${entries}]` : m;
          })
          .join("+") + ".png"
      : "No Selections.png";

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Picsys! An experimental picture editing and analysis tool.
      </Typography>
      <Grid
        container
        spacing={4}
        sx={{
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">1. Upload Image</Typography>
              <Box
                sx={{
                  textAlign: "center",
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {previewSrc ? (
                  <CardMedia
                    component="img"
                    src={previewSrc}
                    alt="Preview"
                    sx={{ maxHeight: 300, objectFit: "contain" }}
                  />
                ) : (
                  <Typography>
                    Drag & Drop or{" "}
                    <Button component="label">
                      Browse
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </Button>
                  </Typography>
                )}
              </Box>

              {(methods.includes("add") ||
                methods.includes("subtract") ||
                methods.includes("multiply") ||
                methods.includes("divide") ||
                methods.includes("LIPadd") ||
                methods.includes("LIPsubtract") ||
                methods.includes("LIPdivide")) && (
                <>
                  <Typography variant="h6">1b. Upload Second Image</Typography>
                  <Box
                    sx={{
                      textAlign: "center",
                    }}
                    onDrop={handleDrop2}
                    onDragOver={handleDragOver}
                  >
                    {previewSrc2 ? (
                      <CardMedia
                        component="img"
                        src={previewSrc2}
                        alt="Preview 2"
                        sx={{ maxHeight: 300, objectFit: "contain" }}
                      />
                    ) : (
                      <Typography>
                        Drag & Drop or{" "}
                        <Button component="label">
                          Browse
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleFile2Change}
                          />
                        </Button>
                      </Typography>
                    )}
                  </Box>
                </>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6">2. Select Methods</Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 1,
                  }}
                >
                  <InputLabel id="method-label">DIP Methods</InputLabel>
                  <Button size="small" onClick={handleClearAll}>
                    Clear All
                  </Button>
                </Box>
                <Select
                  labelId="method-label"
                  multiple
                  value={methods}
                  onChange={handleMethodsChange}
                  fullWidth
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="greyscale">Greyscale</MenuItem>
                  <MenuItem value="HSV">HSV Color</MenuItem>
                  <MenuItem value="HLS">HLS Color</MenuItem>
                  <MenuItem value="logarithmic">Logarithmic</MenuItem>
                  <MenuItem value="exponential">Exponential</MenuItem>
                  <MenuItem value="sqrt">Square Root</MenuItem>
                  <MenuItem value="sine">Sine</MenuItem>
                  <MenuItem value="cosine">Cosine</MenuItem>
                  <MenuItem value="tangent">Tangent</MenuItem>
                  <MenuItem value="contrast_stretch">Contrast Stretch</MenuItem>
                  <MenuItem value="hist_eq">Histogram Equalization</MenuItem>
                  <MenuItem value="gamma">Gamma Correction</MenuItem>
                  <MenuItem value="gaussian_blur">Gaussian Blur</MenuItem>
                  <MenuItem value="clahe">CLAHE</MenuItem>
                  <MenuItem value="sharpen">Sharpen</MenuItem>
                  <MenuItem value="segment">Segmentation</MenuItem>
                  <MenuItem value="multisegment">
                    Multi-level Segmentation
                  </MenuItem>
                  <MenuItem value="adaptive_thresh">
                    Adaptive Threshold
                  </MenuItem>
                  <MenuItem value="binary">Binary Threshold</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="dilate">Dilate</MenuItem>
                  <MenuItem value="erode">Erode</MenuItem>
                  <MenuItem value="morphgradient">
                    Morphological Gradient
                  </MenuItem>
                  <MenuItem value="canny">Canny Edge Detection</MenuItem>
                  <MenuItem value="sobel">Sobel Edge Detection</MenuItem>
                  <MenuItem value="niblack">Niblack</MenuItem>
                  <MenuItem value="sauvola">Sauvola</MenuItem>
                  <MenuItem value="HOG">
                    Histogram of Oriented Gradients
                  </MenuItem>
                  <MenuItem value="add">Addition</MenuItem>
                  <MenuItem value="subtract">Subtraction</MenuItem>
                  <MenuItem value="multiply">Multiplication</MenuItem>
                  <MenuItem value="divide">Division</MenuItem>
                  <MenuItem value="LIPadd">Logarithmic Addition</MenuItem>
                  <MenuItem value="LIPsubtract">
                    Logarithmic Subtraction
                  </MenuItem>
                  <MenuItem value="LIPmultiply">
                    Logarithmic Scalar Multiplication
                  </MenuItem>
                  <MenuItem value="LIPdivide">Logarithmic Division</MenuItem>
                </Select>
              </Box>

              {methods.map((m) => renderParamControls(m))}

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleRun}
                disabled={!file || loading}
                sx={{ mt: 2 }}
              >
                {loading ? "Processing…" : "Run"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Result</Typography>
              {resultSrc ? (
                <>
                  <CardMedia
                    component="img"
                    src={resultSrc}
                    alt="Processed"
                    sx={{ maxHeight: 500, objectFit: "contain" }}
                  />
                  <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleRun}
                      disabled={loading}
                    >
                      {loading ? "Processing…" : "Re-run"}
                    </Button>
                    <Button
                      variant="outlined"
                      component="a"
                      href={resultSrc}
                      download={filename}
                      sx={{}}
                    >
                      Save Image
                    </Button>
                  </Box>

                  <Typography sx={{ mt: 2 }}>
                    Selections: {filename.replace(".png", "")}
                  </Typography>
                  {histogram && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6">Histogram</Typography>
                      <LineChart
                        height={300}
                        series={[
                          {
                            data: histogram.r,
                            label: "Red",
                            color: "#d62728",
                          },
                          {
                            data: histogram.g,
                            label: "Green",
                            color: "#2ca02c",
                          },
                          {
                            data: histogram.b,
                            label: "Blue",
                            color: "#1f77b4",
                          },
                        ]}
                        xAxis={[
                          {
                            data: Array.from({ length: 256 }, (_, i) => i),
                            scaleType: "point",
                          },
                        ]}
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Typography color="text.secondary">
                  No result yet. Upload an image, select methods, and click Run.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default App;
