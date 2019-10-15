import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { StockPickingPage } from './stock-picking.page';
import { PickingInfoComponent } from '../../components/picking-info/picking-info.component';
import { MoveLineListComponent } from '../../components/move-line-list/move-line-list.component';
import { MoveLineDetailsListComponent } from '../../components/move-line-details-list/move-line-details-list.component';

const routes: Routes = [
  {
    path: '',
    component: StockPickingPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  entryComponents: [PickingInfoComponent, MoveLineListComponent, MoveLineDetailsListComponent],
  declarations: [StockPickingPage, PickingInfoComponent, MoveLineListComponent, MoveLineDetailsListComponent]
})
export class StockPickingPageModule {}
