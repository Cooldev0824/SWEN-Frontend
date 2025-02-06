import React, { useEffect, useState } from 'react';
import { icon, LatLng, LeafletEventHandlerFnMap, LeafletMouseEvent, LocationEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

import styles from './Map.module.css';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';


import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { useGeolocated } from 'react-geolocated'

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'
import { MapPost, MediaPost, MediasResponse } from '../../constants';
import uploads_get from '../../mock/uploads_get.json'
import { Box, Button, Dialog, DialogTitle, Typography, CircularProgress } from '@mui/material';
import { geoReverse, uploadedImages } from '../../apis';
import { isSafari } from '../../helpers';


dayjs.extend(utc)

// const position : LatLngExpression = [51.505, -0.09]

interface Props {
  className?: string
}

const ICON = icon({
  iconUrl: "/marker.png",
  iconSize: [25, 41]
})

function LocationMarker() {
  const [position, setPosition] = useState<null | LatLng>(null);
  const [bbox, setBbox] = useState<string[]>([]);

  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", function (e: LocationEvent) {
      setPosition(e.latlng);
      map.setView(e.latlng, map.getZoom());
      setBbox(e.bounds.toBBoxString().split(","));
    });
  }, [map]);

  return position === null ? null : (
    <Marker position={position} icon={ICON}>
      <Popup>
        You are here. <br />
      </Popup>
    </Marker>
  );
}

const Map = ({ className }: Props) => {
  // const map = useMap();
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
  const [position, setPosition] = useState<LatLngExpression>([41.881832, -87.623177])
  const [images, setImages] = useState<MapPost[]>([])
  const [imagesOpen, setImagesOpen] = useState(false)
  const [openedPosts, setOpenedPosts] = useState<MapPost>()
  const [loading, setLoading] = useState(true);

  const handleImagesClose = () => {
    setImagesOpen(false)
    setOpenedPosts(undefined)
  }

  const handleImagesOpen = (posts: MapPost) => {
    setImagesOpen(true)
    setOpenedPosts(posts)
  }

  let mapClassName = styles.map;

  if ( className ) {
    mapClassName = `${mapClassName} ${className}`;
  }

  // useEffect(() => {
  //   map.locate().on("locationfound", function (e) {
  //     setPosition(e.latlng);
  //     map.flyTo(e.latlng, map.getZoom());
  //   });
  // }, [map]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      getPosition();
    }, 10000); // Refresh GPS location every 10 seconds

    return () => clearInterval(intervalId);
  }, [getPosition]);

  useEffect(() => {
    async function fetchIPLocation() {
        try {
            const response = await axios.get('https://ipapi.co/json/');
            const { latitude, longitude } = response.data;
            setPosition([latitude, longitude]);
        } catch (error) {
            console.error("Failed to fetch IP location:", error);
        }
    }

    if (coords) {
        setPosition([coords.latitude, coords.longitude]);
        setLoading(false);
    } else {
        fetchIPLocation().finally(() => setLoading(false));
    }

    if (!isSafari()) {
        navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
            permissionStatus.onchange = () => {
                getPosition();
            };
        });
    }

    return () => {
        if (!isSafari()) {
            navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
                permissionStatus.onchange = null;
            });
        }
    };
  }, [coords, getPosition]);  

  useEffect(() => {
    function resToState(res: MediasResponse[]) {
        res.map((post) => {
            let exist = false;
            setImages((images) => {
                images.map((mpost) => {
                    if (
                        mpost.location[0].toString() === post.cluster.latitude &&
                        mpost.location[1].toString() === post.cluster.longitude
                    ) {
                        mpost.posts = [
                            ...mpost.posts,
                            {
                                url: post.content?.original_url || '',
                                comment: post.comment || '',
                                created_at: post.created_at,
                                created_by: post.created_by.name,
                            },
                        ];
                        exist = true;
                    }
                    return mpost;
                });
                if (exist) {
                    return images;
                } else {
                    return [
                        ...images,
                        {
                            location: [
                                Number(post.cluster.latitude),
                                Number(post.cluster.longitude),
                            ],
                            posts: [
                                {
                                    url: post.content?.original_url || '',
                                    comment: post.comment || '',
                                    created_at: post.created_at,
                                    created_by: post.created_by.name,
                                },
                            ],
                        },
                    ];
                }
            });
        });
    }

    const fetchData = () => {
      if (coords) {
        if (process.env.NODE_ENV === 'development') {
          resToState(uploads_get.data);
          setImages((images) => images);
        } else {
          uploadedImages()
            .then((data) => {
              resToState(data.data);
            })
            .catch((reason: any) => {
              console.error(reason);
            });
        }
      }
    };

    fetchData(); // Fetch data on page load

    const intervalId = setInterval(fetchData, 5000); // Fetch data every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [coords]);

  const calculateRadius = (location, images) => {
    const count = images.filter(img => img.location[0] === location[0] && img.location[1] === location[1]).length;
    const baseRadius = 100;
    return baseRadius + (count - 1) * 20;
  };

  const onClickHandler = (info: string) => (ev: LeafletMouseEvent) => {
    alert(info)
  }

  const blueOptions = {
    color: 'blue',
    fillColor: 'blue'
  }
  const blackOptions = {
    color: 'black',
    fillColor: 'black'
  }
  const limeOptions = {
    color: 'lime',
    fillColor: 'lime'
  }
  const purpleOptions = {
    color: 'purple',
    fillColor: 'purple'
  }
  const redOptions = {
    color: 'red',
    fillColor: 'red'
  }
  
  return (
    <>
      {loading && (
        <div className={styles.preloader}>
          <CircularProgress />
        </div>
      )}
      <MapContainer className={mapClassName} center={position} zoom={15} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {images.map((image, idx) => (
          <Circle key={idx} center={image.location} pathOptions={redOptions} radius={calculateRadius(image.location, images)} eventHandlers={{
            click: (ev: LeafletMouseEvent) => {
              handleImagesOpen(images[idx])
            }
          }} />
        ))}
        <LocationMarker/>
        {/* <Marker
          position={position}
          icon={ICON}
        >
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </Marker> */}
      </MapContainer>
      <ImagesDlg
        open={imagesOpen}
        onClose={handleImagesClose}
        posts={openedPosts}
      />
    </>
  )
}

interface SimpleDialogProps {
  open: boolean;
  onClose: (value: string) => void;
  posts: MapPost | undefined;
}

const ImagesDlg = (props: SimpleDialogProps) => {
  const { onClose, open, posts } = props;

  const handleClose = () => {
    onClose("");
  };

  const [location, setLocation] = useState("")

  useEffect(() => {
    if (posts) {
      geoReverse({
        lat: posts.location[0],
        lon: posts.location[1]
      }).then((data) => {
        setLocation(data.display_name)
        // setLocation(data.address.city + ", " + data.address.state + ", " + data.address.country)
      }).catch((reason: any) => {
        console.log(reason)
      })
    }
  }, [posts])

  return (
    <Dialog onClose={handleClose} open={open}
      sx={{
        maxWidth: "90vw"
      }}
    >
      <DialogTitle
        color='primary'
        variant='h3'
        component='h3'
      >
          Posts
      </DialogTitle>
      <div
        style={{
          display: 'flex',
          justifyContent: "center",
          alignItems: "center",
          flexDirection: 'column',
          margin: "0rem 1.5rem 1.5rem 1.5rem"
        }}
      >
        <Typography
          component={'h4'}
          variant={'h4'}
          sx={{
            display: 'block',
            mb: 1
          }}
          color='primary'
        >
          {`At: ${location}`}
        </Typography>
        {posts?.posts.map((post, idx) => (
          <div key={idx} style={{
            marginBottom: "1rem"
          }}>
            <Box
              component="img"
              alt="image"
              src={post.url}
              sx={{
                maxWidth: '100%',
                maxHeight: '60vh',
                display: 'block',
                color: 'white'
              }}
              loading='lazy'
            />
            <div>
              <Typography
                component={'h4'}
                variant={'h4'}
                sx={{
                  display: 'block',
                  mt: 3
                }}
                color='primary'
              >
                {`By: ${post.created_by}`}
              </Typography>
              <Typography
                component={'h4'}
                variant={'h4'}
                sx={{
                  display: 'block',
                  mt: 1
                }}
                color='primary'
              >
                {`On: ${post.created_at}`}
              </Typography>
              <Typography
                component={'p'}
                variant={'body1'}
                sx={{
                  display: 'inline-block',
                  mt: 1,
                }}
                color='primary'
              >
                {`${post.comment}`}
              </Typography>
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}

export default Map;
