import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ProductListPage } from './product-list.page';
import { ProductListInfoComponent } from '../../components/product-list-info/product-list-info.component';

import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: ProductListPage,
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
  entryComponents: [ ProductListInfoComponent ],
  declarations: [ ProductListPage, ProductListInfoComponent ],
})
export class ProductListPageModule {}
