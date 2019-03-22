; import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// Component
import { MapModalComponent } from '../../map-modal/map-modal.component';

// Environment
import { environment } from 'src/environments/environment';

import { PlaceLocation } from 'src/app/places/location.model';

@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {

  isLoading = false;
  selectedLocationImage: string;

  @Output() locationPick = new EventEmitter<PlaceLocation>();

  constructor(
    private http: HttpClient,
    private modalCtrl: ModalController) { }

  ngOnInit() { }

  onPickLocation() {
    this.modalCtrl.create({ component: MapModalComponent }).then(modalEl => {
      modalEl.onDidDismiss().then(modalData => {
        if (!modalData.data) {
          return;
        }

        const pickerLocation: PlaceLocation = {
          lat: modalData.data.lat,
          lng: modalData.data.lng,
          address: null,
          staticMapImageUrl: null
        };

        this.isLoading = true;
        this.getAddress(modalData.data.lat, modalData.data.lng)
          .pipe(
            switchMap(address => {
              pickerLocation.address = address;
              return of(this.getMapImage(pickerLocation.lat, pickerLocation.lng, 14));
            })
          ).subscribe(staticMapImageUrl => {
            pickerLocation.staticMapImageUrl = staticMapImageUrl;
            this.selectedLocationImage = staticMapImageUrl;
            this.isLoading = false;
            this.locationPick.emit(pickerLocation);
          });
      });
      modalEl.present();
    });
  }

  private getAddress(lat: number, lng: number) {
    return this.http.get<any>(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${environment.googleMapsAPIKey}`)
      .pipe(
        map(geoData => {
          if (!geoData || !geoData.results || geoData.results.length === 0) {
            return null;
          } else {
            return geoData.results[0].formatted_address;
          }
        })
      );
  }

  private getMapImage(lat: number, lng: number, zoom: number) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=500x300&maptype=roadmap
    &markers=color:red%7Clabel:Place%7C${lat},${lng}
    &key=${environment.googleMapsAPIKey}`;
  }

}
