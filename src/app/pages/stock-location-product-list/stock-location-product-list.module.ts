import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { StockLocationProductListPage } from './stock-location-product-list.page';
import { LocationProductListComponent } from '../../components/location-product-list/location-product-list.component';

import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: StockLocationProductListPage
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
  entryComponents: [LocationProductListComponent],
  declarations: [StockLocationProductListPage, LocationProductListComponent]
})
export class StockLocationProductListPageModule {}
