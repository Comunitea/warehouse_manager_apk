import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';

import { ScannerHeaderComponent } from '../components/scanner/scanner-header/scanner-header.component'
import { ScannerFooterComponent } from '../components/scanner/scanner-footer/scanner-footer.component'


@NgModule({
  imports: [
    CommonModule, 
    IonicModule,
    ReactiveFormsModule
  ],
  declarations: [
    ScannerHeaderComponent, 
    ScannerFooterComponent
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  exports: [
    ScannerHeaderComponent, 
    ScannerFooterComponent
  ]
})
export class SharedModule {}
