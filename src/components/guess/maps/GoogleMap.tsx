'use client';

import React, { useEffect, useRef, useState } from "react";
import { APIProvider, useMap, Map } from "@vis.gl/react-google-maps";
import test from "node:test";

type GoogleMapProps = {
	apiKey: string;
	center: { lat: number; lng: number };
	zoom: number;
};

const MapComponent: React.FC<GoogleMapProps> = ({ apiKey, center, zoom }) => {
	// State to hold the map instance
	let featureLayer: google.maps.Data;

	// new function component named test
	function test() {
		console.log('in test');
		const service = new window.google.maps.places.PlacesService(document.createElement('div'));
		const request = {
		  query: 'Trinidad, CA',
		  fields: ['place_id', 'geometry.location'], // Notez l'utilisation des noms corrects
		  locationBias: {
			center: center,
			radius: 50000, // Rayon en mètres
		  },
		};

		service.findPlaceFromQuery(request, (results, status) => {
			if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
			  // setPlaceResult(results[0]); // Stocker le premier résultat
			  console.log('results', results[0]);
			} else {
			  console.error('Places API request failed:', status);
			}
		  });

		  

		return <div></div>;
	}

	return (
		<div>
			<APIProvider apiKey={apiKey} libraries={['places']}>
				<Map
					style={{ width: '100vw', height: '100vh' }}
					defaultCenter={center}
					defaultZoom={zoom}
					gestureHandling={'greedy'}
					disableDefaultUI={true}
				/>
			</APIProvider>
			<button onClick={() => test()}>Find Boundary</button>
		</div>
	);
};

export default MapComponent;
