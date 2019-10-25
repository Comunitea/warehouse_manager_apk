import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { StockPickingListPage } from './stock-picking-list.page';
import { PickingListComponent } from '../../components/picking-list/picking-list.component';
import { ScannerHeaderComponent } from '../../components/scanner/scanner-header/scanner-header.component';
import { ScannerFooterComponent } from '../../components/scanner/scanner-footer/scanner-footer.component';

import { ReactiveFormsModule } from '@angular/forms'

const routes: Routes = [
  {
    path: '',
    component: StockPickingListPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [PickingListComponent, ScannerHeaderComponent, ScannerFooterComponent],
  declarations: [StockPickingListPage, PickingListComponent, ScannerHeaderComponent, ScannerFooterComponent]
})
export class StockPickingListPageModule {}
