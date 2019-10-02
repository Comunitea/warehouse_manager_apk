import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { StockQuantListPage } from './stock-quant-list.page';
import { QuantListComponent } from '../../components/quant-list/quant-list.component';

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
    RouterModule.forChild(routes)
  ],
  entryComponents: [QuantListComponent],
  declarations: [StockQuantListPage, QuantListComponent]
})
export class StockQuantListPageModule {}
