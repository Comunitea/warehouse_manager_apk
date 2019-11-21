import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { StockQuantListPage } from './stock-quant-list.page';
import { QuantListComponent } from '../../components/quant-list/quant-list.component';

import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: StockQuantListPage
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
  entryComponents: [QuantListComponent],
  declarations: [StockQuantListPage, QuantListComponent]
})
export class StockQuantListPageModule {}
