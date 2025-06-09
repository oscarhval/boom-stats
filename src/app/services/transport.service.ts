import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TransportService {
  private fuelPricePerLiter = 1.60;      
  private fuelConsumptionKmPerLiter = 15;  

  constructor() {}

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private nextDay(yyyymmdd: string): string {
    const [y, m, d] = yyyymmdd.split('-').map(x => parseInt(x, 10));
    const dt = new Date(y, m - 1, d + 1);
    return this.formatDate(dt);
  }

  private isCityInSpain(city: string): boolean {
    if (!city) return false;
    const lower = city.toLowerCase();
    return lower.includes('spain') || lower.includes('españa');
  }

  private calculateFuelCost(distanceKm: number): number {
    return (distanceKm / this.fuelConsumptionKmPerLiter) * this.fuelPricePerLiter;
  }

  extractCityFromAddress(rawAddress: string): string {
    const parts = rawAddress.split(',').map(p => p.trim());
    return parts.length > 1 ? parts[parts.length - 1] : rawAddress;
  }


  buildTransportLinks(
    originCity: string,
    destCityRaw: string,
    concertDate: Date,
    distanceKm: number,
    drivingInfo?: { durationText: string; distanceText: string }
  ): Array<{ label: string; url: string; icon: string; subtitle?: string }> {
    const links: Array<{ label: string; url: string; icon: string; subtitle?: string }> = [];

    const destCity = this.extractCityFromAddress(destCityRaw);

    const fechaIda = this.formatDate(concertDate);
    const vueltaDate = new Date(concertDate);
    vueltaDate.setDate(vueltaDate.getDate() + 1);
    const fechaVuelta = this.formatDate(vueltaDate);

  
    if (distanceKm < 20) {
      links.push({
        label: `Cómo llegar en transporte público`,
        url: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originCity)}&destination=${encodeURIComponent(destCityRaw)}&travelmode=transit`,
        icon: '/assets/icons/transit-icon.png',
        subtitle: `Duración aproximada: ${((distanceKm / 20) * 60).toFixed(0)} min`
      });
      return links;
    }

    if (distanceKm < 200) {
      if (this.isCityInSpain(originCity) && this.isCityInSpain(destCity)) {
        links.push({
          label: `Tren Renfe/Regional: ${originCity} → ${destCity}`,
          url: `https://www.renfe.com/es/es/busqueda-ajustada?origen=${encodeURIComponent(originCity)}&destino=${encodeURIComponent(destCity)}&fecha=${fechaIda}`,
          icon: '/assets/icons/renfe-logo.png',
          subtitle: `Fecha: ${fechaIda}`
        });
      }

      links.push({
        label: `Autobús (ALSA): ${originCity} → ${destCity}`,
        url: `https://www.alsa.es/buscar?origen=${encodeURIComponent(originCity)}&destino=${encodeURIComponent(destCity)}&fecha=${fechaIda}`,
        icon: '/assets/icons/bus-icon.png',
        subtitle: `Fecha: ${fechaIda}`
      });

      const costFuel = this.calculateFuelCost(distanceKm).toFixed(2);
      const extraInfoCar = drivingInfo
        ? `Duración auto: ${drivingInfo.durationText} (${drivingInfo.distanceText}) • Coste aprox. ${costFuel} €`
        : `Distancia: ${distanceKm.toFixed(0)} km • Coste aprox. ${costFuel} €`;

      links.push({
        label: `Viajar en coche: ${originCity} → ${destCityRaw}`,
        url: `https://www.google.com/maps/dir/${encodeURIComponent(originCity)}/${encodeURIComponent(destCityRaw)}`,
        icon: '/assets/icons/car-icon.png',
        subtitle: extraInfoCar
      });

      return links;
    }

    if (distanceKm >= 200 && distanceKm < 800) {
      if (this.isCityInSpain(originCity) && this.isCityInSpain(destCity)) {
        links.push({
          label: `Tren AVE/Larga Distancia: ${originCity} → ${destCity}`,
          url: `https://www.renfe.com/es/es/busqueda-ajustada?origen=${encodeURIComponent(originCity)}&destino=${encodeURIComponent(destCity)}&fecha=${fechaIda}`,
          icon: '/assets/icons/renfe-logo.png',
          subtitle: `Fecha: ${fechaIda}`
        });
      } else {
        links.push({
          label: `Tren Internacional (RailEurope): ${originCity} → ${destCity}`,
          url: `https://www.raileurope.com/es-es/?from=${encodeURIComponent(originCity)}&to=${encodeURIComponent(destCity)}&date=${fechaIda}`,
          icon: '/assets/icons/renfe-logo.png',
          subtitle: `Fecha: ${fechaIda}`
        });
      }

      const costFuel2 = this.calculateFuelCost(distanceKm).toFixed(2);
      const extraInfoCar2 = drivingInfo
        ? `Duración auto: ${drivingInfo.durationText} (${drivingInfo.distanceText}) • Coste aprox. ${costFuel2} €`
        : `Distancia: ${distanceKm.toFixed(0)} km • Coste aprox. ${costFuel2} €`;

      links.push({
        label: `Ruta en coche: ${originCity} → ${destCityRaw}`,
        url: `https://www.google.com/maps/dir/${encodeURIComponent(originCity)}/${encodeURIComponent(destCityRaw)}`,
        icon: '/assets/icons/car-icon.png',
        subtitle: extraInfoCar2
      });

      links.push({
        label: `Vuelos low-cost (Skyscanner): ${originCity} → ${destCity}`,
        url: `https://www.skyscanner.es/transportes/aereo/${encodeURIComponent(originCity)}-a-${encodeURIComponent(destCity)}/${fechaIda}/`,
        icon: '/assets/icons/plane-icon.png',
        subtitle: `Fecha: ${fechaIda}`
      });

      return links;
    }

    {
      const gfIda = `${encodeURIComponent(originCity)}.${encodeURIComponent(destCity)}.${fechaIda}`;
      const googleFlightsUrl = `https://www.google.com/flights?hl=es#flt=${gfIda}*${encodeURIComponent(
        destCity
      )}.${encodeURIComponent(originCity)}.${fechaVuelta}`;

      links.push({
        label: `Vuelos (Google Flights): ${originCity} ↔ ${destCity}`,
        url: googleFlightsUrl,
        icon: '/assets/icons/plane-icon.png',
        subtitle: `Ida: ${fechaIda} • Vuelta: ${fechaVuelta}`
      });

      links.push({
        label: `Vuelos (Skyscanner): ${originCity} → ${destCity}`,
        url: `https://www.skyscanner.es/transportes/aereo/${encodeURIComponent(originCity)}-a-${encodeURIComponent(destCity)}/${fechaIda}/`,
        icon: '/assets/icons/plane-icon.png',
        subtitle: `Fecha: ${fechaIda}`
      });

      const costFuel3 = this.calculateFuelCost(distanceKm).toFixed(2);
      const extraInfoCar3 = drivingInfo
        ? `Duración auto: ${drivingInfo.durationText} (${drivingInfo.distanceText}) • Coste aprox. ${costFuel3} €`
        : `Distancia: ${distanceKm.toFixed(0)} km • Coste aprox. ${costFuel3} €`;

      links.push({
        label: `Roadtrip en coche: ${originCity} → ${destCityRaw}`,
        url: `https://www.google.com/maps/dir/${encodeURIComponent(originCity)}/${encodeURIComponent(destCityRaw)}`,
        icon: '/assets/icons/car-icon.png',
        subtitle: extraInfoCar3
      });
    }

    return links;
  }
}
