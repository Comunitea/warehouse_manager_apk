import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { SerialInventoryPage } from './serial-inventory.page';
import { IonicSelectableModule } from 'ionic-selectable';
const routes: Routes = [
  {
    path: '',
    component: SerialInventoryPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IonicSelectableModule,
    RouterModule.forChild(routes)
  ],
  declarations: [SerialInventoryPage]
})
export class SerialInventoryPageModule {}
