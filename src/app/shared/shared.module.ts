import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

import { LocationPickerComponent } from './pickers/location-picker/location-picker.component';
import { MapModalComponent } from './map-modal/map-modal.component';

@NgModule({
    declarations: [LocationPickerComponent, MapModalComponent],
    imports: [CommonModule, IonicModule],
exports: [LocationPickerComponent, MapModalComponent],
    entryComponents: [MapModalComponent],
    providers: [],
})
export class SharedModule { }
