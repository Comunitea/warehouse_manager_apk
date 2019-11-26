import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { StockMoveLocationPage } from './stock-move-location.page';

import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: StockMoveLocationPage
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
  declarations: [StockMoveLocationPage]
})
export class StockMoveLocationPageModule {}
