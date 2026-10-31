"use client";

import dynamic from "next/dynamic";

import { PageHeader } from "@/components/dashboard/page-header";
import { Skeleton } from "@/components/ui/skeleton";

const WeatherMap = dynamic(() => import("@/components/maps/weather-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[min(70dvh,560px)] w-full rounded-xl" />,
});

const NEW_DELHI: [number, number] = [28.61, 77.21];

export function MapView() {
  return (
    <>
      <PageHeader title="Weather map" description="Click anywhere for the current weather there · Leaflet + OpenStreetMap + Open-Meteo" />
      <WeatherMap center={NEW_DELHI} />
    </>
  );
}
