import React, { useState, ChangeEvent } from "react";
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
} from "@mui/material";
import axios from "axios";
import { DIPMethodName, DIPParams } from "./Types";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [method, setMethod] = useState<DIPMethodName>("greyscale");
  const [params, setParams] = useState<DIPParams>({});
  const [resultSrc, setResultSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewSrc(reader.result as string);
      };
      reader.readAsDataURL(f);
      setResultSrc(null);
    }
  };

  const handleMethodChange = (e: SelectChangeEvent) => {
    const m = e.target.value as DIPMethodName;
    setMethod(m);
    setParams({});
    setResultSrc(null);
  };

  const handleParamChange = (
    key: keyof DIPParams,
    value: number | number[]
  ) => {
    const v = Array.isArray(value) ? value[0] : value;
    setParams((prev) => ({
      ...prev,
      [key]: v,
    }));
  };

  const handleRun = async () => {
    if (!file) return;
    setLoading(true);
    const data = new FormData();
    data.append("method", method);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        data.append(k, String(v));
      }
    });
    data.append("upload", file);

    try {
      const response = await axios.post("http://localhost:8000/process", data, {
        responseType: "arraybuffer",
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const blob = new Blob([response.data], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      setResultSrc(url);
    } catch (err) {
      console.error("Processing error:", err);
      alert("Error processing image. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  const renderParamControls = () => {
    switch (method) {
      case "gamma":
        return (
          <Box sx={{ my: 2 }}>
            <Typography gutterBottom>Gamma (0.1 → 5.0)</Typography>
            <Slider
              value={params.gamma ?? 1.0}
              min={0.1}
              max={5}
              step={0.1}
              onChange={(_, v) => handleParamChange("gamma", v)}
              valueLabelDisplay="auto"
            />
          </Box>
        );

      case "binary":
        return (
          <Box sx={{ my: 2 }}>
            <Typography gutterBottom>Threshold (0 → 255)</Typography>
            <Slider
              value={params.thresh ?? 127}
              min={0}
              max={255}
              step={1}
              onChange={(_, v) => handleParamChange("thresh", v)}
              valueLabelDisplay="auto"
            />
          </Box>
        );

      case "canny":
        return (
          <>
            <Box sx={{ my: 2 }}>
              <Typography gutterBottom>Threshold1 (0 → 255)</Typography>
              <Slider
                value={params.threshold1 ?? 100}
                min={0}
                max={255}
                step={1}
                onChange={(_, v) => handleParamChange("threshold1", v)}
                valueLabelDisplay="auto"
              />
            </Box>
            <Box sx={{ my: 2 }}>
              <Typography gutterBottom>Threshold2 (0 → 255)</Typography>
              <Slider
                value={params.threshold2 ?? 200}
                min={0}
                max={255}
                step={1}
                onChange={(_, v) => handleParamChange("threshold2", v)}
                valueLabelDisplay="auto"
              />
            </Box>
          </>
        );

      case "sobel":
        return (
          <Box sx={{ my: 2 }}>
            <Typography gutterBottom>Edge Threshold (0 → 255)</Typography>
            <Slider
              value={params.thresh ?? 100}
              min={0}
              max={255}
              step={1}
              onChange={(_, v) => handleParamChange("thresh", v)}
              valueLabelDisplay="auto"
            />
          </Box>
        );

      case "niblack":
      case "sauvola":
        return (
          <>
            <Box sx={{ my: 2 }}>
              <Typography gutterBottom>k (–1.0 → 1.0)</Typography>
              <Slider
                value={params.k ?? 0.2}
                min={-1}
                max={1}
                step={0.1}
                onChange={(_, v) => handleParamChange("k", v)}
                valueLabelDisplay="auto"
              />
            </Box>
            <Box sx={{ my: 2 }}>
              <Typography gutterBottom>Window Size (odd: 3 → 201)</Typography>
              <Slider
                value={params.window_size ?? 15}
                min={3}
                max={201}
                step={2}
                onChange={(_, v) => handleParamChange("window_size", v)}
                valueLabelDisplay="auto"
              />
            </Box>
          </>
        );

      case "gaussian_blur":
        return (
          <Box sx={{ my: 2 }}>
            <Typography gutterBottom>Kernel Size (odd: 1 → 21)</Typography>
            <Slider
              value={params.kernel_size ?? 5}
              min={1}
              max={21}
              step={2}
              onChange={(_, v) => handleParamChange("kernel_size", v)}
              valueLabelDisplay="auto"
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Picsys! An experimental picture editing and analysis tool.
      </Typography>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">1. Upload Image</Typography>
              <Button
                variant="contained"
                component="label"
                fullWidth
                sx={{ mt: 1 }}
              >
                Choose File
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
              {previewSrc && (
                <CardMedia
                  component="img"
                  src={previewSrc}
                  alt="Original Preview"
                  sx={{ mt: 2, maxHeight: 200, objectFit: "contain" }}
                />
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6">2. Select Method</Typography>
                <InputLabel id="method-label" sx={{ mt: 1 }}>
                  DIP Method
                </InputLabel>
                <Select
                  labelId="method-label"
                  value={method}
                  onChange={handleMethodChange}
                  fullWidth
                >
                  <MenuItem value="greyscale">Greyscale</MenuItem>
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
                  <MenuItem value="adaptive_thresh">
                    Adaptive Threshold
                  </MenuItem>
                  <MenuItem value="binary">Binary Threshold</MenuItem>
                  <MenuItem value="canny">Canny Edge</MenuItem>
                  <MenuItem value="sobel">Sobel Edge</MenuItem>
                  <MenuItem value="niblack">Niblack</MenuItem>
                  <MenuItem value="sauvola">Sauvola</MenuItem>
                </Select>
              </Box>

              {renderParamControls()}

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
                <CardMedia
                  component="img"
                  src={resultSrc}
                  alt="Processed Result"
                  sx={{ maxHeight: 500, objectFit: "contain" }}
                />
              ) : (
                <Typography color="text.secondary">
                  No result yet. Upload an image, select a method, and click
                  Run.
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
