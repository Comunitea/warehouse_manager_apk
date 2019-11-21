import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { StockLocationListPage } from './stock-location-list.page';
import { LocationListComponent } from '../../components/location-list/location-list.component';

import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: StockLocationListPage
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
  entryComponents: [LocationListComponent],
  declarations: [StockLocationListPage, LocationListComponent]
})
export class StockLocationListPageModule {}
