import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { StockPickingTypeListPage } from './stock-picking-type-list.page';

import { PickingTypeInfoComponent } from  '../../components/picking-type-info/picking-type-info.component';

const routes: Routes = [
  {
    path: '',
    component: StockPickingTypeListPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  entryComponents: [PickingTypeInfoComponent],
  declarations: [StockPickingTypeListPage, PickingTypeInfoComponent]
})
export class StockPickingTypeListPageModule {}
