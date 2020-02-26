import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { StockPickingPage } from './stock-picking.page';
import { MoveLineListComponent } from '../../components/move-line-list/move-line-list.component';
import { MoveLineDetailsListComponent } from '../../components/move-line-details-list/move-line-details-list.component';

import { SharedModule } from '../../shared/shared.module';

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
    RouterModule.forChild(routes),
    SharedModule
  ],
  entryComponents: [MoveLineListComponent, MoveLineDetailsListComponent],
  declarations: [StockPickingPage, MoveLineListComponent, MoveLineDetailsListComponent]
})
export class StockPickingPageModule {}
