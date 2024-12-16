'use client'

import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import osmtogeojson from "osmtogeojson";
import { useEffect, useState } from "react";
import * as turf from '@turf/turf';

type GoogleMapProps = {
	apiKey: string;
	center: { lat: number; lng: number };
	zoom: number;
};

const MapComponent: React.FC<GoogleMapProps> = ({ apiKey, center, zoom }) => {
	const [geoJSONData, setGeoJSONData] = useState<any>(null); // State to hold GeoJSON data

	async function fetchGeoJSON() {
		const overpassUrl = "https://overpass-api.de/api/interpreter";
		const query = `
			[out:json][timeout:25];
			// Rechercher une relation avec un tag wikidata=Q90
			relation["wikidata"="Q90"];
			out geom;
    	`;

		try {
			const response = await fetch(overpassUrl, {
				method: "POST",
				body: query,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const data = await response.json();
			console.log(data)
			const geoJSON = osmtogeojson(data)
			console.log(geoJSON)
			setGeoJSONData(geoJSON); // Store raw GeoJSON data
		} catch (error) {
			console.error("Failed to fetch GeoJSON data:", error);
		}
	}


	return (
		<div>
			<APIProvider apiKey={apiKey} libraries={["places"]}>
				<Map
					style={{ width: "100vw", height: "100vh" }}
					defaultCenter={center}
					defaultZoom={zoom}
					gestureHandling={"greedy"}
					disableDefaultUI={true}
				>
					{geoJSONData && (
						<GeoJSON geoJSON={geoJSONData} />
					)}
				</Map>

			</APIProvider>
			<button onClick={() => fetchGeoJSON()}>Reload GeoJSON</button>
		</div>
	);
};

const GeoJSON: React.FC<any> = ({ geoJSON }: any) => {
	const map = useMap();

	useEffect(() => {
		if (!geoJSON) return;

		// Créer un objet Data Layer pour charger et afficher les données GeoJSON
		const dataLayer = new window.google.maps.Data();
		dataLayer.addGeoJson(geoJSON.features[0]);

		// Appliquer un style
		dataLayer.setStyle({
			fillColor: "#FF0000",
			fillOpacity: 0.1,
			strokeColor: "#FF0000",
			strokeOpacity: 0.8,
			strokeWeight: 2,
		});

		// Ajouter les données GeoJSON à la carte
		dataLayer.setMap(map);
		let polygon1 = undefined

		// Fonction pour tester si un point est à l'intérieur du GeoJSON
		function isPointInGeoJSONCollection(point: { lat: number; lng: number }, geojson: any): boolean {
			// Créer un point GeoJSON à partir de l'objet point
			const geojsonPoint = turf.point([point.lng, point.lat]);

			// Vérifier si le point est à l'intérieur du polygone GeoJSON
			const polygon = geojson.features[0].geometry; // Récupérer la géométrie du premier feature
			if (polygon.type === 'Polygon') {
				// Si c'est un simple polygone, on teste avec `turf.booleanPointInPolygon`
				return turf.booleanPointInPolygon(geojsonPoint, polygon);
			} else if (polygon.type === 'MultiPolygon') {
				// Si c'est un multipolygone, on teste chaque polygone
				for (const poly of polygon.coordinates) {
					const singlePolygon = turf.polygon(poly);
					if (turf.booleanPointInPolygon(geojsonPoint, singlePolygon)) {
						return true;
					}
				}
			}
			return false;
		}

		function getDistanceToGeoJSONBorder(point: { lat: number; lng: number }, geojson: any): number {
			// Créer un point GeoJSON à partir de l'objet point
			const geojsonPoint = turf.point([point.lng, point.lat]);
	  
			// Récupérer les coordonnées de la géométrie du GeoJSON
			const geometry = geojson.features[0].geometry;
	  
			// Si la géométrie est un polygone ou un multipolygone
			if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
			  // Utiliser turf pour obtenir la distance entre le point et la bordure du polygone
			  const distance = turf.pointToLineDistance(geojsonPoint, turf.lineString(geometry.coordinates[0]));
			  return distance;
			}
	  
			return -1; // Si ce n'est pas un polygone, retourne -1
		  }

		// Exemple de point à tester
		const point = { lat: 48.902244, lng: 2.312972 }
		const isInside = isPointInGeoJSONCollection(point, geoJSON); // Paris
		console.log(isInside)
		if (!isInside) {
			console.log(getDistanceToGeoJSONBorder(point, geoJSON))
		}

	}, [geoJSON, map]);

	return null; // Aucun rendu visuel n'est nécessaire ici
};

export default MapComponent;
