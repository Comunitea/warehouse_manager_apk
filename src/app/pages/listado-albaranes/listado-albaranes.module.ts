import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ListadoAlbaranesPage } from './listado-albaranes.page';

const routes: Routes = [
  {
    path: '',
    component: ListadoAlbaranesPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [ListadoAlbaranesPage]
})
export class ListadoAlbaranesPageModule {}
