import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { BarcodeMultilinePage } from './barcode-multiline.page';

const routes: Routes = [
  {
    path: '',
    component: BarcodeMultilinePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [BarcodeMultilinePage]
})
export class BarcodeMultilinePageModule {}
