; import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { ModalController, ActionSheetController, AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { Plugins, Capacitor } from '@capacitor/core';

// Component
import { MapModalComponent } from '../../map-modal/map-modal.component';

// Environment
import { environment } from '../../../../environments/environment';

import { PlaceLocation, Coordinates } from '../../../places/location.model';

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
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController) { }

  ngOnInit() { }

  onPickLocation() {
    this.actionSheetCtrl.create({
      header: 'Please Choose',
      buttons: [
        {
          text: 'Auto-Locate', handler: () => {
            this.locateUser();
          }
        },
        {
          text: 'Pick on Map', handler: () => {
            this.openMap();
          }
        },
        { text: 'Cancel', role: 'cancel' },
      ]
    }).then(actionSheetEl => {
      actionSheetEl.present();
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

  private locateUser() {

    if (!Capacitor.isPluginAvailable('Geolocation')) {
      this.showErrorAlert();
      return;
    }

    this.isLoading = true;

    Plugins.Geolocation.getCurrentPosition()
      .then(geoPosition => {
        const coordinates: Coordinates = {
          lat: geoPosition.coords.latitude,
          lng: geoPosition.coords.longitude
        };
        this.createPlace(coordinates.lat, coordinates.lng);
        this.isLoading = false;
      })
      .catch(err => {
        this.isLoading = false;
        this.showErrorAlert();
      });
  }

  private createPlace(lat: number, lng: number) {

    const pickerLocation: PlaceLocation = {
      lat: lat,
      lng: lng,
      address: null,
      staticMapImageUrl: null
    };

    this.isLoading = true;

    this.getAddress(lat, lng)
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
  }

  private showErrorAlert() {
    this.alertCtrl.create({
      header: 'Could not fetch location',
      message: 'Please use the map to pick a location!',
      buttons: ['Okay']
    }).then(alertEl => alertEl.present());
  }

  private openMap() {
    this.modalCtrl.create({ component: MapModalComponent }).then(modalEl => {
      modalEl.onDidDismiss().then(modalData => {
        if (!modalData.data) {
          return;
        }

        const coordinates: Coordinates = {
          lat: modalData.data.lat,
          lng: modalData.data.lng,
        };

        this.createPlace(coordinates.lat, coordinates.lng);

      });
      modalEl.present();
    });
  }

  private getMapImage(lat: number, lng: number, zoom: number) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=500x300&maptype=roadmap
    &markers=color:red%7Clabel:Place%7C${lat},${lng}
    &key=${environment.googleMapsAPIKey}`;
  }

}
