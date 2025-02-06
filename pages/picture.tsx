import type { NextPage } from "next";
import React, { useRef, useState, useCallback, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
  Grid,
  Paper,
  Box,
  Typography,
  ButtonGroup,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Webcam from "react-webcam";
import { Camera, Folder, Send } from "@mui/icons-material";
import { useGeolocated } from "react-geolocated";
import { getAllClusters, newCluster, newImage, newPost } from "../apis";
import { Input } from "../constants";
import { useSnackbar } from "notistack";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { isSafari, isWithinMi } from "../helpers";
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';


const cameraWidth = 720;
const cameraHeight = 720;
const aspectRatio = cameraWidth / cameraHeight;

const videoConstraints: MediaTrackConstraints = {
  aspectRatio: aspectRatio,
};

const Picture: NextPage = () => {
  const [imgSrc, setImgSrc] = useState<null | string>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [comment, setComment] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const [isIOS, setisIOS] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setisIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
  
      // More browser-specific logic here
    }
  }, []);

  const {
    coords,
    getPosition,
    isGeolocationAvailable,
    isGeolocationEnabled,
    positionError,
  } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: false,
    },
    userDecisionTimeout: 5000,
  });

  const [selectedCamera, setSelectedCamera] = useState("");
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  // const [cameraDevices, setCameraDevices] = useState(null);

  const handleInputChange = (type: Input) => (
    ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    console.log(ev.target.value);
    switch (type) {
      case Input.Comment:
        setComment(ev.target.value);
        break;

      default:
        break;
    }
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) return;
    console.log(fileObj);
    setImgSrc(URL.createObjectURL(fileObj));
    console.log(URL.createObjectURL(fileObj));
  };

  const handleSubmit = ({
    imgSrc,
    comment,
  }: {
    imgSrc: string | null;
    comment: string;
  }) => (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    console.log('Form submission started');
  
    if (imgSrc === null) {
      console.log('Error: Image source is null');
      enqueueSnackbar(`image is not yet set`, { variant: "error" });
      return;
    }
  
    console.log('Image source:', imgSrc);
  
    if (!isGeolocationAvailable) {
      console.log('Error: Geolocation is not available');
      enqueueSnackbar(`Please update or change your browser`, { variant: "error" });
      return;
    }
  
    if (!isGeolocationEnabled) {
      console.log('Error: Geolocation is not enabled');
      enqueueSnackbar(`Please enable location on your browser`, { variant: "error" });
      return;
    }
  
    if (!coords) {
      console.log('Error: No coordinates available');
      return;
    }
  
    console.log('Geolocation coordinates:', coords);
  
    getAllClusters()
      .then(data => {
        console.log('Retrieved clusters:', data);
        const validClusters = data.filter(cluster => {
          const isNotExpired = dayjs(cluster.expires, "MM/DD/YYYY HH:mm:ss").isAfter(dayjs());
          const isWithinDistance = isWithinMi([Number(cluster.latitude), Number(cluster.longitude)], [coords.latitude, coords.longitude], 1);
          return isNotExpired && isWithinDistance;
        });
  
        console.log('Valid clusters:', validClusters);
        if (validClusters.length > 0) {
          console.log('Using an existing cluster');
          return validClusters[0].id.toString();
        } else {
          console.log('Creating a new cluster');
          return newCluster({ latitude: coords.latitude.toString(), longitude: coords.longitude.toString() });
        }
      })
      .then(cluster_id => {
        console.log(`Cluster ID: ${cluster_id}`);
        console.log('Adding new image');
        return newImage({ url: imgSrc }).then(content => {
          console.log(`New image added, id: ${content}`);
          console.log('Creating new post');
          return newPost({ cluster_id, comment, content });
        });
      })
      .then(data => {
        console.log('New post created:', data);
        enqueueSnackbar(`Posted successfully`, { variant: "success" });
        console.log('Navigating to /map');
        router.push('/map');
      })
      .catch(reason => {
        console.log('Error in processing:', reason);
        enqueueSnackbar(`Post failed ${reason}`, { variant: "error" });
      });
  };
  

  const handleCameraOpen = () => {
    setCameraOpen(true);
  };

  const handleCameraClose = (imageSrc: string) => {
    setCameraOpen(false);
    if (imageSrc !== "") {
      setImgSrc(imageSrc);
    }
  };

  const handleCameraChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedCamera(event.target.value as string);
  };

  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot({
        width: cameraWidth,
        height: cameraHeight,
      });
      setImgSrc(imageSrc);
      if (imageSrc) {
        handleCameraClose(imageSrc);
      }
    }
  }, [webcamRef, setImgSrc, handleCameraClose]);


  const listCamera = async () => {
    if (typeof window !== 'undefined') {
      const devices = await navigator.mediaDevices?.enumerateDevices?.();
    }
    if (devices) {
        const video = [];
        for (const device of devices) {
          if ( device.kind == "videoinput"){
            video.push(device);
          }
        }
      return video;
    } else {
        throw new Error('No support for multimedia devices.');
    }
};

  useEffect(() => {
    const promise = listCamera(); 
        promise
          .then((devices) => {
            setCameraDevices(devices)
            if (selectedCamera == "") {
              setSelectedCamera(devices[0]?.deviceId || "");
            }
          })
      ;

    if (!isSafari()) {
      navigator.permissions.query({ name: "geolocation" }).then((permissionStatus) => {
        permissionStatus.onchange = getPosition;
      });
    }

    return () => {
      if (!isSafari()) {
        navigator.permissions.query({ name: "geolocation" }).then((permissionStatus) => {
          permissionStatus.onchange = null;
        });
      }
    };
  }, [cameraDevices]);

  return (
    <>
      <Navbar title="Take picture" />
      <Grid container spacing={0} component="main" sx={{ height: "100vh" }}>
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            background: "linear-gradient(to bottom right, #7d59bd, #5241a0) no-repeat center fixed",
            backgroundSize: "cover",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            p: 4,
          }}
          component={Paper}
          elevation={6}
          square
        >
          {imgSrc && (
            <Box
              component="img"
              alt="image"
              src={imgSrc}
              sx={{
                maxWidth: "100%",
                maxHeight: "60vh",
                display: "block",
              }}
            />
          )}

          <ButtonGroup
            color="secondary"
            aria-label="medium secondary button group"
            sx={{
              m: 3,
            }}
          >
            <Button
              color="secondary"
              variant="outlined"
              component="label"
              startIcon={<Folder />}
            >
              local
              <input hidden accept="image/*" type="file" onChange={handleFileChange} />
            </Button>
            {isIOS ? (
              <Button
                color="secondary"
                variant="outlined"
                component="label"
                endIcon={<Camera />}
              >
                Camera
                <input 
                  hidden 
                  type="file" 
                  accept="image/*" 
                  capture="camera" 
                  onChange={handleFileChange} 
                />
              </Button>
            ) : (
              <Button
                color="secondary"
                variant="outlined"
                component="label"
                endIcon={<Camera />}
                onClick={handleCameraOpen}
              >
                Camera
              </Button>
            )}
          </ButtonGroup>
        </Grid>
        <Grid
          item
          xs={12}
          md={6}
          component={Paper}
          elevation={6}
          square
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit({ imgSrc, comment })}
            sx={{
              py: 8,
              px: 1,
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              width: "80%",
            }}
          >
            <TextField
              margin="normal"
              fullWidth
              id="comment"
              label="comment"
              name="comment"
              autoComplete="comment"
              variant="standard"
              multiline
              autoFocus
              onChange={handleInputChange(Input.Comment)}
              value={comment}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2, mb: 2 }}
              endIcon={<Send />}
            >
              Post
            </Button>
          </Box>
        </Grid>
        <CameraDlg open={cameraOpen} onClose={handleCameraClose} cameraDevices={cameraDevices} selectedCamera={selectedCamera} handleCameraChange={handleCameraChange} capture={capture} webcamRef={webcamRef} videoConstraints={videoConstraints} />
      </Grid>
    </>
  );
};

interface SimpleDialogProps {
  open: boolean;
  onClose: (value: string) => void;
  cameraDevices: MediaDeviceInfo[];
  selectedCamera: string;
  handleCameraChange: (event: React.ChangeEvent<{ value: unknown }>) => void;
  capture: () => void;
  webcamRef: React.RefObject<Webcam>;
  videoConstraints: MediaTrackConstraints;
}

const CameraDlg = (props: SimpleDialogProps) => {
  const { onClose, open, cameraDevices, selectedCamera, handleCameraChange, capture, webcamRef, videoConstraints } = props;

  const handleClose = () => {
    onClose("");
  };

  return (
    <Dialog onClose={handleClose} open={open} sx={{ maxWidth: "90vw" }}>
      <DialogTitle>
        <Typography color="primary" variant="h3" component="h3">
          Capture image from camera
        </Typography>
      </DialogTitle>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        mirrored={true}
        videoConstraints={{
          ...videoConstraints,
          deviceId: selectedCamera,
        }}
        screenshotQuality={1}
        style={{ width: "100%" }}
      />
      <Button
        color="primary"
        variant="text"
        component="label"
        endIcon={<Camera />}
        onClick={capture}
      >
        Capture
      </Button>
      <FormControl sx={{ mt: 2, minWidth: 200 }}>
        <InputLabel id="camera-select-label">Camera</InputLabel>
        <Select
          labelId="camera-select-label"
          id="camera-select"
          value={selectedCamera}
          label="Camera"
          onChange={handleCameraChange}
        >
          {cameraDevices.map((device) => (
            <MenuItem key={device.deviceId} value={device.deviceId}>
              {device.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Dialog>
  );
};

export default Picture;
