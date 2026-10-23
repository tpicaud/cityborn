'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import IconButton from '@/components/ui/buttons/IconButton';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false },
);

type MapBackdropCardProps = {
  onBack: (() => void) | undefined;
  actions: ReactNode;
  children: ReactNode;
};

export default function MapBackdropCard({
  onBack,
  actions,
  children,
}: MapBackdropCardProps) {
  return (
    <div className="relative h-screen">
      <div className="absolute inset-0">
        <MapContainer
          center={[0, 0]}
          zoom={3}
          zoomControl={false}
          className="h-full w-full z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>
        <div className="absolute inset-0 bg-black opacity-60 z-10 pointer-events-none"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 bg-transparent pointer-events-none">
        <Box className="relative flex flex-col p-6 bg-slate-100 shadow-xl rounded-2xl max-w-[85%] pointer-events-auto">
          <div className="absolute self-center top-2 flex flex-col h-[15%] w-[95%]">
            <div className="flex flex-row items-start justify-between w-full">
              <IconButton
                onClick={onBack}
                sx={{
                  visibility: onBack ? 'visible' : 'hidden',
                }}
                className="z-10"
              >
                <ArrowBackIcon />
              </IconButton>

              <div className="flex flex-row justify-end">{actions}</div>
            </div>
          </div>
          {children}
        </Box>
      </div>
    </div>
  );
}
