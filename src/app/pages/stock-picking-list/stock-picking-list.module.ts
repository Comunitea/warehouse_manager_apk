import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { StockPickingListPage } from './stock-picking-list.page';
//import { PickingListComponent } from '../../components/picking-list/picking-list.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: StockPickingListPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  // entryComponents: [ PickingListComponent ],
  // declarations: [ StockPickingListPage, PickingListComponent ]
  declarations: [ StockPickingListPage]
})
export class StockPickingListPageModule {}
