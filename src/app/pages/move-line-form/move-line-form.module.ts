import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { MoveLineFormPage } from './move-line-form.page';

const routes: Routes = [
  {
    path: '',
    component: MoveLineFormPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [MoveLineFormPage]
})
export class MoveLineFormPageModule {}
