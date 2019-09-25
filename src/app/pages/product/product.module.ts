import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ProductPage } from './product.page';
import { ProductInfoComponent } from '../../components/product-info/product-info.component';

const routes: Routes = [
  {
    path: '',
    component: ProductPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  entryComponents: [ProductInfoComponent],
  declarations: [ProductPage, ProductInfoComponent]
})
export class ProductPageModule {}
