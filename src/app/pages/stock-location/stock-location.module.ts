import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { StockLocationPage } from './stock-location.page';

import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: StockLocationPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    SharedModule
  ],
  entryComponents: [],
  declarations: [StockLocationPage]
})
export class StockLocationPageModule {}
